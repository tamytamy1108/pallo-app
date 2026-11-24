import { useEffect } from 'react';
import { Easing, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

/*
 * 체험 예약 확정 화면 (onboarding/trial-done) 의 들어오는 순서.
 * 조명이 켜지고 → 팔로로가 무대에 떨어져 착지 → 포스터 글씨가 올라오고 → 표가 쑥 → 도장 쾅 → 연락 안내. 모두 2.2초 안에 끝나요.
 */

/** 시작 시각 · 길이 (ms) */
export const DONE_AT = {
  light: 80,
  lightMs: 460,
  floor: 220,
  floorMs: 380,
  drop: 420,
  dropMs: 340,
  /** 착지 = drop + dropMs */
  land: 760,
  landMs: 420,
  words: 700,
  wordsMs: 620,
  sub: 1040,
  subMs: 360,
  ticket: 1120,
  ticketMs: 560,
  stamp: 1640,
  stampMs: 380,
  notice: 1880,
  noticeMs: 320,
} as const;

/** 0 → 1 을 한 번 (delay 뒤, 선형 시계 · 곡선은 kfc 로 구간마다). 움직임 줄이기면 처음부터 1 */
export function useDoneClock(delay: number, duration: number) {
  const still = useReducedMotion();
  const p = useSharedValue(still ? 1 : 0);
  useEffect(() => {
    if (still) {
      p.set(1);
      return;
    }
    p.set(withDelay(delay, withTiming(1, { duration, easing: Easing.linear })));
  }, [still, delay, duration, p]);
  return p;
}
