/**
 * 라운지 탭 '새 글' 배지 — 탭마다 '마지막으로 본 때'를 기기에 두고, 서버(GET /lounge/unread-counts)에 보내서
 * 그 뒤로 올라온 수를 받아요. 서버는 아무것도 저장하지 않아요.
 *
 * - 시계: 기기 시계가 틀려도 맞게, 응답의 serverTime 과 기기 시계 차이를 기억해 두고 '본 때'는 서버 시계로 남겨요.
 * - 처음(저장된 때가 없는 탭): 보내지 않아서 0 이고, 받은 serverTime 을 그 탭의 '본 때'로 남겨요 (설치 직후 배지가 우르르 뜨지 않게).
 * - 탭을 열 때 · 떠날 때 그 탭을 본 걸로 해요. 받아 둔 수는 보낸 기준이 그대로인 탭만 보여요 (열었던 탭은 바로 0).
 * - 다시 받는 때: 라운지 화면에 돌아올 때 · 당겨서 새로고침할 때만 (주기적으로 세지 않아요).
 */
import { useQuery } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';

import { getBlockedNames } from '@/components/common/report-sheet';
import { getMeetStore } from '@/components/meet/meet-store';
import { CHALLENGES, getChallengeState } from '@/data/challenge';
import type { LoungeTab } from '@/data/lounge';
import { getLounge } from '@/data/lounge-store';
import { CLUBS, MEETS } from '@/data/meet';
import { SEED_SEEN_AT } from '@/data/seed-time';
import { createStore } from '@/lib/store';

import { apiConfig } from './config';
import { LOUNGE_BADGE_TABS, LOUNGE_UNREAD_CAP, type LoungeBadgeTab, type LoungeUnreadSince, setLoungeUnreadMock } from './lounge';
import { loungeUnreadCountsQuery } from './queries';

/** 탭마다 마지막으로 본 때 (서버 시계 ms) */
type SeenAt = Partial<Record<LoungeTab, number>>;

const isSeenAt = (v: unknown): v is SeenAt => !!v && typeof v === 'object' && !Array.isArray(v) && Object.values(v).every((x) => typeof x === 'number');

// 가짜 서버일 땐 예시 기준 시각에서 시작해요 → `at: SEED_NEW_AT` 예시 몇 개가 새 글로 보여 배지를 바로 볼 수 있어요 (data/seed-time.ts)
const SEEN0: SeenAt = apiConfig.useMock ? Object.fromEntries(LOUNGE_BADGE_TABS.map((k) => [k, SEED_SEEN_AT])) : {};
const store = createStore<SeenAt>(SEEN0, { persist: { key: 'lounge-seen', load: (saved, initial) => (isSeenAt(saved) ? saved : initial) } });

/** 서버 시계 - 기기 시계 (ms). 응답을 받기 전엔 0 */
let clockOffset = 0;
const serverNow = () => Date.now() + clockOffset;

const iso = (ms: number | undefined) => (ms == null ? undefined : new Date(ms).toISOString());

/** 지금 저장된 '본 때' → 보낼 값 (없는 탭은 빼요) */
function currentSince(): LoungeUnreadSince {
  const seen = store.get();
  const out: LoungeUnreadSince = {};
  LOUNGE_BADGE_TABS.forEach((k) => {
    const v = iso(seen[k]);
    if (v) out[k] = v;
  });
  return out;
}

const isBadgeTab = (tab: LoungeTab): tab is LoungeBadgeTab => (LOUNGE_BADGE_TABS as LoungeTab[]).includes(tab);

/* 가짜 서버: 기기 안 예시 글 · 챌린지 · 번개 · 동아리를 서버와 같은 규칙으로 세요 (내 것 · 차단 · 숨김 빼고, 10개까지) */
type Stamped = { at?: number; mine?: boolean };
function countSince(list: Stamped[], since: string | undefined) {
  const t = since ? Date.parse(since) : NaN;
  if (!Number.isFinite(t)) return 0;
  return Math.min(LOUNGE_UNREAD_CAP, list.filter((x) => !x.mine && (x.at ?? 0) > t).length);
}
setLoungeUnreadMock((since) => {
  const { feed, hidden } = getLounge();
  const blocked = getBlockedNames();
  const { myMeets, myClubs } = getMeetStore();
  const posts = feed.flatMap((p) => (p.k === 'post' && !blocked.includes(p.who) && !hidden[p.who] ? [p] : []));
  const chals = [...getChallengeState().created, ...CHALLENGES].filter((c) => !blocked.includes(c.who));
  return {
    com: countSince(posts, since.com),
    chal: countSince(chals, since.chal),
    meet: Math.min(LOUNGE_UNREAD_CAP, countSince([...myMeets, ...MEETS], since.meet) + countSince([...myClubs, ...CLUBS], since.meet)),
  };
});

/** 탭별 새 글 수 (라운지 위 탭 배지). 추천 · 배지 없는 탭은 0 */
export function useNewCounts(): Record<LoungeTab, number> {
  const seen = store.useStore();
  const { data, refetch } = useQuery(loungeUnreadCountsQuery(currentSince));

  useEffect(() => {
    if (!data) return;
    const st = Date.parse(data.serverTime);
    if (!Number.isFinite(st)) return;
    clockOffset = st - Date.now();
    const missing = LOUNGE_BADGE_TABS.filter((k) => store.get()[k] == null);
    if (missing.length) store.set((s) => ({ ...s, ...Object.fromEntries(missing.map((k) => [k, st])) }));
  }, [data]);

  // 다른 화면에 갔다가 라운지로 돌아오면 다시 세요 (처음 뜰 때는 useQuery 가 이미 받아요)
  const first = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (first.current) {
        first.current = false;
        return;
      }
      void refetch();
    }, [refetch]),
  );

  const count = (k: LoungeTab) => (isBadgeTab(k) && data && data.sent[k] === iso(seen[k]) ? data[k] : 0);
  return { all: 0, com: count('com'), chal: count('chal'), meet: count('meet'), trip: 0 };
}

/** 탭을 열었어요: 그 탭 배지를 지워요 */
export const enterLoungeTab = (tab: LoungeTab) => store.set((s) => ({ ...s, [tab]: serverNow() }));
/** 탭을 떠나요 (다른 탭 · 다른 화면): 보는 동안 올라온 것도 본 걸로 */
export const leaveLoungeTab = (tab: LoungeTab) => store.set((s) => ({ ...s, [tab]: serverNow() }));
