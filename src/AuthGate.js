import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView,
  KeyboardAvoidingView, Platform, StyleSheet, StatusBar,
} from 'react-native';
import { loadSession, signIn, register, signOut } from './auth';

const AuthContext = createContext({ session: null, logout: () => {} });
export const useAuth = () => useContext(AuthContext);

function Field({ label, ...props }) {
  return (
    <View style={s.fieldWrap}>
      <Text style={s.label}>{label}</Text>
      <TextInput style={s.input} placeholderTextColor="#9aa4b2" autoCapitalize="none" autoCorrect={false} {...props} />
    </View>
  );
}

function AuthScreen({ onDone }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [nik, setNik] = useState('');
  const [nama, setNama] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const isLogin = mode === 'login';

  const submit = async () => {
    setError('');
    if (!username.trim() || !password) return setError('Username dan kata sandi wajib diisi.');
    if (!isLogin) {
      if (!nik.trim() || !nama.trim()) return setError('NIK dan nama wajib diisi.');
      if (!/^\d{16}$/.test(nik)) return setError('NIK harus 16 digit angka.');
      if (password.length < 6) return setError('Kata sandi minimal 6 karakter.');
    }
    setBusy(true);
    try {
      const session = isLogin
        ? await signIn(username, password)
        : await register({ nik: nik.trim(), nama: nama.trim(), username, password });
      onDone(session);
    } catch (e) {
      setError(e.message || 'Terjadi kesalahan.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        <Text style={s.title}>Aduan Warga</Text>
        <Text style={s.subtitle}>{isLogin ? 'Masuk ke akunmu' : 'Buat akun baru'}</Text>

        {!isLogin && (
          <>
            <Field label="NIK" value={nik} onChangeText={(v) => setNik(v.replace(/\D/g, '').slice(0, 16))} maxLength={16} keyboardType="number-pad" placeholder="16 digit angka" />
            <Field label="Nama lengkap" value={nama} onChangeText={setNama} autoCapitalize="words" placeholder="Nama sesuai KTP" />
          </>
        )}
        <Field label="Username" value={username} onChangeText={setUsername} placeholder="contoh: rian" />
        <Field label="Kata sandi" value={password} onChangeText={setPassword} secureTextEntry placeholder="Minimal 6 karakter" onSubmitEditing={submit} />

        {!!error && <Text style={s.error}>{error}</Text>}

        <TouchableOpacity style={[s.button, busy && s.buttonOff]} onPress={submit} disabled={busy} activeOpacity={0.8}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>{isLogin ? 'Masuk' : 'Daftar'}</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => { setMode(isLogin ? 'register' : 'login'); setError(''); }} disabled={busy}>
          <Text style={s.switch}>
            {isLogin ? 'Belum punya akun? ' : 'Sudah punya akun? '}
            <Text style={s.switchBold}>{isLogin ? 'Daftar' : 'Masuk'}</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Bungkus app kamu dengan komponen ini
export default function AuthGate({ children }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    loadSession().then((s) => { setSession(s); setLoading(false); });
  }, []);

  const logout = useCallback(async () => {
    await signOut();
    setSession(null);
  }, []);

  if (loading) {
    return <View style={[s.flex, s.center]}><ActivityIndicator size="large" color="#2563eb" /></View>;
  }
  if (!session) return <AuthScreen onDone={setSession} />;

  return <AuthContext.Provider value={{ session, logout }}>{children}</AuthContext.Provider>;
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  center: { alignItems: 'center', justifyContent: 'center' },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 30, fontWeight: '800', color: '#0f172a', textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#64748b', textAlign: 'center', marginBottom: 28, marginTop: 4 },
  fieldWrap: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: '#0f172a', backgroundColor: '#f8fafc' },
  error: { color: '#dc2626', fontSize: 14, marginBottom: 12, textAlign: 'center' },
  button: { backgroundColor: '#2563eb', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  buttonOff: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  switch: { textAlign: 'center', marginTop: 20, color: '#64748b', fontSize: 14 },
  switchBold: { color: '#2563eb', fontWeight: '700' },
});