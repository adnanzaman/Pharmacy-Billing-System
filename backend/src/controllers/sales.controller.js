const pool=require('../config/db');
const {postJournal,accountIds,ensureCoreAccounts}=require('../services_accounting');
const {planEditAdjustments,annotateReturned,saleReturnedMap,relinkSaleReturnItems,createSaleEditCreditNote,applySaleReturnReductions}=require('../services_edit_adjustments');

async function resolveHospitalId(req, conn=pool){
  if (req.user && req.user.hospital_id) return Number(req.user.hospital_id);
  const [rows]=await conn.query('SELECT hospital_id FROM users WHERE id=? LIMIT 1',[req.user.id]);
  if (rows[0]?.hospital_id) return Number(rows[0].hospital_id);
  const [hospitals]=await conn.query('SELECT id FROM hospitals ORDER BY id ASC LIMIT 1');
  if (hospitals[0]?.id) return Number(hospitals[0].id);
  throw new Error('Hospital is not configured for this user');
}

async function deleteJournal(conn,h,referenceType,referenceId){
  const [rows]=await conn.query('SELECT id FROM journal_entries WHERE hospital_id=? AND reference_type=? AND reference_id=?',[h,referenceType,referenceId]);
  for(const r of rows) await conn.query('DELETE FROM journal_entries WHERE id=?',[r.id]);
}

async function loadSale(conn,h,id){
  const [[header]]=await conn.query(`SELECT s.*,p.name patient_name,p.patient_no,p.mobile patient_mobile,p.address patient_address,d.name doctor_name FROM sales_invoices s LEFT JOIN patients p ON p.id=s.patient_id LEFT JOIN doctors d ON d.id=s.doctor_id WHERE s.id=? AND s.hospital_id=?`,[id,h]);
  if(!header) return null;
  const [items]=await conn.query(`SELECT si.*,m.name medicine_name,m.generic_name,m.category_id,b.batch_no,b.expiry_date,b.sale_price,b.mrp FROM sale_items si JOIN medicines m ON m.id=si.medicine_id LEFT JOIN medicine_batches b ON b.id=si.batch_id WHERE si.sale_id=? ORDER BY si.id`,[id]);
  const returned=await saleReturnedMap(conn,h,id);
  return {...header,items:annotateReturned(items,returned,l=>Number(l.qty||0))};
}

async function insertSale(conn,{req,h,id=null,patient_id=null,doctor_id=null,invoice_no,invoice_date=null,invoice_time=null,billing_address=null,discount=0,round_off=0,paid=0,journal_paid=null,payment_method='Cash',bank_account_id=null,items=[]}){
  await ensureCoreAccounts(conn,h);
  let subtotal=0,tax=0,cogs=0,itemDiscountTotal=0; const checked=[];
  for(const i of items){
    if(!i.medicine_id||!i.batch_id||!(Number(i.qty)>0)) throw new Error('Each sale line requires a medicine, batch and quantity greater than 0');
    const [[s]]=await conn.query(`SELECT COALESCE(SUM(qty_in-qty_out),0) stock FROM stock_transactions WHERE hospital_id=? AND medicine_id=? AND batch_id=?`,[h,i.medicine_id,i.batch_id]);
    if(Number(s.stock)<Number(i.qty)) throw new Error(`Insufficient stock for medicine ${i.medicine_id}`);
    const [[b]]=await conn.query(`SELECT purchase_price,sale_price,expiry_date,batch_no FROM medicine_batches WHERE id=? AND medicine_id=?`,[i.batch_id,i.medicine_id]);
    if(!b) throw new Error('Invalid batch');
    if(b.expiry_date && !i._existing && new Date(b.expiry_date)<new Date(new Date().toISOString().slice(0,10))) throw new Error(`Cannot sell expired batch ${b.batch_no}`);
    const price=Number(i.unit_price??b.sale_price), d=Number(i.discount||0), t=Number(i.tax||0), cess=Number(i.cess||0);
    subtotal+=Number(i.qty)*price-d; tax+=t+cess; cogs+=Number(i.qty)*Number(b.purchase_price||0); itemDiscountTotal+=d;
    checked.push({...i,unit_price:price,discount:d,discount_percent:Number(i.discount_percent||0),tax:t,tax_percent:Number(i.tax_percent||0),tax_profile_id:i.tax_profile_id||null,cess,custom_field:i.custom_field||null,cost_price:Number(b.purchase_price||0)});
  }
  // `subtotal` already has each line's own discount netted out of it (see the loop
  // above), so the invoice-level `discount` is not subtracted again here - it is
  // stored purely so it can be displayed (e.g. "Disc." / "You Saved" on the printed
  // receipt). It is computed from the actual line items rather than trusted from the
  // request body.
  discount = Math.round(itemDiscountTotal * 100) / 100;
  const net=Math.round((subtotal+tax+Number(round_off||0))*100)/100;
  if(Number(paid)<0||Number(paid)>net+0.009) throw new Error('Paid amount cannot exceed invoice total');
  let saleId=id;
  const datePart = invoice_date ? String(invoice_date).slice(0,10) : new Date().toISOString().slice(0,10);
  const timePart = invoice_time || new Date().toTimeString().slice(0,8);
  const invoiceDateTime = `${datePart} ${timePart.length === 5 ? timePart + ':00' : timePart}`;
  if(id){
    await conn.query(`UPDATE sales_invoices SET patient_id=?,doctor_id=?,invoice_no=?,invoice_date=?,invoice_time=?,billing_address=?,subtotal=?,discount=?,tax=?,net_total=?,round_off=?,paid=?,payment_method=?,bank_account_id=?,status='POSTED' WHERE id=? AND hospital_id=?`,[patient_id||null,doctor_id||null,invoice_no,invoiceDateTime,timePart,billing_address||null,subtotal,discount,tax,net,round_off||0,paid,payment_method,bank_account_id||null,id,h]);
  }else{
    const [r]=await conn.query(`INSERT INTO sales_invoices(hospital_id,patient_id,doctor_id,invoice_no,invoice_date,invoice_time,billing_address,subtotal,discount,tax,net_total,round_off,paid,payment_method,bank_account_id) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,[h,patient_id||null,doctor_id||null,invoice_no,invoiceDateTime,timePart,billing_address||null,subtotal,discount,tax,net,round_off||0,paid,payment_method,bank_account_id||null]);
    saleId=r.insertId;
  }
  for(const i of checked){
    const total=Number(i.qty)*i.unit_price-i.discount+i.tax+i.cess;
    await conn.query(`INSERT INTO sale_items(sale_id,medicine_id,batch_id,qty,unit_price,discount,discount_percent,tax,tax_percent,tax_profile_id,cess,custom_field,cost_price,total) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,[saleId,i.medicine_id,i.batch_id,i.qty,i.unit_price,i.discount,i.discount_percent,i.tax,i.tax_percent,i.tax_profile_id,i.cess,i.custom_field,i.cost_price,total]);
    await conn.query(`INSERT INTO stock_transactions(hospital_id,warehouse_id,medicine_id,batch_id,transaction_type,reference_type,reference_id,qty_out,unit_cost,transaction_date) VALUES(?,?,?,?,?,?,?,?,?,?)`,[h,i.warehouse_id||null,i.medicine_id,i.batch_id,'SALE','SALE',saleId,i.qty,i.cost_price,invoiceDateTime]);
  }
  const ids=await accountIds(conn,h); let cash=ids['1000']||ids['1100']; if(payment_method==='Bank'){ if(bank_account_id){ const [[bacc]]=await conn.query(`SELECT account_id FROM bank_accounts WHERE id=? AND hospital_id=?`,[bank_account_id,h]); cash=bacc?bacc.account_id:(ids['1100']||ids['1000']); } else cash=ids['1100']||ids['1000']; } const sales=ids['4000']||ids['4100'], inventory=ids['1200']||ids['1300'], cogsAcc=ids['5000']||ids['5100'], ar=ids['1050'];
  const balanceDue=Number(net)-Number(journal_paid==null?paid:journal_paid);
  if(cash&&sales&&inventory&&cogsAcc){
    const journalItems=[]; if(Number(paid)>0) journalItems.push({account_id:cash,debit:paid});
    if(balanceDue>0.009){if(ar) journalItems.push({account_id:ar,debit:balanceDue}); else throw new Error('Accounts receivable account (1050) is not configured');}
    journalItems.push({account_id:sales,credit:net},{account_id:inventory,debit:cogs},{account_id:cogsAcc,credit:cogs});
    await postJournal(conn,{hospital_id:h,reference_type:'SALE',reference_id:saleId,narration:`Pharmacy sale ${invoice_no}`,items:journalItems});
  }
  return {id:saleId,invoice_no,net_total:net};
}

exports.create=async(req,res)=>{
 const h=req.user.hospital_id; const {patient_id,doctor_id,invoice_no,invoice_date,invoice_time,billing_address,discount=0,round_off=0,paid=0,payment_method='Cash',bank_account_id=null,items=[]}=req.body;
 const finalInvoiceNo=invoice_no||`INV-${Date.now()}`;
 if(!items.length)return res.status(400).json({message:'Invoice number and items are required'});
 const conn=await pool.getConnection();
 try{const h=await resolveHospitalId(req,conn); await conn.beginTransaction(); const result=await insertSale(conn,{req,h,patient_id,doctor_id,invoice_no:finalInvoiceNo,invoice_date,invoice_time,billing_address,discount,round_off,paid,payment_method,bank_account_id,items});
  await conn.query(`INSERT INTO audit_logs(user_id,action,entity,entity_id,details) VALUES(?,?,?,?,?)`,[req.user.id,'CREATE','SALE',result.id,JSON.stringify({invoice_no:finalInvoiceNo,net_total:result.net_total,items:items.length})]);
  await conn.commit();res.status(201).json(result);
 }catch(e){await conn.rollback();throw e}finally{conn.release()}
};

exports.update=async(req,res)=>{
 const id=Number(req.params.id); const conn=await pool.getConnection();
 try{const h=await resolveHospitalId(req,conn); await conn.beginTransaction(); const old=await loadSale(conn,h,id); if(!old) return res.status(404).json({message:'Sale not found'});
  const body=req.body||{}; const items=body.items||[]; if(!items.length) throw new Error('Sale must contain at least one item');
  const [[alloc]] = await conn.query(`SELECT COALESCE(SUM(amount),0) allocated FROM payment_allocations WHERE invoice_type='SALE' AND invoice_id=?`,[id]); const allocated=Number(alloc.allocated||0); if(Number(body.paid||0)+0.0001 < allocated) throw new Error(`Paid amount cannot be less than ${allocated.toFixed(2)} already allocated through Payment In.`);
  // EDIT RULES (see services_edit_adjustments.js): the form shows what the customer currently
  // holds (sold - already returned).
  //  * quantity reduced / line removed -> the invoice keeps its gross line and an automatic
  //    Credit Note (Sale Return) is posted for the difference, so it shows in the Day Book,
  //    puts the stock back and reduces the receivable.
  //  * quantity increased -> the invoice line grows: more stock goes out and the balance goes up.
  const returnedMap=await saleReturnedMap(conn,h,id);
  const plan=planEditAdjustments({oldItems:old.items,newItems:items,returnedByKey:returnedMap,qtyOf:l=>Number(l.qty||0),priceOf:l=>Number(l.unit_price||0)});
  await conn.query(`DELETE FROM stock_transactions WHERE hospital_id=? AND reference_type='SALE' AND reference_id=?`,[h,id]);
  await deleteJournal(conn,h,'SALE',id);
  await conn.query(`DELETE FROM sale_items WHERE sale_id=?`,[id]);
  // quantity increased on an invoice that has Credit Notes: take the units back out of those notes first
  const notesChanged=plan.returnReductions.length?await applySaleReturnReductions(conn,{h,saleId:id,reductions:plan.returnReductions,accountIds,postJournal}):0;
  const patientForNote=body.patient_id||old.patient_id||null;
  const result=await insertSale(conn,{req,h,id,patient_id:body.patient_id,doctor_id:body.doctor_id,invoice_no:body.invoice_no||old.invoice_no,invoice_date:body.invoice_date,invoice_time:body.invoice_time,billing_address:body.billing_address,discount:body.discount||0,round_off:body.round_off||0,paid:body.paid||0,payment_method:body.payment_method||'Cash',bank_account_id:body.bank_account_id,journal_paid:Math.max(0,Number(body.paid||0)-allocated),items:plan.items});
  let creditNote=null;
  if(plan.adjustments.length) creditNote=await createSaleEditCreditNote(conn,{h,userId:req.user.id,saleId:id,invoiceNo:result.invoice_no,patientId:patientForNote,adjustments:plan.adjustments,accountIds,postJournal});
  await relinkSaleReturnItems(conn,id);
  await conn.query(`INSERT INTO audit_logs(user_id,action,entity,entity_id,details) VALUES(?,?,?,?,?)`,[req.user.id,'UPDATE','SALE',id,JSON.stringify({invoice_no:result.invoice_no,net_total:result.net_total,old_total:old.net_total,items:items.length,credit_note:creditNote?creditNote.return_no:null})]);
  await conn.commit();res.json({...result,credit_note:creditNote,credit_notes_reduced:notesChanged});
 }catch(e){await conn.rollback();throw e}finally{conn.release()}
};

exports.returnItems=async(req,res)=>{
 const id=Number(req.params.id); const {items=[],refund_amount=0,reason='Customer return',return_date}=req.body||{};
 if(!items.length) return res.status(400).json({message:'Select at least one item to return'});
 const conn=await pool.getConnection();
 try{const h=await resolveHospitalId(req,conn); await conn.beginTransaction(); const sale=await loadSale(conn,h,id); if(!sale){await conn.rollback();return res.status(404).json({message:'Sale not found'});}
  const [[lastNo]]=await conn.query(`SELECT COUNT(*) c FROM sale_returns WHERE hospital_id=?`,[h]);
  const returnNo=`SR-${Date.now()}-${Number(lastNo.c)+1}`; const returnDate=return_date||new Date().toISOString().slice(0,10); let returnTotal=0,costTotal=0;
  const checked=[];
  for(const reqItem of items){
    const original=sale.items.find(x=>Number(x.id)===Number(reqItem.sale_item_id)); if(!original) throw new Error('Invalid sale item');
    const [[prev]]=await conn.query(`SELECT COALESCE(SUM(qty),0) qty FROM sale_return_items ri JOIN sale_returns r ON r.id=ri.sale_return_id WHERE r.sale_id=? AND ri.sale_item_id=? `,[id,original.id]);
    const remaining=Number(original.qty)-Number(prev.qty); const qty=Number(reqItem.qty);
    if(!(qty>0)||qty>remaining+0.0001) throw new Error(`Return quantity exceeds sold quantity for ${original.medicine_name}`);
    const amount=Math.round(qty*Number(original.unit_price)*100)/100; returnTotal+=amount; costTotal+=qty*Number(original.cost_price||0);
    checked.push({original,qty,amount});
  }
  if(Number(refund_amount)<0||Number(refund_amount)>returnTotal+0.009) throw new Error('Refund cannot exceed returned item value');
  const [rr]=await conn.query(`INSERT INTO sale_returns(hospital_id,sale_id,return_no,refund_amount,reason,created_by) VALUES(?,?,?,?,?,?)`,[h,id,returnNo,refund_amount,reason,req.user.id]);
  for(const x of checked){
    await conn.query(`INSERT INTO sale_return_items(sale_return_id,sale_item_id,medicine_id,batch_id,qty,unit_price,cost_price,total) VALUES(?,?,?,?,?,?,?,?)`,[rr.insertId,x.original.id,x.original.medicine_id,x.original.batch_id,x.qty,x.original.unit_price,x.original.cost_price,x.amount]);
    await conn.query(`INSERT INTO stock_transactions(hospital_id,warehouse_id,medicine_id,batch_id,transaction_type,reference_type,reference_id,qty_in,unit_cost) VALUES(?,?,?,?,?,?,?,?,?)`,[h,null,x.original.medicine_id,x.original.batch_id,'SALE_RETURN','SALE_RETURN',id,x.qty,x.original.cost_price,`${returnDate} 00:00:00`]);
  }
  const ids=await accountIds(conn,h), sales=ids['4000']||ids['4100'], inventory=ids['1200']||ids['1300'], cogsAcc=ids['5000']||ids['5100'], cash=sale.payment_method==='Cash'?(ids['1000']||ids['1100']):(ids['1100']||ids['1000']), ar=ids['1050'];
  if(sales&&inventory&&cogsAcc){
    const ji=[{account_id:inventory,debit:costTotal},{account_id:cogsAcc,credit:costTotal}];
    if(Number(refund_amount)>0){ji.push({account_id:sales,debit:refund_amount}); const remaining=Number(refund_amount); if(cash) ji.push({account_id:cash,credit:remaining}); else if(ar) ji.push({account_id:ar,credit:remaining});}
    await postJournal(conn,{hospital_id:h,reference_type:'SALE_RETURN',reference_id:rr.insertId,narration:`Sale return ${returnNo} against ${sale.invoice_no}`,items:ji});
  }
  await conn.query(`UPDATE sales_invoices SET status='PARTIAL_RETURN' WHERE id=? AND hospital_id=?`,[id,h]);
  await conn.query(`INSERT INTO audit_logs(user_id,action,entity,entity_id,details) VALUES(?,?,?,?,?)`,[req.user.id,'CREATE','SALE_RETURN',rr.insertId,JSON.stringify({sale_id:id,return_no:returnNo,refund_amount:Number(refund_amount),items:checked.map(x=>({sale_item_id:x.original.id,qty:x.qty}))})]);
  await conn.commit(); res.status(201).json({id:rr.insertId,return_no:returnNo,return_total:returnTotal,refund_amount:Number(refund_amount)});
 }catch(e){await conn.rollback();throw e}finally{conn.release()}
};

exports.list=async(req,res)=>{const conn=await pool.getConnection(); try{const h=await resolveHospitalId(req,conn);const q=String(req.query.search||req.query.q||'').trim(),like=`%${q}%`;const [rows]=await pool.query(`SELECT DISTINCT s.*,p.name patient_name,p.mobile patient_mobile,d.name doctor_name,COALESCE((SELECT SUM(ri.total) FROM sale_return_items ri JOIN sale_returns r ON r.id=ri.sale_return_id WHERE r.sale_id=s.id ),0) returned_amount FROM sales_invoices s LEFT JOIN patients p ON p.id=s.patient_id LEFT JOIN doctors d ON d.id=s.doctor_id LEFT JOIN sale_items si ON si.sale_id=s.id LEFT JOIN medicines m ON m.id=si.medicine_id WHERE s.hospital_id=? AND (?='' OR s.invoice_no LIKE ? OR p.mobile LIKE ? OR p.name LIKE ? OR p.cnic LIKE ? OR m.name LIKE ? OR m.generic_name LIKE ?) ORDER BY s.id DESC LIMIT 500`,[h,q,like,like,like,like,like,like]);res.json(rows);} finally{conn.release()}};
exports.getOne=async(req,res)=>{const id=Number(req.params.id);const conn=await pool.getConnection();try{const h=await resolveHospitalId(req,conn);const header=await loadSale(conn,h,id);if(!header)return res.status(404).json({message:'Sale not found'});const [returns]=await conn.query(`SELECT r.*,u.name created_by_name FROM sale_returns r LEFT JOIN users u ON u.id=r.created_by WHERE r.sale_id=? ORDER BY r.id DESC`,[id]);const [returnItems]=await conn.query(`SELECT ri.*,r.return_no FROM sale_return_items ri JOIN sale_returns r ON r.id=ri.sale_return_id WHERE r.sale_id=? ORDER BY ri.id`,[id]);res.json({...header,returns,returnItems})}finally{conn.release()}};
exports.batches=async(req,res)=>{const conn=await pool.getConnection();try{const h=await resolveHospitalId(req,conn);const [rows]=await conn.query(`SELECT b.*,m.name medicine_name,COALESCE((SELECT SUM(st.qty_in-st.qty_out) FROM stock_transactions st WHERE st.batch_id=b.id),0) stock FROM medicine_batches b JOIN medicines m ON m.id=b.medicine_id WHERE m.hospital_id=? ORDER BY b.expiry_date`,[h]);res.json(rows);}finally{conn.release()}};
