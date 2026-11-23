/**
 * 화면이 쓰는 서버 데이터 목록 (TanStack Query). 키는 여기 한 곳에서만 만들어요.
 * 화면: const { data, isPending, isError, refetch } = useQuery(noticesQuery());
 * 바꾼 뒤 다시 받기: queryClient.invalidateQueries({ queryKey: queryKeys.me })
 */
import { queryOptions } from '@tanstack/react-query';

import { toSituationMaps, type MapRow } from '@/data/maps';

import type { PageParams } from './client';
import { fetchBookShelf, fetchPatternLesson, fetchSceneContent, fetchSituationMaps, fetchUnit34, lessonContentId } from './learn';
import { fetchLaunchPopups, fetchLoungeHighlights, fetchNotice, fetchNotices, fetchTodaySessions } from './home';
import { fetchMe } from './me';

export const queryKeys = {
  me: ['me'] as const,
  sessionsToday: ['sessions', 'today'] as const,
  notices: (params: PageParams = {}) => ['notices', 'list', params] as const,
  notice: (id: string) => ['notices', 'detail', id] as const,
  loungeHighlights: ['lounge', 'highlights'] as const,
  popups: ['popups'] as const,
  situationMaps: ['library', 'maps'] as const,
  bookShelf: ['library', 'books'] as const,
  lesson: (id: string) => ['lessons', id] as const,
};

/** 교재 · 맵 · 과 콘텐츠는 자주 안 바뀌어요: 10분 안에는 받아 둔 값을 그대로 */
const CONTENT_STALE_MS = 10 * 60_000;

/** 3 /me */
export const meQuery = () => queryOptions({ queryKey: queryKeys.me, queryFn: ({ signal }) => fetchMe({ signal }) });

/** 8 /me/sessions/today */
export const sessionsTodayQuery = () => queryOptions({ queryKey: queryKeys.sessionsToday, queryFn: ({ signal }) => fetchTodaySessions({ signal }) });

/** 12 /notices (첫 페이지) */
export const noticesQuery = (params: PageParams = {}) => queryOptions({ queryKey: queryKeys.notices(params), queryFn: ({ signal }) => fetchNotices(params, { signal }) });

/** 홈 Notice board 띠: 공지 앞의 3개 */
export const noticeBoardQuery = () => noticesQuery({ limit: 3 });

/** 12 /notices/:id */
export const noticeQuery = (id: string) => queryOptions({ queryKey: queryKeys.notice(id), queryFn: ({ signal }) => fetchNotice(id, { signal }) });

/** 15 /lounge/highlights */
export const loungeHighlightsQuery = () => queryOptions({ queryKey: queryKeys.loungeHighlights, queryFn: ({ signal }) => fetchLoungeHighlights({ signal }) });

/** A1 /popups */
export const popupsQuery = () => queryOptions({ queryKey: queryKeys.popups, queryFn: ({ signal }) => fetchLaunchPopups({ signal }) });

/* ───────── 학습 (16 · 17 · 18) ───────── */

/** 서버 줄 → 화면 모양 (열린 맵 · 곧 열릴 맵). 함수가 늘 같아야 Query 가 결과를 기억해요 */
const selectSituationMaps = (rows: MapRow[]) => toSituationMaps(rows);

/** 16 /library/maps → { maps, soon } */
export const situationMapsQuery = () =>
  queryOptions({ queryKey: queryKeys.situationMaps, queryFn: ({ signal }) => fetchSituationMaps({ signal }), select: selectSituationMaps, staleTime: CONTENT_STALE_MS });

/** 17 /library/books — 언어별 책장 */
export const bookShelfQuery = () => queryOptions({ queryKey: queryKeys.bookShelf, queryFn: ({ signal }) => fetchBookShelf({ signal }), staleTime: CONTENT_STALE_MS });

/** 18 /lessons/:id — Lv.1 · 2 한 과 */
export const patternLessonQuery = (lv: number, unit: number) =>
  queryOptions({ queryKey: queryKeys.lesson(lessonContentId(lv, unit)), queryFn: ({ signal }) => fetchPatternLesson(lv, unit, { signal }), staleTime: CONTENT_STALE_MS });

/** 18 /lessons/:id — Lv.3 · 4 한 회차 */
export const unit34Query = (lv: 3 | 4, no: number) =>
  queryOptions({ queryKey: queryKeys.lesson(lessonContentId(lv, no)), queryFn: ({ signal }) => fetchUnit34(lv, no, { signal }), staleTime: CONTENT_STALE_MS });

/** 18 /lessons/:id — 상황 장면 콘텐츠 */
export const sceneContentQuery = (contentId: string) =>
  queryOptions({ queryKey: queryKeys.lesson(contentId), queryFn: ({ signal }) => fetchSceneContent(contentId, { signal }), staleTime: CONTENT_STALE_MS });
