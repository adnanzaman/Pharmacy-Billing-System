import React, { useEffect, useMemo, useState } from 'react';
import { API, getErrorMessage } from '../common';
import { fmtDate, printHtml, reportHtml, rs, exportExcel } from './format.js';
import { message } from 'antd';

const today = () => new Date().toISOString().slice(0,10);
const start = () => { const d=new Date(); d.setDate(1); return d.toISOString().slice(0,10); };
const useRange = () => { const [from,setFrom]=useState(start); const [to,setTo]=useState(today); return {from,to,setFrom,setTo}; };

function Toolbar({from,to,setFrom,setTo,party,setParty,excel,print,title}) {
  return <div className="party-report-toolbar">
    <div className="party-period"><b>This Month⌄</b><span className="between">Between</span><input type="date" value={from} onChange={e=>setFrom(e.target.value)}/><span>To</span><input type="date" value={to} onChange={e=>setTo(e.target.value)}/></div>
    {setParty && <select value={party} onChange={e=>setParty(e.target.value)}><option value="">All parties</option></select>}
    <div className="report-toolbar-spacer"/><button className="top-action excel" onClick={excel}>▧<small>Excel Report</small></button><button className="top-action" onClick={print}>▣<small>Print</small></button>
  </div>;
}

function TableReport({title, columns, rows, footer, loading, toolbar, search=true}) {
  const [q,setQ]=useState('');
  const filtered=useMemo(()=>!q?rows:rows.filter(r=>Object.values(r).join(' ').toLowerCase().includes(q.toLowerCase())),[rows,q]);
  return <div className="party-report-screen"><Toolbar {...toolbar}/><div className="party-report-card"><div className="party-search">⌕<input value={q} onChange={e=>setQ(e.target.value)} placeholder={search?'':'Search'}/></div><div className="party-table-wrap" data-loading={loading?'true':'false'}><table className="x-report-table party-table"><thead><tr><th>#</th>{columns.map(c=><th key={c.dataIndex}>{c.title}<span className="filter-icon">⌕</span></th>)}</tr></thead><tbody>{filtered.map((r,i)=><tr key={r.id||`${i}-${r.party_name||r.name}`} className="party-row"><td>{i+1}</td>{columns.map(c=><td key={c.dataIndex} className={c.amount?'amount':''}>{c.render?c.render(r[c.dataIndex],r):(r[c.dataIndex] ?? '---')}</td>)}</tr>)}{!filtered.length&&<tr><td colSpan={columns.length+1} className="empty-cell">No records found for the selected filters.</td></tr>}</tbody>{footer&&<tfoot><tr><td></td>{columns.map(c=><td key={c.dataIndex} className={c.amount?'amount':''}>{footer[c.dataIndex] ?? ''}</td>)}</tr></tfoot>}</table></div></div></div>;
}

export function PartyStatementReport(){
  const {from,to,setFrom,setTo}=useRange(); const [party,setParty]=useState(''); const [data,setData]=useState({rows:[],totals:{}}); const [loading,setLoading]=useState(false);
  const load=async()=>{if(from>to)return message.warning('From date cannot be after To date');setLoading(true);try{setData((await API.get('/reports/party-statement',{params:{from,to,party}})).data)}catch(e){message.error(getErrorMessage(e))}finally{setLoading(false)}}; useEffect(()=>{load()},[from,to,party]);
  const cols=[{title:'DATE',dataIndex:'date',render:v=>fmtDate(v)},{title:'PARTICULARS',dataIndex:'particulars'},{title:'PARTY NAME',dataIndex:'party_name'},{title:'DEBIT',dataIndex:'debit',amount:true,render:rs},{title:'CREDIT',dataIndex:'credit',amount:true,render:rs},{title:'BALANCE',dataIndex:'balance',amount:true,render:rs}];
  const footer={debit:rs(data.totals.debit),credit:rs(data.totals.credit),balance:rs(data.totals.balance)};
  const excel=()=>exportExcel('party-statement',cols.map(c=>({...c,csv:(v,r)=>c.amount?rs(v):(c.render?c.render(v,r):v)})),data.rows,footer,'Party Statement');
  const print=()=>printHtml(reportHtml({title:'Party Statement',subtitle:`${fmtDate(from)} to ${fmtDate(to)}`,columns:cols,rows:data.rows,footer}));
  return <TableReport title="Party Statement" columns={cols} rows={data.rows} footer={footer} loading={loading} toolbar={{from,to,setFrom,setTo,party,setParty,excel,print}}/>;
}

export function PartyWiseProfitLossReport(){
  const {from,to,setFrom,setTo}=useRange(); const [party,setParty]=useState(''); const [data,setData]=useState({rows:[],totals:{}}); const [loading,setLoading]=useState(false);
  const load=async()=>{if(from>to)return message.warning('From date cannot be after To date');setLoading(true);try{setData((await API.get('/reports/party-wise-profit-loss',{params:{from,to,party}})).data)}catch(e){message.error(getErrorMessage(e))}finally{setLoading(false)}}; useEffect(()=>{load()},[from,to,party]);
  const cols=[{title:'PARTY NAME',dataIndex:'party_name'},{title:'SALE AMOUNT',dataIndex:'sale_amount',amount:true,render:rs},{title:'PURCHASE AMOUNT',dataIndex:'purchase_amount',amount:true,render:rs},{title:'PROFIT (+) / LOSS (-)',dataIndex:'profit_loss',amount:true,render:v=><span className={Number(v)<0?'negative':'positive'}>{rs(v)}</span>}];
  const footer={sale_amount:rs(data.totals.sale_amount),purchase_amount:rs(data.totals.purchase_amount),profit_loss:rs(data.totals.profit_loss)};
  const excel=()=>exportExcel('party-wise-profit-loss',cols,data.rows,footer,'Party Wise Profit & Loss'); const print=()=>printHtml(reportHtml({title:'Party Wise Profit & Loss',subtitle:`${fmtDate(from)} to ${fmtDate(to)}`,columns:cols,rows:data.rows,footer}));
  return <TableReport title="Party Wise Profit & Loss" columns={cols} rows={data.rows} footer={footer} loading={loading} toolbar={{from,to,setFrom,setTo,party,setParty,excel,print}}/>;
}

export function AllPartiesReport(){
  const [data,setData]=useState({rows:[]}); const [q,setQ]=useState(''); const [loading,setLoading]=useState(false);
  const load=async()=>{setLoading(true);try{setData((await API.get('/reports/all-parties')).data)}catch(e){message.error(getErrorMessage(e))}finally{setLoading(false)}}; useEffect(()=>{load()},[]);
  const rows=useMemo(()=>!q?data.rows:(data.rows||[]).filter(r=>Object.values(r).join(' ').toLowerCase().includes(q.toLowerCase())),[data,q]);
  const cols=[{title:'PARTY NAME',dataIndex:'name'},{title:'EMAIL',dataIndex:'email'},{title:'PHONE NO.',dataIndex:'phone'},{title:'RECEIVABLE BALANCE',dataIndex:'receivable_balance',amount:true,render:v=>v?rs(v):'---'},{title:'PAYABLE BALANCE',dataIndex:'payable_balance',amount:true,render:v=><span className={v?'negative':''}>{v?rs(v):'---' } </span>},{title:'CREDIT LIMIT',dataIndex:'credit_limit',amount:true,render:v=>v==null?'---':rs(v)}];
  const excel=()=>exportExcel('all-parties',cols,rows,null,'All Parties'); const print=()=>printHtml(reportHtml({title:'All Parties',subtitle:'All customers and suppliers',columns:cols,rows}));
  return <div className="party-report-screen"><div className="party-report-toolbar compact"><label className="date-filter"><input type="checkbox"/> Date Filter</label><select><option>All parties</option></select><div className="report-toolbar-spacer"/><button className="top-action excel" onClick={excel}>▧<small>Excel Report</small></button><button className="top-action" onClick={print}>▣<small>Print</small></button></div><div className="party-report-card"><div className="party-search">⌕<input value={q} onChange={e=>setQ(e.target.value)}/></div><div className="party-table-wrap" data-loading={loading?'true':'false'}><table className="x-report-table party-table"><thead><tr><th>✓</th><th>#</th>{cols.map(c=><th key={c.dataIndex}>{c.title}<span className="filter-icon">⌕</span></th>)}</tr></thead><tbody>{rows.map((r,i)=><tr className="party-row selected" key={`${r.party_type}-${r.id}`}><td>✓</td><td>{i+1}</td>{cols.map(c=><td key={c.dataIndex} className={c.amount?'amount':''}>{c.render?c.render(r[c.dataIndex],r):r[c.dataIndex]||'---'}</td>)}</tr>)}{!rows.length&&<tr><td colSpan="8" className="empty-cell">No parties found.</td></tr>}</tbody></table></div></div></div>;
}

export function PartyReportByItem(){
  const {from,to,setFrom,setTo}=useRange(); const [party,setParty]=useState(''); const [data,setData]=useState({rows:[],totals:{}}); const [loading,setLoading]=useState(false);
  const load=async()=>{if(from>to)return message.warning('From date cannot be after To date');setLoading(true);try{setData((await API.get('/reports/party-report-by-item',{params:{from,to,party}})).data)}catch(e){message.error(getErrorMessage(e))}finally{setLoading(false)}}; useEffect(()=>{load()},[from,to,party]);
  const cols=[{title:'PARTY NAME',dataIndex:'party_name'},{title:'SALE QUANTITY',dataIndex:'sale_quantity',amount:true},{title:'SALE AMOUNT',dataIndex:'sale_amount',amount:true,render:rs},{title:'PURCHASE QUANTITY',dataIndex:'purchase_quantity',amount:true},{title:'PURCHASE AMOUNT',dataIndex:'purchase_amount',amount:true,render:rs}];
  const footer={sale_quantity:data.totals.sale_quantity,sale_amount:rs(data.totals.sale_amount),purchase_quantity:data.totals.purchase_quantity,purchase_amount:rs(data.totals.purchase_amount)};
  const excel=()=>exportExcel('party-report-by-item',cols,data.rows,footer,'Party Report By Item'); const print=()=>printHtml(reportHtml({title:'Party Report By Item',subtitle:`${fmtDate(from)} to ${fmtDate(to)}`,columns:cols,rows:data.rows,footer}));
  return <TableReport columns={cols} rows={data.rows} footer={footer} loading={loading} toolbar={{from,to,setFrom,setTo,party,setParty,excel,print}}/>;
}

export function SalePurchaseByParty(){
  const {from,to,setFrom,setTo}=useRange(); const [party,setParty]=useState(''); const [data,setData]=useState({rows:[],totals:{}}); const [loading,setLoading]=useState(false);
  const load=async()=>{if(from>to)return message.warning('From date cannot be after To date');setLoading(true);try{setData((await API.get('/reports/sale-purchase-by-party',{params:{from,to,party}})).data)}catch(e){message.error(getErrorMessage(e))}finally{setLoading(false)}}; useEffect(()=>{load()},[from,to,party]);
  const cols=[{title:'PARTY NAME',dataIndex:'party_name'},{title:'SALE AMOUNT',dataIndex:'sale_amount',amount:true,render:v=><span className="positive">{rs(v)}</span>},{title:'PURCHASE AMOUNT',dataIndex:'purchase_amount',amount:true,render:v=><span className="negative">{rs(v)}</span>}];
  const footer={sale_amount:rs(data.totals.sale_amount),purchase_amount:rs(data.totals.purchase_amount)};
  const excel=()=>exportExcel('sale-purchase-by-party',cols,data.rows,footer,'Sale Purchase By Party'); const print=()=>printHtml(reportHtml({title:'Sale Purchase By Party',subtitle:`${fmtDate(from)} to ${fmtDate(to)}`,columns:cols,rows:data.rows,footer}));
  return <TableReport columns={cols} rows={data.rows} footer={footer} loading={loading} toolbar={{from,to,setFrom,setTo,party,setParty,excel,print}}/>;
}
