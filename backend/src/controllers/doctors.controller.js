const pool = require('../config/db');

const audit = async (conn, req, action, entity, entityId, details = {}) => {
  await conn.query(
    `INSERT INTO audit_logs(user_id, action, entity, entity_id, details) VALUES(?,?,?,?,?)`,
    [req.user.id || null, action, entity, entityId || null, JSON.stringify(details)]
  );
};

exports.list = async (req, res) => {
  const [rows] = await pool.query(
    `SELECT d.*, dep.name department_name
     FROM doctors d LEFT JOIN departments dep ON dep.id=d.department_id
     WHERE d.hospital_id=? ORDER BY d.name`, [req.user.hospital_id]);
  res.json(rows);
};

exports.getOne = async (req, res) => {
  const [[row]] = await pool.query(
    `SELECT d.*, dep.name department_name
     FROM doctors d LEFT JOIN departments dep ON dep.id=d.department_id
     WHERE d.id=? AND d.hospital_id=? LIMIT 1`, [req.params.id, req.user.hospital_id]);
  if (!row) return res.status(404).json({message:'Doctor not found'});
  res.json(row);
};

exports.create = async (req, res) => {
  const {doctor_code,name,qualification,speciality,phone,department_id,consultation_fee=0,is_active=1} = req.body;
  if (!name || !String(name).trim()) return res.status(400).json({message:'Doctor name is required'});
  if (!doctor_code || !String(doctor_code).trim()) return res.status(400).json({message:'Doctor code is required'});
  const conn=await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [r]=await conn.query(`INSERT INTO doctors(hospital_id,department_id,doctor_code,name,qualification,speciality,phone,consultation_fee,is_active) VALUES(?,?,?,?,?,?,?,?,?)`,
      [req.user.hospital_id,department_id||null,doctor_code.trim(),name.trim(),qualification||null,speciality||null,phone||null,Number(consultation_fee||0),is_active?1:0]);
    await audit(conn,req,'CREATE','DOCTOR',r.insertId,{after:req.body});
    await conn.commit(); res.status(201).json({id:r.insertId,message:'Doctor added successfully'});
  } catch(e){await conn.rollback(); throw e} finally{conn.release()}
};

exports.update = async (req, res) => {
  const id=req.params.id;
  const {doctor_code,name,qualification,speciality,phone,department_id,consultation_fee=0,is_active=1}=req.body;
  if (!name || !String(name).trim()) return res.status(400).json({message:'Doctor name is required'});
  if (!doctor_code || !String(doctor_code).trim()) return res.status(400).json({message:'Doctor code is required'});
  const conn=await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[before]]=await conn.query(`SELECT * FROM doctors WHERE id=? AND hospital_id=? FOR UPDATE`,[id,req.user.hospital_id]);
    if(!before){await conn.rollback();return res.status(404).json({message:'Doctor not found'});}
    await conn.query(`UPDATE doctors SET department_id=?,doctor_code=?,name=?,qualification=?,speciality=?,phone=?,consultation_fee=?,is_active=? WHERE id=? AND hospital_id=?`,
      [department_id||null,doctor_code.trim(),name.trim(),qualification||null,speciality||null,phone||null,Number(consultation_fee||0),is_active?1:0,id,req.user.hospital_id]);
    await audit(conn,req,'UPDATE','DOCTOR',id,{before,after:req.body});
    await conn.commit(); res.json({message:'Doctor updated successfully'});
  } catch(e){await conn.rollback();throw e} finally{conn.release()}
};

exports.remove = async (req,res) => {
  const id=req.params.id;
  const conn=await pool.getConnection();
  try{
    await conn.beginTransaction();
    const [[before]]=await conn.query(`SELECT * FROM doctors WHERE id=? AND hospital_id=? FOR UPDATE`,[id,req.user.hospital_id]);
    if(!before){await conn.rollback();return res.status(404).json({message:'Doctor not found'});}
    const [[used]]=await conn.query(`SELECT (SELECT COUNT(*) FROM patient_visits WHERE doctor_id=?) + (SELECT COUNT(*) FROM sales_invoices WHERE doctor_id=?) used_count`,[id,id]);
    if(Number(used.used_count)>0){
      await conn.query(`UPDATE doctors SET is_active=0 WHERE id=? AND hospital_id=?`,[id,req.user.hospital_id]);
      await audit(conn,req,'DEACTIVATE','DOCTOR',id,{before});
      await conn.commit(); return res.json({message:'Doctor has history and was deactivated instead of deleted'});
    }
    await conn.query(`DELETE FROM doctors WHERE id=? AND hospital_id=?`,[id,req.user.hospital_id]);
    await audit(conn,req,'DELETE','DOCTOR',id,{before});
    await conn.commit(); res.json({message:'Doctor deleted successfully'});
  }catch(e){await conn.rollback();throw e}finally{conn.release()}
};
