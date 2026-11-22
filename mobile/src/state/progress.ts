/**
 * 학습 진도: 끝낸 단계 · 멈춘 곳(이어서 하기) · 상황 맵 도장 · 오늘 목표. 맞는 API: 19 `/me/progress` · 20 `/me/progress/:lesson/:step`
 * 담당: 레슨 A. 레슨 B · 상황 장면은 끝낼 때 markDone · 멈출 때 savePos, 홈 · 라이브러리는 읽기만 해요.
 * 함수 이름 · 키 모양은 바꾸지 않아요(늘리기만).
 * 실서비스: 서버에 저장해서 앱을 껐다 켜도, 다른 기기에서도 이어져야 해요.
 */
import { createStore } from '@/lib/store';

/** 단계 키: `${레벨}:${과}:${단계 id}` (예: '1:1:pat'). 상황 장면: `scene:${장면 id}`. 단계 id · 장면 id 는 프로토타입 데이터의 id 그대로 */
export const stepKey = (lv: number | string, unit: number | string, step: string) => `${lv}:${unit}:${step}`;
export const sceneKey = (sceneId: string) => `scene:${sceneId}`;

/** 오늘 목표: 학습 2개 (프로토타입 DAILY_GOAL · 홈 '오늘의 학습 목표'와 같은 값) */
export const DAILY_GOAL = 2;

type Progress = {
  done: Record<string, number>;
  pos: Record<string, number>;
  /** 멈춘 곳의 전체 문제 수 ('3/9까지 했어요') */
  posOf: Record<string, number>;
  /** 오늘 처음 끝낸 단계 수 (날짜가 바뀌면 0부터) */
  today: { day: string; n: number };
  /** 최고 기록 (짝 맞추기 걸린 초 · 빠른 답 보너스 등) */
  best: Record<string, number>;
};
const store = createStore<Progress>({ done: {}, pos: {}, posOf: {}, today: { day: '', n: 0 }, best: {} });

const dayOf = (t = Date.now()) => new Date(t).toDateString();

export const useIsDone = (key: string) => store.use((s) => key in s.done);
/** 키 앞부분이 같은 것 중 끝낸 개수 (예: '1:1:' → 1과에서 끝낸 단계 수) */
export const useDoneCount = (prefix: string) => store.use((s) => Object.keys(s.done).filter((k) => k.startsWith(prefix)).length);
export const isDone = (key: string) => key in store.get().done;

/** 끝냈다고 기록해요. 처음 끝낸 거면 true (포인트 · 오늘 목표는 처음일 때만) */
export function markDone(key: string) {
  const first = !(key in store.get().done);
  store.set((s) => {
    const today = s.today.day === dayOf() ? s.today : { day: dayOf(), n: 0 };
    return {
      ...s,
      done: first ? { ...s.done, [key]: Date.now() } : s.done,
      pos: omit(s.pos, key),
      posOf: omit(s.posOf, key),
      today: first ? { ...today, n: today.n + 1 } : today,
    };
  });
  snaps.delete(key);
  return first;
}

/** 그만둘 때 멈춘 문제 번호를 남겨요 → 다시 열면 '이어서 할까요?'. total: 전체 문제 수 */
export const savePos = (key: string, index: number, total?: number) =>
  store.set((s) => ({ ...s, pos: { ...s.pos, [key]: index }, posOf: total == null ? s.posOf : { ...s.posOf, [key]: total } }));
export const useSavedPos = (key: string) => store.use((s) => s.pos[key]);
export const useSavedTotal = (key: string) => store.use((s) => s.posOf[key]);
export const getSavedPos = (key: string) => store.get().pos[key];
export function clearPos(key: string) {
  store.set((s) => ({ ...s, pos: omit(s.pos, key), posOf: omit(s.posOf, key) }));
  snaps.delete(key);
}

/** 오늘 처음 끝낸 단계 수 */
export const useTodayDone = () => store.use((s) => (s.today.day === dayOf() ? s.today.n : 0));
export const getTodayDone = () => {
  const t = store.get().today;
  return t.day === dayOf() ? t.n : 0;
};

export const getBest = (key: string): number | undefined => store.get().best[key];
export const setBest = (key: string, v: number) => store.set((s) => ({ ...s, best: { ...s.best, [key]: v } }));

/**
 * 멈춘 곳 그대로 다시 열기 위한 화면 상태 (문제 목록 · 결과 · 고른 역할 등).
 * 화면마다 모양이 달라서 그대로 맡아 두기만 해요. 실서비스는 서버 진행 저장에 같이 실어요.
 */
const snaps = new Map<string, unknown>();
export const saveSnapshot = (key: string, data: unknown) => void snaps.set(key, data);
export const getSnapshot = <T>(key: string) => snaps.get(key) as T | undefined;

/** 단계 화면에서 쓴 내용 (My Story 키워드 · 처음 답변 등) — 나갔다 와도 남아 있어요 */
const stepData = new Map<string, unknown>();
export const setStepData = (key: string, data: unknown) => void stepData.set(key, data);
export const getStepData = <T>(key: string) => stepData.get(key) as T | undefined;

function omit(o: Record<string, number>, k: string) {
  if (!(k in o)) return o;
  const { [k]: _drop, ...rest } = o;
  return rest;
}
