/*
 * PALLO 꾸미기 아이템 원본 그림 — 이 파일을 고치고 export.html 로 PNG 를 다시 뽑아요 (README.md).
 * 모든 그림은 캐릭터 원본 좌표(520 × 332) 위에 그려요. 그래서 눈 · 팔 · 다리 자리에 꼭 맞아요.
 *   눈: 왼 (258.5, 64) · 오른 (339.5, 65.5) · 반지름 36.5 × 57.5 · 눈 꼭대기 y≈8
 *   몸 막대(팔 · 얼굴): y 54~169 · x 13~488 · 코 (298, 125)
 *   다리: 왼 (206,168)→(163,310) · 오른 (298,168)→(352,322)
 * 배경 · 효과(fx)는 무대 좌표(300 × 220).
 * 입체감: 바탕색 + 왼쪽 위 빛 + 오른쪽 아래 그늘 + 가장자리 어둡게 (캐릭터 3D 와 같은 빛 방향).
 * 옷 · 장갑 · 신발(paint)은 몸 모양으로 잘라 캐릭터 원본의 빛 · 그림자를 곱해요.
 */
(function () {
  const INK = '#1E1A2B';
  const IMG = { mask: 'body-mask.png', shade: 'up-yellow.png' };
  let U = 0;
  const r1 = (n) => Math.round(n * 10) / 10;
  const ell = (cx, cy, rx, ry) => `M${r1(cx - rx)} ${r1(cy)}a${rx} ${ry} 0 1 0 ${r1(2 * rx)} 0a${rx} ${ry} 0 1 0 ${r1(-2 * rx)} 0Z`;
  const rr = (x, y, w, h, r) => `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}h${-(w - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${-r}v${-(h - 2 * r)}a${r} ${r} 0 0 1 ${r} ${-r}Z`;
  const star = (x, y, r, k = 0.45, n = 5, rot = -90) => 'M' + [...Array(n * 2)].map((_, i) => { const a = ((rot + (180 / n) * i) * Math.PI) / 180, q = i % 2 ? r * k : r; return `${r1(x + q * Math.cos(a))} ${r1(y + q * Math.sin(a))}`; }).join('L') + 'Z';
  const heart = (x, y, s) => { const k = s / 28; const p = (a, b) => `${r1(x + a * k)} ${r1(y + b * k)}`; return `M${p(0, 13)}L${p(-13, 0)}C${p(-20, -7)} ${p(-17, -16)} ${p(-9, -16)}C${p(-4, -16)} ${p(-1, -13)} ${p(0, -9)}C${p(1, -13)} ${p(4, -16)} ${p(9, -16)}C${p(17, -16)} ${p(20, -7)} ${p(13, 0)}Z`; };
  const drop = (x, y, s) => `M${x} ${y - s}C${x + s * 0.2} ${y - s * 0.4} ${x + s * 0.62} ${y - s * 0.05} ${x + s * 0.62} ${y + s * 0.4}A${s * 0.62} ${s * 0.62} 0 0 1 ${x - s * 0.62} ${y + s * 0.4}C${x - s * 0.62} ${y - s * 0.05} ${x - s * 0.2} ${y - s * 0.4} ${x} ${y - s}Z`;

  const DEFS = `<defs>
<radialGradient id="avHi" cx=".32" cy=".22" r=".8" fx=".3" fy=".18"><stop offset="0" stop-color="#fff" stop-opacity=".72"/><stop offset=".34" stop-color="#fff" stop-opacity=".2"/><stop offset=".7" stop-color="#fff" stop-opacity="0"/></radialGradient>
<linearGradient id="avLo" x1=".2" y1="0" x2=".72" y2="1"><stop offset=".42" stop-color="${INK}" stop-opacity="0"/><stop offset="1" stop-color="${INK}" stop-opacity=".36"/></linearGradient>
<radialGradient id="avAo" cx=".5" cy=".46" r=".56"><stop offset=".62" stop-color="${INK}" stop-opacity="0"/><stop offset="1" stop-color="${INK}" stop-opacity=".2"/></radialGradient>
<linearGradient id="avGold" x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stop-color="#FFF4B8"/><stop offset=".45" stop-color="#FFCB2E"/><stop offset="1" stop-color="#D08A10"/></linearGradient>
<linearGradient id="avSilver" x1="0" y1="0" x2=".5" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".5" stop-color="#C9CCD6"/><stop offset="1" stop-color="#7D8193"/></linearGradient>
<linearGradient id="avGlass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset=".5" stop-color="#fff" stop-opacity=".06"/><stop offset="1" stop-color="#fff" stop-opacity=".24"/></linearGradient>
<radialGradient id="avBlush" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FF6F91" stop-opacity=".75"/><stop offset=".6" stop-color="#FF8FA8" stop-opacity=".38"/><stop offset="1" stop-color="#FF8FA8" stop-opacity="0"/></radialGradient>
</defs>`;

  /** 입체 칠 한 덩어리 */
  const P = (d, c, o = {}) => {
    const t = o.t ? ` transform="${o.t}"` : '';
    const sh = o.flat ? '' : `<path d="${d}" fill="url(#avLo)"/><path d="${d}" fill="url(#avAo)"/><path d="${d}" fill="url(#avHi)" opacity="${o.hi ?? 1}"/>`;
    const rim = o.rim === 0 ? '' : `<path d="${d}" fill="none" stroke="${INK}" stroke-opacity="${o.rim ?? 0.22}" stroke-width="${o.sw ?? 2.4}" stroke-linejoin="round"/>`;
    return `<g${t}${o.op != null ? ` opacity="${o.op}"` : ''}><path d="${d}" fill="${c}"${o.fr ? ' fill-rule="evenodd"' : ''}/>${sh}${rim}</g>`;
  };
  /** 반짝 빛 */
  const gl = (x, y, rx, ry, r = -30, op = 0.85) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${r} ${x} ${y})" fill="#fff" opacity="${op}"/>`;
  /** 선 */
  const ln = (d, c, w, o = {}) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="${o.cap || 'round'}" stroke-linejoin="round"${o.op != null ? ` stroke-opacity="${o.op}"` : ''}${o.da ? ` stroke-dasharray="${o.da}"` : ''}/>`;
  const fl = (d, c, op) => `<path d="${d}" fill="${c}"${op != null ? ` opacity="${op}"` : ''}/>`;
  const sp = (x, y, r, c = '#fff') => `<path d="${star(x, y, r, 0.28, 4, -90)}" fill="${c}"/>`;   // 반짝 별(4갈래)
  /** 뭉게뭉게 테두리 (타원 둘레에 작은 원호 n 개 · 뽀글 머리 · 구름) */
  const scallop = (cx, cy, rx, ry, n, b) => { const p = (i) => { const a = (i / n) * Math.PI * 2; return `${r1(cx + Math.cos(a) * rx)} ${r1(cy + Math.sin(a) * ry)}`; }; return `M${p(0)}` + [...Array(n)].map((_, i) => `A${b} ${b} 0 0 1 ${p(i + 1)}`).join('') + 'Z'; };
  /** 작은 소용돌이 컬 */
  const rng = (n, f) => [...Array(n)].map((_, i) => f(i)).join('');

  // ---------------------------------------------------------------- 팔 · 다리 띠 (옷 · 장갑 · 신발 자리)
  const LIMB = { hl: [[164, 112], [8, 112]], hr: [[346, 112], [494, 112]], ll: [[206, 168], [163, 312]], lr: [[298, 168], [353, 324]] };
  const geo = (k) => { const [[ax, ay], [bx, by]] = LIMB[k]; const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy); return { ax, ay, ux: dx / L, uy: dy / L, L }; };
  const at = (k, s, w = 0) => { const g = geo(k); return [r1(g.ax + g.ux * g.L * s - g.uy * w), r1(g.ay + g.uy * g.L * s + g.ux * w)]; };
  /** 다리 사이 가르는 선 (몸 모양에서 잰 가랑이 x). 다리 띠는 이 선을 넘어 반대쪽 다리까지 칠하지 않아요 */
  const CROTCH_X = 252.5;
  /** 다리 띠의 안쪽(다른 다리 쪽) 끝 w: 왼다리는 음수 · 오른다리는 양수. 두 다리 띠가 1px 겹쳐 이음매가 안 보여요 */
  const innerW = (k, s, W) => {
    const g = geo(k), x0 = g.ax + g.ux * g.L * s, w = (x0 - CROTCH_X + (k === 'll' ? -0.5 : 0.5)) / g.uy;
    return k === 'll' ? Math.max(-W, w) : Math.min(W, w);
  };
  /** 다리 바깥쪽은 다리 두께(≈64)보다 조금만 넓게 — 120 이면 치마 · 바지 윗모서리가 팔 아래까지 올라가 보여요 */
  const LEG_OUT = 82;
  const ends = (k, s, W) => (k === 'll' ? [innerW(k, s, W), Math.min(W, LEG_OUT)] : k === 'lr' ? [-Math.min(W, LEG_OUT), innerW(k, s, W)] : [-W, W]);
  /** 팔 · 다리를 s0~s1 (0 = 몸 쪽, 1 = 끝) 만큼 덮는 띠. b = 끝선이 끝 쪽으로 볼록한 정도 */
  const band = (k, s0, s1, b0 = 0.05, b1 = 0.05, W = 120) => {
    const [a0, c0] = ends(k, s0, W), [a1, c1] = ends(k, s1, W);
    const A = at(k, s0, a0), B = at(k, s0, c0), C = at(k, s1, c1), D = at(k, s1, a1);
    const q0 = at(k, s0 + b0 * 2, (a0 + c0) / 2), q1 = at(k, s1 + b1 * 2, (a1 + c1) / 2);
    return `M${A} Q${q0} ${B} L${C} Q${q1} ${D}Z`;
  };
  /** 띠 끝선 하나 (줄 · 시보리 선) */
  const cut = (k, s, b = 0.05, W = 120) => { const [a, c] = ends(k, s, W); return `M${at(k, s, a)} Q${at(k, s + b * 2, (a + c) / 2)} ${at(k, s, c)}`; };

  // 윗옷 자리: 소매 끝 xl · xr, 밑단 hy. 얼굴(목둘레)은 비워요
  const NECK = 'M204 20 C198 142 250 168 300 168 C350 168 402 142 396 20 Z';
  const top = (xl, xr, hy = 214, hb = 16) => `M${xl} -20 L${xr} -20 L${xr} ${hy} Q${(xr + 300) / 2} ${hy} 300 ${hy + hb} Q${(xl + 300) / 2} ${hy} ${xl} ${hy} Z ${NECK}`;
  /** 몸에 칠하기 (몸 모양으로 자르고 원본 빛 · 그림자를 곱해요) */
  const paint = (body, out = '') => {
    const u = 'p' + U++;
    return `<defs><mask id="m${u}" maskUnits="userSpaceOnUse" x="0" y="0" width="520" height="332"><image href="${IMG.mask}" width="520" height="332"/></mask>
<filter id="s${u}" filterUnits="userSpaceOnUse" x="0" y="0" width="520" height="332" color-interpolation-filters="sRGB">
<feImage href="${IMG.shade}" x="0" y="0" width="520" height="332" preserveAspectRatio="none" result="im"/>
<feColorMatrix in="im" type="matrix" values=".2126 .7152 .0722 0 0 .2126 .7152 .0722 0 0 .2126 .7152 .0722 0 0 0 0 0 1 0" result="l"/>
<feComponentTransfer in="l" result="d"><feFuncR type="linear" slope="1.22" intercept="-.02"/><feFuncG type="linear" slope="1.22" intercept="-.02"/><feFuncB type="linear" slope="1.22" intercept="-.02"/></feComponentTransfer>
<feComponentTransfer in="l" result="h"><feFuncR type="linear" slope="3" intercept="-2.62"/><feFuncG type="linear" slope="3" intercept="-2.62"/><feFuncB type="linear" slope="3" intercept="-2.62"/></feComponentTransfer>
<feBlend in="SourceGraphic" in2="d" mode="multiply" result="m"/><feBlend in="h" in2="m" mode="screen" result="s"/><feComposite in="s" in2="SourceGraphic" operator="in"/></filter></defs>
<g mask="url(#m${u})"><g filter="url(#s${u})">${body}</g></g>${out}`;
  };
  const rib = (k, s0, s1, n, c = INK, op = 0.16) => rng(n, (i) => { const s = s0 + ((s1 - s0) * (i + 0.5)) / n; void s; return ''; }) + rng(n, (i) => { const w = -110 + (220 * (i + 0.5)) / n; return ln(`M${at(k, s0, w)} L${at(k, s1, w)}`, c, 3, { op }); });

  // ---------------------------------------------------------------- 모자 (캐릭터 · 눈 뒤에 · 눈이 앞으로 보여요)
  const HATS = [
    { id: 'h-beanie', cover: true, clipY: 38, name: '털 비니', price: 0, rare: '기본', art: () =>
      P('M210 24 C204 -64 250 -100 300 -100 C350 -100 396 -64 390 24 Z', '#FF7A59') +
      rng(7, (i) => { const x = 222 + i * 26; return ln(`M${x} 18 Q${x + (x - 300) * 0.12} -40 ${300 + (x - 300) * 0.3} -94`, INK, 3, { op: 0.13 }); }) +
      P(rr(198, -10, 204, 48, 22), '#FFF4D6') + rng(19, (i) => ln(`M${208 + i * 10} -2 L${208 + i * 10} 30`, INK, 2.4, { op: 0.1 })) +
      P(ell(300, -108, 30, 28), '#FFF4D6') + rng(8, (i) => { const a = (i / 8) * Math.PI * 2; return `<circle cx="${r1(300 + Math.cos(a) * 18)}" cy="${r1(-108 + Math.sin(a) * 16)}" r="3" fill="${INK}" opacity=".07"/>`; }) +
      gl(262, -66, 18, 7, -40, 0.5) },
    { id: 'h-cap', cover: true, clipY: 30, name: '야구 모자', price: 120, rare: '일반', art: () =>
      P('M214 14 C210 -66 254 -100 300 -100 C346 -100 390 -66 386 14 Z', '#5B8DEF') +
      ln('M300 -100 Q298 -40 300 12', INK, 3, { op: 0.16 }) + ln('M300 -100 Q250 -56 236 12', INK, 2.6, { op: 0.13 }) + ln('M300 -100 Q350 -56 364 12', INK, 2.6, { op: 0.13 }) +
      `<circle cx="252" cy="-30" r="3" fill="${INK}" opacity=".18"/><circle cx="348" cy="-30" r="3" fill="${INK}" opacity=".18"/>` +
      P(ell(300, -102, 11, 6), '#FFFFFF') +
      P(ell(300, -42, 26, 26), '#FFFFFF', { rim: 0.2 }) + `<text x="300" y="-32" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="30" fill="#E5484D">P</text>` +
      P('M188 10 Q300 -16 412 10 Q428 34 300 40 Q172 34 188 10 Z', '#2F4A8C', { rim: 0.3 }) + ln('M200 14 Q300 -6 400 14', '#FFFFFF', 3, { op: 0.35 }) +
      gl(254, -66, 20, 8, -38, 0.5) },
    { id: 'h-beret', cover: true, clipY: 40, name: '화가 베레모', price: 120, rare: '일반', art: () =>
      P('M216 24 Q300 44 384 22 L384 36 Q300 58 216 38 Z', '#3A2570') +
      P(ell(312, -12, 110, 40), '#5B3FA6', { t: 'rotate(-9 312 -12)' }) +
      ln('M318 -52 q3 -14 13 -20', INK, 8) + gl(258, -28, 26, 8, -14, 0.45) },
    { id: 'h-straw', cover: true, clipY: 54, name: '밀짚모자', price: 180, rare: '일반', art: () =>
      P(ell(300, 24, 156, 32), '#F2C76B') + rng(3, (i) => `<path d="${ell(300, 24, 128 - i * 26, 24 - i * 4)}" fill="none" stroke="#B5822A" stroke-opacity=".35" stroke-width="2.4" stroke-dasharray="7 6"/>`) +
      P('M234 26 C230 -40 256 -68 300 -68 C344 -68 370 -40 366 26 Z', '#F2C76B') +
      rng(6, (i) => ln(`M240 ${-40 + i * 12} Q300 ${-30 + i * 12} 360 ${-40 + i * 12}`, '#B5822A', 2.4, { op: 0.3, da: '6 6' })) +
      P('M233 -4 Q300 8 367 -4 L368 18 Q300 30 232 18 Z', '#E5484D') +
      P('M352 0 l26 -14 l4 26 Z', '#E5484D') + gl(262, -40, 16, 7, -50, 0.5) },
    { id: 'h-bunny', name: '토끼 귀 머리띠', price: 300, rare: '레어', art: () =>
      P(ell(252, -86, 28, 70), '#FFFFFF', { t: 'rotate(-14 252 -86)' }) + P(ell(252, -80, 14, 48), '#F8B4CB', { t: 'rotate(-14 252 -80)', rim: 0, hi: 0.4 }) +
      P(ell(352, -80, 28, 66), '#FFFFFF', { t: 'rotate(18 352 -80)' }) + P(ell(352, -74, 14, 44), '#F8B4CB', { t: 'rotate(18 352 -74)', rim: 0, hi: 0.4 }) +
      P('M208 34 C210 -40 390 -40 392 34 L378 34 C374 -22 226 -22 222 34 Z', '#F28CB1') + gl(240, -116, 7, 18, -14, 0.7) },
    { id: 'h-phones', name: '헤드폰', price: 300, rare: '레어', art: () =>
      P('M194 40 C186 -88 414 -88 406 40 L386 40 C388 -58 212 -58 214 40 Z', '#3A3A48') +
      P(rr(252, -76, 96, 22, 11), '#F28CB1') +
      P(rr(176, -10, 44, 70, 20), '#F28CB1') + P(rr(166, -2, 18, 54, 9), '#3A3A48') +
      P(rr(380, -10, 44, 70, 20), '#F28CB1') + P(rr(416, -2, 18, 54, 9), '#3A3A48') + gl(190, 6, 6, 14, 0, 0.6) },
    { id: 'h-grad', cover: true, clipY: 30, name: '학사모', price: 400, rare: '레어', art: () =>
      P('M234 -26 L234 26 Q300 50 366 26 L366 -26 Q300 2 234 -26 Z', '#2A2533') +
      P('M176 -40 L300 -88 L424 -40 L300 8 Z', '#34304A', { hi: 0.8 }) + P(ell(300, -41, 10, 6), '#FFCB2E') +
      ln('M300 -41 Q378 -46 400 -30 L402 30', '#FFCB2E', 5) + P(rr(392, 26, 20, 34, 8), 'url(#avGold)') +
      rng(4, (i) => ln(`M${396 + i * 4} 40 L${396 + i * 4} 58`, '#B57A10', 1.6, { op: 0.6 })) },
    { id: 'h-witch', cover: true, clipY: 48, name: '마녀 모자', price: 500, rare: '에픽', art: () =>
      P(ell(300, 24, 138, 26), '#493087') +
      P('M232 24 C248 -40 268 -126 336 -176 C348 -182 360 -174 352 -162 C322 -120 340 -50 368 24 Z', '#5B3FA6') +
      P('M240 0 Q300 14 362 0 L364 22 Q300 34 238 22 Z', '#FFE200') + P(rr(286, 0, 28, 24, 5), '#3A2570') +
      P(star(300, -80, 14, 0.45), '#FFE200', { rim: 0.3 }) + sp(330, -122, 9) + sp(270, -40, 7) + gl(272, -70, 8, 30, 20, 0.35) },
    { id: 'h-santa', cover: true, clipY: 42, name: '산타 모자', price: 0, rare: '시즌', lock: '12월 출석 7일 보상', art: () =>
      P('M212 26 C212 -44 262 -90 332 -82 C384 -76 424 -36 438 18 C420 -2 398 -8 386 -2 C388 8 390 18 392 26 Z', '#E5484D') +
      P(ell(442, 28, 24, 24), '#FFFFFF') +
      P(rr(198, -2, 204, 44, 22), '#FFFFFF') + rng(10, (i) => `<circle cx="${212 + i * 20}" cy="${i % 2 ? 8 : 30}" r="5" fill="${INK}" opacity=".06"/>`) +
      gl(264, -52, 20, 8, -40, 0.45) },
    { id: 'h-crown', cover: true, clipY: 32, name: '황금 왕관', price: 0, rare: '시즌', lock: '주간 랭킹 TOP 3 보상', art: () =>
      P('M222 30 L212 -44 L254 -10 L276 -66 L300 -22 L324 -66 L346 -10 L388 -44 L378 30 Z', 'url(#avGold)', { rim: 0.3 }) +
      P(rr(218, 6, 164, 26, 9), 'url(#avGold)', { rim: 0.3 }) +
      [[212, -48], [276, -70], [324, -70], [388, -48]].map(([x, y]) => P(ell(x, y, 8, 8), 'url(#avGold)', { rim: 0.3 })).join('') +
      P(ell(300, 19, 11, 10), '#E5484D') + P(ell(256, 19, 8, 7), '#7FA7E8') + P(ell(344, 19, 8, 7), '#7FA7E8') + sp(240, -20, 9) + sp(360, -30, 6) },
  ];

  // ---------------------------------------------------------------- 헤어 (머리 색 H · back = 눈 뒤, front = 눈 위 앞머리 · 모자 쓰면 앞머리는 숨겨요)
  const Hp = (d, H, o = {}) => P(d, H, { rim: 0.2, ...o });
  const st = (d, op = 0.4, w = 6) => ln(d, '#fff', w, { op });
  const mir = (s) => `<g transform="translate(600 0) scale(-1 1)">${s}</g>`;
  const HAIRS = [
    { id: 'hr-sprout', name: '새싹 한 가닥', price: 0, rare: '기본', back: (H) =>
      Hp('M290 32 C282 2 280 -34 298 -58 C316 -82 354 -72 348 -44 C344 -26 322 -30 324 -42 C312 -32 308 -6 312 32 Z', H) + st('M296 -20 Q294 -46 312 -62', 0.45, 5) },
    { id: 'hr-spiky', name: '삐죽 머리', price: 0, rare: '기본', back: (H) =>
      `<path d="M206 40 L212 -8 L236 8 L238 -44 L266 -8 L282 -62 L300 -16 L322 -60 L334 -8 L362 -40 L364 8 L390 -6 L394 40 Z" fill="${H}" stroke="${H}" stroke-width="10" stroke-linejoin="round"/>` +
      Hp('M206 40 L212 -8 L236 8 L238 -44 L266 -8 L282 -62 L300 -16 L322 -60 L334 -8 L362 -40 L364 8 L390 -6 L394 40 Z', H, { rim: 0 }) + st('M262 -14 L276 -46', 0.45) + st('M318 -16 L326 -44', 0.35) },
    { id: 'hr-bowl', name: '바가지 머리', price: 100, rare: '일반', back: (H) =>
      Hp('M200 56 C194 -54 406 -54 400 56 Z', H),
      front: (H) => Hp('M206 32 C204 -18 396 -18 394 32 Q378 40 362 32 Q346 42 330 32 Q314 42 298 32 Q282 42 266 32 Q250 42 234 32 Q220 40 206 32 Z', H, { hi: 0.7 }) + st('M236 0 Q270 -14 304 -14', 0.4, 5) },
    { id: 'hr-bun', name: '똥머리', price: 100, rare: '일반', back: (H) =>
      Hp(ell(300, -58, 36, 34), H) + Hp('M204 50 C198 -40 402 -40 396 50 Z', H) + P(rr(270, -36, 60, 14, 7), '#F28CB1') + st('M282 -72 Q296 -84 312 -78', 0.45, 5),
      front: (H) => Hp('M208 34 C206 -8 300 -28 392 18 C356 6 318 10 292 28 C272 14 238 18 208 34 Z', H, { hi: 0.7 }) },
    { id: 'hr-quiff', name: '올린 앞머리', price: 120, rare: '일반', back: (H) =>
      Hp('M202 52 C192 -24 248 -66 314 -68 C366 -70 410 -44 414 -10 C392 -28 358 -24 346 -8 C386 -6 402 22 398 52 Z', H) +
      st('M236 -24 Q284 -58 346 -54', 0.45) + st('M262 -6 Q300 -30 352 -30', 0.3, 5) },
    { id: 'hr-bob', name: '단발', price: 120, rare: '일반', back: (H) =>
      Hp('M190 72 C174 -36 250 -54 300 -54 C350 -54 426 -36 410 72 Z', H),
      front: (H) => Hp('M204 64 C196 6 222 -20 300 -20 C378 -20 404 6 396 64 C388 66 382 60 378 52 C380 34 376 22 368 18 Q300 36 232 18 C224 22 220 34 222 52 C218 60 212 66 204 64 Z', H, { hi: 0.75 }) + st('M232 -2 Q266 -16 300 -16', 0.4, 5) },
    { id: 'hr-pig', name: '양갈래', price: 150, rare: '일반', back: (H) =>
      Hp('M200 50 C196 -40 404 -40 400 50 Z', H) +
      Hp('M214 4 C180 -30 128 -26 112 6 C100 32 114 66 132 78 C130 54 140 40 160 34 C182 28 204 30 216 30 Z', H) + mir(Hp('M214 4 C180 -30 128 -26 112 6 C100 32 114 66 132 78 C130 54 140 40 160 34 C182 28 204 30 216 30 Z', H)) +
      P(ell(212, 16, 13, 16), '#F28CB1') + P(ell(388, 16, 13, 16), '#F28CB1') + st('M126 4 Q150 -14 182 -10', 0.4, 5),
      front: (H) => Hp('M210 30 C210 -10 250 -26 298 -22 C290 0 260 14 210 30 Z', H, { hi: 0.7 }) + Hp('M390 30 C390 -10 350 -26 302 -22 C310 0 340 14 390 30 Z', H, { hi: 0.7 }) },
    { id: 'hr-pony', name: '포니테일', price: 150, rare: '일반', back: (H) =>
      Hp('M232 -8 C186 -44 116 -42 98 0 C86 34 104 64 124 76 C120 44 136 22 166 16 C194 10 214 16 226 24 Z', H) +
      Hp('M202 50 C196 -40 404 -40 398 50 Z', H) + P(ell(228, 4, 14, 18), '#FFE200', { t: 'rotate(-20 228 4)' }) + st('M116 -2 Q140 -26 178 -24', 0.4, 5),
      front: (H) => Hp('M208 34 C206 -8 300 -28 392 18 C356 6 318 10 292 28 C272 14 238 18 208 34 Z', H, { hi: 0.7 }) },
    { id: 'hr-curly', name: '뽀글 펌', price: 200, rare: '레어', back: (H) =>
      Hp(scallop(300, -20, 124, 92, 18, 24), H),
      front: (H) => Hp('M210 30 C212 -16 388 -16 390 30' + [...Array(8)].map((_, i) => `A13 13 0 0 1 ${390 - (i + 1) * 22.5} 30`).join('') + 'Z', H, { hi: 0.7 }) },
    { id: 'hr-long', name: '긴 생머리', price: 250, rare: '레어', back: (H) =>
      Hp('M194 60 C176 -48 424 -48 406 60 C424 122 446 186 440 250 C420 264 394 262 378 246 L300 110 L222 246 C206 262 180 264 160 250 C154 186 176 122 194 60 Z', H) + st('M424 150 Q436 200 430 238', 0.35, 5) + st('M176 150 Q166 200 170 238', 0.35, 5),
      front: (H) => Hp('M300 -24 C262 -24 222 -6 212 38 C210 52 208 62 202 72 C190 40 194 0 228 -20 C250 -30 280 -32 300 -24 Z', H, { hi: 0.6 }) + Hp('M300 -24 C338 -24 378 -6 388 38 C390 52 392 62 398 72 C410 40 406 0 372 -20 C350 -30 320 -32 300 -24 Z', H, { hi: 0.6 }) },
  ];

  // ---------------------------------------------------------------- 눈 (원본 눈 위에 덧그려요 · lid = 몸 색 눈꺼풀: t 위에서, b 아래에서, only 한쪽 눈)
  const EY = [[258.5, 64, 273, 68, -1], [339.5, 65.5, 354, 69, 1]];
  const ERX = 36.5, ERY = 57.5;
  const lash = (x, y, side, degs, len, w) => degs.map((deg) => {
    const a = ((deg * Math.PI) / 180) * side, px = x + ERX * Math.sin(a), py = y - ERY * Math.cos(a);
    const ox = px + Math.sin(a) * len, oy = py - Math.cos(a) * len - 5;
    return ln(`M${r1(px)} ${r1(py)} Q${r1((px + ox) / 2 + side * 4)} ${r1((py + oy) / 2 - 5)} ${r1(ox)} ${r1(oy)}`, INK, w);
  }).join('');
  const EYES = [
    { id: 'e-sparkle', name: '반짝 눈', price: 0, rare: '기본', art: () => EY.map(([, , px, py]) => gl(px - 5, py - 17, 9, 11, -20, 0.95) + `<circle cx="${px + 6}" cy="${py + 13}" r="4" fill="#fff"/>` + sp(px - 18, py - 34, 7)).join('') },
    { id: 'e-lash', name: '긴 속눈썹', price: 120, rare: '일반', art: () => EY.map(([x, y, , , s]) => lash(x, y, s, [26, 46, 66], 20, 6)).join('') },
    { id: 'e-liner', name: '아이라인', price: 120, rare: '일반', art: () => EY.map(([x, y, , , s]) => { const ex = x + s * ERX * 0.9, ey = y - ERY * 0.36; return fl(`M${r1(ex - s * 8)} ${r1(ey + 10)} Q${r1(ex + s * 18)} ${r1(ey - 2)} ${r1(ex + s * 38)} ${r1(ey - 30)} Q${r1(ex + s * 14)} ${r1(ey - 10)} ${r1(ex - s * 10)} ${r1(ey - 12)}Z`, INK); }).join('') },
    { id: 'e-sleepy', name: '졸린 눈', price: 100, rare: '일반', lid: { t: 0.46 } },
    { id: 'e-calm', name: '느긋한 눈', price: 100, rare: '일반', lid: { t: 0.27 } },
    { id: 'e-happy', name: '웃는 눈', price: 150, rare: '일반', lid: { b: 0.5 } },
    { id: 'e-wink', name: '찡긋 윙크', price: 200, rare: '레어', lid: { t: 1.04, only: 1 }, art: () => { const [x, y, px, py] = EY[0]; return gl(px - 5, py - 17, 9, 11, -20, 0.95) + `<circle cx="${px + 6}" cy="${py + 13}" r="4" fill="#fff"/>` + ln(`M${EY[1][0] + 30} ${EY[1][1] + 46} l14 8`, INK, 6) + ln(`M${EY[1][0] + 18} ${EY[1][1] + 56} l8 12`, INK, 6) + (x + y ? '' : ''); } },
    { id: 'e-heart', name: '하트 눈', price: 250, rare: '레어', art: () => EY.map(([, , px, py]) => P(heart(px - 3, py + 4, 52), '#E5484D', { rim: 0.3 }) + gl(px - 14, py - 8, 6, 9, -30, 0.9)).join('') },
    { id: 'e-star', name: '별 눈', price: 250, rare: '레어', art: () => EY.map(([, , px, py]) => P(star(px - 3, py + 1, 27, 0.46), '#FFE200', { rim: 0.4 }) + gl(px - 10, py - 9, 4, 6, -30, 0.9)).join('') },
    { id: 'e-teary', name: '감동 눈물', price: 200, rare: '레어', art: () => EY.map(([x, y, px, py, s]) => gl(px - 6, py - 16, 11, 13, -20, 0.95) + gl(px - 14, py + 8, 5, 6, 0, 0.9) + `<path d="M${px - 18} ${py + 26} Q${px} ${py + 36} ${px + 14} ${py + 24}" fill="none" stroke="#9FDBFF" stroke-width="6" stroke-linecap="round" opacity=".9"/>` + (s > 0 ? P(drop(x + 34, y + 58, 16), '#8FD3FF', { rim: 0.25 }) + gl(x + 30, y + 58, 3, 6, 0, 0.9) : '')).join('') },
  ];

  // ---------------------------------------------------------------- 얼굴 (캐릭터 앞)
  const FACES = [
    { id: 'f-cheek', name: '발그레 볼', price: 0, rare: '기본', art: () => `<ellipse cx="230" cy="138" rx="30" ry="17" fill="url(#avBlush)"/><ellipse cx="372" cy="140" rx="30" ry="17" fill="url(#avBlush)"/>` + gl(222, 134, 5, 3, 0, 0.7) + gl(364, 136, 5, 3, 0, 0.7) },
    { id: 'f-cheek3', name: '하트 볼', price: 150, rare: '일반', art: () => `<ellipse cx="230" cy="138" rx="28" ry="15" fill="url(#avBlush)" opacity=".7"/><ellipse cx="372" cy="140" rx="28" ry="15" fill="url(#avBlush)" opacity=".7"/>` + P(heart(230, 140, 26), '#FF5C8A', { rim: 0.2 }) + P(heart(372, 142, 26), '#FF5C8A', { rim: 0.2 }) },
    { id: 'f-freck', name: '주근깨', price: 80, rare: '일반', art: () => [[214, 132], [226, 142], [238, 130], [222, 124], [362, 132], [374, 142], [386, 130], [378, 124]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 3 ? 3 : 3.8}" fill="#A0582A" opacity=".75"/>`).join('') },
    { id: 'f-bandaid', name: '반창고', price: 80, rare: '일반', art: () => `<g transform="rotate(-22 374 136)">` + P(rr(344, 126, 60, 22, 11), '#F2C49B', { rim: 0.25 }) + P(rr(362, 128, 24, 18, 5), '#E3A97B', { rim: 0, hi: 0.3 }) + rng(4, (i) => `<circle cx="${366 + (i % 2) * 10}" cy="${133 + Math.floor(i / 2) * 8}" r="1.6" fill="#B97A52"/>`) + `</g>` },
    { id: 'f-mono', name: '외알 안경', price: 250, rare: '레어', art: () =>
      `<path d="${ell(341, 67, 50, 64)}" fill="url(#avGlass)"/>` + `<path d="${ell(341, 67, 50, 64)} ${ell(341, 67, 42, 56)}" fill="url(#avGold)" fill-rule="evenodd"/>` + `<path d="${ell(341, 67, 50, 64)}" fill="none" stroke="${INK}" stroke-opacity=".3" stroke-width="2"/>` +
      ln('M384 98 Q404 150 380 196', '#E0A21A', 3, { da: '1 6' }) + ln('M384 98 Q404 150 380 196', '#FFCB2E', 2.4, { da: '4 4' }) + ln('M314 30 Q326 14 344 10', '#fff', 4, { op: 0.75 }) + ln('M322 118 l16 -34', '#fff', 5, { op: 0.4 }) },
    { id: 'f-stache', name: '멋쟁이 콧수염', price: 120, rare: '일반', art: () => '<g transform="translate(0 8)">' + P('M300 136 C290 128 274 128 266 136 C258 144 246 144 240 136 C240 152 262 158 280 150 C290 146 296 142 300 142 C304 142 310 146 320 150 C338 158 360 152 360 136 C354 144 342 144 334 136 C326 128 310 128 300 136 Z', '#3B2A20', { rim: 0.3 }) + gl(276, 136, 8, 2.5, 0, 0.35) + gl(326, 136, 8, 2.5, 0, 0.35) + '</g>' },
    { id: 'f-glasses', name: '동그란 안경', price: 200, rare: '일반', art: () =>
      `<path d="${ell(257, 66, 52, 66)}" fill="url(#avGlass)"/><path d="${ell(341, 67, 52, 66)}" fill="url(#avGlass)"/>` +
      `<path d="${ell(257, 66, 52, 66)} ${ell(257, 66, 44, 58)}" fill="#8A5A3B" fill-rule="evenodd"/><path d="${ell(341, 67, 52, 66)} ${ell(341, 67, 44, 58)}" fill="#8A5A3B" fill-rule="evenodd"/>` +
      ln('M288 32 Q299 22 310 32', '#8A5A3B', 7) + ln('M205 60 L186 56', '#8A5A3B', 7) + ln('M393 60 L412 56', '#8A5A3B', 7) +
      ln('M222 30 Q234 14 252 10', '#fff', 4, { op: 0.7 }) + ln('M306 30 Q318 14 336 10', '#fff', 4, { op: 0.7 }) + ln('M232 116 l14 -30', '#fff', 5, { op: 0.4 }) + ln('M316 118 l14 -30', '#fff', 5, { op: 0.4 }) },
    { id: 'f-shades', name: '하트 선글라스', price: 300, rare: '레어', art: () =>
      `<linearGradient id="avLens" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3A1E3F"/><stop offset="1" stop-color="#C2456E"/></linearGradient>` +
      ln('M286 50 Q299 42 312 50', INK, 5) + ln('M214 58 L190 50', INK, 5) + ln('M384 58 L408 50', INK, 5) +
      P(heart(254, 70, 72), 'url(#avLens)', { rim: 0.5, sw: 5, hi: 0.5 }) + P(heart(344, 71, 72), 'url(#avLens)', { rim: 0.5, sw: 5, hi: 0.5 }) +
      gl(240, 54, 8, 4, -30, 0.7) + gl(330, 55, 8, 4, -30, 0.7) },
    { id: 'f-patch', name: '해적 안대', price: 200, rare: '일반', art: () =>
      ln('M304 30 L279 9 A41 62 0 0 0 219 80', '#2A2533', 7) + ln('M380 50 Q398 54 402 72', '#2A2533', 7) +
      P(ell(340, 68, 42, 60), '#2A2533', { rim: 0.4 }) + P(star(340, 66, 13, 0.42), '#FFFFFF', { rim: 0, flat: 1 }) },
    { id: 'f-beard', name: '산타 수염', price: 0, rare: '시즌', lock: '12월 출석 7일 보상', art: () =>
      [[244, 152, 20], [268, 164, 22], [300, 170, 24], [332, 164, 22], [356, 152, 20], [256, 186, 20], [284, 196, 22], [316, 196, 22], [344, 186, 20], [300, 218, 20], [276, 214, 16], [324, 214, 16]].map(([x, y, r]) => P(ell(x, y, r, r), '#FFFFFF', { rim: 0.1, hi: 0.5 })).join('') +
      P('M300 140 C284 130 256 132 246 146 C262 156 286 154 300 148 C314 154 338 156 354 146 C344 132 316 130 300 140 Z', '#FFFFFF', { rim: 0.16 }) },
  ];

  // ---------------------------------------------------------------- 옷 (몸에 칠해요)
  /** 아래옷: 두 다리 띠 + 허리 네모. 겹치는 조각을 한 path 로 합치면 감은 방향이 반대인 곳이 지워져 구멍이 나요 → 조각마다 따로 칠해요 */
  const lower = (s0, s1, waist, c, b = [0.04, 0.03]) => [band('ll', s0, s1, ...b), band('lr', s0, s1, ...b), waist].map((d) => fl(d, c)).join('');
  const pants = (s1, c) => lower(0.26, s1, 'M96 190 H420 V236 H96 Z', c);
  const WEARS = [
    { id: 'w-tee', name: '줄무늬 티셔츠', price: 0, rare: '기본', art: () => paint(
      fl(top(112, 400), '#FFFFFF') + `<clipPath id="te${U}"><path d="${top(112, 400)}" fill-rule="evenodd"/></clipPath>` +
      `<g clip-path="url(#te${U})">${rng(9, (i) => fl(`M0 ${-4 + i * 26} H520 V${12 + i * 26} H0Z`, '#2F4A8C'))}</g>` +
      ln(NECK.replace(' Z', ''), '#2F4A8C', 12) + ln('M112 40 Q122 112 112 184', '#E5484D', 18, { cap: 'butt' }) + ln('M400 40 Q390 112 400 184', '#E5484D', 18, { cap: 'butt' })) },
    { id: 'w-hoodie', name: '포근 후드티', price: 200, rare: '일반', art: () => paint(
      `<path d="${top(56, 446, 216)}" fill="#B9A7F0" fill-rule="evenodd"/>` +
      ln(NECK.replace(' Z', ''), '#A390E6', 30) + ln(NECK.replace(' Z', ''), INK, 3, { op: 0.15 }) +
      ln('M56 44 Q66 112 56 180', '#9C88E0', 22, { cap: 'butt' }) + ln('M446 44 Q436 112 446 180', '#9C88E0', 22, { cap: 'butt' }) +
      rng(4, (i) => ln(`M${50 + i * 4} 50 Q${60 + i * 4} 112 ${50 + i * 4} 176`, INK, 1.6, { op: 0.15 })) +
      fl('M226 186 Q300 176 374 186 L384 222 Q300 236 216 222 Z', '#A390E6') + ln('M226 186 Q300 176 374 186 L384 222 Q300 236 216 222 Z', INK, 2.4, { op: 0.2 }) +
      ln('M282 168 Q278 186 282 200', '#FFFFFF', 5) + ln('M318 168 Q322 186 318 200', '#FFFFFF', 5) + fl(rr(277, 198, 10, 12, 4), '#E5E0F5') + fl(rr(313, 198, 10, 12, 4), '#E5E0F5') +
      fl('M96 210 H420 V226 Q300 244 96 226 Z', '#A390E6')) },
    { id: 'w-college', name: '대학생 후드티', price: 300, rare: '레어', art: () => paint(
      `<path d="${top(56, 446, 216)}" fill="#2B3A73" fill-rule="evenodd"/>` +
      ln('M84 46 Q94 112 84 178', '#FFCB2E', 9, { cap: 'butt' }) + ln('M100 46 Q110 112 100 178', '#FFFFFF', 6, { cap: 'butt' }) +
      ln('M418 46 Q408 112 418 178', '#FFCB2E', 9, { cap: 'butt' }) + ln('M402 46 Q392 112 402 178', '#FFFFFF', 6, { cap: 'butt' }) +
      ln('M56 44 Q66 112 56 180', '#22305F', 22, { cap: 'butt' }) + ln('M446 44 Q436 112 446 180', '#22305F', 22, { cap: 'butt' }) +
      ln(NECK.replace(' Z', ''), '#3A4C8C', 30) + ln(NECK.replace(' Z', ''), INK, 3, { op: 0.15 }) +
      ln('M284 168 Q281 176 284 183', '#FFFFFF', 3.5) + ln('M316 168 Q319 176 316 183', '#FFFFFF', 3.5) + `<circle cx="284" cy="184" r="2.6" fill="#E5E0F5"/><circle cx="316" cy="184" r="2.6" fill="#E5E0F5"/>` +
      `<path id="cgArc${U}" d="M222 208 Q300 186 378 208" fill="none"/>` +
      `<text font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="27" letter-spacing="1" text-anchor="middle" fill="#FFFFFF" stroke="#FFCB2E" stroke-width="2.4" paint-order="stroke"><textPath href="#cgArc${U}" startOffset="50%">PALLO</textPath></text>` +
      `<text x="300" y="214" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="9" letter-spacing="2" text-anchor="middle" fill="#FFCB2E">UNIV · 2026</text>` +
      fl('M96 214 H420 V228 Q300 246 96 228 Z', '#22305F') + rng(32, (i) => ln(`M${102 + i * 10} 214 l0 14`, '#FFFFFF', 1.6, { op: 0.18 }))) },
    { id: 'w-overall', name: '청 멜빵바지', price: 200, rare: '일반', art: () => paint(
      pants(0.8, '#4A78C2') + fl('M240 166 H360 V214 H240 Z', '#4A78C2') +
      ln('M246 170 L232 50', '#4A78C2', 22, { cap: 'butt' }) + ln('M354 170 L368 50', '#4A78C2', 22, { cap: 'butt' }) +
      ln('M246 170 L232 50', '#F2A93B', 2, { da: '5 5' }) + ln('M354 170 L368 50', '#F2A93B', 2, { da: '5 5' }) +
      ln('M248 172 H352 V210', '#F2A93B', 2, { da: '5 5', cap: 'butt' }) + fl(rr(274, 180, 52, 28, 6), '#3E67AC') + ln(rr(274, 180, 52, 28, 6), '#F2A93B', 2, { da: '4 4' }) +
      `<circle cx="248" cy="170" r="8" fill="#FFCB2E"/><circle cx="352" cy="170" r="8" fill="#FFCB2E"/>` +
      ln(cut('ll', 0.78, 0.03), '#6A93D6', 16, { cap: 'butt' }) + ln(cut('lr', 0.78, 0.03), '#6A93D6', 16, { cap: 'butt' }) + ln('M300 232 L300 260', INK, 2, { op: 0.2 })) },
    { id: 'w-sweater', name: '꽈배기 니트', price: 250, rare: '일반', art: () => paint(
      `<path d="${top(58, 444, 214)}" fill="#F5E6C8" fill-rule="evenodd"/>` +
      [250, 300, 350].map((x) => rng(6, (i) => ln(`M${x - 10} ${164 + i * 10} q10 6 20 0`, '#C98E5A', 4) + ln(`M${x - 10} ${169 + i * 10} q10 -6 20 0`, '#C98E5A', 2.4, { op: 0.5 }))).join('') +
      ln(NECK.replace(' Z', ''), '#DDA978', 18) + rng(30, (i) => { const t = i / 29; const x = 206 + t * 188; const y = t < 0.5 ? 40 + Math.sin(t * Math.PI) * 140 : 40 + Math.sin(t * Math.PI) * 140; return ln(`M${r1(x)} ${r1(y - 8)} l0 14`, '#B99A66', 2, { op: 0.4 }); }) +
      rng(3, (i) => ln(`M${74 + i * 32} 60 Q${86 + i * 32} 112 ${74 + i * 32} 168`, '#D8A575', 3)) + rng(3, (i) => ln(`M${428 - i * 32} 60 Q${416 - i * 32} 112 ${428 - i * 32} 168`, '#D8A575', 3)) +
      ln('M58 44 Q68 112 58 180', '#DDA978', 20, { cap: 'butt' }) + ln('M444 44 Q434 112 444 180', '#DDA978', 20, { cap: 'butt' }) +
      fl('M96 208 H420 V222 Q300 240 96 222 Z', '#DDA978') + rng(30, (i) => ln(`M${104 + i * 10} 208 l0 16`, '#B99A66', 2, { op: 0.35 }))) },
    { id: 'w-suit', name: '정장 재킷', price: 350, rare: '레어', art: () => paint(
      `<path d="${top(60, 440, 222, 18)}" fill="#2E3350" fill-rule="evenodd"/>` +
      fl('M232 120 L300 220 L368 120 Q340 168 300 170 Q260 168 232 120 Z', '#FFFFFF') +
      fl('M292 170 L308 170 L314 182 L300 230 L286 182 Z', '#E5484D') + fl('M290 166 h20 l-4 12 h-12 Z', '#B83238') +
      fl('M216 80 L262 160 L300 226 L254 196 L232 150 Z', '#3B4166') + fl('M384 80 L338 160 L300 226 L346 196 L368 150 Z', '#3B4166') +
      `<circle cx="300" cy="206" r="5" fill="#C9CCD6"/>` + fl('M352 176 l22 -4 l2 8 l-22 4 Z', '#FFE200') +
      ln('M60 44 Q70 112 60 180', '#FFFFFF', 12, { cap: 'butt' })) },
    { id: 'w-hanbok', name: '색동 한복', price: 350, rare: '레어', art: () => paint(
      lower(0.2, 0.95, 'M90 196 H426 V240 H90 Z', '#3B5BA9', [0.04, 0.04]) +
      ln('M96 212 Q300 228 424 212', '#2D4889', 10) +
      `<path d="${top(66, 436, 206, 10)}" fill="#F7B3C9" fill-rule="evenodd"/>` +
      rng(5, (i) => ln(`M${132 - i * 15} 40 Q${142 - i * 15} 112 ${132 - i * 15} 184`, ['#E5484D', '#FFE200', '#5CBF8A', '#7FA7E8', '#B07CE0'][i], 15, { cap: 'butt' })) +
      rng(5, (i) => ln(`M${370 + i * 15} 40 Q${360 + i * 15} 112 ${370 + i * 15} 184`, ['#E5484D', '#FFE200', '#5CBF8A', '#7FA7E8', '#B07CE0'][i], 15, { cap: 'butt' })) +
      ln(NECK.replace(' Z', ''), '#FFFFFF', 16),
      P('M304 172 Q288 200 276 246 L290 248 Q298 206 310 178 Z', '#E5484D', { rim: 0.2 }) + P('M308 172 Q326 206 322 252 L336 250 Q340 200 314 172 Z', '#E5484D', { rim: 0.2 }) + P(ell(306, 172, 11, 9), '#D63A44', { rim: 0.2 })) },
    { id: 'w-apron', name: '카페 앞치마', price: 200, rare: '일반', art: () => paint(
      fl('M240 150 Q300 144 360 150 L364 192 Q420 194 432 200 L428 286 Q300 310 96 286 L92 200 Q180 194 236 192 Z', '#5CBF8A') +
      ln('M240 152 L226 44', '#5CBF8A', 12, { cap: 'butt' }) + ln('M360 152 L374 44', '#5CBF8A', 12, { cap: 'butt' }) +
      ln('M90 200 Q300 186 434 200', '#4AA676', 12) + fl(rr(266, 214, 70, 36, 8), '#4AA676') + ln('M314 214 L322 196', '#FFE200', 5) +
      ln('M100 284 Q300 308 426 284', '#FFFFFF', 4, { da: '6 6', op: 0.8 }) + fl(rr(264, 158, 72, 26, 9), '#FFFFFF') + `<circle cx="300" cy="171" r="7" fill="#5CBF8A"/>`) },
    { id: 'w-jersey', name: '야구 저지', price: 250, rare: '일반', art: () => paint(
      `<path d="${top(100, 410, 216)}" fill="#FFFFFF" fill-rule="evenodd"/>` + rng(14, (i) => ln(`M${110 + i * 22} -10 L${110 + i * 22} 240`, '#3D5AA8', 2, { op: 0.45 })) +
      fl('M100 -20 L184 -20 Q170 112 150 230 L100 230 Z', '#3D5AA8') + fl('M410 -20 L330 -20 Q348 112 364 230 L410 230 Z', '#3D5AA8') +
      ln(NECK.replace(' Z', ''), '#E5484D', 12) + ln('M300 168 L300 232', '#3D5AA8', 3) + rng(3, (i) => `<circle cx="312" cy="${180 + i * 16}" r="4.5" fill="#3D5AA8"/>`) +
      `<path d="${star(254, 196, 16, 0.45)}" fill="#E5484D"/>` + fl('M96 212 H420 V226 Q300 244 96 226 Z', '#E5484D')) },
    { id: 'w-sailor', name: '세일러 교복', price: 300, rare: '레어', art: () => paint(
      lower(0.22, 0.62, 'M90 196 H426 V240 H90 Z', '#2B3A6B', [0.04, 0.05]) +
      rng(10, (i) => ln(`M${130 + i * 26} 226 L${118 + i * 30} 290`, '#1F2B52', 3, { op: 0.7 })) +
      `<path d="${top(104, 448, 206, 10)}" fill="#FFFFFF" fill-rule="evenodd"/>` +
      fl('M150 40 L204 40 Q214 150 300 176 Q386 150 396 40 L446 40 L436 120 L300 206 L162 120 Z', '#2B3A6B') +
      ln('M168 60 L180 116 L300 188 L418 116 L428 60', '#FFFFFF', 4) + ln('M300 176 L300 206', '#2B3A6B', 2),
      P('M300 178 L270 196 L274 214 L300 198 L326 214 L330 196 Z', '#E5484D', { rim: 0.25 }) + P('M292 196 L284 236 L300 228 L316 236 L308 196 Z', '#E5484D', { rim: 0.25 }) + P(ell(300, 192, 10, 9), '#C93A44', { rim: 0.25 })) },
    { id: 'w-santa', name: '산타 옷', price: 0, rare: '시즌', lock: '12월 출석 7일 보상', art: () => paint(
      pants(0.78, '#D93A44') + `<path d="${top(60, 440, 214)}" fill="#E5484D" fill-rule="evenodd"/>` +
      fl('M96 194 H420 V214 H96 Z', '#2A2533') + fl(rr(282, 190, 36, 28, 5), '#FFCB2E') + fl(rr(290, 197, 20, 14, 3), '#2A2533') +
      ln(NECK.replace(' Z', ''), '#FFFFFF', 20) + ln('M300 168 L300 192', '#FFFFFF', 18) +
      rng(7, (i) => `<circle cx="60" cy="${54 + i * 19}" r="15" fill="#FFFFFF"/><circle cx="440" cy="${54 + i * 19}" r="15" fill="#FFFFFF"/>`) +
      ln(cut('ll', 0.76, 0.03), '#FFFFFF', 18, { cap: 'butt' }) + ln(cut('lr', 0.76, 0.03), '#FFFFFF', 18, { cap: 'butt' })) },
  ];

  // ---------------------------------------------------------------- 장갑 (손에 칠해요)
  const hands = (s0, s1 = 1.3) => (s0 = s0 - 0.08, 0) || `${band('hl', s0, s1, 0.03, 0.03)} ${band('hr', s0, s1, 0.03, 0.03)}`;
  const cuffs = (s, c, w) => ln(cut('hl', s, 0.03), c, w, { cap: 'butt' }) + ln(cut('hr', s, 0.03), c, w, { cap: 'butt' });
  const both = (f) => f('hl') + f('hr');
  const MITTS = [
    { id: 'g-red', name: '빨강 벙어리장갑', price: 0, rare: '기본', art: () => paint(fl(hands(0.6), '#E5484D') + cuffs(0.55, '#FFFFFF', 20) + both((k) => rng(5, (i) => ln(`M${at(k, 0.56, -50 + i * 25)} L${at(k, 0.69, -50 + i * 25)}`, INK, 2, { op: 0.12 })))) },
    { id: 'g-knit', name: '노르딕 니트장갑', price: 150, rare: '일반', art: () => paint(fl(hands(0.6), '#2F4A8C') + both((k) => rng(3, (j) => rng(4, (i) => `<path d="${star(...at(k, 0.78 + j * 0.1, -42 + i * 28), 7, 0.4, 4, -90)}" fill="#FFFFFF"/>`))) + both((k) => ln(cut(k, 0.72, 0.03), '#E5484D', 6, { cap: 'butt' })) + cuffs(0.55, '#E5484D', 18)) },
    { id: 'g-white', name: '하얀 장갑', price: 150, rare: '일반', art: () => paint(fl(hands(0.62), '#FFFFFF') + both((k) => rng(3, (i) => ln(`M${at(k, 0.84, -24 + i * 24)} L${at(k, 1.02, -24 + i * 24)}`, INK, 3, { op: 0.22 }))) + cuffs(0.58, '#F0ECF6', 14)) },
    { id: 'g-oven', name: '체크 오븐장갑', price: 150, rare: '일반', art: () => paint(fl(hands(0.6), '#FFFFFF') + both((k) => rng(6, (i) => ln(`M${at(k, 0.6 + i * 0.1, -110)} L${at(k, 0.6 + i * 0.1, 110)}`, '#E5484D', 9, { op: 0.75, cap: 'butt' })) + rng(9, (i) => ln(`M${at(k, 0.6, -80 + i * 20)} L${at(k, 1.3, -80 + i * 20)}`, '#E5484D', 9, { op: 0.55, cap: 'butt' }))) + cuffs(0.55, '#E5484D', 18)) },
    { id: 'g-garden', name: '꽃무늬 원예장갑', price: 120, rare: '일반', art: () => paint(fl(hands(0.6), '#9BCB3C') + both((k) => [[0.8, -30], [0.92, 20], [1.02, -10], [0.84, 40], [0.96, -48]].map(([s, w]) => { const [x, y] = at(k, s, w); return rng(5, (i) => `<circle cx="${r1(x + Math.cos((i * 72 * Math.PI) / 180) * 6)}" cy="${r1(y + Math.sin((i * 72 * Math.PI) / 180) * 6)}" r="4.5" fill="#FFFFFF"/>`) + `<circle cx="${x}" cy="${y}" r="3.5" fill="#FFE200"/>`; }).join('')) + cuffs(0.55, '#F28CB1', 18)) },
    { id: 'g-stripe', name: '무지개 줄무늬장갑', price: 200, rare: '레어', art: () => paint(both((k) => ['#E5484D', '#FF9F43', '#FFE200', '#5CBF8A', '#7FA7E8', '#8B5CF6', '#E5484D'].map((c, i) => fl(band(k, 0.6 + i * 0.1, 0.7 + i * 0.1 + (i === 6 ? 0.4 : 0.001), 0.03, 0.03), c)).join('')) + cuffs(0.54, '#FFFFFF', 14)) },
    { id: 'g-bear', name: '곰발바닥 장갑', price: 250, rare: '레어', art: () => paint(fl(hands(0.6), '#A0673F') + both((k) => { const [x, y] = at(k, 0.9, 4); const [a, b] = at(k, 1.0, -30), [c, d] = at(k, 1.02, 4), [e, f] = at(k, 1.0, 36); return `<ellipse cx="${x}" cy="${y + 6}" rx="22" ry="18" fill="#F4B8C8"/><circle cx="${a}" cy="${b}" r="8" fill="#F4B8C8"/><circle cx="${c}" cy="${d - 18}" r="8" fill="#F4B8C8"/><circle cx="${e}" cy="${f}" r="8" fill="#F4B8C8"/>`; }) + cuffs(0.55, '#E9D3A8', 20)) },
    { id: 'g-box', name: '복싱 글러브', price: 300, rare: '레어', art: () => paint(fl(hands(0.58), '#E5484D') + both((k) => ln(cut(k, 0.92, 0.06), '#B83238', 3, { op: 0.5 })) + cuffs(0.54, '#FFFFFF', 24) + both((k) => rng(3, (i) => ln(`M${at(k, 0.6, -30 + i * 30)} l6 6`, INK, 2.4, { op: 0.4 }))),
      both((k) => { const [x, y] = at(k, 0.94, -40); return gl(x, y, 12, 6, 0, 0.55); })) },
    { id: 'g-rubber', name: '분홍 고무장갑', price: 100, rare: '일반', art: () => paint(fl(hands(0.4), '#FF8FB3') + cuffs(0.42, '#FF7AA3', 10) + both((k) => ln(`M${at(k, 0.5, -40)} Q${at(k, 0.7, -50)} ${at(k, 1.0, -36)}`, '#fff', 5, { op: 0.55 }))) },
    { id: 'g-gold', name: '황금 장갑', price: 500, rare: '에픽', art: () => paint(fl(hands(0.6), '#FFC83D') + both((k) => ln(`M${at(k, 0.66, -44)} Q${at(k, 0.85, -56)} ${at(k, 1.04, -40)}`, '#FFF6C8', 9, { op: 0.8 })) + cuffs(0.55, '#E0A21A', 16),
      both((k) => { const [x, y] = at(k, 0.9, -60); const [a, b] = at(k, 1.08, 40); return sp(x, y, 12) + sp(a, b, 8); })) },
  ];

  // ---------------------------------------------------------------- 신발 (발끝에 칠해요)
  const feet = (s0, s1 = 1.4) => `${band('ll', s0, s1, 0.03, 0.03)} ${band('lr', s0, s1, 0.03, 0.03)}`;
  const legs = (f) => f('ll') + f('lr');
  const SHOES = [
    { id: 's-purple', name: '보라 운동화', price: 0, rare: '기본', art: () => paint(fl(feet(0.66), '#FFFFFF') + fl(feet(0.76), '#6B4DC4') + legs((k) => fl(band(k, 0.94, 1.4, 0.03, 0), '#FFFFFF') + rng(3, (i) => ln(`M${at(k, 0.8 + i * 0.045, -16)} L${at(k, 0.8 + i * 0.045, 16)}`, '#FFFFFF', 4)) + ln(cut(k, 0.94, 0.03), INK, 2, { op: 0.2 }))) },
    { id: 's-hightop', name: '빨강 하이탑', price: 150, rare: '일반', art: () => paint(fl(feet(0.6), '#E5484D') + legs((k) => fl(band(k, 0.6, 0.66, 0.03, 0.03), '#FFFFFF') + fl(band(k, 0.93, 1.4, 0.03, 0), '#FFFFFF') + ln(cut(k, 0.9, 0.08), '#FFFFFF', 7) + rng(4, (i) => ln(`M${at(k, 0.7 + i * 0.05, -14)} L${at(k, 0.72 + i * 0.05, 14)}`, '#FFFFFF', 3.5)) + (() => { const [x, y] = at(k, 0.76, 34); return `<circle cx="${x}" cy="${y}" r="9" fill="#FFFFFF"/><path d="${star(x, y, 6, 0.45)}" fill="#2F4A8C"/>`; })())) },
    { id: 's-loafer', name: '반짝 로퍼', price: 150, rare: '일반', art: () => paint(fl(feet(0.68), '#FFFFFF') + fl(feet(0.8), '#2A2533') + legs((k) => ln(cut(k, 0.86, 0.04), '#4A4460', 6) + fl(band(k, 0.97, 1.4, 0.03, 0), '#5A3A2A')),
      legs((k) => { const [x, y] = at(k, 0.9, -36); return gl(x, y, 10, 4, 0, 0.7); })) },
    { id: 's-stripe', name: '줄무늬 양말', price: 100, rare: '일반', art: () => paint(legs((k) => rng(8, (i) => fl(band(k, 0.5 + i * 0.07, 0.57 + i * 0.07 + (i === 7 ? 0.4 : 0.001), 0.03, 0.03), i % 2 ? '#FFFFFF' : '#F28CB1'))) + legs((k) => fl(band(k, 0.96, 1.4, 0.03, 0), '#FFE200'))) },
    { id: 's-maryjane', name: '메리제인 구두', price: 200, rare: '레어', art: () => paint(fl(feet(0.62), '#FFFFFF') + legs((k) => rng(5, (i) => { const [x, y] = at(k, 0.66, -48 + i * 24); return `<circle cx="${x}" cy="${y}" r="8" fill="#FFFFFF"/>`; })) + fl(feet(0.82), '#D63A52') + legs((k) => ln(cut(k, 0.76, 0.02), '#D63A52', 9) + (() => { const [x, y] = at(k, 0.76, 26); return `<circle cx="${x}" cy="${y}" r="6" fill="#FFCB2E"/>`; })()),
      legs((k) => { const [x, y] = at(k, 0.92, -30); return gl(x, y, 10, 4, 0, 0.7); })) },
    { id: 's-sandal', name: '여름 샌들', price: 120, rare: '일반', art: () => paint(legs((k) => fl(band(k, 1.0, 1.4, 0.03, 0), '#C68B4E') + ln(cut(k, 0.84, 0.05), '#FF7A59', 13) + ln(cut(k, 0.93, 0.04), '#FF7A59', 13) + (() => { const [x, y] = at(k, 0.88, 0); return `<circle cx="${x}" cy="${y}" r="7" fill="#FFE200"/>`; })())) },
    { id: 's-boot', name: '빨강 장화', price: 250, rare: '레어', art: () => paint(fl(feet(0.5), '#E5484D') + legs((k) => fl(band(k, 0.5, 0.58, 0.03, 0.03), '#C9343E') + fl(band(k, 0.98, 1.4, 0.03, 0), '#8A2A33')),
      legs((k) => { const [x, y] = at(k, 0.7, -34); const [a, b] = at(k, 0.86, -38); return gl(x, y, 6, 16, -10, 0.6) + gl(a, b, 4, 5, 0, 0.6); })) },
    { id: 's-slipper', name: '토끼 털 슬리퍼', price: 200, rare: '레어', art: () => paint(fl(feet(0.72), '#FFD6E2') + legs((k) => rng(6, (i) => { const [x, y] = at(k, 0.74, -60 + i * 24); return `<circle cx="${x}" cy="${y}" r="12" fill="#FFFFFF"/>`; }) + (() => { const [x, y] = at(k, 0.9, 0); return `<circle cx="${x - 8}" cy="${y}" r="3" fill="${INK}"/><circle cx="${x + 8}" cy="${y}" r="3" fill="${INK}"/><ellipse cx="${x}" cy="${y + 8}" rx="4" ry="3" fill="#F28CB1"/>`; })())) },
    { id: 's-snow', name: '털 부츠', price: 0, rare: '시즌', lock: '12월 출석 7일 보상', art: () => paint(fl(feet(0.56), '#B7794A') + legs((k) => rng(7, (i) => { const [x, y] = at(k, 0.58 + (i % 2) * 0.03, -66 + i * 22); return `<circle cx="${x}" cy="${y}" r="15" fill="#FFF8EC"/>`; }) + fl(band(k, 0.98, 1.4, 0.03, 0), '#6E4528'))) },
    { id: 's-roller', name: '롤러스케이트', price: 450, rare: '에픽', art: () => paint(fl(feet(0.58), '#FFFFFF') + legs((k) => fl(band(k, 0.58, 0.64, 0.03, 0.03), '#2DD4BF') + rng(4, (i) => ln(`M${at(k, 0.7 + i * 0.05, -14)} L${at(k, 0.72 + i * 0.05, 14)}`, '#2DD4BF', 4)) + fl(band(k, 0.95, 1.4, 0.03, 0), '#8B5CF6')),
      legs((k) => { const [a, b] = at(k, 1.0, -30), [c, d] = at(k, 1.0, 28); return ln(`M${a} ${b + 2} L${c} ${d + 2}`, '#8A8FA3', 9) +
        [[a, b], [c, d]].map(([x, y]) => P(ell(x, y + 12, 15, 15), '#2E2B3A', { rim: 0.5, hi: 0.6 }) + P(ell(x, y + 12, 8, 8), '#2DD4BF', { rim: 0.3, hi: 0.5 }) + `<circle cx="${x}" cy="${y + 12}" r="2.6" fill="#FFFFFF"/>`).join(''); })) },
  ];

  // ---------------------------------------------------------------- 손 (오른손 끝에 쥐어요 · 몸 뒤에 그려서 손이 손잡이를 감싸요)
  const HANDS = [
    { id: 'd-flag', name: 'PALLO 깃발', price: 0, rare: '기본', art: () =>
      P(rr(464, -150, 10, 290, 5), 'url(#avSilver)', { rim: 0.3 }) + P(ell(469, -156, 11, 11), 'url(#avGold)') +
      P('M474 -142 C512 -154 546 -128 600 -140 L600 -66 C548 -54 514 -80 474 -68 Z', '#FFE200', { rim: 0.3 }) +
      `<text x="536" y="-96" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="24" fill="${INK}" transform="rotate(-3 536 -96)">PALLO</text>` },
    { id: 'd-book', name: '원서 책', price: 0, rare: '기본', art: () => `<g transform="rotate(10 480 20)">` +
      P(rr(424, -66, 112, 150, 10), '#FFFFFF', { rim: 0.3 }) + P(rr(420, -70, 112, 150, 10), '#493087') + P(rr(420, -70, 18, 150, 8), '#3A2570', { hi: 0.4 }) +
      fl(rr(450, -40, 66, 12, 4), '#FFCB2E') + fl(rr(456, -20, 54, 6, 3), '#FFCB2E', 0.7) + `<path d="${star(483, 30, 18, 0.45)}" fill="#FFE200"/></g>` },
    { id: 'd-coffee', name: '테이크아웃 커피', price: 120, rare: '일반', art: () =>
      ln('M448 -74 q-8 -12 0 -24 q8 -12 0 -24', '#B9B2C4', 5, { op: 0.6 }) + ln('M476 -80 q-8 -12 0 -24 q8 -12 0 -24', '#B9B2C4', 5, { op: 0.6 }) +
      P('M428 -30 L516 -30 L504 110 L440 110 Z', '#FFFFFF') + P('M432 6 L512 6 L506 64 L438 64 Z', '#C68B4E') + `<circle cx="472" cy="35" r="12" fill="#FFE200"/>` +
      P(rr(420, -50, 104, 24, 10), '#F3F0F7') + P('M440 -50 Q472 -72 504 -50 Z', '#F3F0F7') },
    { id: 'd-boba', name: '버블티', price: 150, rare: '일반', art: () =>
      P(rr(478, -150, 16, 120, 7), '#FF7A9C', { t: 'rotate(10 486 -90)' }) +
      `<path d="M424 -60 L520 -60 L506 90 L438 90 Z" fill="#E8C9A6"/>` + rng(9, (i) => P(ell(446 + (i % 5) * 14 + (i > 4 ? 7 : 0), 66 - (i > 4 ? 14 : 0), 7, 7), '#3A2A2A', { rim: 0 })) +
      `<path d="M424 -60 L520 -60 L506 90 L438 90 Z" fill="url(#avGlass)"/>` + ln('M424 -60 L520 -60 L506 90 L438 90 Z', INK, 2.4, { op: 0.25 }) + P(ell(472, -62, 52, 12), '#FFFFFF', { rim: 0.3 }) + ln('M438 -40 L446 70', '#fff', 6, { op: 0.6 }) },
    { id: 'd-mic', name: '반짝 마이크', price: 150, rare: '일반', art: () =>
      P('M462 140 L482 140 L488 0 L456 0 Z', '#2A2533') + P(rr(452, -14, 40, 22, 8), '#E5484D') +
      P(ell(472, -48, 38, 38), 'url(#avSilver)', { rim: 0.35 }) + `<clipPath id="mic${U}"><path d="${ell(472, -48, 38, 38)}"/></clipPath><g clip-path="url(#mic${U})">${rng(8, (i) => ln(`M${430 + i * 12} -90 L${430 + i * 12} 0`, INK, 1.4, { op: 0.25 }) + ln(`M430 ${-86 + i * 12} L520 ${-86 + i * 12}`, INK, 1.4, { op: 0.25 }))}</g>` + gl(458, -66, 12, 7, -40, 0.85) },
    { id: 'd-balloon', name: '하트 풍선', price: 180, rare: '일반', art: () =>
      ln('M470 110 Q486 50 472 0 Q460 -40 502 -62', INK, 3, { op: 0.6 }) +
      P(heart(508, -112, 108), '#FF5C8A', { rim: 0.3 }) + gl(482, -136, 15, 8, -40, 0.85) + gl(528, -146, 6, 4, -30, 0.7) + P('M494 -64 l8 -8 l8 8 Z', '#E0406E') },
    { id: 'd-icecream', name: '3단 아이스크림', price: 150, rare: '일반', art: () =>
      P('M438 -12 L506 -12 L472 110 Z', '#E8A65A') + rng(4, (i) => ln(`M${446 + i * 14} -10 L${480 + i * 6} 80`, '#B97A34', 2.4, { op: 0.5 }) + ln(`M${498 - i * 14} -10 L${464 - i * 6} 80`, '#B97A34', 2.4, { op: 0.5 })) +
      P(ell(472, -24, 40, 28), '#FFF4D6') + P(ell(472, -66, 38, 28), '#8EE0B4') + P(ell(472, -106, 34, 26), '#FF9BB8') +
      rng(8, (i) => `<rect x="${448 + (i * 13) % 48}" y="${-120 + ((i * 29) % 24)}" width="8" height="3" rx="1.5" fill="${['#FFE200', '#7FA7E8', '#fff', '#8B5CF6'][i % 4]}" transform="rotate(${i * 40} ${452 + (i * 13) % 48} ${-118 + ((i * 29) % 24)})"/>`) +
      P(ell(474, -140, 11, 11), '#E5484D') + ln('M476 -150 Q482 -166 494 -170', '#5CBF8A', 3) },
    { id: 'd-flower', name: '꽃다발', price: 250, rare: '레어', art: () =>
      [[440, -60, -30], [500, -64, 30], [470, -80, 0]].map(([x, y, r]) => P(ell(x, y + 30, 10, 30), '#5CBF8A', { t: `rotate(${r} ${x} ${y + 30})`, rim: 0.15 })).join('') +
      [[446, -70, '#F28CB1'], [498, -72, '#FFE200'], [472, -94, '#FF7A59'], [470, -56, '#B07CE0']].map(([x, y, c]) => P(ell(x, y, 22, 20), c) + ln(`M${x - 8} ${y} q8 -10 16 0 q-8 8 -12 -2`, INK, 2, { op: 0.25 })).join('') +
      P('M424 -46 L520 -46 L486 110 L458 110 Z', '#F5E6C8') + ln('M440 -40 L466 100', '#D9C39C', 3) + P('M450 10 Q472 -2 494 10 L490 28 Q472 18 454 28 Z', '#E5484D') },
    { id: 'd-passport', name: '여권 · 비행기표', price: 200, rare: '일반', art: () => `<g transform="rotate(8 476 10)">` +
      P(rr(480, -96, 70, 120, 8), '#F3F0F7', { t: 'rotate(14 515 -36)' }) + `<g transform="rotate(14 515 -36)">${fl(rr(480, -96, 70, 20, 6), '#2F6FD0')}${ln('M492 -50 H536 M492 -36 H528', INK, 3, { op: 0.3 })}</g>` +
      P(rr(424, -50, 96, 132, 10), '#2B3A6B') + `<circle cx="472" cy="4" r="20" fill="none" stroke="#FFCB2E" stroke-width="4"/>` + ln('M452 4 H492 M472 -16 Q460 4 472 24 Q484 4 472 -16', '#FFCB2E', 2.4) + fl(rr(446, 46, 52, 7, 3), '#FFCB2E') + `</g>` },
    { id: 'd-umbrella', name: '물방울 우산', price: 300, rare: '레어', art: () => '<g transform="translate(0 44)">' +
      ln('M470 140 L470 -150', '#5A3A2A', 8) + ln('M470 140 Q470 160 452 156', '#5A3A2A', 8) +
      P('M300 -120 Q300 -232 470 -236 Q640 -232 640 -120 Q612 -138 584 -120 Q556 -138 528 -120 Q500 -138 470 -120 Q440 -138 412 -120 Q384 -138 356 -120 Q328 -138 300 -120 Z', '#7FA7E8', { rim: 0.3 }) +
      [[360, -170, 10], [420, -206, 12], [500, -200, 11], [566, -168, 10], [440, -150, 8], [530, -146, 8]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#FFFFFF" opacity=".9"/>`).join('') +
      ln('M470 -236 L470 -252', '#5A3A2A', 6) + gl(380, -196, 30, 8, -30, 0.4) + '</g>' },
  ];

  // ---------------------------------------------------------------- 액세서리 (목 · 등 · 효과)
  const FX = (body) => body;   // 무대 좌표 300 × 220
  const glossHeart = (x, y, s, c) => P(heart(x, y, s), c, { rim: 0.3 }) + gl(x - s * 0.18, y - s * 0.22, s * 0.11, s * 0.06, -40, 0.85);
  const ACCS = [
    { id: 'a-bow', name: '물방울 나비넥타이', price: 0, rare: '기본', layer: 'front', art: () =>
      P('M300 168 C286 152 256 146 254 158 C252 170 254 184 256 190 C262 198 286 186 300 174 Z', '#E5484D') + P('M300 168 C314 152 344 146 346 158 C348 170 346 184 344 190 C338 198 314 186 300 174 Z', '#E5484D') +
      [[268, 162], [276, 180], [332, 162], [324, 180], [262, 176], [338, 176]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.5" fill="#fff" opacity=".9"/>`).join('') + P(rr(290, 160, 20, 22, 7), '#C93A44') },
    { id: 'a-scarf', name: '줄무늬 목도리', price: 180, rare: '일반', layer: 'front', art: () =>
      `<clipPath id="sc${U}"><path d="M206 132 C226 176 270 190 300 190 C330 190 374 176 394 132 L398 160 C378 206 330 218 300 218 C270 218 222 206 202 160 Z M334 190 L372 188 L380 262 L346 268 Z"/></clipPath>` +
      P('M206 132 C226 176 270 190 300 190 C330 190 374 176 394 132 L398 160 C378 206 330 218 300 218 C270 218 222 206 202 160 Z', '#FF7A59') + P('M334 190 L372 188 L380 262 L346 268 Z', '#FF7A59') +
      `<g clip-path="url(#sc${U})">${rng(9, (i) => ln(`M${214 + i * 22} 120 L${206 + i * 22} 230`, '#FFFFFF', 7, { op: 0.85 }))}${ln('M330 216 L384 212 M334 238 L386 234', '#FFFFFF', 7, { op: 0.85 })}</g>` +
      rng(6, (i) => ln(`M${348 + i * 6} 266 l-1 14`, '#FF7A59', 4)) },
    { id: 'a-lei', name: '꽃목걸이', price: 200, rare: '레어', layer: 'front', art: () =>
      [[212, 128, '#F28CB1'], [228, 152, '#FFE200'], [250, 172, '#FF7A59'], [276, 184, '#B07CE0'], [302, 188, '#F28CB1'], [328, 184, '#FFE200'], [352, 172, '#FF7A59'], [374, 152, '#B07CE0'], [390, 128, '#F28CB1']].map(([x, y, c]) =>
        rng(5, (i) => { const a = (i * 72 * Math.PI) / 180; return P(ell(r1(x + Math.cos(a) * 9), r1(y + Math.sin(a) * 9), 8, 8), c, { rim: 0.15, hi: 0.6 }); }) + `<circle cx="${x}" cy="${y}" r="5" fill="#FFF4D6"/>`).join('') },
    { id: 'a-medal', name: '금메달', price: 0, rare: '시즌', lock: '지점 대항전 우승 보상', layer: 'front', art: () =>
      P('M236 130 L284 200 L304 196 L262 128 Z', '#2F6FD0') + P('M364 130 L316 200 L296 196 L338 128 Z', '#E5484D') +
      P(ell(300, 220, 30, 30), 'url(#avGold)', { rim: 0.35 }) + P(ell(300, 220, 20, 20), '#FFCB2E', { rim: 0.2, hi: 0.5 }) + `<path d="${star(300, 220, 12, 0.45)}" fill="#E0A21A"/>` + gl(288, 206, 7, 4, -40, 0.8) },
    { id: 'a-wings', name: '천사 날개', price: 700, rare: '에픽', layer: 'back', art: () => {
      const w = P('M220 70 C170 -40 70 -90 -30 -60 C10 -40 20 -20 0 0 C40 -6 54 8 30 30 C70 26 82 40 64 60 C110 56 150 62 220 70 Z', '#FFFFFF', { rim: 0.25 }) + ln('M10 -2 Q80 0 150 40 M34 30 Q100 32 170 56', '#C9C2E8', 4, { op: 0.8 }) + ln('M-20 -56 Q90 -60 200 50', '#E5E0F5', 6, { op: 0.8 });
      return w + mir(w); } },
    { id: 'a-cape', name: '히어로 망토', price: 350, rare: '레어', layer: 'back', art: () =>
      P('M210 60 C150 120 100 220 70 320 Q170 300 260 316 Q300 250 300 120 Q300 250 340 316 Q430 300 530 320 C500 220 450 120 390 60 Z', '#E5484D', { rim: 0.25 }) +
      P('M196 64 Q190 20 214 0 L232 40 Z', '#C93A44') + P('M404 64 Q410 20 386 0 L368 40 Z', '#C93A44') },
    { id: 'a-bag', name: '미니 크로스백', price: 200, rare: '일반', layer: 'front', art: () =>
      ln('M402 50 C392 140 320 176 196 196', '#8A5A3B', 10) + ln('M402 50 C392 140 320 176 196 196', '#FFFFFF', 2, { op: 0.4, da: '4 6' }) +
      P(rr(132, 176, 92, 70, 18), '#C68B4E') + P('M132 196 Q132 176 152 176 L204 176 Q224 176 224 196 L224 214 Q178 234 132 214 Z', '#A86E38') + P(rr(170, 208, 16, 14, 4), 'url(#avGold)') },
    { id: 'a-tie', name: '줄무늬 넥타이', price: 120, rare: '일반', layer: 'front', art: () => { const u = 'ti' + U++; return (
      `<clipPath id="${u}"><path d="M288 176 L312 176 L320 232 L300 252 L280 232 Z"/></clipPath>` + P('M288 176 L312 176 L320 232 L300 252 L280 232 Z', '#2F4A8C') + `<g clip-path="url(#${u})">${rng(5, (i) => ln(`M270 ${186 + i * 16} L330 ${170 + i * 16}`, '#FFE200', 5, { op: 0.9 }))}</g>` + P('M286 160 L314 160 L310 178 L290 178 Z', '#24396E')); } },
    { id: 'a-pearl', name: '진주 목걸이', price: 250, rare: '레어', layer: 'front', art: () =>
      rng(17, (i) => { const t = i / 16, x = 212 + t * 176, y = 122 + Math.sin(t * Math.PI) * 52; return P(ell(r1(x), r1(y), 7, 7), '#FBF7F2', { rim: 0.2, hi: 0.9 }) + gl(r1(x - 2), r1(y - 2.5), 2, 1.4, 0, 0.95); }) + P(drop(300, 192, 14), '#F7B6CC', { rim: 0.25 }) + gl(296, 186, 3, 5, 0, 0.9) },
    { id: 'a-watch', name: '손목시계', price: 150, rare: '일반', layer: 'front', art: () =>
      P(rr(105, 40, 24, 144, 12), '#493087') + rng(3, (i) => `<circle cx="117" cy="${152 + i * 9}" r="2.2" fill="${INK}" opacity=".35"/>`) + P(ell(117, 112, 24, 24), 'url(#avSilver)', { rim: 0.35 }) + P(ell(117, 112, 18, 18), '#FFFFFF', { rim: 0.2, hi: 0.4 }) + ln('M117 112 L117 100 M117 112 L126 117', INK, 3) + `<circle cx="117" cy="112" r="2.2" fill="#E5484D"/>` + gl(110, 104, 5, 3, -30, 0.8) },
  ];

  // ---------------------------------------------------------------- 배경 효과 (무대 위에 · 배경과 같이 써요)
  const FXS = [
    { id: 'fx-spark', name: '반짝반짝', price: 400, rare: '에픽', art: () => FX([[38, 40, 13, '#FFE200'], [262, 54, 11, '#FFE200'], [30, 160, 9, '#FFFFFF'], [272, 166, 12, '#FFE200'], [150, 22, 8, '#FFFFFF'], [228, 22, 6, '#FFFFFF'], [70, 96, 6, '#FFE200']].map(([x, y, r, c]) => P(star(x, y, r * 2, 0.26, 4, -90), c, { rim: 0.35, sw: 1.6 })).join('')) },
    { id: 'fx-hearts', name: '하트 뿅뿅', price: 400, rare: '에픽', art: () => FX([[44, 60, 34], [256, 44, 28], [266, 160, 38], [34, 168, 24], [210, 22, 18], [96, 26, 16]].map(([x, y, s], i) => glossHeart(x, y, s, i % 2 ? '#FF7AA3' : '#FF5C8A')).join('')) },
    { id: 'fx-notes', name: '음표 둥둥', price: 300, rare: '레어', art: () => FX([[48, 46, '#8B5CF6'], [250, 36, '#2F6FD0'], [262, 146, '#E5484D'], [36, 150, '#2DD4BF']].map(([x, y, c], i) => (i % 2 ? `<path d="M${x} ${y} L${x} ${y + 34} M${x + 26} ${y - 6} L${x + 26} ${y + 28}" stroke="${c}" stroke-width="5"/><path d="M${x - 2} ${y - 2} L${x + 28} ${y - 8} L${x + 28} ${y + 2} L${x - 2} ${y + 8}Z" fill="${c}"/>${P(ell(x - 7, y + 36, 10, 8), c, { t: `rotate(-20 ${x - 7} ${y + 36})` })}${P(ell(x + 19, y + 30, 10, 8), c, { t: `rotate(-20 ${x + 19} ${y + 30})` })}` : `<path d="M${x} ${y} L${x} ${y + 34}" stroke="${c}" stroke-width="5"/><path d="M${x} ${y} q16 4 18 22 q-6 -10 -18 -12z" fill="${c}"/>${P(ell(x - 7, y + 36, 10, 8), c, { t: `rotate(-20 ${x - 7} ${y + 36})` })}`)).join('')) },
    { id: 'fx-bubble', name: '비눗방울', price: 250, rare: '레어', art: () => FX([[40, 58, 20], [262, 48, 16], [28, 150, 12], [270, 150, 22], [222, 20, 10], [86, 24, 8], [250, 104, 8], [52, 108, 7]].map(([x, y, r]) =>
      `<circle cx="${x}" cy="${y}" r="${r}" fill="#DFF3FF" fill-opacity=".28" stroke="#9FD4F5" stroke-width="2"/>` +
      `<path d="M${x - r * 0.72} ${y + r * 0.5} A${r * 0.88} ${r * 0.88} 0 0 0 ${x + r * 0.5} ${y + r * 0.72}" fill="none" stroke="#F7A8C4" stroke-width="${r > 10 ? 3 : 2}" opacity=".8"/>` +
      `<path d="M${x + r * 0.62} ${y + r * 0.44} A${r * 0.78} ${r * 0.78} 0 0 0 ${x + r * 0.72} ${y - r * 0.2}" fill="none" stroke="#8FE3D0" stroke-width="${r > 10 ? 3 : 2}" opacity=".8"/>` +
      gl(x - r * 0.38, y - r * 0.4, r * 0.28, r * 0.15, -40, 0.95) + `<circle cx="${x + r * 0.42}" cy="${y - r * 0.5}" r="${r * 0.08 + 0.6}" fill="#fff"/>`).join('')) },
    { id: 'fx-petal', name: '벚꽃 흩날림', price: 300, rare: '레어', art: () => FX(
      [[34, 40, 20], [268, 30, -30], [20, 116, 60], [282, 96, 10], [62, 168, -40], [252, 176, 70], [120, 18, 30], [196, 34, -60], [96, 62, 80], [232, 132, -10], [14, 196, 40], [292, 196, -50]].map(([x, y, r], i) => {
        const c = i % 3 ? '#F7A8C4' : '#FFC7D9';
        return `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M0 -11 C9 -8 9 6 0 11 C-9 6 -9 -8 0 -11 Z" fill="${c}"/><path d="M0 -11 L-2 -6 L0 -8 L2 -6 Z" fill="#FFFFFF" opacity=".9"/><path d="M0 -5 L0 6" stroke="#E07AA0" stroke-width="1.2" opacity=".6"/></g>`;
      }).join('') + blossom(46, 78, 9) + blossom(258, 66, 8, '#FFC7D9')) },
    { id: 'fx-snow', name: '눈송이', price: 250, rare: '레어', art: () => FX([[38, 44, 14], [264, 38, 12], [24, 140, 10], [276, 130, 15], [150, 14, 8], [220, 18, 7], [88, 20, 7], [50, 196, 8], [252, 192, 9]].map(([x, y, r]) =>
      `<g transform="translate(${x} ${y})" stroke="#FFFFFF" stroke-linecap="round">${rng(6, (i) => `<g transform="rotate(${i * 60})"><path d="M0 0 V${-r}" stroke-width="${r > 9 ? 3 : 2.2}"/><path d="M0 ${-r * 0.58} l${r * 0.3} ${-r * 0.26} M0 ${-r * 0.58} l${-r * 0.3} ${-r * 0.26}" stroke-width="${r > 9 ? 2.2 : 1.6}"/></g>`)}</g>` +
      `<g transform="translate(${x} ${y})" stroke="#7FA7E8" stroke-opacity=".55" stroke-width="1" fill="none">${rng(6, (i) => `<path transform="rotate(${i * 60})" d="M0 0 V${-r}"/>`)}</g><circle cx="${x}" cy="${y}" r="${r * 0.16 + 1}" fill="#FFFFFF"/>`).join('') +
      rng(16, (i) => `<circle cx="${(i * 67 + 13) % 300}" cy="${(i * 41 + 7) % 210}" r="${1.6 + (i % 3) * 0.7}" fill="#FFFFFF" stroke="#9FC0EE" stroke-width=".8"/>`)) },
    { id: 'fx-confetti', name: '축하 꽃가루', price: 400, rare: '에픽', art: () => FX(
      [[30, 30, 20], [64, 16, -30], [104, 34, 50], [150, 12, 10], [196, 30, -60], [238, 14, 35], [276, 34, -15], [18, 86, 70], [282, 80, -40], [36, 132, 15], [268, 124, 60], [16, 182, -25], [286, 176, 45], [120, 58, -70], [182, 56, 25]].map(([x, y, r], i) =>
        `<rect x="${x - 6}" y="${y - 3}" width="12" height="6" rx="1.5" transform="rotate(${r} ${x} ${y})" fill="${['#FFE200', '#FF5C8A', '#2DD4BF', '#8B5CF6', '#FF9F43', '#5B8DEF'][i % 6]}" stroke="${INK}" stroke-opacity=".2" stroke-width="1"/>`).join('') +
      [[48, 60, '#FF5C8A'], [246, 56, '#2DD4BF'], [26, 106, '#8B5CF6'], [270, 104, '#FFE200']].map(([x, y, c]) => ln(`M${x} ${y} q8 -10 14 0 t14 0 t14 0`, c, 4, { op: 0.95 }) + ln(`M${x} ${y} q8 -10 14 0 t14 0 t14 0`, INK, 1, { op: 0.15 })).join('') +
      [[86, 96, '#FFE200'], [214, 92, '#FF9F43'], [140, 40, '#FF5C8A']].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="4" fill="${c}"/>`).join('')) },
    { id: 'fx-rainbow', name: '무지개 구름', price: 450, rare: '에픽', art: () => FX(
      ['#FF6B6B', '#FF9F43', '#FFE200', '#5CBF8A', '#5B8DEF', '#8B5CF6'].map((c, i) => { const r = 58 - i * 6.5; return `<path d="M${74 - r} 84 A${r} ${r} 0 0 1 ${74 + r} 84" fill="none" stroke="${c}" stroke-width="6.8" opacity=".92"/>`; }).join('') +
      cloud(26, 86, 0.9) + cloud(124, 86, 0.9) +
      `<g opacity=".95">${cloud(244, 46, 0.75)}</g>` + sp(240, 98, 7, '#FFE200') + sp(178, 22, 6, '#FFFFFF')) },
    { id: 'fx-hello', name: '인사 말풍선', price: 350, rare: '레어', art: () => FX(
      [[206, 18, 64, 'Hi!', '#FFFFFF', 'latin'], [232, 92, 62, '안녕!', '#FFE200', 'ko'], [20, 154, 70, 'Hola!', '#FFC7D9', 'latin'], [222, 156, 58, '你好', '#D8CCFF', 'ko']].map(([x, y, w, t, c, f], i) =>
        `<path d="M${i % 2 ? x + 14 : x + w - 22} ${y + 22} L${i % 2 ? x + 8 : x + w - 12} ${y + 40} L${i % 2 ? x + 28 : x + w - 34} ${y + 22} Z" fill="${c}" stroke="${INK}" stroke-opacity=".55" stroke-width="2.2" stroke-linejoin="round"/>` +
        P(rr(x, y, w, 30, 13), c, { rim: 0.55, sw: 2.2, hi: 0.5 }) +
        `<text x="${x + w / 2}" y="${y + 21}" text-anchor="middle" font-family="${f === 'latin' ? 'Arial Black, Arial, sans-serif' : 'Apple SD Gothic Neo, Noto Sans KR, sans-serif'}" font-weight="900" font-size="15" fill="${INK}">${t}</text>`).join('')) },
    { id: 'fx-meteor', name: '별똥별', price: 450, rare: '에픽', art: () => FX(
      `<defs><linearGradient id="avTrail" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFB627" stop-opacity="0"/><stop offset=".7" stop-color="#FFC83D" stop-opacity=".6"/><stop offset="1" stop-color="#FFE27A" stop-opacity="1"/></linearGradient></defs>` +
      [[96, 34, 13, 70], [248, 70, 11, 58], [40, 120, 9, 46]].map(([x, y, r, L]) =>
        `<g transform="rotate(-28 ${x} ${y})"><path d="M${x - L} ${y - 1.5} L${x} ${y - r * 0.8} L${x} ${y + r * 0.8} L${x - L} ${y + 1.5} Z" fill="url(#avTrail)"/></g>` +
        P(star(x, y, r * 1.5, 0.45, 5, -90), '#FFE200', { rim: 0.4, sw: 1.8 }) + gl(x - r * 0.3, y - r * 0.4, r * 0.22, r * 0.12, -30, 0.9)).join('') +
      [[176, 20], [280, 22], [20, 60], [284, 150], [150, 56]].map(([x, y], i) => sp(x, y, 4 + (i % 2) * 3, i % 2 ? '#FFFFFF' : '#FFE27A')).join('')) },
  ];

  // ---------------------------------------------------------------- 배경 (무대 300 × 220 · 캐릭터 발밑 그림자 포함)
  const floorShadow = '<ellipse cx="150" cy="196" rx="68" ry="7" fill="#1E1A2B" opacity=".14"/>';
  const lg = (id, a, b, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
  const cloud = (x, y, s, c = '#fff', op = 1) => `<g opacity="${op}" fill="${c}"><ellipse cx="${x}" cy="${y}" rx="${26 * s}" ry="${11 * s}"/><circle cx="${x - 9 * s}" cy="${y - 7 * s}" r="${11 * s}"/><circle cx="${x + 7 * s}" cy="${y - 10 * s}" r="${14 * s}"/></g>`;
  const blossom = (x, y, r, c = '#F7A8C4') => rng(5, (i) => `<ellipse rx="${r * 0.55}" ry="${r}" transform="translate(${x} ${y}) rotate(${i * 72}) translate(0 ${-r * 0.8})" fill="${c}"/>`) + `<circle cx="${x}" cy="${y}" r="${r * 0.4}" fill="#FFE27A"/>`;
  const BGS = [
    { id: 'cream', name: '크림 룸', price: 0, rare: '기본', face: '#FBF6EA', art: () => `<defs>${lg('bgC1', '#FFF9EC', '#F6EBD3')}</defs><rect width="300" height="220" fill="url(#bgC1)"/>` +
      `<rect x="0" y="170" width="300" height="50" fill="#EADBBE"/><rect x="0" y="168" width="300" height="5" fill="#DCC9A6"/>` +
      `<rect x="200" y="30" width="70" height="62" rx="8" fill="#CFE8F6" stroke="#E6D3B0" stroke-width="5"/><path d="M235 30 V92 M200 61 H270" stroke="#E6D3B0" stroke-width="4"/>${cloud(222, 54, 0.6)}` +
      `<path d="M28 168 L36 132 H62 L70 168Z" fill="#E28F6A"/>${[[40, 120, -30], [52, 112, 0], [62, 122, 30], [48, 128, -60]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="7" ry="16" transform="rotate(${r} ${x} ${y})" fill="#6BBF8A"/>`).join('')}` +
      `<rect x="30" y="40" width="40" height="30" rx="4" fill="#FFE200" opacity=".8"/><rect x="80" y="54" width="28" height="22" rx="4" fill="#F28CB1" opacity=".7"/>` + floorShadow },
    { id: 'yellow', name: '팔로 옐로', price: 0, rare: '기본', face: '#FFE200', art: () => `<defs><radialGradient id="bgY1" cx=".5" cy=".75" r=".8"><stop offset="0" stop-color="#FFF27A"/><stop offset="1" stop-color="#FFD400"/></radialGradient></defs><rect width="300" height="220" fill="url(#bgY1)"/>` +
      rng(12, (i) => { const a = (i * 30 * Math.PI) / 180, b = ((i * 30 + 12) * Math.PI) / 180; return `<path d="M150 160 L${r1(150 + Math.cos(a) * 320)} ${r1(160 + Math.sin(a) * 320)} L${r1(150 + Math.cos(b) * 320)} ${r1(160 + Math.sin(b) * 320)}Z" fill="#FFFFFF" opacity=".16"/>`; }) +
      [[40, 40, 10], [258, 48, 13], [30, 150, 7], [270, 150, 9], [210, 20, 6]].map(([x, y, r]) => P(star(x, y, r * 2, 0.26, 4), '#FFFFFF', { rim: 0.4, sw: 1.6 })).join('') + floorShadow },
    { id: 'sky', name: '맑은 하늘', price: 100, rare: '일반', face: '#BFE0F2', art: () => `<defs>${lg('bgS1', '#8CCBF0', '#E6F5FC')}${lg('bgS2', '#9FD88E', '#6FBF6A')}</defs><rect width="300" height="220" fill="url(#bgS1)"/>` +
      `<circle cx="252" cy="40" r="20" fill="#FFF3A0"/><circle cx="252" cy="40" r="30" fill="#FFF3A0" opacity=".35"/>` + cloud(60, 48, 1.3) + cloud(190, 76, 0.9, '#fff', 0.9) + cloud(120, 30, 0.7, '#fff', 0.8) +
      `<path d="M0 176 Q60 150 130 170 Q200 150 300 168 V220 H0Z" fill="#B7E2A6"/><path d="M0 186 Q90 172 170 184 Q240 176 300 182 V220 H0Z" fill="url(#bgS2)"/>` +
      rng(10, (i) => `<circle cx="${20 + i * 29}" cy="${200 + (i % 3) * 6}" r="3" fill="${i % 2 ? '#FFFFFF' : '#FFE27A'}"/>`) + floorShadow },
    { id: 'sea', name: '여름 바다', price: 150, rare: '일반', face: '#BFE0F2', art: () => `<defs>${lg('bgSe1', '#7FC8F0', '#D8F0FB')}${lg('bgSe2', '#3FA4E0', '#1F7FC4')}${lg('bgSe3', '#FBE3B0', '#F2CC86')}</defs><rect width="300" height="220" fill="url(#bgSe1)"/>` +
      `<circle cx="70" cy="44" r="22" fill="#FFE27A"/>` + cloud(220, 40, 0.8) + `<rect x="0" y="112" width="300" height="70" fill="url(#bgSe2)"/>` +
      rng(5, (i) => `<path d="M${i * 66 - 10} ${126 + (i % 2) * 18} q12 -6 24 0 q12 6 24 0" fill="none" stroke="#fff" stroke-width="2.5" opacity=".7"/>`) +
      `<path d="M0 170 Q150 156 300 172 V220 H0Z" fill="url(#bgSe3)"/><path d="M0 170 Q150 156 300 172" fill="none" stroke="#fff" stroke-width="4" opacity=".8"/>` +
      `<path d="M262 190 Q256 140 248 100" stroke="#A0673F" stroke-width="7" fill="none" stroke-linecap="round"/>${[[-40, '#3FAE6A'], [-10, '#4CC27A'], [20, '#3FAE6A'], [50, '#2E9A5A'], [170, '#4CC27A']].map(([r, c]) => `<ellipse cx="248" cy="100" rx="30" ry="8" transform="rotate(${r} 248 100) translate(24 0)" fill="${c}"/>`).join('')}` +
      `<g transform="translate(32 186)"><path d="M0 0 a14 14 0 0 1 28 0Z" fill="#FF7A59"/><path d="M14 -14 V0" stroke="#fff" stroke-width="2"/></g>` + floorShadow },
    { id: 'cherry', name: '벚꽃길', price: 200, rare: '레어', face: '#FCE4EC', art: () => `<defs>${lg('bgCh1', '#FFE6EF', '#FFF6F9')}</defs><rect width="300" height="220" fill="url(#bgCh1)"/>` +
      `<path d="M30 180 Q36 120 26 70" stroke="#8A5A4A" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M274 180 Q266 110 280 60" stroke="#8A5A4A" stroke-width="9" fill="none" stroke-linecap="round"/>` +
      [[20, 56, 40], [56, 40, 30], [0, 92, 30], [280, 46, 40], [246, 34, 28], [300, 86, 30]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#F7B6CC"/><circle cx="${x - r * 0.3}" cy="${y - r * 0.3}" r="${r * 0.6}" fill="#FCD0DE"/>`).join('') +
      `<path d="M0 174 Q150 160 300 174 V220 H0Z" fill="#E9C7A8"/><path d="M110 220 L136 172 H164 L190 220Z" fill="#F2DCC2"/>` +
      [[100, 30, 6], [170, 50, 7], [140, 100, 5], [210, 120, 6], [90, 130, 5], [190, 22, 5], [230, 160, 6], [60, 150, 5]].map(([x, y, r]) => blossom(x, y, r)).join('') + floorShadow },
    { id: 'cafe', name: '단골 카페', price: 200, rare: '레어', face: '#D9B48F', art: () => `<defs>${lg('bgCf1', '#E9CDA8', '#D9B48F')}</defs><rect width="300" height="220" fill="url(#bgCf1)"/>` +
      `<rect x="18" y="26" width="124" height="96" rx="10" fill="#BFE3F2" stroke="#8E5B3A" stroke-width="6"/><path d="M80 26 V122" stroke="#8E5B3A" stroke-width="5"/>${cloud(50, 60, 0.6)}` +
      `<path d="M10 22 H150 L140 40 H20Z" fill="#E5484D"/>${rng(7, (i) => `<path d="M${20 + i * 20} 22 h10 l-2 18 h-8z" fill="#fff" opacity=".9"/>`)}` +
      `<rect x="186" y="26" width="90" height="70" rx="6" fill="#2F3B33" stroke="#A0673F" stroke-width="5"/><text x="231" y="50" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="13" fill="#FFF4D6">MENU</text><path d="M198 62 h50 M198 74 h40 M198 86 h46" stroke="#FFF4D6" stroke-width="2.5" opacity=".7"/>` +
      `<rect x="0" y="168" width="300" height="52" fill="#8E5B3A"/><rect x="0" y="164" width="300" height="8" fill="#A87252"/>` +
      `<g transform="translate(236 140)"><path d="M0 0 H22 L20 24 H2Z" fill="#fff"/><path d="M22 6 q10 0 8 10 q-2 6 -9 5" fill="none" stroke="#fff" stroke-width="3"/><path d="M6 -6 q-4 -6 0 -12 M14 -6 q-4 -6 0 -12" stroke="#fff" stroke-width="2" fill="none" opacity=".7"/></g>` + floorShadow },
    { id: 'class', name: '외국어 교실', price: 200, rare: '레어', face: '#F3E6CC', art: () => `<defs>${lg('bgCl1', '#FBF0DA', '#F1E0BF')}</defs><rect width="300" height="220" fill="url(#bgCl1)"/>` +
      `<rect x="34" y="20" width="232" height="104" rx="8" fill="#2F5D50" stroke="#B5814E" stroke-width="7"/>` +
      `<text x="70" y="58" font-family="Arial Black, Arial, sans-serif" font-size="20" fill="#FFFFFF" opacity=".92">Hello!</text><text x="152" y="86" font-family="sans-serif" font-weight="700" font-size="16" fill="#FFE27A" opacity=".9">こんにちは</text><text x="64" y="108" font-family="sans-serif" font-weight="700" font-size="14" fill="#F7B6CC" opacity=".9">¡Hola!  你好</text>` +
      `<path d="M210 46 q12 -10 24 0" stroke="#fff" stroke-width="2.5" fill="none" opacity=".6"/><rect x="214" y="120" width="30" height="6" rx="3" fill="#fff"/>` +
      `<rect x="0" y="170" width="300" height="50" fill="#D4A574"/>${rng(6, (i) => `<path d="M${i * 60} 170 V220" stroke="#C0905F" stroke-width="2"/>`)}` +
      `<circle cx="282" cy="150" r="10" fill="#E5484D"/><circle cx="20" cy="40" r="14" fill="#FFFFFF" stroke="#B5814E" stroke-width="3"/><path d="M20 40 V32 M20 40 l6 4" stroke="#1E1A2B" stroke-width="2"/>` + floorShadow },
    { id: 'snow', name: '눈 오는 밤', price: 0, rare: '시즌', lock: '12월 출석 7일 보상', face: '#3D4B85', art: () => `<defs>${lg('bgSn1', '#1F2A5C', '#4A5BA0')}</defs><rect width="300" height="220" fill="url(#bgSn1)"/>` +
      `<circle cx="244" cy="42" r="18" fill="#FFF6D6"/><circle cx="252" cy="36" r="16" fill="#2A3670"/>` +
      `<path d="M38 172 L60 110 L82 172Z M44 140 L60 96 L76 140Z M50 116 L60 84 L70 116Z" fill="#2E8A5A"/><path d="${star(60, 80, 8, 0.45)}" fill="#FFE200"/>` +
      [[52, 150, '#E5484D'], [66, 128, '#FFE200'], [56, 108, '#7FA7E8'], [70, 160, '#F28CB1']].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="3.5" fill="${c}"/>`).join('') +
      `<path d="M0 172 Q80 160 160 170 Q230 160 300 168 V220 H0Z" fill="#F4F7FF"/><path d="M0 190 Q150 180 300 192 V220 H0Z" fill="#E1E8FA"/>` +
      rng(30, (i) => `<circle cx="${(i * 53) % 300}" cy="${(i * 37) % 166}" r="${1.4 + (i % 3)}" fill="#fff" opacity="${0.6 + (i % 3) * 0.13}"/>`) + floorShadow },
    { id: 'night', name: '서울 야경', price: 400, rare: '에픽', face: '#2A2148', art: () => `<defs>${lg('bgN1', '#1A1638', '#4A2F78')}</defs><rect width="300" height="220" fill="url(#bgN1)"/>` +
      rng(24, (i) => `<circle cx="${(i * 71) % 300}" cy="${(i * 29) % 90}" r="${i % 4 ? 1 : 1.8}" fill="#fff" opacity=".8"/>`) + `<circle cx="60" cy="40" r="14" fill="#FFF3C4"/>` +
      `<path d="M212 150 L216 70 L222 70 L226 150Z" fill="#3A3360"/><rect x="208" y="60" width="22" height="14" rx="4" fill="#5A4C8C"/><path d="M219 60 V36" stroke="#5A4C8C" stroke-width="3"/><circle cx="219" cy="34" r="3" fill="#FF7A9C"/>` +
      [[0, 120, 38], [36, 100, 30], [64, 136, 28], [92, 86, 30], [124, 122, 36], [160, 104, 28], [236, 118, 30], [266, 96, 34]].map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="${220 - y}" fill="#2A2450"/>` + rng(6, (k) => `<rect x="${x + 5 + (k % 3) * 9}" y="${y + 8 + Math.floor(k / 3) * 14}" width="5" height="7" fill="${(x + k) % 3 ? '#FFE27A' : '#7FA7E8'}" opacity=".85"/>`)).join('') +
      `<rect x="0" y="176" width="300" height="44" fill="#1A1638"/><path d="M0 180 H300" stroke="#7FA7E8" stroke-width="2" opacity=".5"/>` + floorShadow },
    { id: 'space', name: '우주 정거장', price: 500, rare: '에픽', face: '#120F24', art: () => `<defs><radialGradient id="bgSp1" cx=".3" cy=".3" r=".9"><stop offset="0" stop-color="#3A2470"/><stop offset=".6" stop-color="#17123A"/><stop offset="1" stop-color="#0C0A1E"/></radialGradient></defs><rect width="300" height="220" fill="url(#bgSp1)"/>` +
      `<ellipse cx="90" cy="70" rx="80" ry="30" fill="#8B5CF6" opacity=".18"/>` + rng(36, (i) => `<circle cx="${(i * 71) % 300}" cy="${(i * 43) % 220}" r="${i % 5 ? 1 : 2}" fill="#fff" opacity=".85"/>`) +
      P(ell(246, 58, 28, 28), '#F28CB1', { rim: 0.2 }) + `<ellipse cx="246" cy="58" rx="46" ry="10" fill="none" stroke="#FFE200" stroke-width="4" transform="rotate(-16 246 58)"/>` +
      P(ell(40, 150, 14, 14), '#7FA7E8', { rim: 0.2 }) + sp(180, 30, 8, '#FFE27A') + sp(30, 60, 6) +
      `<path d="M0 182 Q150 168 300 182 V220 H0Z" fill="#C9C2E8"/><ellipse cx="60" cy="200" rx="18" ry="5" fill="#A89FD0"/><ellipse cx="230" cy="194" rx="24" ry="6" fill="#A89FD0"/>` + floorShadow },
  ];

  const cat = (L, c, layer) => L.map((i) => ({ cat: c, layer: i.layer || layer, ...i }));
  const ITEMS = [
    ...cat(HAIRS, 'hair', 'back').map((i) => ({ ...i, hair: true })),
    ...cat(EYES, 'eye', 'eye'),
    ...cat(HATS, 'hat', 'back').map((i) => ({ ...i, hat: true })),
    ...cat(FACES, 'face', 'front'),
    ...cat(WEARS, 'wear', 'paint'),
    ...cat(MITTS, 'mitt', 'paint'),
    ...cat(SHOES, 'shoe', 'paint'),
    ...cat(HANDS, 'hand', 'back'),
    ...cat(ACCS, 'acc', 'front'),
    ...cat(FXS, 'fx', 'fx'),
  ];
  const V = '-140 -260 800 640';
  const svg = (body, vb = V) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${DEFS}${body}</svg>`;
  window.AVART = { ITEMS, BGS, svg, V, IMG, INK };
})();
