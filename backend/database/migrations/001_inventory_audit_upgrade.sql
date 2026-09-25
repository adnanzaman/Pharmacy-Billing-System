USE xmart_hospital;

ALTER TABLE doctors ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS is_active TINYINT(1) DEFAULT 1;
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

CREATE INDEX idx_audit_entity ON audit_logs(entity, entity_id, created_at);
CREATE INDEX idx_audit_user_date ON audit_logs(user_id, created_at);
CREATE INDEX idx_medicine_barcode ON medicines(hospital_id, barcode);
CREATE INDEX idx_medicine_name ON medicines(hospital_id, name);
CREATE INDEX idx_stock_date ON stock_transactions(hospital_id, transaction_date);
CREATE INDEX idx_sale_items_medicine ON sale_items(medicine_id, batch_id);
CREATE INDEX idx_purchase_items_medicine ON purchase_items(medicine_id, batch_id);
