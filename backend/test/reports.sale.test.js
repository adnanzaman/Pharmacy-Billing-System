const test = require('node:test');
const assert = require('node:assert/strict');

const calls = [];
let saleRows = [], prevTotal = 0;
const fake = {
  async query(sql, params) {
    calls.push({ sql: sql.replace(/\s+/g, ' '), params });
    if (/SELECT COALESCE\(SUM\(s\.net_total\),0\) total/.test(sql)) return [[{ total: prevTotal }]];
    if (/FROM sales_invoices s LEFT JOIN patients/.test(sql)) return [saleRows];
    return [[]];
  }
};
const dbPath = require.resolve('../src/config/db');
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: fake };
const reports = require('../src/controllers/reports.controller');

const run = async q => { const res = { body: null, json(b) { this.body = b; return this; } }; await reports.sale({ user: { hospital_id: 1 }, query: q }, res); return res.body; };
const row = (id, date, amount, paid, pm = 'Cash') => ({ id, invoice_no: 'INV-' + id, date, time: '10:00', party_name: 'Customet', party_phone: null, amount, paid, balance: amount - paid, payment_type: pm });

test('summary matches the screenshot: Rs 1,000 sold, 1,000 received, balance 0, +100% vs empty last month', async () => {
  saleRows = [row(1, '2026-09-19', 1000, 1000)]; prevTotal = 0;
  const r = await run({ from: '2026-09-01', to: '2026-09-30', prev_from: '2026-08-01', prev_to: '2026-08-31' });
  assert.deepEqual([r.summary.total, r.summary.received, r.summary.balance, r.summary.changePercent], [1000, 1000, 0, 100]);
  assert.equal(r.rows[0].transaction, 'Sale');
  assert.equal(r.daily.length, 30);
  assert.equal(r.daily.find(d => d.date === '2026-09-19').total, 1000);
  assert.equal(calls.at(-1).params[1], '2026-08-01');
});

test('percent change up, down, and flat; credit balance adds up', async () => {
  saleRows = [row(1, '2026-09-02', 600, 100, 'Cash'), row(2, '2026-09-03', 400, 0, 'Credit')]; prevTotal = 2000;
  const r = await run({ from: '2026-09-01', to: '2026-09-30' });
  assert.equal(r.summary.total, 1000); assert.equal(r.summary.received, 100); assert.equal(r.summary.balance, 900);
  assert.equal(r.summary.changePercent, -50);
  prevTotal = 1000;
  assert.equal((await run({ from: '2026-09-01', to: '2026-09-30' })).summary.changePercent, 0);
  saleRows = []; prevTotal = 0;
  assert.equal((await run({ from: '2026-09-01', to: '2026-09-30' })).summary.changePercent, 0);
});

test('default previous period = same length just before', async () => {
  saleRows = []; await run({ from: '2026-09-11', to: '2026-09-20' });
  assert.deepEqual(calls.at(-1).params.slice(1), ['2026-09-01', '2026-09-10']);
});

test('bad dates are rejected with 400', async () => {
  for (const q of [{}, { from: '2026-09-01' }, { from: 'x', to: 'y' }, { from: '2026-10-01', to: '2026-09-01' }]) {
    await assert.rejects(() => run(q), e => e.status === 400);
  }
});

test('inventory: removed report types are refused, kept ones accepted', async () => {
  const inv = async type => { const res = { body: null, json(b) { this.body = b; return this; } }; await reports.inventory({ user: { hospital_id: 1 }, query: { type } }, res); return res.body; };
  for (const t of ['stock_summary', 'stock_ledger', 'history']) assert.equal((await inv(t)).reportType, t);
  for (const t of ['sales', 'purchases', 'low_stock', 'expiry', 'movement']) await assert.rejects(() => inv(t), e => e.status === 400);
  await inv('stock_summary');
  const sql = calls.at(-1).sql;
  assert.match(sql, /DATE\(st\.transaction_date\)<=\?/);      // stock on hand is "as of To date"
});
