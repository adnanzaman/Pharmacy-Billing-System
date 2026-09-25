const pool = require('../config/db');


/* =========================================================
   LIST BATCHES
========================================================= */
exports.list = async (req, res) => {
  try {

    const [rows] = await pool.query(
      `
      SELECT
        mb.*,

        m.name AS medicine_name,
        m.generic_name,
        m.strength,
        m.pack_size,

        COALESCE(
          (
            SELECT SUM(st.qty_in - st.qty_out)
            FROM stock_transactions st
            WHERE st.batch_id = mb.id
          ),
          0
        ) AS stock

      FROM medicine_batches mb

      INNER JOIN medicines m
        ON m.id = mb.medicine_id

      WHERE m.hospital_id = ?

      ORDER BY
        mb.expiry_date ASC,
        m.name ASC
      `,
      [req.user.hospital_id]
    );

    res.json(rows);

  } catch (error) {

    //console.error('BATCH LIST ERROR:', error);

    res.status(500).json({
      message: 'Failed to load batches'
    });
  }
};


/* =========================================================
   VIEW BATCH
========================================================= */
exports.getOne = async (req, res) => {
  try {

    const { id } = req.params;

    const [rows] = await pool.query(
      `
      SELECT
        mb.*,

        m.name AS medicine_name,
        m.generic_name,
        m.strength,
        m.pack_size,
        m.barcode

      FROM medicine_batches mb

      INNER JOIN medicines m
        ON m.id = mb.medicine_id

      WHERE mb.id = ?
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
        message: 'Batch not found'
      });

    }

    res.json(rows[0]);

  } catch (error) {

   // console.error('BATCH VIEW ERROR:', error);

    res.status(500).json({
      message: 'Failed to load batch'
    });
  }
};


/* =========================================================
   ADD BATCH
========================================================= */
exports.create = async (req, res) => {
  try {

    const {
      medicine_id,
      batch_no,
      manufacture_date,
      expiry_date,
      purchase_price,
      sale_price,
      mrp,
      opening_quantity,
      warehouse_id,
      opening_date
    } = req.body;


    if (!medicine_id) {

      return res.status(400).json({
        message: 'Medicine is required'
      });

    }


    if (!batch_no || !String(batch_no).trim()) {

      return res.status(400).json({
        message: 'Batch number is required'
      });

    }


    /* Verify medicine belongs to hospital */
    const [medicine] = await pool.query(
      `
      SELECT id

      FROM medicines

      WHERE id = ?
        AND hospital_id = ?

      LIMIT 1
      `,
      [
        medicine_id,
        req.user.hospital_id
      ]
    );


    if (!medicine.length) {

      return res.status(400).json({
        message: 'Invalid medicine'
      });

    }


    /* Duplicate batch check */
    const [existing] = await pool.query(
      `
      SELECT id

      FROM medicine_batches

      WHERE medicine_id = ?
        AND batch_no = ?

      LIMIT 1
      `,
      [
        medicine_id,
        String(batch_no).trim()
      ]
    );


    if (existing.length) {

      return res.status(409).json({
        message:
          'This batch number already exists for this medicine'
      });

    }


    const openingQty = Number(opening_quantity || 0);
    if (openingQty < 0) {
      return res.status(400).json({ message: 'Opening quantity cannot be negative' });
    }

    if (warehouse_id) {
      const [warehouse] = await pool.query(
        `SELECT id FROM warehouses WHERE id = ? AND hospital_id = ? LIMIT 1`,
        [warehouse_id, req.user.hospital_id]
      );
      if (!warehouse.length) {
        return res.status(400).json({ message: 'Invalid warehouse / location' });
      }
    }

    const [result] = await pool.query(
      `
      INSERT INTO medicine_batches
      (
        medicine_id, batch_no, manufacture_date, expiry_date,
        purchase_price, sale_price, mrp
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        medicine_id, String(batch_no).trim(), manufacture_date || null,
        expiry_date || null, Number(purchase_price || 0),
        Number(sale_price || 0), Number(mrp || 0)
      ]
    );

    if (openingQty > 0) {
      await pool.query(
        `INSERT INTO stock_transactions
         (hospital_id, warehouse_id, medicine_id, batch_id, transaction_type, reference_type, qty_in, qty_out, unit_cost, transaction_date)
         VALUES (?, ?, ?, ?, 'OPENING', 'BATCH_OPENING', ?, 0, ?, ?)`,
        [req.user.hospital_id, warehouse_id || null, medicine_id, result.insertId, openingQty, Number(purchase_price || 0), opening_date || new Date()]
      );
    }

    res.status(201).json({ id: result.insertId, message: 'Batch added successfully' });

  } catch (error) {

    //console.error('BATCH CREATE ERROR:', error);

    res.status(500).json({
      message: 'Failed to add batch'
    });
  }
};


/* =========================================================
   UPDATE / EDIT BATCH
========================================================= */
exports.update = async (req, res) => {
  try {

    const { id } = req.params;

    const {
      medicine_id,
      batch_no,
      manufacture_date,
      expiry_date,
      purchase_price,
      sale_price,
      mrp
    } = req.body;


    if (!medicine_id) {

      return res.status(400).json({
        message: 'Medicine is required'
      });

    }


    if (!batch_no || !String(batch_no).trim()) {

      return res.status(400).json({
        message: 'Batch number is required'
      });

    }


    /* Verify medicine */
    const [medicine] = await pool.query(
      `
      SELECT id

      FROM medicines

      WHERE id = ?
        AND hospital_id = ?

      LIMIT 1
      `,
      [
        medicine_id,
        req.user.hospital_id
      ]
    );


    if (!medicine.length) {

      return res.status(400).json({
        message: 'Invalid medicine'
      });

    }


    /* Duplicate check */
    const [existing] = await pool.query(
      `
      SELECT id

      FROM medicine_batches

      WHERE medicine_id = ?
        AND batch_no = ?
        AND id <> ?

      LIMIT 1
      `,
      [
        medicine_id,
        String(batch_no).trim(),
        id
      ]
    );


    if (existing.length) {

      return res.status(409).json({
        message:
          'This batch number already exists for this medicine'
      });

    }


    const [result] = await pool.query(
      `
      UPDATE medicine_batches

      SET
        medicine_id = ?,
        batch_no = ?,
        manufacture_date = ?,
        expiry_date = ?,
        purchase_price = ?,
        sale_price = ?,
        mrp = ?

      WHERE id = ?

        AND EXISTS
        (
          SELECT 1

          FROM medicines m

          WHERE m.id = medicine_batches.medicine_id
            AND m.hospital_id = ?
        )
      `,
      [
        medicine_id,
        String(batch_no).trim(),
        manufacture_date || null,
        expiry_date || null,
        Number(purchase_price || 0),
        Number(sale_price || 0),
        Number(mrp || 0),
        id,
        req.user.hospital_id
      ]
    );


    if (!result.affectedRows) {

      return res.status(404).json({
        message: 'Batch not found'
      });

    }


    res.json({
      message: 'Batch updated successfully'
    });

  } catch (error) {

    //console.error('BATCH UPDATE ERROR:', error);

    res.status(500).json({
      message: 'Failed to update batch'
    });
  }
};


/* =========================================================
   DELETE BATCH
========================================================= */
exports.remove = async (req, res) => {
  try {

    const { id } = req.params;


    /* Verify batch belongs to hospital */
    const [rows] = await pool.query(
      `
      SELECT
        mb.id,
        mb.medicine_id

      FROM medicine_batches mb

      INNER JOIN medicines m
        ON m.id = mb.medicine_id

      WHERE mb.id = ?
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
        message: 'Batch not found'
      });

    }


    await pool.query(
      `
      DELETE FROM medicine_batches

      WHERE id = ?
      `,
      [id]
    );


    res.json({
      message: 'Batch deleted successfully'
    });

  } catch (error) {

    //.error('BATCH DELETE ERROR:', error);

    res.status(500).json({
      message: 'Failed to delete batch'
    });
  }
};