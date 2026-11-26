/**
 * 카카오 로그인 시작 — 웹 미리보기 (테스트용). 폰은 kakao-login.ts.
 *
 * 카카오 SDK 대신 카카오 웹 로그인(인가) 페이지로 통째로 넘어가요. 로그인이 끝나면 카카오가 콜백 화면
 * (`/auth/kakao/callback?code=…`, app/(auth)/auth/kakao/callback.tsx)으로 돌려보내고, 콜백이 인가 코드를
 * 서버(`POST /auth/login`)에 보내요. 지점 QR(카카오싱크 퍼머링크)도 같은 콜백으로 `state` 를 실어 와요.
 *
 * 카카오 JS SDK 를 쓰지 않는 까닭: 서버가 REST API 키 + 고정 redirect URI 로 인가 코드를 바꾸기 때문에, 인가도 같은
 * REST API 키로 받아야 해요 (JS 키로 받은 코드는 서버에서 못 바꿔요).
 */
import type { KakaoReferral } from './auth';
import { loginWithKakaoToken } from './auth';
import { apiConfig } from './config';
import { kakaoAuthorizeUrl, kakaoConfig } from './kakao-config';
import type { KakaoLoginResult } from './kakao-login';

export type { KakaoLoginResult };

export async function startKakaoLogin(referral: KakaoReferral = {}): Promise<KakaoLoginResult> {
  if (apiConfig.useMock) {
    await loginWithKakaoToken('mock', referral);
    return 'done';
  }
  const { restApiKey, redirectUri } = kakaoConfig;
  if (!restApiKey || !redirectUri) {
    throw new Error('카카오 웹 로그인 설정이 없어요 (EXPO_PUBLIC_KAKAO_REST_API_KEY · EXPO_PUBLIC_KAKAO_REDIRECT_URI)');
  }
  window.location.assign(kakaoAuthorizeUrl(restApiKey, redirectUri));
  return 'redirected';
}
