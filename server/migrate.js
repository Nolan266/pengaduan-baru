// Jalankan SEKALI:  node migrate.js
// Menambah kolom username & password_hash ke tabel pelapor. Aman dijalankan berulang.
const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'aduanwarga.db');
const backup = DB_PATH + '.bak-' + Date.now();
fs.copyFileSync(DB_PATH, backup);
console.log('Backup dibuat:', backup);

const db = new DatabaseSync(DB_PATH);
const cols = db.prepare('PRAGMA table_info(pelapor)').all().map((c) => c.name);
if (!cols.includes('username')) db.exec('ALTER TABLE pelapor ADD COLUMN username TEXT');
if (!cols.includes('password_hash')) db.exec('ALTER TABLE pelapor ADD COLUMN password_hash TEXT');
db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_pelapor_username ON pelapor(username)');
console.log('Selesai. Kolom pelapor sekarang:', db.prepare('PRAGMA table_info(pelapor)').all().map((c) => c.name).join(', '));