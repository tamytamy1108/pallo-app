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
} as const;

/** 아래 떠 있는 탭 바 높이 + 여백 — 화면 아래쪽 내용이 가려지지 않게 이만큼 띄워요. */
export const TabBarSpace = 96;
/** 다섯 탭(홈 · 라이브러리 · 라운지 · 이벤트 · 마이)의 첫 줄(제목) 위 여백 — 상태 바 · 아일랜드 바로 밑에 붙지 않게, 다섯 탭이 같아요 */
export const TabHeadTop = 10;
