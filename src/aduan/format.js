// Format tanggal dan pemetaan data dari server ke bentuk yang dipakai tampilan.
import { API_URL } from '../auth';

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const pad = (n) => String(n).padStart(2, '0');

export const stamp = (v) => {
  const d = new Date(new Date(v).getTime() + 7 * 3600 * 1000); // WIB = UTC+7
  return `${d.getUTCDate()} ${BULAN[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${pad(d.getUTCHours())}.${pad(d.getUTCMinutes())} WIB`;
};

// SQLite menyimpan waktu UTC "YYYY-MM-DD HH:MM:SS"
const toIso = (s) => new Date(String(s).replace(' ', 'T') + 'Z').toISOString();

const STATUS_UI = { Verifikasi: 'Dibuat', Diproses: 'Diproses', Selesai: 'Selesai' };

const EVENT_ICON = { Dibuat: 'file-circle-plus', Diproses: 'gears', Selesai: 'circle-check', Dibatalkan: 'circle-xmark' };

const EVENT_BODY = { Dibuat: 'Aduan berhasil dibuat dan menunggu verifikasi.', Diproses: 'Aduan sedang ditangani.', Selesai: 'Penanganan selesai. Terima kasih atas partisipasi Anda.', Dibatalkan: 'Aduan dibatalkan oleh pelapor.' };

export const fromPelapor = (p) => ({ name: p.nama, username: p.username, address: p.alamat || '', nik: p.nik, foto: p.foto_url ? API_URL + p.foto_url : null });

export const maskNik = (n) => { const s = String(n || ''); return s.length > 4 ? '•••• •••• •••• ' + s.slice(-4) : s; };

export const mapReport = (r) => ({
  id: r.id_aduan, title: r.topik, category: r.label_kategori, description: r.deskripsi || '-',
  location: r.lokasi_kejadian || '-', createdAt: toIso(r.tanggal_aduan),
  status: STATUS_UI[r.status] || r.status, progress: r.progres || 0, agency: r.dinas,
  media: (r.media || []).map((m) => ({ uri: API_URL + m.url_file, kind: m.tipe_media === 'video' ? 'video' : 'photo', tipe: m.tipe_media })),
});

export const mapEvent = (p) => {
  const status = STATUS_UI[p.status_tahapan] || p.status_tahapan;
  return {
    id: `P-${p.id_progres}`, report: p.id_aduan, title: p.topik, status,
    icon: EVENT_ICON[status] || 'bell', body: p.catatan_petugas || EVENT_BODY[status] || '', time: toIso(p.updated_at),
  };
};
