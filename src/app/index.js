import React, { useState, useEffect, useMemo, useRef, useCallback, createContext, useContext } from 'react';
import {
  View, Text, ScrollView, FlatList, Pressable, TextInput, Image, Modal,
  StyleSheet, useColorScheme, useWindowDimensions, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useVideoPlayer, VideoView } from 'expo-video';
import { authFetch, API_URL } from '../auth';
import { useAuth } from '../AuthGate';

/* ───────────── Data & konstanta ───────────── */

const THEME_KEY = 'aduan-mobile-theme';
const CATEGORIES = ['Infrastruktur', 'Parkir Liar', 'Pendidikan', 'Kebersihan'];
const CATEGORY_UI = [
  { name: 'Infrastruktur', icon: 'road', color: '#2563eb' },
  { name: 'Parkir Liar', icon: 'car', color: '#4f46e5' },
  { name: 'Pendidikan', icon: 'school', color: '#059669' },
  { name: 'Kebersihan', icon: 'trash', color: '#d97706' },
];
const SURVEI = [
  { emoji: '😞', label: 'Tidak puas', skor: 1 },
  { emoji: '😐', label: 'Biasa saja', skor: 3 },
  { emoji: '😊', label: 'Puas', skor: 4 },
  { emoji: '🤩', label: 'Sangat puas', skor: 5 },
];

const CAMERAS = [
  { id: 'CAM-01', name: 'Pasar Sentral', location: 'Area parkir pasar', online: true, condition: 'Padat', agency: 'Dishub' },
  { id: 'CAM-02', name: 'SDN 03 Melati', location: 'Gerbang sekolah', online: true, condition: 'Lancar', agency: 'Disdik' },
  { id: 'CAM-03', name: 'Taman Kota', location: 'Area fasilitas publik', online: false, condition: 'Koneksi terputus', agency: 'Diskominfo' },
  { id: 'CAM-04', name: 'Simpang Sudirman', location: 'Persimpangan utama', online: true, condition: 'Lancar', agency: 'Dishub' },
];
const VIDEOS = {
  'CAM-01': require('../../assets/cam-01.mp4'), 'CAM-02': require('../../assets/cam-02.mp4'),
  'CAM-03': require('../../assets/cam-03.mp4'), 'CAM-04': require('../../assets/cam-04.mp4'),
};
const POSTERS = {
  'CAM-01': require('../../assets/cam-01-poster.jpg'), 'CAM-02': require('../../assets/cam-02-poster.jpg'),
  'CAM-03': require('../../assets/cam-03-poster.jpg'), 'CAM-04': require('../../assets/cam-04-poster.jpg'),
};
const AVATAR = require('../../assets/avatar.jpg');

const NEWS = [
  { colors: ['#1e40af', '#2563eb'], icons: ['landmark', 'file-circle-check'], topic: 'PEMERINTAHAN · PELAYANAN',
    title: 'Layanan Administrasi Warga Lebih Mudah',
    text: 'Contoh program layanan terpadu: pengurusan dokumen, informasi persyaratan, dan konsultasi warga dalam satu tempat.',
    more: 'Warga dapat menyiapkan dokumen identitas dan mengecek persyaratan sebelum datang ke kantor pelayanan. Contoh program ini mengutamakan antrean tertib dan akses bagi lansia serta penyandang disabilitas.' },
  { colors: ['#065f46', '#0f766e'], icons: ['school', 'road'], topic: 'FASILITAS PUBLIK · PENDIDIKAN',
    title: 'Revitalisasi Sekolah & Akses Jalan',
    text: 'Contoh penataan ruang kelas, trotoar, dan zona parkir untuk membuat lingkungan sekolah lebih nyaman dan aman.',
    more: 'Perbaikan dilakukan bertahap dengan perhatian pada keselamatan siswa, penerangan jalan, serta jalur pejalan kaki. Warga dapat menyampaikan kerusakan fasilitas melalui kategori Pendidikan atau Infrastruktur.' },
  { colors: ['#5b21b6', '#4338ca'], icons: ['tree', 'recycle'], topic: 'LINGKUNGAN · RUANG PUBLIK',
    title: 'Taman Bersih, Ruang Publik Nyaman',
    text: 'Contoh program perawatan taman, pengangkutan sampah, dan penambahan tempat sampah terpilah di ruang publik.',
    more: 'Partisipasi warga membantu menjaga fasilitas bermain, bangku taman, dan saluran air. Gunakan kategori Kebersihan untuk menyampaikan sampah menumpuk, serta sertakan uraian dan lokasi yang jelas.' },
  { colors: ['#155e75', '#0369a1'], icons: ['id-card', 'users'], topic: 'PEMERINTAHAN · KEPENDUDUKAN',
    title: 'Layanan Kependudukan Jemput Bola',
    text: 'Contoh program pelayanan keliling untuk membantu warga mengurus dokumen kependudukan lebih dekat dengan tempat tinggal.',
    more: 'Pelayanan keliling dapat mencakup konsultasi persyaratan KTP, kartu keluarga, dan akta kelahiran. Jadwal dan persyaratan aktual perlu mengikuti pengumuman instansi setempat.' },
  { colors: ['#92400e', '#9a3412'], icons: ['chart-column', 'comments'], topic: 'PEMERINTAHAN · PARTISIPASI WARGA',
    title: 'Transparansi Pembangunan & Aspirasi Warga',
    text: 'Contoh penyampaian rencana pembangunan, penggunaan anggaran, dan capaian program melalui kanal informasi publik.',
    more: 'Warga dapat menyampaikan kebutuhan lingkungan melalui musyawarah perencanaan pembangunan atau kanal pengaduan. Seluruh isi slide ini merupakan contoh, bukan pengumuman resmi pemerintah tertentu.' },
];

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const pad = (n) => String(n).padStart(2, '0');
const stamp = (v) => {
  const d = new Date(new Date(v).getTime() + 7 * 3600 * 1000); // WIB = UTC+7
  return `${d.getUTCDate()} ${BULAN[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${pad(d.getUTCHours())}.${pad(d.getUTCMinutes())} WIB`;
};

/* ───────────── Pemetaan data server → tampilan ───────────── */

// SQLite menyimpan waktu UTC "YYYY-MM-DD HH:MM:SS"
const toIso = (s) => new Date(String(s).replace(' ', 'T') + 'Z').toISOString();
const STATUS_UI = { Verifikasi: 'Dibuat', Diproses: 'Diproses', Selesai: 'Selesai' };
const EVENT_ICON = { Dibuat: 'file-circle-plus', Diproses: 'gears', Selesai: 'circle-check' };
const EVENT_BODY = { Dibuat: 'Aduan berhasil dibuat dan menunggu verifikasi.', Diproses: 'Aduan sedang ditangani.', Selesai: 'Penanganan selesai. Terima kasih atas partisipasi Anda.' };

const fromPelapor = (p) => ({ name: p.nama, username: p.username, address: p.alamat || '', nik: p.nik });
const maskNik = (n) => { const s = String(n || ''); return s.length > 4 ? '•••• •••• •••• ' + s.slice(-4) : s; };

const mapReport = (r) => {
  const m = (r.media || [])[0];
  return {
    id: r.id_aduan, title: r.topik, category: r.label_kategori, description: r.deskripsi || '-',
    location: r.lokasi_kejadian || '-', createdAt: toIso(r.tanggal_aduan),
    status: STATUS_UI[r.status] || r.status, progress: r.progres || 0, agency: r.dinas,
    ...(m ? { media: { uri: API_URL + m.url_file, kind: m.tipe_media === 'video' ? 'video' : 'photo' } } : {}),
  };
};
const mapEvent = (p) => {
  const status = STATUS_UI[p.status_tahapan] || p.status_tahapan;
  return {
    id: `P-${p.id_progres}`, report: p.id_aduan, title: p.topik, status,
    icon: EVENT_ICON[status] || 'bell', body: p.catatan_petugas || EVENT_BODY[status] || '', time: toIso(p.updated_at),
  };
};

/* ───────────── Tema ───────────── */

const LIGHT = { surface: '#ffffff', screen: '#f8fafc', ink: '#1e293b', secondary: '#64748b', edge: '#e2e8f0',
  title: '#1e3a8a', link: '#2563eb', indigoBg: '#eef2ff', indigoEdge: '#c7d2fe', indigoTitle: '#312e81', indigoText: '#4f46e5' };
const DARK = { surface: '#1e293b', screen: '#0f172a', ink: '#e2e8f0', secondary: '#a9b8cd', edge: '#334155',
  title: '#bfdbfe', link: '#93c5fd', indigoBg: '#222745', indigoEdge: '#3f4568', indigoTitle: '#bfdbfe', indigoText: '#93c5fd' };
const ThemeCtx = createContext({ c: LIGHT, dark: false });
const useTheme = () => useContext(ThemeCtx);

/* ───────────── Komponen kecil ───────────── */

function Txt({ style, small, bold, secondary, children, ...rest }) {
  const { c } = useTheme();
  return (
    <Text {...rest} style={[{ color: secondary ? c.secondary : c.ink, fontSize: small ? 11 : 13, lineHeight: small ? 16 : 19 },
      bold && { fontWeight: '700' }, style]}>{children}</Text>
  );
}

function Card({ style, children }) {
  const { c } = useTheme();
  return <View style={[{ backgroundColor: c.surface, borderColor: c.edge, borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 10 }, style]}>{children}</View>;
}

function Btn({ title, onPress, primary, icon, disabled, active, style }) {
  const { c } = useTheme();
  const hi = primary || active;
  return (
    <Pressable onPress={onPress} disabled={disabled}
      style={({ pressed }) => [{ paddingVertical: 9, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1,
        backgroundColor: hi ? '#2563eb' : c.surface, borderColor: hi ? '#2563eb' : c.edge,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        opacity: disabled ? 0.5 : pressed ? 0.8 : 1 }, style]}>
      {icon ? <FontAwesome6 name={icon} size={12} color={hi ? '#fff' : c.ink} /> : null}
      <Text style={{ color: hi ? '#fff' : c.ink, fontSize: 12, fontWeight: '700' }}>{title}</Text>
    </Pressable>
  );
}

function Badge({ status }) {
  const m = status === 'Selesai' ? ['#d1fae5', '#065f46'] : status === 'Dibuat' ? ['#fef3c7', '#92400e'] : ['#e0e7ff', '#3730a3'];
  return (
    <View style={{ backgroundColor: m[0], borderRadius: 6, paddingVertical: 3, paddingHorizontal: 8 }}>
      <Text style={{ color: m[1], fontSize: 10, fontWeight: '700' }}>{status}</Text>
    </View>
  );
}

function Progress({ value }) {
  const { c } = useTheme();
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <View style={{ height: 5, borderRadius: 5, backgroundColor: c.edge, marginVertical: 9, overflow: 'hidden' }}>
      <View style={{ width: `${v}%`, height: '100%', backgroundColor: '#3b82f6', borderRadius: 5 }} />
    </View>
  );
}

function Avatar({ size }) {
  const { c } = useTheme();
  return (
    <View style={{ width: size, height: size }}>
      <Image source={AVATAR} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: c.screen }} />
      <View style={{ position: 'absolute', right: 0, bottom: 1, width: 10, height: 10, borderRadius: 5,
        backgroundColor: '#10b981', borderWidth: 2, borderColor: c.surface }} />
    </View>
  );
}

function Field({ label, style, multiline, ...rest }) {
  const { c } = useTheme();
  return (
    <View style={{ marginVertical: 8 }}>
      <Txt small bold style={{ marginBottom: 5, fontSize: 12 }}>{label}</Txt>
      <TextInput {...rest} multiline={multiline} placeholderTextColor={c.secondary}
        style={[{ borderWidth: 1, borderColor: c.edge, borderRadius: 10, padding: 10, backgroundColor: c.screen,
          color: c.ink, fontSize: 13 }, multiline && { minHeight: 90, textAlignVertical: 'top' }, style]} />
    </View>
  );
}

function PageTop({ title, right }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <Txt style={{ fontSize: 20, fontWeight: '800' }}>{title}</Txt>
      {right}
    </View>
  );
}

/* ───────────── Video ───────────── */

function CctvVideo({ cam, height }) {
  const [started, setStarted] = useState(false);
  const player = useVideoPlayer(VIDEOS[cam.id], (p) => { p.loop = true; p.muted = true; });
  return (
    <View style={{ height, borderRadius: 10, overflow: 'hidden', backgroundColor: '#020617' }}>
      <VideoView player={player} style={{ width: '100%', height: '100%' }} contentFit="contain" nativeControls={started} />
      {!started && (
        <Pressable onPress={() => { setStarted(true); player.play(); }}
          style={StyleSheet.absoluteFill}>
          <Image source={POSTERS[cam.id]} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#00000040' }]}>
            <FontAwesome6 name="circle-play" size={40} color="#fff" />
          </View>
        </Pressable>
      )}
    </View>
  );
}

function SavedMedia({ media, caption }) {
  const { c } = useTheme();
  const player = useVideoPlayer(media.kind === 'video' ? media.uri : null, () => {});
  return (
    <View style={{ marginVertical: 10, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: c.edge }}>
      {media.kind === 'video'
        ? <VideoView player={player} style={{ width: '100%', height: 190, backgroundColor: '#020617' }} nativeControls contentFit="contain" />
        : <Image source={{ uri: media.uri }} style={{ width: '100%', height: 190, backgroundColor: '#020617' }} resizeMode="contain" />}
      <Txt small secondary style={{ padding: 8, backgroundColor: c.screen }}>{caption}</Txt>
    </View>
  );
}

/* ───────────── Beranda ───────────── */

function NewsCarousel() {
  const { width } = useWindowDimensions();
  const W = width - 32;
  const ref = useRef(null);
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState({});
  const go = (i) => {
    const n = (i + NEWS.length) % NEWS.length;
    ref.current?.scrollToIndex({ index: n, animated: true });
    setIndex(n);
  };
  return (
    <View style={{ borderRadius: 17, overflow: 'hidden', marginBottom: 12 }}>
      <FlatList ref={ref} data={NEWS} horizontal pagingEnabled showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)} getItemLayout={(_, i) => ({ length: W, offset: W * i, index: i })}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / W))}
        renderItem={({ item, index: i }) => (
          <LinearGradient colors={item.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ width: W, padding: 14, paddingHorizontal: 34, minHeight: 170 }}>
            <View style={{ position: 'absolute', right: 16, top: 44, flexDirection: 'row', gap: 6, opacity: 0.15 }}>
              {item.icons.map((n) => <FontAwesome6 key={n} name={n} size={30} color="#fff" />)}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginLeft: -20, marginRight: -20 }}>
              <View style={{ backgroundColor: '#fde68a', borderRadius: 5, paddingVertical: 2, paddingHorizontal: 7 }}>
                <Text style={{ color: '#422006', fontSize: 8, fontWeight: '800' }}>INFO RESMI</Text>
              </View>
              <Text style={{ color: '#fff', opacity: 0.85, fontSize: 8, letterSpacing: 0.6 }}>CONTOH BERITA</Text>
            </View>
            <Text style={{ color: '#fff', opacity: 0.85, fontSize: 8, fontWeight: '600', letterSpacing: 0.7, marginTop: 12, marginBottom: 5 }}>{item.topic}</Text>
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800', lineHeight: 20, maxWidth: '88%', marginBottom: 6 }}>{item.title}</Text>
            <Text style={{ color: '#f1f5f9', fontSize: 11, lineHeight: 17 }}>{item.text}</Text>
            <Pressable onPress={() => setOpen((o) => ({ ...o, [i]: !o[i] }))} style={{ marginTop: 8 }}>
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{open[i] ? '▾ Tutup' : '▸ Baca selengkapnya'}</Text>
            </Pressable>
            {open[i] && <Text style={{ color: '#f1f5f9', fontSize: 10, lineHeight: 16, marginTop: 6 }}>{item.more}</Text>}
          </LinearGradient>
        )} />
      {[['left', -1, 'chevron-left'], ['right', 1, 'chevron-right']].map(([side, dir, icon]) => (
        <Pressable key={side} onPress={() => go(index + dir)}
          style={{ position: 'absolute', top: '45%', [side]: 5, width: 26, height: 32, borderRadius: 11,
            backgroundColor: '#0f172a40', alignItems: 'center', justifyContent: 'center' }}>
          <FontAwesome6 name={icon} size={12} color="#fff" />
        </Pressable>
      ))}
      <View style={{ position: 'absolute', bottom: 8, alignSelf: 'center', flexDirection: 'row', gap: 6 }}>
        {NEWS.map((_, i) => (
          <View key={i} style={{ height: 6, width: i === index ? 18 : 6, borderRadius: 4, backgroundColor: i === index ? '#fff' : '#ffffff80' }} />
        ))}
      </View>
    </View>
  );
}

function CctvCard() {
  const { c } = useTheme();
  const [camId, setCamId] = useState('CAM-04');
  const [big, setBig] = useState(false);
  const cam = CAMERAS.find((x) => x.id === camId);
  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Txt bold><FontAwesome6 name="video" size={12} color={c.ink} />  CCTV Publik</Txt>
        <View style={{ backgroundColor: '#fef3c7', borderRadius: 5, paddingVertical: 3, paddingHorizontal: 6 }}>
          <Text style={{ color: '#b45309', fontSize: 8, fontWeight: '800' }}>SIMULASI · 3 DETIK</Text>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }} contentContainerStyle={{ gap: 6 }}>
        {CAMERAS.map((x) => (
          <Btn key={x.id} title={`${x.id} · ${x.name}`} active={x.id === camId} onPress={() => setCamId(x.id)} />
        ))}
      </ScrollView>
      <CctvVideo key={camId} cam={cam} height={150} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, gap: 8 }}>
        <Txt small secondary style={{ flex: 1 }}>{cam.location} · {cam.agency}</Txt>
        <Txt small bold style={{ color: cam.online ? '#059669' : '#e87979' }}>{cam.online ? `Online · ${cam.condition}` : 'Offline'}</Txt>
      </View>
      <Btn primary title="Perbesar CCTV" onPress={() => setBig(true)} style={{ marginTop: 8 }} />
      <Txt secondary style={{ fontSize: 9, marginTop: 6 }}>
        {cam.online ? 'Video dummy yang sama dengan dashboard; bukan siaran langsung.' : 'Kamera offline. Video ini contoh rekaman simulasi, bukan tayangan langsung.'}
      </Txt>
      <Modal visible={big} animationType="slide" transparent onRequestClose={() => setBig(false)}>
        <View style={{ flex: 1, backgroundColor: '#020617cc', justifyContent: 'center', padding: 14 }}>
          <View style={{ backgroundColor: c.surface, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: c.edge }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Txt bold style={{ fontSize: 15 }}>{cam.id} · {cam.name}</Txt>
              <Btn title="Tutup" onPress={() => setBig(false)} />
            </View>
            {big && <CctvVideo cam={cam} height={240} />}
            <Txt small secondary style={{ marginTop: 10 }}>
              {cam.location} · {cam.agency} · {cam.online ? cam.condition : 'Offline — contoh rekaman'} · Simulasi 3 detik
            </Txt>
          </View>
        </View>
      </Modal>
    </Card>
  );
}

function HomePage({ data, go, onCreate, onVote }) {
  const { c } = useTheme();
  const [vote, setVote] = useState(null);
  const r = data.reports[0];
  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
      <Card style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderRadius: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
          <Avatar size={40} />
          <View style={{ flex: 1 }}>
            <Txt secondary style={{ fontSize: 10 }}>Warga Terverifikasi</Txt>
            <Txt bold style={{ fontSize: 14, color: c.title }}>{data.profile.name}</Txt>
          </View>
        </View>
        <View style={{ backgroundColor: '#d1fae5', borderRadius: 99, paddingVertical: 3, paddingHorizontal: 8 }}>
          <Text style={{ color: '#047857', fontSize: 9, fontWeight: '800' }}>✓ NIK - VALID</Text>
        </View>
      </Card>

      <NewsCarousel />

      <Txt bold style={{ marginBottom: 8 }}>Kategori Aduan</Txt>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
        {CATEGORY_UI.map((k) => (
          <Pressable key={k.name} onPress={() => onCreate(k.name)}
            style={({ pressed }) => ({ flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 14, borderWidth: 1,
              borderColor: c.edge, backgroundColor: pressed ? c.screen : c.surface })}>
            <FontAwesome6 name={k.icon} size={18} color={k.color} />
            <Txt style={{ fontSize: 10, marginTop: 5, fontWeight: '600' }}>{k.name}</Txt>
          </Pressable>
        ))}
      </View>

      {r ? (
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Txt bold>Aduan Terkini Anda</Txt><Badge status={r.status} />
          </View>
          <Txt style={{ marginTop: 6 }}>{r.title}</Txt>
          <Progress value={r.progress} />
          <Pressable onPress={() => go('reports')}><Txt bold style={{ color: c.link, fontSize: 12 }}>Lihat semua aduan</Txt></Pressable>
        </Card>
      ) : <Btn primary title="+ Tambah Aduan" onPress={() => onCreate()} style={{ marginBottom: 10 }} />}

      <View style={{ backgroundColor: c.indigoBg, borderColor: c.indigoEdge, borderWidth: 1, borderRadius: 16, padding: 11, marginBottom: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
          <Txt bold style={{ color: c.indigoTitle }}>Survei Kepuasan Layanan</Txt>
          <Txt small bold style={{ color: c.indigoText }}>Bulan Ini</Txt>
        </View>
        {vote == null ? (
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            {SURVEI.map((s, i) => (
              <Pressable key={s.emoji} onPress={() => { setVote(i); onVote(s); }} style={{ padding: 6 }}><Text style={{ fontSize: 24 }}>{s.emoji}</Text></Pressable>
            ))}
          </View>
        ) : <Txt small style={{ color: c.indigoTitle, paddingVertical: 8 }}>Terima kasih atas penilaian Anda {SURVEI[vote].emoji}</Txt>}
      </View>

      <CctvCard />
    </ScrollView>
  );
}

/* ───────────── Aduan ───────────── */

function ReportCard({ r, onNotif }) {
  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
        <Txt small secondary>#{r.id}</Txt><Badge status={r.status} />
      </View>
      <Txt bold style={{ fontSize: 14 }}>{r.title}</Txt>
      <Txt small secondary style={{ marginTop: 4 }}>{r.category} · {stamp(r.createdAt)}</Txt>
      <Txt style={{ marginTop: 5 }}>{r.description}</Txt>
      <Txt small secondary style={{ marginTop: 5 }}>
        <FontAwesome6 name="location-dot" size={10} color="#64748b" /> {r.location}
      </Txt>
      {r.media ? <SavedMedia media={r.media} caption="Lampiran aduan" /> : null}
      <Progress value={r.progress} />
      <Txt small secondary style={{ marginBottom: 8 }}>Progress {r.progress}% · {r.agency}</Txt>
      <Btn title="Lihat notifikasi" onPress={() => onNotif(r.id)} />
    </Card>
  );
}

function ReportsPage({ data, filter, setFilter, onCreate, onNotif }) {
  const list = data.reports.filter((r) => filter === 'Semua' || r.status === filter);
  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
      <PageTop title="Aduan Saya" right={<Btn primary title="+ Tambah" onPress={() => onCreate()} />} />
      <Txt small secondary style={{ marginBottom: 12 }}>Aduan milik akun Anda</Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {['Semua', 'Dibuat', 'Diproses', 'Selesai'].map((f) => <Btn key={f} title={f} active={filter === f} onPress={() => setFilter(f)} />)}
      </View>
      {list.length ? list.map((r) => <ReportCard key={r.id} r={r} onNotif={onNotif} />) : (
        <Card style={{ alignItems: 'center', paddingVertical: 28 }}>
          <FontAwesome6 name="file-circle-plus" size={26} color="#60a5fa" />
          <Txt bold style={{ marginTop: 12 }}>{data.reports.length ? 'Belum ada aduan dengan status ini' : 'Belum ada aduan'}</Txt>
          <Txt small secondary style={{ marginVertical: 6 }}>Sampaikan masalah di sekitar Anda.</Txt>
          <Btn primary title="+ Tambah Aduan" onPress={() => onCreate()} />
        </Card>
      )}
    </ScrollView>
  );
}

function NewReportPage({ initialCategory, kategori, onCancel, onSubmit }) {
  const { c } = useTheme();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(initialCategory || CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [media, setMedia] = useState(null);
  const [msg, setMsg] = useState('');
  const [geoMsg, setGeoMsg] = useState('Koordinat (opsional) akan ditambahkan ke keterangan lokasi.');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const pick = async (kind, source) => {
    try {
      const perm = source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { setMsg('Izin kamera / galeri ditolak. Aktifkan lewat pengaturan HP.'); return; }
      const opts = { mediaTypes: [kind === 'photo' ? 'images' : 'videos'], quality: 0.8 };
      const res = source === 'camera' ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
      if (res.canceled) return;
      const a = res.assets[0];
      const maxMb = kind === 'photo' ? 8 : 30;
      if (a.fileSize && a.fileSize > maxMb * 1024 * 1024) { setMsg(`${kind === 'photo' ? 'Foto' : 'Video'} maksimal ${maxMb} MB.`); return; }
      setMedia({ uri: a.uri, kind, name: a.fileName || `${kind}-${Date.now()}` });
      setMsg(kind === 'video' ? 'Video siap dilampirkan.' : 'Foto siap dilampirkan.');
    } catch (e) { setMsg('Lampiran gagal diproses.'); }
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

  const geoLabel = () => {
    if (!lat && !lng) return 'Geotag belum ditentukan';
    const a = Number(lat), b = Number(lng);
    return Number.isFinite(a) && Number.isFinite(b) && lat && lng ? `Lokasi kejadian · ${a.toFixed(6)}, ${b.toFixed(6)}` : 'Lengkapi koordinat lokasi';
  };

  const submit = async () => {
    if (busy) return;
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
    if (!kat) { setError(`Kategori "${category}" belum ada di database server.`); return; }
    setError('');
    setBusy(true);
    try {
      await onSubmit({ id_kategori: kat.id_kategori, topik: t, deskripsi: d, lokasi_kejadian: lokasi, media });
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
          <Txt small bold style={{ fontSize: 12, marginTop: 8, marginBottom: 6 }}>Kategori</Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {CATEGORIES.map((k) => <Btn key={k} title={k} active={k === category} onPress={() => setCategory(k)} />)}
          </View>
          <Field label="Uraian" value={description} onChangeText={setDescription} maxLength={2000} multiline placeholder="Jelaskan kejadian dan dampaknya" />
          <Field label="Lokasi kejadian" value={location} onChangeText={setLocation} maxLength={200} placeholder="Alamat atau patokan lokasi" />

          <Txt small bold style={{ fontSize: 12, marginTop: 8 }}>Foto / Video Aduan</Txt>
          <View style={{ flexDirection: 'row', gap: 7, marginVertical: 8 }}>
            <Btn style={{ flex: 1 }} icon="camera" title="Ambil Foto" onPress={() => pick('photo', 'camera')} />
            <Btn style={{ flex: 1 }} icon="video" title="Ambil Video" onPress={() => pick('video', 'camera')} />
          </View>
          <View style={{ flexDirection: 'row', gap: 7, marginBottom: 8 }}>
            <Btn style={{ flex: 1 }} icon="image" title="Pilih Foto" onPress={() => pick('photo', 'library')} />
            <Btn style={{ flex: 1 }} icon="film" title="Pilih Video" onPress={() => pick('video', 'library')} />
          </View>
          <View style={{ minHeight: 155, borderWidth: 1, borderStyle: 'dashed', borderColor: '#60a5fa', borderRadius: 12, overflow: 'hidden', backgroundColor: c.screen, justifyContent: 'center' }}>
            {media
              ? <SavedMedia media={media} caption={geoLabel()} />
              : <View style={{ alignItems: 'center', padding: 24 }}>
                  <FontAwesome6 name="camera" size={32} color="#60a5fa" />
                  <Txt small secondary style={{ marginTop: 8 }}>Frame pratinjau foto / video</Txt>
                </View>}
          </View>
          <Txt secondary style={{ fontSize: 10, marginTop: 6 }}>Foto maksimal 8 MB · video maksimal 30 MB.</Txt>
          {media && <Btn title="Hapus lampiran" onPress={() => { setMedia(null); setMsg(''); }} style={{ marginTop: 8, alignSelf: 'flex-start' }} />}
          {!!msg && <Txt small style={{ color: '#e87979', marginTop: 6 }}>{msg}</Txt>}

          <Txt small bold style={{ fontSize: 12, marginTop: 14, marginBottom: 6 }}>Titik lokasi kejadian</Txt>
          <Btn icon="location-crosshairs" title="Gunakan lokasi saya" onPress={useMyLocation} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}><Field label="Latitude" value={lat} onChangeText={setLat} keyboardType="numbers-and-punctuation" placeholder="-7.250445" /></View>
            <View style={{ flex: 1 }}><Field label="Longitude" value={lng} onChangeText={setLng} keyboardType="numbers-and-punctuation" placeholder="112.768845" /></View>
          </View>
          <Txt secondary style={{ fontSize: 10 }}>{geoMsg}</Txt>

          {!!error && <Txt small style={{ color: '#e87979', marginTop: 10 }}>{error}</Txt>}
          <Btn primary title={busy ? 'Mengirim…' : 'Kirim Aduan'} onPress={submit} disabled={busy} style={{ marginTop: 14 }} />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ───────────── Notifikasi ───────────── */

function NotificationsPage({ data, only, onReadAll, onAll, go }) {
  const entries = data.events.filter((e) => !only || e.report === only);
  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
      <PageTop title="Notifikasi" right={<Btn title="Tandai dibaca" onPress={onReadAll} />} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Txt small secondary style={{ flex: 1 }}>Pemberitahuan perkembangan aduan Anda.</Txt>
        {only ? <Btn title="Semua" onPress={onAll} /> : null}
      </View>
      {entries.length ? entries.map((e) => (
        <Card key={e.id} style={!data.read.includes(e.id) ? { borderLeftWidth: 3, borderLeftColor: '#3b82f6' } : null}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#dbeafe', alignItems: 'center', justifyContent: 'center' }}>
              <FontAwesome6 name={e.icon} size={14} color="#2563eb" />
            </View>
            <View style={{ flex: 1 }}>
              <Txt bold style={{ fontSize: 14 }}>Aduan {e.status.toLowerCase()}</Txt>
              <Txt style={{ marginTop: 3 }}>{e.body}</Txt>
              <Txt small secondary style={{ marginTop: 3 }}>#{e.report} · {e.title}</Txt>
              <Txt small secondary>{stamp(e.time)}</Txt>
              <Btn title="Buka aduan" onPress={() => go('reports')} style={{ marginTop: 8, alignSelf: 'flex-start' }} />
            </View>
          </View>
        </Card>
      )) : <Card><Txt style={{ textAlign: 'center', padding: 16 }}>Belum ada notifikasi.</Txt></Card>}
    </ScrollView>
  );
}

/* ───────────── Profil ───────────── */

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

function ProfilePage({ data, onEdit, onChangePw, onLogout }) {
  const p = data.profile;
  const rows = [['Nama', p.name], ['Username', p.username], ['Alamat', p.address || '-'], ['NIK', maskNik(p.nik)], ['Jumlah aduan', String(data.reports.length)]];
  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
      <PageTop title="Profil Pengadu" right={<Btn title="Edit" onPress={onEdit} />} />
      <Card>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <Avatar size={50} />
          <View style={{ flex: 1, gap: 4 }}>
            <Txt bold style={{ fontSize: 15 }}>{p.name}</Txt>
            <Txt small secondary>Akun warga · @{p.username}</Txt>
            <View style={{ alignSelf: 'flex-start' }}><Badge status="Selesai" /></View>
          </View>
        </View>
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

function EditProfilePage({ profile, onCancel, onSave }) {
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

function ChangePasswordPage({ onCancel, onSave }) {
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

/* ───────────── Navigasi bawah ───────────── */

function TabBar({ page, go }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const tabs = [['home', 'house', 'Beranda'], ['reports', 'file-lines', 'Aduan'], ['notifications', 'bell', 'Notif'], ['profile', 'user', 'Profil']];
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-around', backgroundColor: c.surface,
      borderTopWidth: 1, borderTopColor: c.edge, paddingTop: 8, paddingBottom: Math.max(insets.bottom, 8) }}>
      {tabs.map(([id, icon, label]) => {
        const on = page === id;
        const color = on ? c.link : c.secondary;
        return (
          <Pressable key={id} onPress={() => go(id)} style={{ alignItems: 'center', minWidth: 64 }}>
            <FontAwesome6 name={icon} size={17} color={color} />
            <Text style={{ color, fontSize: 10, marginTop: 3, fontWeight: on ? '700' : '500' }}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ───────────── App ───────────── */

export default function App() {
  const { session, logout } = useAuth(); // login & sesi diurus AuthGate
  const uid = session.pelapor.id_pelapor;
  const READ_KEY = `aduan-read-${uid}`;

  const system = useColorScheme();
  const [pref, setPref] = useState('auto');
  const [data, setData] = useState({ profile: fromPelapor(session.pelapor), reports: [], events: [], read: [] });
  const [kategori, setKategori] = useState([]);
  const [loadErr, setLoadErr] = useState('');
  const [page, setPage] = useState('home');
  const [creating, setCreating] = useState(null);
  const [editing, setEditing] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [notice, setNotice] = useState('');
  const [filter, setFilter] = useState('Semua');
  const [notifOnly, setNotifOnly] = useState(null);

  // Ambil semua data milik akun ini dari server
  const refresh = useCallback(async () => {
    try {
      const [me, aduan, notif] = await Promise.all([
        authFetch('/api/me'), authFetch('/api/aduan'), authFetch('/api/notifikasi'),
      ]);
      setData((d) => ({ ...d, profile: fromPelapor(me), reports: aduan.map(mapReport), events: notif.map(mapEvent) }));
      setLoadErr('');
    } catch (e) {
      if (/Sesi habis|Belum login/.test(e.message)) { logout(); return; }
      setLoadErr(e.message || 'Gagal memuat data.');
    }
  }, [logout]);

  useEffect(() => {
    (async () => {
      try {
        const [t, r] = await Promise.all([AsyncStorage.getItem(THEME_KEY), AsyncStorage.getItem(READ_KEY)]);
        if (t && ['auto', 'light', 'dark'].includes(t)) setPref(t);
        if (r) setData((d) => ({ ...d, read: JSON.parse(r) }));
      } catch {}
    })();
    authFetch('/api/kategori').then(setKategori).catch(() => {});
    refresh();
  }, [refresh, READ_KEY]);

  const dark = pref === 'auto' ? system === 'dark' : pref === 'dark';
  const theme = useMemo(() => ({ c: dark ? DARK : LIGHT, dark }), [dark]);
  const c = theme.c;

  const cycleTheme = () => {
    const next = { auto: 'light', light: 'dark', dark: 'auto' }[pref];
    setPref(next);
    AsyncStorage.setItem(THEME_KEY, next).catch(() => {});
  };
  const themeIcon = { auto: 'circle-half-stroke', light: 'sun', dark: 'moon' }[pref];

  const go = (p) => { setCreating(null); setEditing(false); setChangingPw(false); setNotifOnly(null); setPage(p); refresh(); };
  const startCreate = (category) => { setPage('reports'); setEditing(false); setChangingPw(false); setCreating({ category }); };

  const submitReport = async ({ id_kategori, topik, deskripsi, lokasi_kejadian, media }) => {
    const fd = new FormData();
    fd.append('id_kategori', id_kategori);
    fd.append('topik', topik);
    fd.append('deskripsi', deskripsi);
    fd.append('lokasi_kejadian', lokasi_kejadian);
    if (media) {
      const ext = media.kind === 'video' ? '.mp4' : '.jpg';
      const name = /\.\w{2,4}$/.test(media.name) ? media.name : media.name + ext;
      fd.append('tipe_media', media.kind === 'video' ? 'video' : 'foto_sebelum');
      if (Platform.OS === 'web') {
        const blob = await (await fetch(media.uri)).blob();
        fd.append('file', blob, name);
      } else {
        fd.append('file', { uri: media.uri, name, type: media.kind === 'video' ? 'video/mp4' : 'image/jpeg' });
      }
    }
    await authFetch('/api/aduan', { method: 'POST', body: fd });
    await refresh();
    setFilter('Semua');
    setCreating(null);
  };

  const saveProfile = async ({ nama, alamat }) => {
    await authFetch('/api/me', { method: 'PATCH', body: { nama, alamat } });
    await refresh();
    setEditing(false);
  };

  const savePassword = async (body) => {
    await authFetch('/api/me/password', { method: 'POST', body });
    setChangingPw(false);
    setNotice('Kata sandi berhasil diganti.');
    setTimeout(() => setNotice(''), 4000);
  };

  const sendVote = (s) => {
    authFetch('/api/survei', { method: 'POST', body: { skor: s.skor, label_kepuasan: s.label, emoji: s.emoji } }).catch(() => {});
  };

  const readAll = () => {
    const ids = data.events.map((e) => e.id);
    setData((d) => ({ ...d, read: ids }));
    AsyncStorage.setItem(READ_KEY, JSON.stringify(ids)).catch(() => {});
  };

  const themeToggle = (
    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16, paddingTop: 4 }}>
      <Pressable onPress={cycleTheme} hitSlop={10}
        style={{ width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: c.edge, backgroundColor: c.surface,
          alignItems: 'center', justifyContent: 'center' }}>
        <FontAwesome6 name={themeIcon} size={14} color={c.ink} />
      </Pressable>
    </View>
  );

  let body;
  if (page === 'reports' && creating) {
    body = <NewReportPage initialCategory={creating.category} kategori={kategori}
      onCancel={() => setCreating(null)} onSubmit={submitReport} />;
  } else if (page === 'profile' && editing) {
    body = <EditProfilePage profile={data.profile} onCancel={() => setEditing(false)} onSave={saveProfile} />;
  } else if (page === 'profile' && changingPw) {
    body = <ChangePasswordPage onCancel={() => setChangingPw(false)} onSave={savePassword} />;
  } else if (page === 'home') body = <HomePage data={data} go={go} onCreate={startCreate} onVote={sendVote} />;
  else if (page === 'reports') body = <ReportsPage data={data} filter={filter} setFilter={setFilter} onCreate={startCreate}
    onNotif={(id) => { setNotifOnly(id); setPage('notifications'); }} />;
  else if (page === 'notifications') body = <NotificationsPage data={data} only={notifOnly} go={go}
    onAll={() => setNotifOnly(null)} onReadAll={readAll} />;
  else body = <ProfilePage data={data} onEdit={() => setEditing(true)} onChangePw={() => setChangingPw(true)} onLogout={logout} />;

  return (
    <ThemeCtx.Provider value={theme}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.screen }}>
        {themeToggle}
        {!!loadErr && (
          <Pressable onPress={refresh} style={{ backgroundColor: '#fee2e2', paddingVertical: 8, paddingHorizontal: 16 }}>
            <Text style={{ color: '#991b1b', fontSize: 11 }}>{loadErr} Ketuk untuk coba lagi.</Text>
          </Pressable>
        )}
        {!!notice && (
          <View style={{ backgroundColor: '#d1fae5', paddingVertical: 8, paddingHorizontal: 16 }}>
            <Text style={{ color: '#065f46', fontSize: 11, fontWeight: '600' }}>{notice}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>{body}</View>
        <TabBar page={page} go={go} />
      </SafeAreaView>
    </ThemeCtx.Provider>
  );
}