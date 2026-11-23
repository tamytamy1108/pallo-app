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

// ---- AI 대화 답 교정 (실제 앱은 AI 가 해요 · 프로토타입 v503 aiFix 와 같은 규칙) ----
const AI_TYPO: [RegExp, string][] = [
  [/\balot\b/gi, 'a lot'], [/\b(cuz|coz|cos|bc)\b/gi, 'because'], [/\bgonna\b/gi, 'going to'], [/\bwanna\b/gi, 'want to'], [/\bgotta\b/gi, 'have to'],
  [/\bdont\b/gi, "don't"], [/\bdoesnt\b/gi, "doesn't"], [/\bdidnt\b/gi, "didn't"], [/\bcant\b/gi, "can't"], [/\bwont\b/gi, "won't"], [/\bisnt\b/gi, "isn't"],
  [/\bim\b/gi, "I'm"], [/\bive\b/gi, "I've"], [/\bthats\b/gi, "that's"], [/\bu\b/g, 'you'], [/\bur\b/g, 'your'], [/\bvirall\b/gi, 'viral'], [/\bthier\b/gi, 'their'],
  [/\b(beacuse|becuase|becasue)\b/gi, 'because'], [/\bdefinately\b/gi, 'definitely'], [/\bwierd\b/gi, 'weird'], [/\brecieve\b/gi, 'receive'], [/\buntill\b/gi, 'until'], [/\btommorow\b/gi, 'tomorrow'],
  [/\b(alway)\b/gi, 'always'], [/\brealy\b/gi, 'really'], [/\bbecuse\b|\bbecaus\b/gi, 'because'], [/\bwanto\b/gi, 'want to'], [/\bbecause of i\b/gi, 'because I'], [/\bfavourit\b|\bfavorit\b/gi, 'favorite'], [/\bbeautiful\b/gi, 'beautiful'], [/\bthru\b/gi, 'through'], [/\btho\b/gi, 'though'],
  [/\bpls\b|\bplz\b/gi, 'please'], [/\bidk\b/gi, "I don't know"], [/\bsth\b/gi, 'something'], [/\bppl\b/gi, 'people'], [/\bfreind\b/gi, 'friend'], [/\bwich\b/gi, 'which'], [/\balright\b/gi, 'all right'],
  [/\bdoesnt\b/gi, "doesn't"], [/\bwasnt\b/gi, "wasn't"], [/\bwouldnt\b/gi, "wouldn't"], [/\bcouldnt\b/gi, "couldn't"], [/\bshouldnt\b/gi, "shouldn't"], [/\barent\b/gi, "aren't"], [/\bhavent\b/gi, "haven't"], [/\btheyre\b/gi, "they're"], [/\byoure\b/gi, "you're"], [/\bwhats\b/gi, "what's"],
];
/** -ing 붙이기: e 빼기 · 짧은 자음+모음+자음은 끝 자음 두 번 (swim → swimming) */
const ingOf = (v: string) => (/^[^aeiou]*[aeiou][^aeiouwxy]$/i.test(v) && v.length <= 4 ? `${v}${v.slice(-1)}ing` : `${v.replace(/([^e])e$/, '$1')}ing`);
const third = (v: string) => (v === 'have' ? 'has' : v === 'do' ? 'does' : v === 'go' ? 'goes' : `${v}s`);
const AI_GRAM: [RegExp, string | ((...m: string[]) => string), string][] = [
  [/\b(he|she|it|this|that)\s+don't\b/gi, (_m, a) => `${a} doesn't`, 'he · she · it 뒤엔 doesn’t'],
  [/\bI\s+(is|are)\b/g, 'I am', 'I 뒤엔 am'],
  [/\bI\s+am\s+agree\b/gi, 'I agree', 'agree 는 am 없이'],
  [/\bevery\s+(weekends|days|weeks|mornings|nights|months)\b/gi, (_m, w) => `every ${w.replace(/s$/, '')}`, 'every 뒤엔 단수'],
  [/\b(he|she|it)\s+((?:just|really|always|never|also|usually)\s+)?(like|want|need|taste|look|feel|make|seem|work|get|have|do|go)\b/gi, (_m, a, adv, v) => `${a} ${adv || ''}${third(v)}`, 'he · she · it 뒤 동사엔 -s'],
  [/\bmore\s+(better|easier|bigger|faster|happier|worse)\b/gi, '$1', '비교급엔 more 없이'],
  [/\bvery\s+very\b/gi, 'really', 'very very → really'],
  [/\bin\s+(weekend|weekends)\b/gi, 'on weekends', 'on weekends'],
  [/\ba\s+(?=[aeio]\w)/gi, 'an ', '모음 앞엔 an'],
  [/\b(\w{2,})\s+\1\b/gi, '$1', '같은 단어가 두 번'],
  [/\bits\s+(?=(so|very|really|a|an|the|not|just|kind|pretty|too|getting|been|hard|easy|fun|okay|ok|good|bad|nice|great|boring|annoying|weird|funny|crazy|my|your)\b)/gi, "it's ", 'it is 줄임 → it’s'],
  [/\bthere\s+is\s+(many|lots|a lot|so many|some)\b/gi, (_m, w) => `there are ${w}`, '여럿이면 there are'],
  [/\b(people|they|we|my friends|my parents)\s+is\b/gi, (_m, w) => `${w} are`, '여럿이면 are'],
  [/\b(everyone|everybody|someone|nobody)\s+are\b/gi, (_m, w) => `${w} is`, 'everyone 은 is'],
  [/\bI\s+has\b/g, 'I have', 'I 뒤엔 have'],
  [/\b(didn't|did not|don't|doesn't|can't|cannot|will|would|should|could|to)\s+(went|goes|ate|eats|saw|sees|took|takes|made|makes|got|gets|came|comes)\b/gi,
    (_m, a, v) => `${a} ${({ went: 'go', goes: 'go', ate: 'eat', eats: 'eat', saw: 'see', sees: 'see', took: 'take', takes: 'take', made: 'make', makes: 'make', got: 'get', gets: 'get', came: 'come', comes: 'come' } as Record<string, string>)[v.toLowerCase()]}`, '조동사 · to 뒤엔 동사 원형'],
  [/\b(yesterday|last (?:night|week|weekend|month|year|sunday|saturday|friday)|ago)\b([^.!?]*?)\bI\s+(go|eat|see|have|do|come|take|make|buy|watch|play|meet|visit)\b|\bI\s+(go|eat|see|have|do|come|take|make|buy|watch|play|meet|visit)\b([^.!?]*?)\b(yesterday|last (?:night|week|weekend|month|year)|ago)\b/gi,
    (m) => m.replace(/\bI\s+(go|eat|see|have|do|come|take|make|buy|watch|play|meet|visit)\b/i, (_x, v: string) => `I ${({ go: 'went', eat: 'ate', see: 'saw', have: 'had', do: 'did', come: 'came', take: 'took', make: 'made', buy: 'bought', watch: 'watched', play: 'played', meet: 'met', visit: 'visited' } as Record<string, string>)[v.toLowerCase()]}`), '지난 일은 과거형'],
  [/\bmore\s+(easy|happy|busy|big|fast|cheap|hard)\b/gi, (_m, w) => `${({ easy: 'easier', happy: 'happier', busy: 'busier', big: 'bigger', fast: 'faster', cheap: 'cheaper', hard: 'harder' } as Record<string, string>)[w.toLowerCase()]}`, '짧은 말은 -er'],
  [/\bgo\s+to\s+home\b/gi, 'go home', 'go home (to 없이)'],
  [/\bmakes?\s+me\s+to\b/gi, (m) => m.replace(/\s+to$/i, ''), 'make me + 동사 원형'],
  [/\bdiscuss\s+about\b/gi, 'discuss', 'discuss 는 about 없이'],
  [/\bexplain\s+me\b/gi, 'explain to me', 'explain to me'],
  [/\bmarried\s+with\b/gi, 'married to', 'married to'],
  [/\b(enjoy|finish|stop|keep|mind)\s+to\s+(\w+)\b/gi, (_m, a, v) => `${a} ${ingOf(v)}`, `enjoy · finish 뒤엔 -ing`],
];
/** 영어가 아닌 답 (한국어로 답했거나 알아볼 수 없는 말) — AI 가 다시 물어요 */
export function notEnglish(v: string) {
  if (/[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(v)) return 'ko' as const;
  const w = nrm(v).trim().split(/\s+/).filter(Boolean);
  if (!w.length || w.every((x) => !/[aeiouy]/i.test(x)) || /^(.)\1{3,}$/.test(w.join(''))) return 'junk' as const;
  return null;
}
/** 자주 쓰는 낱말 — 한 글자만 틀린 오타를 고칠 때 이 중 하나로만 (이름 · 새 낱말은 건드리지 않아요) */
const COMMON = new Set('a about actually after again all also always am an and annoying any anything are around as ask at away back bad be beach because been before being best better big book bored boring both busy but buy by call came can car care cat change cheap child city class close coffee cold come cook could country crazy cute dad day days definitely different do does dog done door down drama drink drive during each early easy eat else end enjoy enough especially even evening ever every everyone everything exactly example family famous far fast favorite feel few find fine first food for free friend friends from fun funny game get give go going good got great had happy hard has have he health hear help her here him his hobby home hope hot hour house how hungry husband idea if important in interesting into is it just keep kind know language last late later learn least leave less let life like little live long look lot love lunch make many maybe me mean meet might mind money more morning most mother movie much music must my name need never new next nice night no not nothing now of off often old on once one only or other our out over own parents party people person phone picture place plan play please popular pretty probably problem quite rain read ready really reason relax remember rest right run same say school see seem should show since sister sleep slow small so some someone something sometimes song soon sorry special spend sport start stay still stop story study such summer sure take talk teacher tell than thank that the their them then there these they thing things think this those though time tired to today together tomorrow too travel tried trip true try understand until up us use usually very visit wait walk want was watch water way we weather week weekend weekends well went were what when where which while who why will winter with without work worry would write wrong year years yes yesterday yet you young your yourself'.split(' '));
/** 한 글자 넣기 · 빼기 · 바꾸기 · 이웃 두 글자 바꾸기로 같아지나 */
function oneEdit(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 1 || a === b) return false;
  if (a.length === b.length) {
    const d = [...a].map((c, i) => (c !== b[i] ? i : -1)).filter((i) => i >= 0);
    return d.length === 1 || (d.length === 2 && d[1] === d[0] + 1 && a[d[0]] === b[d[1]] && a[d[1]] === b[d[0]]);
  }
  const [l, sh] = a.length > b.length ? [a, b] : [b, a];
  for (let i = 0; i < l.length; i += 1) if (l.slice(0, i) + l.slice(i + 1) === sh) return true;
  return false;
}
/** 낱말 오타: 같은 글자 셋 이상 늘인 것(donnnt) 줄이기 · 자주 쓰는 낱말과 한 글자만 다르면 그 낱말로 (후보가 하나일 때만) */
const known = (w: string) => COMMON.has(w) || [/s$/, /es$/, /ed$/, /d$/, /ing$/, /ly$/, /er$/].some((re) => re.test(w) && COMMON.has(w.replace(re, ''))) || COMMON.has(w.replace(/ing$/, 'e')) || COMMON.has(w.replace(/ies$/, 'y'));
/** 같은 글자 셋 이상 늘인 것 줄이기 (donnnt → dont) */
const squeeze = (t: string) => t.replace(/([a-z])\1{2,}/gi, '$1');
function fixWordTypos(text: string) {
  let changed = false;
  const out = text.replace(/[A-Za-z']+/g, (w) => {
    let x = w;
    const low = x.toLowerCase();
    if (low.length >= 4 && !known(low) && !low.includes("'")) {
      const cand = [...COMMON].filter((c) => c.length >= 3 && oneEdit(low, c));
      if (cand.length === 1) x = /^[A-Z]/.test(x) ? cand[0][0].toUpperCase() + cand[0].slice(1) : cand[0];
    }
    if (x !== w) changed = true;
    return x;
  });
  return { out, changed };
}

/** 답 교정: 맞춤법 · 자주 틀리는 문법 · 대문자 · 마침표. why 는 고친 까닭 목록 */
export function aiFix(v: string, live: LiveFix[]) {
  let out = nrm(v).trim();
  const why: string[] = [];
  for (const [re, fx, w] of live)
    if (re.test(out)) {
      out = fx(out);
      why.push(w);
      break;
    }
  const sq = squeeze(out);
  let typo = sq !== out;
  out = sq;
  for (const [re, b] of AI_TYPO) {
    const y = out.replace(re, b);
    if (y !== out) {
      out = y;
      typo = true;
    }
  }
  const wt = fixWordTypos(out);
  out = wt.out;
  typo = typo || wt.changed;
  if (typo) why.push('맞춤법');
  for (const [re, b, w] of AI_GRAM) {
    const y = typeof b === 'string' ? out.replace(re, b) : out.replace(re, b as (...m: string[]) => string);
    if (y !== out) {
      out = y;
      why.push(w);
    }
  }
  const cap = capFirst(out).replace(/\bi\b/g, 'I');
  if (cap !== out && !why.length) why.push('대문자');
  out = /[.!?]$/.test(cap) ? cap : `${cap}.`;
  const same = out.replace(/[.!?]$/, '').toLowerCase() === nrm(v).trim().replace(/[.!?]$/, '').toLowerCase();
  return { text: out, why: [...new Set(why)], changed: !same || why.length > 0 };
}

/** 꼬리 질문에 짚을 말: 방금 답의 첫 문장 앞부분 (7단어까지) */
export const bitOf = (v: string) => {
  const first = nrm(v)
    .split(/[.!?]/)[0]
    .replace(/^\s*(yes|yeah|no|well|um+|uh+|so|i think|actually)[,\s]+/i, '')
    .trim();
  const w = first.split(/\s+/);
  return (w.length > 7 ? `${w.slice(0, 7).join(' ')}…` : first).replace(/^./, (c) => c.toLowerCase());
};
/** 짧은 답 꼬리 질문 — 방금 한 말을 짚어서, 질문마다 다르게 돌아가며 */
export const NUDGE: ((b: string) => [string, string])[] = [
  (b) => [`You said “${b}” — why do you feel that way?`, `“${b}” — 왜 그렇게 느껴요?`],
  (b) => [`“${b}” — can you tell me about one time that happened?`, '그런 일이 있었던 때를 하나 말해 줄래요?'],
  (b) => [`Interesting! How does “${b}” change your day?`, '그게 하루를 어떻게 바꾸나요?'],
  (b) => [`Tell me a bit more about “${b}”. What do you mean?`, '조금 더 자세히 말해 줄래요?'],
];
