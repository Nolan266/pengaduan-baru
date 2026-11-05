// Detail aduan (timeline, batalkan) dan form edit aduan.
import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { CATEGORIES } from '../constants';
import { stamp } from '../format';
import { MediaGallery } from '../media';
import { useTheme, useRC } from '../theme';
import { Txt, Card, Btn, Badge, Progress, Field, PageTop, ConfirmModal } from '../ui';

export function ReportDetailPage({ r, events, onBack, onEdit, onCancel }) {
  const { c } = useTheme();
  const rc = useRC();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  // data.events berurutan terbaru-dulu; timeline dibaca dari yang paling awal
  const steps = events.filter((e) => e.report === r.id).slice().reverse();
  const rows = [['Kategori', r.category], ['Instansi', r.agency || '-'], ['Dibuat', stamp(r.createdAt)], ['Lokasi', r.location], ['Uraian', r.description]];

  const doCancel = async () => {
    setBusy(true); setErr('');
    try { await onCancel(); }
    catch (e) { setErr(e.message || 'Gagal membatalkan aduan.'); setBusy(false); setConfirm(false); }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} refreshControl={rc}>
      <PageTop title="Detail Aduan" right={<Btn icon="chevron-left" title="Kembali" onPress={onBack} />} />

      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Txt small secondary>Nomor tiket (tekan lama untuk menyalin)</Txt>
          <Badge status={r.status} />
        </View>
        <Text selectable style={{ fontSize: 17, fontWeight: '800', color: c.title, letterSpacing: 0.5, marginTop: 4 }}>{r.id}</Text>
        <Txt bold style={{ fontSize: 15, marginTop: 10 }}>{r.title}</Txt>
        <Progress value={r.progress} />
        <Txt small secondary>Progress {r.progress}%</Txt>
      </Card>

      <Card>
        {rows.map(([k, v]) => (
          <View key={k} style={{ flexDirection: 'row', marginBottom: 8 }}>
            <Txt small secondary style={{ width: 76 }}>{k}</Txt>
            <Txt small style={{ flex: 1 }}>{v}</Txt>
          </View>
        ))}
      </Card>

      {r.media.length ? (
        <Card>
          <Txt bold>Foto & video</Txt>
          <MediaGallery items={r.media} />
          <Txt small secondary>Ketuk foto untuk memperbesar.</Txt>
        </Card>
      ) : null}

      <Card>
        <Txt bold style={{ marginBottom: 12 }}>Perkembangan aduan</Txt>
        {steps.length ? steps.map((e, i) => {
          const last = i === steps.length - 1;
          return (
            <View key={e.id} style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ alignItems: 'center', width: 24 }}>
                <View style={{ width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: last ? '#2563eb' : '#dbeafe' }}>
                  <FontAwesome6 name={e.icon} size={11} color={last ? '#fff' : '#2563eb'} />
                </View>
                {!last && <View style={{ width: 2, flex: 1, backgroundColor: c.edge, marginVertical: 2 }} />}
              </View>
              <View style={{ flex: 1, paddingBottom: last ? 0 : 16 }}>
                <Txt bold>{e.status}</Txt>
                <Txt style={{ marginTop: 2 }}>{e.body}</Txt>
                <Txt small secondary style={{ marginTop: 2 }}>{stamp(e.time)}</Txt>
              </View>
            </View>
          );
        }) : <Txt small secondary>Belum ada riwayat.</Txt>}
      </Card>

      {r.status === 'Dibuat' ? (
        <Card>
          <Txt bold>Perbaiki atau batalkan</Txt>
          <Txt small secondary style={{ marginVertical: 6 }}>Aduan masih bisa diubah atau dibatalkan selama belum diproses petugas.</Txt>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Btn style={{ flex: 1 }} icon="pen" title="Edit aduan" onPress={onEdit} />
            <Btn style={{ flex: 1 }} danger icon="ban" title="Batalkan aduan" onPress={() => setConfirm(true)} />
          </View>
          {!!err && <Txt small style={{ color: '#e87979', marginTop: 8 }}>{err}</Txt>}
        </Card>
      ) : (
        <Card><Txt small secondary>Aduan sudah diproses petugas, jadi tidak dapat diubah atau dibatalkan lagi.</Txt></Card>
      )}

      <ConfirmModal visible={confirm} busy={busy} title="Batalkan aduan ini?"
        message="Aduan akan dibatalkan dan tidak diproses petugas. Tindakan ini tidak bisa diurungkan."
        confirmText="Ya, batalkan" onConfirm={doCancel} onCancel={() => setConfirm(false)} />
    </ScrollView>
  );
}

export function EditReportPage({ r, kategori, onCancel, onSave }) {
  const [title, setTitle] = useState(r.title);
  const [category, setCategory] = useState(r.category);
  const [description, setDescription] = useState(r.description === '-' ? '' : r.description);
  const [location, setLocation] = useState(r.location === '-' ? '' : r.location);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (busy) return;
    const t = title.trim(), d = description.trim(), l = location.trim();
    if (!t || !d || !l) { setError('Lengkapi judul, uraian, dan lokasi.'); return; }
    const kat = kategori.find((k) => k.label_kategori === category);
    if (!kat) { setError('Daftar kategori belum termuat. Pastikan server menyala, lalu coba lagi.'); return; }
    setBusy(true); setError('');
    try { await onSave({ id_kategori: kat.id_kategori, topik: t, deskripsi: d, lokasi_kejadian: l }); }
    catch (e) { setError(e.message || 'Gagal menyimpan perubahan.'); setBusy(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <PageTop title="Edit Aduan" right={<Btn title="Batal" onPress={onCancel} />} />
        <Txt small secondary style={{ marginBottom: 12 }}>#{r.id} · Foto dan video tidak dapat diubah.</Txt>
        <Card>
          <Field label="Judul aduan" value={title} onChangeText={setTitle} maxLength={120} />
          <Txt small bold style={{ fontSize: 12, marginTop: 8, marginBottom: 6 }}>Kategori</Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {CATEGORIES.map((k) => <Btn key={k} title={k} active={k === category} onPress={() => setCategory(k)} />)}
          </View>
          <Field label="Uraian" value={description} onChangeText={setDescription} maxLength={2000} multiline />
          <Field label="Lokasi kejadian" value={location} onChangeText={setLocation} maxLength={200} />
          {!!error && <Txt small style={{ color: '#e87979', marginTop: 8 }}>{error}</Txt>}
          <Btn primary title={busy ? 'Menyimpan…' : 'Simpan Perubahan'} onPress={save} disabled={busy} style={{ marginTop: 12 }} />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
