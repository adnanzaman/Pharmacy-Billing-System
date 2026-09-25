const pool = require('../config/db');
const { resolveHospitalId } = require('../services_accounting');

/* ---------------------------------------------------------------
   REPORTS
   Reports currently offered on the web "Reports" screen:
     Transaction report : Sale
     Item / Stock report: Stock Summary, Stock Ledger, Item Change History
   More reports are added one by one (see /api/reports/<name> in app.js).

   profitLoss, expiry and audit are NOT shown on the web screen any more,
   but the mobile app still calls profit-loss and expiry, so they stay.
---------------------------------------------------------------- */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Today's date (YYYY-MM-DD) in the business time zone (DB_TIMEZONE, default +05:00).
 *  new Date().toISOString() is UTC and returns *yesterday* between 00:00 and 05:00 in Pakistan. */
const todayYmd = () => {
  const m = /^([+-])(\d{2}):?(\d{2})$/.exec(process.env.DB_TIMEZONE || '+05:00');
  const offsetMin = m ? (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) : 0;
  return new Date(Date.now() + offsetMin * 60000).toISOString().slice(0, 10);
};

function httpError(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

/** reads ?from=&to= (YYYY-MM-DD). Defaults: from 2000-01-01, to today. */
const dates = req => {
  const from = req.query.from || '2000-01-01';
  const to = req.query.to || todayYmd();
  if (!ISO_DATE.test(from) || !ISO_DATE.test(to)) throw httpError(400, 'Dates must be YYYY-MM-DD');
  if (from > to) throw httpError(400, 'From date cannot be after To date');
  return { from, to };
};

const r2 = n => Math.round((Number(n || 0) + Number.EPSILON) * 100) / 100;

/* ============ kept for the mobile app ============ */

exports.profitLoss = async (req, res) => {
  const h = await resolveHospitalId(req), { from, to } = dates(req);

  // Income: sales less sale returns.
  const [[sales]] = await pool.query(
    `SELECT COALESCE(SUM(net_total),0) v
       FROM sales_invoices
      WHERE hospital_id=? AND COALESCE(status,'POSTED')<>'CANCELLED'
        AND DATE(invoice_date) BETWEEN ? AND ?`, [h, from, to]);

  const [[saleReturns]] = await pool.query(
    `SELECT COALESCE(SUM(net_total),0) v
       FROM sale_returns
      WHERE hospital_id=? AND DATE(return_date) BETWEEN ? AND ?`, [h, from, to]);

  // Purchase movement used for the accounting-style COGS calculation.
  const [[purchases]] = await pool.query(
    `SELECT COALESCE(SUM(net_total),0) v
       FROM purchase_invoices
      WHERE hospital_id=? AND COALESCE(status,'POSTED')<>'CANCELLED'
        AND DATE(invoice_date) BETWEEN ? AND ?`, [h, from, to]);

  const [[purchaseReturns]] = await pool.query(
    `SELECT COALESCE(SUM(net_total),0) v
       FROM purchase_returns
      WHERE hospital_id=? AND DATE(return_date) BETWEEN ? AND ?`, [h, from, to]);

  // Opening/closing stock at purchase cost. This makes the report behave like
  // a normal trading P&L rather than treating every purchase as an expense.
  const stockAt = async (date) => {
    const [rows] = await pool.query(
      `SELECT b.id, b.purchase_price,
              COALESCE(SUM(st.qty_in-st.qty_out),0) qty
         FROM medicine_batches b
         JOIN medicines m ON m.id=b.medicine_id
         LEFT JOIN stock_transactions st
           ON st.batch_id=b.id AND st.hospital_id=?
          AND DATE(st.transaction_date)<=?
        WHERE m.hospital_id=?
        GROUP BY b.id,b.purchase_price
        HAVING qty > 0`, [h, date, h]);
    return r2(rows.reduce((sum, r) => sum + Number(r.qty) * Number(r.purchase_price || 0), 0));
  };

  const dayBefore = new Date(`${from}T00:00:00`);
  dayBefore.setDate(dayBefore.getDate() - 1);
  const openingDate = dayBefore.toISOString().slice(0, 10);
  const openingStock = await stockAt(openingDate);
  const closingStock = await stockAt(to);

  const netSales = r2(Number(sales.v) - Number(saleReturns.v));
  const netPurchases = r2(Number(purchases.v) - Number(purchaseReturns.v));
  const cogs = r2(netPurchases + openingStock - closingStock);
  const grossProfit = r2(netSales - cogs);

  // Expenses are grouped by category so the UI can show Direct/Indirect
  // expenses where a category has been supplied. All expense rows remain
  // included in the total.
  const [expenseRows] = await pool.query(
    `SELECT COALESCE(NULLIF(TRIM(category),''),'Other Expenses') category,
            COALESCE(SUM(amount),0) amount
       FROM expenses
      WHERE hospital_id=? AND expense_date BETWEEN ? AND ?
      GROUP BY COALESCE(NULLIF(TRIM(category),''),'Other Expenses')
      ORDER BY amount DESC`, [h, from, to]);

  const expenses = expenseRows.map(r => ({ category: r.category, amount: r2(r.amount) }));
  const totalExpenses = r2(expenses.reduce((sum, r) => sum + r.amount, 0));

  // If accounting accounts are available, expose their posted income/expense
  // balances as an additional drill-down. This does not replace invoice data,
  // so the report remains usable with the existing hospital database.
  let accountSections = [];
  try {
    const [accounts] = await pool.query(
      `SELECT a.code,a.name,a.account_type,
              COALESCE(SUM(j.debit-j.credit),0) raw_balance
         FROM accounts a
         LEFT JOIN journal_entry_items j ON j.account_id=a.id
         LEFT JOIN journal_entries e ON e.id=j.journal_entry_id
           AND DATE(e.entry_date) BETWEEN ? AND ?
        WHERE a.hospital_id=?
          AND a.account_type IN ('INCOME','EXPENSE','REVENUE')
        GROUP BY a.id,a.code,a.name,a.account_type
        ORDER BY a.account_type,a.code`, [from, to, h]);

    accountSections = accounts.map(a => ({
      code: a.code,
      name: a.name,
      account_type: a.account_type,
      amount: r2(Math.abs(Number(a.raw_balance)))
    })).filter(a => a.amount > 0.009);
  } catch (_) {
    // Older databases may not have the accounting tables yet.
  }

  res.json({
    hospital: 'Punjab Hospital',
    from, to,
    sales: r2(Number(sales.v)),
    saleReturns: r2(Number(saleReturns.v)),
    netSales,
    purchases: r2(Number(purchases.v)),
    purchaseReturns: r2(Number(purchaseReturns.v)),
    netPurchases,
    openingStock,
    closingStock,
    costOfGoodsSold: cogs,
    grossProfit,
    expenses,
    totalExpenses,
    netProfit: r2(grossProfit - totalExpenses),
    accountSections
  });
};
exports.expiry = async (req, res) => {
  const [rows] = await pool.query(
    `SELECT b.*, m.name medicine_name,
            COALESCE((SELECT SUM(st.qty_in-st.qty_out) FROM stock_transactions st WHERE st.batch_id=b.id),0) stock
       FROM medicine_batches b JOIN medicines m ON m.id=b.medicine_id
      WHERE m.hospital_id=? AND b.expiry_date<=DATE_ADD(CURDATE(),INTERVAL 90 DAY) ORDER BY b.expiry_date`, [req.user.hospital_id]);
  res.json(rows);
};

exports.audit = async (req, res) => {
  const h = await resolveHospitalId(req), { from, to } = dates(req);
  const [rows] = await pool.query(
    `SELECT a.created_at,a.action,a.entity,a.entity_id,u.name user_name,a.details FROM audit_logs a LEFT JOIN users u ON u.id=a.user_id
      WHERE (u.hospital_id=? OR u.id IS NULL) AND DATE(a.created_at) BETWEEN ? AND ? ORDER BY a.created_at DESC LIMIT 2000`, [h, from, to]);
  res.json(rows);
};


/* ============ REPORTS: BILL WISE PROFIT ============ */
exports.billWiseProfit = async (req, res) => {
  const h = await resolveHospitalId(req), { from, to } = dates(req);
  const party = String(req.query.party || '').trim();
  const [rows] = await pool.query(
    `SELECT s.id, DATE_FORMAT(s.invoice_date,'%Y-%m-%d') date, s.invoice_no,
            COALESCE(p.name,'Cash Sale') party_name,
            COALESCE(SUM(si.total),0) sale_amount,
            COALESCE(SUM(si.qty * COALESCE(si.cost_price,0)),0) purchase_amount
       FROM sales_invoices s
       LEFT JOIN patients p ON p.id=s.patient_id
       LEFT JOIN sale_items si ON si.sale_id=s.id
             WHERE s.hospital_id=? AND COALESCE(s.status,'POSTED')<>'CANCELLED'
        AND DATE(s.invoice_date) BETWEEN ? AND ?
        AND (?='' OR COALESCE(p.name,'Cash Sale') LIKE CONCAT('%',?,'%'))
      GROUP BY s.id,s.invoice_date,s.invoice_no,p.name
      ORDER BY s.invoice_date ASC,s.id ASC`, [h, from, to, party, party]);
  const list = rows.map(r => ({
    id:r.id, date:r.date, invoice_no:r.invoice_no, party_name:r.party_name,
    sale_amount:r2(r.sale_amount), purchase_amount:r2(r.purchase_amount),
    profit_loss:r2(Number(r.sale_amount)-Number(r.purchase_amount))
  }));
  const totals = list.reduce((a,r) => ({
    sale_amount:r2(a.sale_amount+r.sale_amount), purchase_amount:r2(a.purchase_amount+r.purchase_amount), profit_loss:r2(a.profit_loss+r.profit_loss)
  }), {sale_amount:0,purchase_amount:0,profit_loss:0});
  res.json({from,to,rows:list,totals});
};

/* ============ REPORTS: CASH FLOW ============ */
exports.cashFlow = async (req, res) => {
  const h=req.user.hospital_id, {from,to}=dates(req);
  const [cashAccounts] = await pool.query(
    `SELECT id,code,name FROM accounts WHERE hospital_id=? AND account_type='ASSET' AND (code='1000' OR code='1100' OR code LIKE '11%') ORDER BY code`, [h]);
  const ids=cashAccounts.map(x=>x.id);
  if (!ids.length) return res.json({from,to,opening:0,rows:[],totalIn:0,totalOut:0,net:0});
  const placeholders=ids.map(()=>'?').join(',');
  const [[openingRow]] = await pool.query(
    `SELECT COALESCE(SUM(j.debit-j.credit),0) opening
       FROM journal_entry_items j JOIN journal_entries e ON e.id=j.journal_entry_id
      WHERE e.hospital_id=? AND j.account_id IN (${placeholders}) AND DATE(e.entry_date) < ?`, [h,...ids,from]);
  const [entries] = await pool.query(
    `SELECT e.id,e.entry_date,e.reference_type,e.reference_id,e.narration,
            COALESCE(SUM(CASE WHEN j.account_id IN (${placeholders}) THEN j.debit ELSE 0 END),0) cash_in,
            COALESCE(SUM(CASE WHEN j.account_id IN (${placeholders}) THEN j.credit ELSE 0 END),0) cash_out
       FROM journal_entries e JOIN journal_entry_items j ON j.journal_entry_id=e.id
      WHERE e.hospital_id=? AND DATE(e.entry_date) BETWEEN ? AND ?
      GROUP BY e.id,e.entry_date,e.reference_type,e.reference_id,e.narration
      HAVING cash_in>0.009 OR cash_out>0.009
      ORDER BY e.entry_date ASC,e.id ASC`, [
        ...ids,...ids,h,from,to
      ]);
  let balance=Number(openingRow.opening||0);
  const rows=entries.map(e=>{
    const inflow=Number(e.cash_in||0), outflow=Number(e.cash_out||0);
    const amount=inflow>0 ? inflow : outflow;
    const type=inflow>0 ? 'Inflow' : 'Outflow';
    balance=r2(balance+inflow-outflow);
    const labels={SALE:'Sales Receipt',PURCHASE:'Purchase Payment',PAYMENT:'Supplier/Customer Payment',EXPENSE:'Misc. Expense',TRANSFER:'Bank Transfer',PURCHASE_RETURN:'Purchase Return',SALE_RETURN:'Sale Return'};
    return {id:e.id,date:String(e.entry_date).slice(0,10),particulars:labels[e.reference_type]||e.narration||e.reference_type||'Cash Transaction',type,amount:r2(amount),balance};
  });
  const totalIn=r2(rows.filter(x=>x.type==='Inflow').reduce((a,x)=>a+x.amount,0));
  const totalOut=r2(rows.filter(x=>x.type==='Outflow').reduce((a,x)=>a+x.amount,0));
  res.json({from,to,opening:r2(openingRow.opening),rows,totalIn,totalOut,net:r2(totalIn-totalOut)});
};

/* ============ ITEM / STOCK REPORTS ============ */

const INVENTORY_TYPES = [
  'stock_summary', 'item_report_by_party', 'item_wise_profit_loss',
  'item_category_wise_profit_loss', 'low_stock_summary', 'stock_detail',
  'item_detail', 'sale_purchase_by_item_category', 'stock_summary_by_item_category',
  'item_wise_discount', 'stock_ledger', 'history'
];

exports.inventory = async (req, res) => {
  const h = await resolveHospitalId(req);
  const { from, to } = dates(req);
  const type = String(req.query.type || 'stock_summary');
  const party = String(req.query.party || '').trim();
  const category = String(req.query.category || '').trim();
  const item = String(req.query.item || '').trim();
  const showItemsInStock = String(req.query.show_items_in_stock || '') === '1';

  if (!INVENTORY_TYPES.includes(type)) {
    throw httpError(400, `Unknown inventory report type. Available: ${INVENTORY_TYPES.join(', ')}`);
  }

  let rows = [];

  if (type === 'stock_summary') {
    [rows] = await pool.query(
      `SELECT m.id, m.name item_name, m.reorder_level minimum_stock_qty,
              COALESCE(SUM(st.qty_in-st.qty_out),0) stock_qty,
              COALESCE(SUM((st.qty_in-st.qty_out)*COALESCE(st.unit_cost,0)),0) stock_value,
              c.name category_name
         FROM medicines m
         LEFT JOIN stock_transactions st ON st.medicine_id=m.id AND st.hospital_id=?
         LEFT JOIN medicine_categories c ON c.id=m.category_id
        WHERE m.hospital_id=? ${category ? 'AND c.name LIKE CONCAT(\'%\',?,\'%\')' : ''}
        GROUP BY m.id,m.name,m.reorder_level,c.name
        ${showItemsInStock ? 'HAVING stock_qty>0' : ''}
        ORDER BY m.name`, category ? [h,h,category] : [h,h]);
  } else if (type === 'low_stock_summary') {
    [rows] = await pool.query(
      `SELECT m.id, m.name item_name, m.reorder_level minimum_stock_qty,
              COALESCE(SUM(st.qty_in-st.qty_out),0) stock_qty,
              COALESCE(SUM((st.qty_in-st.qty_out)*COALESCE(st.unit_cost,0)),0) stock_value,
              c.name category_name
         FROM medicines m
         LEFT JOIN stock_transactions st ON st.medicine_id=m.id AND st.hospital_id=?
         LEFT JOIN medicine_categories c ON c.id=m.category_id
        WHERE m.hospital_id=? ${category ? 'AND c.name LIKE CONCAT(\'%\',?,\'%\')' : ''}
        GROUP BY m.id,m.name,m.reorder_level,c.name
        HAVING stock_qty<=minimum_stock_qty
        ORDER BY m.name`, category ? [h,h,category] : [h,h]);
  } else if (type === 'item_report_by_party') {
    const saleParty = party ? `AND COALESCE(p.name,'Cash Sale') LIKE CONCAT('%',?,'%')` : '';
    const purchaseParty = party ? `AND COALESCE(sp.name,'') LIKE CONCAT('%',?,'%')` : '';
    const itemFilter = item ? `AND m.name LIKE CONCAT('%',?,'%')` : '';
    const sql = `SELECT m.id,m.name item_name,
              COALESCE((SELECT SUM(si.qty) FROM sale_items si JOIN sales_invoices s ON s.id=si.sale_id LEFT JOIN patients p ON p.id=s.patient_id
                        WHERE si.medicine_id=m.id AND s.hospital_id=? AND s.status<>'CANCELLED' AND DATE(s.invoice_date) BETWEEN ? AND ? ${saleParty}),0) sale_quantity,
              COALESCE((SELECT SUM(si.total) FROM sale_items si JOIN sales_invoices s ON s.id=si.sale_id LEFT JOIN patients p ON p.id=s.patient_id
                        WHERE si.medicine_id=m.id AND s.hospital_id=? AND s.status<>'CANCELLED' AND DATE(s.invoice_date) BETWEEN ? AND ? ${saleParty}),0) sale_amount,
              COALESCE((SELECT SUM(pi.qty) FROM purchase_items pi JOIN purchase_invoices p ON p.id=pi.purchase_id LEFT JOIN suppliers sp ON sp.id=p.supplier_id
                        WHERE pi.medicine_id=m.id AND p.hospital_id=? AND p.status<>'CANCELLED' AND DATE(p.invoice_date) BETWEEN ? AND ? ${purchaseParty}),0) purchase_quantity,
              COALESCE((SELECT SUM(pi.total) FROM purchase_items pi JOIN purchase_invoices p ON p.id=pi.purchase_id LEFT JOIN suppliers sp ON sp.id=p.supplier_id
                        WHERE pi.medicine_id=m.id AND p.hospital_id=? AND p.status<>'CANCELLED' AND DATE(p.invoice_date) BETWEEN ? AND ? ${purchaseParty}),0) purchase_amount
         FROM medicines m WHERE m.hospital_id=? ${itemFilter} ORDER BY m.name`;
    const args=[];
    const pushBlock=(includeParty)=>{args.push(h,from,to); if(includeParty) args.push(party);};
    pushBlock(!!party); pushBlock(!!party); pushBlock(!!party); pushBlock(!!party); args.push(h); if(item) args.push(item);
    [rows] = await pool.query(sql,args);
  } else if (type === 'item_wise_profit_loss') {
    [rows] = await pool.query(
      `SELECT m.id,m.name item_name,
        COALESCE((SELECT SUM(st.qty_in-st.qty_out) FROM stock_transactions st WHERE st.medicine_id=m.id AND st.hospital_id=? AND DATE(st.transaction_date)<?),0) opening_quantity,
        COALESCE((SELECT SUM(st.qty_in-st.qty_out) FROM stock_transactions st WHERE st.medicine_id=m.id AND st.hospital_id=? AND DATE(st.transaction_date)<=?),0) closing_quantity,
        COALESCE((SELECT SUM(si.total) FROM sale_items si JOIN sales_invoices s ON s.id=si.sale_id WHERE si.medicine_id=m.id AND s.hospital_id=? AND s.status<>'CANCELLED' AND DATE(s.invoice_date) BETWEEN ? AND ?),0) sale,
        COALESCE((SELECT SUM(sri.total) FROM sale_return_items sri JOIN sale_returns sr ON sr.id=sri.sale_return_id WHERE sri.medicine_id=m.id AND sr.hospital_id=? AND DATE(sr.return_date) BETWEEN ? AND ?),0) credit_note,
        COALESCE((SELECT SUM(pi.total) FROM purchase_items pi JOIN purchase_invoices p ON p.id=pi.purchase_id WHERE pi.medicine_id=m.id AND p.hospital_id=? AND p.status<>'CANCELLED' AND DATE(p.invoice_date) BETWEEN ? AND ?),0) purchase,
        COALESCE((SELECT SUM(pri.total) FROM purchase_return_items pri JOIN purchase_returns pr ON pr.id=pri.purchase_return_id WHERE pri.medicine_id=m.id AND pr.hospital_id=? AND DATE(pr.return_date) BETWEEN ? AND ?),0) debit_note,
        COALESCE((SELECT SUM(si.tax) FROM sale_items si JOIN sales_invoices s ON s.id=si.sale_id WHERE si.medicine_id=m.id AND s.hospital_id=? AND DATE(s.invoice_date) BETWEEN ? AND ?),0) tax_receivable,
        COALESCE((SELECT SUM(pi.tax) FROM purchase_items pi JOIN purchase_invoices p ON p.id=pi.purchase_id WHERE pi.medicine_id=m.id AND p.hospital_id=? AND DATE(p.invoice_date) BETWEEN ? AND ?),0) tax_payable,
        0 manufacturing_cost, 0 consumption_cost,
        COALESCE((SELECT SUM(si.total-si.qty*COALESCE(si.cost_price,0)) FROM sale_items si JOIN sales_invoices s ON s.id=si.sale_id WHERE si.medicine_id=m.id AND s.hospital_id=? AND DATE(s.invoice_date) BETWEEN ? AND ?),0)
        -COALESCE((SELECT SUM(sri.total-sri.qty*COALESCE(sri.cost_price,0)) FROM sale_return_items sri JOIN sale_returns sr ON sr.id=sri.sale_return_id WHERE sri.medicine_id=m.id AND sr.hospital_id=? AND DATE(sr.return_date) BETWEEN ? AND ?),0) net_profit_loss
       FROM medicines m WHERE m.hospital_id=? ORDER BY m.name`,
      [h,from,h,to,h,from,to,h,from,to,h,from,to,h,from,to,h,from,to,h,from,to,h,from,to,h,from,to,h]
    );
  } else if (type === 'item_category_wise_profit_loss') {
    [rows] = await pool.query(
      `SELECT c.id,c.name category_name,
        COALESCE((SELECT SUM(si.total) FROM sale_items si JOIN sales_invoices s ON s.id=si.sale_id JOIN medicines m ON m.id=si.medicine_id WHERE m.category_id=c.id AND s.hospital_id=? AND s.status<>'CANCELLED' AND DATE(s.invoice_date) BETWEEN ? AND ?),0) sale,
        COALESCE((SELECT SUM(sri.total) FROM sale_return_items sri JOIN sale_returns sr ON sr.id=sri.sale_return_id JOIN medicines m ON m.id=sri.medicine_id WHERE m.category_id=c.id AND sr.hospital_id=? AND DATE(sr.return_date) BETWEEN ? AND ?),0) credit_note,
        COALESCE((SELECT SUM(pi.total) FROM purchase_items pi JOIN purchase_invoices p ON p.id=pi.purchase_id JOIN medicines m ON m.id=pi.medicine_id WHERE m.category_id=c.id AND p.hospital_id=? AND p.status<>'CANCELLED' AND DATE(p.invoice_date) BETWEEN ? AND ?),0) purchase,
        COALESCE((SELECT SUM(pri.total) FROM purchase_return_items pri JOIN purchase_returns pr ON pr.id=pri.purchase_return_id JOIN medicines m ON m.id=pri.medicine_id WHERE m.category_id=c.id AND pr.hospital_id=? AND DATE(pr.return_date) BETWEEN ? AND ?),0) debit_note,
        COALESCE((SELECT SUM(st.qty_in-st.qty_out) FROM stock_transactions st JOIN medicines m ON m.id=st.medicine_id WHERE m.category_id=c.id AND st.hospital_id=? AND DATE(st.transaction_date)<?),0) opening_quantity,
        COALESCE((SELECT SUM(st.qty_in-st.qty_out) FROM stock_transactions st JOIN medicines m ON m.id=st.medicine_id WHERE m.category_id=c.id AND st.hospital_id=? AND DATE(st.transaction_date)<=?),0) closing_quantity,
        COALESCE((SELECT SUM(si.tax) FROM sale_items si JOIN sales_invoices s ON s.id=si.sale_id JOIN medicines m ON m.id=si.medicine_id WHERE m.category_id=c.id AND s.hospital_id=? AND DATE(s.invoice_date) BETWEEN ? AND ?),0) tax_receivable,
        COALESCE((SELECT SUM(pi.tax) FROM purchase_items pi JOIN purchase_invoices p ON p.id=pi.purchase_id JOIN medicines m ON m.id=pi.medicine_id WHERE m.category_id=c.id AND p.hospital_id=? AND DATE(p.invoice_date) BETWEEN ? AND ?),0) tax_payable,
        0 manufacturing_cost,0 consumption_cost,
        COALESCE((SELECT SUM(si.total-si.qty*COALESCE(si.cost_price,0)) FROM sale_items si JOIN sales_invoices s ON s.id=si.sale_id JOIN medicines m ON m.id=si.medicine_id WHERE m.category_id=c.id AND s.hospital_id=? AND DATE(s.invoice_date) BETWEEN ? AND ?),0)
        -COALESCE((SELECT SUM(sri.total-sri.qty*COALESCE(sri.cost_price,0)) FROM sale_return_items sri JOIN sale_returns sr ON sr.id=sri.sale_return_id JOIN medicines m ON m.id=sri.medicine_id WHERE m.category_id=c.id AND sr.hospital_id=? AND DATE(sr.return_date) BETWEEN ? AND ?),0) net_profit_loss
       FROM medicine_categories c WHERE c.hospital_id=? ORDER BY c.name`,
      [h,from,to,h,from,to,h,from,to,h,from,to,h,from,h,to,h,from,to,h,from,to,h,from,to,h,from,to,h]
    );
  } else if (type === 'stock_detail') {
    [rows] = await pool.query(
      `SELECT m.id,m.name item_name,
        COALESCE((SELECT SUM(st.qty_in-st.qty_out) FROM stock_transactions st WHERE st.medicine_id=m.id AND st.hospital_id=? AND DATE(st.transaction_date)<?),0) beginning_quantity,
        COALESCE((SELECT SUM(st.qty_in) FROM stock_transactions st WHERE st.medicine_id=m.id AND st.hospital_id=? AND DATE(st.transaction_date) BETWEEN ? AND ?),0) quantity_in,
        COALESCE((SELECT SUM(pi.total) FROM purchase_items pi JOIN purchase_invoices p ON p.id=pi.purchase_id WHERE pi.medicine_id=m.id AND p.hospital_id=? AND p.status<>'CANCELLED' AND DATE(p.invoice_date) BETWEEN ? AND ?),0) purchase_amount,
        COALESCE((SELECT SUM(st.qty_out) FROM stock_transactions st WHERE st.medicine_id=m.id AND st.hospital_id=? AND DATE(st.transaction_date) BETWEEN ? AND ?),0) quantity_out,
        COALESCE((SELECT SUM(si.total) FROM sale_items si JOIN sales_invoices s ON s.id=si.sale_id WHERE si.medicine_id=m.id AND s.hospital_id=? AND s.status<>'CANCELLED' AND DATE(s.invoice_date) BETWEEN ? AND ?),0) sale_amount,
        COALESCE((SELECT SUM(st.qty_in-st.qty_out) FROM stock_transactions st WHERE st.medicine_id=m.id AND st.hospital_id=? AND DATE(st.transaction_date)<=?),0) closing_quantity
       FROM medicines m WHERE m.hospital_id=? ORDER BY m.name`,
      [h,from,h,from,to,h,from,to,h,from,to,h,from,to,h,to,h]
    );
  } else if (type === 'item_detail') {
    [rows] = await pool.query(
      `SELECT DATE(st.transaction_date) date,
              COALESCE(SUM(CASE WHEN st.reference_type IN ('SALE','SALE_RETURN','SALE_RETURN_EDIT') THEN st.qty_out-st.qty_in ELSE 0 END),0) sale_quantity,
              COALESCE(SUM(CASE WHEN st.reference_type IN ('PURCHASE','PURCHASE_RETURN','PURCHASE_RETURN_EDIT') THEN st.qty_in-st.qty_out ELSE 0 END),0) purchase_quantity,
              COALESCE(SUM(CASE WHEN COALESCE(st.reference_type,'') NOT IN ('SALE','SALE_RETURN','SALE_RETURN_EDIT','PURCHASE','PURCHASE_RETURN','PURCHASE_RETURN_EDIT') THEN st.qty_in-st.qty_out ELSE 0 END),0) adjustment_quantity,
              0 closing_quantity
         FROM stock_transactions st JOIN medicines m ON m.id=st.medicine_id
        WHERE st.hospital_id=? AND DATE(st.transaction_date) BETWEEN ? AND ? ${item ? 'AND m.name LIKE CONCAT(\'%\',?,\'%\')' : ''}
        GROUP BY DATE(st.transaction_date) ORDER BY DATE(st.transaction_date)`, item ? [h,from,to,item] : [h,from,to]);
  } else if (type === 'sale_purchase_by_item_category') {
    [rows] = await pool.query(
      `SELECT c.id,c.name category_name,
        COALESCE((SELECT SUM(si.qty) FROM sale_items si JOIN sales_invoices s ON s.id=si.sale_id JOIN medicines m ON m.id=si.medicine_id WHERE m.category_id=c.id AND s.hospital_id=? AND s.status<>'CANCELLED' AND DATE(s.invoice_date) BETWEEN ? AND ?),0) sale_quantity,
        COALESCE((SELECT SUM(si.total) FROM sale_items si JOIN sales_invoices s ON s.id=si.sale_id JOIN medicines m ON m.id=si.medicine_id WHERE m.category_id=c.id AND s.hospital_id=? AND s.status<>'CANCELLED' AND DATE(s.invoice_date) BETWEEN ? AND ?),0) total_sale_amount,
        COALESCE((SELECT SUM(pi.qty) FROM purchase_items pi JOIN purchase_invoices p ON p.id=pi.purchase_id JOIN medicines m ON m.id=pi.medicine_id WHERE m.category_id=c.id AND p.hospital_id=? AND p.status<>'CANCELLED' AND DATE(p.invoice_date) BETWEEN ? AND ?),0) purchase_quantity,
        COALESCE((SELECT SUM(pi.total) FROM purchase_items pi JOIN purchase_invoices p ON p.id=pi.purchase_id JOIN medicines m ON m.id=pi.medicine_id WHERE m.category_id=c.id AND p.hospital_id=? AND p.status<>'CANCELLED' AND DATE(p.invoice_date) BETWEEN ? AND ?),0) total_purchase_amount
       FROM medicine_categories c WHERE c.hospital_id=? ORDER BY c.name`,
      [h,from,to,h,from,to,h,from,to,h,from,to,h]
    );
  } else if (type === 'stock_summary_by_item_category') {
    [rows] = await pool.query(
      `SELECT c.id,c.name category_name,COALESCE(SUM(st.qty_in-st.qty_out),0) stock_quantity,
              COALESCE(SUM((st.qty_in-st.qty_out)*COALESCE(st.unit_cost,0)),0) stock_value
         FROM medicine_categories c LEFT JOIN medicines m ON m.category_id=c.id AND m.hospital_id=?
         LEFT JOIN stock_transactions st ON st.medicine_id=m.id AND st.hospital_id=?
        WHERE c.hospital_id=? GROUP BY c.id,c.name ORDER BY c.name`, [h,h,h]);
  } else if (type === 'item_wise_discount') {
    [rows] = await pool.query(
      `SELECT m.id,m.name item_name,COALESCE(SUM(si.qty),0) total_qty_sold,
              COALESCE(SUM(si.total),0) total_sale_amount,
              COALESCE(SUM(si.discount),0) total_disc_amount,
              CASE WHEN COALESCE(SUM(si.total),0)+COALESCE(SUM(si.discount),0)=0 THEN 0
                   ELSE ROUND(100*SUM(si.discount)/(SUM(si.total)+SUM(si.discount)),2) END avg_discount
         FROM medicines m JOIN sale_items si ON si.medicine_id=m.id JOIN sales_invoices s ON s.id=si.sale_id
        WHERE m.hospital_id=? AND s.hospital_id=? AND s.status<>'CANCELLED' AND DATE(s.invoice_date) BETWEEN ? AND ?
        GROUP BY m.id,m.name ORDER BY m.name`, [h,h,from,to]);
  } else if (type === 'stock_ledger') {
    [rows] = await pool.query(
      `SELECT st.transaction_date, m.name medicine_name, b.batch_no, st.transaction_type, st.reference_type, st.reference_id, st.qty_in, st.qty_out, st.unit_cost
         FROM stock_transactions st JOIN medicines m ON m.id=st.medicine_id LEFT JOIN medicine_batches b ON b.id=st.batch_id
        WHERE st.hospital_id=? AND DATE(st.transaction_date) BETWEEN ? AND ? ORDER BY st.transaction_date DESC, st.id DESC`, [h, from, to]);
  } else if (type === 'history') {
    [rows] = await pool.query(
      `SELECT a.created_at, a.action, a.entity, a.entity_id, u.name user_name, a.details
         FROM audit_logs a LEFT JOIN users u ON u.id=a.user_id
        WHERE COALESCE(u.hospital_id,?)=? AND DATE(a.created_at) BETWEEN ? AND ? AND a.entity='MEDICINE' ORDER BY a.created_at DESC`, [h, h, from, to]);
  }

  res.json({ hospital: 'Punjab Hospital', reportType: type, from, to, rows });
};

/* ============ TRANSACTION REPORT: SALE ============ */

/**
 * GET /api/reports/sale?from=&to=&prev_from=&prev_to=
 * One row per sale invoice + the summary card (total / received / balance)
 * + change % against the previous period (prev_from..prev_to; if not sent, the period just before, same length).
 */
exports.sale = async (req, res) => {
  const h = await resolveHospitalId(req);
  const from = req.query.from, to = req.query.to;
  if (!ISO_DATE.test(from || '') || !ISO_DATE.test(to || '')) throw httpError(400, 'from and to (YYYY-MM-DD) are required');
  if (from > to) throw httpError(400, 'From date cannot be after To date');

  const live = `s.hospital_id=? AND COALESCE(s.status,'POSTED')<>'CANCELLED'`;
  const [rows] = await pool.query(
    `SELECT s.id, s.invoice_no, DATE_FORMAT(s.invoice_date,'%Y-%m-%d') date, DATE_FORMAT(s.invoice_date,'%H:%i') time,
            COALESCE(p.name,'Cash Sale') party_name, p.mobile party_phone,
            s.net_total amount, s.paid, (s.net_total-s.paid) balance,
            CASE WHEN s.paid<=0.009 AND s.net_total>0.009 THEN 'Credit' ELSE COALESCE(s.payment_method,'Cash') END payment_type
       FROM sales_invoices s LEFT JOIN patients p ON p.id=s.patient_id
      WHERE ${live} AND DATE(s.invoice_date) BETWEEN ? AND ? ORDER BY s.invoice_date DESC, s.id DESC`, [h, from, to]);

  const list = rows.map(r => ({
    id: r.id, invoice_no: r.invoice_no, date: r.date, time: r.time, party_name: r.party_name, party_phone: r.party_phone,
    transaction: 'Sale', payment_type: r.payment_type, amount: r2(r.amount), paid: r2(r.paid), balance: r2(r.balance)
  }));
  const total = r2(list.reduce((s, r) => s + r.amount, 0));
  const received = r2(list.reduce((s, r) => s + r.paid, 0));

  // previous period
  const dayMs = 86400000;
  const days = Math.round((new Date(to) - new Date(from)) / dayMs) + 1;
  const iso = d => d.toISOString().slice(0, 10);
  let pFrom = req.query.prev_from, pTo = req.query.prev_to;
  if (!ISO_DATE.test(pFrom || '') || !ISO_DATE.test(pTo || '')) {
    const end = new Date(new Date(from) - dayMs);
    pTo = iso(end); pFrom = iso(new Date(end - (days - 1) * dayMs));
  }
  const [[prev]] = await pool.query(
    `SELECT COALESCE(SUM(s.net_total),0) total FROM sales_invoices s WHERE ${live} AND DATE(s.invoice_date) BETWEEN ? AND ?`, [h, pFrom, pTo]);
  const previous = r2(prev.total);
  const changePercent = previous > 0 ? Math.round(((total - previous) / previous) * 1000) / 10 : total > 0 ? 100 : 0;

  // one point per day for the chart (days without sales = 0)
  const byDay = {};
  list.forEach(r => { byDay[r.date] = r2((byDay[r.date] || 0) + r.amount); });
  const daily = [];
  for (let i = 0; i < Math.min(days, 366); i++) {
    const d = iso(new Date(new Date(from).getTime() + i * dayMs));
    daily.push({ date: d, total: byDay[d] || 0 });
  }

  res.json({ from, to, rows: list, summary: { total, received, balance: r2(total - received), previous, changePercent, previousFrom: pFrom, previousTo: pTo }, daily });
};

/* ============ TRANSACTION REPORT: PURCHASE ============ */

/**
 * GET /api/reports/purchase?from=&to=
 * One row per purchase invoice + a Paid / Unpaid / Total summary
 * (matches the "Purchase Bills" screen: Paid + Unpaid = Total).
 */
exports.purchase = async (req, res) => {
  const h = await resolveHospitalId(req);
  const from = req.query.from, to = req.query.to;
  if (!ISO_DATE.test(from || '') || !ISO_DATE.test(to || '')) throw httpError(400, 'from and to (YYYY-MM-DD) are required');
  if (from > to) throw httpError(400, 'From date cannot be after To date');

  const live = `p.hospital_id=? AND COALESCE(p.status,'POSTED')<>'CANCELLED'`;
  const [rows] = await pool.query(
    `SELECT p.id, p.invoice_no, DATE_FORMAT(p.invoice_date,'%Y-%m-%d') date,
            COALESCE(s.name,'Cash Purchase') party_name, s.phone party_phone,
            p.net_total amount, p.paid, (p.net_total-p.paid) balance, COALESCE((SELECT SUM(pi.bonus_qty) FROM purchase_items pi WHERE pi.purchase_id=p.id),0) bonus_qty,
            CASE WHEN p.paid<=0.009 AND p.net_total>0.009 THEN 'Credit' ELSE 'Cash' END payment_type
       FROM purchase_invoices p LEFT JOIN suppliers s ON s.id=p.supplier_id
      WHERE ${live} AND DATE(p.invoice_date) BETWEEN ? AND ? ORDER BY p.invoice_date DESC, p.id DESC`, [h, from, to]);

  const list = rows.map(r => ({
    id: r.id, invoice_no: r.invoice_no, date: r.date, party_name: r.party_name, party_phone: r.party_phone,
    transaction: 'Purchase', payment_type: r.payment_type, amount: r2(r.amount), paid: r2(r.paid), balance: r2(r.balance), bonus_qty: Number(r.bonus_qty||0)
  }));

  const total = r2(list.reduce((s, r) => s + r.amount, 0));
  const paid = r2(list.reduce((s, r) => s + r.paid, 0));
  const unpaid = r2(total - paid);

  res.json({ from, to, rows: list, summary: { total, paid, unpaid } });
};

/* ============ TRANSACTION REPORT: DAY BOOK ============ */

/**
 * GET /api/reports/daybook?date=YYYY-MM-DD
 * Every Sale + Purchase posted on one date, newest first.
 * Money In = cash received on a sale. Money Out = cash paid on a purchase.
 * (Payment In / Payment Out entries from the Cash & Bank module will join
 * this same list once that module exists - see the "next entries" note below.)
 */
exports.daybook = async (req, res) => {
  const h = await resolveHospitalId(req);
  const date = req.query.date || todayYmd();
  if (!ISO_DATE.test(date)) throw httpError(400, 'date must be YYYY-MM-DD');

  const [sales] = await pool.query(
    `SELECT s.id, s.invoice_no, DATE_FORMAT(s.invoice_date,'%H:%i:%s') time,
            COALESCE(p.name,'Cash Sale') name, p.mobile phone,
            s.net_total total,
            GREATEST(s.paid-COALESCE((SELECT SUM(a.amount) FROM payment_allocations a WHERE a.invoice_type='SALE' AND a.invoice_id=s.id),0),0) paid,
            CASE WHEN GREATEST(s.paid-COALESCE((SELECT SUM(a.amount) FROM payment_allocations a WHERE a.invoice_type='SALE' AND a.invoice_id=s.id),0),0)<=0.009 AND s.net_total>0.009 THEN 'Credit' ELSE COALESCE(s.payment_method,'Cash') END payment_type
       FROM sales_invoices s LEFT JOIN patients p ON p.id=s.patient_id
      WHERE s.hospital_id=? AND COALESCE(s.status,'POSTED')<>'CANCELLED' AND DATE(s.invoice_date)=?
      ORDER BY s.id DESC`, [h, date]);

  const [purchases] = await pool.query(
    `SELECT p.id, p.invoice_no, COALESCE(NULLIF(p.invoice_time,''),'00:00:00') time,
            COALESCE(s.name,'Cash Purchase') name, s.phone,
            p.net_total total,
            GREATEST(p.paid-COALESCE((SELECT SUM(a.amount) FROM payment_allocations a WHERE a.invoice_type='PURCHASE' AND a.invoice_id=p.id),0),0) paid,
            CASE WHEN GREATEST(p.paid-COALESCE((SELECT SUM(a.amount) FROM payment_allocations a WHERE a.invoice_type='PURCHASE' AND a.invoice_id=p.id),0),0)<=0.009 AND p.net_total>0.009 THEN 'Credit' ELSE 'Cash' END payment_type
       FROM purchase_invoices p LEFT JOIN suppliers s ON s.id=p.supplier_id
      WHERE p.hospital_id=? AND COALESCE(p.status,'POSTED')<>'CANCELLED' AND DATE(p.invoice_date)=?
      ORDER BY p.id DESC`, [h, date]);

  const [payments] = await pool.query(
    `SELECT pay.id, DATE_FORMAT(pay.created_at,'%H:%i:%s') time,
            pay.party_type, pay.party_id, pay.amount, pay.payment_method,
            COALESCE(pt.name,s.name,'Walk-in / Other') name,
            COALESCE(pt.mobile,s.phone) phone
       FROM payments pay
       LEFT JOIN patients pt ON pt.id=pay.party_id AND pay.party_type='PATIENT'
       LEFT JOIN suppliers s ON s.id=pay.party_id AND pay.party_type='SUPPLIER'
      WHERE pay.hospital_id=? AND DATE(pay.created_at)=?
      ORDER BY pay.id DESC`, [h, date]);

  const [saleReturns] = await pool.query(
    `SELECT r.id,r.return_no,r.net_total total,r.return_date,r.reason,
            COALESCE(p.name,'Cash Sale') name,p.mobile phone,
            COALESCE((SELECT DATE_FORMAT(MAX(e.entry_date),'%H:%i:%s') FROM journal_entries e WHERE e.hospital_id=r.hospital_id AND e.reference_type='SALE_RETURN' AND e.reference_id=r.id),'00:00:00') time
       FROM sale_returns r LEFT JOIN patients p ON p.id=r.patient_id
      WHERE r.hospital_id=? AND DATE(r.return_date)=?
      ORDER BY r.id DESC`, [h,date]);

  const [purchaseReturns] = await pool.query(
    `SELECT r.id,r.return_no,r.net_total total,r.return_date,r.reason,
            COALESCE(s.name,'Supplier') name,s.phone,
            COALESCE((SELECT DATE_FORMAT(MAX(e.entry_date),'%H:%i:%s') FROM journal_entries e WHERE e.hospital_id=r.hospital_id AND e.reference_type='PURCHASE_RETURN' AND e.reference_id=r.id),'00:00:00') time
       FROM purchase_returns r LEFT JOIN suppliers s ON s.id=r.supplier_id
      WHERE r.hospital_id=? AND DATE(r.return_date)=?
      ORDER BY r.id DESC`, [h,date]);

  const [expenses] = await pool.query(
    `SELECT e.id, e.category, e.description, e.amount, e.payment_method,
            COALESCE((SELECT DATE_FORMAT(MAX(j.entry_date),'%H:%i:%s') FROM journal_entries j WHERE j.hospital_id=e.hospital_id AND j.reference_type='EXPENSE' AND j.reference_id=e.id),'00:00:00') time
       FROM expenses e
      WHERE e.hospital_id=? AND DATE(e.expense_date)=?
      ORDER BY e.id DESC`, [h,date]);

  // Internal Cash & Bank transfers are also cash movements. They are stored as
  // journal entries rather than in the payments table, so include them here
  // without double-counting sales, purchases, expenses or party payments.
  let cashTransfers = [];
  try {
    const { accountIds } = require('../services_accounting');
    const ids = await accountIds(pool, h);
    const cashAccountId = ids['1000'];
    if (cashAccountId) {
      [cashTransfers] = await pool.query(
        `SELECT e.id, e.entry_date, e.narration,
                COALESCE(SUM(CASE WHEN j.account_id=? THEN j.debit ELSE 0 END),0) cash_in,
                COALESCE(SUM(CASE WHEN j.account_id=? THEN j.credit ELSE 0 END),0) cash_out
           FROM journal_entries e
           JOIN journal_entry_items j ON j.journal_entry_id=e.id
          WHERE e.hospital_id=? AND e.reference_type='TRANSFER' AND DATE(e.entry_date)=?
          GROUP BY e.id,e.entry_date,e.narration
         HAVING cash_in>0.009 OR cash_out>0.009
          ORDER BY e.id DESC`, [cashAccountId,cashAccountId,h,date]);
    }
  } catch (_) {
    cashTransfers = [];
  }

  const rows = [
    ...sales.map(r => ({
      id:`sale-${r.id}`, ref_id:r.id, transaction:'Sale', invoice_no:r.invoice_no, time:r.time,
      name:r.name, phone:r.phone, payment_type:r.payment_type, total:r2(r.total),
      money_in:r2(r.paid), money_out:0
    })),
    ...purchases.map(r => ({
      id:`purchase-${r.id}`, ref_id:r.id, transaction:'Purchase', invoice_no:r.invoice_no, time:r.time,
      name:r.name, phone:r.phone, payment_type:r.payment_type, total:r2(r.total),
      money_in:0, money_out:r2(r.paid)
    })),
    ...payments.map(r => ({
      id:`payment-${r.id}`, ref_id:r.id,
      transaction:r.party_type==='PATIENT'?'Payment In':'Payment Out',
      invoice_no:'', time:r.time, name:r.name, phone:r.phone,
      payment_type:r.payment_method, total:r2(r.amount),
      money_in:r.party_type==='PATIENT'?r2(r.amount):0,
      money_out:r.party_type==='SUPPLIER'?r2(r.amount):0
    })),
    ...saleReturns.map(r => ({
      id:`credit-${r.id}`, ref_id:r.id, transaction:'Credit Note', invoice_no:r.return_no,
      time:r.time || '00:00:00', name:r.name, phone:r.phone, payment_type:'Credit Note',
      total:r2(r.total), money_in:0, money_out:0
    })),
    ...purchaseReturns.map(r => ({
      id:`debit-${r.id}`, ref_id:r.id, transaction:'Debit Note', invoice_no:r.return_no,
      time:r.time || '00:00:00', name:r.name, phone:r.phone, payment_type:'Debit Note',
      total:r2(r.total), money_in:0, money_out:0
    })),
    ...expenses.map(r => ({
      id:`expense-${r.id}`, ref_id:r.id, transaction:'Expense', invoice_no:'',
      time:r.time || '00:00:00', name:r.category, phone:'', payment_type:r.payment_method,
      total:r2(r.amount), money_in:0, money_out:r2(r.amount)
    })),
    ...cashTransfers.map(r => {
      const moneyIn = r2(r.cash_in);
      const moneyOut = r2(r.cash_out);
      return {
        id:`cash-transfer-${r.id}`, ref_id:r.id, transaction:moneyIn > 0.009 ? 'Cash In' : 'Cash Out',
        invoice_no:'', time:String(r.entry_date).slice(11,19), name:r.narration || 'Cash / Bank Transfer', phone:'',
        payment_type:'Cash / Bank', total:r2(moneyIn || moneyOut), money_in:moneyIn, money_out:moneyOut
      };
    })
  ].sort((a,b)=>(a.time<b.time?1:a.time>b.time?-1:0));

  const totalIn=r2(rows.reduce((s,r)=>s+r.money_in,0));
  const totalOut=r2(rows.reduce((s,r)=>s+r.money_out,0));
  res.json({date,rows,summary:{totalIn,totalOut,net:r2(totalIn-totalOut)}});
};

/* ============ TRANSACTION REPORT: ALL TRANSACTIONS ============ */

/**
 * GET /api/reports/all?from=&to=&type=
 * Sale + Purchase + Expense in one list (the only transaction types this
 * system currently posts). type = all | sale | purchase | expense.
 * The reference screen also lists Payment-In, Payment-Out, Credit/Debit Note,
 * Sale/Purchase Order, Estimate, Proforma Invoice, Delivery Challan, Manufacture
 * and Journal Entry - those will join this list once those modules exist.
 */
const ALL_TXN_TYPES = ['all', 'sale', 'purchase', 'expense'];

exports.allTransactions = async (req, res) => {
  const h = await resolveHospitalId(req), { from, to } = dates(req);
  const type = String(req.query.type || 'all').toLowerCase();
  const allowed = ['all','sale','purchase','expense','payment_in','payment_out','credit_note','debit_note','journal'];
  if (!allowed.includes(type)) throw httpError(400, `Unknown type. Available: ${allowed.join(', ')}`);

  let rows = [];

  if (type === 'all' || type === 'sale') {
    const [sales] = await pool.query(
      `SELECT s.id,DATE_FORMAT(s.invoice_date,'%Y-%m-%d') date,DATE_FORMAT(s.invoice_date,'%H:%i:%s') time,
              COALESCE(p.name,'Cash Sale') party_name,p.mobile phone,s.net_total total,s.paid,
              CASE WHEN s.paid<=0.009 AND s.net_total>0.009 THEN 'Credit' ELSE COALESCE(s.payment_method,'Cash') END payment_type
         FROM sales_invoices s LEFT JOIN patients p ON p.id=s.patient_id
        WHERE s.hospital_id=? AND COALESCE(s.status,'POSTED')<>'CANCELLED' AND DATE(s.invoice_date) BETWEEN ? AND ?`,
      [h,from,to]);
    rows.push(...sales.map(r=>({id:`sale-${r.id}`,ref_id:r.id,date:r.date,time:r.time,party_name:r.party_name,phone:r.phone,category_name:'',transaction:'Sale',payment_type:r.payment_type,total:r2(r.total),received:r2(r.paid),balance:r2(r.total-r.paid)})));
  }

  if (type === 'all' || type === 'purchase') {
    const [purchases] = await pool.query(
      `SELECT p.id,DATE_FORMAT(p.invoice_date,'%Y-%m-%d') date,'00:00:00' time,
              COALESCE(s.name,'Cash Purchase') party_name,s.phone,p.net_total total,p.paid,
              CASE WHEN p.paid<=0.009 AND p.net_total>0.009 THEN 'Credit' ELSE 'Cash' END payment_type
         FROM purchase_invoices p LEFT JOIN suppliers s ON s.id=p.supplier_id
        WHERE p.hospital_id=? AND COALESCE(p.status,'POSTED')<>'CANCELLED' AND DATE(p.invoice_date) BETWEEN ? AND ?`,
      [h,from,to]);
    rows.push(...purchases.map(r=>({id:`purchase-${r.id}`,ref_id:r.id,date:r.date,time:r.time,party_name:r.party_name,phone:r.phone,category_name:'',transaction:'Purchase',payment_type:r.payment_type,total:r2(r.total),received:r2(r.paid),balance:r2(r.total-r.paid)})));
  }

  if (type === 'all' || type === 'expense') {
    const [rowsExp] = await pool.query(
      `SELECT id,expense_date date,'00:00:00' time,category,description,amount,payment_method
         FROM expenses WHERE hospital_id=? AND expense_date BETWEEN ? AND ?`,
      [h,from,to]);
    rows.push(...rowsExp.map(r=>({id:`expense-${r.id}`,ref_id:r.id,date:String(r.date).slice(0,10),time:r.time,party_name:r.description||'-',phone:null,category_name:r.category||'',transaction:'Expense',payment_type:r.payment_method||'Cash',total:r2(r.amount),received:r2(r.amount),balance:0})));
  }

  if (type === 'all' || type === 'payment_in' || type === 'payment_out') {
    const [payments] = await pool.query(
      `SELECT pay.id,DATE_FORMAT(pay.created_at,'%Y-%m-%d') date,DATE_FORMAT(pay.created_at,'%H:%i:%s') time,
              pay.party_type,pay.party_id,pay.amount,pay.payment_method,pay.reference_no,
              COALESCE(pt.name,s.name,'Walk-in / Other') party_name,COALESCE(pt.mobile,s.phone) phone
         FROM payments pay
         LEFT JOIN patients pt ON pt.id=pay.party_id AND pay.party_type='PATIENT'
         LEFT JOIN suppliers s ON s.id=pay.party_id AND pay.party_type='SUPPLIER'
        WHERE pay.hospital_id=? AND DATE(pay.created_at) BETWEEN ? AND ?`,
      [h,from,to]);
    rows.push(...payments.filter(r => type==='all' || (type==='payment_in' ? r.party_type==='PATIENT' : r.party_type==='SUPPLIER'))
      .map(r=>({id:`payment-${r.id}`,ref_id:r.id,date:r.date,time:r.time,party_name:r.party_name,phone:r.phone,category_name:r.reference_no||'',transaction:r.party_type==='PATIENT'?'Payment In':'Payment Out',payment_type:r.payment_method,total:r2(r.amount),received:r2(r.amount),balance:0})));
  }

  if (type === 'all' || type === 'credit_note') {
    const [returns] = await pool.query(
      `SELECT r.id,DATE_FORMAT(r.return_date,'%Y-%m-%d') date,'00:00:00' time,r.return_no,r.net_total total,r.reason,
              COALESCE(p.name,'Patient') party_name,p.mobile phone
         FROM sale_returns r LEFT JOIN patients p ON p.id=r.patient_id
        WHERE r.hospital_id=? AND DATE(r.return_date) BETWEEN ? AND ?`,
      [h,from,to]);
    rows.push(...returns.map(r=>({id:`credit-${r.id}`,ref_id:r.id,date:r.date,time:r.time,party_name:r.party_name,phone:r.phone,category_name:r.reason||'',transaction:'Credit Note',payment_type:'Credit Note',total:r2(r.total),received:0,balance:r2(r.total)})));
  }

  if (type === 'all' || type === 'debit_note') {
    const [returns] = await pool.query(
      `SELECT r.id,DATE_FORMAT(r.return_date,'%Y-%m-%d') date,'00:00:00' time,r.return_no,r.net_total total,r.reason,
              COALESCE(s.name,'Supplier') party_name,s.phone
         FROM purchase_returns r LEFT JOIN suppliers s ON s.id=r.supplier_id
        WHERE r.hospital_id=? AND DATE(r.return_date) BETWEEN ? AND ?`,
      [h,from,to]);
    rows.push(...returns.map(r=>({id:`debit-${r.id}`,ref_id:r.id,date:r.date,time:r.time,party_name:r.party_name,phone:r.phone,category_name:r.reason||'',transaction:'Debit Note',payment_type:'Debit Note',total:r2(r.total),received:0,balance:r2(r.total)})));
  }

  if (type === 'all' || type === 'journal') {
    const [entries] = await pool.query(
      `SELECT e.id,DATE_FORMAT(e.entry_date,'%Y-%m-%d') date,DATE_FORMAT(e.entry_date,'%H:%i:%s') time,
              e.reference_type,e.narration,COALESCE(SUM(j.debit),0) debit,COALESCE(SUM(j.credit),0) credit
         FROM journal_entries e JOIN journal_entry_items j ON j.journal_entry_id=e.id
        WHERE e.hospital_id=? AND DATE(e.entry_date) BETWEEN ? AND ?
        GROUP BY e.id,e.entry_date,e.reference_type,e.narration`,
      [h,from,to]);
    rows.push(...entries.map(r=>({id:`journal-${r.id}`,ref_id:r.id,date:r.date,time:r.time,party_name:r.narration||'Journal Entry',phone:null,category_name:r.reference_type||'',transaction:'Journal Entry',payment_type:r.reference_type||'',total:r2(r.debit),received:r2(r.debit),balance:r2(r.debit-r.credit)})));
  }

  rows.sort((a,b)=>(a.date<b.date?1:a.date>b.date?-1:(a.time<b.time?1:a.time>b.time?-1:0)));
  res.json({from,to,type,rows});
};

/* ============ PARTY REPORTS ============ */
exports.partyStatement = async (req, res) => {
  const h=req.user.hospital_id, {from,to}=dates(req), party=String(req.query.party||'').trim();
  const rows=[];
  const [sales]=await pool.query(`SELECT s.id,DATE_FORMAT(s.invoice_date,'%Y-%m-%d') date,s.invoice_no,
      COALESCE(p.name,'Cash Sale') party_name,s.net_total amount,s.paid
    FROM sales_invoices s LEFT JOIN patients p ON p.id=s.patient_id
    WHERE s.hospital_id=? AND COALESCE(s.status,'POSTED')<>'CANCELLED' AND DATE(s.invoice_date) BETWEEN ? AND ?
      AND (?='' OR COALESCE(p.name,'Cash Sale') LIKE CONCAT('%',?,'%')) ORDER BY s.invoice_date,s.id`,[h,from,to,party,party]);
  sales.forEach(r=>rows.push({id:`sale-${r.id}`,date:r.date,particulars:`Sale #${r.invoice_no}`,party_name:r.party_name,debit:r2(r.amount),credit:0}));
  const [purchases]=await pool.query(`SELECT p.id,DATE_FORMAT(p.invoice_date,'%Y-%m-%d') date,p.invoice_no,
      COALESCE(s.name,'Cash Purchase') party_name,p.net_total amount,p.paid
    FROM purchase_invoices p LEFT JOIN suppliers s ON s.id=p.supplier_id
    WHERE p.hospital_id=? AND COALESCE(p.status,'POSTED')<>'CANCELLED' AND DATE(p.invoice_date) BETWEEN ? AND ?
      AND (?='' OR COALESCE(s.name,'Cash Purchase') LIKE CONCAT('%',?,'%')) ORDER BY p.invoice_date,p.id`,[h,from,to,party,party]);
  purchases.forEach(r=>rows.push({id:`purchase-${r.id}`,date:r.date,particulars:`Purchase #${r.invoice_no}`,party_name:r.party_name,debit:0,credit:r2(r.amount)}));
  rows.sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
  let balance=0; rows.forEach(r=>{balance=r2(balance+r.debit-r.credit);r.balance=balance;});
  res.json({from,to,rows,totals:{debit:r2(rows.reduce((a,r)=>a+r.debit,0)),credit:r2(rows.reduce((a,r)=>a+r.credit,0)),balance}});
};

exports.partyWiseProfitLoss = async (req,res) => {
  const h=req.user.hospital_id,{from,to}=dates(req), party=String(req.query.party||'').trim();
  const [sales]=await pool.query(`SELECT COALESCE(p.name,'Cash Sale') party_name,COALESCE(SUM(si.total),0) sale_amount,
      COALESCE(SUM(si.qty*COALESCE(si.cost_price,0)),0) purchase_amount
    FROM sales_invoices s LEFT JOIN patients p ON p.id=s.patient_id LEFT JOIN sale_items si ON si.sale_id=s.id
    WHERE s.hospital_id=? AND COALESCE(s.status,'POSTED')<>'CANCELLED' AND DATE(s.invoice_date) BETWEEN ? AND ?
      AND (?='' OR COALESCE(p.name,'Cash Sale') LIKE CONCAT('%',?,'%')) GROUP BY COALESCE(p.name,'Cash Sale')`,[h,from,to,party,party]);
  const rows=sales.map(r=>({party_name:r.party_name,sale_amount:r2(r.sale_amount),purchase_amount:r2(r.purchase_amount),profit_loss:r2(Number(r.sale_amount)-Number(r.purchase_amount))}));
  const totals=rows.reduce((a,r)=>({sale_amount:r2(a.sale_amount+r.sale_amount),purchase_amount:r2(a.purchase_amount+r.purchase_amount),profit_loss:r2(a.profit_loss+r.profit_loss)}),{sale_amount:0,purchase_amount:0,profit_loss:0});
  res.json({from,to,rows,totals});
};

exports.allParties = async (req,res) => {
  const h=req.user.hospital_id;
  const [patients]=await pool.query(`SELECT p.id,'Customer' party_type,p.name,p.mobile phone,'' email,
      COALESCE((SELECT SUM(s.net_total-s.paid) FROM sales_invoices s WHERE s.patient_id=p.id AND s.hospital_id=? AND COALESCE(s.status,'POSTED')<>'CANCELLED'),0) receivable_balance,
      0 payable_balance FROM patients p WHERE p.hospital_id=?`,[h,h]);
  const [suppliers]=await pool.query(`SELECT s.id,'Supplier' party_type,s.name,s.phone,'' email,0 receivable_balance,
      COALESCE((SELECT SUM(p.net_total-p.paid) FROM purchase_invoices p WHERE p.supplier_id=s.id AND p.hospital_id=? AND COALESCE(p.status,'POSTED')<>'CANCELLED'),0) payable_balance
      FROM suppliers s WHERE s.hospital_id=?`,[h,h]);
  const rows=[...patients,...suppliers].map((r,i)=>({...r,row_no:i+1,receivable_balance:r2(r.receivable_balance),payable_balance:r2(r.payable_balance),credit_limit:null}));
  rows.sort((a,b)=>String(a.name).localeCompare(String(b.name)));
  res.json({rows});
};

exports.partyReportByItem = async (req,res) => {
  const h=req.user.hospital_id,{from,to}=dates(req), party=String(req.query.party||'').trim();
  const [sales]=await pool.query(`SELECT COALESCE(p.name,'Cash Sale') party_name,COALESCE(SUM(si.qty),0) sale_quantity,COALESCE(SUM(si.total),0) sale_amount
    FROM sales_invoices s LEFT JOIN patients p ON p.id=s.patient_id JOIN sale_items si ON si.sale_id=s.id
    WHERE s.hospital_id=? AND COALESCE(s.status,'POSTED')<>'CANCELLED' AND DATE(s.invoice_date) BETWEEN ? AND ?
      AND (?='' OR COALESCE(p.name,'Cash Sale') LIKE CONCAT('%',?,'%')) GROUP BY COALESCE(p.name,'Cash Sale')`,[h,from,to,party,party]);
  const [purchases]=await pool.query(`SELECT COALESCE(s.name,'Cash Purchase') party_name,COALESCE(SUM(pi.qty),0) purchase_quantity,COALESCE(SUM(pi.total),0) purchase_amount
    FROM purchase_invoices p LEFT JOIN suppliers s ON s.id=p.supplier_id JOIN purchase_items pi ON pi.purchase_id=p.id
    WHERE p.hospital_id=? AND COALESCE(p.status,'POSTED')<>'CANCELLED' AND DATE(p.invoice_date) BETWEEN ? AND ?
      AND (?='' OR COALESCE(s.name,'Cash Purchase') LIKE CONCAT('%',?,'%')) GROUP BY COALESCE(s.name,'Cash Purchase')`,[h,from,to,party,party]);
  const map=new Map();
  sales.forEach(r=>map.set(`C:${r.party_name}`,{party_name:r.party_name,sale_quantity:Number(r.sale_quantity||0),sale_amount:r2(r.sale_amount),purchase_quantity:0,purchase_amount:0}));
  purchases.forEach(r=>map.set(`S:${r.party_name}`,{party_name:r.party_name,sale_quantity:0,sale_amount:0,purchase_quantity:Number(r.purchase_quantity||0),purchase_amount:r2(r.purchase_amount)}));
  const rows=[...map.values()];
  const totals=rows.reduce((a,r)=>({sale_quantity:a.sale_quantity+r.sale_quantity,sale_amount:r2(a.sale_amount+r.sale_amount),purchase_quantity:a.purchase_quantity+r.purchase_quantity,purchase_amount:r2(a.purchase_amount+r.purchase_amount)}),{sale_quantity:0,sale_amount:0,purchase_quantity:0,purchase_amount:0});
  res.json({from,to,rows,totals});
};

exports.salePurchaseByParty = async (req,res) => {
  const h=req.user.hospital_id,{from,to}=dates(req), party=String(req.query.party||'').trim();
  const [sales]=await pool.query(`SELECT COALESCE(p.name,'Cash Sale') party_name,COALESCE(SUM(s.net_total),0) sale_amount FROM sales_invoices s LEFT JOIN patients p ON p.id=s.patient_id
    WHERE s.hospital_id=? AND COALESCE(s.status,'POSTED')<>'CANCELLED' AND DATE(s.invoice_date) BETWEEN ? AND ? AND (?='' OR COALESCE(p.name,'Cash Sale') LIKE CONCAT('%',?,'%')) GROUP BY COALESCE(p.name,'Cash Sale')`,[h,from,to,party,party]);
  const [purchases]=await pool.query(`SELECT COALESCE(s.name,'Cash Purchase') party_name,COALESCE(SUM(p.net_total),0) purchase_amount FROM purchase_invoices p LEFT JOIN suppliers s ON s.id=p.supplier_id
    WHERE p.hospital_id=? AND COALESCE(p.status,'POSTED')<>'CANCELLED' AND DATE(p.invoice_date) BETWEEN ? AND ? AND (?='' OR COALESCE(s.name,'Cash Purchase') LIKE CONCAT('%',?,'%')) GROUP BY COALESCE(s.name,'Cash Purchase')`,[h,from,to,party,party]);
  const map=new Map(); sales.forEach(r=>map.set(`C:${r.party_name}`,{party_name:r.party_name,sale_amount:r2(r.sale_amount),purchase_amount:0})); purchases.forEach(r=>map.set(`S:${r.party_name}`,{party_name:r.party_name,sale_amount:0,purchase_amount:r2(r.purchase_amount)}));
  const rows=[...map.values()]; const totals=rows.reduce((a,r)=>({sale_amount:r2(a.sale_amount+r.sale_amount),purchase_amount:r2(a.purchase_amount+r.purchase_amount)}),{sale_amount:0,purchase_amount:0});
  res.json({from,to,rows,totals});
};
