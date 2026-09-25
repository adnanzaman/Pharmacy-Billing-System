import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Dropdown, Input, Modal, Table, message } from 'antd';
import {
  PlusOutlined, PrinterOutlined, SearchOutlined, ShareAltOutlined, MoreOutlined,
  ArrowUpOutlined, ArrowDownOutlined, BarChartOutlined, FileExcelOutlined
} from '@ant-design/icons';
import { API, getErrorMessage } from '../common';
import PeriodFilter from './PeriodFilter.jsx';
import { presetRange, previousPeriod } from './dates.js';
import { COMPANY_NAME, rs, fmtDate, whatsappLink, exportCsv, printHtml, reportHtml } from './format.js';

/* Transaction report > Sale  ("Sale Invoices" screen) */

const COLUMNS_EXPORT = [
  { title: 'Date', dataIndex: 'date', csv: v => fmtDate(v) },
  { title: 'Party Name', dataIndex: 'party_name' },
  { title: 'Transaction', dataIndex: 'transaction' },
  { title: 'Payment Type', dataIndex: 'payment_type' },
  { title: 'Amount', dataIndex: 'amount', align: 'right', csv: v => Number(v).toFixed(2), print: v => rs(v) },
  { title: 'Balance', dataIndex: 'balance', align: 'right', csv: v => Number(v).toFixed(2), print: v => rs(v) }
];

/* bars for the little chart icon: one bar per day */
function DailyBars({ data }) {
  const w = 720, h = 240, pad = { l: 64, r: 12, t: 12, b: 30 };
  const max = Math.max(1, ...data.map(d => d.total));
  const bw = (w - pad.l - pad.r) / Math.max(1, data.length);
  const step = Math.max(1, Math.ceil(data.length / 10));
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" role="img" aria-label="Sales per day">
      {[0, 1, 2, 3, 4].map(i => {
        const y = pad.t + ((h - pad.t - pad.b) * (4 - i)) / 4;
        return (
          <g key={i}>
            <line x1={pad.l} x2={w - pad.r} y1={y} y2={y} stroke="#e5e7eb" />
            <text x={pad.l - 6} y={y + 3} fontSize="10" textAnchor="end" fill="#6b7280">{Math.round((max * i) / 4).toLocaleString()}</text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const bh = ((h - pad.t - pad.b) * d.total) / max;
        return (
          <g key={d.date}>
            <rect x={pad.l + i * bw + 1} y={h - pad.b - bh} width={Math.max(1, bw - 2)} height={bh} fill="#7c6cf0" rx="2">
              <title>{`${fmtDate(d.date)}: ${rs(d.total)}`}</title>
            </rect>
            {i % step === 0 && <text x={pad.l + i * bw + bw / 2} y={h - 10} fontSize="10" textAnchor="middle" fill="#6b7280">{d.date.slice(8)}/{d.date.slice(5, 7)}</text>}
          </g>
        );
      })}
    </svg>
  );
}

export default function SaleReport({ renderAddSale, renderEditSale, printSale, onFullScreenChange }) {
  const [period, setPeriod] = useState(() => { const [from, to] = presetRange('month'); return { preset: 'month', from, to }; });
  const [data, setData] = useState({ rows: [], summary: null, daily: [] });
  const [vs, setVs] = useState('vs last month');
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
  const [chartOpen, setChartOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const seq = useRef(0);

  const load = useCallback(async () => {
    const mine = ++seq.current;              // ignore answers that arrive after a newer request
    setLoading(true);
    try {
      const prev = previousPeriod(period.preset, period.from, period.to);
      const res = await API.get('/reports/sale', { params: { from: period.from, to: period.to, prev_from: prev.from, prev_to: prev.to } });
      if (mine !== seq.current) return;
      setData(res.data);
      setVs(prev.label);
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

  const fetchSale = async row => {
    try { return (await API.get(`/sales/${row.id}`)).data; }
    catch (e) { message.error(getErrorMessage(e)); return null; }
  };

  const onPrint = async row => {
    const sale = await fetchSale(row);
    if (sale && printSale) printSale(sale);
  };

  const shareText = r => `Invoice ${r.invoice_no} (${fmtDate(r.date)})\nAmount: ${rs(r.amount)}\nReceived: ${rs(r.paid)}\nBalance: ${rs(r.balance)}\n- ${COMPANY_NAME}`;
  const onShare = async (row, key) => {
    if (key === 'wa') window.open(whatsappLink(row.party_phone, shareText(row)), '_blank', 'noopener');
    else {
      try { await navigator.clipboard.writeText(shareText(row)); message.success('Invoice details copied'); }
      catch { message.error('Could not copy - your browser blocked clipboard access'); }
    }
  };

  const onMore = async (row, key) => {
    if (key === 'print' || key === 'preview' || key === 'pdf') return onPrint(row);
    if (key === 'edit') { setEditingId(row.id); return; }
    if (key === 'return') { message.info('Open Sale Return (Credit Note) to convert this invoice to a return.'); return; }
    if (key === 'delivery') { const sale = await fetchSale(row); if (sale && printSale) printSale({ ...sale, _documentTitle: 'Delivery Challan' }); return; }
    if (key === 'einvoice') { message.info('e-Invoice generation is ready for tax-integration wiring; invoice data is available from this report.'); return; }
    if (key === 'cancel') { message.info('Use the Sale screen to cancel an invoice after confirmation.'); return; }
    if (key === 'delete') { message.warning('Delete is intentionally protected from the report screen to prevent accidental accounting/stock changes.'); return; }
    if (key === 'duplicate') { message.info('Duplicate will open as a new Sale draft in the next transaction action update.'); return; }
    if (key === 'history') { const sale = await fetchSale(row); if (sale) message.info(`History is available for invoice ${sale.invoice_no}.`); return; }
    const sale = await fetchSale(row);
    if (sale) setDetail(sale);
  };

  const exportExcel = () => exportCsv(`sale-report-${period.from}-to-${period.to}`, COLUMNS_EXPORT, rows);
  const printList = () => {
    const s = data.summary || {};
    printHtml(reportHtml({
      title: 'Sale Report',
      subtitle: `From ${fmtDate(period.from)} To ${fmtDate(period.to)}`,
      summary: `Total Sales Amount: <b>${rs(s.total)}</b> &nbsp;|&nbsp; Received: <b>${rs(s.received)}</b> &nbsp;|&nbsp; Balance: <b>${rs(s.balance)}</b>`,
      columns: COLUMNS_EXPORT,
      rows
    }));
  };

  if (adding) {
    return renderAddSale({ onReload: load, onClose: () => { setAdding(false); load(); } });
  }

  if (editingId != null && renderEditSale) {
    return renderEditSale({ id: editingId, onReload: load, onClose: () => { setEditingId(null); load(); } });
  }

  const s = data.summary;
  const pct = s ? s.changePercent : 0;
  const tone = pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat';
  const uniq = key => [...new Set(data.rows.map(r => r[key]))].map(v => ({ text: key === 'date' ? fmtDate(v) : key === 'amount' || key === 'balance' ? rs(v) : String(v), value: v }));
  const filterCol = key => ({ filters: uniq(key), filterSearch: true, onFilter: (v, r) => r[key] === v });

  const columns = [
    { title: 'Date', dataIndex: 'date', width: 130, render: fmtDate, ...filterCol('date') },
    { title: 'Party Name', dataIndex: 'party_name', ...filterCol('party_name') },
    { title: 'Transaction', dataIndex: 'transaction', ...filterCol('transaction') },
    { title: 'Payment Type', dataIndex: 'payment_type', ...filterCol('payment_type') },
    { title: 'Amount', dataIndex: 'amount', align: 'right', render: rs, ...filterCol('amount') },
    { title: 'Balance', dataIndex: 'balance', align: 'right', render: rs, ...filterCol('balance') },
    {
      title: 'Actions', key: 'actions', width: 150,
      render: (_, r) => (
        <div className="rp-actions">
          <Button type="text" icon={<PrinterOutlined />} title="Print invoice" aria-label="Print invoice" onClick={() => onPrint(r)} />
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
        <h1>Sale Invoices</h1>
        <Button type="primary" shape="round" size="large" icon={<PlusOutlined />} className="rp-add" onClick={() => setAdding(true)}>Add Sale</Button>
      </div>

      <div className="rp-panel"><PeriodFilter value={period} onChange={setPeriod} /></div>

      <div className="rp-panel">
        <div className="rp-3cards" data-testid="sale-summary">
          <div className="rp-3card rp-3card-paid"><div className="rp-3card-label">Paid</div><div className="rp-3card-amount">{rs(s?.received)}</div></div>
          <div className="rp-3op">+</div>
          <div className="rp-3card rp-3card-unpaid"><div className="rp-3card-label">Unpaid</div><div className="rp-3card-amount">{rs(s?.balance)}</div></div>
          <div className="rp-3op">=</div>
          <div className="rp-3card rp-3card-total"><div className="rp-3card-label">Total</div><div className="rp-3card-amount">{rs(s?.total)}</div><div className="rp-card-vs">{Math.abs(pct)}% {vs}</div></div>
        </div>
      </div>

      <div className="rp-panel">
        <div className="rp-table-head">
          <h2>Transactions</h2>
          <div className="rp-tools">
            {showSearch && <Input allowClear autoFocus placeholder="Search invoice, party..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 220 }} />}
            <Button type="text" icon={<SearchOutlined />} title="Search" aria-label="Search" onClick={() => { setShowSearch(v => !v); if (showSearch) setSearch(''); }} />
            <Button type="text" icon={<BarChartOutlined />} title="Sales graph" aria-label="Sales graph" onClick={() => setChartOpen(true)} />
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
          locale={{ emptyText: 'No sales in this period' }}
        />
      </div>

      <Modal title="Sales per day" open={chartOpen} onCancel={() => setChartOpen(false)} footer={null} width={780}>
        <DailyBars data={data.daily || []} />
      </Modal>

      <Modal title={detail ? `Sale ${detail.invoice_no}` : ''} open={!!detail} onCancel={() => setDetail(null)} width={860}
        footer={<Button icon={<PrinterOutlined />} onClick={() => printSale && printSale(detail)}>Print Invoice</Button>}>
        {detail && (
          <>
            <div className="rp-detail-grid">
              <div><span>Date</span><b>{fmtDate(detail.invoice_date)}</b></div>
              <div><span>Party</span><b>{detail.patient_name || 'Cash Sale'}</b></div>
              <div><span>Payment</span><b>{detail.payment_method}</b></div>
              <div><span>Total</span><b>{rs(detail.net_total)}</b></div>
              <div><span>Received</span><b>{rs(detail.paid)}</b></div>
              <div><span>Balance</span><b>{rs(Number(detail.net_total) - Number(detail.paid))}</b></div>
            </div>
            <Table size="small" rowKey="id" pagination={false} dataSource={detail.items || []}
              columns={[
                { title: 'Item', dataIndex: 'medicine_name' },
                { title: 'Batch', dataIndex: 'batch_no' },
                { title: 'Qty', dataIndex: 'qty', align: 'right', render: v => Number(v) },
                { title: 'Rate', dataIndex: 'unit_price', align: 'right', render: rs },
                { title: 'Total', dataIndex: 'total', align: 'right', render: rs }
              ]} />
          </>
        )}
      </Modal>
    </div>
  );
}
