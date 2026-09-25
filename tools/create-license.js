#!/usr/bin/env node
// Run this tool ONLY on the Xmart licensing/admin machine.
// Keep the Ed25519 private key outside the customer/source ZIP.
const fs = require('fs');
const crypto = require('crypto');

function arg(name, fallback='') {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i+1] : fallback;
}

const machineHash = arg('machine-hash');
const hospital = arg('hospital');
const licenseId = arg('license-id', `XMART-${Date.now()}`);
const expires = arg('expires', '');
const out = arg('out', 'license.json');
const privateKeyPath = process.env.XMART_LICENSE_PRIVATE_KEY || arg('private-key');

if (!machineHash || !hospital || !privateKeyPath) {
  console.error('Usage: node tools/create-license.js --machine-hash <64hex> --hospital "Hospital Name" --private-key <private.pem> [--license-id ID] [--expires YYYY-MM-DD] [--out license.json]');
  process.exit(1);
}

const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
const payload = {
  license_id: licenseId,
  product: 'Xmart Hospital ERP',
  platform: 'DESKTOP',
  hospital,
  machine_hash: machineHash,
  issued_at: new Date().toISOString(),
  expires_at: expires || null
};
const signature = crypto.sign(null, Buffer.from(JSON.stringify(payload)), privateKey).toString('base64');
fs.writeFileSync(out, JSON.stringify({ payload, signature }, null, 2));
console.log(`Created ${out}`);
