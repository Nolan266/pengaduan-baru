import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, TextInput, Pressable, ActivityIndicator, ScrollView, Animated, Easing,
  KeyboardAvoidingView, Platform, StatusBar, useColorScheme,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import { loadSession, signIn, register, signOut } from './auth';
import { useTheme, LIGHT, DARK } from './aduan/theme';
import { Txt } from './aduan/ui';

const AuthContext = createContext({ session: null, logout: () => {} });
export const useAuth = () => useContext(AuthContext);

const NATIVE = Platform.OS !== 'web';
const GREEN = '#059669';

// Pakai tema dari provider kalau ada; kalau AuthGate di luar provider,
// ikuti mode gelap/terang bawaan sistem (HP atau browser).
function useColors() {
  const theme = useTheme();
  const scheme = useColorScheme();
  const insideProvider = theme.dark || theme.c !== LIGHT;
  if (insideProvider) return theme.c;
  return scheme === 'dark' ? DARK : LIGHT;
}

// Muncul pelan: fade + geser sedikit dari bawah
function Reveal({ children }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: NATIVE }).start();
  }, [v]);
  return (
    <Animated.View style={{ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }}>
      {children}
    </Animated.View>
  );
}

// Ikon kecil yang membal saat ditekan
function PressIcon({ name, onPress, color }) {
  const s = useRef(new Animated.Value(1)).current;
  const to = (v) => Animated.spring(s, { toValue: v, friction: 5, tension: 200, useNativeDriver: NATIVE }).start();
  return (
    <Pressable onPress={onPress} onPressIn={() => to(0.7)} onPressOut={() => to(1)} hitSlop={10}>
      <Animated.View style={{ transform: [{ scale: s }] }}>
        <FontAwesome6 name={name} size={14} color={color} />
      </Animated.View>
    </Pressable>
  );
}

function Field({ label, icon, right, done, c, ...props }) {
  const [focus, setFocus] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;
  const pop = useRef(new Animated.Value(0)).current;

  // Ikon membesar tipis saat kolom difokus
  useEffect(() => {
    Animated.spring(scale, { toValue: focus ? 1.25 : 1, friction: 4, tension: 160, useNativeDriver: NATIVE }).start();
  }, [focus, scale]);

  // Ikon berubah jadi centang dengan efek "pop" saat kolom sudah valid
  useEffect(() => {
    pop.setValue(0);
    if (done) Animated.spring(pop, { toValue: 1, friction: 4, tension: 140, useNativeDriver: NATIVE }).start();
  }, [done, pop]);

  return (
    <View style={{ marginBottom: 12 }}>
      <Txt bold style={{ fontSize: 12, marginBottom: 6 }}>{label}</Txt>
      <View
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 10,
          borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 12,
          borderColor: done ? '#34d399' : focus ? c.link : c.edge,
          backgroundColor: c.screen,
        }}
      >
        <View style={{ width: 20, alignItems: 'center' }}>
          {done ? (
            <Animated.View style={{ transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }] }}>
              <FontAwesome6 name="circle-check" size={15} color={GREEN} />
            </Animated.View>
          ) : (
            <Animated.View style={{ transform: [{ scale }] }}>
              <FontAwesome6 name={icon} size={14} color={focus ? c.link : '#94a3b8'} />
            </Animated.View>
          )}
        </View>
        <TextInput
          style={{ flex: 1, paddingVertical: 12, fontSize: 15, color: c.ink }}
          placeholderTextColor="#94a3b8"
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          {...props}
        />
        {right}
      </View>
    </View>
  );
}

function ModeTabs({ isLogin, onChange, disabled, c }) {
  const tabs = [['login', 'Masuk'], ['register', 'Daftar']];
  return (
    <View style={{ flexDirection: 'row', backgroundColor: c.screen, borderRadius: 14, padding: 4, marginBottom: 16, borderWidth: 1, borderColor: c.edge }}>
      {tabs.map(([key, text]) => {
        const active = (key === 'login') === isLogin;
        return (
          <Pressable
            key={key}
            disabled={disabled}
            onPress={() => onChange(key)}
            style={{
              flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 11,
              backgroundColor: active ? c.surface : 'transparent',
              borderWidth: active ? 1 : 0, borderColor: c.edge,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '800', color: active ? c.link : '#94a3b8' }}>{text}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// Kotak error yang bergetar sedikit saat muncul
function ErrorBox({ message }) {
  const x = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    x.setValue(0);
    const step = (v) => Animated.timing(x, { toValue: v, duration: 55, useNativeDriver: NATIVE });
    Animated.sequence([step(6), step(-6), step(4), step(0)]).start();
  }, [message, x]);
  return (
    <Animated.View
      style={{
        transform: [{ translateX: x }],
        flexDirection: 'row', gap: 8, alignItems: 'center',
        backgroundColor: '#fee2e2', borderRadius: 12, padding: 10, marginBottom: 12,
      }}
    >
      <FontAwesome6 name="circle-exclamation" size={13} color="#dc2626" />
      <Text style={{ flex: 1, color: '#b91c1c', fontSize: 12, fontWeight: '600' }}>{message}</Text>
    </Animated.View>
  );
}

function SubmitButton({ busy, isLogin, onPress }) {
  const s = useRef(new Animated.Value(1)).current;
  const to = (v) => Animated.spring(s, { toValue: v, friction: 6, tension: 220, useNativeDriver: NATIVE }).start();
  return (
    <Pressable onPress={onPress} disabled={busy} onPressIn={() => to(0.97)} onPressOut={() => to(1)}>
      <Animated.View style={{ transform: [{ scale: s }], opacity: busy ? 0.6 : 1, marginTop: 2 }}>
        <LinearGradient
          colors={['#2563eb', '#4f46e5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ borderRadius: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <FontAwesome6 name={isLogin ? 'right-to-bracket' : 'user-plus'} size={14} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>{isLogin ? 'Masuk' : 'Daftar Sekarang'}</Text>
            </>
          )}
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

function AuthScreen({ onDone }) {
  const c = useColors();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [nik, setNik] = useState('');
  const [nama, setNama] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const isLogin = mode === 'login';

  // Penanda kolom valid (ikon jadi centang hijau)
  const nikOk = /^\d{16}$/.test(nik);
  const namaOk = nama.trim().length >= 3;
  const userOk = username.trim().length >= 3;
  const passOk = password.length >= 6;

  const changeMode = (m) => { setMode(m); setError(''); };

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
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.screen }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 28 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Header gradasi, gaya sama seperti carousel berita */}
        <LinearGradient
          colors={['#000000', '#0b1120', '#1e293b']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingTop: 64, paddingBottom: 74, paddingHorizontal: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, overflow: 'hidden' }}
        >
          <View style={{ position: 'absolute', right: 18, top: 56, flexDirection: 'row', gap: 8, opacity: 0.15 }}>
            {['bullhorn', 'road', 'shield-halved'].map((n) => <FontAwesome6 key={n} name={n} size={34} color="#fff" />)}
          </View>
          <View style={{ alignSelf: 'flex-start', backgroundColor: '#fde68a', borderRadius: 5, paddingVertical: 3, paddingHorizontal: 8, marginBottom: 14 }}>
            <Text style={{ color: '#422006', fontSize: 9, fontWeight: '800' }}>LAYANAN RESMI WARGA</Text>
          </View>
          <Text style={{ color: '#fff', fontSize: 30, fontWeight: '800' }}>Aduan Warga</Text>
          <Text style={{ color: '#e0e7ff', fontSize: 13, lineHeight: 19, marginTop: 6, maxWidth: '85%' }}>
            Sampaikan aduan, pantau progresnya, dan lihat info kota langsung dari genggamanmu.
          </Text>
        </LinearGradient>

        {/* Kartu form menumpuk di atas header */}
        <View
          style={{
            marginTop: -46, marginHorizontal: 16, padding: 16, borderRadius: 20,
            backgroundColor: c.surface, borderWidth: 1, borderColor: c.edge,
            shadowColor: '#0f172a', shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 4,
          }}
        >
          <ModeTabs isLogin={isLogin} onChange={changeMode} disabled={busy} c={c} />

          <Txt bold style={{ fontSize: 16, color: c.title }}>{isLogin ? 'Selamat datang kembali' : 'Buat akun baru'}</Txt>
          <Txt secondary small style={{ marginTop: 2, marginBottom: 14 }}>
            {isLogin ? 'Masuk untuk melanjutkan ke beranda.' : 'Lengkapi data sesuai KTP untuk verifikasi.'}
          </Txt>

          {!isLogin && (
            <Reveal key="nik">
              <Field
                c={c} label="NIK" icon="id-card" value={nik} done={nikOk}
                onChangeText={(v) => setNik(v.replace(/\D/g, '').slice(0, 16))}
                maxLength={16} keyboardType="number-pad" placeholder="16 digit angka"
                right={!nikOk ? <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '700' }}>{nik.length}/16</Text> : null}
              />
            </Reveal>
          )}
          {!isLogin && (
            <Reveal key="nama">
              <Field
                c={c} label="Nama lengkap" icon="user" value={nama} done={namaOk}
                onChangeText={setNama} autoCapitalize="words" placeholder="Nama sesuai KTP"
              />
            </Reveal>
          )}
          <Reveal key="user">
            <Field
              c={c} label="Username" icon="at" value={username} done={!isLogin && userOk}
              onChangeText={setUsername} placeholder="contoh: rian"
            />
          </Reveal>
          <Reveal key="pass">
            <Field
              c={c} label="Kata sandi" icon="lock" value={password} done={!isLogin && passOk}
              onChangeText={setPassword} secureTextEntry={!showPass}
              placeholder={isLogin ? 'Kata sandi' : 'Minimal 6 karakter'} onSubmitEditing={submit}
              right={<PressIcon name={showPass ? 'eye-slash' : 'eye'} color="#94a3b8" onPress={() => setShowPass((v) => !v)} />}
            />
          </Reveal>

          {!!error && <ErrorBox message={error} />}

          <SubmitButton busy={busy} isLogin={isLogin} onPress={submit} />


          <Pressable onPress={() => changeMode(isLogin ? 'register' : 'login')} disabled={busy} style={{ marginTop: 16 }}>
            <Txt secondary small style={{ textAlign: 'center' }}>
              {isLogin ? 'Belum punya akun? ' : 'Sudah punya akun? '}
              <Text style={{ color: c.link, fontWeight: '800' }}>{isLogin ? 'Daftar' : 'Masuk'}</Text>
            </Txt>
          </Pressable>
        </View>

        {/* Info keamanan, gaya kartu survei */}
        <View
          style={{
            flexDirection: 'row', gap: 10, alignItems: 'center',
            marginTop: 14, marginHorizontal: 16, padding: 11, borderRadius: 16, borderWidth: 1,
            backgroundColor: c.indigoBg, borderColor: c.indigoEdge,
          }}
        >
          <FontAwesome6 name="shield-halved" size={16} color={c.indigoText} />
          <Txt small style={{ flex: 1, color: c.indigoTitle }}>
            Data NIK hanya dipakai untuk verifikasi warga dan tidak dibagikan ke pihak lain.
          </Txt>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Bungkus app kamu dengan komponen ini
export default function AuthGate({ children }) {
  const c = useColors();
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
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.screen }}>
        <ActivityIndicator size="large" color={c.link} />
      </View>
    );
  }
  if (!session) return <AuthScreen onDone={setSession} />;

  return <AuthContext.Provider value={{ session, logout }}>{children}</AuthContext.Provider>;
}