/**
 * 앱 하나에 하나뿐인 QueryClient (서버 데이터 캐시) + 앱 시작 때 미리 받아 둘 데이터.
 */
import { focusManager, QueryClient } from '@tanstack/react-query';
import { AppState, Platform } from 'react-native';

import { isApiError } from './errors';
import { loungeHighlightsQuery, meQuery, noticeBoardQuery, popupsQuery, sessionsTodayQuery } from './queries';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 30초 안에 다시 열면 받아 둔 값을 그대로 써요
      staleTime: 30_000,
      // 4xx(잘못된 요청 · 권한 · 없음)는 다시 해도 같아서 한 번만, 그 밖(인터넷 · 서버)은 한 번 더 시도
      retry: (count, error) => !(isApiError(error) && error.status >= 400 && error.status < 500) && count < 1,
    },
    mutations: { retry: false },
  },
});

// 폰에서 앱으로 돌아오면(백그라운드 → 앞) 오래된 데이터를 다시 받아요. 웹은 Query 가 창 포커스를 알아서 봐요
if (Platform.OS !== 'web') {
  focusManager.setEventListener((setFocused) => {
    const sub = AppState.addEventListener('change', (s) => setFocused(s === 'active'));
    return () => sub.remove();
  });
}

const START_TIMEOUT_MS = 3_000;

/**
 * 스플래시가 떠 있는 동안 홈 첫 화면 데이터를 미리 받아요 (화면이 빈 채로 깜빡이지 않게).
 * 오래 걸려도 3초 넘게 기다리지 않아요. 실패한 것은 화면에서 다시 받아요.
 */
export async function prefetchStartData() {
  const all = Promise.allSettled([
    queryClient.prefetchQuery(meQuery()),
    queryClient.prefetchQuery(sessionsTodayQuery()),
    queryClient.prefetchQuery(noticeBoardQuery()),
    queryClient.prefetchQuery(loungeHighlightsQuery()),
    queryClient.prefetchQuery(popupsQuery()),
  ]);
  await Promise.race([all, new Promise((r) => setTimeout(r, START_TIMEOUT_MS))]);
}
