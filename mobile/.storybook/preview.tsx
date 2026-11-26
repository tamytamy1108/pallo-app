import type { Decorator, Preview } from '@storybook/react-native-web-vite';
import { QueryClient, QueryClientProvider, type QueryKey } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { setMockOptions } from '@/api/mock';
import { queryKeys } from '@/api/queries';
import { queryClient as appQueryClient } from '@/api/query-client';
import { FontAssets } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { updateMe } from '@/state/me';

import { __setStoryRoute } from './expo-router-stub';
import { personaOf, storySummary, USER_KIND_ITEMS, USER_KIND_PATCH } from './user-kinds';

/**
 * 스토리가 미리 채워 둘 조회 응답 — `parameters.queries: [[queryKey, data], ...]`. 키는 api 훅이 쓰는 키 그대로.
 * 채운 값은 상하지 않고(staleTime ∞) 재시도도 없어, 스토리는 서버(가짜 응답 포함)를 다시 부르지 않는다.
 */
export type SeededQueries = readonly (readonly [QueryKey, unknown])[];

function seededClient(queries: SeededQueries | undefined, summary: unknown): QueryClient {
  const client = new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity, retry: false, refetchOnWindowFocus: false } },
  });
  // 툴바 '보는 사람'의 서버 요약 (스토리가 직접 채운 값이 있으면 아래에서 덮여요)
  client.setQueryData(queryKeys.branchSummary, summary);
  for (const [key, data] of queries ?? []) client.setQueryData(key, data);
  return client;
}

/** `parameters.route` — 화면 스토리의 주소 값 (useLocalSearchParams · usePathname). */
export type StoryRoute = { params?: Record<string, string>; pathname?: string };

/**
 * `parameters.api` — 가짜 API(src/api/mock) 조절. 불러오는 중은 `{ delayMs: LOADING_FOREVER }`,
 * 오류는 `{ fail: ['notices'] }`(이름은 api 함수의 mock 첫 인자, 'all' = 전부). 빈 목록 · 특정 응답은 `parameters.queries`.
 */
export type StoryApi = { delayMs?: number; fail?: string[] };

/**
 * 앱 루트(src/app/_layout.tsx)와 같은 바탕 — 글꼴 · 제스처 · 안전 영역 · 크림 바탕색.
 * 로그인(SessionProvider) 은 빼서 로그인 화면으로 튕기지 않게 하고, 쿼리 캐시만 스토리 값으로 채운다.
 */
function StoryRoot({ queries, summary, children }: { queries: SeededQueries | undefined; summary: unknown; children: React.ReactNode }) {
  const [client] = useState(() => seededClient(queries, summary));
  const [loaded, fontError] = useFonts(FontAssets);
  if (!loaded && !fontError) return null;
  return (
    <QueryClientProvider client={client}>
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaProvider>
          <View style={styles.root}>{children}</View>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

// key: 스토리 · 툴바 값이 바뀌면 바탕을 새로 만든다 — 쿼리 캐시가 앞 스토리 것을 이어 쓰지 않게.
const withAppRoot: Decorator = (Story, context) => (
  <StoryRoot
    key={`${context.id}:${JSON.stringify(context.globals.userKind)}`}
    queries={context.parameters.queries as SeededQueries | undefined}
    summary={storySummary(context.globals, context.parameters.queries as SeededQueries | undefined)}>
    <Story />
  </StoryRoot>
);

/** 툴바의 기기 폭 — 폰 앱이라 기본값이 휴대폰이다. */
const VIEWPORTS = {
  'phone-sm': { name: '작은 휴대폰 (375×667)', styles: { width: '375px', height: '667px' }, type: 'mobile' },
  phone: { name: '휴대폰 (390×844)', styles: { width: '390px', height: '844px' }, type: 'mobile' },
  'phone-lg': { name: '큰 휴대폰 (430×932)', styles: { width: '430px', height: '932px' }, type: 'mobile' },
} as const;

const preview: Preview = {
  decorators: [withAppRoot],
  // 그리기 전에 툴바의 보는 사람을 나(state/me)에 넣는다 — 렌더 중에 스토어를 바꾸지 않게 여기서.
  // 누를 때 판정하는 곳(guardMember · lock-hits)은 앱 쿼리 캐시의 요약을 읽어서, 거기에도 같은 요약을 넣는다.
  beforeEach: ({ globals, parameters }) => {
    updateMe(USER_KIND_PATCH[personaOf(globals)]);
    appQueryClient.setQueryData(queryKeys.branchSummary, storySummary(globals, parameters.queries as SeededQueries | undefined));
    __setStoryRoute(parameters.route as StoryRoute | undefined);
    const api = parameters.api as StoryApi | undefined;
    setMockOptions({ delayMs: api?.delayMs ?? 0, fail: api?.fail ?? [] });
  },
  globalTypes: {
    userKind: {
      description: '보는 사람',
      toolbar: { title: '보는 사람', icon: 'user', items: USER_KIND_ITEMS, dynamicTitle: true },
    },
  },
  initialGlobals: {
    userKind: 'member',
    viewport: { value: 'phone', isRotated: false },
  },
  parameters: {
    layout: 'fullscreen',
    viewport: { options: VIEWPORTS },
    backgrounds: { disable: true },
  },
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.cream },
});

export default preview;
