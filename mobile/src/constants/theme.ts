/**
 * PALLO 디자인 토큰 — 루트의 DESIGN.md 를 그대로 옮긴 값이에요.
 * 색 · 둥글기 · 간격을 바꿀 땐 DESIGN.md 와 이 파일을 같이 고쳐요.
 */

export const Colors = {
  cream: '#FBF6EA',
  ink: '#1E1A2B',
  inkSub: '#5A5366',
  line: '#E3DCCB',
  white: '#FFFFFF',
  stage: '#E7E0CF',
  yellow: '#FFE200',
  purple: '#493087',
  rosePink: '#D0798E',
  sky: '#8FA6DC',
  lavender: '#E5DDF6',
  skyMist: '#E3EAF8',
  lessonTeal: '#138A9E',
  langEn: '#4463A8',
  langJa: '#F06593',
  langZh: '#EA373F',
  langEs: '#69BE5F',
} as const;

export const Radius = {
  key: 10,
  control: 14,
  cardSm: 18,
  card: 22,
  pill: 27,
  sheet: 28,
} as const;

export const Spacing = {
  tight: 8,
  stack: 14,
  gutter: 16,
  feed: 22,
  /**
   * 다섯 탭 맨 위 제목 줄만 이만큼 더 내려요 (TabHeadTop 다음에 · 둘째 줄부터는 그대로: marginTop + 같은 만큼 marginBottom 빼기).
   * 폰 위(상태 바 · 아일랜드) ↔ 제목, 제목 ↔ 둘째 줄(탭 · 칩) 간격이 같아지게 (아이폰 18 Pro Max 실측: 영어 제목 Unbounded 기준 8 이면 위 28 · 아래 29).
   * transform 은 홈 · 마이의 Appear(올라오는 움직임)가 덮어써서 안 먹혀요 — 여백으로 내려요.
   */
  headDrop: 8,
} as const;

/** 아래 떠 있는 탭 바 높이 + 여백 — 화면 아래쪽 내용이 가려지지 않게 이만큼 띄워요. */
export const TabBarSpace = 96;
/**
 * 스크롤을 끝까지 내렸을 때 맨 아래 여백 — 모든 화면이 같아요 (2026-11-28).
 * 탭 화면은 탭 바 위로 이만큼 (TabScrollEnd), 탭 바 없는 화면은 홈 줄(아래 안전 영역) 위로 이만큼 (ScrollEnd).
 */
export const ScrollEnd = 40;
export const TabScrollEnd = TabBarSpace + ScrollEnd;
/** 다섯 탭(홈 · 라이브러리 · 라운지 · 이벤트 · 마이)의 첫 줄(제목) 위 여백 — 상태 바 · 아일랜드 바로 밑에 붙지 않게, 다섯 탭이 같아요 */
export const TabHeadTop = 10;
/** 머리줄 바로 아래 붙는 탭 줄(동아리 · 챌린지 상세 · 프로스 노트) 한 칸 높이 — 셋이 같아요 */
export const TAB_ROW_H = 52;
