/**
 * 내 정보 API (api-inventory 3 · 4 · 5 · 6).
 * 가짜 서버는 state/me.ts 의 값을 그대로 읽고 써요. 서버가 생기면 받은 값을 state/me 에 넣어 주는 쪽(api/session.tsx)만 남아요.
 */
import { devProfile } from '@/lib/dev-profile';
import { getMe as readMeStore, updateMe as writeMeStore, type Me } from '@/state/me';
import { finishOnboarding, getOnboarding } from '@/state/onboarding';

import type { LoginProvider } from './auth';
import { http } from './client';
import { apiConfig } from './config';
import { mock } from './mock';

type Opts = { signal?: AbortSignal };

/** /me 응답 = 내 정보 + 가입 과정을 아직 안 끝냈는지 (우리 백엔드 v1 MobileMeResponse.needsOnboarding 과 같은 이름) */
export type MeResponse = Me & { needsOnboarding: boolean };

/** 3 GET /me — 로그인 상태(api/session.tsx)의 판정 근거 */
export function fetchMe({ signal }: Opts = {}): Promise<MeResponse> {
  // 가짜 서버: 가입을 끝냈는지는 이 기기에 남긴 state/onboarding 의 done 으로 (개발용 '연동된 회원' 프로필은 가입을 끝낸 것으로)
  if (apiConfig.useMock) return mock('me', () => ({ ...readMeStore(), needsOnboarding: devProfile !== 'linked' && !getOnboarding().done }));
  return http.get<MeResponse>('/me', { signal });
}

/**
 * 가입 과정 끝내기 — 고른 값(닉네임 · 캐릭터 · 언어 · 이유 · 지점)을 내 정보에 옮기고 끝났다고 표시해요.
 * 부르는 쪽은 useCompleteOnboarding() (끝나면 /me 를 다시 받아요).
 * 서버 API 는 아직 없어요 (v2 에서 정해요) — mock 을 끄면 오류를 내요.
 */
export function completeOnboarding(): Promise<void> {
  if (apiConfig.useMock) return mock('completeOnboarding', () => finishOnboarding());
  return Promise.reject(new Error('가입 완료 API 가 아직 없어요 (app/api/v2)'));
}

/** 4 PATCH /me — 닉네임 · 소개 · 지점(≤2) */
export type MePatch = Partial<Pick<Me, 'name' | 'bio' | 'branch'>>;
export function patchMe(patch: MePatch): Promise<Me> {
  if (apiConfig.useMock)
    return mock('patchMe', () => {
      writeMeStore(patch);
      return { ...readMeStore() };
    });
  return http.patch<Me>('/me', patch);
}

/** 5 POST /me/auth-providers/:provider — 연결 */
export function linkProvider(provider: LoginProvider, providerToken = ''): Promise<void> {
  if (apiConfig.useMock) return mock('linkProvider', () => undefined);
  return http.post(`/me/auth-providers/${provider}`, { providerToken });
}

/** 5 DELETE /me/auth-providers/:provider — 해제 (마지막 하나면 서버가 last_provider 로 거절) */
export function unlinkProvider(provider: LoginProvider): Promise<void> {
  if (apiConfig.useMock) return mock('unlinkProvider', () => undefined);
  return http.delete(`/me/auth-providers/${provider}`);
}

/** 6 DELETE /me — 탈퇴 (reason: 탈퇴 화면에서 고른 이유) */
export function deleteAccount(reason?: string): Promise<void> {
  if (apiConfig.useMock) return mock('deleteMe', () => undefined);
  return http.delete('/me', undefined, { query: { reason } });
}
