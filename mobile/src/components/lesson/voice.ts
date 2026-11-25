import { useEffect, useRef, useState } from 'react';

import { showToast } from '@/components/ui/toast';
import { sfx } from '@/lib/feedback';
import { useSpeech } from '@/lib/speech';
import { getLearnPrefs, setNoListen, setNoSpeak, useLearnPrefs } from '@/state/learn-prefs';
import { speak, stopSpeaking } from '@/lib/tts';

/**
 * 레슨 소리 도우미.
 * - say: 영어로 읽어 줘요. 소리 끄기(15분)면 읽지 않아요 (프로토타입 sayEn). 인물마다 목소리 높이를 조금씩 달리 해요.
 * - useSoundToggle: 위 줄 스피커 버튼 — 15분 동안 소리 끄기 (토스트 '15분 동안 소리를 꺼요')
 * - useDictation: 한 번 말하고 잠깐 멈추면 그 말을 답으로 (스피킹 퀴즈 · 프리토킹 · 키워드)
 */
const PITCH: Record<string, number> = { Lily: 1.15, Sonya: 1.05, Logan: 0.85, Aiden: 0.95 };

export function say(text: string, rate = 0.92, who?: string, onDone?: () => void) {
  if (getLearnPrefs().noListen) {
    if (onDone) setTimeout(onDone, 300);
    return;
  }
  speak(text, { rate, pitch: who ? (PITCH[who] ?? 1) : 1, onEnd: (why) => why !== 'cancelled' && why !== 'replaced' && onDone?.() });
}

export const stopSay = () => stopSpeaking();

export function useSoundToggle() {
  const { noListen } = useLearnPrefs();
  const toggle = () => {
    stopSpeaking();
    sfx('toggle');
    setNoListen(!noListen);
    showToast(noListen ? '소리를 다시 켰어요' : '15분 동안 소리를 꺼요');
  };
  return { soundOff: noListen, toggle };
}

/** 말하기가 어려워요 — 켜고 끄기 + 토스트 (프로토타입 setNoSpeak) */
export function toggleNoSpeak() {
  const on = !getLearnPrefs().noSpeak;
  sfx('toggle');
  setNoSpeak(on);
  showToast(on ? '15분 동안 말하기 문제를 카드 · 고르기로 바꿔요' : '말하기 문제를 다시 켰어요');
}

/**
 * 한 번 말하기: 누르면 듣고, 말하다 1.5초 멈추면 끝 → onDone(들린 말). 다시 누르면 멈춰요.
 * 듣는 동안 들린 말은 text 로 바로 보여 줘요.
 */
export function useDictation(onDone: (text: string) => void) {
  const [text, setText] = useState('');
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  });
  const finished = useRef(false);
  const speech = useSpeech({
    onText: (t) => setText(t),
    onPause: (t) => {
      if (finished.current || !t.trim()) return;
      finished.current = true;
      speech.stop();
      done.current(t.trim());
    },
    onEnd: (t) => {
      if (finished.current || !t.trim()) return;
      finished.current = true;
      done.current(t.trim());
    },
  });
  const toggle = (hints: string[] = []) => {
    if (speech.listening) {
      speech.stop();
      return;
    }
    stopSpeaking();
    finished.current = false;
    setText('');
    void speech.start(hints);
  };
  return { text, setText, listening: speech.listening, problem: speech.problem, available: speech.available, toggle, stop: speech.stop };
}
