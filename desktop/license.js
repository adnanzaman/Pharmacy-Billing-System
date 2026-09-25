const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const PUBLIC_KEY = fs.readFileSync(path.join(__dirname, 'license-public-key.pem'), 'utf8');

function readMachineId() {
  try {
    if (process.platform === 'win32') {
      const out = execFileSync('reg', ['query', 'HKLM\\SOFTWARE\\Microsoft\\Cryptography', '/v', 'MachineGuid'], { encoding:'utf8', stdio:['ignore','pipe','ignore'] });
      const m = out.match(/MachineGuid\s+REG_SZ\s+([^\r\n]+)/i);
      if (m) return m[1].trim();
    }
    if (process.platform === 'darwin') {
      const out = execFileSync('ioreg', ['-rd1', '-c', 'IOPlatformExpertDevice'], { encoding:'utf8', stdio:['ignore','pipe','ignore'] });
      const m = out.match(/IOPlatformUUID"\s*=\s*"([^"]+)"/);
      if (m) return m[1];
    }
    if (process.platform === 'linux') {
      const p = '/etc/machine-id';
      if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8').trim();
    }
  } catch (_) {}
  return [os.platform(), os.arch(), os.hostname(), os.homedir()].join('|');
}

function machineFingerprint() {
  return crypto.createHash('sha256').update(readMachineId()).digest('hex');
}

function licensePath() {
  return path.join(require('electron').app.getPath('userData'), 'license.json');
}

function verifyLicense(license) {
  if (!license || !license.payload || !license.signature) {
    return { ok:false, reason:'License file is missing or invalid' };
  }
  const payloadText = JSON.stringify(license.payload);
  const signature = Buffer.from(license.signature, 'base64');
  const validSignature = crypto.verify(null, Buffer.from(payloadText), PUBLIC_KEY, signature);
  if (!validSignature) return { ok:false, reason:'License signature is invalid' };

  if (license.payload.platform !== 'DESKTOP') return { ok:false, reason:'This license is not a desktop license' };
  if (license.payload.machine_hash !== machineFingerprint()) return { ok:false, reason:'This installation is not licensed for this computer' };

  if (license.payload.expires_at) {
    const expires = new Date(license.payload.expires_at + 'T23:59:59');
    if (Number.isNaN(expires.getTime()) || expires.getTime() < Date.now()) {
      return { ok:false, reason:'License has expired' };
    }
  }
  return { ok:true, payload:license.payload };
}

function loadLicense() {
  const p = licensePath();
  let license = null;
  try { license = JSON.parse(fs.readFileSync(p, 'utf8')); } catch (_) {}
  const result = verifyLicense(license);
  return { ...result, path:p, machine_hash:machineFingerprint() };
}

module.exports = { loadLicense, machineFingerprint, licensePath };
