/**
 * 마이 탭 집계 (GET /me/mypage) 를 화면 부품 모양으로 바꿔 줘요 — 랭킹 시상대는 RankRow(얼굴 바탕색 포함), 배지는 Badge(아이콘 이름 확인).
 * 마이 탭은 탭이라 계속 켜져 있어서, 탭으로 돌아올 때 받아 둔 값이 오래됐으면(30초) 다시 받아요.
 * null(서버가 아직 집계 안 함)은 그대로 넘겨요 — '–' 로 보일지 숨길지는 화면이 정해요.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

import { BADGE_PATH, RANK_COLORS, type Badge, type BadgeIcon, type RankRow } from '@/data/my';

import { apiConfig } from './config';
import type { MyPage } from './my-page';
import { myPageQuery, queryKeys } from './queries';

export type MyPageView = Omit<MyPage, 'ranking' | 'badges'> & {
  ranking: { podium: RankRow[]; myRank: number | null; myPoints: number };
  badges: Badge[] | null;
};

const isBadgeIcon = (v: string): v is BadgeIcon => v in BADGE_PATH;

function toView(d: MyPage): MyPageView {
  return {
    ...d,
    ranking: {
      podium: d.ranking.podium.map((p, i) => ({ n: p.displayName, b: p.branchName ?? '', pt: p.points, c: RANK_COLORS[i % RANK_COLORS.length] })),
      myRank: d.ranking.me.rank,
      myPoints: d.ranking.me.points,
    },
    badges: d.badges?.map((b) => ({ ic: isBadgeIcon(b.icon) ? b.icon : 'heart', name: b.name, desc: b.description, on: b.earned })) ?? null,
  };
}

export function useMyPage() {
  const queryClient = useQueryClient();
  const q = useQuery({ ...myPageQuery(), select: toView });
  useFocusEffect(
    useCallback(() => {
      // 가짜 서버는 기기 값(표현 저장 · 모임 참여 등)이 mutation 없이 바뀌어서, 돌아올 때마다 다시 받아요
      void queryClient.refetchQueries({ queryKey: queryKeys.myPage, stale: apiConfig.useMock ? undefined : true });
    }, [queryClient]),
  );
  return q;
}
