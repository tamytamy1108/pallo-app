/**
 * 아래 탭과 탭 화면 스크롤.
 * - 보고 있는 탭을 한 번 더 누르면: 스르륵 맨 위로 (인스타 · 카카오톡처럼) — emitTabReselect → useTabReselect
 * - 다른 탭에 갔다가 돌아오면: 마지막으로 보던 자리 그대로예요 (2026-11-28) — 탭 화면이 스크롤할 때마다 자리를 적어 두고(useTabScrollMemory),
 *   탭 바가 그 탭을 다시 보여 줄 때(restoreTabScroll) 그 자리로 옮겨요. 숨은 탭은 display: none 이라 웹 · 새 구조(Fabric)에서 스크롤 자리를 잃어요.
 * - 앱을 껐다 켜면: 적어 둔 자리는 기기에 남기지 않아서 모든 탭이 맨 위부터예요.
 */
import { type RefObject, useEffect, useRef } from 'react';
import type { ScrollViewInstance } from 'react-native';

export type TabName = 'home' | 'library' | 'lounge' | 'event' | 'my';

const listeners = new Map<TabName, Set<(animated: boolean) => void>>();
/** 탭마다 마지막 스크롤 자리 (앱이 떠 있는 동안만) */
const lastY = new Map<TabName, number>();
const restorers = new Map<TabName, (y: number) => void>();
/** 지금 보이는 탭 — 숨은 탭에서 오는 스크롤(자리 0 으로 다시 그려질 때 등)은 적지 않아요 */
let front: TabName | null = null;

export function emitTabReselect(tab: TabName) {
  lastY.set(tab, 0);
  listeners.get(tab)?.forEach((l) => l(true));
}

/** 탭 화면이 막 보이게 됐을 때 탭 바가 불러요: 마지막으로 보던 자리로 (움직임 없이) */
export function restoreTabScroll(tab: TabName) {
  front = tab;
  const y = lastY.get(tab) ?? 0;
  const restore = restorers.get(tab);
  if (!restore || y <= 0) return;
  // 숨겨 둔 화면이 다시 자리를 잡은 다음에 옮겨요
  requestAnimationFrame(() => restore(y));
}

/** 보고 있는 탭을 또 누르면 onReselect 를 불러요 (보통 scrollTo({ y: 0, animated })) */
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

/**
 * 탭 화면 스크롤 자리 기억하기: 돌려준 함수를 onScroll 에서 y 로 불러 주면 다른 탭에 다녀와도 그 자리예요.
 * 맨 위로 올리기(탭 다시 누르기)도 같이 걸어 줘요.
 */
export function useTabScrollMemory(tab: TabName, scroll: RefObject<ScrollViewInstance | null>) {
  useTabReselect(tab, (animated) => scroll.current?.scrollTo({ y: 0, animated }));
  useEffect(() => {
    restorers.set(tab, (y) => scroll.current?.scrollTo({ y, animated: false }));
    return () => {
      restorers.delete(tab);
    };
  }, [tab, scroll]);
  return (y: number) => {
    if (front === null || front === tab) lastY.set(tab, y);
  };
}
