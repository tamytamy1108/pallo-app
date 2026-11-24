import { Circle, G, Path, Text as SvgText } from 'react-native-svg';

import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { SPARK_PATH } from '@/data/lounge-maps';

/**
 * 지도 표시 = PALLO 스파크 심볼 (프로토타입 lgBub). 많을수록 조금 커지고, 개수는 하얀 동그라미.
 * n = 0 이면 '준비 중' 하얀 스파크. sm = 번개 · 동아리가 같이 있어 둘 다 조금 작게.
 * 누르기는 지도 전체에서 받아 가장 가까운 곳을 골라요 (웹에서 SVG 안 터치가 경고를 내서).
 */
export function SparkPin({ x, y, n, color, sm = false, scale = 1 }: { x: number; y: number; n: number; color: string; sm?: boolean; scale?: number }) {
  const w = n ? (sm ? 19 : 21) + Math.min(n, 4) * 1.2 : 11;
  const k = w / 426.31;
  const hy = w * 0.4433;
  const tf = (dx: number, dy: number) => `translate(${(x - w / 2 + dx).toFixed(1)} ${(y - hy + dy).toFixed(1)}) scale(${k.toFixed(4)})`;
  // 개수 동그라미는 스파크 팔을 가리지 않게 오른쪽 위 팔 사이 바깥에 붙여요 (로고 모양이 다 보이게)
  const out = w / 2 + 7;
  const cx = x + out * 0.89;
  const cy = y - out * 0.46;
  return (
    // 확대해도 핀은 화면에서 살짝만 커져요 (프로토타입 .lg-pz)
    <G transform={scale !== 1 ? `translate(${x} ${y}) scale(${scale.toFixed(3)}) translate(${-x} ${-y})` : undefined}>
      <Circle cx={x} cy={y} r={w / 2 + 4} fill="transparent" />
      {n ? (
        <>
          <Path d={SPARK_PATH} transform={tf(1.6, 2.2)} fill={Colors.ink} />
          <Path d={SPARK_PATH} transform={tf(0, 0)} fill={color} stroke={Colors.ink} strokeWidth={2 / k} strokeLinejoin="round" />
          <Circle cx={cx} cy={cy} r={5.6} fill="#fff" stroke={Colors.ink} strokeWidth={1.5} />
          <SvgText x={cx} y={cy + 2.7} textAnchor="middle" fontFamily={Font.display} fontSize={7.5} fontWeight="800" fill={Colors.ink}>
            {String(n)}
          </SvgText>
        </>
      ) : (
        <Path d={SPARK_PATH} transform={tf(0, 0)} fill="#fff" stroke={Colors.ink} strokeWidth={1.4 / k} opacity={0.75} />
      )}
    </G>
  );
}
