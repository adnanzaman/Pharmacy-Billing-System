import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Dropdown, Input, Modal, Table, message } from 'antd';
import {
  PlusOutlined, PrinterOutlined, SearchOutlined, ShareAltOutlined, MoreOutlined, FileExcelOutlined
} from '@ant-design/icons';
import { API, getErrorMessage } from '../common';
import PeriodFilter from './PeriodFilter.jsx';
import { presetRange } from './dates.js';
import { COMPANY_NAME, rs, fmtDate, whatsappLink, exportCsv, printHtml, reportHtml } from './format.js';

/* Transaction report > Purchase  ("Purchase Bills" screen) */

const COLUMNS_EXPORT = [
  { title: 'Date', dataIndex: 'date', csv: v => fmtDate(v) },
  { title: 'Party Name', dataIndex: 'party_name' },
  { title: 'Transaction', dataIndex: 'transaction' },
  { title: 'Payment Type', dataIndex: 'payment_type' },
  { title: 'Amount', dataIndex: 'amount', align: 'right', csv: v => Number(v).toFixed(2), print: v => rs(v) },
  { title: 'Balance Due', dataIndex: 'balance', align: 'right', csv: v => Number(v).toFixed(2), print: v => rs(v) },
  { title: 'Bonus Qty', dataIndex: 'bonus_qty', align: 'right', csv: v => Number(v||0), print: v => String(Number(v||0)) }
];

export default function PurchaseReport({ renderAddPurchase, renderEditPurchase, printPurchase, onFullScreenChange }) {
  const [period, setPeriod] = useState(() => { const [from, to] = presetRange('month'); return { preset: 'month', from, to }; });
  const [data, setData] = useState({ rows: [], summary: null });
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  // Full screen while adding OR editing (Add used to open inside the normal layout with the sidebar).
  const fullScreenRef = useRef(onFullScreenChange);
  fullScreenRef.current = onFullScreenChange;
  useEffect(() => { fullScreenRef.current?.(adding || editingId != null); }, [adding, editingId]);
  useEffect(() => () => fullScreenRef.current?.(false), []);
  // "Close Screen" in the top bar closes any open add/edit editor.
  useEffect(() => {
    const closeAll = () => { setAdding(false); setEditingId(null); };
    window.addEventListener('xmart:close-workspace', closeAll);
    return () => window.removeEventListener('xmart:close-workspace', closeAll);
  }, []);

  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [detail, setDetail] = useState(null);
  const seq = useRef(0);

  const load = useCallback(async () => {
    const mine = ++seq.current;
    setLoading(true);
    try {
      const res = await API.get('/reports/purchase', { params: { from: period.from, to: period.to } });
      if (mine !== seq.current) return;
      setData(res.data);
    } catch (e) {
      if (mine === seq.current) message.error(getErrorMessage(e));
    } finally {
      if (mine === seq.current) setLoading(false);
    }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data.rows;
    return data.rows.filter(r => [r.invoice_no, r.party_name, r.transaction, r.payment_type, r.date, r.amount, r.balance].join(' ').toLowerCase().includes(q));
  }, [data.rows, search]);

  const fetchPurchase = async row => {
    try { return (await API.get(`/purchases/${row.id}`)).data; }
    catch (e) { message.error(getErrorMessage(e)); return null; }
  };

  const onPrint = async row => {
    const purchase = await fetchPurchase(row);
    if (purchase && printPurchase) printPurchase(purchase);
  };

  const shareText = r => `Purchase ${r.invoice_no} (${fmtDate(r.date)})\nAmount: ${rs(r.amount)}\nPaid: ${rs(r.paid)}\nBalance Due: ${rs(r.balance)}\n- ${COMPANY_NAME}`;
  const onShare = async (row, key) => {
    if (key === 'wa') window.open(whatsappLink(row.party_phone, shareText(row)), '_blank', 'noopener');
    else {
      try { await navigator.clipboard.writeText(shareText(row)); message.success('Purchase details copied'); }
      catch { message.error('Could not copy - your browser blocked clipboard access'); }
    }
  };

  const onMore = async (row, key) => {
    if (key === 'print' || key === 'preview' || key === 'pdf') return onPrint(row);
    if (key === 'edit') { setEditingId(row.id); return; }
    if (key === 'return') { message.info('Open Purchase Return (Debit Note) to convert this bill to a return.'); return; }
    if (key === 'delivery') { const purchase = await fetchPurchase(row); if (purchase && printPurchase) printPurchase({ ...purchase, _documentTitle: 'Delivery Challan' }); return; }
    if (key === 'einvoice') { message.info('e-Invoice generation is not applicable to supplier bills in the current module.'); return; }
    if (key === 'cancel') { message.info('Use the Purchase screen to cancel a bill after confirmation.'); return; }
    if (key === 'delete') { message.warning('Delete is intentionally protected from the report screen to prevent accidental stock/accounting changes.'); return; }
    if (key === 'duplicate') { message.info('Duplicate will open as a new Purchase draft in the next transaction action update.'); return; }
    if (key === 'history') { const purchase = await fetchPurchase(row); if (purchase) message.info(`History is available for bill ${purchase.invoice_no || purchase.id}.`); return; }
    const purchase = await fetchPurchase(row);
    if (purchase) setDetail(purchase);
  };

  const exportExcel = () => exportCsv(`purchase-report-${period.from}-to-${period.to}`, COLUMNS_EXPORT, rows);
  const printList = () => {
    const s = data.summary || {};
    printHtml(reportHtml({
      title: 'Purchase Report',
      subtitle: `From ${fmtDate(period.from)} To ${fmtDate(period.to)}`,
      summary: `Paid: <b>${rs(s.paid)}</b> &nbsp;+&nbsp; Unpaid: <b>${rs(s.unpaid)}</b> &nbsp;=&nbsp; Total: <b>${rs(s.total)}</b>`,
      columns: COLUMNS_EXPORT,
      rows
    }));
  };

  if (adding) {
    return renderAddPurchase({ onReload: load, onClose: () => { setAdding(false); load(); } });
  }

  if (editingId != null && renderEditPurchase) {
    return renderEditPurchase({ id: editingId, onReload: load, onClose: () => { setEditingId(null); load(); } });
  }

  const s = data.summary || {};
  const uniq = key => [...new Set(data.rows.map(r => r[key]))].map(v => ({ text: key === 'date' ? fmtDate(v) : key === 'amount' || key === 'balance' ? rs(v) : String(v), value: v }));
  const filterCol = key => ({ filters: uniq(key), filterSearch: true, onFilter: (v, r) => r[key] === v });

  const columns = [
    { title: 'Date', dataIndex: 'date', width: 130, render: fmtDate, ...filterCol('date') },
    { title: 'Party Name', dataIndex: 'party_name', ...filterCol('party_name') },
    { title: 'Transaction', dataIndex: 'transaction', ...filterCol('transaction') },
    { title: 'Payment Type', dataIndex: 'payment_type', ...filterCol('payment_type') },
    { title: 'Amount', dataIndex: 'amount', align: 'right', render: rs, ...filterCol('amount') },
    { title: 'Balance Due', dataIndex: 'balance', align: 'right', render: rs, ...filterCol('balance') },
    { title: 'Bonus Qty', dataIndex: 'bonus_qty', align: 'right', render: v => Number(v||0), ...filterCol('bonus_qty') },
    {
      title: 'Actions', key: 'actions', width: 150,
      render: (_, r) => (
        <div className="rp-actions">
          <Button type="text" icon={<PrinterOutlined />} title="Print purchase" aria-label="Print purchase" onClick={() => onPrint(r)} />
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
      <div className="rp-panel rp-head">
        <h1>Purchase Bills</h1>
        <Button type="primary" shape="round" size="large" icon={<PlusOutlined />} className="rp-add" onClick={() => setAdding(true)}>Add Purchase</Button>
      </div>

      <div className="rp-panel"><PeriodFilter value={period} onChange={setPeriod} /></div>

      <div className="rp-panel">
        <div className="rp-3cards" data-testid="purchase-summary">
          <div className="rp-3card rp-3card-paid">
            <div className="rp-3card-label">Paid</div>
            <div className="rp-3card-amount">{rs(s.paid)}</div>
          </div>
          <div className="rp-3op">+</div>
          <div className="rp-3card rp-3card-unpaid">
            <div className="rp-3card-label">Unpaid</div>
            <div className="rp-3card-amount">{rs(s.unpaid)}</div>
          </div>
          <div className="rp-3op">=</div>
          <div className="rp-3card rp-3card-total">
            <div className="rp-3card-label">Total</div>
            <div className="rp-3card-amount">{rs(s.total)}</div>
          </div>
        </div>
      </div>

      <div className="rp-panel">
        <div className="rp-table-head">
          <h2>Transactions</h2>
          <div className="rp-tools">
            {showSearch && <Input allowClear autoFocus placeholder="Search invoice, party..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 220 }} />}
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
          locale={{ emptyText: 'No purchases in this period' }}
        />
      </div>

      <Modal title={detail ? `Purchase ${detail.invoice_no}` : ''} open={!!detail} onCancel={() => setDetail(null)} width={860}
        footer={<Button icon={<PrinterOutlined />} onClick={() => printPurchase && printPurchase(detail)}>Print Purchase</Button>}>
        {detail && (
          <>
            <div className="rp-detail-grid">
              <div><span>Date</span><b>{fmtDate(detail.invoice_date)}</b></div>
              <div><span>Party</span><b>{detail.supplier_name || 'Cash Purchase'}</b></div>
              <div><span>Total</span><b>{rs(detail.net_total)}</b></div>
              <div><span>Paid</span><b>{rs(detail.paid)}</b></div>
              <div><span>Balance Due</span><b>{rs(Number(detail.net_total) - Number(detail.paid))}</b></div>
            </div>
            <Table size="small" rowKey="id" pagination={false} dataSource={detail.items || []}
              columns={[
                { title: 'Item', dataIndex: 'medicine_name' },
                { title: 'Batch', dataIndex: 'batch_no' },
                { title: 'Qty', dataIndex: 'qty', align: 'right', render: v => Number(v) },
                { title: 'Cost', dataIndex: 'unit_cost', align: 'right', render: rs },
                { title: 'Total', dataIndex: 'total', align: 'right', render: rs }
              ]} />
          </>
        )}
      </Modal>
    </div>
  );
}
