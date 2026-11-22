import Svg, { Circle, Path } from 'react-native-svg';

import { Colors } from '@/constants/theme';
import type { NotiIcon } from '@/data/home';

/*
 * 홈에서 쓰는 선 아이콘 (프로토타입 lgI · LG_IC · ICONS.coin · ICONS.skip · QR_ICO).
 * 24 × 24 기준 선 그림이에요.
 */

type LineProps = { d: string; size?: number; color?: string; width?: number };

/** 선 하나짜리 아이콘 (프로토타입 lgI: stroke-linecap · linejoin round) */
export function LineIcon({ d, size = 22, color = Colors.ink, width = 2.1 }: LineProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round">
      <Path d={d} />
    </Svg>
  );
}

/** 프로토타입 LG_IC 중 홈 · 알림함에서 쓰는 것 */
export const ICON_PATH: Record<NotiIcon | 'back' | 'grid' | 'send', string> = {
  tack: 'M9 3h6l-1 6 3 3H7l3-3zM12 12v9',
  book: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5V5.5M8 7h8',
  flame: 'M12 3c1 3 4.5 4.5 4.5 9.5a4.5 4.5 0 0 1-9 0c0-2.2 1.2-3.5 2.2-4.3 0 2 1 3.3 2.3 3.3 0-3.3-1.2-5.5 0-8.5z',
  pen: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
  bolt: 'M13 2 4 14h7l-1 8 9-12h-7z',
  flag: 'M5 21V4h12l-2.5 4 2.5 4H5',
  cal: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  plane: 'M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z',
  back: 'M15 4.5L7.5 12l7.5 7.5',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  send: 'M21 3 10 14M21 3l-7 18-4-7-7-4z',
};

export const QR_PATH = 'M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M7 12h10';
export const CHECK_PATH = 'm5 12 5 5 9-10';
export const ARROW_PATH = 'M5 12h14M13 6l6 6-6 6';
export const CLOSE_PATH = 'M6 6l12 12M18 6 6 18';

/** PALLO 심볼 (별표 모양) */
export const SYMBOL =
  'M374.44,140.26h-62.65l40.05-59.4c16.01-23.75,9.74-55.98-14.01-71.99h0c-23.75-16.01-55.98-9.74-71.99,14.01l-54.77,81.24-42.86-63.57c-16.01-23.75-48.24-30.02-71.99-14.01h0c-23.75,16.01-30.02,48.24-14.01,71.99l28.13,41.73h-58.47c-28.64,0-51.86,23.22-51.86,51.86h0c0,28.64,23.22,51.86,51.86,51.86h64.91s-35.8,53.1-35.8,53.1c-16.01,23.75-9.74,55.98,14.01,71.99h0c23.75,16.01,55.98,9.74,71.99-14.01l44.08-65.39,36.42,54.03c16.01,23.75,48.24,30.02,71.99,14.01h0c23.75-16.01,30.02-48.24,14.01-71.99l-28.13-41.73h69.09c28.64,0,51.86-23.22,51.86-51.86h0c0-28.64-23.22-51.86-51.86-51.86Z';

/** 포인트 동전 (프로토타입 ICONS.coin: 노랑 동전 + 보라 PALLO 심볼) */
export function CoinIcon({ size = 30 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Circle cx={24} cy={24} r={19} fill={Colors.yellow} stroke={Colors.ink} strokeWidth={2.8} />
      <Circle cx={24} cy={24} r={13.5} fill="none" stroke={Colors.ink} strokeWidth={1.6} />
      <Svg x={14} y={15.5} width={20} height={20 * 0.887} viewBox="0 0 426.31 377.94">
        <Path d={SYMBOL} fill={Colors.purple} stroke={Colors.ink} strokeWidth={22} />
      </Svg>
    </Svg>
  );
}

/** 건너뛰기 (프로토타입 ICONS.skip: 노랑 겹화살) */
export function SkipIcon({ size = 34 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path d="M7 11l15 13-15 13zM24 11l15 13-15 13z" fill={Colors.yellow} stroke={Colors.ink} strokeWidth={2.8} strokeLinejoin="round" />
    </Svg>
  );
}
