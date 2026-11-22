/**
 * 학습 대체 흐름: 말하기가 어려워요(noSpeak) · 소리 끄기(noListen). 켜면 15분 동안 유지 (docs/pages/03-lesson.md '대체 흐름').
 * 담당: 레슨 A. 레슨 B · 리스닝 룸 · 설정 › 학습은 읽고 켜고 끄기만 해요.
 */
import { useEffect, useState } from 'react';

import { createStore } from '@/lib/store';

const FIFTEEN_MIN = 15 * 60 * 1000;
const store = createStore({ noSpeakUntil: 0, noListenUntil: 0 });

export const setNoSpeak = (on: boolean) => store.set((s) => ({ ...s, noSpeakUntil: on ? Date.now() + FIFTEEN_MIN : 0 }));
export const setNoListen = (on: boolean) => store.set((s) => ({ ...s, noListenUntil: on ? Date.now() + FIFTEEN_MIN : 0 }));

/** 지금 켜져 있는지 (15분이 지나면 저절로 꺼져요) */
export function useLearnPrefs() {
  const s = store.use();
  const [now, setNow] = useState(() => Date.now());
  const nextEnd = [s.noSpeakUntil, s.noListenUntil].filter((t) => t > now).sort((a, b) => a - b)[0];
  useEffect(() => {
    if (!nextEnd) return;
    const t = setTimeout(() => setNow(Date.now()), nextEnd - Date.now() + 50);
    return () => clearTimeout(t);
  }, [nextEnd]);
  return { noSpeak: s.noSpeakUntil > now, noListen: s.noListenUntil > now };
}
