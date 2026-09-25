const pool = require('../config/db');

/* =========================================================
   LIST UNITS
========================================================= */
exports.list = async (req, res) => {
  try {
    const { q } = req.query;

    const params = [req.user.hospital_id];
    let where = 'WHERE u.hospital_id = ?';

    if (q) {
      where += ' AND u.name LIKE ?';
      params.push(`%${q}%`);
    }

    const [rows] = await pool.query(
      `
      SELECT
        u.*,

        (
          SELECT COUNT(*)
          FROM medicines m
          WHERE m.unit_id = u.id
        ) AS item_count

      FROM medicine_units u

      ${where}

      ORDER BY u.name ASC
      `,
      params
    );

    res.json(rows);

  } catch (error) {
    console.error('UNITS LIST ERROR:', error);

    res.status(500).json({
      message: 'Failed to load units'
    });
  }
};


/* =========================================================
   ADD UNIT
========================================================= */
exports.create = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        message: 'Unit name is required'
      });
    }

    const [existing] = await pool.query(
      `
      SELECT id FROM medicine_units
      WHERE hospital_id = ? AND name = ?
      LIMIT 1
      `,
      [req.user.hospital_id, String(name).trim()]
    );

    if (existing.length) {
      return res.status(409).json({
        message: 'A unit with this name already exists'
      });
    }

    const [result] = await pool.query(
      `
      INSERT INTO medicine_units
      (hospital_id, name)
      VALUES (?, ?)
      `,
      [req.user.hospital_id, String(name).trim()]
    );

    res.status(201).json({
      id: result.insertId,
      message: 'Unit added successfully'
    });

  } catch (error) {
    console.error('UNIT CREATE ERROR:', error);

    res.status(500).json({
      message: 'Failed to add unit'
    });
  }
};


/* =========================================================
   UPDATE / EDIT UNIT
========================================================= */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        message: 'Unit name is required'
      });
    }

    const [existing] = await pool.query(
      `
      SELECT id FROM medicine_units
      WHERE hospital_id = ? AND name = ? AND id <> ?
      LIMIT 1
      `,
      [req.user.hospital_id, String(name).trim(), id]
    );

    if (existing.length) {
      return res.status(409).json({
        message: 'A unit with this name already exists'
      });
    }

    const [result] = await pool.query(
      `
      UPDATE medicine_units
      SET name = ?
      WHERE id = ? AND hospital_id = ?
      `,
      [String(name).trim(), id, req.user.hospital_id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        message: 'Unit not found'
      });
    }

    res.json({
      message: 'Unit updated successfully'
    });

  } catch (error) {
    console.error('UNIT UPDATE ERROR:', error);

    res.status(500).json({
      message: 'Failed to update unit'
    });
  }
};


/* =========================================================
   DELETE UNIT
========================================================= */
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;

    const [unit] = await pool.query(
      `
      SELECT id FROM medicine_units
      WHERE id = ? AND hospital_id = ?
      LIMIT 1
      `,
      [id, req.user.hospital_id]
    );

    if (!unit.length) {
      return res.status(404).json({
        message: 'Unit not found'
      });
    }

    const [inUse] = await pool.query(
      `SELECT COUNT(*) AS total FROM medicines WHERE unit_id = ?`,
      [id]
    );

    if (Number(inUse[0].total) > 0) {
      return res.status(409).json({
        message:
          'This unit cannot be deleted because it is assigned to one or more items. Please reassign those items first.'
      });
    }

    await pool.query(
      `DELETE FROM medicine_units WHERE id = ? AND hospital_id = ?`,
      [id, req.user.hospital_id]
    );

    res.json({
      message: 'Unit deleted successfully'
    });

  } catch (error) {
    console.error('UNIT DELETE ERROR:', error);

    res.status(500).json({
      message: 'Failed to delete unit'
    });
  }
};
