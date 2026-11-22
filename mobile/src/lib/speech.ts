import { useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import type { ExpoSpeechRecognitionModuleType } from 'expo-speech-recognition/build/ExpoSpeechRecognitionModule.types';

/*
 * 말하기(음성 인식) 한 곳에 모으기.
 * - 폰: expo-speech-recognition (애플 · 구글의 기기 음성 인식). Expo Go 에는 없는 모듈이라
 *   우리 앱 전용 테스트 앱(개발 빌드)에서만 돌아가요.
 * - 웹: 브라우저 음성 인식 (크롬 · 사파리).
 * 모듈이 없으면 available 이 false 가 되고, 화면은 단어 카드로 풀게 해요.
 */
let Speech: ExpoSpeechRecognitionModuleType | null = null;
try {
  // Expo Go 처럼 모듈이 없는 곳에서는 여기서 오류가 나요 → 말하기 없이 진행
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Speech = require('expo-speech-recognition').ExpoSpeechRecognitionModule;
  if (Speech && !Speech.isRecognitionAvailable()) Speech = null;
} catch {
  Speech = null;
}

export const speechAvailable = Speech !== null;

/** 말하다 이만큼 조용하면 '한 번 말했다'고 보고 채점해요 (듣기는 계속) */
export const PAUSE_MS = 1500;
/** 듣는 중인데 이만큼 아무 소식이 없으면 멈춘 걸로 보고 다시 켜요 (사파리가 가끔 소리 없이 멈춰요) */
export const STUCK_MS = 10000;
/** 10초 안에 이만큼 넘게 저절로 끝나면 뭔가 고장 — 다시 켜기를 그만둬요 */
export const MAX_RESTARTS = 8;

/*
 * 알려진 문제와 대응 (docs/frontend/speech-test-plan.md 에 자세히)
 * - 사파리 '계속 듣기(continuous)'는 첫 문장 뒤 결과가 멈추거나 같은 말을 되풀이해요 → 웹은 한 문장씩 듣고 끝나면 다시 켜요
 * - 사파리는 말을 조각으로 보내요 → 끝난 조각을 모아 이어 붙이고, 되풀이한 조각은 버려요
 * - 끝나지 않은 채 또 켜면 더 이상 안 들어요 → 새로 켜기 전에 이전 듣기를 완전히 끝내요
 * - 소리 없이 멈춤 → STUCK_MS 동안 소식이 없으면 다시 켜요
 * - 앱이 뒤로 가거나 전화가 오면 → 듣기를 멈춰요
 */
export type SpeechProblem = 'unavailable' | 'denied' | 'no-speech' | 'network' | 'interrupted' | 'other';

type Handlers = {
  /** 말하는 동안 계속: 버튼을 누른 뒤 들린 말 전체. alternatives: 폰 음성 인식이 함께 준 '다르게 들었을 수도 있는' 후보들 */
  onText: (text: string, alternatives?: string[]) => void;
  /** 말하다 잠깐 멈췄을 때 (채점용) */
  onPause?: (text: string) => void;
  /** 사용자가 멈추거나 문제가 끝나 듣기가 완전히 끝났을 때 */
  onEnd?: (text: string) => void;
};

/**
 * 말해서 맞추기.
 * - start() 하면 사용자가 stop() 할 때까지 계속 들어요. 폰 · 브라우저가 스스로 듣기를 끝내도 조용히 다시 켜요.
 * - 새로 켜기 전에 이전 듣기를 완전히 끝내요 (끝나지 않은 채 또 켜면 브라우저가 더 이상 안 들어요).
 */
export function useSpeech({ onText, onPause, onEnd }: Handlers) {
  const [listening, setListening] = useState(false);
  const [problem, setProblem] = useState<SpeechProblem | null>(speechAvailable ? null : 'unavailable');
  const handlers = useRef<Handlers>({ onText, onPause, onEnd });
  const want = useRef(false); // 사용자가 듣기를 켜 둔 상태
  const active = useRef(false); // 음성 인식이 실제로 도는 중
  const ended = useRef<(() => void) | null>(null);
  const hints = useRef<string[]>([]);
  // 들린 말 = 이전 듣기들에서 모은 말(prefix) + 이번 듣기의 말
  const prefix = useRef('');
  const committed = useRef(''); // 웹: 이번 듣기에서 끝난 조각들
  const full = useRef('');
  const pause = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stuck = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restarts = useRef<number[]>([]);

  /** 소식이 올 때마다 '멈춤 감시' 시계를 다시 맞춰요 */
  const watch = () => {
    if (stuck.current) clearTimeout(stuck.current);
    stuck.current = setTimeout(() => {
      if (want.current && active.current) Speech?.abort(); // end → 다시 켜기
    }, STUCK_MS);
  };
  const clearTimers = () => {
    if (pause.current) clearTimeout(pause.current);
    if (stuck.current) clearTimeout(stuck.current);
  };

  useEffect(() => {
    handlers.current = { onText, onPause, onEnd };
  });

  const run = () => {
    if (!Speech) return;
    committed.current = '';
    // 웹(특히 사파리)은 continuous 가 고장 나기 쉬워서 한 문장씩 듣고, 끝나면 우리가 다시 켜요
    Speech.start({ lang: 'en-US', interimResults: true, continuous: Platform.OS !== 'web', addsPunctuation: false, contextualStrings: hints.current, maxAlternatives: Platform.OS === 'web' ? 1 : 3 });
    watch();
  };

  useEffect(() => {
    if (!Speech) return;
    const subs = [
      Speech.addListener('start', () => {
        active.current = true;
        setListening(true);
        watch();
      }),
      Speech.addListener('result', (e) => {
        const piece = (e.results[0]?.transcript ?? '').trim();
        let session = piece;
        if (Platform.OS === 'web') {
          // 웹은 말을 조각조각 보내요. 끝난 조각을 모아 두고 지금 조각을 뒤에 붙여요 (처음부터 다시 보내는 브라우저는 그대로)
          const c = committed.current;
          const lc = c.toLowerCase();
          const lp = piece.toLowerCase();
          if (!c || lp.startsWith(lc))
            session = piece; // 처음부터 다시 보낸 경우
          else if (lc.endsWith(lp))
            session = c; // 같은 조각을 되풀이한 경우
          else session = `${c} ${piece}`;
          if (e.isFinal) committed.current = session;
        }
        full.current = `${prefix.current} ${session}`.trim();
        watch();
        // 폰: 후보가 여럿이면 함께 넘겨요 (웹은 후보를 섞어 보내서 쓰지 않아요)
        const alts = Platform.OS === 'web' ? [] : e.results.slice(1).map((r) => `${prefix.current} ${r.transcript}`.trim());
        handlers.current.onText(full.current, alts);
        if (pause.current) clearTimeout(pause.current);
        pause.current = setTimeout(() => handlers.current.onPause?.(full.current), PAUSE_MS);
      }),
      Speech.addListener('error', (e) => {
        if (e.error === 'aborted' || e.error === 'no-speech' || e.error === 'speech-timeout') return; // 조용했을 뿐 → 다시 켜요
        const fatal = ['not-allowed', 'service-not-allowed', 'language-not-supported', 'interrupted', 'audio-capture'].includes(e.error);
        if (fatal) want.current = false;
        setProblem(e.error === 'not-allowed' || e.error === 'service-not-allowed' ? 'denied' : e.error === 'network' ? 'network' : e.error === 'interrupted' ? 'interrupted' : 'other');
      }),
      Speech.addListener('end', () => {
        active.current = false;
        ended.current?.();
        ended.current = null;
        if (want.current) {
          // 사용자가 끄지 않았는데 끝났어요 → 들린 말은 이어 가고 조용히 다시 켜요
          const now = Date.now();
          restarts.current = [...restarts.current.filter((t) => now - t < 10000), now];
          if (restarts.current.length <= MAX_RESTARTS) {
            prefix.current = full.current;
            setTimeout(() => want.current && !active.current && run(), 150);
            return;
          }
          want.current = false; // 너무 자주 끊겨요 → 그만두고 다시 눌러 달라고 해요
          setProblem('other');
        }
        clearTimers();
        setListening(false);
        handlers.current.onEnd?.(full.current);
      }),
    ];
    // 앱이 뒤로 가면 듣기를 멈춰요 (마이크를 계속 잡고 있지 않게)
    const app = AppState.addEventListener('change', (st) => {
      if (st !== 'active' && want.current) {
        want.current = false;
        Speech?.stop();
      }
    });
    return () => {
      want.current = false;
      subs.forEach((s) => s.remove());
      app?.remove();
      clearTimers();
      Speech?.abort();
    };
    // run · watch 는 ref 만 써서 처음 한 번만 연결해도 돼요
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** 이전 듣기가 남아 있으면 완전히 끝날 때까지 기다려요 (최대 0.8초) */
  const settle = () =>
    new Promise<void>((resolve) => {
      if (!active.current || !Speech) return resolve();
      ended.current = resolve;
      Speech.abort();
      setTimeout(resolve, 800);
    });

  /** hints: 이 문제의 낱말들 — 폰(애플 · 구글) 음성 인식이 이 낱말 쪽으로 더 잘 알아들어요 (웹은 무시) */
  const start = async (wordHints: string[] = []) => {
    if (!Speech) return;
    setProblem(null);
    want.current = false;
    await settle();
    const perm = await Speech.requestPermissionsAsync();
    if (!perm.granted) {
      setProblem('denied');
      return;
    }
    hints.current = wordHints;
    restarts.current = [];
    prefix.current = '';
    full.current = '';
    want.current = true;
    setListening(true);
    run();
  };

  /** 사용자가 멈춤 (또는 문제가 끝남) */
  const stop = () => {
    want.current = false;
    if (active.current) Speech?.stop();
    else if (listening) {
      setListening(false);
      handlers.current.onEnd?.(full.current);
    }
  };

  return { listening, problem, start, stop, available: speechAvailable };
}

/** 문제 화면 아래에 띄울 짧은 안내 */
export const SPEECH_PROBLEM_TEXT: Record<SpeechProblem, string> = {
  unavailable: '이 앱에서는 말하기를 쓸 수 없어요 · 단어 카드로 풀어요',
  denied: '마이크를 허용하면 말로 풀 수 있어요',
  'no-speech': '잘 안 들렸어요 · 한 번 더 말해요',
  network: '인터넷 연결을 확인해 주세요',
  interrupted: '전화나 다른 앱 때문에 멈췄어요 · 다시 눌러요',
  other: '잠깐 문제가 생겼어요 · 한 번 더 눌러요',
};
