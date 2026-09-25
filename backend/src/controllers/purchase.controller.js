const pool=require('../config/db'); const {postJournal,accountIds,ensureCoreAccounts}=require('../services_accounting');
const {planEditAdjustments,annotateReturned,purchaseReturnedMap,relinkPurchaseReturnItems,createPurchaseEditDebitNote,applyPurchaseReturnReductions}=require('../services_edit_adjustments');
const unitsOf=l=>Number(l.qty||0)+Number(l.bonus_qty||0);

// Resolve the hospital for the current authenticated user. Older system-admin
// tokens may not contain hospital_id; in that case use the user's assigned
// hospital, or the first configured hospital as the legacy fallback.
async function resolveHospitalId(req, conn=pool){
  if (req.user && req.user.hospital_id) return Number(req.user.hospital_id);
  const [rows]=await conn.query(`SELECT hospital_id FROM users WHERE id=? LIMIT 1`,[req.user.id]);
  if (rows[0]?.hospital_id) return Number(rows[0].hospital_id);
  const [hospitals]=await conn.query(`SELECT id FROM hospitals ORDER BY id ASC LIMIT 1`);
  if (hospitals[0]?.id) return Number(hospitals[0].id);
  throw new Error('Hospital is not configured for this user');
}

async function deleteJournal(conn,h,referenceType,referenceId){const [rows]=await conn.query('SELECT id FROM journal_entries WHERE hospital_id=? AND reference_type=? AND reference_id=?',[h,referenceType,referenceId]);for(const r of rows) await conn.query('DELETE FROM journal_entries WHERE id=?',[r.id]);}

async function loadPurchase(conn,h,id){const [[header]]=await conn.query(`SELECT p.*,s.name supplier_name,s.phone supplier_phone,s.address supplier_address FROM purchase_invoices p LEFT JOIN suppliers s ON s.id=p.supplier_id WHERE p.id=? AND p.hospital_id=?`,[id,h]);if(!header)return null;const [items]=await conn.query(`SELECT pi.*,m.name medicine_name,m.generic_name,m.category_id,b.batch_no,b.expiry_date,b.sale_price,b.mrp FROM purchase_items pi JOIN medicines m ON m.id=pi.medicine_id LEFT JOIN medicine_batches b ON b.id=pi.batch_id WHERE pi.purchase_id=? ORDER BY pi.id`,[id]);const returned=await purchaseReturnedMap(conn,h,id);return {...header,items:annotateReturned(items,returned,unitsOf)};}

async function insertPurchase(conn,{req,h,id=null,supplier_id=null,invoice_no,invoice_date,invoice_time,billing_address,discount=0,round_off=0,paid=0,journal_paid=null,payment_method='Cash',bank_account_id,items=[]}){
 if (!supplier_id) throw new Error('Supplier Name is required');
 await ensureCoreAccounts(conn,h);
 const [[supplier]] = await conn.query(`SELECT id FROM suppliers WHERE id=? AND hospital_id=? LIMIT 1`, [supplier_id, h]);
 if (!supplier) throw new Error('Selected supplier was not found for this hospital');
 let subtotal=0,tax=0,itemDiscountTotal=0; for(const i of items){if(!i.medicine_id||!(Number(i.qty)>0)||!(Number(i.unit_cost)>=0)||Number(i.bonus_qty||0)<0)throw new Error('Each purchase line requires a medicine, quantity, valid cost and non-negative bonus quantity');subtotal+=Number(i.qty)*Number(i.unit_cost)-Number(i.discount||0);tax+=Number(i.tax||0)+Number(i.cess||0);itemDiscountTotal+=Number(i.discount||0)}
 // `subtotal` already has each line's own discount netted out of it, so the
 // invoice-level `discount` is not subtracted again here - it is stored purely for
 // display (e.g. "Disc." on the printed receipt), computed from the actual items.
 discount=Math.round(itemDiscountTotal*100)/100;
 const net=Math.round((subtotal+tax+Number(round_off||0))*100)/100; if(Number(paid)<0||Number(paid)>net+0.009)throw new Error('Paid amount cannot exceed invoice total');
 let purchaseId=id;
 const datePart=invoice_date||new Date().toISOString().slice(0,10); const timePart=invoice_time||new Date().toTimeString().slice(0,8);
 if(id) await conn.query(`UPDATE purchase_invoices SET supplier_id=?,invoice_no=?,invoice_date=?,invoice_time=?,billing_address=?,subtotal=?,discount=?,tax=?,net_total=?,round_off=?,paid=?,payment_method=?,bank_account_id=?,status='POSTED' WHERE id=? AND hospital_id=?`,[supplier_id,invoice_no,datePart,timePart,billing_address||null,subtotal,discount,tax,net,round_off||0,paid,payment_method||'Cash',bank_account_id||null,id,h]);
 else {const [p]=await conn.query(`INSERT INTO purchase_invoices(hospital_id,supplier_id,invoice_no,invoice_date,invoice_time,billing_address,subtotal,discount,tax,net_total,round_off,paid,payment_method,bank_account_id) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,[h,supplier_id,invoice_no,datePart,timePart,billing_address||null,subtotal,discount,tax,net,round_off||0,paid,payment_method||'Cash',bank_account_id||null]);purchaseId=p.insertId;}
 for(const i of items){let batchId=i.batch_id;if(!batchId){const [[mm]]=await conn.query(`SELECT sale_price,mrp FROM medicines WHERE id=?`,[i.medicine_id]);const itemSale=mm&&Number(mm.sale_price)>0?Number(mm.sale_price):0;const [b]=await conn.query(`INSERT INTO medicine_batches(medicine_id,batch_no,manufacture_date,expiry_date,purchase_price,sale_price,mrp) VALUES(?,?,?,?,?,?,?)`,[i.medicine_id,i.batch_no||`AUTO-${i.medicine_id}-${Date.now()}`,i.manufacture_date||null,i.expiry_date||null,i.unit_cost,i.sale_price||itemSale||i.unit_cost||0,i.mrp||(mm?mm.mrp:0)||0]);batchId=b.insertId}else{const [[b]]=await conn.query(`SELECT id FROM medicine_batches WHERE id=? AND medicine_id=?`,[batchId,i.medicine_id]);if(!b)throw new Error('Invalid batch for purchase');}
 const total=Number(i.qty)*Number(i.unit_cost)-Number(i.discount||0)+Number(i.tax||0)+Number(i.cess||0);await conn.query(`INSERT INTO purchase_items(purchase_id,medicine_id,batch_id,qty,bonus_qty,unit_cost,discount,discount_percent,tax,tax_percent,tax_profile_id,cess,custom_field,total) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,[purchaseId,i.medicine_id,batchId,i.qty,Number(i.bonus_qty||0),i.unit_cost,i.discount||0,i.discount_percent||0,i.tax||0,i.tax_percent||0,i.tax_profile_id||null,i.cess||0,i.custom_field||null,total]);await conn.query(`INSERT INTO stock_transactions(hospital_id,warehouse_id,medicine_id,batch_id,transaction_type,reference_type,reference_id,qty_in,unit_cost,transaction_date) VALUES(?,?,?,?,?,?,?,?,?,?)`,[h,i.warehouse_id||null,i.medicine_id,batchId,'PURCHASE','PURCHASE',purchaseId,Number(i.qty)+Number(i.bonus_qty||0),i.unit_cost,`${datePart} ${timePart.length===5?timePart+':00':timePart}`]);}
 const ids=await accountIds(conn,h);let cash;if(payment_method==='Bank'){if(bank_account_id){const [[bacc]]=await conn.query(`SELECT account_id FROM bank_accounts WHERE id=? AND hospital_id=?`,[bank_account_id,h]);cash=bacc?bacc.account_id:(ids['1100']||ids['1000']);}else cash=ids['1100']||ids['1000'];}else cash=ids['1000']||ids['1100'];const inventory=ids['1200']||ids['1300'],ap=ids['2000']||ids['2100'];if(cash&&inventory&&ap)await postJournal(conn,{hospital_id:h,reference_type:'PURCHASE',reference_id:purchaseId,narration:`Purchase ${invoice_no}`,items:[{account_id:inventory,debit:net},{account_id:cash,credit:Number(journal_paid==null?paid:journal_paid)},{account_id:ap,credit:Number(net)-Number(journal_paid==null?paid:journal_paid)}].filter(x=>Number(x.debit||x.credit)>0.009||x.account_id===inventory)});
 return {id:purchaseId,invoice_no,net_total:net};
}

exports.create=async(req,res)=>{const {supplier_id,invoice_no='',invoice_date,invoice_time,billing_address,discount=0,round_off=0,paid=0,payment_method='Cash',bank_account_id,items=[]}=req.body;if(!supplier_id)return res.status(400).json({message:'Supplier Name is required'});if(!items.length)return res.status(400).json({message:'At least one purchase item is required'});const conn=await pool.getConnection();const h=await resolveHospitalId(req,conn);try{await conn.beginTransaction();const result=await insertPurchase(conn,{req,h,supplier_id,invoice_no:invoice_no || '',invoice_date,invoice_time,billing_address,discount,round_off,paid,payment_method,bank_account_id,items});await conn.query(`INSERT INTO audit_logs(user_id,action,entity,entity_id,details) VALUES(?,?,?,?,?)`,[req.user.id,'CREATE','PURCHASE',result.id,JSON.stringify({invoice_no:invoice_no || '',net_total:result.net_total,items:items.length})]);await conn.commit();res.status(201).json(result);}catch(e){await conn.rollback();throw e}finally{conn.release()}};

exports.update=async(req,res)=>{const id=Number(req.params.id),body=req.body||{},conn=await pool.getConnection();const h=await resolveHospitalId(req,conn);try{await conn.beginTransaction();const old=await loadPurchase(conn,h,id);if(!old){await conn.rollback();return res.status(404).json({message:'Purchase not found'});}const items=body.items||[];if(!body.supplier_id)throw new Error('Supplier Name is required');if(!items.length)throw new Error('Purchase must contain at least one item');
 const [[alloc]] = await conn.query(`SELECT COALESCE(SUM(amount),0) allocated FROM payment_allocations WHERE invoice_type='PURCHASE' AND invoice_id=?`,[id]); const allocated=Number(alloc.allocated||0); if(Number(body.paid||0)+0.0001 < allocated) throw new Error(`Paid amount cannot be less than ${allocated.toFixed(2)} already allocated through Payment Out.`);
 // EDIT RULES (see services_edit_adjustments.js): the form shows what is currently held
 // (bought - already returned).
 //  * quantity reduced / line removed -> the bill keeps its gross line and an automatic Debit Note
 //    (Purchase Return) is posted for the difference, so it shows in the Day Book, takes the
 //    stock out and reduces the supplier payable.
 //  * quantity increased -> the bill line grows: more stock comes in and the payable goes up.
 const returnedMap=await purchaseReturnedMap(conn,h,id);
 const plan=planEditAdjustments({oldItems:old.items,newItems:items,returnedByKey:returnedMap,qtyOf:unitsOf,priceOf:l=>Number(l.unit_cost||0)});
 await conn.query(`DELETE FROM stock_transactions WHERE hospital_id=? AND reference_type='PURCHASE' AND reference_id=?`,[h,id]);await deleteJournal(conn,h,'PURCHASE',id);await conn.query(`DELETE FROM purchase_items WHERE purchase_id=?`,[id]);
 const notesChanged=plan.returnReductions.length?await applyPurchaseReturnReductions(conn,{h,purchaseId:id,reductions:plan.returnReductions,accountIds,postJournal}):0;
 const result=await insertPurchase(conn,{req,h,id,supplier_id:body.supplier_id,invoice_no:body.invoice_no ?? old.invoice_no,invoice_date:body.invoice_date||old.invoice_date,invoice_time:body.invoice_time,billing_address:body.billing_address,discount:body.discount||0,round_off:body.round_off||0,paid:body.paid||0,payment_method:body.payment_method||'Cash',bank_account_id:body.bank_account_id,journal_paid:Math.max(0,Number(body.paid||0)-allocated),items:plan.items});
 let debitNote=null;
 if(plan.adjustments.length) debitNote=await createPurchaseEditDebitNote(conn,{h,userId:req.user.id,purchaseId:id,invoiceNo:result.invoice_no,supplierId:body.supplier_id,adjustments:plan.adjustments,accountIds,postJournal});
 await relinkPurchaseReturnItems(conn,id);
 await conn.query(`INSERT INTO audit_logs(user_id,action,entity,entity_id,details) VALUES(?,?,?,?,?)`,[req.user.id,'UPDATE','PURCHASE',id,JSON.stringify({invoice_no:result.invoice_no,net_total:result.net_total,old_total:old.net_total,items:items.length,debit_note:debitNote?debitNote.return_no:null})]);await conn.commit();res.json({...result,debit_note:debitNote,debit_notes_reduced:notesChanged});}catch(e){await conn.rollback();throw e}finally{conn.release()}};

exports.list=async(req,res)=>{const h=await resolveHospitalId(req),q=String(req.query.q||'').trim();const like=`%${q}%`;const [rows]=await pool.query(`SELECT p.*,s.name supplier_name,s.phone supplier_phone,s.address supplier_address FROM purchase_invoices p LEFT JOIN suppliers s ON s.id=p.supplier_id WHERE p.hospital_id=? AND (?='' OR p.invoice_no LIKE ? OR COALESCE(s.name,'') LIKE ? OR COALESCE(s.phone,'') LIKE ? OR COALESCE(s.tax_number,'') LIKE ? OR EXISTS(SELECT 1 FROM purchase_items pi JOIN medicines m ON m.id=pi.medicine_id WHERE pi.purchase_id=p.id AND (m.name LIKE ? OR COALESCE(m.generic_name,'') LIKE ?))) ORDER BY p.id DESC LIMIT 500`,[h,q,like,like,like,like,like,like]);res.json(rows)};
exports.getOne=async(req,res)=>{const conn=await pool.getConnection();try{const h=await resolveHospitalId(req,conn);const header=await loadPurchase(conn,h,req.params.id);if(!header)return res.status(404).json({message:'Purchase not found'});res.json(header)}finally{conn.release()}};
