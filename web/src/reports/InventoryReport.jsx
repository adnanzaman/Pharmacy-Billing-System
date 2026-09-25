import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Input, Table, Typography, message } from 'antd';
import { PrinterOutlined, SearchOutlined, FileExcelOutlined } from '@ant-design/icons';
import { API, getErrorMessage } from '../common';
import PeriodFilter from './PeriodFilter.jsx';
import { presetRange } from './dates.js';
import { rs, fmtDate, fmtDateTime, exportCsv, printHtml, reportHtml } from './format.js';

/* Item / Stock report: Stock Summary, Stock Ledger, Item Change History  (all use /reports/inventory?type=) */

const detailsText = v => (typeof v === 'string' ? v : v == null ? '' : JSON.stringify(v));

export const INVENTORY_REPORTS = {
  stock_summary: {
    title: 'Stock Summary',
    note: 'Stock = quantity on hand up to the "To" date. In / Out = movement between the two dates.',
    columns: [
      { title: 'Item', dataIndex: 'name' },
      { title: 'Generic', dataIndex: 'generic_name' },
      { title: 'Stock', dataIndex: 'stock', align: 'right', render: v => Number(v) },
      { title: 'In', dataIndex: 'total_in', align: 'right', render: v => Number(v) },
      { title: 'Out', dataIndex: 'total_out', align: 'right', render: v => Number(v) },
      { title: 'Reorder', dataIndex: 'reorder_level', align: 'right', render: v => Number(v) }
    ]
  },
  stock_ledger: {
    title: 'Stock Ledger',
    columns: [
      { title: 'Date', dataIndex: 'transaction_date', render: fmtDateTime, csv: fmtDateTime },
      { title: 'Item', dataIndex: 'medicine_name' },
      { title: 'Batch', dataIndex: 'batch_no' },
      { title: 'Type', dataIndex: 'transaction_type' },
      { title: 'In', dataIndex: 'qty_in', align: 'right', render: v => Number(v) },
      { title: 'Out', dataIndex: 'qty_out', align: 'right', render: v => Number(v) },
      { title: 'Cost', dataIndex: 'unit_cost', align: 'right', render: rs, csv: v => Number(v).toFixed(2), print: v => rs(v) }
    ]
  },
  history: {
    title: 'Item Change History',
    columns: [
      { title: 'Time', dataIndex: 'created_at', width: 170, render: fmtDateTime, csv: fmtDateTime },
      { title: 'User', dataIndex: 'user_name' },
      { title: 'Action', dataIndex: 'action' },
      { title: 'Entity', dataIndex: 'entity' },
      {
        title: 'Details', dataIndex: 'details', csv: detailsText,
        render: v => <Typography.Text ellipsis={{ tooltip: true }} style={{ maxWidth: 460, display: 'inline-block' }}>{detailsText(v)}</Typography.Text>
      }
    ]
  }
};

export default function InventoryReport({ type }) {
  const cfg = INVENTORY_REPORTS[type];
  const [period, setPeriod] = useState(() => { const [from, to] = presetRange('month'); return { preset: 'month', from, to }; });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const seq = useRef(0);

  const load = useCallback(async () => {
    const mine = ++seq.current;
    setLoading(true);
    try {
      const res = await API.get('/reports/inventory', { params: { from: period.from, to: period.to, type } });
      if (mine === seq.current) setRows(res.data.rows || []);
    } catch (e) {
      if (mine === seq.current) message.error(getErrorMessage(e));
    } finally {
      if (mine === seq.current) setLoading(false);
    }
  }, [period, type]);

  useEffect(() => { load(); }, [load]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? rows.filter(r => Object.values(r).map(detailsText).join(' ').toLowerCase().includes(q)) : rows;
  }, [rows, search]);

  const subtitle = `From ${fmtDate(period.from)} To ${fmtDate(period.to)}`;

  return (
    <div className="rp-page">
      <div className="rp-panel rp-head"><h1>{cfg.title}</h1></div>
      <div className="rp-panel"><PeriodFilter value={period} onChange={setPeriod} showFirm={false} /></div>
      <div className="rp-panel">
        <div className="rp-table-head">
          <h2>{cfg.note ? <span className="rp-note">{cfg.note}</span> : 'Details'}</h2>
          <div className="rp-tools">
            {showSearch && <Input allowClear autoFocus placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 220 }} />}
            <Button type="text" icon={<SearchOutlined />} title="Search" aria-label="Search" onClick={() => { setShowSearch(v => !v); if (showSearch) setSearch(''); }} />
            <Button type="text" icon={<FileExcelOutlined style={{ color: '#1d8a4b' }} />} title="Export to Excel (CSV)" aria-label="Export to Excel"
              onClick={() => exportCsv(`${type}-${period.from}-to-${period.to}`, cfg.columns, shown)} />
            <Button type="text" icon={<PrinterOutlined />} title="Print report" aria-label="Print report"
              onClick={() => printHtml(reportHtml({ title: cfg.title, subtitle, columns: cfg.columns, rows: shown }))} />
          </div>
        </div>
        <Table className="rp-table" rowKey={(r, i) => r.id ?? `${i}`} loading={loading} columns={cfg.columns} dataSource={shown}
          pagination={{ pageSize: 20, showSizeChanger: true }} locale={{ emptyText: 'No data for this period' }} />
      </div>
    </div>
  );
}
