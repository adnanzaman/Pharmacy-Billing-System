const pool = require('../config/db');

/* =========================================================
   LIST CATEGORIES
========================================================= */
exports.list = async (req, res) => {
  try {
    const { q } = req.query;

    const params = [req.user.hospital_id];
    let where = 'WHERE c.hospital_id = ?';

    if (q) {
      where += ' AND c.name LIKE ?';
      params.push(`%${q}%`);
    }

    const [rows] = await pool.query(
      `
      SELECT
        c.*,

        (
          SELECT COUNT(*)
          FROM medicines m
          WHERE m.category_id = c.id
        ) AS item_count

      FROM medicine_categories c

      ${where}

      ORDER BY c.name ASC
      `,
      params
    );

    res.json(rows);

  } catch (error) {
   // console.error('CATEGORIES LIST ERROR:', error);

    res.status(500).json({
      message: 'Failed to load categories'
    });
  }
};


/* =========================================================
   ADD CATEGORY
========================================================= */
exports.create = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        message: 'Category name is required'
      });
    }

    const [existing] = await pool.query(
      `
      SELECT id FROM medicine_categories
      WHERE hospital_id = ? AND name = ?
      LIMIT 1
      `,
      [req.user.hospital_id, String(name).trim()]
    );

    if (existing.length) {
      return res.status(409).json({
        message: 'A category with this name already exists'
      });
    }

    const [result] = await pool.query(
      `
      INSERT INTO medicine_categories
      (hospital_id, name)
      VALUES (?, ?)
      `,
      [req.user.hospital_id, String(name).trim()]
    );

    res.status(201).json({
      id: result.insertId,
      message: 'Category added successfully'
    });

  } catch (error) {
    //console.error('CATEGORY CREATE ERROR:', error);

    res.status(500).json({
      message: 'Failed to add category'
    });
  }
};


/* =========================================================
   UPDATE / EDIT CATEGORY
========================================================= */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        message: 'Category name is required'
      });
    }

    const [existing] = await pool.query(
      `
      SELECT id FROM medicine_categories
      WHERE hospital_id = ? AND name = ? AND id <> ?
      LIMIT 1
      `,
      [req.user.hospital_id, String(name).trim(), id]
    );

    if (existing.length) {
      return res.status(409).json({
        message: 'A category with this name already exists'
      });
    }

    const [result] = await pool.query(
      `
      UPDATE medicine_categories
      SET name = ?
      WHERE id = ? AND hospital_id = ?
      `,
      [String(name).trim(), id, req.user.hospital_id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        message: 'Category not found'
      });
    }

    res.json({
      message: 'Category updated successfully'
    });

  } catch (error) {
    //console.error('CATEGORY UPDATE ERROR:', error);

    res.status(500).json({
      message: 'Failed to update category'
    });
  }
};


/* =========================================================
   DELETE CATEGORY
========================================================= */
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;

    const [category] = await pool.query(
      `
      SELECT id FROM medicine_categories
      WHERE id = ? AND hospital_id = ?
      LIMIT 1
      `,
      [id, req.user.hospital_id]
    );

    if (!category.length) {
      return res.status(404).json({
        message: 'Category not found'
      });
    }

    const [inUse] = await pool.query(
      `SELECT COUNT(*) AS total FROM medicines WHERE category_id = ?`,
      [id]
    );

    if (Number(inUse[0].total) > 0) {
      return res.status(409).json({
        message:
          'This category cannot be deleted because it is assigned to one or more items. Please reassign those items first.'
      });
    }

    await pool.query(
      `DELETE FROM medicine_categories WHERE id = ? AND hospital_id = ?`,
      [id, req.user.hospital_id]
    );

    res.json({
      message: 'Category deleted successfully'
    });

  } catch (error) {
    //console.error('CATEGORY DELETE ERROR:', error);

    res.status(500).json({
      message: 'Failed to delete category'
    });
  }
};
