/**
 * 회원 · 비회원 권한 — docs/pages/09-onboarding.md '회원 · 비회원 권한' 표와 같아요.
 * 누가 누구인지(userKind)는 회원(member) · 비회원(guest) 둘뿐이에요. 회원 = 연동된 지점이 있는 사람 (state/me 의 role · link).
 * 지점이 연동해 주기 전(가입 직후 · 연동 대기 · 못 찾음 · 체험 예약)은 모두 guest 이고, 연동되면 member (state/link-events).
 * 비회원이 지금 무엇을 기다리는지(연동 대기 · 반려 · 체험 예약)는 상태가 아니라 서버 요약에서 봐요 (api/use-branch-progress).
 */
import type { Me } from '@/state/me';

/** 회원 · 비회원 */
export type UserKind = 'member' | 'guest';

type AccessFields = Pick<Me, 'role' | 'link'>;

export function userKind(me: AccessFields): UserKind {
  // 회원 · 프로 · 매니저 (연동됨 — 처음 넣어 둔 가짜 회원도 linked)
  return me.role !== 'guest' && (me.link === 'linked' || me.link === 'none') ? 'member' : 'guest';
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

export function canUse(me: AccessFields, feature: Feature) {
  return !(feature in MEMBER_FEATURES) || isMember(me);
}

/** 비회원이 끝까지 해 볼 수 있는 챕터: 맵마다 첫 챕터 (스터디 맵 1과 · 상황 맵 장면 1) */
export const FREE_CHAPTER = 1;
export const isFreeChapter = (no: number) => no <= FREE_CHAPTER;
