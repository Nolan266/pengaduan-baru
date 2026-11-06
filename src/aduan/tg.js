// Komponen bergaya Telegram: avatar inisial, animasi masuk, tombol berskala,
// sheet menu dari bawah, kolom isian dengan label melayang, dan bar judul.
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, Modal, Animated, Image, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from './theme';

const ND = Platform.OS !== 'web'; // native driver tidak tersedia di web

/* ───────────── Avatar inisial berwarna ───────────── */
const PALETTE = [
  ['#ff7e5f', '#e8505b'], ['#6a11cb', '#2575fc'], ['#11998e', '#2bb673'], ['#f857a6', '#ff5858'],
  ['#4776e6', '#8e54e9'], ['#0ea5e9', '#2563eb'], ['#f59e0b', '#ea580c'],
];
const hashName = (s) => [...String(s || '?')].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
export const colorsFor = (name) => PALETTE[hashName(name) % PALETTE.length];
export const initials = (name) => String(name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';

export function BigAvatar({ uri, name, size = 104, ring = false }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', ...(ring ? { borderWidth: 3, borderColor: '#ffffffd9' } : {}) }}>
      {uri ? (
        <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
      ) : (
        <LinearGradient colors={colorsFor(name)} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#fff', fontSize: size * 0.38, fontWeight: '700' }}>{initials(name)}</Text>
        </LinearGradient>
      )}
    </View>
  );
}

/* ───────────── Animasi tipis ───────────── */
// Muncul pelan sambil naik sedikit (bisa diberi jeda untuk efek berurutan)
export function FadeIn({ delay = 0, y = 14, style, children }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(v, { toValue: 1, duration: 320, delay, useNativeDriver: ND }).start(); }, [v, delay]);
  return (
    <Animated.View style={[{ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [y, 0] }) }] }, style]}>
      {children}
    </Animated.View>
  );
}

// Muncul membesar dengan pegas
export function PopIn({ style, children }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.spring(v, { toValue: 1, friction: 6, tension: 90, useNativeDriver: ND }).start(); }, [v]);
  return (
    <Animated.View style={[{ opacity: v, transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }] }, style]}>
      {children}
    </Animated.View>
  );
}

// Mengecil sedikit saat ditekan, lalu memantul kembali
export function ScaleBtn({ onPress, disabled, hitSlop, outerStyle, style, children }) {
  const s = useRef(new Animated.Value(1)).current;
  const to = (v) => Animated.spring(s, { toValue: v, speed: 40, bounciness: 6, useNativeDriver: ND }).start();
  return (
    <Pressable onPress={onPress} disabled={disabled} hitSlop={hitSlop} style={outerStyle}
      onPressIn={() => to(0.94)} onPressOut={() => to(1)}>
      <Animated.View style={[{ transform: [{ scale: s }] }, style]}>{children}</Animated.View>
    </Pressable>
  );
}

/* ───────────── Sheet menu dari bawah ───────────── */
// items: [{ icon, label, danger, onPress }]
export function SheetMenu({ visible, onClose, items }) {
  const { c } = useTheme();
  const y = useRef(new Animated.Value(260)).current;
  const o = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!visible) return;
    y.setValue(260); o.setValue(0);
    Animated.parallel([
      Animated.spring(y, { toValue: 0, friction: 9, tension: 70, useNativeDriver: ND }),
      Animated.timing(o, { toValue: 1, duration: 180, useNativeDriver: ND }),
    ]).start();
  }, [visible, y, o]);
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={{ flex: 1, backgroundColor: '#020617aa', justifyContent: 'flex-end', opacity: o }}>
        <Pressable onPress={onClose} style={StyleSheet.absoluteFill} />
        <Animated.View style={{ transform: [{ translateY: y }], padding: 10, gap: 8, width: '100%', maxWidth: 520, alignSelf: 'center' }}>
          <View style={{ backgroundColor: c.surface, borderRadius: 16, overflow: 'hidden' }}>
            {items.map((it, i) => (
              <Pressable key={it.label} onPress={() => { onClose(); it.onPress(); }}
                style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 15, paddingHorizontal: 18,
                  backgroundColor: pressed ? c.screen : 'transparent', borderTopWidth: i ? StyleSheet.hairlineWidth : 0, borderTopColor: c.edge })}>
                <FontAwesome6 name={it.icon} size={16} color={it.danger ? '#dc2626' : c.link} />
                <Text style={{ fontSize: 15, color: it.danger ? '#dc2626' : c.ink }}>{it.label}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable onPress={onClose} style={({ pressed }) => ({ backgroundColor: pressed ? c.screen : c.surface, borderRadius: 16, paddingVertical: 15, alignItems: 'center' })}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: c.link }}>Batal</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

/* ───────────── Kolom isian dengan label melayang ───────────── */
export function FloatField({ label, value, onChangeText, multiline, maxLength, counter, last, ...rest }) {
  const { c } = useTheme();
  const [focus, setFocus] = useState(false);
  const up = useRef(new Animated.Value(value ? 1 : 0)).current;   // label naik
  const glow = useRef(new Animated.Value(0)).current;             // garis fokus
  useEffect(() => { Animated.timing(up, { toValue: focus || value ? 1 : 0, duration: 140, useNativeDriver: false }).start(); }, [focus, value, up]);
  useEffect(() => { Animated.timing(glow, { toValue: focus ? 1 : 0, duration: 180, useNativeDriver: false }).start(); }, [focus, glow]);
  const top = up.interpolate({ inputRange: [0, 1], outputRange: [17, 7] });
  const size = up.interpolate({ inputRange: [0, 1], outputRange: [15, 11] });
  const color = glow.interpolate({ inputRange: [0, 1], outputRange: [c.secondary, '#2563eb'] });
  const width = glow.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  return (
    <View style={{ paddingHorizontal: 16, minHeight: 58, borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth, borderBottomColor: c.edge }}>
      <Animated.Text pointerEvents="none" style={{ position: 'absolute', left: 16, top, fontSize: size, color }}>{label}</Animated.Text>
      <TextInput {...rest} value={value} onChangeText={onChangeText} multiline={multiline} maxLength={maxLength}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} placeholderTextColor={c.secondary}
        style={[{ paddingTop: 26, paddingBottom: 9, fontSize: 15, color: c.ink }, multiline && { minHeight: 74, textAlignVertical: 'top' },
          Platform.select({ web: { outlineStyle: 'none' }, default: {} })]} />
      {counter && maxLength ? <Text style={{ position: 'absolute', right: 16, bottom: 6, fontSize: 10, color: c.secondary }}>{value.length}/{maxLength}</Text> : null}
      <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 0, bottom: 0, height: 2, width, backgroundColor: '#2563eb' }} />
    </View>
  );
}

/* ───────────── Bar judul: Batal · Judul · Selesai ───────────── */
export function NavBar({ title, left = 'Batal', right = 'Selesai', onLeft, onRight, rightDisabled, busy }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, marginBottom: 6 }}>
      <Pressable onPress={onLeft} hitSlop={10} style={{ minWidth: 76 }}>
        <Text style={{ color: c.link, fontSize: 15 }}>{left}</Text>
      </Pressable>
      <Text style={{ color: c.ink, fontSize: 16, fontWeight: '700' }}>{title}</Text>
      <Pressable onPress={onRight} disabled={rightDisabled} hitSlop={10} style={{ minWidth: 76, alignItems: 'flex-end' }}>
        <Text style={{ color: rightDisabled ? c.secondary : c.link, fontSize: 15, fontWeight: '700', opacity: rightDisabled ? 0.6 : 1 }}>
          {busy ? 'Menyimpan…' : right}
        </Text>
      </Pressable>
    </View>
  );
}