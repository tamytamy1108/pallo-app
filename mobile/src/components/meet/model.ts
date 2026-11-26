/**
 * 번개 · 동아리 계산 (프로토타입 lgOpenMeet · lgRegCount · lgClubX · lgMembers · lgClubSess · lgCX 를 옮긴 것).
 * 화면은 여기 함수만 불러요. 백엔드가 생기면 서버가 계산해 주는 값으로 바꿔요.
 */
import {
  C,
  CLUB_ACT,
  CLUB_CATS,
  CLUB_CONTENT,
  CLUB_EXPR,
  CLUB_META,
  CLUB_SPOT,
  CLUBS,
  daysUntil,
  DESC,
  hashId,
  isPast,
  MEETS,
  MEMBER_HI,
  MEMBER_POOL,
  MEMBERS,
  REGIONS,
  SESSION_THEME,
  WEEK,
  type AlbumArt,
  type Club,
  type ClubPost,
  type Meet,
  type Region,
  ALL_REGIONS,
} from '@/data/meet';
import { branchMatches } from '@/components/lounge/branch-select';
import type { Role } from '@/state/me';

import { useMeetStore } from './meet-store';

export const useAllMeets = () => {
  const mine = useMeetStore((s) => s.myMeets);
  return mine.length ? [...mine, ...MEETS] : MEETS;
};
export const useAllClubs = () => {
  const mine = useMeetStore((s) => s.myClubs);
  return mine.length ? [...mine, ...CLUBS] : CLUBS;
};
export const findMeet = (id: string, mine: Meet[]) => mine.find((m) => m.id === id) ?? MEETS.find((m) => m.id === id);
export const findClub = (id: string, mine: Club[]) => mine.find((c) => c.id === id) ?? CLUBS.find((c) => c.id === id);

/** 고른 지점의 것만 · '전 지점' 행사는 늘 (프로토타입 lgBrOk — 여러 지점이면 '가산,연신내' 처럼 쉼표로) */
export const branchOk = (br: string, branch: string) => branchMatches(branch, br);

/** 모집 중인 번개 (닫지 않았고 · 지나지 않음) */
export const isOpenMeet = (m: Meet) => !m.closed && !isPast(m);

/** 지역별 [번개 수, 동아리 수] (프로토타입 lgRegCount) */
export function regionCounts(meets: Meet[], clubs: Club[], branch: string) {
  const c = Object.fromEntries(REGIONS.map(([r]) => [r, [0, 0]])) as Record<Region, [number, number]>;
  meets.forEach((m) => {
    if (branchOk(m.br, branch) && c[m.reg] && isOpenMeet(m)) c[m.reg][0]++;
  });
  clubs.forEach((k) => {
    // 지역 '전체' 동아리는 지역별 숫자에 세지 않아요
    if (k.reg === ALL_REGIONS) return;
    if (branchOk(k.br, branch) && c[k.reg] && !k.wait) c[k.reg][1]++;
  });
  return c;
}

export const clubCat = (c: Club) => CLUB_CATS.find((k) => k[0] === c.cc);
/** 최근 대화 · 최근 30일 가입 · 새로 생긴 (프로토타입 lgClubX) */
export const clubX = (c: Club) => {
  const h = hashId(c.id);
  return { act: c.mine ? '방금 만듦' : CLUB_ACT[h % 6], j30: c.mine ? 0 : 1 + (h % 5), fresh: !!(c.mine || c.wait) };
};
/** '영어로 이야기해요' · 언어 무관이면 '어떤 언어든 함께해요' */
export const clubLangLine = (c: Club) => (c.lang === '무관' || c.lang === '언어 무관' ? '어떤 언어든 함께해요' : `${c.lang}로 이야기해요`);
/** '최대 12명' · '인원 무관' */
export const clubCapLine = (c: Club) => (c.max > 0 ? `최대 ${c.max}명` : '인원 무관');
export const clubDesc = (c: Club) => c.intro || c.memo || DESC[c.id] || `${c.when}에 모여 ${clubLangLine(c)}. 처음 와도 편하게 섞일 수 있어요.`;
export const clubHost = (c: Club) => c.host.split(' ')[0];
export const clubSpot = (c: Club): [string, string] => CLUB_SPOT[c.id] ?? [c.when.split(' · ')[1] || `${c.br} 근처`, '자세한 주소는 호스트가 정하면 보여요'];
export const dayNames = (c: Club) => c.days.map((d) => WEEK[d]).join('·');

export type Member = { n: string; c: string; b: string; t: string; hi: string; me?: boolean };

type MeArg = { name: string; branch: string };
/**
 * 함께하는 멤버 (프로토타입 lgMembers): 나(참여했으면) → 호스트 → 예시 멤버. staff 는 코호스트 이름들.
 */
/** 호스트 이름만 ('하나 프로' · '매니저 Jay' → '하나' · 'Jay') — 프로필 주소 · 멤버 줄에 써요 */
export const hostName = (host: string) => host.replace(/^매니저 /, '').replace(/ 프로$/, '').trim() || host;

export function membersOf(it: { id: string; host: string; br: string; mine?: boolean }, cur: number, inMe: boolean, myHi: string, me: MeArg, staff: string[] = [], club = false) {
  const h = hashId(it.id);
  const hn = hostName(it.host);
  const L: Member[] = it.mine ? [] : [{ n: hn, c: C.pk, b: it.br === '전 지점' ? '본사' : it.br, t: '호스트', hi: club ? '편하게 와서 편하게 말해요. 반가워요!' : '처음 오는 분도 환영이에요. 입구에서 손 흔들게요!' }];
  if (inMe) L.unshift({ n: me.name, c: C.y, b: me.branch, t: it.mine ? '호스트 · 나' : '나', hi: myHi, me: true });
  const pool = [...MEMBERS, ...MEMBER_POOL].filter(([n]) => n !== hn);
  for (let i = 0; L.length < cur; i++) {
    const [n, c, b] = pool[(h + i) % pool.length];
    L.push({ n: i >= pool.length ? n + (Math.floor(i / pool.length) + 1) : n, c, b, t: '', hi: MEMBER_HI[(h + i) % MEMBER_HI.length] });
  }
  L.forEach((m) => {
    if (!m.t && staff.includes(m.n)) m.t = '코호스트';
  });
  return L.slice(0, cur);
}
/**
 * 잠금 없이 동아리를 다 보는 사람 (게시판 · 사진첩 · 채팅 · 정기 모임 참석): 멤버 · 호스트 · 코호스트(호스트가 정한 뒤) · 스텝(지점 관리자).
 * 가입 안 한 사람만 흐린 미리보기 + 잠금 칸이에요. 호스트 권한이 있는 곳엔 잠금이 없어요.
 */
export const clubOpen = (joined: boolean, role: 'host' | 'co' | null, meRole: Role) => joined || !!role || meRole === 'manager';

/** 동아리 코호스트 (예시: 첫 멤버 한 명, 프로토타입 lgStaffOf) — 호스트가 관리에서 정하면 그 이름들(meet-store cohost)로 바뀌어요 */
export function clubStaff(c: Club, cur: number, me: MeArg) {
  if (c.mine) return [];
  const L = membersOf(c, cur, false, '', me, [], true);
  return L.filter((m) => m.t !== '호스트').slice(0, 1).map((m) => m.n);
}

export type Session = { id: string; k: number; label: string; cap: number; cur: number; me: boolean; day: number; mon: number; no: number; wd: string; tm: string; th: string };
/** 다가오는 정기 모임 (모이는 요일 기준 · 기본 4주 안 4회, 프로토타입 lgClubSess) */
export function clubSessions(c: Club, att: Record<string, boolean>, max = 4, span = 29): Session[] {
  const t0 = new Date();
  t0.setHours(0, 0, 0, 0);
  const out: Session[] = [];
  const h = hashId(c.id);
  const tm = (c.when.match(/\d{1,2}:\d{2}/) || ['20:00'])[0];
  for (let k = 0; k < span && out.length < max; k++) {
    const d = new Date(t0);
    d.setDate(d.getDate() + k);
    if (!c.days.includes(d.getDay())) continue;
    const cap = Math.min(c.max || 8, 8);
    const base = out.length === 1 && h % 3 === 0 ? cap : out.length === 3 ? 1 + (h % 2) : 2 + ((h + k) % (cap - 2));
    const th = (SESSION_THEME[c.cc] || SESSION_THEME.study)[out.length % 4];
    const id = `${c.id}@${d.getMonth() + 1}-${d.getDate()}`;
    const me = !!att[id];
    out.push({ id, k, label: `${d.getMonth() + 1}.${d.getDate()}(${WEEK[d.getDay()]}) ${tm}`, cap, cur: base + (me ? 1 : 0), me, day: d.getDate(), mon: d.getMonth() + 1, no: 13 + (h % 40) + out.length, wd: WEEK[d.getDay()], tm, th });
  }
  return out;
}

/** 정기 모임 날짜마다 참석 멤버 (호스트 + 날짜별로 다른 멤버, 내가 참석하면 나 — 프로토타입 lgSessMem) */
export function sessionMembers(all: Member[], q: Session, me: MeArg, myHi: string) {
  const L = all.filter((m) => !m.me);
  const host = L[0];
  const rest = L.slice(1);
  const out: Member[] = host ? [host] : [];
  for (let i = 0; out.length < q.cur - (q.me ? 1 : 0) && i < rest.length; i++) out.push(rest[(i + q.k) % rest.length]);
  if (q.me) out.unshift({ n: me.name, c: C.y, b: me.branch, t: '나', hi: myHi, me: true });
  return out;
}

/** 동아리 예시 글 · 사진 · 채팅 — H · A~D 를 실제 이름으로, {..} 를 이 동아리 정보로 (프로토타입 lgCX) */
export function clubContent(c: Club) {
  const h = hashId(c.id);
  const hn = clubHost(c);
  const pool = MEMBERS.filter(([n]) => n !== hn);
  const pick = (i: number) => pool[(h + i * 2) % pool.length];
  const who = { H: [hn, C.pk], A: pick(0), B: pick(1), C: pick(2), D: pick(3) } as Record<string, readonly string[]>;
  const m = CLUB_META[c.id];
  const E = CLUB_EXPR[c.lang] || CLUB_EXPR[c.langs?.[0] ?? ''] || CLUB_EXPR['영어'];
  const V: Record<string, string> = { D: c.when, T: m?.thing || c.name, S: m?.spot2 || clubSpot(c)[0], L: c.lang, BR: c.br, N: c.name, E1: E[0], E2: E[1], E3: E[2], E4: E[3], E5: E[4], An: who.A[0], Bn: who.B[0], Cn: who.C[0], Dn: who.D[0], Hn: hn };
  const fill = (t: string) => t.replace(/\{(\w+)\}/g, (all, k: string) => V[k] ?? all);
  const R = CLUB_CONTENT[c.cc] || CLUB_CONTENT.study;
  const posts = R.posts.map(([k, w, ti, bd, t, lk, cm]): ClubPost => [k, w, fill(ti), fill(bd), t, lk, cm.map(([cw, ct]) => [cw, fill(ct)])]);
  const album = R.album.map(([k, cap]): [AlbumArt, string] => [k, fill(cap)]);
  return { posts, album, chat: R.chat, name: (k: string) => who[k][0], color: (k: string) => who[k][1], fill };
}

/** 번개 · 이벤트까지 남은 날 (정렬용) */
export const meetN = daysUntil;
