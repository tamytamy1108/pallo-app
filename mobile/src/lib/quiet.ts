/**
 * 화면을 만지지 않는 '조용한 때' 알기 — 무거운 일(3D 라이브러리 지도 미리 만들기: 한 장에 JS 가 0.3~1.3초 멈춰요)을
 * 사람이 화면을 만지는 동안엔 미뤄요. 아래 탭 화면 전체(탭 바 포함)가 터치 · 스크롤 때 noteTouch 를 불러요.
 * 아래 탭이 맨 앞인지(레슨 · 장면 같은 화면이 위에 없는지)도 여기서 알려요 — 그 화면들에서는 미리 만들지 않아요.
 */
import { useSyncExternalStore } from 'react';

let lastTouch = 0;

export const noteTouch = () => {
  lastTouch = Date.now();
};

/** 마지막 터치 · 스크롤 뒤 지난 시간 (ms) */
export const quietFor = () => Date.now() - lastTouch;

let tabsFront = false;
const subs = new Set<() => void>();

/** 아래 탭 화면이 맨 앞에 있어요 (탭 바가 알려요) */
export const setTabsFront = (front: boolean) => {
  if (tabsFront === front) return;
  tabsFront = front;
  subs.forEach((s) => s());
};

const subscribe = (s: () => void) => {
  subs.add(s);
  return () => {
    subs.delete(s);
  };
};
const read = () => tabsFront;

export const useTabsFront = () => useSyncExternalStore(subscribe, read, read);
