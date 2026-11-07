// Layar Aduan: pencarian, filter dropdown, dan daftar kartu aduan.
import React from 'react';
import { View, ScrollView, Pressable, TextInput } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { CATEGORIES } from '../constants';
import { stamp } from '../format';
import { MediaGallery } from '../media';
import { useTheme, useRC } from '../theme';
import { FadeIn } from '../tg';
import { Txt, Card, Btn, Badge, Progress, PageTop, Dropdown } from '../ui';

function ReportCard({ r, onNotif, onDetail }) {
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
      <MediaGallery items={r.media} />
      <Progress value={r.progress} />
      <Txt small secondary style={{ marginBottom: 8 }}>Progress {r.progress}% · {r.agency}</Txt>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Btn primary icon="eye" title="Lihat detail" onPress={() => onDetail(r.id)} style={{ flex: 1 }} />
        <Btn icon="bell" title="Notifikasi" onPress={() => onNotif(r.id)} style={{ flex: 1 }} />
      </View>
    </Card>
  );
}

const SORT_OPTIONS = [
  { value: 'baru', label: 'Terbaru dulu' },
  { value: 'lama', label: 'Terlama dulu' },
  { value: 'progres', label: 'Progres tertinggi' },
];
const SORTERS = {
  baru: (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  lama: (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt),
  progres: (a, b) => b.progress - a.progress || Date.parse(b.createdAt) - Date.parse(a.createdAt),
};

export function ReportsPage({ data, filter, setFilter, search, setSearch, catFilter, setCatFilter, sort, setSort, onCreate, onNotif, onDetail }) {
  const { c } = useTheme();
  const rc = useRC();
  const q = search.trim().toLowerCase();
  const filtered = data.reports.filter((r) =>
    (filter === 'Semua' || r.status === filter) &&
    (catFilter === 'Semua' || r.category === catFilter) &&
    (!q || [r.title, r.description, r.location, r.id].some((t) => String(t || '').toLowerCase().includes(q))));
  const list = [...filtered].sort(SORTERS[sort] || SORTERS.baru);
  const filtering = filter !== 'Semua' || catFilter !== 'Semua' || !!q;
  const reset = () => { setFilter('Semua'); setCatFilter('Semua'); setSearch(''); };
  const total = data.reports.length;
  const catOptions = [{ value: 'Semua', label: `Semua kategori (${total})` },
    ...CATEGORIES.map((k) => ({ value: k, label: `${k} (${data.reports.filter((r) => r.category === k).length})` }))];
  const statusOptions = [{ value: 'Semua', label: `Semua status (${total})` },
    ...['Dibuat', 'Diproses', 'Selesai'].map((k) => ({ value: k, label: `${k} (${data.reports.filter((r) => r.status === k).length})` }))];
  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }} refreshControl={rc} keyboardShouldPersistTaps="handled">
      <PageTop title="Aduan Saya" right={<Btn primary title="+ Tambah" onPress={() => onCreate()} />} />
      <Txt small secondary style={{ marginBottom: 12 }}>Aduan milik akun Anda</Txt>

      <View style={{ marginBottom: 10 }}>
        <TextInput value={search} onChangeText={setSearch} placeholder="Cari judul, uraian, lokasi, atau nomor…"
          placeholderTextColor={c.secondary} returnKeyType="search" autoCorrect={false}
          style={{ borderWidth: 1, borderColor: c.edge, borderRadius: 10, paddingVertical: 10, paddingLeft: 36, paddingRight: 36,
            backgroundColor: c.surface, color: c.ink, fontSize: 13 }} />
        <View pointerEvents="none" style={{ position: 'absolute', left: 12, top: 0, bottom: 0, justifyContent: 'center' }}>
          <FontAwesome6 name="magnifying-glass" size={13} color={c.secondary} />
        </View>
        {!!search && (
          <Pressable onPress={() => setSearch('')} hitSlop={8} style={{ position: 'absolute', right: 12, top: 0, bottom: 0, justifyContent: 'center' }}>
            <FontAwesome6 name="circle-xmark" size={14} color={c.secondary} />
          </Pressable>
        )}
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
        <Dropdown label="Kategori" value={catFilter} options={catOptions} onChange={setCatFilter} />
        <Dropdown label="Status" value={filter} options={statusOptions} onChange={setFilter} />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
        <View style={{ flex: 1 }}>
          <Txt small secondary>{filtering ? `Menampilkan ${list.length} dari ${total} aduan` : `${total} aduan`}</Txt>
          {filtering ? (
            <Pressable onPress={reset} hitSlop={8} style={{ marginTop: 2 }}>
              <Txt small bold style={{ color: c.link }}>Reset filter</Txt>
            </Pressable>
          ) : null}
        </View>
        <Dropdown compact icon="arrow-down-wide-short" label="Urutkan" value={sort} options={SORT_OPTIONS} onChange={setSort} />
      </View>

      {list.length ? list.map((r, i) => (
        <FadeIn key={r.id} delay={Math.min(i, 6) * 70} y={16}>
          <ReportCard r={r} onNotif={onNotif} onDetail={onDetail} />
        </FadeIn>
      )) : (
        <Card style={{ alignItems: 'center', paddingVertical: 28 }}>
          <FontAwesome6 name={data.reports.length ? 'magnifying-glass' : 'file-circle-plus'} size={26} color="#60a5fa" />
          <Txt bold style={{ marginTop: 12 }}>{data.reports.length ? 'Tidak ada aduan yang cocok' : 'Belum ada aduan'}</Txt>
          <Txt small secondary style={{ marginVertical: 6, textAlign: 'center' }}>
            {data.reports.length ? 'Ubah kata kunci atau filter Anda.' : 'Sampaikan masalah di sekitar Anda.'}
          </Txt>
          {data.reports.length ? <Btn title="Reset filter" onPress={reset} /> : <Btn primary title="+ Tambah Aduan" onPress={() => onCreate()} />}
        </Card>
      )}
    </ScrollView>
  );
}