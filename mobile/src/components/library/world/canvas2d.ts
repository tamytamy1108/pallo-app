/**
 * 3D 지도 그림 텍스처용 그림판 — 웹은 진짜 <canvas>, 폰은 soft-canvas (픽셀로 칠하는 작은 그림판).
 * 프로토타입 코드의 document.createElement('canvas') · new THREE.CanvasTexture(c) · new Path2D(d) 자리에 써요.
 */
import { Platform } from 'react-native';
import * as THREE from 'three';

import { SoftCanvas, SoftPath2D } from './soft-canvas';

const WEB = Platform.OS === 'web' && typeof document !== 'undefined';

export function makeCanvas(w = 300, h = 150) {
  if (WEB) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }
  return new SoftCanvas(w, h);
}

export function canvasTexture(c: HTMLCanvasElement | SoftCanvas): THREE.Texture {
  if (c instanceof SoftCanvas) return c.toTexture();
  return new THREE.CanvasTexture(c);
}

export function makePath2D(d: string) {
  if (WEB && typeof Path2D !== 'undefined') return new Path2D(d);
  return new SoftPath2D(d);
}

/** 웹 글꼴 불러오기를 기다렸다가 다시 그리기 (폰은 글자를 안 그려서 건너뛰어요) */
export function whenFont(spec: string, run: () => void) {
  if (WEB && document.fonts && document.fonts.load) document.fonts.load(spec).then(run).catch(() => {});
}
