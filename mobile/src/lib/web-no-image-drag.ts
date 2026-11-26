/**
 * 웹에서만: 사진(<img>)을 마우스로 끌면 브라우저가 '사진 끌어다 놓기'를 시작해서,
 * 우리 끌기(사진 순서 바꾸기 · 사진 위치 맞추기)가 바로 취소돼요 (pointercancel).
 * 앱 안에서는 사진을 밖으로 끌어 놓을 일이 없어서, 사진의 브라우저 끌기만 막아요. 폰 앱에는 아무 일도 안 해요.
 */
import { Platform } from 'react-native';

let on = false;

export function blockWebImageDrag() {
  if (on || Platform.OS !== 'web' || typeof document === 'undefined') return;
  on = true;
  document.addEventListener(
    'dragstart',
    (e) => {
      if (e.target instanceof HTMLImageElement) e.preventDefault();
    },
    true,
  );
}
