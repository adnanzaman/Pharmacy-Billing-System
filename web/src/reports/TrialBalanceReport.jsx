import React, { useEffect, useMemo, useState } from 'react';
import { API, getErrorMessage } from '../common';
import { fmtDate, printHtml, reportHtml, rs, exportExcel } from './format.js';
import { message } from 'antd';

const isoToday = () => (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();
const yearStart = () => `${new Date().getFullYear()}-01-01`;

export default function TrialBalanceReport() {
  const [from, setFrom] = useState(yearStart);
  const [to, setTo] = useState(isoToday);
  const [showWorking, setShowWorking] = useState(false);
  const [showZero, setShowZero] = useState(false);
  const [data, setData] = useState({ rows: [] });
  const load = async () => {
    if (from > to) return message.warning('From date cannot be after To date');
    try { setData((await API.get('/accounting/trial-balance', { params: { from, to } })).data); }
    catch (e) { message.error(getErrorMessage(e)); }
  };
  useEffect(() => { load(); }, [from, to]);
  const groups = useMemo(() => {
    const map = { Assets: [], 'Equities & Liabilities': [] };
    (data.rows || []).forEach(r => {
      const debit = Number(r.debit || 0), credit = Number(r.credit || 0);
      if (!showZero && debit === 0 && credit === 0) return;
      const key = r.account_type === 'ASSET' ? 'Assets' : 'Equities & Liabilities';
      map[key].push({ ...r, debit, credit });
    });
    return map;
  }, [data, showZero]);
  const flat = [...groups.Assets, ...groups['Equities & Liabilities']];
  const exportReport=()=>exportExcel('trial-balance-report',[{title:'Account',dataIndex:'name'},{title:'Debit',dataIndex:'debit',csv:rs},{title:'Credit',dataIndex:'credit',csv:rs}],flat.map(r=>({name:r.name,debit:rs(r.debit),credit:rs(r.credit)})),null,'Trial Balance Report');
  const printReport = () => printHtml(reportHtml({ title: 'Trial Balance Report', subtitle: `${fmtDate(from)} to ${fmtDate(to)}`, columns: [{ title: 'Account', dataIndex: 'name' }, { title: 'Debit', dataIndex: 'debit', print: rs }, { title: 'Credit', dataIndex: 'credit', print: rs }], rows: flat }));
  const total = arr => arr.reduce((a, r) => ({ debit: a.debit + r.debit, credit: a.credit + r.credit }), { debit: 0, credit: 0 });
  const renderGroup = (title, rows) => { const t = total(rows); return <><tr className="group-row"><td colSpan="3">{title}</td></tr>{rows.map(r => <tr key={r.code}><td className="indent">{r.name}</td><td className="amount">{r.debit ? rs(r.debit) : '--'}</td><td className="amount">{r.credit ? rs(r.credit) : '--'}</td></tr>)}<tr className="subtotal-row"><td>Total {title}</td><td className="amount">{rs(t.debit)}</td><td className="amount">{rs(t.credit)}</td></tr></>; };
  return <div className="report-screen">
    <div className="trial-title"><h1>Trial Balance Report</h1><div className="export-actions"><button onClick={printReport}>Pdf</button><button onClick={exportReport}>Xls</button></div></div>
    <div className="trial-controls"><span>Period:</span><select><option>Custom</option></select><div className="trial-date"><span>▣</span><input type="date" value={from} onChange={e => setFrom(e.target.value)} /><span>To</span><input type="date" value={to} onChange={e => setTo(e.target.value)} /></div><label><input type="checkbox" checked={showWorking} onChange={e => setShowWorking(e.target.checked)} /> Show working trial balance</label><label><input type="checkbox" checked={showZero} onChange={e => setShowZero(e.target.checked)} /> Show 0 balances account</label><button className="trial-print" onClick={printReport}>▣</button></div>
    <div className="collapse-link">⌃ <span>Collapse all accounts</span></div>
    <div className="trial-table-wrap"><table className="x-report-table trial-table"><thead><tr><th>ACCOUNT</th><th colSpan="2">CLOSING BALANCE</th></tr><tr><th></th><th>DEBIT</th><th>CREDIT</th></tr></thead><tbody>{renderGroup('Assets', groups.Assets)}{renderGroup('Equities & Liabilities', groups['Equities & Liabilities'])}</tbody></table></div>
  </div>;
}
