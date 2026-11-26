/**
 * 이 기기 푸시 토큰을 서버에 등록 · 해제 — 언제 부를지는 use-push-registration.ts(로그인되면 등록 · 바뀌면 다시)와
 * auth.ts logout(로그아웃 직전 해제 — 로그인 토큰이 남아 있을 때 보내야 해요)이 정해요.
 * React · 로그인 상태에 기대지 않는 순수 함수라 auth.ts 가 불러도 화면 부품이 딸려 오지 않아요.
 *
 * 실패는 던지지 않고 경고 로그만 남겨요 — 사용자가 한 일이 아니라 뒤에서 하는 일이라 화면에 알리지 않고, 다음 로그인 · 앱 시작 때 다시 해요.
 */
import { Platform } from 'react-native';

import { getPushToken, requestPushPermission } from '@/lib/push';

import { registerPushToken, unregisterPushToken, type PushPlatform } from './push-tokens';

const platform: PushPlatform = Platform.OS === 'ios' ? 'IOS' : 'ANDROID';

/** 지금 서버에 등록해 둔 이 기기 토큰 — 로그아웃 때 지울 값. 앱을 다시 켜면 비어 있다가 등록하면서 다시 채워져요. */
let registered: string | null = null;

const warn = (what: string) => (e: unknown) => console.warn(`[push] ${what} 실패`, e);

/** 이 토큰을 서버에 등록 (토큰이 바뀌었을 때도 이걸로) */
export async function registerPushTokenQuietly(token: string): Promise<void> {
  try {
    await registerPushToken(token, platform);
    registered = token;
  } catch (e) {
    warn('푸시 토큰 등록')(e);
  }
}

/** 알림 권한을 묻고, 허용하면 이 기기 토큰을 등록해요. 거절이면 아무것도 안 해요. */
export async function registerThisDevice(): Promise<void> {
  try {
    if (!(await requestPushPermission())) return;
    const token = await getPushToken();
    if (token) await registerPushTokenQuietly(token);
  } catch (e) {
    warn('푸시 권한 · 토큰 받기')(e);
  }
}

/** 로그아웃 직전 — 서버에서 이 기기 토큰을 지워요. 등록한 적 없으면 아무것도 안 해요. */
export async function unregisterThisDevice(): Promise<void> {
  const token = registered;
  if (!token) return;
  registered = null;
  await unregisterPushToken(token).catch(warn('푸시 토큰 해제'));
}
