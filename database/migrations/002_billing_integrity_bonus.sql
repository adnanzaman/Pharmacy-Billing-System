-- Xmart Hospital ERP - billing integrity + purchase bonus migration
-- Safe for an existing database. Does not drop tables or existing data.

SET @db := DATABASE();

-- Canonical sale-return item amount column is `total`, never `amount`.
SET @has_total := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='sale_return_items' AND COLUMN_NAME='total');
SET @sql := IF(@has_total=0,
  'ALTER TABLE sale_return_items ADD COLUMN total DECIMAL(14,2) NOT NULL DEFAULT 0.00 AFTER cost_price',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Link every return line to the original sale line when the column is missing.
SET @has_sale_item_id := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='sale_return_items' AND COLUMN_NAME='sale_item_id');
SET @sql := IF(@has_sale_item_id=0,
  'ALTER TABLE sale_return_items ADD COLUMN sale_item_id BIGINT UNSIGNED NULL AFTER return_id',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- If an old database has `amount`, migrate it into the canonical `total` field.
SET @has_amount := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='sale_return_items' AND COLUMN_NAME='amount');
SET @has_total := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='sale_return_items' AND COLUMN_NAME='total');
SET @sql := IF(@has_amount=1 AND @has_total=1,
  'UPDATE sale_return_items SET total=amount WHERE (total IS NULL OR total=0) AND amount IS NOT NULL',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Backfill return line -> sale line safely by sale + medicine + batch.
UPDATE sale_return_items ri
JOIN sale_returns r ON r.id=ri.sale_return_id
JOIN sale_items si ON si.sale_id=r.sale_id AND si.medicine_id=ri.medicine_id AND si.batch_id=ri.batch_id
SET ri.sale_item_id=si.id
WHERE ri.sale_item_id IS NULL;

-- Purchase bonus/free quantity. `qty` = paid quantity; `bonus_qty` = free quantity.
SET @has_bonus_qty := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='purchase_items' AND COLUMN_NAME='bonus_qty');
SET @sql := IF(@has_bonus_qty=0,
  'ALTER TABLE purchase_items ADD COLUMN bonus_qty DECIMAL(14,3) NOT NULL DEFAULT 0.000 AFTER qty',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Useful indexes, only if absent.
SET @has_idx := (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='purchase_items' AND INDEX_NAME='idx_purchase_items_bonus');
SET @sql := IF(@has_idx=0,
  'CREATE INDEX idx_purchase_items_bonus ON purchase_items (purchase_id, medicine_id)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
