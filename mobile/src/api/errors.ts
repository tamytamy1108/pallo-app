/**
 * API 오류 — 공용 `@academy/api-client` 의 ApiError 를 그대로 써요. 화면은 이 파일에서만 가져와요.
 * 우리 백엔드는 모든 오류를 `{ error, message }` 로 보내요 (GlobalExceptionHandler — 401 · 403 도 같은 모양).
 * - `code` = 서버 `error` (`entity_not_found` · `illegal_operation` 같은 소문자 스네이크). 화면은 `code` 로만 갈라요 (글자로 가르지 않아요)
 * - `message` = 서버 message. 서버에 닿지 못했거나(인터넷 · 시간 초과) 응답을 못 읽으면 status 500 · 공용 기본 문구
 * - 404 는 서버 코드가 둘(`entity_not_found` · `not_found`)이라 '없음' 판정은 `isNotFound(e)` (상태 404) 로 해요
 */
import { isApiError } from '@academy/api-client';

export { ApiError, apiErrorMessage, isApiError, UNKNOWN_ERROR_MESSAGE, type ApiErrorBody } from '@academy/api-client';

/** 없는 자원인지 (404). 서버 코드가 `entity_not_found` · `not_found` 둘이라 상태로 봐요 */
export const isNotFound = (e: unknown) => isApiError(e) && e.status === 404;
