import Svg, { Path, Polygon } from 'react-native-svg';

import { Colors } from '@/constants/theme';

/*
 * 챌린지에서 쓰는 선 아이콘 (프로토타입 lgI · LG_IC — 24 × 24, 끝 둥글게).
 */
export const CH_ICON = {
  cmt: 'M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 20 12z',
  book: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5V5.5M8 7h8',
  cup: 'M5 8h11v5.5A5.5 5.5 0 0 1 10.5 19A5.5 5.5 0 0 1 5 13.5zM16 9.5h1.5a2.5 2.5 0 0 1 0 5H16M8.5 3.5v2M12 3.5v2',
  run: 'M14 3.5a1.8 1.8 0 1 0 0 .01M7 21l3.2-6.2 3.3 2.4V21M5.5 11.5l3.2-3 4 .8 2.6 3H19M10.2 14.8l1.4-5.2',
  clock: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18M12 7v5l3 2',
  flag: 'M5 21V4h12l-2.5 4 2.5 4H5',
  flame: 'M12 3c1 3 4.5 4.5 4.5 9.5a4.5 4.5 0 0 1-9 0c0-2.2 1.2-3.5 2.2-4.3 0 2 1 3.3 2.3 3.3 0-3.3-1.2-5.5 0-8.5z',
  cal: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  cam: 'M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  edit: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
  spk: 'M4 9v6h4l5 4V5L8 9zM16.5 8.5a5 5 0 0 1 0 7',
  search: 'M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14zM20 20l-4-4',
  heart: 'M12 20s-7.5-4.6-9.2-9.4C1.6 7 4 4 7.2 4c2 0 3.6 1.2 4.8 2.8C13.2 5.2 14.8 4 16.8 4 20 4 22.4 7 21.2 10.6 19.5 15.4 12 20 12 20z',
  send: 'M21 3 10 14M21 3l-7 18-4-7-7-4z',
  back: 'M15 4.5L7.5 12l7.5 7.5',
  crown: 'M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z',
  users: 'M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM21 19v-1a4 4 0 0 0-3-3.9M15.5 3.2a3.5 3.5 0 0 1 0 6.6',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  image: 'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15.5 9.5h.01',
  pin: 'M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  plus: 'M12 5v14M5 12h14',
  /** 선택 체크 (.ch-card .ck) */
  tick: 'm5 12 5 5 9-10',
  /** 비율 바꾸기 (.lg-ratiotg) */
  ratio: 'M14 4h6v6M10 20H4v-6M20 4l-6 6M4 20l6-6',
} as const;
export type ChIconKey = keyof typeof CH_ICON;

export function ChIcon({ name, size = 22, color = Colors.ink, fill = 'none', width = 2.1 }: { name: ChIconKey; size?: number; color?: string; fill?: string; width?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round">
      <Path d={CH_ICON[name]} />
    </Svg>
  );
}

/** 응원 시트 반짝이 (.ch-cheer .art i — clip-path 별 모양) */
export function Sparkle({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Polygon points="50,0 62,38 100,50 62,62 50,100 38,62 0,50 38,38" fill={color} />
    </Svg>
  );
}
