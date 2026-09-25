import React, { useEffect, useMemo, useState } from 'react';
import { API, getErrorMessage } from '../common';
import { fmtDate, printHtml, reportHtml, rs, exportExcel } from './format.js';
import { message } from 'antd';

const isoToday = () => (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();
const yearStart = () => `${new Date().getFullYear()}-01-01`;

export default function BalanceSheetReport() {
  const [from, setFrom] = useState(yearStart);
  const [to, setTo] = useState(isoToday);
  const [vertical, setVertical] = useState(false);
  const [data, setData] = useState({ Assets: [], Liabilities: [], Equity: [], totals: {} });
  const load = async () => { if (from > to) return message.warning('From date cannot be after To date'); try { setData((await API.get('/accounting/balance-sheet', { params: { from, to } })).data); } catch (e) { message.error(getErrorMessage(e)); } };
  useEffect(() => { load(); }, [from, to]);
  const assetRows = useMemo(() => data.Assets || [], [data]);
  const liabilityRows = useMemo(() => data.Liabilities || [], [data]);
  const equityRows = useMemo(() => data.Equity || [], [data]);
  const renderSection = (title, rows, total, cls='') => <div className={`bs-section ${cls}`}><h2>{title}</h2>{rows.map(r => <div className="bs-account" key={r.code}><span>• &nbsp;{r.name}</span><b>{rs(r.balance)}</b></div>)}<div className="bs-total"><span>Total {title}</span><b>{rs(total)}</b></div></div>;
  const exportReport=()=>exportExcel('balance-sheet',[{title:'Account',dataIndex:'name'},{title:'Amount',dataIndex:'balance',csv:rs}],[...assetRows,...liabilityRows,...equityRows],null,'Balance Sheet');
  const printReport = () => printHtml(reportHtml({ title: 'Balance Sheet', subtitle: `As on ${fmtDate(to)}`, columns: [{ title: 'Account', dataIndex: 'name' }, { title: 'Amount', dataIndex: 'balance', print: rs }], rows: [...assetRows, ...liabilityRows, ...equityRows] }));
  return <div className="report-screen">
    <div className="bs-toolbar"><div className="bs-period"><span>Period :</span><select><option>Custom</option></select><div className="trial-date"><span>▣</span><input type="date" value={from} onChange={e => setFrom(e.target.value)} /><span>To</span><input type="date" value={to} onChange={e => setTo(e.target.value)} /></div></div><div className="bs-actions"><span>Horizontal</span><button className={`toggle ${!vertical ? 'on' : ''}`} onClick={() => setVertical(false)}><i /></button><span>Vertical</span><button className="export-small" onClick={printReport}>Pdf</button><button className="export-small" onClick={exportReport}>Xls</button><button className="export-small" onClick={printReport}>▣</button></div></div>
    <h1 className="bs-title">Balance Sheet as on {new Date(`${to}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</h1>
    {vertical ? <div className="bs-vertical">{renderSection('Assets', assetRows, data.totals?.Assets || 0)}{renderSection('Liabilities', liabilityRows, data.totals?.Liabilities || 0)}{renderSection('Equity', equityRows, data.totals?.Equity || 0)}</div> : <div className="bs-columns"><div>{renderSection('Assets', assetRows, data.totals?.Assets || 0)}</div><div>{renderSection('Equities & Liabilities', [...liabilityRows, ...equityRows], (data.totals?.Liabilities || 0) + (data.totals?.Equity || 0))}</div></div>}
    <div className="bs-grand"><span>Total Assets</span><b>{rs(data.totals?.Assets || 0)}</b><span>Total Liabilities & Equity</span><b>{rs((data.totals?.Liabilities || 0) + (data.totals?.Equity || 0))}</b></div>
  </div>;
}
