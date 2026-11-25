/**
 * 스터디 맵 카드가 지금 화면 안에 보이는지 (홈 스크롤이 알려요).
 * 안 보이면 카드 뒤 장식(떨어지는 눈 · 계절 장식 · 반짝이 30여 개)의 반복 움직임을 멈춰요 —
 * 보이지도 않는 장식이 매 프레임 움직이면 홈 스크롤이 버벅였어요.
 */
import { useSyncExternalStore } from 'react';

let onScreen = true;
const subs = new Set<() => void>();

export const setDecoOnScreen = (v: boolean) => {
  if (onScreen === v) return;
  onScreen = v;
  subs.forEach((s) => s());
};

const subscribe = (s: () => void) => {
  subs.add(s);
  return () => {
    subs.delete(s);
  };
};
const read = () => onScreen;

export const useDecoOnScreen = () => useSyncExternalStore(subscribe, read, read);
