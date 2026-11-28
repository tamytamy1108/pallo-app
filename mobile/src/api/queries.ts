/**
 * 화면이 쓰는 서버 데이터 목록 (TanStack Query). 키는 여기 한 곳에서만 만들어요.
 * 화면: const { data, isPending, isError, refetch } = useQuery(noticesQuery());
 * 바꾼 뒤 다시 받기: queryClient.invalidateQueries({ queryKey: queryKeys.me })
 */
import { queryOptions } from '@tanstack/react-query';

import { toSituationMaps, type MapRow } from '@/data/maps';

import { fetchSignupOptions } from './auth';
import type { PageParams } from './client';
import { fetchBasicLesson, fetchBookShelf, fetchPatternLesson, fetchSceneContent, fetchSituationMaps, fetchUnit34, lessonContentId } from './learn';
import { fetchLaunchPopups, fetchLoungeHighlights, fetchNotice, fetchNotices, fetchTodaySessions, fetchUnreadNotificationCount } from './home';
import { fetchMyAvatar } from './avatar';
import { fetchMyBadges, fetchUnseenBadges } from './badges';
import { fetchMe } from './me';
import type { NotificationCategory } from './notifications';
import { fetchMyLinkRequests } from './branch-link';
import { fetchBranchSummary } from './branch-summary';
import { fetchChallengeCategories, fetchChallengeLounge } from './challenges';
import { fetchBranchToday } from './branch-today';
import { fetchMyExpressions, fetchMyMeets, fetchSavedChallenges, type MyMeetBox } from './my-activity';
import { fetchMemberProfile } from './member-profile';
import { fetchMyPage } from './my-page';
import { fetchBranchRanking, fetchMemberRanking, type RankingPeriod } from './ranking';
import { fetchProSessions } from './pro-sessions';
import { fetchProsNote, type ProsNoteBox } from './pros-notes';
import { fetchBranchGuides } from './branch-guide';
import { fetchFaq, fetchMyInquiries } from './support';
import { fetchReportReasons } from './reports';
import { fetchEventCategories, fetchMyEventProposals } from './event-proposals';
import { fetchEvent, fetchEvents } from './events';
import { fetchLoungeUnreadCounts, type LoungeUnreadCounts, type LoungeUnreadSince } from './lounge';
import { fetchMyTrialApplications } from './trial-applications';
import { fetchAssetCatalog, fetchBranchOptions, fetchBranchPublicGuide, fetchOnboardingInfo, fetchTrialSlots, roundLatLng, type LatLng } from './onboarding';

export const queryKeys = {
  me: ['me'] as const,
  linkRequests: ['me', 'branch-link-requests'] as const,
  branchSummary: ['me', 'branch-summary'] as const,
  myPage: ['me', 'mypage'] as const,
  /** 내 배지 — 모두 보기 · 안 본 배지(축하 시트). badgesAll 로 둘 다 다시 받아요 */
  badgesAll: ['me', 'badges'] as const,
  myBadges: ['me', 'badges', 'list'] as const,
  unseenBadges: ['me', 'badges', 'unseen'] as const,
  /** 남의 프로필 시트 (회원 code) */
  memberProfile: (code: string) => ['members', code, 'profile'] as const,
  /** PALLO 랭킹 — 포인트가 바뀌면 ranking 으로 둘 다 다시 받아요 */
  ranking: ['ranking'] as const,
  memberRanking: (period: RankingPeriod) => ['ranking', 'members', period] as const,
  branchRanking: (period: RankingPeriod) => ['ranking', 'branches', period] as const,
  /** 내 캐릭터 — 저장한 모습 · 가진 것 (api/use-my-avatar 가 state/avatar 에 넣어요) */
  myAvatar: ['me', 'avatar'] as const,
  /** 마이 › 내 활동 목록 (내 모임 · 찜한 모임 · 찜한 챌린지 · 내 표현함) */
  myMeets: (box: MyMeetBox) => ['me', 'meets', box] as const,
  savedChallenges: ['me', 'saved-challenges'] as const,
  myExpressions: ['me', 'expressions'] as const,
  proSessions: ['me', 'pro-sessions'] as const,
  prosNote: (id: string) => ['me', 'pros-notes', id] as const,
  /** 노트 목록 — 열람 뒤 'list' 아래를 통째로 다시 받아요 (NEW 표시) */
  prosNotesAll: ['me', 'pros-notes', 'list'] as const,
  prosNotes: (box: ProsNoteBox, courseId: string | null) => ['me', 'pros-notes', 'list', box, courseId ?? 'all'] as const,
  branchGuides: ['me', 'branch-guides'] as const,
  trialApplications: ['me', 'trial-applications'] as const,
  onboardingInfo: ['onboarding'] as const,
  /** 지점 시트 전체 (위치별 목록도 이 키 아래라 이걸로 다시 받으면 다 새로 받아요) */
  branchOptions: ['branches'] as const,
  branchOptionsNear: (p: LatLng | null) => (p ? (['branches', 'near', roundLatLng(p).lat, roundLatLng(p).lng] as const) : (['branches'] as const)),
  trialSlots: (branchCode: string) => ['trial-slots', branchCode] as const,
  branchPublicGuide: (branchCode: string) => ['branch-public-guide', branchCode] as const,
  assetCatalog: ['asset-catalog'] as const,
  sessionsToday: ['sessions', 'today'] as const,
  branchToday: ['manager', 'branch', 'today'] as const,
  unreadNotifications: ['me', 'notifications', 'unread-count'] as const,
  /** 알림함 목록 — 읽음 뒤 'list' 아래(모든 탭)를 통째로 다시 받아요 */
  notificationsAll: ['me', 'notifications', 'list'] as const,
  notifications: (category: NotificationCategory | null) => ['me', 'notifications', 'list', category ?? 'all'] as const,
  notices: (params: PageParams = {}) => ['notices', 'list', params] as const,
  notice: (id: string) => ['notices', 'detail', id] as const,
  loungeHighlights: ['lounge', 'highlights'] as const,
  popups: ['popups'] as const,
  faq: ['faq'] as const,
  myInquiries: ['me', 'inquiries'] as const,
  reportReasons: ['reports', 'reasons'] as const,
  eventProposals: ['me', 'event-proposals'] as const,
  eventCategories: ['event-proposals', 'categories'] as const,
  /** 이벤트 탭 — 목록 · 상세가 이 키 아래라 이걸로 다시 받으면 다 새로 받아요 */
  events: ['events'] as const,
  event: (id: string) => ['events', id] as const,
  /** 라운지 탭 '새 글' 배지 — 보내는 기준 시각은 키에 넣지 않아요 (탭을 바꿀 때마다 다시 받지 않게) */
  loungeUnreadCounts: ['lounge', 'unread-counts'] as const,
  /** 커뮤니티 탭 (글 · 댓글 모두 — 하트 · 스크랩 · 댓글을 단 뒤 한 번에 다시 받을 때) */
  communityAll: ['community'] as const,
  communityPosts: (topic: string | null, branchCodes: string[]) => ['community', 'posts', topic ?? 'all', branchCodes.join(',')] as const,
  /** 추천 탭 — 커뮤니티 글 캐시 아래에 둬요 (하트 · 스크랩을 누르면 두 탭 캐시를 함께 바꾸게) */
  communityRecommended: (pick: string, branchCodes: string[]) => ['community', 'posts', 'recommended', pick, branchCodes.join(',')] as const,
  communityComments: (postId: string) => ['community', 'comments', postId] as const,
  /** 라운지 챌린지 탭 — 참여 · 인증 뒤 challengesAll 로 모든 분류를 다시 받아요 */
  challengesAll: ['challenges'] as const,
  /** 라운지 목록 전체(모든 분류) — 찜 하트를 캐시에서 바로 고칠 때 */
  challengeLoungeAll: ['challenges', 'lounge'] as const,
  challengeLounge: (category: string | null) => ['challenges', 'lounge', category ?? 'all'] as const,
  challengeCategories: ['challenges', 'categories'] as const,
  situationMaps: ['library', 'maps'] as const,
  bookShelf: ['library', 'books'] as const,
  lesson: (id: string) => ['lessons', id] as const,
  signupOptions: ['auth', 'signup-options'] as const,
};

/** 교재 · 맵 · 과 콘텐츠는 자주 안 바뀌어요: 10분 안에는 받아 둔 값을 그대로 */
const CONTENT_STALE_MS = 10 * 60_000;

/** /auth/signup/options — 가입 화면 연령대 (자주 안 바뀌어요) */
export const signupOptionsQuery = () =>
  queryOptions({ queryKey: queryKeys.signupOptions, queryFn: ({ signal }) => fetchSignupOptions({ signal }), staleTime: CONTENT_STALE_MS });

/** 3 /me */
export const meQuery = () => queryOptions({ queryKey: queryKeys.me, queryFn: ({ signal }) => fetchMe({ signal }) });

/** GET /me/branch-link-requests — 내 지점 연동 요청 이력 전체 (최신 순) */
export const linkRequestsQuery = () => queryOptions({ queryKey: queryKeys.linkRequests, queryFn: ({ signal }) => fetchMyLinkRequests({ signal }) });

/** GET /me/branch-summary — 연동 대기 · 확인 안 한 반려 · 다가오는 체험 (홈 · 마이 · 잠김 칸이 나눠 써요) */
export const branchSummaryQuery = () => queryOptions({ queryKey: queryKeys.branchSummary, queryFn: ({ signal }) => fetchBranchSummary({ signal }) });

/** GET /me/mypage — 마이 탭 숫자 · 랭킹 요약 · 배지 · 내 활동 개수 (api/my-page.ts) */
export const myPageQuery = () => queryOptions({ queryKey: queryKeys.myPage, queryFn: ({ signal }) => fetchMyPage({ signal }) });
/** GET /me/badges — 배지 모두 보기 (api/badges.ts) */
export const myBadgesQuery = () => queryOptions({ queryKey: queryKeys.myBadges, queryFn: ({ signal }) => fetchMyBadges({ signal }) });
/** GET /me/badges/unseen — 축하 시트를 띄울 배지. 앱이 앞으로 돌아오면 다시 받아요(query-client focusManager) */
export const unseenBadgesQuery = () => queryOptions({ queryKey: queryKeys.unseenBadges, queryFn: ({ signal }) => fetchUnseenBadges({ signal }), staleTime: 0 });
/** GET /ranking/members — 개인 랭킹 (api/ranking.ts) */
export const memberRankingQuery = (period: RankingPeriod) =>
  queryOptions({ queryKey: queryKeys.memberRanking(period), queryFn: ({ signal }) => fetchMemberRanking(period, { signal }) });
/** GET /ranking/branches — 지점 대항전 (api/ranking.ts) */
export const branchRankingQuery = (period: RankingPeriod) =>
  queryOptions({ queryKey: queryKeys.branchRanking(period), queryFn: ({ signal }) => fetchBranchRanking(period, { signal }) });
/** GET /members/{code}/profile — 남의 프로필 시트 한 장 (api/member-profile.ts) */
export const memberProfileQuery = (code: string) => queryOptions({ queryKey: queryKeys.memberProfile(code), queryFn: ({ signal }) => fetchMemberProfile(code, { signal }) });
/** 34 GET /me/avatar — 내 캐릭터 (api/use-my-avatar) */
export const myAvatarQuery = () => queryOptions({ queryKey: queryKeys.myAvatar, queryFn: ({ signal }) => fetchMyAvatar({ signal }) });
/** 마이 › 내 모임 · 찜한 모임 (api/my-activity) */
export const myMeetsQuery = (box: MyMeetBox) => queryOptions({ queryKey: queryKeys.myMeets(box), queryFn: ({ signal }) => fetchMyMeets(box, { signal }) });
/** GET /challenges/lounge — 라운지 챌린지 탭 (api/challenges.ts) */
export const challengeLoungeQuery = (category: string | null) =>
  queryOptions({ queryKey: queryKeys.challengeLounge(category), queryFn: ({ signal }) => fetchChallengeLounge(category, { signal }) });
/** GET /challenges/categories — 챌린지 분류 칩 (자주 안 바뀌어요) */
export const challengeCategoriesQuery = () =>
  queryOptions({ queryKey: queryKeys.challengeCategories, queryFn: ({ signal }) => fetchChallengeCategories({ signal }), staleTime: CONTENT_STALE_MS });
/** 마이 › 찜한 챌린지 */
export const savedChallengesQuery = () => queryOptions({ queryKey: queryKeys.savedChallenges, queryFn: ({ signal }) => fetchSavedChallenges({ signal }) });
/** 마이 › 내 표현함 (첫 쪽 100개 — 찾기 · 나온 곳 거르기를 서버로 옮기면 쪽 넘기기로 바꿔요) */
export const myExpressionsQuery = () => queryOptions({ queryKey: queryKeys.myExpressions, queryFn: ({ signal }) => fetchMyExpressions({ signal }) });
/** A34 /me/pro-sessions — 참여한 세션 (스텝 마이) */
export const proSessionsQuery = () => queryOptions({ queryKey: queryKeys.proSessions, queryFn: ({ signal }) => fetchProSessions({ signal }) });

/** GET /me/pros-notes/{id} — PRO'S NOTE 한 장 (api/pros-notes.ts) */
export const prosNoteQuery = (id: string) => queryOptions({ queryKey: queryKeys.prosNote(id), queryFn: ({ signal }) => fetchProsNote(id, { signal }) });

/** GET /trial-applications — 내 체험 상담 신청 전부 (상담 신청 내역) */
export const trialApplicationsQuery = () => queryOptions({ queryKey: queryKeys.trialApplications, queryFn: ({ signal }) => fetchMyTrialApplications({ signal }) });

/* ───────── 가입 단계 · 체험 예약 (api/onboarding) ───────── */

/** GET /onboarding — 약관 · 미리 채울 값 · 닉네임 규칙 · 언어 · 이유 (가입 중엔 안 바뀌어요) */
export const onboardingInfoQuery = () => queryOptions({ queryKey: queryKeys.onboardingInfo, queryFn: ({ signal }) => fetchOnboardingInfo({ signal }), staleTime: CONTENT_STALE_MS });

/** GET /branches(?lat=&lng=) — 지점 시트 (연동 상태가 바뀌니 시트를 열 때마다 새로). 위치를 주면 가까운 순 · 거리 · 방위 */
export const branchOptionsQuery = (near: LatLng | null = null) =>
  queryOptions({ queryKey: queryKeys.branchOptionsNear(near), queryFn: ({ signal }) => fetchBranchOptions({ near, signal }) });

/** GET /branches/{code}/guide — 고른 지점 안내 (지점이 콘솔에서 고칠 때만 바뀌어요) */
export const branchPublicGuideQuery = (branchCode: string) =>
  queryOptions({ queryKey: queryKeys.branchPublicGuide(branchCode), queryFn: ({ signal }) => fetchBranchPublicGuide(branchCode, { signal }), staleTime: CONTENT_STALE_MS });

/** GET /trial-slots?branchCode= — 체험 상담 희망 시간표 */
export const trialSlotsQuery = (branchCode: string) => queryOptions({ queryKey: queryKeys.trialSlots(branchCode), queryFn: ({ signal }) => fetchTrialSlots(branchCode, { signal }) });

/** GET /asset-catalog — 고를 수 있는 팔로로 */
export const assetCatalogQuery = () => queryOptions({ queryKey: queryKeys.assetCatalog, queryFn: ({ signal }) => fetchAssetCatalog({ signal }), staleTime: CONTENT_STALE_MS });

/** GET /me/branch-guides — 연동된 지점마다 지점 안내 (마이 › 지점 안내 보드). 자주 안 바뀌어요 */
export const branchGuidesQuery = () =>
  queryOptions({ queryKey: queryKeys.branchGuides, queryFn: ({ signal }) => fetchBranchGuides({ signal }), staleTime: CONTENT_STALE_MS });

/** 8 /me/sessions/today */
export const sessionsTodayQuery = () => queryOptions({ queryKey: queryKeys.sessionsToday, queryFn: ({ signal }) => fetchTodaySessions({ signal }) });

/** GET /manager/branch/today — 지점 관리자 홈 현황 요약 · 모두 보기 (출석이 바로 보이게 30초마다 다시 받아요) */
export const branchTodayQuery = () =>
  queryOptions({ queryKey: queryKeys.branchToday, queryFn: ({ signal }) => fetchBranchToday({ signal }), refetchInterval: 30_000 });

/** 안 읽은 알림을 다시 세는 주기 (1분) */
export const UNREAD_POLL_MS = 60_000;

/**
 * GET /me/notifications/unread-count — 홈 종 배지. 1분마다 다시 받아요.
 * 앱이 뒤로 가 있는 동안은 쉬고(focusManager · query-client.ts), 앞으로 돌아오면 바로 다시 받아요.
 */
export const unreadNotificationsQuery = () =>
  queryOptions({
    queryKey: queryKeys.unreadNotifications,
    queryFn: ({ signal }) => fetchUnreadNotificationCount({ signal }),
    refetchInterval: UNREAD_POLL_MS,
    staleTime: UNREAD_POLL_MS,
  });

/** 12 /notices (첫 페이지) */
export const noticesQuery = (params: PageParams = {}) => queryOptions({ queryKey: queryKeys.notices(params), queryFn: ({ signal }) => fetchNotices(params, { signal }) });

/** 홈 Notice board 띠: 공지 앞의 3개 */
export const noticeBoardQuery = () => noticesQuery({ limit: 3 });

/** 12 /notices/:id */
export const noticeQuery = (id: string) => queryOptions({ queryKey: queryKeys.notice(id), queryFn: ({ signal }) => fetchNotice(id, { signal }) });

/** 15 /lounge/highlights */
export const loungeHighlightsQuery = () => queryOptions({ queryKey: queryKeys.loungeHighlights, queryFn: ({ signal }) => fetchLoungeHighlights({ signal }) });

/** A1 /popups */
export const popupsQuery = () => queryOptions({ queryKey: queryKeys.popups, queryFn: ({ signal }) => fetchLaunchPopups({ signal }) });

/* ───────── 고객센터 (93 · 94) ───────── */

/** 93 /faq — 자주 안 바뀌어요 */
export const faqQuery = () => queryOptions({ queryKey: queryKeys.faq, queryFn: ({ signal }) => fetchFaq({ signal }), staleTime: CONTENT_STALE_MS });

/** 94 GET /me/inquiries — 내 1:1 문의 (최신 순) */
export const myInquiriesQuery = () => queryOptions({ queryKey: queryKeys.myInquiries, queryFn: ({ signal }) => fetchMyInquiries({ signal }) });

/* ───────── 신고 ───────── */

/** GET /event-proposals — 내 이벤트 제안 전부 (이벤트 탭 '내가 제안한 이벤트') */
export const eventProposalsQuery = () => queryOptions({ queryKey: queryKeys.eventProposals, queryFn: ({ signal }) => fetchMyEventProposals({ signal }) });

/** GET /events — 이벤트 탭 목록 (오늘 이후 열린 이벤트) */
export const eventsQuery = () => queryOptions({ queryKey: queryKeys.events, queryFn: ({ signal }) => fetchEvents({ signal }) });

/** 받은 수 + 그때 보낸 기준 시각 (보낸 뒤 그 탭을 열었으면 화면은 0 으로 봐요) */
export type LoungeUnreadResult = LoungeUnreadCounts & { sent: LoungeUnreadSince };

/**
 * GET /lounge/unread-counts — 라운지 탭 배지. 부를 때마다 getSince() 로 그때의 '마지막으로 본 때'를 읽어 보내요.
 * 주기적으로 다시 세지 않아요 — 라운지로 돌아올 때 · 당겨서 새로고침할 때만 (api/use-lounge-new-counts).
 */
export const loungeUnreadCountsQuery = (getSince: () => LoungeUnreadSince) =>
  queryOptions({
    queryKey: queryKeys.loungeUnreadCounts,
    queryFn: async ({ signal }): Promise<LoungeUnreadResult> => {
      const sent = getSince();
      return { ...(await fetchLoungeUnreadCounts(sent, { signal })), sent };
    },
  });

/** GET /events/{id} — 이벤트 상세 */
export const eventQuery = (id: string) => queryOptions({ queryKey: queryKeys.event(id), queryFn: ({ signal }) => fetchEvent(id, { signal }) });

/** GET /event-proposals/categories — 이벤트 분류 선택지 (자주 안 바뀌어요) */
export const eventCategoriesQuery = () =>
  queryOptions({ queryKey: queryKeys.eventCategories, queryFn: ({ signal }) => fetchEventCategories({ signal }), staleTime: CONTENT_STALE_MS });

/** GET /reports/reasons — 신고 사유 선택지 (자주 안 바뀌어요) */
export const reportReasonsQuery = () =>
  queryOptions({ queryKey: queryKeys.reportReasons, queryFn: ({ signal }) => fetchReportReasons({ signal }), staleTime: CONTENT_STALE_MS });

/* ───────── 학습 (16 · 17 · 18) ───────── */

/** 서버 줄 → 화면 모양 (열린 맵 · 곧 열릴 맵). 함수가 늘 같아야 Query 가 결과를 기억해요 */
const selectSituationMaps = (rows: MapRow[]) => toSituationMaps(rows);

/** 16 /library/maps → { maps, soon } */
export const situationMapsQuery = () =>
  queryOptions({ queryKey: queryKeys.situationMaps, queryFn: ({ signal }) => fetchSituationMaps({ signal }), select: selectSituationMaps, staleTime: CONTENT_STALE_MS });

/** 17 /library/books — 언어별 책장 */
export const bookShelfQuery = () => queryOptions({ queryKey: queryKeys.bookShelf, queryFn: ({ signal }) => fetchBookShelf({ signal }), staleTime: CONTENT_STALE_MS });

/** 18 /lessons/:id — Lv.0 한 과 */
export const basicLessonQuery = (unit: number) =>
  queryOptions({ queryKey: queryKeys.lesson(lessonContentId(0, unit)), queryFn: ({ signal }) => fetchBasicLesson(unit, { signal }), staleTime: CONTENT_STALE_MS });

/** 18 /lessons/:id — Lv.1 · 2 한 과 */
export const patternLessonQuery = (lv: number, unit: number) =>
  queryOptions({ queryKey: queryKeys.lesson(lessonContentId(lv, unit)), queryFn: ({ signal }) => fetchPatternLesson(lv, unit, { signal }), staleTime: CONTENT_STALE_MS });

/** 18 /lessons/:id — Lv.3 · 4 한 회차 */
export const unit34Query = (lv: 3 | 4, no: number) =>
  queryOptions({ queryKey: queryKeys.lesson(lessonContentId(lv, no)), queryFn: ({ signal }) => fetchUnit34(lv, no, { signal }), staleTime: CONTENT_STALE_MS });

/** 18 /lessons/:id — 상황 장면 콘텐츠 */
export const sceneContentQuery = (contentId: string) =>
  queryOptions({ queryKey: queryKeys.lesson(contentId), queryFn: ({ signal }) => fetchSceneContent(contentId, { signal }), staleTime: CONTENT_STALE_MS });
