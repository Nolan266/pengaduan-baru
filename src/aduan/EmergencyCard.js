// Kartu "Nomor Penting": ketuk untuk langsung menelepon.
import React from 'react';
import { View, Text, Pressable, Linking } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { Card, Txt } from './ui';

const NOMOR = [
  { no: '112', label: 'Darurat', icon: 'triangle-exclamation', color: '#dc2626' },
  { no: '110', label: 'Polisi', icon: 'shield-halved', color: '#2563eb' },
  { no: '113', label: 'Damkar', icon: 'fire-extinguisher', color: '#ea580c' },
  { no: '119', label: 'Ambulans', icon: 'truck-medical', color: '#059669' },
  { no: '123', label: 'PLN', icon: 'bolt', color: '#ca8a04' },
];

export function EmergencyCard() {
  return (
    <Card>
      <Txt bold>Nomor Penting</Txt>
      <Txt small secondary style={{ marginTop: 2, marginBottom: 10 }}>
        Untuk keadaan darurat, hubungi langsung. Jangan lewat aduan.
      </Txt>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {NOMOR.map((n) => (
          <Pressable key={n.no} onPress={() => Linking.openURL(`tel:${n.no}`).catch(() => {})}
            style={({ pressed }) => ({ flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12,
              backgroundColor: n.color + '22', opacity: pressed ? 0.7 : 1 })}>
            <FontAwesome6 name={n.icon} size={16} color={n.color} />
            <Text style={{ marginTop: 5, fontSize: 15, fontWeight: '800', color: n.color }}>{n.no}</Text>
            <Text style={{ fontSize: 9, fontWeight: '600', color: n.color }}>{n.label}</Text>
          </Pressable>
        ))}
      </View>
      <Txt secondary style={{ fontSize: 9, marginTop: 8 }}>Nomor nasional; di beberapa daerah bisa berbeda.</Txt>
    </Card>
  );
}