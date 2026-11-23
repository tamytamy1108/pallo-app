/**
 * 폰용 작은 2D 그림판 (canvas 2D 의 일부만).
 * 3D 지도의 그림 텍스처(하늘 · 벽돌 · 간판 · 아이콘)는 프로토타입에서 <canvas> 로 그려요. 폰에는 <canvas> 가 없어서,
 * 같은 그리기 명령을 여기서 픽셀로 칠한 뒤 three 의 DataTexture 로 넘겨요. 웹은 진짜 <canvas> 를 써요 (canvas2d.ts).
 * - 되는 것: 사각형 · 경로(선 · 원호 · 타원 · 곡선 · 둥근 사각형) 채우기와 선 긋기, 선형 · 원형 그라데이션, 투명도, 지우기, 이동 · 회전 · 크기, 다른 그림판 붙이기, SVG 경로(Path2D)
 * - 안 되는 것: 글자 (fillText 는 그냥 지나가요 — 간판 글자는 폰에서 비어 보여요)
 * - 메모리 · 속도 때문에 긴 변이 512px 를 넘으면 줄여서 칠해요 (그리는 좌표는 그대로).
 */
import * as THREE from 'three';

type RGBA = [number, number, number, number];
type Pt = [number, number];
type Mat = [number, number, number, number, number, number];
type Paint = string | SoftGradient;

const MAX_SIDE = 512;
const SAMPLES = 4; // 한 줄을 세로로 4번 나눠 재서 가장자리를 부드럽게

/** 그라데이션 색을 픽셀마다 담아 두는 칸 (다시 써요) */
const GRAD_COL = new Float64Array(4);
const NAMED: Record<string, RGBA> = { white: [255, 255, 255, 1], black: [0, 0, 0, 1], transparent: [0, 0, 0, 0], red: [255, 0, 0, 1] };
const colorCache = new Map<string, RGBA>();

/** '#RGB' · '#RRGGBB' · '#RRGGBBAA' · 'rgb()' · 'rgba()' → [r, g, b, a(0~1)] */
export function parseColor(s: string): RGBA {
  const hit = colorCache.get(s);
  if (hit) return hit;
  let c: RGBA = [0, 0, 0, 1];
  const t = s.trim().toLowerCase();
  if (t[0] === '#') {
    const h = t.slice(1);
    const x = h.length <= 4 ? h.split('').map((ch) => ch + ch).join('') : h;
    c = [parseInt(x.slice(0, 2), 16), parseInt(x.slice(2, 4), 16), parseInt(x.slice(4, 6), 16), x.length >= 8 ? parseInt(x.slice(6, 8), 16) / 255 : 1];
  } else if (t.startsWith('rgb')) {
    const n = t.slice(t.indexOf('(') + 1, t.indexOf(')')).split(/[\s,/]+/).filter(Boolean).map(Number);
    c = [n[0], n[1], n[2], n.length > 3 ? n[3] : 1];
  } else if (NAMED[t]) c = NAMED[t];
  colorCache.set(s, c);
  return c;
}

class SoftGradient {
  stops: { o: number; c: RGBA }[] = [];
  constructor(
    readonly kind: 'lin' | 'rad',
    readonly a: number[],
  ) {}
  addColorStop(o: number, color: string) {
    this.stops.push({ o, c: parseColor(color) });
    this.stops.sort((p, q) => p.o - q.o);
  }
  /** 그라데이션 위치 t(0~1)의 색 */
  at(t: number): RGBA {
    const s = this.stops;
    if (!s.length) return [0, 0, 0, 0];
    if (t <= s[0].o) return s[0].c;
    for (let i = 1; i < s.length; i++) {
      if (t <= s[i].o) {
        const p = s[i - 1];
        const q = s[i];
        const f = q.o === p.o ? 1 : (t - p.o) / (q.o - p.o);
        return [p.c[0] + (q.c[0] - p.c[0]) * f, p.c[1] + (q.c[1] - p.c[1]) * f, p.c[2] + (q.c[2] - p.c[2]) * f, p.c[3] + (q.c[3] - p.c[3]) * f];
      }
    }
    return s[s.length - 1].c;
  }
  /** at() 과 같은 색을 out 에 써요 (픽셀마다 배열을 만들지 않게) */
  atInto(t: number, out: Float64Array) {
    const s = this.stops;
    let c: RGBA | null = null;
    if (!s.length) c = [0, 0, 0, 0];
    else if (t <= s[0].o) c = s[0].c;
    else {
      for (let i = 1; i < s.length; i++) {
        if (t <= s[i].o) {
          const p = s[i - 1];
          const q = s[i];
          const f = q.o === p.o ? 1 : (t - p.o) / (q.o - p.o);
          out[0] = p.c[0] + (q.c[0] - p.c[0]) * f;
          out[1] = p.c[1] + (q.c[1] - p.c[1]) * f;
          out[2] = p.c[2] + (q.c[2] - p.c[2]) * f;
          out[3] = p.c[3] + (q.c[3] - p.c[3]) * f;
          return;
        }
      }
      c = s[s.length - 1].c;
    }
    out[0] = c[0];
    out[1] = c[1];
    out[2] = c[2];
    out[3] = c[3];
  }
  /** 사용자 좌표 (x, y) 의 t */
  tAt(x: number, y: number) {
    const a = this.a;
    if (this.kind === 'lin') {
      const dx = a[2] - a[0];
      const dy = a[3] - a[1];
      const L = dx * dx + dy * dy || 1;
      return ((x - a[0]) * dx + (y - a[1]) * dy) / L;
    }
    // 원형: 두 원의 중심이 같다고 보고 (프로토타입은 모두 같은 중심)
    const d = Math.hypot(x - a[3], y - a[4]);
    const r0 = a[2];
    const r1 = a[5];
    return r1 === r0 ? 1 : (d - r0) / (r1 - r0);
  }
}

/** 경로: 여러 조각(subpath), 각 조각은 점 목록 + 닫힘 여부 */
type Sub = { pts: Pt[]; closed: boolean };

/** SVG 경로 글자 → 조각들 (사용자 좌표). Path2D 대신 */
export class SoftPath2D {
  subs: Sub[] = [];
  constructor(d?: string) {
    if (d) this.subs = parseSvgPath(d);
  }
}

type State = {
  m: Mat;
  fillStyle: Paint;
  strokeStyle: Paint;
  lineWidth: number;
  lineCap: string;
  lineJoin: string;
  globalAlpha: number;
  globalCompositeOperation: string;
  font: string;
  textAlign: string;
  textBaseline: string;
};

export class SoftCanvas {
  private w = 300;
  private h = 150;
  /** 실제 칠하는 크기 (줄인 크기) */
  pw = 300;
  ph = 150;
  k = 1;
  px: Uint8ClampedArray = new Uint8ClampedArray(0);
  private ctx: SoftContext | null = null;

  constructor(w = 300, h = 150) {
    this.w = w;
    this.h = h;
    this.alloc();
  }
  get width() {
    return this.w;
  }
  set width(v: number) {
    this.w = v;
    this.alloc();
  }
  get height() {
    return this.h;
  }
  set height(v: number) {
    this.h = v;
    this.alloc();
  }
  private alloc() {
    this.k = Math.min(1, MAX_SIDE / Math.max(this.w, this.h, 1));
    this.pw = Math.max(1, Math.round(this.w * this.k));
    this.ph = Math.max(1, Math.round(this.h * this.k));
    this.px = new Uint8ClampedArray(this.pw * this.ph * 4);
    this.ctx?.reset();
  }
  getContext(_kind?: string) {
    if (!this.ctx) this.ctx = new SoftContext(this);
    return this.ctx;
  }
  /** GL 로 올릴 픽셀 (위아래 뒤집기: 텍스처는 아래 줄부터) */
  glPixels() {
    const out = new Uint8Array(this.px.length);
    const row = this.pw * 4;
    for (let y = 0; y < this.ph; y++) out.set(this.px.subarray(y * row, (y + 1) * row), (this.ph - 1 - y) * row);
    return out;
  }
  /** three 텍스처로 (다시 그린 뒤 needsUpdate = true 하면 새 픽셀이 올라가요) */
  toTexture() {
    const self = this;
    const image = {
      get data() {
        return self.glPixels();
      },
      width: this.pw,
      height: this.ph,
      getContext: (kind?: string) => self.getContext(kind),
    };
    const t = new THREE.DataTexture(null, this.pw, this.ph, THREE.RGBAFormat);
    t.image = image as unknown as typeof t.image;
    t.magFilter = THREE.LinearFilter;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.generateMipmaps = true;
    t.needsUpdate = true;
    return t;
  }
}

export class SoftContext {
  private st: State;
  private stack: State[] = [];
  private path: Sub[] = [];
  private cur: Sub | null = null;
  canvas: SoftCanvas;

  constructor(canvas: SoftCanvas) {
    this.canvas = canvas;
    this.st = this.fresh();
  }
  private fresh(): State {
    const k = this.canvas.k;
    return { m: [k, 0, 0, k, 0, 0], fillStyle: '#000', strokeStyle: '#000', lineWidth: 1, lineCap: 'butt', lineJoin: 'miter', globalAlpha: 1, globalCompositeOperation: 'source-over', font: '10px sans-serif', textAlign: 'start', textBaseline: 'alphabetic' };
  }
  reset() {
    this.st = this.fresh();
    this.stack = [];
    this.path = [];
    this.cur = null;
  }

  // ---- 상태 ----
  get fillStyle() {
    return this.st.fillStyle;
  }
  set fillStyle(v: Paint) {
    this.st.fillStyle = v;
  }
  get strokeStyle() {
    return this.st.strokeStyle;
  }
  set strokeStyle(v: Paint) {
    this.st.strokeStyle = v;
  }
  get lineWidth() {
    return this.st.lineWidth;
  }
  set lineWidth(v: number) {
    this.st.lineWidth = v;
  }
  get lineCap() {
    return this.st.lineCap;
  }
  set lineCap(v: string) {
    this.st.lineCap = v;
  }
  get lineJoin() {
    return this.st.lineJoin;
  }
  set lineJoin(v: string) {
    this.st.lineJoin = v;
  }
  get globalAlpha() {
    return this.st.globalAlpha;
  }
  set globalAlpha(v: number) {
    this.st.globalAlpha = v;
  }
  get globalCompositeOperation() {
    return this.st.globalCompositeOperation;
  }
  set globalCompositeOperation(v: string) {
    this.st.globalCompositeOperation = v;
  }
  get font() {
    return this.st.font;
  }
  set font(v: string) {
    this.st.font = v;
  }
  get textAlign() {
    return this.st.textAlign;
  }
  set textAlign(v: string) {
    this.st.textAlign = v;
  }
  get textBaseline() {
    return this.st.textBaseline;
  }
  set textBaseline(v: string) {
    this.st.textBaseline = v;
  }
  save() {
    this.stack.push({ ...this.st, m: [...this.st.m] as Mat });
  }
  restore() {
    const s = this.stack.pop();
    if (s) this.st = s;
  }

  // ---- 좌표 변환 ----
  transform(a: number, b: number, c: number, d: number, e: number, f: number) {
    const m = this.st.m;
    this.st.m = [m[0] * a + m[2] * b, m[1] * a + m[3] * b, m[0] * c + m[2] * d, m[1] * c + m[3] * d, m[0] * e + m[2] * f + m[4], m[1] * e + m[3] * f + m[5]];
  }
  setTransform(a: number, b: number, c: number, d: number, e: number, f: number) {
    const k = this.canvas.k;
    this.st.m = [a * k, b * k, c * k, d * k, e * k, f * k];
  }
  resetTransform() {
    this.setTransform(1, 0, 0, 1, 0, 0);
  }
  translate(x: number, y: number) {
    this.transform(1, 0, 0, 1, x, y);
  }
  scale(x: number, y: number) {
    this.transform(x, 0, 0, y, 0, 0);
  }
  rotate(a: number) {
    const c = Math.cos(a);
    const s = Math.sin(a);
    this.transform(c, s, -s, c, 0, 0);
  }
  private tp(x: number, y: number): Pt {
    const m = this.st.m;
    return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
  }
  /** 지금 변환에서 1 만큼이 몇 픽셀인지 (선 굵기 · 곡선 나눌 개수) */
  private unit() {
    const m = this.st.m;
    return Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2])) || 1;
  }

  // ---- 경로 ----
  beginPath() {
    this.path = [];
    this.cur = null;
  }
  moveTo(x: number, y: number) {
    this.cur = { pts: [this.tp(x, y)], closed: false };
    this.path.push(this.cur);
  }
  lineTo(x: number, y: number) {
    if (!this.cur) this.moveTo(x, y);
    else this.cur.pts.push(this.tp(x, y));
  }
  closePath() {
    if (!this.cur) return;
    this.cur.closed = true;
    const first = this.cur.pts[0];
    this.cur = { pts: [first], closed: false };
    this.path.push(this.cur);
  }
  rect(x: number, y: number, w: number, h: number) {
    this.moveTo(x, y);
    this.lineTo(x + w, y);
    this.lineTo(x + w, y + h);
    this.lineTo(x, y + h);
    this.closePath();
  }
  private lastUser(): Pt | null {
    // 사용자 좌표의 마지막 점 (곡선 시작점) — 변환을 거꾸로 풀어요
    const p = this.cur?.pts[this.cur.pts.length - 1];
    if (!p) return null;
    return this.inv(p[0], p[1]);
  }
  private inv(x: number, y: number): Pt {
    const m = this.st.m;
    const det = m[0] * m[3] - m[1] * m[2] || 1;
    const dx = x - m[4];
    const dy = y - m[5];
    return [(m[3] * dx - m[2] * dy) / det, (-m[1] * dx + m[0] * dy) / det];
  }
  quadraticCurveTo(cx: number, cy: number, x: number, y: number) {
    const p0 = this.lastUser() ?? [cx, cy];
    const n = this.segs(Math.hypot(cx - p0[0], cy - p0[1]) + Math.hypot(x - cx, y - cy));
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      const u = 1 - t;
      this.lineTo(u * u * p0[0] + 2 * u * t * cx + t * t * x, u * u * p0[1] + 2 * u * t * cy + t * t * y);
    }
  }
  bezierCurveTo(c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number) {
    const p0 = this.lastUser() ?? [c1x, c1y];
    const n = this.segs(Math.hypot(c1x - p0[0], c1y - p0[1]) + Math.hypot(c2x - c1x, c2y - c1y) + Math.hypot(x - c2x, y - c2y));
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      const u = 1 - t;
      this.lineTo(u * u * u * p0[0] + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * x, u * u * u * p0[1] + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * y);
    }
  }
  private segs(len: number) {
    return Math.max(4, Math.min(64, Math.ceil((len * this.unit()) / 3)));
  }
  arc(x: number, y: number, r: number, a0: number, a1: number, ccw = false) {
    this.ellipse(x, y, r, r, 0, a0, a1, ccw);
  }
  ellipse(x: number, y: number, rx: number, ry: number, rot: number, a0: number, a1: number, ccw = false) {
    let sweep = a1 - a0;
    const TAU = Math.PI * 2;
    if (!ccw && sweep >= TAU) sweep = TAU;
    else if (ccw && -sweep >= TAU) sweep = -TAU;
    else {
      if (!ccw && sweep < 0) sweep = (sweep % TAU) + TAU;
      if (ccw && sweep > 0) sweep = (sweep % TAU) - TAU;
    }
    const n = Math.max(8, Math.min(96, Math.ceil((Math.abs(sweep) * Math.max(rx, ry) * this.unit()) / 3)));
    const cr = Math.cos(rot);
    const sr = Math.sin(rot);
    for (let i = 0; i <= n; i++) {
      const a = a0 + (sweep * i) / n;
      const ex = Math.cos(a) * rx;
      const ey = Math.sin(a) * ry;
      const px = x + ex * cr - ey * sr;
      const py = y + ex * sr + ey * cr;
      if (i === 0 && !this.cur) this.moveTo(px, py);
      else this.lineTo(px, py);
    }
  }
  roundRect(x: number, y: number, w: number, h: number, r: number | number[] = 0) {
    const rr = Array.isArray(r) ? r : [r];
    const [tl, tr, br, bl] = rr.length === 1 ? [rr[0], rr[0], rr[0], rr[0]] : rr.length === 2 ? [rr[0], rr[1], rr[0], rr[1]] : rr.length === 3 ? [rr[0], rr[1], rr[2], rr[1]] : rr;
    const lim = (v: number) => Math.max(0, Math.min(v, Math.abs(w) / 2, Math.abs(h) / 2));
    const H = Math.PI / 2;
    this.moveTo(x + lim(tl), y);
    this.lineTo(x + w - lim(tr), y);
    this.ellipse(x + w - lim(tr), y + lim(tr), lim(tr), lim(tr), 0, -H, 0);
    this.lineTo(x + w, y + h - lim(br));
    this.ellipse(x + w - lim(br), y + h - lim(br), lim(br), lim(br), 0, 0, H);
    this.lineTo(x + lim(bl), y + h);
    this.ellipse(x + lim(bl), y + h - lim(bl), lim(bl), lim(bl), 0, H, Math.PI);
    this.lineTo(x, y + lim(tl));
    this.ellipse(x + lim(tl), y + lim(tl), lim(tl), lim(tl), 0, Math.PI, Math.PI + H);
    this.closePath();
  }

  // ---- 칠하기 ----
  fill(p?: SoftPath2D | string) {
    const subs = p instanceof SoftPath2D ? this.userSubs(p) : this.path;
    this.raster(subs, this.st.fillStyle);
  }
  stroke(p?: SoftPath2D) {
    const subs = p instanceof SoftPath2D ? this.userSubs(p) : this.path;
    this.raster(this.outline(subs), this.st.strokeStyle);
  }
  fillRect(x: number, y: number, w: number, h: number) {
    const m = this.st.m;
    if (m[1] === 0 && m[2] === 0) {
      const [ax, ay] = this.tp(x, y);
      const [bx, by] = this.tp(x + w, y + h);
      this.rectFast(Math.min(ax, bx), Math.min(ay, by), Math.max(ax, bx), Math.max(ay, by), this.st.fillStyle, false);
      return;
    }
    const keep = this.path;
    this.path = [];
    this.rect(x, y, w, h);
    this.raster(this.path, this.st.fillStyle);
    this.path = keep;
  }
  strokeRect(x: number, y: number, w: number, h: number) {
    const keep = this.path;
    this.path = [];
    this.rect(x, y, w, h);
    this.stroke();
    this.path = keep;
  }
  clearRect(x: number, y: number, w: number, h: number) {
    const [ax, ay] = this.tp(x, y);
    const [bx, by] = this.tp(x + w, y + h);
    this.rectFast(Math.min(ax, bx), Math.min(ay, by), Math.max(ax, bx), Math.max(ay, by), '#000', true);
  }
  createLinearGradient(x0: number, y0: number, x1: number, y1: number) {
    return new SoftGradient('lin', [x0, y0, x1, y1]);
  }
  createRadialGradient(x0: number, y0: number, r0: number, x1: number, y1: number, r1: number) {
    return new SoftGradient('rad', [x0, y0, r0, x1, y1, r1]);
  }
  /** 글자는 폰에서 그리지 않아요 (글꼴을 칠할 방법이 없어서) */
  fillText() {}
  strokeText() {}
  measureText(s: string) {
    const fs = Number(/(\d+(?:\.\d+)?)px/.exec(this.st.font)?.[1] ?? 10);
    return { width: String(s).length * fs * 0.56 };
  }
  setLineDash() {}
  drawImage(src: SoftCanvas, dx: number, dy: number, dw?: number, dh?: number) {
    if (!(src instanceof SoftCanvas)) return;
    const w = dw ?? src.width;
    const h = dh ?? src.height;
    const [ax, ay] = this.tp(dx, dy);
    const [bx, by] = this.tp(dx + w, dy + h);
    const x0 = Math.max(0, Math.floor(Math.min(ax, bx)));
    const x1 = Math.min(this.canvas.pw, Math.ceil(Math.max(ax, bx)));
    const y0 = Math.max(0, Math.floor(Math.min(ay, by)));
    const y1 = Math.min(this.canvas.ph, Math.ceil(Math.max(ay, by)));
    const sx = (src.pw / (bx - ax || 1)) * 1;
    const sy = src.ph / (by - ay || 1);
    for (let y = y0; y < y1; y++) {
      const v = Math.floor((y + 0.5 - ay) * sy);
      if (v < 0 || v >= src.ph) continue;
      for (let x = x0; x < x1; x++) {
        const u = Math.floor((x + 0.5 - ax) * sx);
        if (u < 0 || u >= src.pw) continue;
        const i = (v * src.pw + u) * 4;
        const a = (src.px[i + 3] / 255) * this.st.globalAlpha;
        if (a > 0) this.blend((y * this.canvas.pw + x) * 4, src.px[i], src.px[i + 1], src.px[i + 2], a);
      }
    }
  }

  /** Path2D(사용자 좌표) → 지금 변환을 적용한 조각들 */
  private userSubs(p: SoftPath2D): Sub[] {
    return p.subs.map((s) => ({ closed: s.closed, pts: s.pts.map(([x, y]) => this.tp(x, y)) }));
  }

  /** 선 → 채울 모양 (마디마다 사각형 + 꺾이는 곳 · 끝은 둥글게). 모두 같은 방향으로 돌려 겹쳐도 한 번만 칠해져요 */
  private outline(subs: Sub[]): Sub[] {
    const hw = (this.st.lineWidth * this.unit()) / 2;
    const out: Sub[] = [];
    const round = this.st.lineJoin === 'round' || this.st.lineCap === 'round';
    const disc = (c: Pt) => {
      const n = Math.max(8, Math.min(32, Math.ceil(hw * 2)));
      const pts: Pt[] = [];
      for (let i = 0; i < n; i++) pts.push([c[0] + Math.cos((i / n) * Math.PI * 2) * hw, c[1] + Math.sin((i / n) * Math.PI * 2) * hw]);
      out.push({ pts, closed: true });
    };
    for (const s of subs) {
      const pts = s.closed ? [...s.pts, s.pts[0]] : s.pts;
      if (pts.length < 2) continue;
      for (let i = 0; i < pts.length - 1; i++) {
        let [ax, ay] = pts[i];
        let [bx, by] = pts[i + 1];
        const L = Math.hypot(bx - ax, by - ay);
        if (L < 1e-6) continue;
        const nx = (-(by - ay) / L) * hw;
        const ny = ((bx - ax) / L) * hw;
        if (this.st.lineCap === 'square' && !s.closed) {
          const ex = ((bx - ax) / L) * hw;
          const ey = ((by - ay) / L) * hw;
          if (i === 0) {
            ax -= ex;
            ay -= ey;
          }
          if (i === pts.length - 2) {
            bx += ex;
            by += ey;
          }
        }
        out.push({ pts: [[ax + nx, ay + ny], [bx + nx, by + ny], [bx - nx, by - ny], [ax - nx, ay - ny]], closed: true });
        // 꺾이는 곳: 둥근 이음 (miter 도 작은 원으로 메워요 — 틈이 안 보이게)
        if (i > 0 || s.closed) disc(pts[i]);
      }
      if (round && !s.closed) {
        disc(pts[0]);
        disc(pts[pts.length - 1]);
      }
    }
    // 모두 같은 방향(시계 방향)으로
    for (const s of out) {
      let area = 0;
      for (let i = 0; i < s.pts.length; i++) {
        const [x1, y1] = s.pts[i];
        const [x2, y2] = s.pts[(i + 1) % s.pts.length];
        area += x1 * y2 - x2 * y1;
      }
      if (area < 0) s.pts.reverse();
    }
    return out;
  }

  /**
   * 모양 칠하기 (nonzero 규칙 · 세로 4번 재서 가장자리 부드럽게).
   * 빠르게: 줄마다 그 줄에 걸친 변만 보고(위에서부터 차례로 넣고 지난 변은 빼요), 교차점은 다시 쓰는 배열에 모아요.
   */
  private raster(subs: Sub[], paint: Paint) {
    const W = this.canvas.pw;
    const H = this.canvas.ph;
    let total = 0;
    for (const s of subs) if (s.pts.length >= 2) total += s.pts.length;
    if (!total) return;
    // 변 하나 = x1 y1 x2 y2 dir top bot (원래 방향 그대로 · 교차점 계산식도 같아요)
    const E = new Float64Array(total * 7);
    let n = 0;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const s of subs) {
      const len = s.pts.length;
      if (len < 2) continue;
      for (let i = 0; i < len; i++) {
        const p1 = s.pts[i];
        const p2 = s.pts[(i + 1) % len];
        const y1 = p1[1];
        const y2 = p2[1];
        if (y1 === y2) continue;
        const top = y1 < y2 ? y1 : y2;
        const bot = y1 < y2 ? y2 : y1;
        const o = n * 7;
        E[o] = p1[0];
        E[o + 1] = y1;
        E[o + 2] = p2[0];
        E[o + 3] = y2;
        E[o + 4] = y2 > y1 ? 1 : -1;
        E[o + 5] = top;
        E[o + 6] = bot;
        n++;
        if (top < minY) minY = top;
        if (bot > maxY) maxY = bot;
      }
    }
    if (!n) return;
    const y0 = Math.max(0, Math.floor(minY));
    const y1 = Math.min(H, Math.ceil(maxY));
    if (y1 <= y0) return;
    // 위쪽 끝 순서
    const order = new Int32Array(n);
    for (let i = 0; i < n; i++) order[i] = i;
    order.sort((a, b) => E[a * 7 + 5] - E[b * 7 + 5]);
    const active = new Int32Array(n);
    let na = 0;
    let next = 0;
    const cx = new Float64Array(n);
    const cd = new Int8Array(n);
    const cov = new Float32Array(W + 1);
    const b = this.brush(paint);
    for (let y = y0; y < y1; y++) {
      // 이 줄(y ~ y+1)에 걸친 변만
      while (next < n && E[order[next] * 7 + 5] < y + 1) active[na++] = order[next++];
      let k2 = 0;
      for (let i = 0; i < na; i++) if (E[active[i] * 7 + 6] > y) active[k2++] = active[i];
      na = k2;
      if (!na) continue;
      cov.fill(0);
      let lo = W;
      let hi = 0;
      for (let k = 0; k < SAMPLES; k++) {
        const sy = y + (k + 0.5) / SAMPLES;
        let m = 0;
        for (let i = 0; i < na; i++) {
          const o = active[i] * 7;
          const ay = E[o + 1];
          const by = E[o + 3];
          if ((sy >= ay && sy < by) || (sy >= by && sy < ay)) {
            const ax = E[o];
            const x = ax + ((sy - ay) / (by - ay)) * (E[o + 2] - ax);
            const d = E[o + 4];
            // x 순서로 끼워 넣기 (교차점은 몇 개뿐이라 이게 빨라요)
            let j = m - 1;
            while (j >= 0 && cx[j] > x) {
              cx[j + 1] = cx[j];
              cd[j + 1] = cd[j];
              j--;
            }
            cx[j + 1] = x;
            cd[j + 1] = d;
            m++;
          }
        }
        if (m < 2) continue;
        let wind = 0;
        for (let i = 0; i < m - 1; i++) {
          wind += cd[i];
          if (wind === 0) continue;
          const xa = Math.max(0, cx[i]);
          const xb = Math.min(W, cx[i + 1]);
          if (xb <= xa) continue;
          const ia = Math.floor(xa);
          const ib = Math.floor(xb);
          if (ia < lo) lo = ia;
          if (ib > hi) hi = ib;
          if (ia === ib) cov[ia] += (xb - xa) / SAMPLES;
          else {
            cov[ia] += (ia + 1 - xa) / SAMPLES;
            for (let x = ia + 1; x < ib; x++) cov[x] += 1 / SAMPLES;
            if (ib < W) cov[ib] += (xb - ib) / SAMPLES;
          }
        }
      }
      const end = Math.min(hi, W - 1);
      for (let x = lo; x <= end; x++) {
        const c = Math.min(1, cov[x]);
        if (c > 0.002) this.put(x, y, c, b);
      }
    }
  }

  /** 축에 나란한 사각형: 가장자리 픽셀은 덮인 넓이만큼 */
  private rectFast(ax: number, ay: number, bx: number, by: number, paint: Paint, clear: boolean) {
    const W = this.canvas.pw;
    const H = this.canvas.ph;
    const x0 = Math.max(0, Math.floor(ax));
    const x1 = Math.min(W, Math.ceil(bx));
    const y0 = Math.max(0, Math.floor(ay));
    const y1 = Math.min(H, Math.ceil(by));
    const b = clear ? null : this.brush(paint);
    const px = this.canvas.px;
    if (b && b.solid && !b.erase) {
      // 단색 사각형: put() 과 같은 계산을 함수 부르지 않고 바로 (작은 사각형 수천 개를 칠하는 지도가 있어요)
      const col = b.solid;
      const alpha = b.alpha;
      for (let y = y0; y < y1; y++) {
        const cy = Math.min(y + 1, by) - Math.max(y, ay);
        if (cy <= 0) continue;
        let i = (y * W + x0) * 4;
        for (let x = x0; x < x1; x++, i += 4) {
          const cx = Math.min(x + 1, bx) - Math.max(x, ax);
          if (cx <= 0) continue;
          const a = col[3] * Math.min(1, cx * cy) * alpha;
          if (a <= 0) continue;
          if (a === 1) {
            px[i] = col[0];
            px[i + 1] = col[1];
            px[i + 2] = col[2];
            px[i + 3] = 255;
          } else this.blend(i, col[0], col[1], col[2], a);
        }
      }
      return;
    }
    if (b && b.grad && !b.erase) {
      // 그라데이션 사각형 (하늘 · 바닥 · 빛): put() 과 같은 계산을 바로. 세로 선형 + 회전 없음이면 한 줄은 같은 색이라 줄마다 한 번만 재요
      const g = b.grad;
      const A = g.a;
      const rowConst = g.kind === 'lin' && A[2] - A[0] === 0 && b.m1 === 0 && b.m2 === 0;
      const col = GRAD_COL;
      const alpha = b.alpha;
      for (let y = y0; y < y1; y++) {
        const cy = Math.min(y + 1, by) - Math.max(y, ay);
        if (cy <= 0) continue;
        let ready = false;
        let i = (y * W + x0) * 4;
        for (let x = x0; x < x1; x++, i += 4) {
          const cx = Math.min(x + 1, bx) - Math.max(x, ax);
          if (cx <= 0) continue;
          if (!rowConst || !ready) {
            const dx = x + 0.5 - b.m4;
            const dy = y + 0.5 - b.m5;
            const ux = (b.m3 * dx - b.m2 * dy) / b.det;
            const uy = (-b.m1 * dx + b.m0 * dy) / b.det;
            g.atInto(Math.max(0, Math.min(1, g.tAt(ux, uy))), col);
            ready = true;
          }
          const a = col[3] * Math.min(1, cx * cy) * alpha;
          if (a <= 0) continue;
          if (a === 1) {
            px[i] = col[0];
            px[i + 1] = col[1];
            px[i + 2] = col[2];
            px[i + 3] = 255;
          } else this.blend(i, col[0], col[1], col[2], a);
        }
      }
      return;
    }
    for (let y = y0; y < y1; y++) {
      const cy = Math.min(y + 1, by) - Math.max(y, ay);
      if (cy <= 0) continue;
      for (let x = x0; x < x1; x++) {
        const cx = Math.min(x + 1, bx) - Math.max(x, ax);
        if (cx <= 0) continue;
        const c = Math.min(1, cx * cy);
        if (b) this.put(x, y, c, b);
        else {
          const i = (y * W + x) * 4;
          px[i + 3] = px[i + 3] * (1 - c);
        }
      }
    }
  }

  /** 한 번 칠하는 동안 바뀌지 않는 것: 색(또는 그라데이션 + 거꾸로 변환) · 투명도 · 섞는 방식 */
  private brush(paint: Paint): Brush {
    const m = this.st.m;
    return {
      solid: typeof paint === 'string' ? parseColor(paint) : null,
      grad: typeof paint === 'string' ? null : paint,
      m0: m[0],
      m1: m[1],
      m2: m[2],
      m3: m[3],
      m4: m[4],
      m5: m[5],
      det: m[0] * m[3] - m[1] * m[2] || 1,
      alpha: this.st.globalAlpha,
      erase: this.st.globalCompositeOperation === 'destination-out',
    };
  }

  /** 픽셀 하나에 칠 (덮임 c) */
  private put(x: number, y: number, c: number, b: Brush) {
    let col: RGBA | Float64Array;
    if (b.solid) col = b.solid;
    else {
      // inv() 와 같은 계산 (배열을 만들지 않게 풀어 썼어요)
      const dx = x + 0.5 - b.m4;
      const dy = y + 0.5 - b.m5;
      const ux = (b.m3 * dx - b.m2 * dy) / b.det;
      const uy = (-b.m1 * dx + b.m0 * dy) / b.det;
      const g = b.grad as SoftGradient;
      g.atInto(Math.max(0, Math.min(1, g.tAt(ux, uy))), GRAD_COL);
      col = GRAD_COL;
    }
    const a = col[3] * c * b.alpha;
    if (a <= 0) return;
    const i = (y * this.canvas.pw + x) * 4;
    const p = this.canvas.px;
    if (b.erase) {
      p[i + 3] = p[i + 3] * (1 - a);
      return;
    }
    if (a === 1) {
      // 다 덮는 불투명 칠: 섞기 결과가 새 색 그대로예요
      p[i] = col[0];
      p[i + 1] = col[1];
      p[i + 2] = col[2];
      p[i + 3] = 255;
      return;
    }
    this.blend(i, col[0], col[1], col[2], a);
  }

  /** source-over 섞기 (곱하지 않은 색으로 보관) */
  private blend(i: number, r: number, g: number, b: number, a: number) {
    const p = this.canvas.px;
    const da = p[i + 3] / 255;
    const oa = a + da * (1 - a);
    if (oa <= 0) return;
    p[i] = (r * a + p[i] * da * (1 - a)) / oa;
    p[i + 1] = (g * a + p[i + 1] * da * (1 - a)) / oa;
    p[i + 2] = (b * a + p[i + 2] * da * (1 - a)) / oa;
    p[i + 3] = oa * 255;
  }
}

type Brush = {
  solid: RGBA | null;
  grad: SoftGradient | null;
  m0: number;
  m1: number;
  m2: number;
  m3: number;
  m4: number;
  m5: number;
  det: number;
  alpha: number;
  erase: boolean;
};

// ---- SVG 경로 읽기 (M L H V C S Q T A Z, 소문자 = 상대 좌표) ----
function parseSvgPath(d: string): Sub[] {
  const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) ?? [];
  const subs: Sub[] = [];
  let cur: Sub | null = null;
  let x = 0;
  let y = 0;
  let sx = 0;
  let sy = 0;
  let cmd = '';
  let lc: Pt | null = null; // 마지막 조절점 (S · T 용)
  let i = 0;
  const num = () => Number(tokens[i++]);
  const line = (nx: number, ny: number) => {
    if (!cur) {
      cur = { pts: [[x, y]], closed: false };
      subs.push(cur);
    }
    cur.pts.push([nx, ny]);
    x = nx;
    y = ny;
  };
  const curve = (pts: (t: number) => Pt, n = 12) => {
    for (let k = 1; k <= n; k++) {
      const [px, py] = pts(k / n);
      line(px, py);
    }
  };
  while (i < tokens.length) {
    if (/[a-zA-Z]/.test(tokens[i])) cmd = tokens[i++];
    const rel = cmd === cmd.toLowerCase();
    const ox = rel ? x : 0;
    const oy = rel ? y : 0;
    switch (cmd.toUpperCase()) {
      case 'M': {
        const nx = num() + ox;
        const ny = num() + oy;
        cur = { pts: [[nx, ny]], closed: false };
        subs.push(cur);
        x = sx = nx;
        y = sy = ny;
        cmd = rel ? 'l' : 'L';
        lc = null;
        break;
      }
      case 'L':
        line(num() + ox, num() + oy);
        lc = null;
        break;
      case 'H':
        line(num() + ox, y);
        lc = null;
        break;
      case 'V':
        line(x, num() + oy);
        lc = null;
        break;
      case 'C': {
        const x0 = x;
        const y0 = y;
        const c1: Pt = [num() + ox, num() + oy];
        const c2: Pt = [num() + ox, num() + oy];
        const e: Pt = [num() + ox, num() + oy];
        curve((t) => cubic([x0, y0], c1, c2, e, t));
        lc = c2;
        break;
      }
      case 'S': {
        const x0 = x;
        const y0 = y;
        const c1: Pt = lc ? [2 * x0 - lc[0], 2 * y0 - lc[1]] : [x0, y0];
        const c2: Pt = [num() + ox, num() + oy];
        const e: Pt = [num() + ox, num() + oy];
        curve((t) => cubic([x0, y0], c1, c2, e, t));
        lc = c2;
        break;
      }
      case 'Q': {
        const x0 = x;
        const y0 = y;
        const c: Pt = [num() + ox, num() + oy];
        const e: Pt = [num() + ox, num() + oy];
        curve((t) => quad([x0, y0], c, e, t));
        lc = c;
        break;
      }
      case 'T': {
        const x0 = x;
        const y0 = y;
        const c: Pt = lc ? [2 * x0 - lc[0], 2 * y0 - lc[1]] : [x0, y0];
        const e: Pt = [num() + ox, num() + oy];
        curve((t) => quad([x0, y0], c, e, t));
        lc = c;
        break;
      }
      case 'A': {
        const rx = num();
        const ry = num();
        const rot = (num() * Math.PI) / 180;
        const large = num();
        const sweep = num();
        const ex = num() + ox;
        const ey = num() + oy;
        arcTo(x, y, rx, ry, rot, large, sweep, ex, ey).forEach(([px, py]) => line(px, py));
        lc = null;
        break;
      }
      case 'Z':
        if (cur) cur.closed = true;
        x = sx;
        y = sy;
        cur = null;
        lc = null;
        break;
      default:
        i++;
    }
  }
  return subs;
}

const quad = (p: Pt, c: Pt, e: Pt, t: number): Pt => {
  const u = 1 - t;
  return [u * u * p[0] + 2 * u * t * c[0] + t * t * e[0], u * u * p[1] + 2 * u * t * c[1] + t * t * e[1]];
};
const cubic = (p: Pt, c1: Pt, c2: Pt, e: Pt, t: number): Pt => {
  const u = 1 - t;
  return [u * u * u * p[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * e[0], u * u * u * p[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * e[1]];
};

/** SVG 원호(끝점 표기) → 점들 */
function arcTo(x1: number, y1: number, rx: number, ry: number, phi: number, large: number, sweep: number, x2: number, y2: number): Pt[] {
  if (!rx || !ry) return [[x2, y2]];
  const cp = Math.cos(phi);
  const sp = Math.sin(phi);
  const dx = (x1 - x2) / 2;
  const dy = (y1 - y2) / 2;
  const x1p = cp * dx + sp * dy;
  const y1p = -sp * dx + cp * dy;
  let rxa = Math.abs(rx);
  let rya = Math.abs(ry);
  const lam = (x1p * x1p) / (rxa * rxa) + (y1p * y1p) / (rya * rya);
  if (lam > 1) {
    rxa *= Math.sqrt(lam);
    rya *= Math.sqrt(lam);
  }
  const num = rxa * rxa * rya * rya - rxa * rxa * y1p * y1p - rya * rya * x1p * x1p;
  const den = rxa * rxa * y1p * y1p + rya * rya * x1p * x1p;
  const co = (large === sweep ? -1 : 1) * Math.sqrt(Math.max(0, num / (den || 1)));
  const cxp = (co * rxa * y1p) / rya;
  const cyp = (-co * rya * x1p) / rxa;
  const cx = cp * cxp - sp * cyp + (x1 + x2) / 2;
  const cy = sp * cxp + cp * cyp + (y1 + y2) / 2;
  const ang = (ux: number, uy: number, vx: number, vy: number) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
  const t1 = ang(1, 0, (x1p - cxp) / rxa, (y1p - cyp) / rya);
  let dt = ang((x1p - cxp) / rxa, (y1p - cyp) / rya, (-x1p - cxp) / rxa, (-y1p - cyp) / rya);
  if (!sweep && dt > 0) dt -= Math.PI * 2;
  if (sweep && dt < 0) dt += Math.PI * 2;
  const n = Math.max(4, Math.ceil(Math.abs(dt) / 0.2));
  const out: Pt[] = [];
  for (let k = 1; k <= n; k++) {
    const t = t1 + (dt * k) / n;
    const ex = rxa * Math.cos(t);
    const ey = rya * Math.sin(t);
    out.push([cp * ex - sp * ey + cx, sp * ex + cp * ey + cy]);
  }
  return out;
}
