/**
 * 라이브러리 화면 상태: 고른 언어 · 맵 · 섬, 새 맵 본 표시. 탭을 오가도 · 앱을 다시 켜도 그대로예요 (기기 저장 · 프로토타입 `pallo-mapseen`).
 * 진도(끝낸 단계 · 장면 도장)는 @/state/progress 를 읽기만 해요.
 */
import { createStore } from '@/lib/store';
import { isDone, sceneKey, stepKey, useDoneCount } from '@/state/progress';
import { STAGES, STUDY_STEPS, sceneId, sceneOpen, type Lesson, type SituationMap, type StudyLevel } from '@/data/library';

type LibState = { lang: number; sitMode: boolean; map: string | null; bi: number; seen: Record<string, true> };

/** 프로토타입 freshST: 영어 · 스터디 맵 · 내 교재 섬(Lv.1) */
export const libStore = createStore<LibState>({ lang: 0, sitMode: false, map: null, bi: 1, seen: {} }, { persist: { key: 'library' } });
export const setLib = (patch: Partial<LibState>) => libStore.set((s) => ({ ...s, ...patch }));
/** 새 맵 점: 그 맵을 한 번 열면 꺼져요 (프로토타입 MAPSEEN) */
export const markMapSeen = (id: string) => libStore.set((s) => (s.seen[id] ? s : { ...s, seen: { ...s.seen, [id]: true } }));

/** 진도가 바뀌면 다시 그리기 (끝낸 단계 전체 개수를 구독해요) */
export const useProgressVersion = () => useDoneCount('');

/** 과 하나의 모든 단계를 끝냈는지 (프로토타입 lessonDone) */
export const lessonDone = (L: StudyLevel, ls: Lesson) => STAGES.every((k) => STUDY_STEPS[L.kind][k].every((s) => isDone(stepKey(L.lv, ls.no, s.id))));
/** 그 레벨에서 끝낸 과 수 */
export const levelDoneCount = (L: StudyLevel) => L.lessons.filter((ls) => ls.data && lessonDone(L, ls)).length;
export const sceneDone = (m: SituationMap, no: number) => isDone(sceneKey(sceneId(m.id, no)));
/** 다음 장면 = 열린 장면 중 아직 안 끝낸 첫 장면 */
export const nextSceneNo = (m: SituationMap) => m.scenes.find((s) => sceneOpen(s) && !sceneDone(m, s.no))?.no;
