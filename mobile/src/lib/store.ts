import { useSyncExternalStore } from 'react';

/**
 * 아주 작은 전역 상태 (가짜 데이터용). 백엔드가 생기면 서버 데이터(TanStack Query 등)로 바꿔요.
 * - useStore(): 전체 값을 구독해요. / useStore(selector): 고른 값만 구독해요.
 *   ⚠ 화면 · 훅 안에서는 꼭 useStore 로 불러요. `store.use()` 는 React Compiler 가 React 의 use() 로 착각해서
 *   다시 그릴 때 건너뛸 수 있어요 (훅 순서 오류). use 는 옛 이름이라 남겨 둔 거예요.
 * - selector: selector 는 숫자 · 글자 · true/false 처럼 바뀌지 않는 값을 돌려줘야 해요
 *   (매번 새 객체 · 배열을 만들어 돌려주면 화면이 끝없이 다시 그려져요).
 */
export function createStore<T>(initial: T) {
  let state = initial;
  const listeners = new Set<() => void>();
  const get = () => state;
  const set = (next: T | ((prev: T) => T)) => {
    state = typeof next === 'function' ? (next as (prev: T) => T)(state) : next;
    listeners.forEach((l) => l());
  };
  const subscribe = (l: () => void) => {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  };
  function use(): T;
  function use<S>(selector: (s: T) => S): S;
  function use<S>(selector?: (s: T) => S) {
    const pick = () => (selector ? selector(state) : state);
    return useSyncExternalStore(subscribe, pick, pick);
  }
  return { get, set, subscribe, use, useStore: use };
}
