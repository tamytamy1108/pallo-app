/**
 * 나(로그인한 회원) — 가짜 데이터. 맞는 API: 3 `/me` · 32 `/me/summary`.
 * 담당: 마이 A. 다른 화면은 읽기만 해요 (useMe). 필드는 늘릴 수 있지만 이름 · 뜻은 바꾸지 않아요.
 * 기기에 남아요 (가짜 서버 · 스파크 · 포인트 · 팔로우 · 소개). 서버가 생기면 로그인 상태(api/session.tsx)가 받은 /me 로 덮어써요.
 */
import { mockAddPendingLinkRequest, mockRejectLinkRequest } from '@/api/branch-link';
import { apiConfig } from '@/api/config';
import { mockAddTrialApplication } from '@/api/trial-applications';
import { ME } from '@/data/mock';
import { devProfile, type DevPersona } from '@/lib/dev-profile';
import { createStore } from '@/lib/store';
import { weekKey } from '@/state/today-goal';

/** 회원 · 비회원(체험 전) · 프로 · 매니저. 실제 앱은 로그인 계정 역할 (프로토타입의 역할 토글은 만들지 않아요) */
export type Role = 'member' | 'guest' | 'leader' | 'manager';
export type StudyLang = 'en' | 'ja' | 'zh' | 'es';
/** 활성 멤버십 있음 · 지점 회원이지만 활성 멤버십 없음 · 지점 회원 아님 (백엔드 MemberAccessLevel) */
export type MemberAccessLevel = 'ACTIVE_MEMBER' | 'INACTIVE_MEMBER' | 'UNREGISTERED';

export type Me = {
  id: string;
  name: string;
  /** 내 지점 (예시: 하남점) */
  branch: string;
  role: Role;
  level: string;
  lang: StudyLang;
  /**
   * 지점 회원 등급 — 서버 `GET /me` 의 memberAccessLevel 그대로 (백엔드 MemberAccessLevelResolver 가 판정).
   * 회원인지(state/access userKind)는 이 값 하나로 봐요. 연동 대기 · 반려 · 체험 예약은 여기 없고 서버 요약(api/use-branch-progress)에 있어요.
   */
  memberAccessLevel: MemberAccessLevel;
  /** 관리자가 호스트 · 코호스트 뱃지를 뗐어요 (A32 · 동아리 운영은 그대로). 없으면 운영 중인 동아리에 따라 붙어요 */
  roleBadgeOff?: boolean;
  /** 꾸미기 상점 재화 */
  sparks: number;
  /** 이번 주 포인트 */
  weekPoints: number;
  /** 한 줄 소개 (없으면 '한 줄 소개를 남겨 보세요') */
  bio: string;
  /** 연속 학습 일수 (오늘 퀘스트를 1개 이상 하면 이어져요) */
  streak: number;
  /** 참여 중인 모임 (번개 · 동아리) 수 */
  joinedMeets: number;
  /** 찜한 모임 수 */
  savedMeets: number;
  /** 내가 쓴 글 수 */
  postCount: number;
  /** 내가 팔로우하는 멤버 (이름 → true) */
  following: Record<string, boolean>;
  /** 지금 듣는 레벨 · 두 레벨 병행이면 두 개 (프로토타입 ME.lvs) */
  lvs: number[];
  /** 프로가 가르치는 언어 (마이 이름 아래 줄 '하남점 · 영어 · 일본어'). 프로가 아니면 비어 있어요 */
  teachLangs: StudyLang[];
};

const ME0: Me = {
  id: 'me',
  name: ME.name,
  branch: '하남점',
  role: 'member',
  level: 'Lv.1',
  lang: 'en',
  memberAccessLevel: 'ACTIVE_MEMBER',
  // 처음 스파크: 아이템 하나(중간 300)엔 조금 모자라게 — 첫 출석 · 퀘스트로 채워 사게
  sparks: 200,
  weekPoints: 0,
  bio: '',
  streak: 0,
  joinedMeets: 0,
  savedMeets: 0,
  postCount: 0,
  following: {},
  lvs: [1, 2],
  teachLangs: [],
};

// 기기에 남아요. 이번 주 포인트는 주가 바뀌면 0부터 (가짜 서버가 하는 일)
const meStore = createStore<Me>(ME0, {
  persist: {
    key: 'me',
    save: (s) => ({ ...s, wk: weekKey() }),
    load: (saved, initial) => {
      if (!saved || typeof saved !== 'object') return initial;
      const { wk, ...me } = saved as Partial<Me> & { wk?: string };
      const next = { ...initial, ...me };
      return wk === weekKey() ? next : { ...next, weekPoints: 0 };
    },
  },
});

// 개발용 '사람 바꾸기'(lib/dev-profile): 앱을 열 때마다 고른 사람으로 돌려놔요 (가입 · 연동 · 체험 단계를 건너뛰고 바로 그 화면을 보게)
const devWho = devProfile;
if (devWho) {
  meStore.set((s) => ({ ...s, ...devMe(devWho) }));
  seedDevSummary(devWho);
}

/** 개발용 사람의 연동 대기 · 반려 · 체험 예약은 가짜 서버(연동 요청 · 상담 신청)에 한 건씩 — 홈 · 마이 · 잠김 칸은 서버 요약을 봐요 */
function seedDevSummary(who: DevPersona) {
  if (!apiConfig.useMock) return;
  if (who === 'pending') mockAddPendingLinkRequest('하남점', '하남점', '', '');
  if (who === 'rejected') mockRejectLinkRequest('하남점', '등록된 번호가 달라요. 등록할 때 쓴 번호로 다시 요청해 주세요.');
  if (who === 'trial') {
    // 체험 예약: 내일 저녁 (홈 출석 카드 자리에 체험 카드)
    const d = new Date(Date.now() + 86400000);
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    mockAddTrialApplication({ branchCode: '하남점', branchName: '하남점', languageCode: 'en', languageLabel: '영어', date, time: '19:30', realName: '', phone: '', note: null });
  }
}

/** 개발용 사람마다 나(Me)의 role · 회원 등급. 연동 대기 · 반려 · 체험은 가짜 서버 요약 쪽 (seedDevSummary) */
function devMe(who: DevPersona): Pick<Me, 'role' | 'memberAccessLevel' | 'teachLangs'> {
  const base = { role: 'guest' as Role, memberAccessLevel: 'UNREGISTERED' as MemberAccessLevel, teachLangs: [] as StudyLang[] };
  switch (who) {
    case 'guest':
    case 'trial':
    case 'pending':
    case 'rejected':
      return base;
    case 'linked':
      return { ...base, role: 'member', memberAccessLevel: 'ACTIVE_MEMBER' };
    case 'pro':
      return { ...base, role: 'leader', memberAccessLevel: 'ACTIVE_MEMBER', teachLangs: ['en', 'ja'] };
    case 'manager':
      return { ...base, role: 'manager', memberAccessLevel: 'ACTIVE_MEMBER' };
  }
}

/** 프로처럼 보이는 계정: 프로 · 지점 관리자 (마이 숫자 · 보낸/받은 노트 · 내 수업 — 둘 다 현장에서 프로로 참여할 수 있어요) */
export const isProLike = (role: Role) => role === 'leader' || role === 'manager';
export const useMe = meStore.useStore;
export const getMe = meStore.get;
export const updateMe = (patch: Partial<Me>) => meStore.set((s) => ({ ...s, ...patch }));

/** 팔로우 ↔ 취소. 팔로우하게 되면 true */
export function toggleFollow(name: string) {
  const on = !meStore.get().following[name];
  meStore.set((s) => {
    const following = { ...s.following };
    if (on) following[name] = true;
    else delete following[name];
    return { ...s, following };
  });
  return on;
}
