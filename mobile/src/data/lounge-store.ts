/**
 * 라운지 화면 상태 (가짜). 프로토타입 LG 객체를 옮겼어요. 내가 한 일(글 · 댓글 · 좋아요 · 저장 · 스토리 · 동행 신청 등)은 기기에 남아요.
 * 맞는 API: 49 `/lounge/feed` · 50 `/posts` · 52 `/posts/:id/likes` · 53 `/:target/:id/comments` · 55 · 56 `/stories`
 * · 71 `/trips/:id/apply` · 73 `/abroad-profiles` · 77 `/blocks`. 백엔드가 생기면 서버 데이터로 바꿔요.
 * 탭 · 지점 · 서브 칩을 전역에 둬서 이벤트 탭에 갔다 와도 보던 탭으로 돌아와요.
 */
import type { Comment } from '@/components/common/comments-sheet';
import { createStore } from '@/lib/store';

import {
  type AbroadPerson,
  type AllSub,
  type ComSub,
  type CountryCode,
  FEED,
  type FeedItem,
  LG_CMTS,
  LG_CTIME,
  LG_PEOPLE,
  type LoungeTab,
  nameHash,
  type Post,
  STORIES,
  STORY_CMTS,
  STORY_DAY,
  type Story,
  type StoryCat,
  type Trip,
  type TripMode,
} from './lounge';

type LoungeState = {
  tab: LoungeTab;
  sub: { all: AllSub; com: ComSub; trip: TripMode };
  /** 고른 지점 (비어 있으면 전체) */
  brs: string[];
  /** 해외 지도에서 고른 나라 */
  cc: CountryCode | null;
  /** 추천 지도에서 고른 지역 → 번개 · 동아리 탭으로 넘겨요 */
  region: string | undefined;
  feed: FeedItem[];
  liked: Record<string, boolean>;
  saved: Record<string, boolean>;
  /** 프로 · 매니저가 '이 글 숨기기' 한 사람 (차단 목록은 공통 report-sheet) */
  hidden: Record<string, true>;
  cmts: Record<string, Comment[]>;
  stories: Story[];
  seen: Record<string, boolean>;
  sliked: Record<string, boolean>;
  scmts: Record<string, Comment[]>;
  trip: Record<string, 'wait' | 'ok'>;
  people: AbroadPerson[];
};

const LOUNGE0: LoungeState = {
  tab: 'all',
  sub: { all: 'all', com: 'all', trip: 'live' },
  brs: [],
  cc: null,
  region: undefined,
  feed: FEED,
  liked: {},
  saved: {},
  hidden: {},
  cmts: {},
  stories: STORIES,
  seen: {},
  sliked: {},
  scmts: {},
  trip: {},
  people: LG_PEOPLE,
};

/*
 * 기기 저장: 예시 글 · 스토리 · 사람은 코드에 있으니 남기지 않고, 내가 올린 것 · 바뀐 예시만 남겨요
 * (예시 데이터를 고쳐도 다음 실행에 바로 보이게). 보던 탭 · 칩은 이번 실행 동안만.
 */
type SavedLounge = Omit<LoungeState, 'tab' | 'sub' | 'brs' | 'cc' | 'region' | 'feed' | 'stories' | 'people'> & {
  feed: SeedDiff<FeedItem>;
  stories: SeedDiff<Story>;
  people: AbroadPerson[];
};
const saveLounge = ({ tab: _t, sub: _s, brs: _b, cc: _c, region: _r, feed, stories, people, ...rest }: LoungeState): SavedLounge => ({
  ...rest,
  feed: seedDiff(feed, FEED),
  stories: seedDiff(stories, STORIES),
  people: people.filter((p) => !LG_PEOPLE.includes(p)),
});
function loadLounge(saved: unknown, initial: LoungeState): LoungeState {
  if (!saved || typeof saved !== 'object') return initial;
  const s = saved as Partial<SavedLounge>;
  const rec = <T,>(v: T | undefined, fb: T) => (v && typeof v === 'object' && !Array.isArray(v) ? v : fb);
  return {
    ...initial,
    liked: rec(s.liked, initial.liked),
    saved: rec(s.saved, initial.saved),
    hidden: rec(s.hidden, initial.hidden),
    cmts: rec(s.cmts, initial.cmts),
    seen: rec(s.seen, initial.seen),
    sliked: rec(s.sliked, initial.sliked),
    scmts: rec(s.scmts, initial.scmts),
    trip: rec(s.trip, initial.trip),
    feed: seedMerge(s.feed, FEED),
    stories: seedMerge(s.stories, STORIES),
    people: [...(Array.isArray(s.people) ? s.people.filter((p) => p && typeof p.n === 'string') : []), ...LG_PEOPLE],
  };
}

const store = createStore<LoungeState>(LOUNGE0, { persist: { key: 'lounge', save: saveLounge, load: loadLounge } });

export const useLounge = store.useStore;
export const getLounge = store.get;
const patch = (p: Partial<LoungeState> | ((s: LoungeState) => Partial<LoungeState>)) => store.set((s) => ({ ...s, ...(typeof p === 'function' ? p(s) : p) }));

export const setLoungeTab = (tab: LoungeTab) => patch({ tab });
export const setAllSub = (v: AllSub) => patch((s) => ({ sub: { ...s.sub, all: v } }));
export const setComSub = (v: ComSub) => patch((s) => ({ sub: { ...s.sub, com: v } }));
export const setTripMode = (v: TripMode) => patch((s) => ({ sub: { ...s.sub, trip: v }, cc: null }));
export const setBranches = (brs: string[]) => patch({ brs });
export const setCountry = (cc: CountryCode | null) => patch({ cc });
/** 추천 탭 지도에서 지역을 누르면 번개 · 동아리 탭으로 (프로토타입 data-lgreg) */
export const openRegion = (region: string | undefined) => patch({ region, tab: 'meet' });

export const toggleLike = (id: string) => patch((s) => ({ liked: { ...s.liked, [id]: !s.liked[id] } }));
export const likeOn = (id: string) => patch((s) => ({ liked: { ...s.liked, [id]: true } }));
export const toggleSave = (id: string) => {
  patch((s) => ({ saved: { ...s.saved, [id]: !s.saved[id] } }));
  return !!getLounge().saved[id];
};
export const hideMember = (who: string) => patch((s) => ({ hidden: { ...s.hidden, [who]: true } }));
export const unhideMember = (who: string) =>
  patch((s) => {
    const next = { ...s.hidden };
    delete next[who];
    return { hidden: next };
  });

export const findItem = (id: string) => getLounge().feed.find((p) => p.id === id);
export const useItem = (id: string) => store.useStore((s) => s.feed.find((p) => p.id === id));

// ---- 댓글: 글마다 예시 두 개 (새 글은 0개) + 내가 단 것 ----
const seedCmts = (p: { id: string; c0?: 0 }): Comment[] =>
  (p.c0 === 0 ? [] : LG_CMTS.slice(0, 2)).map(([author, , text], i) => ({ id: `${p.id}-c${i}`, author, text, time: LG_CTIME[(nameHash(author) + i) % LG_CTIME.length], likes: nameHash(author + text) % 5 === 0 ? 0 : nameHash(text) % 9 }));
// 예시 댓글은 한 번 만든 배열을 다시 써요 (구독 값이 매번 새 배열이면 화면이 끝없이 다시 그려져요)
const seedCache = new Map<string, Comment[]>();
const cached = (key: string, make: () => Comment[]) => {
  if (!seedCache.has(key)) seedCache.set(key, make());
  return seedCache.get(key) as Comment[];
};
export const postComments = (s: LoungeState, p: { id: string; c0?: 0 }) => s.cmts[p.id] ?? cached(`p:${p.id}`, () => seedCmts(p));
export const addPostComment = (p: { id: string; c0?: 0 }, author: string, text: string) =>
  patch((s) => ({ cmts: { ...s.cmts, [p.id]: [...postComments(s, p), { id: `${p.id}-${Date.now()}`, author, text, time: '방금', mine: true, likes: 0 }] } }));

// ---- 글 · 동행 · 해외 카드 올리기 ----
export const addPost = (p: Post) => patch((s) => ({ feed: [{ ...p, at: p.at ?? Date.now() }, ...s.feed], sub: { ...s.sub, com: 'all' } }));
export const addTrip = (t: Trip) => patch((s) => ({ feed: [{ ...t, at: t.at ?? Date.now() }, ...s.feed], sub: { ...s.sub, trip: 'trip' }, cc: t.cc, tab: 'trip' }));
export const closeTrip = (id: string, closed: boolean) => patch((s) => ({ feed: s.feed.map((p) => (p.id === id && p.k === 'trip' ? { ...p, closed } : p)) }));
export const setTripState = (id: string, v: 'wait' | 'ok' | null) =>
  patch((s) => {
    const next = { ...s.trip };
    if (v) next[id] = v;
    else delete next[id];
    return { trip: next };
  });
export const addPerson = (p: AbroadPerson) => patch((s) => ({ people: [p, ...s.people], sub: { ...s.sub, trip: 'live' }, cc: null, tab: 'trip' }));
export const removeMyPerson = () => patch((s) => ({ people: s.people.filter((p) => !p.me) }));

// ---- 스토리 ----
/** 24시간 안 (고정 스토리는 늘 하이라이트) — 프로토타입 lgRecent */
export const isRecent = (x: Story) => !x.pin && x.h < STORY_DAY;
export type StoryGroup = { id: string; kind: 'u' | 'c'; mine?: boolean; who?: string; cat?: StoryCat; list: Story[] };

/** 사람별 동그라미 (내 것 → 안 본 사람 → 본 사람). 한 사람 안에서는 먼저 올린 것부터 — 프로토타입 lgUserGroups */
export function userGroups(s: LoungeState, ok: (x: Story) => boolean): StoryGroup[] {
  const m = new Map<string, Story[]>();
  s.stories
    .filter((x) => !s.hidden[x.who] && isRecent(x) && ok(x))
    .sort((a, b) => a.h - b.h)
    .forEach((x) => {
      const k = x.mine ? '__me' : x.who;
      m.set(k, [...(m.get(k) ?? []), x]);
    });
  const G: StoryGroup[] = [...m.entries()].map(([k, L]) => ({ id: `u:${k}`, kind: 'u', mine: k === '__me', who: L[0].who, list: L.slice().reverse() }));
  const un = (g: StoryGroup) => g.list.some((x) => !s.seen[x.id]);
  return [...G.filter((g) => g.mine), ...G.filter((g) => !g.mine && un(g)), ...G.filter((g) => !g.mine && !un(g))];
}
/** 카테고리 하이라이트 = 24시간 지난 스토리 + 매니저 고정 (고정 → 최근 순) — 프로토타입 lgHlList */
export const highlightList = (s: LoungeState, k: StoryCat, ok: (x: Story) => boolean) => s.stories.filter((x) => !s.hidden[x.who] && x.cat === k && !isRecent(x) && ok(x)).sort((a, b) => (b.pin ? 1 : 0) - (a.pin ? 1 : 0) || a.h - b.h);
/** 새 글 있는 하이라이트가 앞 (이벤트는 늘 맨 앞) — 프로토타입 lgHlCats */
export function highlightCats(s: LoungeState, ok: (x: Story) => boolean, cats: StoryCat[]) {
  const ks = cats.filter((k) => highlightList(s, k, ok).length);
  const un = (k: StoryCat) => highlightList(s, k, ok).some((x) => !s.seen[x.id]);
  return [...ks.filter((k) => k === 'event'), ...ks.filter((k) => k !== 'event' && un(k)), ...ks.filter((k) => k !== 'event' && !un(k))];
}
export const markSeen = (id: string) => {
  if (!getLounge().seen[id]) patch((s) => ({ seen: { ...s.seen, [id]: true } }));
};
export const toggleStoryLike = (id: string) => patch((s) => ({ sliked: { ...s.sliked, [id]: !s.sliked[id] } }));
export const storyComments = (s: LoungeState, id: string): Comment[] =>
  s.scmts[id] ??
  cached(`s:${id}`, () =>
    (STORY_CMTS[id] ?? []).map(([author, , text], i) => ({ id: `${id}-c${i}`, author, text, time: LG_CTIME[(nameHash(author) + i) % LG_CTIME.length], likes: nameHash(author + text) % 5 === 0 ? 0 : nameHash(text) % 9 })),
  );
export const addStoryComment = (id: string, author: string, text: string) => patch((s) => ({ scmts: { ...s.scmts, [id]: [...storyComments(s, id), { id: `${id}-${Date.now()}`, author, text, time: '방금', mine: true, likes: 0 }] } }));
export const addStory = (x: Story) => patch((s) => ({ stories: [x, ...s.stories], tab: 'all', sub: { ...s.sub, all: 'all' } }));
export const dropStory = (id: string) => patch((s) => ({ stories: s.stories.filter((x) => x.id !== id) }));
export const restoreStory = (x: Story) => patch((s) => ({ stories: [x, ...s.stories] }));
/** 매니저 고정 · 풀기 (고정하면 하이라이트 맨 앞에 계속 남아요) */
export const setStoryPin = (id: string, pin: boolean) => patch((s) => ({ stories: s.stories.map((x) => (x.id === id ? { ...x, pin } : x)) }));
/** 스토리 보기에서 넘겨 볼 묶음: 사람별 → 하이라이트 순 (프로토타입 lgGroups) */
export function storyGroups(s: LoungeState, ok: (x: Story) => boolean, cats: StoryCat[]): StoryGroup[] {
  return [...userGroups(s, ok), ...highlightCats(s, ok, cats).map((k): StoryGroup => ({ id: `c:${k}`, kind: 'c', cat: k, list: highlightList(s, k, ok) }))];
}

// ---- 예시 목록 + 내가 바꾼 것 (기기 저장용) ----
/** mine: 예시에 없는 것(내가 올린 것 · 맨 앞) · changed: 바뀐 예시 · gone: 빠진 예시 id */
type SeedDiff<T> = { mine: T[]; changed: T[]; gone: string[] };
function seedDiff<T extends { id: string }>(list: T[], seed: readonly T[]): SeedDiff<T> {
  const byId = new Map(seed.map((x) => [x.id, x]));
  const ids = new Set(list.map((x) => x.id));
  return {
    mine: list.filter((x) => !byId.has(x.id)),
    changed: list.filter((x) => byId.has(x.id) && byId.get(x.id) !== x),
    gone: seed.filter((x) => !ids.has(x.id)).map((x) => x.id),
  };
}
function seedMerge<T extends { id: string }>(d: SeedDiff<T> | undefined, seed: readonly T[]): T[] {
  if (!d || !Array.isArray(d.mine) || !Array.isArray(d.changed) || !Array.isArray(d.gone)) return [...seed];
  const changed = new Map(d.changed.map((x) => [x.id, x]));
  const gone = new Set(d.gone);
  const seedIds = new Set(seed.map((x) => x.id));
  return [...d.mine.filter((x) => x && typeof x.id === 'string' && !seedIds.has(x.id)), ...seed.filter((x) => !gone.has(x.id)).map((x) => changed.get(x.id) ?? x)];
}
