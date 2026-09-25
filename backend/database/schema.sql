CREATE DATABASE IF NOT EXISTS xmart_hospital CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE xmart_hospital;

CREATE TABLE hospitals (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  logo_url VARCHAR(500),
  phone VARCHAR(50),
  email VARCHAR(150),
  address VARCHAR(500),
  ntn VARCHAR(100),
  strn VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE branches (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hospital_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(50) NOT NULL,
  address VARCHAR(500),
  is_active TINYINT(1) DEFAULT 1,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
  UNIQUE KEY uq_branch_code (hospital_id, code)
);

CREATE TABLE departments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hospital_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(150) NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
);

CREATE TABLE roles (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE permissions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(120) NOT NULL UNIQUE
);

CREATE TABLE role_permissions (
  role_id BIGINT UNSIGNED NOT NULL,
  permission_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hospital_id BIGINT UNSIGNED,
  branch_id BIGINT UNSIGNED,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(180) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

CREATE TABLE user_roles (
  user_id BIGINT UNSIGNED NOT NULL,
  role_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

CREATE TABLE doctors (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hospital_id BIGINT UNSIGNED NOT NULL,
  department_id BIGINT UNSIGNED,
  doctor_code VARCHAR(50) NOT NULL,
  name VARCHAR(150) NOT NULL,
  qualification VARCHAR(200),
  speciality VARCHAR(200),
  phone VARCHAR(50),
  consultation_fee DECIMAL(14,2) DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
  FOREIGN KEY (department_id) REFERENCES departments(id),
  UNIQUE KEY uq_doctor_code (hospital_id, doctor_code)
);

CREATE TABLE patients (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hospital_id BIGINT UNSIGNED NOT NULL,
  patient_no VARCHAR(60) NOT NULL,
  name VARCHAR(150) NOT NULL,
  father_husband_name VARCHAR(150),
  cnic VARCHAR(50),
  gender ENUM('Male','Female','Other') DEFAULT 'Other',
  dob DATE,
  mobile VARCHAR(50),
  address VARCHAR(500),
  blood_group VARCHAR(10),
  emergency_contact VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
  UNIQUE KEY uq_patient_no (hospital_id, patient_no)
);

CREATE TABLE patient_visits (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_id BIGINT UNSIGNED NOT NULL,
  doctor_id BIGINT UNSIGNED,
  department_id BIGINT UNSIGNED,
  visit_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  visit_type VARCHAR(50) DEFAULT 'OPD',
  registration_fee DECIMAL(14,2) DEFAULT 0,
  discount DECIMAL(14,2) DEFAULT 0,
  paid DECIMAL(14,2) DEFAULT 0,
  notes TEXT,
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (doctor_id) REFERENCES doctors(id),
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE suppliers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hospital_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(200) NOT NULL,
  phone VARCHAR(50),
  address VARCHAR(500),
  tax_number VARCHAR(100),
  opening_balance DECIMAL(14,2) DEFAULT 0,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
);

CREATE TABLE medicine_categories (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hospital_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(150) NOT NULL,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
);

CREATE TABLE manufacturers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hospital_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(200) NOT NULL,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
);

CREATE TABLE medicine_units (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hospital_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(80) NOT NULL,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
);

CREATE TABLE tax_profiles (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hospital_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(150) NOT NULL,
  tax_type VARCHAR(50) NOT NULL,
  rate DECIMAL(8,4) DEFAULT 0,
  is_tax_inclusive TINYINT(1) DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
);

CREATE TABLE hs_codes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255)
);

CREATE TABLE medicines (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hospital_id BIGINT UNSIGNED NOT NULL,
  category_id BIGINT UNSIGNED,
  manufacturer_id BIGINT UNSIGNED,
  unit_id BIGINT UNSIGNED,
  tax_profile_id BIGINT UNSIGNED,
  hs_code_id BIGINT UNSIGNED,
  name VARCHAR(200) NOT NULL,
  generic_name VARCHAR(200),
  strength VARCHAR(100),
  pack_size VARCHAR(100),
  barcode VARCHAR(100),
  reorder_level DECIMAL(14,3) DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
  FOREIGN KEY (category_id) REFERENCES medicine_categories(id),
  FOREIGN KEY (manufacturer_id) REFERENCES manufacturers(id),
  FOREIGN KEY (unit_id) REFERENCES medicine_units(id),
  FOREIGN KEY (tax_profile_id) REFERENCES tax_profiles(id),
  FOREIGN KEY (hs_code_id) REFERENCES hs_codes(id)
);

CREATE TABLE medicine_batches (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  medicine_id BIGINT UNSIGNED NOT NULL,
  batch_no VARCHAR(100) NOT NULL,
  manufacture_date DATE,
  expiry_date DATE,
  purchase_price DECIMAL(14,2) DEFAULT 0,
  sale_price DECIMAL(14,2) DEFAULT 0,
  mrp DECIMAL(14,2) DEFAULT 0,
  FOREIGN KEY (medicine_id) REFERENCES medicines(id),
  UNIQUE KEY uq_batch (medicine_id, batch_no)
);

CREATE TABLE warehouses (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hospital_id BIGINT UNSIGNED NOT NULL,
  branch_id BIGINT UNSIGNED,
  name VARCHAR(150) NOT NULL,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

CREATE TABLE purchase_invoices (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hospital_id BIGINT UNSIGNED NOT NULL,
  supplier_id BIGINT UNSIGNED,
  invoice_no VARCHAR(100) NOT NULL,
  invoice_date DATE NOT NULL,
  subtotal DECIMAL(14,2) DEFAULT 0,
  discount DECIMAL(14,2) DEFAULT 0,
  tax DECIMAL(14,2) DEFAULT 0,
  net_total DECIMAL(14,2) DEFAULT 0,
  paid DECIMAL(14,2) DEFAULT 0,
  status VARCHAR(30) DEFAULT 'POSTED',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

CREATE TABLE purchase_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  purchase_id BIGINT UNSIGNED NOT NULL,
  medicine_id BIGINT UNSIGNED NOT NULL,
  batch_id BIGINT UNSIGNED NOT NULL,
  qty DECIMAL(14,3) NOT NULL,
  unit_cost DECIMAL(14,2) NOT NULL,
  discount DECIMAL(14,2) DEFAULT 0,
  tax DECIMAL(14,2) DEFAULT 0,
  total DECIMAL(14,2) NOT NULL,
  FOREIGN KEY (purchase_id) REFERENCES purchase_invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (medicine_id) REFERENCES medicines(id),
  FOREIGN KEY (batch_id) REFERENCES medicine_batches(id)
);

CREATE TABLE sales_invoices (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hospital_id BIGINT UNSIGNED NOT NULL,
  patient_id BIGINT UNSIGNED,
  doctor_id BIGINT UNSIGNED,
  invoice_no VARCHAR(100) NOT NULL,
  invoice_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  subtotal DECIMAL(14,2) DEFAULT 0,
  discount DECIMAL(14,2) DEFAULT 0,
  tax DECIMAL(14,2) DEFAULT 0,
  net_total DECIMAL(14,2) DEFAULT 0,
  paid DECIMAL(14,2) DEFAULT 0,
  payment_method VARCHAR(30) DEFAULT 'Cash',
  status VARCHAR(30) DEFAULT 'POSTED',
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);

CREATE TABLE sale_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sale_id BIGINT UNSIGNED NOT NULL,
  medicine_id BIGINT UNSIGNED NOT NULL,
  batch_id BIGINT UNSIGNED NOT NULL,
  qty DECIMAL(14,3) NOT NULL,
  unit_price DECIMAL(14,2) NOT NULL,
  discount DECIMAL(14,2) DEFAULT 0,
  tax DECIMAL(14,2) DEFAULT 0,
  cost_price DECIMAL(14,2) DEFAULT 0,
  total DECIMAL(14,2) NOT NULL,
  FOREIGN KEY (sale_id) REFERENCES sales_invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (medicine_id) REFERENCES medicines(id),
  FOREIGN KEY (batch_id) REFERENCES medicine_batches(id)
);

CREATE TABLE stock_transactions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hospital_id BIGINT UNSIGNED NOT NULL,
  warehouse_id BIGINT UNSIGNED,
  medicine_id BIGINT UNSIGNED NOT NULL,
  batch_id BIGINT UNSIGNED,
  transaction_type VARCHAR(40) NOT NULL,
  reference_type VARCHAR(40),
  reference_id BIGINT UNSIGNED,
  qty_in DECIMAL(14,3) DEFAULT 0,
  qty_out DECIMAL(14,3) DEFAULT 0,
  unit_cost DECIMAL(14,2) DEFAULT 0,
  transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
  FOREIGN KEY (medicine_id) REFERENCES medicines(id),
  FOREIGN KEY (batch_id) REFERENCES medicine_batches(id)
);

CREATE TABLE expenses (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hospital_id BIGINT UNSIGNED NOT NULL,
  expense_date DATE NOT NULL,
  category VARCHAR(150) NOT NULL,
  description VARCHAR(500),
  amount DECIMAL(14,2) NOT NULL,
  payment_method VARCHAR(30) DEFAULT 'Cash',
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
);

CREATE TABLE accounts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hospital_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(200) NOT NULL,
  account_type VARCHAR(50) NOT NULL,
  parent_id BIGINT UNSIGNED,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
  FOREIGN KEY (parent_id) REFERENCES accounts(id),
  UNIQUE KEY uq_account_code (hospital_id, code)
);

CREATE TABLE journal_entries (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hospital_id BIGINT UNSIGNED NOT NULL,
  entry_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  reference_type VARCHAR(50),
  reference_id BIGINT UNSIGNED,
  narration VARCHAR(500),
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
);

CREATE TABLE journal_entry_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  journal_entry_id BIGINT UNSIGNED NOT NULL,
  account_id BIGINT UNSIGNED NOT NULL,
  debit DECIMAL(14,2) DEFAULT 0,
  credit DECIMAL(14,2) DEFAULT 0,
  FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE,
  FOREIGN KEY (account_id) REFERENCES accounts(id)
);

CREATE TABLE audit_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED,
  action VARCHAR(100) NOT NULL,
  entity VARCHAR(100),
  entity_id BIGINT UNSIGNED,
  details JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE app_settings (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hospital_id BIGINT UNSIGNED NOT NULL,
  setting_key VARCHAR(150) NOT NULL,
  setting_value TEXT,
  UNIQUE KEY uq_setting (hospital_id, setting_key),
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
);

CREATE INDEX idx_stock_medicine ON stock_transactions(medicine_id, batch_id);
CREATE INDEX idx_sale_date ON sales_invoices(invoice_date);
CREATE INDEX idx_purchase_date ON purchase_invoices(invoice_date);
CREATE INDEX idx_patient_visit_date ON patient_visits(visit_date);
CREATE INDEX idx_patient_search ON patients(hospital_id,name,mobile,cnic);
CREATE INDEX idx_batch_expiry ON medicine_batches(expiry_date);
CREATE INDEX idx_journal_items_account ON journal_entry_items(account_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity, entity_id, created_at);
CREATE INDEX idx_audit_user_date ON audit_logs(user_id, created_at);
CREATE INDEX idx_medicine_barcode ON medicines(hospital_id, barcode);
CREATE INDEX idx_medicine_name ON medicines(hospital_id, name);
CREATE INDEX idx_stock_date ON stock_transactions(hospital_id, transaction_date);
CREATE INDEX idx_sale_items_medicine ON sale_items(medicine_id, batch_id);
CREATE INDEX idx_purchase_items_medicine ON purchase_items(medicine_id, batch_id);

