import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Dropdown, Input, Select, Table, message } from 'antd';
import { PrinterOutlined, SearchOutlined, ShareAltOutlined, FileExcelOutlined, MoreOutlined } from '@ant-design/icons';
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

export default function DayBookReport({ printSale, printPurchase, renderEditSale, renderEditPurchase, renderEditSaleReturn, renderEditPurchaseReturn, renderEditExpense, onFullScreenChange }) {
  const [date, setDate] = useState(() => ymd(new Date()));
  const [data, setData] = useState({ rows: [], summary: null });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [editing, setEditing] = useState(null);
  const seq = useRef(0);

  // Let the Reports shell know when we've swapped the report table for a
  // full-screen Add/Edit/Return workspace, so it can hide the report list
  // (and the app's own left menu already hides while any invoice screen is open).
  useEffect(() => { onFullScreenChange?.(!!editing); return () => onFullScreenChange?.(false); }, [editing]);
  useEffect(() => { const closeAll = () => setEditing(null); window.addEventListener('xmart:close-workspace', closeAll); return () => window.removeEventListener('xmart:close-workspace', closeAll); }, []);

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
    if (row.transaction !== 'Sale' && row.transaction !== 'Purchase') {
      message.info('Print is available for Sale and Purchase entries from the Day Book.');
      return;
    }
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

  const onMore = async (row, key) => {
    const isSaleReturn = row.transaction === 'Sale Return' || row.transaction === 'Credit Note';
    const isPurchaseReturn = row.transaction === 'Purchase Return' || row.transaction === 'Debit Note';
    if (isSaleReturn || isPurchaseReturn) {
      if (key === 'edit') return setEditing({ type: isSaleReturn ? 'Credit Note' : 'Debit Note', id: row.ref_id });
      if (key === 'return') return;
      message.info(`${row.transaction} uses the Credit/Debit Note screen.`);
      return;
    }
    if (row.transaction === 'Expense') {
      if (key === 'edit') return setEditing({ type: 'Expense', id: row.ref_id });
      if (key === 'print' || key === 'preview' || key === 'pdf') return onPrint(row);
      message.info('Expense only supports Edit and Print from Day Book.');
      return;
    }
    if (row.transaction !== 'Sale' && row.transaction !== 'Purchase') {
      if (key === 'print' || key === 'preview' || key === 'pdf') return onPrint(row);
      message.info(`${row.transaction} does not have invoice actions.`);
      return;
    }
    try {
      const endpoint = row.transaction === 'Sale' ? 'sales' : 'purchases';
      const full = (await API.get(`/${endpoint}/${row.ref_id}`)).data;
      if (key === 'edit') {
        return setEditing({ type: row.transaction, id: row.ref_id });
      }
      if (key === 'print' || key === 'preview' || key === 'pdf') return row.transaction === 'Sale' ? printSale?.(full) : printPurchase?.(full);
      if (key === 'delivery') return row.transaction === 'Sale' ? printSale?.({ ...full, _documentTitle: 'Delivery Challan' }) : printPurchase?.({ ...full, _documentTitle: 'Delivery Challan' });
      if (key === 'einvoice') return message.info('e-Invoice data is available; tax-provider integration can be connected later.');
      if (key === 'return') return message.info(`Use ${row.transaction === 'Sale' ? 'Sale Return (Credit Note)' : 'Purchase Return (Debit Note)'} to create the correction.`);
      if (key === 'cancel' || key === 'delete') return message.warning('This accounting/stock action is protected from Day Book. Use the transaction screen after confirmation.');
      if (key === 'duplicate') return message.info('Duplicate opens as a new transaction draft from the transaction screen.');
      if (key === 'history') return message.info(`History is available for ${full.invoice_no || full.id}.`);
    } catch (e) { message.error(getErrorMessage(e)); }
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

  if (editing) {
    const render = editing.type === 'Sale' ? renderEditSale : editing.type === 'Purchase' ? renderEditPurchase : editing.type === 'Expense' ? renderEditExpense : editing.type === 'Credit Note' ? renderEditSaleReturn : renderEditPurchaseReturn;
    if (render) return render({ id: editing.id, onReload: load, onClose: () => { setEditing(null); load(); } });
  }

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
      title: 'Actions', key: 'actions', width: 190,
      render: (_, r) => (
        <div className="rp-actions">
          <Button type="text" icon={<PrinterOutlined />} title="Print" aria-label="Print" onClick={() => onPrint(r)} />
          <Dropdown trigger={['click']} menu={{ items: [{ key: 'wa', label: 'Share on WhatsApp' }, { key: 'copy', label: 'Copy details' }], onClick: ({ key }) => onShare(r, key) }}>
            <Button type="text" icon={<ShareAltOutlined />} title="Share" aria-label="Share" />
          </Dropdown>
          <Dropdown trigger={['click']} menu={{ items: [
            { key: 'edit', label: 'View / Edit' },
            { key: 'einvoice', label: 'Generate e-Invoice' },
            { key: 'return', label: 'Convert To Return' },
            { key: 'delivery', label: 'Preview as Delivery Challan' },
            { type: 'divider' },
            { key: 'cancel', label: 'Cancel Invoice' },
            { key: 'delete', label: 'Delete', danger: true },
            { key: 'duplicate', label: 'Duplicate' },
            { key: 'pdf', label: 'Open PDF' },
            { key: 'preview', label: 'Preview' },
            { key: 'print', label: 'Print' },
            { key: 'history', label: 'View History' }
          ], onClick: ({ key }) => onMore(r, key) }}>
            <Button type="text" icon={<MoreOutlined />} title="More" aria-label="More" />
          </Dropdown>
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
        <div className="daybook-footer-summary">
          <div><span>Total Money In</span><b>{rs(data.summary?.totalIn || 0)}</b></div>
          <div><span>Total Money Out</span><b>{rs(data.summary?.totalOut || 0)}</b></div>
          <div><span>Total Money In − Total Money Out</span><b>{rs(data.summary?.net || 0)}</b></div>
        </div>
      </div>
    </div>
  );
}
