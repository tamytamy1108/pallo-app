/**
 * soft-canvas 그림 결과 지키기: 정해진 그리기 묶음의 픽셀 해시가 그대로인지 봐요.
 * 해시는 빠르게 고치기 전 구현과 픽셀까지 같은 걸 확인하고 적어 둔 값이에요 — 그림이 바뀌면 이 테스트가 알려줘요.
 */
import { SoftCanvas, SoftPath2D } from "../soft-canvas";

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
const COLORS = [
  "#e33",
  "#3a7bd5",
  "rgba(20,200,90,0.5)",
  "#ffcc00",
  "rgba(0,0,0,0.25)",
  "#fff",
  "#123456",
];
const PATHS = [
  "M2 13l8-2 4-8h2l-2 8 6 1 2-2h1l-1 4 1 4h-1l-2-2-6 1 2 8h-2l-4-8-8-2z",
  "M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3",
  "M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z",
];

function scene(C: any, P: any, seed: number, w: number, h: number) {
  const r = rng(seed);
  const c = new C(w, h);
  const g = c.getContext("2d");
  const sub = new C(40, 30);
  const sg = sub.getContext("2d");
  sg.fillStyle = "#c0ffee";
  sg.fillRect(0, 0, 40, 30);
  sg.fillStyle = "rgba(200,0,0,0.6)";
  sg.beginPath();
  sg.arc(20, 15, 12, 0, Math.PI * 2);
  sg.fill();
  for (let k = 0; k < 60; k++) {
    const op = Math.floor(r() * 10);
    g.save();
    if (r() < 0.3) g.translate(r() * w * 0.3, r() * h * 0.3);
    if (r() < 0.2) g.rotate(r() * 1.2 - 0.6);
    if (r() < 0.2) g.scale(0.5 + r(), 0.5 + r());
    g.globalAlpha = r() < 0.3 ? r() : 1;
    g.globalCompositeOperation = r() < 0.08 ? "destination-out" : "source-over";
    if (r() < 0.25) {
      const gk = r();
      const lg =
        gk < 0.33
          ? g.createLinearGradient(0, 0, w * r(), h * r())
          : gk < 0.66
            ? g.createLinearGradient(0, h * r() * 0.3, 0, h * (0.5 + r() * 0.5))
            : g.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w * 0.6);
      lg.addColorStop(0, COLORS[Math.floor(r() * COLORS.length)]);
      lg.addColorStop(0.5 + r() * 0.4, COLORS[Math.floor(r() * COLORS.length)]);
      lg.addColorStop(1, COLORS[Math.floor(r() * COLORS.length)]);
      g.fillStyle = lg;
      g.strokeStyle = lg;
    } else {
      g.fillStyle = COLORS[Math.floor(r() * COLORS.length)];
      g.strokeStyle = COLORS[Math.floor(r() * COLORS.length)];
    }
    g.lineWidth = 0.5 + r() * 6;
    g.lineCap = ["butt", "round", "square"][Math.floor(r() * 3)];
    g.lineJoin = r() < 0.5 ? "round" : "miter";
    const x = r() * w,
      y = r() * h,
      ww = r() * w * 0.6,
      hh = r() * h * 0.6;
    if (op === 0) g.fillRect(x, y, ww, hh);
    else if (op === 1) g.clearRect(x, y, ww * 0.5, hh * 0.5);
    else if (op === 2) g.strokeRect(x, y, ww, hh);
    else if (op === 3) {
      g.beginPath();
      g.arc(x, y, 3 + r() * 40, 0, Math.PI * 2 * r());
      if (r() < 0.5) g.fill();
      else g.stroke();
    } else if (op === 4) {
      g.beginPath();
      g.moveTo(x, y);
      for (let i = 0; i < 6; i++) g.lineTo(r() * w, r() * h);
      g.closePath();
      if (r() < 0.6) g.fill();
      else g.stroke();
    } else if (op === 5) {
      g.beginPath();
      g.moveTo(x, y);
      g.bezierCurveTo(r() * w, r() * h, r() * w, r() * h, r() * w, r() * h);
      g.quadraticCurveTo(r() * w, r() * h, r() * w, r() * h);
      if (r() < 0.5) g.fill();
      else g.stroke();
    } else if (op === 6) {
      g.beginPath();
      g.ellipse(x, y, 5 + r() * 30, 5 + r() * 20, r() * 3, 0, Math.PI * 2);
      g.fill();
    } else if (op === 7) {
      g.beginPath();
      g.roundRect(x, y, ww, hh, r() * 12);
      if (r() < 0.5) g.fill();
      else g.stroke();
    } else if (op === 8) {
      g.translate(x, y);
      g.scale(1 + r() * 3, 1 + r() * 3);
      const p = new P(PATHS[Math.floor(r() * PATHS.length)]);
      if (r() < 0.5) g.fill(p);
      else g.stroke(p);
    } else g.drawImage(sub, x, y, 20 + r() * 60, 15 + r() * 40);
    g.restore();
  }
  return c.px as Uint8ClampedArray;
}

function fnv(px: Uint8ClampedArray) {
  let h = 0x811c9dc5;
  for (let i = 0; i < px.length; i++) {
    h ^= px[i];
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16);
}

/** 빠르게 고치기 전 구현으로 잰 값 (지금 구현과 같아요) */
const HASH: Record<string, string> = {
  "64x64:1": "235c9f38",
  "256x512:42": "670d626a",
  "300x150:7": "bec3bb23",
  "128x160:2024": "2321529b",
};

const CASES: [number, number, number][] = [
  [64, 64, 1],
  [256, 512, 42],
  [300, 150, 7],
  [128, 160, 2024],
];

describe("soft-canvas 그림 결과", () => {
  it.each(CASES)("%ix%i seed %i", (w, h, seed) => {
    expect(fnv(scene(SoftCanvas, SoftPath2D, seed, w, h))).toBe(
      HASH[`${w}x${h}:${seed}`],
    );
  });
});
