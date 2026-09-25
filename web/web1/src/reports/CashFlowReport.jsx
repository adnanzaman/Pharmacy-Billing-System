import React, { useEffect, useState } from 'react';
import { API, getErrorMessage } from '../common';
import { fmtDate, printHtml, reportHtml, rs, exportExcel } from './format.js';
import { message } from 'antd';

const isoToday = () => new Date().toISOString().slice(0, 10);
const monthStart = () => { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10); };

export default function CashFlowReport() {
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(isoToday);
  const [data, setData] = useState({ opening: 0, rows: [], totalIn: 0, totalOut: 0, net: 0 });
  const [loading, setLoading] = useState(false);
  const load = async () => {
    if (from > to) return message.warning('From date cannot be after To date');
    setLoading(true);
    try { setData((await API.get('/reports/cash-flow', { params: { from, to } })).data); }
    catch (e) { message.error(getErrorMessage(e)); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [from, to]);
  const columns=[{ title:'Date',dataIndex:'date'},{title:'Particulars',dataIndex:'particulars'},{title:'Type',dataIndex:'type'},{title:'Amount',dataIndex:'amount',print:rs},{title:'Balance',dataIndex:'balance',print:rs}];
  const exportReport=()=>exportExcel('cash-flow',columns,data.rows,null,'Cash Flow');
  const printReport = () => printHtml(reportHtml({
    title: 'Cash Flow', subtitle: `${fmtDate(from)} to ${fmtDate(to)}`,
    columns, rows: data.rows
  }));
  return <div className="report-screen">
    <div className="cashflow-head report-toolbar">
      <div className="period-select">This Month⌄</div>
      <div className="report-date-range"><strong>Between</strong><input type="date" value={from} onChange={e => setFrom(e.target.value)} /><span>To</span><input type="date" value={to} onChange={e => setTo(e.target.value)} /></div>
      <select className="firm-select"><option>ALL FIRMS</option></select><div className="report-toolbar-spacer" />
      <button className="report-icon-btn" title="Excel" onClick={exportReport}>▧</button><button className="report-icon-btn" onClick={printReport} title="Print">▣</button>
    </div>
    <div className="cash-opening">Opening Cash-in Hand: <b>{rs(data.opening)}</b><label><input type="checkbox" /> Show zero amount transaction</label></div>
    <div className="report-content cash-content">
      <div className="cash-search"><span>⌕</span><input placeholder="" /></div>
      <div className="report-table-wrap loading-wrap" data-loading={loading ? 'true' : 'false'}>
        <table className="x-report-table cash-table">
          <thead><tr><th>Date ⇅</th><th>Particulars ⇅</th><th>Type ⇅</th><th>Cash In ⇅</th><th>Cash Out ⇅</th><th>Running C... ⇅</th><th>Print / Sh...</th></tr></thead>
          <tbody>
            <tr><td>{fmtDate(from)}</td><td>Opening Balance</td><td>--</td><td></td><td></td><td className="balance">{rs(data.opening)}</td><td></td></tr>
            {data.rows.map(r => <tr key={r.id}><td>{fmtDate(r.date)}</td><td>{r.particulars}</td><td><span className={`cash-tag ${r.type === 'Inflow' ? 'in' : 'out'}`}>{r.type}</span></td><td className="amount positive">{r.type === 'Inflow' ? rs(r.amount) : ''}</td><td className="amount negative">{r.type === 'Outflow' ? rs(r.amount) : ''}</td><td className="balance">{rs(r.balance)}</td><td><button className="row-icon">▣</button><button className="row-icon">⌁</button><button className="row-icon">⋮</button></td></tr>)}
            {!data.rows.length && <tr><td colSpan="7" className="empty-cell">No cash transactions found.</td></tr>}
          </tbody>
          <tfoot><tr><td colSpan="3">Total Inflow<br /><b className="positive">{rs(data.totalIn)}</b></td><td colSpan="2">Total Outflow<br /><b className="negative">{rs(data.totalOut)}</b></td><td colSpan="2">Net Cash Flow<br /><b className="positive">{rs(data.net)}</b></td></tr></tfoot>
        </table>
      </div>
    </div>
  </div>;
}
