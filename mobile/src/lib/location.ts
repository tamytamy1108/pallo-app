import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Linking, Platform } from 'react-native';

import type { LatLng } from '@/api/onboarding';

/*
 * 내 위치 한 번 받기 (expo-location · 앱 쓰는 동안 권한).
 * - 웹은 브라우저 위치, 폰은 기기 위치. expo-location 이 들어가기 전 네이티브 빌드에는 모듈이 없어서 'off' 로 끝나요.
 * - 위치는 화면이 바로 쓰고 기기에도 서버에도 남기지 않아요 (서버에는 대략 100m 로 깎아 목록 요청에만 실어요).
 */

/** locating: 찾는 중 · ok: 받음 · denied: 권한 거절 · off: 위치를 못 씀(모듈 없음 · 위치 꺼짐 · 시간 초과) */
export type LocateStatus = 'locating' | 'ok' | 'denied' | 'off';
export type MyLocation = { status: LocateStatus; point: LatLng | null; retry: () => void };

/** 위치를 이보다 오래 못 찾으면 포기하고 지역별 목록으로 */
export const LOCATE_TIMEOUT_MS = 10000;

export type LocateResult = { status: Exclude<LocateStatus, 'locating'>; point: LatLng | null; canAskAgain: boolean };

const timeout = <T,>(p: Promise<T>, ms: number) =>
  Promise.race([p, new Promise<never>((_, reject) => setTimeout(() => reject(new Error('locate timeout')), ms))]);

let locateImpl: () => Promise<LocateResult> = () => locateOnce();
/** 스토리 · 테스트용: 위치 받기를 바꿔 끼워요 (null 이면 진짜로) */
export function setLocateForTesting(fn: (() => Promise<LocateResult>) | null) {
  locateImpl = fn ?? (() => locateOnce());
}

/** 위치를 받을 때 쓰는 expo-location 부분 (테스트가 가짜를 넣어요) */
export type LocationModule = Pick<typeof import('expo-location'), 'requestForegroundPermissionsAsync' | 'getCurrentPositionAsync' | 'Accuracy'>;

/** 권한을 묻고(이미 답했으면 안 물어요) 지금 위치를 한 번 받아요. 실패는 던지지 않고 status 로 */
export async function locateWith(Location: LocationModule): Promise<LocateResult> {
  try {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (!perm.granted) return { status: 'denied', point: null, canAskAgain: perm.canAskAgain };
    const pos = await timeout(Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }), LOCATE_TIMEOUT_MS);
    return { status: 'ok', point: { lat: pos.coords.latitude, lng: pos.coords.longitude }, canAskAgain: true };
  } catch {
    return { status: 'off', point: null, canAskAgain: true };
  }
}

/** expo-location 을 불러와 위치를 받아요 — 모듈이 없는 옛 네이티브 빌드면 불러오기에서 실패해 'off' */
export async function locateOnce(): Promise<LocateResult> {
  let Location: LocationModule;
  try {
    Location = await import('expo-location');
  } catch {
    return { status: 'off', point: null, canAskAgain: false };
  }
  return locateWith(Location);
}

/**
 * 화면이 열릴 때 내 위치를 한 번 받아요. retry: 다시 찾기 — 다시 물을 수 없게 거절돼 있으면(폰) 앱 설정을 열고,
 * 설정에서 돌아오면(앱이 다시 앞으로) 거절 상태일 때 한 번 더 찾아요.
 */
export function useMyLocation(): MyLocation {
  const locate = locateImpl;
  const [state, setState] = useState<{ status: LocateStatus; point: LatLng | null }>({ status: 'locating', point: null });
  const alive = useRef(true);
  // 결과만 받아 넣어요 (찾는 중 표시는 처음 값 · retry 가 해요)
  const run = useCallback(
    (openSettingsIfBlocked: boolean) => {
      void locate().then((r) => {
        if (!alive.current) return;
        setState({ status: r.status, point: r.point });
        if (openSettingsIfBlocked && r.status === 'denied' && !r.canAskAgain && Platform.OS !== 'web') void Linking.openSettings();
      });
    },
    [locate],
  );
  useEffect(() => {
    alive.current = true;
    run(false);
    return () => {
      alive.current = false;
    };
  }, [run]);
  const denied = state.status === 'denied';
  useEffect(() => {
    if (!denied) return;
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') run(false);
    });
    return () => sub.remove();
  }, [denied, run]);
  const retry = useCallback(() => {
    setState((s) => ({ ...s, status: 'locating' }));
    run(true);
  }, [run]);
  return { ...state, retry };
}
