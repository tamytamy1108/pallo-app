import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { Colors } from '@/constants/theme';
import { HeartPop } from '@/components/ui/heart-pop';

type P = { size?: number; color?: string };
const line = (color: string, w = 2.4) => ({ fill: 'none', stroke: color, strokeWidth: w, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const });

export const CloseIcon = ({ size = 18, color = Colors.ink }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...line(color, 2.6)}>
    <Path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);

export const SpeakerIcon = ({ size = 20, color = Colors.ink, off = false }: P & { off?: boolean }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...line(color)}>
    <Path d="M4 9h4l5-4v14l-5-4H4z" />
    {off ? <Path d="M17 9l5 6M22 9l-5 6" /> : <Path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />}
  </Svg>
);

export const MicIcon = ({ size = 20, color = Colors.ink }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...line(color)}>
    <Rect x={9} y={3} width={6} height={11} rx={3} />
    <Path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
  </Svg>
);

export const CardsIcon = ({ size = 18, color = Colors.ink }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...line(color, 2.2)}>
    <Rect x={8} y={8} width={12} height={12} rx={2.5} />
    <Path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8" />
  </Svg>
);

/** 저장 책갈피 — 저장하면 톡 커지고 떨림 (HeartPop) */
export const BookmarkIcon = ({ size = 16, color = Colors.ink, filled = false }: P & { filled?: boolean }) => (
  <HeartPop on={filled}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={color} strokeWidth={2.4} strokeLinejoin="round">
      <Path d="M6 3h12v18l-6-4.5L6 21z" />
    </Svg>
  </HeartPop>
);

/* 아래는 레슨 화면 공용 아이콘 (프로토타입 FT_ICO · ICO · NS_IC 그대로) */

export const KeyboardIcon = ({ size = 16, color = Colors.ink }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...line(color)}>
    <Path d="M3 7h18v10H3zM7 11h.01M11 11h.01M15 11h.01M8 14h8" />
  </Svg>
);

export const BulbIcon = ({ size = 22, color = Colors.ink }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...line(color)}>
    <Path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z" />
  </Svg>
);

export const SendIcon = ({ size = 20, color = Colors.ink }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...line(color)}>
    <Path d="M5 12h13M13 6l6 6-6 6" />
  </Svg>
);

export const CheckIcon = ({ size = 14, color = Colors.ink, w = 3 }: P & { w?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...line(color, w)}>
    <Path d="M5 12.5l4.5 4.5L19 7.5" />
  </Svg>
);

export const XIcon = ({ size = 14, color = Colors.ink, w = 3 }: P & { w?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...line(color, w)}>
    <Path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);

/** 줄 순서 맞추기 손잡이 (점 6개) */
export const GripIcon = ({ size = 14, color = '#8C8597' }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Circle cx={9} cy={6} r={1.8} />
    <Circle cx={15} cy={6} r={1.8} />
    <Circle cx={9} cy={12} r={1.8} />
    <Circle cx={15} cy={12} r={1.8} />
    <Circle cx={9} cy={18} r={1.8} />
    <Circle cx={15} cy={18} r={1.8} />
  </Svg>
);

/** 모두 지우기 (되돌리기 화살표) */
export const ResetIcon = ({ size = 14, color = Colors.inkSub }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...line(color, 2.6)}>
    <Path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <Path d="M3 3v5h5" />
  </Svg>
);

/** 말하기가 어려워요 (마이크에 빗금) */
export const MicOffIcon = ({ size = 16, color = Colors.ink }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...line(color)}>
    <Path d="M9 5a3 3 0 0 1 6 0v6a3 3 0 0 1-5 2.2M5 11a7 7 0 0 0 11.5 5.4M12 18v3M19 11a7 7 0 0 1-.4 2.3M3 3l18 18" />
  </Svg>
);

export const ClockIcon = ({ size = 22, color = Colors.ink }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...line(color)}>
    <Circle cx={12} cy={13} r={8} />
    <Path d="M12 9v4l2.5 2M9 2h6" />
  </Svg>
);

export const HomeIcon = ({ size = 24, color = Colors.ink }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" fill={Colors.yellow} stroke={color} strokeWidth={2} strokeLinejoin="round" />
  </Svg>
);

export const SparkIcon = ({ size = 15, color = Colors.ink }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" {...line(color)}>
    <Path d="M12 3l1.8 4.6L18.5 9l-4.7 1.6L12 15l-1.8-4.4L5.5 9l4.7-1.4z" />
    <Path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" />
  </Svg>
);
