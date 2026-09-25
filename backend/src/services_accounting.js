const pool=require('./config/db');
async function postJournal(conn,{hospital_id,reference_type,reference_id,narration,items}){
 const debit=items.reduce((s,x)=>s+Number(x.debit||0),0), credit=items.reduce((s,x)=>s+Number(x.credit||0),0);
 if(Math.abs(debit-credit)>0.01) throw new Error('Unbalanced journal entry');
 const [r]=await conn.query(`INSERT INTO journal_entries(hospital_id,reference_type,reference_id,narration) VALUES(?,?,?,?)`,[hospital_id,reference_type,reference_id,narration]);
 for(const i of items) await conn.query(`INSERT INTO journal_entry_items(journal_entry_id,account_id,debit,credit) VALUES(?,?,?,?)`,[r.insertId,i.account_id,i.debit||0,i.credit||0]);
 return r.insertId;
}
async function accountIds(conn,h){
 const [rows]=await conn.query(`SELECT code,id FROM accounts WHERE hospital_id=?`,[h]); return Object.fromEntries(rows.map(r=>[r.code,r.id]));
}
async function resolveHospitalId(req, conn=pool){
 if (req.user && req.user.hospital_id) return Number(req.user.hospital_id);
 const [rows]=await conn.query('SELECT hospital_id FROM users WHERE id=? LIMIT 1',[req.user.id]);
 if (rows[0]?.hospital_id) return Number(rows[0].hospital_id);
 const [hospitals]=await conn.query('SELECT id FROM hospitals ORDER BY id ASC LIMIT 1');
 if (hospitals[0]?.id) return Number(hospitals[0].id);
 throw new Error('Hospital is not configured for this user');
}

async function ensureCoreAccounts(conn,h){
 const core=[
  ['1000','Cash In Hand','ASSET'],
  ['1100','Bank - Unassigned','ASSET'],
  ['1050','Accounts Receivable','ASSET'],
  ['1200','Inventory','ASSET'],
  ['2000','Accounts Payable','LIABILITY'],
  ['3000','Capital / Opening Equity','EQUITY'],
  ['4000','Sales Revenue','REVENUE'],
  ['5000','Cost of Goods Sold','EXPENSE'],
  ['6000','Operating Expenses','EXPENSE']
 ];
 for(const [code,name,type] of core){
  await conn.query('INSERT IGNORE INTO accounts(hospital_id,code,name,account_type) VALUES(?,?,?,?)',[h,code,name,type]);
 }
}

async function accountBalance(conn,accountId){
 const [[r]]=await conn.query(`SELECT COALESCE(SUM(debit-credit),0) v FROM journal_entry_items WHERE account_id=?`,[accountId]);
 return Number(r.v);
}
async function createBankAccount(conn,h,{name,bank_name,account_no,opening_balance=0}){
 const [[mx]]=await conn.query(`SELECT MAX(CAST(SUBSTRING(code,3) AS UNSIGNED)) mx FROM accounts WHERE hospital_id=? AND code LIKE '11__' AND code<>'1100'`,[h]);
 const next=(mx.mx||0)+1; const code='11'+String(next).padStart(2,'0');
 const [acc]=await conn.query(`INSERT INTO accounts(hospital_id,code,name,account_type) VALUES(?,?,?,?)`,[h,code,name,'ASSET']);
 const [ba]=await conn.query(`INSERT INTO bank_accounts(hospital_id,account_id,name,bank_name,account_no,opening_balance) VALUES(?,?,?,?,?,?)`,[h,acc.insertId,name,bank_name||null,account_no||null,opening_balance||0]);
 if(Number(opening_balance)>0){
  const ids=await accountIds(conn,h); const capital=ids['3000'];
  if(capital) await postJournal(conn,{hospital_id:h,reference_type:'OPENING_BALANCE',reference_id:ba.insertId,narration:`Opening balance — ${name}`,items:[{account_id:acc.insertId,debit:opening_balance},{account_id:capital,credit:opening_balance}]});
 }
 return {id:ba.insertId,account_id:acc.insertId,code};
}
module.exports={postJournal,accountIds,accountBalance,createBankAccount,resolveHospitalId,ensureCoreAccounts};
