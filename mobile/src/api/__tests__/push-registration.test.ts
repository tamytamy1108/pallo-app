/**
 * 푸시 토큰 등록 · 해제 (api/push-registration.ts) — 권한 허용이면 등록, 거절이면 아무것도 안 함, 로그아웃 때 등록한 토큰만 해제.
 * 실패는 던지지 않아요(뒤에서 하는 일이라 로그인 · 로그아웃을 막지 않게).
 */
import { getPushToken, requestPushPermission } from '@/lib/push';

import { logout } from '../auth';
import { registerPushTokenQuietly, registerThisDevice, unregisterThisDevice } from '../push-registration';
import { registerPushToken, unregisterPushToken } from '../push-tokens';
import { tokenStorage } from '../token';

jest.mock('../config', () => ({
  apiConfig: { env: 'dev', baseUrl: '', useMock: true, mockDelayMs: 0, timeoutMs: 15000 },
}));
jest.mock('@/lib/push', () => ({ requestPushPermission: jest.fn(), getPushToken: jest.fn() }));
jest.mock('../push-tokens', () => ({ registerPushToken: jest.fn(), unregisterPushToken: jest.fn() }));

const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

beforeEach(async () => {
  jest.mocked(requestPushPermission).mockResolvedValue(true);
  jest.mocked(getPushToken).mockResolvedValue('fcm-1');
  jest.mocked(registerPushToken).mockResolvedValue(undefined);
  jest.mocked(unregisterPushToken).mockResolvedValue(undefined);
  await unregisterThisDevice(); // 앞 테스트가 등록해 둔 토큰 비우기
  jest.clearAllMocks();
});

describe('푸시 토큰 등록', () => {
  it('권한 허용 → 이 기기 토큰을 OS 와 함께 등록', async () => {
    await registerThisDevice();
    expect(registerPushToken).toHaveBeenCalledWith('fcm-1', 'IOS'); // jest-expo 기본 플랫폼 = ios
  });

  it('권한 거절 → 토큰도 안 받고 등록도 안 해요', async () => {
    jest.mocked(requestPushPermission).mockResolvedValue(false);
    await registerThisDevice();
    expect(getPushToken).not.toHaveBeenCalled();
    expect(registerPushToken).not.toHaveBeenCalled();
  });

  it('토큰이 없으면(Firebase 꺼짐) 등록 안 해요', async () => {
    jest.mocked(getPushToken).mockResolvedValue(null);
    await registerThisDevice();
    expect(registerPushToken).not.toHaveBeenCalled();
  });

  it('권한 · 토큰 받기 · 등록이 실패해도 던지지 않고 경고만', async () => {
    jest.mocked(getPushToken).mockRejectedValue(new Error('firebase'));
    await expect(registerThisDevice()).resolves.toBeUndefined();
    jest.mocked(getPushToken).mockResolvedValue('fcm-1');
    jest.mocked(registerPushToken).mockRejectedValue(new Error('server'));
    await expect(registerThisDevice()).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledTimes(2);
  });
});

describe('로그아웃 때 해제', () => {
  it('등록한 토큰을 지우고, 두 번째엔 보내지 않아요', async () => {
    await registerThisDevice();
    await unregisterThisDevice();
    await unregisterThisDevice();
    expect(unregisterPushToken).toHaveBeenCalledTimes(1);
    expect(unregisterPushToken).toHaveBeenCalledWith('fcm-1');
  });

  it('토큰이 바뀌어 다시 등록했으면 마지막 토큰을 지워요', async () => {
    await registerThisDevice();
    await registerPushTokenQuietly('fcm-2');
    await unregisterThisDevice();
    expect(unregisterPushToken).toHaveBeenCalledWith('fcm-2');
  });

  it('등록이 실패했으면 지울 것도 없어요', async () => {
    jest.mocked(registerPushToken).mockRejectedValue(new Error('server'));
    await registerThisDevice();
    await unregisterThisDevice();
    expect(unregisterPushToken).not.toHaveBeenCalled();
  });

  it('logout — 로그인 토큰을 지우기 전에 푸시 토큰을 해제하고, 해제가 실패해도 로그아웃은 돼요', async () => {
    tokenStorage.set({ accessToken: 'a', refreshToken: 'r' });
    await registerThisDevice();
    let hadTokensWhenUnregistering = false;
    jest.mocked(unregisterPushToken).mockImplementation(async () => {
      hadTokensWhenUnregistering = tokenStorage.get() !== null;
      throw new Error('server');
    });
    await expect(logout()).resolves.toBeUndefined();
    expect(hadTokensWhenUnregistering).toBe(true);
    expect(tokenStorage.get()).toBeNull();
  });
});
