import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Input, Select, Table, message } from 'antd';
import { PrinterOutlined, SearchOutlined, ShareAltOutlined, FileExcelOutlined } from '@ant-design/icons';
import { API, getErrorMessage } from '../common';
import { ymd, rs, fmtDate, whatsappLink, exportCsv, printHtml, reportHtml } from './format.js';

/* Transaction report > Day book
   One date at a time. Sales, purchases, Payment In/Out and credit/debit notes posted that day,
   with Money In / Money Out so it reads like a daily cash diary. */

const COLUMNS_EXPORT = [
  { title: 'Name', dataIndex: 'name' },
  { title: 'Type', dataIndex: 'transaction' },
  { title: 'Payment Type', dataIndex: 'payment_type' },
  { title: 'Total', dataIndex: 'total', align: 'right', csv: v => Number(v).toFixed(2), print: v => rs(v) },
  { title: 'Money In', dataIndex: 'money_in', align: 'right', csv: v => Number(v).toFixed(2), print: v => rs(v) },
  { title: 'Money Out', dataIndex: 'money_out', align: 'right', csv: v => Number(v).toFixed(2), print: v => rs(v) }
];

export default function DayBookReport({ printSale, printPurchase }) {
  const [date, setDate] = useState(() => ymd(new Date()));
  const [data, setData] = useState({ rows: [], summary: null });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const seq = useRef(0);

  const load = useCallback(async () => {
    const mine = ++seq.current;
    setLoading(true);
    try {
      const res = await API.get('/reports/daybook', { params: { date } });
      if (mine !== seq.current) return;
      setData(res.data);
    } catch (e) {
      if (mine === seq.current) message.error(getErrorMessage(e));
    } finally {
      if (mine === seq.current) setLoading(false);
    }
  }, [date]);

  useEffect(() => { load(); }, [load]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data.rows;
    return data.rows.filter(r => [r.name, r.transaction, r.payment_type, r.total, r.money_in, r.money_out].join(' ').toLowerCase().includes(q));
  }, [data.rows, search]);

  const onPrint = async row => {
    try {
      const full = (await API.get(`/${row.transaction === 'Sale' ? 'sales' : 'purchases'}/${row.ref_id}`)).data;
      if (row.transaction === 'Sale' && printSale) printSale(full);
      if (row.transaction === 'Purchase' && printPurchase) printPurchase(full);
    } catch (e) {
      message.error(getErrorMessage(e));
    }
  };

  const onShare = async row => {
    const text = `${row.transaction} - ${row.name}\nTotal: ${rs(row.total)}\nMoney In: ${rs(row.money_in)}  Money Out: ${rs(row.money_out)}`;
    try { await navigator.clipboard.writeText(text); message.success('Details copied'); }
    catch { window.open(whatsappLink(row.phone, text), '_blank', 'noopener'); }
  };

  const exportExcel = () => exportCsv(`daybook-${date}`, COLUMNS_EXPORT, rows);
  const printList = () => {
    const s = data.summary || {};
    printHtml(reportHtml({
      title: 'Day Book',
      subtitle: fmtDate(date),
      summary: `Money In: <b>${rs(s.totalIn)}</b> &nbsp;|&nbsp; Money Out: <b>${rs(s.totalOut)}</b> &nbsp;|&nbsp; Net: <b>${rs(s.net)}</b>`,
      columns: COLUMNS_EXPORT,
      rows
    }));
  };

  const uniq = key => [...new Set(data.rows.map(r => r[key]))].map(v => ({ text: String(v), value: v }));
  const filterCol = key => ({ filters: uniq(key), filterSearch: true, onFilter: (v, r) => r[key] === v });

  const columns = [
    { title: 'Name', dataIndex: 'name', ...filterCol('name') },
    { title: 'Type', dataIndex: 'transaction', ...filterCol('transaction') },
    { title: 'Payment Type', dataIndex: 'payment_type', ...filterCol('payment_type') },
    { title: 'Total', dataIndex: 'total', align: 'right', render: rs },
    { title: 'Money In', dataIndex: 'money_in', align: 'right', render: v => (v > 0 ? <span style={{ color: '#14935a', fontWeight: 600 }}>{rs(v)}</span> : rs(v)) },
    { title: 'Money Out', dataIndex: 'money_out', align: 'right', render: v => (v > 0 ? <span style={{ color: '#d13a3a', fontWeight: 600 }}>{rs(v)}</span> : rs(v)) },
    {
      title: 'Print / Share', key: 'actions', width: 120,
      render: (_, r) => (
        <div className="rp-actions">
          <Button type="text" icon={<PrinterOutlined />} title="Print" aria-label="Print" onClick={() => onPrint(r)} />
          <Button type="text" icon={<ShareAltOutlined />} title="Share" aria-label="Share" onClick={() => onShare(r)} />
        </div>
      )
    }
  ];

  return (
    <div className="rp-page">
      <div className="rp-panel">
        <div className="rp-filter">
          <label className="rp-pill rp-pill-dates">
            <span style={{ fontWeight: 700 }}>Date</span>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} aria-label="Date" />
          </label>
          <div className="rp-pill rp-pill-select">
            <Select value="all" variant="borderless" disabled options={[{ value: 'all', label: 'All Firms' }]} aria-label="Firm" />
          </div>
        </div>
      </div>

      <div className="rp-panel">
        <div className="rp-table-head">
          <div className="rp-tools">
            {showSearch && <Input allowClear autoFocus placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 220 }} />}
            <Button type="text" icon={<SearchOutlined />} title="Search" aria-label="Search" onClick={() => { setShowSearch(v => !v); if (showSearch) setSearch(''); }} />
          </div>
          <div className="rp-tools">
            <Button type="text" icon={<FileExcelOutlined style={{ color: '#1d8a4b' }} />} title="Export to Excel (CSV)" aria-label="Export to Excel" onClick={exportExcel} />
            <Button type="text" icon={<PrinterOutlined />} title="Print report" aria-label="Print report" onClick={printList} />
          </div>
        </div>
        <Table
          className="rp-table"
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={rows}
          pagination={{ pageSize: 20, hideOnSinglePage: true, showSizeChanger: false }}
          locale={{ emptyText: 'No transactions to show' }}
        />
      </div>
    </div>
  );
}
