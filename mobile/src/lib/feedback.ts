/**
 * 효과음 · 진동. 버튼 · 정답 · 오답 · 축하 등에서 불러요 (docs/pages/03-lesson.md '효과음', 08-common '효과음').
 * 소리는 프로토타입 SFX(Web Audio tone())를 같은 파형 · 소리 크기 곡선으로 구운 WAV 예요 (assets/sfx — 임시, 사운드 디자이너 음원으로 교체).
 * 담당: 공통 부품. 함수 이름 · 인자는 바꾸지 않아요(늘리기만).
 */
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { createStore } from '@/lib/store';

/**
 * 프로토타입 이름과 짝: hop=boing(노랑 팔로 깡충) · big=pop(노란 큰 버튼 '뿅') · toggle=pluck(켜고 끄기 · 좋아요 '띵')
 * · card=key(단어 카드 '딱') · quit=sad(그만하기 트롬본) · nav(아래 탭 바 '통') · pick(칩 고르기 '뽁') · soft(글자 링크 '톡')
 */
export type Sfx = 'correct' | 'wrong' | 'hop' | 'peek' | 'save' | 'fanfare' | 'quit' | 'tap' | 'back' | 'tab' | 'big' | 'toggle' | 'open' | 'send' | 'card' | 'nav' | 'pick' | 'soft';
export type HapticKind = 'tap' | 'select' | 'success' | 'warning' | 'error';

const FILES = {
  tap: require('@/assets/sfx/tap.wav'),
  correct: require('@/assets/sfx/correct.wav'),
  wrong: require('@/assets/sfx/wrong.wav'),
  hop: require('@/assets/sfx/hop.wav'),
  peek: require('@/assets/sfx/peek.wav'),
  save: require('@/assets/sfx/save.wav'),
  fanfare: require('@/assets/sfx/fanfare.wav'),
  quit: require('@/assets/sfx/quit.wav'),
  back: require('@/assets/sfx/back.wav'),
  tab: require('@/assets/sfx/tab.wav'),
  big: require('@/assets/sfx/big.wav'),
  toggle: require('@/assets/sfx/toggle.wav'),
  open: require('@/assets/sfx/open.wav'),
  send: require('@/assets/sfx/send.wav'),
  nav: require('@/assets/sfx/nav.wav'),
  pick: require('@/assets/sfx/pick.wav'),
  soft: require('@/assets/sfx/soft.wav'),
  'card-0': require('@/assets/sfx/card-0.wav'),
  'card-1': require('@/assets/sfx/card-1.wav'),
  'card-2': require('@/assets/sfx/card-2.wav'),
  'note-0': require('@/assets/sfx/note-0.wav'),
  'note-1': require('@/assets/sfx/note-1.wav'),
  'note-2': require('@/assets/sfx/note-2.wav'),
  'note-3': require('@/assets/sfx/note-3.wav'),
  'note-4': require('@/assets/sfx/note-4.wav'),
  'note-5': require('@/assets/sfx/note-5.wav'),
  'note-6': require('@/assets/sfx/note-6.wav'),
} satisfies Record<string, number>;
type SfxFile = keyof typeof FILES;

const SOUND_KEY = 'pallo-sound';

/** 효과음 켜고 끄기 (설정 › 효과음). 웹은 프로토타입처럼 기기에 저장해요 */
const soundStore = createStore({ on: readSaved() });
// React Compiler 가 x.use() 를 React use() 로 보지 않게 useXxx 이름으로 꺼내 써요
const useSoundStore = soundStore.use;
export const useSfxOn = () => useSoundStore((s) => s.on);
export const setSfxOn = (on: boolean) => {
  soundStore.set({ on });
  if (Platform.OS === 'web') {
    try {
      globalThis.localStorage?.setItem(SOUND_KEY, on ? 'on' : 'off');
    } catch {
      // 저장 못 해도 지금 켜고 끄기는 돼요
    }
  }
};

function readSaved() {
  if (Platform.OS !== 'web') return true;
  try {
    return globalThis.localStorage?.getItem(SOUND_KEY) !== 'off';
  } catch {
    return true;
  }
}

// 소리마다 플레이어 하나 (처음 울릴 때 만들어 두고 계속 다시 써요)
const players = new Map<SfxFile, AudioPlayer>();
function player(file: SfxFile) {
  let p = players.get(file);
  if (!p) {
    p = createAudioPlayer(FILES[file]);
    players.set(file, p);
  }
  return p;
}

let cardTurn = 0;
// 그 밖의 버튼은 도레미솔라시도 중 하나 — 같은 버튼(같은 글자)은 늘 같은 음 (프로토타입 tapv · TAP_NOTES)
function noteFor(key: string): SfxFile {
  let h = 0;
  for (let i = 0; i < key.length; i += 1) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return `note-${h % 7}` as SfxFile;
}

/**
 * 효과음 울리기. 설정에서 끄면 아무 소리도 안 나요.
 * @param noteKey 'tap' 일 때 버튼 글자를 넘기면 버튼마다 다른 음 (안 넘기면 기본 '톡')
 */
export function sfx(name: Sfx, noteKey?: string) {
  if (pending) {
    // 버튼 기본 소리가 기다리는 중이면 그건 취소하고 이 소리 하나만 (프로토타입 tapPend). 그냥 'tap' 이면 기본 소리의 음을 써요
    clearTimeout(pending.timer);
    if (name === 'tap' && !noteKey) [name, noteKey] = [pending.name, pending.key];
    pending = null;
  }
  play(name, noteKey);
}

let pending: { timer: ReturnType<typeof setTimeout>; name: Sfx; key?: string } | null = null;

/**
 * 누르는 것마다 나는 기본 소리 (components/ui/pressable 이 불러요).
 * 바로 울리지 않고 한 틱 기다려서, 그 버튼이 sfx(...) 로 자기 소리를 내면 기본 소리는 빼요.
 */
export function tapSound(name: Sfx, key?: string) {
  if (pending) clearTimeout(pending.timer);
  const timer = setTimeout(() => {
    pending = null;
    play(name, key);
  }, 0);
  pending = { timer, name, key };
}

function play(name: Sfx, noteKey?: string) {
  if (!soundStore.get().on) return;
  const file: SfxFile = name === 'card' ? (`card-${cardTurn++ % 3}` as SfxFile) : name === 'tap' && noteKey ? noteFor(noteKey) : name;
  try {
    const p = player(file);
    void p.seekTo(0);
    p.play();
  } catch {
    // 소리를 못 내도 화면 동작은 그대로
  }
}

/** 진동 — 아껴 써요 (정답 · 오답 · 완료 같은 순간에만). 웹은 없어요 */
export function haptic(kind: HapticKind = 'tap') {
  if (Platform.OS === 'web') return;
  if (kind === 'success') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  else if (kind === 'warning') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  else if (kind === 'error') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  else if (kind === 'select') void Haptics.selectionAsync();
  else void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}
