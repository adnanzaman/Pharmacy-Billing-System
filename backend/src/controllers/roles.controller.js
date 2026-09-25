const pool = require('../config/db');

exports.permissions = async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, code FROM permissions ORDER BY code'
  );
  res.json(rows);
};

exports.list = async (req, res) => {
  const [rows] = await pool.query(`
    SELECT r.id, r.name,
           COUNT(DISTINCT ur.user_id) AS user_count,
           GROUP_CONCAT(DISTINCT p.code ORDER BY p.code SEPARATOR ',') AS permission_codes
      FROM roles r
      LEFT JOIN user_roles ur ON ur.role_id = r.id
      LEFT JOIN role_permissions rp ON rp.role_id = r.id
      LEFT JOIN permissions p ON p.id = rp.permission_id
     GROUP BY r.id, r.name
     ORDER BY r.name
  `);
  res.json(rows.map(r => ({
    ...r,
    user_count: Number(r.user_count || 0),
    permissions: r.permission_codes ? r.permission_codes.split(',') : []
  })));
};

exports.getOne = async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, name FROM roles WHERE id=? LIMIT 1',
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ message: 'Role not found' });

  const [perms] = await pool.query(
    `SELECT p.code FROM permissions p
      INNER JOIN role_permissions rp ON rp.permission_id=p.id
     WHERE rp.role_id=? ORDER BY p.code`,
    [req.params.id]
  );
  res.json({ ...rows[0], permissions: perms.map(p => p.code) });
};

exports.create = async (req, res) => {
  const name = String(req.body?.name || '').trim();
  const permissions = Array.isArray(req.body?.permissions) ? req.body.permissions : [];
  if (!name) return res.status(400).json({ message: 'Role name is required' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [exists] = await conn.query('SELECT id FROM roles WHERE LOWER(name)=LOWER(?) LIMIT 1', [name]);
    if (exists.length) throw Object.assign(new Error('Role already exists'), { status: 409 });

    const [result] = await conn.query('INSERT INTO roles(name) VALUES(?)', [name]);
    await syncPermissions(conn, result.insertId, permissions);
    await conn.commit();
    res.status(201).json(await rolePayload(result.insertId));
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

exports.update = async (req, res) => {
  const id = Number(req.params.id);
  const name = String(req.body?.name || '').trim();
  const permissions = Array.isArray(req.body?.permissions) ? req.body.permissions : [];
  if (!name) return res.status(400).json({ message: 'Role name is required' });

  const [current] = await pool.query('SELECT id, name FROM roles WHERE id=? LIMIT 1', [id]);
  if (!current.length) return res.status(404).json({ message: 'Role not found' });
  if (current[0].name === 'Admin' && name !== 'Admin') {
    return res.status(400).json({ message: 'The built-in Admin role cannot be renamed' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [dup] = await conn.query('SELECT id FROM roles WHERE LOWER(name)=LOWER(?) AND id<>? LIMIT 1', [name, id]);
    if (dup.length) throw Object.assign(new Error('Role already exists'), { status: 409 });
    await conn.query('UPDATE roles SET name=? WHERE id=?', [name, id]);
    await syncPermissions(conn, id, permissions);
    await conn.commit();
    res.json(await rolePayload(id));
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

exports.remove = async (req, res) => {
  const id = Number(req.params.id);
  const [rows] = await pool.query('SELECT id,name FROM roles WHERE id=? LIMIT 1', [id]);
  if (!rows.length) return res.status(404).json({ message: 'Role not found' });
  if (rows[0].name === 'Admin') return res.status(400).json({ message: 'The built-in Admin role cannot be deleted' });

  const [users] = await pool.query('SELECT COUNT(*) AS c FROM user_roles WHERE role_id=?', [id]);
  if (Number(users[0].c) > 0) {
    return res.status(400).json({ message: 'Move users to another role before deleting this role' });
  }
  await pool.query('DELETE FROM roles WHERE id=?', [id]);
  res.json({ ok: true });
};

async function syncPermissions(conn, roleId, codes) {
  const clean = [...new Set(codes.map(x => String(x).trim()).filter(Boolean))];
  await conn.query('DELETE FROM role_permissions WHERE role_id=?', [roleId]);
  if (!clean.length) return;
  const [rows] = await conn.query(
    `SELECT id, code FROM permissions WHERE code IN (${clean.map(() => '?').join(',')})`,
    clean
  );
  if (!rows.length) return;
  await conn.query(
    `INSERT INTO role_permissions(role_id, permission_id) VALUES ${rows.map(() => '(?,?)').join(',')}`,
    rows.flatMap(p => [roleId, p.id])
  );
}

async function rolePayload(id) {
  const [rows] = await pool.query('SELECT id,name FROM roles WHERE id=?', [id]);
  const [perms] = await pool.query(
    `SELECT p.code FROM permissions p INNER JOIN role_permissions rp ON rp.permission_id=p.id WHERE rp.role_id=? ORDER BY p.code`,
    [id]
  );
  return { ...rows[0], permissions: perms.map(p => p.code) };
}
