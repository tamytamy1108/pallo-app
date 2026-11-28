/**
 * 내 배지 (api/badges.ts · api/use-badges.ts toBadge) — 가짜 서버 모양과 서버 배지 → 배지 칸 바꾸기.
 */
import { MY_BADGES } from '@/data/my';

import { fetchMyBadges, fetchUnseenBadges, markBadgesSeen } from '../badges';
import { setMockOptions } from '../mock';
import { toBadge } from '../use-badges';

jest.mock('../config', () => ({
  apiConfig: { env: 'dev', baseUrl: '', useMock: true, mockDelayMs: 0, timeoutMs: 15000 },
}));

afterEach(() => setMockOptions({ delayMs: 0, fail: [] }));

describe('내 배지 API (가짜 서버)', () => {
  it('배지 모두 보기는 예시 배지를 같은 순서로 · 받은 것은 earned', async () => {
    const rows = await fetchMyBadges();
    expect(rows.map((b) => b.code)).toEqual(MY_BADGES.map((b) => b.code));
    expect(rows.filter((b) => b.earned).map((b) => b.code)).toEqual(MY_BADGES.filter((b) => b.on).map((b) => b.code));
  });

  it('안 본 배지는 없고, 본 것으로 보내기는 그대로 끝나요', async () => {
    await expect(fetchUnseenBadges()).resolves.toEqual([]);
    await expect(markBadgesSeen(['first-hangout'])).resolves.toBeUndefined();
  });

  it('서버가 실패하면 오류로 받아요', async () => {
    setMockOptions({ fail: ['myBadges'] });
    await expect(fetchMyBadges()).rejects.toMatchObject({ code: 'mock_fail' });
  });
});

describe('서버 배지 → 배지 칸', () => {
  it('그림 주소 · 이름 · 설명 · 받았는지를 옮겨요', () => {
    expect(
      toBadge({ code: 'first-hangout', name: '첫 번개', description: '번개 첫 참여', imageUrl: 'https://cdn.example/badge-images/a.png', earned: false }),
    ).toEqual({ code: 'first-hangout', ic: 'heart', imageUrl: 'https://cdn.example/badge-images/a.png', name: '첫 번개', desc: '번개 첫 참여', on: false });
  });
});
