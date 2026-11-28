import { avFresh } from '@/data/my';
import { getMyAvatar, getOwned } from '@/state/avatar';
import { getMe, updateMe } from '@/state/me';

import { applyServer, fetchMyAvatar, type MyAvatarState } from '../avatar';
import { http } from '../client';

jest.mock('../config', () => ({
  apiConfig: { env: 'dev', baseUrl: '', useMock: false, mockDelayMs: 0, timeoutMs: 15000 },
}));
jest.mock('../client', () => ({ http: { get: jest.fn(), put: jest.fn(), post: jest.fn() } }));

const server: MyAvatarState = {
  look: {
    color: 'mint',
    flip: true,
    bg: 'night',
    hairColor: '#112233',
    say: '안녕',
    equipped: { hair: null, eye: null, mitt: null, shoe: null, hat: 'h-witch', face: null, wear: null, hand: null, acc: null, fx: 's-purple' },
  },
  owned: ['mint', 'bg:night', 'h-witch', 's-purple'],
  sparks: 0,
};

describe('내 캐릭터 GET /me/avatar (진짜 서버)', () => {
  it('GET /me/avatar 를 불러요', async () => {
    (http.get as jest.Mock).mockResolvedValueOnce(server);
    await expect(fetchMyAvatar()).resolves.toBe(server);
    expect(http.get).toHaveBeenCalledWith('/me/avatar', { signal: undefined });
  });

  it('받은 모습 · 가진 것을 기기에 넣고, 스파크는 그대로 둬요 (서버는 아직 0)', () => {
    updateMe({ sparks: 300 });
    applyServer(server);
    expect(getMyAvatar()).toEqual({ ...avFresh(), color: 'mint', flip: true, bg: 'night', hc: '#112233', say: '안녕', eq: server.look.equipped });
    expect(getOwned()).toEqual(expect.arrayContaining(server.owned));
    expect(getMe().sparks).toBe(300);
  });
});
