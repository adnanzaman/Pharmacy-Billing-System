import React, { useEffect, useMemo, useState } from 'react';
import { API, getErrorMessage } from '../common';
import { fmtDate, printHtml, reportHtml, rs, exportExcel } from './format.js';
import { message } from 'antd';

const isoToday = () => new Date().toISOString().slice(0, 10);
const monthStart = () => { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10); };

export default function BillWiseProfitReport() {
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(isoToday);
  const [party, setParty] = useState('');
  const [data, setData] = useState({ rows: [], totals: {} });
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState(null);

  const load = async () => {
    if (from > to) return message.warning('From date cannot be after To date');
    setLoading(true);
    try { setData((await API.get('/reports/bill-wise-profit', { params: { from, to, party } })).data); }
    catch (e) { message.error(getErrorMessage(e)); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [from, to, party]);

  const columns = [
      { title: 'Date', dataIndex: 'date' }, { title: 'Bill No', dataIndex: 'invoice_no' },
      { title: 'Party', dataIndex: 'party_name' }, { title: 'Sale Amount', dataIndex: 'sale_amount', print: rs },
      { title: 'Purchase Amount', dataIndex: 'purchase_amount', print: rs }, { title: 'Profit / Loss', dataIndex: 'profit_loss', print: rs }
    ];
  const exportReport = () => exportExcel('bill-wise-profit', columns, data.rows, { sale_amount: rs(totals.sale_amount), purchase_amount: rs(totals.purchase_amount), profit_loss: rs(totals.profit_loss) }, 'Bill Wise Profit');
  const printReport = () => printHtml(reportHtml({
    title: 'Bill Wise Profit', subtitle: `${fmtDate(from)} to ${fmtDate(to)}`,
    columns, rows: data.rows
  }));

  const totals = useMemo(() => data.totals || {}, [data]);
  const detailCost = detail ? (detail.items || []).reduce((a,i)=>a+Number(i.qty||0)*Number(i.cost_price||0),0) : 0;
  const detailTax = detail ? (detail.items || []).reduce((a,i)=>a+Number(i.tax||0)+Number(i.cess||0),0) : 0;
  return <div className="report-screen">
    <div className="report-toolbar">
      <div className="report-date-range">
        <span>From</span><input type="date" value={from} onChange={e => setFrom(e.target.value)} />
        <span>To</span><input type="date" value={to} onChange={e => setTo(e.target.value)} />
      </div>
      <div className="report-toolbar-spacer" />
      <button className="report-icon-btn" onClick={exportReport} title="Excel Export">⇩</button>
      <button className="report-icon-btn" onClick={printReport} title="Print">▣</button>
    </div>
    <div className="report-content">
      <h1>Bill Wise Profit</h1>
      <div className="report-filter-line"><span>FILTERS</span><input className="party-filter" placeholder="Party filter" value={party} onChange={e => setParty(e.target.value)} /></div>
      <div className="report-table-wrap loading-wrap" data-loading={loading ? 'true' : 'false'}>
        <table className="x-report-table">
          <thead><tr><th>Date ⇅</th><th>Bill No ⇅</th><th>Party ⏷</th><th>Sale Amount ⇅</th><th>Purchase Amount ⇅</th><th>Profit / Loss ⇅</th><th>Details</th></tr></thead>
          <tbody>
            {data.rows.map(r => <tr key={r.id}>
              <td>{fmtDate(r.date)}</td><td>{r.invoice_no}</td><td>{r.party_name}</td>
              <td className="amount">{rs(r.sale_amount)}</td><td className="amount">{rs(r.purchase_amount)}</td>
              <td className={`amount ${Number(r.profit_loss) < 0 ? 'negative' : 'positive'}`}>{rs(r.profit_loss)}</td><td><button className="show-link" onClick={async()=>{try{const d=(await API.get(`/sales/${r.id}`)).data;setDetail(d)}catch(e){message.error(getErrorMessage(e))}}}>Show &gt;</button></td>
            </tr>)}
            {!data.rows.length && <tr><td colSpan="7" className="empty-cell">No transactions found for the selected period.</td></tr>}
          </tbody>
          <tfoot><tr><td colSpan="3">Total</td><td className="amount">{rs(totals.sale_amount)}</td><td className="amount">{rs(totals.purchase_amount)}</td><td className="amount positive">{rs(totals.profit_loss)}</td><td /></tr></tfoot>
        </table>
      </div>
    </div>
    {detail && <div className="invoice-modal-backdrop" onClick={()=>setDetail(null)}><div className="invoice-modal" onClick={e=>e.stopPropagation()}><button className="invoice-close" onClick={()=>setDetail(null)}>×</button><h2>Invoice #{detail.invoice_no} - {detail.patient_name || 'Customer'}</h2><h3>Cost Calculation</h3><table><thead><tr><th>ITEM NAME</th><th>QUANTITY</th><th>PURCHASE PRICE</th><th>TOTAL COST</th></tr></thead><tbody>{(detail.items||[]).map(i=><tr key={i.id}><td>{i.medicine_name}</td><td>{i.qty}</td><td>{rs(i.cost_price || 0)}</td><td>{rs(Number(i.qty||0)*Number(i.cost_price||0))}</td></tr>)}</tbody></table><div className="invoice-summary"><span>Sale Amount</span><b>{rs(detail.net_total)}</b><span>Total Cost</span><b>{rs(detailCost)}</b><span>Tax Payable</span><b>{rs(detailTax)}</b><span>TDS Receivable</span><b>{rs(0)}</b><strong>Profit (Sale Amount - Total Cost - Tax Payable + TDS Receivable)</strong><strong>{rs(Number(detail.net_total||0)-detailCost-detailTax)}</strong><strong>Profit (Excluding Additional Charges)</strong><strong>{rs(Number(detail.net_total||0)-detailCost)}</strong></div></div></div>}
  </div>;
}
