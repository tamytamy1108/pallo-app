/**
 * Lv.0 HELLO ENGLISH (왕기초) — 1 · 2과 가짜 데이터. 값은 교재 「PALLO Lv.0 HELLO ENGLISH」 1권 그대로예요.
 * 한 과 = ⓪ 키워드 → ① 퍼즐 시범 → ② Our Story → ③ 스스로 변형하기 → ④ 문장 연습 (+ 프리토킹).
 * 앱에서는 예습(키워드 · 퍼즐) · 본학습(Our Story · 스스로 변형하기) · 복습(문장 연습 · 프리토킹)으로 나눠요 (STUDY_STEPS.basic).
 * 맞는 API: 18 `/lessons/:id` (id = '0-과'). 실제 앱은 서버에서 받아요.
 * 교재에 영어 정답이 없는 칸(스스로 변형하기 · 프리토킹 예시 답)은 교재 규칙대로 채웠어요.
 */
import type { StageKey, Step } from '@/data/library';
import type { AnswerTask, BuildTask, MatchTask, PickTask, ShadowTask, Task } from '@/data/lessons';

/** 단어 · 문장 한 줄: [영어, 한글 발음, 뜻] */
export type Line0 = [string, string, string];

/** 동사 세 가지 (교재 「동사 한눈에 보기」) */
export type VerbKind = 'be' | 'gen' | 'aux';
export const VERB_KO: Record<VerbKind, string> = { be: 'be동사', gen: '일반동사', aux: '조동사' };

/** 퍼즐 한 칸: 변형 이름 · 빈칸 문장(___) · 정답 · 바뀌는 곳 설명 */
export type PuzzleRow = { label: string; q: string; ans: string; tip: string };
/** 오늘의 퍼즐 (진행자 시범): 기본 문장 하나 → 변형마다 빈칸 */
export type Puzzle = { kind: VerbKind; base: Line0; rows: PuzzleRow[] };

/** Our Story 질문 하나: 질문 · 발음 · 뜻 · 어떤 변형인지 · 예시 답 */
export type StoryQ = { en: string; pron: string; ko: string; tag: string; ex: string };

/** 스스로 변형하기 한 칸: [변형 이름, 우리말, 영어] */
export type SelfRow = [string, string, string];
/** 스스로 변형하기 묶음 (① 현재 · I ② 과거 · I ③ 현재 · She ④ 과거 · She ⑤ 명령문) */
export type SelfGrid = { title: string; rows: SelfRow[] };

export type Lesson0 = {
  lv: 0;
  unit: number;
  title: string;
  titleKo: string;
  /** 오늘의 키워드 15 (명사 · 동사 · 형용사 5개씩) */
  words: { noun: Line0[]; verb: Line0[]; adj: Line0[] };
  puzzles: Puzzle[];
  story: StoryQ[];
  self: SelfGrid[];
  /** 문장 연습 25 */
  drill: Line0[];
  /** 프리토킹 질문 + 예시 답 */
  free: Line0[];
  /** 프리토킹 예시 답 (질문 순서대로) */
  freeEx: string[];
};

/* ───────────── 1과 Nice to meet you! ───────────── */

const LV0_01: Lesson0 = {
  lv: 0,
  unit: 1,
  title: 'Nice to meet you!',
  titleKo: '처음 만나서 반가워요',
  words: {
    noun: [
      ['Bread', '브레드', '빵'],
      ['Fish', '피시', '생선'],
      ['Movie', '무비', '영화'],
      ['Friend', '프렌드', '친구'],
      ['Breakfast', '브렉퍼스트', '아침밥'],
    ],
    verb: [
      ['Eat', '잇', '먹다'],
      ['Swim', '스윔', '수영하다'],
      ['Watch', '워치', '보다'],
      ['Meet', '밋', '만나다'],
      ['Study', '스터디', '공부하다'],
    ],
    adj: [
      ['Happy', '해피', '행복한'],
      ['Tired', '타이얼드', '피곤한'],
      ['Busy', '비지', '바쁜'],
      ['Glad', '글래드', '기쁜'],
      ['Nice', '나이스', '좋은 · 친절한'],
    ],
  },
  puzzles: [
    {
      kind: 'be',
      base: ['I am happy.', '아이 엠 해피', '나는 행복해요.'],
      rows: [
        { label: '부정', q: 'I am ___ happy.', ans: 'not', tip: 'be동사 뒤에 not' },
        { label: '의문', q: '___ you happy?', ans: 'Are', tip: 'be동사를 맨 앞으로' },
        { label: '의문사', q: '___ are you happy?', ans: 'Why', tip: '의문사를 맨 앞에' },
        { label: '주어', q: 'She ___ happy.', ans: 'is', tip: 'He · She · It → is' },
        { label: '과거', q: 'I ___ happy.', ans: 'was', tip: 'am · is → was' },
        { label: '미래', q: 'I ___ happy.', ans: 'will be', tip: 'will + be' },
      ],
    },
    {
      kind: 'gen',
      base: ['I study English.', '아이 스터디 잉글리시', '나는 영어를 공부해요.'],
      rows: [
        { label: '부정', q: 'I ___ study English.', ans: 'don’t', tip: 'don’t + 동사원형' },
        { label: '의문', q: '___ you study English?', ans: 'Do', tip: 'Do를 맨 앞으로' },
        { label: '의문사', q: '___ do you study English?', ans: 'Why', tip: '의문사 + do you ~?' },
        { label: '주어', q: 'She ___ English.', ans: 'studies', tip: 'He · She · It → 동사 + s' },
        { label: '과거', q: 'I ___ English.', ans: 'studied', tip: '과거형 (불규칙은 부록)' },
        { label: '미래', q: 'I ___ study English.', ans: 'will', tip: 'will + 동사원형' },
        { label: '진행', q: 'I am ___ English.', ans: 'studying', tip: 'be + 동사ing' },
      ],
    },
    {
      kind: 'aux',
      base: ['I can speak English.', '아이 캔 스픽 잉글리시', '나는 영어를 말할 수 있어요.'],
      rows: [
        { label: '부정', q: 'I ___ speak English.', ans: 'can’t', tip: 'can + not' },
        { label: '의문', q: '___ you speak English?', ans: 'Can', tip: 'Can을 맨 앞으로' },
        { label: '주어', q: 'She ___ speak English.', ans: 'can', tip: 'can은 그대로' },
      ],
    },
  ],
  story: [
    { en: 'How are you today?', pron: '하우 아 유 투데이?', ko: '오늘 기분 어때요?', tag: '기본 문장 · be동사', ex: 'I am happy today.' },
    { en: 'What do you eat for breakfast?', pron: '왓 두 유 잇 포 브렉퍼스트?', ko: '아침으로 무엇을 먹어요?', tag: '기본 문장 · 일반동사', ex: 'I eat bread for breakfast.' },
    { en: 'What can you do?', pron: '왓 캔 유 두?', ko: '무엇을 할 수 있어요?', tag: '기본 문장 · 조동사', ex: 'I can swim.' },
    { en: 'What don’t you eat?', pron: '왓 돈츄 잇?', ko: '무엇을 안 먹어요?', tag: '부정', ex: 'I don’t eat fish.' },
    { en: 'What did you do yesterday?', pron: '왓 디쥬 두 예스터데이?', ko: '어제 무엇을 했어요?', tag: '과거', ex: 'I watched a movie yesterday.' },
    { en: 'What will you do this weekend?', pron: '왓 윌 유 두 디스 위켄드?', ko: '이번 주말에 무엇을 할 거예요?', tag: '미래', ex: 'I will meet my friend.' },
    { en: 'What are you doing now?', pron: '왓 아 유 두잉 나우?', ko: '지금 무엇을 하고 있어요?', tag: '진행', ex: 'I am studying English.' },
  ],
  self: [
    {
      title: '① 현재 · 주어 I',
      rows: [
        ['기본 문장', '나는 영어를 공부한다.', 'I study English.'],
        ['부정하기', '나는 영어를 공부하지 않는다.', 'I don’t study English.'],
        ['물어보기', '나는 영어를 공부하니?', 'Do I study English?'],
        ['의문사 물어보기', '나는 왜 영어를 공부하니?', 'Why do I study English?'],
        ['목적어 바꾸기 → Japanese', '나는 일본어를 공부한다.', 'I study Japanese.'],
        ['동사 바꾸기 → like', '나는 영어를 좋아한다.', 'I like English.'],
        ['진행형 (be + ing)', '나는 영어를 공부하고 있다.', 'I am studying English.'],
        ['조동사 will', '나는 영어를 공부할 것이다.', 'I will study English.'],
      ],
    },
    {
      title: '② 과거 · 주어 I',
      rows: [
        ['기본 문장', '나는 영어를 공부했다.', 'I studied English.'],
        ['부정하기', '나는 영어를 공부하지 않았다.', 'I didn’t study English.'],
        ['물어보기', '나는 영어를 공부했니?', 'Did I study English?'],
        ['의문사 물어보기', '나는 왜 영어를 공부했니?', 'Why did I study English?'],
        ['목적어 바꾸기 → Japanese', '나는 일본어를 공부했다.', 'I studied Japanese.'],
        ['동사 바꾸기 → like', '나는 영어를 좋아했다.', 'I liked English.'],
        ['진행형 (be + ing)', '나는 영어를 공부하고 있었다.', 'I was studying English.'],
      ],
    },
    {
      title: '③ 현재 · 주어 She',
      rows: [
        ['기본 문장', '그녀는 영어를 공부한다.', 'She studies English.'],
        ['부정하기', '그녀는 영어를 공부하지 않는다.', 'She doesn’t study English.'],
        ['물어보기', '그녀는 영어를 공부하니?', 'Does she study English?'],
        ['의문사 물어보기', '그녀는 왜 영어를 공부하니?', 'Why does she study English?'],
        ['목적어 바꾸기 → Japanese', '그녀는 일본어를 공부한다.', 'She studies Japanese.'],
        ['동사 바꾸기 → like', '그녀는 영어를 좋아한다.', 'She likes English.'],
        ['진행형 (be + ing)', '그녀는 영어를 공부하고 있다.', 'She is studying English.'],
        ['조동사 will', '그녀는 영어를 공부할 것이다.', 'She will study English.'],
      ],
    },
    {
      title: '④ 과거 · 주어 She',
      rows: [
        ['기본 문장', '그녀는 영어를 공부했다.', 'She studied English.'],
        ['부정하기', '그녀는 영어를 공부하지 않았다.', 'She didn’t study English.'],
        ['물어보기', '그녀는 영어를 공부했니?', 'Did she study English?'],
        ['의문사 물어보기', '그녀는 왜 영어를 공부했니?', 'Why did she study English?'],
        ['목적어 바꾸기 → Japanese', '그녀는 일본어를 공부했다.', 'She studied Japanese.'],
        ['동사 바꾸기 → like', '그녀는 영어를 좋아했다.', 'She liked English.'],
        ['진행형 (be + ing)', '그녀는 영어를 공부하고 있었다.', 'She was studying English.'],
      ],
    },
    {
      title: '⑤ 명령문 · 주어 없이 동사원형',
      rows: [
        ['명령문', '영어를 공부해라.', 'Study English.'],
        ['부정 명령문', '영어를 공부하지 마라.', 'Don’t study English.'],
      ],
    },
  ],
  drill: [
    ['I can’t wait!', '아이 캔트 웨잇', '너무 기대돼요!'],
    ['Did you walk here?', '디드 유 웍 히얼?', '여기까지 걸어왔어요?'],
    ['She is making coffee.', '쉬 이즈 메이킹 커피', '그녀는 커피를 만들고 있어요.'],
    ['Did she meet him yesterday?', '디드 쉬 미트 힘 예스터데이?', '그녀가 어제 그를 만났나요?'],
    ['What does she like?', '왓 더즈 쉬 라이크?', '그녀는 무엇을 좋아하나요?'],
    ['You don’t watch TV.', '유 돈트 워치 티비', '당신은 TV를 안 보네요.'],
    ['How long have you lived here?', '하우 롱 해브 유 리브드 히얼?', '여기서 얼마나 오래 살았어요?'],
    ['We are neighbors.', '위 알 네이버스', '우리는 이웃이에요.'],
    ['I live near here.', '아이 리브 니얼 히얼', '저는 이 근처에 살아요.'],
    ['What are you doing?', '왓 알 유 두잉?', '뭐 하고 있어요?'],
    ['Nice to meet you.', '나이스 투 미트 유', '만나서 반가워요.'],
    ['I am glad to be here.', '아이 엠 글래드 투 비 히얼', '여기 와서 기뻐요.'],
    ['My name is Minji.', '마이 네임 이즈 민지', '제 이름은 민지예요.'],
    ['Are you tired today?', '알 유 타이얼드 투데이?', '오늘 피곤하세요?'],
    ['I eat bread for breakfast.', '아이 잇 브레드 포 브렉퍼스트', '저는 아침으로 빵을 먹어요.'],
    ['She doesn’t eat fish.', '쉬 더즌트 잇 피쉬', '그녀는 생선을 안 먹어요.'],
    ['Do you swim?', '두 유 스윔?', '수영하세요?'],
    ['We met last year.', '위 멧 라스트 이얼', '우리는 작년에 만났어요.'],
    ['I will study English every day.', '아이 윌 스터디 잉글리쉬 에브리 데이', '저는 매일 영어를 공부할 거예요.'],
    ['He is watching a movie.', '히 이즈 워칭 어 무비', '그는 영화를 보고 있어요.'],
    ['I am busy today.', '아이 엠 비지 투데이', '저는 오늘 바빠요.'],
    ['Do you like movies?', '두 유 라이크 무비즈?', '영화 좋아하세요?'],
    ['She is my friend.', '쉬 이즈 마이 프렌드', '그녀는 제 친구예요.'],
    ['I don’t eat breakfast.', '아이 돈트 잇 브렉퍼스트', '저는 아침을 안 먹어요.'],
    ['Can you swim?', '캔 유 스윔?', '수영할 수 있어요?'],
  ],
  free: [
    ['What makes you happy?', '왓 메익스 유 해피?', '무엇이 당신을 행복하게 해요?'],
    ['Why do you study English?', '와이 두 유 스터디 잉글리쉬?', '왜 영어를 공부해요?'],
  ],
  freeEx: ['My friends make me happy.', 'I study English for my trip.'],
};

/* ───────────── 2과 How is your day? ───────────── */

const LV0_02: Lesson0 = {
  lv: 0,
  unit: 2,
  title: 'How is your day?',
  titleKo: '오늘 컨디션 어때요?',
  words: {
    noun: [
      ['Water', '워터', '물'],
      ['Coffee', '커피', '커피'],
      ['Bed', '베드', '침대'],
      ['Class', '클래스', '수업'],
      ['Head', '헤드', '머리'],
    ],
    verb: [
      ['Sleep', '슬립', '자다'],
      ['Drink', '드링크', '마시다'],
      ['Rest', '레스트', '쉬다'],
      ['Walk', '웍', '걷다'],
      ['Feel', '필', '느끼다'],
    ],
    adj: [
      ['Sleepy', '슬리피', '졸린'],
      ['Sick', '식', '아픈'],
      ['Good', '굿', '좋은'],
      ['Fine', '파인', '괜찮은'],
      ['Awake', '어웨이크', '깨어 있는'],
    ],
  },
  puzzles: [
    {
      kind: 'be',
      base: ['I am sleepy.', '아이 엠 슬리피', '나는 졸려요.'],
      rows: [
        { label: '부정', q: 'I am ___ sleepy.', ans: 'not', tip: 'be동사 뒤에 not' },
        { label: '의문', q: '___ you sleepy?', ans: 'Are', tip: 'be동사를 맨 앞으로' },
        { label: '의문사', q: '___ are you sleepy?', ans: 'Why', tip: '의문사를 맨 앞에' },
        { label: '주어', q: 'She ___ sleepy.', ans: 'is', tip: 'He · She · It → is' },
        { label: '과거', q: 'I ___ sleepy.', ans: 'was', tip: 'am · is → was' },
        { label: '미래', q: 'I ___ sleepy.', ans: 'will be', tip: 'will + be' },
      ],
    },
    {
      kind: 'gen',
      base: ['I drink water.', '아이 드링크 워터', '나는 물을 마셔요.'],
      rows: [
        { label: '부정', q: 'I ___ drink water.', ans: 'don’t', tip: 'don’t + 동사원형' },
        { label: '의문', q: '___ you drink water?', ans: 'Do', tip: 'Do를 맨 앞으로' },
        { label: '의문사', q: '___ do you drink water?', ans: 'When', tip: '의문사 + do you ~?' },
        { label: '주어', q: 'She ___ water.', ans: 'drinks', tip: 'He · She · It → 동사 + s' },
        { label: '과거', q: 'I ___ water.', ans: 'drank', tip: '과거형 (drink → drank 불규칙)' },
        { label: '미래', q: 'I ___ drink water.', ans: 'will', tip: 'will + 동사원형' },
        { label: '진행', q: 'I am ___ water.', ans: 'drinking', tip: 'be + 동사ing' },
        { label: '명령', q: '___ water.', ans: 'Drink', tip: '주어 없이 동사원형' },
      ],
    },
    {
      kind: 'aux',
      base: ['I can walk.', '아이 캔 웍', '나는 걸을 수 있어요.'],
      rows: [
        { label: '부정', q: 'I ___ walk.', ans: 'can’t', tip: 'can + not' },
        { label: '의문', q: '___ you walk?', ans: 'Can', tip: 'Can을 맨 앞으로' },
        { label: '주어', q: 'She ___ walk.', ans: 'can', tip: 'can은 그대로' },
      ],
    },
  ],
  story: [
    { en: 'How is your day today?', pron: '하우 이즈 유어 데이 투데이?', ko: '오늘 하루 어때요?', tag: '기본 문장 · be동사', ex: 'My day is good.' },
    { en: 'What do you drink in the morning?', pron: '왓 두 유 드링크 인 더 모닝?', ko: '아침에 무엇을 마셔요?', tag: '기본 문장 · 일반동사', ex: 'I drink coffee in the morning.' },
    { en: 'What can you do for your health?', pron: '왓 캔 유 두 포 유어 헬스?', ko: '건강을 위해 무엇을 할 수 있어요?', tag: '기본 문장 · 조동사', ex: 'I can walk every day.' },
    { en: 'What don’t you drink at night?', pron: '왓 돈츄 드링크 앳 나잇?', ko: '밤에 무엇을 안 마셔요?', tag: '부정', ex: 'I don’t drink coffee at night.' },
    { en: 'How did you sleep last night?', pron: '하우 디쥬 슬립 래스트 나잇?', ko: '어젯밤에 잘 잤어요?', tag: '과거', ex: 'I slept well.' },
    { en: 'What will you do after class?', pron: '왓 윌 유 두 애프터 클래스?', ko: '수업 끝나고 무엇을 할 거예요?', tag: '미래', ex: 'I will rest at home.' },
    { en: 'What are you drinking now?', pron: '왓 아 유 드링킹 나우?', ko: '지금 무엇을 마시고 있어요?', tag: '진행', ex: 'I am drinking water.' },
  ],
  self: [
    {
      title: '① 현재 · 주어 I',
      rows: [
        ['기본 문장', '나는 물을 마신다.', 'I drink water.'],
        ['부정하기', '나는 물을 마시지 않는다.', 'I don’t drink water.'],
        ['물어보기', '나는 물을 마시니?', 'Do I drink water?'],
        ['의문사 물어보기', '나는 언제 물을 마시니?', 'When do I drink water?'],
        ['목적어 바꾸기 → tea', '나는 차를 마신다.', 'I drink tea.'],
        ['동사 바꾸기 → want', '나는 물을 원한다.', 'I want water.'],
        ['진행형 (be + ing)', '나는 물을 마시고 있다.', 'I am drinking water.'],
        ['조동사 will', '나는 물을 마실 것이다.', 'I will drink water.'],
      ],
    },
    {
      title: '② 과거 · 주어 I',
      rows: [
        ['기본 문장', '나는 물을 마셨다.', 'I drank water.'],
        ['부정하기', '나는 물을 마시지 않았다.', 'I didn’t drink water.'],
        ['물어보기', '나는 물을 마셨니?', 'Did I drink water?'],
        ['의문사 물어보기', '나는 언제 물을 마셨니?', 'When did I drink water?'],
        ['목적어 바꾸기 → tea', '나는 차를 마셨다.', 'I drank tea.'],
        ['동사 바꾸기 → want', '나는 물을 원했다.', 'I wanted water.'],
        ['진행형 (be + ing)', '나는 물을 마시고 있었다.', 'I was drinking water.'],
      ],
    },
    {
      title: '③ 현재 · 주어 She',
      rows: [
        ['기본 문장', '그녀는 물을 마신다.', 'She drinks water.'],
        ['부정하기', '그녀는 물을 마시지 않는다.', 'She doesn’t drink water.'],
        ['물어보기', '그녀는 물을 마시니?', 'Does she drink water?'],
        ['의문사 물어보기', '그녀는 언제 물을 마시니?', 'When does she drink water?'],
        ['목적어 바꾸기 → tea', '그녀는 차를 마신다.', 'She drinks tea.'],
        ['동사 바꾸기 → want', '그녀는 물을 원한다.', 'She wants water.'],
        ['진행형 (be + ing)', '그녀는 물을 마시고 있다.', 'She is drinking water.'],
        ['조동사 will', '그녀는 물을 마실 것이다.', 'She will drink water.'],
      ],
    },
    {
      title: '④ 과거 · 주어 She',
      rows: [
        ['기본 문장', '그녀는 물을 마셨다.', 'She drank water.'],
        ['부정하기', '그녀는 물을 마시지 않았다.', 'She didn’t drink water.'],
        ['물어보기', '그녀는 물을 마셨니?', 'Did she drink water?'],
        ['의문사 물어보기', '그녀는 언제 물을 마셨니?', 'When did she drink water?'],
        ['목적어 바꾸기 → tea', '그녀는 차를 마셨다.', 'She drank tea.'],
        ['동사 바꾸기 → want', '그녀는 물을 원했다.', 'She wanted water.'],
        ['진행형 (be + ing)', '그녀는 물을 마시고 있었다.', 'She was drinking water.'],
      ],
    },
    {
      title: '⑤ 명령문 · 주어 없이 동사원형',
      rows: [
        ['명령문', '물을 마셔라.', 'Drink water.'],
        ['부정 명령문', '물을 마시지 마라.', 'Don’t drink water.'],
      ],
    },
  ],
  drill: [
    ['I don’t know his name.', '아이 돈트 노우 히즈 네임', '저는 그의 이름을 몰라요.'],
    ['Is he old?', '이즈 히 올드?', '그는 나이가 많나요?'],
    ['I won’t be late.', '아이 워운트 비 레잇', '늦지 않을게요.'],
    ['Do you want more?', '두 유 원트 모얼?', '더 원하세요?'],
    ['We watched a movie last night.', '위 워치트 어 무비 라스트 나잇', '우리는 어젯밤에 영화를 봤어요.'],
    ['She should see a doctor.', '쉬 슈드 씨 어 닥터', '그녀는 병원에 가 보는 게 좋아요.'],
    ['When does the class start?', '웬 더즈 더 클래스 스타트?', '수업이 언제 시작하나요?'],
    ['You study hard.', '유 스터디 하드', '당신은 열심히 공부하네요.'],
    ['You slept in the car.', '유 슬렙트 인 더 카', '당신은 차에서 잤어요.'],
    ['Are they brothers?', '알 데이 브라더스?', '그들은 형제인가요?'],
    ['I am sleepy now.', '아이 엠 슬리피 나우', '저는 지금 졸려요.'],
    ['Are you sick?', '알 유 씩?', '아프세요?'],
    ['I feel good today.', '아이 필 굳 투데이', '오늘 기분이 좋아요.'],
    ['He doesn’t drink water.', '히 더즌트 드링크 워러', '그는 물을 안 마셔요.'],
    ['Did you sleep late?', '디드 유 슬립 레잇?', '늦잠 잤어요?'],
    ['I walked to class.', '아이 웍트 투 클래스', '저는 수업에 걸어왔어요.'],
    ['You should rest.', '유 슈드 레스트', '쉬는 게 좋아요.'],
    ['My head hurts.', '마이 헤드 헐츠', '머리가 아파요.'],
    ['I will go to bed early.', '아이 윌 고 투 베드 얼리', '일찍 잘 거예요.'],
    ['She is drinking coffee.', '쉬 이즈 드링킹 커피', '그녀는 커피를 마시고 있어요.'],
    ['I feel fine.', '아이 필 파인', '저는 괜찮아요.'],
    ['Are you awake?', '알 유 어웨이크?', '깨어 있어요?'],
    ['I slept well last night.', '아이 슬렙트 웰 라스트 나잇', '어젯밤에 잘 잤어요.'],
    ['Do you drink water every day?', '두 유 드링크 워러 에브리 데이?', '매일 물을 마셔요?'],
    ['I will rest this weekend.', '아이 윌 레스트 디스 위켄드', '이번 주말에 쉴 거예요.'],
  ],
  free: [
    ['What do you do when you are tired?', '왓 두 유 두 웬 유 알 타이얼드?', '피곤할 때 무엇을 해요?'],
    ['How many hours do you sleep?', '하우 매니 아워즈 두 유 슬립?', '몇 시간 자요?'],
  ],
  freeEx: ['I sleep when I am tired.', 'I sleep seven hours.'],
};

export const LESSONS0_ALL: Lesson0[] = [LV0_01, LV0_02];

export const getLesson0 = (unit: number) => LESSONS0_ALL.find((l) => l.unit === unit) ?? null;

/* ───────────── 단계 ───────────── */

export type Step0Id = 'kw' | 'puz' | 'ours' | 'self' | 'drill' | 'free';
export type Step0Def = { id: Step0Id; stage: StageKey; t: string; d: string; xp: number };

/**
 * Lv.0 한 과의 단계 (data/library STUDY_STEPS.basic 으로도 써요 · 과 화면 · 스터디 맵 정류장).
 * 교재 한 과 = ⓪ 키워드 → ① 퍼즐 → ② Our Story → ③ 스스로 변형하기 → ④ 문장 연습 · 프리토킹
 */
export const BASIC_STEPS: Record<StageKey, (Step & { id: Step0Id })[]> = {
  pre: [
    { id: 'kw', t: '오늘의 키워드', d: '명사 · 동사 · 형용사 15개 · 뜻 짝 맞추기 → 품사 고르기', min: 4, xp: 5 },
    { id: 'puz', t: '오늘의 퍼즐', d: '기본 문장 3개 · 바뀌는 곳 빈칸 채우기', min: 5, xp: 10 },
  ],
  main: [
    { id: 'ours', t: 'Our Story', d: '질문 7개에 내 문장으로 답하기', min: 8, xp: 15 },
    { id: 'self', t: '스스로 변형하기', d: '우리말 보고 단어 카드로 문장 바꾸기', min: 7, xp: 15 },
  ],
  post: [
    { id: 'drill', t: '문장 연습', d: '25문장 · 우리말 보고 영어로 말하기', min: 8, xp: 10 },
    { id: 'free', t: '프리토킹', d: '오늘 주제 질문 2개로 자유롭게 말하기', min: 3, xp: 10 },
  ],
};

/** 예습 → 본학습 → 복습 순서로 편 단계 */
export const STEP0_DEFS: Step0Def[] = (['pre', 'main', 'post'] as const).flatMap((stage) => BASIC_STEPS[stage].map((s) => ({ id: s.id, stage, t: s.t, d: s.d, xp: s.xp })));
export const step0Def = (id: string) => STEP0_DEFS.find((s) => s.id === id) ?? null;

/* ───────────── 레슨 진행기 문제 ───────────── */

const shuffle = <T>(a: T[]) => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};
const words = (s: string) => s.split(/\s+/).filter(Boolean);
/** 단어 카드에 섞을 낱말: 이 과의 모든 영어 문장 낱말 */
const poolOf = (D: Lesson0) => [...D.self.flatMap((g) => g.rows.flatMap((r) => words(r[2]))), ...D.puzzles.flatMap((p) => words(p.base[0])), ...D.drill.flatMap((d) => words(d[0]))];

const POS: { key: keyof Lesson0['words']; ko: string; d: string }[] = [
  { key: 'noun', ko: '명사', d: '사람 · 사물 · 장소의 이름' },
  { key: 'verb', ko: '동사', d: '~하다 (동작 · 생각 · 감정)' },
  { key: 'adj', ko: '형용사', d: '상태 · 모양을 말하는 말 (~한)' },
];

/** ⓪ 오늘의 키워드: 품사마다 뜻 짝 맞추기 → 품사 고르기 3문제 */
export function keywordTasks(D: Lesson0): Task[] {
  const matches: MatchTask[] = POS.map((p) => ({
    type: 'match',
    id: `kw-${p.key}`,
    pairs: D.words[p.key].map(([en, , ko]) => [en, ko]),
    time: 25,
    kick: `오늘의 키워드 · ${p.ko} 5 · ${p.d}`,
  }));
  const picks: PickTask[] = POS.map((p, i) => {
    const [en, pron, ko] = D.words[p.key][(i + 1) % 5];
    return {
      type: 'pick',
      kick: '오늘의 키워드 · 품사 고르기',
      label: '이 단어는 어떤 품사일까요?',
      q: { en, ko: `${pron} · ${ko}` },
      opts: POS.map((x) => x.ko),
      ans: i,
      explain: `${p.ko} · ${p.d}`,
    };
  });
  return [...matches, ...shuffle(picks)];
}

/** 빈칸 보기: 정답 + 같은 퍼즐의 다른 정답 3개 (겹치면 빼요) */
function puzzleOpts(p: Puzzle, ans: string) {
  const others = shuffle([...new Set(p.rows.map((r) => r.ans).filter((a) => a !== ans))]).slice(0, 3);
  const opts = shuffle([ans, ...others]);
  return { opts, ans: opts.indexOf(ans) };
}

/** ① 오늘의 퍼즐: 동사마다 기본 문장 따라 말하기 → 바뀌는 곳 빈칸 고르기 */
export function puzzleTasks(D: Lesson0): Task[] {
  return D.puzzles.flatMap((p): Task[] => {
    const kick = `오늘의 퍼즐 · ${VERB_KO[p.kind]}`;
    const base: ShadowTask = { type: 'shadow', en: p.base[0], ko: p.base[2], kick: `${kick} · 기본 문장` };
    const rows: PickTask[] = p.rows.map((r) => ({ type: 'pick', kick: `${kick} · ${r.label}`, label: `빈칸에 들어갈 말을 골라요 · 기본 문장 ${p.base[0]}`, q: { en: r.q }, ...puzzleOpts(p, r.ans), explain: `${r.label} · ${r.tip}` }));
    return [base, ...rows];
  });
}

/** ② Our Story: 질문 7개에 내 문장으로 답하기 (예시 답을 단어 카드로 · 답은 처음 답변으로 저장) */
export const ourStoryTasks = (D: Lesson0, key: string): AnswerTask[] =>
  D.story.map((q, qi) => ({ type: 'answer', q: { en: q.en, ko: q.ko, hint: q.ex }, qi, key, kick: `Our Story · ${qi + 1}/${D.story.length} · ${q.tag}`, pool: poolOf(D) }));

/** ③ 스스로 변형하기: 우리말 보고 단어 카드로 영어 문장 (① 현재 I · ③ 현재 She · ⑤ 명령문 — 과거 ② ④ 는 퍼즐 · 문장 연습에서) */
export function selfTasks(D: Lesson0): BuildTask[] {
  const pool = poolOf(D);
  const pick = D.self.filter((g) => !g.title.includes('과거'));
  return pick.flatMap((g) => g.rows.map(([label, ko, en]) => ({ type: 'build' as const, en, ko, label, kick: `스스로 변형하기 · ${g.title}`, pool })));
}

/** ④ 문장 연습: 25문장 · 우리말 보고 영어로 말하기 */
export const drillTasks = (D: Lesson0): ShadowTask[] => D.drill.map(([en, , ko], i) => ({ type: 'shadow', en, ko, kick: `문장 연습 · ${i + 1}/${D.drill.length}` }));

/** 프리토킹: 오늘 주제 질문 2개 */
export const freeTasks = (D: Lesson0, key: string): AnswerTask[] =>
  D.free.map(([en, , ko], qi) => ({ type: 'answer', q: { en, ko, hint: D.freeEx[qi] ?? '' }, qi, key, kick: `프리토킹 · Q${qi + 1}`, pool: poolOf(D) }));

export function step0Tasks(D: Lesson0, id: Step0Id, key: string): Task[] {
  switch (id) {
    case 'kw':
      return keywordTasks(D);
    case 'puz':
      return puzzleTasks(D);
    case 'ours':
      return ourStoryTasks(D, key);
    case 'self':
      return selfTasks(D);
    case 'drill':
      return drillTasks(D);
    case 'free':
      return freeTasks(D, key);
  }
}

/** 리스닝 룸 문장 (24 `/lessons/:id/listen-items` 키 '0-과') */
export const listen0 = (D: Lesson0) => [
  ...D.puzzles.map((p) => ({ en: p.base[0], ko: p.base[2], tag: `기본 문장 · ${VERB_KO[p.kind]}` })),
  ...D.drill.map(([en, , ko]) => ({ en, ko, tag: '문장 연습' })),
];
