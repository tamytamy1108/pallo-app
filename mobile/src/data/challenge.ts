/**
 * 챌린지 — 가짜 데이터 + 화면 상태. 프로토타입 LG_FEED(k:'chal') · LG_CHCAT · CH_PW · CH_PBG · CH_FEED · CH_REP ·
 * chxCmts · chxTips · chFeed · 순위(lgChalDetail rank) 를 그대로 옮겼어요 (예시 id · 숫자 · 문구 그대로).
 * 맞는 API (docs/appendix/api-inventory.md 챌린지): 79 GET `/challenges` · `/challenges/hot` · 80 POST `/challenges`
 * · 81 GET `/challenges/expression-check?text=` · 82 POST `/challenges/:id/join` · 83 GET·POST `/challenges/:id/checkins`
 * · 84 GET `/challenges/:id/ranking` · 85 GET·POST `/challenges/:id/entries`.
 * 백엔드가 생기면 이 값 · 계산 대신 서버 응답을 써요. 담당: 챌린지.
 */
import { Colors } from '@/constants/theme';
import { createStore } from '@/lib/store';
import { exprCard, exprFrom, type SavedExpression } from '@/state/expressions';
import { getMe } from '@/state/me';
import { dayKey } from '@/state/today-goal';
import type { PhotoFraming } from '@/lib/photo-framing';

import { SEED_NEW_AT } from './seed-time';

/** 프로토타입 LG_C */
export const CH_C = {
  y: Colors.yellow,
  pk: Colors.rosePink,
  pu: Colors.purple,
  sky: Colors.sky,
  lpu: Colors.lavender,
  lsky: Colors.skyMist,
  mint: '#CDEBD0',
} as const;

// ---- 카테고리 (LG_CHCAT: [키, 이름, 아이콘, 카드 바탕]) ----
export type ChCatKey = 'study' | 'habit' | 'health' | 'move' | 'morning' | 'free';
export type DailyCatKey = Exclude<ChCatKey, 'study'>;
export type ChIconName = 'cmt' | 'book' | 'cup' | 'run' | 'clock' | 'flag';
export type ChTone = 'y' | 'sk' | '';
export type ChCat = { key: ChCatKey; label: string; icon: ChIconName; tone: ChTone };

export const CH_CATS: ChCat[] = [
  { key: 'study', label: '표현', icon: 'cmt', tone: 'y' },
  { key: 'habit', label: '공부 습관', icon: 'book', tone: '' },
  { key: 'health', label: '건강 · 식단', icon: 'cup', tone: 'sk' },
  { key: 'move', label: '운동', icon: 'run', tone: 'sk' },
  { key: 'morning', label: '아침 루틴', icon: 'clock', tone: 'y' },
  { key: 'free', label: '자유', icon: 'flag', tone: '' },
];
export const chCat = (k?: ChCatKey) => CH_CATS.find((c) => c.key === k) ?? CH_CATS[0];
/** CH_BG: 카테고리 아이콘 칸 · 상세 위 진행 카드 바탕 */
export const CH_BG: Record<ChTone, string> = { y: '#FFF5B0', sk: '#E3EAF8', '': '#E5DDF6' };

/** 카드 왼쪽 색 칸 문구 (CH_PW) — 비우면 카테고리 문구 */
export const CH_PW: Record<DailyCatKey, string> = { habit: 'STUDY\nHABIT', health: 'EAT\nWELL', move: 'MOVE\nDAILY', morning: 'WAKE\nUP', free: 'MY\nCHAL\nLENGE' };
/** 카테고리별 왼쪽 색 칸 바탕 (CH_PBG) */
const CH_PBG: Record<ChCatKey, string> = { study: CH_C.y, habit: CH_C.lpu, health: CH_C.sky, move: CH_C.sky, morning: CH_C.pu, free: CH_C.lpu };
export const chPbgOf = (cat: ChCatKey) => CH_PBG[cat];
/** 진한 바탕(보라 · 분홍)이면 글씨를 노랑으로 (lgDark) */
export const isDarkBg = (bg: string) => bg === CH_C.pu || bg === CH_C.pk;

// ---- 표현이 나온 곳 (CH_SRC) ----
export type ChSrcKind = 'book' | 'trip' | 'free' | 'listen';
export type ChSrc = { k: ChSrcKind; t?: string; lv?: string; ls?: number };
export const CH_SRC: Record<ChSrcKind, { label: string; icon: 'book' | 'pin' | 'cmt' | 'spk' }> = {
  book: { label: '교재', icon: 'book' },
  trip: { label: '상황', icon: 'pin' },
  free: { label: '프리토킹', icon: 'cmt' },
  listen: { label: '리스닝 룸', icon: 'spk' },
};
/** Lv.1 챕터 이름 (프로토타입 LESSON_INFO[n][0]) — 출처 줄 'Lv.1 · 6챕터 No Spoilers!' 에 써요 */
const LV1_TITLES = ['', 'Cafe Complaint', 'Operation Cookbook', 'Finding the Penguins', 'Come Along', 'Speaking of Hobbies', 'No Spoilers!', 'Ordering In', 'Late Again', 'Back on Track', 'Time to Wrap Up', 'Let’s Make It One', 'Old Haunt', 'Trying It On', 'Change of Plans', 'Take Me Out to the Ball Game', 'Jeju Memories', 'Always On', 'Stage Fright', 'Can’t Wait', 'The First Solo Trip'];

// ---- 챌린지 ----
export type Challenge = {
  id: string;
  /** 없으면 표현(study) */
  cat?: ChCatKey;
  way?: 'cmt' | 'photo';
  who: string;
  av: string;
  br: string;
  time: string;
  /** 올린 때 (ms). 이 탭을 마지막으로 본 뒤면 '새 글' — data/seed-time.ts */
  at?: number;
  name: string;
  /** 카드 문구 (줄바꿈 \n) */
  pw?: string;
  /** 대표 사진: 연 사람이 직접 올린 사진 (앱에 넣은 그림 require 또는 주소). 없으면 기본 배경 + 카드 문구 */
  cover?: number | string;
  /** 만든 카드 색 — 있으면 사진보다 앞(대표): 이 색 + 카드 문구 */
  pbg?: string;
  guide?: string;
  freqT?: string;
  dur?: number;
  host: string;
  members: number;
  day: number;
  of: number;
  unit?: '회' | '';
  bg?: ChTone;
  lang: string;
  likes: number;
  rec?: boolean;
  /** 표현 챌린지: 예문 · 표현 · 뜻 · 챕터 · 출처 */
  q?: string;
  hl?: string;
  ko?: string;
  ls?: number;
  src?: ChSrc | null;
  /** 예시 문장 수 (전 지점 챌린지) */
  cmn?: number;
  /** 표현 여러 개로 연 챌린지 (그날 하나만 써도 인증) */
  exprs?: { p: string; m?: string }[];
  start?: string;
  live?: boolean;
  mine?: boolean;
};

/** 예시 챌린지 (LG_FEED 의 챌린지 순서 그대로) */
export const CHALLENGES: Challenge[] = [
  { id: 'c1', who: '민준', av: CH_C.sky, br: '잠실점', time: '1시간 전', at: SEED_NEW_AT, name: '30일 하루 한 문장', ls: 6, host: '하나', members: 128, day: 17, of: 30, q: 'I’m on the fence about it.', hl: 'on the fence', ko: '그건 아직 결정을 못 하겠어요 · 세션에서 배운 표현', lang: 'en-US', likes: 41, rec: true },
  { id: 'c2', who: 'Leo', av: CH_C.pk, br: '연신내', time: '3시간 전', name: '주 3회 쉐도잉 · 4주', src: { k: 'free', t: '11.12 영등포 세션' }, unit: '회', bg: 'sk', host: 'Leo', members: 46, day: 9, of: 12, q: 'Could you say that again?', hl: 'say that again', ko: '다시 말해 줄래요? · 이번 주 쉐도잉 문장', lang: 'en-US', likes: 22 },
  { id: 'c4', cat: 'health', way: 'photo', who: '소라', av: CH_C.mint, br: '영등포', time: '5시간 전', name: '14일 아침 건강하게 먹기', guide: '아침 식단 사진 한 장 + 한 줄 소감 · 영어로 쓰면 더 좋아요', freqT: '매일', dur: 14, host: '소라', members: 37, day: 5, of: 14, bg: 'sk', lang: 'en-US', likes: 18 },
  { id: 'c6', cat: 'move', way: 'photo', who: '하람', av: CH_C.sky, br: '부산 수영점', time: '2시간 전', at: SEED_NEW_AT, name: '매일 30분 걷기', pw: 'WALK\n30 MIN', cover: require('@/assets/images/challenge/sample-walk.webp'), guide: '걸음 수 캡처 + 한 줄 · 걸으며 들은 영어 표현도 좋아요', freqT: '매일', dur: 21, host: '하람', members: 64, day: 11, of: 21, bg: 'sk', lang: 'en-US', likes: 33 },
  { id: 'c7', cat: 'habit', way: 'cmt', who: '수아', av: CH_C.lpu, br: '잠실점', time: '3시간 전', name: '하루 단어 10개', pw: '10\nWORDS', guide: '오늘 외운 단어 10개 + 그중 하나로 한 문장', freqT: '매일', dur: 30, host: '수아', members: 91, day: 22, of: 30, bg: '', lang: 'en-US', likes: 47 },
  { id: 'c8', cat: 'health', way: 'photo', who: '지우', av: CH_C.sky, br: '대전 둔산점', time: '4시간 전', name: '하루 물 2L 마시기', pw: '2L\nWATER', guide: '물병 사진 한 장 + 몇 잔 마셨는지', freqT: '매일', dur: 14, host: '지우', members: 45, day: 9, of: 14, bg: 'sk', lang: 'en-US', likes: 15 },
  { id: 'c9', cat: 'free', way: 'photo', who: '예린', av: CH_C.sky, br: '잠실점', time: '어제', name: '하루 한 장 하늘 사진', pw: 'LOOK\nUP', guide: '오늘 하늘 사진 + 영어 한 단어로 날씨 표현', freqT: '월·수·금', dur: 21, host: '예린', members: 28, day: 4, of: 9, unit: '회', bg: '', lang: 'en-US', likes: 12 },
  { id: 'c10', cat: 'morning', way: 'cmt', who: 'Jay', av: CH_C.pk, br: '연신내', time: '어제', name: '6시 반 미라클 모닝', pw: '6:30\nAM', guide: '일어나면 댓글로 오늘 할 일 한 가지를 영어로', freqT: '매일', dur: 14, host: 'Jay', members: 39, day: 6, of: 14, bg: 'y', lang: 'en-US', likes: 21 },
  { id: 'c11', cat: 'habit', way: 'cmt', who: '민서', av: CH_C.lsky, br: '대구 달서점', time: '2일 전', name: '영어 일기 3줄', pw: '3 LINE\nDIARY', guide: '오늘 있었던 일 3줄 · 틀려도 괜찮아요', freqT: '주 5회', dur: 28, host: '민서', members: 57, day: 12, of: 20, unit: '회', bg: '', lang: 'en-US', likes: 26 },
  { id: 'c12', cat: 'move', way: 'photo', who: '서준', av: CH_C.mint, br: '잠실점', time: '2일 전', name: '주 3회 홈트', pw: 'HOME\nFIT', guide: '운동 끝난 사진 + 무슨 운동 했는지', freqT: '주 3회', dur: 28, host: '서준', members: 33, day: 5, of: 12, unit: '회', bg: 'sk', lang: 'en-US', likes: 9 },
  { id: 'c5', cat: 'morning', way: 'cmt', who: '태오', av: CH_C.lpu, br: '영등포', time: '어제', name: '아침 7시 기상', guide: '일어나면 댓글로 “Good morning!” 한 줄', freqT: '월·화·수·목·금', dur: 21, host: '태오', members: 52, day: 8, of: 15, unit: '회', bg: 'y', lang: 'en-US', likes: 29 },
  { id: 'c14', who: '소라', av: CH_C.mint, br: '영등포', time: '2시간 전', at: SEED_NEW_AT, name: '14일 하루 한 문장', ls: 0, bg: 'sk', host: '소라', members: 24, day: 3, of: 14, q: 'I got hooked on a new podcast.', hl: 'hooked on', ko: '~에 빠지다 · 레벨 3 키워드', lang: 'en-US', likes: 9 },
  { id: 'c3', who: 'PALLO', av: CH_C.y, br: '전 지점', time: '오늘', name: '7일 영어 일기', ls: 6, cmn: 10, bg: 'y', host: 'PALLO', members: 213, day: 0, of: 7, start: '11.17 월 시작', q: 'Today was a long day.', hl: 'a long day', ko: '오늘은 긴 하루였어요 · 첫날 예시 문장', lang: 'en-US', likes: 75 },
];

// ---- 예시 멤버 (LG_MEMS · LG_POOL · LG_RANK) ----
type Mem = [name: string, color: string];
const LG_MEMS: Mem[] = [['지우', CH_C.sky], ['소라', CH_C.mint], ['Leo', CH_C.pk], ['민준', CH_C.lsky], ['유키', CH_C.lpu], ['태오', CH_C.y], ['하람', CH_C.sky], ['수아', CH_C.lpu]];
const LG_POOL: Mem[] = [['하나', CH_C.y], ['Jay', CH_C.pk], ['민서', CH_C.lsky], ['라파', CH_C.y], ['서준', CH_C.mint], ['예린', CH_C.sky], ['Kenji', CH_C.lpu], ['다온', CH_C.pk]];
const LG_RANK: [string, number, string][] = [['하나', 30, CH_C.y], ['Leo', 26, CH_C.pk], ['민준', 22, CH_C.sky], ['소라', 15, CH_C.lpu], ['태오', 11, CH_C.mint]];

/** 인증 피드 예시 문구 (CH_FEED) */
const CH_FEED: Record<ChCatKey, string[]> = {
  study: ['I’d like to get a window seat next time.', 'Could you say that again? 오늘 회의에서 진짜 썼어요', 'I’m on the fence about the new job.', '오늘은 카페에서 주문할 때 써 봤어요!'],
  habit: ['오늘 단어 10개 끝! commute · deadline · ...', '단어장 3페이지 완료', 'deadline으로 문장 만들기: I have a deadline today.'],
  health: ['오트밀 + 바나나 · Oatmeal and a banana!', '삶은 달걀 두 개랑 사과', 'Greek yogurt with berries', '오늘은 샐러드랑 고구마'],
  move: ['8,240걸음 · 퇴근길 한 정거장 걸었어요', '홈트 30분 완료', '러닝 3km · I’m out of breath!'],
  morning: ['Good morning! 6:55 기상', 'Good morning~ 7:02 아깝다', 'Morning! 커피부터 마셔요'],
  free: ['오늘 하늘 엄청 맑았어요', '퇴근길 노을', '점심 산책 사진'],
};
/** 인증에 달린 예시 답글 (CH_REP) */
const CH_REP: [string, string, string][] = [['지우', '#FFF3B0', '오 저도 오늘 써 봐야겠어요!'], ['하나', '#E3EAF8', 'Nice! 문장 자연스러워요'], ['서진', '#F6D5DD', '응원해요 내일도 같이 해요']];

/** 프로토타입 lgH: 글자 코드 합 (예시 숫자를 늘 같게 뽑는 데 써요) */
export const hashOf = (s: string) => [...s].reduce((a, c) => a + c.charCodeAt(0), 0);

// ---- 상태 ----
/** 댓글 · 문장 · 답글 한 줄 (프로토타입 [이름, 색, 글, 시간, 좋아요]) */
export type ChEntry = { id: string; n: string; c: string; x: string; t: string; lk: number; me?: boolean };
/** 인증 사진: ratio = 보여 줄 틀 비율 · framing = 올릴 때 맞춘 확대 · 위치 */
export type ChPhoto = { uri: string; ratio: number; framing?: PhotoFraming };
type MyCheckin = { x: string; photos: ChPhoto[] };

type ChState = {
  /** 내가 연 챌린지 (맨 앞에 보여요) */
  created: Challenge[];
  /** 참여 (예시로 c1 · c5 · c7 · c8 · c11 에 이미 참여) — 표현 챌린지는 xJoined */
  joined: Record<string, true>;
  /** 내가 새로 참여해서 멤버 수 +1 (chjn) */
  joinedNew: Record<string, true>;
  /** 오늘 인증함 (LG.chal) */
  checked: Record<string, true>;
  /** 표현 챌린지: 문장 · 답글을 처음 단 순간 참여 (chjx) */
  xJoined: Record<string, true>;
  saved: Record<string, true>;
  checkins: Record<string, MyCheckin[]>;
  /** 표현 챌린지 문장 목록 (처음 고칠 때 예시를 복사해 둬요) */
  entries: Record<string, ChEntry[]>;
  /** 답글 (키: 문장 · 인증 열쇠) */
  replies: Record<string, ChEntry[]>;
  liked: Record<string, true>;
  /** 방금 연 챌린지 — 카드가 노랗게 한 번 반짝 */
  flash: string | null;
};

const CH0: ChState = {
  created: [],
  joined: { c1: true, c5: true, c7: true, c8: true, c11: true },
  joinedNew: {},
  checked: {},
  xJoined: {},
  saved: {},
  checkins: {},
  entries: {},
  replies: {},
  liked: {},
  flash: null,
};
// 기기에 남아요 (연 챌린지 · 참여 · 인증 · 문장 · 답글 · 좋아요). '오늘 인증함'은 날이 바뀌면 다시 할 수 있게 비워요 · 반짝임은 저장 안 해요
const store = createStore<ChState>(CH0, {
  persist: {
    key: 'challenges',
    save: (s) => ({ ...s, flash: null, day: dayKey() }),
    load: (saved, initial) => {
      if (!saved || typeof saved !== 'object') return initial;
      const { day, ...s } = saved as Partial<ChState> & { day?: string };
      const next: ChState = { ...initial, ...s, flash: null };
      return day === dayKey() ? next : { ...next, checked: {} };
    },
  },
});
export type ChView = ChState;
export const useChallengeState = () => store.useStore();
/** 내가 연 챌린지만 지켜봐요 (라운지 '새 글' 배지) */
export const useCreatedChallenges = () => store.useStore((x) => x.created);
/** 찜했는지 (챌린지 하나만 지켜봐요 — 라운지 추천 카드 · 하트 버튼) */
export const useChallengeSaved = (id: string) => store.useStore((x) => !!x.saved[id]);
export const getChallengeState = store.get;
const patch = (fn: (s: ChState) => Partial<ChState>) => store.set((s) => ({ ...s, ...fn(s) }));
const without = <T,>(rec: Record<string, T>, key: string) => {
  const next = { ...rec };
  delete next[key];
  return next;
};

// ---- 계산 (프로토타입 함수 이름을 옆에 적어요) ----
export const allChallenges = (s: ChView) => [...s.created, ...CHALLENGES];
export const findChallenge = (s: ChView, id: string) => allChallenges(s).find((p) => p.id === id);
/** chIsX: 표현 챌린지 (나만의 문장 완성하기) */
export const isExpr = (p: Challenge) => (p.cat ?? 'study') === 'study';
/** chJ: 참여 중 — 내가 연 챌린지는 자동 참여, 표현 챌린지는 문장을 달았을 때만 */
export const isJoined = (p: Challenge, s: ChView) => !!p.mine || (isExpr(p) ? !!s.xJoined[p.id] : !!s.joined[p.id]);
/** chPre: 곧 시작 (표현 챌린지는 기간만 있어 늘 열려 있어요) */
export const isPre = (p: Challenge) => !isExpr(p) && !p.day && !p.live;
/** chMem */
export const memberCount = (p: Challenge, s: ChView) => p.members + (s.joinedNew[p.id] ? 1 : 0);
/** chToday: 오늘 인증한 사람 */
export const todayCount = (p: Challenge, s: ChView) => (isPre(p) ? 0 : Math.max(1, Math.round(memberCount(p, s) * 0.55) + (hashOf(p.id) % 5)) + (s.checked[p.id] ? 1 : 0));
/** chHot: 참여 + 좋아요 + 오늘 인증 */
export const hotScore = (p: Challenge, s: ChView) => memberCount(p, s) + p.likes * 2 + todayCount(p, s);
/** 지금까지 진행 (오늘 인증하면 +1) */
export const dayOf = (p: Challenge, s: ChView) => p.day + (s.checked[p.id] && !isPre(p) ? 1 : 0);
export const unitOf = (p: Challenge) => p.unit || '일';
/** chLeft · chLeftT */
export const daysLeft = (p: Challenge) => Math.max(0, (p.dur || p.of || 7) - (p.day || 0));
export const leftText = (p: Challenge) => (daysLeft(p) ? `${daysLeft(p)}일 남음` : '끝났어요');
/** 카드 상태 줄 (dd): '5/14일째' · '11.24 월 시작' · '오늘 시작' */
export const progressText = (p: Challenge, s: ChView) => {
  const d = dayOf(p, s);
  if (isPre(p)) return `${(p.start || '').replace(' 시작', '')} 시작`;
  if (p.live && !d) return '오늘 시작';
  return `${d}/${p.of}${unitOf(p)}째`;
};
/** 카드 일정 한 줄 */
export const planText = (p: Challenge) => (p.freqT ? `${p.dur}일 · ${p.freqT}` : `${p.of}${unitOf(p)} 동안`);
export const meaningOf = (p: Challenge) => (p.ko || '').split(' · ')[0];

/** chSrcOf · chSrcK · chSrc */
export const srcKindOf = (src: ChSrc | null | undefined): ChSrcKind => (src && CH_SRC[src.k] ? src.k : 'book');
export function srcText(src: ChSrc | null | undefined, ls = 0, myLv = 'Lv.1') {
  const o: ChSrc = src || { k: 'book', lv: myLv, ls };
  const k = srcKindOf(o);
  if (k === 'book') {
    if (o.t) return o.t;
    const n = o.ls ?? 0;
    const lv = o.lv || myLv;
    const tt = lv === 'Lv.1' ? LV1_TITLES[n] || '' : '';
    return n ? `${lv} · ${n}챕터${tt ? ' ' + tt : ''}` : `${lv} 교재`;
  }
  if (k === 'trip') return o.t || '상황';
  if (k === 'free' && (o.t || '').startsWith('AI · ')) return `AI 프리토킹 · ${(o.t || '').slice(5)}`;
  // 내 표현함에서 온 출처는 이미 '프리토킹 · 11.12 영등포 세션' 처럼 이름이 붙어 있어요
  if ((o.t || '').startsWith(CH_SRC[k].label)) return o.t || '';
  return `${CH_SRC[k].label} · ${o.t || ''}`;
}
export const challengeSrc = (p: Challenge) => srcText(p.src, p.ls ?? 0, getMe().level);

/** chPbg: 카드 왼쪽 색 */
export const posterBg = (p: Challenge) => p.pbg ?? (p.bg === 'sk' ? CH_C.sky : CH_PBG[p.cat ?? 'study'] || CH_C.y);
/** chPw: 카드 문구 */
export function posterWords(p: Challenge) {
  if (p.pw) return p.pw;
  const c = p.cat ?? 'study';
  if (c !== 'study') return CH_PW[c] || CH_PW.free;
  const w = (p.hl || p.name).toUpperCase().split(' ');
  if (w.length < 2) return w[0];
  const k = Math.ceil(w.length / 2);
  return w.slice(0, k).join(' ') + '\n' + w.slice(k).join(' ');
}
/** chPwFs: 카드 문구가 길면 글씨를 줄여 늘 두 줄 안에 */
export function posterFontSize(w: string) {
  const n = Math.max(...w.split('\n').map((x) => x.length));
  return n <= 6 ? 14 : n <= 7 ? 13.5 : n <= 8 ? 12 : 11;
}

// ---- 표현 챌린지 문장 (chxCmts + chxTips) ----
const CHX_TIMES = ['3분', '10분', '18분', '32분', '1시간', '1시간', '2시간', '3시간', '4시간', '5시간', '6시간', '8시간'];
function seedEntries(p: Challenge): ChEntry[] {
  if (p.mine) return [];
  const h = hashOf(p.id);
  const hl = p.hl || '';
  const T = [`오늘 회의에서 ${hl} 바로 써 봤어요!`, `${p.q || hl} 이거 진짜 자주 쓰게 돼요`, `Me too! ${hl} 외워 둘게요`, `${hl} 발음 연습 중이에요. 어렵다`];
  const who = p.cmn ? [...LG_MEMS, ...LG_POOL].filter(([n]) => n !== p.who).slice(0, p.cmn) : LG_MEMS.slice(h % 3, (h % 3) + 3 + (h % 2));
  const A: ChEntry[] = [...who, ...(p.cmn ? who.slice(0, 2) : [])].map(([n, c], i) => ({ id: `${p.id}-s${i}`, n, c, x: T[(h + i) % T.length], t: CHX_TIMES[i] || '어제', lk: 2 + (hashOf(n + i) % 9) }));
  const B: ChEntry[] = [
    { id: `${p.id}-t0`, n: '하나', c: CH_C.y, x: `${p.q || ''} 오늘 동료한테 바로 써 봤어요!`, t: '1시간', lk: 7 },
    { id: `${p.id}-t1`, n: '유키', c: CH_C.lpu, x: `${hl} — 친구랑 이야기할 때 써 보니 자연스러웠어요.`, t: '어제', lk: 5 },
  ];
  return A.flatMap((x, i) => (B[i] ? [x, B[i]] : [x])).concat(B.slice(A.length));
}
/** hide: 차단한 멤버 (공통 useBlockedNames) — 그 사람 글은 안 보여요 */
export const entriesOf = (p: Challenge, s: ChView, hide: string[] = []) => (s.entries[p.id] ?? seedEntries(p)).filter((e) => !hide.includes(e.n));

// ---- 인증 피드 (chFeed) · 좋아요 · 답글 ----
export type ChCheckin = { key: string; n: string; c: string; t: string; x: string; pic: boolean; photos?: ChPhoto[]; me?: boolean };
const FEED_TIMES = ['10분 전', '32분 전', '1시간 전', '2시간 전', '오늘 아침'];
export function feedOf(p: Challenge, s: ChView, hide: string[] = []): ChCheckin[] {
  const T = CH_FEED[p.cat ?? 'study'];
  const h = hashOf(p.id);
  const ph = p.way === 'photo';
  const meName = getMe().name;
  const mine = (s.checkins[p.id] || []).map((c) => ({ n: meName, c: CH_C.y as string, t: '오늘', x: c.x, pic: c.photos.length > 0, photos: c.photos, me: true }));
  const ex = isPre(p) ? [] : LG_MEMS.slice(h % 3, (h % 3) + 5).map(([n, c], i) => ({ n, c, t: FEED_TIMES[i], x: T[(h + i) % T.length], pic: ph }));
  return [...mine.reverse(), ...ex].filter((q) => !hide.includes(q.n)).map((q) => ({ ...q, key: `chf:${p.id}:${hashOf(q.n + q.x)}` }));
}
/** chfLikes */
export const checkinLikes = (q: ChCheckin, s: ChView) => (s.liked[q.key] ? 1 : 0) + (q.me ? 0 : 2 + (hashOf(q.x) % 11));
/** chfReps: 인증에 달린 답글 (예시 0~2개 + 내 답글) */
export function checkinReplies(q: ChCheckin, s: ChView): ChEntry[] {
  if (s.replies[q.key]) return s.replies[q.key];
  const n = q.me ? 0 : hashOf(q.n + q.x) % 3;
  return Array.from({ length: n }, (_, j) => {
    const r = CH_REP[(hashOf(q.x) + j) % CH_REP.length];
    return { id: `${q.key}-r${j}`, n: r[0], c: r[1], x: r[2], t: ['20분', '1시간', '2시간'][j], lk: hashOf(r[2]) % 4 };
  });
}
export function addCheckinReply(q: ChCheckin, text: string) {
  const s = store.get();
  const e: ChEntry = { id: `r${Date.now()}`, n: getMe().name, c: CH_C.y, x: text, t: '방금', lk: 0, me: true };
  patch((x) => ({ replies: { ...x.replies, [q.key]: [...checkinReplies(q, s), e] } }));
}

// ---- 순위 ----
export type RankRow = { n: string; d: number; c: string; me?: boolean };
export function rankingOf(p: Challenge, s: ChView): RankRow[] {
  if (isPre(p)) return [];
  const jn = isJoined(p, s);
  const pool: [string, number, string][] = [
    ...LG_RANK,
    ...[...LG_MEMS, ...LG_POOL].filter(([n]) => !LG_RANK.some((r) => r[0] === n)).map(([n, c], k): [string, number, string] => [n, Math.max(1, 20 - k * 2), c]),
  ];
  const base: RankRow[] = pool.slice(0, Math.min(pool.length, Math.max(5, memberCount(p, s) - (jn ? 1 : 0)))).map(([n, v, c]) => ({ n, d: Math.min(p.of, Math.max(0, Math.round((v / 30) * Math.max(p.day, 1)))), c }));
  const rows: RankRow[] = [...base, ...(jn ? [{ n: getMe().name, d: dayOf(p, s), c: CH_C.y, me: true }] : [])];
  return rows.sort((x, y) => y.d - x.d || (y.me ? 1 : 0) - (x.me ? 1 : 0));
}

/** 내 인증 7일 (lg-chwk): 오늘이 맨 오른쪽 */
export const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
export function weekOf(p: Challenge, s: ChView) {
  const h = hashOf(p.id);
  const wd = new Date().getDay();
  return Array.from({ length: 7 }, (_, i) => {
    const k = 6 - i;
    const ok = k === 0 ? !!s.checked[p.id] : k <= Math.min(p.day, 6) && (h + k) % 4 !== 0;
    return { ok, today: k === 0, label: k === 0 ? '오늘' : WEEKDAYS[(wd - k + 7) % 7] };
  });
}

// ---- 같은 표현 막기 (chNorm · chDupOf) ----
export const normExpr = (t: string) =>
  String(t || '')
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z' ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
/** 기간이 남은 같은 표현 챌린지 (소문자 · 기호 없이, 한쪽이 다른 쪽을 품어도 같아요). 내 표현함에서 바로 참여로 보낼 때도 써요 */
export function findSameExpr(s: ChView, text: string) {
  const a = normExpr(text);
  if (a.length < 3) return null;
  return (
    allChallenges(s).find(
      (p) =>
        isExpr(p) &&
        daysLeft(p) > 0 &&
        [p.hl || '', ...(p.exprs || []).map((x) => x.p)].some((hh) => {
          const b = normExpr(hh);
          return !!b && (a === b || (b.length > 3 && a.includes(b)) || (a.length > 3 && b.includes(a)));
        }),
    ) ?? null
  );
}

// ---- 행동 ----
/** chJoin: 참여 ↔ 취소. 참여 중이 되면 true */
export function toggleJoin(p: Challenge) {
  const s = store.get();
  if (isJoined(p, s)) {
    if (p.mine) return true;
    patch((x) => ({ joined: without(x.joined, p.id), joinedNew: without(x.joinedNew, p.id), checked: without(x.checked, p.id) }));
    return false;
  }
  patch((x) => ({ joined: { ...x.joined, [p.id]: true }, joinedNew: { ...x.joinedNew, [p.id]: true } }));
  return true;
}
/** lgChal: 오늘 인증 ↔ 취소. 인증 상태가 되면 true */
export function toggleChecked(p: Challenge) {
  const on = !store.get().checked[p.id];
  patch((x) => ({ checked: on ? { ...x.checked, [p.id]: true } : without(x.checked, p.id) }));
  return on;
}
/** do-chk: 오늘 인증 올리기 (댓글 · 사진) */
export function addCheckin(p: Challenge, c: MyCheckin) {
  patch((x) => ({ checkins: { ...x.checkins, [p.id]: [...(x.checkins[p.id] || []), c] }, checked: { ...x.checked, [p.id]: true } }));
}
export function toggleSaved(id: string) {
  const on = !store.get().saved[id];
  patch((x) => ({ saved: on ? { ...x.saved, [id]: true } : without(x.saved, id) }));
  return on;
}
export function toggleLiked(key: string) {
  patch((x) => ({ liked: x.liked[key] ? without(x.liked, key) : { ...x.liked, [key]: true } }));
}

/** 표현 챌린지 문장 · 답글 달기. 처음 다는 순간 자동 참여 — 참여가 새로 되면 true */
export function addEntry(p: Challenge, text: string, replyTo?: string) {
  const s = store.get();
  const e: ChEntry = { id: `e${Date.now()}`, n: getMe().name, c: CH_C.y, x: text, t: '방금', lk: 0, me: true };
  const newly = isExpr(p) && !p.mine && !s.xJoined[p.id];
  if (replyTo) patch((x) => ({ replies: { ...x.replies, [replyTo]: [...(x.replies[replyTo] ?? []), e] } }));
  else patch((x) => ({ entries: { ...x.entries, [p.id]: [...entriesOf(p, x), e] } }));
  if (newly) patch((x) => ({ xJoined: { ...x.xJoined, [p.id]: true } }));
  return newly;
}
export function editEntry(p: Challenge, id: string, text: string) {
  patch((x) => ({ entries: { ...x.entries, [p.id]: entriesOf(p, x).map((e) => (e.id === id ? { ...e, x: text } : e)) } }));
}
/** 지우기 — 되돌리기 함수를 돌려줘요 */
export function removeEntry(p: Challenge, id: string) {
  const cur = entriesOf(p, store.get());
  const at = cur.findIndex((e) => e.id === id);
  const gone = cur[at];
  patch((x) => ({ entries: { ...x.entries, [p.id]: cur.filter((e) => e.id !== id) } }));
  return () =>
    patch((x) => {
      const now = x.entries[p.id] ?? [];
      return { entries: { ...x.entries, [p.id]: [...now.slice(0, at), gone, ...now.slice(at)] } };
    });
}
export const clearFlash = () => patch(() => ({ flash: null }));

// ---- 챌린지 열기 ----
export const CH_PH: Record<ChCatKey, string> = { study: '예) 일주일 동안 I’d like to 쓰기', habit: '예) 하루 단어 10개 외우기', health: '예) 아침 건강하게 먹기', move: '예) 하루 30분 걷기', morning: '예) 아침 7시 기상', free: '예) 하루 한 번 하늘 사진' };
/** 챌린지 소개 예시 (한 줄에 하나씩 · 점 목록) */
export const CH_GD: Record<DailyCatKey, string> = {
  habit: '• 하루 단어 10개 외우기\n• 외운 단어 하나로 문장 만들기',
  health: '• 아침 식단 사진 올리기\n• 한 줄 소감 남기기',
  move: '• 하루 30분 걷기\n• 걸음 수 캡처 + 한 줄',
  morning: '• 7시 전에 일어나기\n• 댓글로 Good morning!',
  free: '• 오늘 찍은 사진 한 장\n• 한 줄 소감',
};
export const START_OPTS = ['오늘', '내일', '다음 주 월요일'] as const;
export type StartOpt = (typeof START_OPTS)[number];
export const DUR_OPTS = [3, 7, 14, 21, 30];
export const XDUR_OPTS = [3, 7, 14, 30];
/** 인증 주기 요일 (월요일부터) */
export const PICK_DAYS = ['월', '화', '수', '목', '금', '토', '일'];

export type ChPlan = { off: number; md: string; D: number; total: number; freqT: string; unit: '' | '회' };
/** chPlan: 시작 · 기간 · 주기 → 총 인증 횟수 */
export function planOf(start: StartOpt, D: number, weekly: boolean, n: number, days: string[]): ChPlan {
  const t0 = new Date(new Date().toDateString());
  const off = start === '오늘' ? 0 : start === '내일' ? 1 : (8 - t0.getDay()) % 7 || 7;
  const sd = new Date(t0.getTime() + off * 864e5);
  const md = `${sd.getMonth() + 1}.${String(sd.getDate()).padStart(2, '0')} ${WEEKDAYS[sd.getDay()]}`;
  if (!weekly) return { off, md, D, total: D, freqT: '매일', unit: '' };
  const ds = WEEKDAYS.filter((w) => days.includes(w));
  let total = 0;
  if (ds.length === n) for (let i = 0; i < D; i++) if (ds.includes(WEEKDAYS[(sd.getDay() + i) % 7])) total++;
  return { off, md, D, total, freqT: `주 ${n}회 · ${PICK_DAYS.filter((w) => ds.includes(w)).join('·')}`, unit: '회' };
}

/** do-chal (일상) */
export function createDaily(o: { cat: DailyCatKey; name: string; way: 'cmt' | 'photo'; guide: string; pw: string[]; pbg?: string; plan: ChPlan; cover?: string }) {
  const me = getMe();
  const live = !o.plan.off;
  const p: Challenge = {
    id: `u${Date.now()}`,
    cat: o.cat,
    way: o.way,
    rec: true,
    ...(o.pw.length ? { pw: o.pw.map((x) => x.toUpperCase()).join('\n') } : {}),
    ...(o.cover ? { cover: o.cover } : {}),
    ...(o.pbg ? { pbg: o.pbg } : {}),
    who: me.name,
    av: CH_C.y,
    br: me.branch.split(' · ')[0],
    time: '방금',
    at: Date.now(),
    name: o.name,
    guide: o.guide || (o.way === 'photo' ? '사진 한 장 + 한 줄' : '댓글 한 줄'),
    host: me.name,
    members: 1,
    day: 0,
    live,
    start: live ? '' : `${o.plan.md} 시작`,
    of: o.plan.total,
    unit: o.plan.unit,
    freqT: o.plan.freqT,
    dur: o.plan.D,
    bg: chCat(o.cat).tone,
    lang: 'en-US',
    likes: 0,
    mine: true,
  };
  patch((x) => ({ created: [p, ...x.created], flash: p.id }));
  return p;
}

/** 저장한 표현 → 챌린지에 쓸 카드 (내 표현함의 exprCard · exprFrom 그대로: 핵심 표현 · 뜻 · 예문(고친 문장이면 고친 쪽) · 나온 곳) */
export type ExprCard = { id: string; p: string; m: string; ex: string; src: ChSrc; srcLabel: string; mine: boolean };
export function cardOfSaved(e: SavedExpression): ExprCard {
  const c = exprCard(e);
  return { id: e.id, p: c.p, m: c.m, ex: c.ex, src: { k: exprFrom(e), t: e.source }, srcLabel: e.source, mine: c.mine };
}

/** do-chal (표현) — 표현 카드 하나로 나만의 문장 완성하기 */
export function createExpression(o: { card: ExprCard; D: number; first: string }) {
  const me = getMe();
  const hl = o.card.p.replace(/…$/, '');
  const p: Challenge = {
    id: `u${Date.now()}`,
    cat: 'study',
    way: 'cmt',
    rec: true,
    who: me.name,
    av: CH_C.y,
    br: me.branch.split(' · ')[0],
    time: '방금',
    at: Date.now(),
    name: hl,
    host: me.name,
    q: o.card.ex,
    hl,
    ko: o.card.m,
    ls: 0,
    src: o.card.src,
    dur: o.D,
    of: o.D,
    day: 0,
    live: true,
    lang: 'en-US',
    likes: 0,
    members: 1,
    mine: true,
  };
  const first: ChEntry[] = o.first ? [{ id: `e${Date.now()}`, n: me.name, c: CH_C.y, x: o.first, t: '방금', lk: 0, me: true }] : [];
  patch((x) => ({ created: [p, ...x.created], entries: { ...x.entries, [p.id]: first }, flash: p.id }));
  return p;
}
