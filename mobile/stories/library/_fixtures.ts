import { BOOKS, STAGES, STUDY_STEPS, sceneId, type Book, type StudyLevel } from '@/data/library';
import { getMaps, toSituationMaps } from '@/data/maps';
import { SCENE_STEPS, sceneStepKey } from '@/data/situation';
import { markDone, savePos, sceneKey, stepKey } from '@/state/progress';

/** 라이브러리 스토리 공용 값 — 가짜 서버 값(BOOKS · 맵 JSON) 그대로 꺼내 쓴다. */
export const EN_BOOKS = BOOKS[0];
export const JA_BOOKS = BOOKS[1];
export const book = (id: string): Book => {
  const b = BOOKS.flat().find((x) => x.id === id);
  if (!b) throw new Error(`없는 교재 ${id}`);
  return b;
};
export const level = (lv: number): StudyLevel => {
  const L = book(`en-${lv}`).study;
  if (!L) throw new Error(`과 목록 없는 레벨 ${lv}`);
  return L;
};

const SIT = toSituationMaps(getMaps());
export const SIT_MAPS = SIT.maps;
export const SOON_MAPS = SIT.soon;
export const sitMap = (id: string) => {
  const m = SIT_MAPS.find((x) => x.id === id);
  if (!m) throw new Error(`없는 상황 맵 ${id}`);
  return m;
};

/** 레벨 L 의 과 no 에서 단계 n 개를 끝냈다고 (예습 → 본학습 → 복습 순) */
export function doneSteps(L: StudyLevel, no: number, n: number) {
  const steps = STAGES.flatMap((k) => STUDY_STEPS[L.kind][k]);
  steps.slice(0, n).forEach((s) => markDone(stepKey(L.lv, no, s.id)));
}
/** 레벨 L 의 과 no 를 다 끝냈다고 */
export const doneLesson = (L: StudyLevel, no: number) => doneSteps(L, no, 999);
/** 레벨 L · 과 no 의 다음 단계에 멈춘 곳(이어서 하기)을 남긴다 */
export function pauseNext(L: StudyLevel, no: number, done: number) {
  const steps = STAGES.flatMap((k) => STUDY_STEPS[L.kind][k]);
  const s = steps[done];
  if (s) savePos(stepKey(L.lv, no, s.id), 3, 9);
}
/** 상황 맵 장면 no 를 끝냈다고 (도장 + 연습 점 전부) */
export function doneScene(mapId: string, no: number) {
  const id = sceneId(mapId, no);
  SCENE_STEPS.forEach((st) => markDone(sceneStepKey(id, st.id)));
  markDone(sceneKey(id));
}
/** 상황 맵 장면 no 의 연습 점 n 개만 */
export function practiceScene(mapId: string, no: number, n: number) {
  const id = sceneId(mapId, no);
  SCENE_STEPS.slice(0, n).forEach((st) => markDone(sceneStepKey(id, st.id)));
}
