/**
 * 서버에 요청 보내는 공통 클라이언트 — 공용 `@academy/api-client` 의 `createHttpClient` 를 써요 (콘솔 앱 · 옛 모바일 앱과 같은 것).
 * 화면은 이걸 직접 부르지 않고 `api/*.ts` 의 함수(하나 = API 하나)를 불러요.
 * - 주소: apiConfig.baseUrl(오리진) + APP_API_PREFIX(`/app/api/v2`) + path. api/*.ts 의 path 에는 접두사를 쓰지 않아요
 * - 토큰이 있으면 `Authorization: Bearer …` 를 붙여요 (`tokenStorage` · api/token.ts)
 * - 401 이면 `POST /auth/refresh` 를 한 번만(동시에 여러 요청이 받아도 한 번) 보내 새 토큰으로 원 요청을 한 번 다시 보내요.
 *   `/auth/*` 경로와 403 은 갱신하지 않아요. 갱신까지 실패하면 토큰을 지워요 (onAuthFailure).
 * - 오류는 늘 공용 ApiError — code 는 서버 몸통 { error, message } 의 error, message 는 서버 message
 * 공용 `createAuthHttpClient` 대신 `createHttpClient` 를 직접 쓰는 이유: 로그아웃 알림이 `window` 이벤트라 폰에서 안 돌아서
 * onAuthFailure 를 이 앱이 정해요.
 * 응답 타입은 지금 손으로 적어요. 백엔드가 OpenAPI 문서를 주면 거기서 만든 타입으로 바꿔요 (B2).
 */
import { createHttpClient, type HttpClient } from '@academy/api-client';

import { apiConfig } from './config';
import { tokenStorage, type Tokens } from './token';

/**
 * pallo-app API 네임스페이스 — v2. 옛 모바일 앱의 `/app/api/v1`(백엔드 `ApiPathPrefixConfig.APP_PREFIX`)과 따로 가요.
 * 백엔드에 v2 접두사가 생기면 그 값과 같아야 해요.
 * baseUrl 에는 오리진만 두고 접두사는 여기서 한 번만 붙여요 (콘솔 앱의 authHttpClient `basePrefix` 와 같은 방식).
 */
export const APP_API_PREFIX = '/app/api/v2';

/** 목록 나눠 받기 (B6: cursor 방식). nextCursor 가 null 이면 끝 */
export type Page<T> = { items: T[]; nextCursor: string | null };
export type PageParams = { cursor?: string | null; limit?: number };

/**
 * 서버 주소 확인 + 시간 초과. RN 의 fetch 는 스스로 끊지 않아서 timeoutMs 가 지나면 끊어요.
 * 화면이 떠나 끊는 signal(TanStack Query) 도 같이 따라요. 실패는 공용 클라이언트가 ApiError 로 바꿔요.
 */
const fetchWithTimeout: typeof fetch = (input, init) => {
  if (!apiConfig.baseUrl) return Promise.reject(new Error('서버 주소가 아직 없어요 (app.json extra.api.baseUrls)'));
  const controller = new AbortController();
  const outer = init?.signal;
  const onAbort = () => controller.abort();
  if (outer?.aborted) controller.abort();
  else outer?.addEventListener('abort', onAbort);
  const timer = setTimeout(() => controller.abort(), apiConfig.timeoutMs);
  return fetch(input, { ...init, signal: controller.signal }).finally(() => {
    clearTimeout(timer);
    outer?.removeEventListener('abort', onAbort);
  });
};

/** 보관 중인 refresh 토큰으로 두 토큰을 새로 받아요 (우리 백엔드 MobileAuthController `POST /auth/refresh`) */
async function refreshSession(client: HttpClient): Promise<string | null> {
  const refreshToken = tokenStorage.get()?.refreshToken;
  if (!refreshToken) return null;
  const res = await client.post<Tokens>('/auth/refresh', { refreshToken }, { skipAuthRetry: true });
  tokenStorage.set({ accessToken: res.accessToken, refreshToken: res.refreshToken });
  return res.accessToken;
}

export const http: HttpClient = createHttpClient({
  baseUrl: `${apiConfig.baseUrl}${APP_API_PREFIX}`,
  fetch: fetchWithTimeout,
  defaultHeaders: (): Record<string, string> => {
    const tokens = tokenStorage.get();
    return tokens ? { Authorization: `Bearer ${tokens.accessToken}` } : {};
  },
  hasAccessToken: () => tokenStorage.get() !== null,
  refresh: refreshSession,
  // 갱신까지 실패 = 로그인이 풀림. 로그인 화면으로 보내기 · 캐시 비우기는 다음 단계(로그인 상태 한 곳 관리)에서
  onAuthFailure: () => tokenStorage.clear(),
});
