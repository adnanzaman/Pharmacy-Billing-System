const test = require('node:test');
const assert = require('node:assert/strict');
const { planEditAdjustments, annotateReturned, keyOf } = require('../src/services_edit_adjustments');

const saleQty = l => Number(l.qty || 0);
const salePrice = l => Number(l.unit_price || 0);
const plan = (oldItems, newItems, returned = []) => planEditAdjustments({
  oldItems, newItems, qtyOf: saleQty, priceOf: salePrice,
  returnedByKey: new Map(returned.map(([m, b, q]) => [keyOf(m, b), q]))
});

test('reducing a sale line makes a credit note and keeps the gross invoice line', () => {
  const p = plan([{ medicine_id: 3, batch_id: 4, qty: 5, unit_price: 30, discount: 10, tax: 0 }],
                 [{ medicine_id: 3, batch_id: 4, qty: 3, unit_price: 30, discount: 6, tax: 0 }]);
  assert.deepEqual(p.adjustments, [{ medicine_id: 3, batch_id: 4, qty: 2, price: 30 }]);
  assert.equal(p.items.length, 1);
  assert.equal(p.items[0].qty, 5);          // gross stays
  assert.equal(p.items[0].discount, 10);    // discount scaled back to the gross line
});

test('increasing a sale line grows the invoice and needs no note', () => {
  const p = plan([{ medicine_id: 3, batch_id: 4, qty: 2, unit_price: 30 }], [{ medicine_id: 3, batch_id: 4, qty: 6, unit_price: 30 }]);
  assert.equal(p.adjustments.length, 0);
  assert.equal(p.items[0].qty, 6);
});

test('with an earlier return the edited qty is compared with what the customer still holds', () => {
  // sold 5, 2 already returned -> holds 3. Editing to 4 = customer takes 1 more => gross 6
  let p = plan([{ medicine_id: 3, batch_id: 4, qty: 5, unit_price: 30 }], [{ medicine_id: 3, batch_id: 4, qty: 4, unit_price: 30 }], [[3, 4, 2]]);
  assert.equal(p.adjustments.length, 0);
  assert.deepEqual(p.returnReductions.map(r => r.qty), [1]);   // 1 unit is taken back out of the existing credit note
  assert.equal(p.items[0].qty, 5);                              // so the invoice itself does not grow
  // editing to 1 = 2 more units come back => credit note for 2, gross stays 5
  p = plan([{ medicine_id: 3, batch_id: 4, qty: 5, unit_price: 30 }], [{ medicine_id: 3, batch_id: 4, qty: 1, unit_price: 30 }], [[3, 4, 2]]);
  assert.deepEqual(p.adjustments.map(a => a.qty), [2]);
  assert.equal(p.items[0].qty, 5);
  // unchanged (3) => nothing happens, gross stays 5
  p = plan([{ medicine_id: 3, batch_id: 4, qty: 5, unit_price: 30 }], [{ medicine_id: 3, batch_id: 4, qty: 3, unit_price: 30 }], [[3, 4, 2]]);
  assert.equal(p.adjustments.length, 0);
  assert.equal(p.items[0].qty, 5);
});

test('removing a line credits the remaining quantity and keeps the gross line', () => {
  const p = plan([{ medicine_id: 1, batch_id: 1, qty: 4, unit_price: 10 }, { medicine_id: 2, batch_id: 2, qty: 1, unit_price: 50 }],
                 [{ medicine_id: 2, batch_id: 2, qty: 1, unit_price: 50 }]);
  assert.deepEqual(p.adjustments, [{ medicine_id: 1, batch_id: 1, qty: 4, price: 10 }]);
  assert.equal(p.items.length, 2);
});

test('a brand-new line is a plain addition', () => {
  const p = plan([{ medicine_id: 1, batch_id: 1, qty: 4, unit_price: 10 }], [{ medicine_id: 1, batch_id: 1, qty: 4, unit_price: 10 }, { medicine_id: 9, batch_id: 9, qty: 2, unit_price: 5 }]);
  assert.equal(p.adjustments.length, 0);
  assert.equal(p.items.length, 2);
});

test('purchase: bonus units count, reduction becomes a debit note', () => {
  const units = l => Number(l.qty || 0) + Number(l.bonus_qty || 0);
  const p = planEditAdjustments({
    oldItems: [{ medicine_id: 3, batch_id: 4, qty: 500, bonus_qty: 12, unit_cost: 21, discount: 0 }],
    newItems: [{ medicine_id: 3, batch_id: 4, qty: 400, bonus_qty: 12, unit_cost: 21, discount: 0 }],
    qtyOf: units, priceOf: l => Number(l.unit_cost), returnedByKey: new Map()
  });
  assert.deepEqual(p.adjustments, [{ medicine_id: 3, batch_id: 4, qty: 100, price: 21 }]);
  assert.equal(units(p.items[0]), 512);
});

test('annotateReturned spreads returned units over duplicate lines', () => {
  const out = annotateReturned([{ medicine_id: 1, batch_id: 1, qty: 2 }, { medicine_id: 1, batch_id: 1, qty: 3 }], new Map([[keyOf(1, 1), 4]]), saleQty);
  assert.deepEqual(out.map(x => x.returned_qty), [2, 2]);
});

test('increase larger than the returned quantity: notes fully cancelled, remainder grows the invoice', () => {
  // sold 5, 2 returned (holds 3). Edit to 7 => +4: 2 come out of the credit note, 2 grow the invoice to 7
  const p = plan([{ medicine_id: 3, batch_id: 4, qty: 5, unit_price: 30 }], [{ medicine_id: 3, batch_id: 4, qty: 7, unit_price: 30 }], [[3, 4, 2]]);
  assert.deepEqual(p.returnReductions.map(r => r.qty), [2]);
  assert.equal(p.items[0].qty, 7);
  assert.equal(p.adjustments.length, 0);
});
