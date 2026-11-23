/**
 * 마이 A 가짜 데이터 — 꾸미기 상점 · 배지 · 랭킹 · 멤버 · 지점 안내 · 내 표현함 예시.
 * 값 · id 는 프로토타입(prototype/index.html 의 AV_ITEMS · AV_BG · MY_BADGES · RANK_PEOPLE · LG_MEMS · BR_BOARDS · S.marks)과 같아요.
 * 맞는 API: docs/appendix/api-inventory.md — 7 `/members/:id` · 29 `/me/expressions` · 31 `/ranking` · 32 `/me/summary`
 *           · 33 `/me/badges` · 34 `/me/avatar` · 35 `/avatar/items` · 36 `/me/avatar/purchase` · 38 `/branches`
 */
import type { SavedExpression } from '@/state/expressions';

// ---------------------------------------------------------------- 꾸미기 (스파크 상점)

export type AvCat = 'hair' | 'eye' | 'mitt' | 'shoe' | 'hat' | 'face' | 'wear' | 'hand' | 'acc';
export type AvRare = '기본' | '일반' | '레어' | '에픽' | '시즌';
/** back: 캐릭터 뒤 · front: 앞 · paint: 몸에 칠한 옷 · eye: 눈 위 덧그림 · fx: 배경 위 효과 */
export type AvLayer = 'back' | 'front' | 'paint' | 'eye' | 'fx';
export type AvItem = {
  id: string;
  cat: AvCat;
  name: string;
  price: number;
  rare: AvRare;
  /** 시즌 아이템: 보상으로만 받아요 (잠김 이유) */
  lock?: string;
  layer: AvLayer;
  hat?: boolean;
  hair?: boolean;
  /** 위치 [가운데 x%, 위 y%, 너비%] (캐릭터 상자 기준) */
  p?: readonly [number, number, number];
  /** 졸린 · 느긋한 눈: 눈꺼풀이 덮는 정도 */
  lid?: number;
};
export type AvBg = { id: string; name: string; price: number; rare: AvRare; lock?: string; /** 동그란 프로필 바탕색 (프로토타입 lgFace) */ face: string };

/** 꾸민 모습. color · bg · hc 는 이름이거나 직접 고른 '#RRGGBB' */
export type Avatar = {
  color: string;
  flip: boolean;
  bg: string;
  /** 머리 색 */
  hc: string;
  /** 캐릭터 옆 말풍선 (14자) */
  say: string;
  eq: Record<AvCat, string | null>;
};

/** 프로토타입 AV_ITEMS (모자는 눈 뒤 · 조금 크게 · 위로 옮긴 뒤 값 · 헤어 · 칠하는 옷 · 눈까지 같은 순서) */
export const AV_ITEMS: AvItem[] = [
  { id: 'h-beanie', cat: 'hat', name: '털 비니', price: 0, rare: '기본', layer: 'back', hat: true, p: [58, -35, 40] },
  { id: 'h-cap', cat: 'hat', name: '야구 모자', price: 120, rare: '일반', layer: 'back', hat: true, p: [58, -35, 40] },
  { id: 'h-beret', cat: 'hat', name: '화가 베레모', price: 120, rare: '일반', layer: 'back', hat: true, p: [58, -24, 42] },
  { id: 'h-straw', cat: 'hat', name: '밀짚모자', price: 180, rare: '일반', layer: 'back', hat: true, p: [58, -34, 51] },
  { id: 'h-party', cat: 'hat', name: '파티 고깔', price: 150, rare: '일반', layer: 'back', hat: true, p: [58, -44, 29] },
  { id: 'h-ribbon', cat: 'hat', name: '큰 리본', price: 150, rare: '일반', layer: 'back', hat: true, p: [58, -22, 37] },
  { id: 'h-bunny', cat: 'hat', name: '토끼 귀', price: 300, rare: '레어', layer: 'back', hat: true, p: [58, -46, 37] },
  { id: 'h-phones', cat: 'hat', name: '헤드폰', price: 300, rare: '레어', layer: 'back', hat: true, p: [58, -30, 55] },
  { id: 'h-grad', cat: 'hat', name: '학사모', price: 400, rare: '레어', layer: 'back', hat: true, p: [58, -36, 44] },
  { id: 'h-witch', cat: 'hat', name: '마녀 모자', price: 500, rare: '에픽', layer: 'back', hat: true, p: [58, -52, 48] },
  { id: 'h-santa', cat: 'hat', name: '산타 모자', price: 0, rare: '시즌', lock: '12월 출석 7일 보상', layer: 'back', hat: true, p: [56, -38, 48] },
  { id: 'h-crown', cat: 'hat', name: '황금 왕관', price: 0, rare: '시즌', lock: '주간 랭킹 TOP 3 보상', layer: 'back', hat: true, p: [58, -34, 37] },
  { id: 'f-patch', cat: 'face', name: '해적 안대', price: 200, rare: '일반', layer: 'front', p: [50, -2, 17] },
  { id: 'f-cheek', cat: 'face', name: '발그레 볼', price: 0, rare: '기본', layer: 'front', p: [58, 39, 46] },
  { id: 'f-cheek2', cat: 'face', name: '복숭아 볼', price: 80, rare: '일반', layer: 'front', p: [58, 39, 46] },
  { id: 'f-cheek3', cat: 'face', name: '하트 볼', price: 150, rare: '일반', layer: 'front', p: [58, 39, 46] },
  { id: 'f-cheek4', cat: 'face', name: '수줍은 볼', price: 120, rare: '일반', layer: 'front', p: [58, 39, 46] },
  { id: 'f-cheek5', cat: 'face', name: '반짝 볼', price: 200, rare: '레어', layer: 'front', p: [58, 39, 46] },
  { id: 'f-stache', cat: 'face', name: '콧수염', price: 120, rare: '일반', layer: 'front', p: [58, 39, 20] },
  { id: 'f-stache2', cat: 'face', name: '꼬불 수염', price: 150, rare: '일반', layer: 'front', p: [58, 38, 30] },
  { id: 'f-stache3', cat: 'face', name: '팔자 수염', price: 150, rare: '일반', layer: 'front', p: [58, 39, 28] },
  { id: 'f-stache4', cat: 'face', name: '하얀 콧수염', price: 120, rare: '일반', layer: 'front', p: [58, 39, 20] },
  { id: 'f-beard', cat: 'face', name: '산타 수염', price: 0, rare: '시즌', lock: '12월 출석 7일 보상', layer: 'front', p: [58, 38, 34] },
  { id: 'f-freck', cat: 'face', name: '주근깨', price: 80, rare: '일반', layer: 'front', p: [58, 39, 46] },
  { id: 'w-bow', cat: 'wear', name: '나비넥타이', price: 0, rare: '기본', layer: 'front', p: [58, 40, 18] },
  { id: 'w-tie', cat: 'wear', name: '넥타이', price: 120, rare: '일반', layer: 'front', p: [58, 40, 8] },
  { id: 'w-scarf', cat: 'wear', name: '줄무늬 목도리', price: 180, rare: '일반', layer: 'front', p: [57, 38, 40] },
  { id: 'w-lei', cat: 'wear', name: '꽃목걸이', price: 200, rare: '레어', layer: 'front', p: [58, 38, 40] },
  { id: 'w-medal', cat: 'wear', name: '금메달', price: 0, rare: '시즌', lock: '지점 대항전 우승 보상', layer: 'front', p: [58, 39, 13] },
  { id: 'w-bib', cat: 'wear', name: '러닝 배번표', price: 150, rare: '일반', layer: 'front', p: [57, 50, 18] },
  { id: 'w-apron', cat: 'wear', name: '카페 앞치마', price: 200, rare: '일반', layer: 'paint' },
  { id: 'w-hanbok', cat: 'wear', name: '한복 저고리', price: 350, rare: '레어', layer: 'paint' },
  { id: 'd-book', cat: 'hand', name: '원서 책', price: 0, rare: '기본', layer: 'front', p: [91, 18, 23] },
  { id: 'd-mic', cat: 'hand', name: '마이크', price: 150, rare: '일반', layer: 'front', p: [92, 9, 13] },
  { id: 'd-coffee', cat: 'hand', name: '테이크아웃 커피', price: 120, rare: '일반', layer: 'front', p: [92, 14, 17] },
  { id: 'd-flag', cat: 'hand', name: 'PALLO 깃발', price: 0, rare: '기본', layer: 'front', p: [93, 0, 23] },
  { id: 'd-balloon', cat: 'hand', name: '하트 풍선', price: 180, rare: '일반', layer: 'front', p: [93, -8, 22] },
  { id: 'd-flower', cat: 'hand', name: '꽃다발', price: 250, rare: '레어', layer: 'front', p: [92, 11, 22] },
  { id: 'd-racket', cat: 'hand', name: '배드민턴 라켓', price: 200, rare: '일반', layer: 'front', p: [92, -2, 20] },
  { id: 'd-passport', cat: 'hand', name: '여권', price: 200, rare: '일반', layer: 'front', p: [91, 16, 17] },
  { id: 'd-mega', cat: 'hand', name: '확성기', price: 300, rare: '레어', layer: 'front', p: [95, 20, 25] },
  { id: 'd-brush', cat: 'hand', name: '그림 붓', price: 150, rare: '일반', layer: 'front', p: [92, 0, 12] },
  { id: 'a-wings', cat: 'acc', name: '천사 날개', price: 700, rare: '에픽', layer: 'back', p: [54, -14, 108] },
  { id: 'a-watch', cat: 'acc', name: '손목시계', price: 150, rare: '일반', layer: 'paint' },
  { id: 'a-umbrella', cat: 'hand', name: '노랑 우산', price: 300, rare: '레어', layer: 'front', p: [95, -18, 44] },
  { id: 'a-spark', cat: 'acc', name: '반짝반짝 효과', price: 400, rare: '에픽', layer: 'fx' },
  { id: 'a-hearts', cat: 'acc', name: '하트 뿅뿅', price: 400, rare: '에픽', layer: 'fx' },
  { id: 'a-notes', cat: 'acc', name: '음표 둥둥', price: 300, rare: '레어', layer: 'fx' },
  { id: 'hr-sprout', cat: 'hair', name: '한 가닥', price: 0, rare: '기본', layer: 'back', hair: true, p: [58, -25, 30] },
  { id: 'hr-spiky', cat: 'hair', name: '삐죽 머리', price: 0, rare: '기본', layer: 'back', hair: true, p: [58, -32, 52] },
  { id: 'hr-bun', cat: 'hair', name: '똥머리', price: 100, rare: '일반', layer: 'back', hair: true, p: [58, -32, 50] },
  { id: 'hr-swoop', cat: 'hair', name: '바람 머리', price: 100, rare: '일반', layer: 'back', hair: true, p: [58, -32, 52] },
  { id: 'hr-bob', cat: 'hair', name: '단발', price: 120, rare: '일반', layer: 'back', hair: true, p: [58, -26, 60] },
  { id: 'hr-pig', cat: 'hair', name: '양갈래', price: 150, rare: '일반', layer: 'back', hair: true, p: [58, -30, 80] },
  { id: 'hr-pony', cat: 'hair', name: '포니테일', price: 150, rare: '일반', layer: 'back', hair: true, p: [64, -26, 64] },
  { id: 'hr-curly', cat: 'hair', name: '뽀글 펌', price: 150, rare: '일반', layer: 'back', hair: true, p: [58, -34, 54] },
  { id: 'hr-mohawk', cat: 'hair', name: '모히칸', price: 200, rare: '레어', layer: 'back', hair: true, p: [58, -28, 40] },
  { id: 'hr-afro', cat: 'hair', name: '아프로', price: 250, rare: '레어', layer: 'back', hair: true, p: [58, -43, 62] },
  { id: 'w-vest', cat: 'wear', name: '단추 조끼', price: 200, rare: '일반', layer: 'paint' },
  { id: 'w-vest2', cat: 'wear', name: '하늘 조끼', price: 200, rare: '일반', layer: 'paint' },
  { id: 'w-vest3', cat: 'wear', name: '보라 니트 조끼', price: 350, rare: '레어', layer: 'paint' },
  { id: 'w-apron2', cat: 'wear', name: '핑크 앞치마', price: 200, rare: '일반', layer: 'paint' },
  { id: 'g-red', cat: 'mitt', name: '빨강 벙어리장갑', price: 0, rare: '기본', layer: 'paint' },
  { id: 'g-purple', cat: 'mitt', name: '보라 벙어리장갑', price: 120, rare: '일반', layer: 'paint' },
  { id: 'g-mint', cat: 'mitt', name: '민트 벙어리장갑', price: 120, rare: '일반', layer: 'paint' },
  { id: 'g-white', cat: 'mitt', name: '하얀 장갑', price: 150, rare: '일반', layer: 'paint' },
  { id: 'g-box', cat: 'mitt', name: '복싱 글러브', price: 300, rare: '레어', layer: 'paint' },
  { id: 's-purple', cat: 'shoe', name: '보라 운동화', price: 0, rare: '기본', layer: 'paint' },
  { id: 's-red', cat: 'shoe', name: '빨강 운동화', price: 120, rare: '일반', layer: 'paint' },
  { id: 's-black', cat: 'shoe', name: '검정 구두', price: 150, rare: '일반', layer: 'paint' },
  { id: 's-stripe', cat: 'shoe', name: '줄무늬 양말', price: 150, rare: '일반', layer: 'paint' },
  { id: 's-boot', cat: 'shoe', name: '빨강 장화', price: 250, rare: '레어', layer: 'paint' },
  { id: 's-snow', cat: 'shoe', name: '털 부츠', price: 0, rare: '시즌', lock: '12월 출석 7일 보상', layer: 'paint' },
  { id: 'e-sparkle', cat: 'eye', name: '반짝 눈', price: 0, rare: '기본', layer: 'eye' },
  { id: 'e-lash', cat: 'eye', name: '속눈썹', price: 120, rare: '일반', layer: 'eye' },
  { id: 'e-liner', cat: 'eye', name: '아이라인', price: 120, rare: '일반', layer: 'eye' },
  { id: 'e-sleepy', cat: 'eye', name: '졸린 눈', price: 100, rare: '일반', layer: 'eye', lid: 0.44 },
  { id: 'e-calm', cat: 'eye', name: '느긋한 눈', price: 100, rare: '일반', layer: 'eye', lid: 0.26 },
  { id: 'e-heart', cat: 'eye', name: '하트 눈', price: 250, rare: '레어', layer: 'eye' },
  { id: 'e-star', cat: 'eye', name: '별 눈', price: 250, rare: '레어', layer: 'eye' },
];
export const AV_ITEM: Record<string, AvItem> = Object.fromEntries(AV_ITEMS.map((i) => [i.id, i]));
export const HAIR = AV_ITEMS.filter((i) => i.hair);

/** 배경 (그림은 assets/characters/av/bg-*.png) */
export const AV_BG: AvBg[] = [
  { id: 'cream', name: '크림 룸', price: 0, rare: '기본', face: '#FBF6EA' },
  { id: 'yellow', name: '팔로 옐로', price: 0, rare: '기본', face: '#FFE200' },
  { id: 'sky', name: '맑은 하늘', price: 100, rare: '일반', face: '#BFE0F2' },
  { id: 'sea', name: '여름 바다', price: 150, rare: '일반', face: '#BFE0F2' },
  { id: 'sunset', name: '노을', price: 150, rare: '일반', face: '#FFB36B' },
  { id: 'cherry', name: '벚꽃길', price: 200, rare: '레어', face: '#FCE4EC' },
  { id: 'library', name: '도서관', price: 200, rare: '레어', face: '#E8D9BF' },
  { id: 'cafe', name: '단골 카페', price: 200, rare: '레어', face: '#D9B48F' },
  { id: 'track', name: '러닝 트랙', price: 200, rare: '레어', face: '#5CBF8A' },
  { id: 'party', name: '파티 조명', price: 300, rare: '레어', face: '#493087' },
  { id: 'snow', name: '눈 오는 밤', price: 0, rare: '시즌', lock: '12월 출석 7일 보상', face: '#3D4B85' },
  { id: 'night', name: '서울 야경', price: 400, rare: '에픽', face: '#1E1A2B' },
  { id: 'space', name: '우주 정거장', price: 500, rare: '에픽', face: '#120F24' },
];

/** 추천 몸 색 [이름, 표시 이름, 가격] — 원본 PNG 가 색마다 따로 있어요 */
export const AVC_LIST: readonly (readonly [string, string, number])[] = [
  ['yellow', '팔로 옐로', 0],
  ['purple', '팔로 퍼플', 0],
  ['pink', '버블 핑크', 0],
  ['sky', '스카이', 0],
  ['green', '민트 그린', 0],
  ['coral', '코랄', 0],
  ['purple-lash', '속눈썹 퍼플', 400],
];
export const AV_COLOR_HEX: Record<string, string> = { yellow: '#FFE200', purple: '#493087', pink: '#F28CB1', sky: '#7FA7E8', green: '#5CBF8A', coral: '#FF7A59', 'purple-lash': '#493087' };
export const AV_SW = ['#FFE200', '#FFB800', '#FF7A59', '#E5484D', '#F28CB1', '#D16BD6', '#8B5CF6', '#493087', '#2F6FD0', '#7FA7E8', '#38BDF8', '#2DD4BF', '#5CBF8A', '#9BCB3C', '#B5651D', '#3A3A48', '#A7ABB8', '#FFF4D6'];
export const HAIR_SW = ['#1E1A2B', '#3B2A20', '#7A4A2A', '#C68B4E', '#F2D16B', '#FFFFFF', '#F28CB1', '#E5484D', '#8B5CF6', '#7FA7E8', '#5CBF8A', '#A7ABB8'];
export const BG_SW = ['#FBF6EA', '#FFF1A8', '#FFE0EA', '#E5DDF6', '#DCEBFF', '#D7F2E3', '#FFE3D6', '#F2F2F2', '#1E1A2B', '#493087', '#2F6FD0', '#5CBF8A'];

export type AvTab = 'char' | AvCat | 'bg' | 'say';
export const AV_CATS: readonly (readonly [AvTab, string])[] = [
  ['char', '몸 색'],
  ['hair', '헤어'],
  ['eye', '눈'],
  ['hat', '모자'],
  ['face', '얼굴'],
  ['wear', '옷'],
  ['mitt', '장갑'],
  ['shoe', '신발'],
  ['hand', '손'],
  ['acc', '액세서리'],
  ['bg', '배경'],
  ['say', '한마디'],
];
/** 등급 글자색 (프로토타입 AV_RARE_C) */
export const AV_RARE_C: Record<AvRare, string> = { 기본: '#5A5366', 일반: '#5A5366', 레어: '#2F6FD0', 에픽: '#493087', 시즌: '#D2477A' };
export const SAY_IDEAS = ['Hello!', '같이 말해요', '오늘도 출석!', 'こんにちは', '你好!', "Let's go!", '말 걸어 주세요'];

/** 세션 출석 스파크 — 지금 장부(state/ledger)에 연결된 스파크 규칙은 이것 하나 (나머지는 정책 정해지면) */
export const SPARK_ATTEND = 50;
/** 스파크 모으는 법 (프로토타입 earn 시트) */
export const SPARK_EARN: readonly (readonly [string, string])[] = [
  ['세션 출석', `+${SPARK_ATTEND}`],
  ['오늘 퀘스트 완료', '+30'],
  ['번개 · 정기 모임 참여', '+40'],
  ['7일 연속 학습', '+200'],
  ['게시판 첫 글 · 첫 인사', '+20'],
  ['주간 랭킹 TOP 3', '+300 · 왕관'],
];

/** 처음 모습 (프로토타입 avFresh: 털 비니 · 나비넥타이 · 깃발 · 보라 운동화) */
export const avFresh = (): Avatar => ({
  color: 'yellow',
  flip: false,
  bg: 'cream',
  hc: '#3B2A20',
  say: '',
  eq: { hair: null, eye: null, mitt: null, shoe: 's-purple', hat: 'h-beanie', face: null, wear: 'w-bow', hand: 'd-flag', acc: null },
});
/** 처음부터 가진 것: 기본 등급 아이템 · 배경 */
export const AV_OWN0 = ['yellow', 'purple', 'cream', 'yellow-bg', ...AV_ITEMS.filter((i) => i.rare === '기본').map((i) => i.id), ...AV_BG.filter((b) => b.rare === '기본').map((b) => 'bg:' + b.id)];

// ---------------------------------------------------------------- 멤버 (다른 사람 캐릭터는 이름으로 늘 같은 조합)

export type Member = { name: string; color: string; branch: string };
const C = { y: '#FFE200', pk: '#D0798E', sky: '#8FA6DC', lpu: '#E5DDF6', lsky: '#E3EAF8', mint: '#CDEBD0' };
/** 프로토타입 LG_MEMS · LG_POOL */
export const MEMBERS: Member[] = [
  { name: '지우', color: C.sky, branch: '대전 둔산점 · 영등포' },
  { name: '소라', color: C.mint, branch: '영등포 · 연신내' },
  { name: 'Leo', color: C.pk, branch: '연신내' },
  { name: '민준', color: C.lsky, branch: '잠실점' },
  { name: '유키', color: C.lpu, branch: '연신내' },
  { name: '태오', color: C.y, branch: '영등포' },
  { name: '하람', color: C.sky, branch: '부산 수영점' },
  { name: '수아', color: C.lpu, branch: '잠실점 · 대구 달서점' },
];
export const MEMBER_POOL: Member[] = [
  { name: '하나', color: C.y, branch: '영등포' },
  { name: 'Jay', color: C.pk, branch: '연신내' },
  { name: '민서', color: C.lsky, branch: '대구 달서점' },
  { name: '라파', color: C.y, branch: '대전 둔산점' },
  { name: '서준', color: C.mint, branch: '잠실점' },
  { name: '예린', color: C.sky, branch: '잠실점' },
  { name: 'Kenji', color: C.lpu, branch: '연신내' },
  { name: '다온', color: C.pk, branch: '영등포 · 잠실점' },
];
export const findMember = (name: string) => [...MEMBERS, ...MEMBER_POOL].find((m) => m.name === name);

/** 이름 → 늘 같은 캐릭터 (프로토타입 memberAv: 이름이 달라도 겹치지 않게 잘 섞어요) */
export function memberAvatar(name: string): Avatar {
  const h = [...name].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const pick = <T,>(L: readonly T[], k: number): T => L[((h >>> k % 5) + k * 7) % L.length];
  const of = (cat: AvCat, open = false) => AV_ITEMS.filter((i) => i.cat === cat && (open || !i.lock));
  const idOf = (x: AvItem | null) => (x ? x.id : null);
  return {
    color: pick(['yellow', 'purple', 'pink', 'sky', 'green', 'coral', '#8B5CF6', '#2DD4BF', '#FFB800', '#E5484D', '#38BDF8'], 0),
    hc: pick(HAIR_SW, 6),
    say: h % 4 === 1 ? pick(SAY_IDEAS, 2) : '',
    flip: h % 2 === 0,
    bg: pick(AV_BG.filter((b) => !b.lock), 3).id,
    eq: {
      hair: idOf(pick([null, null, ...HAIR], 7)),
      hat: h % 3 === 0 ? null : pick(of('hat'), 1).id,
      face: idOf(pick([null, ...of('face', true)], 2)),
      wear: idOf(pick([null, ...of('wear')], 4)),
      hand: idOf(pick([null, ...of('hand', true)], 5)),
      shoe: idOf(pick([null, ...of('shoe')], 8)),
      mitt: h % 3 === 1 ? idOf(pick(of('mitt', true), 9)) : null,
      eye: h % 2 ? idOf(pick(of('eye', true), 10)) : null,
      acc: null,
    },
  };
}

/** 프로필 숫자 계산에 쓰는 이름 값 (프로토타입 pfHash) */
export const nameHash = (name: string) => [...name].reduce((a, c) => a + c.charCodeAt(0), 0);

const LANGS = ['영어', '일본어', '중국어', '스페인어'] as const;
export type LangName = (typeof LANGS)[number];
/** 멤버 학습 언어: 두 언어 병행이면 두 개 (프로토타입 memberLangs) */
export function memberLangs(name: string): LangName[] {
  if (!name || name === 'PALLO') return [];
  const h = nameHash(name);
  const a = LANGS[h % 4];
  return h % 3 === 0 ? [a, LANGS[(h + 1) % 4]] : [a];
}

/** 프로필 @아이디 (프로토타입 openProfile) */
const HANDLE: Record<string, string> = { 하나: 'hana', 소라: 'sora', 민준: 'minjun', 유키: 'yuki', 지우: 'jiwoo', 서연: 'seoyeon', 도윤: 'doyoon' };
export const memberHandle = (name: string) => `@${HANDLE[name] || (/^[A-Za-z]/.test(name) ? name.toLowerCase() : 'pallo')}_${nameHash(name) % 97}`;

/** 팔로잉 · 팔로워 목록 (프로토타입 pfLists — 예시) */
export function followLists(name: string, me: { name: string; branch: string }, following: Record<string, boolean>) {
  const isMe = name === me.name;
  const h = nameHash(name);
  const all = [...MEMBERS, ...MEMBER_POOL].filter((m) => m.name !== name && m.name !== me.name);
  const meRow: Member = { name: me.name, color: C.y, branch: me.branch };
  const fing = isMe ? all.filter((m) => following[m.name]) : all.filter((_, i) => (h + i) % 3 !== 0).slice(0, 14);
  const fer = isMe ? all.filter((_, i) => i % 4 === 1).slice(0, 4) : [...(following[name] ? [meRow] : []), ...all.filter((_, i) => (h + i) % 2 === 0).slice(0, 16)];
  return { fing, fer };
}

// ---------------------------------------------------------------- 배지

export type BadgeIcon = 'flame' | 'bolt' | 'users' | 'mic' | 'book' | 'crown' | 'heart' | 'plane';
export type Badge = { ic: BadgeIcon; name: string; desc: string; on: boolean };
export const MY_BADGES: Badge[] = [
  { ic: 'flame', name: '7일 연속', desc: '7일 연속 학습', on: true },
  { ic: 'bolt', name: '첫 번개', desc: '번개 첫 참여', on: true },
  { ic: 'users', name: '동아리 멤버', desc: '동아리 첫 가입', on: false },
  { ic: 'mic', name: '말하기 100', desc: '따라 말하기 100문장', on: true },
  { ic: 'book', name: '첫 원서', desc: '북클럽 한 권 완독', on: false },
  { ic: 'crown', name: '주간 TOP 3', desc: '주간 랭킹 3위 안', on: false },
  { ic: 'heart', name: '인기 글', desc: '좋아요 50개 받은 글', on: false },
  { ic: 'plane', name: '해외 동행', desc: '동행 첫 참여', on: false },
];
/** 배지 · 숫자 칸 아이콘 (프로토타입 MY_BADGE_IC) */
export const BADGE_PATH: Record<BadgeIcon, string> = {
  flame: 'M12 3c2 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-4 2-7 2 1 3 3 3 5 1-2 1-6 1-9z',
  bolt: 'M13 2 4 14h7l-1 8 9-12h-7z',
  users: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M16 3a4 4 0 0 1 0 8M18 14a6 6 0 0 1 4 7',
  mic: 'M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5 11a7 7 0 0 0 14 0M12 18v3',
  book: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5V5.5',
  crown: 'M3 8l4 4 5-7 5 7 4-4-2 11H5z',
  heart: 'M12 20s-7.5-4.6-9.2-9.4C1.6 7 4 4 7.2 4c2 0 3.6 1.2 4.8 2.8C13.2 5.2 14.8 4 16.8 4 20 4 22.4 7 21.2 10.6 19.5 15.4 12 20 12 20z',
  plane: 'M2 16l20-8-6 14-4-6-6 4 2-6z',
};

// ---------------------------------------------------------------- 랭킹 (다른 멤버는 예시 · 퀘스트 1개 10P · 출석 30P)

export type RankPerson = { n: string; b: string; w: number; m: number };
export const RANK_PEOPLE: RankPerson[] = [
  { n: 'Mina', b: '영등포', w: 420, m: 1650 },
  { n: 'Jun', b: '연신내', w: 395, m: 1580 },
  { n: 'Sora', b: '영등포 · 연신내', w: 360, m: 1490 },
  { n: 'Hyun', b: '잠실점', w: 310, m: 1320 },
  { n: 'Yuna', b: '연신내', w: 280, m: 1210 },
  { n: 'Leo', b: '잠실점', w: 240, m: 1100 },
  { n: 'Dami', b: '영등포', w: 200, m: 980 },
  { n: 'Ken', b: '대전 둔산점', w: 150, m: 860 },
  { n: 'Ari', b: '대전 둔산점', w: 120, m: 720 },
  { n: 'Joy', b: '연신내', w: 90, m: 540 },
];
/** 순위 동그라미 색 (프로토타입 AV_COLORS) */
export const RANK_COLORS = ['#FFE200', '#D0798E', '#8FA6DC', '#CDEBD0', '#E5E0F5', '#FFD3B8'];
/** 이번 달 = 이번 주 이전까지 쌓인 내 포인트 + 이번 주 (프로토타입 ME.monthBase) */
export const MY_MONTH_BASE = 260;

export type RankRow = { n: string; b: string; pt: number; c: string; me?: boolean };
export function rankPeople(per: 'w' | 'm', me: { name: string; branch: string; weekPoints: number }): RankRow[] {
  const mine = per === 'w' ? me.weekPoints : MY_MONTH_BASE + me.weekPoints;
  const rows: RankRow[] = RANK_PEOPLE.map((p, i) => ({ n: p.n, b: p.b, pt: per === 'w' ? p.w : p.m, c: RANK_COLORS[i % RANK_COLORS.length] }));
  rows.push({ n: me.name, b: me.branch, pt: mine, c: '#493087', me: true });
  return rows.sort((a, b) => b.pt - a.pt || (a.me ? 1 : -1));
}

// ---------------------------------------------------------------- 지점 안내 (멤버가 보는 보드 · 편집은 관리자 화면에서)

export type BranchItemIcon = 'park' | 'wifi' | 'loc' | 'lock' | 'tel';
export type BranchItem = { ic: BranchItemIcon; bg: string; t: string; s?: string; d: string; cp?: readonly (readonly [string, string])[]; act?: readonly ['map' | 'tel', string]; star?: boolean };
export type Partner = { n: string; b: string; c: string; w: string; addr?: string; tel?: string; hrs?: string; info?: string; how?: string };
export type BranchBoard = { addr: string; hrs: string; pin: { t: string; by: string; at: string } | null; items: BranchItem[]; partners: Partner[] };
export const BR_BOARDS: Record<string, BranchBoard> = {
  하남점: {
    addr: '하남시 [주소] 3층',
    hrs: '평일 10~23시 · 주말 10~18시',
    pin: { t: '11/22(토) 건물 점검으로 주차장 이용이 어려워요', by: '매니저 Jay', at: '11.18' },
    items: [
      { ic: 'park', bg: '#FFE200', t: '주차 · 입금 계좌', s: '주차 · 계좌', d: '건물 지하 2층 · 스터디 시간 2시간 무료 · 데스크에 차량 번호를 말해 주세요', cp: [['입금 계좌 · 예금주 [이름] · 주차 추가 · 이벤트 참가비', '[은행] [계좌번호]']], star: true },
      { ic: 'wifi', bg: '#BFE4EC', t: '와이파이', d: '', cp: [['이름', 'PALLO_HANAM'], ['비밀번호', 'pallo2026!']], star: true },
      { ic: 'loc', bg: '#F6C9D4', t: '오시는 길 · 운영 시간', d: '하남시 [주소] 3층 · 평일 10~23시 · 주말 10~18시', act: ['map', '하남시 [주소]'], star: true },
      { ic: 'lock', bg: '#CDEBD0', t: '사물함', d: '3층 복도 · 비밀번호는 데스크에서 받아요' },
      { ic: 'tel', bg: '#FFE7D1', t: '지점 문의', d: '0507-0000-0000 · 평일 10~19시', act: ['tel', '0507-0000-0000'], star: true },
    ],
    partners: [
      { n: '카페 하남온', b: '음료 10% 할인', c: '#8A4B3A', w: 'CAFE', addr: '하남시 [주소] 1층 · 지점에서 도보 2분', tel: '031-000-0000', hrs: '매일 8~22시', info: '지점에서 걸어서 2분, 스터디 전후로 들르기 좋은 조용한 카페예요. 2층에 4인 테이블이 있어서 번개 모임이나 복습 자리로도 많이 써요. 영어로 주문하면 쿠키 하나를 더 주세요.', how: '주문할 때 PALLO 앱 멤버 화면을 보여 주세요' },
      { n: '북스 미사', b: '원서 15% 할인', c: '#493087', w: 'BOOKS', addr: '하남시 미사 [주소] 2층', hrs: '10~21시 · 월요일 휴무', info: '원서 · 그래픽노블 코너가 따로 있는 동네 서점이에요. PALLO 교재 원서도 주문해 줘요.', how: '계산할 때 멤버 화면을 보여 주세요' },
      { n: '스터디카페 온', b: '2시간 이용권 20% 할인', c: '#138A9E', w: 'STUDY' },
    ],
  },
  잠실점: {
    addr: '서울 송파구 [주소] 5층 · 잠실역 8번 출구 도보 3분',
    hrs: '평일 10~22시 · 주말 10~18시',
    pin: null,
    items: [
      { ic: 'park', bg: '#FFE200', t: '주차 · 입금 계좌', s: '주차 · 계좌', d: '롯데월드몰 주차장 · 데스크에서 3시간 할인 도장', cp: [['입금 계좌 · 예금주 [이름] · 이벤트 참가비', '[은행] [계좌번호]']], star: true },
      { ic: 'wifi', bg: '#BFE4EC', t: '와이파이', d: '', cp: [['이름', 'PALLO_JAMSIL'], ['비밀번호', 'jamsil2026!']], star: true },
      { ic: 'loc', bg: '#F6C9D4', t: '오시는 길 · 운영 시간', d: '서울 송파구 [주소] 5층 · 잠실역 8번 출구 도보 3분', act: ['map', '서울 송파구 [주소]'], star: true },
      { ic: 'tel', bg: '#FFE7D1', t: '지점 문의', d: '0507-1111-1111 · 평일 10~19시', act: ['tel', '0507-1111-1111'], star: true },
    ],
    partners: [{ n: '잠실 북카페', b: '음료 15% 할인', c: '#6B4E9B', w: 'BOOK CAFE', addr: '서울 송파구 [주소] 2층', info: '원서가 300권 넘게 있는 북카페예요. 스터디 끝나고 복습하기 좋아요.' }],
  },
};
/** 내가 듣는 팀의 지점들 (프로토타입 MY_TEAMS: 하남점 2팀 · 잠실점 1팀) */
export const MY_BRANCHES = ['하남점', '잠실점'];

// ---------------------------------------------------------------- 내 표현함 예시 (프로토타입 S.marks 14개 · 최근 저장한 게 위)

const NOW = Date.now();
const SEED: Omit<SavedExpression, 'id' | 'savedAt'>[] = [
  { en: 'I’d like to have a window seat.', ko: '창가 자리로 주세요', source: '여행 · 공항 체크인', from: 'trip' },
  { en: 'Could you say that again?', ko: '다시 말해 줄래요?', source: '프리토킹 · 11.12 영등포 세션', from: 'free' },
  { en: 'I’m on the fence about it.', ko: '아직 마음을 못 정했어요', source: 'Lv.1 · 6챕터 No Spoilers!', from: 'book' },
  { en: 'Do you have oat milk?', ko: '오트 우유 있나요?', source: 'Lv.1 · 1챕터 Cafe Complaint', from: 'book' },
  { en: 'Is the flight on time?', ko: '비행기가 제시간에 뜨나요?', source: '여행 · 공항 체크인', from: 'trip' },
  { en: 'That’s a good point.', ko: '좋은 지적이에요', source: '프리토킹 · 11.05 잠실 세션', from: 'free' },
  { en: 'I couldn’t agree more.', ko: '전적으로 동의해요', source: '리스닝 룸 · Coffee Chat', from: 'listen' },
  { en: 'Can you help me find a gift?', ko: '선물 찾는 것 좀 도와줄 수 있어요?', source: 'Lv.1 · 2챕터 Operation Cookbook', from: 'book' },
  { en: 'I have to finish this today.', ko: '오늘 이거 끝내야 해요', source: 'Lv.1 · 2챕터 Operation Cookbook', from: 'book' },
  { en: 'How long does it take to get there?', ko: '거기까지 얼마나 걸려요?', source: 'Lv.1 · 3챕터 Finding the Penguins', from: 'book' },
  { en: 'Are you free on Saturday?', ko: '토요일에 시간 돼요?', source: 'Lv.1 · 4챕터 Come Along', from: 'book' },
  { en: 'Let me check my schedule.', ko: '제 일정 좀 확인해 볼게요', source: 'Lv.1 · 4챕터 Come Along', from: 'book' },
  { en: 'How often do you go hiking?', ko: '얼마나 자주 등산 가요?', source: 'Lv.1 · 5챕터 Speaking of Hobbies', from: 'book' },
  { en: 'Tell me about your trip.', ko: '여행 이야기 해 주세요', source: 'Lv.1 · 6챕터 No Spoilers!', from: 'book' },
];
/** 내 표현함 처음 값 — state/expressions 가 이걸로 시작해요 (seedExpressions 로 다시 넣어도 겹치지 않아요) */
export const SEED_EXPRESSIONS: SavedExpression[] = SEED.map((x, i) => ({ ...x, id: `m${i + 1}`, savedAt: NOW - i * 3600_000 }));
