/**
 * 서버 데이터 공급자: app/_layout.tsx 가장 바깥에서 감싸요.
 * - QueryClientProvider: useQuery · useMutation 을 쓸 수 있게
 * - MeSync: 받아 온 /me 를 state/me 에 넣어요 → useMe() 로 읽는 화면은 그대로 동작해요
 */
import { QueryClientProvider, useQuery } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';

import { updateMe } from '@/state/me';

import { meQuery } from './queries';
import { prefetchStartData, queryClient } from './query-client';

export function ApiProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <MeSync />
      {children}
    </QueryClientProvider>
  );
}

function MeSync() {
  const { data } = useQuery(meQuery());
  useEffect(() => {
    if (data) updateMe(data);
  }, [data]);
  return null;
}

/** 시작 데이터를 다 받았는지 (스플래시를 내릴 때 같이 봐요) */
export function useStartData() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    prefetchStartData().finally(() => {
      if (alive) setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);
  return ready;
}
