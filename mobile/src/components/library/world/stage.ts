/**
 * 3D 섬 무대 (프로토타입 stage()) — expo-gl 의 GL 위에 three 렌더러 · 정사영 카메라 · 하늘빛 + 해 조명 · 부드러운 그림자.
 * - 이름표 · 팔로 캐릭터 · 아래 확대 카드는 HTML 대신 RN 화면이 그려요: 여기서는 3D 점을 화면 좌표로 바꿔 알려 줘요 (onFrame).
 * - 손가락: 짧게 누르면 그 자리로 확대(섬 · 정류장이면 아래 카드), 옆으로 끌면 정해진 범위 안에서 빙 돌아요 (OrbitControls 대신).
 * - 폰 성능: 그림자 지도 1024 · 화면이 안 보이면(paused) 그리지 않기 · 닫을 때 GPU 자원 정리.
 */
import type { ExpoWebGLRenderingContext } from 'expo-gl';
import { PixelRatio, Platform } from 'react-native';
import * as THREE from 'three';

export const INK = 0x1e1a2b;
/** 외곽선 재질 (눌렀을 때 맞은 물체에서 빼요) */
export const inkMat = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });

/** 섬 · 정류장 정보 (눌러서 확대했을 때 아래 카드) */
export type FocusInfo = { n: string; st: string; no: number; at: THREE.Vector3; k?: string; goT?: string; soonT?: string };

/** 이름표 (프로토타입 .m3-lv · .m3-tag · .m3-here) */
export type LabelSpec =
  | { kind: 'lv'; title: string; sub: string; st: string }
  | { kind: 'tag'; text: string }
  | { kind: 'min'; num: number; text: string; soon: boolean }
  | { kind: 'here'; text: string };

/** 팔로(내 캐릭터) 자리: s 의 위치 · 크기를 매 프레임 화면 좌표로 바꿔 RN 이 그려요 */
export type Rider = { s: THREE.Object3D | null; w: number; h: number; follow?: () => THREE.Vector3; base?: number };

/** 화면 쪽(React)과 주고받는 것 */
export type Host = {
  gl: ExpoWebGLRenderingContext;
  /** 화면 크기 (CSS px) */
  width: number;
  height: number;
  reduced: boolean;
  /** 맵을 바꿀 때 들어오는 방향 (1 · -1), 처음이면 1 */
  swapDir: number;
  paused: boolean;
  /** 가벼운 그림 (메모리가 적거나 오래된 폰): 그림자 · 안티에일리어싱을 꺼요 */
  lite?: boolean;
  /** 그리다가 오류가 나면 (GL 을 잃음 · 셰이더 실패 등): 그리기를 멈추고 알려요 → 화면은 2D 지도로 바꿔요 */
  onError?: (e: unknown) => void;
  onLabels?: (labels: { spec: LabelSpec }[]) => void;
  /** 이름표 좌표 [x0, y0, x1, y1, …] · 캐릭터 [x, y(발), 높이 px, 좌우(1|-1), 가로 배율, 세로 배율] · 확대 중인지 */
  onFrame?: (labelXY: number[], rider: number[] | null, zoomed: boolean) => void;
  onFocus?: (info: FocusInfo | null) => void;
};

export type StageOpts = { half: number; pos: THREE.Vector3; target: THREE.Vector3; bg: THREE.Texture | THREE.Color; az?: [number, number]; fog?: THREE.Fog };

export type Stage = ReturnType<typeof stage>;

/** expo-gl(폰)에는 없는 pixelStorei 옵션을 three 가 부르면 콘솔에 경고가 쌓여요 → 되는 것만 넘겨요 */
function quietPixelStore(gl: ExpoWebGLRenderingContext) {
  if (Platform.OS === 'web') return;
  const raw = gl.pixelStorei.bind(gl);
  gl.pixelStorei = (p: number, v: number | boolean) => {
    if (p === gl.UNPACK_FLIP_Y_WEBGL || p === gl.UNPACK_ALIGNMENT) raw(p, v as number);
  };
}

export function stage(host: Host, { half, pos, target, bg, az, fog }: StageOpts) {
  const { width: w, height: h } = host;
  let gl = host.gl;
  const web = Platform.OS === 'web';
  /** GL 하나에 three 렌더러 하나. 폰에서 GL 판이 새로 만들어지면(탭을 떠났다 오면) rebind 로 렌더러만 바꿔요 */
  const makeRenderer = (g: ExpoWebGLRenderingContext) => {
    quietPixelStore(g);
    // 웹은 GL 을 만들 때 아직 canvas 크기가 정해지기 전이라 화면 크기 × 화소 비율로 맞춰요 (폰은 GL 버퍼 크기 그대로)
    const bw = web ? Math.round(w * PixelRatio.get()) : g.drawingBufferWidth;
    const bh = web ? Math.round(h * PixelRatio.get()) : g.drawingBufferHeight;
    // three 가 찾는 canvas 모양만 흉내 (폰) · 웹은 진짜 canvas
    const canvas =
      web && (g as unknown as WebGL2RenderingContext).canvas
        ? (g as unknown as WebGL2RenderingContext).canvas
        : ({ width: bw, height: bh, style: {}, clientWidth: w, clientHeight: h, addEventListener: () => {}, removeEventListener: () => {}, getContext: () => g } as unknown as HTMLCanvasElement);
    const nr = new THREE.WebGLRenderer({ canvas, context: g as unknown as WebGL2RenderingContext, antialias: !host.lite });
    nr.setPixelRatio(1);
    nr.setSize(bw, bh, false);
    nr.shadowMap.enabled = !host.lite;
    nr.shadowMap.type = THREE.PCFSoftShadowMap;
    nr.outputColorSpace = THREE.SRGBColorSpace;
    return nr;
  };
  let r = makeRenderer(gl);

  const sc = new THREE.Scene();
  sc.background = bg;
  if (fog) sc.fog = fog;
  const a = h / w;
  const cam = new THREE.OrthographicCamera(-half, half, half * a, -half * a, 0.1, 200);
  cam.position.copy(pos);
  cam.lookAt(target);
  sc.add(new THREE.HemisphereLight(0xffffff, 0xc9b99c, 1.45));
  const d = new THREE.DirectionalLight(0xffffff, 1.9);
  d.position.set(-6, 14, 9);
  d.castShadow = true;
  // 프로토타입 2048 → 폰 성능 때문에 1024 (웹은 그대로)
  const sm = Platform.OS === 'web' ? 2048 : 1024;
  d.shadow.mapSize.set(sm, sm);
  Object.assign(d.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14 });
  d.shadow.bias = -0.0008;
  d.shadow.radius = 3;
  sc.add(d);

  // ---- 카메라 돌리기 (OrbitControls 의 방위각만 · 범위 az) ----
  const tgt = target.clone();
  const sph = new THREE.Spherical().setFromVector3(cam.position.clone().sub(tgt));
  const azMin = az ? az[0] : -Infinity;
  const azMax = az ? az[1] : Infinity;
  sph.phi = Math.min(1.2, Math.max(0.45, sph.phi));
  sph.theta = Math.min(azMax, Math.max(azMin, sph.theta));
  let spin = 0; // 손을 뗀 뒤 남은 회전 (감속)
  const applyOrbit = () => {
    cam.position.setFromSpherical(sph).add(tgt);
    cam.lookAt(tgt);
  };
  applyOrbit();

  const labels: { p: THREE.Vector3; spec: LabelSpec; dy: number }[] = [];
  const ticks: ((t: number) => void)[] = [];
  const v = new THREE.Vector3();
  const label = (p: THREE.Vector3, spec: LabelSpec, dy = 0) => {
    labels.push({ p: p.clone(), spec, dy });
  };

  // ---- 누르면 확대 ----
  const home = tgt.clone();
  const ray = new THREE.Raycaster();
  let tw: { a: THREE.Vector3; b: THREE.Vector3; za: number; zb: number; t: number } | null = null;
  let intro: { t: number; a: number; base?: THREE.Vector3 } | null = host.reduced ? null : { t: 0, a: 0.42 * (host.swapDir || 1) };
  const fly = (to: THREE.Vector3, z: number) => {
    tw = { a: tgt.clone(), b: to.clone(), za: cam.zoom, zb: z, t: 0 };
  };
  const reset = () => {
    host.onFocus?.(null);
    fly(home, 1);
  };
  const focus = (info: FocusInfo) => {
    fly(info.at, 2.3);
    api.onFocus?.(info);
    host.onFocus?.(info);
  };
  /** 화면 좌표(CSS px)를 눌렀을 때 */
  const tap = (x: number, y: number) => {
    ray.setFromCamera(new THREE.Vector2((x / w) * 2 - 1, -(y / h) * 2 + 1), cam);
    const hit = ray.intersectObjects(sc.children, true).find((q) => (q.object as THREE.Mesh).isMesh && (q.object as THREE.Mesh).material !== inkMat);
    let o: THREE.Object3D | null = hit ? hit.object : null;
    while (o && !o.userData.info && !o.userData.bg) o = o.parent;
    if (!hit || (o && o.userData.bg)) return reset();
    if (o && o.userData.info) return focus(o.userData.info as FocusInfo);
    if (cam.zoom > 1.3) return reset();
    host.onFocus?.(null);
    fly(hit.point, 1.8);
  };
  /** 옆으로 끌기: dx(px) 만큼 돌려요 */
  const drag = (dx: number) => {
    sph.theta = Math.min(azMax, Math.max(azMin, sph.theta - (dx / w) * Math.PI));
    spin = -(dx / w) * Math.PI;
  };
  const release = () => {
    spin *= 0.9;
  };

  // ---- 그리기 ----
  let raf = 0;
  let alive = true;
  let lastKey = '';
  let lastZoomed = false;
  const t0 = Date.now();
  const proj = (p: THREE.Vector3): [number, number] => {
    v.copy(p).project(cam);
    return [((v.x + 1) / 2) * w, ((1 - v.y) / 2) * h];
  };
  /** 화면 1 단위가 몇 px (캐릭터 크기) */
  const ppu = () => (h * cam.zoom) / (cam.top - cam.bottom);
  const report = () => {
    if (!host.onFrame) return;
    // 카메라가 움직였을 때만 이름표 좌표를 새로 보내요
    const key = `${cam.position.x.toFixed(3)},${cam.position.y.toFixed(3)},${cam.position.z.toFixed(3)},${cam.zoom.toFixed(3)}`;
    let xy: number[] = [];
    if (key !== lastKey) {
      lastKey = key;
      xy = labels.flatMap(({ p, dy }) => {
        const [x, y] = proj(p);
        return [x, y + dy];
      });
    }
    let rider: number[] | null = null;
    const R = api.rider;
    if (R && R.s) {
      const [x, y] = proj(R.s.position);
      const sx = R.w ? Math.abs(R.s.scale.x) / R.w : 1;
      const sy = R.h ? R.s.scale.y / R.h : 1;
      rider = [x, y, R.h * ppu() * 1.05, R.s.scale.x < 0 ? -1 : 1, sx, sy];
    }
    const zoomed = cam.zoom > 1.5;
    if (zoomed !== lastZoomed) lastZoomed = zoomed;
    host.onFrame(xy, rider, zoomed);
  };
  /**
   * 한 장 그리기. GL 이 끊긴 판(지도를 빠르게 바꿀 때 폰에서 가끔)은 three 안에서 오류가 나요
   * → 앱을 멈추지 않고 이 지도만 그리기를 그만둬요 (바탕색만 남아요 · 다시 들어오면 새로 그려요)
   */
  const render = () => {
    try {
      r.render(sc, cam);
      gl.endFrameEXP();
      return true;
    } catch (e) {
      if (alive) {
        alive = false;
        cancelAnimationFrame(raf);
        if (__DEV__) console.log('[gl] 3D 지도 그리기를 멈췄어요', e);
        host.onError?.(e); // 화면은 2D 지도로 바꿔요
      }
      return false;
    }
  };
  const step = () => {
    if (intro) {
      intro.t = Math.min(1, intro.t + 0.022);
      const k = 1 - Math.pow(1 - intro.t, 4);
      const off = cam.position.clone().sub(tgt);
      const base = intro.base || (intro.base = off.clone());
      off.copy(base).applyAxisAngle(new THREE.Vector3(0, 1, 0), intro.a * (1 - k));
      cam.position.copy(tgt).add(off);
      cam.lookAt(tgt);
      cam.zoom = 0.78 + 0.22 * k;
      cam.updateProjectionMatrix();
      if (intro.t >= 1) intro = null;
    } else {
      if (Math.abs(spin) > 1e-4) {
        sph.theta = Math.min(azMax, Math.max(azMin, sph.theta + spin));
        spin *= 0.9;
      }
      applyOrbit();
    }
    if (tw) {
      tw.t = Math.min(1, tw.t + 0.045);
      const k = 1 - Math.pow(1 - tw.t, 3);
      tgt.lerpVectors(tw.a, tw.b, k);
      if (!intro) applyOrbit();
      cam.zoom = tw.za + (tw.zb - tw.za) * k;
      cam.updateProjectionMatrix();
      if (tw.t >= 1) tw = null;
    }
  };
  const loop = () => {
    if (!alive) return;
    raf = requestAnimationFrame(loop);
    if (host.paused) return;
    try {
      step();
      const t = (Date.now() - t0) / 1000;
      ticks.forEach((f) => f(t));
    } catch (e) {
      // 폰에서 프레임 오류가 그대로 올라가면 앱이 꺼져요 → 여기서 멈추고 화면에 알려요 (2D 지도로)
      alive = false;
      cancelAnimationFrame(raf);
      host.onError?.(e);
      return;
    }
    if (render()) report();
  };
  // 첫 장면 바로 그리기 (인트로 시작 자세 그대로) — 다음 프레임까지 빈 화면이 보이지 않게
  const draw = () => {
    if (intro && !intro.base) {
      const off = cam.position.clone().sub(tgt);
      intro.base = off.clone();
      off.applyAxisAngle(new THREE.Vector3(0, 1, 0), intro.a);
      cam.position.copy(tgt).add(off);
      cam.lookAt(tgt);
      cam.zoom = 0.78;
      cam.updateProjectionMatrix();
    }
    ticks.forEach((f) => f(0));
    host.onLabels?.(labels.map(({ spec }) => ({ spec })));
    if (!render()) return;
    report();
    raf = requestAnimationFrame(loop);
  };
  /**
   * 새 GL 판에 다시 붙이기 (폰: 탭을 떠나면 그리기 판이 사라져요). 장면 · 텍스처 그림은 그대로 두고
   * 렌더러만 새로 만들어요 → 지도를 다시 만들지 않아요 (텍스처는 새 GL 에 다시 올라가요)
   */
  const rebind = (next: ExpoWebGLRenderingContext) => {
    cancelAnimationFrame(raf);
    try {
      r.dispose();
    } catch {
      // 옛 GL 은 이미 사라졌을 수 있어요
    }
    gl = next;
    host.gl = next;
    r = makeRenderer(next);
    alive = true;
    if (!render()) return;
    report();
    raf = requestAnimationFrame(loop);
  };
  /** 닫을 때: 루프 멈추고 GPU 자원 정리 */
  const dispose = () => {
    alive = false;
    cancelAnimationFrame(raf);
    // GL 이 이미 끊겼으면 정리 중에도 오류가 나요 — 닫는 길이라 그냥 넘어가요
    try {
      freeGpu();
    } catch {
      // 판이 사라지면 GPU 자원도 함께 사라져요
    }
  };
  const freeGpu = () => {
    sc.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose?.();
      const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
      mats.forEach((mt) => {
        Object.values(mt).forEach((val) => {
          if (val instanceof THREE.Texture) val.dispose();
        });
        mt.dispose();
      });
    });
    if (sc.background instanceof THREE.Texture) sc.background.dispose();
    r.dispose();
  };

  /**
   * 개발용(웹): 지금 그림을 사진으로 + 이름표 · 정류장 화면 좌표 (2D 지도 사진 만들기 · scripts 참고).
   * 실제 앱에서는 부르지 않아요.
   */
  const snapshot = (type = 'image/webp', quality = 0.9) => {
    r.render(sc, cam);
    const el = r.domElement;
    const infos: FocusInfo[] = [];
    sc.traverse((o) => {
      const it = o.userData.info as FocusInfo | undefined;
      if (it && !infos.some((x) => x.no === it.no)) infos.push(it);
    });
    return {
      img: typeof el.toDataURL === 'function' ? el.toDataURL(type, quality) : '',
      w,
      h,
      ppu: ppu(),
      labels: labels.map((l) => ({ spec: l.spec, dy: l.dy, xy: proj(l.p) })),
      stops: infos.sort((a, b) => a.no - b.no).map((it) => ({ no: it.no, at: [it.at.x, it.at.y, it.at.z] as [number, number, number], xy: proj(it.at) })),
      proj: (x: number, y: number, z: number) => proj(new THREE.Vector3(x, y, z)),
    };
  };

  const api = {
    snapshot,
    sc,
    label,
    ticks,
    focus,
    el: host,
    draw,
    cam,
    proj,
    ppu,
    tap,
    drag,
    release,
    reset,
    rebind,
    dispose,
    onFocus: null as ((info: FocusInfo) => void) | null,
    /** 팔로 캐릭터 (palloRun 이 넣어요) */
    rider: null as Rider | null,
  };
  return api;
}
