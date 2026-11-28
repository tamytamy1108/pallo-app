/**
 * 내 배지 (api/badges.ts) 를 배지 칸 모양(data/my Badge)으로 바꿔요 — 배지 모두 보기 시트 · 축하 시트 · 마이 탭 배지 칸이 같이 써요.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Badge } from '@/data/my';

import type { MyBadge } from './badges';
import { markBadgesSeen } from './badges';
import { myBadgesQuery, queryKeys, unseenBadgesQuery } from './queries';

/** 서버 배지 → 배지 칸. 서버 배지는 그림으로 그리니 아이콘은 그림이 없을 때의 대신일 뿐이에요 */
export function toBadge(b: Pick<MyBadge, 'code' | 'name' | 'description' | 'imageUrl' | 'earned'>): Badge {
  return { code: b.code, ic: 'heart', imageUrl: b.imageUrl, name: b.name, desc: b.description, on: b.earned };
}

export type MyBadgesView = { list: Badge[]; earned: number };

/** 배지 모두 보기 — 칸 목록과 받은 개수 */
export function useMyBadges(enabled = true) {
  return useQuery({
    ...myBadgesQuery(),
    enabled,
    select: (rows): MyBadgesView => ({ list: rows.map(toBadge), earned: rows.filter((b) => b.earned).length }),
  });
}

/** 축하 시트를 띄울 배지 (받은 순). 없으면 빈 목록 */
export function useUnseenBadges(enabled: boolean) {
  return useQuery({ ...unseenBadgesQuery(), enabled, select: (rows) => rows.map(toBadge) });
}

/** 띄운 배지를 본 것으로 — 끝나면 안 본 배지 · 모두 보기 · 마이 탭을 다시 받아요 */
export function useMarkBadgesSeen() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markBadgesSeen,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.badgesAll }),
        queryClient.invalidateQueries({ queryKey: queryKeys.myPage }),
      ]),
  });
}
