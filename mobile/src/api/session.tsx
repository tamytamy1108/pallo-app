/**
 * 로그인 상태 — 앱 전체에서 여기 한 곳만 정해요. 화면 이동은 app/_layout.tsx 의 Stack.Protected 가 이 값을 보고 해요.
 *
 * 판정 근거는 둘뿐이에요
 * 1. 토큰이 있는지 (api/token.ts — 기기 저장에서 복원한 뒤부터)
 * 2. 서버 `GET /me` (`needsOnboarding` = 가입 과정을 아직 안 끝냈는지)
 *
 *   복원 중 · /me 받는 중  → restoring (스플래시 그대로)
 *   토큰 없음              → signedOut (첫 화면 · 로그인만 열려요 — 로그인 없이 둘러보기는 없어요)
 *   /me 받음               → signedIn { needsOnboarding }
 *   /me 가 401             → 공용 클라이언트가 갱신까지 실패하면 토큰을 지워요 → 저절로 signedOut
 *   /me 가 그 밖의 실패     → error (인터넷이 잠깐 끊겼다고 로그아웃시키지 않아요. 다시 시도)
 *
 * 토큰이 있다가 사라지면(로그아웃 · 갱신 실패 · 탈퇴) 받아 둔 서버 데이터를 모두 비워요 — 끝점이 여기 하나예요.
 * 받은 /me 를 state/me 에 넣는 것(useMe() 로 읽는 화면들)도 여기서 해요.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useRef, useSyncExternalStore, type ReactNode } from 'react';

import { showToast } from '@/components/ui/toast';
import { updateMe } from '@/state/me';
import { useOnboarding } from '@/state/onboarding';

import { apiErrorMessage } from './errors';
import { completeOnboarding, patchMe, type MePatch } from './me';
import { meQuery, queryKeys } from './queries';
import { hydrateTokens, isTokensHydrated, subscribeTokens, tokenStorage } from './token';

export type Session =
  | { status: 'restoring' }
  | { status: 'signedOut' }
  | { status: 'signedIn'; needsOnboarding: boolean }
  | { status: 'error'; error: unknown; retry: () => void };

const SessionContext = createContext<Session | null>(null);

const hasTokensNow = () => tokenStorage.get() !== null;

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const hydrated = useSyncExternalStore(subscribeTokens, isTokensHydrated, isTokensHydrated);
  const hasTokens = useSyncExternalStore(subscribeTokens, hasTokensNow, hasTokensNow);

  useEffect(() => {
    hydrateTokens();
  }, []);

  // 토큰이 없으면 /me 를 보내지 않아요
  const me = useQuery({ ...meQuery(), enabled: hydrated && hasTokens });

  // 토큰이 사라지는 순간(있다 → 없다) 받아 둔 서버 데이터를 비워요
  const hadTokens = useRef(hasTokens);
  useEffect(() => {
    if (hadTokens.current && !hasTokens) queryClient.clear();
    hadTokens.current = hasTokens;
  }, [hasTokens, queryClient]);

  // 받은 /me 를 state/me 에 (useMe() 로 읽는 화면은 그대로 동작해요)
  useEffect(() => {
    if (me.data) {
      const { needsOnboarding: _ignored, ...rest } = me.data;
      updateMe(rest);
    }
  }, [me.data]);

  const session: Session = !hydrated
    ? { status: 'restoring' }
    : !hasTokens
      ? { status: 'signedOut' }
      : me.data
        ? { status: 'signedIn', needsOnboarding: me.data.needsOnboarding }
        : me.isError
          ? { status: 'error', error: me.error, retry: () => void me.refetch() }
          : { status: 'restoring' };

  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
  const s = useContext(SessionContext);
  if (!s) throw new Error('useSession 은 SessionProvider 안에서만 써요');
  return s;
}

/**
 * 아직 가입 중인지 — 같은 화면을 가입 중 · 가입 뒤에 같이 쓰는 곳(연동 요청 · 연동 대기)이 보내는 API 를 고를 때.
 * 로그인 상태(/me needsOnboarding)가 기준이고, 로그인 상태가 없는 곳(스토리북)에서는 이 기기의 가입 기록(done)으로 봐요.
 */
export function useNeedsOnboarding(): boolean {
  const s = useContext(SessionContext);
  const notDone = useOnboarding((o) => !o.done);
  return s ? s.status === 'signedIn' && s.needsOnboarding : notDone;
}

/**
 * 가입 과정 끝내기 → 받아 둔 /me 의 needsOnboarding 을 바로 false 로 바꾸고(Stack.Protected 가 가입 화면을 닫아요) /me 를 다시 받아요.
 * 다시 받기를 기다리지 않는 건, 그게 실패하면 받아 둔 옛 값(needsOnboarding=true)이 남아 가입 화면에 갇히기 때문이에요.
 * 실패하면 여기서 토스트를 띄워요 (부르는 화면마다 붙이다 빠뜨리지 않게). 화면은 성공 뒤 할 일만 넘겨요
 */
export function useCompleteOnboarding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: completeOnboarding,
    onSuccess: () => {
      queryClient.setQueryData(meQuery().queryKey, (old) => (old ? { ...old, needsOnboarding: false } : old));
      void queryClient.invalidateQueries({ queryKey: queryKeys.me });
    },
    onError: (e) => showToast(apiErrorMessage(e)),
  });
}

/**
 * 4 PATCH /me — 닉네임 · 한 줄 소개 · 지점 고치기.
 * 받은 값을 바로 state/me 에 넣어 마이 · 프로필이 곧바로 바뀌고, /me 도 다시 받아요.
 */
export function usePatchMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: MePatch) => patchMe(patch),
    onSuccess: (saved, patch) => {
      // 고친 칸만 서버가 돌려준 값으로 (서버가 앞뒤 빈칸을 다듬었을 수 있어요)
      const keys = Object.keys(patch) as (keyof MePatch)[];
      updateMe(Object.fromEntries(keys.map((k) => [k, saved[k]])) as MePatch);
      return queryClient.invalidateQueries({ queryKey: queryKeys.me });
    },
  });
}
