/**
 * 푸시 토큰 API — 백엔드 `MobilePushTokenController` (`/app/api/v2/me/push-tokens`).
 * - PUT    /me/push-tokens {token, platform}   이 기기 FCM 토큰 등록. 같은 토큰 다시 보내도 204, 다른 계정 토큰이면 이 계정으로 옮겨요
 * - DELETE /me/push-tokens?token=              로그아웃 직전. 내 토큰만 지우고, 없어도 204
 *
 * 부르는 쪽은 api/push-registration.ts 하나예요 (로그인되면 등록 · 로그아웃 때 해제). 화면은 부르지 않아요.
 */
import { http } from './client';
import { apiConfig } from './config';
import { mock } from './mock';

/** 백엔드 PushPlatform */
export type PushPlatform = 'ANDROID' | 'IOS';

export function registerPushToken(token: string, platform: PushPlatform): Promise<void> {
  if (apiConfig.useMock) return mock('registerPushToken', () => undefined);
  return http.put('/me/push-tokens', { token, platform });
}

export function unregisterPushToken(token: string): Promise<void> {
  if (apiConfig.useMock) return mock('unregisterPushToken', () => undefined);
  return http.delete('/me/push-tokens', undefined, { query: { token } });
}
