const pool = require('../config/db');
const { resolveHospitalId, ensureCoreAccounts } = require('../services_accounting');

/* =========================================================
   HOME DASHBOARD SUMMARY
   Total Receivable / Payable (with party counts), This-Month
   Sale (with % vs last month), Purchases, Expenses, Stock
   Value, Cash In Hand, Total Bank Balance.
========================================================= */
exports.summary = async (req, res) => {
  const h = await resolveHospitalId(req);
  await ensureCoreAccounts(pool, h);

  // ---- Receivable: all posted, unpaid sales, including walk-in sales.
  // due = invoice total - received - sale returns (an invoice keeps its gross total;
  // returns are separate credit notes). Cancelled invoices do not count.
  const [[receivable]] = await pool.query(
    `SELECT COALESCE(SUM(due),0) total,
            COUNT(DISTINCT CASE WHEN patient_id IS NOT NULL AND due > 0.009 THEN patient_id END) parties
       FROM (
         SELECT s.id, s.patient_id,
                GREATEST(s.net_total - s.paid - COALESCE((SELECT SUM(r.net_total) FROM sale_returns r WHERE r.sale_id=s.id AND r.hospital_id=?),0),0) due
           FROM sales_invoices s
          WHERE s.hospital_id=? AND COALESCE(s.status,'POSTED')<>'CANCELLED'
       ) x`, [h,h]);

  // ---- Payable: all posted, unpaid purchases, including purchases without a
  // supplier master record. Purchase returns reduce the outstanding amount.
  const [[payable]] = await pool.query(
    `SELECT COALESCE(SUM(due),0) total,
            COUNT(DISTINCT CASE WHEN supplier_id IS NOT NULL AND due > 0.009 THEN supplier_id END) parties
       FROM (
         SELECT p.id, p.supplier_id,
                GREATEST(p.net_total - p.paid - COALESCE((SELECT SUM(r.net_total) FROM purchase_returns r WHERE r.purchase_id=p.id AND r.hospital_id=?),0),0) due
           FROM purchase_invoices p
          WHERE p.hospital_id=? AND COALESCE(p.status,'POSTED')<>'CANCELLED'
       ) x`, [h,h]);

  // ---- This month / last month sale comparison ----
  const [[saleThisMonth]] = await pool.query(
    `SELECT COALESCE(SUM(net_total),0) v FROM sales_invoices
     WHERE hospital_id=? AND COALESCE(status,'POSTED')<>'CANCELLED' AND YEAR(invoice_date)=YEAR(CURDATE()) AND MONTH(invoice_date)=MONTH(CURDATE())`, [h]);
  const [[saleLastMonth]] = await pool.query(
    `SELECT COALESCE(SUM(net_total),0) v FROM sales_invoices
     WHERE hospital_id=? AND COALESCE(status,'POSTED')<>'CANCELLED' AND YEAR(invoice_date)=YEAR(CURDATE()-INTERVAL 1 MONTH) AND MONTH(invoice_date)=MONTH(CURDATE()-INTERVAL 1 MONTH)`, [h]);

  // ---- This month purchases / expenses ----
  const [[purchaseThisMonth]] = await pool.query(
    `SELECT COALESCE(SUM(net_total),0) v FROM purchase_invoices
     WHERE hospital_id=? AND COALESCE(status,'POSTED')<>'CANCELLED' AND YEAR(invoice_date)=YEAR(CURDATE()) AND MONTH(invoice_date)=MONTH(CURDATE())`, [h]);
  const [[expenseThisMonth]] = await pool.query(
    `SELECT COALESCE(SUM(amount),0) v FROM expenses
     WHERE hospital_id=? AND YEAR(expense_date)=YEAR(CURDATE()) AND MONTH(expense_date)=MONTH(CURDATE())`, [h]);

  // ---- Stock value (current qty x purchase cost of each batch) ----
  const [[stockValue]] = await pool.query(
    `SELECT COALESCE(SUM(qty*purchase_price),0) v FROM (
       SELECT b.id, b.purchase_price,
         COALESCE((SELECT SUM(st.qty_in-st.qty_out) FROM stock_transactions st WHERE st.batch_id=b.id AND st.hospital_id=?),0) qty
       FROM medicine_batches b JOIN medicines m ON m.id=b.medicine_id
       WHERE m.hospital_id=?
     ) x WHERE qty > 0`, [h,h]);

  // ---- Cash in hand / Bank balance (ledger balance of Cash & Bank accounts) ----
  const [[cash]] = await pool.query(
    `SELECT COALESCE(SUM(j.debit-j.credit),0) v FROM accounts a
     JOIN journal_entry_items j ON j.account_id=a.id
     WHERE a.hospital_id=? AND a.code='1000'`, [h]);
  const [[bank]] = await pool.query(
    `SELECT COALESCE(SUM(j.debit-j.credit),0) v FROM accounts a
     JOIN journal_entry_items j ON j.account_id=a.id
     WHERE a.hospital_id=? AND a.code LIKE '11%'`, [h]);

  // ---- Legacy today fields (kept for backward compatibility) ----
  const [[salesToday]] = await pool.query(
    `SELECT COALESCE(SUM(net_total),0) value FROM sales_invoices WHERE hospital_id=? AND DATE(invoice_date)=CURDATE()`, [h]);
  const [[purchasesToday]] = await pool.query(
    `SELECT COALESCE(SUM(net_total),0) value FROM purchase_invoices WHERE hospital_id=? AND invoice_date=CURDATE()`, [h]);
  const [[patientsToday]] = await pool.query(
    `SELECT COUNT(*) value FROM patients WHERE hospital_id=? AND DATE(created_at)=CURDATE()`, [h]);
  const [[expensesToday]] = await pool.query(
    `SELECT COALESCE(SUM(amount),0) value FROM expenses WHERE hospital_id=? AND expense_date=CURDATE()`, [h]);
  const [[lowStock]] = await pool.query(
    `SELECT COUNT(*) value FROM (
       SELECT m.id, m.reorder_level, COALESCE(SUM(st.qty_in-st.qty_out),0) qty
       FROM medicines m LEFT JOIN stock_transactions st ON st.medicine_id=m.id
       WHERE m.hospital_id=? GROUP BY m.id,m.reorder_level
     ) x WHERE qty <= reorder_level`, [h]);
  const [[expiry]] = await pool.query(
    `SELECT COUNT(*) value FROM medicine_batches b
     JOIN medicines m ON m.id=b.medicine_id
     WHERE m.hospital_id=? AND b.expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(),INTERVAL 90 DAY)`, [h]);

  const thisMonth = Number(saleThisMonth.v), lastMonth = Number(saleLastMonth.v);
  const saleChangePercent = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 1000) / 10 : null;

  res.json({
    totalReceivable: Number(receivable.total),
    receivableParties: Number(receivable.parties),
    totalPayable: Number(payable.total),
    payableParties: Number(payable.parties),
    totalSaleThisMonth: thisMonth,
    totalSaleLastMonth: lastMonth,
    saleChangePercent,
    totalPurchaseThisMonth: Number(purchaseThisMonth.v),
    totalExpenseThisMonth: Number(expenseThisMonth.v),
    stockValue: Number(stockValue.v),
    cashInHand: Number(cash.v),
    bankBalance: Number(bank.v),

    // legacy fields (older mobile screens read these)
    todaySales: salesToday.value,
    todayPurchases: purchasesToday.value,
    todayPatients: patientsToday.value,
    todayExpenses: expensesToday.value,
    lowStock: lowStock.value,
    expiry90Days: expiry.value
  });
};

/* =========================================================
   SALE TREND (for the dashboard graph) — daily totals for
   the requested number of days, default 30, current month.
========================================================= */
exports.trend = async (req, res) => {
  const h = await resolveHospitalId(req);
  const days = Math.min(Math.max(Number(req.query.days) || 30, 7), 90);
  const [rows] = await pool.query(
    `SELECT DATE_FORMAT(invoice_date, '%Y-%m-%d') date, COALESCE(SUM(net_total),0) total
     FROM sales_invoices
     WHERE hospital_id=? AND invoice_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
     GROUP BY DATE_FORMAT(invoice_date, '%Y-%m-%d')
     ORDER BY date`, [h, days]);

  // fill in missing days with 0 so the graph is continuous
  const map = Object.fromEntries(rows.map(r => [r.date, Number(r.total)]));
  const out = [];
  for (let i = days; i >= 0; i--) {
    const dt = new Date();
    dt.setDate(dt.getDate() - i);
    const d = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    out.push({ date: d, total: map[d] || 0 });
  }
  res.json(out);
};
