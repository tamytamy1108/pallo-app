/**
 * 리스닝 룸 재생기 (프로토타입 lrPlay · lrSay): 영어 듣기 → 따라 말해 보세요 3·2·1 → 뜻 듣기 → 다음 문장.
 * 소리는 기기 음성(expo-speech) — 영어는 en-US, 뜻은 한국어 음성. 실서비스는 원어민 녹음(25 `/audio/:sentenceId`) 권장.
 * 소리 끄기(15분)면 읽지 않고 같은 길이만큼 기다리며 글로 따라가요.
 */
import { useEffect, useRef, useState } from 'react';

import type { ListenItem } from '@/data/library';
import { getLearnPrefs } from '@/state/learn-prefs';
import { speak, stopSpeaking } from '@/lib/tts';

import { listenPrefs } from './listen-prefs';

/** 다 읽으면(또는 멈추거나 오류 · 너무 오래 걸리면) 끝나요. 저절로 끊긴 줄은 한 번 더 읽어요 (lib/tts) */
function sayAsync(text: string, lang: 'en-US' | 'ko-KR', rate: number) {
  return new Promise<void>((resolve) => {
    let done = false;
    const end = () => {
      if (done) return;
      done = true;
      resolve();
    };
    if (getLearnPrefs().noListen) {
      setTimeout(end, 900 + text.length * 45);
      return;
    }
    let retried = false;
    const go = () =>
      speak(text, {
        language: lang,
        rate,
        onEnd: (why) => {
          if (why === 'stopped' && !retried) {
            retried = true;
            setTimeout(() => !done && go(), 250);
            return;
          }
          end();
        },
      });
    go();
    // 소식이 안 오면 넘어가요 (느린 속도 · 긴 문장은 더 기다려요)
    setTimeout(end, Math.max(12000, 3000 + (text.length * 110) / rate));
  });
}

type State = { i: number; playing: boolean; phase: string; reveal: boolean; heard: Set<string> };

/** list(): 지금 재생 목록 (필터 · 섞기 적용) — 매 문장마다 새로 읽어요 */
export function useListenPlayer(list: () => ListenItem[]) {
  // st: 재생 중 바로바로 읽고 쓰는 값 · view: 화면에 그릴 복사본 (ref 를 그리는 중에 읽지 않게)
  const [view, setView] = useState<State>(() => ({ i: 0, playing: false, phase: '', reveal: false, heard: new Set() }));
  const st = useRef<State>(view);
  const tok = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listRef = useRef(list);
  useEffect(() => {
    listRef.current = list;
  });

  const set = (patch: Partial<State>) => {
    Object.assign(st.current, patch);
    setView({ ...st.current, heard: new Set(st.current.heard) });
  };
  const wait = (ms: number) =>
    new Promise<void>((r) => {
      timer.current = setTimeout(r, ms);
    });

  const stop = () => {
    tok.current += 1;
    if (timer.current) clearTimeout(timer.current);
    stopSpeaking();
    set({ playing: false });
  };

  const play = async (start: number) => {
    const t = ++tok.current;
    stopSpeaking();
    set({ playing: true, i: start, reveal: false, phase: '' });
    const alive = () => st.current.playing && t === tok.current;
    while (alive()) {
      const items = listRef.current();
      if (!items.length) break;
      if (st.current.i >= items.length) st.current.i = 0;
      const it = items[st.current.i];
      const P = listenPrefs.get();
      if (P.order === 'ko-en') {
        set({ phase: '뜻 듣기' });
        await sayAsync(it.ko, 'ko-KR', 1);
        if (!alive()) return;
        set({ phase: '영어로 먼저 말해 보세요' });
        await wait(1800);
        if (!alive()) return;
        set({ reveal: true });
      }
      for (let r = 0; r < P.rep; r++) {
        set({ phase: P.rep > 1 ? `영어 듣기 ${r + 1}/${P.rep}` : '영어 듣기' });
        await sayAsync(it.en, 'en-US', P.rate);
        if (!alive()) return;
        for (let k = P.gap; k > 0; k--) {
          set({ phase: `따라 말해 보세요 · ${k}` });
          await wait(1000);
          if (!alive()) return;
        }
      }
      if (P.order === 'en-ko') {
        set({ phase: '뜻 듣기' });
        await sayAsync(it.ko, 'ko-KR', 1);
        if (!alive()) return;
      }
      st.current.heard.add(it.en);
      await wait(450);
      if (!alive()) return;
      const n = listRef.current().length || 1;
      set({ i: (st.current.i + 1) % n, reveal: false, phase: '' });
      if (!listenPrefs.get().auto) {
        set({ playing: false });
        return;
      }
    }
    if (t === tok.current) set({ playing: false });
  };

  // 화면을 닫으면 멈춰요
  useEffect(
    () => () => {
      tok.current += 1;
      if (timer.current) clearTimeout(timer.current);
      stopSpeaking();
    },
    [],
  );

  return { state: view, play, stop, set };
}
