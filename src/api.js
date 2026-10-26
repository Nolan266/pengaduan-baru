// Taruh di project Expo (mis. folder app/ atau src/). Ganti IP dengan IP laptop kamu.
export const API_URL = 'http://192.168.101.17:3000';

const j = async (path, opts) => {
  const r = await fetch(API_URL + path, opts);
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Gagal terhubung ke server');
  return r.json();
};

export const getKategori = () => j('/api/kategori');
export const getCctv = () => j('/api/cctv');
export const getPelapor = (id) => j(`/api/pelapor/${id}`);
export const getAduan = (idPelapor, status) =>
  j(`/api/aduan?id_pelapor=${idPelapor}${status ? `&status=${status}` : ''}`);
export const getNotifikasi = (idPelapor) => j(`/api/notifikasi?id_pelapor=${idPelapor}`);
export const kirimSurvei = (body) =>
  j('/api/survei', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

// media = { uri, kind: 'photo' | 'video', name } dari ImagePicker (opsional)
export function buatAduan({ id_pelapor, id_kategori, topik, deskripsi, lokasi_kejadian }, media) {
  const f = new FormData();
  Object.entries({ id_pelapor, id_kategori, topik, deskripsi, lokasi_kejadian }).forEach(([k, v]) => f.append(k, String(v ?? '')));
  if (media) {
    f.append('tipe_media', media.kind === 'video' ? 'video' : 'foto_sebelum');
    f.append('file', { uri: media.uri, name: media.name, type: media.kind === 'video' ? 'video/mp4' : 'image/jpeg' });
  }
  return j('/api/aduan', { method: 'POST', body: f });
}