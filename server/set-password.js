// Beri username + password ke pelapor yang SUDAH ada:
//   node set-password.js <id_pelapor> <username> <password>
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const { hashPw } = require('./password');

const [id, username, password] = process.argv.slice(2);
if (!id || !username || !password || password.length < 6) {
  console.error('Pemakaian: node set-password.js <id_pelapor> <username> <password (min 6)>');
  process.exit(1);
}
const db = new DatabaseSync(process.env.DB_PATH || path.join(__dirname, 'aduanwarga.db'));
try {
  const r = db.prepare('UPDATE pelapor SET username = ?, password_hash = ? WHERE id_pelapor = ?')
    .run(username.trim().toLowerCase(), hashPw(password), id);
  console.log(r.changes ? 'Berhasil.' : 'id_pelapor tidak ditemukan.');
} catch (e) {
  console.error('Gagal:', e.message);
}