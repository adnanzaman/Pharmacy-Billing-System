import React, { useEffect, useMemo, useState } from 'react';
import { API, getErrorMessage } from '../common';
import { fmtDate, printHtml, reportHtml, rs, exportExcel } from './format.js';
import { message } from 'antd';

const today = () => (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();
const monthStart = () => (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`; })();
const useRange = () => { const [from,setFrom]=useState(monthStart); const [to,setTo]=useState(today); return {from,to,setFrom,setTo}; };
const num = v => Number(v || 0);

const money = v => rs(v);
const qty = v => num(v).toLocaleString('en-US', { maximumFractionDigits: 3 });

const REPORTS = {
  stock_summary: {
    title: 'Stock Summary',
    static: true,
    columns: [
      ['item_name','Item Name'], ['minimum_stock_qty','Minimum Stock Qty'], ['stock_qty','Stock Qty'], ['stock_value','Stock Value',money]
    ]
  },
  item_report_by_party: {
    title: 'Item Report By Party',
    columns: [['item_name','Item Name'],['sale_quantity','Sale Quantity',qty],['sale_amount','Sale Amount',money],['purchase_quantity','Purchase Quantity',qty],['purchase_amount','Purchase Amount',money]]
  },
  item_wise_profit_loss: {
    title: 'Item Wise Profit And Loss',
    columns: [['item_name','Item Name'],['sale','Sale',money],['credit_note','Cr. Note / Sale Return',money],['purchase','Purchase',money],['debit_note','Dr. Note / Purchase Return',money],['opening_quantity','Opening Stock',qty],['closing_quantity','Closing Stock',qty],['tax_receivable','Tax Receivable',money],['tax_payable','Tax Payable',money],['manufacturing_cost','Mfg. Cost',money],['consumption_cost','Consumption Cost',money],['net_profit_loss','Net Profit/Loss',money]]
  },
  item_category_wise_profit_loss: {
    title: 'Item Category Wise Profit And Loss',
    columns: [['category_name','Category Name'],['sale','Sale',money],['credit_note','Cr. Note / Sale Return',money],['purchase','Purchase',money],['debit_note','Dr. Note / Purchase Return',money],['opening_quantity','Opening Stock',qty],['closing_quantity','Closing Stock',qty],['tax_receivable','Tax Receivable',money],['tax_payable','Tax Payable',money],['manufacturing_cost','Mfg. Cost',money],['consumption_cost','Consumption Cost',money],['net_profit_loss','Net Profit/Loss',money]]
  },
  low_stock_summary: {
    title: 'Low Stock Summary', static: true,
    columns: [['item_name','Item Name'],['minimum_stock_qty','Minimum Stock Qty'],['stock_qty','Stock Qty',qty],['stock_value','Stock Value',money]]
  },
  stock_detail: {
    title: 'Stock Detail',
    columns: [['item_name','Item Name'],['beginning_quantity','Beginning Quantity',qty],['quantity_in','Quantity In',qty],['purchase_amount','Purchase Amount',money],['quantity_out','Quantity Out',qty],['sale_amount','Sale Amount',money],['closing_quantity','Closing Quantity',qty]]
  },
  item_detail: {
    title: 'Item Detail',
    columns: [['date','Date',fmtDate],['sale_quantity','Sale Quantity',qty],['purchase_quantity','Purchase Quantity',qty],['adjustment_quantity','Adjustment Quantity',qty],['closing_quantity','Closing Quantity',qty]]
  },
  sale_purchase_by_item_category: {
    title: 'Sale/Purchase Report By Item Category',
    columns: [['category_name','Item Category'],['sale_quantity','Sale Quantity',qty],['total_sale_amount','Total Sale Amount',money],['purchase_quantity','Purchase Quantity',qty],['total_purchase_amount','Total Purchase Amount',money]]
  },
  stock_summary_by_item_category: {
    title: 'Stock Summary Report By Item Category', static: true,
    columns: [['category_name','Item Category'],['stock_quantity','Stock Quantity',qty],['stock_value','Stock Value',money]]
  },
  item_wise_discount: {
    title: 'Item Wise Discount',
    columns: [['item_name','Item Name'],['total_qty_sold','Total Qty Sold',qty],['total_sale_amount','Total Sale Amount',money],['total_disc_amount','Total Disc. Amount',money],['avg_discount','Avg. Disc. (%)',v=>`${num(v).toFixed(2)}%`]]
  }
};

function Toolbar({cfg, from, to, setFrom, setTo, category, setCategory, showItems, setShowItems, item, setItem, party, setParty, onExcel, onPrint}) {
  if (cfg.static) {
    return <div className="itemstock-toolbar compact">
      <label>FILTERS</label>
      {cfg.title !== 'Stock Summary Report By Item Category' && <select value={category} onChange={e=>setCategory(e.target.value)}><option value="">All Categories</option></select>}
      {cfg.title === 'Stock Summary' && <label className="check-filter"><input type="checkbox" checked={showItems} onChange={e=>setShowItems(e.target.checked)}/> Show items in stock</label>}
      <div className="itemstock-spacer"/><button className="itemstock-icon" onClick={onExcel} title="Excel Report">▧</button><button className="itemstock-icon" onClick={onPrint} title="Print">▣</button>
    </div>;
  }
  return <div className="itemstock-toolbar">
    <div className="itemstock-dates"><span>From</span><input type="date" value={from} onChange={e=>setFrom(e.target.value)}/><span>To</span><input type="date" value={to} onChange={e=>setTo(e.target.value)}/></div>
    {cfg.title === 'Item Report By Party' && <input className="itemstock-filter" value={party} onChange={e=>setParty(e.target.value)} placeholder="Party filter" />}
    {cfg.title === 'Item Detail' && <input className="itemstock-filter" value={item} onChange={e=>setItem(e.target.value)} placeholder="Item name" />}
    
    <div className="itemstock-spacer"/><button className="itemstock-icon" onClick={onExcel} title="Excel Report">▧</button><button className="itemstock-icon" onClick={onPrint} title="Print">▣</button>
  </div>;
}

export default function ItemStockReport({type}) {
  const cfg = REPORTS[type];
  const {from,to,setFrom,setTo}=useRange();
  const [rows,setRows]=useState([]); const [loading,setLoading]=useState(false); const [category,setCategory]=useState(''); const [showItems,setShowItems]=useState(false); const [item,setItem]=useState(''); const [party,setParty]=useState(''); const [q,setQ]=useState('');

  useEffect(()=>{
    let live=true;
    if (!cfg.static && from>to) return;
    setLoading(true);
    API.get('/reports/inventory',{params:{from,to,type,category,party,show_items_in_stock:showItems?'1':'0',item}})
      .then(r=>{if(live)setRows(r.data.rows||[])})
      .catch(e=>{if(live)message.error(getErrorMessage(e))})
      .finally(()=>live&&setLoading(false));
    return ()=>{live=false};
  },[type,from,to,category,party,showItems,item]);

  const displayed=useMemo(()=>{
    const text=q.trim().toLowerCase();
    return text?rows.filter(r=>Object.values(r).join(' ').toLowerCase().includes(text)):rows;
  },[rows,q]);

  // Item Detail uses one row per active date; keep closing stock calculated cumulatively.
  const detailRows=useMemo(()=>{
    if(type!=='item_detail') return displayed;
    let balance=0;
    return displayed.map(r=>{balance += num(r.purchase_quantity)-num(r.sale_quantity)+num(r.adjustment_quantity); return {...r,closing_quantity:balance};});
  },[displayed,type]);

  const cols=cfg.columns;
  const footer=useMemo(()=>{
    const out={};
    cols.forEach(([key],i)=>{
      if(i===0) return;
      if(['date'].includes(key) || key==='avg_discount') return;
      if(displayed.some(r=>r[key]!==undefined)) out[key]=key.includes('amount')||key.includes('sale')||key.includes('purchase')||key.includes('note')||key.includes('tax')||key.includes('cost')||key.includes('profit')||key==='stock_value'||key==='total_disc_amount' ? money(displayed.reduce((a,r)=>a+num(r[key]),0)) : qty(displayed.reduce((a,r)=>a+num(r[key]),0));
    });
    return out;
  },[displayed,cols]);

  const columnDefs=cols.map(([dataIndex,title,render])=>({dataIndex,title,render,align:['item_name','category_name','date'].includes(dataIndex)?'left':'right',csv:v=>render?render(v):v,print:v=>render?render(v):v}));
  const doExcel=()=>exportExcel(type,columnDefs,detailRows,footer,cfg.title);
  const doPrint=()=>printHtml(reportHtml({title:cfg.title,subtitle:cfg.static?'':`${fmtDate(from)} to ${fmtDate(to)}`,columns:columnDefs,rows:detailRows,footer}));

  return <div className="itemstock-screen">
    <Toolbar cfg={cfg} from={from} to={to} setFrom={setFrom} setTo={setTo} category={category} setCategory={setCategory} showItems={showItems} setShowItems={setShowItems} item={item} setItem={setItem} party={party} setParty={setParty} onExcel={doExcel} onPrint={doPrint}/>
    <div className="itemstock-content">
      <div className="itemstock-title">{cfg.title}</div>
      <div className="itemstock-subtools">
        <span>DETAILS</span><div className="itemstock-spacer"/><div className="itemstock-search">⌕<input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search"/></div>
      </div>
      <div className="itemstock-table-wrap">
        <table className="itemstock-table"><thead><tr><th>#</th>{cols.map(([key,title])=><th key={key}>{title}<span className="itemstock-filter-icon">⌕</span></th>)}</tr></thead>
          <tbody>{loading ? <tr><td colSpan={cols.length+1} className="itemstock-empty">Loading...</td></tr> : detailRows.map((r,i)=><tr key={r.id||`${i}-${r.item_name||r.category_name||r.date}` }><td>{i+1}</td>{cols.map(([key,,render])=><td key={key} className={key==='item_name'||key==='category_name'||key==='date'?'':'amount'}>{render?render(r[key],r):(r[key] ?? 0)}</td>)}</tr>)}
          {!loading && !detailRows.length && <tr><td colSpan={cols.length+1} className="itemstock-empty">No records found for the selected filters.</td></tr>}</tbody>
          {!!detailRows.length && <tfoot><tr><td></td>{cols.map(([key],i)=><td key={key} className="amount">{footer[key] || (i===0?'Total':'')}</td>)}</tr></tfoot>}
        </table>
      </div>
    </div>
  </div>;
}

export { REPORTS as ITEM_STOCK_REPORTS };
