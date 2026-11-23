import { fetchNotice, fetchNotices } from '../home';
import { fetchMe } from '../me';
import { setMockOptions } from '../mock';

jest.mock('../config', () => ({
  apiConfig: { env: 'dev', baseUrl: '', useMock: true, mockDelayMs: 0, timeoutMs: 15000 },
}));

afterEach(() => setMockOptions({ delayMs: 0, fail: [] }));

describe('가짜 API', () => {
  it('공지를 cursor 로 나눠 줘요', async () => {
    const first = await fetchNotices({ limit: 3 });
    expect(first.items.map((n) => n.id)).toEqual(['n1', 'n2', 'n3']);
    expect(first.nextCursor).toBe('3');
    const rest = await fetchNotices({ limit: 3, cursor: first.nextCursor });
    expect(rest.items.map((n) => n.id)).toEqual(['n4', 'n5']);
    expect(rest.nextCursor).toBeNull();
  });

  it('없는 공지는 NOT_FOUND', async () => {
    await expect(fetchNotice('nope')).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 });
  });

  it('/me 는 state/me 값을 돌려줘요', async () => {
    await expect(fetchMe()).resolves.toMatchObject({ name: 'Tammy', role: 'member' });
  });

  it('?mockFail 처럼 실패시킬 수 있어요', async () => {
    setMockOptions({ fail: ['notices'] });
    await expect(fetchNotices()).rejects.toMatchObject({ code: 'MOCK_FAIL' });
    await expect(fetchMe()).resolves.toBeTruthy();
  });
});
