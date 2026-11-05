// Layar Profil, edit profil, dan ganti kata sandi.
import React, { useState } from 'react';
import { View, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { maskNik } from '../format';
import { useTheme, useRC } from '../theme';
import { Txt, Card, Btn, Badge, Avatar, Field, PageTop } from '../ui';

function Accordion({ title, children }) {
  const { c } = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <View style={{ borderTopWidth: 1, borderTopColor: c.edge, paddingVertical: 10 }}>
      <Pressable onPress={() => setOpen(!open)} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Txt bold>{title}</Txt>
        <FontAwesome6 name={open ? 'chevron-up' : 'chevron-down'} size={11} color={c.secondary} />
      </Pressable>
      {open && <Txt small style={{ marginTop: 6 }}>{children}</Txt>}
    </View>
  );
}

export function ProfilePage({ data, onEdit, onChangePw, onLogout, onPhoto, onRemovePhoto }) {
  const { c } = useTheme();
  const rc = useRC();
  const [showPhoto, setShowPhoto] = useState(false);
  const p = data.profile;
  const rows = [['Nama', p.name], ['Username', p.username], ['Alamat', p.address || '-'], ['NIK', maskNik(p.nik)], ['Jumlah aduan', String(data.reports.length)]];
  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }} refreshControl={rc}>
      <PageTop title="Profil Pengadu" right={<Btn title="Edit" onPress={onEdit} />} />
      <Card>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <Pressable onPress={() => setShowPhoto(!showPhoto)}><Avatar size={50} uri={p.foto} /></Pressable>
          <View style={{ flex: 1, gap: 4 }}>
            <Txt bold style={{ fontSize: 15 }}>{p.name}</Txt>
            <Txt small secondary>Akun warga · @{p.username}</Txt>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Badge status="Selesai" />
              <Pressable onPress={() => setShowPhoto(!showPhoto)} hitSlop={8}>
                <Txt small bold style={{ color: c.link }}>{showPhoto ? 'Tutup' : 'Ganti foto'}</Txt>
              </Pressable>
            </View>
          </View>
        </View>
        {showPhoto && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
            <Btn icon="camera" title="Ambil foto" onPress={() => { setShowPhoto(false); onPhoto('camera'); }} />
            <Btn icon="image" title="Pilih dari galeri" onPress={() => { setShowPhoto(false); onPhoto('library'); }} />
            {p.foto ? <Btn icon="trash" title="Hapus foto" onPress={() => { setShowPhoto(false); onRemovePhoto(); }} /> : null}
          </View>
        )}
      </Card>
      <Card>
        <Txt bold style={{ marginBottom: 8 }}>Data pengadu</Txt>
        {rows.map(([k, v]) => (
          <View key={k} style={{ flexDirection: 'row', marginBottom: 8 }}>
            <Txt small secondary style={{ width: 90 }}>{k}</Txt>
            <Txt small style={{ flex: 1 }}>{v}</Txt>
          </View>
        ))}
      </Card>
      <Card>
        <Txt bold style={{ marginBottom: 4 }}>Akun & aplikasi</Txt>
        <Accordion title="Keamanan akun">Nomor identitas ditampilkan tersamarkan. Kata sandi disimpan dalam bentuk terenkripsi (hash) di server. Anda dapat menggantinya lewat tombol Ganti kata sandi.</Accordion>
        <Accordion title="Privasi & penyimpanan">Profil dan aduan Anda tersimpan di server aduan warga, sehingga tetap ada saat Anda masuk dari perangkat lain.</Accordion>
        <Accordion title="Bantuan penggunaan">Buka Aduan → Tambah untuk membuat aduan. Pantau tahapan Dibuat, Diproses, dan Selesai di tab Notif. Pilih lokasi pada CCTV untuk memutar video simulasi.</Accordion>
        <Accordion title="Tentang aplikasi">Aduan Masyarakat · Sarana pengaduan fasilitas dan layanan publik. Berita dan CCTV pada beranda merupakan contoh.</Accordion>
        <Btn title="Ganti kata sandi" icon="key" onPress={onChangePw} style={{ marginTop: 10 }} />
        <Btn title="Keluar" icon="right-from-bracket" onPress={onLogout} style={{ marginTop: 8 }} />
      </Card>
    </ScrollView>
  );
}

export function EditProfilePage({ profile, onCancel, onSave }) {
  const [f, setF] = useState({ nama: profile.name, alamat: profile.address });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (busy) return;
    if (!f.nama.trim()) { setError('Nama wajib diisi.'); return; }
    setBusy(true); setError('');
    try { await onSave({ nama: f.nama.trim(), alamat: f.alamat.trim() }); }
    catch (e) { setError(e.message || 'Gagal menyimpan.'); setBusy(false); }
  };
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <PageTop title="Edit Profil" right={<Btn title="Batal" onPress={onCancel} />} />
        <Card>
          <Field label="Nama" value={f.nama} onChangeText={(v) => setF((o) => ({ ...o, nama: v }))} maxLength={120} />
          <Field label="Alamat" value={f.alamat} onChangeText={(v) => setF((o) => ({ ...o, alamat: v }))} maxLength={250} />
          <Txt small secondary>NIK dan username tidak dapat diubah.</Txt>
          {!!error && <Txt small style={{ color: '#e87979', marginTop: 8 }}>{error}</Txt>}
          <Btn primary title={busy ? 'Menyimpan…' : 'Simpan Profil'} onPress={save} disabled={busy} style={{ marginTop: 12 }} />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

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
        <PageTop title="Ganti Kata Sandi" right={<Btn title="Batal" onPress={onCancel} />} />
        <Card>
          <Field label="Kata sandi lama" value={lama} onChangeText={setLama} secureTextEntry={!show} autoCapitalize="none" maxLength={100} />
          <Field label="Kata sandi baru" value={baru} onChangeText={setBaru} secureTextEntry={!show} autoCapitalize="none" maxLength={100} placeholder="Minimal 6 karakter" />
          <Field label="Ulangi kata sandi baru" value={ulang} onChangeText={setUlang} secureTextEntry={!show} autoCapitalize="none" maxLength={100} onSubmitEditing={save} />
          <Pressable onPress={() => setShow(!show)} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <FontAwesome6 name={show ? 'eye-slash' : 'eye'} size={12} color={c.link} />
            <Txt small style={{ color: c.link }}>{show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}</Txt>
          </Pressable>
          {!!error && <Txt small style={{ color: '#e87979', marginTop: 10 }}>{error}</Txt>}
          <Btn primary title={busy ? 'Menyimpan…' : 'Simpan Kata Sandi'} onPress={save} disabled={busy} style={{ marginTop: 12 }} />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
