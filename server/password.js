// Hash password (scrypt bawaan Node, tanpa library tambahan). Format: salt:hash
const crypto = require('crypto');

const hashPw = (pw) => {
  const salt = crypto.randomBytes(16).toString('hex');
  return salt + ':' + crypto.scryptSync(pw, salt, 64).toString('hex');
};

const cekPw = (pw, stored) => {
  const [salt, h] = String(stored || '').split(':');
  if (!salt || !h) return false;
  const a = Buffer.from(crypto.scryptSync(String(pw), salt, 64).toString('hex'));
  const b = Buffer.from(h);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

module.exports = { hashPw, cekPw };