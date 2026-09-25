const pool=require('../config/db');

exports.stock=async(req,res)=>{
 const [rows]=await pool.query(
 `SELECT m.id,m.name,m.generic_name,m.reorder_level,
   COALESCE((SELECT SUM(st.qty_in-st.qty_out) FROM stock_transactions st WHERE st.medicine_id=m.id),0) stock,
   (SELECT MIN(mb.expiry_date) FROM medicine_batches mb WHERE mb.medicine_id=m.id AND mb.expiry_date IS NOT NULL) nearest_expiry_date
  FROM medicines m
  WHERE m.hospital_id=? ORDER BY m.name`,
 [req.user.hospital_id]);
 res.json(rows);
};

exports.adjust=async(req,res)=>{
 const {medicine_id,batch_id,warehouse_id,qty,type='ADJUSTMENT',note}=req.body;
 if(!medicine_id || !qty) return res.status(400).json({message:'Medicine and quantity are required'});
 const q=Number(qty);
 const inQty=type==='IN'?Math.abs(q):0, outQty=type==='OUT'?Math.abs(q):0;
 const [r]=await pool.query(
  `INSERT INTO stock_transactions(hospital_id,warehouse_id,medicine_id,batch_id,transaction_type,reference_type,qty_in,qty_out)
   VALUES(?,?,?,?,?,?,?,?)`,
  [req.user.hospital_id,warehouse_id||null,medicine_id,batch_id||null,type,'MANUAL',inQty,outQty]);
 res.status(201).json({id:r.insertId,note});
};
