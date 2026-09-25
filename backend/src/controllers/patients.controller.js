const pool = require('../config/db');

exports.list = async (req, res) => {
  const q = (req.query.q || '').trim();
  const h = req.user.hospital_id;
  const params = [h];
  let where = 'p.hospital_id = ?';

  if (q) {
    where += ' AND (p.name LIKE ? OR p.patient_no LIKE ? OR p.mobile LIKE ? OR p.cnic LIKE ?)';
    const like = `%${q}%`;
    params.push(like, like, like, like);
  }

  const [rows] = await pool.query(
    `SELECT p.*, COUNT(v.id) AS visit_count
     FROM patients p
     LEFT JOIN patient_visits v ON v.patient_id = p.id
     WHERE ${where}
     GROUP BY p.id
     ORDER BY p.id DESC
     LIMIT 500`,
    params
  );

  res.json(rows);
};

exports.getOne = async (req, res) => {
  const [rows] = await pool.query(
    `SELECT p.*, COUNT(v.id) AS visit_count
     FROM patients p
     LEFT JOIN patient_visits v ON v.patient_id = p.id
     WHERE p.id = ? AND p.hospital_id = ?
     GROUP BY p.id
     LIMIT 1`,
    [req.params.id, req.user.hospital_id]
  );

  if (!rows.length) {
    return res.status(404).json({ message: 'Patient not found' });
  }

  res.json(rows[0]);
};

exports.create = async (req, res) => {
  const h = req.user.hospital_id;
  const {
    name,
    father_husband_name,
    cnic,
    gender,
    dob,
    mobile,
    address,
    blood_group,
    emergency_contact,
    doctor_id,
    department_id,
    registration_fee = 0,
    discount = 0,
    paid = 0
  } = req.body;

  if (!name || !String(name).trim()) {
    return res.status(400).json({ message: 'Patient name is required' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[n]] = await conn.query(
      `SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM patients`
    );
    const patientNo = `PAT-${new Date().getFullYear()}-${String(n.next_id).padStart(6, '0')}`;

    const [r] = await conn.query(
      `INSERT INTO patients
       (hospital_id,patient_no,name,father_husband_name,cnic,gender,dob,mobile,address,blood_group,emergency_contact)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [
        h, patientNo, String(name).trim(), father_husband_name || null,
        cnic || null, gender || 'Other', dob || null, mobile || null,
        address || null, blood_group || null, emergency_contact || null
      ]
    );

    await conn.query(
      `INSERT INTO patient_visits
       (patient_id,doctor_id,department_id,registration_fee,discount,paid)
       VALUES (?,?,?,?,?,?)`,
      [
        r.insertId,
        doctor_id || null,
        department_id || null,
        Number(registration_fee || 0),
        Number(discount || 0),
        Number(paid || 0)
      ]
    );

    await conn.query(
      `INSERT INTO audit_logs(user_id,action,entity,entity_id,details)
       VALUES(?,?,?,?,?)`,
      [req.user.id, 'CREATE', 'PATIENT', r.insertId, JSON.stringify({ after: req.body })]
    );

    await conn.commit();
    res.status(201).json({ id: r.insertId, patient_no: patientNo });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

exports.update = async (req, res) => {
  const id = req.params.id;
  const h = req.user.hospital_id;
  const {
    name,
    father_husband_name,
    cnic,
    gender,
    dob,
    mobile,
    address,
    blood_group,
    emergency_contact
  } = req.body;

  if (!name || !String(name).trim()) {
    return res.status(400).json({ message: 'Patient name is required' });
  }

  const [[before]] = await pool.query(
    `SELECT * FROM patients WHERE id = ? AND hospital_id = ? LIMIT 1`,
    [id, h]
  );

  if (!before) {
    return res.status(404).json({ message: 'Patient not found' });
  }

  const [result] = await pool.query(
    `UPDATE patients SET
       name = ?,
       father_husband_name = ?,
       cnic = ?,
       gender = ?,
       dob = ?,
       mobile = ?,
       address = ?,
       blood_group = ?,
       emergency_contact = ?
     WHERE id = ? AND hospital_id = ?`,
    [
      String(name).trim(), father_husband_name || null, cnic || null,
      gender || 'Other', dob || null, mobile || null, address || null,
      blood_group || null, emergency_contact || null, id, h
    ]
  );

  if (!result.affectedRows) {
    return res.status(404).json({ message: 'Patient not found' });
  }

  await pool.query(
    `INSERT INTO audit_logs(user_id,action,entity,entity_id,details)
     VALUES(?,?,?,?,?)`,
    [req.user.id, 'UPDATE', 'PATIENT', id, JSON.stringify({ before, after: req.body })]
  );

  res.json({ message: 'Patient updated successfully' });
};

exports.remove = async (req, res) => {
  const id = req.params.id;
  const h = req.user.hospital_id;

  const [[patient]] = await pool.query(
    `SELECT * FROM patients WHERE id = ? AND hospital_id = ? LIMIT 1`,
    [id, h]
  );

  if (!patient) {
    return res.status(404).json({ message: 'Patient not found' });
  }

  // Keep historical patient/visit data. The current schema has no is_active
  // column on patients, so remove the patient only when it has no visits.
  const [[visitCount]] = await pool.query(
    `SELECT COUNT(*) AS total FROM patient_visits WHERE patient_id = ?`,
    [id]
  );

  if (Number(visitCount.total) > 0) {
    return res.status(409).json({
      message: 'This patient has visit history and cannot be deleted. Edit the patient instead.'
    });
  }

  await pool.query(
    `INSERT INTO audit_logs(user_id,action,entity,entity_id,details)
     VALUES(?,?,?,?,?)`,
    [req.user.id, 'DELETE', 'PATIENT', id, JSON.stringify({ before: patient })]
  );

  await pool.query(
    `DELETE FROM patients WHERE id = ? AND hospital_id = ?`,
    [id, h]
  );

  res.json({ message: 'Patient deleted successfully' });
};

exports.visits = async (req, res) => {
  const [rows] = await pool.query(
    `SELECT v.*,p.patient_no,p.name AS patient_name,
            d.name AS doctor_name,dp.name AS department_name
     FROM patient_visits v
     JOIN patients p ON p.id = v.patient_id
     LEFT JOIN doctors d ON d.id = v.doctor_id
     LEFT JOIN departments dp ON dp.id = v.department_id
     WHERE p.hospital_id = ? AND v.patient_id = ?
     ORDER BY v.visit_date DESC`,
    [req.user.hospital_id, req.params.id]
  );
  res.json(rows);
};
