/**
 * 화면이 쓰는 서버 데이터 목록 (TanStack Query). 키는 여기 한 곳에서만 만들어요.
 * 화면: const { data, isPending, isError, refetch } = useQuery(noticesQuery());
 * 바꾼 뒤 다시 받기: queryClient.invalidateQueries({ queryKey: queryKeys.me })
 */
import { queryOptions } from '@tanstack/react-query';

import type { PageParams } from './client';
import { fetchLaunchPopups, fetchLoungeHighlights, fetchNotice, fetchNotices, fetchTodaySessions } from './home';
import { fetchMe } from './me';

export const queryKeys = {
  me: ['me'] as const,
  sessionsToday: ['sessions', 'today'] as const,
  notices: (params: PageParams = {}) => ['notices', 'list', params] as const,
  notice: (id: string) => ['notices', 'detail', id] as const,
  loungeHighlights: ['lounge', 'highlights'] as const,
  popups: ['popups'] as const,
};

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
