/**
 * 회원 · 비회원 권한 — docs/pages/09-onboarding.md '회원 · 비회원 권한' 표와 같아요.
 * 누가 누구인지(userKind)는 나(state/me)의 role · link · trial · plan 으로 정해요. role 'guest' 가 기준이에요:
 * 지점이 연동해 주기 전(가입 직후 · 연동 대기 · 못 찾음 · 체험 예약 · 앱으로만)은 모두 guest 이고, 연동되면 member (state/link-events).
 */
import type { Me } from '@/state/me';

/** 회원 · 연동 대기 · 연동 안 됨 · 체험 예약 · 앱으로만 · 비회원 */
export type UserKind = 'member' | 'pending' | 'rejected' | 'trial' | 'app' | 'guest';

type AccessFields = Pick<Me, 'role' | 'link' | 'trial' | 'plan'>;

export function userKind(me: AccessFields): UserKind {
  // 회원 · 리더 · 매니저 (연동됨 — 처음 넣어 둔 가짜 회원도 linked)
  if (me.role !== 'guest' && (me.link === 'linked' || me.link === 'none')) return 'member';
  if (me.link === 'pending') return 'pending';
  if (me.link === 'rejected') return 'rejected';
  if (me.trial) return 'trial';
  if (me.plan === 'app') return 'app';
  return 'guest';
}

export const isMember = (me: AccessFields) => userKind(me) === 'member';

/** 회원만: 지점 전산과 이어져야 쓸 수 있는 것 · 다른 사람과 함께하는 것 */
export const MEMBER_FEATURES = {
  attendance: '출석 · 사전 출석',
  myStudy: '내 스터디 · 팀 · 연기 · 변경',
  pass: '이용권',
  proNote: "PRO'S NOTE",
  branchBoard: '지점 안내 게시판',
  loungeWrite: '라운지 글쓰기 · 댓글 · 모임 참여',
  eventJoin: '이벤트 참여 · 제안',
  challengeCreate: '챌린지 만들기',
  settings: '설정',
  fullScroll: '라운지 · 이벤트 · 마이 끝까지 보기',
  allChapters: '스터디 맵 · 상황 맵 둘째 챕터부터',
} as const;

/** 누구나: 혼자 하는 학습 · 구경 · 내 꾸미기 */
export const OPEN_FEATURES = {
  lesson: '레슨 · 라이브러리 (첫 챕터)',
  studyMap: '스터디 맵 · 상황 맵 첫 챕터',
  loungeBrowse: '라운지 · 이벤트 위쪽 구경',
  like: '좋아요',
  customize: '캐릭터 꾸미기',
} as const;

export type Feature = keyof typeof MEMBER_FEATURES | keyof typeof OPEN_FEATURES;

/** 앱 구독(결제)도 쓰는 것: 레슨 맵 전부 · 끝까지 스크롤 · 설정 (지점 전산 · 다른 사람과 함께하는 건 회원만) */
const APP_FEATURES: Feature[] = ['allChapters', 'fullScroll', 'settings'];

export function canUse(me: AccessFields, feature: Feature) {
  if (!(feature in MEMBER_FEATURES)) return true;
  const kind = userKind(me);
  return kind === 'member' || (kind === 'app' && APP_FEATURES.includes(feature));
}

/** 비회원이 끝까지 해 볼 수 있는 챕터: 맵마다 첫 챕터 (스터디 맵 1과 · 상황 맵 장면 1) */
export const FREE_CHAPTER = 1;
export const isFreeChapter = (no: number) => no <= FREE_CHAPTER;
