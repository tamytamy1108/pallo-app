/**
 * 서버 데이터 공급자: app/_layout.tsx 가장 바깥에서 감싸요.
 * - QueryClientProvider: useQuery · useMutation 을 쓸 수 있게
 * - SessionProvider: 로그인 상태 (api/session.tsx) — 토큰 복원 · /me · 받은 /me 를 state/me 에 넣기 · 로그아웃 때 캐시 비우기
 * - PushTokenSync: 로그인되면 이 기기 푸시 토큰을 서버에 등록 (api/use-push-registration.tsx)
 * 앱 시작 때 미리 받아 두는 데이터는 없어요. 로그인 상태가 정해지면 화면이 저마다 받아요 (불러오는 중 화면과 함께).
 */
import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { PushTokenSync } from './use-push-registration';
import { queryClient } from './query-client';
import { SessionProvider } from './session';

export function ApiProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <PushTokenSync />
        {children}
      </SessionProvider>
    </QueryClientProvider>
  );
}
