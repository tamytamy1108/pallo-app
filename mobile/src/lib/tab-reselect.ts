/**
 * 지금 보고 있는 아래 탭을 한 번 더 누르면 그 탭 화면을 맨 위로 올려요 (인스타 · 카카오톡처럼).
 * 탭 바가 알리고(emitTabReselect), 탭 화면이 듣고 스크롤을 올려요(useTabReselect).
 */
import { useEffect, useRef } from 'react';

export type TabName = 'home' | 'library' | 'lounge' | 'event' | 'my';

const listeners = new Map<TabName, Set<() => void>>();

export function emitTabReselect(tab: TabName) {
  listeners.get(tab)?.forEach((l) => l());
}

/** 탭을 다시 누르면 onReselect 를 불러요 (보통 scrollTo({ y: 0 })) */
export function useTabReselect(tab: TabName, onReselect: () => void) {
  const latest = useRef(onReselect);
  useEffect(() => {
    latest.current = onReselect;
  });
  useEffect(() => {
    const l = () => latest.current();
    const set = listeners.get(tab) ?? new Set();
    set.add(l);
    listeners.set(tab, set);
    return () => {
      set.delete(l);
    };
  }, [tab]);
}
