/**
 * 마이 › 내 활동 목록 — 줄의 개수는 마이 탭 집계(GET /me/mypage activity), 줄을 눌러 여는 목록은 여기 (백엔드 MobileMyActivityV2Controller).
 *   GET /app/api/v2/me/meets?box=JOINED|SAVED  → 내 모임 · 찜한 모임 (동아리 · 번개 · 이벤트 칸별)
 *   GET /app/api/v2/me/saved-challenges         → 찜한 챌린지
 *   GET /app/api/v2/me/expressions?page=&size=  → 내 표현함 (page 는 1부터)
 * 조회만 해요 — 찜 토글 · 표현 저장/빼기는 아직 기기 상태(meet-store · data/challenge · state/expressions)로 해요.
 *
 * 서버가 지금 채우는 것: 내 모임의 동아리(방장 · 정식 멤버) · 번개(연 것 · 참여한 것), 내 표현함(표현 노트).
 * 이벤트 참여 · 모임 찜 · 챌린지 찜은 도메인이 없어 빈 목록이에요 (마이 탭 개수가 0 인 것과 같아요). 코호스트(CO_HOST)도 아직 안 와요.
 *
 * 가짜 서버는 기기 상태로 같은 모양을 만들어요 (id 는 기기 데이터 id 그대로 — 훅이 그 id 로 기기 데이터를 다시 찾아 그려요).
 */
import { findClub, findMeet, myClubRoles } from '@/components/meet/club-roles';
import { getMeetStore } from '@/components/meet/meet-store';
import { chCat, findChallenge, getChallengeState, isExpr, type Challenge } from '@/data/challenge';
import { EVENTS, type EventItem } from '@/data/events';
import { CLUB_CATS, CLUBS, MEETS, MONTHS, type Club, type Meet } from '@/data/meet';
import { getSavedExpressions, type ExpressionFrom, type SavedExpression } from '@/state/expressions';
import { getMe } from '@/state/me';
import { findEvent } from '@/components/event/event-model';

import { http } from './client';
import { apiConfig } from './config';
import { mock } from './mock';

type Opts = { signal?: AbortSignal };

export type MyMeetBox = 'JOINED' | 'SAVED';
export type MyClubRole = 'HOST' | 'CO_HOST' | 'MEMBER';

/** 동아리 한 줄 (다음 모임이 없으면 nextMeet* = null) */
export type MyClubItem = {
  id: string;
  name: string;
  categoryLabel: string | null;
  imageUrl: string | null;
  memberCount: number;
  /** null = 인원 제한 없음 */
  maxMembers: number | null;
  /** 'YYYY-MM-DD' */
  nextMeetDate: string | null;
  /** 'HH:mm' 또는 'HH:mm:ss' */
  nextMeetTime: string | null;
  nextMeetPlace: string | null;
  myRole: MyClubRole;
};

/** 날짜가 있는 모임 한 줄 (번개 · 이벤트 공통) */
export type MyGatheringItem = {
  id: string;
  title: string;
  /** 이벤트 분류 이름 (파티 · 클래스 …) — 번개는 null */
  categoryLabel: string | null;
  branchName: string | null;
  /** 'YYYY-MM-DD' */
  date: string;
  time: string | null;
  place: string | null;
  participantCount: number;
  /** null = 인원 제한 없음 */
  capacity: number | null;
  /** 1인 참가비(원) — null 이면 무료 · 각자 계산 */
  fee: number | null;
  imageUrl: string | null;
  hostedByMe: boolean;
};

export type MyMeets = { clubs: MyClubItem[]; meetups: MyGatheringItem[]; events: MyGatheringItem[] };

export type ChallengeVerifyCycle = 'DAILY' | 'THREE_PER_WEEK' | 'WEEKLY';

export type SavedChallengeItem = {
  id: string;
  title: string;
  categoryCode: string | null;
  categoryLabel: string | null;
  imageUrl: string | null;
  startDate: string | null;
  endDate: string | null;
  verifyCycle: ChallengeVerifyCycle | null;
  participantCount: number;
  hostedByMe: boolean;
};

export type SavedChallenges = { challenges: SavedChallengeItem[] };

export type ExpressionSourceKind = 'BOOK' | 'SITUATION' | 'FREE_TALK' | 'LISTENING';

export type MyExpression = {
  id: string;
  /** 핵심 표현 */
  expression: string;
  meaning: string | null;
  /** 예문 (저장한 문장) */
  example: string | null;
  /** 고친 문장 */
  fixedSentence: string | null;
  sourceKind: ExpressionSourceKind | null;
  /** 나온 곳 이름 (예: 'Lv.1 · 6챕터 No Spoilers!') */
  sourceTitle: string | null;
  /** ISO 시각 */
  savedAt: string;
};

export type MyExpressionPage = { rows: MyExpression[]; totalCount: number };

// ---------- 가짜 서버 (기기 상태 → 서버 모양) ----------

const pad = (n: number) => String(n).padStart(2, '0');
/** 예시 모임 날짜(mon · day · year) → 'YYYY-MM-DD' */
const isoDay = (it: { mon: string; day: string; year?: number }) => `${it.year ?? 2026}-${pad(MONTHS.indexOf(it.mon) + 1)}-${pad(Number(it.day))}`;
/** '토 19:30' → '19:30' */
const timeOf = (wd: string) => wd.split(' ')[1] ?? null;

const clubToItem = (c: Club, myRole: MyClubRole): MyClubItem => ({
  id: c.id,
  name: c.name,
  categoryLabel: CLUB_CATS.find((k) => k[0] === c.cc)?.[1] ?? null,
  imageUrl: c.posters?.[0] ?? null,
  memberCount: c.n,
  maxMembers: c.max > 0 ? c.max : null,
  nextMeetDate: null,
  nextMeetTime: null,
  nextMeetPlace: null,
  myRole,
});

const meetToItem = (m: Meet): MyGatheringItem => ({
  id: m.id,
  title: m.title,
  categoryLabel: null,
  branchName: m.br,
  date: isoDay(m),
  time: timeOf(m.wd),
  place: m.place,
  participantCount: m.cur,
  capacity: m.max,
  fee: null,
  imageUrl: m.posters?.[0] ?? null,
  hostedByMe: !!m.mine,
});

const eventToItem = (e: EventItem): MyGatheringItem => ({
  id: e.id,
  title: e.title,
  categoryLabel: e.kind,
  branchName: e.br,
  date: isoDay(e),
  time: timeOf(e.wd),
  place: e.place,
  participantCount: e.cur,
  capacity: e.noCap ? null : e.max,
  fee: e.fee ?? null,
  imageUrl: e.posters?.[0] ?? null,
  hostedByMe: !!e.mine,
});

/** 내 모임: 마이 내 모임 시트가 기기 상태로 셈하던 것과 같아요 (운영 중 동아리 → 가입한 동아리 · 참여한 번개 · 이벤트) */
function mockJoined(): MyMeets {
  const st = getMeetStore();
  const { hostOf, coOf } = myClubRoles(getMe().name, st.myClubs, st.cohost);
  const run = [...hostOf.map((c) => clubToItem(c, 'HOST')), ...coOf.map((c) => clubToItem(c, 'CO_HOST'))];
  const runIds = new Set(run.map((c) => c.id));
  const joined = CLUBS.filter((c) => st.club[c.id] === 'in' && !runIds.has(c.id)).map((c) => clubToItem(c, 'MEMBER'));
  return {
    clubs: [...run, ...joined],
    meetups: MEETS.filter((m) => st.joined[m.id]).map(meetToItem),
    events: EVENTS.filter((e) => st.joined[e.id]).map(eventToItem),
  };
}

/** 찜한 모임: 찜한 순서 그대로 이벤트 · 번개 · 동아리로 나눠요 */
function mockSaved(): MyMeets {
  const st = getMeetStore();
  const out: MyMeets = { clubs: [], meetups: [], events: [] };
  for (const id of Object.keys(st.saved)) {
    const e = findEvent(id);
    if (e) {
      out.events.push(eventToItem(e));
      continue;
    }
    const m = findMeet(id, st.myMeets);
    if (m) {
      out.meetups.push(meetToItem(m));
      continue;
    }
    const c = findClub(id, st.myClubs);
    if (c) out.clubs.push(clubToItem(c, 'MEMBER'));
  }
  return out;
}

const challengeToItem = (p: Challenge): SavedChallengeItem => ({
  id: p.id,
  title: isExpr(p) ? p.hl || p.name : p.name,
  categoryCode: p.cat ?? 'study',
  categoryLabel: chCat(p.cat).label,
  imageUrl: typeof p.cover === 'string' ? p.cover : null,
  startDate: p.start ?? null,
  endDate: null,
  verifyCycle: null,
  participantCount: p.members,
  hostedByMe: !!p.mine,
});

const SOURCE_KIND: Record<ExpressionFrom, ExpressionSourceKind> = { book: 'BOOK', trip: 'SITUATION', free: 'FREE_TALK', listen: 'LISTENING' };

const expressionToItem = (x: SavedExpression): MyExpression => ({
  id: x.id,
  expression: x.core ?? x.en,
  meaning: x.coreKo ?? x.ko ?? null,
  example: x.en,
  fixedSentence: x.fixed ?? null,
  sourceKind: x.from ? SOURCE_KIND[x.from] : null,
  sourceTitle: x.source || null,
  savedAt: new Date(x.savedAt).toISOString(),
});

// ---------- API ----------

/** GET /me/meets?box= */
export function fetchMyMeets(box: MyMeetBox, { signal }: Opts = {}): Promise<MyMeets> {
  if (apiConfig.useMock) return mock('myMeets', box === 'SAVED' ? mockSaved : mockJoined);
  return http.get('/me/meets', { query: { box }, signal });
}

/** GET /me/saved-challenges */
export function fetchSavedChallenges({ signal }: Opts = {}): Promise<SavedChallenges> {
  if (apiConfig.useMock)
    return mock('savedChallenges', () => {
      // 최근 찜한 게 앞 · 없어진 챌린지는 빼요
      const s = getChallengeState();
      const list = Object.keys(s.saved)
        .reverse()
        .map((id) => findChallenge(s, id))
        .filter((p): p is Challenge => !!p);
      return { challenges: list.map(challengeToItem) };
    });
  return http.get('/me/saved-challenges', { signal });
}

/** GET /me/expressions?page=&size= (page 는 1부터) */
export function fetchMyExpressions({ page = 1, size = 100, signal }: Opts & { page?: number; size?: number } = {}): Promise<MyExpressionPage> {
  if (apiConfig.useMock)
    return mock('myExpressions', () => {
      const all = getSavedExpressions().map(expressionToItem);
      return { rows: all.slice((page - 1) * size, page * size), totalCount: all.length };
    });
  return http.get('/me/expressions', { query: { page, size }, signal });
}
