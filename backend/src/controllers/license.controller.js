const pool = require('../config/db');

exports.status = async (req, res) => {
  const [settings] = await pool.query(
    `SELECT hospital_id,license_id,license_status,max_desktops,max_mobile_devices,expires_at
       FROM hospital_license_settings WHERE hospital_id=? LIMIT 1`,
    [req.user.hospital_id]
  );
  const [activations] = await pool.query(
    `SELECT id,license_id,platform,device_id,device_name,status,first_seen,last_seen
       FROM license_activations WHERE hospital_id=? ORDER BY platform,first_seen`,
    [req.user.hospital_id]
  );
  res.json({ settings: settings[0] || null, activations });
};

// Mobile installs identify themselves with X-Xmart-Device-ID. The first device
// is registered automatically; additional devices require available license seats.
exports.mobileCheck = async (req, res) => {
  const deviceId = String(req.headers['x-xmart-device-id'] || '').trim();
  const deviceName = String(req.headers['x-xmart-device-name'] || '').trim().slice(0,255);
  if (!deviceId) return res.status(400).json({ message:'Mobile device ID is required' });

  const hospitalId = req.user.hospital_id;
  const [settingsRows] = await pool.query(
    'SELECT * FROM hospital_license_settings WHERE hospital_id=? LIMIT 1', [hospitalId]
  );

  let settings = settingsRows[0];
  if (!settings) {
    const licenseId = process.env.XMART_LICENSE_ID || `HOSPITAL-${hospitalId}`;
    const maxMobile = Number(process.env.XMART_MAX_MOBILE_DEVICES || 1);
    await pool.query(
      `INSERT INTO hospital_license_settings(hospital_id,license_id,license_status,max_desktops,max_mobile_devices,expires_at)
       VALUES(?,?,?,?,?,?)`,
      [hospitalId, licenseId, 'ACTIVE', Number(process.env.XMART_MAX_DESKTOPS || 1), maxMobile, process.env.XMART_LICENSE_EXPIRES_AT || null]
    );
    const [fresh] = await pool.query('SELECT * FROM hospital_license_settings WHERE hospital_id=? LIMIT 1',[hospitalId]);
    settings = fresh[0];
  }

  if (settings.license_status !== 'ACTIVE') {
    return res.status(403).json({ message:'This hospital license is not active. Please contact Xmart Solution LLC 03328327729' });
  }
  if (settings.expires_at && new Date(settings.expires_at).getTime() < Date.now()) {
    return res.status(403).json({ message:'This hospital license has expired. Please contact Xmart Solution LLC 03328327729' });
  }

  const [existing] = await pool.query(
    `SELECT id,status FROM license_activations WHERE hospital_id=? AND license_id=? AND platform='MOBILE' AND device_id=? LIMIT 1`,
    [hospitalId, settings.license_id, deviceId]
  );
  if (existing.length) {
    if (existing[0].status !== 'ACTIVE') return res.status(403).json({ message:'This mobile device is blocked for this license. Please contact Xmart Solution LLC 03328327729' });
    await pool.query('UPDATE license_activations SET last_seen=NOW(),device_name=? WHERE id=?',[deviceName,existing[0].id]);
    return res.json({ ok:true, activated:true });
  }

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS c FROM license_activations WHERE hospital_id=? AND license_id=? AND platform='MOBILE' AND status='ACTIVE'`,
    [hospitalId, settings.license_id]
  );
  if (Number(countRows[0].c) >= Number(settings.max_mobile_devices)) {
    return res.status(403).json({ message:'Mobile device limit reached for this hospital license. Please contact Xmart Solution LLC 03328327729' });
  }

  await pool.query(
    `INSERT INTO license_activations(hospital_id,license_id,platform,device_id,device_name,status)
     VALUES(?,?,?,?,?,'ACTIVE')`,
    [hospitalId,settings.license_id,'MOBILE',deviceId,deviceName]
  );
  res.json({ ok:true, activated:true });
};
