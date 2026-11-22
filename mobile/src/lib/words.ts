/*
 * 영어 문장 채점 도우미 (프로토타입 normS · shKey · shLinked 와 같은 규칙).
 */

/** 소문자 · 따옴표 통일 · 문장부호 빼기 */
export const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9' ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** 카드끼리 비교할 열쇠: I'd 와 Id 를 같게 */
export const wordKey = (w: string) => normalize(w.replace(/-/g, '')).replace(/'/g, ''); // Wi-Fi → wifi

/** 음성 인식이 숫자로 적어도 낱말로 인정 */
const NUMBERS: Record<string, string> = {
  '0': 'zero',
  '1': 'one',
  '2': 'two',
  '3': 'three',
  '4': 'four',
  '5': 'five',
  '6': 'six',
  '7': 'seven',
  '8': 'eight',
  '9': 'nine',
  '10': 'ten',
  '11': 'eleven',
  '12': 'twelve',
  '13': 'thirteen',
  '14': 'fourteen',
  '15': 'fifteen',
  '20': 'twenty',
  '30': 'thirty',
  '100': 'hundred',
};
/** 말 사이 군말 — 틀린 말로 보지 않아요 */
const FILLERS = new Set(['um', 'uh', 'umm', 'uhh', 'er', 'erm', 'hmm', 'mm', 'ah', 'oh']);

/** 줄임말은 풀어서 말해도 인정 (I'd ↔ I would) — 열쇠는 wordKey 모양 */
const EXPANDED: Record<string, string[]> = {
  id: ['i would', 'i had'],
  im: ['i am'],
  ive: ['i have'],
  ill: ['i will'],
  youre: ['you are'],
  dont: ['do not'],
  doesnt: ['does not'],
  didnt: ['did not'],
  isnt: ['is not'],
  cant: ['can not', 'cannot'],
  its: ['it is'],
  thats: ['that is'],
  whats: ['what is'],
  lets: ['let us'],
};

/** 소리로는 비교가 안 되는 몇 가지만 따로 (뜻은 달라도 음성 인식이 자주 바꿔 적는 말) */
const SOUNDS_LIKE: string[][] = [
  ['a', 'uh', 'ah'],
  ['an', 'and'],
  ['ask', 'ax'],
  ['one', 'won', 'want'],
  ['wifi', 'wi', 'why'],
];
const ALIKE = new Map<string, Set<string>>();
for (const g of SOUNDS_LIKE) for (const w of g) ALIKE.set(w, new Set([...(ALIKE.get(w) ?? []), ...g]));

/**
 * 낱말의 '소리 열쇠' — 철자가 달라도 소리가 비슷하면 같은 열쇠가 나와요. 모든 낱말에 같은 규칙.
 * 1) 영어 철자 규칙: 묵음(kn · wr · gh · mb · 끝의 e), ph=f, ck=k, c 는 s/k, th · sh · ch 는 한 소리
 * 2) 한국어 말투로 자주 바뀌는 소리는 같게: r=l, v=b, f=p, z=s, th=s
 * 3) 모음은 맨 앞에만 'A' 로 남기고 나머지는 빼요 (an · on · in · Ann · Anne → AN)
 * 4) 겹친 소리는 하나로
 */
export function soundKey(word: string) {
  let x = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!x) return '';
  x = x
    .replace(/^kn|^gn|^pn/, 'n')
    .replace(/^wr/, 'r')
    .replace(/^ps/, 's')
    .replace(/^x/, 's')
    .replace(/mb$/, 'm')
    .replace(/x/g, 'ks')
    .replace(/ph/g, 'f')
    .replace(/^gh/, 'g')
    .replace(/gh/g, '')
    .replace(/tch/g, 'ch')
    .replace(/sch/g, 'sk')
    .replace(/ck/g, 'k')
    .replace(/dg/g, 'j')
    .replace(/th/g, 'S')
    .replace(/sh|ch/g, 'X')
    .replace(/wh/g, 'w')
    .replace(/c(?=[eiy])/g, 's')
    .replace(/[cq]/g, 'k')
    // 한국어 말투
    .replace(/r/g, 'l')
    .replace(/v/g, 'b')
    .replace(/f/g, 'p')
    .replace(/z/g, 's')
    .replace(/S/g, 's');
  // 모음 뒤의 w · h 는 모음처럼 (own · oh · law), 그 밖의 h 는 빼요
  x = x.replace(/([aeiouy])[wh]+/g, '$1');
  // 맨 앞 y 는 자음 (you · yes)
  const first = /^[aeiou]/.test(x) ? 'A' : '';
  const rest = (first ? x.replace(/^[aeiouy]+/, '') : x.replace(/^y/, 'Y')).replace(/(?!^)h/g, '').replace(/[aeiouy]/g, '');
  return (first + rest.toUpperCase()).replace(/(.)\1+/g, '$1');
}

/** 글자 몇 개를 바꾸면 같은 말이 되는지 (편집 거리) */
function editDistance(a: string, b: string) {
  const d = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = d[0];
    d[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = d[j];
      d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return d[b.length];
}

/**
 * 말한 낱말 s 를 정답 낱말 w 로 인정할지. 모든 낱말에 같은 규칙이에요.
 * - 철자가 같거나 소리 열쇠가 같으면 인정 (on · Ann ↔ an, right ↔ light, too ↔ to)
 * - 소리 열쇠가 3소리 이상이면 한 소리 차이까지, 6소리 이상이면 두 소리 차이까지 (iced ↔ ice, order ↔ odor)
 * - 긴 낱말은 철자 한두 글자 차이 · 앞 4글자가 같아도 인정
 * - 모음뿐인 말(a · I)과 짧은 말은 소리가 딱 같아야 해요 → I ↔ I'd, to ↔ do 는 틀림
 */
export function sameWord(s: string, w: string) {
  if (!s || !w) return false;
  if (s === w || ALIKE.get(w)?.has(s)) return true;
  const ks = soundKey(s);
  const kw = soundKey(w);
  const consonants = kw.replace(/^A/, '');
  if (!consonants) return false; // a · I · oh 처럼 모음뿐인 말은 철자로만
  if (ks === kw) return true;
  if (s.length === 1 && ks === consonants) return true; // n ↔ an (앞 모음이 안 들림)
  if (kw.length >= 3 && editDistance(ks, kw) <= (kw.length >= 6 ? 2 : 1)) return true;
  if (w.length > 3 && s.slice(0, 4) === w.slice(0, 4)) return true;
  if (w.length >= 5) return editDistance(s, w) <= (w.length >= 8 ? 2 : 1);
  return false;
}

/** 두 낱말을 붙였을 때 같은 글자인지 (끝 한 글자 빠짐까지 인정): "a nice" ↔ "an iced" */
const boundaryShift = (said: string, target: string) =>
  said === target || (said.length === target.length - 1 && target.startsWith(said)) || (soundKey(target).length >= 4 && soundKey(said) === soundKey(target));

/** spoken[j] 부터 단어 w 가 맞으면 몇 칸을 쓰는지 (안 맞으면 0) */
function matchAt(spoken: string[], j: number, w: string) {
  // 한 낱말이 둘로 나뉘어 들린 경우를 먼저: some thing ↔ something
  if (j + 1 < spoken.length && spoken[j] + spoken[j + 1] === w) return 2;
  if (sameWord(spoken[j], w)) return 1;
  // 한 낱말이 둘로 나뉘어 들린 경우: some thing ↔ something (소리로도)
  if (j + 1 < spoken.length && (spoken[j] + spoken[j + 1] === w || (soundKey(w).length >= 4 && soundKey(spoken[j] + spoken[j + 1]) === soundKey(w)))) return 2;
  for (const alt of EXPANDED[w] ?? []) {
    const parts = alt.split(' ');
    if (parts.every((p, k) => spoken[j + k] === p)) return parts.length;
  }
  return 0;
}

type Walk = { count: number; p: number };

/**
 * spoken[p] 부터 words[count] 를 차례로 맞춰 가요. 못 맞추는 낱말에서 멈춰요.
 * 사이에 다른 말이 끼면 틀린 거예요. 단, 이것들은 건너뛰어요:
 * - 음 · 어 같은 군말, 방금 맞힌 말을 다시 한 것 (더듬기)
 * - 고쳐 말하기: 바로 앞 낱말부터 다시 말한 경우 ("to have… to order")
 * - 문장 맨 앞의 잡소리 (free)
 */
function walk(spoken: string[], words: string[], p: number, count: number, opts: { forgive?: number; free?: boolean } = {}, hits: number[] = []): Walk {
  const startCount = count;
  while (count < words.length) {
    const w = wordKey(words[count]);
    if (!w) {
      count++;
      continue;
    }
    const w2 = count + 1 < words.length ? wordKey(words[count + 1]) : '';
    const matched = new Set(words.slice(0, count).map(wordKey));
    const prev = count > 0 ? wordKey(words[count - 1]) : '';
    let found = -1;
    let used = 0;
    let pair = false;
    let clean = true; // p ~ j 사이가 건너뛸 수 있는 말뿐인지
    for (let j = p; j < spoken.length; j++) {
      let u = 0;
      let pr = false;
      // 두 낱말 경계가 다르게 들린 경우: "an iced" ↔ "a nice" (I like ↔ I'd like 같은 진짜 틀림은 안 봐줘요)
      if (w2 && j + 1 < spoken.length && spoken[j] !== w && boundaryShift(spoken[j] + spoken[j + 1], w + w2)) {
        u = 2;
        pr = true;
      } else u = matchAt(spoken, j, w);
      if (u) {
        const free = opts.free && count === startCount;
        const resaid = j > 0 && !!prev && sameWord(spoken[j - 1], prev); // 앞 낱말부터 다시 말함
        if (clean || free || resaid) {
          found = j;
          used = u;
          pair = pr;
          break;
        }
      }
      if (!FILLERS.has(spoken[j]) && !matched.has(spoken[j])) clean = false;
    }
    if (found < 0) {
      // 봐주기: 같은 자리에서 여러 번 틀린 낱말(forgive)은, 바로 그 자리에서 말한 다른 말을 인정해요.
      //   조건: 앞 낱말 바로 뒤에 말했고, 그게 마지막 낱말이거나 그 뒤 낱말이 맞게 이어질 때 (latte 가 nothing 으로 들려도)
      const fits = p < spoken.length && !FILLERS.has(spoken[p]) && (!w2 || (p + 1 < spoken.length && matchAt(spoken, p + 1, w2) > 0));
      if (opts.forgive === count && fits) {
        hits.push(p);
        p += 1;
        count += 1;
        continue;
      }
      break;
    }
    for (let k = found; k < found + used; k++) hits.push(k);
    p = found + used;
    count += pair ? 2 : 1;
  }
  return { count, p };
}

/**
 * 말한 글자에서 문장 단어를 앞에서부터 순서대로 찾아, 몇 장까지 이어졌는지 세요.
 * 중간에 다른 말이 끼어도 괜찮고, 비슷한 소리는 인정해요 (sameWord).
 * - count: 앞에서부터 빠짐없이 이어진 장 수
 * - ahead: 틀린 낱말 뒤에서 맞게 말한 낱말들의 순번 (빠진 낱말만 채우면 바로 이어져요)
 * - wrongAt: 이어지지 못한 곳에서 대신 말한 단어 (said 를 띄어쓰기로 나눈 순번). 말이 거기서 끝났으면 null.
 */
export function matchSpeech(said: string, words: string[], opts: { forgive?: number } = {}) {
  const tokens = said.trim().split(/\s+/).filter(Boolean);
  // 낱말마다 열쇠 (숫자는 영어 낱말로 · 빈 열쇠는 건너뛰어요)
  const keys = tokens.map((t) => {
    const k = wordKey(t).split(' ')[0] ?? '';
    return NUMBERS[k] ?? k;
  });
  const idx = keys.map((k, i) => (k ? i : -1)).filter((i) => i >= 0);
  const spoken = idx.map((i) => keys[i]);
  const hits: number[] = []; // 앞에서부터 순서대로 맞춘 낱말들의 자리
  const { count, p } = walk(spoken, words, 0, 0, { forgive: opts.forgive, free: true }, hits);

  // 틀린 낱말 뒤도 봐요: 그 자리에 다른 말 하나를 했거나(have ↔ order) 빠뜨렸을 때, 그 뒤를 제자리에서 맞게 말했는지.
  //   순서를 바꿔 말한 건(Do you wifi have) 제자리가 아니라서 인정하지 않아요
  const ahead: number[] = [];
  let at = count + 1;
  let from = p;
  while (at < words.length && from < spoken.length) {
    // 빠뜨린 경우(from)로 보려면, 빠진 낱말이 뒤에서 나오지 않아야 해요 (나오면 순서를 바꾼 것)
    const gap = wordKey(words[at - 1]);
    const saidLater = spoken.slice(from).some((t, j) => matchAt(spoken, from + j, gap) > 0);
    const h1: number[] = [];
    const h2: number[] = [];
    const tries = [walk(spoken, words, from + 1, at, {}, h1), saidLater ? { count: at, p: from } : walk(spoken, words, from, at, {}, h2)];
    const first = tries[0].count >= tries[1].count;
    const r = first ? tries[0] : tries[1];
    if (r.count <= at) break;
    for (let k = at; k < r.count; k++) ahead.push(k);
    from = r.p;
    at = r.count + 1;
  }

  // 틀린 낱말 찾기: 음 · 어 같은 군말이나, 방금 맞힌 말을 다시 한 것(더듬기 · 고쳐 말하기)은 틀린 게 아니에요
  const already = new Set(words.slice(0, count).map(wordKey));
  let q = p;
  while (q < spoken.length && (FILLERS.has(spoken[q]) || already.has(spoken[q]))) q++;
  const wrongAt = count < words.length && q < spoken.length ? idx[q] : null;
  // 틀리게 말한 낱말 모두: 앞 순서로 봐서 어긋난 곳부터 끝까지 전부 (뒤에서 맞는 낱말을 말해도 순서가 틀렸으니 오답).
  //   군말(음 · 어)만 빼요
  const wrong: number[] = [];
  if (wrongAt != null) for (let k = q; k < spoken.length; k++) if (!hits.includes(k) && !FILLERS.has(spoken[k])) wrong.push(idx[k]);
  return { count, ahead, wrongAt, wrong, tokens };
}

export const linkedCount = (said: string, words: string[]) => matchSpeech(said, words).count;

/** 섞기 — 처음과 똑같은 순서로 나오면 뒤집어요 */
export function shuffled(n: number) {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  if (n > 1 && a.every((v, i) => v === i)) a.reverse();
  return a;
}
