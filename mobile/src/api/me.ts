/**
 * 내 정보 API (api-inventory 3 · 4 · 5 · 6).
 * 가짜 서버는 state/me.ts 의 값을 그대로 읽고 써요. 서버가 생기면 받은 값을 state/me 에 넣어 주는 쪽(MeSync)만 남아요.
 */
import { getMe as readMeStore, updateMe as writeMeStore, type Me } from '@/state/me';

import type { LoginProvider } from './auth';
import { http } from './client';
import { apiConfig } from './config';
import { mock } from './mock';

type Opts = { signal?: AbortSignal };

/** 3 GET /me */
export function fetchMe({ signal }: Opts = {}): Promise<Me> {
  if (apiConfig.useMock) return mock('me', () => ({ ...readMeStore() }));
  return http.get<Me>('/me', { signal });
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

/** 5 DELETE /me/auth-providers/:provider — 해제 (마지막 하나면 서버가 LAST_PROVIDER 로 거절) */
export function unlinkProvider(provider: LoginProvider): Promise<void> {
  if (apiConfig.useMock) return mock('unlinkProvider', () => undefined);
  return http.delete(`/me/auth-providers/${provider}`);
}

/** 6 DELETE /me — 탈퇴 (reason: 탈퇴 화면에서 고른 이유) */
export function deleteAccount(reason?: string): Promise<void> {
  if (apiConfig.useMock) return mock('deleteMe', () => undefined);
  return http.delete('/me', { query: { reason } });
}
