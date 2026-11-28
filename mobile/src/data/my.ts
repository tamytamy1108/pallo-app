/**
 * 마이 A 가짜 데이터 — 꾸미기 상점 · 배지 · 랭킹 · 멤버 · 지점 안내 · 내 표현함 예시.
 * 값 · id 는 프로토타입(prototype/index.html 의 AV_ITEMS · AV_BG · MY_BADGES · RANK_PEOPLE · LG_MEMS · S.marks)과 같아요.
 * 맞는 API: docs/appendix/api-inventory.md — 7 `/members/:id` · 29 `/me/expressions` · 31 `/ranking` · 32 `/me/summary`
 *           · 33 `/me/badges` · 34 `/me/avatar` · 35 `/avatar/items` · 36 `/me/avatar/purchase` · 38 `/branches`
 */
import type { BranchGuide } from '@/api/branch-guide';
import type { SavedExpression } from '@/state/expressions';

import { AV_BG, AV_BODIES, AV_ITEMS } from './av-items';

// ---------------------------------------------------------------- 꾸미기 (스파크 상점)

/** fx = 배경 효과 (배경 탭에서 골라요 · 배경 위, 캐릭터 뒤에 겹쳐요) */
export type AvCat = 'hair' | 'eye' | 'mitt' | 'shoe' | 'hat' | 'face' | 'wear' | 'hand' | 'acc' | 'fx';
export type AvRare = '기본' | '일반' | '레어' | '에픽' | '시즌';
/** back: 캐릭터 뒤 · front: 앞 · paint: 몸에 칠한 옷 · eye: 눈 위 덧그림 · fx: 배경 위 · 캐릭터 뒤 효과 */
export type AvLayer = 'back' | 'front' | 'paint' | 'eye' | 'fx';
export type AvItem = {
  id: string;
  cat: AvCat;
  name: string;
  price: number;
  rare: AvRare;
  /** 시즌 아이템: 보상으로만 받아요 (잠김 이유) */
  lock?: string;
  layer: AvLayer;
  hat?: boolean;
  /** 머리를 덮는 모자: 같이 쓰면 헤어는 모자 속을 빼고 옆머리만 clipY(모자 아랫선, 캐릭터 좌표) 아래로 보여요 */
  cover?: boolean;
  clipY?: number;
  hair?: boolean;
  /** 몸 색 눈꺼풀: t = 위에서 덮는 정도 · b = 아래에서 (웃는 눈) · only = 한쪽 눈만 (0 왼 · 1 오른) */
  lid?: { t?: number; b?: number; only?: number };
};
/** 유료 그라데이션 몸 색 (scripts/av-art/bodies.json) · lid = 눈꺼풀 색 */
export type AvBody = { id: string; name: string; price: number; rare: AvRare; lid: string };
export type AvBg = { id: string; name: string; price: number; rare: AvRare; lock?: string; /** 동그란 프로필 바탕색 (프로토타입 lgFace) */ face: string };

/** 꾸민 모습. color · bg · hc 는 이름이거나 직접 고른 '#RRGGBB' */
export type Avatar = {
  color: string;
  flip: boolean;
  bg: string;
  /** 머리 색 */
  hc: string;
  /** 캐릭터 옆 말풍선 (14자) */
  say: string;
  eq: Record<AvCat, string | null>;
};

export { AV_BG, AV_ITEMS };
export const AV_ITEM: Record<string, AvItem> = Object.fromEntries(AV_ITEMS.map((i) => [i.id, i]));
export const HAIR = AV_ITEMS.filter((i) => i.hair);

/**
 * 추천 몸 색 [이름, 표시 이름, 가격, 등급] — 원본 PNG 가 색마다 따로 있어요.
 * 원본 7색은 모두 무료(기본) · 그라데이션 색은 스파크로 사요. 직접 고른 색('#…')도 무료예요.
 */
export const AVC_LIST: readonly (readonly [string, string, number, AvRare])[] = [
  ['yellow', '팔로 옐로', 0, '기본'],
  ['purple', '팔로 퍼플', 0, '기본'],
  ['pink', '버블 핑크', 0, '기본'],
  ['sky', '스카이', 0, '기본'],
  ['green', '민트 그린', 0, '기본'],
  ['coral', '코랄', 0, '기본'],
  ['purple-lash', '속눈썹 퍼플', 0, '기본'],
  ...AV_BODIES.map((b) => [b.id, b.name, b.price, b.rare] as const),
];
export const AV_COLOR_HEX: Record<string, string> = {
  yellow: '#FFE200',
  purple: '#493087',
  pink: '#F28CB1',
  sky: '#7FA7E8',
  green: '#5CBF8A',
  coral: '#FF7A59',
  'purple-lash': '#493087',
  ...Object.fromEntries(AV_BODIES.map((b) => [b.id, b.lid])),
};
export const AV_SW = ['#FFE200', '#FFB800', '#FF7A59', '#E5484D', '#F28CB1', '#D16BD6', '#8B5CF6', '#493087', '#2F6FD0', '#7FA7E8', '#38BDF8', '#2DD4BF', '#5CBF8A', '#9BCB3C', '#B5651D', '#3A3A48', '#A7ABB8', '#FFF4D6'];
export const HAIR_SW = ['#1E1A2B', '#3B2A20', '#7A4A2A', '#C68B4E', '#F2D16B', '#FFFFFF', '#F28CB1', '#E5484D', '#8B5CF6', '#7FA7E8', '#5CBF8A', '#A7ABB8'];
export const BG_SW = ['#FBF6EA', '#FFF1A8', '#FFE0EA', '#E5DDF6', '#DCEBFF', '#D7F2E3', '#FFE3D6', '#F2F2F2', '#1E1A2B', '#493087', '#2F6FD0', '#5CBF8A'];

export type AvTab = 'char' | AvCat | 'bg' | 'say';
export const AV_CATS: readonly (readonly [AvTab, string])[] = [
  ['char', '몸 색'],
  ['hair', '헤어'],
  ['eye', '눈'],
  ['hat', '모자'],
  ['face', '얼굴'],
  ['wear', '옷'],
  ['mitt', '장갑'],
  ['shoe', '신발'],
  ['hand', '아이템'],
  ['acc', '액세서리'],
  ['bg', '배경'],
  ['say', '한마디'],
];
/** 등급 글자색 (프로토타입 AV_RARE_C) */
export const AV_RARE_C: Record<AvRare, string> = { 기본: '#5A5366', 일반: '#5A5366', 레어: '#2F6FD0', 에픽: '#493087', 시즌: '#D2477A' };
export const SAY_IDEAS = ['Hello!', '같이 말해요', '오늘도 출석!', 'こんにちは', '你好!', "Let's go!", '말 걸어 주세요'];

/** 세션 출석 스파크 — 지금 장부(state/ledger)에 연결된 스파크 규칙은 이것 하나 (나머지는 정책 정해지면) */
export const SPARK_ATTEND = 50;
/**
 * 스파크 모으는 법 (프로토타입 earn 시트). 2026-11-25 낮췄어요: 주 2회 출석 · 퀘스트 매일 · 모임 1번 · 7일 연속이면
 * 주 300 안팎 → 아이템(150~700 · 가운데 300) 하나에 1~2주.
 */
export const SPARK_EARN: readonly (readonly [string, string])[] = [
  ['세션 출석', `+${SPARK_ATTEND}`],
  ['오늘 퀘스트 완료', '+10'],
  ['번개 · 정기 모임 참여', '+40'],
  ['7일 연속 학습', '+100'],
  ['게시판 첫 글 · 첫 인사', '+20'],
  ['주간 랭킹 TOP 3', '+150 · 왕관'],
];

/**
 * 프로 · 스텝 스파크 (2026-11-27 추가 · 금액 확정 — 서버가 생기면 GET /me/sparks earnRules 가 그대로 내려줘요).
 * - 프로로 참여: 테이블 QR '프로로 참여' 로 출석 체크할 때마다 (세션 출석과 같은 금액 · 같은 세션 한 번만)
 * - 출석률 우수: 한 달 맡은 세션 중 프로로 출석한 비율. 맡은 세션 SPARK_PRO_RATE_MIN_SESSIONS 개 이상인 달만,
 *   다음 달 1일에 한 번 지급 (높은 쪽 하나만 · 멱등키 pro-rate:{memberId}:{YYYY-MM})
 */
export const SPARK_PRO_RATE = [
  { minRate: 100, amount: 300 },
  { minRate: 90, amount: 150 },
] as const;
export const SPARK_PRO_RATE_MIN_SESSIONS = 4;
/** 출석률 박스가 그리는 상태 (프로만) */
export type ProRateReward =
  /** 맡은 세션이 SPARK_PRO_RATE_MIN_SESSIONS 개보다 적은 달 — 출석률 스파크 없음 */
  | { kind: 'few'; rate: number }
  | {
      kind: 'on';
      /** 이번 달 출석률 (0~100, 반올림 — 마이 칸과 같은 숫자) */
      rate: number;
      /** 이대로 끝나면 다음 달 1일에 들어올 스파크 (아직 90% 아래면 0) */
      earned: number;
      /** 한 단계 위 보상까지: 몇 회 더 · 얼마 (이미 100% 면 null) */
      next: { need: number; amount: number; minRate: number } | null;
    };

/**
 * PRO'S NOTE 맨 위 출석률 박스 (프로만). 맡은 세션 = 이번 달 · 예정 회차 포함.
 * 보상은 다음 달 1일에 들어와요 — 화면엔 '지금 받으면' 대신 '예정' · 'n회 더 출석하면' 으로 써요 (2026-11-28).
 * 예) 14개 중 13회 → rate 93 · earned 150 · next { need 1, amount 300 }
 */
export function proRateReward(sessions: number, checks: number): ProRateReward {
  // 판정은 정확한 비율로 (89.6% 는 90% 가 아니에요), 보이는 숫자는 마이 칸처럼 반올림
  const exact = sessions ? Math.min(100, (checks / sessions) * 100) : 0;
  const rate = Math.round(exact);
  if (sessions < SPARK_PRO_RATE_MIN_SESSIONS) return { kind: 'few', rate };
  const reached = SPARK_PRO_RATE.find((r) => exact >= r.minRate);
  const above = [...SPARK_PRO_RATE].reverse().find((r) => exact < r.minRate);
  return {
    kind: 'on',
    rate,
    earned: reached?.amount ?? 0,
    next: above ? { need: Math.max(1, Math.ceil((sessions * above.minRate) / 100) - checks), amount: above.amount, minRate: above.minRate } : null,
  };
}
export const SPARK_EARN_PRO: readonly (readonly [string, string])[] = [
  ['프로로 세션 참여', `+${SPARK_ATTEND}`],
  ...SPARK_PRO_RATE.map((r) => [r.minRate === 100 ? '한 달 출석률 100%' : `한 달 출석률 ${r.minRate}% 이상`, `+${r.amount}`] as const),
];

/** 처음 모습: 털 비니 · 줄무늬 티 · 나비넥타이 · 깃발 · 보라 운동화 */
export const avFresh = (): Avatar => ({
  color: 'yellow',
  flip: false,
  bg: 'cream',
  hc: '#3B2A20',
  say: '',
  eq: { hair: null, eye: null, mitt: null, shoe: 's-purple', hat: 'h-beanie', face: null, wear: 'w-tee', hand: 'd-flag', acc: 'a-bow', fx: null },
});
/** 처음부터 가진 것: 무료 몸 색 · 기본 등급 아이템 · 배경 */
export const AV_OWN0 = [...AVC_LIST.filter((c) => !c[2]).map((c) => c[0]), 'cream', 'yellow-bg', ...AV_ITEMS.filter((i) => i.rare === '기본').map((i) => i.id), ...AV_BG.filter((b) => b.rare === '기본').map((b) => 'bg:' + b.id)];

// ---------------------------------------------------------------- 멤버 (다른 사람 캐릭터는 이름으로 늘 같은 조합)

export type Member = { name: string; color: string; branch: string };
const C = { y: '#FFE200', pk: '#D0798E', sky: '#8FA6DC', lpu: '#E5DDF6', lsky: '#E3EAF8', mint: '#CDEBD0' };
/** 프로토타입 LG_MEMS · LG_POOL */
export const MEMBERS: Member[] = [
  { name: '지우', color: C.sky, branch: '대전 둔산점 · 영등포' },
  { name: '소라', color: C.mint, branch: '영등포 · 연신내' },
  { name: 'Leo', color: C.pk, branch: '연신내' },
  { name: '민준', color: C.lsky, branch: '잠실점' },
  { name: '유키', color: C.lpu, branch: '연신내' },
  { name: '태오', color: C.y, branch: '영등포' },
  { name: '하람', color: C.sky, branch: '부산 수영점' },
  { name: '수아', color: C.lpu, branch: '잠실점 · 대구 달서점' },
];
export const MEMBER_POOL: Member[] = [
  { name: '하나', color: C.y, branch: '영등포' },
  { name: 'Jay', color: C.pk, branch: '연신내' },
  { name: '민서', color: C.lsky, branch: '대구 달서점' },
  { name: '라파', color: C.y, branch: '대전 둔산점' },
  { name: '서준', color: C.mint, branch: '잠실점' },
  { name: '예린', color: C.sky, branch: '잠실점' },
  { name: 'Kenji', color: C.lpu, branch: '연신내' },
  { name: '다온', color: C.pk, branch: '영등포 · 잠실점' },
];
export const findMember = (name: string) => [...MEMBERS, ...MEMBER_POOL].find((m) => m.name === name);

/** 이름 → 늘 같은 캐릭터 (프로토타입 memberAv: 이름이 달라도 겹치지 않게 잘 섞어요) */
export function memberAvatar(name: string): Avatar {
  const h = [...name].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const pick = <T,>(L: readonly T[], k: number): T => L[((h >>> k % 5) + k * 7) % L.length];
  const of = (cat: AvCat, open = false) => AV_ITEMS.filter((i) => i.cat === cat && (open || !i.lock));
  const idOf = (x: AvItem | null) => (x ? x.id : null);
  return {
    color: pick(['yellow', 'purple', 'pink', 'sky', 'green', 'coral', '#8B5CF6', '#2DD4BF', '#FFB800', '#E5484D', '#38BDF8'], 0),
    hc: pick(HAIR_SW, 6),
    say: h % 4 === 1 ? pick(SAY_IDEAS, 2) : '',
    flip: h % 2 === 0,
    bg: pick(AV_BG.filter((b) => !b.lock), 3).id,
    eq: {
      hair: idOf(pick([null, null, ...HAIR], 7)),
      hat: h % 3 === 0 ? null : pick(of('hat'), 1).id,
      face: idOf(pick([null, ...of('face', true)], 2)),
      wear: idOf(pick([null, ...of('wear')], 4)),
      hand: idOf(pick([null, ...of('hand', true)], 5)),
      shoe: idOf(pick([null, ...of('shoe')], 8)),
      mitt: h % 3 === 1 ? idOf(pick(of('mitt', true), 9)) : null,
      eye: h % 2 ? idOf(pick(of('eye', true), 10)) : null,
      acc: null,
      fx: null,
    },
  };
}

/** 프로필 숫자 계산에 쓰는 이름 값 (프로토타입 pfHash) */
export const nameHash = (name: string) => [...name].reduce((a, c) => a + c.charCodeAt(0), 0);

const LANGS = ['영어', '일본어', '중국어', '스페인어'] as const;
export type LangName = (typeof LANGS)[number];
/** 멤버 학습 언어: 두 언어 병행이면 두 개 (프로토타입 memberLangs) */
export function memberLangs(name: string): LangName[] {
  if (!name) return [];
  // PALLO 공식 계정은 모든 언어를 다뤄요
  if (name === 'PALLO') return [...LANGS];
  const h = nameHash(name);
  const a = LANGS[h % 4];
  return h % 3 === 0 ? [a, LANGS[(h + 1) % 4]] : [a];
}

/** 프로필 @아이디 (프로토타입 openProfile) */
const HANDLE: Record<string, string> = { 하나: 'hana', 소라: 'sora', 민준: 'minjun', 유키: 'yuki', 지우: 'jiwoo', 서연: 'seoyeon', 도윤: 'doyoon' };
export const memberHandle = (name: string) => `@${HANDLE[name] || (/^[A-Za-z]/.test(name) ? name.toLowerCase() : 'pallo')}_${nameHash(name) % 97}`;

/**
 * 멤버 한 줄 소개 (예시). 서버에선 GET /me/mypage/{code} 의 profile.bio — 내가 마이에서 남긴 소개(me.bio)가 남에게 이렇게 보여요.
 * 안 남긴 사람은 '' (프로필 시트에서 그 줄을 숨겨요).
 */
const BIO: Record<string, string> = {
  지우: '주말엔 번개, 평일엔 스터디! 영어로 수다 떨어요',
  Leo: 'Coffee lover ☕ 한국어 배우는 중이에요',
  유키: '日本語でも韓国語でも話しかけてね',
  하람: '부산에서 스페인어 공부해요. 같이 연습해요!',
  하나: '하루 한 문장씩 꾸준히',
  Jay: '여행 가서 현지인처럼 주문하는 게 목표예요',
  서준: '퇴근 후 30분, 영어 일기 쓰는 중',
};
export const memberBio = (name: string) => BIO[name] ?? '';

/** 팔로잉 · 팔로워 목록 (프로토타입 pfLists — 예시) */
export function followLists(name: string, me: { name: string; branch: string }, following: Record<string, boolean>) {
  const isMe = name === me.name;
  const h = nameHash(name);
  const all = [...MEMBERS, ...MEMBER_POOL].filter((m) => m.name !== name && m.name !== me.name);
  const meRow: Member = { name: me.name, color: C.y, branch: me.branch };
  const fing = isMe ? all.filter((m) => following[m.name]) : all.filter((_, i) => (h + i) % 3 !== 0).slice(0, 14);
  const fer = isMe ? all.filter((_, i) => i % 4 === 1).slice(0, 4) : [...(following[name] ? [meRow] : []), ...all.filter((_, i) => (h + i) % 2 === 0).slice(0, 16)];
  return { fing, fer };
}

// ---------------------------------------------------------------- 배지

export type BadgeIcon = 'flame' | 'bolt' | 'users' | 'mic' | 'book' | 'crown' | 'heart' | 'plane';
export type Badge = { ic: BadgeIcon; name: string; desc: string; on: boolean };
export const MY_BADGES: Badge[] = [
  { ic: 'flame', name: '7일 연속', desc: '7일 연속 학습', on: true },
  { ic: 'bolt', name: '첫 번개', desc: '번개 첫 참여', on: true },
  { ic: 'users', name: '동아리 멤버', desc: '동아리 첫 가입', on: false },
  { ic: 'mic', name: '말하기 100', desc: '따라 말하기 100문장', on: true },
  { ic: 'book', name: '첫 원서', desc: '북클럽 한 권 완독', on: false },
  { ic: 'crown', name: '주간 TOP 3', desc: '주간 랭킹 3위 안', on: false },
  { ic: 'heart', name: '인기 글', desc: '좋아요 50개 받은 글', on: false },
  { ic: 'plane', name: '해외 동행', desc: '동행 첫 참여', on: false },
];
/** 배지 · 숫자 칸 아이콘 (프로토타입 MY_BADGE_IC) */
export const BADGE_PATH: Record<BadgeIcon, string> = {
  flame: 'M12 3c2 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-4 2-7 2 1 3 3 3 5 1-2 1-6 1-9z',
  bolt: 'M13 2 4 14h7l-1 8 9-12h-7z',
  users: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M16 3a4 4 0 0 1 0 8M18 14a6 6 0 0 1 4 7',
  mic: 'M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5 11a7 7 0 0 0 14 0M12 18v3',
  book: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5V5.5',
  crown: 'M3 8l4 4 5-7 5 7 4-4-2 11H5z',
  heart: 'M12 20s-7.5-4.6-9.2-9.4C1.6 7 4 4 7.2 4c2 0 3.6 1.2 4.8 2.8C13.2 5.2 14.8 4 16.8 4 20 4 22.4 7 21.2 10.6 19.5 15.4 12 20 12 20z',
  plane: 'M2 16l20-8-6 14-4-6-6 4 2-6z',
};

// ---------------------------------------------------------------- 랭킹 (다른 멤버는 예시 · 퀘스트 1개 10P · 출석 30P)

export type RankPerson = { n: string; b: string; w: number; m: number };
export const RANK_PEOPLE: RankPerson[] = [
  { n: 'Mina', b: '영등포', w: 420, m: 1650 },
  { n: 'Jun', b: '연신내', w: 395, m: 1580 },
  { n: 'Sora', b: '영등포 · 연신내', w: 360, m: 1490 },
  { n: 'Hyun', b: '잠실점', w: 310, m: 1320 },
  { n: 'Yuna', b: '연신내', w: 280, m: 1210 },
  { n: 'Leo', b: '잠실점', w: 240, m: 1100 },
  { n: 'Dami', b: '영등포', w: 200, m: 980 },
  { n: 'Ken', b: '대전 둔산점', w: 150, m: 860 },
  { n: 'Ari', b: '대전 둔산점', w: 120, m: 720 },
  { n: 'Joy', b: '연신내', w: 90, m: 540 },
];
/** 순위 동그라미 색 (프로토타입 AV_COLORS) */
export const RANK_COLORS = ['#FFE200', '#D0798E', '#8FA6DC', '#CDEBD0', '#E5E0F5', '#FFD3B8'];
/** 이번 달 = 이번 주 이전까지 쌓인 내 포인트 + 이번 주 (프로토타입 ME.monthBase) */
export const MY_MONTH_BASE = 260;

export type RankRow = { n: string; b: string; pt: number; c: string; me?: boolean };
export function rankPeople(per: 'w' | 'm', me: { name: string; branch: string; weekPoints: number }): RankRow[] {
  const mine = per === 'w' ? me.weekPoints : MY_MONTH_BASE + me.weekPoints;
  const rows: RankRow[] = RANK_PEOPLE.map((p, i) => ({ n: p.n, b: p.b, pt: per === 'w' ? p.w : p.m, c: RANK_COLORS[i % RANK_COLORS.length] }));
  rows.push({ n: me.name, b: me.branch, pt: mine, c: '#493087', me: true });
  return rows.sort((a, b) => b.pt - a.pt || (a.me ? 1 : -1));
}

// ---------------------------------------------------------------- 지점 안내 (멤버가 보는 보드 · 편집은 관리자 화면에서)

export type BranchItemIcon = 'park' | 'wifi' | 'loc' | 'lock' | 'tel';
export type BranchItem = { ic: BranchItemIcon; bg: string; t: string; s?: string; d: string; cp?: readonly (readonly [string, string])[]; act?: readonly ['map' | 'tel', string]; star?: boolean };
/** 협업 업체 추가 정보 링크: 네이버 플레이스 · 인스타그램 · 카카오톡 채널 · 홈페이지 (label 이 없으면 종류별 기본 이름) */
export type PartnerLinkKind = 'naver' | 'insta' | 'kakao' | 'web';
export type PartnerLink = { kind: PartnerLinkKind; url: string; label?: string };
/** 포스터 · 사진: 앱에 넣은 그림(require) 또는 서버 주소. 관리자가 아무 크기로 올려요 (0번이 대표) */
export type PartnerPoster = number | string;
export type Partner = { n: string; b: string; c: string; w: string; addr?: string; tel?: string; hrs?: string; info?: string; how?: string; links?: PartnerLink[]; posters?: PartnerPoster[] };
/** 보드 한 지점 (화면 모양) — 서버 지점 안내(api/branch-guide)를 toBranchBoard 로 바꿔 만들어요 */
export type BranchBoard = { code: string; name: string; addr: string; hrs: string; intro?: string; photos?: PartnerPoster[]; pin: { t: string; by: string | null; at: string } | null; items: BranchItem[]; partners: Partner[] };

/** 협업 업체 — 아직 서버에 없어서 지점 이름으로 앱 안 예시를 붙여요 (없는 지점은 빈 목록) */
export const BR_PARTNERS: Record<string, Partner[]> = {
  하남점: [
    { n: 'Cafe Tammy', b: '음료 10% 할인', c: '#8A4B3A', w: 'CAFE', addr: '하남시 [주소] 1층 · 지점에서 도보 2분', tel: '031-000-0000', hrs: '매일 8~22시', info: '지점에서 걸어서 2분, 스터디 전후로 들르기 좋은 조용한 카페예요. 2층에 4인 테이블이 있어서 번개 모임이나 복습 자리로도 많이 써요. 영어로 주문하면 쿠키 하나를 더 주세요.', how: '주문할 때 PALLO 앱 멤버 화면을 보여 주세요', links: [{ kind: 'naver', url: 'https://map.naver.com' }, { kind: 'insta', url: 'https://instagram.com/cafe_tammy' }], posters: [require('@/assets/images/partners/cafe-poster.webp'), require('@/assets/images/partners/cafe-room.webp')] },
    { n: '북스 미사', b: '원서 15% 할인', c: '#493087', w: 'BOOKS', addr: '하남시 미사 [주소] 2층', hrs: '10~21시 · 월요일 휴무', info: '원서 · 그래픽노블 코너가 따로 있는 동네 서점이에요. PALLO 교재 원서도 주문해 줘요.', how: '계산할 때 멤버 화면을 보여 주세요', links: [{ kind: 'insta', url: 'https://instagram.com/books_misa' }, { kind: 'web', url: 'https://example.com' }], posters: [require('@/assets/images/partners/books-poster.webp')] },
    { n: '스터디카페 온', b: '2시간 이용권 20% 할인', c: '#138A9E', w: 'STUDY', posters: [require('@/assets/images/partners/study-poster.webp')] },
  ],
  잠실점: [
    { n: '잠실 북카페', b: '음료 15% 할인', c: '#6B4E9B', w: 'BOOK CAFE', addr: '서울 송파구 [주소] 2층', info: '원서가 300권 넘게 있는 북카페예요. 스터디 끝나고 복습하기 좋아요.' },
  ],
};

/** 'MM.DD' (한국 시각) — 주의사항 쓴 날 */
function kstMonthDay(iso: string): string {
  const d = new Date(Date.parse(iso) + 9 * 3_600_000);
  if (Number.isNaN(d.getTime())) return '';
  return `${String(d.getUTCMonth() + 1).padStart(2, '0')}.${String(d.getUTCDate()).padStart(2, '0')}`;
}

const joinDot = (...parts: (string | null | undefined)[]) => parts.filter((p): p is string => !!p).join(' · ');

/**
 * 서버 지점 안내 → 보드 모양. 지점이 적지 않은 칸은 만들지 않아요 (주소 · 운영 시간 칸만 늘 있어요).
 * 칸 순서: 주차 · 입금 계좌 → 와이파이 → 오시는 길 · 운영 시간 → 지점 문의. 사물함은 서버에 없어 뺐어요.
 */
export function toBranchBoard(g: BranchGuide): BranchBoard {
  const addr = joinDot(g.address, g.addressDetail);
  const items: BranchItem[] = [];
  const acc = g.bankAccount;
  if (g.parking || acc) {
    const t = g.parking && acc ? '주차 · 입금 계좌' : g.parking ? '주차' : '입금 계좌';
    items.push({
      ic: 'park',
      bg: '#FFE200',
      t,
      s: g.parking && acc ? '주차 · 계좌' : undefined,
      d: g.parking ?? '',
      cp: acc ? [[joinDot('입금 계좌', `예금주 ${acc.holder}`, acc.note), `${acc.bankName} ${acc.accountNumber}`]] : undefined,
      star: true,
    });
  }
  if (g.wifi) {
    items.push({
      ic: 'wifi',
      bg: '#BFE4EC',
      t: '와이파이',
      d: g.wifi.password ? '' : '비밀번호 없이 연결돼요',
      cp: g.wifi.password ? [['이름', g.wifi.ssid], ['비밀번호', g.wifi.password]] : [['이름', g.wifi.ssid]],
      star: true,
    });
  }
  items.push({ ic: 'loc', bg: '#F6C9D4', t: '오시는 길 · 운영 시간', d: joinDot(addr, g.openHours), act: ['map', g.address], star: true });
  if (g.phone || g.phoneHours) {
    items.push({ ic: 'tel', bg: '#FFE7D1', t: '지점 문의', d: joinDot(g.phone, g.phoneHours), act: g.phone ? ['tel', g.phone] : undefined, star: true });
  }
  const n = g.managerNotice;
  return {
    code: g.branchCode,
    name: g.branchName,
    addr,
    hrs: g.openHours ?? '',
    pin: n ? { t: n.content, by: n.authorName ? `매니저 ${n.authorName}` : null, at: kstMonthDay(n.updatedAt) } : null,
    items,
    partners: BR_PARTNERS[g.branchName] ?? [],
  };
}

// ---------------------------------------------------------------- 내 표현함 예시 (프로토타입 S.marks 14개 · 최근 저장한 게 위)

const NOW = Date.now();
const SEED: Omit<SavedExpression, 'id' | 'savedAt'>[] = [
  { en: 'I’d like to have a window seat.', ko: '창가 자리로 주세요', source: '여행 · 공항 체크인', from: 'trip' },
  { en: 'Could you say that again?', ko: '다시 말해 줄래요?', source: '프리토킹 · 11.12 영등포 세션', from: 'free' },
  { en: 'I’m on the fence about it.', ko: '아직 마음을 못 정했어요', source: 'Lv.1 · 6챕터 No Spoilers!', from: 'book' },
  { en: 'Do you have oat milk?', ko: '오트 우유 있나요?', source: 'Lv.1 · 1챕터 Cafe Complaint', from: 'book' },
  { en: 'Is the flight on time?', ko: '비행기가 제시간에 뜨나요?', source: '여행 · 공항 체크인', from: 'trip' },
  { en: 'That’s a good point.', ko: '좋은 지적이에요', source: '프리토킹 · 11.05 잠실 세션', from: 'free' },
  { en: 'I couldn’t agree more.', ko: '전적으로 동의해요', source: '리스닝 룸 · Coffee Chat', from: 'listen' },
  { en: 'Can you help me find a gift?', ko: '선물 찾는 것 좀 도와줄 수 있어요?', source: 'Lv.1 · 2챕터 Operation Cookbook', from: 'book' },
  { en: 'I have to finish this today.', ko: '오늘 이거 끝내야 해요', source: 'Lv.1 · 2챕터 Operation Cookbook', from: 'book' },
  { en: 'How long does it take to get there?', ko: '거기까지 얼마나 걸려요?', source: 'Lv.1 · 3챕터 Finding the Penguins', from: 'book' },
  { en: 'Are you free on Saturday?', ko: '토요일에 시간 돼요?', source: 'Lv.1 · 4챕터 Come Along', from: 'book' },
  { en: 'Let me check my schedule.', ko: '제 일정 좀 확인해 볼게요', source: 'Lv.1 · 4챕터 Come Along', from: 'book' },
  { en: 'How often do you go hiking?', ko: '얼마나 자주 등산 가요?', source: 'Lv.1 · 5챕터 Speaking of Hobbies', from: 'book' },
  { en: 'Tell me about your trip.', ko: '여행 이야기 해 주세요', source: 'Lv.1 · 6챕터 No Spoilers!', from: 'book' },
];
/** 내 표현함 처음 값 — state/expressions 가 이걸로 시작해요 (seedExpressions 로 다시 넣어도 겹치지 않아요) */
export const SEED_EXPRESSIONS: SavedExpression[] = SEED.map((x, i) => ({ ...x, id: `m${i + 1}`, savedAt: NOW - i * 3600_000 }));
