import Svg, { Path, Rect } from 'react-native-svg';

import { Colors } from '@/constants/theme';

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

export const BookmarkIcon = ({ size = 16, color = Colors.ink, filled = false }: P & { filled?: boolean }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={color} strokeWidth={2.4} strokeLinejoin="round">
    <Path d="M6 3h12v18l-6-4.5L6 21z" />
  </Svg>
);
