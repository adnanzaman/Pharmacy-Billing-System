const pool=require('../config/db'); const { resolveHospitalId, ensureCoreAccounts } = require('../services_accounting');
const range=req=>[req.query.from||'2000-01-01',req.query.to||new Date().toISOString().slice(0,10)];
exports.trialBalance=async(req,res)=>{const h=await resolveHospitalId(req); await ensureCoreAccounts(pool,h),[from,to]=range(req);const [rows]=await pool.query(`SELECT a.code,a.name,a.account_type,COALESCE(SUM(CASE WHEN e.id IS NOT NULL THEN j.debit ELSE 0 END),0) debit,COALESCE(SUM(CASE WHEN e.id IS NOT NULL THEN j.credit ELSE 0 END),0) credit,COALESCE(SUM(CASE WHEN e.id IS NOT NULL THEN j.debit-j.credit ELSE 0 END),0) balance FROM accounts a LEFT JOIN journal_entry_items j ON j.account_id=a.id LEFT JOIN journal_entries e ON e.id=j.journal_entry_id AND DATE(e.entry_date) BETWEEN ? AND ? WHERE a.hospital_id=? GROUP BY a.id ORDER BY a.code`,[from,to,h]);res.json({from,to,rows,totalDebit:rows.reduce((n,r)=>n+Number(r.debit),0),totalCredit:rows.reduce((n,r)=>n+Number(r.credit),0)});};
exports.gl=async(req,res)=>{const h=await resolveHospitalId(req); await ensureCoreAccounts(pool,h);const code=req.query.account_code;const [from,to]=range(req);if(!code)return res.status(400).json({message:'account_code is required'});const [rows]=await pool.query(`SELECT a.code,a.name,e.entry_date,e.reference_type,e.reference_id,e.narration,j.debit,j.credit FROM journal_entry_items j JOIN accounts a ON a.id=j.account_id JOIN journal_entries e ON e.id=j.journal_entry_id WHERE a.hospital_id=? AND a.code=? AND DATE(e.entry_date) BETWEEN ? AND ? ORDER BY e.entry_date DESC,e.id DESC LIMIT 2000`,[h,code,from,to]);res.json(rows)};
exports.balanceSheet=async(req,res)=>{
 const h=await resolveHospitalId(req); await ensureCoreAccounts(pool,h),[from,to]=range(req);
 const [rows]=await pool.query(`SELECT a.code,a.name,a.account_type,COALESCE(SUM(CASE WHEN e.id IS NOT NULL THEN j.debit-j.credit ELSE 0 END),0) raw_balance FROM accounts a LEFT JOIN journal_entry_items j ON j.account_id=a.id LEFT JOIN journal_entries e ON e.id=j.journal_entry_id AND DATE(e.entry_date)<=? WHERE a.hospital_id=? GROUP BY a.id ORDER BY a.account_type,a.code`,[to,h]);
 const out={Assets:[],Liabilities:[],Equity:[],totals:{Assets:0,Liabilities:0,Equity:0}};
 let revenue=0,expense=0;
 for(const r of rows){
   let v=Number(r.raw_balance);
   if(r.account_type==='ASSET'){ out.Assets.push({...r,balance:v}); out.totals.Assets+=v; }
   else if(r.account_type==='LIABILITY'){ v=-v; out.Liabilities.push({...r,balance:v}); out.totals.Liabilities+=v; }
   else if(r.account_type==='EQUITY'){ v=-v; out.Equity.push({...r,balance:v}); out.totals.Equity+=v; }
   else if(r.account_type==='REVENUE') revenue += -v;
   else if(r.account_type==='INCOME') revenue += -v;
   else if(r.account_type==='EXPENSE') expense += v;
 }
 const netIncome=Number((revenue-expense).toFixed(2));
 if(Math.abs(netIncome)>0.009){ out.Equity.push({code:'NET-INCOME',name:'Net Income (Profit)',account_type:'EQUITY',balance:netIncome}); out.totals.Equity+=netIncome; }
 res.json({from,to,...out,netIncome:Number(netIncome.toFixed(2))});
};
