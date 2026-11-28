/**
 * 라운지 챌린지 탭 스토리용 서버 응답 (api/challenges ChallengeLounge · ChallengeCategory 모양 그대로).
 * `parameters.queries` 로 캐시를 미리 채워서 가짜 서버 없이 상태마다 같은 화면이 나와요. 날짜는 오늘 기준으로 만들어요.
 */
import type { ChallengeCategory, ChallengeLounge, ChallengeSummary, ChallengeViewerRole } from '@/api/challenges';
import { queryKeys } from '@/api/queries';

const DAY_MS = 24 * 60 * 60 * 1000;
const ymd = (offsetDays: number) => new Date(Date.now() + offsetDays * DAY_MS).toISOString().slice(0, 10);

export const CATEGORIES: ChallengeCategory[] = [
  { code: 'LANGUAGE', label: '어학' },
  { code: 'EXERCISE', label: '운동' },
  { code: 'READING', label: '독서' },
  { code: 'HABIT', label: '습관' },
];

const LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.code, c.label]));

type Card = Partial<ChallengeSummary> & { id: string; title: string };

/** 진행 중 카드 (기본: 30일 중 12일째 · 미참여) */
export function ongoing(c: Card): ChallengeSummary {
  const category = c.category ?? 'LANGUAGE';
  return {
    categoryLabel: LABEL[category] ?? category,
    tagline: null,
    imagePath: null,
    thumbnailPath: null,
    tag: null,
    progress: 'ONGOING',
    startDate: ymd(-11),
    endDate: ymd(18),
    dDay: 18,
    participantCount: 24,
    todayVerifiedCount: 9,
    elapsedPercent: 40,
    verifyCycle: 'DAILY',
    viewerRole: 'NONE',
    verifiedToday: false,
    saved: false,
    ...c,
    category,
  };
}

/** 곧 시작 카드 (기본: 3일 뒤 시작 · 14일) */
export function upcoming(c: Card): ChallengeSummary {
  return ongoing({ progress: 'UPCOMING', startDate: ymd(3), endDate: ymd(16), dDay: 3, todayVerifiedCount: 0, elapsedPercent: 0, participantCount: 6, ...c });
}

const isJoined = (r: ChallengeViewerRole) => r === 'HOST' || r === 'MEMBER';

/** 카드들을 서버처럼 나눠요 — 핫(참여자 → 오늘 인증 많은 순 3개) · 진행 중/곧 시작(미참여) · 참여 중 */
export function lounge(cards: ChallengeSummary[]): ChallengeLounge {
  const joined = cards.filter((c) => isJoined(c.viewerRole));
  return {
    hot: [...cards].sort((a, b) => b.participantCount - a.participantCount || b.todayVerifiedCount - a.todayVerifiedCount).slice(0, 3),
    running: cards.filter((c) => c.progress === 'ONGOING' && !isJoined(c.viewerRole)),
    joined,
    upcoming: cards.filter((c) => c.progress === 'UPCOMING' && !isJoined(c.viewerRole)),
    todayLeftCount: joined.filter((c) => c.progress === 'ONGOING' && !c.verifiedToday).length,
  };
}

/** `parameters.queries` — 분류 칩 + '전체'(category null) 목록. 분류 칩 목록은 more 로 더해요 */
export function seed(data: ChallengeLounge, more: [readonly unknown[], unknown][] = []): [readonly unknown[], unknown][] {
  return [[queryKeys.challengeCategories, CATEGORIES], [queryKeys.challengeLounge(null), data], ...more];
}

// ---- 예시 카드 (다른 사람이 연 챌린지) ----
export const OTHERS = {
  diary: ongoing({ id: 'o1', title: '30일 영어 일기 3줄', participantCount: 128, todayVerifiedCount: 61, tag: 'HOT' }),
  walk: ongoing({ id: 'o2', title: '매일 30분 걷기', category: 'EXERCISE', participantCount: 64, todayVerifiedCount: 30, verifyCycle: 'DAILY' }),
  words: ongoing({ id: 'o3', title: '하루 단어 10개', category: 'HABIT', participantCount: 41, todayVerifiedCount: 12, tagline: '외운 단어로 한 문장' }),
  book: upcoming({ id: 'o4', title: '한 달에 원서 한 권', category: 'READING', verifyCycle: 'WEEKLY', tag: 'NEW' }),
  fit: ongoing({ id: 'o5', title: '주 3회 홈트', category: 'EXERCISE', participantCount: 33, todayVerifiedCount: 5, verifyCycle: 'THREE_PER_WEEK', dDay: 0, elapsedPercent: 97 }),
};
