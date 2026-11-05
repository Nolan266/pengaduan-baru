// Navigasi tab bawah dengan badge notifikasi + animasi halus.
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from './theme';

const TABS = [
  ['home', 'house', 'Beranda'],
  ['reports', 'file-lines', 'Aduan'],
  ['notifications', 'bell', 'Notif'],
  ['profile', 'user', 'Profil'],
];
const IND_W = 28; // lebar garis penanda di atas tab aktif

// Badge membal setiap jumlahnya berubah
function Badge({ count }) {
  const s = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (count > 0) {
      s.setValue(0.4);
      Animated.spring(s, { toValue: 1, friction: 4, tension: 180, useNativeDriver: false }).start();
    }
  }, [count, s]);
  if (!(count > 0)) return null;
  return (
    <Animated.View
      style={{
        position: 'absolute', top: -5, right: 2, minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 3,
        backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center',
        transform: [{ scale: s }],
      }}
    >
      <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>{count > 9 ? '9+' : count}</Text>
    </Animated.View>
  );
}

function TabItem({ icon, label, active, badge, onPress, c }) {
  const p = useRef(new Animated.Value(active ? 1 : 0)).current; // 0 = tidak aktif, 1 = aktif
  const press = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(p, { toValue: active ? 1 : 0, friction: 5, tension: 150, useNativeDriver: false }).start();
  }, [active, p]);

  const to = (v) => Animated.spring(press, { toValue: v, friction: 6, tension: 220, useNativeDriver: false }).start();
  const clamp = { extrapolate: 'clamp' };

  return (
    <Pressable onPress={onPress} onPressIn={() => to(0.88)} onPressOut={() => to(1)} style={{ flex: 1, alignItems: 'center' }}>
      <Animated.View style={{ alignItems: 'center', transform: [{ scale: press }] }}>
        <View style={{ width: 48, height: 28, alignItems: 'center', justifyContent: 'center' }}>
          {/* Latar pil lembut di belakang ikon aktif */}
          <Animated.View
            style={{
              position: 'absolute', width: 48, height: 28, borderRadius: 14, backgroundColor: c.link,
              opacity: p.interpolate({ inputRange: [0, 1], outputRange: [0, 0.14], ...clamp }),
              transform: [{ scaleX: p.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
            }}
          />
          {/* Ikon naik sedikit dan membesar tipis saat aktif; warna berubah halus (crossfade) */}
          <Animated.View
            style={{
              transform: [
                { translateY: p.interpolate({ inputRange: [0, 1], outputRange: [0, -1] }) },
                { scale: p.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) },
              ],
            }}
          >
            <Animated.View style={{ opacity: p.interpolate({ inputRange: [0, 1], outputRange: [1, 0], ...clamp }) }}>
              <FontAwesome6 name={icon} size={17} color={c.secondary} />
            </Animated.View>
            <Animated.View style={{ position: 'absolute', opacity: p.interpolate({ inputRange: [0, 1], outputRange: [0, 1], ...clamp }) }}>
              <FontAwesome6 name={icon} size={17} color={c.link} />
            </Animated.View>
          </Animated.View>
          <Badge count={badge} />
        </View>
        <Animated.Text
          style={{
            fontSize: 10, marginTop: 2, fontWeight: active ? '700' : '500',
            color: p.interpolate({ inputRange: [0, 1], outputRange: [c.secondary, c.link], ...clamp }),
          }}
        >
          {label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

export function TabBar({ page, go, badges = {} }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const [w, setW] = useState(0);

  const idx = TABS.findIndex(([id]) => id === page);
  const pos = useRef(new Animated.Value(Math.max(idx, 0))).current;
  const indOpacity = useRef(new Animated.Value(idx >= 0 ? 1 : 0)).current;

  // Garis penanda meluncur ke tab yang dipilih
  useEffect(() => {
    if (idx >= 0) Animated.spring(pos, { toValue: idx, friction: 8, tension: 120, useNativeDriver: false }).start();
    Animated.timing(indOpacity, { toValue: idx >= 0 ? 1 : 0, duration: 180, useNativeDriver: false }).start();
  }, [idx, pos, indOpacity]);

  const tabW = w / TABS.length;
  const translateX = pos.interpolate({
    inputRange: TABS.map((_, i) => i),
    outputRange: TABS.map((_, i) => i * tabW + (tabW - IND_W) / 2),
  });

  return (
    <View
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      style={{
        backgroundColor: c.surface, borderTopWidth: 1, borderTopColor: c.edge,
        paddingTop: 8, paddingBottom: Math.max(insets.bottom, 8),
      }}
    >
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute', top: -1, left: 0, width: IND_W, height: 3,
          borderBottomLeftRadius: 3, borderBottomRightRadius: 3, backgroundColor: c.link,
          opacity: indOpacity, transform: [{ translateX }],
        }}
      />
      <View style={{ flexDirection: 'row' }}>
        {TABS.map(([id, icon, label]) => (
          <TabItem key={id} icon={icon} label={label} c={c} active={page === id} badge={badges[id] || 0} onPress={() => go(id)} />
        ))}
      </View>
    </View>
  );
}