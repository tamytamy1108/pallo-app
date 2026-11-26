/**
 * 로그인 상태(SessionProvider) — 토큰 · /me(가짜 서버) 에 따라 restoring · signedOut · signedIn · error 로 바뀌는지.
 * @testing-library/react-native v14 는 renderHook · act 가 비동기예요 (await).
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { resetOnboarding, updateOnboarding } from '@/state/onboarding';

import { showToast } from '@/components/ui/toast';

import { setMockOptions } from '../mock';
import { queryKeys } from '../queries';
import { SessionProvider, useCompleteOnboarding, useSession } from '../session';
import { tokenStorage } from '../token';

jest.mock('../config', () => ({
  apiConfig: { env: 'dev', baseUrl: '', useMock: true, mockDelayMs: 0, timeoutMs: 15000 },
}));
// 토스트는 애니메이션(reanimated)이라 jest 에선 대역 — 가입 끝내기 실패 토스트는 훅이 띄워요
jest.mock('@/components/ui/toast', () => ({ showToast: jest.fn() }));

let queryClient: QueryClient;

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>{children}</SessionProvider>
    </QueryClientProvider>
  );
}

const render = () => renderHook(() => ({ session: useSession(), complete: useCompleteOnboarding() }), { wrapper });

beforeEach(() => {
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  tokenStorage.clear();
  resetOnboarding();
  setMockOptions({ delayMs: 0, fail: [] });
  jest.mocked(showToast).mockClear();
});

describe('로그인 상태', () => {
  it('토큰이 없으면 signedOut · /me 를 보내지 않아요', async () => {
    const { result } = await render();
    await waitFor(() => expect(result.current.session.status).toBe('signedOut'));
    expect(queryClient.getQueryData(queryKeys.me)).toBeUndefined();
  });

  it('로그인하면(토큰 저장) /me 를 받아 signedIn · 가입을 안 끝냈으면 needsOnboarding', async () => {
    const { result } = await render();
    await waitFor(() => expect(result.current.session.status).toBe('signedOut'));
    await act(() => tokenStorage.set({ accessToken: 'a', refreshToken: 'r' }));
    await waitFor(() => expect(result.current.session).toEqual({ status: 'signedIn', needsOnboarding: true }));
  });

  it('가입을 끝냈으면 needsOnboarding=false', async () => {
    updateOnboarding({ done: true });
    tokenStorage.set({ accessToken: 'a', refreshToken: 'r' });
    const { result } = await render();
    await waitFor(() => expect(result.current.session).toEqual({ status: 'signedIn', needsOnboarding: false }));
  });

  it('가입 끝내기(useCompleteOnboarding) → /me 를 다시 받아 needsOnboarding=false', async () => {
    tokenStorage.set({ accessToken: 'a', refreshToken: 'r' });
    const { result } = await render();
    await waitFor(() => expect(result.current.session).toEqual({ status: 'signedIn', needsOnboarding: true }));
    await act(() => result.current.complete.mutateAsync());
    await waitFor(() => expect(result.current.session).toEqual({ status: 'signedIn', needsOnboarding: false }));
  });

  it('가입 끝내기 뒤 /me 다시 받기가 실패해도 가입 화면에 갇히지 않아요 (needsOnboarding=false)', async () => {
    tokenStorage.set({ accessToken: 'a', refreshToken: 'r' });
    const { result } = await render();
    await waitFor(() => expect(result.current.session).toEqual({ status: 'signedIn', needsOnboarding: true }));
    setMockOptions({ fail: ['me'] });
    await act(() => result.current.complete.mutateAsync());
    await waitFor(() => expect(queryClient.isFetching({ queryKey: queryKeys.me })).toBe(0));
    expect(queryClient.getQueryState(queryKeys.me)?.status).toBe('error');
    expect(result.current.session).toEqual({ status: 'signedIn', needsOnboarding: false });
  });

  it('가입 끝내기가 실패하면 그대로 가입 전 · 토스트', async () => {
    tokenStorage.set({ accessToken: 'a', refreshToken: 'r' });
    const { result } = await render();
    await waitFor(() => expect(result.current.session).toEqual({ status: 'signedIn', needsOnboarding: true }));
    setMockOptions({ fail: ['completeOnboarding'] });
    await act(() => expect(result.current.complete.mutateAsync()).rejects.toBeTruthy());
    expect(result.current.session).toEqual({ status: 'signedIn', needsOnboarding: true });
    expect(showToast).toHaveBeenCalled();
  });

  it('토큰이 사라지면(로그아웃 · 갱신 실패) signedOut · 받아 둔 서버 데이터를 비워요', async () => {
    updateOnboarding({ done: true });
    tokenStorage.set({ accessToken: 'a', refreshToken: 'r' });
    const { result } = await render();
    await waitFor(() => expect(result.current.session.status).toBe('signedIn'));
    queryClient.setQueryData(queryKeys.popups, []);
    await act(() => tokenStorage.clear());
    await waitFor(() => expect(result.current.session.status).toBe('signedOut'));
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });

  it('/me 가 실패하면(인터넷 · 서버) 로그아웃하지 않고 error · 다시 시도하면 signedIn', async () => {
    updateOnboarding({ done: true });
    setMockOptions({ fail: ['me'] });
    tokenStorage.set({ accessToken: 'a', refreshToken: 'r' });
    const { result } = await render();
    await waitFor(() => expect(result.current.session.status).toBe('error'));
    expect(tokenStorage.get()).not.toBeNull();

    setMockOptions({ fail: [] });
    const s = result.current.session;
    await act(() => {
      if (s.status === 'error') s.retry();
    });
    await waitFor(() => expect(result.current.session).toEqual({ status: 'signedIn', needsOnboarding: false }));
  });
});
