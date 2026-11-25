import { avFresh } from '@/data/my';
import { getMyAvatar } from '@/state/avatar';
import { getMe, updateMe } from '@/state/me';

import { fromLook, INSUFFICIENT_SPARKS, purchaseAvatar, toLook } from '../avatar';

jest.mock('../config', () => ({
  apiConfig: { env: 'dev', baseUrl: '', useMock: true, mockDelayMs: 0, timeoutMs: 15000 },
}));


describe('꾸미기 API (가짜 서버)', () => {
  it('서버 모양으로 바꿨다가 되돌려도 같아요', () => {
    const a = avFresh();
    expect(fromLook(toLook(a))).toEqual(a);
  });

  it('스파크가 모자라면 insufficient_sparks 로 거절하고 아무것도 빼지 않아요', async () => {
    updateMe({ sparks: 100 });
    const d = { ...avFresh(), eq: { ...avFresh().eq, hat: 'h-witch' } };
    await expect(purchaseAvatar(d, 500, 'r1')).rejects.toMatchObject({ code: INSUFFICIENT_SPARKS, message: '스파크가 400개 모자라요' });
    expect(getMe().sparks).toBe(100);
  });

  it('사면 스파크를 빼고 산 것 이름을 돌려주고 저장해요', async () => {
    updateMe({ sparks: 1250 });
    const d = { ...avFresh(), eq: { ...avFresh().eq, hat: 'h-witch' } };
    await expect(purchaseAvatar(d, 500, 'r2')).resolves.toEqual({ spent: 500, bought: ['마녀 모자'] });
    expect(getMe().sparks).toBe(750);
    expect(getMyAvatar().eq.hat).toBe('h-witch');
  });
});
