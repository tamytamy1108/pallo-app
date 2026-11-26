/**
 * 카카오 웹 로그인 콜백 화면 훅(useKakaoCallback) — 카카오가 돌려준 `?code=&state=` 로 v2 `/auth/login` 을 한 번 보내요.
 * 서버(fetch) · 주소 값(expo-router)만 대역이고, auth · client · token 은 진짜로 돌아요.
 */
import { renderHook, waitFor } from '@testing-library/react-native';

import { tokenStorage } from '../token';
import { useKakaoCallback } from '../use-kakao-login';

jest.mock('../config', () => ({
  apiConfig: { env: 'dev', baseUrl: 'https://api.test', useMock: false, mockDelayMs: 0, timeoutMs: 1000 },
}));
jest.mock('@react-native-kakao/core', () => ({ initializeKakaoSDK: jest.fn() }));
jest.mock('@react-native-kakao/user', () => ({ login: jest.fn() }));
jest.mock('@/components/ui/toast', () => ({ showToast: jest.fn() }));
const mockParams: { current: Record<string, string | undefined> } = { current: {} };
jest.mock('expo-router', () => ({ useLocalSearchParams: () => mockParams.current }));

const realFetch = globalThis.fetch;
const fetchMock = jest.fn();
const reply = (status: number, body: unknown) =>
  ({ ok: status >= 200 && status < 300, status, text: async () => JSON.stringify(body) }) as unknown as Response;
const TOKENS = { accessToken: 'our-access', refreshToken: 'our-refresh' };
const sent = (i = 0) => ({ url: fetchMock.mock.calls[i][0] as string, body: JSON.parse(fetchMock.mock.calls[i][1].body as string) });

beforeEach(() => {
  fetchMock.mockReset();
  mockParams.current = {};
  tokenStorage.clear();
  // 모듈을 불러오면 Expo 가 전역 fetch 를 다시 깔아요 → 불러온 뒤(여기)에 바꿔 끼워요
  globalThis.fetch = fetchMock;
});
afterAll(() => {
  globalThis.fetch = realFetch;
});

describe('카카오 웹 로그인 콜백 (useKakaoCallback)', () => {
  it('인가 코드 + 지점 QR state 를 v2 /auth/login 으로 한 번만 보내고 토큰을 저장해요', async () => {
    mockParams.current = { code: 'auth-code', state: 'HANAM,7' };
    fetchMock.mockResolvedValue(reply(200, TOKENS));
    const { result, rerender } = await renderHook(() => useKakaoCallback());
    await waitFor(() => expect(tokenStorage.get()).toEqual(TOKENS));
    await rerender({});
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(sent()).toEqual({
      url: 'https://api.test/app/api/v2/auth/login',
      body: { authCode: 'auth-code', branchCode: 'HANAM', adId: 7 },
    });
    expect(result.current.error).toBeNull();
  });

  it('카카오에서 취소하고 돌아오면(access_denied) 서버에 보내지 않고 취소 문구', async () => {
    mockParams.current = { error: 'access_denied' };
    const { result } = await renderHook(() => useKakaoCallback());
    await waitFor(() => expect(result.current.error).toBe('카카오 로그인을 취소했어요.'));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('지점 QR 없이 들어오면 인가 코드만 보내요', async () => {
    mockParams.current = { code: 'auth-code' };
    fetchMock.mockResolvedValue(reply(200, TOKENS));
    await renderHook(() => useKakaoCallback());
    await waitFor(() => expect(tokenStorage.get()).toEqual(TOKENS));
    expect(sent().body).toEqual({ authCode: 'auth-code' });
  });

  it.each([
    ['다른 오류 + 설명', { error: 'invalid_request', error_description: 'bad redirect_uri' }, 'bad redirect_uri'],
    ['오류만', { error: 'server_error' }, '카카오 로그인에 실패했어요.'],
    ['설명이 빈 글자', { error: 'server_error', error_description: '' }, '카카오 로그인에 실패했어요.'],
    ['오류와 코드가 함께', { error: 'access_denied', code: 'auth-code' }, '카카오 로그인을 취소했어요.'],
  ])('카카오가 오류로 돌려보내면(%s) 서버에 보내지 않고 문구를 보여 줘요', async (_label, query, message) => {
    mockParams.current = query;
    const { result } = await renderHook(() => useKakaoCallback());
    await waitFor(() => expect(result.current.error).toBe(message));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('코드 없이 들어오면 안내 문구 · 서버에 보내지 않아요', async () => {
    const { result } = await renderHook(() => useKakaoCallback());
    await waitFor(() => expect(result.current.error).toBe('카카오에서 인증 코드를 받지 못했어요.'));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('서버가 거절하면(이미 쓴 코드 등) 서버 문구를 보여 주고 토큰은 없어요', async () => {
    mockParams.current = { code: 'used-code' };
    fetchMock.mockResolvedValue(reply(401, { error: 'invalid_token', message: '인증이 만료되었습니다' }));
    const { result } = await renderHook(() => useKakaoCallback());
    await waitFor(() => expect(result.current.error).toBe('인증이 만료되었습니다'));
    expect(tokenStorage.get()).toBeNull();
  });
});
