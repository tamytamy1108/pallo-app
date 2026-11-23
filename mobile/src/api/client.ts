/**
 * 서버에 요청 보내는 공통 함수. 화면은 이걸 직접 부르지 않고 `api/*.ts` 의 함수(하나 = API 하나)를 불러요.
 * - 주소: apiConfig.baseUrl + path (환경별 · api/config.ts)
 * - 로그인 토큰이 있으면 `Authorization: Bearer …` 를 붙여요
 * - 오류는 늘 ApiError({ code, message, status }) 로 던져요
 * 응답 타입은 지금 손으로 적어요. 백엔드가 OpenAPI 문서를 주면 거기서 만든 타입으로 바꿔요 (B2).
 */
import { apiConfig } from './config';
import { ApiError, ClientErrorCode, isApiErrorBody } from './errors';
import { clearTokens, getAccessToken } from './token';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type QueryValue = string | number | boolean | null | undefined;

export type RequestOptions = {
  /** 주소 뒤 ?a=1&b=2 (undefined · null 은 빼요) */
  query?: Record<string, QueryValue | QueryValue[]>;
  /** JSON 으로 보내요 */
  body?: unknown;
  /** TanStack Query 가 주는 signal (화면을 떠나면 요청을 끊어요) */
  signal?: AbortSignal;
  /** 로그인 토큰을 붙일지 (로그인 요청 자체는 false) */
  auth?: boolean;
};

/** 목록 나눠 받기 (B6: cursor 방식). nextCursor 가 null 이면 끝 */
export type Page<T> = { items: T[]; nextCursor: string | null };
export type PageParams = { cursor?: string | null; limit?: number };

export function buildUrl(baseUrl: string, path: string, query?: RequestOptions['query']) {
  const qs: string[] = [];
  for (const [k, v] of Object.entries(query ?? {})) {
    for (const one of Array.isArray(v) ? v : [v]) {
      if (one === undefined || one === null) continue;
      qs.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(one))}`);
    }
  }
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}${qs.length ? `?${qs.join('&')}` : ''}`;
}

async function parseBody(res: Response): Promise<unknown> {
  if (res.status === 204) return undefined;
  const text = await res.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError({ code: ClientErrorCode.badResponse, status: res.status });
  }
}

export async function request<T>(method: HttpMethod, path: string, opts: RequestOptions = {}): Promise<T> {
  if (!apiConfig.baseUrl) throw new ApiError({ code: ClientErrorCode.noBaseUrl });

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (opts.auth !== false) {
    const token = await getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  // 시간 초과 · 화면 떠남 둘 다 같은 controller 로 끊어요
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, apiConfig.timeoutMs);
  const onAbort = () => controller.abort();
  opts.signal?.addEventListener('abort', onAbort);

  let res: Response;
  try {
    res = await fetch(buildUrl(apiConfig.baseUrl, path, opts.query), {
      method,
      headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      signal: controller.signal,
    });
  } catch (e) {
    if (opts.signal?.aborted) throw e; // 화면이 끊은 건 오류로 보지 않아요 (Query 가 알아서 무시)
    throw new ApiError({ code: timedOut ? ClientErrorCode.timeout : ClientErrorCode.network });
  } finally {
    clearTimeout(timer);
    opts.signal?.removeEventListener('abort', onAbort);
  }

  const body = await parseBody(res);
  if (res.ok) return body as T;

  if (res.status === 401) await clearTokens();
  if (isApiErrorBody(body)) throw new ApiError({ code: body.code, message: body.message, status: res.status });
  const code = res.status === 401 ? ClientErrorCode.unauthorized : res.status === 404 ? ClientErrorCode.notFound : `HTTP_${res.status}`;
  throw new ApiError({ code, status: res.status });
}

export const http = {
  get: <T>(path: string, opts?: Omit<RequestOptions, 'body'>) => request<T>('GET', path, opts),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>('POST', path, { ...opts, body }),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>('PUT', path, { ...opts, body }),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>('PATCH', path, { ...opts, body }),
  delete: <T>(path: string, opts?: RequestOptions) => request<T>('DELETE', path, opts),
};
