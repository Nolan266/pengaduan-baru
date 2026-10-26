import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = 'aduan-mobile-session-v1';
const SESSION_DAYS = 7;

// Akun contoh untuk simulasi. Server (server/server.js) belum punya endpoint login,
// jadi pemeriksaan dilakukan di perangkat. Untuk login sungguhan, ganti isi signIn()
// dengan panggilan ke endpoint login dan simpan token dari balasannya.
const DEMO_ACCOUNTS = [{ email: 'rian@example.com', password: 'warga123' }];

export async function loadSession() {
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    const s = raw ? JSON.parse(raw) : null;
    if (!s || !s.exp || Date.now() > s.exp) {
      if (raw) await AsyncStorage.removeItem(SESSION_KEY);
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

export async function signIn(email, password) {
  await new Promise((r) => setTimeout(r, 400));
  const e = String(email).trim().toLowerCase();
  const ok = DEMO_ACCOUNTS.some((a) => a.email === e && a.password === password);
  if (!ok) throw new Error('Email atau kata sandi salah.');
  const session = { email: e, exp: Date.now() + SESSION_DAYS * 24 * 3600 * 1000 };
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session)).catch(() => {});
  return session;
}

export const signOut = () => AsyncStorage.removeItem(SESSION_KEY).catch(() => {});
