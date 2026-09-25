const pool = require('../config/db');
const { postJournal, accountIds } = require('../services_accounting');

/* GET /api/sale-returns */
exports.list = async (req, res) => {
  const h=req.user.hospital_id,q=String(req.query.q||'').trim(),like=`%${q}%`;
  const [rows]=await pool.query(`SELECT r.*,p.name patient_name,p.mobile patient_mobile,s.invoice_no sale_invoice_no FROM sale_returns r LEFT JOIN patients p ON p.id=r.patient_id LEFT JOIN sales_invoices s ON s.id=r.sale_id WHERE r.hospital_id=? AND (?='' OR r.return_no LIKE ? OR COALESCE(s.invoice_no,'') LIKE ? OR COALESCE(p.mobile,'') LIKE ? OR EXISTS(SELECT 1 FROM sale_return_items ri JOIN medicines m ON m.id=ri.medicine_id WHERE ri.sale_return_id=r.id AND (m.name LIKE ? OR COALESCE(m.generic_name,'') LIKE ?))) ORDER BY r.id DESC`,[h,q,like,like,like,like,like]);res.json(rows);
};

/* GET /api/sale-returns/:id */
exports.getOne = async (req, res) => {
  const h = req.user.hospital_id;
  const [[ret]] = await pool.query(
    `SELECT r.*, p.name patient_name, p.mobile patient_phone, s.invoice_no sale_invoice_no
     FROM sale_returns r
     LEFT JOIN patients p ON p.id=r.patient_id
     LEFT JOIN sales_invoices s ON s.id=r.sale_id
     WHERE r.id=? AND r.hospital_id=?`,
    [req.params.id, h]
  );
  if (!ret) return res.status(404).json({ message: 'Sale return not found' });
  const [items] = await pool.query(
    `SELECT ri.*, m.name medicine_name, b.batch_no
     FROM sale_return_items ri
     JOIN medicines m ON m.id=ri.medicine_id
     JOIN medicine_batches b ON b.id=ri.batch_id
     WHERE ri.sale_return_id=?`,
    [ret.id]
  );
  res.json({ ...ret, items });
};

/* POST /api/sale-returns
   body: { sale_id?, patient_id, return_date, reason, items:[{medicine_id,batch_id,qty}] }
   Stock is added back, the patient's balance due is reduced, and — if
   linked to a specific Sale Invoice — that invoice's net_total is
   reduced by the same amount so "amount due" stays accurate. */
exports.create = async (req, res) => {
  const h = req.user.hospital_id;
  const { sale_id, patient_id, return_date, reason, items = [] } = req.body;
  if (!items.length) return res.status(400).json({ message: 'Add at least one item to return' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Patient is optional because pharmacy sales may be completed as Walk-in.
    // When a return is linked to an invoice, inherit that invoice's patient if
    // the caller did not explicitly provide one.
    let resolvedPatientId = patient_id || null;
    if (sale_id && !resolvedPatientId) {
      const [[saleRow]] = await conn.query(
        `SELECT patient_id FROM sales_invoices WHERE id=? AND hospital_id=?`,
        [sale_id, h]
      );
      resolvedPatientId = saleRow?.patient_id || null;
    }

    let subtotal = 0, cogsTotal = 0;
    const checked = [];
    for (const i of items) {
      if (!i.medicine_id || !i.batch_id || !(Number(i.qty) > 0)) throw new Error('Each return line requires a medicine, batch and quantity greater than 0');
      const [[b]] = await conn.query(`SELECT purchase_price, sale_price, batch_no FROM medicine_batches WHERE id=? AND medicine_id=?`, [i.batch_id, i.medicine_id]);
      if (!b) throw new Error('Invalid batch');
      if (sale_id) {
        const [[sold]] = await conn.query(`SELECT COALESCE(SUM(si.qty),0) sold_qty FROM sale_items si WHERE si.sale_id=? AND si.medicine_id=? AND si.batch_id=?`, [sale_id,i.medicine_id,i.batch_id]);
        const [[returned]] = await conn.query(`SELECT COALESCE(SUM(ri.qty),0) returned_qty FROM sale_return_items ri JOIN sale_returns rr ON rr.id=ri.sale_return_id WHERE rr.sale_id=? AND ri.medicine_id=? AND ri.batch_id=?`, [sale_id,i.medicine_id,i.batch_id]);
        const available = Number(sold.sold_qty||0)-Number(returned.returned_qty||0);
        if (Number(i.qty) > available + 0.0001) throw new Error(`Cannot return more than ${available} remaining units for ${b.batch_no}`);
      }
      const unitPrice = Number(i.unit_price != null ? i.unit_price : b.sale_price);
      const costPrice = Number(i.cost_price != null ? i.cost_price : b.purchase_price);
      const total = Number(i.qty) * unitPrice;
      subtotal += total;
      cogsTotal += Number(i.qty) * costPrice;
      checked.push({ ...i, unit_price: unitPrice, cost_price: costPrice, total });
    }

    const returnNo = 'CN-' + Date.now();
    const [r] = await conn.query(
      `INSERT INTO sale_returns(hospital_id,sale_id,patient_id,return_no,return_date,reason,subtotal,net_total,created_by)
       VALUES(?,?,?,?,?,?,?,?,?)`,
      [h, sale_id || null, resolvedPatientId, returnNo, return_date || new Date(), reason || null, subtotal, subtotal, req.user.id]
    );

    for (const i of checked) {
      await conn.query(
        `INSERT INTO sale_return_items(sale_return_id,medicine_id,batch_id,qty,unit_price,cost_price,total) VALUES(?,?,?,?,?,?,?)`,
        [r.insertId, i.medicine_id, i.batch_id, i.qty, i.unit_price, i.cost_price, i.total]
      );
      await conn.query(
        `INSERT INTO stock_transactions(hospital_id,warehouse_id,medicine_id,batch_id,transaction_type,reference_type,reference_id,qty_in,unit_cost)
         VALUES(?,?,?,?,?,?,?,?,?)`,
        [h, i.warehouse_id || null, i.medicine_id, i.batch_id, 'SALE_RETURN', 'SALE_RETURN', r.insertId, i.qty, i.cost_price]
      );
    }

    // NOTE: the Sale Invoice's own net_total is NOT changed by a return. The invoice stays
    // gross; every "amount due" formula subtracts the returns separately
    // (due = net_total - paid - returns). Reducing net_total here as well double-counted the return.

    // Ledger — true reversal of a Sale: revenue down, receivable down,
    // inventory back up, cost of goods sold back down.
    const ids = await accountIds(conn, h);
    const sales = ids['4000'] || ids['4100'];
    const ar = ids['1050'];
    const inventory = ids['1200'] || ids['1300'];
    const cogsAcc = ids['5000'] || ids['5100'];
    if (sales && ar && inventory && cogsAcc && subtotal > 0.009) {
      await postJournal(conn, {
        hospital_id: h,
        reference_type: 'SALE_RETURN',
        reference_id: r.insertId,
        narration: `Sale return ${returnNo}${reason ? ' — ' + reason : ''}`,
        items: [
          { account_id: sales, debit: subtotal },
          { account_id: ar, credit: subtotal },
          { account_id: inventory, debit: cogsTotal },
          { account_id: cogsAcc, credit: cogsTotal }
        ]
      });
    }

    await conn.commit();
    res.status(201).json({ id: r.insertId, return_no: returnNo, net_total: subtotal });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

/* PUT /api/sale-returns/:id - edit an existing credit note while preserving
   its ID, stock ledger correctness and GL reference. */
exports.update = async (req, res) => {
  const h = req.user.hospital_id;
  const id = Number(req.params.id);
  const { sale_id, patient_id, return_date, reason, items = [] } = req.body;
  if (!items.length) return res.status(400).json({ message: 'Add at least one item to return' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[old]] = await conn.query(`SELECT * FROM sale_returns WHERE id=? AND hospital_id=? FOR UPDATE`, [id,h]);
    if (!old) return res.status(404).json({message:'Sale return not found'});
    const oldSaleId = old.sale_id;
    const [oldItems] = await conn.query(`SELECT * FROM sale_return_items WHERE sale_return_id=?`,[id]);
    for (const i of oldItems) await conn.query(`INSERT INTO stock_transactions(hospital_id,warehouse_id,medicine_id,batch_id,transaction_type,reference_type,reference_id,qty_out,unit_cost) VALUES(?,?,?,?,?,?,?,?,?)`,[h,null,i.medicine_id,i.batch_id,'SALE_RETURN_EDIT_REVERSAL','SALE_RETURN_EDIT',id,i.qty,i.cost_price]);
    await conn.query(`DELETE FROM journal_entries WHERE hospital_id=? AND reference_type='SALE_RETURN' AND reference_id=?`,[h,id]);

    let resolvedPatientId = patient_id || null;
    const newSaleId = sale_id || oldSaleId;
    if (newSaleId && !resolvedPatientId) {
      const [[s]] = await conn.query(`SELECT patient_id FROM sales_invoices WHERE id=? AND hospital_id=?`,[newSaleId,h]);
      resolvedPatientId=s?.patient_id||null;
    }
    let subtotal=0,cogsTotal=0; const checked=[];
    for(const i of items){
      if(!i.medicine_id||!i.batch_id||!(Number(i.qty)>0)) throw new Error('Each return line requires a medicine, batch and quantity greater than 0');
      const [[b]]=await conn.query(`SELECT purchase_price,sale_price,batch_no FROM medicine_batches WHERE id=? AND medicine_id=?`,[i.batch_id,i.medicine_id]);
      if(!b) throw new Error('Invalid batch');
      if(newSaleId){
        const [[sold]]=await conn.query(`SELECT COALESCE(SUM(si.qty),0) sold_qty FROM sale_items si WHERE si.sale_id=? AND si.medicine_id=? AND si.batch_id=?`,[newSaleId,i.medicine_id,i.batch_id]);
        const [[returned]]=await conn.query(`SELECT COALESCE(SUM(ri.qty),0) returned_qty FROM sale_return_items ri JOIN sale_returns rr ON rr.id=ri.sale_return_id WHERE rr.sale_id=? AND rr.id<>? AND ri.medicine_id=? AND ri.batch_id=?`,[newSaleId,id,i.medicine_id,i.batch_id]);
        const available=Number(sold.sold_qty||0)-Number(returned.returned_qty||0);
        if(Number(i.qty)>available+0.0001) throw new Error(`Cannot return more than ${available} remaining units for ${b.batch_no}`);
      }
      const unitPrice=Number(i.unit_price!=null?i.unit_price:b.sale_price),costPrice=Number(i.cost_price!=null?i.cost_price:b.purchase_price),total=Number(i.qty)*unitPrice;
      subtotal+=total;cogsTotal+=Number(i.qty)*costPrice;checked.push({...i,unit_price:unitPrice,cost_price:costPrice,total});
    }
    await conn.query(`DELETE FROM sale_return_items WHERE sale_return_id=?`,[id]);
    const returnNo=old.return_no||('CN-'+Date.now());
    await conn.query(`UPDATE sale_returns SET sale_id=?,patient_id=?,return_no=?,return_date=?,reason=?,subtotal=?,net_total=? WHERE id=? AND hospital_id=?`,[newSaleId||null,resolvedPatientId,returnNo,return_date||old.return_date,reason||null,subtotal,subtotal,id,h]);
    for(const i of checked){
      await conn.query(`INSERT INTO sale_return_items(sale_return_id,medicine_id,batch_id,qty,unit_price,cost_price,total) VALUES(?,?,?,?,?,?,?)`,[id,i.medicine_id,i.batch_id,i.qty,i.unit_price,i.cost_price,i.total]);
      await conn.query(`INSERT INTO stock_transactions(hospital_id,warehouse_id,medicine_id,batch_id,transaction_type,reference_type,reference_id,qty_in,unit_cost) VALUES(?,?,?,?,?,?,?,?,?)`,[h,i.warehouse_id||null,i.medicine_id,i.batch_id,'SALE_RETURN','SALE_RETURN',id,i.qty,i.cost_price]);
    }
    const ids=await accountIds(conn,h),sales=ids['4000']||ids['4100'],ar=ids['1050'],inventory=ids['1200']||ids['1300'],cogsAcc=ids['5000']||ids['5100'];
    if(sales&&ar&&inventory&&cogsAcc&&subtotal>0.009) await postJournal(conn,{hospital_id:h,reference_type:'SALE_RETURN',reference_id:id,narration:`Sale return ${returnNo}${reason?' — '+reason:''}`,items:[{account_id:sales,debit:subtotal},{account_id:ar,credit:subtotal},{account_id:inventory,debit:cogsTotal},{account_id:cogsAcc,credit:cogsTotal}]});
    await conn.commit(); res.json({id,return_no:returnNo,net_total:subtotal});
  } catch(e){await conn.rollback();throw e;} finally{conn.release();}
};
