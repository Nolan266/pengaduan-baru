// Tombol "Buka di Maps" untuk lokasi aduan.
import React from 'react';
import { Linking } from 'react-native';
import { Btn } from './ui';

// Koordinat yang ditempel app di akhir teks lokasi, mis. "Gang 2 (-7.218912, 112.754539)"
export function parseCoords(text) {
  const m = /\((-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)\)\s*$/.exec(String(text || ''));
  if (!m) return null;
  const lat = Number(m[1]), lng = Number(m[2]);
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null;
}

export function MapButton({ location }) {
  const pos = parseCoords(location);
  const alamat = String(location || '').trim();
  if (!pos && (!alamat || alamat === '-')) return null;
  const query = pos ? `${pos.lat},${pos.lng}` : encodeURIComponent(alamat);
  const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
  return (
    <Btn icon="location-dot" title={pos ? 'Buka titik di Maps' : 'Cari alamat di Maps'}
      onPress={() => Linking.openURL(url).catch(() => {})} style={{ alignSelf: 'flex-start', marginTop: 4 }} />
  );
}