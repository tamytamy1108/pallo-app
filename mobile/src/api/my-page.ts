/**
 * 마이 탭 집계 (BFF) — `GET /app/api/v2/me/mypage` (백엔드 MobileMyPageV2Controller · MyPageV2Response).
 * 마이 화면의 칸을 한 번에 받아요: 캐릭터 · 스파크 · 팔로우 수 · 숫자 4칸 · PRO'S NOTE · 내 수업(프로) · 내 스터디 · 랭킹 요약 · 배지 · 내 활동 개수.
 * 숫자 · 순위 · 누구에게 어떤 칸을 보일지는 서버가 정해요. 이름 · 지점 · 회원 등급은 GET /me, 연동 대기 · 체험은 GET /me/branch-summary, 지점 안내는 각자 API.
 *
 * branchMember 가 false 면 랭킹 윗부분 아래를 '지점 회원이 되면 열려요' 칸으로 가려요 (GET /me memberAccessLevel 과 같은 판정 · UNREGISTERED 만 비회원).
 * 칸(proStats · proNote · myClasses · study · badges)이 null 이면 화면이 그 칸을 그리지 않아요 —
 * proStats · myClasses 가 오면 프로 마이(숫자 4칸 · 내 수업), proNote.sent 가 오면 [보낸 노트] 탭. 배지 칸은 앱에 보이는 배지가 하나도 없을 때만 null.
 * 칸 안의 숫자 중 도메인이 아직 없는 것(연속 학습 · 스파크 · 팔로우 · 찜한 모임 · 찜한 챌린지 · 출석 체크 · 고마워요)은 0.
 * 칸 안의 null 은 '없음'일 때만 — 캐릭터 안 고름(avatar) · 이번 주 순위 없음 · 노트 없음(latest) · 테이블 모름(tableName) · 제한 없음(remaining*).
 * 랭킹은 지금 서버도 예시 값이에요 (1~3위 고정 · 나는 순위 없음). 랭킹을 구현하면서 바꿔요.
 *
 * 가짜 서버는 기기에 남은 값(state/me · state/expressions · data/my · data/account)으로 같은 모양을 만들어요 — 프로는 기기 역할(isProLike)로 정해요.
 */
import { getNoteState } from '@/components/account/store';
import { getMembership, LANG_COLOR, MY_BRANCH, MY_TEAMS, PRO_CLASSES, PRO_NOTES, PRO_SENT_NOTES, PRO_STATS, teamLabel, teamNameByNo, teamWeekdays, TODAY } from '@/data/account';
import { findChallenge, getChallengeState } from '@/data/challenge';
import { followLists, MY_BADGES, rankPeople } from '@/data/my';
import { isMember } from '@/state/access';
import { getSavedExpressions } from '@/state/expressions';
import { getMe, isProLike } from '@/state/me';
import { getStudyStreak } from '@/state/progress';

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
  /** 지점 회원인지 — false 면 마이 아래쪽 잠김 칸 · '이용권 · 결제 내역' 줄 · 지점 안내를 안 그려요 */
  branchMember: boolean;
  /** 내 캐릭터 (몸 = 팔로로 code). 가입 단계에서 아직 안 골랐으면 null */
  avatar: { palloloCode: string } | null;
  sparks: number;
  follow: { following: number; followers: number };
  stats: {
    streakDays: number;
    /** = ranking.me.rank (이번 주 포인트 0이면 null) */
    weekRank: number | null;
    /** 아직 안 끝난 번개(호스트 · 일반) + 정식 멤버인 활동 중 동아리 */
    joinedMeetCount: number;
    badgeCount: number;
  };
  ranking: {
    period: 'WEEK';
    /** 이번 주 시작 (KST 월요일, 'YYYY-MM-DD') */
    weekStart: string;
    /** 1~3위 */
    podium: MyPageRankEntry[];
    me: { rank: number | null; points: number };
  };
  /** 프로 숫자 4칸 — 수업을 이끌 수 있는 사람이 아니면 null (회원 숫자 4칸을 그려요) */
  proStats: MyPageProStats | null;
  /** PRO'S NOTE 카드 — 지점 회원이 아니고 노트도 없으면 null */
  proNote: MyPageProNote | null;
  /** 내 수업 (이번 주 맡은 세션) — 프로가 아니면 null */
  myClasses: { weekStart: string; thisWeek: MyPageProClass[] } | null;
  /** 내 스터디 (이용권 · 듣는 팀) — 이용 중인 멤버십이 없으면 null */
  study: MyPageStudy | null;
  /** 배지 미리보기 — 배지 모두 보기(GET /me/badges)와 같은 순서의 앞 4칸 (받은 것 · 못 받은 것). 보이는 배지가 없으면 null (칸을 안 그려요) */
  badges: { code: string; name: string; description: string; imageUrl: string | null; earned: boolean }[] | null;
  activity: {
    joinedMeetCount: number;
    savedMeetCount: number;
    savedChallengeCount: number;
    postCount: number;
    savedExpressionCount: number;
  };
};

/** 마이 화면은 지금 보낸 노트 · 받은 고마워요만 그려요 — 앞 두 칸은 참여 중(stats.joinedMeetCount) · 앱 학습(기기 진도)으로 바꿨어요 (2026-11-26) */
export type MyPageProStats = {
  /** 이번 달(KST) 리더로 출석한 세션 */
  sessionsThisMonth: number;
  /** 출석 체크 — 서버 기록이 아직 없어 0 */
  attendanceChecks: number;
  /** 출석률(%) — 이번 달 맡은 세션 중 '프로로 참여'로 출석한 비율 (0~100). 서버에 아직 없으면 null → '–' (2026-11-26) */
  attendanceRate?: number | null;
  /** 참여한 세션(누적) — 테이블 QR 에서 '프로로 참여'로 출석 체크한 세션 수, 전체 기간. 스텝 마이에 보여요 (2026-11-26) */
  sessionsTotal?: number | null;
  /** 보낸 노트 (전체 기간) */
  notesSent: number;
  /** 받은 고마워요 — 도메인 전까지 0 */
  thanksReceived: number;
};

export type MyPageNotePreview = {
  id: string;
  /** 수업 날짜 KST 'YYYY-MM-DD' */
  date: string;
  courseTitle: string;
  branchName: string;
  leaderName: string;
  questionCount: number;
  /** 첫 질문 — 질문이 없으면 null */
  previewQuestion: string | null;
  /** 받은 사람 수 */
  recipientCount: number;
  /** 그중 연 사람 수 — 보낸 노트에서만 (받은 노트는 0) */
  readCount: number;
  /** 고마워요 — 도메인 전까지 0 */
  thanksCount: number;
};

/** 받은 · 보낸 노트 상자 — latest 는 가장 최근 것, 하나도 없으면 null */
export type MyPageNoteBox = { total: number; latest: MyPageNotePreview | null };

export type MyPageProNote = {
  /** 받은 노트 중 안 연 것 ('새 노트 n') */
  unreadCount: number;
  received: MyPageNoteBox;
  /** 보낸 노트 — 프로가 아니면 null ([보낸 노트] [받은 노트] 탭을 안 그려요) */
  sent: MyPageNoteBox | null;
};

export type MyPageProClass = {
  courseId: string;
  /** KST 'YYYY-MM-DD' */
  date: string;
  /** 'HH:mm' */
  time: string;
  courseTitle: string;
  /** 서버가 실어 주는 언어 이름 (예: 영어) */
  languageLabel: string;
  branchName: string;
  /** 앉은 테이블 — 아직 안 열린 회차라 모르면 null */
  tableName: string | null;
  /** 그날 오는 참여자 수 */
  studentCount: number;
};

export type DayOfWeekName = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export type MyPageStudyTeam = {
  courseId: string;
  courseTitle: string;
  languageLabel: string;
  /** 내가 오는 요일 (월요일부터) */
  days: DayOfWeekName[];
  /** 'HH:mm' */
  time: string;
  /** 맡은 리더 — 없으면 null */
  leaderName: string | null;
};

export type MyPageStudy = {
  membershipId: number;
  membershipName: string;
  branchName: string;
  /** 'YYYY-MM-DD' */
  startDate: string;
  endDate: string;
  /** 남은 연기 · 팀 변경 횟수 — null 이면 제한 없음 */
  remainingHoldingCount: number | null;
  remainingCourseChangeCount: number | null;
  teams: MyPageStudyTeam[];
};

/** 언어 이름 → 점 색 (모르는 언어는 영어 색) */
export const langColor = (label: string): string => (LANG_COLOR as Record<string, string>)[label] ?? LANG_COLOR.영어;

const pad = (n: number) => String(n).padStart(2, '0');
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
/** 예시 노트 · 수업의 '월/일'을 올해 날짜로 */
const isoMD = (m: number, d: number) => `${TODAY.getFullYear()}-${pad(m)}-${pad(d)}`;
/** data/account DOW 번호(일=0) → 서버 요일 이름 */
const DOW_NAME: DayOfWeekName[] = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
/** 월요일 = 0 */
const monFirst = (d: DayOfWeekName) => (DOW_NAME.indexOf(d) + 6) % 7;

/** 가짜 서버: PRO'S NOTE 카드 (예시 노트 · 기기에 남은 읽음 표시) */
export function mockProNote(pro: boolean, myName: string): MyPageProNote {
  const read = getNoteState().read;
  const got = PRO_NOTES[0];
  const sent = PRO_SENT_NOTES[0];
  return {
    unreadCount: PRO_NOTES.filter((n) => n.isNew && !read[n.id]).length,
    received: {
      total: PRO_NOTES.length,
      latest: got
        ? {
            id: got.id,
            date: isoMD(got.m, got.d),
            courseTitle: teamNameByNo(got.team),
            branchName: MY_BRANCH,
            leaderName: got.pro,
            questionCount: got.items.length,
            previewQuestion: got.items[0]?.[1] ?? null,
            recipientCount: 0,
            readCount: 0,
            thanksCount: 0,
          }
        : null,
    },
    sent: pro
      ? {
          total: PRO_SENT_NOTES.length,
          latest: sent
            ? {
                id: sent.id,
                date: isoMD(sent.m, sent.d),
                courseTitle: teamNameByNo(sent.team),
                branchName: MY_BRANCH,
                leaderName: myName,
                questionCount: sent.items.length,
                previewQuestion: sent.items[0]?.[1] ?? null,
                recipientCount: sent.total,
                readCount: sent.readN,
                thanksCount: sent.thanksN,
              }
            : null,
        }
      : null,
  };
}

/** 가짜 서버: 이번 주 맡은 세션 (예시 PRO_CLASSES 의 '11.26 (수)') */
export function mockMyClasses(monday: Date): NonNullable<MyPage['myClasses']> {
  return {
    weekStart: iso(monday),
    thisWeek: PRO_CLASSES.filter((c) => c.week === 'this').map((c) => {
      const [m, d] = c.day.split(' ')[0].split('.').map(Number);
      return { courseId: c.id, date: isoMD(m, d), time: c.time, courseTitle: c.team, languageLabel: c.lang, branchName: MY_BRANCH, tableName: c.room, studentCount: c.students };
    }),
  };
}

/** 가짜 서버: 내 스터디 (예시 이용권 · 내 팀) */
export function mockStudy(): MyPageStudy {
  const ms = getMembership();
  const left = ms.pp === Infinity ? null : ms.pp;
  return {
    membershipId: 1,
    membershipName: ms.name,
    branchName: MY_BRANCH,
    startDate: iso(ms.start),
    endDate: iso(ms.exp),
    remainingHoldingCount: left,
    remainingCourseChangeCount: left,
    teams: MY_TEAMS.map((t) => ({
      courseId: t.branch + t.no,
      courseTitle: teamLabel(t),
      languageLabel: t.lang,
      days: teamWeekdays(t)
        .map((i) => DOW_NAME[i])
        .sort((a, b) => monFirst(a) - monFirst(b)),
      time: t.when.split(' ')[1] ?? '',
      leaderName: t.pro,
    })),
  };
}

/** 가짜 서버: 기기에 남은 값으로 같은 모양을 만들어요 */
export function mockMyPage(): MyPage {
  const me = getMe();
  const rows = rankPeople('w', me);
  const myRank = me.weekPoints > 0 ? rows.findIndex((r) => r.me) + 1 : null;
  // 팔로우 수는 팔로우 목록 시트(followLists)와 같은 수
  const lists = followLists(me.name, me, me.following);
  // 서버처럼 배지 모두 보기와 같은 순서의 앞 4칸
  const badges = MY_BADGES;
  const today = new Date();
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - ((today.getDay() + 6) % 7));
  const pro = isProLike(me.role);
  const member = isMember(me);
  const chal = getChallengeState();
  return {
    branchMember: member,
    avatar: null,
    sparks: me.sparks,
    follow: { following: lists.fing.length, followers: lists.fer.length },
    stats: { streakDays: getStudyStreak(), weekRank: myRank, joinedMeetCount: me.joinedMeets, badgeCount: MY_BADGES.filter((b) => b.on).length },
    proStats: pro
      ? { sessionsThisMonth: PRO_STATS.sessions, attendanceChecks: PRO_STATS.checks, attendanceRate: PRO_STATS.sessions ? Math.round((PRO_STATS.checks / PRO_STATS.sessions) * 100) : null, sessionsTotal: PRO_STATS.total, notesSent: PRO_SENT_NOTES.length, thanksReceived: PRO_SENT_NOTES.reduce((a, n) => a + n.thanksN, 0) }
      : null,
    proNote: member || pro ? mockProNote(pro, me.name) : null,
    myClasses: pro ? mockMyClasses(monday) : null,
    study: member ? mockStudy() : null,
    ranking: {
      period: 'WEEK',
      weekStart: iso(monday),
      podium: rows
        .filter((r) => !r.me)
        .slice(0, 3)
        .map((r, i) => ({ rank: i + 1, code: null, displayName: r.n, branchName: r.b, points: r.pt })),
      me: { rank: myRank, points: me.weekPoints },
    },
    badges: badges.slice(0, 4).map((b) => ({ code: b.code, name: b.name, description: b.desc, imageUrl: null, earned: b.on })),
    activity: {
      joinedMeetCount: me.joinedMeets,
      savedMeetCount: me.savedMeets,
      savedChallengeCount: Object.keys(chal.saved).filter((id) => findChallenge(chal, id)).length,
      postCount: me.postCount,
      savedExpressionCount: getSavedExpressions().length,
    },
  };
}

/** GET /me/mypage */
export function fetchMyPage({ signal }: Opts = {}): Promise<MyPage> {
  if (apiConfig.useMock) return mock('myPage', mockMyPage);
  return http.get('/me/mypage', { signal });
}
