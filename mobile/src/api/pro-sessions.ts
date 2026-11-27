/**
 * 참여한 세션 — 내가 '프로로 참여'로 출석 체크한 세션 기록 (스텝 마이 숫자 칸 '참여한 세션' 을 누르면).
 * GET /me/pro-sessions?cursor=&limit= (docs/frontend/api-additions.md A34 · 아직 서버에 없어요).
 * 가짜 서버: data/account PRO_STATS.total 만큼 지난 세션을 만들어요.
 */
import { nowDate } from '@/components/home/attendance';
import { PRO_STATS } from '@/data/account';
import { SPARK_ATTEND } from '@/data/my';
import { getMe } from '@/state/me';
import { dayKey } from '@/state/today-goal';

import { http } from './client';
import { apiConfig } from './config';
import { mock } from './mock';

type Opts = { signal?: AbortSignal };

export type ProSessionLog = {
  sessionId: string;
  /** KST 'YYYY-MM-DD' */
  date: string;
  /** 'HH:mm' */
  time: string;
  /** 전산 팀 이름 그대로 (예: 1-1 영어) */
  teamName: string;
  languageLabel: string;
  branchName: string;
  /** COVER = 맡은 프로가 없어서 대타 · JOIN = 프로가 있는데 같이 참여 */
  kind: 'COVER' | 'JOIN';
  /** 이 출석으로 받은 스파크 (세션 출석 규칙 그대로) */
  sparks: number;
};

export type ProSessions = {
  /** 전체 기간 '프로로 참여' 횟수 = 마이 proStats.sessionsTotal */
  total: number;
  /** 이번 달 (KST) */
  thisMonth: number;
  items: ProSessionLog[];
  nextCursor: string | null;
};

export function fetchProSessions({ signal }: Opts = {}): Promise<ProSessions> {
  if (apiConfig.useMock) return mock('proSessions', mockProSessions);
  return http.get('/me/pro-sessions?limit=50', { signal });
}

/* ───────── 가짜 서버 ───────── */

const TEAMS = [
  ['1-1 영어', '영어', '11:00'],
  ['2-2 영어', '영어', '19:30'],
  ['1-1 일본어', '일본어', '11:00'],
  ['3-1 영어', '영어', '19:30'],
  ['2-1 중국어', '중국어', '19:30'],
] as const;

function mockProSessions(): ProSessions {
  const branch = getMe().branch?.split(' · ')[0] || '하남점';
  const today = nowDate();
  const month = dayKey(today.getTime()).slice(0, 7);
  const items: ProSessionLog[] = [];
  // 이틀 · 사흘 간격으로 거슬러 올라가며 (주 2~3번)
  let back = 1;
  for (let i = 0; i < PRO_STATS.total; i++) {
    const d = new Date(today.getTime() - back * 86_400_000);
    const [teamName, languageLabel, time] = TEAMS[i % TEAMS.length];
    items.push({ sessionId: `mock-pro-${i}`, date: dayKey(d.getTime()), time, teamName, languageLabel, branchName: branch, kind: i % 3 === 0 ? 'COVER' : 'JOIN', sparks: SPARK_ATTEND });
    back += i % 2 ? 3 : 2;
  }
  return { total: items.length, thisMonth: items.filter((s) => s.date.startsWith(month)).length, items, nextCursor: null };
}
