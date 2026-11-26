/**
 * 카카오 로그인 시작 — 폰 (iOS · Android). 웹 미리보기는 kakao-login.web.ts.
 *
 * 카카오 SDK 가 로그인(카카오톡이 있으면 카톡 앱, 없으면 카카오계정 화면)을 띄우고 카카오 access token 을 줘요.
 * 그 토큰을 서버(`POST /auth/login/kakao-token`)에 보내면 서버가 우리 카카오 앱 토큰인지 확인한 뒤 우리 토큰을 줘요.
 * 토큰이 저장되면 로그인 상태(api/session.tsx)가 가입 과정 · 홈으로 보내요.
 *
 * 네이티브 모듈이라 Expo Go 에선 안 돼요 — 개발 빌드가 필요해요 (app.config.js 가 키가 있을 때 SDK 설정을 붙여요).
 */
import { initializeKakaoSDK } from '@react-native-kakao/core';
import { login } from '@react-native-kakao/user';

import { loginWithKakaoToken, type KakaoReferral } from './auth';
import { apiConfig } from './config';
import { kakaoConfig } from './kakao-config';

/** 'done' = 로그인됨 · 'cancelled' = 사용자가 닫음 · 'redirected' = 웹에서 카카오 페이지로 넘어감 */
export type KakaoLoginResult = 'done' | 'cancelled' | 'redirected';

let initialized: Promise<void> | null = null;

/** SDK 는 앱에서 한 번만 초기화해요 (실패하면 다음에 다시 시도) */
function ensureInitialized(appKey: string) {
  initialized ??= initializeKakaoSDK(appKey).catch((e: unknown) => {
    initialized = null;
    throw e;
  });
  return initialized;
}

/**
 * 사용자가 카카오 로그인을 닫은 경우 — SDK 가 Cancelled(iOS 는 AccessDenied 도) 오류를 그대로 넘겨줘요.
 * 오류 모양이 플랫폼마다 달라서 글자로 봐요. 닫은 건 오류로 알리지 않아요.
 */
const isCancelled = (e: unknown) => /cancel|access.?denied/i.test(e instanceof Error ? `${e.message} ${String((e as { code?: unknown }).code ?? '')}` : String(e));

export async function startKakaoLogin(referral: KakaoReferral = {}): Promise<KakaoLoginResult> {
  if (apiConfig.useMock) {
    await loginWithKakaoToken('mock', referral);
    return 'done';
  }
  if (!kakaoConfig.nativeAppKey) throw new Error('카카오 로그인 설정이 없어요 (EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY)');
  await ensureInitialized(kakaoConfig.nativeAppKey);
  let accessToken: string;
  try {
    ({ accessToken } = await login());
  } catch (e) {
    if (isCancelled(e)) return 'cancelled';
    throw e;
  }
  await loginWithKakaoToken(accessToken, referral);
  return 'done';
}
