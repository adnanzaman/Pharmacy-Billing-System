const pool = require('../config/db');

/* =========================================================
   LIST MEDICINES
========================================================= */
exports.list = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT
        m.*,

        c.name AS category_name,
        mf.name AS manufacturer_name,
        u.name AS unit_name,

        COALESCE(
          (
            SELECT SUM(st.qty_in - st.qty_out)
            FROM stock_transactions st
            WHERE st.medicine_id = m.id
          ),
          0
        ) AS stock,

        (
          SELECT COUNT(*)
          FROM medicine_batches mb
          WHERE mb.medicine_id = m.id
        ) AS batch_count,

        COALESCE((SELECT SUM(st.qty_in - st.qty_out) FROM stock_transactions st WHERE st.medicine_id=m.id AND st.reference_type='ITEM_OPENING'),0) AS opening_quantity,
        (SELECT MIN(st.transaction_date) FROM stock_transactions st WHERE st.medicine_id=m.id AND st.reference_type='ITEM_OPENING') AS opening_date,
        COALESCE(NULLIF(m.batch_no,''),(SELECT mb.batch_no FROM medicine_batches mb WHERE mb.medicine_id=m.id ORDER BY mb.id ASC LIMIT 1)) AS batch_no,
        COALESCE(m.manufacture_date,(SELECT mb.manufacture_date FROM medicine_batches mb WHERE mb.medicine_id=m.id ORDER BY mb.id ASC LIMIT 1)) AS manufacture_date,
        COALESCE(m.expiry_date,(SELECT mb.expiry_date FROM medicine_batches mb WHERE mb.medicine_id=m.id ORDER BY mb.id ASC LIMIT 1)) AS expiry_date,
        CASE WHEN m.purchase_price=0 THEN COALESCE((SELECT mb.purchase_price FROM medicine_batches mb WHERE mb.medicine_id=m.id ORDER BY mb.id ASC LIMIT 1),0) ELSE m.purchase_price END AS purchase_price,
        CASE WHEN m.mrp=0 THEN COALESCE((SELECT mb.mrp FROM medicine_batches mb WHERE mb.medicine_id=m.id ORDER BY mb.id ASC LIMIT 1),0) ELSE m.mrp END AS mrp,
        CASE WHEN m.sale_price=0 THEN COALESCE((SELECT mb.sale_price FROM medicine_batches mb WHERE mb.medicine_id=m.id ORDER BY mb.id ASC LIMIT 1),0) ELSE m.sale_price END AS sale_price

      FROM medicines m

      LEFT JOIN medicine_categories c
        ON c.id = m.category_id

      LEFT JOIN manufacturers mf
        ON mf.id = m.manufacturer_id

      LEFT JOIN medicine_units u
        ON u.id = m.unit_id

      WHERE m.hospital_id = ?

      ORDER BY m.name ASC
      `,
      [req.user.hospital_id]
    );

    res.json(rows);

  } catch (error) {
    console.error('MEDICINES LIST ERROR:', error);

    res.status(500).json({
      message: 'Failed to load medicines'
    });
  }
};


/* =========================================================
   VIEW MEDICINE
========================================================= */
exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `
      SELECT
        m.*,

        c.name AS category_name,
        mf.name AS manufacturer_name,
        u.name AS unit_name,

        COALESCE(
          (
            SELECT SUM(st.qty_in - st.qty_out)
            FROM stock_transactions st
            WHERE st.medicine_id = m.id
          ),
          0
        ) AS stock,

        (
          SELECT COUNT(*)
          FROM medicine_batches mb
          WHERE mb.medicine_id = m.id
        ) AS batch_count,

        COALESCE((SELECT SUM(st.qty_in - st.qty_out) FROM stock_transactions st WHERE st.medicine_id=m.id AND st.reference_type='ITEM_OPENING'),0) AS opening_quantity,
        (SELECT MIN(st.transaction_date) FROM stock_transactions st WHERE st.medicine_id=m.id AND st.reference_type='ITEM_OPENING') AS opening_date,
        COALESCE(NULLIF(m.batch_no,''),(SELECT mb.batch_no FROM medicine_batches mb WHERE mb.medicine_id=m.id ORDER BY mb.id ASC LIMIT 1)) AS batch_no,
        COALESCE(m.manufacture_date,(SELECT mb.manufacture_date FROM medicine_batches mb WHERE mb.medicine_id=m.id ORDER BY mb.id ASC LIMIT 1)) AS manufacture_date,
        COALESCE(m.expiry_date,(SELECT mb.expiry_date FROM medicine_batches mb WHERE mb.medicine_id=m.id ORDER BY mb.id ASC LIMIT 1)) AS expiry_date,
        CASE WHEN m.purchase_price=0 THEN COALESCE((SELECT mb.purchase_price FROM medicine_batches mb WHERE mb.medicine_id=m.id ORDER BY mb.id ASC LIMIT 1),0) ELSE m.purchase_price END AS purchase_price,
        CASE WHEN m.mrp=0 THEN COALESCE((SELECT mb.mrp FROM medicine_batches mb WHERE mb.medicine_id=m.id ORDER BY mb.id ASC LIMIT 1),0) ELSE m.mrp END AS mrp,
        CASE WHEN m.sale_price=0 THEN COALESCE((SELECT mb.sale_price FROM medicine_batches mb WHERE mb.medicine_id=m.id ORDER BY mb.id ASC LIMIT 1),0) ELSE m.sale_price END AS sale_price

      FROM medicines m

      LEFT JOIN medicine_categories c
        ON c.id = m.category_id

      LEFT JOIN manufacturers mf
        ON mf.id = m.manufacturer_id

      LEFT JOIN medicine_units u
        ON u.id = m.unit_id

      WHERE m.id = ?
        AND m.hospital_id = ?

      LIMIT 1
      `,
      [
        id,
        req.user.hospital_id
      ]
    );

    if (!rows.length) {
      return res.status(404).json({
        message: 'Medicine not found'
      });
    }

    res.json(rows[0]);

  } catch (error) {
    console.error('MEDICINE VIEW ERROR:', error);

    res.status(500).json({
      message: 'Failed to load medicine'
    });
  }
};


/* =========================================================
   ADD MEDICINE
========================================================= */
exports.create = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const {
      name, item_code = null, generic_name = null, pack_size, barcode, category_id, manufacturer_id, unit_id,
      tax_profile_id, hs_code_id, reorder_level,
      sale_price = 0, purchase_price = 0, mrp = 0,
      sale_price_tax_mode = 'WITHOUT_TAX',
      discount_on_sale_price = 0, discount_type = 'PERCENTAGE',
      is_active = 1,
      batch_no = null, manufacture_date = null, expiry_date = null,
      location = null, opening_quantity = 0, warehouse_id = null, opening_date = null
    } = req.body;

    if (!name || !String(name).trim()) return res.status(400).json({ message: 'Item name is required' });
    const openingQty = Number(opening_quantity || 0);
    if (openingQty < 0) return res.status(400).json({ message: 'Opening quantity cannot be negative' });

    await conn.beginTransaction();

    if (warehouse_id) {
      const [warehouse] = await conn.query(`SELECT id FROM warehouses WHERE id=? AND hospital_id=? LIMIT 1`, [warehouse_id, req.user.hospital_id]);
      if (!warehouse.length) { await conn.rollback(); return res.status(400).json({ message: 'Invalid warehouse / location' }); }
    }

    const [result] = await conn.query(
      `INSERT INTO medicines
       (hospital_id, category_id, manufacturer_id, unit_id, tax_profile_id, hs_code_id,
        name, item_code, generic_name, pack_size, barcode, reorder_level, sale_price, sale_price_tax_mode,
        discount_on_sale_price, discount_type, is_active, batch_no, manufacture_date,
        expiry_date, purchase_price, mrp, location)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        req.user.hospital_id, category_id || null, manufacturer_id || null, unit_id || null,
        tax_profile_id || null, hs_code_id || null, String(name).trim(), item_code ? String(item_code).trim() : null, generic_name ? String(generic_name).trim() : null, pack_size || null,
        barcode || null, Number(reorder_level || 0), Number(sale_price || 0),
        sale_price_tax_mode === 'WITH_TAX' ? 'WITH_TAX' : 'WITHOUT_TAX',
        Number(discount_on_sale_price || 0), discount_type === 'AMOUNT' ? 'AMOUNT' : 'PERCENTAGE',
        is_active ? 1 : 0, batch_no ? String(batch_no).trim() : null, manufacture_date || null,
        expiry_date || null, Number(purchase_price || 0), Number(mrp || 0), location || null
      ]
    );

    let batchId = null;
    if ((batch_no && String(batch_no).trim()) || openingQty > 0) {
      const effectiveBatchNo = (batch_no && String(batch_no).trim()) ? String(batch_no).trim() : `OPENING-${result.insertId}`;
      const [existing] = await conn.query(`SELECT id FROM medicine_batches WHERE medicine_id=? AND batch_no=? LIMIT 1`, [result.insertId, effectiveBatchNo]);
      if (existing.length) {
        await conn.rollback();
        return res.status(409).json({ message: 'This batch number already exists for this item' });
      }
      const [batchResult] = await conn.query(
        `INSERT INTO medicine_batches (medicine_id,batch_no,manufacture_date,expiry_date,purchase_price,sale_price,mrp)
         VALUES (?,?,?,?,?,?,?)`,
        [result.insertId, effectiveBatchNo, manufacture_date || null, expiry_date || null, Number(purchase_price || 0), Number(sale_price || 0), Number(mrp || 0)]
      );
      batchId = batchResult.insertId;
      if (openingQty > 0) {
        await conn.query(
          `INSERT INTO stock_transactions
           (hospital_id,warehouse_id,medicine_id,batch_id,transaction_type,reference_type,qty_in,qty_out,unit_cost,transaction_date)
           VALUES (?,?,?,?, 'OPENING','ITEM_OPENING',?,0,?,?)`,
          [req.user.hospital_id, warehouse_id || null, result.insertId, batchId, openingQty, Number(purchase_price || 0), opening_date || new Date()]
        );
      }
    }

    await conn.query(`INSERT INTO audit_logs(user_id,action,entity,entity_id,details) VALUES(?,?,?,?,?)`,
      [req.user.id, 'CREATE', 'MEDICINE', result.insertId, JSON.stringify({ after: req.body, batch_id: batchId })]);
    await conn.commit();
    res.status(201).json({ id: result.insertId, batch_id: batchId, message: 'Item added successfully' });
  } catch (error) {
    await conn.rollback();
    console.error('MEDICINE CREATE ERROR:', error);
    res.status(error.code === 'ER_DUP_ENTRY' ? 409 : 500).json({ message: error.code === 'ER_DUP_ENTRY' ? 'A medicine or batch with this unique value already exists.' : (error.sqlMessage || error.message || 'Failed to add item') });
  } finally { conn.release(); }
};

/* =========================================================
   UPDATE / EDIT MEDICINE
========================================================= */
exports.update = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    const {
      name, item_code = null, generic_name = null, pack_size, barcode, category_id, manufacturer_id, unit_id,
      tax_profile_id, hs_code_id, reorder_level,
      sale_price = 0, purchase_price = 0, mrp = 0,
      sale_price_tax_mode = 'WITHOUT_TAX',
      discount_on_sale_price = 0, discount_type = 'PERCENTAGE',
      is_active = 1, batch_no = null, manufacture_date = null,
      expiry_date = null, location = null,
      opening_quantity = 0, warehouse_id = null, opening_date = null
    } = req.body;

    if (!name || !String(name).trim()) return res.status(400).json({ message: 'Item name is required' });
    const [[before]] = await conn.query(`SELECT * FROM medicines WHERE id=? AND hospital_id=? LIMIT 1`, [id, req.user.hospital_id]);
    if (!before) return res.status(404).json({ message: 'Item not found' });

    const openingQty = Number(opening_quantity || 0);
    if (openingQty < 0) return res.status(400).json({ message: 'Opening quantity cannot be negative' });

    await conn.beginTransaction();
    if (warehouse_id) {
      const [warehouse] = await conn.query(`SELECT id FROM warehouses WHERE id=? AND hospital_id=? LIMIT 1`, [warehouse_id, req.user.hospital_id]);
      if (!warehouse.length) { await conn.rollback(); return res.status(400).json({ message: 'Invalid warehouse / location' }); }
    }

    await conn.query(
      `UPDATE medicines SET category_id=?,manufacturer_id=?,unit_id=?,tax_profile_id=?,hs_code_id=?,
       name=?,item_code=?,generic_name=?,pack_size=?,barcode=?,reorder_level=?,sale_price=?,sale_price_tax_mode=?,
       discount_on_sale_price=?,discount_type=?,is_active=?,batch_no=?,manufacture_date=?,
       expiry_date=?,purchase_price=?,mrp=?,location=?
       WHERE id=? AND hospital_id=?`,
      [
        category_id || null, manufacturer_id || null, unit_id || null, tax_profile_id || null, hs_code_id || null,
        String(name).trim(), item_code ? String(item_code).trim() : null, generic_name ? String(generic_name).trim() : null, pack_size || null, barcode || null, Number(reorder_level || 0), Number(sale_price || 0),
        sale_price_tax_mode === 'WITH_TAX' ? 'WITH_TAX' : 'WITHOUT_TAX', Number(discount_on_sale_price || 0),
        discount_type === 'AMOUNT' ? 'AMOUNT' : 'PERCENTAGE', is_active ? 1 : 0,
        batch_no ? String(batch_no).trim() : null, manufacture_date || null, expiry_date || null,
        Number(purchase_price || 0), Number(mrp || 0), location || null, id, req.user.hospital_id
      ]
    );

    // Opening Quantity is editable. Remove the previous ITEM_OPENING ledger entries
    // and recreate one entry from the value entered on the Item screen so the
    // displayed stock exactly follows the edited opening quantity.
    await conn.query(`DELETE FROM stock_transactions WHERE hospital_id=? AND medicine_id=? AND reference_type='ITEM_OPENING'`, [req.user.hospital_id, id]);

    let batchId = null;
    const [existingBatch] = await conn.query(`SELECT id FROM medicine_batches WHERE medicine_id=? ORDER BY id ASC LIMIT 1`, [id]);
    if ((batch_no && String(batch_no).trim()) || openingQty > 0 || existingBatch.length) {
      const effectiveBatchNo = (batch_no && String(batch_no).trim()) ? String(batch_no).trim() : `OPENING-${id}`;
      if (existingBatch.length) {
        batchId = existingBatch[0].id;
        const [duplicate] = await conn.query(`SELECT id FROM medicine_batches WHERE medicine_id=? AND batch_no=? AND id<>? LIMIT 1`, [id, effectiveBatchNo, batchId]);
        if (duplicate.length) { await conn.rollback(); return res.status(409).json({ message: 'This batch number already exists for this item' }); }
        await conn.query(
          `UPDATE medicine_batches SET batch_no=?,manufacture_date=?,expiry_date=?,purchase_price=?,sale_price=?,mrp=? WHERE id=? AND medicine_id=?`,
          [effectiveBatchNo, manufacture_date || null, expiry_date || null, Number(purchase_price || 0), Number(sale_price || 0), Number(mrp || 0), batchId, id]
        );
      } else {
        const [batchResult] = await conn.query(
          `INSERT INTO medicine_batches (medicine_id,batch_no,manufacture_date,expiry_date,purchase_price,sale_price,mrp) VALUES (?,?,?,?,?,?,?)`,
          [id, effectiveBatchNo, manufacture_date || null, expiry_date || null, Number(purchase_price || 0), Number(sale_price || 0), Number(mrp || 0)]
        );
        batchId = batchResult.insertId;
      }
      if (openingQty > 0) {
        await conn.query(
          `INSERT INTO stock_transactions (hospital_id,warehouse_id,medicine_id,batch_id,transaction_type,reference_type,qty_in,qty_out,unit_cost,transaction_date)
           VALUES (?,?,?,?, 'OPENING','ITEM_OPENING',?,0,?,?)`,
          [req.user.hospital_id, warehouse_id || null, id, batchId, openingQty, Number(purchase_price || 0), opening_date || new Date()]
        );
      }
    }

    await conn.query(`INSERT INTO audit_logs(user_id,action,entity,entity_id,details) VALUES(?,?,?,?,?)`,
      [req.user.id, 'UPDATE', 'MEDICINE', id, JSON.stringify({ before, after: req.body, batch_id: batchId })]);
    await conn.commit();
    res.json({ message: 'Item updated successfully' });
  } catch (error) {
    await conn.rollback();
    console.error('MEDICINE UPDATE ERROR:', error);
    res.status(error.code === 'ER_DUP_ENTRY' ? 409 : 500).json({ message: error.code === 'ER_DUP_ENTRY' ? 'A medicine or batch with this unique value already exists.' : (error.sqlMessage || error.message || 'Failed to update item') });
  } finally { conn.release(); }
};

/* =========================================================
   NEXT ITEM CODE
========================================================= */
exports.nextCode = async (req, res) => {
  const h = req.user.hospital_id;
  for (let n = 1; n < 1000000; n++) {
    const code = `ITM-${String(n).padStart(6, '0')}`;
    const [[row]] = await pool.query(`SELECT id FROM medicines WHERE hospital_id=? AND item_code=? LIMIT 1`, [h, code]);
    if (!row) return res.json({ code });
  }
  res.status(500).json({ message: 'Could not generate item code' });
};

/* =========================================================
   DELETE MEDICINE
========================================================= */
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;

    /* Check medicine */
    const [medicine] = await pool.query(
      `
      SELECT id
      FROM medicines
      WHERE id = ?
        AND hospital_id = ?

      LIMIT 1
      `,
      [
        id,
        req.user.hospital_id
      ]
    );

    if (!medicine.length) {
      return res.status(404).json({
        message: 'Medicine not found'
      });
    }


    /* Check stock transactions */
    const [transactions] = await pool.query(
      `
      SELECT COUNT(*) AS total

      FROM stock_transactions st

      INNER JOIN medicines m
        ON m.id = st.medicine_id

      WHERE st.medicine_id = ?
        AND m.hospital_id = ?
      `,
      [
        id,
        req.user.hospital_id
      ]
    );


    /* Check batches */
    const [batches] = await pool.query(
      `
      SELECT COUNT(*) AS total

      FROM medicine_batches mb

      INNER JOIN medicines m
        ON m.id = mb.medicine_id

      WHERE mb.medicine_id = ?
        AND m.hospital_id = ?
      `,
      [
        id,
        req.user.hospital_id
      ]
    );


    /* Don't delete historical records */
    if (
      Number(transactions[0].total) > 0 ||
      Number(batches[0].total) > 0
    ) {
      return res.status(409).json({
        message:
          'This medicine cannot be deleted because it has batches or stock transactions. Please edit the medicine instead.'
      });
    }


    await pool.query(`INSERT INTO audit_logs(user_id,action,entity,entity_id,details) VALUES(?,?,?,?,?)`,
      [req.user.id,'DELETE','MEDICINE',id,JSON.stringify({before:medicine[0]})]);

    await pool.query(
      `
      DELETE FROM medicines

      WHERE id = ?
        AND hospital_id = ?
      `,
      [
        id,
        req.user.hospital_id
      ]
    );


    res.json({
      message: 'Medicine deleted successfully'
    });

  } catch (error) {
    console.error('MEDICINE DELETE ERROR:', error);

    res.status(500).json({
      message: 'Failed to delete medicine'
    });
  }
};