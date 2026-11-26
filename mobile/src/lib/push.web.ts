/**
 * 앱 푸시 — 웹 미리보기. 웹에선 푸시를 받지 않아요 (폰은 push.ts). 폰과 같은 모양으로 아무것도 안 해요.
 */
import type { PushMessage } from './push';

export type { PushMessage };

export const pushEnabled = false;

export async function requestPushPermission(): Promise<boolean> {
  return false;
}

export async function getPushToken(): Promise<string | null> {
  return null;
}

export function onPushTokenRefresh(_listener: (token: string) => void): () => void {
  return () => {};
}

export function onForegroundPush(_listener: (message: PushMessage) => void): () => void {
  return () => {};
}

export function registerBackgroundPushHandler() {}
