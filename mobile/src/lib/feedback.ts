/**
 * 효과음 · 진동. 버튼 · 정답 · 오답 · 축하 등에서 불러요 (docs/pages/03-lesson.md '효과음', 08-common '효과음').
 * 담당: 공통 부품 — 소리를 실제로 내는 부분(expo-audio)과 진동(expo-haptics)을 채워요. 함수 이름 · 인자는 바꾸지 않아요.
 */
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { createStore } from '@/lib/store';

export type Sfx = 'correct' | 'wrong' | 'hop' | 'peek' | 'save' | 'fanfare' | 'quit' | 'tap' | 'back' | 'tab' | 'big' | 'toggle' | 'open' | 'send' | 'card';
export type HapticKind = 'tap' | 'select' | 'success' | 'warning' | 'error';

/** 효과음 켜고 끄기 (설정 › 효과음). 기기에 저장해도 돼요 */
const soundStore = createStore({ on: true });
export const useSfxOn = () => soundStore.use((s) => s.on);
export const setSfxOn = (on: boolean) => soundStore.set({ on });

export function sfx(name: Sfx) {
  if (!soundStore.get().on) return;
  void name; // 공통 부품 담당이 소리를 채워요
}

export function haptic(kind: HapticKind = 'tap') {
  if (Platform.OS === 'web') return;
  if (kind === 'success') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  else if (kind === 'warning') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  else if (kind === 'error') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  else if (kind === 'select') void Haptics.selectionAsync();
  else void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}
