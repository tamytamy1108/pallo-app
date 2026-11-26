/**
 * 호스트 · 코호스트 운영 규칙 (동아리 · 챌린지 공통 숫자). 만들기 화면의 '운영 규칙' 상자 · 관리 시트 · 백엔드 문서가 같은 값을 써요.
 * 숫자는 제안이에요 — 바꾸면 docs/frontend/api-additions.md 'A33 활동 없음 · 저조 규칙'도 같이 고쳐요.
 * 백엔드가 생기면 서버가 활동을 세고, 관리자 웹이 경고 · 닫기를 해요 (`/admin/clubs/:id/warnings` · `/admin/challenges/:id/warnings`).
 */
export const CLUB_RULE = {
  /** 관리자 검토 기간 (신청 → 승인 · 거절 알림) */
  reviewDays: '1~3일',
  /** 이 기간 동안 정기 모임 · 게시글 · 채팅이 하나도 없으면 '활동 없음' */
  idleDays: 30,
  /** 이 기간 동안 정기 모임이 한 번도 안 열리면 '활동 저조' (글 · 채팅만 있음) */
  lowDays: 30,
  /** 경고 알림 횟수 · 간격 — 마지막 경고 뒤 graceDays 안에도 그대로면 관리자가 닫을 수 있어요 */
  warnings: 3,
  warnEvery: 7,
  graceDays: 7,
} as const;

export const CHALLENGE_RULE = {
  /** 이 기간 동안 인증이 하나도 없으면 '활동 없음' (참여자 모두 합쳐서) */
  idleDays: 7,
  warnings: 2,
  warnEvery: 3,
  graceDays: 3,
} as const;

/** 만들기 화면 '운영 규칙' 줄들 */
export const clubRuleLines = () => [
  `관리자가 승인하면 지도에 보이고, 나는 이 동아리의 호스트가 돼요. 내가 만든 동아리만 관리할 수 있어요.`,
  `호스트는 멤버 중에서 코호스트를 정하고 뺄 수 있어요. 코호스트는 공지 · 정기 모임 · 참석 확인을 함께 맡아요.`,
  `${CLUB_RULE.idleDays}일 동안 정기 모임 · 게시글 · 채팅이 하나도 없거나, 정기 모임이 한 번도 안 열리면 관리자가 경고 알림을 보내요.`,
  `경고는 ${CLUB_RULE.warnEvery}일 간격으로 최대 ${CLUB_RULE.warnings}번 가고, 마지막 경고 뒤 ${CLUB_RULE.graceDays}일 안에도 활동이 없으면 관리자가 동아리를 닫을 수 있어요.`,
  `동아리가 닫히면 그 동아리의 호스트 · 코호스트 권한도 같이 없어져요. 운영 중인 동아리가 하나도 없으면 호스트 뱃지도 사라지고, 기록만 남아요.`,
];

export const challengeRuleLines = () => [
  `내가 연 챌린지는 내가 관리해요.`,
  `${CHALLENGE_RULE.idleDays}일 동안 인증이 하나도 없으면 관리자가 경고 알림을 보내요.`,
  `경고는 ${CHALLENGE_RULE.warnEvery}일 간격으로 최대 ${CHALLENGE_RULE.warnings}번 가고, 마지막 경고 뒤 ${CHALLENGE_RULE.graceDays}일 안에도 인증이 없으면 관리자가 챌린지를 지울 수 있어요.`,
];
