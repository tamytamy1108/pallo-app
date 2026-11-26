/**
 * 화면이 쓰는 카카오 로그인 훅(useKakaoLogin) — 결과(done · cancelled · redirected · 실패)에 따라 '들어가는 중' · 토스트.
 * 로그인 시작(startKakaoLogin)은 kakao-login.test.tsx 에서 따로 봐서 여기선 대역이에요.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { showToast } from '@/components/ui/toast';

import { startKakaoLogin } from '../kakao-login';
import { useKakaoLogin } from '../use-kakao-login';

jest.mock('../kakao-login', () => ({ startKakaoLogin: jest.fn() }));
jest.mock('@/components/ui/toast', () => ({ showToast: jest.fn() }));
jest.mock('expo-router', () => ({ useLocalSearchParams: () => ({}) }));

const start = jest.mocked(startKakaoLogin);
const toast = jest.mocked(showToast);

let queryClient: QueryClient;
function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  start.mockReset();
  toast.mockClear();
});

async function press() {
  const hook = await renderHook(() => useKakaoLogin(), { wrapper });
  expect(hook.result.current.isPending).toBe(false);
  await act(async () => hook.result.current.start());
  return hook;
}

describe('useKakaoLogin', () => {
  it('누르는 동안 들어가는 중 → 로그인되면 풀리고 토스트 없음', async () => {
    let finish!: (v: 'done') => void;
    start.mockReturnValue(new Promise((r) => (finish = r)));
    const { result } = await press();
    await waitFor(() => expect(result.current.isPending).toBe(true));
    await act(async () => finish('done'));
    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(start).toHaveBeenCalledTimes(1);
    expect(toast).not.toHaveBeenCalled();
  });

  it('사용자가 닫으면(cancelled) 조용히 다시 누를 수 있어요', async () => {
    start.mockResolvedValue('cancelled');
    const { result } = await press();
    await waitFor(() => expect(queryClient.isMutating()).toBe(0));
    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(toast).not.toHaveBeenCalled();
  });

  it('웹에서 카카오 페이지로 넘어가는 중(redirected)이면 계속 들어가는 중', async () => {
    start.mockResolvedValue('redirected');
    const { result } = await press();
    // 요청은 끝났지만(진행 중인 mutation 0) 버튼은 계속 막혀 있어요
    await waitFor(() => expect(queryClient.isMutating()).toBe(0));
    await waitFor(() => expect(result.current.isPending).toBe(true));
    expect(toast).not.toHaveBeenCalled();
  });

  it('실패하면 오류 문구를 토스트로 · 다시 누를 수 있어요', async () => {
    start.mockRejectedValue(new Error('카카오 로그인 설정이 없어요'));
    const { result } = await press();
    await waitFor(() => expect(toast).toHaveBeenCalledWith('카카오 로그인 설정이 없어요'));
    expect(result.current.isPending).toBe(false);
  });
});
