/**
 * 홈 가짜 데이터 (Mock). 백엔드 API가 나오면 서버에서 받아 와요.
 * 값은 프로토타입(prototype/index.html 의 SLOTS · LANGS · POPS · NOTI · LG_FEED)과 같아요.
 * 맞는 API: docs/appendix/api-inventory.md —
 *   8 `/me/sessions/today` · 9 `/sessions/:id/rsvp` · 10 `/sessions/:id/attendance`
 *   13 `/me/notifications` · 14 `/me/notifications/read` · 15 `/lounge/highlights` · 22 `/me/progress/skip-test`
 *   팝업 공지는 아직 목록에 없어요 (제안: GET `/popups` — 본사 관리자가 올리는 앱 시작 팝업)
 */
import { LAUNCH } from '@/constants/launch';
import { Colors } from '@/constants/theme';
import { MY_TEAMS, teamWeekdays } from '@/data/account';

/* ───────── 오늘 세션 · 출석 (프로토타입 SLOTS · MY_SLOT · LANGS · QR_BEFORE · QR_AFTER) ───────── */

/** 내 팀 수업 시작 시각 (마이 · 내 스터디의 팀과 같아요). start = 하루 중 분 (19:30 → 1170) */
export const SLOTS = [
  { id: 's1100', t: '11:00', start: 11 * 60 },
  { id: 's1930', t: '19:30', start: 19 * 60 + 30 },
  { id: 's2100', t: '21:00', start: 21 * 60 },
] as const;

/** 내 수업 기본값: 21:00 · 영어 (5팀 영어 월수 9시) */
export const MY_SLOT = 2;
export const MY_LANG = 0;

/** 사전 출석은 스터디 시작 24시간 전까지만 (그 뒤엔 QR 출석만) */
export const RSVP_BEFORE = 24 * 60;

/** 내가 등록된 팀 · 그날 열린 수업. 출석체크 시트엔 내 팀이 다 보이고, 전산에서 그날 수업을 연 팀만 누를 수 있어요.
 *  실제 앱은 8 `/me/sessions/today` 가 내려줘요 */
export type MyTeamToday = {
  /** 지점 안 팀 번호 (예: 5팀) */
  no: string;
  branch: string;
  /** LANGS 순서 */
  lang: number;
  /** '월수 21:00' — 요일 글자 + 시작 시각 */
  when: string;
  /** 전산에서 그날 연 수업 (SLOTS 순서) · 안 열었으면 null */
  slot: number | null;
  /** 전산 팀 이름 그대로 (예: '1-1 영어') — 있으면 이 이름 + 시각으로 보여요 (지점 관리자의 지점 세션) */
  label?: string;
};

/** 가짜 전산: 마이의 내 팀(MY_TEAMS) 중 그 요일 수업이 있는 팀을 열어요 (dow: 0 일 ~ 6 토) */
export function myTeamsOn(dow: number): MyTeamToday[] {
  return MY_TEAMS.map((t) => {
    const time = t.when.split(' ')[1];
    const slot = SLOTS.findIndex((s) => s.t === time);
    return {
      no: t.no,
      branch: t.branch,
      lang: Math.max(0, LANGS.findIndex((l) => l.ko === t.lang)),
      when: t.when,
      slot: teamWeekdays(t).includes(dow) && slot >= 0 ? slot : null,
    };
  });
}

/** QR 출석 가능: 시작 30분 전 ~ 시작 20분 후 */
export const QR_BEFORE = 30;
export const QR_AFTER = 20;

/** 출석 포인트 */
export const ATTEND_POINTS = 30;
/** 구간 건너뛰기(테스트 통과): 건너뛴 단계마다 +10P (프로토타입 xp: gained * 10) */
export const SKIP_POINTS = 10;

/** 챕터 완료 보상 상자에서 나오는 것 (이슈 #7) */
export type ChestReward = {
  xp: number;
  /** 다음 레벨 · 남은 XP · 레벨 막대 (받기 전 → 받은 뒤, 0~1) */
  nextLevel: number;
  toNext: number;
  barFrom: number;
  barTo: number;
  badge: string;
  newWords: number;
  streak: number;
};
/** 예시 값이에요. 실제 값은 진도 API 가 정해요 (챕터 완료 보상: XP · 배지 · 아이템) */
export const chestReward = (_unit: number): ChestReward => ({ xp: 120, nextLevel: 4, toNext: 180, barFrom: 0.38, barTo: 0.82, badge: '카페 마스터', newWords: 8, streak: 5 });

export const LANGS = [
  { key: 'en', ko: '영어', g: 'EN', color: Colors.langEn, ink: Colors.white },
  { key: 'ja', ko: '일본어', g: 'あ', color: Colors.langJa, ink: Colors.ink },
  { key: 'zh', ko: '중국어', g: '中', color: Colors.langZh, ink: Colors.white },
  { key: 'es', ko: '스페인어', g: 'ES', color: Colors.langEs, ink: Colors.ink },
] as const;

/* ───────── 앱을 열 때 팝업 (프로토타입 POPS · 서버 GET /popups) ───────── */

/** 템플릿 배경 프리셋 — 서버는 키만 주고 색은 앱이 정해요 (components/home/launch-popup.tsx) */
export type PopupBackground = 'PURPLE' | 'BLUE' | 'PINK' | 'SLATE';

/** 버튼을 누르면 갈 리소스 종류 — 이벤트처럼 따로 글이 있으면 그 글로, 아니면 공지로 가요 */
export type PopupResourceType = 'NOTICE' | 'EVENT';

/** 백엔드 MobilePopupResponse 와 1:1. 지금 띄울 것만 내려와요 (숨김 · 기간 밖 · 연결 공지 비공개는 서버가 뺌) */
export type LaunchPopup = {
  id: string;
  /** TEMPLATE = 문구 + 배경 프리셋, IMAGE = 배너 이미지 한 장 */
  design: 'TEMPLATE' | 'IMAGE';
  kicker: string;
  /** 줄바꿈은 \n */
  title: string;
  sub: string;
  background: PopupBackground;
  /** IMAGE 일 때 배너 이미지 주소 */
  imageUrl: string | null;
  ctaLabel: string;
  resourceType: PopupResourceType;
  resourceId: string;
  /** 노출 종료 (UTC ISO) */
  publishUntil: string;
};

export const LAUNCH_POPUPS: LaunchPopup[] = [
  { id: 'pop-party', design: 'TEMPLATE', kicker: 'YEAR END PARTY', title: 'PALLO\n연말 랭귀지 파티', sub: '11.29 토 19:00 · 전 지점', background: 'PURPLE', imageUrl: null, ctaLabel: '자세히 보기', resourceType: 'EVENT', resourceId: 'm2', publishUntil: '2026-11-29T14:59:00Z' },
  { id: 'pop-dec', design: 'TEMPLATE', kicker: 'DECEMBER', title: '12월\n스터디 일정', sub: '25일 · 31일 휴무 · 27일 보충', background: 'BLUE', imageUrl: null, ctaLabel: '공지 보기', resourceType: 'NOTICE', resourceId: 'n1', publishUntil: '2026-12-31T14:59:00Z' },
];

/* ───────── 멤버 얼굴 · 라운지 미리보기 (프로토타입 AF_IDS · afItems · LG_FEED p1 · c1 · m1 · p2 · a1) ───────── */

/** 멤버 얼굴: 꾸민 캐릭터 몸 색 (원본 3D 그림의 색 교체본) */
export type MemberBody = 'pink' | 'sky' | 'purple';

/** 사진 대신 쓰는 브랜드 색 포스터 (프로토타입 LG_PICS) — 실제 앱은 올린 사진 */
export type Poster =
  | { kind: 'party' }
  | { kind: 'ramen' }
  | { kind: 'quote'; text: string; bg: [string, string] }
  | { kind: 'date'; day: string; sub: string; bg: [string, string] }
  | { kind: 'kicker'; text: string; bg: [string, string] };

export type LoungeHighlight = {
  id: string;
  channel: string;
  channelColor: string;
  who: string;
  face: { bg: string; body: MemberBody };
  time: string;
  /** 작성자 지점 (두 지점이면 'A · B') */
  branch: string;
  langs: string[];
  text: string;
  likes: number | null;
  photos: number;
  poster: Poster;
  /** 누르면 갈 곳: 그 글 · 모임 상세 */
  href: string;
};

const ALL_LOUNGE_HIGHLIGHTS: LoungeHighlight[] = [
  {
    id: 'p1',
    channel: '커뮤니티',
    channelColor: Colors.rosePink,
    who: '하나',
    face: { bg: '#FFE200', body: 'pink' },
    time: '10분 전',
    branch: '영등포',
    langs: ['영어'],
    text: '이번 주 세션 주제는 주말 이야기! 다들 20분 동안 주말 얘기만 했어요',
    likes: 128,
    photos: 4,
    poster: { kind: 'party' },
    href: '/post/p1',
  },
  {
    id: 'c1',
    channel: '챌린지',
    channelColor: Colors.yellow,
    who: '민준',
    face: { bg: '#1E1A2B', body: 'purple' },
    time: '1시간 전',
    branch: '잠실점',
    langs: ['영어'],
    text: '30일 하루 한 문장 · 128명 참여 중',
    likes: 41,
    photos: 1,
    poster: { kind: 'quote', text: '“I’m on the fence about it.”', bg: ['#7FB6E6', '#493087'] },
    href: '/challenge/c1',
  },
  {
    id: 'm1',
    channel: '번개',
    channelColor: Colors.rosePink,
    who: '하나',
    face: { bg: '#FFE200', body: 'pink' },
    time: 'NOV 14 · 금 20:00',
    branch: '영등포',
    langs: ['영어'],
    text: '퇴근 후 영어 맥주 번개 · 영등포 근처 수제맥주집',
    likes: null,
    photos: 1,
    poster: { kind: 'date', day: '14', sub: 'NOV · 금 20:00', bg: ['#C2416B', '#493087'] },
    href: '/meet/m1',
  },
  {
    id: 'p2',
    channel: '커뮤니티',
    channelColor: Colors.rosePink,
    who: 'Leo',
    face: { bg: '#E8D9BF', body: 'sky' },
    time: '어제',
    branch: '연신내',
    langs: ['영어', '일본어'],
    text: '세션에서 연습한 표현, 후쿠오카에서 진짜 열 번은 썼어요.',
    likes: 342,
    photos: 3,
    poster: { kind: 'ramen' },
    href: '/post/p2',
  },
  {
    id: 'a1',
    channel: '해외살이',
    channelColor: Colors.sky,
    who: '예린',
    face: { bg: '#E8D9BF', body: 'purple' },
    time: '2일 전',
    branch: '잠실점 출신 · 시드니 7개월째',
    langs: ['영어', '일본어'],
    text: '시드니 쉐어하우스 구할 때 꼭 확인할 것 5가지',
    likes: 63,
    photos: 1,
    poster: { kind: 'kicker', text: 'AUSTRALIA · 집', bg: ['#7FB6E6', '#2F6E83'] },
    href: '/trip/a1',
  },
];
/**
 * 출시 때 안 여는 기능(constants/launch)으로 가는 예시는 빼요 — 해외 동행 · 해외살이 · 표현 챌린지.
 * c1 · c2 · c3 · c14 는 data/challenge 의 예시 표현 챌린지예요 (여기서 data/challenge 를 부르면 today-goal 과 서로 물려요).
 * 서버 데이터로 바뀌면 서버가 안 보내면 돼요.
 */
const EXPR_CHALLENGE_HREF = /^\/challenge\/(c1|c2|c3|c14)(\?|$)/;
const launchedHref = (h?: string) => !((!LAUNCH.trip && !!h && /trip/.test(h)) || (!LAUNCH.exprChallenge && !!h && EXPR_CHALLENGE_HREF.test(h)));
export const LOUNGE_HIGHLIGHTS = ALL_LOUNGE_HIGHLIGHTS.filter((x) => launchedHref(x.href));

/** 학습 언어 칩 색 (프로토타입 LG_LANGC) */
export const LANG_CHIP: Record<string, string> = {
  영어: Colors.langEn,
  일본어: Colors.langJa,
  중국어: Colors.langZh,
  스페인어: Colors.langEs,
};

/* ───────── 알림함 (프로토타입 NOTI · NOTIR) ───────── */

export type NotiKind = 'notice' | 'learn' | 'lounge' | 'event';
export type NotiIcon = 'tack' | 'book' | 'flame' | 'pen' | 'bolt' | 'flag' | 'cal' | 'plane';

export type Noti = {
  id: string;
  kind: NotiKind;
  /** 아이콘 또는 보낸 사람 얼굴 */
  icon?: NotiIcon;
  who?: { name: string; bg: string; body: MemberBody };
  text: string;
  time: string;
  /** 누르면 갈 화면 */
  href: string;
  read: boolean;
  /** 지점 연동 결과 알림의 동그라미: 연동됨(보라 · 체크) · 못 찾음(분홍 · ?) — 프로토타입 .nt-ic.ok */
  badge?: 'ok' | 'fail';
  /** 줄 오른쪽 작은 노랑 버튼 (누르면 줄을 누른 것과 같아요) — 예) '나도 이어서 하기' · '같이 가기' */
  action?: string;
  /** 누르면 알림 속 단계가 아니라 내가 마지막으로 공부한 곳으로 (친구 퀘스트 성공 알림) */
  toMyLast?: boolean;
};

export const NOTI_TABS: { key: 'all' | NotiKind; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'notice', label: '공지' },
  { key: 'learn', label: '학습' },
  { key: 'lounge', label: '라운지' },
  { key: 'event', label: '이벤트' },
];

const ALL_NOTIS: Noti[] = [
  // 받는 쪽 예시 (추가 제안 · api-additions): 팔로우한 멤버의 '같이 갈래요?' → 그 시간 · 언어로 사전 출석 시트
  { id: 'inv1', kind: 'learn', who: { name: '민준', bg: '#E3EAF8', body: 'sky' }, text: '민준님이 오늘 21:00 영어 세션에 가요. 같이 갈래요?', time: '5분 전', href: '/?attend=rsvp&slot=2&lang=0', read: false, action: '같이 가기' },
  // 팔로우한 멤버의 퀘스트 성공 → 같은 단계로 (첫 챕터 · 회원 잠금은 레슨 화면이 지켜요)
  { id: 'qs1', kind: 'learn', who: { name: '소라', bg: '#CDEBD0', body: 'pink' }, text: '소라님이 「1과 Cafe Complaint · 본학습」 퀘스트를 성공했어요!', time: '20분 전', href: '/lesson/sit?lv=1&unit=1', read: false, action: '나도 이어서 하기', toMyLast: true },
  // 시즌 보상 미리 알림 (서버 자동 · api-additions '시즌 보상 자동 지급'): 시즌 시작 · 거의 다 채웠을 때 · 받았을 때
  { id: 'rw-santa-0', kind: 'event', icon: 'flag', text: '12월 시즌 보상 · 12월에 출석 7일을 채우면 산타 세트(모자 · 수염 · 옷 · 부츠 · 눈 오는 밤 배경)를 받아요', time: '40분 전', href: '/me/customize', read: false },
  { id: 'nc0', kind: 'notice', icon: 'tack', text: '[공지] 이번 달 스터디 일정 안내', time: '30분 전', href: '/notice/n1', read: false },
  { id: 'n1', kind: 'learn', icon: 'book', text: '내일 19:30 세션이에요. 1과 예습이 남았어요', time: '1시간 전', href: '/unit/1?lv=1', read: false },
  { id: 'n2', kind: 'lounge', who: { name: '하나', bg: '#FFE200', body: 'pink' }, text: '하나님이 내 글에 댓글을 남겼어요 “최고예요!”', time: '2시간 전', href: '/post/p1?comments=1', read: false },
  { id: 'n3', kind: 'lounge', icon: 'flame', text: '‘아침 7시 기상’ 오늘 인증이 남았어요', time: '3시간 전', href: '/challenge/c5', read: false },
  { id: 'n4', kind: 'learn', icon: 'pen', text: '프로님이 PRO\'S NOTE를 보냈어요', time: '어제 21:10', href: '/me/notes', read: false },
  { id: 'n5', kind: 'lounge', who: { name: 'Leo', bg: '#E8D9BF', body: 'sky' }, text: 'Leo님이 ‘say that again’에 문장을 올렸어요', time: '2일 전', href: '/challenge/c2', read: false },
  { id: 'n6', kind: 'lounge', icon: 'bolt', text: '번개 참여가 확정됐어요 · 홍대 이자카야 번개', time: '3일 전', href: '/meet/m9', read: true },
  { id: 'n7', kind: 'lounge', icon: 'flag', text: '동아리 가입이 승인됐어요', time: '4일 전', href: '/club/cl1', read: true },
  { id: 'n8', kind: 'event', icon: 'cal', text: '‘제주 영어 캠프 1박 2일’ 신청 마감 D-2', time: '5일 전', href: '/events/e4', read: true },
  { id: 'n9', kind: 'lounge', icon: 'plane', text: '도쿄 동행 신청이 수락됐어요', time: '11.02', href: '/lounge?tab=trip', read: true },
  { id: 'nc2', kind: 'notice', icon: 'tack', text: '[새 소식] Lv.1 교재가 4교로 바뀌었어요', time: '11.03', href: '/notice/n3', read: true },
  { id: 'n10', kind: 'notice', icon: 'tack', text: '[이벤트] 영등포점 Thanksgiving 포틀럭 파티', time: '10.30', href: '/notice/n2', read: true },
  { id: 'nc3', kind: 'notice', icon: 'tack', text: '[공지] 라운지 이용 규칙 안내', time: '10.27', href: '/notice/n4', read: true },
];
export const NOTIS = ALL_NOTIS.filter((n) => launchedHref(n.href));

/* ───────── 오늘의 목표 (하루 퀘스트 수 · state/today-goal) ───────── */

export const TODAY_GOAL = { title: '퀘스트 2개 깨기', total: 2 };
