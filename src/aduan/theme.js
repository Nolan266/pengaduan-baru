// Tema terang/gelap dan konteks (tema, tarik-untuk-refresh).
import React, { createContext, useContext } from 'react';
import { RefreshControl } from 'react-native';

export const LIGHT = { surface: '#ffffff', screen: '#f8fafc', ink: '#1e293b', secondary: '#64748b', edge: '#e2e8f0',
  title: '#1e3a8a', link: '#2563eb', indigoBg: '#eef2ff', indigoEdge: '#c7d2fe', indigoTitle: '#312e81', indigoText: '#4f46e5' };

export const DARK = { surface: '#1e293b', screen: '#0f172a', ink: '#e2e8f0', secondary: '#a9b8cd', edge: '#334155',
  title: '#bfdbfe', link: '#93c5fd', indigoBg: '#222745', indigoEdge: '#3f4568', indigoTitle: '#bfdbfe', indigoText: '#93c5fd' };

export const ThemeCtx = createContext({ c: LIGHT, dark: false });

export const useTheme = () => useContext(ThemeCtx);

// Tarik layar ke bawah untuk memuat ulang (di web tidak aktif; refresh otomatis tetap jalan)
export const RefreshCtx = createContext({ refreshing: false, onRefresh: () => {} });

export const useRC = () => {
  const { refreshing, onRefresh } = useContext(RefreshCtx);
  return <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />;
};
