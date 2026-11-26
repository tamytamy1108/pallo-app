/**
 * 이벤트 탭 훅 — 서버 이벤트(GET /events · /events/{id})를 이벤트 한 줄(EventItem) 모양으로.
 * 목록은 예시 이벤트(data/events)와 섞어 보여요 — 지점 · 본사 이벤트를 여는 API 가 생기면 예시는 빼요.
 */
import { useQuery } from '@tanstack/react-query';

import { fromServer } from '@/components/event/event-model';

import { eventQuery, eventsQuery } from './queries';

/** 열린 이벤트 (오늘 이후) */
export function useServerEvents() {
  return useQuery({ ...eventsQuery(), select: (rows) => rows.map(fromServer) });
}

/** 이벤트 하나 — 예시 이벤트 id(e1 …)면 부르지 않아요 */
export function useServerEvent(id: string, enabled: boolean) {
  return useQuery({ ...eventQuery(id), enabled, select: fromServer });
}
