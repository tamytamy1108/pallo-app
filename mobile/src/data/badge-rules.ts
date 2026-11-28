/**
 * 배지 받는 법 — 조건 유형마다 화면에 쓰는 말 · 갈 곳 (서버 AppBadgeConditionType · AppBadgeAwardService 규칙과 같아요).
 * 판정 · 지급은 서버가 해요. 앱은 서버가 준 조건(유형 + 기준 숫자)과 진행 값을 사람 말로 바꿔 보여 줄 뿐이에요.
 */
import type { Href } from 'expo-router';

import type { BadgeConditionType, BadgeIcon } from './my';

type Rule = {
  /** 분류 (상세 시트 '받는 방법' 위 작은 글) */
  kind: string;
  ic: BadgeIcon;
  /** 값 단위 — 진행 '2 / 5번' */
  unit: string;
  /** 받는 조건 한 줄 */
  how: (n: number) => string;
  /** 남은 만큼 한 줄 — 못 받은 배지의 진행 막대 아래 */
  left: (left: number) => string;
  /** 세는 법 (서버 규칙) */
  notes: string[];
  /** 하러 가기 */
  go: { label: string; href: Href };
  /** 낮을수록 좋은 값 (랭킹 순위) — 진행 막대 대신 '지난주 n위' */
  lowerIsBetter?: boolean;
};

export const BADGE_RULE: Record<BadgeConditionType, Rule> = {
  HANGOUT_JOIN_COUNT: {
    kind: '번개',
    ic: 'bolt',
    unit: '번',
    how: (n) => (n === 1 ? '번개에 처음 참여하면 받아요' : `번개에 ${n}번 참여하면 받아요`),
    left: (l) => `${l}번 더 참여하면 받아요`,
    notes: ['참여가 확정된 번개만 세요 (신청만 한 건 아직이에요)', '내가 연 번개도 참여로 세요', '같은 번개는 한 번만 세고, 나중에 빠져도 줄지 않아요'],
    go: { label: '번개 보러 가기', href: '/lounge?tab=meet' },
  },
  CLUB_JOIN_COUNT: {
    kind: '동아리',
    ic: 'users',
    unit: '곳',
    how: (n) => (n === 1 ? '동아리에 처음 가입하면 받아요' : `동아리 ${n}곳에 가입하면 받아요`),
    left: (l) => `동아리 ${l}곳 더 가입하면 받아요`,
    notes: ['정식 멤버가 된 동아리만 세요', '내가 만든 동아리도 세요 (설립 승인 뒤)', '같은 동아리는 한 번만 세고, 나중에 나가도 줄지 않아요'],
    go: { label: '동아리 보러 가기', href: '/lounge?tab=meet' },
  },
  POST_LIKES_ON_ONE_POST: {
    kind: '커뮤니티',
    ic: 'heart',
    unit: '개',
    how: (n) => `글 하나가 좋아요 ${n}개를 받으면 받아요`,
    left: (l) => `가장 인기 있는 글이 좋아요 ${l}개 더 받으면 받아요`,
    notes: ['글 하나에 모인 좋아요로 세요 (여러 글을 더하지 않아요)', '진행은 내 글 중 좋아요가 가장 많은 글 기준이에요', '좋아요가 늘어나는 순간 바로 받아요'],
    go: { label: '커뮤니티에 글 쓰러 가기', href: '/lounge?tab=com' },
  },
  STUDY_STREAK_DAYS: {
    kind: '공부',
    ic: 'flame',
    unit: '일',
    how: (n) => `${n}일 연속 공부하면 받아요`,
    left: (l) => `${l}일만 더 이어 가면 받아요`,
    notes: ['하루에 퀘스트를 하나라도 끝내면 그날은 이어져요', '하루는 한국 시간 0시에 바뀌어요'],
    go: { label: '오늘 공부하러 가기', href: '/home' },
  },
  SHADOWING_SENTENCE_COUNT: {
    kind: '말하기',
    ic: 'mic',
    unit: '문장',
    how: (n) => `따라 말하기 ${n}문장을 채우면 받아요`,
    left: (l) => `${l}문장 더 따라 말하면 받아요`,
    notes: ['레슨에서 따라 말한 문장을 모두 더해요'],
    go: { label: '따라 말하러 가기', href: '/home' },
  },
  WEEKLY_RANK_TOP: {
    kind: '랭킹',
    ic: 'crown',
    unit: '위',
    how: (n) => `주간 개인 랭킹 ${n}위 안에 들면 받아요`,
    left: () => '이번 주 랭킹에 도전해 보세요',
    notes: ['주가 끝나는 월요일 0시(한국 시간)에 확정된 순위로 줘요'],
    go: { label: '랭킹 보러 가기', href: '/me/ranking' },
    lowerIsBetter: true,
  },
};

/** 배지 모두 보기 아래 '배지는 이렇게 받아요' — 모든 배지에 같은 규칙 (서버 AppBadgeAwardService) */
export const BADGE_GUIDE: { t: string; d: string }[] = [
  { t: '활동하면 저절로 받아요', d: '번개 · 동아리에 참여하거나 글이 좋아요를 받아 기준에 닿는 순간, 따로 신청하지 않아도 들어와요.' },
  { t: '받으면 바로 알려 드려요', d: '알림이 오고, 앱을 열면 축하 화면이 떠요. 알림을 꺼 두어도 축하 화면은 볼 수 있어요.' },
  { t: '횟수는 계속 쌓여요', d: '같은 번개 · 동아리는 한 번만 세요. 나중에 빠지거나 나가도 이미 센 횟수는 줄지 않아요.' },
  { t: '한 번 받은 배지는 내 거예요', d: '배지는 사라지지 않아요. 배지가 목록에서 내려가도 받은 배지는 그대로 남아요.' },
  { t: '새 배지는 다음 활동 때', d: '새 배지가 생기면, 이미 기준을 넘었더라도 다음 활동을 할 때 받아요.' },
];

/** 받은 날 — '2026년 11월 21일' (기기 시간대). 올해면 연도를 빼요 */
export function earnedDateLabel(iso: string, now = new Date()): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const md = `${d.getMonth() + 1}월 ${d.getDate()}일`;
  return d.getFullYear() === now.getFullYear() ? md : `${d.getFullYear()}년 ${md}`;
}
