/**
 * 앱에 들어 있는 그림(require) 을 미리 읽어 메모리에 올려 둬요 — 처음 보일 때 늦게 뜨거나 빈 칸으로 보이지 않게.
 * 그림을 그리는 쪽도 cachePolicy 'memory-disk' 여야 미리 읽은 걸 바로 꺼내 써요.
 */
import { Image } from 'expo-image';
import { Image as RNImage } from 'react-native';

// expo-image 가 require 그림을 찾는 것과 같은 주소 (폰: RN resolveAssetSource) — 그래야 미리 읽은 게 그대로 쓰여요
const uriOf = (m: number) => {
  try {
    return typeof RNImage.resolveAssetSource === 'function' ? (RNImage.resolveAssetSource(m)?.uri ?? null) : null;
  } catch {
    return null;
  }
};

/** require 한 그림들의 주소 (겹치는 건 한 번만) */
export const imageUris = (mods: (number | undefined)[]) => [...new Set(mods.filter((m): m is number => typeof m === 'number').map(uriOf).filter((u): u is string => !!u))];

/** 그림들을 읽어요. 실패해도 그냥 넘어가요 (그릴 때 다시 읽어요) */
export const prefetchImages = (mods: (number | undefined)[]) => {
  const list = imageUris(mods);
  return list.length ? Image.prefetch(list, { cachePolicy: 'memory-disk' }).catch(() => false) : Promise.resolve(true);
};
