-- Xmart Hospital ERP - Users / Roles / Permissions safe migration
-- MariaDB/MySQL. Safe to run repeatedly.
-- Existing tables/data are preserved. Missing tables are created; missing
-- indexes are added only when absent.

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  hospital_id BIGINT UNSIGNED NULL,
  branch_id BIGINT UNSIGNED NULL,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(180) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS roles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS permissions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(120) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id BIGINT UNSIGNED NOT NULL,
  permission_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (role_id, permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_roles (
  user_id BIGINT UNSIGNED NOT NULL,
  role_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (user_id, role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add missing unique/index keys without recreating tables.
SET @sql := (SELECT IF(COUNT(*)=0,
  'ALTER TABLE users ADD UNIQUE KEY uq_users_email (email)',
  'SELECT 1')
  FROM information_schema.statistics
  WHERE table_schema=DATABASE() AND table_name='users' AND column_name='email' AND non_unique=0);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (SELECT IF(COUNT(*)=0,
  'ALTER TABLE roles ADD UNIQUE KEY uq_roles_name (name)',
  'SELECT 1')
  FROM information_schema.statistics
  WHERE table_schema=DATABASE() AND table_name='roles' AND column_name='name' AND non_unique=0);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (SELECT IF(COUNT(*)=0,
  'ALTER TABLE permissions ADD UNIQUE KEY uq_permissions_code (code)',
  'SELECT 1')
  FROM information_schema.statistics
  WHERE table_schema=DATABASE() AND table_name='permissions' AND column_name='code' AND non_unique=0);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add the composite uniqueness needed to prevent duplicate assignments.
SET @sql := (SELECT IF(COUNT(*)=0,
  'ALTER TABLE role_permissions ADD UNIQUE KEY uq_role_permission (role_id, permission_id)',
  'SELECT 1')
  FROM information_schema.statistics
  WHERE table_schema=DATABASE() AND table_name='role_permissions'
    AND index_name='uq_role_permission');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (SELECT IF(COUNT(*)=0,
  'ALTER TABLE user_roles ADD UNIQUE KEY uq_user_role (user_id, role_id)',
  'SELECT 1')
  FROM information_schema.statistics
  WHERE table_schema=DATABASE() AND table_name='user_roles'
    AND index_name='uq_user_role');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Seed only missing standard permissions/roles. Existing rows are untouched.
INSERT INTO permissions (code)
SELECT 'dashboard.view' WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code='dashboard.view');
INSERT INTO permissions (code)
SELECT 'patients.view' WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code='patients.view');
INSERT INTO permissions (code)
SELECT 'patients.create' WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code='patients.create');
INSERT INTO permissions (code)
SELECT 'doctors.manage' WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code='doctors.manage');
INSERT INTO permissions (code)
SELECT 'medicines.view' WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code='medicines.view');
INSERT INTO permissions (code)
SELECT 'medicines.manage' WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code='medicines.manage');
INSERT INTO permissions (code)
SELECT 'purchase.manage' WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code='purchase.manage');
INSERT INTO permissions (code)
SELECT 'sales.manage' WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code='sales.manage');
INSERT INTO permissions (code)
SELECT 'inventory.view' WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code='inventory.view');
INSERT INTO permissions (code)
SELECT 'accounts.view' WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code='accounts.view');
INSERT INTO permissions (code)
SELECT 'reports.view' WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code='reports.view');
INSERT INTO permissions (code)
SELECT 'settings.manage' WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code='settings.manage');

INSERT INTO roles (name)
SELECT 'Admin' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name='Admin');
INSERT INTO roles (name)
SELECT 'Doctor' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name='Doctor');
INSERT INTO roles (name)
SELECT 'Pharmacist' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name='Pharmacist');
INSERT INTO roles (name)
SELECT 'Receptionist' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name='Receptionist');
INSERT INTO roles (name)
SELECT 'Accountant' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name='Accountant');

-- Ensure Admin has every standard permission. This does not remove existing assignments.
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name='Admin';

-- Foreign keys are intentionally not blindly added here because existing
-- customer databases may already contain orphaned rows. Add/repair FKs only
-- after validating data in that installation.
