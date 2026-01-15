import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const match = line.match(/^([A-Za-z0-9_]+)\s*=\s*(.*)$/);
    if (!match) continue;
    const key = match[1];
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(path.join(repoRoot, '.env.local'));
loadEnvFile(path.join(repoRoot, '.env'));

function getArg(name) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return '';
  return process.argv[idx + 1] || '';
}

const tenantId = getArg('tenant');
const userId = getArg('user');
const password = getArg('password');

if (!tenantId || !userId || !password) {
  console.error(
    'Usage: node scripts/reset-admin-password.mjs --tenant <tenantId> --user <userId> --password <newPassword>'
  );
  process.exit(1);
}

if (password.length < 8) {
  console.error('Password must be at least 8 characters.');
  process.exit(1);
}

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI is not set. Add it to .env.local or your environment.');
  process.exit(1);
}

async function hashPassword(raw) {
  const salt = crypto.randomBytes(16);
  const hash = await new Promise((resolve, reject) => {
    crypto.scrypt(raw, salt, 64, (err, derived) => {
      if (err) reject(err);
      else resolve(derived);
    });
  });
  return `scrypt:${salt.toString('base64')}:${hash.toString('base64')}`;
}

async function main() {
  await mongoose.connect(MONGODB_URI, {
    dbName: 'inventoryApp',
    autoIndex: false,
  });

  const Account =
    mongoose.models.Account ||
    mongoose.model('Account', new mongoose.Schema({}, { strict: false, collection: 'accounts' }));

  const passwordHash = await hashPassword(password);

  const result = await Account.findOneAndUpdate(
    { tenantId, userId, isAdmin: true },
    { $set: { passwordHash } },
    { new: true }
  );

  if (!result) {
    console.error('Admin account not found for that tenant/user.');
    process.exit(1);
  }

  console.log(`Updated admin password for userId "${userId}".`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Password reset failed:', err?.message || err);
  process.exit(1);
});
