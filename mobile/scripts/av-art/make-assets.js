// geo.json(export.html 이 만든 것) → 앱 코드 두 개를 새로 써요.
//   src/components/character/av-assets.ts : PNG require · 자리
//   src/data/av-items.ts                 : 아이템 · 배경 목록 (이름 · 가격 · 등급 · 겹침)
// 실행: node mobile/scripts/av-art/make-assets.js
const fs = require('fs'), path = require('path');
const geo = JSON.parse(fs.readFileSync(path.join(__dirname, 'geo.json'), 'utf8'));
const src = path.join(__dirname, '../../src');
const req = (f) => `require('@/assets/characters/av/${f}.png')`;
const q = (s) => `'${String(s).replace(/'/g, "\\'")}'`;
const arr = (r) => `[${r.join(', ')}]`;

let a = `/**
 * 꾸미기 그림 자산 (자동 생성 — 손으로 고치지 않아요. scripts/av-art/README.md).
 * 원본은 scripts/av-art/art.js (캐릭터 원본 좌표 520 × 332 위에 그린 SVG) → export.html 로 뜬 PNG 예요.
 * 자리 r = [x, y, 폭, 높이]: box = 캐릭터 상자 비율 · stage = 무대(300 × 220) 비율.
 * 헤어는 머리 색을 바꾸도록 두 장: 바탕(빛 · 그림자 · 선) 위에 색칠 자리(tintColor 로 머리 색). front = 눈 위 앞머리.
 * 머리를 덮는 모자(cover)를 같이 쓰면 back · front 대신 cap(모자 속을 뺀 뒷머리) · side(모자 아랫선 아래로 내려오는 옆머리).
 */

export type AvRect = readonly [number, number, number, number];
export type AvGeo = { k: 'box' | 'stage'; r: AvRect } | { k: 'hair'; back: AvRect; front?: AvRect; cap?: AvRect; side: AvRect } | { k: 'none' };

export const AV_ART: Record<string, number> = {
`;
const fill = [], front = [], frontFill = [];
const parts = [];
for (const [id, g] of Object.entries(geo.items)) {
  if (g.k === 'none') continue;
  a += `  ${q(id)}: ${req(id)},\n`;
  if (g.hair) { fill.push(id); parts.push([id, g]); if (g.front) { front.push(id); frontFill.push(id); } }
}
a += `};\n\nexport const AV_HAIR_FILL: Record<string, number> = {\n${fill.map((id) => `  ${q(id)}: ${req(id + '-fill')},`).join('\n')}\n};\n`;
a += `\n/** 헤어 부분 그림: front 앞머리 · cap 모자 속을 뺀 뒷머리 · side 모자 아래 옆머리 (각각 바탕 + 색칠 자리) */\ntype Two = { base: number; fill: number };\nexport const AV_HAIR_PART: Record<string, { front?: Two; cap?: Two; side: Two }> = {\n${parts.map(([id, g]) => `  ${q(id)}: { ${g.front ? `front: { base: ${req(id + '-front')}, fill: ${req(id + '-front-fill')} }, ` : ''}${g.cap ? `cap: { base: ${req(id + '-cap')}, fill: ${req(id + '-cap-fill')} }, ` : ''}side: { base: ${req(id + '-side')}, fill: ${req(id + '-side-fill')} } },`).join('\n')}\n};\n`;
a += `\nexport const AV_GEO: Record<string, AvGeo> = {\n${Object.entries(geo.items).map(([id, g]) => `  ${q(id)}: ${g.hair ? `{ k: 'hair', back: ${arr(g.back)}${g.front ? `, front: ${arr(g.front)}` : ''}${g.cap ? `, cap: ${arr(g.cap)}` : ''}, side: ${arr(g.side)} }` : g.k === 'none' ? `{ k: 'none' }` : `{ k: '${g.k}', r: ${arr(g.r)} }`},`).join('\n')}\n};\n`;
a += `\nexport const AV_BG_ART: Record<string, number> = {\n${geo.bgMeta.map((b) => `  ${q(b.id)}: ${req('bg-' + b.id)},`).join('\n')}\n};\n`;
a += `
/** 원본 3D 몸 PNG (색마다 따로 그린 원본) */
export const AV_BODY: Record<string, number> = {
${['yellow', 'purple', 'pink', 'sky', 'green', 'coral', 'purple-lash'].map((c) => `  ${q(c)}: ${req('body-' + c)},`).join('\n')}
};

/** 직접 고른 몸 색: 노랑 원본에서 노랑 몸 픽셀만 떼어 낸 4장 (프로토타입 avTintMake 와 같은 기준) */
export const AV_TINT = {
${['base', 'fill', 'sat', 'shade'].map((k) => `  ${k}: ${req('tint-' + k)} as number,`).join('\n')}
};
`;
fs.writeFileSync(path.join(src, 'components/character/av-assets.ts'), a);

const it = (m) => {
  const f = [`id: ${q(m.id)}`, `cat: ${q(m.cat)}`, `name: ${q(m.name)}`, `price: ${m.price}`, `rare: ${q(m.rare)}`];
  if (m.lock) f.push(`lock: ${q(m.lock)}`);
  f.push(`layer: ${q(m.layer)}`);
  if (m.hat) f.push('hat: true');
  if (m.cover) f.push(`cover: true, clipY: ${m.clipY}`);
  if (m.hair) f.push('hair: true');
  if (m.lid) f.push(`lid: { ${Object.entries(m.lid).map(([k, v]) => `${k}: ${v}`).join(', ')} }`);
  return `  { ${f.join(', ')} },`;
};
const d = `/**
 * 꾸미기 아이템 · 배경 목록 (자동 생성 — scripts/av-art/art.js 를 고친 뒤 make-assets.js 로 다시 만들어요).
 * 카테고리마다 10개. 겹침 layer — back: 캐릭터 뒤 · front: 앞 · paint: 몸에 칠한 옷 · eye: 눈 위 · fx: 무대 효과.
 */
import type { AvBg, AvItem } from './my';

export const AV_ITEMS: AvItem[] = [
${geo.meta.map(it).join('\n')}
];

export const AV_BG: AvBg[] = [
${geo.bgMeta.map((b) => `  { id: ${q(b.id)}, name: ${q(b.name)}, price: ${b.price}, rare: ${q(b.rare)}${b.lock ? `, lock: ${q(b.lock)}` : ''}, face: ${q(b.face)} },`).join('\n')}
];
`;
fs.writeFileSync(path.join(src, 'data/av-items.ts'), d);
console.log('ok', Object.keys(geo.items).length, 'items', geo.bgMeta.length, 'bgs');
