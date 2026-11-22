/**
 * 내 표현함 — 학습에서 저장한 표현 카드. 맞는 API: `/me/expressions`.
 * 담당: 마이 A (내 표현함 화면 · 예시 데이터). 레슨은 저장 · 빼기, 챌린지는 1개 이상 골라 불러오기에 써요.
 * 함수 이름 · 필드 뜻은 바꾸지 않아요 (늘리기만).
 */
import { createStore } from '@/lib/store';

export type SavedExpression = {
  id: string;
  /** 저장한 영어 문장 · 표현 */
  en: string;
  ko: string;
  /** 고친 문장 (AI 프리토킹 등에서 고친 그대로 저장) */
  fixed?: string;
  /** 어디서 저장했는지 (예: 'Lv.1 1과 · 오늘의 패턴') */
  source: string;
  savedAt: number;
};

const store = createStore<SavedExpression[]>([]);

export const useSavedExpressions = () => store.use();
export const getSavedExpressions = store.get;
export const useIsSaved = (en: string) => store.use((list) => list.some((x) => x.en === en));

export function saveExpression(e: Omit<SavedExpression, 'id' | 'savedAt'>) {
  store.set((list) => (list.some((x) => x.en === e.en) ? list : [{ ...e, id: `x${Date.now()}${list.length}`, savedAt: Date.now() }, ...list]));
}

export function removeExpression(en: string) {
  store.set((list) => list.filter((x) => x.en !== en));
}

/** 저장 ↔ 빼기. 저장되면 true */
export function toggleExpression(e: Omit<SavedExpression, 'id' | 'savedAt'>) {
  const on = store.get().some((x) => x.en === e.en);
  if (on) removeExpression(e.en);
  else saveExpression(e);
  return !on;
}

/** 예시 데이터를 넣을 때 (마이 A) */
export const seedExpressions = (list: SavedExpression[]) => store.set(list);
