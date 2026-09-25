const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true,
  // Keep MySQL DATE/DATETIME/TIMESTAMP values as SQL-style strings instead of
  // JavaScript Date objects. This prevents JSON from turning local dates/times
  // into UTC ISO values such as 2026-09-18T19:00:00.000Z.
  dateStrings: true,
  // Xmart Hospital operates on Pakistan Standard Time.
  timezone: process.env.DB_TIMEZONE || '+05:00'
});

module.exports = pool;
