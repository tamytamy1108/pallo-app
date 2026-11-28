/**
 * PALLO 랭킹 (api/ranking.ts) 을 랭킹 화면 모양으로 바꿔 줘요 — 순위 줄은 RankRow(얼굴 바탕색 포함) + 순위 번호 · 회원 code.
 */
import { useQuery } from '@tanstack/react-query';

import { Colors } from '@/constants/theme';
import { RANK_COLORS, type RankRow } from '@/data/my';

import { branchRankingQuery, memberRankingQuery } from './queries';
import type { RankingEntry, RankingPeriod } from './ranking';

export type RankingRow = RankRow & { no: number; code: string | null };

/** 서버 순위 줄 → 화면 줄. 얼굴 바탕은 순위 색 (나는 보라) */
export function toRankingRow(e: RankingEntry): RankingRow {
  return {
    no: e.rank,
    code: e.code,
    n: e.displayName,
    b: e.branchName ?? '',
    pt: e.points,
    c: e.isMe ? Colors.purple : RANK_COLORS[(e.rank - 1) % RANK_COLORS.length],
    me: e.isMe,
  };
}

export type MemberRankingView = {
  /** 1~10위 */
  top: RankingRow[];
  /** 10위 밖일 때 내 근처 줄 */
  around: RankingRow[];
  /** around 앞에 '…' 를 그릴지 (10위와 이어지지 않을 때) */
  gap: boolean;
  myRank: number | null;
  myPoints: number;
  pointsToTop10: number | null;
};

export type BranchRankingRow = { no: number; code: string; name: string; pt: number; mine: boolean; /** 1위 대비 (0~1) — 막대 길이 */ ratio: number };

export type BranchRankingView = {
  rows: BranchRankingRow[];
  myBranch: { name: string; rank: number | null; points: number } | null;
};

/** 개인 랭킹 — enabled 는 그 탭을 보고 있을 때만 */
export function useMemberRanking(period: RankingPeriod, enabled = true) {
  return useQuery({
    ...memberRankingQuery(period),
    enabled,
    select: (d): MemberRankingView => {
      const top = d.top.map(toRankingRow);
      const around = d.around.map(toRankingRow);
      return { top, around, gap: around.length > 0 && around[0].no > top.length + 1, myRank: d.me.rank, myPoints: d.me.points, pointsToTop10: d.pointsToTop10 };
    },
  });
}

/** 지점 대항전 — enabled 는 그 탭을 보고 있을 때만 */
export function useBranchRanking(period: RankingPeriod, enabled = true) {
  return useQuery({
    ...branchRankingQuery(period),
    enabled,
    select: (d): BranchRankingView => {
      const max = d.branches[0]?.points || 1;
      return {
        rows: d.branches.map((b) => ({ no: b.rank, code: b.branchCode, name: b.branchName, pt: b.points, mine: b.isMine, ratio: b.points / max })),
        myBranch: d.myBranch ? { name: d.myBranch.branchName, rank: d.myBranch.rank, points: d.myBranch.points } : null,
      };
    },
  });
}
