/**
 * 라운지 '챌린지' 탭 — `GET /app/api/v2/challenges/lounge?category=` (백엔드 MobileChallengeLoungeV2Controller).
 * 핫 · 진행 중 · 참여 중 · 곧 시작과 오늘 남은 인증 수를 한 번에 받아요. 나누기 · 정렬 · 숫자(D-day · 오늘 인증 수)는 서버가 해요.
 * 분류 칩은 `GET /challenges/categories` — 마스터데이터(CHALLENGE_CATEGORY) 하나에서만 와요(앱이 분류 목록을 따로 들지 않아요).
 * 참여는 `POST /challenges/{id}/members`(누구나=바로 참여 · 승인제=승인 대기), 찜은 `PUT · DELETE /challenges/{id}/save`.
 * 챌린지는 지점에 묶이지 않아서 지점 값은 보내지 않아요. 개설 · 인증 API 는 v2 에 아직 없어요.
 *
 * 가짜 서버는 예시 챌린지(data/challenge CHALLENGES)와 화면 상태(참여 · 오늘 체크)로 같은 모양을 만들어요.
 */
import { chCat, CHALLENGES, findChallenge, getChallengeState, isJoined, isPre, toggleJoin, toggleSaved, type Challenge } from '@/data/challenge';

import { http } from './client';
import { apiConfig } from './config';
import { mock } from './mock';

type Opts = { signal?: AbortSignal };

export type ChallengeProgress = 'UPCOMING' | 'ONGOING' | 'ENDED';
export type ChallengeViewerRole = 'HOST' | 'MEMBER' | 'PENDING' | 'REJECTED' | 'KICKED' | 'NONE';
export type ChallengeVerifyCycle = 'DAILY' | 'THREE_PER_WEEK' | 'WEEKLY';

/** 챌린지 카드 한 장 — 백엔드 MobileChallengeSummaryResponse 그대로 */
export type ChallengeSummary = {
  id: string;
  title: string;
  /** 분류 코드 (CHALLENGE_CATEGORY 마스터데이터) */
  category: string;
  categoryLabel: string;
  tagline: string | null;
  imagePath: string | null;
  /** 카드용 작은 그림 — 없으면 imagePath 와 같고, 그림이 없으면 null */
  thumbnailPath: string | null;
  /** 'HOT' · 'NEW' · null */
  tag: string | null;
  progress: ChallengeProgress;
  startDate: string;
  endDate: string;
  /** 시작 전이면 시작까지, 진행 중이면 끝까지 남은 날 · 끝났으면 null */
  dDay: number | null;
  participantCount: number;
  todayVerifiedCount: number;
  /** 기간 대비 지난 비율 0~100 */
  elapsedPercent: number;
  verifyCycle: ChallengeVerifyCycle;
  viewerRole: ChallengeViewerRole;
  /** 내가(정식 참여자) 오늘 이미 인증했는지 */
  verifiedToday: boolean;
  /** 내가 찜했는지 (카드의 하트 · 참여 여부와 상관없어요) */
  saved: boolean;
};

/** 분류 칩 하나 — 마스터데이터 code · 이름. code 를 라운지 조회 category 로 그대로 보내요 */
export type ChallengeCategory = { code: string; label: string };

export type ChallengeLounge = {
  /** 지금 핫한 챌린지 (참여자 많은 순 → 오늘 인증 많은 순 · 최대 3개, 참여 여부와 상관없어요) */
  hot: ChallengeSummary[];
  /** 진행 중 · 내가 참여 안 함 */
  running: ChallengeSummary[];
  /** 내가 참여 중 (호스트 · 정식 참여, 시작 전 포함) */
  joined: ChallengeSummary[];
  /** 곧 시작 · 내가 참여 안 함 */
  upcoming: ChallengeSummary[];
  /** 참여 중 · 진행 중 가운데 오늘 아직 인증 안 한 수 */
  todayLeftCount: number;
};

// ---- 가짜 서버 ----

const DAY_MS = 24 * 60 * 60 * 1000;
const ymd = (ms: number) => new Date(ms).toISOString().slice(0, 10);

function mockSummary(p: Challenge): ChallengeSummary {
  const s = getChallengeState();
  const pre = isPre(p);
  const of = p.dur || p.of || 7;
  const now = Date.now();
  const start = pre ? now + 3 * DAY_MS : now - p.day * DAY_MS;
  return {
    id: p.id,
    title: p.name,
    category: (p.cat ?? 'study').toUpperCase(),
    categoryLabel: chCat(p.cat).label,
    tagline: p.guide ?? null,
    imagePath: typeof p.cover === 'string' ? p.cover : null,
    thumbnailPath: typeof p.cover === 'string' ? p.cover : null,
    tag: null,
    progress: pre ? 'UPCOMING' : 'ONGOING',
    startDate: ymd(start),
    endDate: ymd(start + (of - 1) * DAY_MS),
    dDay: pre ? 3 : Math.max(0, of - p.day - 1),
    participantCount: p.members + (s.joinedNew[p.id] ? 1 : 0),
    todayVerifiedCount: pre ? 0 : Math.round(p.members * 0.4) + (s.checked[p.id] ? 1 : 0),
    elapsedPercent: pre ? 0 : Math.round(((p.day + 1) * 100) / of),
    verifyCycle: 'DAILY',
    viewerRole: p.mine ? 'HOST' : isJoined(p, s) ? 'MEMBER' : 'NONE',
    verifiedToday: !pre && !!s.checked[p.id],
    saved: !!s.saved[p.id],
  };
}

function mockLounge(category: string | null): ChallengeLounge {
  const all = CHALLENGES.filter((p) => p.cat && (!category || p.cat.toUpperCase() === category)).map(mockSummary);
  const joinedRole = (c: ChallengeSummary) => c.viewerRole === 'HOST' || c.viewerRole === 'MEMBER';
  const joined = all.filter(joinedRole);
  return {
    hot: [...all].sort((a, b) => b.participantCount - a.participantCount || b.todayVerifiedCount - a.todayVerifiedCount).slice(0, 3),
    running: all.filter((c) => c.progress === 'ONGOING' && !joinedRole(c)),
    joined,
    upcoming: all.filter((c) => c.progress === 'UPCOMING' && !joinedRole(c)),
    todayLeftCount: joined.filter((c) => c.progress === 'ONGOING' && !c.verifiedToday).length,
  };
}

/** 가짜 분류: 예시 챌린지에 나오는 분류를 나온 순서대로 */
function mockCategories(): ChallengeCategory[] {
  const seen = new Map<string, string>();
  CHALLENGES.forEach((p) => p.cat && seen.set(p.cat.toUpperCase(), chCat(p.cat).label));
  return [...seen].map(([code, label]) => ({ code, label }));
}

/** GET /challenges/categories — 분류 칩 (콘솔 정렬 순서) */
export function fetchChallengeCategories({ signal }: Opts = {}): Promise<ChallengeCategory[]> {
  if (apiConfig.useMock) return mock('challengeCategories', mockCategories);
  return http.get('/challenges/categories', { signal });
}

/** GET /challenges/lounge?category= — category 가 null 이면 전 분류 */
export function fetchChallengeLounge(category: string | null, { signal }: Opts = {}): Promise<ChallengeLounge> {
  if (apiConfig.useMock) return mock('challengeLounge', () => mockLounge(category));
  return http.get('/challenges/lounge', { query: category ? { category } : undefined, signal });
}

/** 참여 뒤 내 관계 — 서버는 챌린지 상세(MobileChallengeDetailResponse)를 주는데, 화면은 viewerRole 만 써요 */
export type ChallengeJoinResult = { viewerRole: ChallengeViewerRole };

/** POST /challenges/{id}/members — 누구나 참여면 MEMBER, 승인제면 PENDING. 이미 참여 · 정원 초과 · 끝난 챌린지는 409 */
export function joinChallenge(id: string): Promise<ChallengeJoinResult> {
  if (apiConfig.useMock)
    return mock('challengeJoin', (): ChallengeJoinResult => {
      const p = findChallenge(getChallengeState(), id);
      if (p && !isJoined(p, getChallengeState())) toggleJoin(p);
      return { viewerRole: 'MEMBER' };
    });
  return http.post<ChallengeJoinResult>(`/challenges/${encodeURIComponent(id)}/members`);
}

/** PUT /challenges/{id}/save (찜) · DELETE (찜 취소) — 둘 다 여러 번 보내도 같아요 */
export function setChallengeSaved(id: string, on: boolean): Promise<void> {
  if (apiConfig.useMock)
    return mock('challengeSave', () => {
      if (!!getChallengeState().saved[id] !== on) toggleSaved(id);
    });
  const path = `/challenges/${encodeURIComponent(id)}/save`;
  return on ? http.put<void>(path) : http.delete<void>(path);
}
