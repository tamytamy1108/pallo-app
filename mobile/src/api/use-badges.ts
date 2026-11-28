/**
 * 내 배지 (api/badges.ts) 를 배지 칸 모양(data/my Badge)으로 바꿔요 — 배지 모두 보기 시트 · 축하 시트 · 마이 탭 배지 칸이 같이 써요.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { BADGE_RULE } from '@/data/badge-rules';
import type { Badge } from '@/data/my';

import type { MyBadge } from './badges';
import { markBadgesSeen } from './badges';
import { myBadgesQuery, queryKeys, unseenBadgesQuery } from './queries';

/** 서버 배지 → 배지 칸. 서버 배지는 그림으로 그리니 아이콘은 그림이 없을 때의 대신일 뿐이에요 (조건 유형을 알면 그 아이콘) */
export function toBadge(
  b: Pick<MyBadge, 'code' | 'name' | 'description' | 'imageUrl' | 'earned'> & Partial<Pick<MyBadge, 'earnedAt' | 'conditionType' | 'threshold' | 'progress'>>,
): Badge {
  const cond = b.conditionType && b.threshold != null ? { type: b.conditionType, threshold: b.threshold, progress: b.progress ?? null } : null;
  return {
    code: b.code,
    ic: cond ? BADGE_RULE[cond.type].ic : 'heart',
    imageUrl: b.imageUrl,
    name: b.name,
    desc: b.description,
    on: b.earned,
    earnedAt: b.earnedAt ?? null,
    cond,
  };
}

/**
 * 진행 — 못 받은 배지의 막대 · '2번 더' 문구에 써요.
 * null: 조건을 모르거나, 서버가 아직 셀 수 없거나(progress null), 랭킹처럼 낮을수록 좋은 값이라 막대로 못 그릴 때.
 */
export type BadgeProgress = { cur: number; need: number; left: number; ratio: number };
export function badgeProgress(b: Badge): BadgeProgress | null {
  const c = b.cond;
  if (!c || c.progress == null || BADGE_RULE[c.type].lowerIsBetter) return null;
  const need = Math.max(1, c.threshold);
  // 받은 배지는 기준만큼 가득 (기준보다 더 쌓여도 '1 / 1번')
  const cur = b.on ? need : Math.min(c.progress, need);
  return { cur, need, left: Math.max(0, need - cur), ratio: Math.min(1, cur / need) };
}

export type BadgeFilter = 'all' | 'on' | 'off';

export type MyBadgesView = {
  list: Badge[];
  earned: number;
  /** 가장 최근에 받은 배지 (받은 시각을 아는 것 중) */
  latest: Badge | null;
  /** 거의 다 왔어요 — 못 받은 배지 중 진행이 있는 것, 많이 온 순서로 2개 */
  near: Badge[];
};

/** 배지 모두 보기 — 칸 목록 · 받은 개수 · 최근 받은 배지 · 거의 다 온 배지 */
export function useMyBadges(enabled = true) {
  return useQuery({
    ...myBadgesQuery(),
    enabled,
    select: (rows): MyBadgesView => {
      const list = rows.map(toBadge);
      const earnedAt = (b: Badge) => (b.earnedAt ? Date.parse(b.earnedAt) : 0);
      const latest = list.filter((b) => b.on && b.earnedAt).sort((a, b) => earnedAt(b) - earnedAt(a))[0] ?? null;
      const near = list
        .filter((b) => !b.on)
        .map((b) => ({ b, p: badgeProgress(b) }))
        .filter((x) => x.p && x.p.cur > 0)
        .sort((x, y) => (y.p?.ratio ?? 0) - (x.p?.ratio ?? 0))
        .slice(0, 2)
        .map((x) => x.b);
      return { list, earned: list.filter((b) => b.on).length, latest, near };
    },
  });
}

/** 배지 하나 (상세 시트) — 모두 보기 목록에서 찾아요. 목록을 받기 전엔 fallback(마이 탭 미리보기 칸)을 보여 줘요 */
export function useMyBadge(code: string | null, fallback: Badge | null) {
  const all = useMyBadges(!!code);
  const found = code ? all.data?.list.find((b) => b.code === code) : undefined;
  return { badge: found ?? fallback, pending: all.isPending, error: all.isError ? all.error : null, refetch: all.refetch };
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
