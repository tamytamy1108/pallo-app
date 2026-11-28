/**
 * PALLO 랭킹 — `GET /app/api/v2/ranking/members` · `GET /ranking/branches` (?period=WEEK|MONTH). 백엔드 아직 없음 — 포인트 장부(`/me/rewards`)와 같이 만들어요.
 * (docs/appendix/api-inventory.md 31 은 `/ranking?scope=` 하나였는데, 개인 · 지점 대항전은 응답 모양이 달라 경로를 둘로 나눴어요.)
 *
 * 순위 · 합계 · 10위까지 남은 점수 · 내 앞뒤 줄은 서버가 정해요 — 화면은 받은 대로 그리기만 해요.
 * 포인트가 0 인 사람은 순위에 없어요 (마이 요약 GET /me/mypage ranking.me.rank 와 같은 판정).
 * 이름 · 지점 공개 규칙은 마이 요약 랭킹 칸(MyPageRankEntry)과 같아요.
 *
 * 가짜 서버는 예시 멤버(data/my RANK_PEOPLE)에 기기 포인트(state/me weekPoints)를 섞어 같은 모양을 만들어요.
 */
import { rankPeople } from '@/data/my';
import { getMe } from '@/state/me';

import { http } from './client';
import { apiConfig } from './config';
import { mock } from './mock';
import type { MyPageRankEntry } from './my-page';

type Opts = { signal?: AbortSignal };

/** 이번 주(KST 월요일부터) · 이번 달(KST 1일부터) */
export type RankingPeriod = 'WEEK' | 'MONTH';

export type RankingEntry = MyPageRankEntry & {
  /** 나인지 — 내 줄을 노랗게 칠해요 */
  isMe: boolean;
};

export type MemberRanking = {
  period: RankingPeriod;
  /** 기간 시작 (KST 'YYYY-MM-DD') */
  periodStart: string;
  /** 1~10위 (사람이 적으면 그만큼) */
  top: RankingEntry[];
  /** 내 순위 — 이 기간 포인트가 0 이면 null */
  me: { rank: number | null; points: number };
  /**
   * 10위 밖일 때 내 근처 줄 — 11위면 나 한 줄, 12위부터는 내 앞 · 나 · 내 뒤 (꼴찌면 뒤 없음).
   * 10위 안이거나 순위가 없으면 빈 목록.
   */
  around: RankingEntry[];
  /** 10위가 되려면 더 필요한 포인트 — 10위 안이거나 순위가 없으면 null */
  pointsToTop10: number | null;
};

export type BranchRankingEntry = {
  rank: number;
  branchCode: string;
  branchName: string;
  /** 지점 회원 포인트 합계 */
  points: number;
  /** 내 지점인지 */
  isMine: boolean;
};

export type BranchRanking = {
  period: RankingPeriod;
  periodStart: string;
  /** 1위부터 전 지점 */
  branches: BranchRankingEntry[];
  /** 우리 지점 — 지점 회원이 아니면 null */
  myBranch: { branchCode: string; branchName: string; rank: number | null; points: number } | null;
};

/* ───────── 가짜 서버 ───────── */

const pad = (n: number) => String(n).padStart(2, '0');
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function periodStartOf(period: RankingPeriod, today = new Date()): string {
  if (period === 'MONTH') return iso(new Date(today.getFullYear(), today.getMonth(), 1));
  return iso(new Date(today.getFullYear(), today.getMonth(), today.getDate() - ((today.getDay() + 6) % 7)));
}

/** 예시 멤버 + 나, 포인트 순 (나는 0 이면 빠져요) */
function mockEntries(period: RankingPeriod): RankingEntry[] {
  const rows = rankPeople(period === 'WEEK' ? 'w' : 'm', getMe());
  return rows
    .filter((r) => !r.me || r.pt > 0)
    .map((r, i) => ({ rank: i + 1, code: null, displayName: r.n, branchName: r.b || null, points: r.pt, isMe: !!r.me }));
}

export function mockMemberRanking(period: RankingPeriod): MemberRanking {
  const all = mockEntries(period);
  const mine = all.find((r) => r.isMe);
  const out = mine && mine.rank > 10;
  return {
    period,
    periodStart: periodStartOf(period),
    top: all.slice(0, 10),
    me: { rank: mine?.rank ?? null, points: mine?.points ?? 0 },
    around: out ? all.slice(Math.max(10, mine.rank - 2), mine.rank + 1) : [],
    pointsToTop10: out ? all[9].points - mine.points + 1 : null,
  };
}

export function mockBranchRanking(period: RankingPeriod): BranchRanking {
  const sums = new Map<string, number>();
  for (const r of mockEntries(period)) if (r.branchName) sums.set(r.branchName, (sums.get(r.branchName) ?? 0) + r.points);
  const myName = getMe().branch;
  const branches = [...sums.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, points], i): BranchRankingEntry => ({ rank: i + 1, branchCode: name, branchName: name, points, isMine: name === myName }));
  const mine = branches.find((b) => b.isMine);
  return {
    period,
    periodStart: periodStartOf(period),
    branches,
    myBranch: myName ? { branchCode: mine?.branchCode ?? myName, branchName: myName, rank: mine?.rank ?? null, points: mine?.points ?? 0 } : null,
  };
}

/* ───────── API ───────── */

/** GET /ranking/members?period= — 개인 랭킹 (전 지점 · 포인트 기준) */
export function fetchMemberRanking(period: RankingPeriod, { signal }: Opts = {}): Promise<MemberRanking> {
  if (apiConfig.useMock) return mock('memberRanking', () => mockMemberRanking(period));
  return http.get('/ranking/members', { query: { period }, signal });
}

/** GET /ranking/branches?period= — 지점 대항전 (지점 회원 포인트 합계) */
export function fetchBranchRanking(period: RankingPeriod, { signal }: Opts = {}): Promise<BranchRanking> {
  if (apiConfig.useMock) return mock('branchRanking', () => mockBranchRanking(period));
  return http.get('/ranking/branches', { query: { period }, signal });
}
