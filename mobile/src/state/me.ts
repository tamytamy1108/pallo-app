/**
 * 나(로그인한 회원) — 가짜 데이터. 맞는 API: 3 `/me` · 32 `/me/summary`.
 * 담당: 마이 A. 다른 화면은 읽기만 해요 (useMe). 필드는 늘릴 수 있지만 이름 · 뜻은 바꾸지 않아요.
 * 기기에 남아요 (가짜 서버 · 스파크 · 포인트 · 팔로우 · 소개). 서버가 생기면 로그인 상태(api/session.tsx)가 받은 /me 로 덮어써요.
 */
import { ME } from '@/data/mock';
import { devProfile, type DevPersona } from '@/lib/dev-profile';
import { createStore } from '@/lib/store';
import { weekKey } from '@/state/today-goal';

/** 회원 · 비회원(체험 전) · 프로 · 매니저. 실제 앱은 로그인 계정 역할 (프로토타입의 역할 토글은 만들지 않아요) */
export type Role = 'member' | 'guest' | 'leader' | 'manager';
export type StudyLang = 'en' | 'ja' | 'zh' | 'es';

export type Me = {
  id: string;
  name: string;
  /** 내 지점 (예시: 하남점) */
  branch: string;
  role: Role;
  level: string;
  lang: StudyLang;
  /** 스터디 회원 · 앱 구독자 */
  plan: 'study' | 'app';
  /**
   * 지점 연동: 연동 안 함 · 지점이 확인 중 · 연동됨 · 지점이 못 찾음 (A23 `branch-link-requests`).
   * 확인 중이면 홈 출석 카드가 잠기고, 마이 이름 옆에 '연동 확인 중'이 붙어요.
   * 못 찾음(rejected)이면 홈 카드는 잠긴 채 '다시 요청'만 열려 있고, 마이에는 '연동 안 됨'이 붙어요 (state/link-events).
   */
  link: 'none' | 'pending' | 'linked' | 'rejected';
  /** 체험 예약 (가입 단계 · 체험). 있으면 홈 출석 카드 자리에 체험 카드가 떠요. day 'YYYY-MM-DD' · time 'HH:MM' */
  trial: { branch: string; day: string; time: string; lang: StudyLang } | null;
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
  plan: 'study',
  link: 'linked',
  trial: null,
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
if (devWho) meStore.set((s) => ({ ...s, ...devMe(devWho) }));

/** 개발용 사람마다 나(Me)의 role · link · trial · plan */
function devMe(who: DevPersona): Pick<Me, 'role' | 'link' | 'trial' | 'plan' | 'teachLangs'> {
  const base = { role: 'guest' as Role, link: 'none' as Me['link'], trial: null, plan: 'study' as Me['plan'], teachLangs: [] as StudyLang[] };
  switch (who) {
    case 'guest':
      return base;
    case 'trial': {
      // 체험 예약: 내일 저녁 (홈 출석 카드 자리에 체험 카드)
      const d = new Date(Date.now() + 86400000);
      const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return { ...base, trial: { branch: '하남점', day, time: '19:30', lang: 'en' } };
    }
    case 'pending':
    case 'rejected':
      return { ...base, link: who };
    case 'app':
      return { ...base, plan: 'app' };
    case 'linked':
      return { ...base, role: 'member', link: 'linked' };
    case 'pro':
      return { ...base, role: 'leader', link: 'linked', teachLangs: ['en', 'ja'] };
    case 'manager':
      return { ...base, role: 'manager', link: 'linked' };
  }
}

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
