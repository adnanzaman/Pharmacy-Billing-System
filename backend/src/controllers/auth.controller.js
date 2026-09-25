const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Every permission code granted to a user through any of their roles.
// Loaded fresh (not cached in the JWT) so that editing a role's permissions
// takes effect immediately on the user's very next request, without forcing
// a re-login.
async function loadPermissions(userId) {
  const [rows] = await pool.query(
    `SELECT DISTINCT p.code
       FROM permissions p
       INNER JOIN role_permissions rp ON rp.permission_id = p.id
       INNER JOIN user_roles ur ON ur.role_id = rp.role_id
      WHERE ur.user_id = ?
      ORDER BY p.code`,
    [userId]
  );
  return rows.map(r => r.code);
}

exports.login = async (req, res) => {
  // Login is by user name, not email (email is optional / contact-only now).
  const username = String(req.body?.username ?? req.body?.email ?? '').trim();
  const password = String(req.body?.password || '');

  if (!username || !password) {
    return res.status(400).json({ message: 'User name and password are required' });
  }

  const [rows] = await pool.query(
    `SELECT u.*, COALESCE(u.hospital_id, (SELECT id FROM hospitals ORDER BY id ASC LIMIT 1)) hospital_id
       FROM users u
      WHERE u.username = ? AND u.is_active = 1 LIMIT 1`,
    [username]
  );

  if (!rows.length || !(await bcrypt.compare(password, rows[0].password_hash))) {
    return res.status(401).json({ message: 'Invalid user name or password' });
  }
  const u = rows[0];

  const [roleRows] = await pool.query(
    `SELECT r.name FROM roles r INNER JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = ? ORDER BY r.name`,
    [u.id]
  );
  const roleName = roleRows.map(r => r.name).join(', ') || null;
  const permissions = await loadPermissions(u.id);

  pool.query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [u.id]).catch(() => {});

  const token = jwt.sign(
    { id: u.id, username: u.username, name: u.name, role: roleName, hospital_id: u.hospital_id, branch_id: u.branch_id },
    process.env.JWT_SECRET, { expiresIn: '8h' }
  );

  res.json({
    token,
    user: { id: u.id, name: u.name, username: u.username, email: u.email, role: roleName, hospital_id: u.hospital_id, permissions }
  });
};

exports.me = async (req, res) => {
  const permissions = await loadPermissions(req.user.id);
  res.json({ user: { ...req.user, permissions } });
};
