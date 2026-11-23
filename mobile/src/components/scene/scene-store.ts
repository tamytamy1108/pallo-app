/**
 * 상황 장면 화면끼리 나누는 작은 상태 (가짜 데이터용 · 기기에 남아요).
 * 프로토타입 ST.qLv(고른 레벨) · ST.qPicked(장면마다 처음 고르기 했는지) · ST.qBest(장면 · 레벨별 최고 기록) · ST.pos(퀴즈 멈춘 곳).
 * 맞는 API: 19 `/me/progress` · 20 `/me/progress/:lesson/:step` (실제 앱은 서버 진도에 함께 저장해요).
 */
import { createStore } from '@/lib/store';
import { MY_QUIZ_LEVELS, type QuizLevel } from '@/data/situation';

/** 퀴즈 멈춘 곳 — 다시 열면 그 문제부터 (프로토타입 saveStepPos) */
export type QuizPos = { i: number; right: number; order: number[]; res: (boolean | undefined)[]; lv: QuizLevel };

type SceneState = {
  /** 마지막으로 고른 레벨 (없으면 내 레벨 중 낮은 것) */
  qLv: QuizLevel | null;
  /** 장면 제목 → 처음 들어와 레벨을 골랐는지 */
  picked: Record<string, true>;
  /** 장면 제목 → 레벨 → 최고 맞힌 수 */
  best: Record<string, Partial<Record<QuizLevel, number>>>;
  /** 장면 id → 퀴즈 멈춘 곳 */
  quizPos: Record<string, QuizPos>;
};

const store = createStore<SceneState>({ qLv: null, picked: {}, best: {}, quizPos: {} }, { persist: { key: 'scene' } });

/** 지금 상황 퀴즈 · 미션 문장 레벨 (프로토타입 sitQLv) */
export const quizLevelOf = (s: SceneState): QuizLevel => s.qLv ?? MY_QUIZ_LEVELS[0] ?? 1;
export const useQuizLevel = () => store.useStore(quizLevelOf);
export const getQuizLevel = () => quizLevelOf(store.get());

export const useLevelPicked = (title: string) => store.useStore((s) => !!s.picked[title]);
/** 레벨 고르기 (장면 들어올 때 · 레벨 바꾸기 · 다른 난이도로 다시 풀기) */
export const pickLevel = (title: string, lv: QuizLevel) => store.set((s) => ({ ...s, qLv: lv, picked: { ...s.picked, [title]: true } }));
export const setQuizLevel = (lv: QuizLevel) => store.set((s) => ({ ...s, qLv: lv }));

export const useBest = (title: string) => store.useStore((s) => s.best[title]);
export const getBest = (title: string) => store.get().best[title] ?? {};
export const saveBest = (title: string, lv: QuizLevel, right: number) =>
  store.set((s) => {
    const was = s.best[title] ?? {};
    return { ...s, best: { ...s.best, [title]: { ...was, [lv]: Math.max(was[lv] ?? 0, right) } } };
  });

export const getQuizPos = (sceneId: string): QuizPos | undefined => store.get().quizPos[sceneId];
export const useQuizPos = (sceneId: string) => store.useStore((s) => s.quizPos[sceneId]);
export const saveQuizPos = (sceneId: string, pos: QuizPos) => store.set((s) => ({ ...s, quizPos: { ...s.quizPos, [sceneId]: pos } }));
export const clearQuizPos = (sceneId: string) =>
  store.set((s) => {
    if (!s.quizPos[sceneId]) return s;
    const { [sceneId]: _drop, ...rest } = s.quizPos;
    return { ...s, quizPos: rest };
  });

// 오늘 목표는 state/today-goal 한 곳에서 세요 (markDone 이 적어요)
