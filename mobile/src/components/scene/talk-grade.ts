/**
 * AI 미션 대화 채점 · 고치기 (프로토타입 ftGrade · ftFix · ftHTML · blankOne 그대로).
 * 프로토타입은 대본이 정해진 대화예요. 실제 앱은 같은 자리에 AI 응답 · 교정을 붙여요.
 */
import type { Mission } from '@/data/situation-content';

const FT_FILLER = new Set(['haha', 'hahaha', 'hah', 'lol', 'lmao', 'hehe', 'ok', 'okay', 'yes', 'yeah', 'yep', 'no', 'nope', 'hmm', 'hm', 'um', 'uh', 'idk', 'sure', 'maybe', 'thanks', 'thank', 'wow', 'oh', 'cool', 'nice', 'good', 'fine']);

const FT_WORDS = (
  'i you he she it we they me my your his her our their this that these those a an the and but or so because if when what where why how who which do does did done have has had having be is am are was were been being can could will would should may might must not no yes to of in on at for with from by about as up down out over into than then there here very really just too also only more most some any all every each many much one two three good bad big small new old hot cold nice great quiet loud soft hard window bed room hotel view city night ocean mountain coffee machine food pizza pasta package order ordered wrong right store call called ask asked send sent new one refund back usually say said something politely let go small it depends situation like want get got make made eat ate drink went go going come came see saw look looks looked work works worked working wifi wi-fi phone charger password key water air conditioner problem staff front desk please thanks thank sorry okay ok sure think know feel tired busy happy sad today tonight yesterday weekend week time day morning lunch dinner home office cafe shop friend friends family lucky never ever always sometimes often first last next people place thing things kind favorite best better well again still alone sister brother motivation recharge sleep sleeping walk walking weather mood loud places cooking calls guitar lessons blog start try'
).split(' ');

const pick = <T>(a: T[]): T => a[Math.floor(Math.random() * a.length)];

/** 미션 확인 정규식 (프로토타입 SV.D.patterns = 미션 3개의 re) */
export const missionHits = (mis: Mission[], txt: string) => mis.map((m) => new RegExp(m.re, 'i').test(txt.replace(/[’]/g, "'")));

export type Grade = { k: 'weak' | 'good' | 'ok'; en?: string; why: string };

export function grade(v: string, mis: Mission[]): Grade {
  const t = v.toLowerCase().replace(/[’]/g, "'");
  const ws = t.match(/[a-z']+/g) ?? [];
  const real = ws.filter((w) => !FT_FILLER.has(w));
  if (/[가-힣]/.test(t) && ws.length < 3) return { k: 'weak', why: '영어로 답해 볼까요?' };
  if (ws.length < 3 || real.length < 2) return { k: 'weak', why: '한 문장으로 답해 볼까요?' };
  const reason = /\b(because|so|since|that's why|and|but|when|if)\b/.test(t);
  if (missionHits(mis, v).some(Boolean)) return { k: 'good', en: pick(['Great answer!', 'Nice, I like that!']), why: '오늘의 패턴을 썼어요' };
  if (reason) return { k: 'good', en: pick(['Great answer!', 'Oh, that makes sense!']), why: '이유까지 말했어요' };
  if (ws.length >= 7) return { k: 'good', en: pick(['Nice!', 'Oh, I see!']), why: '' };
  return { k: 'ok', en: pick(['I see.', 'Okay!']), why: 'because로 이유를 붙여 보면 더 좋아요' };
}

/** 같은 질문에서 한 번은 '조금 더 말해 줄래요?' */
export const FT_MORE: [string, string][] = [
  ['Haha! Can you tell me a bit more?', '하하! 조금 더 말해 줄래요?'],
  ['Hmm, can you say it in a full sentence?', '음, 한 문장으로 말해 줄래요?'],
];

const lev = (a: string, b: string) => {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
};

/** 아는 단어: 기본 낱말 + 이 대화의 직원 말 · 추천 답 · 미션 이름 */
export function dictOf(lines: string[], replies: string[][], mis: Mission[]) {
  const set = new Set(FT_WORDS);
  const add = (x: string) =>
    x
      .toLowerCase()
      .replace(/[’]/g, "'")
      .split(/[^a-z'-]+/)
      .forEach((w) => {
        if (w) set.add(w.replace(/^'+|'+$/g, ''));
      });
  lines.forEach(add);
  replies.forEach((r) => r.forEach(add));
  mis.forEach((m) => add(m.t));
  return set;
}

export type Piece = { t: string; fix?: string };

/** 고치기: 스펠링(아는 단어와 한두 글자 차이) + 자주 틀리는 문법 몇 가지 */
export function fixParts(text: string, dict: Set<string>): Piece[] {
  const parts: Piece[] = text
    .replace(/[’]/g, "'")
    .split(/(\s+)/)
    .map((t) => ({ t }));
  const W = parts.filter((p) => p.t.trim());
  const core = (p: Piece) => p.t.replace(/^[^A-Za-z']+|[^A-Za-z']+$/g, '');
  const setFix = (p: Piece, word: string) => {
    const c = core(p);
    if (c) p.fix = p.t.replace(c, word);
  };
  W.forEach((p, k) => {
    const c = core(p);
    const lc = c.toLowerCase();
    const prev = W[k - 1] ? core(W[k - 1]).toLowerCase() : '';
    const prev2 = W[k - 2] ? core(W[k - 2]).toLowerCase() : '';
    if (!c) return;
    if (lc === 'i' && c === 'i') return setFix(p, 'I');
    if (lc === "don't" && (/^(it|he|she|this|that)$/.test(prev) || /^(the|my|your|his|her|our|this|that)$/.test(prev2))) return setFix(p, "doesn't");
    if (lc === "doesn't" && /^(i|you|we|they)$/.test(prev)) return setFix(p, "don't");
    if (lc === 'have' && /^(he|she|it)$/.test(prev)) return setFix(p, 'has');
    if (lc === 'has' && /^(i|you|we|they)$/.test(prev)) return setFix(p, 'have');
    if (lc === 'a' && W[k + 1] && /^[aeiou]/i.test(core(W[k + 1])) && !/^(uni|use|one|eu)/i.test(core(W[k + 1]))) return setFix(p, 'an');
    if (lc.length < 3 || dict.has(lc) || (/^[A-Z]/.test(c) && k > 0) || /\d/.test(c)) return;
    const lim = lc.length > 6 ? 2 : 1;
    let best: string | null = null;
    let bd = 9;
    for (const d of dict) {
      if (Math.abs(d.length - lc.length) > lim) continue;
      const v = lev(d, lc);
      if (v <= lim && (v < bd || (v === bd && d[0] === lc[0]))) {
        bd = v;
        best = d;
      }
    }
    if (best) setFix(p, c[0] === c[0].toUpperCase() ? best[0].toUpperCase() + best.slice(1) : best);
  });
  return parts;
}

/** 조각 + 미션 표현 형광펜 자리 (프로토타입 ftHTML) */
export function marked(parts: Piece[], mis: Mission[]) {
  const joined = parts.map((p) => p.fix ?? p.t).join('');
  const marks: [number, number][] = [];
  mis.forEach((m) => {
    const re = new RegExp(m.re, 'ig');
    const src = joined.replace(/[’]/g, "'");
    let x: RegExpExecArray | null;
    while ((x = re.exec(src))) {
      marks.push([x.index, x.index + x[0].length]);
      if (!x[0].length) break;
    }
  });
  let pos = 0;
  const out = parts.map((p) => {
    const shown = p.fix ?? p.t;
    const a = pos;
    const b = pos + shown.length;
    pos = b;
    return { ...p, mark: !!shown.trim() && !p.fix && marks.some(([x, y]) => a < y && b > x) };
  });
  return { pieces: out, fixed: parts.some((p) => p.fix), text: joined.replace(/\s+/g, ' ').trim() };
}

/** 상황 맵 힌트: 미션 핵심 단어(또는 뜻이 담긴 가장 긴 단어) 하나를 빈칸으로 (프로토타입 blankOne) */
export function blankOne(x: string, mis?: Mission) {
  const STOP = /^(please|would|could|there|thanks|thank|about|really|maybe|right|sorry)$/i;
  const w = x.split(' ');
  const misRe = mis ? new RegExp(`^(${mis.re})`, 'i') : null;
  const bare = (t: string) => t.replace(/[^A-Za-z'’-]/g, '');
  if (misRe && w.some((t) => misRe.test(bare(t)))) return w.map((t) => (misRe.test(bare(t)) ? t.replace(/[A-Za-z'’-]+/, '____') : t)).join(' ');
  let bi = -1;
  let bl = 0;
  w.forEach((t, k) => {
    const c = bare(t);
    if (c.length > bl && !STOP.test(c) && !/['’]/.test(c)) {
      bl = c.length;
      bi = k;
    }
  });
  if (bi < 0) return x;
  w[bi] = w[bi].replace(/[A-Za-z'’-]+/, '____');
  return w.join(' ');
}
