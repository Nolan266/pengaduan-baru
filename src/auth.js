import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = 'aduan-mobile-session-v2';
const SESSION_DAYS = 7;

// GANTI dengan IP laptop yang menjalankan server (bukan localhost; HP dan laptop harus satu WiFi)
export const API_URL = 'http://192.168.1.9:3000';
export async function loadSession() {
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    const s = raw ? JSON.parse(raw) : null;
    if (!s || !s.token || !s.exp || Date.now() > s.exp) {
      if (raw) await AsyncStorage.removeItem(SESSION_KEY);
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

async function postJson(path, body) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('Tidak bisa terhubung ke server. Cek koneksi dan alamat API_URL.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Terjadi kesalahan.');
  return data;
}

export async function signIn(username, password) {
  const data = await postJson('/api/login', { username: String(username).trim(), password });
  const session = {
    token: data.token,
    pelapor: data.pelapor, // { id_pelapor, nama, username, ... }
    exp: Date.now() + SESSION_DAYS * 24 * 3600 * 1000,
  };
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session)).catch(() => {});
  return session;
}

// Daftar akun baru, lalu langsung masuk
export async function register({ nik, nama, username, password }) {
  await postJson('/api/register', { nik, nama, username, password });
  return signIn(username, password);
}

export const signOut = () => AsyncStorage.removeItem(SESSION_KEY).catch(() => {});

// Pengganti fetch untuk endpoint yang butuh login. Contoh:
//   const aduan = await authFetch('/api/aduan');
//   const baru  = await authFetch('/api/aduan', { method: 'POST', body: formData });
export async function authFetch(path, options = {}) {
  const s = await loadSession();
  if (!s) throw new Error('Belum login.');
  const headers = { ...(options.headers || {}), Authorization: `Bearer ${s.token}` };
  const isForm = typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (options.body && !isForm && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body: options.body && !isForm && typeof options.body !== 'string' ? JSON.stringify(options.body) : options.body,
  });
  if (res.status === 401) {
    await signOut();
    throw new Error('Sesi habis, silakan masuk lagi.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Terjadi kesalahan.');
  return data;
}