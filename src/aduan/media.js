// Pemutar video, galeri foto, dan penampil foto layar penuh.
import React, { useState } from 'react';
import { View, Text, Pressable, Image, Modal, StyleSheet } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { VIDEOS, POSTERS } from './constants';
import { useTheme } from './theme';
import { Txt } from './ui';

export function CctvVideo({ cam, height }) {
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

export function SavedMedia({ media, caption, onOpen }) {
  const { c } = useTheme();
  const player = useVideoPlayer(media.kind === 'video' ? media.uri : null, () => {});
  return (
    <View style={{ marginVertical: 10, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: c.edge }}>
      {media.kind === 'video'
        ? <VideoView player={player} style={{ width: '100%', height: 190, backgroundColor: '#020617' }} nativeControls contentFit="contain" />
        : <Pressable disabled={!onOpen} onPress={() => onOpen && onOpen(media.uri)}>
            <Image source={{ uri: media.uri }} style={{ width: '100%', height: 190, backgroundColor: '#020617' }} resizeMode="contain" />
          </Pressable>}
      <Txt small secondary style={{ padding: 8, backgroundColor: c.screen }}>{caption}</Txt>
    </View>
  );
}

function PhotoViewer({ view, onClose, onIndex }) {
  const uris = view ? view.uris : [];
  const i = view ? view.index : 0;
  const n = uris.length;
  const nav = { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ffffff22', alignItems: 'center', justifyContent: 'center' };
  return (
    <Modal visible={!!view} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#000000ee', justifyContent: 'center', padding: 12 }}>
        <Pressable onPress={onClose} style={StyleSheet.absoluteFill} />
        {uris[i] ? <Image source={{ uri: uris[i] }} style={{ width: '100%', height: '72%' }} resizeMode="contain" /> : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 14, minHeight: 40 }}>
          {n > 1 ? <Pressable onPress={() => onIndex((i - 1 + n) % n)} hitSlop={10} style={nav}><FontAwesome6 name="chevron-left" size={16} color="#fff" /></Pressable> : null}
          {n > 1 ? <Text style={{ color: '#fff', fontSize: 12 }}>{i + 1} / {n}</Text> : null}
          {n > 1 ? <Pressable onPress={() => onIndex((i + 1) % n)} hitSlop={10} style={nav}><FontAwesome6 name="chevron-right" size={16} color="#fff" /></Pressable> : null}
        </View>
        <Pressable onPress={onClose} style={{ alignSelf: 'center', marginTop: 14, paddingVertical: 8, paddingHorizontal: 18, borderRadius: 10, backgroundColor: '#ffffff22' }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>Tutup</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

// Foto & video sebuah aduan. items: [{ uri, kind: 'photo'|'video', tipe }]
export function MediaGallery({ items = [] }) {
  const { c } = useTheme();
  const [view, setView] = useState(null);
  if (!items.length) return null;
  const sebelum = items.filter((m) => m.tipe !== 'foto_sesudah');
  const sesudah = items.filter((m) => m.tipe === 'foto_sesudah');
  const fotoSebelum = sebelum.filter((m) => m.kind === 'photo');
  const videoSebelum = sebelum.filter((m) => m.kind === 'video');
  const viewer = <PhotoViewer view={view} onClose={() => setView(null)} onIndex={(i) => setView((v) => ({ ...v, index: i }))} />;

  // tepat 1 foto sebelum + 1 foto sesudah -> berdampingan
  if (fotoSebelum.length === 1 && sesudah.length === 1 && !videoSebelum.length) {
    return (
      <View style={{ marginVertical: 10 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[['Sebelum', fotoSebelum[0]], ['Sesudah', sesudah[0]]].map(([label, m]) => {
            const done = label === 'Sesudah';
            return (
              <View key={label} style={{ flex: 1, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: c.edge }}>
                <Pressable onPress={() => setView({ uris: [m.uri], index: 0 })}>
                  <Image source={{ uri: m.uri }} style={{ width: '100%', height: 130, backgroundColor: '#020617' }} resizeMode="cover" />
                </Pressable>
                <View style={{ padding: 6, backgroundColor: done ? '#d1fae5' : c.screen }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', textAlign: 'center', color: done ? '#065f46' : c.secondary }}>{label}</Text>
                </View>
              </View>
            );
          })}
        </View>
        {viewer}
      </View>
    );
  }

  const thumbs = (list, label, done) => (
    <View>
      <View style={{ alignSelf: 'flex-start', marginBottom: 6, backgroundColor: done ? '#d1fae5' : c.screen, borderRadius: 6,
        paddingVertical: 2, paddingHorizontal: 8, borderWidth: done ? 0 : 1, borderColor: c.edge }}>
        <Text style={{ fontSize: 10, fontWeight: '700', color: done ? '#065f46' : c.secondary }}>{label}</Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {list.map((m, i) => (
          <Pressable key={`${m.uri}-${i}`} onPress={() => setView({ uris: list.map((x) => x.uri), index: i })}
            style={{ width: 92, height: 92, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: c.edge }}>
            <Image source={{ uri: m.uri }} style={{ width: '100%', height: '100%', backgroundColor: '#020617' }} resizeMode="cover" />
          </Pressable>
        ))}
      </View>
    </View>
  );

  return (
    <View style={{ marginVertical: 10, gap: 10 }}>
      {fotoSebelum.length ? thumbs(fotoSebelum, `Foto aduan (${fotoSebelum.length})`, false) : null}
      {videoSebelum.map((v, i) => <SavedMedia key={`${v.uri}-${i}`} media={v} caption="Video aduan" />)}
      {sesudah.length ? thumbs(sesudah, `Sesudah penanganan (${sesudah.length})`, true) : null}
      {viewer}
    </View>
  );
}
