/**
 * 3D 지도(WebGL)를 이 기기에서 그려도 되는지.
 * - 웹: 브라우저에 WebGL 이 없으면(꺼 둠 · 오래된 기기) 처음부터 2D 지도로 보여 줘요.
 * - 폰: 미리 알 길이 없어서 일단 그려 보고, 못 그리면(world-view 의 시간 초과 · 오류) 2D 지도로 바꿔요.
 * - 가벼운 그림: 메모리가 적거나 오래된 폰은 그림자 · 안티에일리어싱을 꺼서 버벅임 · 발열 · 꺼짐을 줄여요.
 * 개발용(웹): 주소 뒤 ?map=flat 이면 2D 지도로, ?map=lite 면 가벼운 그림으로 봐요.
 *   ?map=capture 면 3D 를 '모두 열림'으로 그리고 window.__world[id].snapshot() 으로 2D 지도 사진을 찍어요.
 */
import * as Device from 'expo-device';
import { Platform } from 'react-native';

/** GL 이 이 시간 안에 시작하지 않으면 2D 지도로 (ms) */
export const GL_START_TIMEOUT = 5000;

const GB = 1024 ** 3;
const devMap = () => (Platform.OS === 'web' && __DEV__ && typeof location !== 'undefined' ? new URLSearchParams(location.search).get('map') : null);

let webGL: boolean | null = null;
/** 이 기기에서 3D 지도를 그려 볼지 */
export function canTryWorld3D(): boolean {
  if (devMap() === 'flat') return false;
  if (Platform.OS !== 'web') return true;
  if (webGL == null) {
    try {
      const c = document.createElement('canvas');
      webGL = !!(c.getContext('webgl2') ?? c.getContext('webgl'));
    } catch {
      webGL = false;
    }
  }
  return webGL;
}

/** 가벼운 그림으로 그릴지 (메모리 4GB 미만 · 2018년 이전 급 폰) */
export function liteWorld(): boolean {
  if (devMap() === 'lite') return true;
  if (Platform.OS === 'web') return false;
  const mem = Device.totalMemory;
  const year = Device.deviceYearClass;
  return (mem != null && mem < 3.5 * GB) || (year != null && year < 2018);
}

/** 개발용(웹): 2D 지도 사진 찍기 모드 */
export const devCapture = () => devMap() === 'capture';
