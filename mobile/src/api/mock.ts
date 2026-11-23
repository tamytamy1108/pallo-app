/**
 * 가짜 응답 (서버가 생기기 전). api 함수마다 `useMock ? mock(...) : http.get(...)` 으로 갈라요.
 * 화면 상태(불러오는 중 · 오류)를 눈으로 확인하는 방법 — 웹 미리보기 주소에 붙여요:
 *   ?mockDelay=1500        → 모든 가짜 응답을 1.5초 늦게
 *   ?mockFail=notices,me   → 그 이름의 API 만 오류 (이름은 각 api 함수의 첫 인자)
 *   ?mockFail=all          → 전부 오류
 */
import { Platform } from 'react-native';

import { apiConfig } from './config';
import { ApiError, ClientErrorCode } from './errors';

let delayMs = apiConfig.mockDelayMs;
let failing = new Set<string>();

function readWebParams() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  const p = new URLSearchParams(window.location.search);
  const d = Number(p.get('mockDelay'));
  if (Number.isFinite(d) && d > 0) delayMs = d;
  const f = p.get('mockFail');
  if (f) failing = new Set(f.split(',').map((s) => s.trim()).filter(Boolean));
}
readWebParams();

/** 테스트 · 개발용: 늦추기 · 실패시키기 */
export function setMockOptions(opts: { delayMs?: number; fail?: string[] }) {
  if (opts.delayMs !== undefined) delayMs = opts.delayMs;
  if (opts.fail) failing = new Set(opts.fail);
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * 가짜 응답 하나. name = API 이름 (?mockFail= 에 쓰는 이름) · make = 돌려줄 값 (부를 때마다 새로 만들어요)
 * make 안에서 ApiError 를 던지면 서버 오류처럼 보여요 (예: 없는 공지 → NOT_FOUND)
 */
export async function mock<T>(name: string, make: () => T): Promise<T> {
  if (delayMs > 0) await wait(delayMs);
  if (failing.has(name) || failing.has('all')) throw new ApiError({ code: 'MOCK_FAIL', message: '불러오지 못했어요', status: 500 });
  return make();
}

export const mockNotFound = () => new ApiError({ code: ClientErrorCode.notFound, status: 404 });
