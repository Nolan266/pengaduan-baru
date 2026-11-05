// Batas unggahan, pengecil foto otomatis, dan penyusun file untuk dikirim ke server.
import { Platform } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';

export const MAX_FOTO = 5;

export const MAX_FOTO_MB = 2;

export const MAX_VIDEO_MB = 30;

export const MAX_VIDEO_DETIK = 30;

export const MB = 1024 * 1024;

const sizeOf = async (uri) => { try { return (await (await fetch(uri)).blob()).size; } catch { return null; } };

// Kecilkan foto: sisi terpanjang <= maxSide, JPEG. Mendukung API baru & lama expo-image-manipulator.
async function renderJpeg(uri, w, h, maxSide, quality) {
  const resize = w && h ? (w >= h ? { width: Math.min(w, maxSide) } : { height: Math.min(h, maxSide) }) : { width: maxSide };
  const M = ImageManipulator;
  if (M.ImageManipulator && M.ImageManipulator.manipulate) {
    const ctx = M.ImageManipulator.manipulate(uri);
    ctx.resize(resize);
    const img = await ctx.renderAsync();
    return img.saveAsync({ compress: quality, format: M.SaveFormat.JPEG });
  }
  return M.manipulateAsync(uri, [{ resize }], { compress: quality, format: M.SaveFormat.JPEG });
}

// Dicoba bertahap makin kecil sampai <= 2 MB
export async function shrinkPhoto(asset) {
  for (const [maxSide, quality] of [[1600, 0.7], [1280, 0.55], [1000, 0.4]]) {
    const out = await renderJpeg(asset.uri, asset.width, asset.height, maxSide, quality);
    const size = await sizeOf(out.uri);
    if (size == null || size <= MAX_FOTO_MB * MB) return out;
  }
  throw new Error('Foto terlalu besar');
}

export const MAX_AVATAR_MB = 4;

// Foto profil: dikecilkan ke 800 px (JPEG), biasanya hanya 100–400 KB. Batas akhir 4 MB.
export async function shrinkAvatar(asset) {
  for (const [side, quality] of [[800, 0.8], [640, 0.65], [480, 0.5]]) {
    const out = await renderJpeg(asset.uri, asset.width, asset.height, side, quality);
    const size = await sizeOf(out.uri);
    if (size == null || size <= MAX_AVATAR_MB * MB) return out;
  }
  throw new Error(`Foto profil terlalu besar. Maksimal ${MAX_AVATAR_MB} MB.`);
}

export const addFile = async (fd, field, uri, name, type) => {
  if (Platform.OS === 'web') {
    const blob = await (await fetch(uri)).blob();
    fd.append(field, blob.type ? blob : new Blob([blob], { type }), name);
  } else {
    fd.append(field, { uri, name, type });
  }
};