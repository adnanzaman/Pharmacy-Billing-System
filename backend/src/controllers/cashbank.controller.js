const pool = require('../config/db');
const { postJournal, accountIds, accountBalance, createBankAccount, resolveHospitalId, ensureCoreAccounts } = require('../services_accounting');

/* GET /api/cash-bank/accounts — Cash In Hand + every Bank Account with running balance */
exports.list = async (req, res) => {
  const h = await resolveHospitalId(req);
  await ensureCoreAccounts(pool, h);
  const conn = pool;
  const ids = await accountIds(conn, h);
  const cashAccountId = ids['1000'];
  const cashBalance = cashAccountId ? await accountBalance(conn, cashAccountId) : 0;

  const [banks] = await pool.query(
    `SELECT ba.*, a.code account_code FROM bank_accounts ba JOIN accounts a ON a.id=ba.account_id WHERE ba.hospital_id=? AND ba.is_active=1 ORDER BY ba.id`,
    [h]
  );
  const bankList = [];
  for (const b of banks) {
    const balance = await accountBalance(conn, b.account_id);
    bankList.push({ id: b.id, type: 'BANK', name: b.name, bank_name: b.bank_name, account_no: b.account_no, account_id: b.account_id, balance });
  }

  res.json({
    cash: { id: 'cash', type: 'CASH', name: 'Cash In Hand', account_id: cashAccountId, balance: cashBalance },
    banks: bankList
  });
};

/* POST /api/cash-bank/accounts — add a new bank account */
exports.create = async (req, res) => {
  const h = await resolveHospitalId(req);
  await ensureCoreAccounts(pool, h);
  const { name, bank_name, account_no, opening_balance = 0 } = req.body;
  if (!name) return res.status(400).json({ message: 'Bank account name is required' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await createBankAccount(conn, h, { name, bank_name, account_no, opening_balance });
    await conn.commit();
    res.status(201).json(result);
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

/* GET /api/cash-bank/ledger?account=cash|<bank_account_id> — transaction history */
exports.ledger = async (req, res) => {
  const h = await resolveHospitalId(req);
  const account = req.query.account;
  if (!account) return res.status(400).json({ message: 'account is required' });
  let accountId;
  if (account === 'cash') {
    const ids = await accountIds(pool, h);
    accountId = ids['1000'];
  } else {
    const [[b]] = await pool.query(`SELECT account_id FROM bank_accounts WHERE id=? AND hospital_id=?`, [account, h]);
    if (!b) return res.status(404).json({ message: 'Bank account not found' });
    accountId = b.account_id;
  }
  const [rows] = await pool.query(
    `SELECT e.entry_date, e.reference_type, e.reference_id, e.narration, j.debit, j.credit
     FROM journal_entry_items j JOIN journal_entries e ON e.id=j.journal_entry_id
     WHERE j.account_id=? ORDER BY e.entry_date DESC, e.id DESC LIMIT 500`,
    [accountId]
  );
  let running = await accountBalance(pool, accountId);
  const withRunning = rows.map(r => {
    const row = { ...r, running_balance: running };
    running -= Number(r.debit) - Number(r.credit);
    return row;
  });
  res.json(withRunning);
};

/* PUT /api/cash-bank/accounts/:id — edit bank account master data. Ledger account remains the same. */
exports.update = async (req, res) => {
  const h = await resolveHospitalId(req);
  const id = Number(req.params.id);
  const { name, bank_name, account_no } = req.body || {};
  if (!name) return res.status(400).json({ message: 'Account Name is required' });
  const [r] = await pool.query(`UPDATE bank_accounts SET name=?, bank_name=?, account_no=? WHERE id=? AND hospital_id=?`, [name, bank_name || null, account_no || null, id, h]);
  if (!r.affectedRows) return res.status(404).json({ message: 'Bank account not found' });
  await pool.query(`UPDATE accounts a JOIN bank_accounts ba ON ba.account_id=a.id SET a.name=? WHERE ba.id=? AND ba.hospital_id=?`, [name, id, h]);
  res.json({ id, message: 'Bank account updated' });
};

/* DELETE /api/cash-bank/accounts/:id — safe delete: only if the bank account has no ledger activity. */
exports.remove = async (req, res) => {
  const h = await resolveHospitalId(req);
  const id = Number(req.params.id);
  const [[b]] = await pool.query(`SELECT account_id FROM bank_accounts WHERE id=? AND hospital_id=?`, [id, h]);
  if (!b) return res.status(404).json({ message: 'Bank account not found' });
  const [[used]] = await pool.query(`SELECT COUNT(*) c FROM journal_entry_items WHERE account_id=?`, [b.account_id]);
  if (Number(used.c) > 0) return res.status(400).json({ message: 'This bank account has ledger transactions and cannot be deleted. Deactivate it instead.' });
  const conn = await pool.getConnection();
  try { await conn.beginTransaction(); await conn.query(`DELETE FROM bank_accounts WHERE id=? AND hospital_id=?`, [id,h]); await conn.query(`DELETE FROM accounts WHERE id=? AND hospital_id=?`, [b.account_id,h]); await conn.commit(); res.json({ message:'Bank account deleted' }); }
  catch(e){ await conn.rollback(); throw e; } finally { conn.release(); }
};

/* POST /api/cash-bank/opening-cash - record cash that was already in the drawer (or owner capital
   put in). Debit Cash In Hand / Credit Capital. Without it, cash purchases and expenses push
   Cash In Hand below zero because nothing ever put money in. */
exports.openingCash = async (req, res) => {
  const h = await resolveHospitalId(req);
  await ensureCoreAccounts(pool, h);
  const amount = Number(req.body?.amount);
  if (!(amount > 0)) return res.status(400).json({ message: 'Enter an amount greater than 0' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const ids = await accountIds(conn, h);
    if (!ids['1000'] || !ids['3000']) throw new Error('Cash In Hand / Capital account is not configured');
    await postJournal(conn, {
      hospital_id: h,
      reference_type: 'CASH_OPENING',
      reference_id: 0,
      narration: req.body?.notes || 'Opening cash / capital introduced',
      items: [{ account_id: ids['1000'], debit: amount }, { account_id: ids['3000'], credit: amount }]
    });
    await conn.commit();
    res.status(201).json({ message: 'Opening cash recorded' });
  } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
};

/* POST /api/cash-bank/transfer — move money between Cash and a Bank account (deposit / withdraw / bank-to-bank) */
exports.transfer = async (req, res) => {
  const h = await resolveHospitalId(req);
  await ensureCoreAccounts(pool, h);
  const { from, to, amount, notes } = req.body;
  if (!from || !to || !(Number(amount) > 0)) return res.status(400).json({ message: 'from, to and a positive amount are required' });
  if (from === to) return res.status(400).json({ message: 'Source and destination cannot be the same account' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const resolve = async key => {
      if (key === 'cash') {
        const ids = await accountIds(conn, h);
        return ids['1000'];
      }
      const [[b]] = await conn.query(`SELECT account_id FROM bank_accounts WHERE id=? AND hospital_id=?`, [key, h]);
      if (!b) throw new Error('Invalid account in transfer');
      return b.account_id;
    };
    const fromId = await resolve(from);
    const toId = await resolve(to);
    await postJournal(conn, {
      hospital_id: h,
      reference_type: 'TRANSFER',
      reference_id: 0,
      narration: notes || 'Fund transfer',
      items: [{ account_id: toId, debit: amount }, { account_id: fromId, credit: amount }]
    });
    await conn.commit();
    res.status(201).json({ message: 'Transfer recorded' });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};
