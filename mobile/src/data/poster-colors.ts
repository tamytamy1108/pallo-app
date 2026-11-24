/**
 * 만든 카드 색 (번개 · 동아리 · 챌린지 · 이벤트 제안을 열 때 고르는 카드 바탕색).
 * 카드는 기본 포스터 모양(번개 · 동아리는 동그라미 무늬, 챌린지 · 이벤트는 단색) 위에 고른 색과 직접 적은 문구를 넣어요.
 * 포스터 사진이 없으면 카드는 꼭 있어야 해요 (색은 기본 색부터 · 문구 첫 줄은 꼭 적어요). 사진이 있으면 카드는 선택이고,
 * 카드를 만들면 그게 대표(첫 장)가 되고 사진은 그 뒤에 붙어요.
 * 맞는 API(예정): 각 개설 요청의 `card: { color, words }`.
 */

/** 만든 카드: 바탕색 · 큰 글자 줄들 (최대 2줄) */
export type MadeCard = { color: string; words: string[] };

/** dark: 어두운 바탕 (글자 노랑) · acc: 포스터 무늬 색 */
export type CardColor = { name: string; hex: string; dark: boolean; acc: string };

export const CARD_COLORS: readonly CardColor[] = [
  { name: '팔로 옐로', hex: '#FFE200', dark: false, acc: '#D0798E' },
  { name: '로즈 핑크', hex: '#D0798E', dark: true, acc: '#FFFFFF' },
  { name: '팔로 퍼플', hex: '#493087', dark: true, acc: '#D0798E' },
  { name: '스카이', hex: '#8FA6DC', dark: false, acc: '#FFE200' },
  { name: '라벤더', hex: '#E5DDF6', dark: false, acc: '#493087' },
  { name: '민트', hex: '#7FD6A8', dark: false, acc: '#FFE200' },
  { name: '코랄', hex: '#FF8A6B', dark: false, acc: '#FFE200' },
  { name: '오렌지', hex: '#FFB547', dark: false, acc: '#FFFFFF' },
  { name: '블루', hex: '#2F6FD0', dark: true, acc: '#FFE200' },
  { name: '레드', hex: '#E5484D', dark: true, acc: '#FFE200' },
  { name: '잉크', hex: '#1E1A2B', dark: true, acc: '#FFE200' },
  { name: '크림', hex: '#FBF6EA', dark: false, acc: '#FFE200' },
];

export const cardColor = (hex: string) => CARD_COLORS.find((c) => c.hex === hex);
/** 고른 카드 색이 어두운지 (글자를 노랑으로) */
export const cardDark = (hex: string) => !!cardColor(hex)?.dark;
/** 적은 줄만 (빈 줄 빼고) — 다 비면 기본 글자 */
export const cardWords = (words: string[], fallback: string[]) => {
  const w = words.map((x) => x.trim()).filter(Boolean);
  return w.length ? w : fallback;
};
/** 가장 긴 줄이 칸 폭(width)의 82% 안에 들어가는 글자 크기 (디스플레이 글꼴 대문자 · 한글 한 글자 ≈ 1em) — 웹은 글자 자동 줄이기가 없어서 직접 맞춰요 */
export const fitWordSize = (words: string[], width: number, max: number) => {
  const longest = Math.max(1, ...words.map((w) => [...w].length));
  return Math.max(7, Math.min(max, (width * 0.82) / longest));
};
/** 새 카드 (기본 색 · 문구는 빈 칸 — 올리기 전에 첫 줄을 꼭 적어요) */
export const newCard = (color: string = CARD_COLORS[0].hex): MadeCard => ({ color, words: ['', ''] });
/**
 * 올릴 때 쓰는 카드: 포스터 사진이 없으면 카드는 꼭 있어야 해요 (색을 안 골랐으면 기본 색).
 * 사진이 있으면 카드는 선택 — 켠 경우에만.
 */
export const usedCard = (card: MadeCard | null, hasPhoto: boolean, color?: string) => card ?? (hasPhoto ? undefined : newCard(color));
/** 카드를 쓰는데 문구를 안 적었나요 (문구는 필수 · 첫 줄만 적어도 돼요) */
export const missingWords = (c?: MadeCard) => !!c && !c.words.some((w) => w.trim());
