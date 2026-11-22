/**
 * Lv.3 · 4 내 답 모음 (가짜) — 한 코너에서 말한 답을 다음 코너가 이어 받아요. 맞는 API: `POST /me/answers` (처음 답변 저장).
 * - ans[회차:단계]  : 별표한 질문 · DAILY TOPIC 대화 답 (→ Before / After) · 저널
 * - after[회차:단계]: Before / After 에서 다시 쓴 답 · FINAL POSITION
 * - side[회차]      : 내 입장 (편 · 리허설 발언) → DEBATE · 편 바꾸기 · FINAL POSITION
 * - talk[회차:단계] : AI 대화에서 내가 한 말 (FREE TALK 1:1)
 * 프로토타입 ST.ans · ST.after · ST.side · ST.talk 와 같아요.
 */
import { createStore } from '@/lib/store';

import type { Task34 } from './types';

type Answers = {
  ans: Record<string, (string | number[] | undefined)[]>;
  after: Record<string, string[] | string>;
  side: Record<string, { side: 'A' | 'B'; text: string }>;
  talk: Record<string, string[]>;
  /** 오늘 처음 끝낸 단계 수 (오늘 목표) — 날짜가 바뀌면 0 */
  today: { day: string; n: number };
  /** 매치 최고 기록 (초) */
  best: Record<string, number>;
};
const today = () => new Date().toDateString();
const store = createStore<Answers>({ ans: {}, after: {}, side: {}, talk: {}, today: { day: today(), n: 0 }, best: {} });

export const answers = store.get;
export const useAnswers = store.useStore;
export const setAns = (key: string, v: (string | number[] | undefined)[]) => store.set((s) => ({ ...s, ans: { ...s.ans, [key]: v } }));
export const setAfter = (key: string, v: string[] | string) => store.set((s) => ({ ...s, after: { ...s.after, [key]: v } }));
export const setSide = (unitKey: string, v: { side: 'A' | 'B'; text: string }) => store.set((s) => ({ ...s, side: { ...s.side, [unitKey]: v } }));
export const setTalk = (key: string, v: string[]) => store.set((s) => ({ ...s, talk: { ...s.talk, [key]: v } }));
export const setBest = (key: string, sec: number) => store.set((s) => ({ ...s, best: { ...s.best, [key]: sec } }));

/** 처음 끝낸 단계를 오늘 목표에 더해요. 오늘 몇 개 했는지 돌려줘요 */
export function addToday() {
  const d = today();
  store.set((s) => ({ ...s, today: { day: d, n: (s.today.day === d ? s.today.n : 0) + 1 } }));
  return store.get().today.n;
}
export const todayCount = () => (store.get().today.day === today() ? store.get().today.n : 0);

/** 그만둔 곳 (코너마다) — 문제 목록째 기억해요 (고른 질문으로 늘어난 문제도 그대로). 프로토타입 TK_SAVE */
const saved = new Map<string, { tasks: Task34[]; i: number; res: Record<number, boolean> }>();
export const saveRun = (key: string, v: { tasks: Task34[]; i: number; res: Record<number, boolean> }) => saved.set(key, v);
export const loadRun = (key: string) => saved.get(key);
export const dropRun = (key: string) => saved.delete(key);
