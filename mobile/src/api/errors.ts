/**
 * API 오류 한 가지 모양: 서버는 모든 오류를 `{ code, message }` 로 보내요 (backend-kickoff B5).
 * `message` 는 화면에 그대로 띄울 수 있는 한국어예요. 화면은 `code` 로만 갈라요 (글자로 가르지 않아요).
 */

export type ApiErrorBody = { code: string; message: string };

/** 앱이 직접 만드는 오류 코드 (서버 코드는 백엔드와 정해서 아래에 늘려요) */
export const ClientErrorCode = {
  /** 인터넷이 끊겼거나 서버에 닿지 않음 */
  network: 'NETWORK',
  /** 너무 오래 걸려서 끊음 */
  timeout: 'TIMEOUT',
  /** 서버 주소가 아직 없음 (app.json extra.api.baseUrls) */
  noBaseUrl: 'NO_BASE_URL',
  /** 응답이 약속한 모양이 아님 */
  badResponse: 'BAD_RESPONSE',
  /** 로그인이 풀림 (401) */
  unauthorized: 'UNAUTHORIZED',
  notFound: 'NOT_FOUND',
} as const;

const DEFAULT_MESSAGE: Record<string, string> = {
  [ClientErrorCode.network]: '인터넷 연결을 확인해 주세요',
  [ClientErrorCode.timeout]: '응답이 늦어요. 잠시 후 다시 시도해 주세요',
  [ClientErrorCode.noBaseUrl]: '서버 주소가 아직 없어요',
  [ClientErrorCode.badResponse]: '잠시 후 다시 시도해 주세요',
  [ClientErrorCode.unauthorized]: '다시 로그인해 주세요',
  [ClientErrorCode.notFound]: '찾을 수 없어요',
};

export class ApiError extends Error {
  readonly code: string;
  /** HTTP 상태 (서버에 닿지 않았으면 0) */
  readonly status: number;

  constructor({ code, message, status = 0 }: { code: string; message?: string; status?: number }) {
    super(message || DEFAULT_MESSAGE[code] || '잠시 후 다시 시도해 주세요');
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

export const isApiError = (e: unknown): e is ApiError => e instanceof ApiError;

/** 서버가 보낸 몸통이 `{ code, message }` 인지 */
export function isApiErrorBody(v: unknown): v is ApiErrorBody {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as Record<string, unknown>;
  return typeof r.code === 'string' && typeof r.message === 'string';
}

/** 화면에 띄울 한 줄 (ErrorState · 토스트) */
export const errorMessage = (e: unknown) => (isApiError(e) ? e.message : '잠시 후 다시 시도해 주세요');
