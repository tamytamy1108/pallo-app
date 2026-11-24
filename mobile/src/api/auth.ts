/**
 * 인증 API (api-inventory 1 · 2 + 추가 A15 로그아웃 · A16 토큰 갱신).
 * 로그인에 성공하면 토큰을 저장하고, 화면은 그다음 `/me` 를 다시 받아요 (queryKeys.me 무효화).
 */
import { CODE_LENGTH, CODE_SECONDS, type LoginProvider } from '@/data/auth';
import { updateMe } from '@/state/me';
import { getOnboarding } from '@/state/onboarding';

import { http } from './client';
import { apiConfig } from './config';
import { ApiError } from './errors';
import { mock } from './mock';
import { clearTokens, getTokens, saveTokens, type Tokens } from './token';

export type { LoginProvider };

/** 로그인 응답 (제안): 토큰 + 처음 가입인지 */
export type LoginResponse = Tokens & { isNewMember: boolean };

/** 1 POST /auth/login/:provider — providerToken: 카카오 · 애플 · 구글 SDK 가 준 토큰 (아직 SDK 안 붙임) */
export async function loginWithProvider(provider: LoginProvider, providerToken = ''): Promise<LoginResponse> {
  const res = apiConfig.useMock
    ? await mock('login', () => {
        updateMe({ role: 'member' }); // 가짜 서버: 로그인하면 회원
        // 가짜 서버: 가입 과정을 아직 안 끝냈으면 처음 가입한 사람
        return { accessToken: `mock-${provider}`, refreshToken: 'mock-refresh', isNewMember: !getOnboarding().done };
      })
    : await http.post<LoginResponse>(`/auth/login/${provider}`, { providerToken }, { auth: false });
  await saveTokens(res);
  return res;
}

/** 2-a POST /auth/phone/code — 인증번호 보내기. 몇 초 안에 넣어야 하는지 돌려줘요 */
export function sendPhoneCode(phone: string): Promise<{ seconds: number }> {
  if (apiConfig.useMock) return mock('phoneCode', () => ({ seconds: CODE_SECONDS }));
  return http.post('/auth/phone/code', { phone }, { auth: false });
}

/** 2-b POST /auth/phone/verify — 틀리면 ApiError(code: 'INVALID_CODE') */
export async function verifyPhoneCode(phone: string, code: string): Promise<LoginResponse> {
  const res = apiConfig.useMock
    ? await mock('phoneVerify', () => {
        if (!new RegExp(`^\\d{${CODE_LENGTH}}$`).test(code)) throw new ApiError({ code: 'INVALID_CODE', message: '인증번호를 확인해 주세요', status: 400 });
        updateMe({ role: 'member' });
        return { accessToken: 'mock-phone', refreshToken: 'mock-refresh', isNewMember: false };
      })
    : await http.post<LoginResponse>('/auth/phone/verify', { phone, code }, { auth: false });
  await saveTokens(res);
  return res;
}

/** A16 POST /auth/refresh — 401 이 오면 한 번 불러 새 토큰을 받아요 (갱신 규칙은 B4 에서 정하고 client.ts 에 붙여요) */
export async function refreshTokens(): Promise<Tokens | null> {
  const t = await getTokens();
  if (!t?.refreshToken) return null;
  const res = apiConfig.useMock ? await mock('refresh', () => ({ accessToken: 'mock-refreshed', refreshToken: t.refreshToken })) : await http.post<Tokens>('/auth/refresh', { refreshToken: t.refreshToken }, { auth: false });
  await saveTokens(res);
  return res;
}

/** A15 POST /auth/logout — 서버에 알리고(실패해도) 기기 토큰을 지워요. 캐시 비우기는 부르는 쪽(queryClient.clear) */
export async function logout() {
  try {
    if (!apiConfig.useMock) await http.post('/auth/logout');
  } finally {
    await clearTokens();
  }
}
