/**
 * 내 표현함 — 학습에서 저장한 표현 카드. 맞는 API: `/me/expressions`.
 * 담당: 마이 A (내 표현함 화면 · 예시 데이터). 레슨은 저장 · 빼기, 챌린지는 1개 이상 골라 불러오기에 써요.
 * 함수 이름 · 필드 뜻은 바꾸지 않아요 (늘리기만).
 */
import { SEED_EXPRESSIONS } from '@/data/my';
import { createStore } from '@/lib/store';

/** 나온 곳 4가지 (프로토타입 CH_SRC): 교재 · 상황 · 프리토킹 · 리스닝 룸 */
export type ExpressionFrom = 'book' | 'trip' | 'free' | 'listen';

export type SavedExpression = {
  id: string;
  /** 저장한 영어 문장 · 표현 */
  en: string;
  ko: string;
  /** 고친 문장 (AI 프리토킹 등에서 고친 그대로 저장) */
  fixed?: string;
  /** 어디서 저장했는지 (예: 'Lv.1 · 6챕터 No Spoilers!' · '카페 · 주문 바꾸기' · '프리토킹 · 11.12 영등포 세션') */
  source: string;
  savedAt: number;
  /** 나온 곳 종류 — 없으면 source 글자로 짐작해요 (exprFrom) */
  from?: ExpressionFrom;
  /** 핵심 표현 · 뜻 — 없으면 문장에서 뽑아요 (exprCard) */
  core?: string;
  coreKo?: string;
};

// 처음엔 프로토타입 예시 14개가 들어 있어요 (어느 화면에서 먼저 열어도 같게)
const store = createStore<SavedExpression[]>(SEED_EXPRESSIONS);

export const useSavedExpressions = () => store.useStore();
export const getSavedExpressions = store.get;
export const useIsSaved = (en: string) => store.useStore((list) => list.some((x) => x.en === en));
/** 저장한 표현 수 (마이 › 내 활동) */
export const useSavedCount = () => store.useStore((list) => list.length);

export function saveExpression(e: Omit<SavedExpression, 'id' | 'savedAt'>) {
  store.set((list) => (list.some((x) => x.en === e.en) ? list : [{ ...e, id: `x${Date.now()}${list.length}`, savedAt: Date.now() }, ...list]));
}

export function removeExpression(en: string) {
  store.set((list) => list.filter((x) => x.en !== en));
}

/** 빼기를 되돌릴 때: 원래 자리에 다시 넣어요 */
export function restoreExpression(x: SavedExpression, at: number) {
  store.set((list) => (list.some((y) => y.en === x.en) ? list : [...list.slice(0, Math.max(0, at)), x, ...list.slice(Math.max(0, at))]));
}

/** 저장 ↔ 빼기. 저장되면 true */
export function toggleExpression(e: Omit<SavedExpression, 'id' | 'savedAt'>) {
  const on = store.get().some((x) => x.en === e.en);
  if (on) removeExpression(e.en);
  else saveExpression(e);
  return !on;
}

/** 예시 데이터를 넣을 때 (마이 A) — 이미 저장한 게 있으면 그 뒤에 붙여요 */
export const seedExpressions = (list: SavedExpression[]) =>
  store.set((cur) => [...cur, ...list.filter((x) => !cur.some((y) => y.en === x.en))]);

/**
 * 나온 곳 종류: from 이 없으면 저장한 곳 글자로 (교재 'Lv.' · 프리토킹 · 리스닝 · 나머지는 상황).
 * PRO'S NOTE(세션 뒤 프로 노트)는 세션에서 나온 표현이라 프리토킹(세션)으로 묶어요 — 글자는 'PRO'S NOTE · …' 그대로 보여요.
 */
export function exprFrom(x: Pick<SavedExpression, 'from' | 'source'>): ExpressionFrom {
  if (x.from) return x.from;
  const s = x.source || '';
  if (/프리토킹|AI|세션|PRO'?S NOTE|프로 노트/i.test(s)) return 'free';
  if (/리스닝/.test(s)) return 'listen';
  if (/^Lv\.|교재|챕터|과/.test(s)) return 'book';
  return 'trip';
}

// 오늘의 패턴(Lv.1 1과 · Lv.2 1과)이 들어 있으면 그 패턴을 핵심 표현으로 (프로토타입 cardOf)
const PATTERNS: readonly (readonly [RegExp, string, string])[] = [
  [/i'?d like to|i would like to/i, "I'd like to", '~하고 싶어요'],
  [/do you have/i, 'Do you have', '~이/가 있나요?'],
  [/it (doesn'?t|does not|isn'?t|is not|'s not)/i, "It doesn't / isn't", '~하지 않아요 / ~이 아니에요'],
  [/(not (really )?)?in the mood( for| to)?/i, 'not in the mood for', '~할 기분이 아니에요'],
  [/too \w+ to/i, 'too ~ to', '~하기에는 너무 …해요'],
  [/until/i, 'not … until', '~할 때까지 …하지 않아요 / ~하고 나서야 …해요'],
];

/** 표현 카드: 핵심 표현 · 뜻 · 예문 · 내가 만든(고친) 문장인지 */
export function exprCard(x: SavedExpression) {
  const sentence = x.fixed || x.en;
  const mine = !!x.fixed || /고친|내가/.test(x.ko || '');
  if (x.core) return { p: x.core, m: x.coreKo ?? x.ko, ex: sentence, mine };
  const txt = sentence.replace(/[’]/g, "'");
  const pat = PATTERNS.find(([re]) => re.test(txt));
  if (pat) return { p: pat[1], m: pat[2], ex: sentence, mine };
  const w = sentence.trim().split(/\s+/);
  return { p: w.length <= 7 ? sentence.replace(/[.!?]+$/, '') : w.slice(0, 4).join(' ') + '…', m: x.ko || '', ex: sentence, mine };
}
