/* Edit adjustments for Sale / Purchase invoices
 * ------------------------------------------------------------------------------------------
 * Rule (same convention the rest of the system already uses):
 *   - an invoice keeps its GROSS quantities; Sale Returns (Credit Notes) / Purchase Returns
 *     (Debit Notes) are separate documents.  Balance due = net_total - paid - returns.
 *
 * When an invoice is edited, the form shows the quantity the party currently holds
 * (gross qty - qty already returned).  Comparing the edited quantity with that:
 *
 *   quantity REDUCED  -> an automatic Credit Note (sale) / Debit Note (purchase) is created for
 *                        the difference, dated today, so it appears in the Day Book. The invoice
 *                        keeps its gross line; stock is added back (sale) / taken out (purchase)
 *                        and Receivable / Payable goes down through the note.
 *   quantity INCREASED-> the invoice line itself grows: more stock goes out (sale) / comes in
 *                        (purchase) and the balance goes up. No note is needed.
 *   line REMOVED      -> same as reducing that line to 0.
 *
 * Nothing here changes the stock ledger or the journal on its own - the callers rebuild the
 * invoice's own ledger rows, and this module only adds the note documents on top.
 */

const r2 = n => Math.round((Number(n) || 0) * 100) / 100;
const r3 = n => Math.round((Number(n) || 0) * 1000) / 1000;
const EPS = 0.0005;

const keyOf = (medicineId, batchId) => `${Number(medicineId)}|${batchId == null || batchId === '' ? 0 : Number(batchId)}`;

/** Today (YYYY-MM-DD) in the business time zone (DB_TIMEZONE, default +05:00). */
function businessToday() {
  const m = /^([+-])(\d{2}):?(\d{2})$/.exec(process.env.DB_TIMEZONE || '+05:00');
  const offsetMin = m ? (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) : 0;
  return new Date(Date.now() + offsetMin * 60000).toISOString().slice(0, 10);
}

function pushTo(map, key, value) {
  if (!map.has(key)) map.set(key, []);
  map.get(key).push(value);
}

/**
 * Pure planner (no DB).
 *   oldItems      lines currently stored on the invoice (gross)
 *   newItems      lines posted from the edit form (effective quantities)
 *   returnedByKey Map(key -> qty already returned against this invoice)
 *   qtyOf(line)   units of a line (sale: qty, purchase: qty + bonus_qty)
 *   priceOf(line) per-unit value used to value the note (sale: unit_price, purchase: unit_cost)
 * Returns { items, adjustments, returnReductions }: `items` are the lines to store on the invoice,
 * `adjustments` are the reductions that need a new Credit / Debit Note and `returnReductions` are
 * quantities to take back out of existing notes because the edit increased the quantity.
 */
function planEditAdjustments({ oldItems = [], newItems = [], returnedByKey = new Map(), qtyOf, priceOf }) {
  const oldMap = new Map();
  for (const l of oldItems) pushTo(oldMap, keyOf(l.medicine_id, l.batch_id), l);
  const newMap = new Map();
  newItems.forEach((l, idx) => pushTo(newMap, l.batch_id ? keyOf(l.medicine_id, l.batch_id) : `new|${idx}`, { ...l }));

  const items = [];
  const adjustments = [];
  const returnReductions = [];

  for (const [key, lines] of newMap) {
    const target = r3(lines.reduce((a, l) => a + qtyOf(l), 0));
    const oldLines = oldMap.get(key);
    if (!oldLines) { items.push(...lines); continue; }           // brand-new item: plain addition

    const gross = r3(oldLines.reduce((a, l) => a + qtyOf(l), 0));
    const returned = r3(returnedByKey.get(key) || 0);
    const effective = r3(gross - returned);
    // Quantity INCREASED: first take units back out of the existing Credit / Debit Notes (the customer
    // keeps what was returned), and only the rest grows the invoice line. Otherwise the gross stays.
    const increase = r3(target - effective);
    const absorb = increase > EPS && returned > EPS ? r3(Math.min(increase, returned)) : 0;
    if (absorb > EPS) returnReductions.push({ medicine_id: oldLines[0].medicine_id, batch_id: oldLines[0].batch_id, qty: absorb });
    const newGross = increase > EPS ? r3(target + returned - absorb) : gross;
    const extra = r3(newGross - target);

    if (extra > EPS) {                                           // keep gross: fold the difference into the first line
      const first = lines[0];
      const base = Number(first.qty || 0);
      const factor = base > 0 ? (base + extra) / base : 1;
      first.qty = r3(base + extra);
      for (const f of ['discount', 'tax', 'cess']) if (first[f] != null) first[f] = r2(Number(first[f]) * factor);
    }
    if (target < effective - EPS) {
      const wQty = oldLines.reduce((a, l) => a + qtyOf(l), 0) || 1;
      const price = oldLines.reduce((a, l) => a + qtyOf(l) * Number(priceOf(l) || 0), 0) / wQty;
      adjustments.push({ medicine_id: oldLines[0].medicine_id, batch_id: oldLines[0].batch_id, qty: r3(effective - target), price: r2(price) });
    }
    lines.forEach(l => { l._existing = true; });
    items.push(...lines);
  }

  for (const [key, lines] of oldMap) {                           // lines removed from the form
    if (newMap.has(key)) continue;
    const gross = r3(lines.reduce((a, l) => a + qtyOf(l), 0));
    const effective = r3(gross - (returnedByKey.get(key) || 0));
    if (effective > EPS) {
      const price = lines.reduce((a, l) => a + qtyOf(l) * Number(priceOf(l) || 0), 0) / (gross || 1);
      adjustments.push({ medicine_id: lines[0].medicine_id, batch_id: lines[0].batch_id, qty: effective, price: r2(price) });
    }
    items.push(...lines.map(l => ({ ...l, _existing: true })));  // gross line is kept on the invoice
  }
  return { items, adjustments, returnReductions };
}

/** Adds `returned_qty` (units already returned, spread across duplicate lines in order) to invoice items. */
function annotateReturned(items, returnedByKey, qtyOf) {
  const left = new Map(returnedByKey);
  return items.map(it => {
    const k = keyOf(it.medicine_id, it.batch_id);
    const take = Math.min(qtyOf(it), left.get(k) || 0);
    left.set(k, (left.get(k) || 0) - take);
    return { ...it, returned_qty: r3(take) };
  });
}

async function saleReturnedMap(conn, h, saleId) {
  const [rows] = await conn.query(
    `SELECT ri.medicine_id,ri.batch_id,COALESCE(SUM(ri.qty),0) q FROM sale_return_items ri JOIN sale_returns r ON r.id=ri.sale_return_id WHERE r.sale_id=? AND r.hospital_id=? GROUP BY ri.medicine_id,ri.batch_id`, [saleId, h]);
  return new Map(rows.map(r => [keyOf(r.medicine_id, r.batch_id), Number(r.q)]));
}
async function purchaseReturnedMap(conn, h, purchaseId) {
  const [rows] = await conn.query(
    `SELECT ri.medicine_id,ri.batch_id,COALESCE(SUM(ri.qty),0) q FROM purchase_return_items ri JOIN purchase_returns r ON r.id=ri.purchase_return_id WHERE r.purchase_id=? AND r.hospital_id=? GROUP BY ri.medicine_id,ri.batch_id`, [purchaseId, h]);
  return new Map(rows.map(r => [keyOf(r.medicine_id, r.batch_id), Number(r.q)]));
}

/** Point every return line at the (re-created) invoice line, so "Returned" columns stay right. */
async function relinkSaleReturnItems(conn, saleId) {
  await conn.query(
    `UPDATE sale_return_items ri JOIN sale_returns r ON r.id=ri.sale_return_id
        SET ri.sale_item_id=(SELECT MIN(si.id) FROM sale_items si WHERE si.sale_id=r.sale_id AND si.medicine_id=ri.medicine_id AND si.batch_id=ri.batch_id)
      WHERE r.sale_id=?`, [saleId]);
}
async function relinkPurchaseReturnItems(conn, purchaseId) {
  await conn.query(
    `UPDATE purchase_return_items ri JOIN purchase_returns r ON r.id=ri.purchase_return_id
        SET ri.purchase_item_id=(SELECT MIN(pi.id) FROM purchase_items pi WHERE pi.purchase_id=r.purchase_id AND pi.medicine_id=ri.medicine_id AND pi.batch_id=ri.batch_id)
      WHERE r.purchase_id=?`, [purchaseId]);
}

/** Credit Note for quantity taken off a Sale invoice: stock back in, revenue + receivable + COGS reversed. */
async function createSaleEditCreditNote(conn, { h, userId, saleId, invoiceNo, patientId, adjustments, accountIds, postJournal }) {
  let subtotal = 0, cogsTotal = 0; const lines = [];
  for (const a of adjustments) {
    const [[b]] = await conn.query(`SELECT purchase_price FROM medicine_batches WHERE id=? AND medicine_id=?`, [a.batch_id, a.medicine_id]);
    const cost = Number(b?.purchase_price || 0), total = r2(a.qty * a.price);
    subtotal += total; cogsTotal += a.qty * cost;
    lines.push({ ...a, cost, total });
  }
  subtotal = r2(subtotal); cogsTotal = r2(cogsTotal);
  const returnNo = 'CN-' + Date.now(), today = businessToday();
  const reason = `Auto: quantity reduced when Sale ${invoiceNo} was edited`;
  const [r] = await conn.query(
    `INSERT INTO sale_returns(hospital_id,sale_id,patient_id,return_no,return_date,reason,subtotal,net_total,created_by) VALUES(?,?,?,?,?,?,?,?,?)`,
    [h, saleId, patientId || null, returnNo, today, reason, subtotal, subtotal, userId]);
  for (const l of lines) {
    const [[si]] = await conn.query(`SELECT MIN(id) id FROM sale_items WHERE sale_id=? AND medicine_id=? AND batch_id=?`, [saleId, l.medicine_id, l.batch_id]);
    await conn.query(`INSERT INTO sale_return_items(sale_return_id,sale_item_id,medicine_id,batch_id,qty,unit_price,cost_price,total) VALUES(?,?,?,?,?,?,?,?)`,
      [r.insertId, si?.id || null, l.medicine_id, l.batch_id, l.qty, l.price, l.cost, l.total]);
    await conn.query(`INSERT INTO stock_transactions(hospital_id,warehouse_id,medicine_id,batch_id,transaction_type,reference_type,reference_id,qty_in,unit_cost) VALUES(?,?,?,?,?,?,?,?,?)`,
      [h, null, l.medicine_id, l.batch_id, 'SALE_RETURN', 'SALE_RETURN', r.insertId, l.qty, l.cost]);
  }
  const ids = await accountIds(conn, h), sales = ids['4000'] || ids['4100'], ar = ids['1050'], inventory = ids['1200'] || ids['1300'], cogsAcc = ids['5000'] || ids['5100'];
  if (sales && ar && inventory && cogsAcc && subtotal > 0.009) {
    await postJournal(conn, { hospital_id: h, reference_type: 'SALE_RETURN', reference_id: r.insertId, narration: `Sale return ${returnNo} — ${reason}`,
      items: [{ account_id: sales, debit: subtotal }, { account_id: ar, credit: subtotal }, { account_id: inventory, debit: cogsTotal }, { account_id: cogsAcc, credit: cogsTotal }] });
  }
  return { id: r.insertId, return_no: returnNo, net_total: subtotal, items: lines.length };
}

/** Debit Note for quantity taken off a Purchase bill: stock out, payable + inventory reduced. */
async function createPurchaseEditDebitNote(conn, { h, userId, purchaseId, invoiceNo, supplierId, adjustments, accountIds, postJournal }) {
  let subtotal = 0; const lines = [];
  for (const a of adjustments) {
    const [[s]] = await conn.query(`SELECT COALESCE(SUM(qty_in-qty_out),0) stock FROM stock_transactions WHERE hospital_id=? AND medicine_id=? AND batch_id=?`, [h, a.medicine_id, a.batch_id]);
    if (Number(s.stock) + EPS < a.qty) {
      const [[b]] = await conn.query(`SELECT batch_no FROM medicine_batches WHERE id=?`, [a.batch_id]);
      throw new Error(`Cannot reduce ${a.qty} unit(s) for batch ${b?.batch_no || a.batch_id}: only ${Number(s.stock)} in stock (the rest was already sold or returned).`);
    }
    const total = r2(a.qty * a.price); subtotal += total; lines.push({ ...a, total });
  }
  subtotal = r2(subtotal);
  const returnNo = 'DN-' + Date.now(), today = businessToday();
  const reason = `Auto: quantity reduced when Purchase ${invoiceNo || '#' + purchaseId} was edited`;
  const [r] = await conn.query(
    `INSERT INTO purchase_returns(hospital_id,purchase_id,supplier_id,return_no,return_date,reason,subtotal,net_total,created_by) VALUES(?,?,?,?,?,?,?,?,?)`,
    [h, purchaseId, supplierId || null, returnNo, today, reason, subtotal, subtotal, userId]);
  for (const l of lines) {
    const [[pi]] = await conn.query(`SELECT MIN(id) id FROM purchase_items WHERE purchase_id=? AND medicine_id=? AND batch_id=?`, [purchaseId, l.medicine_id, l.batch_id]);
    await conn.query(`INSERT INTO purchase_return_items(purchase_return_id,purchase_item_id,medicine_id,batch_id,qty,unit_cost,total) VALUES(?,?,?,?,?,?,?)`,
      [r.insertId, pi?.id || null, l.medicine_id, l.batch_id, l.qty, l.price, l.total]);
    await conn.query(`INSERT INTO stock_transactions(hospital_id,warehouse_id,medicine_id,batch_id,transaction_type,reference_type,reference_id,qty_out,unit_cost,transaction_date) VALUES(?,?,?,?,?,?,?,?,?,?)`,
      [h, null, l.medicine_id, l.batch_id, 'PURCHASE_RETURN', 'PURCHASE_RETURN', r.insertId, l.qty, l.price, `${today} 00:00:00`]);
  }
  const ids = await accountIds(conn, h), ap = ids['2000'] || ids['2100'], inventory = ids['1200'] || ids['1300'];
  if (ap && inventory && subtotal > 0.009) {
    await postJournal(conn, { hospital_id: h, reference_type: 'PURCHASE_RETURN', reference_id: r.insertId, narration: `Purchase return ${returnNo} — ${reason}`,
      items: [{ account_id: ap, debit: subtotal }, { account_id: inventory, credit: subtotal }] });
  }
  return { id: r.insertId, return_no: returnNo, net_total: subtotal, items: lines.length };
}

/** Quantity increased on an invoice that has returns: shrink the newest Credit Note lines first. */
async function applySaleReturnReductions(conn, { h, saleId, reductions, accountIds, postJournal }) {
  const touched = new Set();
  for (const red of reductions) {
    let left = red.qty;
    const [rows] = await conn.query(
      `SELECT ri.id,ri.sale_return_id,ri.qty FROM sale_return_items ri JOIN sale_returns r ON r.id=ri.sale_return_id WHERE r.sale_id=? AND r.hospital_id=? AND ri.medicine_id=? AND ri.batch_id=? ORDER BY r.id DESC,ri.id DESC`,
      [saleId, h, red.medicine_id, red.batch_id]);
    for (const it of rows) {
      if (left <= EPS) break;
      const take = Math.min(left, Number(it.qty)), nq = r3(Number(it.qty) - take);
      if (nq <= EPS) await conn.query(`DELETE FROM sale_return_items WHERE id=?`, [it.id]);
      else await conn.query(`UPDATE sale_return_items SET qty=?,total=ROUND(?*unit_price,2) WHERE id=?`, [nq, nq, it.id]);
      touched.add(it.sale_return_id); left = r3(left - take);
    }
  }
  const ids = await accountIds(conn, h), sales = ids['4000'] || ids['4100'], ar = ids['1050'], inventory = ids['1200'] || ids['1300'], cogsAcc = ids['5000'] || ids['5100'];
  for (const rid of touched) {
    await conn.query(`DELETE FROM stock_transactions WHERE hospital_id=? AND reference_type IN ('SALE_RETURN','SALE_RETURN_EDIT') AND reference_id=?`, [h, rid]);
    await conn.query(`DELETE FROM journal_entries WHERE hospital_id=? AND reference_type='SALE_RETURN' AND reference_id=?`, [h, rid]);
    const [items] = await conn.query(`SELECT * FROM sale_return_items WHERE sale_return_id=?`, [rid]);
    if (!items.length) { await conn.query(`DELETE FROM sale_returns WHERE id=? AND hospital_id=?`, [rid, h]); continue; }   // note fully cancelled
    const [[ret]] = await conn.query(`SELECT return_no,reason FROM sale_returns WHERE id=?`, [rid]);
    const subtotal = r2(items.reduce((a, i) => a + Number(i.total), 0)), cogs = r2(items.reduce((a, i) => a + Number(i.qty) * Number(i.cost_price || 0), 0));
    await conn.query(`UPDATE sale_returns SET subtotal=?,net_total=? WHERE id=?`, [subtotal, subtotal, rid]);
    for (const i of items) await conn.query(`INSERT INTO stock_transactions(hospital_id,warehouse_id,medicine_id,batch_id,transaction_type,reference_type,reference_id,qty_in,unit_cost) VALUES(?,?,?,?,?,?,?,?,?)`,
      [h, null, i.medicine_id, i.batch_id, 'SALE_RETURN', 'SALE_RETURN', rid, i.qty, i.cost_price]);
    if (sales && ar && inventory && cogsAcc && subtotal > 0.009)
      await postJournal(conn, { hospital_id: h, reference_type: 'SALE_RETURN', reference_id: rid, narration: `Sale return ${ret.return_no}${ret.reason ? ' — ' + ret.reason : ''}`,
        items: [{ account_id: sales, debit: subtotal }, { account_id: ar, credit: subtotal }, { account_id: inventory, debit: cogs }, { account_id: cogsAcc, credit: cogs }] });
  }
  return touched.size;
}

/** Quantity increased on a bill that has returns: shrink the newest Debit Note lines first. */
async function applyPurchaseReturnReductions(conn, { h, purchaseId, reductions, accountIds, postJournal }) {
  const touched = new Set();
  for (const red of reductions) {
    let left = red.qty;
    const [rows] = await conn.query(
      `SELECT ri.id,ri.purchase_return_id,ri.qty FROM purchase_return_items ri JOIN purchase_returns r ON r.id=ri.purchase_return_id WHERE r.purchase_id=? AND r.hospital_id=? AND ri.medicine_id=? AND ri.batch_id=? ORDER BY r.id DESC,ri.id DESC`,
      [purchaseId, h, red.medicine_id, red.batch_id]);
    for (const it of rows) {
      if (left <= EPS) break;
      const take = Math.min(left, Number(it.qty)), nq = r3(Number(it.qty) - take);
      if (nq <= EPS) await conn.query(`DELETE FROM purchase_return_items WHERE id=?`, [it.id]);
      else await conn.query(`UPDATE purchase_return_items SET qty=?,total=ROUND(?*unit_cost,2) WHERE id=?`, [nq, nq, it.id]);
      touched.add(it.purchase_return_id); left = r3(left - take);
    }
  }
  const ids = await accountIds(conn, h), ap = ids['2000'] || ids['2100'], inventory = ids['1200'] || ids['1300'];
  for (const rid of touched) {
    await conn.query(`DELETE FROM stock_transactions WHERE hospital_id=? AND reference_type IN ('PURCHASE_RETURN','PURCHASE_RETURN_EDIT') AND reference_id=?`, [h, rid]);
    await conn.query(`DELETE FROM journal_entries WHERE hospital_id=? AND reference_type='PURCHASE_RETURN' AND reference_id=?`, [h, rid]);
    const [items] = await conn.query(`SELECT * FROM purchase_return_items WHERE purchase_return_id=?`, [rid]);
    if (!items.length) { await conn.query(`DELETE FROM purchase_returns WHERE id=? AND hospital_id=?`, [rid, h]); continue; }
    const [[ret]] = await conn.query(`SELECT return_no,reason,DATE_FORMAT(return_date,'%Y-%m-%d') d FROM purchase_returns WHERE id=?`, [rid]);
    const subtotal = r2(items.reduce((a, i) => a + Number(i.total), 0));
    await conn.query(`UPDATE purchase_returns SET subtotal=?,net_total=? WHERE id=?`, [subtotal, subtotal, rid]);
    for (const i of items) await conn.query(`INSERT INTO stock_transactions(hospital_id,warehouse_id,medicine_id,batch_id,transaction_type,reference_type,reference_id,qty_out,unit_cost,transaction_date) VALUES(?,?,?,?,?,?,?,?,?,?)`,
      [h, null, i.medicine_id, i.batch_id, 'PURCHASE_RETURN', 'PURCHASE_RETURN', rid, i.qty, i.unit_cost, `${ret.d} 00:00:00`]);
    if (ap && inventory && subtotal > 0.009)
      await postJournal(conn, { hospital_id: h, reference_type: 'PURCHASE_RETURN', reference_id: rid, narration: `Purchase return ${ret.return_no}${ret.reason ? ' — ' + ret.reason : ''}`,
        items: [{ account_id: ap, debit: subtotal }, { account_id: inventory, credit: subtotal }] });
  }
  return touched.size;
}

module.exports = {
  keyOf, planEditAdjustments, annotateReturned, businessToday,
  saleReturnedMap, purchaseReturnedMap, relinkSaleReturnItems, relinkPurchaseReturnItems,
  createSaleEditCreditNote, createPurchaseEditDebitNote, applySaleReturnReductions, applyPurchaseReturnReductions
};
