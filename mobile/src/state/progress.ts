/**
 * 학습 진도: 끝낸 단계 · 멈춘 곳(이어서 하기) · 상황 맵 도장. 맞는 API: 19 `/me/progress` · 20 `/me/progress/:lesson/:step`
 * 담당: 레슨 A. 레슨 B · 상황 장면은 끝낼 때 markDone · 멈출 때 savePos, 홈 · 라이브러리는 읽기만 해요.
 * 함수 이름 · 키 모양은 바꾸지 않아요(늘리기만).
 */
import { createStore } from '@/lib/store';

/** 단계 키: `${레벨}:${과}:${단계 id}` (예: '1:1:pat'). 상황 장면: `scene:${장면 id}`. 단계 id · 장면 id 는 프로토타입 데이터의 id 그대로 */
export const stepKey = (lv: number | string, unit: number | string, step: string) => `${lv}:${unit}:${step}`;
export const sceneKey = (sceneId: string) => `scene:${sceneId}`;

type Progress = { done: Record<string, number>; pos: Record<string, number> };
const store = createStore<Progress>({ done: {}, pos: {} });

export const useIsDone = (key: string) => store.use((s) => key in s.done);
/** 키 앞부분이 같은 것 중 끝낸 개수 (예: '1:1:' → 1과에서 끝낸 단계 수) */
export const useDoneCount = (prefix: string) => store.use((s) => Object.keys(s.done).filter((k) => k.startsWith(prefix)).length);
export const isDone = (key: string) => key in store.get().done;

/** 끝냈다고 기록해요. 처음 끝낸 거면 true (포인트는 처음일 때만) */
export function markDone(key: string) {
  const first = !(key in store.get().done);
  store.set((s) => ({ done: first ? { ...s.done, [key]: Date.now() } : s.done, pos: omit(s.pos, key) }));
  return first;
}

/** 그만둘 때 멈춘 문제 번호를 남겨요 → 다시 열면 '이어서 할까요?' */
export const savePos = (key: string, index: number) => store.set((s) => ({ ...s, pos: { ...s.pos, [key]: index } }));
export const useSavedPos = (key: string) => store.use((s) => s.pos[key]);
export const clearPos = (key: string) => store.set((s) => ({ ...s, pos: omit(s.pos, key) }));

function omit(o: Record<string, number>, k: string) {
  if (!(k in o)) return o;
  const { [k]: _drop, ...rest } = o;
  return rest;
}
