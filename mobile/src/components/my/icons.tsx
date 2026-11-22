import Svg, { Circle, Path } from 'react-native-svg';

import { Colors } from '@/constants/theme';

/** 프로토타입 lgI 아이콘 길 (LG_IC 중 마이에서 쓰는 것) */
export const IC = {
  flame: 'M12 3c1 3 4.5 4.5 4.5 9.5a4.5 4.5 0 0 1-9 0c0-2.2 1.2-3.5 2.2-4.3 0 2 1 3.3 2.3 3.3 0-3.3-1.2-5.5 0-8.5z',
  users: 'M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM21 19v-1a4 4 0 0 0-3-3.9M15.5 3.2a3.5 3.5 0 0 1 0 6.6',
  heart: 'M12 20s-7.5-4.6-9.2-9.4C1.6 7 4 4 7.2 4c2 0 3.6 1.2 4.8 2.8C13.2 5.2 14.8 4 16.8 4 20 4 22.4 7 21.2 10.6 19.5 15.4 12 20 12 20z',
  image: 'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15.5 9.5h.01',
  save: 'M6 3h12v18l-6-4.5L6 21z',
  spk: 'M4 9v6h4l5 4V5L8 9zM16.5 8.5a5 5 0 0 1 0 7',
  search: 'M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14zM20 20l-4-4',
  back: 'M15 4.5L7.5 12l7.5 7.5',
  send: 'M21 3 10 14M21 3l-7 18-4-7-7-4z',
  pin: 'M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  cmt: 'M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 20 12z',
  book: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5V5.5M8 7h8',
  check: 'M5 12.5l4.5 4.5L19 7.5',
} as const;
export type IcName = keyof typeof IC;

/** 선 아이콘 (프로토타입 lgI: 24 상자 · 둥근 끝) */
export function LgIcon({ name, d, size = 22, fill = 'none', stroke = Colors.ink, sw = 2.1 }: { name?: IcName; d?: string; size?: number; fill?: string; stroke?: string; sw?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <Path d={d ?? (name ? IC[name] : '')} />
    </Svg>
  );
}

/** 스파크 불꽃 (lgI('flame', 14, 노랑, 잉크, 2)) */
export const SparkIcon = ({ size = 14 }: { size?: number }) => <LgIcon name="flame" size={size} fill={Colors.yellow} stroke={Colors.ink} sw={2} />;

/** 톱니 (프로토타입 마이 제목 줄 설정 버튼) */
export function GearIcon({ size = 21 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={Colors.ink} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={12} r={3} />
      <Path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </Svg>
  );
}

/** 붓 (프로토타입 PF_ICO.deco — 캐릭터 꾸미기) */
export function DecoIcon({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={Colors.ink} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M18.4 2.6a2.1 2.1 0 0 1 3 3L12 15l-3-3 9.4-9.4Z" />
      <Path d="M9 12c-2.2 0-4 1.8-4 4 0 1.6-1 2.6-2.5 3 1 1.3 2.8 2 4.5 2 2.8 0 5-2.2 5-5 0-.6-.1-1.1-.3-1.6" />
    </Svg>
  );
}

/** 프로필 아이콘들 (프로토타입 PF_ICO) */
export const PfIcon = {
  back: ({ size = 24 }: { size?: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={Colors.ink} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M19 12H5M11 6l-6 6 6 6" />
    </Svg>
  ),
  chk: ({ color = Colors.ink }: { color?: string }) => (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <Path d="m5 12 5 5 9-10" />
    </Svg>
  ),
  fire: () => (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3 0-3-1-6 1-9Z" fill="#F2A33A" stroke={Colors.ink} strokeWidth={1.8} strokeLinejoin="round" />
    </Svg>
  ),
  book: () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={Colors.ink} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 5c3-1.5 5-1.5 8 0 3-1.5 5-1.5 8 0v14c-3-1.5-5-1.5-8 0-3-1.5-5-1.5-8 0Z" />
      <Path d="M12 5v14" />
    </Svg>
  ),
  cup: () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={Colors.ink} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M7 4h10v4a5 5 0 0 1-10 0Z" />
      <Path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 13v4M8 20h8" />
    </Svg>
  ),
  star: () => (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path d="M12 1.5c.9 5.6 4.9 9.6 10.5 10.5-5.6.9-9.6 4.9-10.5 10.5C11.1 16.9 7.1 12.9 1.5 12 7.1 11.1 11.1 7.1 12 1.5Z" fill="#FFE100" stroke={Colors.ink} strokeWidth={1.6} />
    </Svg>
  ),
  flag: ({ color = Colors.inkSub }: { color?: string }) => (
    <Svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M5 21V4M5 4h11l-2 4 2 4H5" />
    </Svg>
  ),
  ban: ({ color = Colors.inkSub }: { color?: string }) => (
    <Svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round">
      <Circle cx={12} cy={12} r={8} />
      <Path d="m6.5 6.5 11 11" />
    </Svg>
  ),
};
