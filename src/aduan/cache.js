// Penyimpanan lokal: draft form dan cache data.
import AsyncStorage from '@react-native-async-storage/async-storage';

export const saveCache = (key, value) => AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => {});
export const clearCache = (key) => AsyncStorage.removeItem(key).catch(() => {});
export const loadCache = async (key, fallback = null) => {
  try { const v = await AsyncStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
};