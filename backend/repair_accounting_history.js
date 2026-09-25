require('dotenv').config();
const pool=require('./src/config/db');
const {ensureCoreAccounts,accountIds,postJournal}=require('./src/services_accounting');

async function rebuildHospital(conn,h){
  await ensureCoreAccounts(conn,h);
  // Rebuild only transaction journal types that can be reconstructed from source tables.
  await conn.query(`DELETE FROM journal_entries WHERE hospital_id=? AND reference_type IN ('SALE','PURCHASE','SALE_RETURN','PURCHASE_RETURN','PAYMENT','EXPENSE','OPENING_BALANCE')`,[h]);
  const ids=await accountIds(conn,h);
  const cash=ids['1000'], bank=ids['1100'], ar=ids['1050'], ap=ids['2000'], inv=ids['1200'], sales=ids['4000'], cogs=ids['5000'], expense=ids['6000'], capital=ids['3000'];
  const bankFor=async(bankId)=>{ if(!bankId) return bank; const [[r]]=await conn.query(`SELECT account_id FROM bank_accounts WHERE id=? AND hospital_id=?`,[bankId,h]); return r?.account_id||bank; };

  const [purchases]=await conn.query(`SELECT * FROM purchase_invoices WHERE hospital_id=?`,[h]);
  for(const p of purchases){
    const [[a]]=await conn.query(`SELECT COALESCE(SUM(amount),0) v FROM payment_allocations WHERE invoice_type='PURCHASE' AND invoice_id=?`,[p.id]);
    const initialPaid=Math.max(0,Number(p.paid)-Number(a.v||0));
    const payAcc=await bankFor(p.bank_account_id && p.payment_method==='Bank' ? p.bank_account_id : null);
    if(inv&&ap&&payAcc) await postJournal(conn,{hospital_id:h,reference_type:'PURCHASE',reference_id:p.id,narration:`Purchase ${p.invoice_no||p.id}`,items:[{account_id:inv,debit:Number(p.net_total)},{account_id:payAcc,credit:initialPaid},{account_id:ap,credit:Number(p.net_total)-initialPaid}].filter(x=>Math.abs(Number(x.debit||x.credit))>0.009)});
  }

  const [salesRows]=await conn.query(`SELECT * FROM sales_invoices WHERE hospital_id=?`,[h]);
  for(const s of salesRows){
    const [[a]]=await conn.query(`SELECT COALESCE(SUM(amount),0) v FROM payment_allocations WHERE invoice_type='SALE' AND invoice_id=?`,[s.id]);
    const initialPaid=Math.max(0,Number(s.paid)-Number(a.v||0));
    const payAcc=s.payment_method==='Bank'?bank:cash;
    const [[c]]=await conn.query(`SELECT COALESCE(SUM(qty*cost_price),0) v FROM sale_items WHERE sale_id=?`,[s.id]);
    const due=Number(s.net_total)-initialPaid;
    if(payAcc&&sales&&inv&&cogs){
      const items=[]; if(initialPaid>0) items.push({account_id:payAcc,debit:initialPaid}); if(due>0.009&&ar) items.push({account_id:ar,debit:due});
      items.push({account_id:sales,credit:Number(s.net_total)},{account_id:inv,debit:Number(c.v)},{account_id:cogs,credit:Number(c.v)});
      await postJournal(conn,{hospital_id:h,reference_type:'SALE',reference_id:s.id,narration:`Pharmacy sale ${s.invoice_no}`,items});
    }
  }

  const [payments]=await conn.query(`SELECT * FROM payments WHERE hospital_id=?`,[h]);
  for(const p of payments){
    const [[a]]=await conn.query(`SELECT COALESCE(SUM(amount),0) v FROM payment_allocations WHERE payment_id=?`,[p.id]);
    const applied=Number(a.v||0); if(applied<=0.009) continue;
    const payAcc=p.payment_method==='Bank'?await bankFor(p.bank_account_id):cash;
    const contra=p.party_type==='PATIENT'?ar:ap;
    if(!payAcc||!contra) continue;
    const items=p.party_type==='PATIENT'?[{account_id:payAcc,debit:applied},{account_id:contra,credit:applied}]:[{account_id:contra,debit:applied},{account_id:payAcc,credit:applied}];
    await postJournal(conn,{hospital_id:h,reference_type:'PAYMENT',reference_id:p.id,narration:p.notes||`Payment ${p.party_type==='PATIENT'?'received':'made'}`,items});
  }

  const [expenses]=await conn.query(`SELECT * FROM expenses WHERE hospital_id=?`,[h]);
  for(const e of expenses){ const payAcc=e.payment_method==='Bank'?bank:cash; if(expense&&payAcc) await postJournal(conn,{hospital_id:h,reference_type:'EXPENSE',reference_id:e.id,narration:e.description||e.category,items:[{account_id:expense,debit:Number(e.amount)},{account_id:payAcc,credit:Number(e.amount)}]}); }

  const [sreturns]=await conn.query(`SELECT * FROM sale_returns WHERE hospital_id=?`,[h]);
  for(const r of sreturns){ const [[c]]=await conn.query(`SELECT COALESCE(SUM(qty*cost_price),0) v FROM sale_return_items WHERE sale_return_id=?`,[r.id]); const items=[]; if(inv&&cogs){items.push({account_id:inv,debit:Number(c.v)},{account_id:cogs,credit:Number(c.v)});} if(Number(r.refund_amount||0)>0&&sales){items.push({account_id:sales,debit:Number(r.refund_amount)}); const [[sale]]=await conn.query(`SELECT payment_method FROM sales_invoices WHERE id=?`,[r.sale_id]); const payAcc=sale?.payment_method==='Bank'?bank:cash; if(payAcc) items.push({account_id:payAcc,credit:Number(r.refund_amount)}); else if(ar) items.push({account_id:ar,credit:Number(r.refund_amount)});} if(items.length) await postJournal(conn,{hospital_id:h,reference_type:'SALE_RETURN',reference_id:r.id,narration:`Sale return ${r.return_no}`,items}); }

  const [preturns]=await conn.query(`SELECT * FROM purchase_returns WHERE hospital_id=?`,[h]);
  for(const r of preturns){ const [[x]]=await conn.query(`SELECT COALESCE(SUM(total),0) v FROM purchase_return_items WHERE purchase_return_id=?`,[r.id]); if(ap&&inv&&Number(x.v)>0.009) await postJournal(conn,{hospital_id:h,reference_type:'PURCHASE_RETURN',reference_id:r.id,narration:`Purchase return ${r.return_no}`,items:[{account_id:ap,debit:Number(x.v)},{account_id:inv,credit:Number(x.v)}]}); }
}

(async()=>{const conn=await pool.getConnection();try{await conn.beginTransaction();const [hs]=await conn.query('SELECT id FROM hospitals');for(const h of hs) await rebuildHospital(conn,h.id);await conn.commit();console.log('Accounting history rebuilt for',hs.length,'hospital(s).');}catch(e){await conn.rollback();console.error(e);process.exitCode=1;}finally{conn.release();await pool.end();}})();
