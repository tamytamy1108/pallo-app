/**
 * 라운지 '새 글' 배지 — 탭마다 마지막으로 본 뒤에 올라온 글 · 챌린지 · 번개 · 동아리 · 동행 수.
 * 마지막으로 본 때는 기기에 남아요. 처음엔 data/seed-time 의 기준 시각이라 예시 몇 개만 새 글이에요.
 * 내가 올린 것은 세지 않아요. 백엔드가 생기면 서버의 '안 읽은 수'로 바꿔요.
 */
import { useBlockedNames } from '@/components/common/report-sheet';
import { useMeetStore } from '@/components/meet/meet-store';
import { CHALLENGES, type Challenge, useCreatedChallenges } from '@/data/challenge';
import type { FeedItem, LoungeTab } from '@/data/lounge';
import { useLounge } from '@/data/lounge-store';
import { CLUBS, type Club, type Meet, MEETS } from '@/data/meet';
import { SEED_SEEN_AT } from '@/data/seed-time';
import { createStore } from '@/lib/store';

/** 배지를 다는 탭 (추천은 빼요) */
export const BADGE_TABS: LoungeTab[] = ['com', 'chal', 'meet', 'trip'];

/** 탭마다 마지막으로 본 때 */
type SeenAt = Partial<Record<LoungeTab, number>>;

const isSeenAt = (v: unknown): v is SeenAt => !!v && typeof v === 'object' && !Array.isArray(v) && Object.values(v).every((x) => typeof x === 'number');

const store = createStore<SeenAt>({}, { persist: { key: 'lounge-seen', load: (saved, initial) => (isSeenAt(saved) ? saved : initial) } });

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

/** 탭별 새 글 수 (라운지 위 탭 배지) */
export function useNewCounts(): Record<LoungeTab, number> {
  const feed = useLounge((s) => s.feed);
  const hidden = useLounge((s) => s.hidden);
  const blocked = useBlockedNames();
  const created = useCreatedChallenges();
  const myMeets = useMeetStore((s) => s.myMeets);
  const myClubs = useMeetStore((s) => s.myClubs);
  const seen = store.useStore((s) => s);
  const src: Sources = { feed, hidden, blocked, created, myMeets, myClubs };
  return { all: 0, com: countNew('com', src, seen), chal: countNew('chal', src, seen), meet: countNew('meet', src, seen), trip: countNew('trip', src, seen) };
}

/** 탭을 열었어요: 그 탭 배지를 지워요 */
export const enterLoungeTab = (tab: LoungeTab) => store.set((s) => ({ ...s, [tab]: Date.now() }));
/** 탭을 떠나요 (다른 탭 · 다른 화면): 보는 동안 올라온 것도 본 걸로 */
export const leaveLoungeTab = (tab: LoungeTab) => store.set((s) => ({ ...s, [tab]: Date.now() }));
