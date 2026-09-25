import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Dropdown, Input, Select, Table, message } from 'antd';
import { PrinterOutlined, SearchOutlined, ShareAltOutlined, MoreOutlined, FileExcelOutlined } from '@ant-design/icons';
import { API, getErrorMessage } from '../common';
import PeriodFilter from './PeriodFilter.jsx';
import { presetRange } from './dates.js';
import { rs, fmtDate, whatsappLink, exportCsv, printHtml, reportHtml } from './format.js';

/* Transaction report > All Transactions
   Sale + Purchase + Expense today - the transaction types this system
   actually posts. The type dropdown only lists those (see note under the table)
   rather than the full reference list, since the rest (Payment-In/Out, Credit/
   Debit Note, Sale/Purchase Order, Estimate, Proforma, Delivery Challan,
   Manufacture, Journal Entry) don't exist in this app yet. */

const TYPES = [
  { value: 'all', label: 'All Transaction' },
  { value: 'sale', label: 'Sale' },
  { value: 'purchase', label: 'Purchase' },
  { value: 'expense', label: 'Expense' },
  { value: 'payment_in', label: 'Payment In' },
  { value: 'payment_out', label: 'Payment Out' },
  { value: 'credit_note', label: 'Credit Note' },
  { value: 'debit_note', label: 'Debit Note' },
  { value: 'journal', label: 'Journal Entry' }
];

const COLUMNS_EXPORT = [
  { title: 'Date', dataIndex: 'date', csv: v => fmtDate(v) },
  { title: 'Party Name', dataIndex: 'party_name' },
  { title: 'Category Name', dataIndex: 'category_name' },
  { title: 'Type', dataIndex: 'transaction' },
  { title: 'Total', dataIndex: 'total', align: 'right', csv: v => Number(v).toFixed(2), print: v => rs(v) },
  { title: 'Received/Paid', dataIndex: 'received', align: 'right', csv: v => Number(v).toFixed(2), print: v => rs(v) },
  { title: 'Balance', dataIndex: 'balance', align: 'right', csv: v => Number(v).toFixed(2), print: v => rs(v) }
];

export default function AllTransactionsReport({ printSale, printPurchase, renderEditSale, renderEditPurchase, onFullScreenChange }) {
  const [period, setPeriod] = useState(() => { const [from, to] = presetRange('month'); return { preset: 'month', from, to }; });
  const [type, setType] = useState('all');
  const [data, setData] = useState({ rows: [] });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => { onFullScreenChange?.(!!editing); return () => onFullScreenChange?.(false); }, [editing]);
  useEffect(() => { const closeAll = () => setEditing(null); window.addEventListener('xmart:close-workspace', closeAll); return () => window.removeEventListener('xmart:close-workspace', closeAll); }, []);
  const seq = useRef(0);

  const load = useCallback(async () => {
    const mine = ++seq.current;
    setLoading(true);
    try {
      const res = await API.get('/reports/all', { params: { from: period.from, to: period.to, type } });
      if (mine !== seq.current) return;
      setData(res.data);
    } catch (e) {
      if (mine === seq.current) message.error(getErrorMessage(e));
    } finally {
      if (mine === seq.current) setLoading(false);
    }
  }, [period, type]);

  useEffect(() => { load(); }, [load]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data.rows;
    return data.rows.filter(r => [r.party_name, r.category_name, r.transaction, r.payment_type, r.date, r.total, r.balance].join(' ').toLowerCase().includes(q));
  }, [data.rows, search]);

  const onPrint = async row => {
    try {
      if (row.transaction === 'Sale' && printSale) printSale((await API.get(`/sales/${row.ref_id}`)).data);
      else if (row.transaction === 'Purchase' && printPurchase) printPurchase((await API.get(`/purchases/${row.ref_id}`)).data);
      else message.info('Print is only wired up for Sale and Purchase right now');
    } catch (e) {
      message.error(getErrorMessage(e));
    }
  };

  const shareText = r => `${r.transaction} - ${r.party_name}\nTotal: ${rs(r.total)}\nReceived/Paid: ${rs(r.received)}\nBalance: ${rs(r.balance)}`;

  const onMore = async (row, key) => {
    if (row.transaction !== 'Sale' && row.transaction !== 'Purchase') {
      if (key === 'print' || key === 'preview' || key === 'pdf') return onPrint(row);
      return message.info(`${row.transaction} does not have invoice actions.`);
    }
    try {
      const full = (await API.get(`/${row.transaction === 'Sale' ? 'sales' : 'purchases'}/${row.ref_id}`)).data;
      if (key === 'edit') return setEditing({ type: row.transaction, id: row.ref_id });
      if (key === 'print' || key === 'preview' || key === 'pdf') return row.transaction === 'Sale' ? printSale?.(full) : printPurchase?.(full);
      if (key === 'delivery') return row.transaction === 'Sale' ? printSale?.({ ...full, _documentTitle: 'Delivery Challan' }) : printPurchase?.({ ...full, _documentTitle: 'Delivery Challan' });
      if (key === 'einvoice') return message.info('e-Invoice data is available; tax-provider integration can be connected later.');
      if (key === 'return') return message.info(`Use ${row.transaction === 'Sale' ? 'Sale Return (Credit Note)' : 'Purchase Return (Debit Note)'} for the correction.`);
      if (key === 'cancel' || key === 'delete') return message.warning('This stock/accounting action is protected from All Transactions.');
      if (key === 'duplicate') return message.info('Duplicate opens from the transaction screen.');
      if (key === 'history') return message.info(`History is available for ${full.invoice_no || full.id}.`);
    } catch (e) { message.error(getErrorMessage(e)); }
  };
  const onShare = async (row, key) => {
    if (key === 'wa') window.open(whatsappLink(row.phone, shareText(row)), '_blank', 'noopener');
    else {
      try { await navigator.clipboard.writeText(shareText(row)); message.success('Details copied'); }
      catch { message.error('Could not copy - your browser blocked clipboard access'); }
    }
  };

  if (editing) {
    const render = editing.type === 'Sale' ? renderEditSale : renderEditPurchase;
    if (render) return render({ id: editing.id, onReload: load, onClose: () => { setEditing(null); load(); } });
  }

  const exportExcel = () => exportCsv(`all-transactions-${period.from}-to-${period.to}`, COLUMNS_EXPORT, rows);
  const printList = () => printHtml(reportHtml({
    title: 'All Transactions',
    subtitle: `From ${fmtDate(period.from)} To ${fmtDate(period.to)}`,
    columns: COLUMNS_EXPORT,
    rows
  }));

  const uniq = key => [...new Set(data.rows.map(r => r[key]))].map(v => ({ text: key === 'date' ? fmtDate(v) : String(v), value: v }));
  const filterCol = key => ({ filters: uniq(key), filterSearch: true, onFilter: (v, r) => r[key] === v });

  const columns = [
    { title: '#', width: 50, render: (_, __, i) => i + 1 },
    { title: 'Date', dataIndex: 'date', width: 120, render: fmtDate, ...filterCol('date') },
    { title: 'Party Name', dataIndex: 'party_name', ...filterCol('party_name') },
    { title: 'Category Name', dataIndex: 'category_name', ...filterCol('category_name') },
    { title: 'Type', dataIndex: 'transaction', ...filterCol('transaction') },
    { title: 'Total', dataIndex: 'total', align: 'right', render: rs, ...filterCol('total') },
    { title: 'Received/Paid', dataIndex: 'received', align: 'right', render: rs },
    { title: 'Balance', dataIndex: 'balance', align: 'right', render: rs, ...filterCol('balance') },
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
      <div className="rp-panel"><PeriodFilter value={period} onChange={setPeriod} /></div>

      <div className="rp-panel">
        <Select
          value={type}
          onChange={setType}
          style={{ width: 220 }}
          options={TYPES}
          aria-label="Transaction type"
        />
      </div>

      <div className="rp-panel">
        <div className="rp-table-head">
          <h2 style={{ visibility: 'hidden', height: 0, margin: 0 }}>All Transactions</h2>
          <div className="rp-tools">
            {showSearch && <Input allowClear autoFocus placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 220 }} />}
            <Button type="text" icon={<SearchOutlined />} title="Search" aria-label="Search" onClick={() => { setShowSearch(v => !v); if (showSearch) setSearch(''); }} />
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
        <div style={{ marginTop: 10, fontSize: 12, color: '#8a94a0' }}>
          Showing sales, purchases, expenses, payments, credit/debit notes and journal entries recorded by this hospital.
        </div>
      </div>
    </div>
  );
}
