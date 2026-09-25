const pool=require('../config/db');
const {postJournal,accountIds,resolveHospitalId}=require('../services_accounting');

async function deleteExpenseJournal(conn,h,id){
  const [rows]=await conn.query(`SELECT id FROM journal_entries WHERE hospital_id=? AND reference_type='EXPENSE' AND reference_id=?`,[h,id]);
  for(const r of rows) await conn.query(`DELETE FROM journal_entries WHERE id=?`,[r.id]);
}

async function saveExpenseJournal(conn,h,expense){
  const ids=await accountIds(conn,h);
  const expenseAccount=ids['6000']||ids['6100'];
  let cash=expense.payment_method==='Cash'?(ids['1000']||ids['1100']):ids['1100'];
  if(expense.payment_method==='Bank' && !cash) cash=ids['1000'];
  if(expenseAccount&&cash){
    await postJournal(conn,{hospital_id:h,reference_type:'EXPENSE',reference_id:expense.id,narration:expense.description||expense.category,items:[{account_id:expenseAccount,debit:Number(expense.amount)},{account_id:cash,credit:Number(expense.amount)}]});
  }
}

exports.list=async(req,res)=>{const h=await resolveHospitalId(req);const [r]=await pool.query('SELECT * FROM expenses WHERE hospital_id=? ORDER BY expense_date DESC,id DESC LIMIT 500',[h]);res.json(r)};
exports.getOne=async(req,res)=>{const h=await resolveHospitalId(req);const [[r]]=await pool.query('SELECT * FROM expenses WHERE id=? AND hospital_id=?',[Number(req.params.id),h]);if(!r)return res.status(404).json({message:'Expense not found'});res.json(r)};
exports.create=async(req,res)=>{const h=await resolveHospitalId(req);const {expense_date=new Date().toISOString().slice(0,10),category,description,amount,payment_method='Cash'}=req.body;if(!category||!(Number(amount)>0))return res.status(400).json({message:'Category and a positive amount are required'});const conn=await pool.getConnection();try{await conn.beginTransaction();const [r]=await conn.query(`INSERT INTO expenses(hospital_id,expense_date,category,description,amount,payment_method) VALUES(?,?,?,?,?,?)`,[h,expense_date,category,description||null,Number(amount),payment_method]);await saveExpenseJournal(conn,h,{id:r.insertId,category,description,amount:Number(amount),payment_method});await conn.commit();res.status(201).json({id:r.insertId});}catch(e){await conn.rollback();throw e}finally{conn.release()}};
exports.update=async(req,res)=>{const h=await resolveHospitalId(req);const id=Number(req.params.id);const {expense_date,category,description,amount,payment_method='Cash'}=req.body;if(!category||!(Number(amount)>0))return res.status(400).json({message:'Category and a positive amount are required'});const conn=await pool.getConnection();try{await conn.beginTransaction();const [[old]]=await conn.query('SELECT * FROM expenses WHERE id=? AND hospital_id=? FOR UPDATE',[id,h]);if(!old){await conn.rollback();return res.status(404).json({message:'Expense not found'});}await conn.query(`UPDATE expenses SET expense_date=?,category=?,description=?,amount=?,payment_method=? WHERE id=? AND hospital_id=?`,[expense_date||old.expense_date,category,description||null,Number(amount),payment_method,id,h]);await deleteExpenseJournal(conn,h,id);await saveExpenseJournal(conn,h,{id,category,description,amount:Number(amount),payment_method});await conn.commit();res.json({id});}catch(e){await conn.rollback();throw e}finally{conn.release()}};
