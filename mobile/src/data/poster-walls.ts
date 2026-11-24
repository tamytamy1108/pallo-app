/**
 * 포스터 카드 배경 (휴대폰 기본 배경화면처럼 고르는 그림 · 글자는 직접 적어요).
 * 번개 · 동아리 · 챌린지 · 이벤트 제안을 열 때 고를 수 있어요 (선택). 카드를 만들면 그게 대표(첫 장)가 되고, 올린 사진은 그 뒤에 붙어요.
 * 그림은 components/ui/poster-wall.tsx 가 id 로 그려요.
 * 맞는 API: 각 개설 요청의 `card: { wall, words }` (예정 — 서버는 id · 글자만 저장하고 그림은 앱이 그려요).
 */

/** 만든 카드: 배경 id · 큰 글자 줄들 (최대 2줄) */
export type MadeCard = { wall: string; words: string[] };

/** fg: 글자색 (light = 흰 글자 · dark = 잉크 글자) · base: 그림 밑 바탕색 */
export type PosterWallMeta = { id: string; name: string; fg: 'light' | 'dark'; base: string };

export const POSTER_WALLS: readonly PosterWallMeta[] = [
  { id: 'pallo', name: '팔로 옐로', fg: 'dark', base: '#FFE200' },
  { id: 'sunrise', name: '새벽 노을', fg: 'light', base: '#FF8FA3' },
  { id: 'ocean', name: '파도', fg: 'light', base: '#4A8FE0' },
  { id: 'peach', name: '피치', fg: 'dark', base: '#FFCDBE' },
  { id: 'lemon', name: '레몬', fg: 'dark', base: '#FFF06A' },
  { id: 'mint', name: '민트 언덕', fg: 'dark', base: '#BDE9D0' },
  { id: 'grape', name: '포도', fg: 'light', base: '#7A3FB0' },
  { id: 'night', name: '밤하늘', fg: 'light', base: '#1E1640' },
  { id: 'aurora', name: '오로라', fg: 'light', base: '#10243C' },
  { id: 'cherry', name: '벚꽃', fg: 'dark', base: '#FFE3EC' },
  { id: 'sky', name: '구름 하늘', fg: 'dark', base: '#CFE6FA' },
  { id: 'paper', name: '크림 노트', fg: 'dark', base: '#FBF6EA' },
];

export const wallMeta = (id: string) => POSTER_WALLS.find((w) => w.id === id) ?? POSTER_WALLS[0];
/** 카드 위 글자색 */
export const wallInk = (id: string) => (wallMeta(id).fg === 'light' ? '#FFFFFF' : '#1E1A2B');
/** 적은 줄만 (빈 줄 빼고) — 다 비면 기본 글자 */
export const cardWords = (words: string[], fallback: string[]) => {
  const w = words.map((x) => x.trim()).filter(Boolean);
  return w.length ? w : fallback;
};
