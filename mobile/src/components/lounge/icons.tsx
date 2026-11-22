import Svg, { Path } from 'react-native-svg';

import { Colors } from '@/constants/theme';
import { SPARK_PATH } from '@/data/lounge-maps';

/** 라운지 아이콘 선 (프로토타입 LG_IC 그대로 · 24 × 24) */
export const LG_IC = {
  edit: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
  search: 'M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14zM20 20l-4-4',
  heart: 'M12 20s-7.5-4.6-9.2-9.4C1.6 7 4 4 7.2 4c2 0 3.6 1.2 4.8 2.8C13.2 5.2 14.8 4 16.8 4 20 4 22.4 7 21.2 10.6 19.5 15.4 12 20 12 20z',
  cmt: 'M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 20 12z',
  send: 'M21 3 10 14M21 3l-7 18-4-7-7-4z',
  save: 'M6 3h12v18l-6-4.5L6 21z',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  plus: 'M12 5v14M5 12h14',
  spk: 'M4 9v6h4l5 4V5L8 9zM16.5 8.5a5 5 0 0 1 0 7',
  x: 'M6 6l12 12M18 6 6 18',
  pin: 'M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  cam: 'M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  bolt: 'M13 2 4 14h7l-1 8 9-12h-7z',
  plane: 'M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z',
  globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3z',
  cal: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  clock: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18M12 7v5l3 2',
  back: 'M15 4.5L7.5 12l7.5 7.5',
  book: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5V5.5M8 7h8',
  shield: 'M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z',
  crown: 'M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  flag: 'M5 21V4h12l-2.5 4 2.5 4H5',
  tack: 'M9 3h6l-1 6 3 3H7l3-3zM12 12v9',
  image: 'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15.5 9.5h.01',
  flame: 'M12 3c1 3 4.5 4.5 4.5 9.5a4.5 4.5 0 0 1-9 0c0-2.2 1.2-3.5 2.2-4.3 0 2 1 3.3 2.3 3.3 0-3.3-1.2-5.5 0-8.5z',
  up: 'M12 19V5M5 12l7-7 7 7',
  ratio: 'M14 4h6v6M10 20H4v-6M20 4l-6 6M4 20l6-6',
} as const;
export type LgIconName = keyof typeof LG_IC;

/** 프로토타입 lgI(n, s, fill, stroke, sw) */
export function LgIcon({ name, size = 22, fill = 'none', color = Colors.ink, sw = 2.1 }: { name: LgIconName; size?: number; fill?: string; color?: string; sw?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={name === 'more' ? 3.2 : sw} strokeLinecap="round" strokeLinejoin="round">
      <Path d={LG_IC[name]} />
    </Svg>
  );
}

/** 노랑 번개 (프로토타입 LG_BOLT) */
export function BoltIcon({ size = 13 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={LG_IC.bolt} fill={Colors.yellow} stroke={Colors.ink} strokeWidth={2} strokeLinejoin="round" />
    </Svg>
  );
}

/** PALLO 스파크 심볼 아이콘 (프로토타입 lgSparkIc) */
export function SparkIcon({ color, width = 14 }: { color: string; width?: number }) {
  return (
    <Svg width={width} height={Math.round(width * 0.887)} viewBox="0 0 426.31 377.94">
      <Path d={SPARK_PATH} fill={color} stroke={Colors.ink} strokeWidth={34} />
    </Svg>
  );
}
