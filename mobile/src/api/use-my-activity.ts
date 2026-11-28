/**
 * 마이 › 내 활동 목록 훅 (api/my-activity) — 서버 모양을 지금 화면 부품(ClubRow · EventRow · ChCover · 표현 카드)이 쓰는 모양으로 바꿔 줘요.
 *
 * 라운지 동아리 · 번개 · 챌린지 · 이벤트 화면은 아직 기기 데이터라서, 같은 id 의 기기 데이터가 있으면 그걸 그대로 쓰고(가짜 서버는 늘 이 경우),
 * 없으면(진짜 서버 id) 받은 값으로 최소한의 모양을 만들어요. 라운지 화면이 서버를 쓰게 되면 기기 데이터 찾기는 빼요.
 *
 * 시트는 늘 그려져 있어서 열 때마다 다시 받아요. 가짜 서버는 기기 값(찜 · 참여 · 표현 저장)이 mutation 없이 바뀌어서, 그 값이 바뀌면 바로 다시 받아요.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';

import { findEvent, NO_CAP } from '@/components/event/event-model';
import { findClub, findMeet } from '@/components/meet/club-roles';
import { useMeetStore } from '@/components/meet/meet-store';
import { CH_CATS, findChallenge, useChallengeState, type ChCatKey, type Challenge } from '@/data/challenge';
import type { EventItem } from '@/data/events';
import { ALL_REGIONS, CLUB_CATS, MONTHS, NO_LIMIT, WEEK, type Club, type Meet } from '@/data/meet';
import { useSavedExpressions, type ExpressionFrom, type SavedExpression } from '@/state/expressions';

import { apiConfig } from './config';
import type { ExpressionSourceKind, MyClubItem, MyExpression, MyGatheringItem, MyMeetBox, MyMeets, SavedChallengeItem } from './my-activity';
import { myExpressionsQuery, myMeetsQuery, queryKeys, savedChallengesQuery } from './queries';

// ---------- 서버 모양 → 화면 모양 ----------

/** 'YYYY-MM-DD' → 예시 데이터 날짜 칸 (year · mon · day · 요일) */
function dayParts(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return { year: y, mon: MONTHS[m - 1], day: String(d), wdName: WEEK[new Date(y, m - 1, d).getDay()] };
}
const hm = (t: string | null) => (t ? t.slice(0, 5) : '');

/** 번개 · 이벤트 한 줄 → EventRow 모양 */
function gatheringRow(g: MyGatheringItem, kind: string): EventItem {
  const p = dayParts(g.date);
  return {
    id: g.id,
    ev: 'etc',
    kind,
    br: g.branchName ?? '',
    year: p.year,
    mon: p.mon,
    day: p.day,
    wd: `${p.wdName} ${hm(g.time)}`.trim(),
    title: g.title,
    place: g.place ?? '장소는 곧 알려 드려요',
    host: '',
    cur: g.participantCount,
    max: g.capacity ?? NO_CAP,
    noCap: g.capacity == null,
    fee: g.fee ?? undefined,
    posters: g.imageUrl ? [g.imageUrl] : undefined,
    mine: g.hostedByMe,
  };
}

/** 번개를 이벤트 한 줄 모양으로 (내 모임 시트가 쓰던 asRow 와 같아요) */
const meetRow = (m: Meet): EventItem => ({ id: m.id, ev: 'party', kind: '번개', br: m.br, day: m.day, mon: m.mon, wd: m.wd, title: m.title, place: m.place, host: m.host, cur: m.cur, max: m.max });

/** 동아리 한 줄 → ClubRow 모양 (기기 데이터가 없을 때만) */
function clubOf(x: MyClubItem): Club {
  const cc = CLUB_CATS.find((k) => k[1] === x.categoryLabel)?.[0] ?? 'study';
  const next = x.nextMeetDate ? dayParts(x.nextMeetDate) : null;
  const when = next ? `${MONTHS.indexOf(next.mon) + 1}월 ${next.day}일 ${next.wdName} ${hm(x.nextMeetTime)}`.trim() : '모임 일정 미정';
  return {
    id: x.id,
    cc,
    reg: ALL_REGIONS,
    name: x.name,
    lang: '무관',
    br: '',
    when,
    n: x.memberCount,
    max: x.maxMembers ?? NO_LIMIT,
    cond: '',
    host: '',
    days: [],
    posters: x.imageUrl ? [x.imageUrl] : undefined,
    intro: next ? `다음 모임 ${when}${x.nextMeetPlace ? ` · ${x.nextMeetPlace}` : ''}` : '다음 모임 일정은 곧 정해져요',
  };
}

const CYCLE_TEXT: Record<NonNullable<SavedChallengeItem['verifyCycle']>, string> = { DAILY: '매일', THREE_PER_WEEK: '주 3회', WEEKLY: '매주' };

/** 챌린지 한 줄 → ChCover · 한 줄 설명 모양 (기기 데이터가 없을 때만) */
function challengeOf(x: SavedChallengeItem): Challenge {
  const code = x.categoryCode?.toLowerCase();
  const cat: ChCatKey = CH_CATS.find((c) => c.key === code)?.key ?? 'free';
  const dur = x.startDate && x.endDate ? Math.round((Date.parse(x.endDate) - Date.parse(x.startDate)) / 864e5) + 1 : 0;
  return {
    id: x.id,
    cat,
    who: '',
    av: '',
    br: '',
    time: '',
    name: x.title,
    cover: x.imageUrl ?? undefined,
    freqT: x.verifyCycle ? CYCLE_TEXT[x.verifyCycle] : undefined,
    dur,
    host: '',
    members: x.participantCount,
    day: 0,
    of: dur,
    unit: '',
    lang: '',
    likes: 0,
    start: x.startDate ?? undefined,
    mine: x.hostedByMe,
  };
}

const FROM_OF: Record<ExpressionSourceKind, ExpressionFrom> = { BOOK: 'book', SITUATION: 'trip', FREE_TALK: 'free', LISTENING: 'listen' };

/** 표현 한 장 → 표현 카드 모양 (기기 데이터가 없을 때만) */
const expressionOf = (x: MyExpression): SavedExpression => ({
  id: x.id,
  en: x.example ?? x.expression,
  ko: x.meaning ?? '',
  fixed: x.fixedSentence ?? undefined,
  source: x.sourceTitle ?? '',
  savedAt: Date.parse(x.savedAt),
  from: x.sourceKind ? FROM_OF[x.sourceKind] : undefined,
  core: x.expression,
  coreKo: x.meaning ?? undefined,
});

// ---------- 훅 ----------

/** 가짜 서버만: 첫 그림 뒤 기기 값이 바뀌면 다시 받아요 (진짜 서버는 그 값을 바꾸는 mutation 이 무효화해요) */
function useMockChanged(changed: unknown, invalidate: () => void) {
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (apiConfig.useMock) invalidate();
  }, [changed, invalidate]);
}

export type MyClubRow = { c: Club; role?: 'host' | 'co' };
export type MyMeetsView = {
  /** 운영 중(방장 · 코호스트) 먼저, 그다음 가입 · 찜한 동아리 */
  clubs: MyClubRow[];
  /** 번개 — EventRow 모양 */
  meetups: EventItem[];
  events: EventItem[];
};

/** 내 모임(JOINED) · 찜한 모임(SAVED). open: 시트가 열려 있는지 (열 때마다 다시 받아요) */
export function useMyMeets(box: MyMeetBox, open: boolean) {
  const queryClient = useQueryClient();
  const q = useQuery({ ...myMeetsQuery(box), enabled: open });
  const myMeets = useMeetStore((s) => s.myMeets);
  const myClubs = useMeetStore((s) => s.myClubs);
  const invalidate = useMemo(() => () => void queryClient.invalidateQueries({ queryKey: queryKeys.myMeets(box) }), [queryClient, box]);
  useEffect(() => {
    if (open) invalidate();
  }, [open, invalidate]);
  const st = useMeetStore((s) => s);
  useMockChanged(box === 'SAVED' ? st.saved : [st.joined, st.club, st.cohost, st.myClubs], invalidate);

  const view = useMemo<MyMeetsView | undefined>(() => {
    const d: MyMeets | undefined = q.data;
    if (!d) return undefined;
    return {
      clubs: d.clubs.map((x) => ({
        c: findClub(x.id, myClubs) ?? clubOf(x),
        role: x.myRole === 'HOST' ? 'host' : x.myRole === 'CO_HOST' ? 'co' : undefined,
      })),
      meetups: d.meetups.map((x) => {
        const m = findMeet(x.id, myMeets);
        return m ? meetRow(m) : gatheringRow(x, '번개');
      }),
      events: d.events.map((x) => findEvent(x.id) ?? gatheringRow(x, x.categoryLabel ?? '이벤트')),
    };
  }, [q.data, myClubs, myMeets]);
  return { ...q, view };
}

/** 찜한 모임 시트 한 줄 (동아리 · 번개 · 이벤트) */
export type MeetLine = { id: string; tag: string; title: string; sub: string; href: Href };
const md = (it: { mon: string; day: string }) => `${MONTHS.indexOf(it.mon) + 1}월 ${Number(it.day)}일`;

/** 찜한 모임 · 내 모임 목록을 한 줄 목록으로 (동아리 → 번개 → 이벤트, 같은 종류 안에서는 받은 순서) */
export function meetLines(v: MyMeetsView): MeetLine[] {
  return [
    ...v.clubs.map(({ c }): MeetLine => ({ id: c.id, tag: '동아리', title: c.name, sub: c.br ? `${c.when} · ${c.br}` : c.when, href: { pathname: '/club/[id]', params: { id: c.id } } })),
    ...v.meetups.map((m): MeetLine => ({ id: m.id, tag: '번개', title: m.title, sub: `${md(m)} ${m.wd} · ${m.br}`, href: { pathname: '/meet/[id]', params: { id: m.id } } })),
    ...v.events.map((e): MeetLine => ({ id: e.id, tag: `이벤트 · ${e.kind}`, title: e.title, sub: `${md(e)} ${e.wd} · ${e.br}`, href: { pathname: '/events/[id]', params: { id: e.id } } })),
  ];
}

/** 찜한 챌린지 (최근 찜한 게 위) */
export function useSavedChallenges(open: boolean) {
  const queryClient = useQueryClient();
  const q = useQuery({ ...savedChallengesQuery(), enabled: open });
  const s = useChallengeState();
  const invalidate = useMemo(() => () => void queryClient.invalidateQueries({ queryKey: queryKeys.savedChallenges }), [queryClient]);
  useEffect(() => {
    if (open) invalidate();
  }, [open, invalidate]);
  useMockChanged(s.saved, invalidate);
  const list = useMemo(() => q.data?.challenges.map((x) => findChallenge(s, x.id) ?? challengeOf(x)), [q.data, s]);
  return { ...q, list };
}

/** 내 표현함 (최근 저장한 게 위) — 화면에 있는 동안 받아요 */
export function useMyExpressions() {
  const queryClient = useQueryClient();
  const q = useQuery(myExpressionsQuery());
  const local = useSavedExpressions();
  const invalidate = useMemo(() => () => void queryClient.invalidateQueries({ queryKey: queryKeys.myExpressions }), [queryClient]);
  useMockChanged(local, invalidate);
  const list = useMemo(() => q.data?.rows.map((x) => local.find((l) => l.id === x.id) ?? expressionOf(x)), [q.data, local]);
  return { ...q, list };
}
