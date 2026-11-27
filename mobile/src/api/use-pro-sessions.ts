/**
 * 참여한 세션 기록 (GET /me/pro-sessions) — 시트가 열릴 때만 받아요.
 * '프로로 참여'로 출석하면 useProCheckIn 이 현황과 함께 이것도 다시 받게 해요.
 */
import { useQuery } from '@tanstack/react-query';

import { proSessionsQuery } from './queries';

export function useProSessions(enabled: boolean) {
  return useQuery({ ...proSessionsQuery(), enabled });
}
