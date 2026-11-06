// Layar Profil (gaya Telegram), ubah profil, dan ganti kata sandi.
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Animated, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import { maskNik } from '../format';
import { useTheme, useRC } from '../theme';
import { BigAvatar, colorsFor, FadeIn, PopIn, ScaleBtn, SheetMenu, FloatField, NavBar } from '../tg';
import { Txt, ConfirmModal } from '../ui';

/* ───────────── potongan kecil ───────────── */
function Group({ children, style }) {
  const { c } = useTheme();
  return <View style={[{ backgroundColor: c.surface, borderRadius: 16, borderWidth: 1, borderColor: c.edge, overflow: 'hidden' }, style]}>{children}</View>;
}

function InfoRow({ label, value, last }) {
  const { c } = useTheme();
  return (
    <View style={{ paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth, borderBottomColor: c.edge }}>
      <Text selectable style={{ fontSize: 15, color: c.ink }}>{value}</Text>
      <Text style={{ fontSize: 11, color: c.secondary, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

function Accordion({ title, children, last }) {
  const { c } = useTheme();
  const [open, setOpen] = useState(false);
  const turn = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(turn, { toValue: open ? 1 : 0, duration: 180, useNativeDriver: Platform.OS !== 'web' }).start(); }, [open, turn]);
  return (
    <View style={{ borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth, borderBottomColor: c.edge }}>
      <Pressable onPress={() => setOpen(!open)} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingVertical: 14, paddingHorizontal: 16, backgroundColor: pressed ? c.screen : 'transparent' })}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: c.ink }}>{title}</Text>
        <Animated.View style={{ transform: [{ rotate: turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) }] }}>
          <FontAwesome6 name="chevron-down" size={11} color={c.secondary} />
        </Animated.View>
      </Pressable>
      {open && <FadeIn y={6}><Txt small style={{ paddingHorizontal: 16, paddingBottom: 14 }}>{children}</Txt></FadeIn>}
    </View>
  );
}

function Action({ icon, label, onPress }) {
  return (
    <ScaleBtn onPress={onPress} outerStyle={{ flex: 1 }} style={{ alignItems: 'center', paddingVertical: 12, borderRadius: 16, backgroundColor: '#ffffff2e' }}>
      <FontAwesome6 name={icon} size={16} color="#fff" />
      <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600', marginTop: 5 }}>{label}</Text>
    </ScaleBtn>
  );
}

/* ───────────── Profil ───────────── */
export function ProfilePage({ data, onEdit, onChangePw, onLogout, onPhoto, onRemovePhoto }) {
  const rc = useRC();
  const [sheet, setSheet] = useState(false);
  const [confirmOut, setConfirmOut] = useState(false);
  const p = data.profile;
  const total = data.reports.length;
  const selesai = data.reports.filter((r) => r.status === 'Selesai').length;
  const rows = [
    ['Nama', p.name], ['Username', `@${p.username}`], ['Alamat', p.address || 'Belum diisi'],
    ['NIK', maskNik(p.nik)], ['Aduan', `${total} aduan · ${selesai} selesai`],
  ];
  const items = [
    { icon: 'camera', label: 'Ambil foto', onPress: () => onPhoto('camera') },
    { icon: 'image', label: 'Pilih dari galeri', onPress: () => onPhoto('library') },
    ...(p.foto ? [{ icon: 'trash', label: 'Hapus foto', danger: true, onPress: onRemovePhoto }] : []),
  ];
  const accordions = [
    ['Keamanan akun', 'Nomor identitas ditampilkan tersamarkan. Kata sandi disimpan dalam bentuk terenkripsi (hash) di server. Anda dapat menggantinya lewat tombol Sandi di atas.'],
    ['Privasi & penyimpanan', 'Profil dan aduan Anda tersimpan di server aduan warga, sehingga tetap ada saat Anda masuk dari perangkat lain.'],
    ['Bantuan penggunaan', 'Buka Aduan → Tambah untuk membuat aduan. Pantau tahapan Dibuat, Diproses, dan Selesai di tab Notif. Pilih lokasi pada CCTV untuk memutar video simulasi.'],
    ['Tentang aplikasi', 'Aduan Masyarakat · Sarana pengaduan fasilitas dan layanan publik. Berita dan CCTV pada beranda merupakan contoh.'],
  ];
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 28 }} refreshControl={rc}>
      <LinearGradient colors={['#0f172a', '#1e293b', '#312e81']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}        style={{ paddingTop: 26, paddingBottom: 20, paddingHorizontal: 16, alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 }}>
        <PopIn>
          <ScaleBtn onPress={() => setSheet(true)}><BigAvatar uri={p.foto} name={p.name} size={104} ring /></ScaleBtn>
        </PopIn>
        <FadeIn delay={120} y={8} style={{ alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 12, textAlign: 'center' }}>{p.name}</Text>
          <Text style={{ color: '#ffffffd0', fontSize: 12, marginTop: 3 }}>@{p.username} · Warga terverifikasi</Text>
        </FadeIn>
        <FadeIn delay={220} y={10} style={{ flexDirection: 'row', gap: 10, marginTop: 18, alignSelf: 'stretch' }}>
          <Action icon="pen" label="Edit" onPress={onEdit} />
          <Action icon="key" label="Sandi" onPress={onChangePw} />
          <Action icon="right-from-bracket" label="Keluar" onPress={() => setConfirmOut(true)} />
        </FadeIn>
      </LinearGradient>

      <View style={{ padding: 16, gap: 12 }}>
        <FadeIn delay={300}>
          <Group>{rows.map(([k, v], i) => <InfoRow key={k} label={k} value={v} last={i === rows.length - 1} />)}</Group>
        </FadeIn>
        <FadeIn delay={380}>
          <Group>{accordions.map(([t, body], i) => <Accordion key={t} title={t} last={i === accordions.length - 1}>{body}</Accordion>)}</Group>
        </FadeIn>
      </View>

      <SheetMenu visible={sheet} onClose={() => setSheet(false)} items={items} />
      <ConfirmModal visible={confirmOut} title="Keluar dari akun?" confirmText="Keluar"
        message="Anda perlu masuk lagi dengan username dan kata sandi untuk memakai aplikasi."
        onConfirm={() => { setConfirmOut(false); onLogout(); }} onCancel={() => setConfirmOut(false)} />
    </ScrollView>
  );
}

/* ───────────── Ubah profil ───────────── */
export function EditProfilePage({ profile, onCancel, onSave, onPhoto, onRemovePhoto }) {
  const { c } = useTheme();
  const [nama, setNama] = useState(profile.name);
  const [alamat, setAlamat] = useState(profile.address || '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sheet, setSheet] = useState(false);
  const canPhoto = typeof onPhoto === 'function';
  const changed = nama.trim() !== profile.name || alamat.trim() !== (profile.address || '');

  const save = async () => {
    if (busy) return;
    if (!nama.trim()) { setError('Nama wajib diisi.'); return; }
    setBusy(true); setError('');
    try { await onSave({ nama: nama.trim(), alamat: alamat.trim() }); }
    catch (e) { setError(e.message || 'Gagal menyimpan.'); setBusy(false); }
  };

  const items = canPhoto ? [
    { icon: 'camera', label: 'Ambil foto', onPress: () => onPhoto('camera') },
    { icon: 'image', label: 'Pilih dari galeri', onPress: () => onPhoto('library') },
    ...(profile.foto && onRemovePhoto ? [{ icon: 'trash', label: 'Hapus foto', danger: true, onPress: onRemovePhoto }] : []),
  ] : [];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <NavBar title="Ubah Profil" left="Batal" right="Selesai" onLeft={onCancel} onRight={save} rightDisabled={!changed || busy} busy={busy} />

        <PopIn style={{ alignItems: 'center', marginVertical: 10 }}>
          <ScaleBtn onPress={() => setSheet(true)} disabled={!canPhoto}>
            <View>
              <BigAvatar uri={profile.foto} name={nama || profile.name} size={112} />
              {canPhoto && (
                <View style={{ position: 'absolute', right: 0, bottom: 0, width: 34, height: 34, borderRadius: 17, backgroundColor: '#2563eb',
                  borderWidth: 3, borderColor: c.screen, alignItems: 'center', justifyContent: 'center' }}>
                  <FontAwesome6 name="camera" size={13} color="#fff" />
                </View>
              )}
            </View>
          </ScaleBtn>
          {canPhoto && (
            <Pressable onPress={() => setSheet(true)} hitSlop={8} style={{ marginTop: 10 }}>
              <Text style={{ color: c.link, fontSize: 14, fontWeight: '600' }}>Ubah foto profil</Text>
            </Pressable>
          )}
        </PopIn>

        <FadeIn delay={120}>
          <Group>
            <FloatField label="Nama" value={nama} onChangeText={setNama} maxLength={120} />
            <FloatField label="Alamat" value={alamat} onChangeText={setAlamat} maxLength={250} multiline counter last />
          </Group>
          <Txt small secondary style={{ marginTop: 8, marginHorizontal: 6 }}>Nama dan alamat tampil di profil Anda.</Txt>
        </FadeIn>

        <FadeIn delay={200} style={{ marginTop: 18 }}>
          <Group>
            <InfoRow label="Username" value={`@${profile.username}`} />
            <InfoRow label="NIK" value={maskNik(profile.nik)} last />
          </Group>
          <Txt small secondary style={{ marginTop: 8, marginHorizontal: 6 }}>Username dan NIK tidak dapat diubah.</Txt>
        </FadeIn>

        {!!error && <Txt small style={{ color: '#e87979', marginTop: 12, marginHorizontal: 6 }}>{error}</Txt>}
      </ScrollView>
      <SheetMenu visible={sheet} onClose={() => setSheet(false)} items={items} />
    </KeyboardAvoidingView>
  );
}

/* ───────────── Ganti kata sandi ───────────── */
export function ChangePasswordPage({ onCancel, onSave }) {
  const { c } = useTheme();
  const [lama, setLama] = useState('');
  const [baru, setBaru] = useState('');
  const [ulang, setUlang] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (busy) return;
    if (!lama || !baru || !ulang) { setError('Lengkapi semua kolom.'); return; }
    if (baru.length < 6) { setError('Kata sandi baru minimal 6 karakter.'); return; }
    if (baru !== ulang) { setError('Konfirmasi kata sandi tidak sama.'); return; }
    if (baru === lama) { setError('Kata sandi baru harus berbeda dari yang lama.'); return; }
    setBusy(true); setError('');
    try { await onSave({ password_lama: lama, password_baru: baru }); }
    catch (e) { setError(e.message || 'Gagal mengganti kata sandi.'); setBusy(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <NavBar title="Kata Sandi" left="Batal" right="Simpan" onLeft={onCancel} onRight={save} rightDisabled={busy} busy={busy} />
        <PopIn style={{ alignItems: 'center', marginVertical: 14 }}>
          <View style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: c.indigoBg, borderWidth: 1, borderColor: c.indigoEdge, alignItems: 'center', justifyContent: 'center' }}>
            <FontAwesome6 name="key" size={26} color={c.indigoText} />
          </View>
        </PopIn>
        <FadeIn delay={120}>
          <Group>
            <FloatField label="Kata sandi lama" value={lama} onChangeText={setLama} secureTextEntry={!show} autoCapitalize="none" maxLength={100} />
            <FloatField label="Kata sandi baru (min. 6 karakter)" value={baru} onChangeText={setBaru} secureTextEntry={!show} autoCapitalize="none" maxLength={100} />
            <FloatField label="Ulangi kata sandi baru" value={ulang} onChangeText={setUlang} secureTextEntry={!show} autoCapitalize="none" maxLength={100} onSubmitEditing={save} last />
          </Group>
          <Pressable onPress={() => setShow(!show)} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, marginHorizontal: 6 }}>
            <FontAwesome6 name={show ? 'eye-slash' : 'eye'} size={12} color={c.link} />
            <Txt small style={{ color: c.link }}>{show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}</Txt>
          </Pressable>
        </FadeIn>
        {!!error && <Txt small style={{ color: '#e87979', marginTop: 12, marginHorizontal: 6 }}>{error}</Txt>}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}