import { fetchNotice, fetchNotices, setNoticePinned } from '../home';
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

  it('고정한 공지가 목록 맨 위로 오고, 풀면 최신순 제자리로 가요', async () => {
    await setNoticePinned({ id: 'n4', pinned: true });
    const pinned = await fetchNotices({ limit: 3 });
    expect(pinned.items.map((n) => [n.id, n.pinned])).toEqual([
      ['n1', true],
      ['n4', true],
      ['n2', false],
    ]);
    await expect(fetchNotice('n4')).resolves.toMatchObject({ pinned: true, content: expect.any(String), images: [] });

    await setNoticePinned({ id: 'n4', pinned: false });
    const back = await fetchNotices();
    expect(back.items.map((n) => n.id)).toEqual(['n1', 'n2', 'n3', 'n4', 'n5']);
  });

  it('없는 공지는 not_found', async () => {
    await expect(fetchNotice('nope')).rejects.toMatchObject({ code: 'not_found', status: 404 });
  });

  it('/me 는 state/me 값을 돌려줘요', async () => {
    await expect(fetchMe()).resolves.toMatchObject({ name: 'Tammy', role: 'member' });
  });

  it('?mockFail 처럼 실패시킬 수 있어요', async () => {
    setMockOptions({ fail: ['notices'] });
    await expect(fetchNotices()).rejects.toMatchObject({ code: 'mock_fail' });
    await expect(fetchMe()).resolves.toBeTruthy();
  });
});
