import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, Pressable, AppState, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { FontAwesome6 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { TabBar } from '../aduan/TabBar';
import { THEME_KEY } from '../aduan/constants';
import { loadCache, saveCache } from '../aduan/cache';
import { fromPelapor, mapReport, mapEvent } from '../aduan/format';
import { useOnline } from '../aduan/net';
import { addFile, shrinkAvatar } from '../aduan/photos';
import { HomePage } from '../aduan/screens/HomeScreen';
import { NewReportPage } from '../aduan/screens/NewReportScreen';
import { NotificationsPage } from '../aduan/screens/NotificationsScreen';
import { ProfilePage, EditProfilePage, ChangePasswordPage } from '../aduan/screens/ProfileScreen';
import { ReportDetailPage, EditReportPage } from '../aduan/screens/ReportDetailScreen';
import { ReportsPage } from '../aduan/screens/ReportsScreen';
import { LIGHT, DARK, ThemeCtx, RefreshCtx } from '../aduan/theme';
import { useAuth } from '../AuthGate';
import { authFetch } from '../auth';

export default function App() {
  const { session, logout } = useAuth(); // login & sesi diurus AuthGate
  const uid = session.pelapor.id_pelapor;
  const READ_KEY = `aduan-read-${uid}`;
  const CACHE_KEY = `aduan-cache-${uid}`;
  const DRAFT_KEY = `aduan-draft-${uid}`;

  const online = useOnline();
  const system = useColorScheme();
  const [pref, setPref] = useState('auto');
  const [data, setData] = useState({ profile: fromPelapor(session.pelapor), reports: [], events: [], read: [] });
  const [kategori, setKategori] = useState([]);
  const [loadErr, setLoadErr] = useState('');
  const [page, setPage] = useState('home');
  const [creating, setCreating] = useState(null);
  const [editing, setEditing] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [notice, setNotice] = useState(null);
  const flash = (text, error = false) => { setNotice({ text, error }); setTimeout(() => setNotice(null), 4000); };
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('Semua');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('Semua');
  const [sort, setSort] = useState('baru');
  const [detailId, setDetailId] = useState(null);
  const [editingReport, setEditingReport] = useState(null);
  const [notifOnly, setNotifOnly] = useState(null);

  // Ambil semua data milik akun ini dari server, lalu simpan salinannya untuk mode offline
  const refresh = useCallback(async () => {
    try {
      const [me, aduan, notif, kat] = await Promise.all([
        authFetch('/api/me'), authFetch('/api/aduan'), authFetch('/api/notifikasi'), authFetch('/api/kategori'),
      ]);
      const reports = aduan.map(mapReport);
      const events = notif.map(mapEvent);
      setKategori(kat);
      setData((d) => ({ ...d, profile: fromPelapor(me), reports, events }));
      saveCache(CACHE_KEY, { kategori: kat, reports, events });
      setLoadErr('');
    } catch (e) {
      if (/Sesi habis|Belum login/.test(e.message)) { logout(); return; }
      setLoadErr(e.message || 'Gagal memuat data.');
    }
  }, [logout, CACHE_KEY]);

  useEffect(() => {
    (async () => {
      try {
        const [t, r, cached] = await Promise.all([
          AsyncStorage.getItem(THEME_KEY), AsyncStorage.getItem(READ_KEY), loadCache(CACHE_KEY),
        ]);
        if (t && ['auto', 'light', 'dark'].includes(t)) setPref(t);
        if (r) setData((d) => ({ ...d, read: JSON.parse(r) }));
        // Tampilkan data tersimpan dulu; ditimpa data terbaru begitu refresh() berhasil
        if (cached) {
          setKategori((k) => (k.length ? k : cached.kategori || []));
          setData((d) => (d.reports.length || d.events.length ? d
            : { ...d, reports: cached.reports || [], events: cached.events || [] }));
        }
      } catch {}
    })();
    refresh();
  }, [refresh, READ_KEY, CACHE_KEY]);

  // Refresh otomatis tiap 30 detik (hanya saat app terbuka) dan saat app kembali dibuka
  useEffect(() => {
    const id = setInterval(() => { if (AppState.currentState === 'active') refresh(); }, 30000);
    const sub = AppState.addEventListener('change', (st) => { if (st === 'active') refresh(); });
    return () => { clearInterval(id); sub.remove(); };
  }, [refresh]);

  // Begitu internet tersambung lagi, muat ulang data
  useEffect(() => { if (online) refresh(); }, [online, refresh]);

  const dark = pref === 'auto' ? system === 'dark' : pref === 'dark';
  const theme = useMemo(() => ({ c: dark ? DARK : LIGHT, dark }), [dark]);
  const c = theme.c;

  const cycleTheme = () => {
    const next = { auto: 'light', light: 'dark', dark: 'auto' }[pref];
    setPref(next);
    AsyncStorage.setItem(THEME_KEY, next).catch(() => {});
  };
  const themeIcon = { auto: 'circle-half-stroke', light: 'sun', dark: 'moon' }[pref];

  const pull = async () => { setRefreshing(true); await refresh(); setRefreshing(false); };

  const go = (p) => { setCreating(null); setDetailId(null); setEditingReport(null); setEditing(false); setChangingPw(false); setNotifOnly(null); setPage(p); refresh(); };
  const startCreate = (category) => { setPage('reports'); setDetailId(null); setEditingReport(null); setEditing(false); setChangingPw(false); setCreating({ category }); };

  const submitReport = async ({ id_kategori, topik, deskripsi, lokasi_kejadian, photos, video }) => {
    const fd = new FormData();
    fd.append('id_kategori', id_kategori);
    fd.append('topik', topik);
    fd.append('deskripsi', deskripsi);
    fd.append('lokasi_kejadian', lokasi_kejadian);
    for (const p of photos) await addFile(fd, 'foto', p.uri, p.name, 'image/jpeg');
    if (video) {
      const name = /\.\w{2,4}$/.test(video.name) ? video.name : video.name + '.mp4';
      await addFile(fd, 'video', video.uri, name, video.mime);
    }
    await authFetch('/api/aduan', { method: 'POST', body: fd });
    await refresh();
    setFilter('Semua');
    setCreating(null);
  };

  const openDetail = (id) => {
    setCreating(null); setEditing(false); setChangingPw(false); setEditingReport(null); setNotifOnly(null);
    setPage('reports'); setDetailId(id);
  };

  // Ketuk kotak ringkasan di beranda -> buka daftar aduan dengan status itu
  const openStatus = (st) => { go('reports'); setFilter(st); setCatFilter('Semua'); setSearch(''); };

  const saveReport = async (id, body) => {
    await authFetch(`/api/aduan/${encodeURIComponent(id)}`, { method: 'PATCH', body });
    await refresh();
    setEditingReport(null);
    flash('Aduan diperbarui.');
  };

  const cancelReport = async (id) => {
    await authFetch(`/api/aduan/${encodeURIComponent(id)}`, { method: 'DELETE' });
    setDetailId(null);
    await refresh();
    flash('Aduan dibatalkan.');
  };

  const saveProfile = async ({ nama, alamat }) => {
    await authFetch('/api/me', { method: 'PATCH', body: { nama, alamat } });
    await refresh();
    setEditing(false);
  };

  const savePassword = async (body) => {
    await authFetch('/api/me/password', { method: 'POST', body });
    setChangingPw(false);
    flash('Kata sandi berhasil diganti.');
  };

  const uploadPhoto = async (source) => {
    try {
      const perm = source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { flash('Izin kamera / galeri ditolak. Aktifkan lewat pengaturan.', true); return; }
      const opts = { mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 1 };
      const res = source === 'camera' ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
      if (res.canceled) return;
      const out = await shrinkAvatar(res.assets[0]); // dikecilkan otomatis, maks 4 MB
      const fd = new FormData();
      await addFile(fd, 'file', out.uri, 'foto-profil.jpg', 'image/jpeg');
      await authFetch('/api/me/foto', { method: 'POST', body: fd });
      await refresh();
      flash('Foto profil diperbarui.');
    } catch (e) { flash(e.message || 'Foto gagal diunggah.', true); }
  };

  const removePhoto = async () => {
    try {
      await authFetch('/api/me/foto', { method: 'DELETE' });
      await refresh();
      flash('Foto profil dihapus.');
    } catch (e) { flash(e.message || 'Foto gagal dihapus.', true); }
  };

  const sendVote = (s) => {
    authFetch('/api/survei', { method: 'POST', body: { skor: s.skor, label_kepuasan: s.label, emoji: s.emoji } }).catch(() => {});
  };

  const readAll = () => {
    const ids = data.events.map((e) => e.id);
    setData((d) => ({ ...d, read: ids }));
    AsyncStorage.setItem(READ_KEY, JSON.stringify(ids)).catch(() => {});
  };

  const unread = data.events.filter((e) => !data.read.includes(e.id)).length;

  const themeToggle = (
    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16, paddingTop: 4 }}>
      <Pressable onPress={cycleTheme} hitSlop={10}
        style={{ width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: c.edge, backgroundColor: c.surface,
          alignItems: 'center', justifyContent: 'center' }}>
        <FontAwesome6 name={themeIcon} size={14} color={c.ink} />
      </Pressable>
    </View>
  );

  const detailReport = detailId ? data.reports.find((x) => x.id === detailId) : null;

  let body;
  if (page === 'reports' && creating) {
    body = <NewReportPage initialCategory={creating.category} kategori={kategori} draftKey={DRAFT_KEY}
      onCancel={() => setCreating(null)} onSubmit={submitReport} />;
  } else if (page === 'reports' && editingReport) {
    body = <EditReportPage r={editingReport} kategori={kategori} onCancel={() => setEditingReport(null)}
      onSave={(b) => saveReport(editingReport.id, b)} />;
  } else if (page === 'reports' && detailReport) {
    body = <ReportDetailPage r={detailReport} events={data.events} onBack={() => setDetailId(null)}
      onEdit={() => setEditingReport(detailReport)} onCancel={() => cancelReport(detailReport.id)} />;
  } else if (page === 'profile' && editing) {
    body = <EditProfilePage profile={data.profile} onCancel={() => setEditing(false)} onSave={saveProfile} />;
  } else if (page === 'profile' && changingPw) {
    body = <ChangePasswordPage onCancel={() => setChangingPw(false)} onSave={savePassword} />;
  } else if (page === 'home') body = <HomePage data={data} go={go} onCreate={startCreate} onVote={sendVote} onStatus={openStatus} />;
  else if (page === 'reports') body = <ReportsPage data={data} filter={filter} setFilter={setFilter} search={search} setSearch={setSearch}
    catFilter={catFilter} setCatFilter={setCatFilter} sort={sort} setSort={setSort} onCreate={startCreate} onDetail={openDetail}
    onNotif={(id) => { setNotifOnly(id); setPage('notifications'); }} />;
  else if (page === 'notifications') body = <NotificationsPage data={data} only={notifOnly} onOpen={openDetail}
    onAll={() => setNotifOnly(null)} onReadAll={readAll} />;
  else body = <ProfilePage data={data} onEdit={() => setEditing(true)} onChangePw={() => setChangingPw(true)} onLogout={logout}
    onPhoto={uploadPhoto} onRemovePhoto={removePhoto} />;

  return (
    <ThemeCtx.Provider value={theme}>
    <RefreshCtx.Provider value={{ refreshing, onRefresh: pull }}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.screen }}>
        {themeToggle}
        {/* Saat offline, badge di atas tab bar yang bicara; banner merah disembunyikan */}
        {!!loadErr && online && (
          <Pressable onPress={refresh} style={{ backgroundColor: '#fee2e2', paddingVertical: 8, paddingHorizontal: 16 }}>
            <Text style={{ color: '#991b1b', fontSize: 11 }}>{loadErr} Ketuk untuk coba lagi.</Text>
          </Pressable>
        )}
        {!!notice && (
          <View style={{ backgroundColor: notice.error ? '#fee2e2' : '#d1fae5', paddingVertical: 8, paddingHorizontal: 16 }}>
            <Text style={{ color: notice.error ? '#991b1b' : '#065f46', fontSize: 11, fontWeight: '600' }}>{notice.text}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>{body}</View>
        <TabBar page={page} go={go} badges={{ notifications: unread }} />
      </SafeAreaView>
    </RefreshCtx.Provider>
    </ThemeCtx.Provider>
  );
}