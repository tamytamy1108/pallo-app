import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';

/**
 * 데이터가 없는 언어 · 상황 맵 자리: 구름에 가린 잠긴 섬 한 개 (프로토타입 islandSVG(…, soon) · WAVES · CLOUD · LOCK, 360×460 그림).
 * 3D 지도 대신 2D 그림이에요 (프로토타입도 이때는 3D 를 띄우지 않아요).
 */
const W = 360;
const H = 460;
const INK = Colors.ink;

const blob = (cx: number, cy: number, rx: number, ry: number, a: number, n: number, p: number) => {
  let d = '';
  for (let i = 0; i < 48; i++) {
    const t = (i / 48) * Math.PI * 2;
    const r = 1 + a * Math.sin(n * t + p);
    d += (i ? 'L' : 'M') + (cx + Math.cos(t) * rx * r).toFixed(1) + ' ' + (cy + Math.sin(t) * ry * r).toFixed(1);
  }
  return d + 'Z';
};

const CL_D = 'M-44 12a17 17 0 0 1 6-29 23 23 0 0 1 43-6 19 19 0 0 1 33 13 13 13 0 0 1-4 22z';
function Cloud({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Path d={CL_D} fill="#fff" />
      <Path d={CL_D} fill="url(#clSh)" />
      <Ellipse cx={-22} cy={-14} rx={7} ry={4} fill="#fff" opacity={0.95} transform="rotate(-20 -22 -14)" />
      <Path d="M-30 8q14 5 30 1" fill="none" stroke="#B7CEDD" strokeWidth={2.2} strokeLinecap="round" />
      <Path d={CL_D} fill="none" stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
    </G>
  );
}

const WAVES: [number, number][] = [
  [40, 80],
  [280, 140],
  [60, 300],
  [290, 380],
  [160, 420],
];

export function EmptyIsland({ tag }: { tag: string }) {
  // islandSVG(180, 220, '#C9C2B3', 1.6, soon, sel=false, kind=0)
  const x = 180;
  const y = 220;
  const k = 1.6;
  const S = { a: 0.035, n: 5, p: 0.4 };
  const rx = 44 * k;
  const ry = 25 * k;
  const u = k * 0.95;
  const stk = { stroke: INK, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
  const sprout = (px: number, py: number, i: number) => (
    <G key={i}>
      <Path d={`M${px} ${py + 4 * u}v-${10 * u}`} {...stk} strokeWidth={2.2} />
      <Path d={`M${px} ${py - 6 * u}c-9 -1 -12 -7 -11 -11c7 0 11 4 11 11zM${px} ${py - 4 * u}c8 0 12 -5 12 -9c-7 -1 -12 3 -12 9z`} fill={i ? '#FFB3C7' : '#8FD27F'} {...stk} strokeWidth={1.8} />
    </G>
  );
  return (
    <View style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
        <Defs>
          <RadialGradient id="isHi" cx="0.3" cy="0.25" r="0.6">
            <Stop offset="0" stopColor="#fff" stopOpacity={0.55} />
            <Stop offset="1" stopColor="#fff" stopOpacity={0} />
          </RadialGradient>
          <LinearGradient id="isLo" x1="0.2" y1="0" x2="0.6" y2="1">
            <Stop offset="0.45" stopColor={INK} stopOpacity={0} />
            <Stop offset="1" stopColor="#2A2140" stopOpacity={0.2} />
          </LinearGradient>
          <LinearGradient id="clSh" x1="0" y1="0" x2="0.25" y2="1">
            <Stop offset="0.42" stopColor="#C7DCE8" stopOpacity={0} />
            <Stop offset="1" stopColor="#9DBBD0" stopOpacity={0.75} />
          </LinearGradient>
        </Defs>
        <Rect width={W} height={H} fill="#BFE4EC" />
        {WAVES.map(([wx, wy], i) => (
          <Path key={i} d={`M${wx} ${wy} q7 -5 14 0 t14 0`} fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" opacity={0.9} />
        ))}
        <Path d={blob(x + 4, y + 12, rx + 11, ry + 9, S.a, S.n, S.p)} fill={INK} />
        <Path d={blob(x, y + 8, rx + 11, ry + 9, S.a, S.n, S.p)} fill="#EAD7AE" {...stk} strokeWidth={2.5} />
        <Path d={blob(x, y + 8, rx + 9.8, ry + 7.8, S.a, S.n, S.p)} fill="url(#isLo)" />
        <Path d={blob(x, y + 1, rx, ry, S.a, S.n, S.p)} fill="#C9D3DC" {...stk} strokeWidth={2.5} />
        <Path d={blob(x, y + 1, rx - 1.2, ry - 1.2, S.a, S.n, S.p)} fill="url(#isLo)" />
        <Path d={blob(x, y + 1, rx - 1.2, ry - 1.2, S.a, S.n, S.p)} fill="url(#isHi)" />
        <Ellipse cx={x - rx * 0.5} cy={y - ry * 0.45} rx={rx * 0.16} ry={ry * 0.13} fill="#fff" opacity={0.7} transform={`rotate(-18 ${x - rx * 0.5} ${y - ry * 0.45})`} />
        {sprout(x - rx * 0.45, y + ry * 0.1, 0)}
        {sprout(x + rx * 0.42, y - ry * 0.05, 1)}
        <Path d={blob(x, y + 4, rx + 13, ry + 12, S.a, S.n, S.p)} fill="#fff" opacity={0.5} />
        <Cloud x={x - rx * 0.95} y={y - ry * 0.55} s={0.42 * k} />
        <Cloud x={x + rx * 1.05} y={y + ry * 0.5} s={0.36 * k} />
        {/* 자물쇠 배지 */}
        <Circle cx={x + 2} cy={y - ry * 0.15 + 2.5} r={15 * k} fill={INK} />
        <Circle cx={x} cy={y - ry * 0.15} r={15 * k} fill="#fff" {...stk} strokeWidth={2.4} />
        <Path
          d={`M${x - 5.5 * k} ${y - ry * 0.15 - 1 * k}h${11 * k}v${8.5 * k}h-${11 * k}zM${x - 3.2 * k} ${y - ry * 0.15 - 1 * k}v-${3.2 * k}a${3.2 * k} ${3.2 * k} 0 0 1 ${6.4 * k} 0v${3.2 * k}`}
          fill="none"
          {...stk}
          strokeWidth={2.2}
        />
      </Svg>
      {/* .st-itag.soon (left 50% · top 286/460) */}
      <View style={styles.tagWrap} pointerEvents="none">
        <View style={styles.tag}>
          <PText style={styles.tagText}>{tag}</PText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tagWrap: { position: 'absolute', left: 0, right: 0, top: `${(286 / H) * 100}%`, alignItems: 'center' },
  tag: { paddingTop: 2, paddingBottom: 3, paddingHorizontal: 8, borderRadius: 11, borderWidth: 2, borderStyle: 'dashed', borderColor: '#9A93A6', backgroundColor: 'rgba(255,255,255,0.8)' },
  tagText: { fontFamily: Font.body900, fontSize: 11.5, lineHeight: 15, color: '#6F6880', textAlign: 'center' },
});
