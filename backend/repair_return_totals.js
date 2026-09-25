/* One-time repair: restore the gross total of invoices that have Sale / Purchase Returns.
 *
 * Older versions of the return screens SUBTRACTED the returned amount from the invoice's own
 * net_total, while every "amount due" formula subtracts the returns again - so Receivable /
 * Payable were understated. Returns are now separate documents and the invoice keeps its gross
 * total (net_total = sum of its line items + round off).
 *
 *   node repair_return_totals.js           -> dry run, only prints what would change
 *   node repair_return_totals.js --apply   -> writes the corrected subtotal / net_total
 *
 * Only invoices that have at least one return are looked at. Take a database backup first.
 */
require('dotenv').config();
const pool = require('./src/config/db');
const APPLY = process.argv.includes('--apply');

async function fix(kind, invoiceTable, itemTable, fk, returnTable, returnFk, lineExpr) {
  const [rows] = await pool.query(
    `SELECT i.id, i.invoice_no, i.net_total, i.subtotal, i.round_off, i.paid,
            (SELECT COALESCE(SUM(t.total),0) FROM ${itemTable} t WHERE t.${fk}=i.id) items_total,
            (SELECT COALESCE(SUM(${lineExpr}),0) FROM ${itemTable} t WHERE t.${fk}=i.id) items_subtotal,
            (SELECT COALESCE(SUM(r.net_total),0) FROM ${returnTable} r WHERE r.${returnFk}=i.id) returned
       FROM ${invoiceTable} i
      WHERE EXISTS (SELECT 1 FROM ${returnTable} r WHERE r.${returnFk}=i.id)`);
  let changed = 0;
  for (const r of rows) {
    const gross = Math.round((Number(r.items_total) + Number(r.round_off || 0)) * 100) / 100;
    const subtotal = Math.round(Number(r.items_subtotal) * 100) / 100;
    if (Math.abs(gross - Number(r.net_total)) < 0.005) continue;
    changed++;
    console.log(`${kind} ${r.invoice_no || r.id}: net_total ${Number(r.net_total).toFixed(2)} -> ${gross.toFixed(2)}  (returned ${Number(r.returned).toFixed(2)}, paid ${Number(r.paid).toFixed(2)})`);
    if (APPLY) await pool.query(`UPDATE ${invoiceTable} SET net_total=?, subtotal=? WHERE id=?`, [gross, subtotal, r.id]);
  }
  console.log(`${kind}: ${rows.length} invoice(s) with returns, ${changed} ${APPLY ? 'corrected' : 'would be corrected'}`);
}

(async () => {
  try {
    await fix('SALE', 'sales_invoices', 'sale_items', 'sale_id', 'sale_returns', 'sale_id', 't.qty*t.unit_price-t.discount');
    await fix('PURCHASE', 'purchase_invoices', 'purchase_items', 'purchase_id', 'purchase_returns', 'purchase_id', 't.qty*t.unit_cost-t.discount');
    if (!APPLY) console.log('\nDry run only. Re-run with --apply to write the changes.');
  } catch (e) { console.error(e); process.exitCode = 1; }
  finally { await pool.end(); }
})();
