// Form tambah aduan (1–5 foto + 1 video).
import React, { useState, useEffect } from 'react';
import { View, ScrollView, Pressable, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { CATEGORIES } from '../constants';
import { loadCache, saveCache, clearCache } from '../cache';
import { SavedMedia } from '../media';
import { useOnline } from '../net';
import { MAX_FOTO, MAX_FOTO_MB, MAX_VIDEO_MB, MAX_VIDEO_DETIK, MB, shrinkPhoto } from '../photos';
import { useTheme } from '../theme';
import { Txt, Card, Btn, Field, PageTop, Dropdown } from '../ui';

const CATEGORY_OPTIONS = CATEGORIES.map((k) => ({ value: k, label: k }));

export function NewReportPage({ initialCategory, kategori, draftKey, onCancel, onSubmit }) {
  const { c } = useTheme();
  const online = useOnline();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(initialCategory || CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [photos, setPhotos] = useState([]);
  const [video, setVideo] = useState(null);
  const [mediaBusy, setMediaBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [geoMsg, setGeoMsg] = useState('Koordinat (opsional) akan ditambahkan ke keterangan lokasi.');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  // Pulihkan draft teks yang tersimpan (foto dan video tidak ikut disimpan)
  useEffect(() => {
    let alive = true;
    loadCache(draftKey).then((d) => {
      if (!alive) return;
      if (d) {
        setTitle(d.title || ''); setDescription(d.description || ''); setLocation(d.location || '');
        setLat(d.lat || ''); setLng(d.lng || '');
        if (!initialCategory && CATEGORIES.includes(d.category)) setCategory(d.category);
        if (d.title || d.description || d.location) setMsg('Draft sebelumnya dipulihkan.');
      }
      setReady(true);
    });
    return () => { alive = false; };
  }, [draftKey, initialCategory]);

  // Simpan draft otomatis setiap ada perubahan
  useEffect(() => {
    if (!ready || !draftKey) return;
    saveCache(draftKey, { title, category, description, location, lat, lng });
  }, [ready, draftKey, title, category, description, location, lat, lng]);

  const askPermission = async (source) => {
    const perm = source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) setMsg('Izin kamera / galeri ditolak. Aktifkan lewat pengaturan HP.');
    return perm.granted;
  };

  const addPhotos = async (source) => {
    const sisa = MAX_FOTO - photos.length;
    if (sisa <= 0) { setMsg(`Maksimal ${MAX_FOTO} foto per aduan.`); return; }
    try {
      if (!(await askPermission(source))) return;
      const opts = { mediaTypes: ['images'], quality: 1, ...(source === 'library' ? { allowsMultipleSelection: sisa > 1, selectionLimit: sisa } : {}) };
      const res = source === 'camera' ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
      if (res.canceled) return;
      setMediaBusy(true); setMsg('Memproses foto…');
      const added = []; let gagal = 0;
      for (const a of res.assets.slice(0, sisa)) {
        try { const out = await shrinkPhoto(a); added.push({ uri: out.uri, name: `foto-${Date.now()}-${added.length}.jpg` }); }
        catch { gagal += 1; }
      }
      setPhotos((p) => [...p, ...added].slice(0, MAX_FOTO));
      setMsg(gagal ? `${gagal} foto gagal diproses karena terlalu besar (maks ${MAX_FOTO_MB} MB).` : `${added.length} foto ditambahkan.`);
    } catch { setMsg('Foto gagal diproses.'); }
    finally { setMediaBusy(false); }
  };

  const addVideo = async (source) => {
    try {
      if (!(await askPermission(source))) return;
      const opts = { mediaTypes: ['videos'], videoMaxDuration: MAX_VIDEO_DETIK, quality: 1 };
      const res = source === 'camera' ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
      if (res.canceled) return;
      const a = res.assets[0];
      if (a.fileSize && a.fileSize > MAX_VIDEO_MB * MB) {
        setMsg(`Video maksimal ${MAX_VIDEO_MB} MB (sekitar ${MAX_VIDEO_DETIK} detik). Pilih video yang lebih pendek.`); return;
      }
      setVideo({ uri: a.uri, kind: 'video', name: a.fileName || `video-${Date.now()}.mp4`, mime: a.mimeType || 'video/mp4' });
      setMsg('Video siap dilampirkan.');
    } catch { setMsg('Video gagal diproses.'); }
  };

  const useMyLocation = async () => {
    setGeoMsg('Mencari lokasi Anda…');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setGeoMsg('Lokasi tidak diperoleh. Izinkan akses lokasi atau isi koordinat manual.'); return; }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLat(pos.coords.latitude.toFixed(6)); setLng(pos.coords.longitude.toFixed(6));
      setGeoMsg(`Lokasi perangkat diperoleh (akurasi ±${Math.round(pos.coords.accuracy || 0)} m). Sesuaikan bila kejadian berada di lokasi lain.`);
    } catch { setGeoMsg('Lokasi tidak diperoleh. Isi koordinat manual.'); }
  };

  const submit = async () => {
    if (busy || mediaBusy) return;
    if (!online) { setError('Anda offline. Draft tersimpan otomatis, kirim lagi setelah tersambung ke internet.'); return; }
    const t = title.trim(), d = description.trim(), l = location.trim();
    if (!t || !d || !l) { setError('Lengkapi semua kolom aduan.'); return; }
    let lokasi = l;
    if (lat.trim() || lng.trim()) {
      const a = Number(lat), b = Number(lng);
      if (!lat.trim() || !lng.trim() || !Number.isFinite(a) || !Number.isFinite(b) || Math.abs(a) > 90 || Math.abs(b) > 180) {
        setError('Isi latitude dan longitude yang valid.'); return;
      }
      lokasi = `${l} (${a.toFixed(6)}, ${b.toFixed(6)})`;
    }
    const kat = kategori.find((k) => k.label_kategori === category);
    if (!kat) {
      setError(kategori.length
        ? `Kategori "${category}" belum ada di database server.`
        : 'Daftar kategori belum termuat. Pastikan server menyala, tunggu sebentar, lalu coba lagi.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      await onSubmit({ id_kategori: kat.id_kategori, topik: t, deskripsi: d, lokasi_kejadian: lokasi, photos, video });
      clearCache(draftKey); // terkirim -> draft dibuang
    } catch (e) {
      setError(e.message || 'Aduan gagal dikirim.');
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <PageTop title="Tambah Aduan" right={<Btn title="Batal" onPress={onCancel} />} />
        <Txt small secondary style={{ marginBottom: 12 }}>Aduan baru dimulai dengan status Dibuat.</Txt>
        <Card>
          <Field label="Judul aduan" value={title} onChangeText={setTitle} maxLength={120} placeholder="Contoh: Lampu jalan padam" />
          <Dropdown field label="Kategori" value={category} options={CATEGORY_OPTIONS} onChange={setCategory} />
          <Field label="Uraian" value={description} onChangeText={setDescription} maxLength={2000} multiline placeholder="Jelaskan kejadian dan dampaknya" />
          <Field label="Lokasi kejadian" value={location} onChangeText={setLocation} maxLength={200} placeholder="Alamat atau patokan lokasi" />

          <Txt small bold style={{ fontSize: 12, marginTop: 8 }}>Foto ({photos.length}/{MAX_FOTO})</Txt>
          <Txt secondary style={{ fontSize: 10, marginTop: 2 }}>Maksimal {MAX_FOTO} foto, {MAX_FOTO_MB} MB per foto. Foto besar dikecilkan otomatis.</Txt>
          <View style={{ flexDirection: 'row', gap: 7, marginVertical: 8 }}>
            <Btn style={{ flex: 1 }} icon="camera" title="Ambil Foto" onPress={() => addPhotos('camera')} disabled={mediaBusy || photos.length >= MAX_FOTO} />
            <Btn style={{ flex: 1 }} icon="image" title="Pilih Foto" onPress={() => addPhotos('library')} disabled={mediaBusy || photos.length >= MAX_FOTO} />
          </View>
          {photos.length ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
              {photos.map((p, i) => (
                <View key={p.uri} style={{ width: 88, height: 88, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: c.edge }}>
                  <Image source={{ uri: p.uri }} style={{ width: '100%', height: '100%', backgroundColor: '#020617' }} resizeMode="cover" />
                  <Pressable onPress={() => setPhotos((x) => x.filter((_, j) => j !== i))} hitSlop={6}
                    style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: '#000000aa', alignItems: 'center', justifyContent: 'center' }}>
                    <FontAwesome6 name="xmark" size={11} color="#fff" />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : (
            <View style={{ borderWidth: 1, borderStyle: 'dashed', borderColor: '#60a5fa', borderRadius: 12, alignItems: 'center', padding: 18, backgroundColor: c.screen }}>
              <FontAwesome6 name="images" size={26} color="#60a5fa" />
              <Txt small secondary style={{ marginTop: 6 }}>Belum ada foto</Txt>
            </View>
          )}

          <Txt small bold style={{ fontSize: 12, marginTop: 14 }}>Video (opsional)</Txt>
          <Txt secondary style={{ fontSize: 10, marginTop: 2 }}>Maksimal 1 video, {MAX_VIDEO_MB} MB (sekitar {MAX_VIDEO_DETIK} detik).</Txt>
          <View style={{ flexDirection: 'row', gap: 7, marginVertical: 8 }}>
            <Btn style={{ flex: 1 }} icon="video" title="Ambil Video" onPress={() => addVideo('camera')} disabled={mediaBusy} />
            <Btn style={{ flex: 1 }} icon="film" title="Pilih Video" onPress={() => addVideo('library')} disabled={mediaBusy} />
          </View>
          {video ? (
            <>
              <SavedMedia media={video} caption={video.name} />
              <Btn title="Hapus video" onPress={() => setVideo(null)} style={{ alignSelf: 'flex-start' }} />
            </>
          ) : null}
          {!!msg && <Txt small style={{ color: '#e87979', marginTop: 8 }}>{msg}</Txt>}

          <Txt small bold style={{ fontSize: 12, marginTop: 14, marginBottom: 6 }}>Titik lokasi kejadian</Txt>
          <Btn icon="location-crosshairs" title="Gunakan lokasi saya" onPress={useMyLocation} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}><Field label="Latitude" value={lat} onChangeText={setLat} keyboardType="numbers-and-punctuation" placeholder="-7.250445" /></View>
            <View style={{ flex: 1 }}><Field label="Longitude" value={lng} onChangeText={setLng} keyboardType="numbers-and-punctuation" placeholder="112.768845" /></View>
          </View>
          <Txt secondary style={{ fontSize: 10 }}>{geoMsg}</Txt>

          {!!error && <Txt small style={{ color: '#e87979', marginTop: 10 }}>{error}</Txt>}
          <Btn primary title={busy ? 'Mengirim…' : mediaBusy ? 'Memproses foto…' : 'Kirim Aduan'} onPress={submit} disabled={busy || mediaBusy} style={{ marginTop: 14 }} />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}