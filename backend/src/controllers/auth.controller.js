const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req,res) => {
  const { email, password } = req.body;


  const [rows] = await pool.query(
    `SELECT u.*, r.name role_name, h.name hospital_name, COALESCE(u.hospital_id, (SELECT id FROM hospitals ORDER BY id ASC LIMIT 1)) hospital_id
     FROM users u
     LEFT JOIN user_roles ur ON ur.user_id=u.id
     LEFT JOIN roles r ON r.id=ur.role_id
     LEFT JOIN hospitals h ON h.id=u.hospital_id
     WHERE u.email=? AND u.is_active=1 LIMIT 1`, [email]
  );
  //console.log(password);
  //console.log(rows[0].password_hash);

  //console.log(await bcrypt.compare(password, rows[0].password_hash));
  //console.log(email);

  if (!rows.length || !(await bcrypt.compare(password, rows[0].password_hash))) {
    return res.status(401).json({message:'Invalid email or password'});
  }
  const u = rows[0];
  const token = jwt.sign(
    {id:u.id,email:u.email,name:u.name,role:u.role_name,hospital_id:u.hospital_id,branch_id:u.branch_id},
    process.env.JWT_SECRET,{expiresIn:'8h'}
  );
  res.json({token,user:{id:u.id,name:u.name,email:u.email,role:u.role_name,hospital_id:u.hospital_id}});
};

exports.me = async (req,res) => res.json({user:req.user});
