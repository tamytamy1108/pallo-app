/**
 * 처음 가입 과정(온보딩)에서 고른 값 — docs/pages/09-onboarding.md.
 * 화면마다 여기에 쌓고, 길의 마지막 칸(연동 요청 보내기 · 체험 예약하기 · 앱 둘러보기)에서 한 번에 `POST /onboarding` (api/use-onboarding).
 * 그 응답은 result 에 두고 연동 대기 · 체험 확인 화면이 그려요. 그 화면의 [시작하기] · [앱 둘러보기] 에서 finishOnboarding() 이
 * 나(state/me)에 옮기고 끝났다고 표시해요 (홈으로는 로그인 상태가 보내요).
 * 값은 서버 code 로 들고 있어요: 약관 = 버전 id, 지점 = branchCode(+ 보여 줄 이름 branch), 언어 · 이유 = 마스터데이터 code, 팔로로 = palloloCode.
 */
import type { OnboardingResult } from '@/api/onboarding';

import { createStore } from '@/lib/store';
import { setAvatarBody } from '@/state/avatar';
import { updateMe, type StudyLang } from '@/state/me';

/** 앱 안 4개 언어 키 — 서버 언어 code 가 이 중 하나와 같으면(대소문자 무시) 그 언어 색 · 인사말을 써요 */
const STUDY_LANGS: StudyLang[] = ['en', 'ja', 'zh', 'es'];
/** 서버 언어 code → 앱 안 언어 키 (모르는 언어면 undefined) */
export const toStudyLang = (code: string | undefined): StudyLang | undefined => STUDY_LANGS.find((l) => l === code?.toLowerCase());

/** 지점 회원 · 체험 · 앱으로만 · 일단 구경만 */
export type OnbPath = 'member' | 'trial' | 'app' | 'browse';

/** 캐릭터 몸 색 7가지 (마이 › 꾸미기의 기본 몸 색) */
export type BodyColor = 'yellow' | 'purple' | 'purple-lash' | 'pink' | 'sky' | 'green' | 'coral';

export type Onboarding = {
  /** 가입 과정을 끝냈는지. 안 끝냈으면 앱을 열 때 첫 화면부터 */
  done: boolean;
  /** 약관 답변 — 현행 버전 id 마다 동의했는지 (GET /onboarding 의 consents 순서) */
  consents: { versionId: string; agreed: boolean }[];
  /** 카카오 값(GET /onboarding prefill)으로 미리 채웠는지 — 한 번만 채우고 고친 값은 덮지 않아요 */
  prefilled: boolean;
  nickname: string;
  /** 고른 팔로로 (에셋 카탈로그 code) */
  palloloCode: string;
  /** 그 팔로로의 앱 안 몸 그림 (code 가 앱에 있는 몸 색이면 같은 값, 아니면 앞에 고른 값 그대로) */
  color: BodyColor;
  path: OnbPath | null;
  /** 연동할 지점 · 체험할 지점 — 보낼 code 와 보여 줄 이름 (예: 하남점) */
  branchCode: string;
  branch: string;
  /** 지점에 등록한 이름 · 휴대폰 번호 (연동 요청 · 체험 예약) */
  realName: string;
  phone: string;
  /** 언어 code — 앱으로만: 여러 개(고른 순서) · 체험: 하나. langLabel 은 체험 상담 언어 이름 (확인 화면용) */
  langs: string[];
  langLabel: string;
  /** 배우고 싶은 이유 code */
  why: string[];
  /** 체험 상담 날짜 · 시간 */
  trialDay: string;
  trialTime: string;
  /** 체험 예약 전달 사항 (선택 · 직접 입력, 최대 200자) */
  note: string;
  /** POST /onboarding 응답 (보내기 전엔 null) */
  result: OnboardingResult | null;
};

const INITIAL: Onboarding = {
  done: false,
  consents: [],
  prefilled: false,
  // 카카오에서 받은 값은 약관 화면에서 GET /onboarding prefill 로 채워요
  nickname: '',
  palloloCode: '',
  color: 'purple-lash',
  path: null,
  branchCode: '',
  branch: '',
  realName: '',
  phone: '',
  langs: [],
  langLabel: '',
  why: [],
  trialDay: '',
  trialTime: '',
  note: '',
  result: null,
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

/** 가입 단계 진행 바: 약관은 칸에 넣지 않고 닉네임 1 · 캐릭터 2 · 회원 확인 3 · 길마다 4~ (앱 구경: 언어 · 이유 · 가까운 지점) */
export function stepsFor(path: OnbPath | null) {
  return path === 'app' ? 6 : 4;
}

/**
 * 가입 끝: 고른 값을 나에게 옮기고 끝났다고 표시해요. 회원은 연동 확인 중으로 시작해요.
 * 서버에는 이미 POST /onboarding 으로 보냈어요 — 이건 앱 안 값(가짜 서버의 나 · 내 팔로로)만 맞춰요.
 * 화면은 이걸 직접 부르지 않고 useCompleteOnboarding() (api/session.tsx) 을 불러요 (api/me.ts completeOnboarding).
 * 홈으로 가는 건 로그인 상태(needsOnboarding=false)를 보고 app/_layout.tsx 가 해요.
 */
export function finishOnboarding() {
  const s = store.get();
  const lang = toStudyLang(s.langs[0]);
  updateMe({
    name: s.nickname,
    ...(s.branch ? { branch: s.branch } : {}),
    ...(lang ? { lang } : {}),
    // 회원 · 비회원은 서버 /me 의 회원 등급으로, 연동 대기 · 체험 예약은 서버 요약으로 봐요 (POST /onboarding 이 이미 만들어 뒀어요)
    role: 'guest',
  });
  // 캐릭터 고르기에서 고른 몸 색이 홈 · 마이의 내 팔로로가 돼요
  setAvatarBody(s.color);
  store.set((p) => ({ ...p, done: true }));
}
