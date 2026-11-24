/**
 * 라운지 '새 글' 배지 — 탭마다 마지막으로 본 뒤에 올라온 글 · 챌린지 · 번개 · 동아리 · 동행 수.
 * 마지막으로 본 때는 기기에 남아요. 처음엔 data/seed-time 의 기준 시각이라 예시 몇 개만 새 글이에요.
 * 내가 올린 것은 세지 않아요. 백엔드가 생기면 서버의 '안 읽은 수'로 바꿔요.
 */
import { getBlockedNames, useBlockedNames } from '@/components/common/report-sheet';
import { getMeetStore, useMeetStore } from '@/components/meet/meet-store';
import { CHALLENGES, type Challenge, getChallengeState, useCreatedChallenges } from '@/data/challenge';
import type { FeedItem, LoungeTab } from '@/data/lounge';
import { getLounge, useLounge } from '@/data/lounge-store';
import { CLUBS, type Club, type Meet, MEETS } from '@/data/meet';
import { SEED_SEEN_AT } from '@/data/seed-time';
import { createStore } from '@/lib/store';

/** 배지를 다는 탭 (추천은 빼요) */
export const BADGE_TABS: LoungeTab[] = ['com', 'chal', 'meet', 'trip'];

type SeenAt = Partial<Record<LoungeTab, number>>;
/** pill: 탭을 열 때 남아 있던 새 글 수 — 피드 위 '새 글 N개' 버튼 (이번 실행 동안만) */
type SeenState = { at: SeenAt; pill: { tab: LoungeTab; n: number } | null };

const isSeenAt = (v: unknown): v is SeenAt => !!v && typeof v === 'object' && !Array.isArray(v) && Object.values(v).every((x) => typeof x === 'number');

const store = createStore<SeenState>(
  { at: {}, pill: null },
  { persist: { key: 'lounge-seen', save: (s) => s.at, load: (saved, initial) => (isSeenAt(saved) ? { ...initial, at: saved } : initial) } },
);

type Sources = { feed: FeedItem[]; hidden: Record<string, true>; blocked: string[]; created: Challenge[]; myMeets: Meet[]; myClubs: Club[] };
type Stamped = { at?: number; mine?: boolean };

const countSince = (list: Stamped[], since: number) => list.filter((x) => !x.mine && (x.at ?? 0) > since).length;

function countNew(tab: LoungeTab, src: Sources, seen: SeenAt) {
  const since = seen[tab] ?? SEED_SEEN_AT;
  const visible = (p: FeedItem) => !('who' in p && (src.blocked.includes(p.who) || src.hidden[p.who]));
  switch (tab) {
    case 'com':
      return countSince(src.feed.flatMap((p) => (p.k === 'post' && visible(p) ? [p] : [])), since);
    case 'trip':
      return countSince(src.feed.flatMap((p) => ((p.k === 'trip' || p.k === 'abroad') && visible(p) ? [p] : [])), since);
    case 'chal':
      return countSince([...src.created, ...CHALLENGES].filter((p) => !src.blocked.includes(p.who)), since);
    case 'meet':
      return countSince([...src.myMeets, ...MEETS], since) + countSince([...src.myClubs, ...CLUBS], since);
    case 'all':
      return 0;
  }
}

/** 탭별 새 글 수 (배지 · 아래 탭 바 점) */
export function useNewCounts(): Record<LoungeTab, number> {
  const feed = useLounge((s) => s.feed);
  const hidden = useLounge((s) => s.hidden);
  const blocked = useBlockedNames();
  const created = useCreatedChallenges();
  const myMeets = useMeetStore((s) => s.myMeets);
  const myClubs = useMeetStore((s) => s.myClubs);
  const seen = store.useStore((s) => s.at);
  const src: Sources = { feed, hidden, blocked, created, myMeets, myClubs };
  return { all: 0, com: countNew('com', src, seen), chal: countNew('chal', src, seen), meet: countNew('meet', src, seen), trip: countNew('trip', src, seen) };
}

/** 라운지 어느 탭에든 새 글이 있나 (아래 탭 바 '라운지' 점) */
export const useLoungeHasNew = () => {
  const n = useNewCounts();
  return BADGE_TABS.some((t) => n[t] > 0);
};

export const useNewPill = () => store.useStore((s) => s.pill);

const nowSources = (): Sources => {
  const l = getLounge();
  const m = getMeetStore();
  return { feed: l.feed, hidden: l.hidden, blocked: getBlockedNames(), created: getChallengeState().created, myMeets: m.myMeets, myClubs: m.myClubs };
};

/** 탭을 열었어요: 남아 있던 새 글 수는 '새 글 N개' 버튼으로 옮기고, 배지는 지워요 */
export const enterLoungeTab = (tab: LoungeTab) =>
  store.set((s) => {
    const n = BADGE_TABS.includes(tab) ? countNew(tab, nowSources(), s.at) : 0;
    return { at: { ...s.at, [tab]: Date.now() }, pill: n ? { tab, n } : null };
  });
/** 탭을 떠나요 (다른 탭 · 다른 화면): 보는 동안 올라온 것도 본 걸로 */
export const leaveLoungeTab = (tab: LoungeTab) => store.set((s) => ({ at: { ...s.at, [tab]: Date.now() }, pill: null }));
export const dismissNewPill = () => store.set((s) => (s.pill ? { ...s, pill: null } : s));
