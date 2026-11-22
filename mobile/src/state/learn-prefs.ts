/**
 * 학습 대체 흐름: 말하기가 어려워요(noSpeak) · 소리 끄기(noListen). 켜면 15분 동안 유지 (docs/pages/03-lesson.md '대체 흐름').
 * 담당: 레슨 A. 레슨 B · 리스닝 룸 · 설정 › 학습은 읽고 켜고 끄기만 해요.
 * 두 옵션은 같이 켤 수 있고, 다른 문제 · 코너 · 과로 가도 유지돼요. 15분이 지나면 저절로 꺼져요 (프로토타입 ST.noSpeakUntil · noListenUntil).
 */
import { AppState } from 'react-native';

import { createStore } from '@/lib/store';

export const LEARN_PREF_MS = 15 * 60 * 1000;

type Prefs = { noSpeak: boolean; noListen: boolean; noSpeakUntil: number; noListenUntil: number };
const store = createStore<Prefs>({ noSpeak: false, noListen: false, noSpeakUntil: 0, noListenUntil: 0 });

// 가장 먼저 끝나는 시각에 한 번 깨어나 꺼 줘요. 앱이 뒤에 있다 돌아오면(타이머가 늦게 울려도) 바로 다시 확인해요
let timer: ReturnType<typeof setTimeout> | undefined;
function expire() {
  const now = Date.now();
  const s = store.get();
  const noSpeak = s.noSpeakUntil > now;
  const noListen = s.noListenUntil > now;
  if (noSpeak !== s.noSpeak || noListen !== s.noListen) store.set({ ...s, noSpeak, noListen });
  clearTimeout(timer);
  const next = [s.noSpeakUntil, s.noListenUntil].filter((t) => t > now).sort((a, b) => a - b)[0];
  if (next) timer = setTimeout(expire, next - now + 50);
}
AppState.addEventListener('change', (st) => {
  if (st === 'active') expire();
});

export function setNoSpeak(on: boolean) {
  store.set((s) => ({ ...s, noSpeak: on, noSpeakUntil: on ? Date.now() + LEARN_PREF_MS : 0 }));
  expire();
}

export function setNoListen(on: boolean) {
  store.set((s) => ({ ...s, noListen: on, noListenUntil: on ? Date.now() + LEARN_PREF_MS : 0 }));
  expire();
}

/** 지금 켜져 있는지 (15분이 지나면 저절로 꺼져요) */
export function useLearnPrefs() {
  const noSpeak = store.use((s) => s.noSpeak);
  const noListen = store.use((s) => s.noListen);
  return { noSpeak, noListen };
}

/** 누르는 순간처럼 화면 밖에서 읽을 때 */
export function getLearnPrefs() {
  const now = Date.now();
  const s = store.get();
  return { noSpeak: s.noSpeakUntil > now, noListen: s.noListenUntil > now };
}

/** 남은 시간 (ms) — 설정 › 학습에서 '12분 남음'처럼 보여 줄 때 */
export function learnPrefLeft(kind: 'noSpeak' | 'noListen') {
  const s = store.get();
  return Math.max(0, (kind === 'noSpeak' ? s.noSpeakUntil : s.noListenUntil) - Date.now());
}
