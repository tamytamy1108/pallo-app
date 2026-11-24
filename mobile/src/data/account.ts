/**
 * 마이 B 가짜 데이터: 멤버십 · 수강 팀 · 지점 · PRO'S NOTE · 설정 기본값 · 이용권 · 결제 · 고객센터 · 약관.
 * 값은 프로토타입(prototype/index.html 의 PLANS · MS · MY_TEAMS · teamsOf · PN · SET0 · PASS_LOG · PAYS · FAQ · ASKS · TERMS · MYREP)과 같아요.
 * 맞는 API (docs/appendix/api-inventory.md): 30 `/me/settings` · 37 `/me/membership` · `/me/teams` · 38 `/branches/:id/teams`
 *   · 39 `/me/change-requests` · 40 `/me/membership/hold` · 42 `/me/pass-usage` · 43 `/me/payments` · 44 `/me/pro-notes`
 *   · 45 `/pro-notes/:id/thanks` · 46 `/me/level-change-requests` · 93 `/faq` · 94 `/me/inquiries` · 95 `/terms` · `DELETE /me`
 * 금액 · 횟수 · 약관 문안은 모두 예시예요 (docs/appendix/prototype-only.md 6).
 */
import { Colors } from '@/constants/theme';

// ---------- 날짜 도우미 ----------

/** 예시 화면 기준 날짜 (프로토타입 CG_TODAY = 11/11 수). 실제 앱은 서버 시각 */
export const TODAY = new Date(2026, 10, 11);
export const DOW = ['일', '월', '화', '수', '목', '금', '토'] as const;

export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
/** 2026.07.01 */
export const ymd = (d: Date) => `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
/** 11/25(수) */
export const fmtDay = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}(${DOW[d.getDay()]})`;

// ---------- 이용권 (멤버십) ----------

export type PlanKey = 'plus' | 'pro' | 'promax' | 'premium';
export type Plan = {
  name: string;
  /** 총 기간 = 유료 + 무료 (개월) */
  months: number;
  paidMonths: number;
  freeMonths: number;
  /** 팀 1개의 주 참여 횟수 (프리미엄은 늘 주 4회) */
  perWeek: number;
  total: number;
  /** 연기 · 변경 가능 횟수 (Infinity = 무제한) */
  changes: number;
  /** 최대 팀 수 */
  teams: number;
  /** 프리미엄: 늘 3팀 · 팀은 바꾸기만 */
  fixed?: boolean;
  perWeekText?: string;
};

// 프로토타입 PLANS: 한 달 = 주 참여 × 4회, 유료분부터 써요 · 금액은 앱에 보여 주지 않아요
export const PLANS: Record<PlanKey, Plan> = {
  plus: { name: '플러스', months: 5, paidMonths: 4, freeMonths: 1, perWeek: 2, total: 40, changes: 3, teams: 3 },
  pro: { name: '프로', months: 10, paidMonths: 6, freeMonths: 4, perWeek: 2, total: 80, changes: 6, teams: 3 },
  promax: { name: '프로맥스', months: 18, paidMonths: 10, freeMonths: 8, perWeek: 2, total: 144, changes: Infinity, teams: 3 },
  premium: { name: '프리미엄', months: 24, paidMonths: 13, freeMonths: 11, perWeek: 4, total: 384, changes: Infinity, teams: 3, fixed: true, perWeekText: '주 4회 · 꼭 3팀에서' },
};

/** 내 이용권 (프로토타입 MS) */
export const MEMBERSHIP: { plan: PlanKey; start: Date; used: number; changesUsed: number } = { plan: 'premium', start: new Date(2026, 6, 1), used: 40, changesUsed: 2 };

// ---------- 팀 · 지점 ----------

export type TeamLang = '영어' | '일본어' | '중국어' | '스페인어';
export type Team = {
  branch: string;
  /** 지점 안 팀 번호 (예: 3팀) */
  no: string;
  lang: TeamLang;
  /** '화목 19:30' — 요일 글자 + 시작 시각 */
  when: string;
  pro: string;
  level: string;
  /** 남은 자리 (0이면 못 골라요) */
  seats?: number;
};

export const TEAM_LANGS: TeamLang[] = ['영어', '일본어', '중국어', '스페인어'];
/** 언어 색 (DESIGN.md · 프로토타입 LG_LANGC) */
export const LANG_COLOR: Record<TeamLang, string> = { 영어: Colors.langEn, 일본어: Colors.langJa, 중국어: Colors.langZh, 스페인어: Colors.langEs };

export const MY_BRANCH = '하남점';

/** 수강 중인 팀 (프리미엄은 꼭 3팀) */
export const MY_TEAMS: Team[] = [
  { branch: MY_BRANCH, no: '3팀', lang: '영어', when: '화목 19:30', pro: 'Julie', level: 'Intermediate 2' },
  { branch: MY_BRANCH, no: '5팀', lang: '영어', when: '월수 21:00', pro: 'Sunny', level: 'Intermediate 2' },
  { branch: '잠실점', no: '8팀', lang: '일본어', when: '토 11:00', pro: 'Ken', level: 'Intermediate 2' },
];

/** 지점 목록 [이름, 권역] (프로토타입 LG_BRS · LG_BREG) */
export const BRANCH_REGIONS = ['서울', '경기', '충청', '경상'] as const;
export const BRANCHES: [string, (typeof BRANCH_REGIONS)[number]][] = [
  ['가산', '서울'], ['연신내', '서울'], ['영등포', '서울'], ['잠실점', '서울'],
  ['구리다산점', '경기'], ['김포점', '경기'], ['범계', '경기'], ['부천', '경기'], ['분당점', '경기'], ['수원영통점', '경기'], ['수지점', '경기'], ['일산', '경기'], ['하남점', '경기'],
  ['대전 둔산점', '충청'], ['대전 은행점', '충청'], ['천안 불당점', '충청'], ['천안 신부점', '충청'],
  ['구미점', '경상'], ['대구 달서점', '경상'], ['대구동성로', '경상'], ['대구일본어중국어점', '경상'], ['부산 수영점', '경상'], ['부산대점', '경상'], ['울산점', '경상'], ['창원', '경상'],
];

const MY_BRANCH_TEAMS: [string, TeamLang, string, string, number][] = [
  ['1팀', '영어', '월수 19:30', 'Leo', 2], ['2팀', '영어', '화목 10:00', 'Emma', 3], ['3팀', '영어', '화목 19:30', 'Julie', 1], ['4팀', '영어', '토 14:00', 'Alex', 0],
  ['5팀', '영어', '월수 21:00', 'Sunny', 2], ['6팀', '영어', '화목 21:00', 'Mia', 4], ['7팀', '일본어', '월수 20:00', 'Yuki', 3], ['8팀', '일본어', '토 11:00', 'Ken', 2],
  ['9팀', '중국어', '화목 20:00', 'Lin', 2], ['10팀', '스페인어', '토 15:00', 'Ana', 3],
];

/** 그 지점의 팀 · 남은 자리 (프로토타입 teamsOf: 다른 지점은 이름으로 늘 같은 예시를 만들어요) */
export function teamsOf(branch: string): Team[] {
  if (branch === MY_BRANCH) return MY_BRANCH_TEAMS.map(([no, lang, when, pro, seats]) => ({ branch, no, lang, when, pro, level: 'Intermediate 2', seats }));
  const h = [...branch].reduce((a, c) => a + c.charCodeAt(0), 0);
  const T = ['월수 10:00', '월수 19:30', '월수 21:00', '화목 10:00', '화목 19:30', '화목 21:00', '토 10:00', '토 14:00'];
  const P = ['Chloe', 'Noah', 'Hana', 'Ryan', 'Jin', 'Kate', 'Tom', 'Yuna', 'Ben', 'Sora'];
  return Array.from({ length: 5 + (h % 3) }, (_, k) => ({
    branch,
    no: `${k + 1}팀`,
    lang: k < 3 ? '영어' : TEAM_LANGS[(h + k) % 4],
    when: T[(h + k * 3) % 8],
    pro: P[(h + k) % 10],
    level: (h + k) % 3 ? 'Intermediate 2' : 'Intermediate 1',
    seats: (h + k * 2) % 5,
  }));
}

/** 19:30 → '7시 30분' · 10:00 → '오전 10시' (프로토타입 cgHour) */
export function hourLabel(t: string) {
  const [h, m] = t.split(':').map(Number);
  return `${h < 12 ? '오전 ' : ''}${h > 12 ? h - 12 : h}시${m ? ` ${m}분` : ''}`;
}
/** 전산 표기 팀 이름 · 예) 영어 화목 7시 30분 (프로토타입 tLabel) */
export function teamLabel(t: Pick<Team, 'lang' | 'when'>) {
  const [days, time] = t.when.split(' ');
  return `${t.lang} ${days} ${hourLabel(time)}`;
}
/** '화목 19:30' → [2, 4] (요일 번호) */
export const teamWeekdays = (t: Pick<Team, 'when'>) =>
  [...t.when.split(' ')[0]].map((c) => (DOW as readonly string[]).indexOf(c)).filter((i) => i >= 0);
/** 팀 번호 → 이름 (내 팀 · 내 지점 팀) */
export function teamNameByNo(no: string) {
  const t = MY_TEAMS.find((x) => x.no === no) ?? teamsOf(MY_BRANCH).find((x) => x.no === no);
  return t ? teamLabel(t) : '';
}

// ---------- 연기 · 팀 · 지점 변경 ----------

export type ChangeKind = 'rest' | 'team' | 'branch' | 'add';
/** [고르는 카드 이름, 신청 종류] (프로토타입 CG_KIND) */
export const CHANGE_KIND: Record<ChangeKind, [string, string]> = {
  rest: ['잠깐 쉬어가기', '연기'],
  team: ['팀 바꾸기', '팀 변경'],
  branch: ['지점 옮기기', '지점 이동'],
  add: ['팀 하나 더하기', '팀 추가'],
};
export const REST_LENGTHS = ['1주', '2주', '3주', '1달'] as const;
export type RestLength = (typeof REST_LENGTHS)[number];
/** 새 일정은 오늘 + 2주부터 */
export const CHANGE_MIN = addDays(TODAY, 14);

// ---------- PRO'S NOTE ----------

export type ProNoteTag = '표현' | '바로잡기' | '뜻' | '질문';
/** [태그, 제목, 설명, 예문들] */
export type ProNoteItem = [ProNoteTag, string, string, string[]];
export type ProNote = { id: string; m: number; d: number; wd: string; team: string; when: string; pro: string; isNew?: boolean; items: ProNoteItem[]; bye: string };

/** 오늘 준비 중인 노트 (프로토타입 PN_WAIT) */
export const PN_WAIT = { team: '5팀', when: '월수 21:00', pro: 'Sunny', end: '22:20' };

export const PRO_NOTES: ProNote[] = [
  {
    id: 'pn4', m: 11, d: 10, wd: '월', team: '5팀', when: '월수 21:00', pro: 'Sunny', isNew: true,
    items: [
      ['표현', "I'm running late", "약속에 늦을 것 같을 때 미리 알리는 말이에요. 이미 늦었으면 I'm late.", ["Sorry, I'm running late. I'll be there in 10 minutes."]],
      ['바로잡기', 'I very like it → I really like it', 'very는 like 같은 동사 앞에 못 와요. really나 a lot을 써요.', ['I really like it.', 'I like it a lot.']],
      ['뜻', 'commute', '출퇴근(하다) · 명사와 동사 둘 다 돼요.', ['My commute takes about an hour.', '출퇴근하는 데 한 시간쯤 걸려요.']],
      ['질문', 'Long time no see, 써도 돼요?', "네, 친한 사이에서 편하게 써요. 격식 있는 자리에선 It's been a while.", []],
    ],
    bye: '오늘 출퇴근 이야기 정말 재밌었어요! 수요일엔 주말 계획 하나씩 준비해 와요.',
  },
  {
    id: 'pn3', m: 11, d: 6, wd: '목', team: '3팀', when: '화목 19:30', pro: 'Julie',
    items: [
      ['표현', 'Could you ~?', 'Can you ~?보다 한 단계 정중하게 부탁할 때 써요.', ['Could you say that again?', 'Could you recommend a good place?']],
      ['바로잡기', "I'm exciting → I'm excited", '내가 느끼는 감정은 -ed, 감정을 주는 쪽은 -ing예요.', ["I'm excited about the trip.", 'The trip is exciting.']],
      ['뜻', 'grab a bite', '간단히 뭘 좀 먹다', ['Want to grab a bite after class?']],
    ],
    bye: '다음 주 화요일엔 여행 이야기로 시작해요. 사진 한 장씩 가져오면 더 좋아요!',
  },
  {
    id: 'pn2', m: 11, d: 5, wd: '수', team: '5팀', when: '월수 21:00', pro: 'Sunny',
    items: [
      ['표현', 'How was your day?', '하루 안부를 물을 때 가장 자연스러운 말이에요. 대답은 한 문장 더 붙여요.', ['It was busy, but I finished my project!']],
      ['뜻', 'exhausted', '완전히 지친 (tired보다 훨씬 강해요)', ["I'm exhausted after the long meeting."]],
    ],
    bye: '다들 피곤한 수요일에 와 줘서 고마워요. 푹 쉬어요!',
  },
  {
    id: 'pn1', m: 11, d: 4, wd: '화', team: '3팀', when: '화목 19:30', pro: 'Julie',
    items: [
      ['표현', 'Let me think', '바로 대답이 안 나올 때 시간을 버는 말이에요. 침묵보다 훨씬 자연스러워요.', ['Hmm, let me think... maybe Saturday?']],
      ['바로잡기', 'a question to you → a question for you', '질문을 "누구에게" 할 땐 for를 써요.', ['I have a question for you.']],
      ['질문', 'on the weekend, at the weekend 차이?', '둘 다 맞아요. 미국은 on, 영국은 at을 더 많이 써요.', []],
    ],
    bye: '첫 수업 다들 수고했어요! 자기소개 한 문장씩 더 늘려 봐요.',
  },
];

/** 태그 글자색 (프로토타입 PN_TAG_C) */
export const PN_TAG_COLOR: Record<ProNoteTag, string> = { 표현: Colors.purple, 바로잡기: '#D2477A', 뜻: '#2F6FD0', 질문: '#2E8B57' };

/** 감사 인사 고르기 (프로토타입 PN_THX) */
export const PN_THANKS = ['오늘 수업 정말 재밌었어요!', '설명이 쉬워서 이해가 잘 됐어요.', '고쳐 주신 표현 꼭 써 볼게요.', '노트 정리해 주셔서 감사해요.', '다음 수업도 기대돼요!'];

/** 스터디 일기 스티커 [키, 이름, 아이콘 path] (프로토타입 PN_ST) */
export const DIARY_STICKERS: [string, string, string][] = [
  ['new', '새 표현 써 봤어요', 'M12 3l2.6 5.6 6 .7-4.4 4.1 1.2 6L12 16.6 6.6 19.4l1.2-6L3.4 9.3l6-.7z'],
  ['talk', '많이 말했어요', 'M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z'],
  ['ask', '질문했어요', 'M9 9a3 3 0 1 1 4 2.8c-.8.3-1 1-1 1.7M12 17h.01'],
  ['friend', '새 친구', 'M16 11a4 4 0 1 0-8 0M3 21a7 7 0 0 1 9-6.7M17 15l2 2 3-4'],
  ['fun', '재밌었어요', 'M12 20s-7-4.3-8.7-8.9C2 7.6 4.2 4.5 7.3 4.5c1.9 0 3.4 1.1 4.7 2.6 1.3-1.5 2.8-2.6 4.7-2.6 3.1 0 5.3 3.1 4 6.6C19 15.7 12 20 12 20z'],
];
export const DIARY_QUESTIONS = ['오늘 가장 뿌듯했던 순간은?', '오늘 새로 써 본 표현은?', '다음 수업에서 해 보고 싶은 건?', '오늘의 나를 칭찬한다면?'];

export type Diary = { st: string[]; q: number; t: string; at?: string };
/** 예시: 지난 수업 일기 (내가 그 노트에 쓰면 내 일기로 바뀌어요) */
export const DIARY_EXAMPLES: Record<string, Diary> = {
  pn3: { st: ['ask'], q: 0, t: 'Could you ~?로 세 번이나 질문했다. 점점 입이 트이는 느낌.', at: '11.6 22:40' },
  pn2: { st: ['new', 'fun'], q: 1, t: 'exhausted를 처음 써 봤다. 다들 웃어 줘서 좋았다!', at: '11.5 22:30' },
  pn1: { st: ['friend', 'fun'], q: 0, t: '새로 온 Mina님이랑 출퇴근 얘기. 다음 주에 같이 번개 가기로!', at: '11.4 22:35' },
};

/** 같은 팀 멤버 (프로토타입 LG_MEMS 이름 · 색) */
export const TEAM_MEMBERS: [string, string][] = [
  ['지우', Colors.sky], ['소라', '#CDEBD0'], ['Leo', Colors.rosePink], ['민준', Colors.skyMist],
  ['유키', Colors.lavender], ['태오', Colors.yellow], ['하람', Colors.sky], ['수아', Colors.lavender],
];

/** 노트마다 같은 팀 멤버가 보낸 마음 (프로토타입 pnReacts: 고마워요 누른 사람 · 감사 인사 쓴 사람) */
export function noteReactions(id: string) {
  const h = [...id].reduce((a, c) => a + c.charCodeAt(0), 0);
  const M = TEAM_MEMBERS;
  const hearts = Array.from({ length: 3 + (h % 3) }, (_, i) => M[(h + i * 3) % M.length]).filter((x, i, a) => a.indexOf(x) === i);
  const TM = ['22:41', '22:58', '23:10', '어제'];
  const msgs = hearts.slice(0, 1 + (h % 2)).map(([who, color], i) => ({ who, color, text: PN_THANKS[(h + i * 2) % PN_THANKS.length], time: TM[i] }));
  return { hearts, msgs };
}

// ---------- 설정 ----------

/** 설정 기본값 (프로토타입 SET0 · 효과음은 @/lib/feedback 이 따로 가져요) */
export const SETTINGS_DEFAULT = {
  nSession: true,
  nSession1h: true,
  nMeet: true,
  nClubChat: true,
  nFriend: true,
  nCmt: true,
  nRank: false,
  nMkt: false,
  profile: '전체 공개',
  rankName: true,
  showBr: true,
  /** 내 퀘스트 성공(레슨 단계 · 상황 장면)을 팔로워에게 알리기 (A 추가 · shareProgress). 예전 저장에 없으면 켜진 걸로 봐요 */
  shareProgress: true,
  goal: 2,
  lang: '영어',
  bio: '',
  /** 광고 수신 동의 날짜 (켜면 기록) */
  mktAt: '',
  /** 내 지점 변경 요청 (매니저가 확인하면 바뀌어요 · 최대 2곳). 비어 있으면 지금 지점 */
  branches: [] as string[],
};
export type Settings = typeof SETTINGS_DEFAULT;
export const PROFILE_SCOPES = ['전체 공개', '같은 지점만', '함께한 모임 멤버만'];

/** 간편 로그인 연결 (프로토타입 LOGINS) */
export const LOGINS_DEFAULT: Record<string, boolean> = { 카카오: true, 애플: false, 구글: false };

export const APP_VERSION = { now: '1.0.0', latest: '1.0.0', notes: [['1.0.0', '알림함 · 공지 · 체험 신청 · 이용권 · 고객센터']] as [string, string][] };
export const OSS_LICENSES: [string, string][] = [['Noto Sans KR', 'SIL Open Font License 1.1'], ['Unbounded', 'SIL Open Font License 1.1'], ['React Native', 'MIT'], ['Lottie', 'Apache 2.0']];

/** 학습 언어 · 레벨 (프로토타입 langlvHTML) */
export const MY_LEVEL = { book: 'Lv.1 · EVERYDAY ENGLISH', since: '2026.07.01 시작 · 지금 3과', weeks: '12주째' };
export const OTHER_LANGS: [string, string, string][] = [['일본어', '레벨 0부터 · 영등포 · 잠실', 'ja'], ['중국어', '입문반 · 연신내', 'zh'], ['스페인어', '기초반 · 대구 달서', 'es']];
export const LEVEL_TEST = { meta: '2026.06.24 · 영등포점 · 담당 Sophie', rows: [['말하기', 'Lv.1 상'], ['듣기', 'Lv.2 하'], ['어휘', 'Lv.1 중'], ['추천 레벨', 'Lv.1 EVERYDAY ENGLISH']] as [string, string][] };

/** 내가 한 신고 (프로토타입 MYREP) */
export const MY_REPORTS = [
  { kind: '댓글', who: 'Jay', why: '불쾌하거나 무례한 말', d: '11.12', st: '처리 완료', res: '경고를 보냈어요' },
  { kind: '글', who: '익명 회원', why: '스팸 · 광고', d: '11.09', st: '처리 완료', res: '글을 숨겼어요' },
  { kind: '멤버', who: '다온', why: '모임에서 불편한 일이 있었어요', d: '11.14', st: '접수', res: '' },
];

// ---------- 이용권 사용 내역 · 결제 ----------

export const PASS_LOG = Array.from({ length: 12 }, (_, i) => {
  const d = new Date(2026, 10, 13 - i * 3);
  return { d: `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, '0')} ${'일월화수목금토'[d.getDay()]}`, br: i % 4 === 2 ? '잠실점' : '영등포점', ls: `Lv.1 · ${Math.max(1, 6 - Math.floor(i / 2))}과`, ok: i !== 5 };
});

/** 결제 내역 (mem: 이용권 — 금액은 앱에 보여 주지 않아요) */
export const PAYMENTS = [
  { d: '2026.07.01', mem: true, item: '프리미엄 · 24개월 · 384회(무료 176회 포함)', amt: 2470000, how: '신용카드 · 국민 ****21', st: '결제 완료' },
  { d: '2026.08.14', mem: false, item: '제주 영어 캠프 1박 2일', amt: 189000, how: '카카오페이', st: '결제 완료' },
  { d: '2026.02.01', mem: true, item: '플러스 · 5개월 · 40회(무료 8회 포함)', amt: 760000, how: '신용카드 · 국민 ****21', st: '결제 완료' },
  { d: '2026.02.20', mem: false, item: '레벨 테스트', amt: 30000, how: '카카오페이', st: '환불 완료' },
];

// ---------- 고객센터 ----------

/** [분류, 질문, 답] (프로토타입 FAQ) */
export const FAQ: [string, string, string][] = [
  ['수업 · 예약', '세션을 빠지면 어떻게 돼요?', '하루 전 22시까지 연기하면 회차가 차감되지 않아요. 그 뒤에 빠지면 1회 차감돼요. 마이 > 연기 · 팀 · 지점 변경에서 신청해요.'],
  ['수업 · 예약', '연기 · 변경은 몇 번까지 돼요?', '연기 · 팀 변경 · 지점 이동을 합쳐서 플러스 3번, 프로 6번, 프로맥스 · 프리미엄은 무제한이에요.'],
  ['수업 · 예약', '다른 지점 수업도 들을 수 있어요?', '같은 레벨이면 다른 지점 세션도 예약할 수 있어요. 지점 변경에서 “이번 한 번만”을 골라요.'],
  ['이용권 · 결제', '이용권을 잠깐 멈출 수 있어요?', '연기로 쉬어가요. 만료일은 남은 횟수를 주 참여 횟수(주 2회 · 프리미엄 주 4회)로 다 듣는 날이라, 쉰 만큼 뒤로 밀려요.'],
  ['이용권 · 결제', '무료 횟수는 뭐예요?', '이용권 기간 중 일부는 무료로 드려요(플러스 1개월 · 프로 4개월 · 프로맥스 8개월 · 프리미엄 11개월). 유료 횟수부터 쓰고, 이용권 화면에서 유료 · 무료 남은 횟수를 따로 볼 수 있어요.'],
  ['이용권 · 결제', '수업을 더 많이 들을 수 있어요?', '주 참여 횟수는 플러스 · 프로 · 프로맥스 주 2회, 프리미엄 주 4회예요. 프리미엄은 꼭 3팀에 들어가고(두 언어를 같이 배워도 합쳐서 3팀), 팀은 빼거나 더하지 않고 바꾸기만 돼요. 플러스 · 프로 · 프로맥스는 팀을 3개까지 더할 수 있어요(팀 1개마다 주 2회 · 그만큼 횟수를 더 빨리 써요). 정해진 횟수보다 더 나온 출석은 포인트 · 퀘스트에 들어가지 않아요.'],
  ['이용권 · 결제', '환불은 어떻게 해요?', '남은 회차와 기간으로 계산해요. 1:1 문의에 “환불”을 골라 남기면 지점에서 연락드려요.'],
  ['레벨 · 교재', '레벨이 안 맞는 것 같아요', '설정 > 학습 언어 · 레벨에서 레벨 변경을 요청하면 프로님과 매니저가 확인해요.'],
  ['라운지', '번개는 누구나 열 수 있어요?', '정회원이면 누구나 열 수 있어요. 체험 회원은 구경만 할 수 있어요.'],
  ['계정', '휴대폰 번호가 바뀌었어요', '설정 > 로그인 계정에서 새 번호로 인증하면 바뀌어요.'],
];
export const FAQ_CATS = ['전체', '수업 · 예약', '이용권 · 결제', '레벨 · 교재', '라운지', '계정'];

export const ASK_TYPES = ['수업 · 예약', '결제 · 환불', '앱 오류', '기타'];
export type Ask = { t: string; q: string; d: string; st: '답변 대기' | '답변 완료'; a?: string };
export const ASKS_DEFAULT: Ask[] = [{ t: '앱 오류', q: '출석체크 버튼이 안 눌려요', d: '11.02', st: '답변 완료', a: '불편을 드려 죄송해요. 앱을 최신 버전으로 업데이트하면 해결돼요.' }];

/** 내 지점 전화 (예시) */
export const BRANCH_PHONE = '02-000-0000';

// ---------- 약관 ----------

/** [이름, 시행일, 본문] (프로토타입 TERMS — 모두 예시 문안, Q-L1) */
export const TERMS: [string, string, string[]][] = [
  ['서비스 이용약관', '2026.09.01', ['제1조 (목적) 이 약관은 PALLO가 제공하는 앱 서비스의 이용 조건과 절차를 정해요.', '제2조 (회원) 회원은 지점에 등록하고 앱 계정을 만든 사람이에요.', '제3조 (라운지) 회원이 올린 글 · 사진의 권리는 회원에게 있어요. 다른 회원을 불편하게 하는 글은 숨겨질 수 있어요.']],
  ['개인정보 처리방침', '2026.09.01', ['1. 모으는 정보: 이름, 휴대폰 번호, 지점, 학습 기록, 라운지 활동.', '2. 쓰는 곳: 세션 예약 · 출석, 알림, 라운지 운영.', '3. 보관 기간: 탈퇴하면 30일 뒤 지워요. 법으로 보관해야 하는 결제 기록은 5년.']],
  ['위치정보 이용약관', '2026.09.01', ['가까운 지점과 번개 위치를 보여 줄 때만 위치를 써요. 위치는 저장하지 않아요.']],
  ['마케팅 정보 수신 동의', '2026.09.01', ['이벤트 · 혜택 소식을 알림 · 문자로 받아요. 설정 > 알림에서 언제든 끌 수 있어요.']],
];

// ---------- 회원 탈퇴 ----------

/** 탈퇴 이유 — 프로토타입은 확인 시트 하나뿐이라, 애플 '앱 안 계정 삭제' 흐름에 맞춰 앱에서 더한 단계 */
export const LEAVE_REASONS = ['스터디를 그만 다녀요', '앱을 잘 안 써요', '알림이 너무 많아요', '다른 계정으로 쓸게요', '기타'];

// ---------- 이용권 계산 (프로토타입 MS 의 getter 들) ----------

/** 남은 횟수 · 유료/무료 · 주 참여 · 만료일. 만료일 = 오늘부터 남은 횟수를 주 참여 횟수로 다 쓰는 날 (연기하면 밀려요) */
export function getMembership() {
  const P = PLANS[MEMBERSHIP.plan];
  const { used, start } = MEMBERSHIP;
  // 프리미엄은 늘 주 4회, 나머지는 팀 1개마다 주 2회
  const wk = P.fixed ? P.perWeek : P.perWeek * Math.max(1, MY_TEAMS.length);
  const left = P.total - used;
  const paidN = P.paidMonths * P.perWeek * 4;
  const paidL = Math.max(0, paidN - used);
  const exp = addDays(TODAY, Math.ceil(left / wk) * 7);
  const pp = P.changes === Infinity ? Infinity : Math.max(0, P.changes - MEMBERSHIP.changesUsed);
  return {
    plan: P,
    name: P.name,
    start,
    exp,
    period: `${ymd(start)} ~ ${ymd(exp)}`,
    used,
    total: P.total,
    left,
    wk,
    paidN,
    freeN: P.total - paidN,
    paidL,
    freeL: left - paidL,
    /** 연기 · 변경 남은 횟수 (Infinity = 무제한) */
    pp,
  };
}
export type MembershipInfo = ReturnType<typeof getMembership>;
/** 연기 · 변경 남은 횟수 글자 (프로토타입 ppT) */
export const changesLeftText = (pp: number) => (pp === Infinity ? '무제한' : `${pp}번`);
