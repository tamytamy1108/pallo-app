import Svg, { Path } from 'react-native-svg';

import { Colors } from '@/constants/theme';

/**
 * 달력 '이전 달 · 다음 달' 원 버튼 안 꺾쇠. 글자(‹ ›)는 글꼴마다 아래 · 옆으로 치우쳐서
 * 원 가운데에 오도록 그림으로 그려요 (연기 · 변경 달력 · 이벤트 날짜 · 학습 달력이 같이 써요).
 */
export function CalArrow({ dir, size = 16, color = Colors.ink }: { dir: 'prev' | 'next'; size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={dir === 'prev' ? 'M14.75 5.5 8.25 12l6.5 6.5' : 'M9.25 5.5 15.75 12l-6.5 6.5'} fill="none" stroke={color} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
