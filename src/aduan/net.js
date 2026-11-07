// Deteksi koneksi dan badge "offline".
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { FontAwesome6 } from '@expo/vector-icons';
import { Txt } from './ui';

export function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => NetInfo.addEventListener((s) =>
    setOnline(s.isConnected !== false && s.isInternetReachable !== false)), []);
  return online;
}

export function OfflineBadge() {
  const online = useOnline();
  if (online) return null;
  return (
    <View style={{ alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: '#fef3c7', borderColor: '#f59e0b', borderWidth: 1, borderRadius: 999,
      paddingVertical: 5, paddingHorizontal: 12 }}>
      <FontAwesome6 name="wifi" size={11} color="#92400e" />
      <Txt small bold style={{ color: '#92400e' }}>Anda offline, coba sambungkan ke internet</Txt>
    </View>
  );
}