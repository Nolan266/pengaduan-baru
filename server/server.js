// API untuk aplikasi React Native. Memakai skema aduanwarga.db APA ADANYA (tidak ada CREATE/ALTER).
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite'); // SQLite bawaan Node (tanpa kompilasi)

// Ganti path ini ke file DB yang sama dengan yang dipakai web temanmu
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'aduanwarga.db');
const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = path.join(__dirname, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA foreign_keys = ON');
db.exec('PRAGMA journal_mode = WAL'); // supaya web dan API bisa akses bersamaan
db.exec('PRAGMA busy_timeout = 5000');

// Pengganti db.transaction(): jalankan fn di dalam BEGIN/COMMIT, ROLLBACK kalau error
const tx = (fn) => {
  db.exec('BEGIN');
  try { const r = fn(); db.exec('COMMIT'); return r; }
  catch (e) { db.exec('ROLLBACK'); throw e; }
};

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

// Aduan + kategori + progres terakhir
const ADUAN_SQL = `
  SELECT a.id_aduan, a.id_pelapor, a.id_kategori, k.label_kategori, k.dinas_penanggung_jawab AS dinas,
         a.topik, a.deskripsi, a.lokasi_kejadian, a.status, a.tanggal_aduan, a.is_arsip,
         COALESCE((SELECT persentase_progres FROM progres_aduan p WHERE p.id_aduan = a.id_aduan
                   ORDER BY p.updated_at DESC, p.id_progres DESC LIMIT 1), 0) AS progres
  FROM aduan a JOIN kategori k ON k.id_kategori = a.id_kategori`;

app.get('/api/kategori', (_, res) => res.json(db.prepare('SELECT * FROM kategori').all()));
app.get('/api/cctv', (_, res) => res.json(db.prepare('SELECT * FROM cctv_publik').all()));

app.get('/api/pelapor/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM pelapor WHERE id_pelapor = ?').get(req.params.id);
  row ? res.json(row) : res.status(404).json({ error: 'Pelapor tidak ditemukan' });
});

// Daftar aduan milik satu pelapor: /api/aduan?id_pelapor=1&status=Diproses
app.get('/api/aduan', (req, res) => {
  const { id_pelapor, status } = req.query;
  let sql = ADUAN_SQL + ' WHERE a.is_arsip = 0';
  const args = [];
  if (id_pelapor) { sql += ' AND a.id_pelapor = ?'; args.push(id_pelapor); }
  if (status) { sql += ' AND a.status = ?'; args.push(status); }
  sql += ' ORDER BY a.tanggal_aduan DESC';
  const rows = db.prepare(sql).all(...args);
  const media = db.prepare('SELECT * FROM media_aduan WHERE id_aduan = ?');
  res.json(rows.map((r) => ({ ...r, media: media.all(r.id_aduan) })));
});

// Riwayat progres satu aduan (dipakai untuk halaman Notifikasi)
app.get('/api/aduan/:id/progres', (req, res) => {
  res.json(db.prepare('SELECT * FROM progres_aduan WHERE id_aduan = ? ORDER BY updated_at DESC, id_progres DESC').all(req.params.id));
});

// Semua riwayat progres milik pelapor (untuk tab Notif)
app.get('/api/notifikasi', (req, res) => {
  res.json(db.prepare(`
    SELECT p.*, a.topik FROM progres_aduan p JOIN aduan a ON a.id_aduan = p.id_aduan
    WHERE a.id_pelapor = ? ORDER BY p.updated_at DESC, p.id_progres DESC`).all(req.query.id_pelapor));
});

// Buat aduan baru. Foto/video opsional (field "file", multipart/form-data)
app.post('/api/aduan', upload.single('file'), (req, res) => {
  const { id_pelapor, id_kategori, topik, deskripsi, lokasi_kejadian, tipe_media } = req.body;
  if (!id_pelapor || !id_kategori || !topik) return res.status(400).json({ error: 'id_pelapor, id_kategori, topik wajib diisi' });
  const id_aduan = 'ADR-' + Date.now().toString(36).toUpperCase();
  try {
    tx(() => {
      db.prepare(`INSERT INTO aduan (id_aduan, id_pelapor, id_kategori, topik, deskripsi, lokasi_kejadian)
                  VALUES (?, ?, ?, ?, ?, ?)`).run(id_aduan, id_pelapor, id_kategori, topik, deskripsi || null, lokasi_kejadian || null);
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

app.post('/api/survei', (req, res) => {
  const { id_pelapor, skor, label_kepuasan, emoji } = req.body;
  db.prepare('INSERT INTO survei_kepuasan (id_pelapor, skor, label_kepuasan, emoji) VALUES (?, ?, ?, ?)')
    .run(id_pelapor ?? null, skor ?? null, label_kepuasan ?? null, emoji ?? null);
  res.status(201).json({ ok: true });
});

/* ───────────── ADMIN ─────────────
   Semua endpoint /api/admin/* wajib header:  x-admin-key: <ADMIN_KEY>
   Set kuncinya sebelum npm start:  set "ADMIN_KEY=rahasiaku"                    */
const ADMIN_KEY = process.env.ADMIN_KEY || 'admin123';
if (!process.env.ADMIN_KEY) console.warn('PERINGATAN: ADMIN_KEY belum diset, memakai "admin123". Ganti sebelum dipakai bersama!');
const STATUS = ['Verifikasi', 'Diproses', 'Selesai'];

const admin = express.Router();
admin.use((req, res, next) => (req.get('x-admin-key') === ADMIN_KEY ? next() : res.status(401).json({ error: 'Kunci admin salah' })));

// Semua aduan semua warga. Filter: ?status=&id_kategori=&arsip=1&q=kata
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

// Ringkasan untuk dashboard
admin.get('/statistik', (_, res) => {
  res.json({
    per_status: db.prepare('SELECT status, COUNT(*) AS jumlah FROM aduan WHERE is_arsip = 0 GROUP BY status').all(),
    per_kategori: db.prepare(`SELECT k.label_kategori, COUNT(a.id_aduan) AS jumlah FROM kategori k
                              LEFT JOIN aduan a ON a.id_kategori = k.id_kategori AND a.is_arsip = 0 GROUP BY k.id_kategori`).all(),
    survei: db.prepare('SELECT ROUND(AVG(skor), 2) AS rata_rata, COUNT(*) AS jumlah FROM survei_kepuasan').get(),
    total_pelapor: db.prepare('SELECT COUNT(*) AS n FROM pelapor').get().n,
  });
});

// Ubah status + catat progres. Body: { status, persentase_progres, catatan_petugas }
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

// Arsipkan / keluarkan dari arsip. Body: { is_arsip: 1 }
admin.patch('/aduan/:id/arsip', (req, res) => {
  const r = db.prepare('UPDATE aduan SET is_arsip = ? WHERE id_aduan = ?').run(req.body.is_arsip ? 1 : 0, req.params.id);
  r.changes ? res.json({ ok: true }) : res.status(404).json({ error: 'Aduan tidak ditemukan' });
});

// Hapus permanen (progres dan media ikut terhapus lewat ON DELETE CASCADE)
admin.delete('/aduan/:id', (req, res) => {
  const r = db.prepare('DELETE FROM aduan WHERE id_aduan = ?').run(req.params.id);
  r.changes ? res.json({ ok: true }) : res.status(404).json({ error: 'Aduan tidak ditemukan' });
});

// Upload foto sesudah penanganan (field "file")
admin.post('/aduan/:id/media', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'file wajib' });
  try {
    db.prepare('INSERT INTO media_aduan (id_aduan, tipe_media, url_file, keterangan_media) VALUES (?, ?, ?, ?)')
      .run(req.params.id, req.body.tipe_media || 'foto_sesudah', '/uploads/' + req.file.filename, req.body.keterangan_media || null);
    res.status(201).json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// Update kondisi CCTV. Body: { status_online, kondisi_arus }
admin.put('/cctv/:id', (req, res) => {
  const r = db.prepare('UPDATE cctv_publik SET status_online = ?, kondisi_arus = ? WHERE id_cctv = ?')
    .run(req.body.status_online ? 1 : 0, req.body.kondisi_arus ?? null, req.params.id);
  r.changes ? res.json({ ok: true }) : res.status(404).json({ error: 'CCTV tidak ditemukan' });
});

// Daftar warga
admin.get('/pelapor', (_, res) => res.json(db.prepare('SELECT * FROM pelapor ORDER BY nama').all()));

app.use('/api/admin', admin);

app.listen(PORT, '0.0.0.0', () => console.log(`API jalan di http://0.0.0.0:${PORT}  (DB: ${DB_PATH})`));