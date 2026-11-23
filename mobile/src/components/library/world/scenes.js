/* eslint-disable */
/**
 * 3D 섬 지도 (프로토타입 <script type="module"> 상황 맵 3D 섬 · 스터디 맵 그대로 옮긴 것).
 * - 스터디 맵 = study2 (하늘 계단 섬 · 놀이공원 섬 ?isle=9), 상황 맵 = travel · biz · cafe · campus. 시안 주소 값(?flinders · ?library · ?sandl …)은 기본값만 남겼어요.
 * - 프로토타입 코드를 거의 그대로 두어 비교 · 갱신이 쉽게 했어요 (그래서 이 파일만 JS · 린트 끔).
 *   바뀐 곳: 무대는 stage.ts (expo-gl), <canvas> 는 canvas2d.ts (폰은 소프트 그림판), 이름표 · 팔로는 RN 이 그려요.
 * - 어떤 맵이 어떤 BUILD 를 쓰는지는 presets.ts (프리셋 키 → BUILD 이름). 모르는 이름이 오면 개발 경고 + 여행 모양.
 */
import * as THREE from 'three';

import { canvasTexture, makeCanvas, makePath2D, whenFont } from './canvas2d';
import { INK, inkMat, stage } from './stage';

const TAU = Math.PI * 2;
/** 텍스처 그림판의 그리는 크기 (폰 그림판은 텍스처 픽셀 크기와 달라요) */
const gg0 = (c) => c.getContext('2d').canvas;
const ICO = { plane: 'M2 13l8-2 4-8h2l-2 8 6 1 2-2h1l-1 4 1 4h-1l-2-2-6 1 2 8h-2l-4-8-8-2z', seat: 'M7 3v11h9l2 7M7 14l-2 7M7 9h7', pass: 'M5 3h14v18H5zM9 8h6M9 12h6M9 16h3', taxi: 'M4 16V11l2-5h12l2 5v5zM4 16v3M20 16v3M7 13h1M16 13h1M9 6V4h6v2', hotel: 'M3 21V7l9-4 9 4v14M9 21v-6h6v6M8 10h2M14 10h2', food: 'M7 3v8a2 2 0 0 0 2 2v8M5 3v5M9 3v5M16 3c-2 2-2 7 0 9v9', bag: 'M5 8h14l-1 13H6zM9 8V6a3 3 0 0 1 6 0v2', map: 'M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14',
  brief: 'M3 8h18v12H3zM8 8V5h8v3M3 13h18', chat: 'M4 5h16v11H9l-5 4z', mail: 'M3 6h18v12H3zM3 7l9 7 9-7', deal: 'M2 12l5-5 5 3 5-3 5 5-6 6-4-3-4 3z', mic: 'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3',
  coffee: 'M4 9h13v5a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6zM17 11h2a2 2 0 0 1 0 4h-2M8 3v3M12 3v3',
  book: 'M3 5h7a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H3zM21 5h-7a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h7z', group: 'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 20c0-3 3-5 6-5s6 2 6 5M12 20c0-3 2-5 4-5 3 0 6 2 6 5',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z', dorm: 'M3 11l9-7 9 7v9H3zM9 20v-5h6v5', lib: 'M4 20V8l8-4 8 4v12M8 20v-8M12 20v-8M16 20v-8M3 20h18' };

// ---------- 공통: 툰 재질 · 외곽선 · 텍스처 ----------
const grad = (() => { const t = new THREE.DataTexture(new Uint8Array([110, 180, 255]), 3, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const mat = (c, o = {}) => new THREE.MeshToonMaterial({ color: c, gradientMap: grad, ...o });
function mesh(geo, color, { line = .05, cast = true } = {}) {
  const o = new THREE.Mesh(geo, mat(color)); o.castShadow = cast; o.receiveShadow = true;
  if (line) { geo.computeBoundingSphere(); const e = new THREE.Mesh(geo, inkMat); e.scale.setScalar(1 + line / geo.boundingSphere.radius); o.add(e); }
  return o;
}
const at = (o, x, y, z) => { o.position.set(x, y, z); return o; };
const flat = (geo, color, o = .9) => { const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: o < 1, opacity: o })); m.rotation.x = -Math.PI / 2; return m; };
function iconTex(name, { bg = '#fff', fg = '#1E1A2B' } = {}) {
  const c = makeCanvas(); c.width = c.height = 256; const g = c.getContext('2d'), s = 256;
  if (bg) { g.fillStyle = bg; g.beginPath(); g.arc(s / 2, s / 2, s / 2 - 2, 0, 7); g.fill(); }
  const k = s / 24 * .55; g.save(); g.translate(s / 2 - 12 * k, s / 2 - 12 * k); g.scale(k, k); g.strokeStyle = fg; g.lineWidth = 2.3; g.lineCap = g.lineJoin = 'round'; g.stroke(makePath2D(ICO[name])); g.restore();
  const t = canvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function textTex(txt, bg, fg, w = 512, h = 160, font = 'Lexend', size = 92) {
  const c = makeCanvas(); c.width = w; c.height = h; const g = c.getContext('2d');
  g.fillStyle = bg; g.beginPath(); g.roundRect(4, 4, w - 8, h - 8, h / 2); g.fill(); g.lineWidth = 8; g.strokeStyle = '#1E1A2B'; g.stroke();
  g.fillStyle = fg; g.font = `800 ${size}px ${font}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, w / 2, h / 2 + 4);
  const t = canvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
// 배경: 세로 그라데이션 + 맵마다 그림
function bgTex(top, bot, draw) {
  const c = makeCanvas(); c.width = 340 * 2; c.height = 520 * 2; const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, c.height); gr.addColorStop(0, top); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(0, 0, c.width, c.height);
  if (draw) draw(g, c.width, c.height);
  const t = canvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const rnd = (() => { let s = 7; return () => (s = (s * 9301 + 49297) % 233280) / 233280; })();
const puff = (g, x, y, r, col = 'rgba(255,255,255,.85)') => { g.fillStyle = col; [[0, 0, 1], [r * .9, r * .2, .75], [-r * .9, r * .25, .7], [r * .3, -r * .45, .7]].forEach(([a, b, k]) => { g.beginPath(); g.arc(x + a, y + b, r * k, 0, 7); g.fill(); }); };

function drawSun(g, x, y, r) {
  const gl = g.createRadialGradient(x, y, r * .5, x, y, r * 2.8); gl.addColorStop(0, 'rgba(255,236,150,.8)'); gl.addColorStop(1, 'rgba(255,236,150,0)'); g.fillStyle = gl; g.beginPath(); g.arc(x, y, r * 2.8, 0, 7); g.fill();
  g.save(); g.translate(x, y); g.lineCap = 'round';
  for (let i = 0; i < 12; i++) { const L = i % 2 ? r * .38 : r * .6; g.rotate(TAU / 12); g.beginPath(); g.moveTo(r * 1.25, 0); g.lineTo(r * 1.25 + L, 0); g.strokeStyle = '#1E1A2B'; g.lineWidth = 14; g.stroke(); g.strokeStyle = '#FFC93C'; g.lineWidth = 7; g.stroke(); }
  const fg = g.createLinearGradient(0, -r, 0, r); fg.addColorStop(0, '#FFEE7A'); fg.addColorStop(1, '#FFB52E'); g.fillStyle = fg; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill(); g.lineWidth = 5; g.strokeStyle = '#1E1A2B'; g.stroke();
  g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 7; g.beginPath(); g.arc(0, 0, r * .66, Math.PI * 1.08, Math.PI * 1.42); g.stroke(); g.restore();
}
function sparkle(g, x, y, s, c = '#FFF3C4') { g.fillStyle = c; g.beginPath(); g.moveTo(x, y - s); g.quadraticCurveTo(x, y, x + s, y); g.quadraticCurveTo(x, y, x, y + s); g.quadraticCurveTo(x, y, x - s, y); g.quadraticCurveTo(x, y, x, y - s); g.fill(); }
function drawMoon(g, x, y, r) {
  const gl = g.createRadialGradient(x, y, r * .6, x, y, r * 3); gl.addColorStop(0, 'rgba(255,240,180,.45)'); gl.addColorStop(1, 'rgba(255,240,180,0)'); g.fillStyle = gl; g.beginPath(); g.arc(x, y, r * 3, 0, 7); g.fill();
  const S = r * 3, mk = () => { const c = makeCanvas(); c.width = c.height = S * 2; return c; };
  const bx = S + r * .48, by = S - r * .34, br = r * .84;
  const ink = mk(), ig = ink.getContext('2d'); ig.fillStyle = '#1E1A2B'; ig.beginPath(); ig.arc(S, S, r + 3, 0, 7); ig.fill(); ig.globalCompositeOperation = 'destination-out'; ig.beginPath(); ig.arc(bx, by, br - 3, 0, 7); ig.fill();
  const col = mk(), cg = col.getContext('2d'); const mg = cg.createLinearGradient(S - r, S - r, S + r, S + r); mg.addColorStop(0, '#FFF7CF'); mg.addColorStop(1, '#FFD86B'); cg.fillStyle = mg; cg.beginPath(); cg.arc(S, S, r, 0, 7); cg.fill();
  cg.fillStyle = 'rgba(230,180,70,.45)'; [[-.5, .2, .16], [-.2, .62, .12], [-.66, -.28, .09]].forEach(([a, b, k]) => { cg.beginPath(); cg.arc(S + a * r, S + b * r, k * r, 0, 7); cg.fill(); });
  cg.globalCompositeOperation = 'destination-out'; cg.beginPath(); cg.arc(bx, by, br, 0, 7); cg.fill();
  ig.globalCompositeOperation = 'source-over'; ig.drawImage(col, 0, 0); g.drawImage(ink, x - S, y - S);
  [[-1.5, -.6, 12], [1.6, 1.3, 9], [-.9, 1.6, 7], [2.2, -.5, 6]].forEach(([a, b, k]) => sparkle(g, x + a * r, y + b * r, k));
}
// 섬 모양: 반지름 함수 R(a)로 2D 모양 → 두께 있게 (가장자리 둥글게)
function islandGeo(R, rad, depth, { sx = 1, sz = 1, bevel = .22 } = {}) {
  const sh = new THREE.Shape(), N = 120;
  for (let i = 0; i <= N; i++) { const a = i / N * TAU, r = rad * R(a), x = Math.cos(a) * r * sx, y = Math.sin(a) * r * sz; i ? sh.lineTo(x, y) : sh.moveTo(x, y); }
  const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelThickness: bevel * .7, bevelSize: bevel, bevelSegments: 3, curveSegments: 6 });
  g.rotateX(-Math.PI / 2); g.center(); g.computeVertexNormals(); return g;
}
const layer = (sc, R, rad, depth, y0, color, o) => { const m = mesh(islandGeo(R, rad, depth, o), color, { line: .06 }); m.position.y = y0 + depth / 2; sc.add(m); return m; };
// 섬 위 한 점의 높이를 맞추려고 쓰는 모양 함수들
const wrapA = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const SHAPES = {
  bean: (a) => 1 + .07 * Math.sin(3 * a + 1) + .045 * Math.sin(5 * a + .4) - .14 * Math.exp(-(wrapA(a - 2.5) ** 2) / .1),
  squircle: (a) => 1 / Math.pow(Math.abs(Math.cos(a)) ** 4 + Math.abs(Math.sin(a)) ** 4, .25) * .92,
  scallop: (a) => 1 + .035 * Math.cos(14 * a),
  peanut: (a) => 1 + .1 * Math.cos(2 * a) + .05 * Math.sin(3 * a + .5)
};

// ---------- 무대 ----------
// 팔로 자리: 프로토타입은 PNG 스프라이트, 앱은 이 점(s)의 위치 · 크기를 따라 RN 이 내 캐릭터를 그려요
function pallo(sc, x, y, z, hgt = 1.45) { const s = new THREE.Object3D(); s.position.set(x, y, z); s.scale.set(hgt, hgt, 1); return { s, w: hgt, h: hgt }; }
// 장면을 누르면 팔로가 그 정류장 옆으로 콩콩 뛰어가요 (거리만큼 여러 번 · 착지할 때 살짝 눌림 · 가는 방향으로 좌우 반전)
function palloRun(S, H, TOP, opt = {}) { let run = null; if (opt.home) H.follow = opt.home;
  S.rider = H; const RIGHT = new THREE.Vector3(13, 0, -11).normalize(), RM = S.el.reduced;
  S.onFocus = (info) => { if (!H.s) return;
    if (opt.land) { const get = opt.land(info); if (!get) return; const p0 = H.s.position.clone(); if (H.follow) p0.y = H.follow().y; const p1 = get(), d = p0.distanceTo(p1);
      if (RM) { H.follow = get; H.s.position.copy(p1); return; }
      const dx = p1.clone().sub(p0).dot(RIGHT); if (Math.abs(dx) > .05) H.s.scale.x = dx < 0 ? -H.w : H.w;
      run = { jump: true, p0, get, t0: null, dur: d < .1 ? .5 : Math.min(1.25, .6 + d * .06), arc: d < .1 ? .45 : Math.min(1.5, .7 + d * .1) }; return; }
    const p0 = H.s.position.clone(); if (H.base != null) p0.y = H.base; const p1 = new THREE.Vector3(info.at.x + (info.st === 'cur' ? 1.65 : 1.0), TOP + .02, info.at.z + (info.st === 'cur' ? -.8 : -.55)), d = p0.distanceTo(p1);
    if (RM) { H.s.position.copy(p1); return; }
    const dx = p1.clone().sub(p0).dot(RIGHT); if (Math.abs(dx) > .05) H.s.scale.x = dx < 0 ? -H.w : H.w;
    run = { p0, p1, t0: null, dur: d < .05 ? .45 : Math.max(.5, d * .17), hops: d < .05 ? 1 : Math.max(2, Math.round(d / 1.0)) }; };
  // 가만히 있을 때: 2.6초마다 제자리에서 콩 (착지 때 살짝 눌림)
  S.ticks.push((t) => { if (run || !H.s || RM) return; const base = H.follow ? H.follow().y : H.base == null ? (H.base = H.s.position.y) : H.base, c = (t + .8) % 2.6;
    if (c < .5) { const k = c / .5, air = Math.sin(k * Math.PI); H.s.position.y = base + air * .38; const sq = k < .12 || k > .88 ? .9 : 1 + air * .05; H.s.scale.y = H.h * sq; H.s.scale.x = Math.sign(H.s.scale.x || 1) * H.w * (2 - sq); }
    else if (H.s.position.y !== base) { H.s.position.y = base; H.s.scale.y = H.h; H.s.scale.x = Math.sign(H.s.scale.x || 1) * H.w; } });
  S.ticks.push((t) => { if (!run || !H.s || !run.jump) return; if (run.t0 == null) run.t0 = t; const T = (t - run.t0), pre = .14, post = .18, fl = run.dur, p1 = run.get(), sgn = Math.sign(H.s.scale.x || 1);
    if (T < pre) { const q = T / pre, sq = 1 - Math.sin(q * Math.PI) * .22; H.s.position.copy(run.p0); H.s.scale.set(sgn * H.w * (2 - sq), H.h * sq, 1); return; }
    if (T < pre + fl) { const k = (T - pre) / fl, e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; H.s.position.lerpVectors(run.p0, p1, e); H.s.position.y = run.p0.y + (p1.y - run.p0.y) * e + 4 * k * (1 - k) * run.arc; const st = 1 + Math.sin(k * Math.PI) * .1; H.s.scale.set(sgn * H.w / st, H.h * st, 1); return; }
    if (T < pre + fl + post) { const q = (T - pre - fl) / post, sq = 1 - Math.sin(q * Math.PI) * .25; H.s.position.copy(p1); H.s.scale.set(sgn * H.w * (2 - sq), H.h * sq, 1); return; }
    H.s.position.copy(p1); H.s.scale.set(sgn * H.w, H.h, 1); H.follow = run.get; run = null; });
  S.ticks.push((t) => { if (!run || !H.s || run.jump) return; if (run.t0 == null) run.t0 = t; const k = Math.min(1, (t - run.t0) / run.dur), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2, ph = (k * run.hops) % 1, air = Math.sin(ph * Math.PI);
    H.s.position.lerpVectors(run.p0, run.p1, e); H.s.position.y = run.p0.y + Math.abs(Math.sin(k * run.hops * Math.PI)) * .6;
    const sq = air < .25 ? 1 - (.25 - air) * .7 : 1 + air * .06; H.s.scale.y = H.h * sq; H.s.scale.x = Math.sign(H.s.scale.x || 1) * H.w * (2 - sq);
    if (k >= 1) { H.s.position.copy(run.p1); H.base = run.p1.y; H.s.scale.y = H.h; H.s.scale.x = Math.sign(H.s.scale.x) * H.w; run = null; } }); }
const tree = (x, z, y = 0, s = 1, c = 0x6DBE6A) => { const g = new THREE.Group(); g.add(at(mesh(new THREE.CylinderGeometry(.1 * s, .14 * s, .6 * s, 8), 0xB9824F, { line: .03 }), 0, .3 * s, 0)); g.add(at(mesh(new THREE.IcosahedronGeometry(.48 * s, 1), c), 0, .85 * s, 0)); return at(g, x, y, z); };
const cloud = (x, y, z, s = 1) => { const g = new THREE.Group(); [[0, 0, .6], [.6, -.1, .45], [-.6, -.12, .45], [.25, .25, .45]].forEach(([a, b, r]) => g.add(at(mesh(new THREE.IcosahedronGeometry(r * s, 2), 0xffffff, { line: .03, cast: false }), a * s, b * s, 0))); return at(g, x, y, z); };
const flag = (x, y, z, c) => { const g = new THREE.Group(); g.add(at(mesh(new THREE.CylinderGeometry(.05, .05, 1.8, 8), 0xffffff, { line: .03 }), 0, .9, 0)); g.add(at(mesh(new THREE.BoxGeometry(.8, .45, .05), c, { line: .03 }), .42, 1.55, 0)); return at(g, x, y, z); };
const boatMesh = (S, c) => { const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  // 선체: 옆모습(뱃머리가 들린 곡선)을 두께 있게 · 둥근 모서리
  const hs = new THREE.Shape(); hs.moveTo(-.78, .34); hs.lineTo(.62, .34); hs.quadraticCurveTo(1.02, .38, 1.06, .46); hs.quadraticCurveTo(.86, .02, .42, -.04); hs.lineTo(-.62, -.04); hs.quadraticCurveTo(-.82, .02, -.78, .34);
  const hg = new THREE.ExtrudeGeometry(hs, { depth: .52, bevelEnabled: true, bevelThickness: .08, bevelSize: .06, bevelSegments: 4, curveSegments: 16 }); hg.translate(0, 0, -.26);
  body.add(mesh(hg, c, { line: .03 }));
  const band = new THREE.ExtrudeGeometry(hs, { depth: .54, bevelEnabled: true, bevelThickness: .085, bevelSize: .065, bevelSegments: 4, curveSegments: 16 }); band.translate(0, 0, -.27); band.scale(1.001, .22, 1); const bm = mesh(band, 0xFFFFFF, { line: 0 }); bm.position.y = .2; body.add(bm);
  body.add(at(mesh(new THREE.BoxGeometry(1.42, .05, .56), 0xE9D3AE, { line: .02 }), .1, .37, 0));   // 갑판
  for (let k = -3; k <= 3; k++) body.add(at(mesh(new THREE.BoxGeometry(.02, .051, .5), 0xC9AE86, { line: 0 }), .1 + k * .18, .372, 0));
  // 선실 · 창 · 지붕
  body.add(at(mesh(new THREE.BoxGeometry(.46, .24, .4), 0xFFFFFF, { line: .025 }), -.32, .51, 0)); body.add(at(mesh(new THREE.BoxGeometry(.52, .05, .46), c, { line: .02 }), -.32, .65, 0));
  [-.44, -.32, -.2].forEach((wx) => { const w = new THREE.Mesh(new THREE.CircleGeometry(.04, 12), new THREE.MeshBasicMaterial({ color: 0x5FA8D3 })); w.position.set(wx, .52, .205); body.add(w); });
  // 돛대 · 붐 · 큰돛 · 앞돛
  body.add(at(mesh(new THREE.CylinderGeometry(.025, .03, 1.7, 8), 0xF4EDE0, { line: .015 }), .12, 1.22, 0));
  const boom = mesh(new THREE.CylinderGeometry(.02, .02, .7, 8), 0xF4EDE0, { line: .012 }); boom.rotation.z = Math.PI / 2; body.add(at(boom, -.2, .62, 0));
  const sailTex = canvasTex(128, 256, (gg, W, H) => { gg.fillStyle = '#FFFFFF'; gg.fillRect(0, 0, W, H); gg.fillStyle = '#' + new THREE.Color(c).getHexString(); [.62, .74].forEach((y) => gg.fillRect(0, H * y, W, H * .05)); gg.strokeStyle = 'rgba(30,26,43,.12)'; gg.lineWidth = 2; for (let y = 30; y < H; y += 34) { gg.beginPath(); gg.moveTo(0, y); gg.lineTo(W, y + 10); gg.stroke(); } });
  const ms = new THREE.Shape(); ms.moveTo(0, 0); ms.lineTo(-.62, 0); ms.quadraticCurveTo(-.36, .7, 0, 1.45); ms.lineTo(0, 0);
  const sg = new THREE.ShapeGeometry(ms, 12); const sp = sg.attributes.position, uv = sg.attributes.uv; for (let k = 0; k < sp.count; k++) { const sx = sp.getX(k), sy = sp.getY(k); sp.setZ(k, Math.sin((sy / 1.45) * Math.PI) * (-sx) * .18); uv.setXY(k, (sx + .62) / .62, sy / 1.45); }
  sg.computeVertexNormals(); const sail = new THREE.Mesh(sg, new THREE.MeshToonMaterial({ map: sailTex, gradientMap: grad, side: THREE.DoubleSide })); sail.position.set(.1, .66, 0); body.add(sail);
  const js = new THREE.Shape(); js.moveTo(0, 0); js.lineTo(.62, 0); js.lineTo(0, 1.2); js.lineTo(0, 0); const jib = new THREE.Mesh(new THREE.ShapeGeometry(js), new THREE.MeshToonMaterial({ color: 0xFFF6E6, gradientMap: grad, side: THREE.DoubleSide })); jib.position.set(.16, .5, 0); body.add(jib);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(.26, .14, 4, 1), new THREE.MeshToonMaterial({ color: 0xFFE200, gradientMap: grad, side: THREE.DoubleSide })); fl.geometry.translate(-.13, 0, 0); fl.position.set(.12, 2.02, 0); body.add(fl);
  // 물결 자국 (배 뒤로 퍼지는 흰 물결)
  const wakes = []; for (let k = 0; k < 4; k++) { const w = new THREE.Mesh(new THREE.RingGeometry(.18, .26, 24, 1, Math.PI * .6, Math.PI * .8), new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, side: THREE.DoubleSide })); w.rotation.x = -Math.PI / 2; g.add(w); wakes.push(w); }
  S.ticks.push((t) => { body.rotation.z = Math.sin(t * 1.6) * .05; body.rotation.x = Math.sin(t * 1.1 + 1) * .035; body.position.y = .04 + Math.sin(t * 1.6) * .05; sail.rotation.y = Math.sin(t * .8) * .06; fl.rotation.y = Math.sin(t * 5) * .4;
    wakes.forEach((w, k) => { const q = (t * .35 + k / 4) % 1; w.position.set(-.8 - q * 1.2, .03, 0); w.scale.setScalar(1 + q * 2.2); w.material.opacity = (1 - q) * .8; }); });
  return g; };
const boat = (S, x, z, c) => { const g = boatMesh(S, c); g.rotation.y = .5; g.scale.setScalar(.95); S.sc.add(at(g, x, 0, z)); };
function building(x, y, z, w, h, d, c, roof, lit = 0xFFF3C4, rows = .55) {
  const g = new THREE.Group(); g.add(at(mesh(new THREE.BoxGeometry(w, h, d), c), 0, h / 2, 0)); g.add(at(mesh(new THREE.BoxGeometry(w + .12, .18, d + .12), roof), 0, h + .09, 0));
  const wm = new THREE.MeshBasicMaterial({ color: lit });
  for (let yy = .45; yy < h - .3; yy += rows) for (const k of [-.3, 0, .3]) { if (w > .9 || k) { g.add(at(new THREE.Mesh(new THREE.BoxGeometry(.16, .22, .02), wm), k * w, yy, d / 2 + .01)); g.add(at(new THREE.Mesh(new THREE.BoxGeometry(.02, .22, .16), wm), w / 2 + .01, yy, k * d)); } }
  return at(g, x, y, z);
}
// 정류장 · 길 · 라벨 · 팔로
function stops(S, P, TOP, SC, roadCol = 0xF3EBDD, tail = null) {
  const sc = S.sc, pts = P.map(([x, z]) => new THREE.Vector3(x, TOP, z)); if (tail) pts.push(new THREE.Vector3(tail[0], TOP, tail[1]));
  const road = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, .34, 8), roadCol, { line: .04, cast: false }); road.scale.y = .22; road.position.y = TOP * .79; sc.add(road);
  const info = [];
  SC.forEach(([n, ic, st], i) => {
    const [x, z] = P[i], cur = st === 'cur', soon = st === 'soon', r = cur ? .78 : .58, h = cur ? .7 : .36;
    const col = st === 'done' || cur ? 0xFFE200 : soon ? 0xE4DFD5 : 0xffffff;
    const it = { n, st, no: i + 1, at: new THREE.Vector3(x, TOP + h, z) }; info.push(it);
    const pil = at(mesh(new THREE.CylinderGeometry(r, r * 1.05, h, 32), col, { line: .05 }), x, TOP + h / 2, z); pil.userData.info = it; sc.add(pil);
    const top = new THREE.Mesh(new THREE.CircleGeometry(r * .82, 32), new THREE.MeshBasicMaterial({ map: iconTex(ic, { bg: soon ? '#EFEAE0' : '#fff', fg: soon ? '#9A93A6' : '#1E1A2B' }), transparent: true }));
    top.rotation.x = -Math.PI / 2; top.position.set(x, TOP + h + .01, z); top.userData.info = it; sc.add(top);
    if (cur) S.label(new THREE.Vector3(x, TOP, z + r + .2), { kind: 'tag', text: n }, 2);
    else S.label(new THREE.Vector3(x, TOP, z + r + .05), { kind: 'min', num: i + 1, text: n, soon }, 0);
    if (cur) { const spot = (it) => () => new THREE.Vector3(it.at.x + (it.st === 'cur' ? 1.65 : 1.0), TOP + .02, it.at.z + (it.st === 'cur' ? -.8 : -.55));   // 장면 옆 자리
      palloRun(S, pallo(sc, x + 1.65, TOP + .02, z - .8), TOP, { land: (info) => spot(info), home: spot(it) });   /* 스터디 맵처럼 포물선 점프로 넘어가요 */ S.label(new THREE.Vector3(x, TOP + h + 1.05, z), { kind: 'here', text: 'START' }); }
  });
  return info;
}
const CAM = new THREE.Vector3(11, 12, 13);
const BUILD = {}; let OPEN = null;

// ================= 1. 여행 · 하늘색 바다 · 콩 모양 섬 =================
BUILD.travel = (EL, SC) => {
  // 뒤 배경: 해변 리조트 (travelBeach)
  const S = stage(EL, { half: 9.4, pos: CAM, target: new THREE.Vector3(-1.0, 5.36, -.8), bg: bgTex('#5EC1EA', '#E8F7FB', (g, W, H) => drawSun(g, W * .82, H * .1, 34)), az: [.2, 1.2], fog: new THREE.Fog(0xE8F2F8, 40, 90) }), sc = S.sc;
  const E = travelBeach(S) || {};
  if (!E.noSea) {
  // 바다 디오라마 판: 옆면 진한 파랑 · 윗면 바다 · 섬 둘레 얕은 물
  const sea = at(mesh(new THREE.CylinderGeometry(7.7, 7.7, 1.2, 72), 0x4FA8CF, { line: .07 }), 0, -.6, 0); sea.userData.bg = 1; sc.add(sea);
  const top = at(flat(new THREE.CircleGeometry(7.6, 72), 0x8FD3E8, 1), 0, .01, 0); top.userData.bg = 1; sc.add(top);
  const sh = at(flat(new THREE.ShapeGeometry((() => { const s = new THREE.Shape(); for (let i = 0; i <= 120; i++) { const a = i / 120 * TAU, r = 7.1 * SHAPES.bean(a); const x = Math.cos(a) * r, y = Math.sin(a) * r * 1.12; i ? s.lineTo(x, y) : s.moveTo(x, y); } return s; })()), 0xB8E8F1, 1), 0, .02, 0); sh.userData.bg = 1; sc.add(sh);
  for (let i = 0; i < 16; i++) { const a = i * 2.3, rr = 6.8 + (i % 3) * .25; const f = new THREE.Mesh(new THREE.BoxGeometry(.6, .02, .07), new THREE.MeshBasicMaterial({ color: 0xffffff })); f.position.set(Math.cos(a) * rr, .04, Math.sin(a) * rr); f.rotation.y = a; sc.add(f); }
  }
  layer(sc, SHAPES.bean, 6.5, .7, 0, 0xEAD7AE, { sz: 1.12 }); layer(sc, SHAPES.bean, 5.8, .55, .7, 0xA7D8A0, { sz: 1.12 });
  const TOP = 1.42;
  const info = stops(S, [[-3.4, 4.4], [-.4, 5.0], [2.6, 4.0], [3.4, 1.2], [.8, .4], [-2.6, -.6], [-2.0, -3.6], [1.4, -4.4]], TOP, SC);
  const tw = new THREE.Group(); tw.add(at(mesh(new THREE.CylinderGeometry(.26, .34, 2, 16), 0xffffff), 0, 1, 0)); tw.add(at(mesh(new THREE.CylinderGeometry(.62, .5, .55, 16), 0x9ED8E6), 0, 2.25, 0)); tw.add(at(mesh(new THREE.CylinderGeometry(.68, .68, .12, 16), 0xD0798E), 0, 2.58, 0)); sc.add(at(tw, -4.6, TOP, 2.0));
  sc.add(building(4.0, TOP, -1.8, 1.2, 2.6, 1.1, 0xF7C9D2, 0xD0798E)); sc.add(building(4.5, TOP, -.2, .9, 1.6, .9, 0xFFE7A8, 0xE8A93C)); sc.add(building(2.8, TOP, -3.2, .9, 1.9, .9, 0xCFE7F5, 0x3F5BA9));
  const palm = (x, z) => { const g = new THREE.Group(); const tr = mesh(new THREE.CylinderGeometry(.09, .14, 1.8, 8), 0xB9824F, { line: .03 }); tr.position.y = .9; tr.rotation.z = .18; g.add(tr);
    for (let i = 0; i < 5; i++) { const l = mesh(new THREE.ConeGeometry(.22, 1.2, 6), 0x5DB26A, { line: .03 }); l.geometry.translate(0, .55, 0); l.position.set(-.16, 1.8, 0); l.rotation.set(0, i * 1.26, Math.PI / 2 - .5); g.add(l); } return at(g, x, TOP, z); };
  sc.add(palm(5.0, 3.0)); sc.add(palm(-5.0, -1.4));
  [[-1, 2.5], [1.2, 2.3], [-4.2, -3.2], [3.4, 3.2], [-.4, -2.0], [-4.6, 4.4]].forEach(([x, z], i) => sc.add(tree(x, z, TOP, .9 + (i % 3) * .12, i % 2 ? 0x6DBE6A : 0x8FCB7E)));
  sc.add(flag(2.4, TOP, -5.0, 0xD0798E));
  const plane = new THREE.Group();
  const fus = mesh(new THREE.CapsuleGeometry(.34, 1.9, 8, 16), 0xffffff); fus.rotation.z = Math.PI / 2; plane.add(fus);
  const stripe = mesh(new THREE.CapsuleGeometry(.345, 1.7, 8, 16), 0xD0798E, { line: 0 }); stripe.rotation.z = Math.PI / 2; stripe.scale.set(1, 1, .32); stripe.position.y = -.08; plane.add(stripe);
  const nose = mesh(new THREE.SphereGeometry(.2, 16, 12), 0x3F5BA9, { line: .02 }); nose.position.set(1.18, .08, 0); nose.scale.set(.6, .7, 1.4); plane.add(nose);
  for (let i = 0; i < 6; i++) for (const zz of [-1, 1]) { const w = new THREE.Mesh(new THREE.CircleGeometry(.07, 16), new THREE.MeshBasicMaterial({ color: 0x2B2F5E })); w.position.set(.7 - i * .26, .1, zz * .335); if (zz < 0) w.rotation.y = Math.PI; plane.add(w); }
  const wingS = new THREE.Shape(); wingS.moveTo(.4, 0); wingS.lineTo(-.3, 0); wingS.lineTo(-.85, 1.55); wingS.lineTo(-.5, 1.55); wingS.lineTo(.4, 0);
  const wingG = new THREE.ExtrudeGeometry(wingS, { depth: .07, bevelEnabled: false }); wingG.rotateX(Math.PI / 2); wingG.translate(0, .035, 0);
  for (const k of [1, -1]) { const wg = mesh(wingG, 0xffffff, { line: .025 }); wg.scale.z = k; wg.position.y = -.12; plane.add(wg);
    const tip = mesh(new THREE.BoxGeometry(.38, .08, .1), 0xD0798E, { line: .02 }); tip.position.set(-.67, -.12, k * 1.52); plane.add(tip);
    const eng = mesh(new THREE.CylinderGeometry(.13, .15, .5, 14), 0xC9C2D8, { line: .02 }); eng.rotation.z = Math.PI / 2; eng.position.set(.05, -.28, k * .72); plane.add(eng); }
  const finS = new THREE.Shape(); finS.moveTo(-1.0, 0); finS.lineTo(-1.45, 0); finS.lineTo(-1.62, .85); finS.lineTo(-1.3, .85); finS.lineTo(-1.0, 0);
  const finG = new THREE.ExtrudeGeometry(finS, { depth: .07, bevelEnabled: false }); finG.translate(0, .15, -.035); plane.add(mesh(finG, 0xD0798E, { line: .025 }));
  const stab = new THREE.Shape(); stab.moveTo(-1.1, 0); stab.lineTo(-1.45, 0); stab.lineTo(-1.6, .6); stab.lineTo(-1.42, .6); stab.lineTo(-1.1, 0);
  const stG = new THREE.ExtrudeGeometry(stab, { depth: .05, bevelEnabled: false }); stG.rotateX(Math.PI / 2); stG.translate(0, .12, 0);
  for (const k of [1, -1]) { const st2 = mesh(stG, 0xffffff, { line: .02 }); st2.scale.z = k; plane.add(st2); }
  const trail = []; for (let i = 0; i < 9; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(.16 + i * .02, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .85 - i * .09 })); m.position.set(-1.9 - i * .42, 0, 0); plane.add(m); trail.push(m); }
  plane.scale.setScalar(.95); sc.add(plane);
  S.ticks.push((t) => { const a = t * .18 + 2.2, R = 7.2; plane.position.set(Math.cos(a) * R, 6.6 + Math.sin(t * 1.3) * .2, -Math.sin(a) * R); plane.rotation.set(0, a + Math.PI / 2, 0); plane.rotateX(-.22); trail.forEach((m, i) => { m.scale.setScalar(1 + Math.sin(t * 3 + i) * .08); }); });
  if (!E.noSea) boat(S, 5.6, 4.6, 0xD0798E);
  return S;
};

// ================= 2. 비즈니스 · 노을 저녁 · 네모난 2층 섬 =================
BUILD.biz = (EL, SC) => {
  // 뒤 배경: 낮 도심 (bizDowntown)
  const S = stage(EL, { half: 9.0, pos: CAM, target: new THREE.Vector3(-.6, 5.46, -.9), bg: bgTex('#86C1EA', '#EEF5FA'), az: [.2, 1.2] }), sc = S.sc;
  const E = bizDowntown(S) || {};
  if (!E.noSea) {
  const sea = at(mesh(new THREE.BoxGeometry(13.6, 1.2, 13.6), 0x3E3378, { line: .07 }), 0, -.6, 0); sea.userData.bg = 1; sc.add(sea);
  const top = at(flat(new THREE.PlaneGeometry(13.5, 13.5), 0x5E50A0, 1), 0, .01, 0); top.userData.bg = 1; sc.add(top);
  for (let i = 0; i < 14; i++) { const f = new THREE.Mesh(new THREE.BoxGeometry(.9 + rnd(), .02, .08), new THREE.MeshBasicMaterial({ color: i % 3 ? 0xFFE27A : 0xF6B9A0 })); f.position.set(-6 + rnd() * 12, .03, (i % 2 ? 6.0 : -6.2) + rnd() * .4); sc.add(f); }
  }
  layer(sc, SHAPES.squircle, 6.2, .7, 0, 0xB7AECD); layer(sc, SHAPES.squircle, 5.6, .5, .7, 0xE3DEEE);
  { // 바닥 타일 모자이크: 보라 타일 바탕에 노랑 타일로 PALLO (5×7 픽셀 글자)
    const F = { P: ['1110', '1001', '1001', '1110', '1000', '1000', '1000'], A: ['0110', '1001', '1001', '1111', '1001', '1001', '1001'], L: ['1000', '1000', '1000', '1000', '1000', '1000', '1111'], O: ['0110', '1001', '1001', '1001', '1001', '1001', '0110'] };
    const word = 'PALLO', cols = word.length * 5 + 3, rows = 11, ts = 24;
    const mos = canvasTex(cols * ts, rows * ts, (g) => { g.clearRect(0, 0, cols * ts, rows * ts);
      [...word].forEach((ch, k) => F[ch].forEach((row, r) => [...row].forEach((b, c) => { if (b !== '1') return; const x = (2 + k * 5 + c) * ts, y = (2 + r) * ts; g.fillStyle = (r + c) % 3 ? '#D2CAE4' : '#CBC2DF'; g.fillRect(x, y, ts, ts); g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(x + 3, y + 3, ts - 10, 4); })));
      [...word].forEach((ch, k) => F[ch].forEach((row, r) => [...row].forEach((b, c) => { if (b !== '1') return; g.strokeStyle = 'rgba(120,106,160,.35)'; g.lineWidth = 2; g.strokeRect((2 + k * 5 + c) * ts + 1, (2 + r) * ts + 1, ts - 2, ts - 2); }))); });
    const mw = 9, mh = mw * rows / cols, pm = new THREE.Mesh(new THREE.PlaneGeometry(mw, mh), new THREE.MeshBasicMaterial({ map: mos, transparent: true })); pm.rotation.set(-Math.PI / 2, 0, ROW);
    const [x, z] = along(7.9, 7.9, -.6); pm.position.set(x, .02, z); sc.add(bgs(pm)); }
  // 뒤쪽 높은 층 (빌딩 숲)
  const back = mesh(islandGeo(SHAPES.squircle, 2.5, .8), 0xCFC8E2, { line: .05 }); back.position.set(-2.6, 1.2 + .4, -2.6); sc.add(back);
  const TOP = 1.32;
  // 바둑판 길 무늬
  for (const k of [-1.6, 1.8]) { sc.add(at(flat(new THREE.PlaneGeometry(10, .5), 0xD2CBE3, 1), 0, TOP - .08, k)); }
  const info = stops(S, [[-1.8, 4.0], [1.8, 3.8], [3.8, 1.0], [1.6, -1.2], [3.4, -3.6]], TOP, SC, 0xFFF6E6);
  const T2 = 2.0;
  [[-3.6, -1.6, 1.2, 4.6, 0x493087, 0xFFE200], [-2.0, -3.4, 1.0, 3.4, 0x7C6CC0, 0xFFE200], [-3.8, -3.6, .9, 2.6, 0x9C8BDB], [-1.6, -1.6, .8, 2.0, 0xC9BEDF]].forEach(([x, z, w, h, c, l]) => sc.add(building(x, T2, z, w, h, w, c, 0xE3DBF7, l || 0xFFF3C4, .45)));
  sc.add(building(4.6, TOP, -1.2, .9, 2.4, .9, 0x7C6CC0, 0xE3DBF7, 0xFFE200, .45)); sc.add(building(-4.6, TOP, 1.6, .9, 1.6, .9, 0x9C8BDB, 0xE3DBF7));
  sc.add(at(mesh(new THREE.CylinderGeometry(.04, .04, 1.2, 8), 0xffffff, { line: .02 }), -3.6, T2 + 4.6 + .6, -1.6)); const bl = at(mesh(new THREE.SphereGeometry(.16, 16, 12), 0xE9789B, { line: .02 }), -3.6, T2 + 5.9, -1.6); sc.add(bl);
  S.ticks.push((t) => { bl.material.emissive = new THREE.Color(Math.sin(t * 4) > 0 ? 0xE9789B : 0x000000); });
  const fz = new THREE.Group(); fz.add(at(mesh(new THREE.CylinderGeometry(1.2, 1.2, .1, 32), 0xA7D8A0, { line: .03 }), 0, .05, 0)); fz.add(at(mesh(new THREE.CylinderGeometry(.75, .8, .3, 32), 0xffffff, { line: .03 }), 0, .2, 0)); fz.add(at(mesh(new THREE.CylinderGeometry(.62, .62, .05, 32), 0x9ED8E6, { line: 0 }), 0, .34, 0)); fz.add(at(mesh(new THREE.CylinderGeometry(.1, .14, .7, 12), 0xffffff, { line: .02 }), 0, .55, 0));
  const jet = at(mesh(new THREE.SphereGeometry(.2, 16, 12), 0xBFE4EC, { line: .02 }), 0, 1, 0); fz.add(jet); sc.add(at(fz, .4, TOP, 1.0)); S.ticks.push((t) => { jet.position.y = .95 + Math.abs(Math.sin(t * 3)) * .25; });
  [[-3.6, 3.0], [3.8, 3.6], [-.4, 2.4], [2.0, 1.6], [4.6, 1.2]].forEach(([x, z], i) => sc.add(tree(x, z, TOP, .8, i % 2 ? 0x6DBE6A : 0x8FCB7E)));
  [[-2.8, 2.2], [3.0, 2.4], [.2, -2.8], [2.6, -2.4]].forEach(([x, z]) => { const g = new THREE.Group(); g.add(at(mesh(new THREE.CylinderGeometry(.05, .05, 1.6, 8), 0x2B2F5E, { line: .02 }), 0, .8, 0)); g.add(at(mesh(new THREE.IcosahedronGeometry(.17, 1), 0xFFE200, { line: .02 }), 0, 1.68, 0)); sc.add(at(g, x, TOP, z)); });
  sc.add(flag(4.6, TOP, -4.4, 0x493087)); if (!E.noSea) boat(S, 5.4, 5.6, 0x493087);
  applyMood(S, MOOD[3]);
  return S;
};

// ---------- 배경 공간 (카페 · 캠퍼스): 그림 한 장 대신 3D 오브젝트로 ----------
function canvasTex(w, h, draw, rx = 1, ry = 1) {
  const c = makeCanvas(); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = canvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 4; return t;
}
const std = (geo, o = {}, { cast = true, recv = true } = {}) => { const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ roughness: .8, metalness: 0, ...o })); m.castShadow = cast; m.receiveShadow = recv; return m; };
const woodTex = (rx, ry, base = 28) => canvasTex(512, 512, (g, W, H) => {
  const ph = 64;
  for (let y = 0; y < H; y += ph) {
    const l = base + rnd() * 8; g.fillStyle = `hsl(28, 45%, ${l}%)`; g.fillRect(0, y, W, ph);
    for (let i = 0; i < 26; i++) { g.strokeStyle = `hsla(25, 50%, ${l - 10 + rnd() * 6}%, ${.25 + rnd() * .3})`; g.lineWidth = 1 + rnd() * 2; const yy = y + rnd() * ph; g.beginPath(); g.moveTo(0, yy); for (let x = 0; x <= W; x += 32) g.lineTo(x, yy + Math.sin(x * .02 + i) * 3); g.stroke(); }
    g.fillStyle = 'rgba(40,20,10,.45)'; g.fillRect(0, y, W, 3); const cx = rnd() * W; g.fillRect(cx, y, 3, ph);
  }
}, rx, ry);

// ---------- 카페 (멜버른) · 캠퍼스 (잔디 위 PALLO UNIVERSITY) 배경 ----------
const ROW = Math.PI / 4;                                   // 화면과 나란한 방향 (뒤쪽 배경 줄)
const along = (cx, cz, t) => [cx + t * .7071, cz - t * .7071];
const bgs = (m) => { m.userData.bg = 1; return m; };
const glow = (sc, x, y, z, c = 0xFFC478, I = 16, d = 11) => { const L = new THREE.PointLight(c, I, d, 1.6); L.position.set(x, y, z); sc.add(L); return L; };
const faceBox = (w, h, d, front, side) => { const sm = new THREE.MeshStandardMaterial(side), fm = new THREE.MeshStandardMaterial({ roughness: .85, ...front }); const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [sm, sm, sm, sm, fm, sm]); m.castShadow = m.receiveShadow = true; return m; };
const cobbleTex = (rx, ry) => canvasTex(512, 512, (g, W, H) => { g.fillStyle = '#2C3038'; g.fillRect(0, 0, W, H);
  for (let r = 0; r < 8; r++) for (let c = -1; c < 5; c++) { const k = rnd(), x = c * 128 + (r % 2) * 64 + 3, y = r * 64 + 3; g.fillStyle = `hsl(220, 8%, ${30 + k * 12}%)`; g.beginPath(); g.roundRect(x, y, 122, 58, 8); g.fill(); g.fillStyle = 'rgba(255,255,255,.06)'; g.fillRect(x + 6, y + 4, 80, 5); } }, rx, ry);
const signTex = (txt, bg = '#1F4E9C', fg = '#FFFFFF') => canvasTex(512, 128, (g, W, H) => { g.fillStyle = bg; g.beginPath(); g.roundRect(4, 4, W - 8, H - 8, 14); g.fill(); g.lineWidth = 6; g.strokeStyle = fg; g.beginPath(); g.roundRect(14, 14, W - 28, H - 28, 8); g.stroke();
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; let fs = 64; g.font = `800 ${fs}px Lexend, sans-serif`; while (g.measureText(txt).width > W * .82) { fs -= 2; g.font = `800 ${fs}px Lexend, sans-serif`; } g.fillText(txt, W / 2, H / 2 + 3); });
// 멜버른 트램 (초록 · 크림 · 금색 띠)
function tram(num = '35') { const g = new THREE.Group(), grn = { color: 0x2F6B4A, roughness: .45 }, crm = { color: 0xF1E2B8, roughness: .5 };
  g.add(at(std(new THREE.BoxGeometry(6.4, 1.0, 1.5), grn), 0, .85, 0)); g.add(at(std(new THREE.BoxGeometry(6.4, .9, 1.5), crm), 0, 1.8, 0)); g.add(at(std(new THREE.BoxGeometry(6.42, .1, 1.52), { color: 0xC9A24A, metalness: .6, roughness: .3 }), 0, 1.36, 0));
  g.add(at(std(new THREE.BoxGeometry(6.6, .2, 1.6), { color: 0x7A2E28 }), 0, 2.35, 0)); g.add(at(std(new THREE.BoxGeometry(4.6, .25, 1.2), { color: 0x7A2E28 }), 0, 2.55, 0));
  const win = new THREE.MeshStandardMaterial({ color: 0xBFD9E6, roughness: .1, metalness: .2 }); for (let i = -2.6; i <= 2.6; i += .65) for (const k of [-1, 1]) { const w = new THREE.Mesh(new THREE.BoxGeometry(.5, .55, .04), win); w.position.set(i, 1.85, k * .77); g.add(w); }
  [-2, 2].forEach((x) => { g.add(at(std(new THREE.BoxGeometry(1.4, .35, 1.2), { color: 0x2B2B2E }), x, .2, 0)); });
  const pole = std(new THREE.CylinderGeometry(.03, .03, 2.6, 6), { color: 0x2B2B2E }); pole.position.set(-.6, 3.6, 0); pole.rotation.z = -.9; g.add(pole);
  const nt = new THREE.Mesh(new THREE.PlaneGeometry(.7, .32), new THREE.MeshBasicMaterial({ map: signTex(num, '#1E1A2B', '#FFE27A') })); nt.position.set(3.22, 2.05, 0); nt.rotation.y = Math.PI / 2; g.add(nt); return g; }
function tramLine(S, cx, cz, y, len = 34, speed = 2.2, num = '35') { const sc = S.sc;
  for (const k of [-.36, .36]) { const r = std(new THREE.BoxGeometry(len, .06, .1), { color: 0x9EA3AA, metalness: .8, roughness: .3 }, { cast: false }); r.rotation.y = ROW; const [x, z] = [cx + k * .7071, cz + k * .7071]; r.position.set(x, y + .03, z); sc.add(r); }
  const wire = new THREE.Mesh(new THREE.CylinderGeometry(.015, .015, len, 4), new THREE.MeshBasicMaterial({ color: 0x1E1A2B })); wire.rotation.z = Math.PI / 2; const wg = new THREE.Group(); wg.add(wire); wg.rotation.y = ROW; wg.position.set(cx, y + 4.6, cz); sc.add(wg);
  const t = tram(num); t.rotation.y = ROW; sc.add(t); S.ticks.push((tt) => { const p = ((tt * speed) % (len + 8)) - (len + 8) / 2; const [x, z] = along(cx, cz, p); t.position.set(x, y, z); }); }
// ---------- Flinders Street 역 · 리얼 시안 (?flinders=1 정석 · 2 불 켜진 저녁 · 3 툰 디오라마 · 4 벽돌 아케이드 + 양끝 파빌리온) ----------
const fsFacade = (P, lit, bays = 18) => { const W = 2048, H = 512, mk = (emi) => canvasTex(W, H, (g) => {
  const bw = W / bays;
  if (!emi) { g.fillStyle = P.wall; g.fillRect(0, 0, W, H); for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${rnd() > .5 ? '255,250,230' : '90,50,10'},${rnd() * .07})`; g.fillRect(rnd() * W, rnd() * H, 3 + rnd() * 14, 2 + rnd() * 5); }
    g.fillStyle = P.band; for (let y = 34; y < 262; y += 38) g.fillRect(0, y, W, 9);           // 크림 가로 띠 (위층)
    g.fillRect(0, 0, W, 24); g.fillRect(0, 252, W, 22);                                       // 처마 · 층 사이 띠
    if (P.brick) { g.fillStyle = '#A9553C'; g.fillRect(0, 274, W, 238); g.strokeStyle = 'rgba(70,30,20,.35)'; g.lineWidth = 2; for (let y = 274; y < H; y += 12) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); for (let x = (y / 12 % 2) * 14; x < W; x += 28) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 12); g.stroke(); } } }
    else { g.fillStyle = P.band; for (let y = 300; y < 480; y += 44) g.fillRect(0, y, W, 8); }
    g.fillStyle = P.base; g.fillRect(0, H - 26, W, 26); } else { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); }
  for (let i = 0; i < bays; i++) { const x = i * bw;
    // 위층 아치 창 (크림 테두리 + 키스톤)
    const wx = x + bw * .26, ww = bw * .48, wy = 70, wh = 150, on = lit && rnd() > .3;
    if (!emi) { g.fillStyle = P.band; g.beginPath(); g.moveTo(wx - 7, wy + wh + 6); g.lineTo(wx - 7, wy + ww / 2); g.arc(wx + ww / 2, wy + ww / 2, ww / 2 + 7, Math.PI, 0); g.lineTo(wx + ww + 7, wy + wh + 6); g.fill(); g.fillRect(wx + ww / 2 - 6, wy - 10, 12, 16); }
    g.fillStyle = emi ? (on ? '#FFC870' : '#000') : on ? '#FFD58A' : '#3D5266'; g.beginPath(); g.moveTo(wx, wy + wh); g.lineTo(wx, wy + ww / 2); g.arc(wx + ww / 2, wy + ww / 2, ww / 2, Math.PI, 0); g.lineTo(wx + ww, wy + wh); g.fill();
    if (!emi) { g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(wx + 4, wy + ww / 2, ww * .2, wh - ww / 2 - 4); g.fillStyle = P.band; g.fillRect(wx + ww / 2 - 2, wy + 6, 4, wh - 6); g.fillRect(wx, wy + wh * .55, ww, 4); }
    // 1층 아케이드 (큰 아치 · 가게 불빛)
    const ax = x + bw * .14, aw = bw * .72, ay = 300, ah = 186, shop = rnd() > (lit ? .25 : .55);
    if (!emi) { g.fillStyle = P.band; g.beginPath(); g.moveTo(ax - 8, ay + ah); g.lineTo(ax - 8, ay + aw / 2); g.arc(ax + aw / 2, ay + aw / 2, aw / 2 + 8, Math.PI, 0); g.lineTo(ax + aw + 8, ay + ah); g.fill(); }
    g.fillStyle = emi ? (shop ? '#FFB860' : '#000') : shop ? '#F7C77E' : '#2E2A30'; g.beginPath(); g.moveTo(ax, ay + ah); g.lineTo(ax, ay + aw / 2); g.arc(ax + aw / 2, ay + aw / 2, aw / 2, Math.PI, 0); g.lineTo(ax + aw, ay + ah); g.fill();
    if (!emi && shop) { g.fillStyle = 'rgba(60,40,30,.55)'; g.fillRect(ax + 6, ay + ah - 60, aw - 12, 4); g.fillRect(ax + aw / 2 - 2, ay + aw / 2, 4, ah - aw / 2); } }
}); const t = mk(false); if (lit) t.userData.emi = mk(true); return t; };
const fsDrumTex = (P, lit) => canvasTex(512, 128, (g, W, H) => { g.fillStyle = P.wall; g.fillRect(0, 0, W, H); g.fillStyle = P.band; g.fillRect(0, 0, W, 12); g.fillRect(0, H - 14, W, 14);
  for (let i = 0; i < 8; i++) { const x = i * 64 + 16, w = 32; g.fillStyle = P.band; g.beginPath(); g.moveTo(x - 5, 110); g.lineTo(x - 5, 40); g.arc(x + w / 2, 40, w / 2 + 5, Math.PI, 0); g.lineTo(x + w + 5, 110); g.fill(); g.fillStyle = lit ? '#FFD58A' : '#3D5266'; g.beginPath(); g.moveTo(x, 106); g.lineTo(x, 40); g.arc(x + w / 2, 40, w / 2, Math.PI, 0); g.lineTo(x + w, 106); g.fill(); g.fillStyle = P.band; g.fillRect(x + w + 10, 14, 6, H - 28); } });
const fsDomeTex = (P) => canvasTex(512, 256, (g, W, H) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, P.domeHi); gr.addColorStop(1, P.dome); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 16; i++) { g.fillStyle = 'rgba(30,60,45,.45)'; g.fillRect(i * W / 16, 0, 5, H); g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(i * W / 16 + 6, 0, 3, H); }
  for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(${rnd() > .5 ? '160,220,190' : '40,80,60'},${rnd() * .18})`; g.fillRect(rnd() * W, rnd() * H, 4 + rnd() * 10, 2 + rnd() * 6); } });
const fsClockLive = (lit) => { const t = canvasTex(256, 256, () => {}); let last = -1;
  const draw = () => { const d = new Date(), m = d.getHours() * 60 + d.getMinutes(); if (m === last) return; last = m; const g = t.image.getContext('2d'); g.clearRect(0, 0, 256, 256);
    g.fillStyle = '#C9A24A'; g.beginPath(); g.arc(128, 128, 126, 0, 7); g.fill(); const fg = g.createRadialGradient(128, 128, 10, 128, 128, 112); fg.addColorStop(0, lit ? '#FFFBEA' : '#FBF6EA'); fg.addColorStop(1, lit ? '#FFE9B0' : '#F1E8D2'); g.fillStyle = fg; g.beginPath(); g.arc(128, 128, 112, 0, 7); g.fill();
    g.strokeStyle = '#1E1A2B'; g.lineCap = 'round'; for (let i = 0; i < 60; i++) { const a = i / 60 * TAU, big = i % 5 === 0; g.lineWidth = big ? (i % 15 ? 5 : 8) : 2; g.beginPath(); g.moveTo(128 + Math.cos(a) * (big ? 90 : 100), 128 + Math.sin(a) * (big ? 90 : 100)); g.lineTo(128 + Math.cos(a) * 107, 128 + Math.sin(a) * 107); g.stroke(); }
    const hh = d.getHours() % 12, mm = d.getMinutes(), ah = (hh + mm / 60) / 12 * TAU - Math.PI / 2, am = mm / 60 * TAU - Math.PI / 2;
    g.fillStyle = 'rgba(30,26,43,.75)'; g.font = '800 26px Lexend, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(`${d.getHours()}:${String(mm).padStart(2, '0')}`, 128, 176);
    g.lineWidth = 10; g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + Math.cos(ah) * 52, 128 + Math.sin(ah) * 52); g.stroke(); g.lineWidth = 6; g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + Math.cos(am) * 82, 128 + Math.sin(am) * 82); g.stroke();
    g.fillStyle = '#C8402E'; g.beginPath(); g.arc(128, 128, 9, 0, 7); g.fill(); t.needsUpdate = true; };
  draw(); t.userData.tick = draw; return t; };
const fsEntryTex = (P, lit) => canvasTex(512, 640, (g, W, H) => { g.fillStyle = P.wall; g.fillRect(0, 0, W, H); g.fillStyle = P.band; for (let y = 20; y < 300; y += 40) g.fillRect(0, y, W, 10);
  g.fillStyle = P.band; g.beginPath(); g.moveTo(60, H); g.lineTo(60, 300); g.arc(256, 300, 196, Math.PI, 0); g.lineTo(452, H); g.fill();
  g.fillStyle = lit ? '#F7C77E' : '#3B3A44'; g.beginPath(); g.moveTo(84, H); g.lineTo(84, 300); g.arc(256, 300, 172, Math.PI, 0); g.lineTo(428, H); g.fill();
  g.fillStyle = 'rgba(30,26,43,.55)'; for (let x = 120; x < 400; x += 46) g.fillRect(x, 250, 4, H - 250); g.fillRect(84, 420, 344, 6);
  for (let i = 0; i < 7; i++) { const x = 100 + i * 52; g.fillStyle = '#FBF6EA'; g.beginPath(); g.arc(x, 360, 20, 0, 7); g.fill(); g.strokeStyle = '#1E1A2B'; g.lineWidth = 3; g.stroke(); g.beginPath(); g.moveTo(x, 360); g.lineTo(x, 346); g.moveTo(x, 360); g.lineTo(x + 9, 364); g.stroke(); }
  g.fillStyle = P.band; g.fillRect(232, 90, 48, 40); });
const fsBelfryTex = (P) => canvasTex(256, 128, (g, W, H) => { g.fillStyle = P.wall; g.fillRect(0, 0, W, H); g.fillStyle = P.band; g.fillRect(0, 0, W, 14); g.fillRect(0, H - 12, W, 12);
  for (let i = 0; i < 3; i++) { const x = 22 + i * 76, w = 56; g.fillStyle = P.band; g.beginPath(); g.moveTo(x - 6, H - 12); g.lineTo(x - 6, 50); g.arc(x + w / 2, 50, w / 2 + 6, Math.PI, 0); g.lineTo(x + w + 6, H - 12); g.fill(); g.fillStyle = '#2C2A33'; g.beginPath(); g.moveTo(x, H - 12); g.lineTo(x, 50); g.arc(x + w / 2, 50, w / 2, Math.PI, 0); g.lineTo(x + w, H - 12); g.fill(); } });
function station2(sc, x, y, z, ry = ROW, s = 1, v = 1) {
  const P = v === 4 ? { wall: '#D2953A', band: '#F7EDD8', base: '#8E7A68', dome: '#4F8E72', domeHi: '#8CC7A9', brick: true } : { wall: '#DDA34E', band: '#F4E5C6', base: '#9C8A74', dome: '#5E9A7E', domeHi: '#9ED0B6' };
  const lit = v === 2, toon = v === 3, g = new THREE.Group(), cream = { color: 0xF4E5C6, roughness: .7 }, wallC = new THREE.Color(P.wall).getHex();
  const M = (geo, o, c) => { if (toon) { const m = mesh(geo, c != null ? c : (o.color != null ? o.color : 0xffffff), { line: .04 }); if (o.map) { m.material.map = o.map; m.material.color.setHex(0xffffff); } return m; } return std(geo, o); };
  const k = toon ? 1.18 : 1, L = (v === 4 ? 13.6 : 12) * s, Hh = 3.6 * s, D = 3 * s, dx = -2.9 * s, tx = (v === 4 ? 4.6 : 4.2) * s;
  // 본체 (정면 텍스처: 띠 · 아치 창 · 1층 아케이드)
  const ft = fsFacade(P, lit, v === 4 ? 20 : 18); const fm = { map: ft, roughness: .85 }; if (lit) Object.assign(fm, { emissive: 0xffffff, emissiveMap: ft.userData.emi, emissiveIntensity: .9 });
  if (toon) { const b = mesh(new THREE.BoxGeometry(L, Hh, D), wallC, { line: .05 }); b.material = [b.material, b.material, b.material, b.material, new THREE.MeshToonMaterial({ map: ft, gradientMap: grad }), b.material]; g.add(at(b, 0, Hh / 2, 0)); }
  else g.add(at(faceBox(L, Hh, D, fm, { color: wallC, roughness: .85 }), 0, Hh / 2, 0));
  // 기둥 · 층 사이 띠 · 처마 · 난간
  if (!toon) for (let i = 0; i <= 9; i++) g.add(at(std(new THREE.BoxGeometry(.16 * s, Hh * .9, .1 * s), cream), -L / 2 + .2 * s + i * (L - .4 * s) / 9, Hh * .47, D / 2 + .05 * s));
  g.add(at(M(new THREE.BoxGeometry(L + .1 * s, .14 * s, D + .1 * s), cream, 0xF4E5C6), 0, Hh * .53, 0));
  g.add(at(M(new THREE.BoxGeometry(L + .3 * s, .26 * s * k, D + .3 * s), cream, 0xF4E5C6), 0, Hh + .13 * s, 0));
  if (!toon) { const bg = new THREE.CylinderGeometry(.045 * s, .06 * s, .34 * s, 6), bm = new THREE.MeshStandardMaterial(cream), n = Math.round(L / (.24 * s)), im = new THREE.InstancedMesh(bg, bm, n), o = new THREE.Object3D();
    for (let i = 0; i < n; i++) { o.position.set(-L / 2 + .12 * s + i * .24 * s, Hh + .43 * s, D / 2 + .05 * s); o.updateMatrix(); im.setMatrixAt(i, o.matrix); } g.add(im); g.add(at(std(new THREE.BoxGeometry(L + .2 * s, .1 * s, .22 * s), cream), 0, Hh + .64 * s, D / 2 + .05 * s)); }
  // 입구 블록 (큰 아치 · 시계 줄) + 드럼 + 녹청 돔 + 랜턴
  const eH = Hh + 1.0 * s, eW = 3.4 * s * k;
  g.add(at(toon ? (() => { const m = mesh(new THREE.BoxGeometry(eW, eH, D + .5 * s), wallC, { line: .05 }); m.material = [m.material, m.material, m.material, m.material, new THREE.MeshToonMaterial({ map: fsEntryTex(P, lit), gradientMap: grad }), m.material]; return m; })() : faceBox(eW, eH, D + .5 * s, { map: fsEntryTex(P, lit), roughness: .85, ...(lit ? { emissive: 0x553311, emissiveIntensity: .5 } : {}) }, { color: wallC }), dx, eH / 2, .25 * s));
  g.add(at(M(new THREE.BoxGeometry(eW + .2 * s, .24 * s, D + .7 * s), cream, 0xF4E5C6), dx, eH + .12 * s, .25 * s));
  const dr = 1.45 * s * k, dY = eH + .24 * s;
  const drum = M(new THREE.CylinderGeometry(dr, dr * 1.04, 1.4 * s * k, 32), { map: fsDrumTex(P, lit), roughness: .85, ...(lit ? { emissive: 0x332211, emissiveIntensity: .6 } : {}) }); g.add(at(drum, dx, dY + .7 * s * k, .25 * s));
  g.add(at(M(new THREE.CylinderGeometry(dr + .14 * s, dr + .14 * s, .18 * s, 32), cream, 0xF4E5C6), dx, dY + 1.4 * s * k + .09 * s, .25 * s));
  const dome = M(new THREE.SphereGeometry(dr * 1.02, 40, 20, 0, TAU, 0, Math.PI / 2), { map: fsDomeTex(P), roughness: .45, metalness: .35 }); dome.scale.y = 1.25; g.add(at(dome, dx, dY + 1.4 * s * k + .18 * s, .25 * s));
  const lY = dY + 1.4 * s * k + .18 * s + dr * 1.27; g.add(at(M(new THREE.CylinderGeometry(.34 * s, .38 * s, .55 * s, 12), cream, 0xF4E5C6), dx, lY + .2 * s, .25 * s));
  const ld = M(new THREE.SphereGeometry(.4 * s, 20, 10, 0, TAU, 0, Math.PI / 2), { map: fsDomeTex(P), roughness: .45, metalness: .35 }); ld.scale.y = 1.2; g.add(at(ld, dx, lY + .48 * s, .25 * s));
  g.add(at(std(new THREE.CylinderGeometry(.04 * s, .06 * s, .7 * s, 8), { color: 0xC9A24A, metalness: .8, roughness: .3 }), dx, lY + 1.2 * s, .25 * s)); g.add(at(std(new THREE.SphereGeometry(.09 * s, 10, 8), { color: 0xE2B84E, metalness: .85, roughness: .25 }), dx, lY + 1.58 * s, .25 * s));
  // 시계탑 (띠 · 시계 · 종루 아치 · 작은 돔)
  const tw = 1.8 * s * (toon ? 1.12 : 1), tH = (toon ? 7.4 : 6.6) * s;
  const tt = canvasTex(256, 1024, (gg, W, H) => { gg.fillStyle = P.wall; gg.fillRect(0, 0, W, H); gg.fillStyle = P.band; for (let yy = 40; yy < H; yy += 46) gg.fillRect(0, yy, W, 10); gg.fillStyle = lit ? '#FFD58A' : '#3D5266'; [[80, 600], [80, 760]].forEach(([wx, wy]) => { gg.beginPath(); gg.moveTo(wx, wy + 110); gg.lineTo(wx, wy + 48); gg.arc(wx + 48, wy + 48, 48, Math.PI, 0); gg.lineTo(wx + 96, wy + 110); gg.fill(); }); });
  g.add(at(toon ? (() => { const m = mesh(new THREE.BoxGeometry(tw, tH, tw), wallC, { line: .05 }); m.material = [m.material, m.material, m.material, m.material, new THREE.MeshToonMaterial({ map: tt, gradientMap: grad }), m.material]; return m; })() : faceBox(tw, tH, tw, { map: tt, roughness: .85 }, { color: wallC }), tx, tH / 2, 0));
  const ck = fsClockLive(lit), glowT = canvasTex(128, 128, (gg, W, H) => { const gr = gg.createRadialGradient(64, 64, 20, 64, 64, 64); gr.addColorStop(0, 'rgba(255,226,150,.85)'); gr.addColorStop(1, 'rgba(255,200,120,0)'); gg.fillStyle = gr; gg.fillRect(0, 0, W, H); });
  [[0, 0, tw / 2 + .02 * s], [Math.PI / 2, tw / 2 + .02 * s, 0]].forEach(([r, ox, oz]) => { const c = new THREE.Mesh(new THREE.CircleGeometry(.62 * s, 40), new THREE.MeshStandardMaterial({ map: ck, roughness: .5, emissive: 0xffffff, emissiveMap: ck, emissiveIntensity: lit ? .95 : .35 })); c.rotation.y = r; c.position.set(tx + ox, tH - 1.3 * s, oz); c.onBeforeRender = () => ck.userData.tick(); g.add(c);
    if (lit) { const h = new THREE.Mesh(new THREE.PlaneGeometry(2.2 * s, 2.2 * s), new THREE.MeshBasicMaterial({ map: glowT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); h.rotation.y = r; h.position.set(tx + ox * 1.01, tH - 1.3 * s, oz * 1.01 + (r ? 0 : -.01)); g.add(h); } });
  g.add(at(M(new THREE.BoxGeometry(tw + .24 * s, .22 * s, tw + .24 * s), cream, 0xF4E5C6), tx, tH + .11 * s, 0));
  const bf = M(new THREE.BoxGeometry(tw * .86, 1.1 * s, tw * .86), { map: fsBelfryTex(P) }); g.add(at(bf, tx, tH + .77 * s, 0));
  g.add(at(M(new THREE.BoxGeometry(tw, .18 * s, tw), cream, 0xF4E5C6), tx, tH + 1.41 * s, 0));
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => g.add(at(M(new THREE.SphereGeometry(.13 * s, 12, 8), cream, 0xF4E5C6), tx + a * tw * .44, tH + 1.62 * s, b * tw * .44)));
  const cu = M(new THREE.SphereGeometry(.62 * s, 28, 14, 0, TAU, 0, Math.PI / 2), { map: fsDomeTex(P), roughness: .45, metalness: .35 }); cu.scale.y = 1.35; g.add(at(cu, tx, tH + 1.5 * s, 0));
  g.add(at(std(new THREE.CylinderGeometry(.03 * s, .05 * s, .8 * s, 8), { color: 0xC9A24A, metalness: .8, roughness: .3 }), tx, tH + 2.65 * s, 0));
  // 양끝 파빌리온 (4안)
  if (v === 4) [-L / 2 + .9 * s, L / 2 - .9 * s].forEach((px) => { g.add(at(faceBox(1.8 * s, Hh + .9 * s, D + .3 * s, { map: fsBelfryTex(P) }, { color: wallC }), px, (Hh + .9 * s) / 2, .15 * s)); const pd = std(new THREE.SphereGeometry(.8 * s, 24, 12, 0, TAU, 0, Math.PI / 2), { map: fsDomeTex(P), roughness: .45, metalness: .35 }); pd.scale.y = 1.2; g.add(at(pd, px, Hh + .9 * s, .15 * s)); g.add(at(std(new THREE.CylinderGeometry(.03 * s, .05 * s, .6 * s, 8), { color: 0xC9A24A, metalness: .8 }), px, Hh + 2.1 * s, .15 * s)); });
  // 이름 간판 (난간 위)
  const nameT = canvasTex(1024, 150, () => {}); const drawName = () => { const c = nameT.image, gg = c.getContext('2d'), W = gg0(c).width, H = gg0(c).height; gg.clearRect(0, 0, W, H); gg.fillStyle = '#1F4636'; gg.beginPath(); gg.roundRect(4, 8, W - 8, H - 16, 18); gg.fill(); gg.lineWidth = 6; gg.strokeStyle = '#D9B45A'; gg.stroke();
    gg.fillStyle = '#F3D98A'; gg.textAlign = 'center'; gg.textBaseline = 'middle'; let fs = 84; gg.font = `400 ${fs}px "DM Serif Display", Georgia, serif`; while (gg.measureText('Flinders Street Station').width > W * .88) { fs -= 2; gg.font = `400 ${fs}px "DM Serif Display", Georgia, serif`; } gg.fillText('Flinders Street Station', W / 2, H / 2 + 4); nameT.needsUpdate = true; };
  drawName(); whenFont('84px "DM Serif Display"', drawName);
  const nm = new THREE.Mesh(new THREE.PlaneGeometry(3.8 * s, .56 * s), new THREE.MeshBasicMaterial({ map: nameT, transparent: true })); nm.position.set(1.0 * s, Hh + .5 * s, D / 2 + .2 * s); g.add(nm);
  // 저녁 전구 줄 (2안): 처마 · 드럼 · 시계탑 모서리
  if (lit) { const pts = []; for (let xx = -L / 2; xx <= L / 2; xx += .3 * s) pts.push([xx, Hh + .28 * s, D / 2 + .18 * s]);
    for (let i = 0; i < 40; i++) { const a = i / 40 * TAU; pts.push([dx + Math.cos(a) * (dr + .2 * s), dY + 1.4 * s * k + .2 * s, .25 * s + Math.sin(a) * (dr + .2 * s)]); }
    for (let yy = .3 * s; yy < tH; yy += .3 * s) [-1, 1].forEach((a) => pts.push([tx + a * tw / 2, yy, tw / 2 + .02 * s]));
    for (let i = 0; i <= 12; i++) { const a = i / 12 * Math.PI; pts.push([dx + Math.cos(a) * dr * 1.02, dY + 1.4 * s * k + .18 * s + Math.sin(a) * dr * 1.27, .25 * s + dr * .05]); }
    const im = new THREE.InstancedMesh(new THREE.SphereGeometry(.055 * s, 6, 4), new THREE.MeshBasicMaterial({ color: 0xFFE3A0 }), pts.length), o = new THREE.Object3D(); pts.forEach((p, i) => { o.position.set(...p); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }); g.add(im);
    g.add(at(new THREE.PointLight(0xFFC27A, 10, 9, 1.6), dx, eH, D)); g.add(at(new THREE.PointLight(0xFFC27A, 3.5, 6, 1.8), tx, tH - 1, tw)); }
  g.rotation.y = ry; sc.add(bgs(at(g, x, y, z))); return g; }
// 유리 빌딩 창 텍스처
const glassTex = (c1, c2) => { const t = canvasTex(128, 256, (g, W, H) => { g.fillStyle = c1; g.fillRect(0, 0, W, H); g.fillStyle = c2; for (let y = 4; y < H; y += 16) for (let x = 4; x < W; x += 16) { g.globalAlpha = .5 + rnd() * .5; g.fillRect(x, y, 10, 10); } g.globalAlpha = 1; }, 1, 3); t.userData.glass = 1; return t; };
const lamp = (sc, x, z, y = 0, lit = false) => { const g = new THREE.Group(); g.add(at(std(new THREE.CylinderGeometry(.06, .09, 2.6, 8), { color: 0x23262B, metalness: .5 }), 0, 1.3, 0)); const gb = at(new THREE.Mesh(new THREE.SphereGeometry(.22, 16, 12), new THREE.MeshStandardMaterial({ color: 0xFFF4D6, emissive: 0xFFD27A, emissiveIntensity: lit ? 1.4 : .3 })), 0, 2.75, 0); gb.userData.lamp = 1; g.add(gb); sc.add(at(g, x, y, z)); if (lit) glow(sc, x, y + 2.6, z, 0xFFD27A, 6, 6).userData.lampLight = 1; return g; };
const umbrella = (x, z, c, y = 0) => { const g = new THREE.Group(); g.add(at(std(new THREE.CylinderGeometry(.04, .04, 2.2, 8), { color: 0xF7F4EE }), 0, 1.1, 0)); g.add(at(std(new THREE.ConeGeometry(1.3, .5, 8), { color: c }), 0, 2.3, 0)); g.add(at(std(new THREE.CylinderGeometry(.5, .5, .06, 20), { color: 0xF7F4EE }), 0, .8, 0)); [-.8, .8].forEach((k) => g.add(at(std(new THREE.BoxGeometry(.38, .45, .38), { color: 0x2B2B2E }), k, .22, 0))); return at(g, x, y, z); };
const gum = (x, z, y = 0, s = 1) => { const g = new THREE.Group(); const tr = std(new THREE.CylinderGeometry(.12 * s, .2 * s, 2.6 * s, 8), { color: 0xE9E2D4, roughness: .8 }); tr.position.y = 1.3 * s; tr.rotation.z = .08; g.add(tr);
  for (let i = 0; i < 6; i++) g.add(at(std(new THREE.IcosahedronGeometry(.75 * s, 1), { color: i % 2 ? 0x7E9B78 : 0x95AE86, roughness: .9 }), Math.cos(i * 1.7) * .7 * s, (2.8 + (i % 3) * .4) * s, Math.sin(i * 1.7) * .7 * s)); return at(g, x, y, z); };

// ---------- 카페 역 뒤 멜버른 도심 (3D) ----------
// 정면 텍스처: grid = 사암 오피스 / glass = 유리 커튼월 / deco = 아르데코 세로 띠
const towerTex = (kind, wall, floors) => { const t = canvasTex(256, 512, (g, W, H) => {
  const fh = (H - 46) / floors, sh = (c, k) => { const n = parseInt(c.slice(1), 16), f = (v) => Math.max(0, Math.min(255, Math.round(v * k))); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; };
  if (kind === 'glass') { const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, sh(wall, 1.22)); gr.addColorStop(.55, wall); gr.addColorStop(1, sh(wall, .78)); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    for (let i = 0; i < floors; i++) for (let x = 0; x < W; x += 32) { g.fillStyle = `rgba(255,255,255,${rnd() * .14})`; g.fillRect(x, i * fh, 32, fh); }
    g.fillStyle = 'rgba(255,240,220,.35)'; g.beginPath(); g.moveTo(W * .15, 0); g.lineTo(W * .45, 0); g.lineTo(W * .05, H * .6); g.lineTo(0, H * .6); g.lineTo(0, H * .3); g.fill();
    g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.moveTo(W * .7, H * .2); g.lineTo(W * .82, H * .2); g.lineTo(W * .45, H); g.lineTo(W * .33, H); g.fill();
    g.fillStyle = sh(wall, .6); for (let x = 0; x <= W; x += 32) g.fillRect(x - 2, 0, 4, H); for (let i = 0; i <= floors; i++) g.fillRect(0, i * fh - 1.5, W, 3);
  } else {
    g.fillStyle = wall; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(${rnd() > .5 ? '255,255,255' : '60,30,20'},${rnd() * .06})`; g.fillRect(rnd() * W, rnd() * H, 2 + rnd() * 10, 2 + rnd() * 6); }
    const cols = kind === 'deco' ? 5 : 4, cw = W / cols;
    for (let i = 0; i < floors; i++) for (let c = 0; c < cols; c++) { const x = c * cw, y = 10 + i * fh;
      if (kind === 'deco') { g.fillStyle = sh(wall, 1.12); g.fillRect(x + cw * .08, 0, cw * .14, H - 40); g.fillStyle = '#3E4E66'; g.fillRect(x + cw * .34, y + fh * .16, cw * .5, fh * .7); g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(x + cw * .34, y + fh * .16, cw * .12, fh * .7); }
      else { g.fillStyle = sh(wall, .82); g.fillRect(x + cw * .14, y + fh * .12, cw * .72, fh * .8); g.fillStyle = '#41546E'; g.fillRect(x + cw * .2, y + fh * .18, cw * .6, fh * .64); g.fillStyle = sh(wall, 1.15); g.fillRect(x + cw * .48, y + fh * .18, cw * .04, fh * .64); g.fillRect(x + cw * .12, y + fh * .84, cw * .76, fh * .07);
        if (rnd() > .7) { g.fillStyle = 'rgba(255,226,170,.55)'; g.fillRect(x + cw * .2, y + fh * .18, cw * .6, fh * .64); } else { g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(x + cw * .2, y + fh * .18, cw * .18, fh * .64); } } }
    if (kind === 'grid') { g.fillStyle = sh(wall, 1.12); for (let i = 3; i < floors; i += 4) g.fillRect(0, 10 + i * fh - 3, W, 6); }
  }
  // 1층 상점가: 차양 + 불 켜진 쇼윈도
  g.fillStyle = sh(wall, .55); g.fillRect(0, H - 40, W, 40); const aw = ['#2F6B4A', '#C8553D', '#1F4E9C', '#E0A33A'];
  for (let x = 6; x < W; x += 62) { g.fillStyle = 'rgba(255,214,150,.9)'; g.fillRect(x + 4, H - 30, 46, 28); g.fillStyle = aw[(x / 62 | 0) % 4]; g.fillRect(x, H - 40, 54, 10); g.fillStyle = 'rgba(255,255,255,.7)'; for (let k = 0; k < 54; k += 12) g.fillRect(x + k, H - 40, 6, 10); }
  g.fillStyle = sh(wall, .7); g.fillRect(0, 0, W, 8);
}); if (kind === 'glass') t.userData.glass = 1; return t; };
function cityTower(G, x, y, z, { w, h, d, kind, c, side, top }) { const g = new THREE.Group(), sideM = { color: side, roughness: kind === 'glass' ? .35 : .85, metalness: kind === 'glass' ? .25 : 0 };
  const floors = Math.max(6, Math.round(h * 1.3)); const body = faceBox(w, h, d, { map: towerTex(kind, c, floors), roughness: kind === 'glass' ? .3 : .85, metalness: kind === 'glass' ? .2 : 0 }, sideM); g.add(at(body, 0, h / 2, 0));
  const trim = { color: kind === 'glass' ? 0xD9DEE4 : 0xF4E8D4, roughness: .7 };
  g.add(at(std(new THREE.BoxGeometry(w + .18, .22, d + .18), trim), 0, h + .11, 0));
  let H = h + .22;
  if (top === 'setback') { const h2 = h * .22; g.add(at(faceBox(w * .7, h2, d * .7, { map: towerTex(kind, c, 4) }, sideM), 0, H + h2 / 2, 0)); g.add(at(std(new THREE.BoxGeometry(w * .7 + .14, .18, d * .7 + .14), trim), 0, H + h2 + .09, 0)); H += h2 + .18; g.add(at(std(new THREE.CylinderGeometry(.04, .04, 1.4, 6), { color: 0x2B2B2E }), 0, H + .7, 0)); }
  if (top === 'gold') { const h2 = h * .11; g.add(at(std(new THREE.BoxGeometry(w * .96, h2, d * .96), { color: 0xE2B84E, roughness: .25, metalness: .85 }), 0, H + h2 / 2, 0)); g.add(at(std(new THREE.BoxGeometry(w * .97, .14, d * .97), { color: 0xC8402E }), 0, H - h * .3, 0)); H += h2; g.add(at(std(new THREE.CylinderGeometry(.05, .08, 2.2, 8), { color: 0xE2B84E, metalness: .8, roughness: .3 }), 0, H + 1.1, 0)); }
  if (top === 'pyramid') { const p = std(new THREE.ConeGeometry(w * .62, h * .16, 4), { color: 0x5E9A7A, roughness: .45, metalness: .3 }); p.rotation.y = Math.PI / 4; g.add(at(p, 0, H + h * .08, 0)); g.add(at(std(new THREE.SphereGeometry(.14, 10, 8), { color: 0xE2B84E, metalness: .8, roughness: .3 }), 0, H + h * .16 + .1, 0)); }
  if (top === 'tank') { g.add(at(std(new THREE.CylinderGeometry(.4, .4, .7, 12), { color: 0x9C7A5C }), w * .22, H + .55, -d * .1)); g.add(at(std(new THREE.ConeGeometry(.46, .3, 12), { color: 0x6E5644 }), w * .22, H + 1.05, -d * .1)); [-1, 1].forEach((k) => g.add(at(std(new THREE.CylinderGeometry(.03, .03, .4, 4), { color: 0x2B2B2E }), w * .22 + k * .25, H + .2, -d * .1))); g.add(at(std(new THREE.BoxGeometry(w * .4, .5, d * .4), { color: side }), -w * .2, H + .25, 0)); }
  if (top === 'antenna') { g.add(at(std(new THREE.BoxGeometry(w * .5, .6, d * .5), { color: side }), 0, H + .3, 0)); g.add(at(std(new THREE.CylinderGeometry(.03, .06, 3, 6), { color: 0xE9E6E0, metalness: .5 }), 0, H + 2.1, 0)); const bl = at(new THREE.Mesh(new THREE.SphereGeometry(.1, 8, 6), new THREE.MeshBasicMaterial({ color: 0xFF5A4A })), 0, H + 3.6, 0); g.add(bl); }
  g.rotation.y = ROW; G.add(at(g, x, y, z)); return g; }
// 아트센터 첨탑 (격자 원뿔 · 하얀 띠)
function artsSpire(G, x, y, z) { const g = new THREE.Group(), wht = { color: 0xF4F1EA, roughness: .5, metalness: .2 };
  g.add(at(std(new THREE.CylinderGeometry(1.6, 1.9, 2.2, 8), { color: 0x6E6A78, roughness: .8 }), 0, 1.1, 0));
  g.add(at(std(new THREE.CylinderGeometry(1.75, 1.75, .18, 8), wht), 0, 2.25, 0));
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, L = new THREE.Vector3(Math.cos(a) * 1.4, 0, Math.sin(a) * 1.4), T = new THREE.Vector3(0, 9.5, 0), m = std(new THREE.CylinderGeometry(.05, .07, L.distanceTo(T), 5), wht); m.position.copy(L.clone().add(T).multiplyScalar(.5)).add(new THREE.Vector3(0, 2.3, 0)); m.lookAt(T.clone().add(new THREE.Vector3(0, 2.3, 0))); m.rotateX(Math.PI / 2); g.add(m); }
  for (let k = 1; k < 7; k++) { const r = 1.4 * (1 - k / 7.4); const ring = std(new THREE.TorusGeometry(r, .035, 4, 16), wht); ring.rotation.x = Math.PI / 2; ring.position.y = 2.3 + k * 9.5 / 7.4; g.add(ring); }
  g.add(at(std(new THREE.CylinderGeometry(.03, .05, 2.6, 6), wht), 0, 2.3 + 9.5 + 1.2, 0));
  G.add(at(g, x, y, z)); return g; }
function melbCity(S, FL) { const sc = S.sc, G = new THREE.Group(), y0 = FL - .4;
  const T = [[-16, { w: 3.4, h: 9.5, d: 3, kind: 'grid', c: '#E8CBA2', side: 0xC9A882, top: 'tank' }], [-12.4, { w: 2.8, h: 14, d: 2.8, kind: 'glass', c: '#8EA7C4', side: 0x6F86A0, top: 'antenna' }],
    [-9, { w: 3.6, h: 11.5, d: 3, kind: 'deco', c: '#DDAE92', side: 0xB98A72, top: 'pyramid' }], [-5.4, { w: 2.5, h: 18.5, d: 2.5, kind: 'glass', c: '#55678A', side: 0x3F4E6C, top: 'gold' }],
    [-1.8, { w: 3.6, h: 12, d: 3, kind: 'grid', c: '#EEDDC3', side: 0xCBB89C, top: 'setback' }], [1.9, { w: 3, h: 15.5, d: 2.8, kind: 'glass', c: '#A7BBCE', side: 0x8498AE, top: 'antenna' }],
    [5.4, { w: 3.6, h: 10.5, d: 3, kind: 'deco', c: '#D39A82', side: 0xAF7A64, top: 'tank' }], [8.8, { w: 2.8, h: 13, d: 2.8, kind: 'grid', c: '#E4C493', side: 0xC2A274, top: 'setback' }],
    [16, { w: 3.4, h: 9, d: 3, kind: 'glass', c: '#9FB1C2', side: 0x7F92A6, top: 'tank' }]];
  T.forEach(([t, o]) => { const [x, z] = along(-25.5, -25.5, t); cityTower(G, x, y0, z, { ...o, h: o.h * .64 }); });
  { const [x, z] = along(-24.5, -24.5, 12.6); artsSpire(G, x, y0, z); }
  G.traverse((o) => { if (o.material) [].concat(o.material).forEach((m) => { m.fog = false; }); });   // 앞줄은 안개 없이 선명하게
  // 뒷줄 (조금 더 멀리 · 높이 차이)
  [[-14, 12, '#B9A4B4'], [-7.2, 16, '#A897B0'], [-3.6, 13.5, '#C2AEB6'], [4, 17, '#A99AB6'], [11, 14, '#B7A3B2'], [13.6, 11, '#C4B0B8']].forEach(([t, h, c]) => { const [x, z] = along(-29.5, -29.5, t); cityTower(G, x, y0, z, { w: 3.2, h: h * .78, d: 3, kind: t % 2 ? 'glass' : 'grid', c, side: 0x8E7E94 }); });
  sc.add(bgs(G));
  // 먼 안개 실루엣 (깊이감)
  const sil = canvasTex(2048, 512, (g, W, H) => { g.clearRect(0, 0, W, H); [['rgba(214,170,160,.75)', 120, 300, 120], ['rgba(196,150,150,.85)', 60, 200, 140]].forEach(([col, a, b, st]) => { let x = 0; while (x < W) { const w = st * (.6 + rnd() * .8), h = a + rnd() * (b - a); g.fillStyle = col; g.fillRect(x, H - h, w - 8, h); x += w; } }); });
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(90, 22), new THREE.MeshBasicMaterial({ map: sil, transparent: true, depthWrite: false, fog: false })); pl.rotation.y = ROW; const [x, z] = along(-34, -34, 2); pl.position.set(x, FL + 8.6, z); sc.add(bgs(pl)); }
// ===== 카페 · 멜버른 야라 강변 (보드워크 · 아치 다리를 건너는 트램 · 강가 역 · 유람선 · 노을) =====
function cafeRiver(S) { const sc = S.sc, FL = -1.2;
  const deck = std(new THREE.BoxGeometry(70, .9, 40), { map: woodTex(16, 9, 44), roughness: .7 }, { cast: false }); deck.rotation.y = ROW; deck.position.set(4.94, FL - .45, 4.94); sc.add(bgs(deck));
  const bank = std(new THREE.BoxGeometry(90, .9, 22), { map: cobbleTex(18, 4), roughness: .85 }, { cast: false }); bank.rotation.y = ROW; bank.position.set(-24.0, FL - .45, -24.0); sc.add(bgs(bank));
  const wt = canvasTex(512, 256, (g, W, H) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#E99A7A'); gr.addColorStop(.5, '#5E8FB0'); gr.addColorStop(1, '#3F6F92'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(255,${220 + rnd() * 35},${170 + rnd() * 60},${.25 + rnd() * .35})`; g.fillRect(rnd() * W, rnd() * H, 10 + rnd() * 26, 2); } }, 6, 1);
  const river = new THREE.Mesh(new THREE.PlaneGeometry(80, 10), new THREE.MeshStandardMaterial({ map: wt, roughness: .08, metalness: .25 })); river.userData.water = 1; river.rotation.x = -Math.PI / 2; river.rotation.z = ROW; river.position.set(-12.9, FL - .5, -12.9); sc.add(bgs(river)); S.ticks.push((t) => { wt.offset.x = t * .015; });
  [[-9.4, -9.4], [-16.4, -16.4]].forEach(([x, z]) => { const e = std(new THREE.BoxGeometry(80, .7, .4), { color: 0x7A746C, roughness: .9 }); e.rotation.y = ROW; e.position.set(x, FL - .35, z); sc.add(e); });
  // 강가 난간 + 가로등 (불 켜짐)
  const rail = std(new THREE.BoxGeometry(80, .06, .06), { color: 0x2B2B2E, metalness: .5 }); rail.rotation.y = ROW; rail.position.set(-8.9, FL + 1, -8.9); sc.add(rail);
  for (let i = -6; i <= 6; i++) { const [x, z] = along(-8.9, -8.9, i * 2.6); sc.add(at(std(new THREE.CylinderGeometry(.03, .03, 1, 6), { color: 0x2B2B2E }), x, FL + .5, z)); if (i % 2 === 0) lamp(sc, x, z, FL, true); }
  // 아치 다리 + 다리를 건너는 트램
  const brg = new THREE.Group(), stn = { color: 0xB9A88E, roughness: .85 }; brg.add(at(std(new THREE.BoxGeometry(2.8, .5, 12), stn), 0, .4, 0));
  [-3, 0, 3].forEach((z) => { const a = std(new THREE.TorusGeometry(1.4, .25, 8, 20, Math.PI), stn); a.rotation.y = Math.PI / 2; a.position.set(0, -1.1, z); brg.add(a); }); [-1.3, 1.3].forEach((x) => { brg.add(at(std(new THREE.BoxGeometry(.12, .5, 12), { color: 0x3A3F45 }), x, .9, 0)); for (let z = -5.5; z <= 5.5; z += 2.75) brg.add(at(std(new THREE.CylinderGeometry(.05, .05, 1.8, 6), { color: 0x3A3F45 }), x, 1.5, z)); });
  brg.rotation.y = ROW + Math.PI / 2; const [bx, bz] = along(-12.9, -12.9, 8.5); brg.position.set(bx, FL, bz); sc.add(bgs(brg));
  tramLine(S, -17.4, -17.4, FL, 70, 2.0, '1');
  [-3, -.5, 2.5].forEach((k, i) => sc.add(person(bx + k * .7071 + (i % 2 ? .4 : -.4) * .7071, bz + k * .7071 - (i % 2 ? .4 : -.4) * .7071, [0x1F4E9C, 0xE0483F, 0xF2C230][i], 0, FL + .65)));
  // 건너편: 강가 역 (돔 · 시계) + 시티
  station2(sc, -19.5, FL - .4, -19.5, ROW, 1.05, 2);   // Flinders Street 역 · 불 켜진 저녁 (?flinders=2)
  // 역 뒤: 선명한 멜버른 도심 실루엣
  [-8, 13].forEach((t) => { const [x, z] = along(-21.5, -21.5, t); sc.add(tree(x, z, FL - .4, 1.6, 0x6FAE6A)); });
  // 역 뒤 멜버른 도심: 3D 빌딩 줄 (사암 오피스 · 유리 타워 · 아르데코 · 금빛 꼭대기 타워 · 첨탑) + 먼 안개 실루엣
  melbCity(S, FL);
  // 큰유황앵무 (흰 몸 · 노란 볏): 강 위를 나는 무리 + 난간에 앉은 두 마리
  const cockatoo = () => { const b = new THREE.Group(), wh = { color: 0xF7F6F2, roughness: .6 };
    const body = std(new THREE.SphereGeometry(.22, 14, 10), wh); body.scale.set(1.5, .9, .9); b.add(body); b.add(at(std(new THREE.SphereGeometry(.15, 12, 10), wh), .3, .12, 0));
    b.add(at(std(new THREE.ConeGeometry(.05, .12, 8), { color: 0x2B2B2E }), .45, .08, 0)); b.children[b.children.length - 1].rotation.z = -Math.PI / 2;
    for (let k = 0; k < 4; k++) { const c = std(new THREE.ConeGeometry(.03, .26, 6), { color: 0xFFD23C, roughness: .5 }); c.position.set(.26 - k * .04, .3, (k - 1.5) * .02); c.rotation.z = .5 + k * .18; b.add(c); }
    const tail = std(new THREE.BoxGeometry(.3, .04, .14), wh); tail.position.set(-.38, -.02, 0); b.add(tail);
    // 날개: 어깨에서 끝으로 가늘어지고 뒤쪽 깃털이 갈라진 모양 (몸 옆에서 위아래로 퍼덕여요)
    const ws = new THREE.Shape(); ws.moveTo(.16, 0); ws.quadraticCurveTo(.2, .32, .06, .62); ws.quadraticCurveTo(-.02, .78, -.16, .82); ws.lineTo(-.2, .7); ws.lineTo(-.28, .66); ws.lineTo(-.27, .54); ws.lineTo(-.34, .48); ws.lineTo(-.3, .36); ws.lineTo(-.36, .28); ws.lineTo(-.28, .14); ws.quadraticCurveTo(-.24, 0, -.16, 0); ws.lineTo(.16, 0);
    const wg = new THREE.ShapeGeometry(ws); wg.rotateX(Math.PI / 2); wg.translate(0, .04, .1);
    const wm = new THREE.MeshStandardMaterial({ color: 0xF7F6F2, emissive: 0x2A2410, side: THREE.DoubleSide, roughness: .6 }), w1 = new THREE.Mesh(wg, wm), w2 = new THREE.Mesh(wg, wm); w2.scale.z = -1; b.add(w1, w2); return { b, w1, w2 }; };
  const flock = []; for (let i = 0; i < 9; i++) { const c = cockatoo(); c.b.scale.setScalar(1.6); sc.add(c.b); flock.push([c, rnd() * 6, (rnd() - .5) * 3, (rnd() - .5) * 1.6]); }
  S.ticks.push((t) => flock.forEach(([c, ph, dt, dy], i) => { const p = ((t * 1.1 + ph * 4) % 44) - 22, [x, z] = along(-15, -15, p + dt); c.b.position.set(x + dy, 7.6 + dy * .6 + Math.sin(t * 1.5 + ph) * .35, z + dy); c.b.rotation.set(0, ROW, Math.sin(t * 1.5 + ph) * .1); const f = Math.sin(t * 7 + ph * 3) * .75 + .15; c.w1.rotation.x = -f; c.w2.rotation.x = f; }));
  [[-3.6, .3], [5.4, -.2]].forEach(([tt, yy]) => { const c = cockatoo(), [x, z] = along(-8.9, -8.9, tt); c.b.scale.setScalar(1.4); c.w1.visible = c.w2.visible = false; const fold = std(new THREE.SphereGeometry(.2, 12, 8), { color: 0xEDEBE4, roughness: .6 }); fold.scale.set(1.5, .55, 1.05); fold.position.set(-.06, .03, 0); c.b.add(fold); c.b.position.set(x, FL + 1.3 + yy * 0, z); c.b.rotation.y = ROW + Math.PI * .5 + yy; sc.add(c.b); S.ticks.push((t) => { c.b.rotation.z = Math.sin(t * 2 + tt) * .08; }); });
  // 유람선 · 조정 보트
  const cruise = new THREE.Group(); cruise.add(at(std(new THREE.BoxGeometry(5, .7, 1.4), { color: 0xF7F7F8 }), 0, 0, 0)); cruise.add(at(std(new THREE.BoxGeometry(3.4, .7, 1.2), { color: 0x2B2F44, roughness: .2 }), -.3, .7, 0)); cruise.add(at(std(new THREE.BoxGeometry(3.6, .1, 1.3), { color: 0xF7F7F8 }), -.3, 1.1, 0));
  for (let k = -1.8; k <= 1.2; k += .5) cruise.add(at(new THREE.Mesh(new THREE.BoxGeometry(.3, .25, .02), new THREE.MeshBasicMaterial({ color: 0xFFE7A8 })), k, .7, .61)); cruise.rotation.y = ROW; sc.add(cruise);
  // 직진만: 왼쪽 화면 밖에서 와서 다리 앞에서 스르르 사라져요 (돌지 않아요)
  cruise.traverse((o) => { if (o.material) { o.material = o.material.clone(); o.material.transparent = true; } });
  S.ticks.push((t) => { const p = -15 + ((t * .55 + 6) % 17.5), [x, z] = along(-13.6, -13.6, p), op = Math.max(0, Math.min(1, (2.2 - p) / 2.4)); cruise.position.set(x, FL - .2, z); cruise.rotation.y = ROW + Math.PI; cruise.traverse((o) => { if (o.material) o.material.opacity = op; }); cruise.visible = op > .01; });
  const boat = new THREE.Group(), hs = new THREE.Shape(); hs.moveTo(-2.6, 0); hs.quadraticCurveTo(0, .24, 2.6, 0); hs.quadraticCurveTo(0, -.24, -2.6, 0);
  const hull = std(new THREE.ExtrudeGeometry(hs, { depth: .16, bevelEnabled: true, bevelThickness: .04, bevelSize: .03, bevelSegments: 2 }), { color: 0x1F4E9C, roughness: .35 }); hull.rotation.x = Math.PI / 2; hull.position.y = .1; boat.add(hull);
  const deckS = new THREE.Shape(); deckS.moveTo(-2.4, 0); deckS.quadraticCurveTo(0, .2, 2.4, 0); deckS.quadraticCurveTo(0, -.2, -2.4, 0); const deckM = std(new THREE.ShapeGeometry(deckS), { color: 0xF7F4EE }); deckM.rotation.x = -Math.PI / 2; deckM.position.y = .13; boat.add(deckM);
  const oars = [];
  [-1.35, -.45, .45, 1.35].forEach((x, i) => { const r = person(0, 0, [0xE0483F, 0xF2C230, 0xE0483F, 0xF2C230][i], 1, 0); r.rotation.y = -Math.PI / 2; r.scale.setScalar(.95); r.position.set(x, .06, 0); boat.add(r);
    const side = i % 2 ? 1 : -1, piv = new THREE.Group(); piv.position.set(x + .18, .38, side * .2);
    const sh = std(new THREE.CylinderGeometry(.026, .026, 1.8, 6), { color: 0x2B2B2E }); sh.rotation.x = Math.PI / 2; sh.position.z = side * .85; piv.add(sh);
    const bl = std(new THREE.BoxGeometry(.14, .03, .34), { color: 0xF2C230 }); bl.position.z = side * 1.72; piv.add(bl); boat.add(piv); oars.push([piv, side]); });
  boat.rotation.y = ROW; sc.add(boat);
  // 직진만: 왼쪽 화면 밖에서 와서 다리 밑을 지나 오른쪽 밖으로 (돌지 않아요)
  S.ticks.push((t) => { const p = -13 + ((t * .8) % 28), [x, z] = along(-12, -12, p); boat.position.set(x, FL - .42, z); boat.rotation.y = ROW; const st = t * 3.2; oars.forEach(([pv, sd]) => { pv.rotation.y = Math.sin(st) * .45 * sd; pv.rotation.x = (Math.cos(st) > 0 ? -.2 : .06) * sd; }); });
  // 강변 카페 테이블 · 사람 · 유칼립투스
  const C = [0x1F4E9C, 0xE0483F, 0xF2C230, 0x2F8F5B, 0xF7F4EE];
  [[-7.2, -2.6], [-2.6, -7.2], [-7.6, 1.6], [1.6, -7.6]].forEach(([x, z], i) => { sc.add(umbrella(x, z, [0xF7F4EE, 0x2F6B4A][i % 2], FL)); sc.add(person(x + .7, z + .3, C[i % 5], 1, FL)); sc.add(person(x - .6, z - .4, C[(i + 2) % 5], 1, FL)); });
  sc.add(gum(-8.6, 4.6, FL, 1.2)); sc.add(gum(4.6, -8.6, FL, 1.1)); }

// ===== 캠퍼스: 잔디 위 (공통) =====
const lawnTex = () => canvasTex(256, 256, (g, W, H) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#8CC97A' : '#83C171'; g.fillRect(0, i * H / 8, W, H / 8); } }, 12, 12);
function lawn(sc, pathCol = 0xE6DCC8) { const l = std(new THREE.PlaneGeometry(110, 110), { map: lawnTex(), roughness: .95 }, { cast: false }); l.rotation.x = -Math.PI / 2; l.position.y = -.25; sc.add(bgs(l));
  const p = std(new THREE.PlaneGeometry(2.2, 60), { color: pathCol, roughness: .9 }, { cast: false }); p.rotation.x = -Math.PI / 2; p.rotation.z = ROW; p.position.set(-8.4, -.23, -8.4); sc.add(bgs(p)); }
const SKINS = [0xF1C9A5, 0xE3B08A, 0xC68B62, 0x8D5A3B], HAIRS = [0x2B1E16, 0x5A3A22, 0xD9A845, 0x1E1A2B, 0xB5562E, 0x7A6A5E], PANTS = [0x2F3B5C, 0x3A3A3E, 0x6B5A48, 0x24508F, 0xE8E2D6];
const person = (x, z, c, sit = 0, y = -.25) => { const g = new THREE.Group(), h = Math.abs(Math.round(x * 7.3 + z * 13.1)), skin = { color: SKINS[h % 4], roughness: .7 }, hair = { color: HAIRS[(h >> 2) % 6], roughness: .8 }, pant = { color: PANTS[(h >> 3) % 5], roughness: .8 }, top = { color: c, roughness: .7 };
  const cap = (r, l, m) => std(new THREE.CapsuleGeometry(r, l, 4, 10), m);
  const hip = sit ? .26 : .42;
  [-.075, .075].forEach((k) => { if (sit) { const th = cap(.06, .2, pant); th.rotation.x = Math.PI / 2; th.position.set(k, hip, .14); g.add(th); const sh = cap(.055, .18, pant); sh.position.set(k, hip - .14, .27); g.add(sh); g.add(at(std(new THREE.BoxGeometry(.09, .06, .14), { color: 0x2B2B2E }), k, .03, .31)); }
    else { const lg = cap(.06, .26, pant); lg.position.set(k, .2, 0); g.add(lg); g.add(at(std(new THREE.BoxGeometry(.09, .06, .15), { color: 0x2B2B2E }), k, .03, .03)); } });
  const tor = cap(.13, .2, top); tor.position.y = hip + .17; tor.scale.z = .8; g.add(tor);
  [-1, 1].forEach((k) => { const ar = cap(.045, .24, top); ar.position.set(k * .17, hip + .14, sit ? .06 : 0); ar.rotation.z = k * .18; if (sit) ar.rotation.x = -.5; g.add(ar); g.add(at(std(new THREE.SphereGeometry(.045, 8, 6), skin), k * .2, hip - .02, sit ? .14 : 0)); });
  const hy = hip + .5; g.add(at(std(new THREE.SphereGeometry(.13, 16, 12), skin), 0, hy, 0));
  const hr = std(new THREE.SphereGeometry(.137, 16, 10, 0, TAU, 0, Math.PI * .55), hair); hr.position.set(0, hy + .01, -.015); hr.rotation.x = -.25; g.add(hr);
  if (h % 3 === 0) g.add(at(std(new THREE.SphereGeometry(.07, 10, 8), hair), 0, hy - .02, -.14));
  if (h % 4 === 1 && !sit) g.add(at(std(new THREE.BoxGeometry(.22, .26, .1), { color: [0xE0483F, 0x2F8F5B, 0xF2C230][h % 3], roughness: .7 }), 0, hip + .2, -.14));
  [-1, 1].forEach((k) => g.add(at(new THREE.Mesh(new THREE.SphereGeometry(.018, 6, 4), new THREE.MeshBasicMaterial({ color: 0x1E1A2B })), k * .045, hy + .01, .122)));
  g.rotation.y = ((h % 12) / 12) * TAU; g.scale.setScalar(1.15); return at(g, x, y, z); };
const crowd = (sc, cx, cz, n, sit) => { const C = [0x1F4E9C, 0xE0483F, 0xF2C230, 0x2F8F5B, 0xF7F4EE, 0x8E6CF0, 0x1E1A2B]; for (let i = 0; i < n; i++) sc.add(person(cx + (rnd() - .5) * 4, cz + (rnd() - .5) * 4, C[i % C.length], sit)); };
const crestTex = () => canvasTex(128, 256, (g, W, H) => { g.fillStyle = '#23305E'; g.fillRect(0, 0, W, H); g.fillStyle = '#F3D98A'; g.beginPath(); g.moveTo(W * .5, H * .2); g.lineTo(W * .82, H * .28); g.lineTo(W * .78, H * .55); g.lineTo(W * .5, H * .72); g.lineTo(W * .22, H * .55); g.lineTo(W * .18, H * .28); g.closePath(); g.fill(); g.fillStyle = '#23305E'; g.font = '900 64px Lexend, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('P', W * .5, H * .44); g.fillStyle = '#F3D98A'; g.fillRect(0, H * .88, W, 6); });
const clothWave = (m, t, amp = .12, sp = 4, k = 6, ax = 'x', ph = 0) => { const p = m.geometry.attributes.position, b = m.geometry.userData.base || (m.geometry.userData.base = p.array.slice());
  const bb = m.geometry.boundingBox || (m.geometry.computeBoundingBox(), m.geometry.boundingBox), lo = ax === 'x' ? bb.min.x : bb.max.y, span = ax === 'x' ? bb.max.x - bb.min.x : bb.max.y - bb.min.y;
  for (let i = 0; i < p.count; i++) { const x = b[i * 3], y = b[i * 3 + 1], u = ax === 'x' ? (x - lo) / span : (lo - y) / span, w = Math.sin(t * sp - u * k + ph); p.setZ(i, b[i * 3 + 2] + w * amp * (.25 + u)); p.setY(i, y + (ax === 'x' ? Math.cos(t * sp * .7 - u * k + ph) * amp * .25 * u : 0)); }
  p.needsUpdate = true; m.geometry.computeVertexNormals(); };
const bannerPost = (sc, x, z) => { const g = new THREE.Group(); g.add(at(std(new THREE.CylinderGeometry(.06, .08, 3.4, 8), { color: 0x23262B, metalness: .5 }), 0, 1.7, 0)); const b = new THREE.Mesh(new THREE.PlaneGeometry(.7, 1.4, 6, 4), new THREE.MeshStandardMaterial({ map: crestTex(), side: THREE.DoubleSide })); b.position.set(.4, 2.5, 0); g.add(b); g.rotation.y = ROW; sc.add(at(g, x, -.25, z));  return b; };
const plaqueTex = (big, small, w = 1024, h = 160) => canvasTex(w, h, (g, W, H) => { g.fillStyle = '#23305E'; g.fillRect(0, 0, W, H); g.fillStyle = '#F3D98A'; g.textAlign = 'center'; g.textBaseline = 'middle'; let fs = Math.round(H * (small ? .42 : .56)); g.font = `800 ${fs}px Lexend, sans-serif`; while (g.measureText(big).width > W * .9) { fs -= 2; g.font = `800 ${fs}px Lexend, sans-serif`; } g.fillText(big, W / 2, H * (small ? .4 : .52)); if (small) { g.font = `600 ${Math.round(H * .2)}px Lexend, sans-serif`; g.fillStyle = '#C9D2F0'; g.fillText(small, W / 2, H * .8); } });
// ---------- 캠퍼스 도서관 앞 정원: 분수 광장 · 꽃밭 · 벚꽃 · 토피어리 · 꽃바구니 가로등 · 가랜드 · 풍선 ----------
const FLOWER_C = [0xF28CB1, 0xFFE200, 0xE8505B, 0xFFFFFF, 0x9C7BE8, 0xFF9E5E];
function flowerBed(G, cx, cz, t, len, wid = 1.1) { const g = new THREE.Group();
  g.add(at(std(new THREE.BoxGeometry(len + .3, .36, wid + .3), { color: 0x4D8B48, roughness: .9 }), 0, .18, 0));
  g.add(at(std(new THREE.BoxGeometry(len, .1, wid), { color: 0x6B4B33, roughness: 1 }), 0, .38, 0));
  const fg = new THREE.SphereGeometry(.13, 8, 6), mats = FLOWER_C.map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: .6 }));
  for (let i = 0; i < len * wid * 9; i++) { const m = new THREE.Mesh(fg, mats[(i * 7 + (i >> 2)) % mats.length]); m.position.set((rnd() - .5) * len, .46 + rnd() * .14, (rnd() - .5) * wid); m.scale.setScalar(.8 + rnd() * .6); g.add(m); }
  g.rotation.y = ROW; const [x, z] = along(cx, cz, t); G.add(at(g, x, -.25, z)); }
function blossom(G, x, z, s = 1) { const g = new THREE.Group(); const tr = std(new THREE.CylinderGeometry(.13 * s, .22 * s, 2.2 * s, 8), { color: 0x7A5440 }); tr.position.y = 1.1 * s; g.add(tr);
  [[0, 2.6, 0, 1], [.8, 2.3, .3, .8], [-.8, 2.3, -.2, .8], [.2, 2.4, -.8, .75], [-.3, 3.2, .3, .8], [.4, 3.0, .7, .7]].forEach(([a, b, c, r], i) => g.add(at(std(new THREE.IcosahedronGeometry(r * s, 1), { color: [0xF6B7CC, 0xF9D2DF, 0xEFA0BC][i % 3], roughness: .85 }), a * s, b * s, c * s)));
  G.add(at(g, x, -.25, z)); return g; }
function topiary(G, x, z) { const g = new THREE.Group(); g.add(at(std(new THREE.CylinderGeometry(.42, .32, .55, 12), { color: 0xD9B45A, roughness: .4, metalness: .4 }), 0, .27, 0));
  [[.55, .5], [.42, 1.2], [.28, 1.75]].forEach(([r, y]) => g.add(at(std(new THREE.SphereGeometry(r, 14, 10), { color: 0x3F7F43, roughness: .9 }), 0, y, 0))); G.add(at(g, x, -.25, z)); }
function libraryGarden(S, roofF) { const sc = S.sc, G = new THREE.Group(), C = -8.9;
  // 광장 (원형 돌바닥 · 동심원 무늬)
  const pz = canvasTex(512, 512, (g, W, H) => { g.fillStyle = '#EDE3D0'; g.fillRect(0, 0, W, H); for (let r = 40; r < 256; r += 36) { g.strokeStyle = r % 72 ? '#D9CCB2' : '#E0B868'; g.lineWidth = r % 72 ? 4 : 7; g.beginPath(); g.arc(256, 256, r, 0, 7); g.stroke(); } for (let i = 0; i < 16; i++) { g.strokeStyle = '#D9CCB2'; g.lineWidth = 3; g.beginPath(); g.moveTo(256 + Math.cos(i / 16 * 7) * 60, 256 + Math.sin(i / 16 * 7) * 60); g.lineTo(256 + Math.cos(i / 16 * 7) * 250, 256 + Math.sin(i / 16 * 7) * 250); g.stroke(); } });
  const plaza = std(new THREE.CircleGeometry(3.6, 48), { map: pz, roughness: .9 }, { cast: false }); plaza.rotation.x = -Math.PI / 2; plaza.position.set(C, -.22, C); G.add(plaza);
  // 분수: 바깥 수반 · 물 · 2단 그릇 · 물줄기
  const stone = { color: 0xF1E9DA, roughness: .7 }, water = { color: 0x7FCBEA, roughness: .1, metalness: .2, emissive: 0x2A6E8E, emissiveIntensity: .25 };
  G.add(at(std(new THREE.CylinderGeometry(1.8, 1.9, .55, 32), stone), C, .02, C)); G.add(at(std(new THREE.CylinderGeometry(1.62, 1.62, .06, 32), water), C, .27, C));
  G.add(at(std(new THREE.CylinderGeometry(.22, .34, 1.4, 12), stone), C, .9, C)); G.add(at(std(new THREE.CylinderGeometry(.95, .4, .3, 24), stone), C, 1.6, C)); G.add(at(std(new THREE.CylinderGeometry(.85, .85, .04, 24), water), C, 1.74, C));
  G.add(at(std(new THREE.CylinderGeometry(.12, .2, .7, 10), stone), C, 2.05, C)); G.add(at(std(new THREE.CylinderGeometry(.45, .2, .18, 18), stone), C, 2.45, C));
  const jet = new THREE.Mesh(new THREE.ConeGeometry(.12, 1.1, 10), new THREE.MeshStandardMaterial({ color: 0xDFF4FF, transparent: true, opacity: .75, emissive: 0x9FDFFF, emissiveIntensity: .3 })); jet.position.set(C, 3.05, C); G.add(jet);
  const dg = new THREE.SphereGeometry(.06, 6, 4), dm = new THREE.MeshStandardMaterial({ color: 0xCFEFFF, emissive: 0x9FDFFF, emissiveIntensity: .4 }), drops = [];
  for (let i = 0; i < 28; i++) { const d = new THREE.Mesh(dg, dm); G.add(d); drops.push(d); }
  // 꽃밭: 분수 양옆 · 도서관 양옆
  [-1, 1].forEach((k) => { flowerBed(G, -9.4, -9.4, k * 5.2, 3.6); flowerBed(G, -11.6, -11.6, k * 9.2, 2.6, 1.6); flowerBed(G, -7.9, -7.9, k * 9.6, 2.2); });
  // 토피어리: 계단 양끝 · 광장 입구
  [-1, 1].forEach((k) => { let [x, z] = along(-10.6, -10.6, k * 7.6); topiary(G, x, z); [x, z] = along(-7.6, -7.6, k * 3.6); topiary(G, x, z); });
  // 벚꽃 나무 + 꽃잎
  const BL = [[-12.4, 10.2, 1.1], [-12.4, -10.2, 1.1], [-15.6, 12.8, 1.35], [-15.6, -12.8, 1.35], [-9.2, 12.4, .95], [-9.2, -12.4, .95]].map(([c, t, s2]) => { const [x, z] = along(c, c, t); blossom(G, x, z, s2); return [x, z]; });
  const pg = new THREE.PlaneGeometry(.16, .11), pm = new THREE.MeshBasicMaterial({ color: 0xF9C4D6, side: THREE.DoubleSide }), petals = [];
  for (let i = 0; i < 46; i++) { const p = new THREE.Mesh(pg, pm), b = BL[i % BL.length]; p.userData = { x: b[0] + (rnd() - .5) * 2, z: b[1] + (rnd() - .5) * 2, ph: rnd(), sp: .12 + rnd() * .1 }; G.add(p); petals.push(p); }
  // 꽃바구니 가로등
  [-4.8, 4.8].forEach((t) => { const [x, z] = along(-7.4, -7.4, t); lamp(G, x, z, -.25, false); [[.32, 0], [-.32, 0]].forEach(([a]) => { const [bx, bz] = [x + a * .7071, z - a * .7071]; G.add(at(std(new THREE.SphereGeometry(.24, 12, 8, 0, TAU, Math.PI / 2, Math.PI / 2), { color: 0x6B4B33 }), bx, 1.75, bz)); for (let i = 0; i < 7; i++) G.add(at(std(new THREE.SphereGeometry(.09, 6, 4), { color: FLOWER_C[i % 6] }), bx + (rnd() - .5) * .34, 1.8 + rnd() * .12, bz + (rnd() - .5) * .34)); }); });
  // 가랜드: 배너 기둥 사이 삼각 깃발 줄
  const fC = [0xFFE200, 0xF28CB1, 0x7FA7E8, 0x493087, 0xFFFFFF], tri = new THREE.Shape(); tri.moveTo(-.16, 0); tri.lineTo(.16, 0); tri.lineTo(0, -.34); tri.lineTo(-.16, 0); const tg = new THREE.ShapeGeometry(tri); let fi = 0;
  for (let i = -3; i < 3; i += 2) { const [x1, z1] = along(-7.2, -7.2, i * 2.4), [x2, z2] = along(-7.2, -7.2, (i + 2) * 2.4);
    const pts = []; for (let k = 0; k <= 16; k++) { const u = k / 16; pts.push(new THREE.Vector3(x1 + (x2 - x1) * u, 3.0 - Math.sin(u * Math.PI) * .55, z1 + (z2 - z1) * u)); }
    G.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x3A3A3E })));
    const bunt = S.bunt || (S.bunt = []); for (let k = 1; k < 16; k += 2) { const m = new THREE.Mesh(tg, new THREE.MeshStandardMaterial({ color: fC[fi++ % fC.length], side: THREE.DoubleSide, roughness: .7 })); m.position.copy(pts[k]); m.rotation.order = 'YXZ'; m.rotation.y = ROW; m.userData.ph = k * .7 + i; G.add(m); bunt.push(m); } }
  // 풍선 묶음 (둥실)
  const balloons = []; { const [bx, bz] = along(-8.6, -8.6, 11.2); [[0, 3.6, 0, 0xF28CB1], [.45, 3.3, .2, 0xFFE200], [-.4, 3.35, .25, 0x7FA7E8], [.15, 3.95, -.3, 0x9C7BE8], [-.2, 3.0, -.35, 0xFF9E5E]].forEach(([a, b, c, col], i) => {
    const bb = new THREE.Group(); bb.add(at(std(new THREE.SphereGeometry(.32, 16, 12), { color: col, roughness: .25, metalness: .1 }), 0, 0, 0)); bb.children[0].scale.y = 1.15; const st = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -.36, 0), new THREE.Vector3(-a, -b + .1, -c)]), new THREE.LineBasicMaterial({ color: 0x5A5A5E })); bb.add(st);
    bb.position.set(bx + a, b - .25, bz + c); G.add(bb); balloons.push([bb, b - .25, i]); }); G.add(at(std(new THREE.BoxGeometry(.3, .2, .3), { color: 0xD9B45A }), bx, -.15, bz)); }
  sc.add(bgs(G));
  S.ticks.push((t) => {
    drops.forEach((d, i) => { const p = (t * .7 + i / drops.length) % 1, a = i * 2.4; d.position.set(C + Math.cos(a) * p * 1.25, 3.3 + 2.2 * p * (1 - p) * 2 - p * 1.4, C + Math.sin(a) * p * 1.25); });
    jet.scale.y = 1 + Math.sin(t * 6) * .08;
    petals.forEach((p) => { const u = p.userData, k = (t * u.sp + u.ph) % 1; p.position.set(u.x + Math.sin(t * .9 + u.ph * 9) * .5 + k * 1.6, 3.6 - k * 3.8, u.z + Math.cos(t * .7 + u.ph * 7) * .4 + k * .6); p.rotation.set(t * 1.3 + u.ph * 5, t * .8, u.ph * 3); });
    balloons.forEach(([b, y, i]) => { b.position.y = y + Math.sin(t * 1.2 + i) * .12; b.rotation.z = Math.sin(t * .9 + i) * .06; });
    roofF.forEach((f, i) => { f.rotation.y = Math.sin(t * 1.3 + i * 2) * .12; if (f.geometry.attributes.position.count > 4) clothWave(f, t, .1, 4.5, 6, 'x', i * 2); });
    (S.bunt || []).forEach((m) => { m.rotation.x = Math.sin(t * 2.6 + m.userData.ph) * .38; }); }); }
// 정면: 아치 창 (rows · cols) · 1층 러스티케이션 · 창 안 따뜻한 불빛 + 책장
const archFacade = (wall, trim, cols, rows, { gothic = false, glass = '#43566E', warm = .35, base = true } = {}) => canvasTex(1024, 512, (g, W, H) => { g.fillStyle = wall; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 700; i++) { g.fillStyle = `rgba(${rnd() > .5 ? '255,255,255' : '80,60,30'},${rnd() * .05})`; g.fillRect(rnd() * W, rnd() * H, 4 + rnd() * 16, 2 + rnd() * 6); }
  if (base) { g.fillStyle = 'rgba(80,60,30,.18)'; for (let y = H * .62; y < H; y += 26) g.fillRect(0, y, W, 3); }
  g.fillStyle = trim; g.fillRect(0, H * .58, W, 12); g.fillRect(0, 0, W, 14);
  const cw = W / cols; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const x = c * cw + cw * .24, w = cw * .52, y0 = r === 0 ? H * .1 : H * .66, h = r === 0 ? H * .42 : H * .28;
    g.fillStyle = trim; g.beginPath(); g.moveTo(x - 8, y0 + h + 6); g.lineTo(x - 8, y0 + w / 2); if (gothic) { g.lineTo(x + w / 2, y0 - 18); g.lineTo(x + w + 8, y0 + w / 2); } else g.arc(x + w / 2, y0 + w / 2, w / 2 + 8, Math.PI, 0); g.lineTo(x + w + 8, y0 + h + 6); g.fill();
    const lit = rnd() < warm; g.fillStyle = lit ? '#F6C982' : glass; g.beginPath(); g.moveTo(x, y0 + h); g.lineTo(x, y0 + w / 2); if (gothic) { g.lineTo(x + w / 2, y0 - 8); g.lineTo(x + w, y0 + w / 2); } else g.arc(x + w / 2, y0 + w / 2, w / 2, Math.PI, 0); g.lineTo(x + w, y0 + h); g.fill();
    if (lit) { for (let k = 1; k < 4; k++) { g.fillStyle = 'rgba(120,70,40,.55)'; g.fillRect(x + 3, y0 + h * k / 4, w - 6, 3); for (let b = 0; b < 6; b++) { g.fillStyle = ['#B4533C', '#3E6C8E', '#D9A441', '#5E8C5A'][b % 4]; g.fillRect(x + 4 + b * (w - 8) / 6, y0 + h * k / 4 - 12, (w - 8) / 6 - 2, 12); } } }
    if (gothic) { g.fillStyle = 'rgba(255,255,255,.0)'; const cols2 = ['rgba(210,70,90,.55)', 'rgba(70,120,200,.55)', 'rgba(230,190,60,.55)', 'rgba(90,170,110,.5)']; for (let k = 0; k < 6; k++) { g.fillStyle = cols2[k % 4]; g.fillRect(x + (k % 2) * w / 2, y0 + w / 2 + Math.floor(k / 2) * (h - w / 2) / 3, w / 2, (h - w / 2) / 3); } }
    g.fillStyle = trim; g.fillRect(x + w / 2 - 2, y0 + 6, 4, h - 6); g.fillRect(x, y0 + h * .55, w, 4); } });
const roseTex = () => canvasTex(256, 256, (g, W, H) => { g.fillStyle = '#E8D2A6'; g.beginPath(); g.arc(128, 128, 126, 0, 7); g.fill(); const C = ['#D2465A', '#3F6FC4', '#E6BE3C', '#5AAA6E', '#8E5CC4'];
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; g.fillStyle = C[i % 5]; g.beginPath(); g.moveTo(128, 128); g.arc(128, 128, 104, a, a + TAU / 12 - .05); g.fill(); } g.strokeStyle = '#E8D2A6'; g.lineWidth = 8; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + Math.cos(a) * 110, 128 + Math.sin(a) * 110); g.stroke(); }
  g.beginPath(); g.arc(128, 128, 60, 0, 7); g.stroke(); g.fillStyle = '#F3D98A'; g.beginPath(); g.arc(128, 128, 30, 0, 7); g.fill(); g.fillStyle = '#23305E'; g.font = '900 34px Lexend, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('P', 128, 130); });
const flagOn = (g, x, y, z, c, h = 1.6) => { g.add(at(std(new THREE.CylinderGeometry(.04, .05, h, 6), { color: 0xE9E2D4, metalness: .3 }), x, y + h / 2, z)); g.add(at(std(new THREE.SphereGeometry(.07, 8, 6), { color: 0xE2B84E, metalness: .8, roughness: .3 }), x, y + h + .05, z)); const fl = std(new THREE.PlaneGeometry(.9, .5, 6, 1), { color: c, side: THREE.DoubleSide }); fl.geometry.translate(.45, 0, 0); g.add(at(fl, x, y + h - .3, z)); return fl; };
const balus = (g, x, y, z, len, step = .26, r = .05, h = .3, c = 0xF4EDE0) => { const n = Math.round(len / step), im = new THREE.InstancedMesh(new THREE.CylinderGeometry(r * .8, r, h, 6), new THREE.MeshStandardMaterial({ color: c, roughness: .7 }), n), o = new THREE.Object3D(); for (let i = 0; i < n; i++) { o.position.set(x - len / 2 + (i + .5) * step, y + h / 2, z); o.updateMatrix(); im.setMatrixAt(i, o.matrix); } g.add(im); g.add(at(std(new THREE.BoxGeometry(len + .1, .08, .16), { color: c }), x, y + h + .04, z)); };
const pedi = (g, w, h, d, y, z, mat) => { const p = new THREE.Shape(); p.moveTo(-w / 2, 0); p.lineTo(w / 2, 0); p.lineTo(0, h); p.lineTo(-w / 2, 0); const m = std(new THREE.ExtrudeGeometry(p, { depth: d, bevelEnabled: false }), mat); m.position.set(0, y, z); g.add(m); return m; };
function libBuild(g) {
  const plaque = (w, y, z, txt = 'PALLO UNIVERSITY LIBRARY') => { const pl = new THREE.Mesh(new THREE.PlaneGeometry(w, w * .095), new THREE.MeshBasicMaterial({ map: plaqueTex(txt) })); pl.position.set(0, y, z); g.add(pl); };
  { // 신고전 그랜드 (?library=1): 대리석 · 코린트 기둥 · 금빛 리브 청록 돔 · 날개동 난간 · 지붕 조각상
    const mb = { color: 0xF4EFE6, roughness: .55 }, tr = { color: 0xE4D8C2, roughness: .7 }, gold = { color: 0xE2B84E, roughness: .3, metalness: .85 };
    [0, 1, 2, 3].forEach((i) => g.add(at(std(new THREE.BoxGeometry(15 - i * .5, .26, 7.6 - i * .5), i % 2 ? tr : mb), 0, .13 + i * .26, .5 + i * .2)));
    const fy = 1.04; g.add(at(faceBox(8.6, 4.6, 5, { map: archFacade('#EFE8DC', '#F8F4EC', 4, 2, { warm: .5 }) }, mb), 0, fy + 2.3, -.6));
    [-1, 1].forEach((k) => { g.add(at(faceBox(3.4, 3.8, 4.4, { map: archFacade('#EAE2D4', '#F8F4EC', 2, 2, { warm: .4 }) }, mb), k * 6.0, fy + 1.9, -.8)); g.add(at(std(new THREE.BoxGeometry(3.6, .28, 4.6), tr), k * 6.0, fy + 3.94, -.8)); balus(g, k * 6.0, fy + 4.08, 1.38, 3.4);
      g.add(at(std(new THREE.BoxGeometry(.5, .5, .5), tr), k * 7.4, fy + 4.3, 1.3)); g.add(at(std(new THREE.SphereGeometry(.3, 14, 10), mb), k * 7.4, fy + 4.8, 1.3)); });
    for (let i = 0; i < 6; i++) { const x = -3.4 + i * 1.36, col = new THREE.Group(); col.add(at(std(new THREE.CylinderGeometry(.27, .31, 4.0, 20), { map: canvasTex(128, 32, (gg, W, H) => { gg.fillStyle = '#F6F1E8'; gg.fillRect(0, 0, W, H); gg.fillStyle = 'rgba(150,130,100,.28)'; for (let k = 0; k < W; k += 8) gg.fillRect(k, 0, 3, H); }), roughness: .5 }), 0, 2.3, 0));
      col.add(at(std(new THREE.BoxGeometry(.78, .2, .78), tr), 0, .1, 0)); col.add(at(std(new THREE.CylinderGeometry(.42, .3, .34, 16), mb), 0, 4.45, 0)); col.add(at(std(new THREE.BoxGeometry(.84, .14, .84), tr), 0, 4.68, 0)); const cap = std(new THREE.TorusGeometry(.32, .07, 6, 16), gold); cap.rotation.x = Math.PI / 2; col.add(at(cap, 0, 4.36, 0)); g.add(at(col, x, fy - .1, 2.5)); }
    g.add(at(std(new THREE.BoxGeometry(9.2, .62, 1.5), mb), 0, fy + 4.95, 2.3)); g.add(at(std(new THREE.BoxGeometry(9.4, .16, 1.6), tr), 0, fy + 5.33, 2.3)); plaque(6.2, fy + 4.95, 3.06);
    pedi(g, 9.4, 1.8, .7, fy + 5.41, 2.0, mb); const em = new THREE.Mesh(new THREE.CircleGeometry(.42, 32), new THREE.MeshStandardMaterial({ map: roseTex(), roughness: .4 })); em.position.set(0, fy + 6.05, 2.72); g.add(em);
    g.add(at(std(new THREE.BoxGeometry(8.8, .3, 5.2), tr), 0, fy + 4.75, -.6));
    // 드럼 (기둥 고리) + 청록 돔 + 금빛 리브 + 랜턴
    const dy = fy + 4.9; g.add(at(std(new THREE.CylinderGeometry(2.3, 2.4, .5, 40), tr), 0, dy + .25, -.8)); g.add(at(std(new THREE.CylinderGeometry(2.0, 2.0, 1.5, 40), { map: archFacade('#EFE8DC', '#F8F4EC', 8, 1, { base: false, warm: .6 }) }), 0, dy + 1.25, -.8));
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; g.add(at(std(new THREE.CylinderGeometry(.08, .09, 1.5, 8), mb), Math.cos(a) * 2.12, dy + 1.25, -.8 + Math.sin(a) * 2.12)); }
    g.add(at(std(new THREE.CylinderGeometry(2.25, 2.25, .2, 40), tr), 0, dy + 2.1, -.8)); const dome = std(new THREE.SphereGeometry(2.05, 40, 20, 0, TAU, 0, Math.PI / 2), { color: 0x2F7F84, roughness: .35, metalness: .35 }); dome.scale.y = 1.12; g.add(at(dome, 0, dy + 2.2, -.8));
    for (let i = 0; i < 12; i++) { const rib = std(new THREE.TorusGeometry(2.07, .045, 6, 24, Math.PI / 2), gold); rib.rotation.set(0, i / 12 * TAU, Math.PI / 2); rib.scale.set(1, 1.12, 1); rib.position.set(0, dy + 2.2, -.8); g.add(rib); }
    g.add(at(std(new THREE.CylinderGeometry(.35, .4, .7, 12), mb), 0, dy + 4.7, -.8)); g.add(at(std(new THREE.SphereGeometry(.38, 16, 8, 0, TAU, 0, Math.PI / 2), gold), 0, dy + 5.05, -.8)); g.add(at(std(new THREE.CylinderGeometry(.03, .05, .9, 6), gold), 0, dy + 5.8, -.8));
    return [flagOn(g, -6.0, fy + 4.1, -1.6, 0xFFE200), flagOn(g, 6.0, fy + 4.1, -1.6, 0xF28CB1)]; }
}
// 캠퍼스 1안 · 기둥 도서관 (신고전 · 돔 · 계단 · 배너)
function uniLibrary(S) { const sc = S.sc; lawn(sc); const g = new THREE.Group(), stn = { color: 0xE8DCC4, roughness: .85 };
  const roofF = libBuild(g, 1);   // 도서관 시안 (?library=1)
  g.rotation.y = ROW; sc.add(bgs(at(g, -13, -.25, -13)));
  const bans = []; for (let i = -3; i <= 3; i += 2) { const [x, z] = along(-7.2, -7.2, i * 2.4); bans.push(bannerPost(sc, x, z)); }
  S.ticks.push((t) => bans.forEach((b, i) => b && clothWave(b, t, .07, 3.2, 4.5, 'x', i * 1.3)));
  libraryGarden(S, roofF);
  crowd(sc, -7, 2, 6, 1); crowd(sc, 2, -7, 6, 0); [[-10, 6], [6, -10], [9, 4], [4, 9]].forEach(([x, z], i) => sc.add(tree(x, z, -.25, 1.7, i % 2 ? 0x5DAA5E : 0x6DBE6A))); }
// ---------- 여행 · 비즈니스 배경 ----------
const asphaltTex = (rx, ry, base = '#5A5E65') => canvasTex(256, 256, (g, W, H) => { g.fillStyle = base; g.fillRect(0, 0, W, H); for (let i = 0; i < 600; i++) { g.fillStyle = `rgba(${rnd() > .5 ? '255,255,255' : '0,0,0'},${.03 + rnd() * .05})`; g.fillRect(rnd() * W, rnd() * H, 2, 2); } }, rx, ry);
const ground = (sc, map, y = -.02, size = 140) => { const m = std(new THREE.PlaneGeometry(size, size), { map, roughness: .92 }, { cast: false }); m.rotation.x = -Math.PI / 2; m.position.y = y; sc.add(bgs(m)); return m; };
const strip = (sc, cx, cz, len, wid, col, y = .005, map) => { const m = std(new THREE.PlaneGeometry(len, wid), map ? { map, roughness: .8 } : { color: col, roughness: .8 }, { cast: false }); m.rotation.x = -Math.PI / 2; m.rotation.z = ROW; m.position.set(cx, y, cz); sc.add(bgs(m)); return m; };
const rowDash = (sc, cx, cz, len, col, y = .02, step = 1.6, w = .8, h = .12) => { for (let t = -len / 2; t < len / 2; t += step) { const [x, z] = along(cx, cz, t); const d = new THREE.Mesh(new THREE.BoxGeometry(w, .02, h), new THREE.MeshBasicMaterial({ color: col })); d.rotation.y = ROW; d.position.set(x, y, z); sc.add(d); } };
const palmT = (x, z, y = 0, s = 1) => { const g = new THREE.Group(); const tr = std(new THREE.CylinderGeometry(.1 * s, .16 * s, 2.6 * s, 8), { color: 0xA97B4F }); tr.position.y = 1.3 * s; tr.rotation.z = .15; g.add(tr);
  for (let i = 0; i < 7; i++) { const l = std(new THREE.ConeGeometry(.2 * s, 1.6 * s, 4), { color: i % 2 ? 0x3E9A55 : 0x56B067 }); l.geometry.translate(0, .8 * s, 0); l.position.set(.2 * s, 2.6 * s, 0); l.rotation.set(0, i * .9, Math.PI / 2 - .4); g.add(l); } return at(g, x, y, z); };

// 여행 · 해변 리조트 (바다 · 모래사장 · 야자수 · 호텔 · 요트)
function travelBeach(S) { const sc = S.sc;
  const wt = canvasTex(256, 256, (g, W, H) => { g.fillStyle = '#3BB3D6'; g.fillRect(0, 0, W, H); g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 3; for (let i = 0; i < 40; i++) { const x = rnd() * W, y = rnd() * H; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 10, y - 4, x + 22, y); g.stroke(); } }, 18, 18);
  const sea = std(new THREE.PlaneGeometry(160, 160), { map: wt, roughness: .15, metalness: .15 }, { cast: false }); sea.rotation.x = -Math.PI / 2; sea.position.y = -.05; sc.add(bgs(sea)); S.ticks.push((t) => { wt.offset.set(t * .01, t * .006); });
  const sh = new THREE.Mesh(new THREE.CircleGeometry(8.6, 64), new THREE.MeshBasicMaterial({ color: 0x8FDCEB, transparent: true, opacity: .7 })); sh.rotation.x = -Math.PI / 2; sh.scale.y = 1.15; sh.position.y = -.03; sc.add(bgs(sh));
  const sand = std(new THREE.BoxGeometry(110, .6, 9), { color: 0xEFD9A6, roughness: .95 }); sand.rotation.y = ROW; sand.position.set(-14, -.1, -14); sc.add(bgs(sand));
  rowDash(sc, -10.8, -10.8, 100, 0xFFFFFF, .02, 2.4, 1.6, .16);
  const SAND_L = 44, SAND_C = -13.6;
  { // 모래에 쓴 PALLO (손가락으로 판 홈처럼: 밝은 테두리 + 어두운 홈)
    const sandW = canvasTex(2048, 240, (g, W, H) => { g.clearRect(0, 0, W, H); const txt = 'PALLO'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineCap = 'round'; g.lineJoin = 'round';
      const SK = -.24; let fs = 260; g.font = `900 ${fs}px Lexend, sans-serif`;
      while (fs > 40 && (g.measureText(txt).width + fs * .3 > W * .94 || fs * .78 + 34 > H * .9)) { fs -= 4; g.font = `900 ${fs}px Lexend, sans-serif`; }
      const draw = (dx, dy, col, lw) => { g.save(); g.translate(W / 2 + dx, H / 2 + dy); g.transform(1, 0, SK, 1, 0, 0); g.font = `900 ${fs}px Lexend, sans-serif`; g.lineWidth = lw; g.strokeStyle = col; g.strokeText(txt, 0, 0); g.restore(); };
      draw(5, 6, 'rgba(255,250,236,.85)', 26); draw(0, 0, 'rgba(190,152,98,.7)', 18); draw(-1, -1, 'rgba(160,122,74,.45)', 7);
      for (let i = 0; i < 200; i++) { g.fillStyle = `rgba(180,146,96,${rnd() * .15})`; g.fillRect(rnd() * W, rnd() * H, 4, 4); } });
    const pw = new THREE.Mesh(new THREE.PlaneGeometry(SAND_L, SAND_L / 8.5), new THREE.MeshBasicMaterial({ map: sandW, transparent: true, depthWrite: false })); pw.rotation.set(-Math.PI / 2, 0, ROW);
    const [x, z] = along(SAND_C, SAND_C, 1.6); pw.position.set(x, .205, z); sc.add(bgs(pw)); }
  for (let t = -24; t <= 24; t += 4) { const [x, z] = along(-12.2, -12.2, t); sc.add(palmT(x, z, .2, 1.3)); }
  const umb = (x, z, c) => { const g = new THREE.Group(); g.add(at(std(new THREE.CylinderGeometry(.04, .04, 1.8, 6), { color: 0xF7F7F8 }), 0, .9, 0)); const tx = canvasTex(128, 32, (gg, W, H) => { for (let i = 0; i < 8; i++) { gg.fillStyle = i % 2 ? c : '#FFFFFF'; gg.fillRect(i * 16, 0, 16, H); } }); g.add(at(std(new THREE.ConeGeometry(1.1, .45, 16), { map: tx }), 0, 1.9, 0)); g.add(at(std(new THREE.BoxGeometry(1.4, .12, .55), { color: 0xFFFFFF }), .6, .2, .6)); return at(g, x, .2, z); };
  [-10, -6, -2, 2, 6, 10].forEach((t, i) => { const [x, z] = along(-10.6, -10.6, t); sc.add(umb(x, z, ['#E9536A', '#3F5BA9', '#FFC93C'][i % 3])); });
  // 감성 해변 상점가: 파스텔 · 원목 · 아치 창 · 따뜻한 실내 불빛 · 꽃상자 · 칠판 입간판 · 전구 줄
  const SHOPS = [['Salt & Sun', 'coffee · brunch', '#EFE3CF', '#6B8F7A', 'cafe'], ['Little Gelato', 'handmade', '#F3D3CF', '#B8655A', 'gelato'], ['Sea Glass', 'vintage boutique', '#D6E4E0', '#3F6E74', 'boutique'],
    ['Bloom', 'flowers', '#F1E1D8', '#A85F6E', 'flower'], ['Paper Moon', 'books & coffee', '#E7DCC8', '#4E5A7A', 'books'], ['Driftwood', 'bakery', '#EADCC4', '#8C6239', 'bakery'],
    ['Wave Records', 'vinyl', '#DCD6E6', '#5E4E7A', 'records'], ['Linen House', 'slow living', '#EEE8DE', '#7A7466', 'linen'], ['Golden Hour', 'wine bar', '#EAD7B8', '#9C6B2E', 'bar']];
  const SERIF = '"DM Serif Display", Georgia, serif', shopTexs = [];
  const drawShop = (g, W, H, [name, sub, wall, acc, kind]) => { g.clearRect(0, 0, W, H); g.fillStyle = wall; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(120,90,60,.06)'; for (let i = 0; i < 120; i++) g.fillRect((i * 53) % W, (i * 97) % H, 18, 2);
    // 위층: 아치 창 + 덧창 + 꽃상자
    [40, 150].forEach((y) => [34, 146].forEach((x) => { g.fillStyle = '#F7F2EA'; g.beginPath(); g.moveTo(x - 6, y + 92); g.lineTo(x - 6, y + 30); g.arc(x + 38, y + 30, 44, Math.PI, 0); g.lineTo(x + 82, y + 92); g.fill();
      g.fillStyle = '#F3D9A8'; g.beginPath(); g.moveTo(x, y + 86); g.lineTo(x, y + 30); g.arc(x + 38, y + 30, 38, Math.PI, 0); g.lineTo(x + 76, y + 86); g.fill(); g.fillStyle = 'rgba(255,240,200,.6)'; g.fillRect(x + 36, y - 6, 4, 92); g.fillRect(x, y + 46, 76, 4);
      g.fillStyle = acc; g.globalAlpha = .55; g.fillRect(x - 20, y + 4, 14, 82); g.fillRect(x + 82, y + 4, 14, 82); g.globalAlpha = 1;
      g.fillStyle = '#8C6239'; g.fillRect(x - 4, y + 90, 84, 12); ['#E9A0A8', '#F4E3A0', '#F7F2EA', '#C9A8D8'].forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.arc(x + 6 + i * 22, y + 88, 7, 0, 7); g.fill(); }); g.fillStyle = '#6E9A6A'; for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(x + i * 15, y + 86, 6, 3, .4, 0, 7); g.fill(); } }));
    // 간판: 나무 판 위 세리프 이탤릭 + 작은 부제
    g.fillStyle = acc; g.beginPath(); g.roundRect(14, 262, W - 28, 66, 10); g.fill(); g.strokeStyle = 'rgba(255,248,232,.7)'; g.lineWidth = 3; g.beginPath(); g.roundRect(20, 268, W - 40, 54, 7); g.stroke();
    g.fillStyle = '#FFF8E8'; g.textAlign = 'center'; g.textBaseline = 'middle'; let fs = 40; g.font = `italic 400 ${fs}px ${SERIF}`; while (g.measureText(name).width > W * .8) { fs -= 2; g.font = `italic 400 ${fs}px ${SERIF}`; } g.fillText(name, W / 2, 288);
    g.font = `600 13px Lexend, sans-serif`; g.fillStyle = 'rgba(255,248,232,.85)'; g.fillText(sub.toUpperCase().split('').join(' '), W / 2, 314);
    // 1층: 아치 진열창 (따뜻한 실내) + 원목 문
    g.fillStyle = '#5A4232'; g.beginPath(); g.moveTo(10, 506); g.lineTo(10, 392); g.arc(88, 392, 78, Math.PI, 0); g.lineTo(166, 506); g.fill();
    const lit = g.createRadialGradient(88, 420, 10, 88, 420, 110); lit.addColorStop(0, '#FFE6B0'); lit.addColorStop(1, '#E8B878'); g.fillStyle = lit; g.beginPath(); g.moveTo(18, 500); g.lineTo(18, 394); g.arc(88, 394, 70, Math.PI, 0); g.lineTo(158, 500); g.fill();
    g.strokeStyle = '#5A4232'; g.lineWidth = 3; g.beginPath(); g.moveTo(88, 324); g.lineTo(88, 500); g.moveTo(18, 430); g.lineTo(158, 430); g.stroke();
    const P = { cafe: ['#F7F2EA', '#B8865A', '#F7F2EA'], gelato: ['#F4B6C8', '#F7E3A0', '#C9E8D8'], boutique: ['#9FC4C4', '#E9C8B8', '#F7F2EA'], flower: ['#E9A0A8', '#F4E3A0', '#C9A8D8'], books: ['#4E5A7A', '#B8655A', '#6B8F7A'], bakery: ['#D9A45A', '#C98A3E', '#E8C88A'], records: ['#1E1A2B', '#B8655A', '#F2C230'], linen: ['#F7F2EA', '#D9CDBA', '#B8AE9C'], bar: ['#7A2E3A', '#C9A24A', '#F3D9A8'] }[kind];
    for (let i = 0; i < 4; i++) { g.fillStyle = P[i % 3]; if (kind === 'books') g.fillRect(30 + i * 30, 448, 18, 44); else if (kind === 'records') { g.beginPath(); g.arc(40 + i * 32, 470, 14, 0, 7); g.fill(); g.fillStyle = '#F7F2EA'; g.beginPath(); g.arc(40 + i * 32, 470, 4, 0, 7); g.fill(); } else if (kind === 'flower') { g.beginPath(); g.arc(40 + i * 32, 456, 13, 0, 7); g.fill(); g.fillStyle = '#6E9A6A'; g.fillRect(38 + i * 32, 466, 4, 28); } else if (kind === 'bar') { g.fillRect(36 + i * 32, 446, 10, 46); g.fillRect(34 + i * 32, 440, 14, 8); } else { g.beginPath(); g.arc(40 + i * 32, 476, 13, Math.PI, 0); g.fill(); g.fillRect(27 + i * 32, 476, 26, 14); } }
    g.fillStyle = '#5A4232'; g.fillRect(20, 492, 136, 8);
    g.fillStyle = '#8C6239'; g.beginPath(); g.moveTo(178, 506); g.lineTo(178, 372); g.arc(210, 372, 32, Math.PI, 0); g.lineTo(242, 506); g.fill(); g.fillStyle = '#F3D9A8'; g.beginPath(); g.arc(210, 380, 18, Math.PI, 0); g.fill(); g.fillStyle = '#C9A24A'; g.fillRect(232, 440, 5, 12); };
  const shopTex = (sp) => { const t = canvasTex(256, 512, (g, W, H) => drawShop(g, W, H, sp)); shopTexs.push([t, sp]); return t; };
  const scallop = (c) => canvasTex(128, 64, (g, W, H) => { for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? c : '#FBF6EA'; g.fillRect(i * W / 6, 0, W / 6, H - 14); g.beginPath(); g.arc(i * W / 6 + W / 12, H - 14, W / 12, 0, Math.PI); g.fill(); } });
  const board = (txt) => canvasTex(128, 160, (g, W, H) => { g.fillStyle = '#8C6239'; g.fillRect(0, 0, W, H); g.fillStyle = '#2E3530'; g.fillRect(8, 8, W - 16, H - 16); g.fillStyle = '#F4F1E8'; g.textAlign = 'center'; g.font = `italic 400 26px ${SERIF}`; txt.split('|').forEach((l, i) => g.fillText(l, W / 2, 50 + i * 36)); });
  const BOARD = { cafe: 'flat white|& toast', gelato: 'pistachio|today', boutique: 'new in', flower: 'peonies|$12', books: 'read &|stay', bakery: 'fresh|sourdough', records: 'open|late', linen: 'hello', bar: 'happy|hour 5pm' };
  const bulbM = new THREE.MeshStandardMaterial({ color: 0xFFE7B0, emissive: 0xFFC478, emissiveIntensity: 1.4 }), wireM = new THREE.LineBasicMaterial({ color: 0x3A2E26 });
  const fronts = [];
  SHOPS.forEach((sp, i) => { const t = (i - 4) * 4.6, [x, z] = along(-19.6, -19.6, t), h = 5.4 + (i % 3) * .9, g = new THREE.Group();
    g.add(at(faceBox(4.4, h, 3, { map: shopTex(sp) }, { color: new THREE.Color(sp[2]).multiplyScalar(.9), roughness: .8 }), 0, h / 2, 0));
    g.add(at(std(new THREE.BoxGeometry(4.6, .22, 3.2), { color: 0xB9775A, roughness: .8 }), 0, h + .11, 0));
    if (i % 2) for (let k = -1.6; k <= 1.6; k += .4) g.add(at(std(new THREE.BoxGeometry(.38, .14, 3.2), { color: 0xC98466, roughness: .8 }), k, h + .26, 0));
    const aw = std(new THREE.BoxGeometry(2.0, .06, 1.0), { map: scallop(sp[3]) }); aw.position.set(-.85, h * .26, 1.85); aw.rotation.x = .42; g.add(aw);
    const bd = new THREE.Group(); const bm = new THREE.Mesh(new THREE.PlaneGeometry(.55, .7), new THREE.MeshStandardMaterial({ map: board(BOARD[sp[4]]), roughness: .9 })); bm.position.y = .42; bm.rotation.x = -.18; bd.add(bm); bd.position.set(.9, 0, 2.2); g.add(bd);
    const pot = (px) => { const pg = new THREE.Group(); pg.add(at(std(new THREE.CylinderGeometry(.22, .16, .4, 14), { color: 0xC9805A }), 0, .2, 0)); for (let k = 0; k < 5; k++) pg.add(at(std(new THREE.SphereGeometry(.18, 10, 8), { color: k % 2 ? 0x5E8A5A : 0x7AA86E }), Math.cos(k) * .1, .5 + (k % 2) * .12, Math.sin(k) * .1)); pg.position.set(px, 0, 1.75); return pg; };
    g.add(pot(-1.95)); if (i % 3 === 0) g.add(pot(1.95));
    if (sp[4] === 'cafe' || sp[4] === 'bar' || sp[4] === 'bakery') { g.add(at(std(new THREE.CylinderGeometry(.3, .3, .05, 16), { color: 0xF7F2EA }), -.2, .6, 3.2)); g.add(at(std(new THREE.CylinderGeometry(.03, .03, .6, 6), { color: 0x2B2B2E }), -.2, .3, 3.2)); [-.65, .25].forEach((k) => g.add(at(std(new THREE.BoxGeometry(.3, .4, .3), { color: 0x8C6239 }), k, .2, 3.2))); }
    if (sp[4] === 'flower') [0xE9A0A8, 0xF4E3A0, 0xC9A8D8].forEach((c, k) => { g.add(at(std(new THREE.CylinderGeometry(.18, .15, .3, 12), { color: 0x7A5A42 }), -.4 + k * .4, .15, 2.6)); g.add(at(std(new THREE.SphereGeometry(.2, 12, 10), { color: c }), -.4 + k * .4, .42, 2.6)); });
    g.rotation.y = ROW; sc.add(bgs(at(g, x, .15, z))); const [fx, fz] = along(-19.6 + 1.9 * .7071, -19.6 + 1.9 * .7071, t); fronts.push(new THREE.Vector3(fx, .15 + h * .42, fz)); });
  // 가게 앞 전구 줄 (가게에서 가게로 늘어져요)
  for (let i = 0; i < fronts.length - 1; i++) { const a = fronts[i], b = fronts[i + 1], pts = []; for (let k = 0; k <= 10; k++) { const p = a.clone().lerp(b, k / 10); p.y -= Math.sin(k / 10 * Math.PI) * .5; pts.push(p); if (k % 2) sc.add(at(new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), bulbM), p.x, p.y - .1, p.z)); } sc.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), wireM)); }
  whenFont(`italic 40px ${SERIF}`, () => shopTexs.forEach(([t, sp]) => { drawShop(t.image.getContext('2d'), t.image.getContext('2d').canvas.width, t.image.getContext('2d').canvas.height, sp); t.needsUpdate = true; }));
  [[-30, -6, 7], [-6, -30, 6]].forEach(([x, z, r]) => { const m = new THREE.Mesh(new THREE.ConeGeometry(r, r * 1.2, 8), new THREE.MeshLambertMaterial({ color: 0x5E9C6A, flatShading: true })); m.position.set(x, r * .4, z); sc.add(m); });
  const sail = (c) => { const g = new THREE.Group(); g.add(at(std(new THREE.BoxGeometry(1.6, .3, .5), { color: 0xFFFFFF }), 0, .1, 0)); const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(1.1, 0); s.lineTo(0, 2); s.lineTo(0, 0); const sg = std(new THREE.ShapeGeometry(s), { color: c, side: THREE.DoubleSide }); sg.position.set(-.3, .3, 0); g.add(sg); return g; };
  [[9, 2, 0x3F5BA9], [3, 10, 0xE9536A]].forEach(([x, z, c], i) => { const b = boatMesh(S, c); b.rotation.y = .8; b.scale.setScalar(1.25); sc.add(b); S.ticks.push((t) => { b.position.set(x + Math.sin(t * .2 + i) * 2, Math.sin(t * 1.5 + i) * .05, z + Math.cos(t * .2 + i) * 1.2); }); });
  return { noSea: true }; }
// 비즈니스 · 낮 도심 (고층 빌딩 · 택시 · 횡단보도 · PALLO 타워)
const taxi = (c = 0xF2C230) => { const g = new THREE.Group(); g.add(at(std(new THREE.BoxGeometry(1.5, .4, .7), { color: c, roughness: .35 }), 0, .35, 0)); g.add(at(std(new THREE.BoxGeometry(.8, .3, .62), { color: 0x2B2F44, roughness: .2 }), -.1, .68, 0)); [-.5, .5].forEach((x) => [-.33, .33].forEach((z) => g.add(at(std(new THREE.CylinderGeometry(.14, .14, .1, 12), { color: 0x1E1A2B }), x, .14, z)))); g.children.slice(2).forEach((w) => { w.rotation.x = Math.PI / 2; }); return g; };
function bizDowntown(S) { const sc = S.sc; ground(sc, canvasTex(128, 128, (g, W, H) => { g.fillStyle = '#C9C6C0'; g.fillRect(0, 0, W, H); g.strokeStyle = 'rgba(90,90,90,.25)'; for (let i = 0; i <= W; i += 32) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, H); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(W, i); g.stroke(); } }, 40, 40));
  strip(sc, -10.5, -10.5, 120, 5.2, 0, .01, asphaltTex(30, 2)); rowDash(sc, -10.5, -10.5, 110, 0xF7F7F8, .02, 1.8, 1, .1);
  for (let i = -4; i <= 4; i++) { const [x, z] = along(-10.5 + .7071 * 0, -10.5, 0); const d = new THREE.Mesh(new THREE.BoxGeometry(.5, .02, 4.6), new THREE.MeshBasicMaterial({ color: 0xF7F7F8 })); const [cx, cz] = along(-10.5, -10.5, 7 + i * .9); d.rotation.y = ROW; d.position.set(cx, .025, cz); sc.add(d); }
  [[0xF2C230, 2.6, -1.2, 0], [0xF2C230, 2, 1.2, 9], [0x3F5BA9, 1.6, 1.2, 20]].forEach(([c, v, off, ph]) => { const tx = taxi(c); tx.rotation.y = off < 0 ? ROW : ROW + Math.PI; sc.add(tx); S.ticks.push((t) => { const p = (((t * v + ph) % 60) - 30) * (off < 0 ? 1 : -1), [x, z] = along(-10.5 + off * .7071, -10.5 + off * .7071, p); tx.position.set(x, 0, z); }); });
  const H = [9, 13, 7, 16, 10, 12, 8, 14, 9, 11];
  H.forEach((h, i) => { const t = (i - 4.5) * 4, [x, z] = along(-18, -18, t), w = 3 + (i % 3) * .5; const b = std(new THREE.BoxGeometry(w, h, w), { map: glassTex(i % 2 ? '#6F8FB0' : '#8AA7C4', '#E2EEF6'), roughness: .2, metalness: .35 }); b.position.set(x, h / 2, z); b.rotation.y = ROW; sc.add(bgs(b));
    const rf = std(new THREE.BoxGeometry(w + .2, .3, w + .2), { color: 0xE8E6E1 }); rf.position.set(x, h + .15, z); rf.rotation.y = ROW; sc.add(rf); });
  const [px, pz] = along(-18, -18, -2); const ps = new THREE.Mesh(new THREE.PlaneGeometry(3, .9), new THREE.MeshBasicMaterial({ map: signTex('PALLO', '#493087', '#FFE200') })); ps.position.set(px + 1.6, 16.6, pz + 1.6); ps.rotation.y = ROW; sc.add(ps);
  for (let t = -20; t <= 20; t += 4) { const [x, z] = along(-7.4, -7.4, t); if (Math.hypot(x, z) > 8) { sc.add(tree(x, z, 0, 1.1, 0x6DBE6A)); } const [lx, lz] = along(-13.4, -13.4, t + 2); lamp(sc, lx, lz, 0); }
  return { noSea: true }; }



// ---------- 하늘 · 조명: 카페 = 2 골든아워 (연하게) · 비즈니스 = 3 해 질 녘 ----------
const MOOD = {
  2: { sky: ['#F9C9A2', '#FFF3E2'], deco: 'low', hemi: [0xFFF2E2, 0xC9AE92, 1.35], sun: [0xFFD6A8, 2.0, [-14, 8, 7]], fog: 0xFAE6D2, water: ['#F9CFAE', '#B4AFC4', '#6F93B4', '255,236,200'], night: 0 },
  3: { sky: ['#26336E', '#F2907A'], deco: 'dusk', hemi: [0xBCB6F0, 0x6A5A7A, .95], sun: [0xFF9C7E, 1.0, [-15, 4, 5]], fog: 0x8E7FA8, water: ['#EE9A86', '#5E5E9C', '#2C3A6E', '255,206,160'], night: .7 }
};
const litGlass = (() => { let t; return () => t || (t = canvasTex(128, 256, (g, W, H) => { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); for (let y = 4; y < H; y += 16) for (let x = 4; x < W; x += 16) if (rnd() > .38) { g.fillStyle = rnd() > .3 ? '#FFD978' : '#BFE4FF'; g.fillRect(x, y, 10, 10); } }, 1, 3)); })();
function skyOf(m) { return bgTex(m.sky[0], m.sky[1], (g, W, H) => {
  if (m.deco === 'sun') drawSun(g, W * .82, H * .1, 34);
  if (m.deco === 'low') { const gl = g.createRadialGradient(W * .78, H * .42, 10, W * .78, H * .42, W * .75); gl.addColorStop(0, 'rgba(255,246,214,.9)'); gl.addColorStop(.25, 'rgba(255,214,170,.4)'); gl.addColorStop(1, 'rgba(255,214,170,0)'); g.fillStyle = gl; g.fillRect(0, 0, W, H); g.fillStyle = '#FFF1C4'; g.beginPath(); g.arc(W * .78, H * .42, 40, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,.55)'; [[.2, .16, 30], [.5, .1, 22]].forEach(([x, y, r]) => puff(g, x * W, y * H, r, 'rgba(255,214,190,.7)')); }
  if (m.deco === 'dusk' || m.deco === 'moon') for (let i = 0; i < (m.deco === 'moon' ? 110 : 40); i++) { g.fillStyle = `rgba(255,255,255,${.35 + rnd() * .6})`; g.beginPath(); g.arc(rnd() * W, rnd() * H * (m.deco === 'moon' ? .7 : .4), .8 + rnd() * 2.2, 0, 7); g.fill(); }
  if (m.deco === 'dusk') { const gl = g.createLinearGradient(0, H * .45, 0, H); gl.addColorStop(0, 'rgba(255,150,120,0)'); gl.addColorStop(1, 'rgba(255,190,150,.6)'); g.fillStyle = gl; g.fillRect(0, 0, W, H); }
  if (m.deco === 'moon') drawMoon(g, W * .8, H * .12, 36); }); }
function applyMood(S, m, fogNear = 42, fogFar = 100) { const sc = S.sc, v = new THREE.Vector3(); let n = 0;
  sc.background = skyOf(m); sc.fog = new THREE.Fog(m.fog, fogNear, fogFar); sc.updateMatrixWorld(true);
  const add = [];
  sc.traverse((o) => {
    if (o.isHemisphereLight) { o.color.setHex(m.hemi[0]); o.groundColor.setHex(m.hemi[1]); o.intensity = m.hemi[2]; }
    if (o.isDirectionalLight) { o.color.setHex(m.sun[0]); o.intensity = m.sun[1]; o.position.set(...m.sun[2]); }
    if (o.userData.lampLight) o.intensity = m.night ? 7 : 0;
    const mt = o.material; if (!o.isMesh || !mt || Array.isArray(mt)) return;
    if (mt.map && mt.map.userData && mt.map.userData.glass && m.night) { mt.emissive = new THREE.Color(0xffffff); mt.emissiveMap = litGlass(); mt.emissiveIntensity = m.night * .95; mt.needsUpdate = true; }
    if (o.userData.lamp) { mt.emissiveIntensity = m.night ? 1.8 : .25; if (m.night && n < 10) { o.getWorldPosition(v); add.push(v.clone()); n++; } }
    if (o.userData.water && mt.map) { const c = mt.map.image, g = c.getContext('2d'), W = gg0(c).width, H = gg0(c).height, gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, m.water[0]); gr.addColorStop(.5, m.water[1]); gr.addColorStop(1, m.water[2]); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 80; i++) { g.fillStyle = `rgba(${m.water[3]},${.2 + rnd() * .4})`; g.fillRect(rnd() * W, rnd() * H, 8 + rnd() * 26, 2); } mt.map.needsUpdate = true; mt.metalness = m.night ? .4 : .25; } });
  if (m.night) add.forEach((p) => { if (!sc.children.some((c) => c.isPointLight && c.userData.lampLight && c.position.distanceTo(p) < 1)) glow(sc, p.x, p.y - .2, p.z, 0xFFD27A, 7 * m.night, 7); }); }

// ================= 3. 카페 · 라테 바다 · 케이크 섬 =================
BUILD.cafe = (EL, SC) => {
  // 뒤 배경: 멜버른 야라 강변 (cafeRiver)
  const S = stage(EL, { half: 8.8, pos: CAM, target: new THREE.Vector3(-1.0, 6.81, -1.4), bg: bgTex('#F3A27A', '#FCE6C8', (g, W, H) => { const gl = g.createRadialGradient(W * .7, H * .35, 10, W * .7, H * .35, W * .6); gl.addColorStop(0, 'rgba(255,236,170,.9)'); gl.addColorStop(1, 'rgba(255,236,170,0)'); g.fillStyle = gl; g.fillRect(0, 0, W, H); }), az: [.2, 1.2] }), sc = S.sc;
  cafeRiver(S);
  // 라테 잔 받침 + 라테
  const cup = at(mesh(new THREE.CylinderGeometry(7.6, 7.0, 1.2, 72), 0xffffff, { line: .07 }), 0, -.6, 0); cup.userData.bg = 1; sc.add(cup);
  const lat = at(flat(new THREE.CircleGeometry(7.1, 72), 0xC99A6E, 1), 0, .01, 0); lat.userData.bg = 1; sc.add(lat);
  const ring = at(flat(new THREE.RingGeometry(5.6, 7.1, 72), 0xE2BE97, 1), 0, .02, 0); ring.userData.bg = 1; sc.add(ring);
  // 라테 아트 하트
  const hs = new THREE.Shape(); hs.moveTo(0, -1); hs.bezierCurveTo(-1.6, 0, -1.4, 1.3, 0, .6); hs.bezierCurveTo(1.4, 1.3, 1.6, 0, 0, -1);
  const heart = at(flat(new THREE.ShapeGeometry(hs), 0xFFF6E6, 1), 4.8, .03, 4.2); heart.rotation.z = .7; heart.scale.setScalar(.9); heart.userData.bg = 1; sc.add(heart);
  // 케이크 섬: 물결 가장자리 시트 + 크림
  layer(sc, SHAPES.scallop, 4.9, 1.0, 0, 0xE8B77E); layer(sc, SHAPES.scallop, 4.75, .32, 1.0, 0xFFF6E6, { bevel: .28 });
  const TOP = 1.55;
  for (let i = 0; i < 14; i++) { const a = i / 14 * TAU, x = Math.cos(a) * 4.6, z = -Math.sin(a) * 4.6; if (a > 4.9 && a < 6.0) continue; const s = at(mesh(new THREE.SphereGeometry(.26, 16, 12), i % 2 ? 0xE9536A : 0xFFFFFF, { line: .03 }), x, TOP - .05, z); s.scale.y = .8; sc.add(s); }
  const info = stops(S, [[-2.0, 2.6], [1.0, 3.4], [3.0, .8]], TOP, SC, 0xE8C9A6, [.6, -1.2]);
  // 카페 건물: CAFÉ PALLO
  const cf = new THREE.Group(), GRN = 0x1F5A4A, CRM = 0xFFF4DE;
  const brick = canvasTex(256, 128, (g, W, H) => { g.fillStyle = '#B8644A'; g.fillRect(0, 0, W, H); g.fillStyle = 'rgba(255,230,210,.55)'; for (let y = 0; y < H; y += 16) { g.fillRect(0, y, W, 2); for (let x = (y / 16 % 2) * 16; x < W; x += 32) g.fillRect(x, y, 2, 16); } for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(90,30,20,${rnd() * .2})`; g.fillRect(rnd() * W, rnd() * H, 14, 6); } });
  const shopIn = canvasTex(512, 256, (g, W, H) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#FFD996'); gr.addColorStop(1, '#F2A85C'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.fillStyle = '#7A4A2C'; g.fillRect(0, H * .62, W, H * .38); g.fillStyle = '#5C3620'; g.fillRect(0, H * .6, W, 10);   // 카운터
    g.fillStyle = '#2B2B2E'; g.fillRect(W * .58, H * .08, W * .3, H * .3); g.fillStyle = '#F3E8D2'; g.font = '700 22px Lexend, sans-serif'; ['MENU', 'Latte  5.0', 'Flat W  4.8', 'Mocha  5.5'].forEach((t2, k) => g.fillText(t2, W * .6, H * (.15 + k * .07)));   // 메뉴판
    [.12, .3, .46].forEach((x) => { g.strokeStyle = '#3A2A20'; g.lineWidth = 3; g.beginPath(); g.moveTo(W * x, 0); g.lineTo(W * x, H * .2); g.stroke(); g.fillStyle = '#FFF3C4'; g.beginPath(); g.arc(W * x, H * .24, 14, 0, 7); g.fill(); });   // 펜던트 조명
    [[.1, '#E9536A'], [.22, '#FFFFFF'], [.34, '#3F5BA9']].forEach(([x, c]) => { g.fillStyle = c; g.fillRect(W * x, H * .48, 26, 30); });   // 컵 · 병
    g.fillStyle = 'rgba(255,255,255,.28)'; g.beginPath(); g.moveTo(W * .05, 0); g.lineTo(W * .22, 0); g.lineTo(W * .06, H); g.lineTo(0, H); g.fill(); });
  // 아래 벽돌 · 위 크림 벽 · 몰딩
  const wB = 3.2, wD = 2.0;
  cf.add(at(faceBox(wB, .5, wD, { map: brick }, { color: 0xB8644A }), 0, .25, 0));
  cf.add(at(mesh(new THREE.BoxGeometry(wB, 1.5, wD), CRM, { line: .04 }), 0, 1.25, 0));
  cf.add(at(mesh(new THREE.BoxGeometry(wB + .1, .08, wD + .1), GRN, { line: .02 }), 0, .52, 0));
  // 지붕: 처마 + 난간 + 굴뚝(김)
  cf.add(at(mesh(new THREE.BoxGeometry(wB + .3, .16, wD + .3), GRN, { line: .03 }), 0, 2.06, 0));
  cf.add(at(mesh(new THREE.BoxGeometry(wB + .1, .26, .08), CRM, { line: .02 }), 0, 2.27, wD / 2 + .05));
  cf.add(at(mesh(new THREE.BoxGeometry(.32, .62, .32), 0xB8644A, { line: .02 }), -1.05, 2.4, -.4));
  const cfSteam = []; for (let k = 0; k < 3; k++) { const p = sph(.12, 0xFFFFFF, 0); p.material.transparent = true; cf.add(p); cfSteam.push(p); }
  // 쇼윈도 2개 (초록 틀) + 가운데 초록 문
  [-.95, .95].forEach((wx) => { cf.add(at(mesh(new THREE.BoxGeometry(1.0, .96, .06), GRN, { line: .02 }), wx, 1.12, wD / 2 + .01)); const gl = new THREE.Mesh(new THREE.PlaneGeometry(.86, .82), new THREE.MeshBasicMaterial({ map: shopIn })); gl.position.set(wx, 1.12, wD / 2 + .05); cf.add(gl);
    cf.add(at(mesh(new THREE.BoxGeometry(.04, .82, .03), GRN, { line: 0 }), wx, 1.12, wD / 2 + .06));
    // 꽃상자
    cf.add(at(mesh(new THREE.BoxGeometry(1.0, .16, .22), 0x8A5A36, { line: .02 }), wx, .6, wD / 2 + .14)); for (let k = 0; k < 7; k++) cf.add(at(sph(.065, [0xE8505B, 0xFFE200, 0xF28CB1, 0xFFFFFF][k % 4], .01), wx - .42 + k * .14, .72, wD / 2 + .16)); });
  cf.add(at(mesh(new THREE.BoxGeometry(.56, 1.12, .06), GRN, { line: .02 }), 0, .56, wD / 2 + .02));
  const dg = new THREE.Mesh(new THREE.PlaneGeometry(.36, .5), new THREE.MeshBasicMaterial({ map: shopIn })); dg.position.set(0, .74, wD / 2 + .06); cf.add(dg);
  cf.add(at(sph(.035, 0xE2B84E, .005), .2, .56, wD / 2 + .07));
  // 물결 차양 (청록 · 흰 줄 · 끝이 둥근 물결)
  for (let i = 0; i < 8; i++) { const a = mesh(new THREE.BoxGeometry(.4, .06, .7), i % 2 ? 0xFFFFFF : 0x138A9E, { line: .015 }); a.position.set(-1.4 + i * .4, 1.74, wD / 2 + .3); a.rotation.x = .5; cf.add(a);
    const sc2 = mesh(new THREE.CylinderGeometry(.2, .2, .05, 16, 1, false, 0, Math.PI), i % 2 ? 0xFFFFFF : 0x138A9E, { line: .012 }); sc2.rotation.set(Math.PI / 2, 0, 0); sc2.position.set(-1.4 + i * .4, 1.56, wD / 2 + .62); cf.add(sc2); }
  // 전구 줄 (차양 아래)
  for (let k = 0; k < 13; k++) { const u = k / 12, b = new THREE.Mesh(new THREE.SphereGeometry(.035, 8, 6), new THREE.MeshBasicMaterial({ color: 0xFFE7A0 })); b.position.set(-1.5 + u * 3.0, 1.5 - Math.sin(u * Math.PI) * .12, wD / 2 + .66); cf.add(b); }
  // 간판: CAFÉ PALLO (초록 바탕 · 금색 글씨 · 컵 아이콘)
  const signT = canvasTex(1024, 256, () => {}); const drawSign = () => { const c = signT.image, g = c.getContext('2d'), W = gg0(c).width, H = gg0(c).height; g.clearRect(0, 0, W, H); g.fillStyle = '#1F5A4A'; g.beginPath(); g.roundRect(6, 6, W - 12, H - 12, 40); g.fill(); g.lineWidth = 10; g.strokeStyle = '#E2B84E'; g.stroke();
    g.fillStyle = '#F3D98A'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '400 118px "DM Serif Display", Georgia, serif'; g.fillText('CAFÉ PALLO', W / 2, H * .54); signT.needsUpdate = true; };
  drawSign(); whenFont('118px "DM Serif Display"', drawSign);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.6, .65), new THREE.MeshBasicMaterial({ map: signT, transparent: true })); sign.position.set(0, 2.0, wD / 2 + .17); cf.add(sign);
  // 옆 돌출 간판 (동그란 컵)
  const blade = new THREE.Group(); blade.add(at(mesh(new THREE.BoxGeometry(.5, .04, .04), 0x2B2B2E, { line: 0 }), .25, 0, 0)); const bd = new THREE.Mesh(new THREE.CircleGeometry(.26, 24), new THREE.MeshBasicMaterial({ map: textTex('P', '#FFE200', '#1E1A2B', 160, 160, 'Lexend', 110) })); bd.position.set(.45, -.3, 0); bd.rotation.y = Math.PI / 2; blade.add(bd); blade.position.set(wB / 2, 1.6, wD / 2 - .2); cf.add(blade);
  // 화분 · 칠판 입간판
  [-.45, .45].forEach((px) => { cf.add(at(mesh(new THREE.CylinderGeometry(.13, .1, .24, 12), 0xC8704A, { line: .015 }), px, .12, wD / 2 + .3)); cf.add(at(sph(.2, 0x5DAA5E), px, .4, wD / 2 + .3)); });
  const cb = new THREE.Group(); [-1, 1].forEach((k) => { const p = mesh(new THREE.BoxGeometry(.44, .6, .04), 0x2B2B2E, { line: .015 }); p.rotation.x = k * .22; p.position.z = k * .07; cb.add(p); }); const cbt = new THREE.Mesh(new THREE.PlaneGeometry(.36, .5), new THREE.MeshBasicMaterial({ map: canvasTex(128, 176, (g, W, H) => { g.fillStyle = '#2B2B2E'; g.fillRect(0, 0, W, H); g.fillStyle = '#F3E8D2'; g.font = '700 20px Lexend'; g.textAlign = 'center'; g.fillText('TODAY', W / 2, 40); g.font = '600 16px Lexend'; g.fillText('Flat white', W / 2, 80); g.fillText('Oat latte', W / 2, 106); g.fillStyle = '#FFE200'; g.fillText('♥ PALLO', W / 2, 146); }) })); cbt.position.set(0, 0, .1); cbt.rotation.x = -.22; cb.add(cbt); cb.position.set(1.05, .3, wD / 2 + .7); cb.rotation.y = -.3; cf.add(cb);
  S.ticks.push((t) => cfSteam.forEach((p, k) => { const q = (t * .3 + k / 3) % 1; p.position.set(-1.05 + Math.sin(t + k) * .06, 2.75 + q * .9, -.4); p.scale.setScalar(.6 + q * 1.3); p.material.opacity = (1 - q) * .7; }));
  cf.rotation.y = .45; sc.add(at(cf, .2, TOP, -2.4));   // 정면 · 간판이 카메라 쪽을 보게
  const para = (x, z, c) => { const g = new THREE.Group(); g.add(at(mesh(new THREE.CylinderGeometry(.04, .04, 1.4, 8), 0xffffff, { line: .02 }), 0, .7, 0)); g.add(at(mesh(new THREE.ConeGeometry(.9, .45, 10), c, { line: .03 }), 0, 1.5, 0)); g.add(at(mesh(new THREE.CylinderGeometry(.42, .42, .06, 20), 0xffffff, { line: .02 }), 0, .55, 0));
    [-.65, .65].forEach((k) => g.add(at(mesh(new THREE.BoxGeometry(.3, .35, .3), 0xFFF7E6, { line: .02 }), k, .18, 0))); return at(g, x, TOP, z); };
  sc.add(para(-2.8, -.6, 0xE9789B)); sc.add(para(3.2, -1.8, 0xFFE200));
  // 큰 커피잔
  const mug = new THREE.Group(); mug.add(at(mesh(new THREE.CylinderGeometry(.75, .62, 1.2, 28), 0xffffff), 0, .6, 0)); mug.add(at(flat(new THREE.CircleGeometry(.66, 28), 0x7A4A2C, 1), 0, 1.15, 0));
  const hd = mesh(new THREE.TorusGeometry(.32, .09, 10, 20), 0xffffff, { line: .02 }); hd.position.set(.8, .65, 0); mug.add(hd); sc.add(at(mug, -3.2, TOP, -2.6));
  const steam = [0, 1].map((i) => { const s = at(mesh(new THREE.SphereGeometry(.16, 12, 10), 0xffffff, { line: .02, cast: false }), -3.2 + (i ? .2 : -.15), TOP + 1.5, -2.6); sc.add(s); return s; });
  S.ticks.push((t) => steam.forEach((s, i) => { const k = (t * .6 + i * .5) % 1; s.position.y = TOP + 1.4 + k * 1.2; s.scale.setScalar(1 - k * .6); }));
  [[-3.6, 1.6], [3.6, 2.6]].forEach(([x, z]) => sc.add(tree(x, z, TOP, .75, 0x8FCB7E)));
  applyMood(S, MOOD[2], 34, 62);
  return S;
};

// ================= 4. 캠퍼스 · 하늘에 뜬 섬 =================
BUILD.campus = (EL, SC) => {
  // 섬은 잔디 위에 놓여요 · 뒤 배경: 기둥 도서관 (uniLibrary)
  const bg = bgTex('#86C6EE', '#F1F7FA', (g, W, H) => { const gl = g.createRadialGradient(W * .18, H * .06, 10, W * .18, H * .06, W * .7); gl.addColorStop(0, 'rgba(255,248,220,.8)'); gl.addColorStop(1, 'rgba(255,248,220,0)'); g.fillStyle = gl; g.fillRect(0, 0, W, H); });
  const S = stage(EL, { half: 9.0, pos: CAM, target: new THREE.Vector3(-.9, 4.86, -.7), bg, az: [.2, 1.2], fog: new THREE.Fog(0xE6F1F8, 34, 80) }), sc = S.sc;
  uniLibrary(S); const V = { ground: true };
  // 섬 아래 바위 (뒤집힌 원뿔, 울퉁불퉁)
  const cg = new THREE.ConeGeometry(5.6, 5.2, 11, 4); cg.rotateX(Math.PI); const cp = cg.attributes.position;
  for (let i = 0; i < cp.count; i++) { const y = cp.getY(i), k = 1 + (Math.sin(i * 1.7) * .08); if (y < 2.5) { cp.setX(i, cp.getX(i) * k); cp.setZ(i, cp.getZ(i) * k * 1.1); } } cg.computeVertexNormals();
  sc.add(at(mesh(cg, 0x9C7A5C, { line: .06 }), 0, -2.0, 0));
  layer(sc, SHAPES.peanut, 5.7, .8, -.5, 0xC08A5A, { sz: 1.05 }); layer(sc, SHAPES.peanut, 5.5, .45, .3, 0x9ED48A, { sz: 1.05 });
  const TOP = .9;
  // 작은 돌섬들 (둥실둥실)
  const rocks = (V.ground ? [] : [[-7, -1, 3.2, .9], [6.6, 1.4, -3.4, .7], [5.8, -2.6, 4.2, .6]]).map(([x, y, z, s]) => { const g = new THREE.Group(); const c2 = new THREE.ConeGeometry(1.2 * s, 1.6 * s, 7); c2.rotateX(Math.PI); g.add(at(mesh(c2, 0x9C7A5C, { line: .04 }), 0, -.8 * s, 0)); g.add(at(mesh(new THREE.CylinderGeometry(1.25 * s, 1.2 * s, .35 * s, 7), 0x9ED48A, { line: .04 }), 0, .1, 0)); g.add(tree(0, 0, .25 * s, .7 * s)); sc.add(at(g, x, y, z)); return [g, y]; });
  S.ticks.push((t) => rocks.forEach(([g, y], i) => { g.position.y = y + Math.sin(t * 1.3 + i * 2) * .25; }));
  const info = stops(S, [[-3.6, 3.0], [.2, 3.8], [3.6, 2.2], [3.0, -.8], [-.2, -1.0], [-3.4, -.4]], TOP, SC);
  // 학교 본관: 레드브릭 칼리지풍 · 가운데 시계탑 · 양옆 날개동 · 아치 현관과 기둥 · 계단 · 슬레이트 지붕 · 담쟁이
  const sch = new THREE.Group(), BR = 0xB4553F, ST = 0xEADFC8, SL = 0x4A5566;
  const archWin = (w, h, lit) => { const c = makeCanvas(); c.width = 64; c.height = 96; const g = c.getContext('2d'); g.fillStyle = '#EADFC8'; g.beginPath(); g.moveTo(0, 96); g.lineTo(0, 32); g.arc(32, 32, 32, Math.PI, 0); g.lineTo(64, 96); g.fill();
    g.fillStyle = lit ? '#FFD98A' : '#5F7C94'; g.beginPath(); g.moveTo(8, 90); g.lineTo(8, 34); g.arc(32, 34, 24, Math.PI, 0); g.lineTo(56, 90); g.fill(); g.fillStyle = '#EADFC8'; g.fillRect(30, 10, 4, 80); g.fillRect(8, 52, 48, 4);
    const t = canvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: true })); };
  const slate = (w, d, h, x, y, z) => { const r = new THREE.CylinderGeometry(d * .62, d * .62, w, 3); r.rotateZ(Math.PI / 2); const m = mesh(r, SL, { line: .03 }); m.scale.set(1, h / (d * .62) * .6, 1); m.position.set(x, y, z); return m; };
  // 날개동 (양옆)
  [-1.45, 1.45].forEach((x) => { sch.add(at(mesh(new THREE.BoxGeometry(1.3, 1.2, 1.2), BR), x, .6, -.05)); sch.add(at(mesh(new THREE.BoxGeometry(1.36, .1, 1.26), ST, { line: .02 }), x, 1.22, -.05)); sch.add(slate(1.3, 1.2, .5, x, 1.48, -.05));
    [-.32, .32].forEach((k) => { const w = archWin(.28, .44, k > 0); w.position.set(x + k, .62, .56); sch.add(w); });
    const dm = new THREE.Group(); dm.add(at(mesh(new THREE.BoxGeometry(.3, .3, .3), ST, { line: .02 }), 0, 0, 0)); dm.add(at(mesh(new THREE.ConeGeometry(.24, .3, 4), SL, { line: .02 }), 0, .3, 0)); dm.children[1].rotation.y = Math.PI / 4; sch.add(at(dm, x, 1.62, .25)); });
  // 본관 (가운데) + 돌 띠
  sch.add(at(mesh(new THREE.BoxGeometry(1.7, 1.75, 1.45), BR), 0, .875, .05));
  [.04, .9, 1.78].forEach((y) => sch.add(at(mesh(new THREE.BoxGeometry(1.78, .09, 1.52), ST, { line: .02 }), 0, y, .05)));
  [-.55, .55].forEach((k) => { const w = archWin(.3, .48, true); w.position.set(k, 1.3, .79); sch.add(w); });
  // 시계탑
  sch.add(at(mesh(new THREE.BoxGeometry(.95, 1.5, .95), BR), 0, 2.55, 0)); sch.add(at(mesh(new THREE.BoxGeometry(1.05, .12, 1.05), ST, { line: .02 }), 0, 3.32, 0));
  [-.42, .42].forEach((x) => [-.42, .42].forEach((z) => sch.add(at(mesh(new THREE.BoxGeometry(.16, 1.6, .16), ST, { line: .02 }), x, 2.6, z))));
  const clkF = new THREE.Mesh(new THREE.CircleGeometry(.3, 32), new THREE.MeshBasicMaterial({ color: 0xFBF6EA })); clkF.position.set(0, 2.75, .48); sch.add(clkF); const clkR = new THREE.Mesh(new THREE.RingGeometry(.3, .35, 32), new THREE.MeshBasicMaterial({ color: 0xC9A24A })); clkR.position.set(0, 2.75, .481); sch.add(clkR);
  const hand = new THREE.Mesh(new THREE.BoxGeometry(.035, .22, .01), new THREE.MeshBasicMaterial({ color: INK })); hand.geometry.translate(0, .1, 0); hand.position.set(0, 2.75, .49); sch.add(hand); const hand2 = new THREE.Mesh(new THREE.BoxGeometry(.035, .15, .01), new THREE.MeshBasicMaterial({ color: INK })); hand2.geometry.translate(0, .07, 0); hand2.position.set(0, 2.75, .49); sch.add(hand2); S.ticks.push((t) => { hand.rotation.z = -t * .5; hand2.rotation.z = -t * .04; });
  const bell = archWin(.34, .42, false); bell.position.set(0, 2.15, .48); sch.add(bell);
  const spire = mesh(new THREE.ConeGeometry(.72, 1.25, 4), SL, { line: .03 }); spire.rotation.y = Math.PI / 4; spire.position.set(0, 4.0, 0); sch.add(spire);
  [-.42, .42].forEach((x) => [-.42, .42].forEach((z) => sch.add(at(mesh(new THREE.ConeGeometry(.08, .4, 6), ST, { line: .015 }), x, 3.58, z))));
  sch.add(at(mesh(new THREE.SphereGeometry(.09, 12, 10), 0xE8C070, { line: .015 }), 0, 4.68, 0)); sch.add(at(mesh(new THREE.CylinderGeometry(.02, .02, .35, 6), 0xE8C070, { line: 0 }), 0, 4.88, 0));
  // 아치 현관: 기둥 2개 · 박공 · 계단
  const por = new THREE.Group(); [-.42, .42].forEach((x) => por.add(at(mesh(new THREE.CylinderGeometry(.07, .08, .78, 12), 0xF7F2EA, { line: .02 }), x, .44, 0)));
  por.add(at(mesh(new THREE.BoxGeometry(1.05, .12, .42), ST, { line: .02 }), 0, .86, 0)); const pd = new THREE.Shape(); pd.moveTo(-.55, 0); pd.lineTo(.55, 0); pd.lineTo(0, .3); pd.lineTo(-.55, 0); const pdm = mesh(new THREE.ExtrudeGeometry(pd, { depth: .4, bevelEnabled: false }), ST, { line: .02 }); pdm.position.set(0, .92, -.2); por.add(pdm);
  const door = archWin(.5, .62, true); door.position.set(0, .4, -.18); por.add(door);
  [0, 1, 2].forEach((k) => por.add(at(mesh(new THREE.BoxGeometry(1.2 - k * .12, .06, .36 - k * .08), ST, { line: .015 }), 0, .03 + k * .06, .12 - k * .04)));
  sch.add(at(por, 0, 0, .95));
  // 담쟁이 (날개동 모서리)
  [[-2.06, .55], [2.06, .55]].forEach(([x, z]) => { for (let k = 0; k < 6; k++) { const iv = mesh(new THREE.SphereGeometry(.14, 8, 6), k % 2 ? 0x4E8A4E : 0x5E9A56, { line: 0 }); iv.scale.set(.5, 1, 1); iv.position.set(x, .15 + k * .17, z - (k % 3) * .25); sch.add(iv); } });
  // PALLO UNIVERSITY 현판 (건물 정면)
  const plaque = (w, h, big, small) => canvasTex(1024, Math.round(1024 * h / w), (g, W, H) => { g.fillStyle = '#23305E'; g.beginPath(); g.roundRect(6, 6, W - 12, H - 12, 18); g.fill(); g.lineWidth = 10; g.strokeStyle = '#D9B45A'; g.stroke();
    g.fillStyle = '#F3D98A'; g.textAlign = 'center'; g.textBaseline = 'middle'; let fs = Math.round(H * (small ? .4 : .5)); g.font = `800 ${fs}px Lexend, sans-serif`; while (g.measureText(big).width > W * .86) { fs -= 2; g.font = `800 ${fs}px Lexend, sans-serif`; } g.fillText(big, W / 2, H * (small ? .42 : .52)); if (small) { g.font = `600 ${Math.round(H * .17)}px Lexend, sans-serif`; g.fillStyle = '#C9D2F0'; g.fillText(small, W / 2, H * .78); } });
  const sg = new THREE.Mesh(new THREE.PlaneGeometry(1.6, .3), new THREE.MeshBasicMaterial({ map: plaque(1.6, .3, 'PALLO UNIVERSITY') })); sg.position.set(0, 1.97, .88); sch.add(sg); sch.add(at(new THREE.Mesh(new THREE.BoxGeometry(1.68, .36, .1), new THREE.MeshBasicMaterial({ color: 0x23305E })), 0, 1.97, .79));
  sc.add(at(sch, .6, TOP, -3.6));
  // 정문: 돌기둥 두 개 + 현판 (카메라 쪽을 봐요)
  const gate = new THREE.Group(); [-1.15, 1.15].forEach((k) => { gate.add(at(mesh(new THREE.BoxGeometry(.42, 1.9, .42), 0xD9CDB8, { line: .03 }), k, .95, 0)); gate.add(at(mesh(new THREE.BoxGeometry(.56, .16, .56), 0xBFB29C, { line: .02 }), k, 1.98, 0)); });
  gate.add(at(mesh(new THREE.BoxGeometry(2.9, .5, .3), 0x23305E, { line: .03 }), 0, 1.75, 0));
  const gp = new THREE.Mesh(new THREE.PlaneGeometry(2.7, .42), new THREE.MeshBasicMaterial({ map: plaque(2.7, .42, 'PALLO UNIVERSITY') })); gp.position.set(0, 1.75, .25); gate.add(gp);
  gate.rotation.y = .72; sc.add(at(gate, -4.5, TOP, 1.2));
  // 학교 깃발 (P 문장)
  const crest = canvasTex(256, 160, (g, W, H) => { g.fillStyle = '#23305E'; g.fillRect(0, 0, W, H); g.fillStyle = '#F3D98A'; g.beginPath(); g.moveTo(W * .5, H * .12); g.lineTo(W * .7, H * .22); g.lineTo(W * .68, H * .62); g.lineTo(W * .5, H * .9); g.lineTo(W * .32, H * .62); g.lineTo(W * .3, H * .22); g.closePath(); g.fill(); g.fillStyle = '#23305E'; g.font = '900 64px Lexend, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('P', W * .5, H * .5); });
  // 운동장 트랙
  const trk = mesh(new THREE.TorusGeometry(1.2, .18, 8, 40), 0xD86A4A, { line: .03 }); trk.rotation.x = Math.PI / 2; trk.scale.set(1.3, 1, .4); trk.position.set(3.4, TOP + .02, -3.2); sc.add(trk);
  sc.add(at(flat(new THREE.CircleGeometry(1.1, 32), 0x7FC46F, 1), 3.4, TOP + .03, -3.2)); sc.children[sc.children.length - 1].scale.set(1.3, .9, 1);
  [[-1.6, 1.4], [1.8, 1.0], [-2.6, -2.8], [4.4, .8]].forEach(([x, z], i) => sc.add(tree(x, z, TOP, .85, i % 2 ? 0x6DBE6A : 0x8FCB7E)));
  const fl = flag(-2.6, TOP, -1.2, 0x23305E); const fc = new THREE.Mesh(new THREE.PlaneGeometry(.78, .43), new THREE.MeshBasicMaterial({ map: crest })); fc.position.set(.42, 1.55, .03); fl.add(fc); fl.rotation.y = .72; sc.add(fl);
  sc.add(cloud(5.6, 5.2, -1, .9));
  return S;
};

// ================= 스터디 맵 3D 시안 (?studymap=1~4) =================
// SC: [[이름, 진도, 'soon'|'cur'|'open'], ...] · 0=HELLO 1=EVERYDAY 2=REAL 3=TOPIC TALK 4=DEBATE
const LV_COL = [[0xD9D4CB, 0xEDE9E1], [0x7CC9A9, 0xA7E0C4], [0xA99BDF, 0xC9BFF0], [0xE9A3B8, 0xF6C6D4], [0xF2C060, 0xFADB94]];
function lvInfo(S, SC, i, p) { const [n, sub, st] = SC[i] || ['', '', 'soon']; return { n, st, no: i + 1, at: p.clone(), k: `Lv.${i} · ${sub}`, goT: '교재 보기', soonT: '커밍순' }; }
function lvTag(S, SC, i, p, dy = 0) { const [n, sub, st] = SC[i] || ['', '', 'soon']; S.label(p, { kind: 'lv', title: n, sub, st }, dy); }
const tagIt = (o, it) => { o.traverse((m) => { m.userData.info = it; }); o.userData.info = it; return o; };

// 화면 좌표(sx 오른쪽 · sy 위쪽) → 바닥 좌표
const SX = (sx, sy) => [sx * .763 - sy * .646, -sx * .646 - sy * .763];
const DOWN = new THREE.Vector3(.646, 0, .763);
const tagUnder = (S, SC, i, x, y, z, r, dy = 4) => lvTag(S, SC, i, new THREE.Vector3(x, y, z).addScaledVector(DOWN, r), dy);


// 몽실 구름 (2안 · 다듬은 버전): 툰 3단 음영 · 외곽선 없음 · 아래 평평 · 아랫면은 연한 하늘빛 그늘 · 크기마다 모양 다르게
const CLOUD_M = (() => { let m; return () => m || (m = new THREE.MeshToonMaterial({ color: 0xFFFFFF, gradientMap: grad, emissive: 0xDCE8F6, emissiveIntensity: .12 })); })();
function puffCloud(x, y, z, s = 1, seed = 1) { const g = new THREE.Group(), R = (k) => { const v = Math.sin(seed * 12.9898 + k * 78.233) * 43758.5453; return v - Math.floor(v); };
  const n = 6 + Math.floor(R(1) * 4); for (let i = 0; i < n; i++) { const a = (i / n - .5) * 3.4, r = (.55 + R(i + 3) * .45) * (1 - Math.abs(a) * .16); const sp = new THREE.Mesh(new THREE.SphereGeometry(r * s, 22, 14), CLOUD_M()); sp.position.set(a * s, (r * .35 + R(i + 9) * .25) * s, (R(i + 5) - .5) * .7 * s); g.add(sp); }
  for (let i = 0; i < 3; i++) { const sp = new THREE.Mesh(new THREE.SphereGeometry((.5 + R(i + 20) * .25) * s, 18, 12), CLOUD_M()); sp.position.set((R(i + 30) - .5) * 1.6 * s, (.75 + R(i + 40) * .3) * s, (R(i + 50) - .5) * .4 * s); g.add(sp); }
  return at(g, x, y, z); }
// ---------- 레벨 섬 시안 (?isle=N) ----------
const M3 = (geo, c, line = .03) => mesh(geo, c, { line });
const sph = (r, c, line = .02) => M3(new THREE.SphereGeometry(r, 16, 12), c, line);
// 섬 바탕: 1 · 3 · 4 = 흙 + 풀 (가장자리 풀 방울 · 아래 지층 · 늘어진 덩굴) / 2 = 케이크 (스펀지 · 잼 · 크림 · 크림 흘러내림 · 스프링클)
function isle2(sc, R, rad, x, z, y, col, i) { const g = new THREE.Group(); let th;
  const edge = (r, yy, c, n = 18, s = .13) => { for (let k = 0; k < n; k++) { const a = k / n * TAU, rr = r * R(a), d = sph(s * (.8 + (k % 3) * .2), c, 0); d.scale.y = 1.7; d.position.set(Math.cos(a) * rr, yy, Math.sin(a) * rr); g.add(d); } };
  { const top = col[1];
    g.add(at(M3(islandGeo(R, rad, .5), 0xC89A6A, .05), 0, .25, 0)); g.add(at(M3(islandGeo(R, rad * 1.03, .2), top, .05), 0, .6, 0)); edge(rad * 1.03, .5, top);
    const c1 = new THREE.ConeGeometry(rad * .95, 1.0, 10, 2); c1.rotateX(Math.PI); g.add(at(M3(c1, 0xA9784E, .04), 0, -.5, 0)); const c2 = new THREE.ConeGeometry(rad * .55, 1.1, 8, 2); c2.rotateX(Math.PI); g.add(at(M3(c2, 0x7A5638, .03), 0, -1.35, 0));
    for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + i, rr = rad * .9 * R(a), l = .5 + (k % 3) * .3, vn = M3(new THREE.CylinderGeometry(.03, .02, l, 5), 0x5DAA5E, 0); vn.position.set(Math.cos(a) * rr, .3 - l / 2, Math.sin(a) * rr); g.add(vn); g.add(at(sph(.07, 0x6DBE6A, 0), Math.cos(a) * rr, .3 - l, Math.sin(a) * rr)); }
    th = .72; }
  g.position.set(x, y, z); sc.add(g); return [g, y + th]; }
// ================= 놀이공원 레벨 섬 (?isle=9) =================
const stripeTex = (a, b, n = 8, vert = true) => canvasTex(256, 256, (g, W, H) => { for (let k = 0; k < n; k++) { g.fillStyle = k % 2 ? b : a; if (vert) g.fillRect(k * W / n, 0, W / n + 1, H); else g.fillRect(0, k * H / n, W, H / n + 1); } });
const tmesh = (geo, map, line = .03) => { const m = M3(geo, 0xffffff, line); m.material.map = map; return m; };
const balloonBunch = (g, x, y, z, A, n = 3, h = .9) => { const cols = [0xF28CB1, 0xFFE200, 0x7FA7E8, 0x7FD6A0, 0xE8505B]; for (let k = 0; k < n; k++) { const b = new THREE.Group(), bl = sph(.13, cols[k % 5], .015); bl.scale.y = 1.2; b.add(bl); const top = new THREE.Vector3((k - (n - 1) / 2) * .14, h + (k % 2) * .12, (k % 2) * .06); b.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -.15, 0), new THREE.Vector3(-top.x, -top.y, -top.z)]), new THREE.LineBasicMaterial({ color: 0x5A5A5E }))); b.position.set(x + top.x, y + top.y, z + top.z); g.add(b); const by = b.position.y; A.push((t) => { b.position.y = by + Math.sin(t * 1.4 + k) * .05; b.rotation.z = Math.sin(t + k) * .08; }); } };
function lvParkMark(S, g, lv, y) { const A = [];
  if (lv === 0) { // 매표소 · 입구 아치 · 풍선
    g.add(at(M3(new THREE.BoxGeometry(.6, .55, .5), 0xFFF3E0), -.3, y + .28, -.2)); const cn = tmesh(new THREE.ConeGeometry(.55, .35, 4, 1, true), stripeTex('#E8505B', '#FFFFFF', 8)); cn.rotation.y = Math.PI / 4; g.add(at(cn, -.3, y + .72, -.2)); g.add(at(sph(.06, 0xFFE200), -.3, y + .92, -.2));
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(.5, .14), new THREE.MeshBasicMaterial({ map: textTex('TICKET', '#23305E', '#FFE200', 512, 140, 'Lexend', 84) })); sg.position.set(-.3, y + .45, .06); g.add(sg);
    [-1, 1].forEach((k) => g.add(at(M3(new THREE.CylinderGeometry(.06, .07, .8, 10), 0xF28CB1), .55 + k * .35, y + .4, .3))); const ar = M3(new THREE.TorusGeometry(.35, .05, 8, 20, Math.PI), 0xFFE200, .02); g.add(at(ar, .55, y + .8, .3));
    for (let k = 0; k <= 6; k++) { const a = k / 6 * Math.PI, b = new THREE.Mesh(new THREE.SphereGeometry(.03, 6, 4), new THREE.MeshBasicMaterial({ color: k % 2 ? 0xFFF3B0 : 0xFFB3C7 })); b.position.set(.55 + Math.cos(a) * .35, y + .8 + Math.sin(a) * .35, .36); g.add(b); }
    balloonBunch(g, .2, y + .1, .4, A, 3, .8); }
  if (lv === 1) { // 회전목마
    const car = new THREE.Group(); car.add(at(M3(new THREE.CylinderGeometry(.75, .8, .14, 24), 0xFFF3E0), 0, .07, 0)); car.add(at(M3(new THREE.CylinderGeometry(.06, .06, 1.1, 10), 0xFFE200, .015), 0, .65, 0));
    const roof = tmesh(new THREE.ConeGeometry(.85, .45, 16, 1, true), stripeTex('#F28CB1', '#FFF6EE', 16)); car.add(at(roof, 0, 1.4, 0)); car.add(at(M3(new THREE.CylinderGeometry(.85, .85, .1, 24), 0xF28CB1, .02), 0, 1.15, 0)); car.add(at(sph(.08, 0xFFE200), 0, 1.66, 0));
    const horses = []; for (let k = 0; k < 6; k++) { const a = k / 6 * TAU, hp = new THREE.Group(); hp.add(at(M3(new THREE.CylinderGeometry(.015, .015, .95, 6), 0xFFE200, 0), 0, .62, 0)); const body = new THREE.Group(); body.add(at(M3(new THREE.CapsuleGeometry(.07, .18, 4, 8), [0xFFFFFF, 0xC9BFF0, 0xFADB94][k % 3], .015), 0, 0, 0)); body.children[0].rotation.z = Math.PI / 2; body.add(at(sph(.06, [0xFFFFFF, 0xC9BFF0, 0xFADB94][k % 3], .01), .13, .07, 0)); hp.add(body); hp.position.set(Math.cos(a) * .58, 0, Math.sin(a) * .58); hp.rotation.y = -a; car.add(hp); horses.push([body, k]); }
    for (let k = 0; k < 16; k++) { const a = k / 16 * TAU, b = new THREE.Mesh(new THREE.SphereGeometry(.03, 6, 4), new THREE.MeshBasicMaterial({ color: 0xFFF3B0 })); b.position.set(Math.cos(a) * .86, 1.15, Math.sin(a) * .86); car.add(b); }
    g.add(at(car, 0, y, -.1)); A.push((t) => { car.rotation.y = t * .6; horses.forEach(([b, k]) => { b.position.y = .45 + Math.sin(t * 3 + k) * .1; }); }); }
  if (lv === 2) { // 커피잔 · 팝콘 수레
    const pl = new THREE.Group(); pl.add(at(tmesh(new THREE.CylinderGeometry(.8, .8, .1, 32), canvasTex(256, 256, (gg) => { for (let k = 0; k < 12; k++) { gg.fillStyle = k % 2 ? '#C9BFF0' : '#FFF6EE'; gg.beginPath(); gg.moveTo(128, 128); gg.arc(128, 128, 128, k / 12 * TAU, (k + 1) / 12 * TAU); gg.fill(); } }), .02), 0, .05, 0)); const cups = [];
    [[0xF28CB1, 0], [0x7FD6A0, 2.1], [0xFADB94, 4.2]].forEach(([c, a]) => { const cp = new THREE.Group(); cp.add(at(M3(new THREE.CylinderGeometry(.24, .16, .24, 18), c), 0, .12, 0)); cp.add(at(M3(new THREE.CylinderGeometry(.21, .21, .02, 18), 0x8A5A36, 0), 0, .23, 0)); const hd = M3(new THREE.TorusGeometry(.08, .025, 6, 12), c, .01); hd.position.set(.26, .14, 0); cp.add(hd); cp.position.set(Math.cos(a) * .48, .1, Math.sin(a) * .48); pl.add(cp); cups.push(cp); });
    pl.add(at(M3(new THREE.CylinderGeometry(.12, .16, .3, 14), 0xFFFFFF), 0, .25, 0)); pl.add(at(sph(.09, 0xF28CB1), 0, .45, 0)); g.add(at(pl, -.1, y, -.1)); A.push((t) => { pl.rotation.y = t * .4; cups.forEach((c, k) => { c.rotation.y = t * 2.2 * (k % 2 ? -1 : 1); }); });
    const pc = new THREE.Group(); pc.add(at(M3(new THREE.BoxGeometry(.32, .26, .22), 0xE8505B), 0, .25, 0)); pc.add(at(tmesh(new THREE.BoxGeometry(.3, .22, .2), stripeTex('#E8505B', '#FFFFFF', 6), .015), 0, .5, 0)); for (let k = 0; k < 8; k++) pc.add(at(sph(.04, 0xFFF3C4, 0), (rnd() - .5) * .2, .64 + rnd() * .05, (rnd() - .5) * .14)); [-.12, .12].forEach((k) => { const w = M3(new THREE.CylinderGeometry(.07, .07, .03, 12), 0x2B2B2E, .01); w.rotation.x = Math.PI / 2; pc.add(at(w, k, .07, .12)); }); g.add(at(pc, .85, y, .45)); }
  if (lv === 3) { // 관람차
    const fw = new THREE.Group(), R = .95, hub = 1.25; [-1, 1].forEach((k) => { const lg = M3(new THREE.CylinderGeometry(.04, .05, 1.45, 8), 0x3F5BA9, .015); lg.rotation.z = k * .32; fw.add(at(lg, k * .22, .62, -.1)); const lg2 = lg.clone(); fw.add(at(lg2, k * .22, .62, .1)); });
    const wheel = new THREE.Group(); [-.08, .08].forEach((z) => { const r = M3(new THREE.TorusGeometry(R, .025, 6, 48), 0xF28CB1, .01); r.position.z = z; wheel.add(r); }); for (let k = 0; k < 8; k++) { const sp2 = M3(new THREE.CylinderGeometry(.012, .012, R * 2, 4), 0xFFFFFF, 0); sp2.rotation.z = k / 8 * Math.PI; wheel.add(sp2); }
    for (let k = 0; k < 24; k++) { const a = k / 24 * TAU, b = new THREE.Mesh(new THREE.SphereGeometry(.025, 6, 4), new THREE.MeshBasicMaterial({ color: [0xFFF3B0, 0xFFB3C7, 0xBFE4FF][k % 3] })); b.position.set(Math.cos(a) * R, Math.sin(a) * R, .09); wheel.add(b); }
    wheel.position.set(0, hub, 0); fw.add(wheel); fw.add(at(sph(.09, 0xFFE200), 0, hub, .1)); const gons = []; for (let k = 0; k < 8; k++) { const gd = new THREE.Group(); gd.add(at(M3(new THREE.BoxGeometry(.18, .16, .16), [0xE8505B, 0xFFE200, 0x7FA7E8, 0x7FD6A0][k % 4], .015), 0, -.1, 0)); gd.add(at(M3(new THREE.ConeGeometry(.13, .07, 4), 0xFFFFFF, .01), 0, .02, 0)); fw.add(gd); gons.push(gd); }
    fw.rotation.y = .5; g.add(at(fw, 0, y, -.2)); A.push((t) => { wheel.rotation.z = t * .25; gons.forEach((gd, k) => { const a = t * .25 + k / 8 * TAU; gd.position.set(Math.cos(a) * R, hub + Math.sin(a) * R, 0); }); }); }
  if (lv === 4) { // 롤러코스터 + 성 + 불꽃놀이
    const cs = new THREE.Group(); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b], k) => { cs.add(at(M3(new THREE.CylinderGeometry(.1, .11, .7, 10), 0xFFF6EE), a * .25, .35, b * .2)); cs.add(at(M3(new THREE.ConeGeometry(.14, .25, 10), [0xF28CB1, 0x9C7BE8, 0x7FA7E8, 0xFFE200][k]), a * .25, .82, b * .2)); });
    cs.add(at(M3(new THREE.BoxGeometry(.5, .5, .4), 0xFFF6EE), 0, .25, 0)); cs.add(at(M3(new THREE.CylinderGeometry(.13, .14, .55, 10), 0xFFF6EE), 0, .75, 0)); cs.add(at(M3(new THREE.ConeGeometry(.18, .35, 10), 0xF28CB1), 0, 1.2, 0)); cs.add(at(M3(new THREE.CylinderGeometry(.01, .01, .3, 4), 0x1E1A2B, 0), 0, 1.5, 0)); cs.add(at(M3(new THREE.BoxGeometry(.18, .1, .01), 0xFFE200, .005), .09, 1.6, 0)); g.add(at(cs, -.45, y, -.4));
    const P = []; for (let k = 0; k < 24; k++) { const a = k / 24 * TAU; P.push(new THREE.Vector3(.25 + Math.cos(a) * .95, .35 + (Math.sin(a * 2) * .5 + .5) * 1.0 + (k > 14 && k < 20 ? .4 : 0), .05 + Math.sin(a) * .7)); }
    const cv = new THREE.CatmullRomCurve3(P, true); g.add(at(M3(new THREE.TubeGeometry(cv, 120, .035, 6, true), 0xE8505B, .012), 0, y, 0)); for (let k = 0; k < 12; k++) { const p = cv.getPointAt(k / 12); g.add(at(M3(new THREE.CylinderGeometry(.015, .015, p.y, 4), 0xFFFFFF, 0), p.x, y + p.y / 2, p.z)); }
    const trn = []; for (let k = 0; k < 3; k++) { const c = M3(new THREE.BoxGeometry(.16, .1, .12), [0xFFE200, 0x7FA7E8, 0x7FD6A0][k], .012); g.add(c); trn.push(c); } A.push((t) => trn.forEach((c, k) => { const u = (t * .12 - k * .022 + 1) % 1, p = cv.getPointAt(u), q = cv.getTangentAt(u); c.position.set(p.x, y + p.y + .06, p.z); c.lookAt(c.position.clone().add(q)); }));
    const fws = []; [[-.6, 2.2, -.4, 0xFF6B8B], [.8, 2.5, 0, 0xFFE200], [.1, 2.8, -.6, 0x7FD6F0]].forEach(([x0, y0, z0, c], k) => { const grp = new THREE.Group(), parts = []; for (let q = 0; q < 14; q++) { const m = new THREE.Mesh(new THREE.SphereGeometry(.035, 6, 4), new THREE.MeshBasicMaterial({ color: c, transparent: true })); const d = new THREE.Vector3(Math.cos(q / 14 * TAU), Math.sin(q / 14 * TAU), (rnd() - .5) * .6).normalize(); m.userData.d = d; grp.add(m); parts.push(m); } grp.position.set(x0, y + y0, z0); g.add(grp); fws.push([grp, parts, k]); });
    A.push((t) => fws.forEach(([grp, parts, k]) => { const q = (t * .45 + k / 3) % 1; parts.forEach((m) => { m.position.copy(m.userData.d).multiplyScalar(q * .6); m.material.opacity = q < .15 ? 0 : 1 - q; m.scale.setScalar(1 - q * .5); }); })); }
  if (A.length) S.ticks.push((t) => A.forEach((f) => f(t))); }
function parkDeco(S, g, lv, y, R, rad) { const ring = (n, k = .9, off = 0) => Array.from({ length: n }, (_, j) => { const a = j / n * TAU + off, r = rad * k * R(a); return [Math.cos(a) * r, Math.sin(a) * r]; }), A = [];
  // 둘레 전구 줄 (기둥 사이 늘어진 줄)
  const posts = ring(10, .92); posts.forEach(([x, z]) => { g.add(at(M3(new THREE.CylinderGeometry(.02, .025, .55, 6), 0x3A3550, 0), x, y + .27, z)); g.add(at(sph(.04, 0xFFE200, .01), x, y + .57, z)); });
  const bulbs = []; posts.forEach(([x1, z1], j) => { const [x2, z2] = posts[(j + 1) % posts.length]; for (let k = 1; k < 5; k++) { const u = k / 5; bulbs.push([x1 + (x2 - x1) * u, y + .5 - Math.sin(u * Math.PI) * .12, z1 + (z2 - z1) * u]); } });
  const im = new THREE.InstancedMesh(new THREE.SphereGeometry(.035, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffffff }), bulbs.length), o = new THREE.Object3D(), BC = [0xFFF3B0, 0xFFB3C7, 0xBFE4FF, 0xC9F2C0]; bulbs.forEach((p, j) => { o.position.set(...p); o.updateMatrix(); im.setMatrixAt(j, o.matrix); im.setColorAt(j, new THREE.Color(BC[j % 4])); }); g.add(im);
  A.push((t) => { const on = Math.floor(t * 3) % 2; bulbs.forEach((_, j) => im.setColorAt(j, new THREE.Color((j + on) % 2 ? BC[j % 4] : 0xFFFFFF))); im.instanceColor.needsUpdate = true; });
  // 삼각 깃발 (아래 가장자리) · 바닥 꽃 · 색종이
  ring(14, .8, .2).forEach(([x, z], j) => g.add(at(sph(.05, [0xF28CB1, 0xFFE200, 0x7FA7E8, 0xFFFFFF][j % 4], .01), x, y + .05, z)));
  const cf = []; for (let k = 0; k < 14; k++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(.06, .1), new THREE.MeshBasicMaterial({ color: [0xF28CB1, 0xFFE200, 0x7FA7E8, 0x7FD6A0, 0x9C7BE8][k % 5], side: THREE.DoubleSide, transparent: true })); m.userData = { x: (rnd() - .5) * rad * 1.6, z: (rnd() - .5) * rad * 1.2, ph: rnd() }; g.add(m); cf.push(m); }
  A.push((t) => cf.forEach((m) => { const u = m.userData, q = (t * .22 + u.ph) % 1; m.position.set(u.x + Math.sin(t * 1.5 + u.ph * 9) * .2, y + 2.4 - q * 2.6, u.z); m.rotation.set(t * 3 + u.ph * 5, t * 2, 0); m.material.opacity = q > .85 ? (1 - q) * 6.6 : 1; }));
  // 둘레 풍선 하나씩 떠올라요
  const fb = sph(.12, [0xF28CB1, 0xFFE200, 0x7FA7E8, 0x7FD6A0, 0xE8505B][lv], .015); fb.scale.y = 1.2; g.add(fb); A.push((t) => { const q = (t * .12 + lv * .2) % 1; fb.position.set(rad * .7, y + .4 + q * 3.2, -rad * .3); fb.visible = q < .95; });
  S.ticks.push((t) => A.forEach((f) => f(t))); }
// 2안 · 하늘 계단 섬: 위로 갈수록 높이 · 나무 다리 · 구름 바다
BUILD.study2 = (EL, SC) => {
  const S = stage(EL, { half: 8.6, pos: CAM, target: new THREE.Vector3(0, 3.4, 0), bg: bgTex('#5FB0E8', '#FCE7DC', (g, W, H) => { const gl = g.createRadialGradient(W * .8, H * .12, 6, W * .8, H * .12, W * .6); gl.addColorStop(0, 'rgba(255,248,214,1)'); gl.addColorStop(.25, 'rgba(255,240,200,.55)'); gl.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = gl; g.fillRect(0, 0, W, H);
    g.save(); g.globalAlpha = .18; g.fillStyle = '#FFF6D8'; for (let i = 0; i < 6; i++) { const a = 1.9 + i * .22; g.beginPath(); g.moveTo(W * .8, H * .12); g.lineTo(W * .8 + Math.cos(a) * W * 1.2, H * .12 + Math.sin(a) * W * 1.2); g.lineTo(W * .8 + Math.cos(a + .07) * W * 1.2, H * .12 + Math.sin(a + .07) * W * 1.2); g.fill(); } g.restore();
    const bank = (y, r, col, sh) => { for (let x = -r; x < W + r; x += r * .9) { const yy = y + Math.sin(x * .05) * r * .25; g.fillStyle = sh; g.beginPath(); g.arc(x, yy + r * .18, r, 0, 7); g.fill(); g.fillStyle = col; g.beginPath(); g.arc(x, yy, r, 0, 7); g.fill(); } g.fillStyle = col; g.fillRect(0, y, W, H - y); };
    bank(H * .52, 34, 'rgba(255,232,228,.9)', 'rgba(236,200,210,.6)'); bank(H * .6, 42, 'rgba(255,244,240,.95)', 'rgba(220,214,236,.6)'); bank(H * .7, 50, '#FFFFFF', 'rgba(206,218,238,.8)'); }), az: [.2, 1.2] }), sc = S.sc;
  // 구름 바다: 아래 넓게 깔린 부드러운 구름 (안개 띠 + 몽실 구름 · 천천히 옆으로 흘러요)
  { const fogT = canvasTex(512, 512, (g, W, H) => { const gr = g.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, W / 2); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(.7, 'rgba(255,255,255,.75)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); });
    const fp = new THREE.Mesh(new THREE.PlaneGeometry(46, 46), new THREE.MeshBasicMaterial({ map: fogT, transparent: true, depthWrite: false })); fp.rotation.x = -Math.PI / 2; fp.position.y = -2.4; fp.userData.bg = 1; sc.add(fp); }
  const drift = [];
  for (let i = 0; i < 30; i++) { const row = Math.floor(i / 6), [x, z] = SX(-9.5 + (i % 6) * 3.6 + (row % 2) * 1.8, -14 + row * 5.2); const c = puffCloud(x, -2.6 + (i % 3) * .25, z, 1.0 + (i % 4) * .12, i + 1); c.userData.bg = 1; sc.add(c); drift.push([c, x, i]); }
  [[-4.8, -2.6, 1.2, .5], [4.6, 1.0, 2.4, .45], [-4.4, 4.4, 3.4, .42], [4.2, 7.2, 4.4, .38], [-3.6, 8.8, 5.6, .35]].forEach(([a, b, y, k], i) => { const [x, z] = SX(a, b), c = puffCloud(x, y, z, k, i + 50); c.userData.bg = 1; sc.add(c); drift.push([c, x, i + 30]); });
  S.ticks.push((t) => drift.forEach(([c, x, i]) => { c.position.x = x + Math.sin(t * .15 + i) * .5; c.scale.y = 1 + Math.sin(t * .6 + i) * .03; }));
  const SP = [[-3.1, -9.6], [3.3, -4.9], [-3.3, -.3], [3.1, 4.3], [-2.2, 8.6]], H = [0, 1.4, 2.8, 4.2, 5.6], SH = [SHAPES.peanut, SHAPES.bean, SHAPES.squircle, SHAPES.scallop, SHAPES.bean], RAD = [1.4, 1.9, 1.8, 1.8, 1.8], tops = [];
  const ISL = [], OFF = [1.25, .25];
  const landOn = (k) => { const e = ISL[k]; if (!e) return null; return () => new THREE.Vector3(e.g.position.x + OFF[0], e.g.position.y + e.top, e.g.position.z + OFF[1]); };
  SP.forEach(([a, b], i) => { const [x, z] = SX(a, b), y = H[i], st = (SC[i] || [])[2]; let g, ty;
    [g, ty] = isle2(sc, SH[i], RAD[i], x, z, y, LV_COL[i], i); const mg = new THREE.Group(); mg.position.y = ty - y; mg.scale.setScalar(1.3); g.add(mg); lvParkMark(S, mg, i, 0); parkDeco(S, g, i, ty - y, SH[i], RAD[i]);
    // 커밍순 섬은 색을 빼요
    if (st === 'soon') g.traverse((o) => { if (o.isMesh && o.material && !Array.isArray(o.material) && o.material !== inkMat && o.material.color && !o.material.map && !o.userData.dim) { o.material = o.material.clone(); o.material.color.lerp(new THREE.Color(0xDDD8CE), .65); o.userData.dim = 1; } });
    tagIt(g, lvInfo(S, SC, i, new THREE.Vector3(x, ty, z))); tops.push(new THREE.Vector3(x, ty, z));
    for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + i, c = puffCloud(Math.cos(a) * RAD[i] * .8, -1.35 - (k % 2) * .2, Math.sin(a) * RAD[i] * .6, .32, i * 10 + k); g.add(c); }   // 섬 밑 구름 고리
    if (st === 'soon') { g.add(puffCloud(-.6, ty - y + .3, .4, .35, 77)); g.add(puffCloud(.8, ty - y + .1, -.3, .3, 78)); }
    ISL[i] = { g, top: ty - y };
    if (i === (SC.sel != null && SC[SC.sel] ? SC.sel : SC.findIndex((q) => q[2] === 'cur'))) palloRun(S, pallo(sc, x + OFF[0], ty, z + OFF[1], 1.15), ty, { land: (info) => landOn(info.no - 1), home: landOn(i) });   // 캐릭터는 지금 고른 섬에
    tagUnder(S, SC, i, x, y - .2, z, RAD[i] * .95, 6);
    S.ticks.push((t) => { g.position.y = y + Math.sin(t * 1.1 + i * 1.7) * .1; }); });
  return S; };




/**
 * 지도 그리기 (프로토타입 PALLO3D.mount).
 * SC: 스터디 맵 [[이름, 진도, 'soon'|'cur'|'open'], …] (+ SC.sel = 고른 섬) · 상황 맵 [[장면 이름, 아이콘, 'done'|'cur'|'open'|'soon'], …]
 * onOpen(번호): 아래 카드의 버튼을 눌렀을 때
 */
export function mountWorld(host, id, SC, onOpen) {
  OPEN = onOpen;
  let f = BUILD[id];
  if (!f) {
    // 데이터 쪽(@/data/maps)이 모르는 프리셋을 미리 걸러요. 여기까지 오면 presets.ts 와 BUILD 가 어긋난 거예요
    if (__DEV__) console.warn(`[maps] BUILD '${id}' 가 없어요 — presets.ts 의 build 이름을 확인하세요. 여행 모양으로 그려요`);
    f = BUILD.travel;
  }
  const S = f(host, SC);
  S.draw();
  return S;
}
export { BUILD };
