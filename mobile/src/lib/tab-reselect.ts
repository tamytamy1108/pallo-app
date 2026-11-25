/**
 * 아래 탭을 누르면 그 탭 화면을 맨 위로 올려요.
 * - 보고 있는 탭을 한 번 더 누르면: 스르륵 올라가요 (인스타 · 카카오톡처럼)
 * - 다른 탭에서 넘어오면: 처음 화면(맨 위)부터 바로 보여요 — 뒤로 가기로 돌아올 때는 보던 자리 그대로예요
 * 탭 바가 알리고(emitTabReselect · markTabEnter → flushTabEnter), 탭 화면이 듣고 스크롤을 올려요(useTabReselect).
 */
import { useEffect, useRef } from 'react';

export type TabName = 'home' | 'library' | 'lounge' | 'event' | 'my';

const listeners = new Map<TabName, Set<(animated: boolean) => void>>();

export function emitTabReselect(tab: TabName) {
  listeners.get(tab)?.forEach((l) => l(true));
}

let entering: TabName | null = null;

/** 탭 바에서 다른 탭을 눌렀어요 — 그 탭이 화면에 뜨면(flushTabEnter) 움직임 없이 맨 위로 */
export function markTabEnter(tab: TabName) {
  entering = tab;
}

/** 탭 화면이 막 보이게 됐을 때 불러요: 탭 바로 넘어온 거면 맨 위로 (뒤로 가기로 돌아온 거면 그대로) */
export function flushTabEnter(tab: TabName) {
  if (entering !== tab) return;
  entering = null;
  listeners.get(tab)?.forEach((l) => l(false));
}

/** 탭을 누르면 onReselect 를 불러요 (보통 scrollTo({ y: 0, animated })) */
export function useTabReselect(tab: TabName, onReselect: (animated: boolean) => void) {
  const latest = useRef(onReselect);
  useEffect(() => {
    latest.current = onReselect;
  });
  useEffect(() => {
    const l = (animated: boolean) => latest.current(animated);
    const set = listeners.get(tab) ?? new Set();
    set.add(l);
    listeners.set(tab, set);
    return () => {
      set.delete(l);
    };
  }, [tab]);
}
