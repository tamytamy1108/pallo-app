/**
 * 라이브러리 화면 상태: 고른 언어 · 맵 · 섬, 새 맵 본 표시. 탭을 오가면 그대로예요.
 * 앱을 다시 켜면 스터디 맵부터 (2026-11-28) — 기기에는 언어 · 새 맵 본 표시만 남겨요 (프로토타입 `pallo-mapseen`).
 * 진도(끝낸 단계 · 장면 도장)는 @/state/progress 를 읽기만 해요.
 */
import { createStore } from '@/lib/store';
import { isDone, sceneKey, stepKey, useDoneCount, type LastStep } from '@/state/progress';
import { STAGES, STUDY_STEPS, sceneId, sceneOpen, type Book, type Lesson, type SituationMap, type StudyLevel } from '@/data/library';

/**
 * pick: 이번에 '교재 보기'로 고른 섬 번호 (pickAt = 고른 때). 앱을 다시 켜면 잊어요 → 최근 공부한 레벨 섬에서 시작.
 */
type LibState = { lang: number; sitMode: boolean; map: string | null; pick: number | null; pickAt: number; seen: Record<string, true> };

/** 처음: 영어 · 스터디 맵 · 내 레벨 섬 */
export const libStore = createStore<LibState>(
  { lang: 0, sitMode: false, map: null, pick: null, pickAt: 0, seen: {} },
  // 고른 섬(pick · 예전 이름 bi) · 스터디/상황 맵 · 고른 상황 맵은 저장하지 않아요 — 앱을 다시 켜면 스터디 맵 · 최근 공부한 레벨 섬부터
  {
    persist: {
      key: 'library',
      save: ({ lang, seen }) => ({ lang, seen }),
      // 예전에 저장한 sitMode · map 은 버려요
      load: (saved, initial) => (saved && typeof saved === 'object' && !Array.isArray(saved) ? { ...initial, ...('lang' in saved && typeof saved.lang === 'number' ? { lang: saved.lang } : {}), ...('seen' in saved && saved.seen && typeof saved.seen === 'object' ? { seen: saved.seen as Record<string, true> } : {}) } : initial),
    },
  },
);
export const setLib = (patch: Partial<LibState>) => libStore.set((s) => ({ ...s, ...patch }));
/** 섬 고르기 (null = 다시 정해진 순서대로) */
export const pickIsland = (pick: number | null, patch: Partial<LibState> = {}) => setLib({ ...patch, pick, pickAt: Date.now() });

/**
 * 팔로가 서는 섬 (교재 번호):
 * 1) 이번에 고른 섬 — 단, 그 뒤에 공부를 시작했으면 공부한 레벨이 이겨요
 * 2) 최근에 공부한 레벨 섬 (마지막으로 연 단계)
 * 3) 내 레벨 섬 (내 레벨이 둘이면 낮은 레벨) — 처음 들어왔을 때
 */
export function islandFor(books: Book[], st: Pick<LibState, 'pick' | 'pickAt'>, last: LastStep | null) {
  const studied = last ? books.findIndex((b) => b.study?.lv === last.lv) : -1;
  if (st.pick != null && st.pick < books.length && !(studied >= 0 && last && last.at > st.pickAt)) return st.pick;
  if (studied >= 0) return studied;
  return Math.max(0, books.findIndex((b) => b.mine));
}
/** 새 맵 점: 그 맵을 한 번 열면 꺼져요 (프로토타입 MAPSEEN) */
export const markMapSeen = (id: string) => libStore.set((s) => (s.seen[id] ? s : { ...s, seen: { ...s.seen, [id]: true } }));

/** 진도가 바뀌면 다시 그리기 (끝낸 단계 전체 개수를 구독해요) */
export const useProgressVersion = () => useDoneCount('');

/** 과 하나의 모든 단계를 끝냈는지 (프로토타입 lessonDone) */
export const lessonDone = (L: StudyLevel, ls: Lesson) => STAGES.every((k) => STUDY_STEPS[L.kind][k].every((s) => isDone(stepKey(L.lv, ls.no, s.id))));
/** 지금 풀어야 할 과 = 열린 과 중 아직 다 끝내지 않은 첫 과 (다 끝냈으면 마지막 열린 과 · 열린 과가 없으면 null) */
export function nextLessonNo(L: StudyLevel) {
  const open = L.lessons.filter((ls) => ls.data);
  return (open.find((ls) => !lessonDone(L, ls)) ?? open[open.length - 1])?.no ?? null;
}
/** 그 레벨에서 끝낸 과 수 */
export const levelDoneCount = (L: StudyLevel) => L.lessons.filter((ls) => ls.data && lessonDone(L, ls)).length;
export const sceneDone = (m: SituationMap, no: number) => isDone(sceneKey(sceneId(m.id, no)));
/** 다음 장면 = 열린 장면 중 아직 안 끝낸 첫 장면 */
export const nextSceneNo = (m: SituationMap) => m.scenes.find((s) => sceneOpen(s) && !sceneDone(m, s.no))?.no;
