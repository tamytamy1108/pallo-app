/**
 * 인증 API (api-inventory 1 · 2 + 추가 A15 로그아웃).
 * 카카오는 두 갈래예요 — 폰은 카카오 SDK 가 준 토큰(`loginWithKakaoToken`), 웹 미리보기는 카카오 웹 로그인이 준
 * 인가 코드(`loginWithKakaoCode`, 콜백 화면). 같은 사람이면 서버에서 같은 계정이에요. 시작은 api/kakao-login.ts.
 * 로그인에 성공하면 토큰만 저장해요. 그다음은 로그인 상태(api/session.tsx)가 /me 를 받아 가입 과정 · 홈으로 보내요.
 * 토큰 갱신(A16 `POST /auth/refresh`)은 공용 클라이언트가 401 때 알아서 해요 (api/client.ts `refreshSession`).
 * `/auth/*` 경로는 401 이 와도 갱신하지 않아요 (자격 증명이 틀렸다는 뜻이라).
 */
import { CODE_LENGTH, CODE_SECONDS, type LoginProvider } from '@/data/auth';
import { updateMe } from '@/state/me';

import { http } from './client';
import { apiConfig } from './config';
import { ApiError } from './errors';
import { mock } from './mock';
import { unregisterThisDevice } from './push-registration';
import { tokenStorage, type Tokens } from './token';

export type { LoginProvider };

/** 로그인 응답: 토큰 두 개. 가입 과정을 안 끝냈는지는 로그인 뒤 /me 의 needsOnboarding 으로 봐요 (api/session.tsx) */
export type LoginResponse = Tokens;

/** 토큰 두 개만 보관해요 (로그인 응답의 다른 값은 남기지 않아요) */
const keepTokens = (res: LoginResponse) => tokenStorage.set({ accessToken: res.accessToken, refreshToken: res.refreshToken });

/** 가짜 서버 로그인: 로그인하면 회원 */
const mockLogin = (tag: string) =>
  mock('login', () => {
    updateMe({ role: 'member' });
    return { accessToken: `mock-${tag}`, refreshToken: 'mock-refresh' };
  });

/**
 * 지점 QR 유입 — 카카오싱크 퍼머링크(지점 마케팅 QR)로 들어오면 카카오가 콜백 주소의 `state` 에 `지점코드,마케팅id` 를
 * 돌려줘요. 로그인 요청에 같이 보내면 서버가 그 지점 상담 신청(지원자)을 남겨요. 모두 선택값이에요.
 */
export type KakaoReferral = { branchCode?: string; adId?: number };

/**
 * 콜백 `state` → 지점 QR 유입 값 (옛 앱 loginReferral 과 같은 규칙). 퍼머링크를 거치며 디코딩이 한 번 더 일어나
 * &·= 로 묶은 값은 깨져서 쉼표로 나눠요. 마케팅 id 는 양의 정수만(JS 숫자로 정확한 범위까지 — 넘으면 다른 id 로
 * 바뀌어서), 지점 코드가 없거나 `=` 가 섞이면 빈 값.
 * 엉뚱한 값이어도 서버가 지점 존재 · 운영 여부를 다시 확인해요.
 */
export function referralFromState(state: string | null | undefined): KakaoReferral {
  const raw = state?.trim();
  if (!raw || raw.includes('=')) return {};
  const [code, ad] = raw.split(',');
  const branchCode = code?.trim();
  if (!branchCode) return {};
  const adId = ad?.trim();
  const n = adId && /^[1-9]\d*$/.test(adId) ? Number(adId) : NaN;
  return Number.isSafeInteger(n) ? { branchCode, adId: n } : { branchCode };
}

/** 1-a POST /auth/login/kakao-token — 폰: 카카오 SDK 가 준 카카오 access token */
export async function loginWithKakaoToken(accessToken: string, referral: KakaoReferral = {}): Promise<LoginResponse> {
  const res = apiConfig.useMock
    ? await mockLogin('kakao')
    : await http.post<LoginResponse>('/auth/login/kakao-token', { accessToken, ...referral });
  keepTokens(res);
  return res;
}

/** 1-b POST /auth/login — 웹 미리보기: 카카오 웹 로그인 콜백의 인가 코드 */
export async function loginWithKakaoCode(authCode: string, referral: KakaoReferral = {}): Promise<LoginResponse> {
  const res = apiConfig.useMock
    ? await mockLogin('kakao')
    : await http.post<LoginResponse>('/auth/login', { authCode, ...referral });
  keepTokens(res);
  return res;
}

/** 1 POST /auth/login/:provider — 애플 · 구글 (아직 SDK · 서버 없음). 카카오는 위 두 함수 (서버에 /auth/login/kakao 는 없어요) */
export async function loginWithProvider(provider: Exclude<LoginProvider, 'kakao'>, providerToken = ''): Promise<LoginResponse> {
  const res = apiConfig.useMock
    ? await mockLogin(provider)
    : await http.post<LoginResponse>(`/auth/login/${provider}`, { providerToken });
  keepTokens(res);
  return res;
}

/** 2-a POST /auth/phone/code — 인증번호 보내기. 몇 초 안에 넣어야 하는지 돌려줘요 */
export function sendPhoneCode(phone: string): Promise<{ seconds: number }> {
  if (apiConfig.useMock) return mock('phoneCode', () => ({ seconds: CODE_SECONDS }));
  return http.post('/auth/phone/code', { phone });
}

/** 2-b POST /auth/phone/verify — 틀리면 ApiError(code: 'invalid_code') */
export async function verifyPhoneCode(phone: string, code: string): Promise<LoginResponse> {
  const res = apiConfig.useMock
    ? await mock('phoneVerify', () => {
        if (!new RegExp(`^\\d{${CODE_LENGTH}}$`).test(code)) throw new ApiError({ kind: 'client', status: 400, code: 'invalid_code', message: '인증번호를 확인해 주세요' });
        updateMe({ role: 'member' });
        return { accessToken: 'mock-phone', refreshToken: 'mock-refresh' };
      })
    : await http.post<LoginResponse>('/auth/phone/verify', { phone, code });
  keepTokens(res);
  return res;
}

export type Gender = 'MALE' | 'FEMALE';

/** 이메일 가입에 보내는 값. 연령대 · 성별은 안 골라도 돼요 (null) */
export type SignupInput = {
  email: string;
  password: string;
  name: string;
  /** 010~019 · 하이픈 있어도 돼요 */
  phone: string;
  /** 연령대 code (GET /auth/signup/options) */
  ageGroup: string | null;
  gender: Gender | null;
};

export type SignupOption = { code: string; label: string };

/** 가짜 서버의 연령대 (진짜는 서버 마스터데이터 code) */
const MOCK_AGE_GROUPS: SignupOption[] = [
  { code: 'TEENS', label: '10대' },
  { code: 'TWENTIES', label: '20대' },
  { code: 'THIRTIES', label: '30대' },
  { code: 'FORTIES', label: '40대' },
  { code: 'FIFTIES', label: '50대' },
  { code: 'SIXTIES', label: '60대' },
  { code: 'SEVENTIES_PLUS', label: '70대 이상' },
];

/** GET /auth/signup/options — 가입 화면 연령대 선택지 (성별은 MALE · FEMALE 고정이라 앱이 가져요) */
export function fetchSignupOptions({ signal }: { signal?: AbortSignal } = {}): Promise<{ ageGroups: SignupOption[] }> {
  if (apiConfig.useMock) return mock('signupOptions', () => ({ ageGroups: MOCK_AGE_GROUPS }));
  return http.get('/auth/signup/options', { signal });
}

/** POST /auth/signup — 이메일 가입. 성공하면 로그인된 토큰이 바로 와요. 이미 쓰인 이메일이면 409 */
export async function signUpWithEmail(input: SignupInput): Promise<LoginResponse> {
  const res = apiConfig.useMock
    ? await mock('signup', () => {
        // 가짜 서버: 이 주소는 이미 가입한 이메일로 봐요 (409 화면 확인용)
        if (input.email.toLowerCase() === 'taken@pallo.app') throw new ApiError({ kind: 'client', status: 409, code: 'duplicate', message: '이미 가입한 이메일이에요' });
        updateMe({ role: 'member' });
        return { accessToken: 'mock-email', refreshToken: 'mock-refresh' };
      })
    : await http.post<LoginResponse>('/auth/signup', input);
  keepTokens(res);
  return res;
}

/**
 * A15 POST /auth/logout — 서버에 알리고 기기 토큰을 지워요. 캐시 비우기 · 첫 화면으로 가기는 로그인 상태(api/session.tsx)가 해요.
 * 서버 알림이 실패해도(인터넷 · 서버 · 아직 없는 API) 기기에서는 로그아웃된 거라 던지지 않아요 — 경고 로그만 남겨요.
 */
export async function logout(): Promise<void> {
  // 이 기기 푸시 토큰을 먼저 지워요 — 로그인 토큰이 있어야 보낼 수 있어요. 실패해도 로그아웃은 그대로 (던지지 않아요)
  await unregisterThisDevice();
  try {
    if (!apiConfig.useMock) await http.post('/auth/logout');
  } catch (e) {
    console.warn('[auth] 서버 로그아웃 알림 실패 (기기 토큰은 지워요)', e);
  } finally {
    tokenStorage.clear();
  }
}
