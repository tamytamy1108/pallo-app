import { useSyncExternalStore } from 'react';

import { readRaw, removeAllSaved, writeLater } from './device-storage';

/**
 * 기기에 남기는 방법 (createStore 의 두 번째 인자).
 * - key: 파일 이름 (앱 전체에서 하나뿐 · 'pallo-' 는 붙이지 않아요)
 * - version: 저장 모양을 바꿨으면 1 올려요 → 예전 저장은 버리고 처음 값으로 시작해요
 * - save: 저장할 모양으로 (기본: 그대로). 잠깐 쓰는 값(열린 탭 · 반짝임 등)은 여기서 빼요
 * - load: 저장된 값 → 상태 (기본: 객체면 처음 값 위에 덮어요 · 새로 늘린 필드는 처음 값 그대로). 못 쓰는 값이면 initial 을 돌려줘요
 */
export type Persist<T> = {
  key: string;
  version?: number;
  save?: (state: T) => unknown;
  load?: (saved: unknown, initial: T) => T;
};

type Saved = { v: number; d: unknown };

const isPlainObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/** 기본 load: 모양(객체 · 배열 · 글자 …)이 같을 때만 써요 */
function defaultLoad<T>(saved: unknown, initial: T): T {
  if (isPlainObject(initial)) return isPlainObject(saved) ? ({ ...initial, ...saved } as T) : initial;
  if (Array.isArray(initial)) return Array.isArray(saved) ? (saved as T) : initial;
  if (initial === null) return saved as T;
  return typeof saved === typeof initial ? (saved as T) : initial;
}

function hydrate<T>(initial: T, p: Persist<T>): T {
  const raw = readRaw(p.key);
  if (raw == null) return initial;
  try {
    const parsed = JSON.parse(raw) as Partial<Saved>;
    if (!isPlainObject(parsed) || parsed.v !== (p.version ?? 1) || !('d' in parsed)) return initial;
    return (p.load ?? defaultLoad)(parsed.d, initial);
  } catch {
    return initial; // 깨진 파일은 무시하고 처음 값으로 (다음 저장 때 덮어써요)
  }
}

// 기기에 남기는 가게들 — 탈퇴 · 초기화 때 한꺼번에 처음 값으로 돌려요
const persisted: (() => void)[] = [];

/**
 * 아주 작은 전역 상태 (가짜 데이터용). 백엔드가 생기면 서버 데이터(TanStack Query 등)로 바꿔요.
 * - useStore(): 전체 값을 구독해요. / useStore(selector): 고른 값만 구독해요.
 *   ⚠ 화면 · 훅 안에서는 꼭 useStore 로 불러요. `store.use()` 는 React Compiler 가 React 의 use() 로 착각해서
 *   다시 그릴 때 건너뛸 수 있어요 (훅 순서 오류). use 는 옛 이름이라 남겨 둔 거예요.
 * - selector: selector 는 숫자 · 글자 · true/false 처럼 바뀌지 않는 값을 돌려줘야 해요
 *   (매번 새 객체 · 배열을 만들어 돌려주면 화면이 끝없이 다시 그려져요).
 * - opts.persist: 주면 앱을 껐다 켜도 남아요 (lib/device-storage.ts). 앱이 뜰 때 저장된 값으로 시작하고, 바뀔 때마다 저장해요.
 */
export function createStore<T>(initial: T, opts: { persist?: Persist<T> } = {}) {
  const p = opts.persist;
  let state = p ? hydrate(initial, p) : initial;
  const listeners = new Set<() => void>();
  const get = () => state;
  const emit = () => listeners.forEach((l) => l());
  const save = p
    ? () =>
        writeLater(p.key, () => {
          const d = p.save ? p.save(state) : state;
          return d === undefined ? null : JSON.stringify({ v: p.version ?? 1, d } satisfies Saved);
        })
    : () => {};
  const set = (next: T | ((prev: T) => T)) => {
    const value = typeof next === 'function' ? (next as (prev: T) => T)(state) : next;
    const changed = !Object.is(value, state);
    state = value;
    emit();
    if (changed) save();
  };
  if (p) {
    persisted.push(() => {
      state = initial;
      emit();
    });
  }
  const subscribe = (l: () => void) => {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  };
  function use(): T;
  function use<S>(selector: (s: T) => S): S;
  function use<S>(selector?: (s: T) => S) {
    const pick = () => (selector ? selector(state) : state);
    return useSyncExternalStore(subscribe, pick, pick);
  }
  return { get, set, subscribe, use, useStore: use };
}

/** 기기에 저장한 내 기록을 모두 지우고 처음 상태로 (회원 탈퇴 · 개발용 초기화) */
export function clearSavedData() {
  persisted.forEach((reset) => reset());
  removeAllSaved();
}
