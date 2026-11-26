/**
 * 마이 탭 집계 (GET /me/mypage) 를 화면 부품 모양으로 바꿔 줘요 — 랭킹 시상대는 RankRow(얼굴 바탕색 포함), 배지는 Badge(아이콘 이름 확인).
 * 마이 탭은 탭이라 계속 켜져 있어서, 탭으로 돌아올 때 받아 둔 값이 오래됐으면(30초) 다시 받아요.
 * 칸(proStats · proNote · myClasses · study · badges)은 null 이면 화면이 그리지 않아요 (api/my-page.ts).
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';

import { useNoteState } from '@/components/account/store';
import { useChallengeState } from '@/data/challenge';
import { BADGE_PATH, RANK_COLORS, type Badge, type BadgeIcon, type RankRow } from '@/data/my';
import { isMember } from '@/state/access';
import { isProLike, useMe } from '@/state/me';

import { apiConfig } from './config';
import type { MyPage } from './my-page';
import { myPageQuery, queryKeys } from './queries';

export type MyPageView = Omit<MyPage, 'ranking' | 'badges'> & {
  ranking: { podium: RankRow[]; myRank: number | null; myPoints: number };
  /** null 이면 배지 칸을 그리지 않아요 */
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
  useMockDeviceRefetch();
  return q;
}

/**
 * 가짜 서버만: 마이 탭 안에서 기기 값(팔로우 · 스파크 · 노트 읽음 · 챌린지 찜)이 바뀌면 바로 다시 받아요 — 팔로우 시트에서 팔로우하면
 * 카드 숫자가, 찜한 챌린지 시트에서 찜을 풀면 개수가 같이 바뀌게. 진짜 서버는 그 값을 바꾸는 API 의 mutation 이 무효화해요.
 */
function useMockDeviceRefetch() {
  const queryClient = useQueryClient();
  const following = useMe((s) => s.following);
  const sparks = useMe((s) => s.sparks);
  const member = useMe(isMember);
  const pro = useMe((s) => isProLike(s.role));
  const noteRead = useNoteState().read;
  const savedChallenges = useChallengeState().saved;
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (apiConfig.useMock) void queryClient.invalidateQueries({ queryKey: queryKeys.myPage });
  }, [queryClient, following, sparks, member, pro, noteRead, savedChallenges]);
}
