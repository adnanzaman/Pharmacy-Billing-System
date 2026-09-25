-- Safe Xmart migration: purchase bonus quantity. Does not drop or recreate tables.
SET @db = DATABASE();
SET @sql = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@db AND table_name='purchase_items' AND column_name='bonus_qty')=0, 'ALTER TABLE purchase_items ADD COLUMN bonus_qty DECIMAL(14,3) NOT NULL DEFAULT 0.000 AFTER qty', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
