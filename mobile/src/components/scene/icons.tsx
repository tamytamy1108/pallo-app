import Svg, { Circle, Path } from 'react-native-svg';

import { Colors } from '@/constants/theme';

/* 상황 장면 아이콘 — 프로토타입 ICO · FT_ICO · ICO_CLOCK 등 SVG 그대로 */
type P = { size?: number; color?: string };
const line = (color: string, w: number) => ({ fill: 'none', stroke: color, strokeWidth: w, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const });

/** ICO.spk — 스피커 + 소리 한 줄 */
export const Spk = ({ size = 17, color = Colors.ink }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...line(color, 2.4)}>
    <Path d="M4 9h4l5-4v14l-5-4H4zM16.5 8.5a5 5 0 0 1 0 7" />
  </Svg>
);

/** ICO.mark — 책갈피 (저장) */
export const Mark = ({ size = 16, color = Colors.ink, on = false }: P & { on?: boolean }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={on ? color : 'none'} stroke={color} strokeWidth={2.4} strokeLinejoin="round">
    <Path d="M6 3h12v18l-6-4-6 4z" />
  </Svg>
);

export const Check = ({ size = 16, color = Colors.ink, w = 3.4 }: P & { w?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...line(color, w)}>
    <Path d="m5 12 5 5 9-10" />
  </Svg>
);

export const XMark = ({ size = 14, color = Colors.ink, w = 3 }: P & { w?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...line(color, w)}>
    <Path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);

export const Chev = ({ size = 18, color = Colors.ink }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...line(color, 2.6)}>
    <Path d="m9 6 6 6-6 6" />
  </Svg>
);

/** 위 줄 ‹ (라이브러리로) */
export const Back = ({ size = 20, color = Colors.ink }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...line(color, 2.6)}>
    <Path d="m15 6-6 6 6 6" />
  </Svg>
);

/** 위 줄 가운데 ▾ (STC.d) */
export const ChevDown = ({ size = 13, color = Colors.ink }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...line(color, 2.8)}>
    <Path d="M6 9l6 6 6-6" />
  </Svg>
);

/** ICO_HP — 리스닝 룸 헤드폰 */
export const Headphones = ({ size = 22, color = Colors.ink }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...line(color, 2.4)}>
    <Path d="M4 15v-3a8 8 0 0 1 16 0v3M4 15h3v5H4zM17 15h3v5h-3z" />
  </Svg>
);

export const Mic = ({ size = 16, color = Colors.ink }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...line(color, 2.4)}>
    <Path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3" />
  </Svg>
);

export const Kbd = ({ size = 16, color = Colors.ink }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...line(color, 2.4)}>
    <Path d="M3 7h18v10H3zM7 11h.01M11 11h.01M15 11h.01M8 14h8" />
  </Svg>
);

export const Bulb = ({ size = 22, color = Colors.ink }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...line(color, 2.4)}>
    <Path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z" />
  </Svg>
);

export const Send = ({ size = 20, color = Colors.ink }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...line(color, 2.4)}>
    <Path d="M5 12h13M13 6l6 6-6 6" />
  </Svg>
);

export const Clock = ({ size = 22, color = Colors.ink }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...line(color, 2.4)}>
    <Circle cx={12} cy={13} r={8} />
    <Path d="M12 9v4l2.5 2M9 2h6" />
  </Svg>
);

export const Bolt = ({ size = 22 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M13 2 4 14h7l-1 8 9-12h-7z" fill={Colors.yellow} stroke={Colors.ink} strokeWidth={2.2} strokeLinejoin="round" />
  </Svg>
);

const SYMBOL =
  'M374.44,140.26h-62.65l40.05-59.4c16.01-23.75,9.74-55.98-14.01-71.99h0c-23.75-16.01-55.98-9.74-71.99,14.01l-54.77,81.24-42.86-63.57c-16.01-23.75-48.24-30.02-71.99-14.01h0c-23.75,16.01-30.02,48.24-14.01,71.99l28.13,41.73h-58.47c-28.64,0-51.86,23.22-51.86,51.86h0c0,28.64,23.22,51.86,51.86,51.86h64.91s-35.8,53.1-35.8,53.1c-16.01,23.75-9.74,55.98,14.01,71.99h0c23.75,16.01,55.98,9.74,71.99-14.01l44.08-65.39,36.42,54.03c16.01,23.75,48.24,30.02,71.99,14.01h0c23.75-16.01,30.02-48.24,14.01-71.99l-28.13-41.73h69.09c28.64,0,51.86-23.22,51.86-51.86h0c0-28.64-23.22-51.86-51.86-51.86Z';

/** ICONS.coin — 노란 동전 + 보라 PALLO 기호 (단계 팝업 포인트) */
export const Coin = ({ size = 30 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 48 48">
    <Circle cx={24} cy={24} r={19} fill={Colors.yellow} stroke={Colors.ink} strokeWidth={2.8} />
    <Circle cx={24} cy={24} r={13.5} fill="none" stroke={Colors.ink} strokeWidth={1.6} />
    <Svg x={14} y={15.5} width={20} height={20 * 0.887} viewBox="0 0 426.31 377.94">
      <Path fill={Colors.purple} stroke={Colors.ink} strokeWidth={22} d={SYMBOL} />
    </Svg>
  </Svg>
);

/** 소리 켜기/끄기 (위 줄 오른쪽) — lesson/icons SpeakerIcon 과 같은 모양 */
export const Sound = ({ size = 20, color = Colors.ink, off = false }: P & { off?: boolean }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...line(color, 2.4)}>
    <Path d="M4 9h4l5-4v14l-5-4H4z" />
    {off ? <Path d="M17 9l5 6M22 9l-5 6" /> : <Path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />}
  </Svg>
);
