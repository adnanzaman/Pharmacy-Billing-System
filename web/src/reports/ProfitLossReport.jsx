import React, { useEffect, useMemo, useState } from 'react';
import { Card, Col, Empty, Row, Space, Spin, Table, Tag, Typography, message } from 'antd';
import { API, getErrorMessage, money } from '../common';
import { rs, fmtDate, printHtml, reportHtml } from './format.js';

const isoToday = () => (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();

export default function ProfitLossReport() {
  const [from, setFrom] = useState(() => {
    const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [to, setTo] = useState(isoToday);
  const [view, setView] = useState('accounting');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (from > to) { message.warning('From date cannot be after To date'); return; }
    setLoading(true);
    try {
      setData((await API.get('/reports/profit-loss', { params: { from, to } })).data);
    } catch (e) {
      message.error(getErrorMessage(e));
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [from, to]);

  const expenseRows = useMemo(() => (data?.expenses || []).map((r, i) => ({ ...r, key: i })), [data]);

  const printReport = () => {
    if (!data) return;
    const rows = [
      { category: 'Sales', amount: data.sales },
      { category: 'Less: Sale Returns', amount: -data.saleReturns },
      { category: 'Net Sales', amount: data.netSales },
      { category: 'Purchases', amount: data.purchases },
      { category: 'Less: Purchase Returns', amount: -data.purchaseReturns },
      { category: 'Net Purchases', amount: data.netPurchases },
      { category: 'Opening Stock', amount: data.openingStock },
      { category: 'Closing Stock', amount: -data.closingStock },
      { category: 'Cost of Goods Sold', amount: data.costOfGoodsSold },
      { category: 'Gross Profit', amount: data.grossProfit },
      ...(data.expenses || []).map(x => ({ category: `Expense — ${x.category}`, amount: x.amount })),
      { category: 'Net Profit / (Loss)', amount: data.netProfit }
    ];
    printHtml(reportHtml({
      title: 'Profit & Loss Report',
      subtitle: `Punjab Hospital · ${fmtDate(from)} to ${fmtDate(to)}`,
      columns: [
        { title: 'Particulars', dataIndex: 'category' },
        { title: 'Amount', dataIndex: 'amount', align: 'right', print: v => rs(v) }
      ],
      rows
    }));
  };

  return (
    <div className="rp-page">
      <div className="rp-panel">
        <div className="rp-filter">
          <label className="rp-pill rp-pill-dates">
            <span style={{ fontWeight: 700 }}>From</span>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} />
            <span style={{ fontWeight: 700, marginLeft: 10 }}>To</span>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} />
          </label>
          <div className="rp-pill" style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <span style={{ fontWeight: 700 }}>View:</span>
            <label><input type="radio" checked={view === 'Xmart view'} onChange={() => setView('Xmart view')} /> Xmart view</label>
            <label><input type="radio" checked={view === 'accounting'} onChange={() => setView('accounting')} /> Accounting</label>
          </div>
          <button className="rp-print-button" onClick={printReport}>Print</button>
        </div>
      </div>

      <Card className="rp-panel" bordered={false}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <Typography.Title level={3} style={{ margin: 0 }}>PROFIT AND LOSS REPORT</Typography.Title>
          <Tag>{fmtDate(from)} — {fmtDate(to)}</Tag>
        </div>

        <Spin spinning={loading}>
          {!data ? <Empty description="No report data" /> : (
            <>
              <Row gutter={[12, 12]} style={{ marginBottom: 18 }}>
                <Col xs={24} sm={8}>
                  <Card size="small"><div className="rp-muted">Net Sales</div><div className="rp-kpi">{money(data.netSales)}</div></Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card size="small"><div className="rp-muted">Cost of Goods Sold</div><div className="rp-kpi">{money(data.costOfGoodsSold)}</div></Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card size="small"><div className="rp-muted">Net Profit / (Loss)</div><div className="rp-kpi" style={{ color: Number(data.netProfit) >= 0 ? '#16a34a' : '#dc2626' }}>{money(data.netProfit)}</div></Card>
                </Col>
              </Row>

              {view === 'Xmart view' ? (
                <Table
                  rowKey="key"
                  pagination={false}
                  dataSource={[
                    { key: 'sales', particulars: 'Sales Accounts', amount: data.sales },
                    { key: 'returns', particulars: 'Less: Sale Returns', amount: -data.saleReturns },
                    { key: 'netSales', particulars: 'Net Sales', amount: data.netSales, strong: true },
                    { key: 'purchases', particulars: 'Purchase Accounts', amount: data.purchases },
                    { key: 'pReturns', particulars: 'Less: Purchase Returns', amount: -data.purchaseReturns },
                    { key: 'opening', particulars: 'Opening Stock', amount: data.openingStock },
                    { key: 'closing', particulars: 'Closing Stock', amount: -data.closingStock },
                    { key: 'cogs', particulars: 'Cost of Goods Sold', amount: data.costOfGoodsSold, strong: true },
                    { key: 'gross', particulars: 'Gross Profit', amount: data.grossProfit, strong: true },
                    ...(data.expenses || []).map((x, i) => ({ key: `e-${i}`, particulars: `Expense — ${x.category}`, amount: x.amount })),
                    { key: 'net', particulars: 'Net Profit / (Loss)', amount: data.netProfit, strong: true }
                  ]}
                  columns={[
                    { title: 'Particulars', dataIndex: 'particulars', render: (v, r) => <span style={{ fontWeight: r.strong ? 700 : 400 }}>{v}</span> },
                    { title: 'Amount', dataIndex: 'amount', align: 'right', render: v => <span style={{ color: Number(v) < 0 ? '#dc2626' : '#16a34a' }}>{rs(v)}</span> }
                  ]}
                />
              ) : (
                <Row gutter={[20, 20]}>
                  <Col xs={24} lg={12}>
                    <Card size="small" title="Incomes">
                      <Table
                        size="small" pagination={false}
                        dataSource={[
                          { key: 1, name: 'Sale Accounts', amount: data.sales },
                          ...(data.accountSections || []).filter(a => ['INCOME','REVENUE'].includes(a.account_type)).map((a, i) => ({ key: `i-${i}`, name: a.name, amount: a.amount }))
                        ]}
                        columns={[
                          { title: 'Particulars', dataIndex: 'name' },
                          { title: 'Amount', dataIndex: 'amount', align: 'right', render: rs }
                        ]}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} lg={12}>
                    <Card size="small" title="Expenses">
                      <Table
                        size="small" pagination={false}
                        dataSource={[
                          { key: 'cogs', name: 'Cost of Goods Sold', amount: data.costOfGoodsSold },
                          ...(expenseRows || []).map(x => ({ key: `e-${x.key}`, name: x.category, amount: x.amount })),
                          ...(data.accountSections || []).filter(a => a.account_type === 'EXPENSE').map((a, i) => ({ key: `a-${i}`, name: a.name, amount: a.amount }))
                        ]}
                        columns={[
                          { title: 'Particulars', dataIndex: 'name' },
                          { title: 'Amount', dataIndex: 'amount', align: 'right', render: rs }
                        ]}
                      />
                    </Card>
                  </Col>
                </Row>
              )}
            </>
          )}
        </Spin>
      </Card>
    </div>
  );
}
