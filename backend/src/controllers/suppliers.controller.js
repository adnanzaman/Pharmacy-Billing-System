const pool = require('../config/db');

/* =========================================================
   LIST SUPPLIERS
========================================================= */
exports.list = async (req, res) => {
  try {
    const { q } = req.query;

    const params = [req.user.hospital_id];
    let where = 'WHERE s.hospital_id = ?';

    if (q) {
      where += ' AND (s.name LIKE ? OR s.phone LIKE ? OR s.tax_number LIKE ?)';
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    const [rows] = await pool.query(
      `
      SELECT
        s.*,

        COALESCE(
          (
            SELECT SUM(p.net_total)
            FROM purchase_invoices p
            WHERE p.supplier_id = s.id
          ),
          0
        ) AS total_purchases,

        (
          SELECT COUNT(*)
          FROM purchase_invoices p
          WHERE p.supplier_id = s.id
        ) AS purchase_count

      FROM suppliers s

      ${where}

      ORDER BY s.name ASC
      `,
      params
    );

    res.json(rows);

  } catch (error) {
    console.error('SUPPLIERS LIST ERROR:', error);

    res.status(500).json({
      message: 'Failed to load suppliers'
    });
  }
};


/* =========================================================
   VIEW SUPPLIER
========================================================= */
exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `
      SELECT
        s.*,

        COALESCE(
          (
            SELECT SUM(p.net_total)
            FROM purchase_invoices p
            WHERE p.supplier_id = s.id
          ),
          0
        ) AS total_purchases,

        (
          SELECT COUNT(*)
          FROM purchase_invoices p
          WHERE p.supplier_id = s.id
        ) AS purchase_count

      FROM suppliers s

      WHERE s.id = ?
        AND s.hospital_id = ?

      LIMIT 1
      `,
      [id, req.user.hospital_id]
    );

    if (!rows.length) {
      return res.status(404).json({
        message: 'Supplier not found'
      });
    }

    res.json(rows[0]);

  } catch (error) {
    console.error('SUPPLIER VIEW ERROR:', error);

    res.status(500).json({
      message: 'Failed to load supplier'
    });
  }
};


/* =========================================================
   ADD SUPPLIER
========================================================= */
exports.create = async (req, res) => {
  try {
    const {
      name,
      phone,
      address,
      tax_number,
      opening_balance
    } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        message: 'Supplier name is required'
      });
    }

    const [result] = await pool.query(
      `
      INSERT INTO suppliers
      (
        hospital_id,
        name,
        phone,
        address,
        tax_number,
        opening_balance
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        req.user.hospital_id,
        String(name).trim(),
        phone || null,
        address || null,
        tax_number || null,
        Number(opening_balance || 0)
      ]
    );

    res.status(201).json({
      id: result.insertId,
      message: 'Supplier added successfully'
    });

  } catch (error) {
    console.error('SUPPLIER CREATE ERROR:', error);

    res.status(500).json({
      message: 'Failed to add supplier'
    });
  }
};


/* =========================================================
   UPDATE / EDIT SUPPLIER
========================================================= */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      phone,
      address,
      tax_number,
      opening_balance
    } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        message: 'Supplier name is required'
      });
    }

    const [result] = await pool.query(
      `
      UPDATE suppliers

      SET
        name = ?,
        phone = ?,
        address = ?,
        tax_number = ?,
        opening_balance = ?

      WHERE id = ?
        AND hospital_id = ?
      `,
      [
        String(name).trim(),
        phone || null,
        address || null,
        tax_number || null,
        Number(opening_balance || 0),
        id,
        req.user.hospital_id
      ]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        message: 'Supplier not found'
      });
    }

    res.json({
      message: 'Supplier updated successfully'
    });

  } catch (error) {
    console.error('SUPPLIER UPDATE ERROR:', error);

    res.status(500).json({
      message: 'Failed to update supplier'
    });
  }
};


/* =========================================================
   DELETE SUPPLIER
========================================================= */
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;

    const [supplier] = await pool.query(
      `
      SELECT id
      FROM suppliers
      WHERE id = ?
        AND hospital_id = ?

      LIMIT 1
      `,
      [id, req.user.hospital_id]
    );

    if (!supplier.length) {
      return res.status(404).json({
        message: 'Supplier not found'
      });
    }

    const [purchases] = await pool.query(
      `
      SELECT COUNT(*) AS total

      FROM purchase_invoices p

      INNER JOIN suppliers s
        ON s.id = p.supplier_id

      WHERE p.supplier_id = ?
        AND s.hospital_id = ?
      `,
      [id, req.user.hospital_id]
    );

    if (Number(purchases[0].total) > 0) {
      return res.status(409).json({
        message:
          'This supplier cannot be deleted because it has purchase history. Please edit the supplier instead.'
      });
    }

    await pool.query(
      `
      DELETE FROM suppliers

      WHERE id = ?
        AND hospital_id = ?
      `,
      [id, req.user.hospital_id]
    );

    res.json({
      message: 'Supplier deleted successfully'
    });

  } catch (error) {
    console.error('SUPPLIER DELETE ERROR:', error);

    res.status(500).json({
      message: 'Failed to delete supplier'
    });
  }
};