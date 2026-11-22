/**
 * 라운지 가짜 데이터 — 프로토타입 LG_FEED · LG_STORIES · LG_SCAT · LG_BRS · LG_PEOPLE · LG_CC 를 그대로 옮겼어요.
 * 맞는 API (docs/appendix/api-inventory.md): 49 `/lounge/feed` · 50 `/posts` · 52 `/posts/:id/likes` · 53 `/:target/:id/comments`
 * · 55 `/stories` · 56 `/stories/:id/views` · 58 `/lounge/map` · 71 `/trips` · 73 `/abroad-profiles`.
 * 백엔드가 생기면 이 값 대신 서버에서 받아 와요. 예시 지점 이름은 실제 지점, 내 지점은 하남점.
 */
import { Colors } from '@/constants/theme';

/** 프로토타입 LG_C */
export const LG_C = {
  y: Colors.yellow,
  pk: Colors.rosePink,
  pu: Colors.purple,
  sky: Colors.sky,
  lpu: Colors.lavender,
  lsky: Colors.skyMist,
  ink: Colors.ink,
  cream: Colors.cream,
  mint: '#CDEBD0',
} as const;

// ---- 탭 · 서브 칩 ----
export type LoungeTab = 'all' | 'com' | 'chal' | 'meet' | 'trip';
export const LG_TABS: [LoungeTab, string][] = [
  ['all', '추천'],
  ['com', '커뮤니티'],
  ['chal', '챌린지'],
  ['meet', '번개 · 동아리'],
  ['trip', '해외 동행'],
];
export type AllSub = 'all' | 'hot';
export const ALL_SUBS: [AllSub, string][] = [
  ['all', '전체'],
  ['hot', '인기'],
];
export type PostCat = 'daily' | 'study' | 'event' | 'travel' | 'club' | 'meet';
export type ComSub = 'all' | PostCat;
export const COM_SUBS: [ComSub, string][] = [
  ['all', '전체'],
  ['daily', '일상'],
  ['study', '스터디'],
  ['event', '이벤트'],
  ['travel', '여행'],
  ['club', '동아리'],
  ['meet', '번개'],
];
export type TripMode = 'live' | 'trip';
export const TRIP_SUBS: [TripMode, string][] = [
  ['live', '해외살이'],
  ['trip', '여행 동행'],
];

// ---- 사진 (예시 그림 키) ----
export type PicKey = 'party' | 'ramen' | 'book' | 'run' | 'trip' | 'cafe';
/** 글쓰기 '어떤 글인가요?' (프로토타입 LG_PCAT: 키 · 이름 · 예시 그림) */
export const LG_PCAT: [PostCat, string, PicKey][] = [
  ['daily', '일상', 'cafe'],
  ['study', '스터디', 'book'],
  ['event', '이벤트', 'party'],
  ['travel', '여행', 'trip'],
  ['club', '동아리', 'run'],
  ['meet', '번개', 'ramen'],
];

// ---- 글 · 카드 ----
export type Expr = { t: string; ko: string; lang: string };
export type Post = {
  id: string;
  k: 'post';
  rec?: boolean;
  cat?: PostCat;
  who: string;
  av: string;
  avc?: string;
  br: string;
  role: string;
  time: string;
  pic?: PicKey;
  /** 내가 올린 사진 (uri) · 비율(가로 / 세로) */
  imgs?: string[];
  ratio?: number;
  n: number;
  likes: number;
  text: string;
  expr?: Expr;
  club?: string;
  /** 새로 올린 글은 예시 댓글 없이 '첫 댓글 달기' */
  c0?: 0;
  mine?: boolean;
};
export type CountryCode = 'AU' | 'JP' | 'CA' | 'IE' | 'FR' | 'TH' | 'VN';
export type Abroad = { id: string; k: 'abroad'; rec?: boolean; cc: CountryCode; who: string; av: string; avc?: string; br: string; time: string; kick: string; title: string; body: string; likes: number };
export type Trip = {
  id: string;
  k: 'trip';
  cc: CountryCode;
  city: string;
  from: string;
  to: string;
  type: string;
  cap: number;
  cur: number;
  who: string;
  av: string;
  avc?: string;
  br: string;
  age: string;
  styles: string[];
  title: string;
  intro: string;
  mine?: boolean;
  closed?: boolean;
};
/** 추천 탭에 섞이는 번개 · 파티 카드 (자세한 화면은 번개 · 이벤트 담당 /meet/[id] · /events/[id]) */
export type RecMeet = { id: string; k: 'meet'; rec?: boolean; br: string; reg?: string; kind: string; party?: boolean; day: string; mon: string; wd: string; title: string; place: string; host: string; cur: number; max: number; fee?: number };
/** 추천 탭에 섞이는 표현 챌린지 카드 (자세한 화면은 챌린지 담당 /challenge/[id]) */
export type RecChal = { id: string; k: 'chal'; rec?: boolean; who: string; av: string; br: string; time: string; name: string; hl: string; q: string; ko: string; lang: string; src: string; left: number; last: [string, string]; people: string[]; lines: number };
export type MapCard = { id: 'map'; k: 'map'; rec: true };
export type FeedItem = Post | Abroad | Trip | RecMeet | RecChal | MapCard;

export const FEED: FeedItem[] = [
  { id: 'p1', k: 'post', rec: true, cat: 'study', who: '하나', av: LG_C.y, br: '영등포', role: '리더', time: '10분 전', pic: 'party', n: 4, likes: 128, text: '이번 주 세션 주제는 주말 이야기! 다들 20분 동안 주말 얘기만 했어요', expr: { t: 'I’m on the fence.', ko: '아직 마음을 못 정했어요', lang: 'en-US' } },
  { id: 'm1', k: 'meet', rec: true, br: '영등포', reg: '서울', kind: '번개', day: '14', mon: 'NOV', wd: '금 20:00', title: '퇴근 후 영어 맥주 번개', place: '영등포 근처 수제맥주집', host: '하나 리더', cur: 6, max: 8 },
  { id: 'c1', k: 'chal', rec: true, who: '민준', av: LG_C.sky, br: '잠실점', time: '1시간 전', name: '30일 하루 한 문장', hl: 'on the fence', q: 'I’m on the fence about it.', ko: '그건 아직 결정을 못 하겠어요', lang: 'en-US', src: 'Lv.1 · 6챕터 No Spoilers!', left: 13, last: ['민준', 'Me too! on the fence 외워 둘게요'], people: ['소라', '하나', 'Leo', '지우', '태오'], lines: 5 },
  { id: 'p2', k: 'post', rec: true, cat: 'travel', who: 'Leo', av: LG_C.pk, avc: '#fff', br: '연신내', role: '리더', time: '어제', pic: 'ramen', n: 3, likes: 342, text: '세션에서 연습한 표현, 후쿠오카에서 진짜 열 번은 썼어요.', expr: { t: 'おすすめは何ですか？', ko: '추천 메뉴가 뭐예요?', lang: 'ja-JP' } },
  { id: 'a1', k: 'abroad', rec: true, cc: 'AU', who: '예린', av: LG_C.lsky, br: '잠실점 출신 · 시드니 7개월째', time: '2일 전', kick: 'AUSTRALIA · 집', title: '시드니 쉐어하우스 구할 때 꼭 확인할 것 5가지', body: '① 본드 영수증 ② 입주 전 사진 ③ 계약 기간 ④ 공과금 포함 여부 ⑤ 하우스 규칙', likes: 63 },
  { id: 'p3', k: 'post', who: '소라', av: LG_C.mint, br: '영등포 · 연신내', role: '', time: '어제', pic: 'book', n: 2, likes: 57, text: '북클럽 3주차. 이번 주는 여우 장면을 영어로 소리 내어 읽었어요.', club: '북클럽' },
  { id: 'map', k: 'map', rec: true },
  { id: 'm2', k: 'meet', rec: true, br: '전 지점', kind: '파티', party: true, day: '29', mon: 'NOV', wd: '토 19:00', title: 'PALLO 연말 랭귀지 파티', place: '연신내 라운지 · 전 지점', host: '매니저 Jay', cur: 31, max: 40, fee: 15000 },
  { id: 'p4', k: 'post', rec: true, who: '태오', av: LG_C.lpu, br: '영등포', role: '', time: '3일 전', pic: 'run', n: 5, likes: 89, text: '러닝 동아리 첫 모임! 뛰면서 영어로 수다 떨기, 생각보다 숨차요', club: '러닝 동아리', expr: { t: 'I’m out of breath!', ko: '숨이 차요!', lang: 'en-US' } },
  { id: 'a2', k: 'abroad', cc: 'JP', who: 'Kenji', av: LG_C.pk, avc: '#fff', br: '연신내 출신 · 도쿄 1년째', time: '4일 전', kick: 'JAPAN · 일', title: '도쿄 알바 면접에서 꼭 나오는 질문', body: '「いつから働けますか？」(언제부터 일할 수 있어요?) 답을 미리 연습해 가세요.', likes: 48 },
  { id: 'p5', k: 'post', cat: 'daily', who: '지우', av: LG_C.sky, br: '대전 둔산점 · 영등포', role: '', time: '5일 전', pic: 'cafe', n: 1, likes: 24, text: '카페에서 메뉴 고르다가 저절로 나온 오늘의 표현', expr: { t: 'I’m on the fence.', ko: '아직 마음을 못 정했어요', lang: 'en-US' } },
  { id: 'p6', k: 'post', cat: 'travel', who: '도윤', av: LG_C.y, br: '영등포', role: '', time: '6일 전', pic: 'trip', n: 3, likes: 71, text: '오사카 둘째 날. 길 물어볼 때 세션에서 배운 문장 그대로 썼어요', expr: { t: 'Is this the right way to the station?', ko: '역 가는 길 이거 맞아요?', lang: 'en-US' } },
  { id: 'p7', k: 'post', cat: 'meet', who: '유키', av: LG_C.lpu, br: '연신내', role: '', time: '어제', pic: 'ramen', n: 2, likes: 66, text: '홍대 일본어 이자카야 번개 후기! 다들 일본어로 주문 성공했어요', expr: { t: 'おすすめは何ですか？', ko: '추천 메뉴가 뭐예요?', lang: 'ja-JP' } },
  { id: 'p8', k: 'post', cat: 'event', who: 'Jay', av: LG_C.pk, avc: '#fff', br: '전 지점', role: '매니저', time: '2일 전', pic: 'party', n: 1, likes: 140, text: '연말 랭귀지 파티 테이블 미리 보기! 신청은 이벤트 탭에서 할 수 있어요' },
  { id: 't1', k: 'trip', cc: 'JP', city: '도쿄', from: '2026-11-22', to: '2026-11-25', type: '식사 · 투어', cap: 3, cur: 2, who: '하나', av: LG_C.y, br: '영등포', age: '20~30대', styles: ['맛집', '느긋하게'], title: '도쿄 라멘 투어 같이 가요', intro: '저녁만 같이 먹어요. 일본어로 주문해 보기!' },
  { id: 't2', k: 'trip', cc: 'TH', city: '방콕', from: '2026-12-01', to: '2026-12-05', type: '숙소 쉐어', cap: 2, cur: 1, who: 'Leo', av: LG_C.pk, avc: '#fff', br: '연신내', age: '20대', styles: ['알차게', '야시장'], title: '방콕 숙소 쉐어할 분', intro: '시내 호텔 반반. 낮엔 각자, 밤엔 야시장.' },
  { id: 't3', k: 'trip', cc: 'FR', city: '파리', from: '2026-12-20', to: '2026-12-24', type: '부분 동행', cap: 4, cur: 2, who: '소라', av: LG_C.mint, br: '영등포', age: '나이 무관', styles: ['미술관', '사진'], title: '파리 미술관 하루 같이 돌아요', intro: '루브르 · 오르세 하루 코스. 영어로 오디오 가이드 같이 들어요.' },
  { id: 't4', k: 'trip', cc: 'VN', city: '다낭', from: '2026-11-15', to: '2026-11-18', type: '전체 동행', cap: 3, cur: 3, who: '태오', av: LG_C.lpu, br: '영등포', age: '20~30대', styles: ['바다', '액티비티'], title: '다낭 3박 4일 전체 동행', intro: '' },
];

/** 예시 포스터 큰 글씨 · 바탕 (프로토타입 LG_PW 중 추천 탭 카드 몫) */
export const LG_PW: Record<string, [string, string]> = {
  m1: ['AFTER\nWORK\nBEER', LG_C.pk],
  m2: ['YEAR\nEND\nPARTY', LG_C.pu],
};

// ---- 지도 (추천 탭 작은 한국 지도 · 해외 지도) ----
/** 지역 · 지도 x · y (프로토타입 LG_REG) */
export const LG_REG: [string, number, number][] = [
  ['서울', 98, 62],
  ['경기', 138, 86],
  ['천안', 104, 103],
  ['대전', 118, 124],
  ['대구', 159, 142],
  ['울산', 192, 160],
  ['부산', 176, 178],
];
/** 지도 숫자를 세는 번개 · 동아리 (프로토타입 LG_FEED 의 번개 · 동아리 줄 — 지역 · 지점 · 날짜만) */
export type MapSpot = { id: string; k: 'meet' | 'club'; reg: string; br: string; date?: string };
export const MAP_SPOTS: MapSpot[] = [
  { id: 'm1', k: 'meet', reg: '서울', br: '영등포', date: '2026-11-14' },
  { id: 'm3', k: 'meet', reg: '경기', br: '영등포', date: '2026-11-18' },
  { id: 'm4', k: 'meet', reg: '부산', br: '연신내', date: '2026-11-16' },
  { id: 'm5', k: 'meet', reg: '대구', br: '대전 둔산점', date: '2026-11-15' },
  { id: 'm6', k: 'meet', reg: '서울', br: '영등포', date: '2026-11-08' },
  { id: 'm7', k: 'meet', reg: '부산', br: '연신내', date: '2026-11-02' },
  { id: 'm8', k: 'meet', reg: '경기', br: '영등포', date: '2026-10-30' },
  { id: 'm9', k: 'meet', reg: '서울', br: '연신내', date: '2026-11-13' },
  { id: 'm10', k: 'meet', reg: '서울', br: '영등포', date: '2026-11-20' },
  { id: 'm11', k: 'meet', reg: '대전', br: '대전 둔산점', date: '2026-11-16' },
  { id: 'm12', k: 'meet', reg: '대구', br: '대구 달서점', date: '2026-11-22' },
  { id: 'm13', k: 'meet', reg: '부산', br: '부산 수영점', date: '2026-11-23' },
  { id: 'm14', k: 'meet', reg: '경기', br: '영등포', date: '2026-11-19' },
  { id: 'cl5', k: 'club', reg: '서울', br: '잠실점' },
  { id: 'cl6', k: 'club', reg: '경기', br: '분당점' },
  { id: 'cl7', k: 'club', reg: '대구', br: '대구일본어중국어점' },
  { id: 'cl8', k: 'club', reg: '대구', br: '대구동성로' },
  { id: 'cl9', k: 'club', reg: '부산', br: '부산 수영점' },
  { id: 'cl10', k: 'club', reg: '서울', br: '연신내' },
  { id: 'cl11', k: 'club', reg: '경기', br: '분당점' },
  { id: 'cl1', k: 'club', reg: '서울', br: '영등포' },
  { id: 'cl2', k: 'club', reg: '서울', br: '잠실점' },
  { id: 'cl3', k: 'club', reg: '부산', br: '부산대점' },
  { id: 'cl4', k: 'club', reg: '대전', br: '대전 둔산점' },
];

/** 나라: 이름 · 지도 x · y · 카드 색 (프로토타입 LG_CC) */
export const LG_CC: Record<CountryCode, [string, number, number, string]> = {
  AU: ['호주', 330, 154, LG_C.sky],
  JP: ['일본', 318, 79, LG_C.pk],
  CA: ['캐나다', 46, 62, LG_C.lpu],
  IE: ['아일랜드', 164, 55, LG_C.mint],
  FR: ['프랑스', 179, 66, LG_C.y],
  TH: ['태국', 272, 109, LG_C.pk],
  VN: ['베트남', 293, 96, LG_C.y],
};
export const CC_KEYS = Object.keys(LG_CC) as CountryCode[];
export const ccOf = (name: string) => CC_KEYS.find((k) => LG_CC[k][0] === name);

export type AbroadPerson = { n: string; cc: CountryCode; city: string; since: string; job: string; br: string; av: string; me?: boolean };
export const LG_PEOPLE: AbroadPerson[] = [
  { n: '예린', cc: 'AU', city: '시드니', since: '7개월째', job: '카페 바리스타 · 워홀', br: '잠실점', av: LG_C.lsky },
  { n: 'Kenji', cc: 'JP', city: '도쿄', since: '1년째', job: 'IT 회사 인턴', br: '연신내', av: LG_C.pk },
  { n: '도윤', cc: 'CA', city: '밴쿠버', since: '3개월째', job: '어학연수', br: '영등포', av: LG_C.y },
  { n: '수아', cc: 'IE', city: '더블린', since: '5개월째', job: '호텔 리셉션', br: '대전 둔산점', av: LG_C.lpu },
  { n: '민서', cc: 'AU', city: '멜버른', since: '2년째', job: '간호 유학', br: '영등포', av: LG_C.mint },
];

/** 여행 동행 신청 전 안전 수칙 (모두 체크해야 신청) */
export const LG_SAFE = ['처음 만나는 곳은 사람 많은 공개 장소로 해요', '여권 · 돈은 각자 챙기고 빌려주지 않아요', '일정과 숙소를 가족이나 친구에게 알려요', '불편하면 언제든 그만두고 신고할 수 있어요'];
export const LG_TYPES = ['전체 동행', '부분 동행', '식사 · 투어', '숙소 쉐어'];
export const LG_STY = ['맛집', '사진', '느긋하게', '알차게', '미술관', '액티비티'];

// ---- 스토리 ----
export type StoryCat = 'event' | 'chal' | 'club' | 'rev' | 'daily' | 'abroad';
/** 이름 · 동그라미 색 · 아이콘 · 올릴 때 설명 · 스토리 배경 · 하이라이트 안쪽 바탕 (프로토타입 LG_SCAT) */
export const LG_SCAT: Record<StoryCat, { name: string; color: string; icon: 'bolt' | 'flame' | 'flag' | 'heart' | 'cam' | 'plane'; desc: string; bg: string; tile: string }> = {
  event: { name: '이벤트', color: LG_C.ink, icon: 'bolt', desc: '공지 · 행사 (리더 · 매니저)', bg: LG_C.pu, tile: LG_C.y },
  chal: { name: '챌린지', color: LG_C.pu, icon: 'flame', desc: '오늘 챌린지 인증', bg: LG_C.pu, tile: LG_C.lpu },
  club: { name: '동아리', color: LG_C.pu, icon: 'flag', desc: '동아리 모임 이야기', bg: LG_C.pu, tile: '#fff' },
  rev: { name: '번개 후기', color: LG_C.pk, icon: 'heart', desc: '번개 다녀온 이야기', bg: LG_C.pk, tile: '#FDE7F0' },
  daily: { name: '일상', color: LG_C.y, icon: 'cam', desc: '오늘 있었던 일', bg: LG_C.pk, tile: '#FFF5B0' },
  abroad: { name: '해외', color: LG_C.sky, icon: 'plane', desc: '해외살이 · 여행 이야기', bg: LG_C.sky, tile: LG_C.lsky },
};
export const STORY_CATS = Object.keys(LG_SCAT) as StoryCat[];

export type Story = {
  id: string;
  who: string;
  av: string;
  avc?: string;
  role: string;
  br: string;
  cat: StoryCat;
  time: string;
  /** 올린 지 몇 시간 (24시간 미만 = 사람 줄, 넘으면 카테고리 하이라이트) */
  h: number;
  big: string;
  ds: string;
  /** 큰 글씨 그림: [바탕색, 글씨] */
  art: [string, string];
  pin?: boolean;
  meet?: string;
  mine?: boolean;
  /** 내가 올린 사진 */
  img?: string;
};
const st = (id: string, who: string, av: string, role: string, br: string, cat: StoryCat, time: string, h: number, big: string, ds: string, art: [string, string], x: Partial<Story> = {}): Story => ({ id, who, av, role, br, cat, time, h, big, ds, art, ...x });
export const STORIES: Story[] = [
  st('s1', 'Jay', LG_C.pk, '매니저', '전 지점', 'event', '어제', 30, 'PALLO 연말\n랭귀지 파티', '연신내 라운지 · 11.29 토 19:00\n네 가지 언어 테이블을 돌아다녀요.', [LG_C.pk, '11\n29'], { pin: true, meet: 'm2', avc: '#fff' }),
  st('s2', 'Jay', LG_C.pk, '매니저', '전 지점', 'event', '2일 전', 50, '지점 대항\n스피킹 대회', '12.06 토 14:00\n지점마다 3명씩 나와요.', [LG_C.y, '12\n06'], { pin: true, meet: 'e1', avc: '#fff' }),
  st('s12', '민준', LG_C.sky, '', '잠실점', 'chal', '20분 전', 0.3, '30일 하루 한 문장\n17일째!', 'I’m on the fence about it. 오늘도 체크 완료', [LG_C.lpu, '17\n/30']),
  st('s9', '지우', LG_C.sky, '', '대전 둔산점', 'chal', '5시간 전', 5, '주 3회 쉐도잉\n9회째', 'Could you say that again? 이제 입에 붙었어요', [LG_C.lpu, '9\n/12']),
  st('s13', 'Leo', LG_C.pk, '리더', '연신내', 'chal', '8시간 전', 8, '7일 영어 일기\n미리 써 봤어요', 'Today was a long day. 다음 주 월요일부터 같이 해요', [LG_C.y, 'DAY\n0'], { avc: '#fff' }),
  st('s6', '소라', LG_C.mint, '', '영등포', 'club', '2시간 전', 2, '원서 북클럽\n3주차', '어린 왕자 여우 장면을 영어로 소리 내어 읽었어요', [LG_C.sky, 'BOOK']),
  st('s14', '태오', LG_C.lpu, '', '영등포', 'club', '어제', 26, '러닝 동아리\n석촌호수 5K', '뛰면서 영어로 수다, 생각보다 숨차요', [LG_C.y, '5K']),
  st('s15', '지우', LG_C.sky, '', '대전 둔산점', 'club', '어제', 30, '일본 드라마\n쉐도잉 모임', '오늘의 대사: 大丈夫だよ。', [LG_C.pk, 'JP']),
  st('s19', '유키', LG_C.lpu, '', '연신내', 'rev', '방금', 0, '홍대 이자카야\n번개 미리 보기', '목요일 19:30! 메뉴판을 일본어로 읽는 연습 중이에요', [LG_C.pk, 'NEW']),
  st('s5', 'Leo', LG_C.pk, '리더', '연신내', 'rev', '1시간 전', 1, '광안리 러닝\n& 스몰토크', '8명 모두 완주! 다음 주엔 10명 모여요.', [LG_C.sky, '5K'], { avc: '#fff' }),
  st('s8', '태오', LG_C.lpu, '', '영등포', 'rev', '4시간 전', 4, '판교 점심\n영어 산책', '30분 걷고 표현 3개 건졌어요', [LG_C.y, 'WALK']),
  st('s16', '하나', LG_C.y, '리더', '영등포', 'rev', '2일 전', 50, '할로윈\n영어 펍 번개', '8명 꽉 채웠어요. 코스튬 1등은 민준!', [LG_C.pu, 'BOO']),
  st('s7', '예린', LG_C.lsky, '', '잠실점', 'abroad', '3시간 전', 3, '시드니의\n아침 커피', 'Flat white 주문은 이제 안 떨려요', [LG_C.lsky, 'SYD']),
  st('s10', 'Kenji', LG_C.pk, '', '연신내', 'abroad', '6시간 전', 6, '도쿄\n퇴근길', 'おつかれさま! 오늘도 일본어로 하루 끝', [LG_C.pk, 'TYO'], { avc: '#fff' }),
  st('s17', '도윤', LG_C.y, '', '영등포', 'abroad', '어제', 28, '오사카\n둘째 날', '길 물어볼 때 세션 문장 그대로 썼어요', [LG_C.sky, 'OSAKA']),
  st('s4', '민준', LG_C.sky, '', '잠실점', 'daily', '35분 전', 0.6, 'I’m on the fence\nabout it.', '점심 메뉴 고르다가 바로 써먹은 표현', [LG_C.y, 'ON THE\nFENCE']),
  st('s18', '소라', LG_C.mint, '', '영등포', 'daily', '3시간 전', 3, 'It’s on me\ntoday.', '오늘은 내가 살게! 북클럽 끝나고 써 봤어요', [LG_C.y, 'ON ME']),
  st('s3', '하나', LG_C.y, '리더', '영등포', 'chal', '10분 전', 0.2, '주말 이야기\n20분 챌린지', '오늘 세션 끝! 다들 영어로만 20분 버텼어요.', [LG_C.lpu, 'WEEK\n46']),
  st('s11', '수아', LG_C.lpu, '', '대전 둔산점', 'abroad', '7시간 전', 7, '더블린에서\n온라인 세션', '시차 8시간, 그래도 출석!', [LG_C.sky, 'DUB']),
  st('s20', '하나', LG_C.y, '리더', '영등포', 'chal', '2일 전', 50, '30일 하루 한 문장\n15일째', '반 왔어요! 같이 끝까지 가요', [LG_C.lpu, '15\n/30']),
  st('s21', '태오', LG_C.lpu, '', '영등포', 'chal', '3일 전', 74, '주 3회 쉐도잉\n첫 주 완료', '3번 다 했어요. 생각보다 재밌어요', [LG_C.y, '3\n/12']),
  st('s22', '민서', LG_C.lpu, '', '대구 달서점', 'rev', '3일 전', 72, '양림동 카페\n영어 수다', '처음 온 분이 3명! 다음엔 6명 꽉 채워요', [LG_C.sky, 'CAFE']),
  st('s23', '수아', LG_C.lpu, '', '대전 둔산점', 'abroad', '2일 전', 48, '더블린\n비 오는 날', 'It’s raining cats and dogs! 진짜 이렇게 말해요', [LG_C.sky, 'RAIN']),
  st('s24', '지우', LG_C.sky, '', '대전 둔산점', 'daily', '2일 전', 52, 'It’s up to\nyou.', '메뉴 고를 때 친구가 쓴 표현, 바로 메모!', [LG_C.y, 'UP TO\nYOU']),
  st('s25', '하람', LG_C.mint, '', '부산 수영점', 'daily', '4일 전', 96, 'Let’s call\nit a day.', '애월 산책 끝나고 다 같이 외쳤어요', [LG_C.pk, 'DAY']),
  st('s26', '민준', LG_C.sky, '', '잠실점', 'daily', '2일 전', 49, '화요일 세션\n출석 완료', '오늘 주제는 여행 계획 세우기', [LG_C.lpu, 'TUE']),
];
export const STORY_DAY = 24;

// ---- 댓글 · 좋아요 누른 사람 (예시) ----
/** [이름, 얼굴 바탕, 댓글] (프로토타입 LG_CMTS) — 글마다 앞의 두 개가 예시 댓글 */
export const LG_CMTS: [string, string, string][] = [
  ['민준', LG_C.sky, '오 저도 이 표현 써봤어요!'],
  ['소라', LG_C.mint, '다음 번개는 꼭 갈게요'],
  ['Leo', LG_C.pk, 'Nice! 발음 연습 같이 해요'],
];
/** 스토리 예시 공개 댓글 (프로토타입 LG_SCMT_SEED) */
export const STORY_CMTS: Record<string, [string, string, string][]> = {
  s1: [['소라', LG_C.mint, '드레스코드 빨간색 메모했어요!'], ['Leo', LG_C.pk, '일본어 테이블에서 만나요']],
  s19: [['하나', LG_C.y, '메뉴판 읽기 연습 좋다! 저도 갈게요'], ['지우', LG_C.sky, 'おいしそう〜']],
  s12: [['하나', LG_C.y, '17일째 대단해요! 같이 끝까지 가요']],
  s5: [['태오', LG_C.lpu, '다음 주엔 저도 뛸게요']],
  s3: [['수아', LG_C.lpu, '주말 이야기 저도 해 보고 싶어요']],
};
/** 좋아요 누른 사람 후보 (프로토타입 LG_MEMS + LG_POOL: 이름 · 얼굴 바탕 · 지점) */
export const LG_LIKERS: [string, string, string][] = [
  ['지우', LG_C.sky, '대전 둔산점 · 영등포'],
  ['소라', LG_C.mint, '영등포 · 연신내'],
  ['Leo', LG_C.pk, '연신내'],
  ['민준', LG_C.lsky, '잠실점'],
  ['유키', LG_C.lpu, '연신내'],
  ['태오', LG_C.y, '영등포'],
  ['하람', LG_C.sky, '부산 수영점'],
  ['수아', LG_C.lpu, '잠실점 · 대구 달서점'],
  ['하나', LG_C.y, '영등포'],
  ['Jay', LG_C.pk, '연신내'],
  ['민서', LG_C.lsky, '대구 달서점'],
  ['라파', LG_C.y, '대전 둔산점'],
  ['서준', LG_C.mint, '잠실점'],
  ['예린', LG_C.sky, '잠실점'],
  ['Kenji', LG_C.lpu, '연신내'],
  ['다온', LG_C.pk, '영등포 · 잠실점'],
];
/** 댓글 시간 예시 (프로토타입 LG_CTIME) */
export const LG_CTIME = ['14시간', '12시간', '6시간', '5시간', '3시간', '1시간', '30분', '5분'];

// ---- 지점 (프로토타입 LG_BRS · LG_BREG) ----
export const LG_BREG = ['서울', '경기', '충청', '경상'] as const;
export type BranchRegion = (typeof LG_BREG)[number];
export const LG_BRS: [string, BranchRegion][] = [
  ['가산', '서울'], ['연신내', '서울'], ['영등포', '서울'], ['잠실점', '서울'],
  ['구리다산점', '경기'], ['김포점', '경기'], ['범계', '경기'], ['부천', '경기'], ['분당점', '경기'], ['수원영통점', '경기'], ['수지점', '경기'], ['일산', '경기'], ['하남점', '경기'],
  ['대전 둔산점', '충청'], ['대전 은행점', '충청'], ['천안 불당점', '충청'], ['천안 신부점', '충청'],
  ['구미점', '경상'], ['대구 달서점', '경상'], ['대구동성로', '경상'], ['대구일본어중국어점', '경상'], ['부산 수영점', '경상'], ['부산대점', '경상'], ['울산점', '경상'], ['창원', '경상'],
];

// ---- 공통 계산 ----
const LANGS = ['영어', '일본어', '중국어', '스페인어'] as const;
export type StudyLangName = (typeof LANGS)[number];
export const LANG_COLOR: Record<StudyLangName, string> = { 영어: Colors.langEn, 일본어: Colors.langJa, 중국어: Colors.langZh, 스페인어: Colors.langEs };
/** 이름 글자 합 (프로토타입 pfHash · lgH — 예시 숫자를 늘 같게) */
export const nameHash = (s: string) => [...s].reduce((a, c) => a + c.charCodeAt(0), 0);
/** 멤버 학습 언어 (프로토타입 memberLangs: 이름 글자 합으로 늘 같은 값) */
export function memberLangs(name: string, me: string): StudyLangName[] {
  if (name === me) return ['영어'];
  if (!name || name === 'PALLO') return [];
  const h = nameHash(name);
  const a = LANGS[h % 4];
  return h % 3 === 0 ? [a, LANGS[(h + 1) % 4]] : [a];
}

/** 오늘부터 며칠 (프로토타입 LG_DD) */
export function daysFrom(iso: string) {
  const d = new Date(`${iso}T00:00`);
  const t = new Date();
  const t0 = new Date(t.getFullYear(), t.getMonth(), t.getDate());
  return Math.round((d.getTime() - t0.getTime()) / 864e5);
}
const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
export const meetIso = (p: { mon: string; day: string }) => `2026-${String(MON.indexOf(p.mon) + 1).padStart(2, '0')}-${p.day.padStart(2, '0')}`;
export const meetMonth = (p: { mon: string }) => MON.indexOf(p.mon) + 1;
/** '11.22' (프로토타입 lgMD) */
export const monthDay = (iso: string) => {
  const d = new Date(`${iso}T00:00`);
  return `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, '0')}`;
};
export const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;

/** 고른 지점의 글만 (프로토타입 lgBrOk) — 아무것도 안 골랐으면 모두, '전 지점'은 늘 보여요 */
export function branchOk(brs: string[], br: string | undefined) {
  if (!brs.length) return true;
  const b = br ?? '';
  if (!b || b.includes('전 지점')) return true;
  return brs.some((x) => b.includes(x));
}
