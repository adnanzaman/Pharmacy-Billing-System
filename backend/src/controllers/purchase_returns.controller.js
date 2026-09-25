const pool = require('../config/db');
const { postJournal, accountIds, resolveHospitalId } = require('../services_accounting');

/* GET /api/purchase-returns */
exports.list = async (req, res) => {
  const h=await resolveHospitalId(req),q=String(req.query.q||'').trim(),like=`%${q}%`;
  const [rows]=await pool.query(`SELECT r.*,s.name supplier_name,s.phone supplier_phone,p.invoice_no purchase_invoice_no FROM purchase_returns r LEFT JOIN suppliers s ON s.id=r.supplier_id LEFT JOIN purchase_invoices p ON p.id=r.purchase_id WHERE r.hospital_id=? AND (?='' OR r.return_no LIKE ? OR COALESCE(p.invoice_no,'') LIKE ? OR COALESCE(s.phone,'') LIKE ? OR EXISTS(SELECT 1 FROM purchase_return_items ri JOIN medicines m ON m.id=ri.medicine_id WHERE ri.purchase_return_id=r.id AND (m.name LIKE ? OR COALESCE(m.generic_name,'') LIKE ?))) ORDER BY r.id DESC`,[h,q,like,like,like,like,like]);res.json(rows);
};

/* GET /api/purchase-returns/:id */
exports.getOne = async (req, res) => {
  const h = await resolveHospitalId(req);
  const [[ret]] = await pool.query(
    `SELECT r.*, s.name supplier_name, s.phone supplier_phone, s.address supplier_address, p.invoice_no purchase_invoice_no
     FROM purchase_returns r
     LEFT JOIN suppliers s ON s.id=r.supplier_id
     LEFT JOIN purchase_invoices p ON p.id=r.purchase_id
     WHERE r.id=? AND r.hospital_id=?`,
    [req.params.id, h]
  );
  if (!ret) return res.status(404).json({ message: 'Purchase return not found' });
  const [items] = await pool.query(
    `SELECT ri.*, m.name medicine_name, b.batch_no
     FROM purchase_return_items ri
     JOIN medicines m ON m.id=ri.medicine_id
     JOIN medicine_batches b ON b.id=ri.batch_id
     WHERE ri.purchase_return_id=?`,
    [ret.id]
  );
  res.json({ ...ret, items });
};

/* POST /api/purchase-returns
   body: { purchase_id?, supplier_id, return_date, reason, items:[{medicine_id,batch_id,qty}] }
   Each qty is checked against current stock for that batch (you can't
   return more than is still physically on the shelf). Stock is reduced,
   the supplier's payable is reduced, and — if this return is linked to
   a specific Purchase Bill — that bill's net_total is reduced by the
   same amount so "amount due" stays accurate. */
exports.create = async (req, res) => {
  const h = await resolveHospitalId(req);
  const { purchase_id, supplier_id, return_date, reason, items = [] } = req.body;
  if (!items.length) return res.status(400).json({ message: 'Add at least one item to return' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    let subtotal = 0;
    const checked = [];
    for (const i of items) {
      if (!i.medicine_id || !i.batch_id || !(Number(i.qty) > 0)) throw new Error('Each return line requires a medicine, batch and quantity greater than 0');
      const [[b]] = await conn.query(`SELECT purchase_price, batch_no FROM medicine_batches WHERE id=? AND medicine_id=?`, [i.batch_id, i.medicine_id]);
      if (!b) throw new Error('Invalid batch');
      if (purchase_id) {
        const [[purchased]] = await conn.query(`SELECT COALESCE(SUM(pi.qty+COALESCE(pi.bonus_qty,0)),0) purchased_qty FROM purchase_items pi WHERE pi.purchase_id=? AND pi.medicine_id=? AND pi.batch_id=?`, [purchase_id,i.medicine_id,i.batch_id]);
        const [[returned]] = await conn.query(`SELECT COALESCE(SUM(pri.qty),0) returned_qty FROM purchase_return_items pri JOIN purchase_returns pr ON pr.id=pri.purchase_return_id WHERE pr.purchase_id=? AND pri.medicine_id=? AND pri.batch_id=?`, [purchase_id,i.medicine_id,i.batch_id]);
        const availableAgainstBill = Number(purchased.purchased_qty||0)-Number(returned.returned_qty||0);
        if (Number(i.qty) > availableAgainstBill + 0.0001) throw new Error(`Cannot return more than ${availableAgainstBill} units against this purchase bill for ${b.batch_no}`);
      }
      const [[s]] = await conn.query(`SELECT COALESCE(SUM(qty_in-qty_out),0) stock FROM stock_transactions WHERE medicine_id=? AND batch_id=?`, [i.medicine_id, i.batch_id]);
      if (Number(s.stock) < Number(i.qty)) throw new Error(`Cannot return more than the ${s.stock} units currently in stock for batch ${b.batch_no}`);
      const unitCost = Number(i.unit_cost != null ? i.unit_cost : b.purchase_price);
      const total = Number(i.qty) * unitCost;
      subtotal += total;
      checked.push({ ...i, unit_cost: unitCost, total });
    }

    const returnNo = 'DN-' + Date.now();
    const [r] = await conn.query(
      `INSERT INTO purchase_returns(hospital_id,purchase_id,supplier_id,return_no,return_date,reason,subtotal,net_total,created_by)
       VALUES(?,?,?,?,?,?,?,?,?)`,
      [h, purchase_id || null, supplier_id || null, returnNo, return_date || new Date(), reason || null, subtotal, subtotal, req.user.id]
    );

    for (const i of checked) {
      await conn.query(
        `INSERT INTO purchase_return_items(purchase_return_id,medicine_id,batch_id,qty,unit_cost,total) VALUES(?,?,?,?,?,?)`,
        [r.insertId, i.medicine_id, i.batch_id, i.qty, i.unit_cost, i.total]
      );
      await conn.query(
        `INSERT INTO stock_transactions(hospital_id,warehouse_id,medicine_id,batch_id,transaction_type,reference_type,reference_id,qty_out,unit_cost,transaction_date)
         VALUES(?,?,?,?,?,?,?,?,?,?)`,
        [h, i.warehouse_id || null, i.medicine_id, i.batch_id, 'PURCHASE_RETURN', 'PURCHASE_RETURN', r.insertId, i.qty, i.unit_cost, `${return_date || new Date().toISOString().slice(0,10)} 00:00:00`]
      );
    }

    // NOTE: the Purchase Bill's own net_total is NOT changed by a return. The bill stays
    // gross; every "amount due" formula subtracts the returns separately
    // (due = net_total - paid - returns). Reducing net_total here as well double-counted the return.

    // Ledger: Debit Accounts Payable (we owe less), Credit Inventory (we hold less stock)
    const ids = await accountIds(conn, h);
    const ap = ids['2000'] || ids['2100'];
    const inventory = ids['1200'] || ids['1300'];
    if (ap && inventory && subtotal > 0.009) {
      await postJournal(conn, {
        hospital_id: h,
        reference_type: 'PURCHASE_RETURN',
        reference_id: r.insertId,
        narration: `Purchase return ${returnNo}${reason ? ' — ' + reason : ''}`,
        items: [{ account_id: ap, debit: subtotal }, { account_id: inventory, credit: subtotal }]
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

/* PUT /api/purchase-returns/:id - edit an existing debit note safely. */
exports.update = async (req, res) => {
  const h = await require('../services_accounting').resolveHospitalId(req), id=Number(req.params.id);
  const { purchase_id, supplier_id, return_date, reason, items=[] }=req.body;
  if(!items.length) return res.status(400).json({message:'Add at least one item to return'});
  const conn=await pool.getConnection();
  try{
    await conn.beginTransaction();
    const [[old]]=await conn.query(`SELECT * FROM purchase_returns WHERE id=? AND hospital_id=? FOR UPDATE`,[id,h]);
    if(!old)return res.status(404).json({message:'Purchase return not found'});
    const oldPurchaseId=old.purchase_id; const [oldItems]=await conn.query(`SELECT * FROM purchase_return_items WHERE purchase_return_id=?`,[id]);
    for(const i of oldItems) await conn.query(`INSERT INTO stock_transactions(hospital_id,warehouse_id,medicine_id,batch_id,transaction_type,reference_type,reference_id,qty_in,unit_cost) VALUES(?,?,?,?,?,?,?,?,?)`,[h,null,i.medicine_id,i.batch_id,'PURCHASE_RETURN_EDIT_REVERSAL','PURCHASE_RETURN_EDIT',id,i.qty,i.unit_cost]);
    await conn.query(`DELETE FROM journal_entries WHERE hospital_id=? AND reference_type='PURCHASE_RETURN' AND reference_id=?`,[h,id]);
    const newPurchaseId=purchase_id||oldPurchaseId; let subtotal=0; const checked=[];
    for(const i of items){
      if(!i.medicine_id||!i.batch_id||!(Number(i.qty)>0))throw new Error('Each return line requires a medicine, batch and quantity greater than 0');
      const [[b]]=await conn.query(`SELECT purchase_price,batch_no FROM medicine_batches WHERE id=? AND medicine_id=?`,[i.batch_id,i.medicine_id]); if(!b)throw new Error('Invalid batch');
      if(newPurchaseId){
        const [[purchased]]=await conn.query(`SELECT COALESCE(SUM(pi.qty+COALESCE(pi.bonus_qty,0)),0) purchased_qty FROM purchase_items pi WHERE pi.purchase_id=? AND pi.medicine_id=? AND pi.batch_id=?`,[newPurchaseId,i.medicine_id,i.batch_id]);
        const [[returned]]=await conn.query(`SELECT COALESCE(SUM(pri.qty),0) returned_qty FROM purchase_return_items pri JOIN purchase_returns pr ON pr.id=pri.purchase_return_id WHERE pr.purchase_id=? AND pr.id<>? AND pri.medicine_id=? AND pri.batch_id=?`,[newPurchaseId,id,i.medicine_id,i.batch_id]);
        const available=Number(purchased.purchased_qty||0)-Number(returned.returned_qty||0); if(Number(i.qty)>available+0.0001)throw new Error(`Cannot return more than ${available} units against this purchase bill for ${b.batch_no}`);
      }
      const [[stock]]=await conn.query(`SELECT COALESCE(SUM(qty_in-qty_out),0) stock FROM stock_transactions WHERE hospital_id=? AND medicine_id=? AND batch_id=?`,[h,i.medicine_id,i.batch_id]);
      if(Number(stock.stock)<Number(i.qty))throw new Error(`Cannot return more than ${stock.stock} units currently in stock for batch ${b.batch_no}`);
      const unitCost=Number(i.unit_cost!=null?i.unit_cost:b.purchase_price),total=Number(i.qty)*unitCost; subtotal+=total; checked.push({...i,unit_cost:unitCost,total});
    }
    await conn.query(`DELETE FROM purchase_return_items WHERE purchase_return_id=?`,[id]);
    const returnNo=old.return_no||('DN-'+Date.now());
    await conn.query(`UPDATE purchase_returns SET purchase_id=?,supplier_id=?,return_no=?,return_date=?,reason=?,subtotal=?,net_total=? WHERE id=? AND hospital_id=?`,[newPurchaseId||null,supplier_id||old.supplier_id,returnNo,return_date||old.return_date,reason||null,subtotal,subtotal,id,h]);
    for(const i of checked){
      await conn.query(`INSERT INTO purchase_return_items(purchase_return_id,medicine_id,batch_id,qty,unit_cost,total) VALUES(?,?,?,?,?,?)`,[id,i.medicine_id,i.batch_id,i.qty,i.unit_cost,i.total]);
      await conn.query(`INSERT INTO stock_transactions(hospital_id,warehouse_id,medicine_id,batch_id,transaction_type,reference_type,reference_id,qty_out,unit_cost) VALUES(?,?,?,?,?,?,?,?,?)`,[h,i.warehouse_id||null,i.medicine_id,i.batch_id,'PURCHASE_RETURN','PURCHASE_RETURN',id,i.qty,i.unit_cost]);
    }
    const ids=await accountIds(conn,h),ap=ids['2000']||ids['2100'],inventory=ids['1200']||ids['1300'];
    if(ap&&inventory&&subtotal>0.009)await postJournal(conn,{hospital_id:h,reference_type:'PURCHASE_RETURN',reference_id:id,narration:`Purchase return ${returnNo}${reason?' — '+reason:''}`,items:[{account_id:ap,debit:subtotal},{account_id:inventory,credit:subtotal}]});
    await conn.commit();res.json({id,return_no:returnNo,net_total:subtotal});
  }catch(e){await conn.rollback();throw e;}finally{conn.release();}
};
