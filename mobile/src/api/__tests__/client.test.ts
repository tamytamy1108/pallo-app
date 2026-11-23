import { buildUrl, request } from '../client';
import { ApiError } from '../errors';
import { saveTokens, clearTokens } from '../token';

jest.mock('../config', () => ({
  apiConfig: { env: 'dev', baseUrl: 'https://api.test', useMock: false, mockDelayMs: 0, timeoutMs: 15000 },
}));

const realFetch = globalThis.fetch;
const fetchMock = jest.fn();

function reply(status: number, body?: unknown) {
  const text = body === undefined ? '' : typeof body === 'string' ? body : JSON.stringify(body);
  return { ok: status >= 200 && status < 300, status, text: async () => text } as unknown as Response;
}

beforeEach(async () => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock;
  await clearTokens();
});
afterAll(() => {
  globalThis.fetch = realFetch;
});

describe('buildUrl', () => {
  it('붙이고 빈 값은 빼요', () => {
    expect(buildUrl('https://api.test', '/notices', { limit: 3, cursor: null, kind: undefined })).toBe('https://api.test/notices?limit=3');
    expect(buildUrl('https://api.test', 'me', { ids: ['a', 'b c'] })).toBe('https://api.test/me?ids=a&ids=b%20c');
  });
});

describe('request', () => {
  it('JSON 응답을 돌려주고 토큰을 붙여요', async () => {
    await saveTokens({ accessToken: 'tok' });
    fetchMock.mockResolvedValue(reply(200, { name: 'Tammy' }));
    await expect(request('GET', '/me')).resolves.toEqual({ name: 'Tammy' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.test/me');
    expect(init.headers.Authorization).toBe('Bearer tok');
  });

  it('auth: false 면 토큰을 안 붙여요', async () => {
    await saveTokens({ accessToken: 'tok' });
    fetchMock.mockResolvedValue(reply(200, {}));
    await request('POST', '/auth/login/kakao', { auth: false, body: {} });
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it('서버 오류 { code, message } 를 ApiError 로', async () => {
    fetchMock.mockResolvedValue(reply(409, { code: 'ALREADY_CHECKED_IN', message: '이미 출석했어요' }));
    await expect(request('POST', '/sessions/s1/attendance')).rejects.toMatchObject({ code: 'ALREADY_CHECKED_IN', message: '이미 출석했어요', status: 409 });
  });

  it('모양이 다른 오류는 상태 코드로', async () => {
    fetchMock.mockResolvedValue(reply(404, '<html>'));
    await expect(request('GET', '/x')).rejects.toMatchObject({ code: 'BAD_RESPONSE' });
    fetchMock.mockResolvedValue(reply(500));
    await expect(request('GET', '/x')).rejects.toMatchObject({ code: 'HTTP_500', status: 500 });
  });

  it('인터넷이 끊기면 NETWORK', async () => {
    fetchMock.mockRejectedValue(new TypeError('Network request failed'));
    const e = await request('GET', '/me').catch((x: unknown) => x);
    expect(e).toBeInstanceOf(ApiError);
    expect(e).toMatchObject({ code: 'NETWORK', status: 0 });
  });

  it('401 이면 토큰을 지워요', async () => {
    await saveTokens({ accessToken: 'tok' });
    fetchMock.mockResolvedValue(reply(401));
    await expect(request('GET', '/me')).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    fetchMock.mockResolvedValue(reply(200, {}));
    await request('GET', '/me');
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBeUndefined();
  });
});
