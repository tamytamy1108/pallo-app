import Svg, { Path } from 'react-native-svg';

import { Colors } from '@/constants/theme';

/** 프로토타입 라운지 아이콘 (LG_IC · lgI(이름, 크기, 채움, 선, 굵기)) — 24 격자 · 둥근 선 */
const LG_IC = {
  heart: 'M12 20s-7.5-4.6-9.2-9.4C1.6 7 4 4 7.2 4c2 0 3.6 1.2 4.8 2.8C13.2 5.2 14.8 4 16.8 4 20 4 22.4 7 21.2 10.6 19.5 15.4 12 20 12 20z',
  send: 'M21 3 10 14M21 3l-7 18-4-7-7-4z',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  x: 'M6 6l12 12M18 6 6 18',
  back: 'M15 4.5L7.5 12l7.5 7.5',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  map: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14',
  pin: 'M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z',
  cal: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  clock: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18M12 7v5l3 2',
  edit: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
  shield: 'M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z',
  sms: 'M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H10l-5 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM7.5 9.5h9M7.5 12.5h5.5',
} as const;
export type LgIconName = keyof typeof LG_IC;

export function LgIcon({ name, size = 22, fill = 'none', color = Colors.ink, strokeWidth = 2.1 }: { name: LgIconName; size?: number; fill?: string; color?: string; strokeWidth?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={name === 'more' ? 3.2 : strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d={LG_IC[name]} />
    </Svg>
  );
}
