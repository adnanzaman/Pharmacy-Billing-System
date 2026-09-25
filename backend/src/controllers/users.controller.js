const pool = require('../config/db');
const bcrypt = require('bcryptjs');

exports.list = async (req, res) => {
  const [rows] = await pool.query(`
    SELECT u.id, u.name, u.email, u.is_active, u.created_at,
           GROUP_CONCAT(DISTINCT r.name ORDER BY r.name SEPARATOR ',') AS roles
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id=u.id
      LEFT JOIN roles r ON r.id=ur.role_id
     WHERE u.hospital_id=?
     GROUP BY u.id, u.name, u.email, u.is_active, u.created_at
     ORDER BY u.name
  `, [req.user.hospital_id]);
  res.json(rows.map(r => ({ ...r, is_active: !!r.is_active, roles: r.roles ? r.roles.split(',') : [] })));
};

exports.getOne = async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id,name,email,is_active FROM users WHERE id=? AND hospital_id=? LIMIT 1',
    [req.params.id, req.user.hospital_id]
  );
  if (!rows.length) return res.status(404).json({ message: 'User not found' });
  const [roles] = await pool.query(
    `SELECT r.id,r.name FROM roles r INNER JOIN user_roles ur ON ur.role_id=r.id WHERE ur.user_id=? ORDER BY r.name`,
    [req.params.id]
  );
  res.json({ ...rows[0], is_active: !!rows[0].is_active, roles });
};

exports.create = async (req, res) => {
  const name = String(req.body?.name || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const roleIds = Array.isArray(req.body?.role_ids) ? req.body.role_ids.map(Number).filter(Boolean) : [];
  if (!name || !email || password.length < 6 || !roleIds.length) {
    return res.status(400).json({ message: 'Name, email, password (minimum 6 characters) and at least one role are required' });
  }

  const [exists] = await pool.query('SELECT id FROM users WHERE email=? LIMIT 1', [email]);
  if (exists.length) return res.status(409).json({ message: 'Email is already in use' });

  await validateRoles(roleIds);
  const hash = await bcrypt.hash(password, 12);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      'INSERT INTO users(hospital_id,branch_id,name,email,password_hash,is_active) VALUES(?,?,?,?,?,1)',
      [req.user.hospital_id, req.user.branch_id || null, name, email, hash]
    );
    await setRoles(conn, result.insertId, roleIds);
    await conn.commit();
    res.status(201).json({ id: result.insertId, name, email, is_active: true, role_ids: roleIds });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally { conn.release(); }
};

exports.update = async (req, res) => {
  const id = Number(req.params.id);
  const name = String(req.body?.name || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = req.body?.password == null ? '' : String(req.body.password);
  const roleIds = Array.isArray(req.body?.role_ids) ? req.body.role_ids.map(Number).filter(Boolean) : [];
  const isActive = req.body?.is_active === false ? 0 : 1;
  if (!name || !email || !roleIds.length) return res.status(400).json({ message: 'Name, email and at least one role are required' });

  const [target] = await pool.query('SELECT id,email FROM users WHERE id=? AND hospital_id=? LIMIT 1', [id, req.user.hospital_id]);
  if (!target.length) return res.status(404).json({ message: 'User not found' });
  const [exists] = await pool.query('SELECT id FROM users WHERE email=? AND id<>? LIMIT 1', [email, id]);
  if (exists.length) return res.status(409).json({ message: 'Email is already in use' });
  await validateRoles(roleIds);

  // Never allow the last active Admin account to be stripped of Admin access.
  const [targetRoles] = await pool.query(
    `SELECT r.name FROM user_roles ur INNER JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=?`,
    [id]
  );
  const hadAdmin = targetRoles.some(r => r.name === 'Admin');
  const keepsAdmin = roleIds.length > 0 && (await pool.query(`SELECT id FROM roles WHERE id IN (${roleIds.map(() => '?').join(',')}) AND name='Admin' LIMIT 1`, roleIds))[0].length > 0;
  if (hadAdmin && !keepsAdmin) {
    const [countRows] = await pool.query(
      `SELECT COUNT(DISTINCT u.id) AS c FROM users u INNER JOIN user_roles ur ON ur.user_id=u.id INNER JOIN roles r ON r.id=ur.role_id WHERE u.hospital_id=? AND u.is_active=1 AND r.name='Admin'`,
      [req.user.hospital_id]
    );
    if (Number(countRows[0].c) <= 1) return res.status(400).json({ message:'At least one active Admin account must remain' });
  }

  if (id === req.user.id && !isActive) return res.status(400).json({ message: 'You cannot deactivate your own account' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    if (password) {
      if (password.length < 6) throw Object.assign(new Error('Password must be at least 6 characters'), { status: 400 });
      const hash = await bcrypt.hash(password, 12);
      await conn.query('UPDATE users SET name=?,email=?,password_hash=?,is_active=? WHERE id=? AND hospital_id=?', [name,email,hash,isActive,id,req.user.hospital_id]);
    } else {
      await conn.query('UPDATE users SET name=?,email=?,is_active=? WHERE id=? AND hospital_id=?', [name,email,isActive,id,req.user.hospital_id]);
    }
    await setRoles(conn, id, roleIds);
    await conn.commit();
    res.json({ id,name,email,is_active:!!isActive,role_ids:roleIds });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally { conn.release(); }
};

exports.remove = async (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user.id) return res.status(400).json({ message: 'You cannot delete your own account' });
  const [target] = await pool.query('SELECT id FROM users WHERE id=? AND hospital_id=? LIMIT 1', [id, req.user.hospital_id]);
  if (!target.length) return res.status(404).json({ message: 'User not found' });
  await pool.query('UPDATE users SET is_active=0 WHERE id=?', [id]);
  res.json({ ok: true });
};

async function validateRoles(ids) {
  const clean = [...new Set(ids)];
  const [rows] = await pool.query(`SELECT id FROM roles WHERE id IN (${clean.map(() => '?').join(',')})`, clean);
  if (rows.length !== clean.length) throw Object.assign(new Error('One or more selected roles do not exist'), { status: 400 });
}

async function setRoles(conn, userId, roleIds) {
  await conn.query('DELETE FROM user_roles WHERE user_id=?', [userId]);
  await conn.query(
    `INSERT INTO user_roles(user_id,role_id) VALUES ${roleIds.map(() => '(?,?)').join(',')}`,
    roleIds.flatMap(r => [userId, r])
  );
}
