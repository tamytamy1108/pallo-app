/*
 * Lv.3 · 4 코너 → 문제 목록 (프로토타입 STEP_VIEW.kwl · warm · ttalk 와 RUN34 의 exprMatch · journalSpeak · free4 · key4 · side4 · debate4 · followUp4 · better4 · swap4 · final4).
 * 문장 · 순서 · 기준은 프로토타입 그대로예요. 실제 앱은 AI 가 채점 · 칸 나누기 · 교정을 해요.
 */
import type { Lv3Unit, Lv4Unit, Unit34 } from '@/data/lessons34';
import { saveExpression } from '@/state/expressions';

import { answers, setAfter, setAns, setSide } from './store';
import { escRe, gradeWords, phraseRe, sentences } from './text';
import type { CheckRule, SayTask, Task34 } from './types';

export type CornerEnv = {
  /** 회차 열쇠 (예: '4:101') — 내 입장 · FINAL 을 묶어요 */
  uk: string;
  /** 이 단계 답 열쇠 (예: '3:101:journal') */
  key: string;
  source: string;
  noSpeak: boolean;
};
export type Corner = { kick: string; build: () => Task34[] };

const LOGAN = '#2F4E8C';
const today = () => new Date().toLocaleDateString('ko-KR');

// ================= Lv.3 #101 (v2) =================

/** 예습 ① KEYWORDS 익히기: 예문 듣고 뜻 고르기 (말하지 않아요) */
const kwl = (D: Lv3Unit): Corner => ({
  kick: 'KEYWORDS 익히기',
  build: () =>
    D.keywords.map(([w, m, ex, exKo], i, K) => ({
      type: 'pick',
      kick: `KEYWORDS 익히기 · ${i + 1}/${K.length}`,
      label: '예문을 듣고 뜻을 골라요',
      q: { en: ex, big: w, ex: [ex, exKo] },
      opts: [m, K[(i + 3) % K.length][1], K[(i + 7) % K.length][1]],
      ans: 0,
      sayAns: ex,
      noCards: true,
      mark: [ex, exKo],
    })),
});

/** 예습 ③ USEFUL EXPRESSIONS: 30초 짝 맞추기 (표현으로 예문 만들기는 TOPIC 이야기하기에서 해요 · 프로토타입 v503) */
const exprMatch = (D: Lv3Unit): Corner => ({
  kick: 'USEFUL EXPRESSIONS',
  build: () => [{ type: 'match', id: 'expr', pairs: D.topic.expr, time: 30, kick: 'USEFUL EXPRESSIONS · 30초 타임어택' }],
});

/** 빈칸 문장: 예문에서 그 낱말(어미 변화 포함)을 _____ 로 */
const blankOf = (ex: string, w: string) => ex.replace(new RegExp(`\\b${escRe(w.split(' ')[0].replace(/e$/, ''))}\\w*`, 'i'), '_____');
const shuffled = <T,>(a: T[]) => {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};

/** 본학습 ① 지난주 단어: 5초 안에 뜻 고르기 → 준비된 예문 빈칸에 알맞은 단어 넣기 */
const warm = (D: Lv3Unit): Corner => ({
  kick: '지난주 단어',
  build: () => {
    const P = D.prev;
    const W = P.map((p) => p[0]);
    const meaning: Task34[] = P.map(([w, m, ex], i) => ({
      type: 'pick',
      kick: `지난주 단어 · 뜻 ${i + 1}/${P.length}`,
      label: '뜻을 골라요',
      q: { en: w, big: w },
      limit: 5,
      opts: [m, P[(i + 1) % P.length][1], P[(i + 2) % P.length][1]],
      ans: 0,
      sayAns: ex,
      noCards: true,
    }));
    const items = shuffled(P.flatMap(([w, m, ...exs]) => exs.map((ex) => ({ w, m, ex }))));
    const blanks: Task34[] = items.map(({ w, m, ex }, i) => ({
      type: 'pick',
      kick: `지난주 단어 · 빈칸 ${i + 1}/${items.length}`,
      label: '빈칸에 알맞은 단어는?',
      q: { en: ex, blank: blankOf(ex, w) },
      keep: true,
      opts: W,
      ans: W.indexOf(w),
      sayAns: ex,
      noCards: true,
      mark: [ex, ''],
      explain: `${w} · ${m}`,
    }));
    return [...meaning, ...blanks];
  },
});

/** 본학습 ③ TOPIC 이야기하기: 꼬리 질문 → 독해 질문(답 3개 중 고르기) → 표현 칸마다 내 예문 만들기 */
const ttalk = (D: Lv3Unit): Corner => {
  const T = D.topic;
  const lineOf = (x: string) => T.lines.find(([e]) => phraseRe(x).test(e))?.[0] ?? '';
  return {
    kick: `TOPIC · ${T.title}`,
    build: () => [
      {
        type: 'say',
        kick: 'TOPIC · 꼬리 질문',
        ask: { en: T.follow[0], ko: T.follow[1] },
        minWords: 15,
        need: 0,
        model: 'Yes! I once forgot a new coworker’s name right after lunch. It was on the tip of my tongue, so I played it cool for a week.',
        prompt: '내 경험으로 3문장 이상 말해요',
      },
      ...T.check.map(([en, ko, model, wrong = []], i): Task34 => ({
        type: 'pick',
        kick: `TOPIC · 독해 질문 ${i + 1}/${T.check.length}`,
        label: '지문 내용에 맞는 답을 골라요',
        q: { en, ko },
        opts: [model, ...wrong],
        ans: 0,
        sayAns: model,
        noCards: true,
      })),
      { type: 'exprs', kick: 'TOPIC · 표현으로 예문 만들기', items: T.expr.map(([w, m]) => [w, m, lineOf(w)]), need: 3 },
    ],
  };
};

/** 복습 JOURNAL: 3칸 순서(요즘 하는 일 → 좋은 점 · 힘든 점 → 요즘 느끼는 것)를 보고 1분 말하기 → AI가 일기로 정리 + 오늘 단어 + 고칠 문장 */
/** JOURNAL: 미리 써 둔 요즘 일기 · 넣어 볼 단어 6개를 빈칸에 채워요 → 완성 글은 답으로 저장 · 표현함에 */
const journal = (D: Lv3Unit, env: CornerEnv): Corner => {
  const J = D.journal;
  return {
    kick: 'JOURNAL',
    build: () => [
      {
        type: 'fill',
        kick: 'JOURNAL · 빈칸 채우기',
        head: { k: J.title, p: J.q, m: J.ko },
        lines: J.fill,
        date: today(),
        done: (text) => {
          setAns(env.key, [text]);
          saveExpression({ en: text, ko: `JOURNAL · ${today()}`, source: `${env.source} · JOURNAL` });
        },
      },
    ],
  };
};

// ================= Lv.4 =================
const DEB_CHECKS: CheckRule[] = [
  ['주장 (I believe / I think)', /\bi (strongly )?(believe|think)\b/i],
  ['이유 (because)', /because|since/i],
  ['예시 (For example)', /for example|for instance/i],
  ['3문장 이상', (v) => sentences(v) >= 3],
];
const sideOf = (env: CornerEnv) => answers().side[env.uk];
const other = (k: 'A' | 'B') => (k === 'A' ? 'B' : 'A');

/** 예습 FREE TALK 준비: 5개 중 2개 → 1분씩 → 답 · 이유 · 예시 · 사회적 관점 칸 */
const free = (D: Lv4Unit, env: CornerEnv): Corner => ({
  kick: 'FREE TALK 준비',
  build: () => [
    {
      type: 'choose',
      kick: 'FREE TALK 준비',
      n: 2,
      items: D.free,
      msg: '1번에서 5번으로 갈수록 질문이 깊어져요 · 2개를 골라 1분씩 말해요',
      make: (idx) =>
        idx.map((qi, k) => ({
          type: 'say',
          kick: `FREE TALK 준비 · ${k + 1}/2 · 1분`,
          head: { k: `FREE TALK ${qi + 1}`, p: D.free[qi].en, m: D.free[qi].ko },
          card: { kind: 'bg', text: D.free[qi].bg },
          limit: 60,
          prompt: '답 → 이유 → 예시 → 사회적 관점(people · society)까지 가 봐요',
          split: { keys: ['choice', 'reason', 'example', 'society'] },
          save: (v) => {
            const a = [...(answers().ans[env.key] ?? [])];
            a[qi] = v;
            setAns(env.key, a);
          },
        })),
    },
  ],
});

/** 예습 KEY EXPRESSIONS: 뜻 30초 타임어택 → 표현마다 10초 즉석 문장 */
const key = (D: Lv4Unit): Corner => {
  const K = D.key;
  const parts = K.length > 6 ? [K.slice(0, 6), K.slice(6)] : [K];
  return {
    kick: 'KEY EXPRESSIONS',
    build: () => [
      ...parts.map(
        (part, j): Task34 => ({
          type: 'match',
          id: `key${j}`,
          pairs: part.map(([w, m]): [string, string] => [w, m]),
          time: 30,
          kick: `KEY EXPRESSIONS · ① 뜻 타임어택${parts.length > 1 ? (j ? ' · DEBATE' : ' · FREE TALK') : ''}`,
        }),
      ),
      ...K.map(
        ([w, m, ex], i): SayTask => ({
          type: 'say',
          kick: `KEY EXPRESSIONS · ② 즉석 문장 ${i + 1}/${K.length}`,
          head: { k: 'KEY EXPRESSION · 10초', p: w, m },
          limit: 10,
          combo: true,
          checks: [[`${w} 넣었어요`, phraseRe(w)]],
          marks: [phraseRe(w)],
          model: ex,
          modelLabel: '예문',
          alt: { type: 'pick', label: `${w}를 바르게 쓴 문장은?`, opts: [ex, ex.replace(new RegExp(escRe(w), 'i'), K[(i + 1) % K.length][0])], ans: 0 },
        }),
      ),
    ],
  };
};

/** 예습 내 입장 정하기: SITUATION 듣기 → 편 고르기 → 15초 준비 + 1분 30초 리허설 → 상대가 물을 질문 */
const side = (D: Lv4Unit, env: CornerEnv): Corner => {
  const deb = D.debate;
  const rehearse = (k: 'A' | 'B'): Task34[] => [
    {
      type: 'say',
      kick: `내 입장 · SIDE ${k} · 1분 30초 리허설`,
      head: { k: `SIDE ${k} · 1차 발언`, p: deb[k].t, m: deb[k].ko },
      prep: 15,
      limit: 90,
      need: 3,
      checks: DEB_CHECKS,
      card: { kind: 'bg', text: deb[k].arg },
      prompt: '수업처럼 1분 30초 안에 주장 → 이유 → 예시',
      ph: 'I believe ___ because ___. For example, ___.',
      save: (v) => setSide(env.uk, { side: k, text: v }),
    },
    { type: 'explain', kick: '내 입장 · 상대가 물을 질문', k: `ASK SIDE ${k}`, title: '상대편이 나에게 물을 질문', ex: (k === 'A' ? deb.askA : deb.askB).map((q): [string] => [q]), note: '답을 미리 생각해 두면 FOLLOW-UP 시간에 당황하지 않아요', go: '준비 끝' },
  ];
  return {
    kick: '내 입장 정하기',
    build: () => [
      { type: 'explain', kick: '내 입장 · SITUATION', k: 'SITUATION · 한 문장씩 소리 내어', title: deb.q, ex: deb.situation.split(/(?<=[.!?”])\s+(?=[A-Z“])/).map((x): [string, string] => [x, '']), note: deb.situationKo, listen: deb.situation },
      {
        type: 'pick',
        kick: '내 입장 · 편 고르기',
        label: '어느 편에 설까요?',
        q: { en: deb.q, ko: deb.qKo },
        keep: true,
        opts: [`A · ${deb.A.t}`, `B · ${deb.B.t}`],
        ans: -1,
        sayAns: false,
        footMsg: '수업에서는 인원에 맞춰 편이 바뀔 수도 있어요',
        explain: '좋아요! 이제 1차 발언을 리허설해요',
        then: (sel) => {
          const k = sel === 0 ? 'A' : 'B';
          setSide(env.uk, { side: k, text: '' });
          return rehearse(k);
        },
      },
    ],
  };
};

/** 본학습 DEBATE: AI Logan 상대 · 1차 주장 1분 → 반박 20 · 15 · 10초 → 재반박 20초 → 정리 30초 → 점수 + MVP */
const debTasks = (D: Lv4Unit, env: CornerEnv, my: 'A' | 'B'): Task34[] => {
  const deb = D.debate;
  const op = other(my);
  const K = deb.dkey ? D.key.slice(-deb.dkey) : D.key;
  const keyRe = K.map(([w]) => phraseRe(w));
  const opArg = deb[op].arg.split(/(?<=[.!?])\s+/);
  const ask = my === 'A' ? deb.askA : deb.askB;
  const R = (n: string, sec: number, ctxEn: string, ctxKo: string): SayTask => ({
    type: 'say',
    deb: true,
    kick: `DEBATE · ${n}`,
    ask: { who: 'Logan', c: LOGAN, en: ctxEn, ko: ctxKo },
    limit: sec,
    need: 1,
    marks: keyRe,
    listen: ctxEn,
    checks: [
      ['상대 말 받기 (I see · but · however)', /\b(i see|but|however|fair point|i understand|i agree|i disagree|be that as it may)\b/i],
      ['근거 (because)', /because|since|for example/i],
      ['KEY 표현', (v) => keyRe.some((re) => re.test(v))],
    ],
  });
  return [
    {
      type: 'say',
      deb: true,
      kick: 'DEBATE · ① 1차 주장 · 1분',
      head: { k: `나는 SIDE ${my}`, p: deb[my].t, m: deb.q },
      limit: 60,
      need: 3,
      checks: DEB_CHECKS,
      marks: keyRe,
      model: sideOf(env)?.text || undefined,
      modelLabel: '예습 때 준비한 발언',
      ph: 'I believe ___ because ___. For example, ___.',
    },
    R('② 반박 배틀 · 20초', 20, `I'm on side ${op}. ${opArg[0]} ${opArg[1] || ''}`, deb[op].ko ? `SIDE ${op} · ${deb[op].ko}` : `SIDE ${op} · ${deb[op].t}`),
    R('③ 반박 배틀 · 15초', 15, ask[0], '상대 질문에 바로 답해요'),
    R('④ 반박 배틀 · 10초', 10, ask[1], '짧고 분명하게'),
    R('⑤ 재반박 · 20초', 20, opArg[2] || opArg[opArg.length - 1], '상대 마지막 주장을 받아쳐요'),
    {
      type: 'say',
      deb: true,
      kick: 'DEBATE · ⑥ 최종 정리 · 30초',
      head: { k: 'CLOSING', p: 'To sum up, …', m: '내 주장을 한 번 더 · 왜 이겼는지' },
      limit: 30,
      need: 1,
      checks: [
        ['정리 (To sum up / In conclusion)', /\b(to sum up|in conclusion|overall|that's why|all in all)\b/i],
        ['KEY 표현', (v) => keyRe.some((re) => re.test(v))],
      ],
      marks: keyRe,
      model: `To sum up, ${my === 'A' ? 'regulated sales protect sellers better than a ban, which only drives sales underground.' : 'financial pressure can jeopardize real consent, so organ sales should stay illegal.'}`,
    },
    { type: 'score', kick: 'DEBATE · 결과', keys: K.map((k) => k[0]) },
  ];
};
const debate = (D: Lv4Unit, env: CornerEnv): Corner => ({
  kick: 'DEBATE',
  build: () => {
    const deb = D.debate;
    const my = sideOf(env)?.side;
    const intro: Task34 = {
      type: 'explain',
      kick: 'DEBATE · AI 3라운드',
      k: 'HOW TO',
      title: '1차 주장 → 반박 20 · 15 · 10초 → 재반박 → 최종 정리',
      body: 'AI Logan이 상대편이에요. 반박 시간에는 새 주장 대신 **들은 말 하나**를 골라 받아쳐요. 끝나면 논리 · 근거 · 표현 · 유창성 점수와 MVP 문장이 나와요.',
      note: env.noSpeak ? '말하기가 어려워요 · 시간 없이 글로 반박해요' : '',
      go: '토론 시작',
    };
    const sidePick: Task34 = {
      type: 'pick',
      kick: 'DEBATE · 편 고르기',
      label: '예습에서 편을 고르지 않았어요 · 어느 편에 설까요?',
      q: { en: deb.q, ko: deb.qKo },
      keep: true,
      opts: [`A · ${deb.A.t}`, `B · ${deb.B.t}`],
      ans: -1,
      sayAns: false,
      explain: '좋아요! 토론을 시작해요',
      then: (sel) => {
        const k = sel === 0 ? 'A' : 'B';
        setSide(env.uk, { side: k, text: '' });
        return debTasks(D, env, k);
      },
    };
    return my ? [intro, ...debTasks(D, env, my)] : [intro, sidePick];
  },
});

/** 본학습 FOLLOW-UP: 상대를 흔들 질문 → 날카로움 1~5 → 상대 질문에 1분 답 */
const followUp = (D: Lv4Unit, env: CornerEnv): Corner => ({
  kick: 'FOLLOW-UP 질문 만들기',
  build: () => {
    const deb = D.debate;
    const my = sideOf(env)?.side || 'A';
    const op = other(my);
    const opWords = deb[op].arg.toLowerCase().match(/[a-z]{5,}/g) || [];
    const reply = deb.reply?.[op] || 'That’s a fair question. Let me think about it.';
    const U = deb.useful;
    const askOp = op === 'A' ? deb.askA : deb.askB;
    const askMy = my === 'A' ? deb.askA : deb.askB;
    return [
      {
        type: 'say',
        kick: 'FOLLOW-UP · ① 상대를 흔들 질문',
        head: { k: `상대 SIDE ${op}`, p: deb[op].t, m: '상대 주장의 약한 곳을 묻는 질문을 말로 만들어요' },
        card: { kind: 'bg', text: deb[op].arg },
        need: 0,
        checks: [
          ['질문 형태', /\?|^(what|why|how|if|should|would|do|does|is|can|who|wouldn't|isn't)\b/i],
          ['상대 주장의 말을 짚었어요', (v) => opWords.some((w) => v.toLowerCase().includes(w))],
          ['가정 · 조건 (If / What if)', /\b(if|what if|what would)\b/i],
          ['KEY 표현', (v) => D.key.some(([w]) => phraseRe(w).test(v))],
        ],
        ph: 'If ___, how would you ___?',
        model: askOp[0],
        modelLabel: '교재 질문 예시',
        save: (_v, { checksOn }) => ({ extra: { kind: 'sharp', n: 1 + checksOn, who: 'Logan', c: LOGAN, en: reply, ko: `SIDE ${op}가 답해요` } }),
      },
      {
        type: 'say',
        kick: 'FOLLOW-UP · ② 상대 질문에 1분 안에 답하기',
        ask: { who: 'Logan', c: LOGAN, en: askMy[2], ko: '상대편 질문이에요' },
        listen: askMy[2],
        limit: 60,
        need: 2,
        checks: DEB_CHECKS.slice(1).concat([['질문에 바로 답했어요 (Yes / No / I think)', /^(yes|no|well|i think|i believe|honestly|that's)/i]], U ? [[`USEFUL LINE (${U[0]})`, /be that as it may/i]] : []),
        card: U ? { kind: 'useful', label: `USEFUL LINE · ${U[2]}`, en: U[1] } : undefined,
      },
    ];
  },
});

/** 복습 SAY IT BETTER: 평소 표현 듣고 5초 안에 업그레이드 (5개 연속 콤보) */
const better = (D: Lv4Unit): Corner => ({
  kick: 'SAY IT BETTER 즉시 변환',
  build: () =>
    D.better.map(
      ([plain, up], i, B): SayTask => ({
        type: 'say',
        kick: `SAY IT BETTER · ${i + 1}/${B.length}`,
        startIn: 5,
        combo: true,
        listen: plain,
        card: { kind: 'plain', label: '평소 표현', en: plain },
        prompt: '5초 안에 업그레이드 표현으로 바꿔 말해요 · 5개 연속 도전',
        exact: true,
        checks: [['업그레이드 표현', (v) => gradeWords(v, up).score >= 0.6]],
        model: up,
        modelLabel: 'SAY IT BETTER',
        alt: { type: 'pick', label: '업그레이드 표현은?', q: { en: plain }, opts: [up, plain, B[(i + 2) % B.length][1]], ans: 0, combo: true },
      }),
    ),
});

/** 복습 편 바꾸기: 반대편으로 15초 준비 + 1분 발언 */
const swap = (D: Lv4Unit, env: CornerEnv): Corner => ({
  kick: '편 바꾸기',
  build: () => {
    const deb = D.debate;
    const my = sideOf(env)?.side || 'A';
    const op = other(my);
    return [
      {
        type: 'say',
        kick: `편 바꾸기 · 이번엔 SIDE ${op} · 1분`,
        head: { k: `원래 SIDE ${my} → 이번엔 SIDE ${op}`, p: deb[op].t, m: '반대편으로 1분 발언 · 생각의 폭 넓히기' },
        card: { kind: 'bg', text: deb[op].arg },
        prep: 15,
        limit: 60,
        need: 3,
        checks: DEB_CHECKS,
        ph: 'Even though I disagree, I believe ___ because ___.',
        alt: { type: 'pick', label: `SIDE ${op}의 근거로 알맞은 것은?`, opts: [deb[op].arg.split(/(?<=[.!?])\s+/)[0], deb[my].arg.split(/(?<=[.!?])\s+/)[0]], ans: 0 },
      },
    ];
  },
});

/** 복습 FINAL POSITION: 처음 ↔ 지금 입장 1분 → 보너스 즉흥 룰렛 (처음 보는 토픽 15초 + 1분) */
const ROULETTE = [
  { en: 'Should homework be banned?', ko: '숙제를 없애야 할까요?' },
  { en: 'Is social media doing more harm than good?', ko: 'SNS는 득보다 실이 클까요?' },
  { en: 'Should tipping be required everywhere?', ko: '팁을 어디서나 의무로 해야 할까요?' },
  { en: 'Would you rather live 100 years ago or 100 years from now?', ko: '100년 전과 100년 후, 어디서 살래요?' },
];
const finalPos = (D: Lv4Unit, env: CornerEnv): Corner => ({
  kick: 'FINAL POSITION',
  build: () => {
    const deb = D.debate;
    const B = sideOf(env);
    return [
      {
        type: 'say',
        kick: 'FINAL POSITION · 처음 ↔ 지금',
        head: { k: 'FINAL MISSION', p: deb.q, m: deb.qKo },
        card: B ? { kind: 'before', label: `예습 때 내 입장 · SIDE ${B.side}`, text: B.text || deb[B.side].t } : undefined,
        limit: 60,
        need: 2,
        checks: [
          ['처음 (At first I thought)', /\b(at first|before|i used to)\b/i],
          ['지금 (Now I think / I still think)', /\b(now|still|changed my mind)\b/i],
          ['이유 (because)', /because|since/i],
        ],
        ph: 'At first, I thought ___. Now I think ___ because ___.',
        save: (v) => setAfter(`${env.uk}:final`, v),
      },
      { type: 'say', kick: '보너스 · 즉흥 룰렛', head: { k: 'BONUS', p: '처음 보는 토픽 · 15초 준비 → 1분', m: '' }, roulette: ROULETTE.map((r) => ({ ...r, ko: '' })), prep: 15, limit: 60, need: 2, checks: DEB_CHECKS.slice(0, 3) },
    ];
  },
});

/** 코너 id → 문제 목록 (진행기로 푸는 코너만 · 나머지는 단계 화면) */
export function corner34(u: Unit34, id: string, env: CornerEnv): Corner | null {
  if (u.lv === 3) {
    const L3: Record<string, (D: Lv3Unit, env: CornerEnv) => Corner> = { kwl, match: exprMatch, warm, ttalk, journal };
    return L3[id]?.(u.D, env) ?? null;
  }
  const L4: Record<string, (D: Lv4Unit, env: CornerEnv) => Corner> = { free, key, side, deb: debate, fq: followUp, better, swap, final: finalPos };
  return L4[id]?.(u.D, env) ?? null;
}
