import Svg, { Path } from 'react-native-svg';

import { Colors } from '@/constants/theme';

import { SPARK } from './korea-paths';

/** 라운지 아이콘 선 (프로토타입 LG_IC · lgI(n, size, fill, stroke, sw) — 24 × 24, 둥근 끝) */
const IC = {
  cal: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  pin: 'M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  bolt: 'M13 2 4 14h7l-1 8 9-12h-7z',
  flag: 'M5 21V4h12l-2.5 4 2.5 4H5',
  plus: 'M12 5v14M5 12h14',
  clock: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18M12 7v5l3 2',
  users: 'M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM21 19v-1a4 4 0 0 0-3-3.9M15.5 3.2a3.5 3.5 0 0 1 0 6.6',
  crown: 'M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z',
  heart: 'M12 20s-7.5-4.6-9.2-9.4C1.6 7 4 4 7.2 4c2 0 3.6 1.2 4.8 2.8C13.2 5.2 14.8 4 16.8 4 20 4 22.4 7 21.2 10.6 19.5 15.4 12 20 12 20z',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  copy: 'M9 9h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V10a1 1 0 0 1 1-1zM5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1',
  sms: 'M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H10l-5 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM7.5 9.5h9M7.5 12.5h5.5',
  back: 'M15 4.5L7.5 12l7.5 7.5',
  send: 'M21 3 10 14M21 3l-7 18-4-7-7-4z',
  shield: 'M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  run: 'M14 3.5a1.8 1.8 0 1 0 0 .01M7 21l3.2-6.2 3.3 2.4V21M5.5 11.5l3.2-3 4 .8 2.6 3H19M10.2 14.8l1.4-5.2',
  book: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5V5.5M8 7h8',
  film: 'M3 5h18v14H3zM7 5v14M17 5v14M3 9.5h4M17 9.5h4M3 14.5h4M17 14.5h4',
  cup: 'M5 8h11v5.5A5.5 5.5 0 0 1 10.5 19A5.5 5.5 0 0 1 5 13.5zM16 9.5h1.5a2.5 2.5 0 0 1 0 5H16M8.5 3.5v2M12 3.5v2',
  cmt: 'M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 20 12z',
  pen: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
  tack: 'M9 3h6l-1 6 3 3H7l3-3zM12 12v9',
  image: 'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15.5 9.5h.01',
  x: 'M6 6l12 12M18 6 6 18',
  save: 'M6 3h12v18l-6-4.5L6 21z',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  map: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14',
} as const;

export type IconName = keyof typeof IC;

type Props = { name: IconName; size?: number; color?: string; fill?: string; strokeWidth?: number };

/** 라운지 선 아이콘 하나 */
export function Icon({ name, size = 22, color = Colors.ink, fill = 'none', strokeWidth }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={strokeWidth ?? (name === 'more' ? 3.2 : 2.1)} strokeLinecap="round" strokeLinejoin="round">
      <Path d={IC[name]} />
    </Svg>
  );
}

/** 노랑 번개 + 잉크 테두리 (프로토타입 LG_BOLT · 13px) */
export function Bolt({ size = 13 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={IC.bolt} fill={Colors.yellow} stroke={Colors.ink} strokeWidth={2} strokeLinejoin="round" />
    </Svg>
  );
}

/** PALLO 스파크 (프로토타입 lgSparkIc — 지도 범례) */
export function SparkIcon({ color, width = 14 }: { color: string; width?: number }) {
  return (
    <Svg width={width} height={Math.round(width * 0.887)} viewBox="0 0 426.31 377.94">
      <Path d={SPARK} fill={color} stroke={Colors.ink} strokeWidth={34} />
    </Svg>
  );
}
