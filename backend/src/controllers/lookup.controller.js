const pool = require('../config/db');

exports.departments = async (req,res) => {
  const [rows] = await pool.query('SELECT * FROM departments WHERE hospital_id=? AND is_active=1 ORDER BY name', [req.user.hospital_id]);
  res.json(rows);
};
exports.doctors = async (req,res) => {
  const [rows] = await pool.query('SELECT * FROM doctors WHERE hospital_id=? AND is_active=1 ORDER BY name', [req.user.hospital_id]);
  res.json(rows);
};
exports.categories = async (req,res) => {
  try {
    const [rows] = await pool.query('SELECT id, name FROM medicine_categories WHERE hospital_id=? ORDER BY name', [req.user.hospital_id]);
    res.json(rows);
  } catch (error) {
    console.error('CATEGORY LOOKUP ERROR:', error);
    res.status(500).json({ message: 'Failed to load categories' });
  }
};
exports.taxProfiles = async (req,res) => {
  const [rows] = await pool.query('SELECT * FROM tax_profiles WHERE hospital_id=? AND is_active=1 ORDER BY name', [req.user.hospital_id]);
  res.json(rows);
};
exports.units = async (req,res) => {
  const [rows] = await pool.query('SELECT id, name FROM medicine_units WHERE hospital_id=? ORDER BY name', [req.user.hospital_id]);
  res.json(rows);
};
exports.warehouses = async (req,res) => {
  const [rows] = await pool.query('SELECT id, name, branch_id FROM warehouses WHERE hospital_id=? ORDER BY name', [req.user.hospital_id]);
  res.json(rows);
};
