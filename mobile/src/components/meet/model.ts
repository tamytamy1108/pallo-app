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
  CLUB_MEMBERS,
} from '@/data/meet';
import { branchMatches } from '@/components/lounge/branch-select';
import { devClubRole } from '@/lib/dev-profile';
import type { Me, Role, StudyLang } from '@/state/me';

import { useMeetStore, type ClubSched } from './meet-store';

export const useAllMeets = () => {
  const mine = useMeetStore((s) => s.myMeets);
  return mine.length ? [...mine, ...MEETS] : MEETS;
};
/** 운영 중인 동아리 (승인됐고 · 거절 · 닫힘이 아니에요) */
export const clubLive = (c: Club) => !c.wait && !c.rejected && !c.closed;

/** 목록에 보이는 동아리: 내가 만든 것 중 운영 중인 것 + 예시 (검토 중 · 거절은 '내가 신청한 동아리' 카드에만) */
export const useAllClubs = () => {
  const mine = useMeetStore((s) => s.myClubs);
  const shown = mine.filter(clubLive);
  return shown.length ? [...shown, ...CLUBS] : CLUBS;
};

/**
 * 내 호스트 · 코호스트 자격 — 운영 중인 동아리가 있을 때만 있어요.
 * 호스트: 내가 만든 동아리가 관리자 승인을 받았고 닫히지 않았을 때 (내가 만든 동아리만 관리해요).
 * 코호스트: 그 동아리 호스트가 나를 코호스트로 정했고 동아리가 운영 중일 때. 동아리가 닫히면 같이 없어져요.
 * badge: 마이 · 프로필 이름 옆 뱃지 (호스트가 먼저). 0개가 되면 null — 기록은 meet-store hostLog 에 남아요.
 */
/** 개발용 '운영 중인 동아리' (모임 역할을 호스트 · 코호스트로 골랐을 때) */
const DEV_RUN_CLUB = 'cl4';

export function useMyClubRoles(myName: string) {
  const mine = useMeetStore((s) => s.myClubs);
  const cohost = useMeetStore((s) => s.cohost);
  // 내가 만든 동아리라도 호스트를 넘겼으면 호스트가 아니에요 (host 칸이 나일 때만)
  const real = mine.filter((c) => clubLive(c) && clubHost(c) === myName);
  const all = [...mine, ...CLUBS];
  const realCo = all.filter((c) => clubLive(c) && !real.includes(c) && (cohost[c.id] ?? []).includes(myName));
  // 개발용: 마이 '개발 · 사람'에서 모임 역할을 호스트 · 코호스트로 고르면, 예시 동아리 하나를 운영 중인 것으로 봐요 (뱃지 · 내 모임 확인용)
  const devClub = __DEV__ && (devClubRole === 'host' || devClubRole === 'co') ? CLUBS.find((c) => c.id === DEV_RUN_CLUB) : undefined;
  const hostOf = devClub && devClubRole === 'host' ? [...real, devClub] : real;
  const coOf = devClub && devClubRole === 'co' ? [...realCo, devClub] : realCo;
  const badge: 'host' | 'co' | null = hostOf.length ? 'host' : coOf.length ? 'co' : null;
  return { hostOf, coOf, badge };
}
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
/** 모이는 장소 [이름, 자세한 주소] — 호스트가 적은 장소가 먼저 (동아리 만들기 · 고치기) */
export const clubSpot = (c: Club): [string, string] =>
  c.place ? [c.place, c.addr || '자세한 주소는 호스트에게 물어봐 주세요'] : CLUB_SPOT[c.id] ?? [c.when.split(' · ')[1] || `${c.br} 근처`, '자세한 주소는 호스트가 정하면 보여요'];
export const dayNames = (c: Club) => c.days.map((d) => WEEK[d]).join('·');

export type Member = { n: string; c: string; b: string; t: string; hi: string; me?: boolean };

type MeArg = { name: string; branch: string };
/**
 * 함께하는 멤버 (프로토타입 lgMembers): 나(참여했으면) → 호스트 → 예시 멤버. staff 는 코호스트 이름들.
 */
/** 호스트 이름만 ('하나 프로' · '매니저 Jay' → '하나' · 'Jay') — 프로필 주소 · 멤버 줄에 써요 */
export const hostName = (host: string) => host.replace(/^매니저 /, '').replace(/ 프로$/, '').trim() || host;

/** 예시 프로 · 직원 이름 (라운지 예시 글의 역할 글자와 같아요). 백엔드가 생기면 멤버 프로필의 role 로 바꿔요 */
const PRO_NAMES = ['하나', 'Leo'];
const STAFF_NAMES = ['Jay'];

/**
 * 다른 멤버 프로필 이름 옆 글자 (10-roles 8장 · 2026-11-26).
 * 계정 역할(PRO · STAFF)이 먼저, 그다음 모임 역할(HOST · CO-HOST)은 운영 중인 동아리가 1개 이상일 때만 (0개면 없어요).
 * 호스트: 그 사람이 호스트인 동아리 · 코호스트: 호스트가 그 사람을 코호스트로 정한 동아리 (닫히면 같이 없어져요).
 */
export function useMemberRoleTags(name: string): { account: 'pro' | 'staff' | null; meet: 'host' | 'co' | null; hostN: number; coN: number } {
  const cohost = useMeetStore((s) => s.cohost);
  const mine = useMeetStore((s) => s.myClubs);
  const live = [...mine, ...CLUBS].filter(clubLive);
  const hostN = live.filter((c) => !c.mine && hostName(c.host) === name).length;
  const coN = live.filter((c) => (cohost[c.id] ?? []).includes(name)).length;
  const account = PRO_NAMES.includes(name) ? 'pro' : STAFF_NAMES.includes(name) ? 'staff' : null;
  return { account, meet: hostN ? 'host' : coN ? 'co' : null, hostN, coN };
}

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

const LANG_NAME: Record<StudyLang, string> = { en: '영어', ja: '일본어', zh: '중국어', es: '스페인어' };
/** '하남점' · '하남' · '대전 둔산점' 을 같은 모양으로 (띄어쓰기 · 끝의 '점' 빼고) */
const brKey = (b: string) => b.replace(/\s+/g, '').replace(/점$/, '');
const lvNum = (lv: string) => Number(/\d+/.exec(lv)?.[0] ?? 0);

/**
 * 동아리 가입 조건에 맞는지 — 안 맞으면 가입을 막고 이유 한 줄을 돌려줘요 (맞으면 null).
 * 조건: '누구나' · '멤버만'(체험 · 연동 전은 guardMember 가 따로 막아요) · '○○점 멤버만' · 'Lv.N 이상' · '○○어 수강생'.
 * 모르는 조건은 막지 않아요. 백엔드가 생기면 서버가 같은 규칙으로 가입(65)을 거절해요.
 */
export function joinBlock(cond: string, me: Pick<Me, 'branch' | 'level' | 'lang' | 'role'>): string | null {
  const c = cond.trim();
  if (me.role === 'guest' || !c || c === '누구나' || c === CLUB_MEMBERS) return null;
  let m = /^(.+?)\s*멤버만$/.exec(c);
  if (m) return brKey(m[1]) === brKey(me.branch) ? null : `${m[1]} 멤버만 가입할 수 있어요`;
  m = /^Lv\.?\s*(\d+)\s*이상$/i.exec(c);
  if (m) return lvNum(me.level) >= Number(m[1]) ? null : `Lv.${m[1]} 이상부터 가입할 수 있어요 · 지금 ${me.level}`;
  m = /^(.+?)\s*수강생$/.exec(c);
  if (m) return LANG_NAME[me.lang] === m[1] ? null : `${m[1]} 수강생만 가입할 수 있어요`;
  return null;
}

/** 동아리 코호스트 (예시: 첫 멤버 한 명, 프로토타입 lgStaffOf) — 호스트가 관리에서 정하면 그 이름들(meet-store cohost)로 바뀌어요 */
export function clubStaff(c: Club, cur: number, me: MeArg) {
  if (c.mine) return [];
  const L = membersOf(c, cur, false, '', me, [], true);
  return L.filter((m) => m.t !== '호스트').slice(0, 1).map((m) => m.n);
}

/** made: 호스트 · 코호스트가 만든 일정 (장소 · 메모 · 끝 시간이 있을 수 있어요) */
export type Session = { id: string; k: number; label: string; cap: number; cur: number; me: boolean; day: number; mon: number; no: number; wd: string; tm: string; th: string; made?: boolean; place?: string; memo?: string; end?: string; /** 준비물 (만든 일정) */ bring?: string; /** 지난 모임 (이미 시작했거나 끝남) */ past?: boolean };
/**
 * 다가오는 정기 모임 (기본 4주 안 4회).
 * - 호스트 · 코호스트가 만든 일정(made)이 있으면 그걸 날짜순으로 보여 줘요.
 * - 내가 만든 동아리는 만든 일정만 (예시 일정을 지어내지 않아요). 예시 동아리는 모이는 요일 기준 예시 일정(프로토타입 lgClubSess) + 만든 일정.
 */
export function clubSessions(c: Club, att: Record<string, boolean>, max = 4, span = 29, made: ClubSched[] = []): Session[] {
  const t0 = new Date();
  t0.setHours(0, 0, 0, 0);
  const own: Session[] = made
    .map((m, i) => {
      const d = new Date(m.date + 'T00:00');
      const k = Math.round((d.getTime() - t0.getTime()) / 864e5);
      const me = !!att[m.id];
      return { id: m.id, k, label: `${d.getMonth() + 1}.${d.getDate()}(${WEEK[d.getDay()]}) ${m.time}${m.end ? '~' + m.end : ''}`, cap: m.cap, cur: 1 + (me ? 1 : 0), me, day: d.getDate(), mon: d.getMonth() + 1, no: i + 1, wd: WEEK[d.getDay()], tm: m.time, th: m.title, made: true, place: m.place, memo: m.memo, end: m.end, bring: m.bring };
    })
    .filter((q) => q.k >= 0 && q.k < span);
  if (c.mine) return own.slice(0, max);
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
  if (!own.length) return out;
  return [...out, ...own].sort((a, b) => a.k - b.k || a.tm.localeCompare(b.tm)).slice(0, max);
}

/**
 * 지난 정기 모임 (최근 n회 · 최근 것이 먼저) — 참석 확인 · 또 만나고 싶어요 · 호스트 소개 숫자에 써요.
 * 내가 만든 동아리는 만든 일정 중 지난 것만, 예시 동아리는 모이는 요일 기준 예시 + 만든 일정 중 지난 것.
 */
export function clubPastSessions(c: Club, att: Record<string, boolean>, n = 4, made: ClubSched[] = []): Session[] {
  const t0 = new Date();
  t0.setHours(0, 0, 0, 0);
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  const own: Session[] = made
    .map((m, i) => {
      const d = new Date(m.date + 'T00:00');
      const k = Math.round((d.getTime() - t0.getTime()) / 864e5);
      const me = !!att[m.id];
      return { id: m.id, k, label: `${d.getMonth() + 1}.${d.getDate()}(${WEEK[d.getDay()]}) ${m.time}${m.end ? '~' + m.end : ''}`, cap: m.cap, cur: 1 + (me ? 1 : 0), me, day: d.getDate(), mon: d.getMonth() + 1, no: i + 1, wd: WEEK[d.getDay()], tm: m.time, th: m.title, made: true, place: m.place, memo: m.memo, end: m.end, bring: m.bring, past: true };
    })
    // 지난 날이거나 오늘 이미 시작한 모임
    .filter((q) => q.k < 0 || (q.k === 0 && nowMin >= toMin(q.tm)));
  const out: Session[] = [...own];
  if (!c.mine) {
    const h = hashId(c.id);
    const tm = (c.when.match(/\d{1,2}:\d{2}/) || ['20:00'])[0];
    let m = 0;
    for (let k = -1; k > -60 && m < n; k--) {
      const d = new Date(t0);
      d.setDate(d.getDate() + k);
      if (!c.days.includes(d.getDay())) continue;
      const cap = Math.min(c.max || 8, 8);
      const id = `${c.id}@${d.getMonth() + 1}-${d.getDate()}`;
      const me = !!att[id];
      const th = (SESSION_THEME[c.cc] || SESSION_THEME.study)[(4 - (m % 4)) % 4];
      out.push({ id, k, label: `${d.getMonth() + 1}.${d.getDate()}(${WEEK[d.getDay()]}) ${tm}`, cap, cur: 3 + ((h + m) % (cap - 3)) + (me ? 1 : 0), me, day: d.getDate(), mon: d.getMonth() + 1, no: 12 + (h % 40) - m, wd: WEEK[d.getDay()], tm, th, past: true });
      m++;
    }
  }
  return out.sort((a, b) => b.k - a.k || b.tm.localeCompare(a.tm)).slice(0, n);
}

/** 정기 모임 날짜마다 참석 멤버 (호스트 + 날짜별로 다른 멤버, 내가 참석하면 나 — 프로토타입 lgSessMem) */
export function sessionMembers(all: Member[], q: Session, me: MeArg, myHi: string) {
  const L = all.filter((m) => !m.me);
  const host = L[0];
  const rest = L.slice(1);
  const out: Member[] = host ? [host] : [];
  // 지난 모임은 k 가 음수라 나머지가 음수가 되지 않게 (+ length) 해요
  const n = rest.length;
  for (let i = 0; out.length < q.cur - (q.me ? 1 : 0) && i < n; i++) out.push(rest[(((i + q.k) % n) + n) % n]);
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
  // 내가 만든 동아리는 예시 글 · 사진 · 채팅을 지어내지 않아요 (호스트 · 멤버가 올린 것만)
  if (c.mine) return { posts: [] as ClubPost[], album: [] as [AlbumArt, string][], chat: [] as typeof R.chat, name: (k: string) => who[k][0], color: (k: string) => who[k][1], fill };
  return { posts, album, chat: R.chat, name: (k: string) => who[k][0], color: (k: string) => who[k][1], fill };
}

/** 번개 · 이벤트까지 남은 날 (정렬용) */
export const meetN = daysUntil;
