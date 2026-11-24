/**
 * pallo-app http — 공용 createHttpClient 에 이 앱의 주소 · 토큰 저장 · 갱신 · 시간 초과를 꽂은 결과를 확인해요.
 * 클라이언트는 갱신 상태(한 번 시도했는지 등)를 들고 있어서 테스트마다 모듈을 새로 불러요.
 */
import type { HttpClient } from '@academy/api-client';

import type * as Errors from '../errors';
import type * as Token from '../token';

jest.mock('../config', () => ({
  apiConfig: { env: 'dev', baseUrl: 'https://api.test', useMock: false, mockDelayMs: 0, timeoutMs: 50 },
}));

const realFetch = globalThis.fetch;
const fetchMock = jest.fn();

function reply(status: number, body?: unknown) {
  const text = body === undefined ? '' : typeof body === 'string' ? body : JSON.stringify(body);
  return { ok: status >= 200 && status < 300, status, text: async () => text } as unknown as Response;
}

let http: HttpClient;
let tokenStorage: typeof Token.tokenStorage;
let errors: typeof Errors;

const urlOf = (i: number) => fetchMock.mock.calls[i][0] as string;
const authOf = (i: number) => (fetchMock.mock.calls[i][1].headers as Headers).get('Authorization');
const refreshCalls = () => fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/auth/refresh'));

beforeEach(() => {
  jest.resetModules();
  fetchMock.mockReset();
  // 새 레지스트리에서 불러와요 (../config mock 은 그대로 적용돼요)
  ({ http } = jest.requireActual<typeof import('../client')>('../client'));
  ({ tokenStorage } = jest.requireActual<typeof Token>('../token'));
  errors = jest.requireActual<typeof Errors>('../errors');
  // 모듈을 불러오면 Expo 가 전역 fetch 를 다시 깔아요 → 불러온 뒤에 바꿔 끼워요
  globalThis.fetch = fetchMock;
});
afterAll(() => {
  globalThis.fetch = realFetch;
});

describe('주소 · 토큰', () => {
  it('오리진 + /app/api/v2 + 경로, 빈 쿼리 값은 빼요 · 토큰을 붙여요', async () => {
    tokenStorage.set({ accessToken: 'tok', refreshToken: 'r1' });
    fetchMock.mockResolvedValue(reply(200, { name: 'Tammy' }));
    await expect(http.get('/notices', { query: { limit: 3, cursor: null } })).resolves.toEqual({ name: 'Tammy' });
    expect(urlOf(0)).toBe('https://api.test/app/api/v2/notices?limit=3');
    expect(authOf(0)).toBe('Bearer tok');
  });
});

describe('오류 모양 (백엔드 { error, message })', () => {
  beforeEach(() => tokenStorage.set({ accessToken: 'tok', refreshToken: 'r1' }));

  it('error 가 code, message 는 그대로', async () => {
    fetchMock.mockResolvedValue(reply(409, { error: 'already_checked_in', message: '이미 출석했어요' }));
    await expect(http.post('/sessions/s1/attendance')).rejects.toMatchObject({ code: 'already_checked_in', message: '이미 출석했어요', status: 409 });
  });

  it('404 는 코드가 달라도(entity_not_found · not_found) isNotFound', async () => {
    for (const error of ['entity_not_found', 'not_found']) {
      fetchMock.mockResolvedValue(reply(404, { error, message: '찾을 수 없습니다' }));
      const e = await http.get('/x').catch((x: unknown) => x);
      expect(e).toMatchObject({ code: error, status: 404 });
      expect(errors.isNotFound(e)).toBe(true);
    }
  });

  it('403 은 갱신하지 않고 그대로', async () => {
    fetchMock.mockResolvedValue(reply(403, { error: 'forbidden', message: '권한이 없습니다' }));
    await expect(http.get('/me')).rejects.toMatchObject({ code: 'forbidden', status: 403 });
    expect(refreshCalls()).toHaveLength(0);
    expect(tokenStorage.get()?.accessToken).toBe('tok');
  });

  it('인터넷이 끊기면 공용 기본 문구의 ApiError', async () => {
    fetchMock.mockRejectedValue(new TypeError('Network request failed'));
    const e = await http.get('/me').catch((x: unknown) => x);
    expect(errors.isApiError(e)).toBe(true);
    expect(e).toMatchObject({ status: 500, message: errors.UNKNOWN_ERROR_MESSAGE });
  });

  it('timeoutMs 가 지나면 끊어요', async () => {
    fetchMock.mockImplementation((_url: string, init: RequestInit) => new Promise((_, reject) => init.signal?.addEventListener('abort', () => reject(new Error('aborted')))));
    await expect(http.get('/slow')).rejects.toMatchObject({ status: 500 });
  });
});

describe('401 → 토큰 갱신', () => {
  it('갱신하고 원 요청을 새 토큰으로 한 번 다시 보내요', async () => {
    tokenStorage.set({ accessToken: 'old', refreshToken: 'r1' });
    fetchMock
      .mockResolvedValueOnce(reply(401, { error: 'invalid_token', message: '만료' }))
      .mockResolvedValueOnce(reply(200, { accessToken: 'new', refreshToken: 'r2' }))
      .mockResolvedValueOnce(reply(200, { ok: true }));
    await expect(http.get('/me')).resolves.toEqual({ ok: true });
    expect(urlOf(1)).toBe('https://api.test/app/api/v2/auth/refresh');
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ refreshToken: 'r1' });
    expect(authOf(2)).toBe('Bearer new');
    expect(tokenStorage.get()).toEqual({ accessToken: 'new', refreshToken: 'r2' });
  });

  it('동시에 여러 요청이 401 이어도 갱신은 한 번', async () => {
    tokenStorage.set({ accessToken: 'old', refreshToken: 'r1' });
    let refreshed = false;
    fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
      if (url.endsWith('/auth/refresh')) {
        await new Promise((r) => setTimeout(r, 5));
        refreshed = true;
        return reply(200, { accessToken: 'new', refreshToken: 'r2' });
      }
      const auth = (init.headers as Headers).get('Authorization');
      return refreshed && auth === 'Bearer new' ? reply(200, { url }) : reply(401, { error: 'invalid_token', message: '만료' });
    });
    await Promise.all(['/a', '/b', '/c'].map((p) => http.get(p)));
    expect(refreshCalls()).toHaveLength(1);
  });

  it('갱신도 실패하면 토큰을 지우고 401 을 그대로 던져요', async () => {
    tokenStorage.set({ accessToken: 'old', refreshToken: 'r1' });
    fetchMock
      .mockResolvedValueOnce(reply(401, { error: 'invalid_token', message: '만료' }))
      .mockResolvedValueOnce(reply(401, { error: 'invalid_token', message: '만료' }));
    await expect(http.get('/me')).rejects.toMatchObject({ code: 'invalid_token', status: 401 });
    expect(tokenStorage.get()).toBeNull();
  });

  it('refresh 토큰이 없으면 갱신 요청을 보내지 않아요', async () => {
    fetchMock.mockResolvedValue(reply(401, { error: 'unauthorized', message: '로그인이 필요합니다' }));
    await expect(http.get('/me')).rejects.toMatchObject({ status: 401 });
    expect(refreshCalls()).toHaveLength(0);
  });

  it('/auth/* 의 401 은 갱신하지 않아요 (자격 증명이 틀림)', async () => {
    tokenStorage.set({ accessToken: 'old', refreshToken: 'r1' });
    fetchMock.mockResolvedValue(reply(401, { error: 'invalid_credentials', message: '틀렸어요' }));
    await expect(http.post('/auth/phone/verify', { code: '000000' })).rejects.toMatchObject({ status: 401 });
    expect(refreshCalls()).toHaveLength(0);
  });
});
