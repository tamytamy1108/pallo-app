/**
 * 마이 탭 집계 (BFF) — `GET /app/api/v2/me/mypage` (백엔드 MobileMyPageV2Controller · MyPageV2Response).
 * 캐릭터 · 스파크 · 팔로우 수 · 숫자 4칸 · 랭킹 요약 · 배지 미리보기 · 내 활동 개수를 한 번에 받아요. 숫자 · 순위는 서버가 계산해요.
 * 이름 · 지점 · 역할 · 연동 상태는 GET /me, 연동 대기 · 체험은 GET /me/branch-summary, PRO'S NOTE · 내 스터디 · 지점 안내는 각자 API.
 *
 * null = 서버가 아직 집계하지 않는 값이에요 (연속 학습 · 배지 · 스파크 · 팔로우 · 찜한 모임 — 도메인이 아직 없어요). 화면은 '–' 로 보여 주거나 숨겨요.
 * 랭킹은 지금 서버도 예시 값이에요 (1~3위 고정 · 나는 순위 없음). 랭킹을 구현하면서 바꿔요.
 *
 * 가짜 서버는 기기에 남은 값(state/me · state/expressions · data/my)으로 같은 모양을 만들어요.
 */
import { MY_BADGES, rankPeople } from '@/data/my';
import { getSavedExpressions } from '@/state/expressions';
import { getMe } from '@/state/me';

import { http } from './client';
import { apiConfig } from './config';
import { mock } from './mock';

type Opts = { signal?: AbortSignal };

export type MyPageRankEntry = {
  rank: number;
  /** 회원 code — null 이면 프로필로 못 가요 (비공개 · 예시 값) */
  code: string | null;
  /** '랭킹에 내 이름 보이기'를 끈 사람은 '익명 회원' */
  displayName: string;
  /** '내 지점 보이기'를 끈 사람은 null */
  branchName: string | null;
  points: number;
};

export type MyPage = {
  /** 내 캐릭터 (몸 = 팔로로 code). 가입 단계에서 아직 안 골랐으면 null */
  avatar: { palloloCode: string } | null;
  sparks: number | null;
  follow: { following: number; followers: number } | null;
  stats: {
    streakDays: number | null;
    /** = ranking.me.rank (이번 주 포인트 0이면 null) */
    weekRank: number | null;
    /** 아직 안 끝난 번개(호스트 · 일반) + 정식 멤버인 활동 중 동아리 */
    joinedMeetCount: number;
    badgeCount: number | null;
  };
  ranking: {
    period: 'WEEK';
    /** 이번 주 시작 (KST 월요일, 'YYYY-MM-DD') */
    weekStart: string;
    /** 1~3위 */
    podium: MyPageRankEntry[];
    me: { rank: number | null; points: number };
  };
  /** 받은 배지 미리보기 (최대 4 · 받은 것 먼저) */
  badges: { code: string; name: string; description: string; icon: string; earned: boolean }[] | null;
  activity: {
    joinedMeetCount: number;
    savedMeetCount: number | null;
    postCount: number;
    savedExpressionCount: number;
  };
};

/** 가짜 서버: 기기에 남은 값으로 같은 모양을 만들어요 */
export function mockMyPage(): MyPage {
  const me = getMe();
  const rows = rankPeople('w', me);
  const myRank = me.weekPoints > 0 ? rows.findIndex((r) => r.me) + 1 : null;
  const badges = [...MY_BADGES].sort((a, b) => Number(b.on) - Number(a.on));
  const today = new Date();
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - ((today.getDay() + 6) % 7));
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    avatar: null,
    sparks: me.sparks,
    follow: { following: Object.keys(me.following).length, followers: 0 },
    stats: { streakDays: me.streak, weekRank: myRank, joinedMeetCount: me.joinedMeets, badgeCount: MY_BADGES.filter((b) => b.on).length },
    ranking: {
      period: 'WEEK',
      weekStart: `${monday.getFullYear()}-${pad(monday.getMonth() + 1)}-${pad(monday.getDate())}`,
      podium: rows
        .filter((r) => !r.me)
        .slice(0, 3)
        .map((r, i) => ({ rank: i + 1, code: null, displayName: r.n, branchName: r.b, points: r.pt })),
      me: { rank: myRank, points: me.weekPoints },
    },
    badges: badges.slice(0, 4).map((b) => ({ code: b.name, name: b.name, description: b.desc, icon: b.ic, earned: b.on })),
    activity: { joinedMeetCount: me.joinedMeets, savedMeetCount: me.savedMeets, postCount: me.postCount, savedExpressionCount: getSavedExpressions().length },
  };
}

/** GET /me/mypage */
export function fetchMyPage({ signal }: Opts = {}): Promise<MyPage> {
  if (apiConfig.useMock) return mock('myPage', mockMyPage);
  return http.get('/me/mypage', { signal });
}
