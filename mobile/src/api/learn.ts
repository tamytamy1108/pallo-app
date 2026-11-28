/**
 * 학습 API (api-inventory 16 · 17 · 18). 가짜 서버 값은 data/maps · data/library* · data/lessons* · data/situation-content 에 있어요.
 * 진도 · 저장 · 완료(19 ~ 22) · 표현함(29) · 설정(30)은 아직 state/* 를 그대로 써요 (docs/frontend/api-layer.md 체크리스트).
 */
import { getLesson0, type Lesson0 } from '@/data/lesson-lv0';
import { getLesson, type LessonData } from '@/data/lessons';
import { findUnit34, type Unit34 } from '@/data/lessons34';
import { BOOKS, type Book } from '@/data/library';
import { getMaps, type MapRow } from '@/data/maps';
import { SCENE_CONTENT, type SceneContent } from '@/data/situation-content';

import { http } from './client';
import { apiConfig } from './config';
import { mock, mockNotFound } from './mock';

type Opts = { signal?: AbortSignal };

/* ───────── 16 · 17 라이브러리 ───────── */

/** 16 GET /library/maps — 상황 맵 줄 목록 (형식: docs/frontend/map-data.md). 화면 모양으로는 toSituationMaps 가 바꿔요 */
export function fetchSituationMaps({ signal }: Opts = {}): Promise<MapRow[]> {
  if (apiConfig.useMock) return mock('maps', () => getMaps().map((r) => ({ ...r, scenes: r.scenes.map((s) => ({ ...s })) })));
  return http.get('/library/maps', { signal });
}

/**
 * 17 GET /library/books — 언어별 책장 (LANGS 순서 · 영어 · 일본어 · 중국어 · 스페인어). 한 권에 과 목록(study)이 같이 와요.
 * 섬 지도에 모든 권의 진도(3/20과)를 같이 그려서, 권마다 /library/books/:id/lessons 를 따로 부르지 않고 한 번에 받아요.
 */
export function fetchBookShelf({ signal }: Opts = {}): Promise<Book[][]> {
  if (apiConfig.useMock) return mock('books', () => BOOKS.map((shelf) => shelf.map((b) => ({ ...b }))));
  return http.get('/library/books', { signal });
}

/* ───────── 18 과 콘텐츠 ───────── */

/** 과 콘텐츠 id: 교재 '레벨-과' (1-1 · 3-101), 상황 장면은 맵 데이터의 contentId (travel-1) */
export const lessonContentId = (lv: number, unit: number) => `${lv}-${unit}`;

const lessonPath = (id: string) => `/lessons/${encodeURIComponent(id)}`;

/** 18 GET /lessons/:id — Lv.0 HELLO ENGLISH 한 과 (id '0-과'). 없으면 ApiError(404 · isNotFound) */
export function fetchBasicLesson(unit: number, { signal }: Opts = {}): Promise<Lesson0> {
  if (apiConfig.useMock)
    return mock('lesson', () => {
      const D = getLesson0(unit);
      if (!D) throw mockNotFound();
      return D;
    });
  return http.get(lessonPath(lessonContentId(0, unit)), { signal });
}

/** 18 GET /lessons/:id — Lv.1 · 2 패턴 교재 한 과. 없으면 ApiError(404 · isNotFound) */
export function fetchPatternLesson(lv: number, unit: number, { signal }: Opts = {}): Promise<LessonData> {
  if (apiConfig.useMock)
    return mock('lesson', () => {
      const D = getLesson(lv, unit);
      if (!D) throw mockNotFound();
      return D;
    });
  return http.get(lessonPath(lessonContentId(lv, unit)), { signal });
}

/** 18 GET /lessons/:id — Lv.3 TOPIC · Lv.4 DEBATE 한 회차. 없으면 ApiError(404 · isNotFound) */
export function fetchUnit34(lv: 3 | 4, no: number, { signal }: Opts = {}): Promise<Unit34> {
  if (apiConfig.useMock)
    return mock('lesson', () => {
      const u = findUnit34(lv, no);
      if (!u) throw mockNotFound();
      return u;
    });
  return http.get(lessonPath(lessonContentId(lv, no)), { signal });
}

/** 18 GET /lessons/:id — 상황 장면 콘텐츠 (표현 · 롤플레이 · Bank · 퀴즈). id = 맵 데이터 장면 줄의 contentId */
export function fetchSceneContent(contentId: string, { signal }: Opts = {}): Promise<SceneContent> {
  if (apiConfig.useMock)
    return mock('lesson', () => {
      const c = SCENE_CONTENT[contentId];
      if (!c) throw mockNotFound();
      return c;
    });
  return http.get(lessonPath(contentId), { signal });
}
