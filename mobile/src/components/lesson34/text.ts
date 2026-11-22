/*
 * Lv.3 · 4 문장 도우미 — 프로토타입 규칙(nrm · wordRe · phraseRe · splitAnswer · polish …) 그대로.
 * 실제 앱은 '칸 나누기 · 교정 · 업그레이드'를 AI(`/ai/feedback`)가 해요. 여기는 프로토타입과 같은 규칙 기반이에요.
 */
import type { LiveFix } from '@/data/lessons34';

export const nrm = (v: string) => String(v || '').replace(/[’‘]/g, "'");
export const escRe = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/'/g, "['’]");
/** 낱말 수 */
export const words = (s: string) => (s || '').trim().split(/\s+/).filter(Boolean).length;
/** 문장 수 (because · and then 같은 이음말도 문장 경계로) — 프로토타입 sentN */
export const sentN = (v: string) =>
  String(v || '')
    .split(/[.!?]+|\s(?=(?:because|and then|so|but|also|for example|plus)\b)/i)
    .filter((x) => words(x) >= 2).length;
/** 마침표로 나눈 문장 수 — 프로토타입 sentences */
export const sentences = (s: string) => (s || '').split(/[.!?]+/).filter((x) => x.trim().split(/\s+/).length >= 2).length;
/** 프리토킹 레벨 말하기 · 쓰기는 3문장 이상 (짧은 · 정답형 문제는 빼고) — 프로토타입 needSent */
export const MIN_SENT = 3;
export const fmtS = (n: number) => `${Math.floor(Math.max(n, 0) / 60)}:${String(Math.max(n, 0) % 60).padStart(2, '0')}`;
export const capFirst = (v: string) => String(v).replace(/(^|[.!?]\s+)([a-z])/g, (_m, p: string, c: string) => p + c.toUpperCase());

/** 키워드 첫 낱말로 찾기 (stay → stay, restore → restor) */
export const wordRe = (w: string) => new RegExp('\\b' + escRe(w.split(' ')[0].replace(/e$/, '')), 'i');
// 표현은 느슨하게 찾아요 (be obsessed with → was obsessed with)
const PH_STOP = new Set(['be', 'a', 'an', 'the', 'to', 'onto', 'of', 'go', 'change', 'create']);
const stemW = (x: string) => x.replace(/(ies|es|s|ed|ing|e)$/, '') || x;
export const phraseRe = (w: string) =>
  new RegExp(
    nrm(w)
      .toLowerCase()
      .replace(/[.?!,]/g, '')
      .split(/\s+/)
      .filter((x) => x && !PH_STOP.has(x))
      .map((x) => escRe(stemW(x)))
      .join('\\w*\\s+(?:\\w+\\s+){0,2}') + '\\w*',
    'i',
  );

export function shuffle<T>(a: readonly T[]) {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}
export const pickOne = <T>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)];

/** 형광펜 조각: 내 말에서 키워드 · 표현 부분 (프로토타입 markWords) */
export function markParts(v: string, res: RegExp[] = []) {
  const hits: [number, number][] = [];
  res.forEach((re) => {
    const g = new RegExp('(' + re.source + '[a-z]*)', 'ig');
    let m: RegExpExecArray | null;
    while ((m = g.exec(v))) {
      if (!m[0].length) break;
      hits.push([m.index, m.index + m[0].length]);
    }
  });
  hits.sort((a, b) => a[0] - b[0]);
  const out: { t: string; on: boolean }[] = [];
  let pos = 0;
  hits.forEach(([a, b]) => {
    if (a < pos) return;
    if (a > pos) out.push({ t: v.slice(pos, a), on: false });
    out.push({ t: v.slice(a, b), on: true });
    pos = b;
  });
  if (pos < v.length) out.push({ t: v.slice(pos), on: false });
  return out;
}

// ---- 답을 칸으로 나눠 보기 (선택 · 이유 · 예시 · 사회적 관점) — 프로토타입 SPLIT_RULES · splitAnswer ----
export type SlotKey = 'choice' | 'reason' | 'example' | 'society';
const SPLIT_RULES: Record<SlotKey, [string, RegExp | null]> = {
  choice: ['선택', null],
  reason: ['이유', /\b(because|since|that's why|the reason|so that|as it|it helps|makes me)\b/i],
  example: ['예시', /\b(for example|for instance|like when|once|last (week|year|month|summer|weekend)|when i was|the other day|one time|a few (days|weeks|years) ago)\b/i],
  society: ['사회적 관점', /\b(people|society|young people|generation|koreans?|culture|most of us|nowadays|these days|everyone)\b/i],
};
export type Split = { slots: { key: SlotKey; label: string; text?: string; ex?: string }[]; missing: string[]; got: number; size: number };

export function splitAnswer(v: string, keys: SlotKey[], ex?: string[]): Split {
  const ss = nrm(v)
    .split(/(?<=[.!?])\s+|,?\s+(?=(?:because|since|for example|for instance|so)\b)/i)
    .map((x) => x.trim())
    .filter(Boolean);
  const got: Partial<Record<SlotKey, string>> = {};
  const used = new Set<number>();
  keys.forEach((k) => {
    const re = SPLIT_RULES[k][1];
    if (!re) return;
    const i = ss.findIndex((x, j) => !used.has(j) && re.test(x));
    if (i >= 0) {
      got[k] = ss[i];
      used.add(i);
    }
  });
  const ci = ss.findIndex((_, j) => !used.has(j));
  if (keys.includes('choice') && ci >= 0) got.choice = ss[ci];
  const missing = keys.filter((k) => !got[k]).map((k) => SPLIT_RULES[k][0]);
  return {
    slots: keys.map((key, i) => ({ key, label: SPLIT_RULES[key][0], text: got[key], ex: ex?.[i] })),
    missing,
    got: Object.keys(got).length,
    size: keys.length,
  };
}

// ---- 문장 업그레이드 (쉬운 말 → 자연스러운 말 · 앱에서는 AI가 내 문장 하나를 골라 다듬어요) — 프로토타입 UPG ----
const UPG: [RegExp, string, string][] = [
  [/\bit(?:'s| is) (?:so |very )?quiet\b/i, 'it helps me unwind', '조용하다 → 마음이 풀린다'],
  [/\bmakes? me (?:feel )?(?:happy|good)\b/i, 'lifts my mood', '기분 좋게 해 준다 → 기분을 끌어올려 준다'],
  [/\bi (?:really )?like\b/i, 'I’m really into', '좋아해요 → 푹 빠져 있어요'],
  [/\bi think\b/i, 'I’d say', '생각해요 → ~라고 할 수 있죠'],
  [/\bvery (?:good|nice|fun)\b/i, 'a blast', '아주 좋다 → 정말 신난다'],
  [/\bi want to\b/i, 'I’d love to', '하고 싶어요 → 정말 해 보고 싶어요'],
  [/\b(?:good for (?:my )?health|healthy)\b/i, 'keeps me in shape', '건강에 좋다 → 몸을 지켜 준다'],
  [/\brelax\b/i, 'unwind', 'relax → unwind (긴장을 풀다)'],
  [/\bexpensive\b/i, 'pricey', 'expensive → pricey (값이 좀 나가는)'],
  [/\bvery busy\b|\bbusy\b/i, 'swamped', 'busy → swamped (일에 파묻힌)'],
];
export function upgradeOf(v: string) {
  const ss = nrm(v)
    .split(/(?<=[.!?])\s+|,?\s+(?=(?:because|since|for example|so)\b)/i)
    .map((x) => x.trim())
    .filter(Boolean);
  for (const [re, to, ko] of UPG) {
    const x = ss.find((y) => re.test(y));
    if (x) {
      let up = x.replace(re, to);
      up = up[0].toUpperCase() + up.slice(1);
      if (!/[.!?]$/.test(up)) up += '.';
      return { from: x, to: up, ko };
    }
  }
  return null;
}

// ---- 저널 다듬기: 어색한 말 → 자연스러운 말, 대소문자 · 마침표 — 프로토타입 polish · polishLive ----
export function polish(v: string, pairs: [string, string][] = []) {
  let out = nrm(v).trim();
  const fixes: [string, string][] = [];
  pairs.forEach(([a, b]) => {
    const core = a.replace(/[.!?]$/, '');
    const re = new RegExp(escRe(core), 'i');
    if (re.test(out)) {
      out = out.replace(re, b.replace(/[.!?]$/, ''));
      fixes.push([core, b.replace(/[.!?]$/, '')]);
    }
  });
  (
    [
      [/\bvery very\b/i, 'really'],
      [/\bi think so that\b/i, 'I think that'],
      [/\bmore better\b/i, 'better'],
      [/\bin weekend\b/i, 'on weekends'],
      [/\bvisit to\b/i, 'visit'],
    ] as [RegExp, string][]
  ).forEach(([re, b]) => {
    const m = out.match(re);
    if (m) {
      out = out.replace(re, b);
      fixes.push([m[0], b]);
    }
  });
  const capped = out.replace(/(^|[.!?]\s+)([a-z])/g, (_m, p: string, c: string) => p + c.toUpperCase()).replace(/\bi\b/g, 'I');
  if (capped !== out && fixes.length < 2) fixes.push(['소문자 i · 문장 첫 글자', '대문자로']);
  out = capped;
  if (!/[.!?]$/.test(out)) out += '.';
  return { text: out, fixes };
}
export function polishLive(v: string, live: LiveFix[]) {
  const fx: [string, string][] = [];
  const txt = nrm(v)
    .split(/(?<=[.!?])\s+/)
    .map((x) => {
      for (const [re, f] of live)
        if (re.test(x)) {
          const y = capFirst(f(x));
          fx.push([x.replace(/[.!?]$/, ''), y.replace(/[.!?]$/, '')]);
          return y;
        }
      return x;
    })
    .join(' ');
  const P = polish(txt, []);
  return { text: P.text, fixes: fx.concat(P.fixes) };
}

// ---- 낱말별 채점 (정답이 하나인 말하기 · 바꿔 말하기) — 프로토타입 gradeWords · normW ----
// 줄임말 풀기 (프로토타입 CONTR)
const CONTR: Record<string, string> = { "i'm": 'i am', "i'd": 'i would', "it's": 'it is', "don't": 'do not', "doesn't": 'does not', "isn't": 'is not', "can't": 'can not', cannot: 'can not', "i've": 'i have', "i'll": 'i will', "won't": 'will not', "didn't": 'did not', "couldn't": 'could not', "wasn't": 'was not', "let's": 'let us', "what's": 'what is', "that's": 'that is', "there's": 'there is', "you're": 'you are', "we're": 'we are', "they're": 'they are', "she'd": 'she would', "he's": 'he is', "she's": 'she is', "aren't": 'are not', "haven't": 'have not', "shouldn't": 'should not', "wouldn't": 'would not', "it'll": 'it will', "we'll": 'we will' };
const normW = (w: string) => {
  const x = w
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9']/g, '');
  return (CONTR[x] || x).split(' ').filter(Boolean);
};
export function gradeWords(ans: string, key: string) {
  const user = ans.split(/\s+/).flatMap(normW);
  const kw = key.split(/\s+/).filter(Boolean);
  let p = 0;
  const ok = kw.map((w) => {
    const parts = normW(w);
    if (!parts.length) return true;
    const at = user.indexOf(parts[0], p);
    if (at < 0) return false;
    if (parts.every((x, k) => user[at + k] === x)) {
      p = at + parts.length;
      return true;
    }
    return false;
  });
  const score = ok.filter(Boolean).length / kw.length;
  return { words: kw, ok, score, perfect: ok.every(Boolean) };
}
