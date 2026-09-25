const pool = require('../config/db');
const bcrypt = require('bcryptjs');

async function resolveHospitalId(req) {
  if (req.user?.hospital_id) return Number(req.user.hospital_id);
  const [rows] = await pool.query('SELECT hospital_id FROM users WHERE id=? LIMIT 1', [req.user.id]);
  return rows[0]?.hospital_id ? Number(rows[0].hospital_id) : 1;
}

async function requireAdmin(req, res) {
  if (!req.user?.id) {
    res.status(401).json({ message: 'Authentication required' });
    return false;
  }

  // Legacy installations use "System Administrator" while newer
  // installations may use the built-in "Admin" role. Do not rely only
  // on the JWT role string because older tokens and migrated users can
  // contain a different display name. Resolve the user's actual roles.
  const [rows] = await pool.query(
    `SELECT r.name
       FROM user_roles ur
       INNER JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = ?
        AND r.name IN ('Admin','System Administrator')
      LIMIT 1`,
    [req.user.id]
  );

  if (!rows.length && !['Admin', 'System Administrator'].includes(req.user.role) && !(Number(req.user.id) === 1 && req.user.name === 'System Administrator')) {
    res.status(403).json({ message: 'Administrator access required' });
    return false;
  }
  return true;
}

exports.listUsers = async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  const hospitalId = await resolveHospitalId(req);
  const [rows] = await pool.query(`
    SELECT u.id,u.name,u.email,u.is_active,u.hospital_id,u.branch_id,u.created_at,
           GROUP_CONCAT(DISTINCT r.name ORDER BY r.name SEPARATOR ', ') AS roles
    FROM users u
    LEFT JOIN user_roles ur ON ur.user_id=u.id
    LEFT JOIN roles r ON r.id=ur.role_id
    WHERE u.hospital_id=? OR u.hospital_id IS NULL
    GROUP BY u.id
    ORDER BY u.id DESC`, [hospitalId]);
  res.json(rows);
};

exports.createUser = async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  const { name, email, password, role_id, is_active = 1, branch_id = null } = req.body || {};
  if (!name || !email || !password || !role_id) return res.status(400).json({ message: 'Name, email, password and role are required' });
  if (String(password).length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [roleRows] = await conn.query('SELECT id FROM roles WHERE id=? LIMIT 1', [role_id]);
    if (!roleRows.length) throw Object.assign(new Error('Selected role not found'), { status: 400 });
    const [existing] = await conn.query('SELECT id FROM users WHERE email=? LIMIT 1', [email.trim()]);
    if (existing.length) throw Object.assign(new Error('Email already exists'), { status: 409 });
    const hash = await bcrypt.hash(password, 10);
    const [result] = await conn.query(
      'INSERT INTO users (hospital_id,branch_id,name,email,password_hash,is_active) VALUES (?,?,?,?,?,?)',
      [await resolveHospitalId(req), branch_id || null, name.trim(), email.trim(), hash, is_active ? 1 : 0]
    );
    await conn.query('INSERT INTO user_roles (user_id,role_id) VALUES (?,?)', [result.insertId, role_id]);
    await conn.commit();
    res.status(201).json({ id: result.insertId, message: 'User created successfully' });
  } catch (e) {
    await conn.rollback();
    res.status(e.status || 500).json({ message: e.message || 'Could not create user' });
  } finally { conn.release(); }
};

exports.updateUser = async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  const id = Number(req.params.id);
  const { name, email, password, role_id, is_active, branch_id = null } = req.body || {};
  if (!name || !email || !role_id) return res.status(400).json({ message: 'Name, email and role are required' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [users] = await conn.query('SELECT id FROM users WHERE id=? AND (hospital_id=? OR hospital_id IS NULL) LIMIT 1', [id, await resolveHospitalId(req)]);
    if (!users.length) throw Object.assign(new Error('User not found'), { status: 404 });
    const [roles] = await conn.query('SELECT id FROM roles WHERE id=? LIMIT 1', [role_id]);
    if (!roles.length) throw Object.assign(new Error('Selected role not found'), { status: 400 });
    const [dupe] = await conn.query('SELECT id FROM users WHERE email=? AND id<>? LIMIT 1', [email.trim(), id]);
    if (dupe.length) throw Object.assign(new Error('Email already exists'), { status: 409 });
    if (password && String(password).length < 6) throw Object.assign(new Error('Password must be at least 6 characters'), { status: 400 });
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      await conn.query('UPDATE users SET name=?,email=?,password_hash=?,is_active=?,branch_id=? WHERE id=?', [name.trim(), email.trim(), hash, is_active ? 1 : 0, branch_id || null, id]);
    } else {
      await conn.query('UPDATE users SET name=?,email=?,is_active=?,branch_id=? WHERE id=?', [name.trim(), email.trim(), is_active ? 1 : 0, branch_id || null, id]);
    }
    await conn.query('DELETE FROM user_roles WHERE user_id=?', [id]);
    await conn.query('INSERT INTO user_roles (user_id,role_id) VALUES (?,?)', [id, role_id]);
    await conn.commit();
    res.json({ message: 'User updated successfully' });
  } catch (e) {
    await conn.rollback();
    res.status(e.status || 500).json({ message: e.message || 'Could not update user' });
  } finally { conn.release(); }
};

exports.listRoles = async (req, res) => {
  if (!(await requireAdmin(req, res))) return;

  // Keep this query compatible with older MariaDB/MySQL versions.
  // Do not use JSON_ARRAYAGG/JSON_ARRAY because some installations do not
  // provide those functions. Fetch role permissions separately instead.
  const [roles] = await pool.query('SELECT id,name FROM roles ORDER BY name');
  const [rolePermissions] = await pool.query(
    'SELECT role_id, permission_id FROM role_permissions ORDER BY role_id, permission_id'
  );

  const permissionMap = new Map();
  for (const row of rolePermissions) {
    const roleId = Number(row.role_id);
    if (!permissionMap.has(roleId)) permissionMap.set(roleId, []);
    permissionMap.get(roleId).push(Number(row.permission_id));
  }

  res.json(roles.map(role => ({
    ...role,
    permission_ids: permissionMap.get(Number(role.id)) || []
  })));
};

exports.listPermissions = async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  const [rows] = await pool.query('SELECT id,code FROM permissions ORDER BY code');
  res.json(rows);
};

exports.createRole = async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  const { name, permission_ids = [] } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ message: 'Role name is required' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [r] = await conn.query('INSERT INTO roles (name) VALUES (?)', [name.trim()]);
    for (const pid of [...new Set(permission_ids.map(Number).filter(Boolean))]) await conn.query('INSERT IGNORE INTO role_permissions (role_id,permission_id) VALUES (?,?)', [r.insertId, pid]);
    await conn.commit();
    res.status(201).json({ id:r.insertId, message:'Role created successfully' });
  } catch(e) { await conn.rollback(); res.status(e.code==='ER_DUP_ENTRY'?409:500).json({message:e.code==='ER_DUP_ENTRY'?'Role name already exists':e.message}); }
  finally { conn.release(); }
};

exports.updateRole = async (req, res) => {
  if (!(await requireAdmin(req, res))) return;
  const id = Number(req.params.id); const { name, permission_ids = [] } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ message: 'Role name is required' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [exists] = await conn.query('SELECT id FROM roles WHERE id=? LIMIT 1',[id]);
    if (!exists.length) throw Object.assign(new Error('Role not found'),{status:404});
    await conn.query('UPDATE roles SET name=? WHERE id=?',[name.trim(),id]);
    await conn.query('DELETE FROM role_permissions WHERE role_id=?',[id]);
    for (const pid of [...new Set(permission_ids.map(Number).filter(Boolean))]) await conn.query('INSERT IGNORE INTO role_permissions (role_id,permission_id) VALUES (?,?)',[id,pid]);
    await conn.commit(); res.json({message:'Role permissions updated successfully'});
  } catch(e){await conn.rollback();res.status(e.status|| (e.code==='ER_DUP_ENTRY'?409:500)).json({message:e.code==='ER_DUP_ENTRY'?'Role name already exists':e.message});}
  finally{conn.release();}
};
