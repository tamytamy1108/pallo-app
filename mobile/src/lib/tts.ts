/**
 * 영어 · 한국어 읽어 주기 (기기 음성 expo-speech) 한 곳.
 * - 읽는 중일 때만 멈추고 새로 읽어요. 아이폰은 '멈춤' 바로 뒤에 '읽기'를 보내면 새로 읽는 줄까지 중간에 끊길 때가 있어서,
 *   한 줄씩 이어 읽을 때(앞 줄이 다 끝난 뒤)는 멈춤을 보내지 않아요.
 * - 끝난 까닭을 알려 줘요: 다 읽음(done) · 우리가 멈춤(cancelled) · 다른 줄이 끼어듦(replaced) · 저절로 끊김(stopped) · 오류(error).
 *   이어 읽기(readLines)는 저절로 끊긴 줄을 한 번 더 읽어요.
 * 멈출 때는 Tts.stop() 대신 stopSpeaking() 을 써요 — 그래야 '우리가 멈췄다'를 알아요.
 * 담당: 공통. 레슨 · 리스닝 룸이 같이 써요.
 */
import * as Tts from 'expo-speech';

export type SpeakEnd = 'done' | 'cancelled' | 'replaced' | 'stopped' | 'error';
export type SpeakOpts = { language?: string; rate?: number; pitch?: number; onEnd?: (why: SpeakEnd) => void };

/** 지금 읽는 줄을 끝내는 함수 (읽는 게 없으면 null) */
let current: ((why: SpeakEnd) => void) | null = null;

/** 지금 읽는 중인지 (시계 째깍 소리가 읽는 소리를 덮지 않게) */
export const isSpeaking = () => current != null;

/** 멈춘 바로 뒤 새 줄을 보내기 전 잠깐 (아이폰이 멈춤을 다 끝내고 새 줄을 받게) */
const AFTER_STOP_MS = 80;

/** 읽어 주기. 읽던 게 있으면 멈추고 이것부터 */
export function speak(text: string, { language = 'en-US', rate = 0.92, pitch, onEnd }: SpeakOpts = {}) {
  const busy = current != null;
  if (busy) {
    current?.('replaced');
    void Tts.stop();
  }
  let ended = false;
  const end = (why: SpeakEnd) => {
    if (ended) return;
    ended = true;
    if (current === end) current = null;
    onEnd?.(why);
  };
  current = end;
  const send = () => {
    if (ended) return; // 기다리는 사이 멈췄거나 다른 줄이 끼어들었어요
    Tts.speak(text.replace(/[’‘]/g, "'"), { language, rate, pitch, onDone: () => end('done'), onStopped: () => end('stopped'), onError: () => end('error') });
  };
  if (busy) setTimeout(send, AFTER_STOP_MS);
  else send();
}

/** 읽던 것 멈추기 (읽는 게 없으면 아무것도 안 보내요) */
export function stopSpeaking() {
  if (!current) return;
  current('cancelled');
  void Tts.stop();
}

/**
 * 여러 줄을 차례로 읽어요. onLine(i): 이제 i 번째 줄 · onFinish(): 다 읽었거나 멈췄을 때 (한 번만).
 * 돌려주는 함수를 부르면 멈춰요. 저절로 끊긴 줄은 한 번 더 읽고, 오류 난 줄은 건너뛰어요.
 * 다른 소리가 끼어들거나(듣기 단추 등) stopSpeaking() 이 불리면 거기서 끝나요.
 */
export function readLines(
  lines: string[],
  { rate = 0.92, gapMs = 250, onLine, onFinish }: { rate?: number | (() => number); gapMs?: number; onLine?: (i: number) => void; onFinish?: () => void },
) {
  let alive = true;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const finish = () => {
    if (!alive) return;
    alive = false;
    clearTimeout(timer);
    onFinish?.();
  };
  const step = (i: number, retried: boolean) => {
    if (!alive) return;
    if (i >= lines.length) {
      finish();
      return;
    }
    onLine?.(i);
    speak(lines[i], {
      rate: typeof rate === 'function' ? rate() : rate,
      onEnd: (why) => {
        if (!alive) return;
        if (why === 'cancelled' || why === 'replaced') return finish();
        const again = why === 'stopped' && !retried;
        timer = setTimeout(() => step(again ? i : i + 1, again), gapMs);
      },
    });
  };
  step(0, false);
  return () => {
    if (!alive) return;
    finish();
    stopSpeaking();
  };
}
