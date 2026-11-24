// 유료 그라데이션 몸 색 PNG 만들기: bodies.json → assets/characters/av/body-<id>.png
// 앱에서 직접 고른 몸 색과 같은 방법(avatar.tsx Body: 바탕 + 회색(명도) + 색(채도) + 그림자)을, 한 가지 색 대신 대각선 그라데이션으로 칠해요.
// 실행: node mobile/scripts/av-art/make-bodies.js   (pngjs 는 expo 가 같이 깔아요)
const fs = require('fs'), path = require('path');
const { PNG } = require('pngjs');
const dir = path.join(__dirname, '../../assets/characters/av');
const read = (n) => PNG.sync.read(fs.readFileSync(path.join(dir, n + '.png')));
const [base, fill, sat, shade] = ['tint-base', 'tint-fill', 'tint-sat', 'tint-shade'].map(read);
const { width: W, height: H } = base;
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
/** t(0~1) 자리의 색 (stops 를 고르게 나눠요) */
const colorAt = (stops, t) => {
  const c = stops.map(rgb), k = Math.min(c.length - 1.0001, Math.max(0, t) * (c.length - 1)), i = Math.floor(k), f = k - i;
  return c[i].map((v, j) => v + (c[i + 1][j] - v) * f);
};
/** 몸 상자 안의 그라데이션 위치: 왼쪽 위 → 오른쪽 아래 (몸이 있는 x 13~489 · y 8~320 기준) */
const tOf = (x, y) => ((x - 13) / 476) * 0.5 + ((y - 8) / 312) * 0.5;
/** 아래 위에 rgb · 알파 a 를 겹치기 (보통 겹침) */
const over = (o, i, r, g, b, a) => {
  const ao = o[i + 3] / 255, an = a + ao * (1 - a);
  if (!an) return;
  for (const [j, v] of [[0, r], [1, g], [2, b]]) o[i + j] = (v * a + o[i + j] * ao * (1 - a)) / an;
  o[i + 3] = an * 255;
};
const { bodies } = JSON.parse(fs.readFileSync(path.join(__dirname, 'bodies.json'), 'utf8'));
for (const b of bodies) {
  const out = new PNG({ width: W, height: H });
  const o = new Float64Array(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    const c = colorAt(b.stops, tOf(x, y)), v = Math.max(...c);
    over(o, i, base.data[i], base.data[i + 1], base.data[i + 2], base.data[i + 3] / 255);
    over(o, i, v, v, v, fill.data[i + 3] / 255);
    over(o, i, c[0], c[1], c[2], sat.data[i + 3] / 255);
    over(o, i, shade.data[i], shade.data[i + 1], shade.data[i + 2], shade.data[i + 3] / 255);
  }
  for (let i = 0; i < o.length; i++) out.data[i] = Math.round(o[i]);
  fs.writeFileSync(path.join(dir, `body-${b.id}.png`), PNG.sync.write(out));
  console.log('body-' + b.id);
}
