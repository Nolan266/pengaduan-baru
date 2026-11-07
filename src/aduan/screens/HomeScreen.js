// Layar Beranda: berita, kategori, aduan terkini, survei, CCTV.
import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, FlatList, Pressable, Modal, useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import { CATEGORY_UI, SURVEI, CAMERAS, NEWS } from '../constants';
import { EmergencyCard } from '../EmergencyCard';
import { CctvVideo } from '../media';
import { useTheme, useRC } from '../theme';
import { BigAvatar } from '../tg';
import { Txt, Card, Btn, Badge, Progress } from '../ui';

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

export function HomePage({ data, go, onCreate, onVote, onStatus }) {
  const { c } = useTheme();
  const rc = useRC();
  const [vote, setVote] = useState(null);
  const r = data.reports[0];
  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }} refreshControl={rc}>
      <Card style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderRadius: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
          <View style={{ width: 40, height: 40 }}>
            <BigAvatar uri={data.profile.foto} name={data.profile.name} size={40} />
            <View style={{ position: 'absolute', right: 0, bottom: 1, width: 10, height: 10, borderRadius: 5,
              backgroundColor: '#10b981', borderWidth: 2, borderColor: c.surface }} />
          </View>
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

      {data.reports.length > 0 && (
        <>
          <Txt bold style={{ marginBottom: 8 }}>Ringkasan Aduan</Txt>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            {[['Dibuat', '#b45309', '#fef3c7'], ['Diproses', '#3730a3', '#e0e7ff'], ['Selesai', '#065f46', '#d1fae5']].map(([st, fg, bg]) => (
              <Pressable key={st} onPress={() => onStatus(st)}
                style={({ pressed }) => ({ flex: 1, borderRadius: 14, paddingVertical: 12, alignItems: 'center', backgroundColor: bg, opacity: pressed ? 0.8 : 1 })}>
                <Text style={{ fontSize: 22, fontWeight: '800', color: fg }}>{data.reports.filter((x) => x.status === st).length}</Text>
                <Text style={{ fontSize: 10, fontWeight: '700', color: fg }}>{st}</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

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

      <EmergencyCard />
      <CctvCard />
    </ScrollView>
  );
}