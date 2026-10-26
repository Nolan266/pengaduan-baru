// API untuk aplikasi React Native.
// Butuh kolom pelapor.username & pelapor.password_hash -> jalankan `node migrate.js` sekali dulu.
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite'); // SQLite bawaan Node (tanpa kompilasi)
const { hashPw, cekPw } = require('./password');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'aduanwarga.db');
const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = path.join(__dirname, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA foreign_keys = ON');
db.exec('PRAGMA journal_mode = WAL'); // supaya web dan API bisa akses bersamaan
db.exec('PRAGMA busy_timeout = 5000');

// Pastikan migrasi sudah dijalankan
const pelaporCols = db.prepare('PRAGMA table_info(pelapor)').all().map((c) => c.name);
if (!pelaporCols.includes('username') || !pelaporCols.includes('password_hash')) {
  console.error('Kolom username/password_hash belum ada di tabel pelapor. Jalankan dulu: node migrate.js');
  process.exit(1);
}

// Kalau tabel kategori masih kosong, isi 4 kategori bawaan (supaya aduan bisa dibuat). Tidak menyentuh data yang sudah ada.
if (db.prepare('SELECT COUNT(*) AS n FROM kategori').get().n === 0) {
  const ins = db.prepare('INSERT INTO kategori (id_kategori, label_kategori, dinas_penanggung_jawab, warna_tema) VALUES (?, ?, ?, ?)');
  [['INF', 'Infrastruktur', 'Dinas PUPR', '#2563eb'], ['PKR', 'Parkir Liar', 'Dishub', '#4f46e5'],
   ['PND', 'Pendidikan', 'Disdik', '#059669'], ['KBR', 'Kebersihan', 'DLH', '#d97706']].forEach((k) => ins.run(...k));
  console.log('Tabel kategori kosong: diisi 4 kategori bawaan.');
}

const tx = (fn) => {
  db.exec('BEGIN');
  try { const r = fn(); db.exec('COMMIT'); return r; }
  catch (e) { db.exec('ROLLBACK'); throw e; }
};

/* ───────────── TOKEN & AUTH WARGA ───────────── */
const TOKEN_SECRET = process.env.TOKEN_SECRET || 'ganti-ini-sebelum-dipakai';
if (!process.env.TOKEN_SECRET) console.warn('PERINGATAN: TOKEN_SECRET belum diset. Ganti sebelum dipakai bersama!');
const TOKEN_DAYS = 7;

const sign = (payload) => {
  const b = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return b + '.' + crypto.createHmac('sha256', TOKEN_SECRET).update(b).digest('base64url');
};
const verify = (token) => {
  try {
    const [b, s] = String(token || '').split('.');
    if (!b || !s) return null;
    const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(b).digest('base64url');
    if (s.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected))) return null;
    const p = JSON.parse(Buffer.from(b, 'base64url').toString());
    return p.exp > Date.now() ? p : null;
  } catch { return null; }
};
// Middleware: wajib header  Authorization: Bearer <token>
const auth = (req, res, next) => {
  const m = (req.get('authorization') || '').match(/^Bearer (.+)$/);
  const p = m && verify(m[1]);
  if (!p) return res.status(401).json({ error: 'Belum login atau sesi habis' });
  req.user = p; // { id, exp }
  next();
};

const PELAPOR_AMAN = 'id_pelapor, nik, nama, username, avatar_tone, alamat, latitude, longitude, status_aktif'; // tanpa password_hash

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOAD_DIR));

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (_, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/[^\w.\-]/g, '_')),
  }),
  limits: { fileSize: 30 * 1024 * 1024 },
});

const ADUAN_SQL = `
  SELECT a.id_aduan, a.id_pelapor, a.id_kategori, k.label_kategori, k.dinas_penanggung_jawab AS dinas,
         a.topik, a.deskripsi, a.lokasi_kejadian, a.status, a.tanggal_aduan, a.is_arsip,
         COALESCE((SELECT persentase_progres FROM progres_aduan p WHERE p.id_aduan = a.id_aduan
                   ORDER BY p.updated_at DESC, p.id_progres DESC LIMIT 1), 0) AS progres
  FROM aduan a JOIN kategori k ON k.id_kategori = a.id_kategori`;

/* ───────────── PUBLIK ───────────── */
app.get('/api/kategori', (_, res) => res.json(db.prepare('SELECT * FROM kategori').all()));
app.get('/api/cctv', (_, res) => res.json(db.prepare('SELECT * FROM cctv_publik').all()));

/* ───────────── REGISTER & LOGIN ───────────── */
app.post('/api/register', (req, res) => {
  const { nik, nama, username, password } = req.body;
  if (!nik || !nama || !username || !password || String(password).length < 6)
    return res.status(400).json({ error: 'nik, nama, username, password (min 6 karakter) wajib diisi' });
  if (!/^\d{16}$/.test(String(nik).trim())) return res.status(400).json({ error: 'NIK harus 16 digit angka' });
  try {
    const r = db.prepare('INSERT INTO pelapor (nik, nama, username, password_hash) VALUES (?, ?, ?, ?)')
      .run(String(nik).trim(), String(nama).trim(), String(username).trim().toLowerCase(), hashPw(String(password)));
    res.status(201).json({ id_pelapor: Number(r.lastInsertRowid) });
  } catch (e) {
    res.status(400).json({ error: 'NIK atau username sudah terdaftar' });
  }
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const p = db.prepare('SELECT * FROM pelapor WHERE username = ?').get(String(username || '').trim().toLowerCase());
  if (!p || !cekPw(password || '', p.password_hash))
    return res.status(401).json({ error: 'Username atau kata sandi salah.' });
  if (!p.status_aktif) return res.status(403).json({ error: 'Akun tidak aktif.' });
  delete p.password_hash;
  res.json({ token: sign({ id: p.id_pelapor, exp: Date.now() + TOKEN_DAYS * 864e5 }), pelapor: p });
});

/* ───────────── WARGA (wajib login) ───────────── */
// Profil sendiri
app.get('/api/me', auth, (req, res) => {
  const row = db.prepare(`SELECT ${PELAPOR_AMAN} FROM pelapor WHERE id_pelapor = ?`).get(req.user.id);
  row ? res.json(row) : res.status(404).json({ error: 'Pelapor tidak ditemukan' });
});

// Ubah nama & alamat sendiri
app.patch('/api/me', auth, (req, res) => {
  const nama = String(req.body.nama || '').trim();
  const alamat = String(req.body.alamat || '').trim();
  if (!nama) return res.status(400).json({ error: 'Nama wajib diisi' });
  db.prepare('UPDATE pelapor SET nama = ?, alamat = ? WHERE id_pelapor = ?').run(nama, alamat || null, req.user.id);
  res.json({ ok: true });
});

// Daftar aduan milik sendiri: /api/aduan?status=Diproses
app.get('/api/aduan', auth, (req, res) => {
  let sql = ADUAN_SQL + ' WHERE a.is_arsip = 0 AND a.id_pelapor = ?';
  const args = [req.user.id];
  if (req.query.status) { sql += ' AND a.status = ?'; args.push(req.query.status); }
  sql += ' ORDER BY a.tanggal_aduan DESC';
  const rows = db.prepare(sql).all(...args);
  const media = db.prepare('SELECT * FROM media_aduan WHERE id_aduan = ?');
  res.json(rows.map((r) => ({ ...r, media: media.all(r.id_aduan) })));
});

// Riwayat progres satu aduan (hanya kalau aduan itu milik sendiri)
app.get('/api/aduan/:id/progres', auth, (req, res) => {
  const own = db.prepare('SELECT 1 FROM aduan WHERE id_aduan = ? AND id_pelapor = ?').get(req.params.id, req.user.id);
  if (!own) return res.status(404).json({ error: 'Aduan tidak ditemukan' });
  res.json(db.prepare('SELECT * FROM progres_aduan WHERE id_aduan = ? ORDER BY updated_at DESC, id_progres DESC').all(req.params.id));
});

// Semua riwayat progres milik sendiri (tab Notif)
app.get('/api/notifikasi', auth, (req, res) => {
  res.json(db.prepare(`
    SELECT p.*, a.topik FROM progres_aduan p JOIN aduan a ON a.id_aduan = p.id_aduan
    WHERE a.id_pelapor = ? ORDER BY p.updated_at DESC, p.id_progres DESC`).all(req.user.id));
});

// Buat aduan baru. Foto/video opsional (field "file", multipart/form-data)
app.post('/api/aduan', auth, upload.single('file'), (req, res) => {
  const { id_kategori, topik, deskripsi, lokasi_kejadian, tipe_media } = req.body;
  if (!id_kategori || !topik) return res.status(400).json({ error: 'id_kategori dan topik wajib diisi' });
  const id_aduan = 'ADR-' + Date.now().toString(36).toUpperCase();
  try {
    tx(() => {
      db.prepare(`INSERT INTO aduan (id_aduan, id_pelapor, id_kategori, topik, deskripsi, lokasi_kejadian)
                  VALUES (?, ?, ?, ?, ?, ?)`).run(id_aduan, req.user.id, id_kategori, topik, deskripsi || null, lokasi_kejadian || null);
      db.prepare(`INSERT INTO progres_aduan (id_aduan, status_tahapan, persentase_progres, catatan_petugas)
                  VALUES (?, 'Verifikasi', 0, 'Aduan berhasil dibuat dan menunggu verifikasi.')`).run(id_aduan);
      if (req.file) {
        db.prepare(`INSERT INTO media_aduan (id_aduan, tipe_media, url_file, keterangan_media) VALUES (?, ?, ?, ?)`)
          .run(id_aduan, tipe_media || 'foto_sebelum', '/uploads/' + req.file.filename, req.file.originalname);
      }
    });
    res.status(201).json({ id_aduan });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/survei', auth, (req, res) => {
  const { skor, label_kepuasan, emoji } = req.body;
  try {
    db.prepare('INSERT INTO survei_kepuasan (id_pelapor, skor, label_kepuasan, emoji) VALUES (?, ?, ?, ?)')
      .run(req.user.id, skor ?? null, label_kepuasan ?? null, emoji ?? null);
    res.status(201).json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

/* ───────────── ADMIN ─────────────
   Semua endpoint /api/admin/* wajib header:  x-admin-key: <ADMIN_KEY>
   Set kuncinya sebelum npm start:  set "ADMIN_KEY=rahasiaku"                    */
const ADMIN_KEY = process.env.ADMIN_KEY || 'admin123';
if (!process.env.ADMIN_KEY) console.warn('PERINGATAN: ADMIN_KEY belum diset, memakai "admin123". Ganti sebelum dipakai bersama!');
const STATUS = ['Verifikasi', 'Diproses', 'Selesai'];

const admin = express.Router();
admin.use((req, res, next) => (req.get('x-admin-key') === ADMIN_KEY ? next() : res.status(401).json({ error: 'Kunci admin salah' })));

admin.get('/aduan', (req, res) => {
  const { status, id_kategori, arsip, q } = req.query;
  let sql = `SELECT x.*, p.nama AS nama_pelapor, p.nik FROM (${ADUAN_SQL}) x JOIN pelapor p ON p.id_pelapor = x.id_pelapor WHERE x.is_arsip = ?`;
  const args = [arsip === '1' ? 1 : 0];
  if (status) { sql += ' AND x.status = ?'; args.push(status); }
  if (id_kategori) { sql += ' AND x.id_kategori = ?'; args.push(id_kategori); }
  if (q) { sql += ' AND (x.topik LIKE ? OR x.deskripsi LIKE ? OR p.nama LIKE ?)'; args.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  sql += ' ORDER BY x.tanggal_aduan DESC';
  res.json(db.prepare(sql).all(...args));
});

admin.get('/statistik', (_, res) => {
  res.json({
    per_status: db.prepare('SELECT status, COUNT(*) AS jumlah FROM aduan WHERE is_arsip = 0 GROUP BY status').all(),
    per_kategori: db.prepare(`SELECT k.label_kategori, COUNT(a.id_aduan) AS jumlah FROM kategori k
                              LEFT JOIN aduan a ON a.id_kategori = k.id_kategori AND a.is_arsip = 0 GROUP BY k.id_kategori`).all(),
    survei: db.prepare('SELECT ROUND(AVG(skor), 2) AS rata_rata, COUNT(*) AS jumlah FROM survei_kepuasan').get(),
    total_pelapor: db.prepare('SELECT COUNT(*) AS n FROM pelapor').get().n,
  });
});

admin.patch('/aduan/:id/status', (req, res) => {
  const { status, persentase_progres, catatan_petugas } = req.body;
  if (!STATUS.includes(status)) return res.status(400).json({ error: `status harus salah satu: ${STATUS.join(', ')}` });
  const persen = status === 'Selesai' ? 100 : Number(persentase_progres ?? 0);
  if (!Number.isInteger(persen) || persen < 0 || persen > 100) return res.status(400).json({ error: 'persentase_progres harus 0-100' });
  const ok = tx(() => {
    const r = db.prepare('UPDATE aduan SET status = ? WHERE id_aduan = ?').run(status, req.params.id);
    if (!r.changes) return false;
    db.prepare('INSERT INTO progres_aduan (id_aduan, status_tahapan, persentase_progres, catatan_petugas) VALUES (?, ?, ?, ?)')
      .run(req.params.id, status, persen, catatan_petugas || null);
    return true;
  });
  ok ? res.json({ ok: true }) : res.status(404).json({ error: 'Aduan tidak ditemukan' });
});

admin.patch('/aduan/:id/arsip', (req, res) => {
  const r = db.prepare('UPDATE aduan SET is_arsip = ? WHERE id_aduan = ?').run(req.body.is_arsip ? 1 : 0, req.params.id);
  r.changes ? res.json({ ok: true }) : res.status(404).json({ error: 'Aduan tidak ditemukan' });
});

admin.delete('/aduan/:id', (req, res) => {
  const r = db.prepare('DELETE FROM aduan WHERE id_aduan = ?').run(req.params.id);
  r.changes ? res.json({ ok: true }) : res.status(404).json({ error: 'Aduan tidak ditemukan' });
});

admin.post('/aduan/:id/media', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'file wajib' });
  try {
    db.prepare('INSERT INTO media_aduan (id_aduan, tipe_media, url_file, keterangan_media) VALUES (?, ?, ?, ?)')
      .run(req.params.id, req.body.tipe_media || 'foto_sesudah', '/uploads/' + req.file.filename, req.body.keterangan_media || null);
    res.status(201).json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

admin.put('/cctv/:id', (req, res) => {
  const r = db.prepare('UPDATE cctv_publik SET status_online = ?, kondisi_arus = ? WHERE id_cctv = ?')
    .run(req.body.status_online ? 1 : 0, req.body.kondisi_arus ?? null, req.params.id);
  r.changes ? res.json({ ok: true }) : res.status(404).json({ error: 'CCTV tidak ditemukan' });
});

// Daftar warga (tanpa password_hash)
admin.get('/pelapor', (_, res) => res.json(db.prepare(`SELECT ${PELAPOR_AMAN} FROM pelapor ORDER BY nama`).all()));

app.use('/api/admin', admin);

app.listen(PORT, '0.0.0.0', () => console.log(`API jalan di http://0.0.0.0:${PORT}  (DB: ${DB_PATH})`));