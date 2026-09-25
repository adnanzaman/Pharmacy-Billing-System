const pool = require('../config/db');

/**
 * Server-side RBAC. Front-end hiding is only a convenience; every protected
 * API route must also pass this middleware.
 *
 * Admin is deliberately permission-based as well: the migration grants the
 * Admin role every current permission, while custom roles can be created from
 * the UI without giving them Admin powers.
 */
function requirePermission(permission) {
  return async (req, res, next) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const [rows] = await pool.query(
        `SELECT 1
           FROM user_roles ur
           INNER JOIN role_permissions rp ON rp.role_id = ur.role_id
           INNER JOIN permissions p ON p.id = rp.permission_id
          WHERE ur.user_id = ? AND p.code = ?
          LIMIT 1`,
        [req.user.id, permission]
      );

      if (!rows.length) {
        return res.status(403).json({
          message: `Access denied: ${permission}`,
          permission
        });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

function requireAnyPermission(...permissions) {
  return async (req, res, next) => {
    try {
      if (!req.user?.id) return res.status(401).json({ message: 'Authentication required' });
      const [rows] = await pool.query(
        `SELECT 1 FROM user_roles ur INNER JOIN role_permissions rp ON rp.role_id=ur.role_id INNER JOIN permissions p ON p.id=rp.permission_id WHERE ur.user_id=? AND p.code IN (${permissions.map(() => '?').join(',')}) LIMIT 1`,
        [req.user.id, ...permissions]
      );
      if (!rows.length) return res.status(403).json({ message: 'Access denied', permissions });
      next();
    } catch (err) { next(err); }
  };
}

module.exports = requirePermission;
module.exports.requireAnyPermission = requireAnyPermission;
