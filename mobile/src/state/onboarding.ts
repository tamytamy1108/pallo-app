/**
 * 처음 가입 과정(온보딩)에서 고른 값 — docs/pages/09-onboarding.md.
 * 화면마다 여기에 쌓고, 마지막에 finishOnboarding() 이 나(state/me)에 옮기고 끝났다고 표시해요 (홈으로는 로그인 상태가 보내요).
 * 맞는 API: 4 `PATCH /me` (닉네임 · 캐릭터 · 언어 · 이유) · A23 지점 연동 요청 · 체험 예약.
 */

import { createStore } from '@/lib/store';
import { setAvatarBody } from '@/state/avatar';
import { updateMe, type StudyLang } from '@/state/me';

/** 지점 회원 · 체험 · 앱으로만 · 일단 구경만 */
export type OnbPath = 'member' | 'trial' | 'app' | 'browse';

/** 캐릭터 몸 색 7가지 (마이 › 꾸미기의 기본 몸 색) */
export type BodyColor = 'yellow' | 'purple' | 'purple-lash' | 'pink' | 'sky' | 'green' | 'coral';

export type Onboarding = {
  /** 가입 과정을 끝냈는지. 안 끝냈으면 앱을 열 때 첫 화면부터 */
  done: boolean;
  agreed: { terms: boolean; privacy: boolean; age: boolean; marketing: boolean };
  nickname: string;
  color: BodyColor;
  path: OnbPath | null;
  /** 연동할 지점 · 체험할 지점 (예: 하남점) */
  branch: string;
  /** 지점에 등록한 이름 · 휴대폰 번호 (연동 요청 · 체험 예약) */
  realName: string;
  phone: string;
  /** 앱으로만: 여러 개 · 체험: 하나 */
  langs: StudyLang[];
  why: string[];
  /** 체험 상담 날짜 · 시간 */
  trialDay: string;
  trialTime: string;
  /** 체험 예약 전달 사항 (선택 · 직접 입력, 최대 200자) */
  note: string;
};

const INITIAL: Onboarding = {
  done: false,
  agreed: { terms: false, privacy: false, age: false, marketing: false },
  // 카카오에서 받은 값으로 미리 채워요 (가짜)
  nickname: '서현',
  color: 'purple-lash',
  path: null,
  branch: '',
  realName: '김서현',
  phone: '010-1234-5678',
  langs: ['en'],
  why: [],
  trialDay: '',
  trialTime: '',
  note: '',
};

// 가입을 끝냈는지(done)만 기기에 남겨요 — 가짜 서버의 /me needsOnboarding 판정 (api/me.ts). 고르던 값은 남기지 않아요
const store = createStore<Onboarding>(INITIAL, {
  persist: {
    key: 'onboarding',
    save: (s) => ({ done: s.done }),
    load: (saved, initial) => ({ ...initial, done: !!saved && typeof saved === 'object' && (saved as { done?: unknown }).done === true }),
  },
});

export const useOnboarding = store.useStore;
export const getOnboarding = store.get;
export const updateOnboarding = (patch: Partial<Onboarding>) => store.set((s) => ({ ...s, ...patch }));
/** 처음부터 다시 (개발용 · 로그아웃) */
export const resetOnboarding = () => store.set(INITIAL);

/** 가입 단계 진행 바: 약관은 칸에 넣지 않고 닉네임 1 · 캐릭터 2 · 회원 확인 3 · 길마다 4~ */
export function stepsFor(path: OnbPath | null) {
  return path === 'app' ? 5 : 4;
}

/**
 * 가입 끝: 고른 값을 나에게 옮기고 끝났다고 표시해요. 회원은 연동 확인 중으로 시작해요.
 * 화면은 이걸 직접 부르지 않고 useCompleteOnboarding() (api/session.tsx) 을 불러요 — 가짜 서버가 이걸 불러요 (api/me.ts).
 * 홈으로 가는 건 로그인 상태(needsOnboarding=false)를 보고 app/_layout.tsx 가 해요.
 */
export function finishOnboarding() {
  const s = store.get();
  updateMe({
    name: s.nickname,
    ...(s.branch ? { branch: s.branch } : {}),
    ...(s.langs[0] ? { lang: s.langs[0] } : {}),
    // '앱 구경할래요'(path app)는 구독자가 아니에요 — 앱 구독(plan 'app')은 결제한 사람만. 가입 단계에서는 늘 study 로 두고 비회원으로 둘러봐요
    plan: 'study',
    // 지점이 연동해 주기 전까지는 회원 기능이 안 열려요 (비회원과 같아요). 연동되면 member 로 바뀌어요 (state/link-events)
    role: 'guest',
    link: s.path === 'member' ? 'pending' : 'none',
    trial: s.path === 'trial' && s.trialDay && s.trialTime ? { branch: s.branch, day: s.trialDay, time: s.trialTime, lang: s.langs[0] ?? 'en' } : null,
  });
  // 캐릭터 고르기에서 고른 몸 색이 홈 · 마이의 내 팔로로가 돼요
  setAvatarBody(s.color);
  store.set((p) => ({ ...p, done: true }));
}
