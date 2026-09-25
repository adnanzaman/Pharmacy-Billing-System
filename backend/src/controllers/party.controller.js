const pool = require('../config/db');

// Party is a unified UI over the existing customer(patient) and supplier records.
// We intentionally keep the legacy tables so existing invoices and history remain intact.
exports.list = async (req, res) => {
  const h = req.user.hospital_id;
  const q = String(req.query.search || '').trim();
  const type = String(req.query.type || 'all').toLowerCase();
  const like = `%${q}%`;
  const out = [];

  if (type === 'all' || type === 'customer') {
    const [customers] = await pool.query(`
      SELECT id, hospital_id, patient_no code, name, mobile, address, 'CUSTOMER' party_type,
             'patient' source_type, id source_id
      FROM patients
      WHERE hospital_id=? AND (?='' OR name LIKE ? OR mobile LIKE ? OR patient_no LIKE ?)
      ORDER BY name`, [h, q, like, like, like]);
    out.push(...customers);
  }

  if (type === 'all' || type === 'supplier') {
    const [suppliers] = await pool.query(`
      SELECT id, hospital_id, NULL code, name, phone mobile, address, 'SUPPLIER' party_type,
             'supplier' source_type, id source_id
      FROM suppliers
      WHERE hospital_id=? AND (?='' OR name LIKE ? OR phone LIKE ?)
      ORDER BY name`, [h, q, like, like]);
    out.push(...suppliers);
  }

  out.sort((a,b) => String(a.name).localeCompare(String(b.name)));
  res.json(out);
};

exports.create = async (req, res) => {
  const h = req.user.hospital_id;
  const { party_type='CUSTOMER', name, mobile=null, address=null } = req.body || {};
  if (!name || !String(name).trim()) return res.status(400).json({message:'Party name is required'});
  const type = String(party_type).toUpperCase();

  if (type === 'CUSTOMER') {
    const [r] = await pool.query(
      `INSERT INTO patients(hospital_id,patient_no,name,mobile,address) VALUES(?,?,?,?,?)`,
      [h, `PAT-${new Date().getFullYear()}-${Date.now()}`, String(name).trim(), mobile || null, address || null]
    );
    return res.status(201).json({id:r.insertId, source_type:'patient', party_type:'CUSTOMER', name, mobile, address});
  }

  if (type === 'SUPPLIER') {
    const [r] = await pool.query(
      `INSERT INTO suppliers(hospital_id,name,phone,address) VALUES(?,?,?,?)`,
      [h, String(name).trim(), mobile || null, address || null]
    );
    return res.status(201).json({id:r.insertId, source_type:'supplier', party_type:'SUPPLIER', name, mobile, address});
  }

  return res.status(400).json({message:'party_type must be CUSTOMER or SUPPLIER'});
};

exports.update = async (req,res) => {
 const h=req.user.hospital_id, id=Number(req.params.id), type=String(req.body?.party_type||'').toUpperCase();
 if(type==='CUSTOMER'){
  await pool.query(`UPDATE patients SET name=?,mobile=?,address=? WHERE id=? AND hospital_id=?`,[req.body.name,req.body.mobile||null,req.body.address||null,id,h]);
  return res.json({ok:true});
 }
 if(type==='SUPPLIER'){
  await pool.query(`UPDATE suppliers SET name=?,phone=?,address=? WHERE id=? AND hospital_id=?`,[req.body.name,req.body.mobile||null,req.body.address||null,id,h]);
  return res.json({ok:true});
 }
 return res.status(400).json({message:'Invalid party type'});
};
exports.remove = async (req,res) => {
 const h=req.user.hospital_id, id=Number(req.params.id), type=String(req.query.type||'').toUpperCase();
 if(type==='CUSTOMER') await pool.query(`DELETE FROM patients WHERE id=? AND hospital_id=?`,[id,h]);
 else if(type==='SUPPLIER') await pool.query(`DELETE FROM suppliers WHERE id=? AND hospital_id=?`,[id,h]);
 else return res.status(400).json({message:'Party type is required'});
 res.json({ok:true});
};
