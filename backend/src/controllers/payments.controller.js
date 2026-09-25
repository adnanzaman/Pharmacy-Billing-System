const pool = require('../config/db');
const { resolveHospitalId } = require('../services_accounting');
const { postJournal, accountIds } = require('../services_accounting');

/* GET /api/payments/pending?type=PATIENT|SUPPLIER — parties with an outstanding balance */
exports.pending = async (req, res) => {
  const h = await resolveHospitalId(req);
  const type = String(req.query.type || 'PATIENT').toUpperCase();
  const q = String(req.query.q || '').trim();
  const like = `%${q}%`;
  if (type === 'SUPPLIER') {
    const [rows] = await pool.query(
      `SELECT s.id, s.name, s.phone, SUM(GREATEST(p.net_total - p.paid - COALESCE((SELECT SUM(r.net_total) FROM purchase_returns r WHERE r.purchase_id=p.id),0),0)) due, COUNT(*) invoices
       FROM purchase_invoices p JOIN suppliers s ON s.id=p.supplier_id
       WHERE p.hospital_id=? AND (?='' OR s.name LIKE ? OR COALESCE(s.phone,'') LIKE ?) GROUP BY s.id HAVING due > 0.009 ORDER BY due DESC`,
      [h, q, like, like]
    );
    return res.json(rows);
  }
  const [rows] = await pool.query(
    `SELECT pt.id, pt.name, pt.mobile, SUM(GREATEST(s.net_total - s.paid - COALESCE((SELECT SUM(r.net_total) FROM sale_returns r WHERE r.sale_id=s.id),0),0)) due, COUNT(*) invoices
     FROM sales_invoices s JOIN patients pt ON pt.id=s.patient_id
     WHERE s.hospital_id=? AND (?='' OR pt.name LIKE ? OR COALESCE(pt.mobile,'') LIKE ?) GROUP BY pt.id HAVING due > 0.009 ORDER BY due DESC`,
    [h, q, like, like]
  );
  res.json(rows);
};

/* GET /api/payments/party-invoices?type=PATIENT|SUPPLIER&party_id=# — this party's unpaid invoices,
   used both to build the "Tax Invoice" collection statement and to preview a payment allocation. */
exports.partyInvoices = async (req, res) => {
  const h = await resolveHospitalId(req);
  const type = String(req.query.type || 'PATIENT').toUpperCase();
  const partyId = req.query.party_id;
  if (!partyId) return res.status(400).json({ message: 'party_id is required' });
  if (type === 'SUPPLIER') {
    const [[supplier]] = await pool.query(`SELECT id,name,phone,address FROM suppliers WHERE id=? AND hospital_id=?`, [partyId, h]);
    const [rows] = await pool.query(
      `SELECT id, invoice_no, invoice_date, net_total, paid, GREATEST(net_total-paid-COALESCE((SELECT SUM(r.net_total) FROM purchase_returns r WHERE r.purchase_id=purchase_invoices.id),0),0) due
       FROM purchase_invoices WHERE hospital_id=? AND supplier_id=? AND GREATEST(net_total-paid-COALESCE((SELECT SUM(r.net_total) FROM purchase_returns r WHERE r.purchase_id=purchase_invoices.id),0),0) > 0.009 ORDER BY invoice_date`,
      [h, partyId]
    );
    return res.json({ party: supplier, invoices: rows, totalDue: rows.reduce((s, r) => s + Number(r.due), 0) });
  }
  const [[patient]] = await pool.query(`SELECT id,name,mobile AS phone,address FROM patients WHERE id=? AND hospital_id=?`, [partyId, h]);
  const [rows] = await pool.query(
    `SELECT id, invoice_no, invoice_date, net_total, paid, GREATEST(net_total-paid-COALESCE((SELECT SUM(r.net_total) FROM sale_returns r WHERE r.sale_id=sales_invoices.id),0),0) due
     FROM sales_invoices WHERE hospital_id=? AND patient_id=? AND GREATEST(net_total-paid-COALESCE((SELECT SUM(r.net_total) FROM sale_returns r WHERE r.sale_id=sales_invoices.id),0),0) > 0.009 ORDER BY invoice_date`,
    [h, partyId]
  );
  res.json({ party: patient, invoices: rows, totalDue: rows.reduce((s, r) => s + Number(r.due), 0) });
};

/* POST /api/payments — record money received from a patient or paid to a supplier.
   Allocates the amount across that party's oldest unpaid invoices first (FIFO)
   and posts the matching Cash/Bank <-> Accounts Receivable/Payable journal entry. */
exports.create = async (req, res) => {
  const h = await resolveHospitalId(req);
  const { party_type, party_id, amount, payment_method = 'Cash', bank_account_id, reference_no, notes } = req.body;
  const type = String(party_type || '').toUpperCase();
  if (!['PATIENT', 'SUPPLIER'].includes(type)) return res.status(400).json({ message: 'party_type must be PATIENT or SUPPLIER' });
  if (!party_id || !(Number(amount) > 0)) return res.status(400).json({ message: 'party_id and a positive amount are required' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const invoiceTable = type === 'PATIENT' ? 'sales_invoices' : 'purchase_invoices';
    const partyColumn = type === 'PATIENT' ? 'patient_id' : 'supplier_id';
    const returnTable = type === 'PATIENT' ? 'sale_returns' : 'purchase_returns';
    const [invoices] = await conn.query(
      `SELECT id, net_total, paid, GREATEST(net_total-paid-COALESCE((SELECT SUM(r.net_total) FROM ${returnTable} r WHERE r.${type === 'PATIENT' ? 'sale_id' : 'purchase_id'}=${invoiceTable}.id),0),0) effective_due
         FROM ${invoiceTable} WHERE hospital_id=? AND ${partyColumn}=?
         AND GREATEST(net_total-paid-COALESCE((SELECT SUM(r.net_total) FROM ${returnTable} r WHERE r.${type === 'PATIENT' ? 'sale_id' : 'purchase_id'}=${invoiceTable}.id),0),0) > 0.009
         ORDER BY invoice_date, id FOR UPDATE`, [h, party_id]);

    let remaining = Number(amount);
    const allocations = [];
    for (const inv of invoices) {
      if (remaining <= 0.009) break;
      const due = Number(inv.effective_due || 0);
      const apply = Math.min(due, remaining);
      await conn.query(`UPDATE ${invoiceTable} SET paid = paid + ? WHERE id=?`, [apply, inv.id]);
      allocations.push({ invoice_id: inv.id, amount: apply });
      remaining -= apply;
    }
    const applied = Number(amount) - remaining; // in case the payment exceeds total due, leftover stays unapplied

    const [pay] = await conn.query(
      `INSERT INTO payments(hospital_id,party_type,party_id,amount,payment_method,bank_account_id,reference_no,notes,created_by)
       VALUES(?,?,?,?,?,?,?,?,?)`,
      [h, type, party_id, amount, payment_method, bank_account_id || null, reference_no || null, notes || null, req.user.id]
    );
    for (const a of allocations) {
      await conn.query(
        `INSERT INTO payment_allocations(payment_id,invoice_type,invoice_id,amount) VALUES(?,?,?,?)`,
        [pay.insertId, type === 'PATIENT' ? 'SALE' : 'PURCHASE', a.invoice_id, a.amount]
      );
    }

    // ---- ledger posting ----
    const ids = await accountIds(conn, h);
    let cashOrBankId = ids['1000'];
    if (payment_method === 'Bank' && bank_account_id) {
      const [[b]] = await conn.query(`SELECT account_id FROM bank_accounts WHERE id=? AND hospital_id=?`, [bank_account_id, h]);
      if (b) cashOrBankId = b.account_id;
      else cashOrBankId = ids['1100'] || ids['1000'];
    } else if (payment_method === 'Bank') {
      cashOrBankId = ids['1100'] || ids['1000'];
    }
    const arOrAp = type === 'PATIENT' ? ids['1050'] : ids['2000'];
    if (cashOrBankId && arOrAp && applied > 0.009) {
      const items =
        type === 'PATIENT'
          ? [{ account_id: cashOrBankId, debit: applied }, { account_id: arOrAp, credit: applied }]
          : [{ account_id: arOrAp, debit: applied }, { account_id: cashOrBankId, credit: applied }];
      await postJournal(conn, {
        hospital_id: h,
        reference_type: 'PAYMENT',
        reference_id: pay.insertId,
        narration: notes || `Payment ${type === 'PATIENT' ? 'received' : 'made'}`,
        items
      });
    }

    await conn.commit();
    res.status(201).json({ id: pay.insertId, applied, unapplied: remaining });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

exports.list = async (req, res) => {
  const h = await resolveHospitalId(req);
  const type = String(req.query.type || '').toUpperCase();
  const q = String(req.query.q || '').trim();
  const method = String(req.query.payment_method || '').trim();
  const dateFrom = String(req.query.date_from || '').trim();
  const dateTo = String(req.query.date_to || '').trim();
  const params = [h];
  const where = ['pay.hospital_id=?'];
  if (type === 'PATIENT' || type === 'SUPPLIER') { where.push('pay.party_type=?'); params.push(type); }
  if (q) {
    const like = `%${q}%`;
    where.push(`(COALESCE(pt.name,'') LIKE ? OR COALESCE(pt.mobile,'') LIKE ? OR COALESCE(s.name,'') LIKE ? OR COALESCE(s.phone,'') LIKE ? OR COALESCE(pay.reference_no,'') LIKE ? OR COALESCE(pay.notes,'') LIKE ? OR CAST(pay.amount AS CHAR) LIKE ?)`);
    params.push(like,like,like,like,like,like,like);
  }
  if (method) { where.push('pay.payment_method=?'); params.push(method); }
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateFrom)) { where.push('DATE(pay.created_at)>=?'); params.push(dateFrom); }
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateTo)) { where.push('DATE(pay.created_at)<=?'); params.push(dateTo); }
  const [rows] = await pool.query(
    `SELECT pay.*, COALESCE(pt.name, s.name) party_name, COALESCE(pt.mobile, s.phone) party_phone
     FROM payments pay
     LEFT JOIN patients pt ON pt.id=pay.party_id AND pay.party_type='PATIENT'
     LEFT JOIN suppliers s ON s.id=pay.party_id AND pay.party_type='SUPPLIER'
     WHERE ${where.join(' AND ')} ORDER BY pay.id DESC LIMIT 500`,
    params
  );
  res.json(rows);
};
