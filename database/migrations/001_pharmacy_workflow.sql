INSERT INTO accounts (hospital_id, code, name, account_type, parent_id)
SELECT h.id, '1050', 'Accounts Receivable', 'ASSET', NULL
FROM hospitals h
WHERE NOT EXISTS (SELECT 1 FROM accounts a WHERE a.hospital_id=h.id AND a.code='1050');

-- Xmart Hospital ERP - pharmacy workflow migration
-- Run once on an existing database before using sale edit/returns and the LAN setup.

CREATE TABLE IF NOT EXISTS sale_returns (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  hospital_id BIGINT UNSIGNED NOT NULL,
  sale_id BIGINT UNSIGNED NOT NULL,
  return_no VARCHAR(100) NOT NULL,
  return_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  refund_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  reason VARCHAR(500) DEFAULT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'POSTED',
  created_by BIGINT UNSIGNED DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sale_return_no (hospital_id, return_no),
  KEY idx_sale_return_sale (sale_id),
  CONSTRAINT fk_sale_return_hospital FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
  CONSTRAINT fk_sale_return_sale FOREIGN KEY (sale_id) REFERENCES sales_invoices(id),
  CONSTRAINT fk_sale_return_user FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sale_return_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  return_id BIGINT UNSIGNED NOT NULL,
  sale_item_id BIGINT UNSIGNED NOT NULL,
  medicine_id BIGINT UNSIGNED NOT NULL,
  batch_id BIGINT UNSIGNED NOT NULL,
  qty DECIMAL(14,3) NOT NULL,
  unit_price DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  cost_price DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (id),
  KEY idx_return_item_return (return_id),
  KEY idx_return_item_sale_item (sale_item_id),
  CONSTRAINT fk_return_item_return FOREIGN KEY (return_id) REFERENCES sale_returns(id) ON DELETE CASCADE,
  CONSTRAINT fk_return_item_sale_item FOREIGN KEY (sale_item_id) REFERENCES sale_items(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_sales_invoice_no ON sales_invoices (hospital_id, invoice_no);
CREATE INDEX idx_patients_mobile ON patients (hospital_id, mobile);
CREATE INDEX idx_purchase_invoice_no ON purchase_invoices (hospital_id, invoice_no);
CREATE INDEX idx_suppliers_phone ON suppliers (hospital_id, phone);
CREATE INDEX idx_sale_items_medicine ON sale_items (medicine_id);
CREATE INDEX idx_purchase_items_medicine ON purchase_items (medicine_id);
