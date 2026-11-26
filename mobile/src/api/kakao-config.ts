/**
 * 카카오 로그인 설정 — `.env.local` 의 EXPO_PUBLIC_ 값 (빌드할 때 글자 그대로 들어가요).
 *
 * - `EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY` — 폰(카카오 SDK). app.config.js 가 이 값으로 카카오 SDK 설정 플러그인도 붙여요
 * - `EXPO_PUBLIC_KAKAO_REST_API_KEY` · `EXPO_PUBLIC_KAKAO_REDIRECT_URI` — 웹 미리보기(카카오 웹 로그인 → 콜백 화면).
 *   redirect URI 는 백엔드 `kakao.redirect-uri` 와 반드시 같아야 해요 (서버가 그 주소로 인가 코드를 토큰으로 바꿔요)
 *
 * 카카오 키는 앱에 들어가는 공개 키라 비밀이 아니에요 (서버 쪽 client secret 은 백엔드에만 있어요).
 */
export const kakaoConfig = {
  nativeAppKey: process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY ?? '',
  restApiKey: process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY ?? '',
  redirectUri: process.env.EXPO_PUBLIC_KAKAO_REDIRECT_URI ?? '',
} as const;

/** 카카오 웹 로그인(인가) 주소 — 로그인이 끝나면 카카오가 redirectUri 로 `?code=` 를 붙여 돌려보내요 */
export const kakaoAuthorizeUrl = (restApiKey: string, redirectUri: string) =>
  'https://kauth.kakao.com/oauth/authorize' +
  `?client_id=${encodeURIComponent(restApiKey)}` +
  `&redirect_uri=${encodeURIComponent(redirectUri)}` +
  '&response_type=code';
