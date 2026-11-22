import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type GestureResponderEvent } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming, cancelAnimation } from 'react-native-reanimated';
import Svg, { ClipPath, Defs, G, Path, Rect } from 'react-native-svg';

import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { C, REGIONS, type Region } from '@/data/meet';

import { Bolt, Icon, SparkIcon } from './icons';
import { KMAP, SPARK } from './korea-paths';
import { Shadowed } from './parts';

/*
 * 번개 · 동아리 지도 (프로토타입 lgKoreaMap · lgBub · lgZoomMaps).
 * 크림 바다 · 노랑 땅 · 잉크 테두리 · 그림자. 지역 = 스파크 (분홍 번개 · 보라 동아리), 고른 지역은 2.4배로 0.42초 확대.
 */
const VB = { x: 46, y: 0, w: 166, h: KMAP.h };
const SEA = '#FBF6EA';
const NEAR = '#F0E9D9';

type Counts = Record<Region, [number, number]>;
type Props = { counts: Counts; mode: 'all' | 'meet' | 'club'; region: Region | null; onRegion: (r: Region | null) => void };

type Z = { z: number; cx: number; cy: number };
const centerOf = (r: Region | null): Z => {
  const f = REGIONS.find(([n]) => n === r);
  return f ? { z: 2.4, cx: f[1], cy: f[2] } : { z: 1, cx: VB.x + VB.w / 2, cy: VB.y + VB.h / 2 };
};
const clampZ = ({ z, cx, cy }: Z): Z => {
  const hw = VB.w / 2 / z;
  const hh = VB.h / 2 / z;
  return { z, cx: Math.max(VB.x + hw, Math.min(VB.x + VB.w - hw, cx)), cy: Math.max(VB.y + hh, Math.min(VB.y + VB.h - hh, cy)) };
};

/** 지도 바탕 (경로가 커서 한 번만 그려요) */
const Base = memo(function Base() {
  return (
    <>
      <Path d={KMAP.cn + KMAP.nk + KMAP.jp} fill={NEAR} />
      <Path d={KMAP.kr} transform="translate(4 5)" fill={C.ink} />
      <Path d={KMAP.kr} fill={C.y} />
      <Path d={KMAP.pv} clipPath="url(#lgKrClip)" fill="none" stroke={C.ink} strokeWidth={1.6} strokeOpacity={0.85} strokeLinejoin="round" strokeLinecap="round" />
      <Path d={KMAP.kr} fill="none" stroke={C.ink} strokeWidth={2.4} strokeLinejoin="round" />
    </>
  );
});

export function KoreaMap({ counts, mode, region, onRegion }: Props) {
  const showM = mode !== 'club';
  const showC = mode !== 'meet';
  const cnt = (r: Region) => (showM ? counts[r][0] : 0) + (showC ? counts[r][1] : 0);
  const totM = REGIONS.reduce((a, [r]) => a + counts[r][0], 0);
  const totC = REGIONS.reduce((a, [r]) => a + counts[r][1], 0);
  const tot = REGIONS.reduce((a, [r]) => a + cnt(r), 0);
  const list: [Region | null, string, number][] = [[null, '전체', tot], ...REGIONS.filter(([r]) => cnt(r)).map(([r]): [Region, string, number] => [r, r, cnt(r)])];

  const [w, setW] = useState(0);
  const z = useZoom(region);
  const s = w / VB.w; // 지도 단위 → 화면 px
  const zz = clampZ(z);
  const tx = VB.x + VB.w / 2 - zz.cx * zz.z;
  const ty = VB.y + VB.h / 2 - zz.cy * zz.z;
  const toScreen = (x: number, y: number) => [(tx + x * zz.z - VB.x) * s, (ty + y * zz.z - VB.y) * s] as const;
  const ps = Math.min(1.35, Math.sqrt(zz.z)); // 핀은 화면에서 살짝만 커져요

  // 지도 아무 데나 눌러도 가장 가까운 지역으로 · 확대된 상태에서 먼 곳을 누르면 다시 전체
  const onMapPress = (e: GestureResponderEvent) => {
    if (!s) return;
    const mx = (e.nativeEvent.locationX / s + VB.x - tx) / zz.z;
    const my = (e.nativeEvent.locationY / s + VB.y - ty) / zz.z;
    const near = REGIONS.map(([n, x, y]) => [n, Math.hypot(x - mx, y - my)] as const).sort((a, b) => a[1] - b[1])[0];
    const lim = (34 / zz.z) * Math.max(1, zz.z * 0.8);
    const v = near && near[1] <= lim ? near[0] : null;
    if (v === region) return;
    onRegion(v);
  };

  const title = mode === 'club' ? '전국 동아리 · 매주 만나요' : mode === 'meet' ? '이번 주 전국 번개 · 한 번 만나요' : '전국 번개 · 동아리 지도';
  const sel = REGIONS.find(([n]) => n === region);

  return (
    <Shadowed radius={20}>
      <View style={styles.card} accessibilityLabel="번개 · 동아리 지도">
        <View style={styles.mhd}>
          {mode === 'club' ? <Icon name="flag" size={13} color={C.pu} strokeWidth={2.6} /> : <Bolt />}
          <PText style={styles.kick}>{title}</PText>
        </View>
        <View style={styles.kr}>
          <View style={styles.mapCol} onLayout={(e) => setW(e.nativeEvent.layout.width - 4)}>
            <View style={[styles.mapBox, { height: w ? (w * VB.h) / VB.w + 4 : undefined, aspectRatio: w ? undefined : VB.w / VB.h }]}>
              <Pressable onPress={onMapPress} style={StyleSheet.absoluteFill} accessibilityLabel="지도에서 지역 고르기">
                {w ? (
                  <Svg width={w} height={(w * VB.h) / VB.w} viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`}>
                    <Defs>
                      <ClipPath id="lgKrClip">
                        <Path d={KMAP.kr} />
                      </ClipPath>
                    </Defs>
                    <Rect x={0} y={0} width={KMAP.w} height={KMAP.h} fill={SEA} />
                    <G transform={`translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${zz.z.toFixed(3)})`}>
                      <Base />
                    </G>
                  </Svg>
                ) : null}
              </Pressable>
              {w
                ? REGIONS.map(([r, x, y]) => {
                    const m = showM ? counts[r][0] : 0;
                    const k = showC ? counts[r][1] : 0;
                    const on = region === r;
                    const both = !!(m && k);
                    const dx = both ? 10 : 0;
                    const pin = (px: number, py: number, n: number, col: string, sm: boolean, key: string) => {
                      const [sx, sy] = toScreen(px, py);
                      return <Pin key={key} x={sx} y={sy} n={n} col={col} on={on} sm={sm} scale={ps * s} onPress={() => onRegion(on ? null : r)} label={`${r} 번개 ${counts[r][0]}개 · 동아리 ${counts[r][1]}개`} />;
                    };
                    if (!m && !k) return pin(x, y, 0, '#fff', false, r);
                    return (
                      <View key={r} pointerEvents="box-none" style={StyleSheet.absoluteFill}>
                        {m ? pin(x - dx, y, m, C.pk, both, r + 'm') : null}
                        {k ? pin(x + dx, y + (both ? 4 : 0), k, C.pu, both, r + 'c') : null}
                      </View>
                    );
                  })
                : null}
              {w && sel ? <RegionTag text={`${sel[0]} ${cnt(sel[0])}`} pos={toScreen(sel[1], sel[2])} k={ps * s} /> : null}
            </View>
          </View>
          <View style={styles.rl}>
            {list.map(([v, l, n]) => {
              const on = region === v;
              return (
                <Pressable key={l} onPress={() => onRegion(v)} accessibilityRole="button" accessibilityState={{ selected: on }} style={({ pressed }) => [styles.rb, on && styles.rbOn, pressed && { transform: [{ scale: 0.97 }] }]}>
                  <PText style={[styles.rbT, on && { color: '#fff' }]}>{l}</PText>
                  <View style={styles.sp} />
                  <View style={[styles.rbN, on && { borderColor: '#fff' }]}>
                    <PText style={[styles.rbNT, on && { color: '#fff' }]}>{n}</PText>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
        <View style={styles.lgd}>
          {showM ? <Legend col={C.pk} label={`번개 ${totM}`} /> : null}
          {showC ? <Legend col={C.pu} label={`동아리 ${totC}`} /> : null}
          <Legend col="#fff" label="아직 없음" />
        </View>
      </View>
    </Shadowed>
  );
}

function Legend({ col, label }: { col: string; label: string }) {
  return (
    <View style={styles.lgdI}>
      <SparkIcon color={col} />
      <PText style={styles.lgdT}>{label}</PText>
    </View>
  );
}

/** 고른 지역 확대: 0.42초 ease-out (움직임 줄이기면 바로) */
function useZoom(region: Region | null) {
  const still = useReducedMotion();
  const [z, setZ] = useState<Z>(() => centerOf(region));
  const from = useRef(z);
  useEffect(() => {
    const to = centerOf(region);
    const a = from.current;
    if (still || (a.z === to.z && a.cx === to.cx && a.cy === to.cy)) {
      from.current = to;
      setZ(to);
      return;
    }
    let raf = 0;
    const t0 = Date.now();
    const step = () => {
      const t = Math.min(1, (Date.now() - t0) / 420);
      const e = 1 - Math.pow(1 - t, 3);
      const cur = { z: a.z + (to.z - a.z) * e, cx: a.cx + (to.cx - a.cx) * e, cy: a.cy + (to.cy - a.cy) * e };
      from.current = cur;
      setZ(cur);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [region, still]);
  return z;
}

type PinProps = { x: number; y: number; n: number; col: string; on: boolean; sm: boolean; scale: number; onPress: () => void; label: string };

/** 지역 스파크 하나 (프로토타입 lgBub: 많을수록 조금 커지고 · 개수는 하얀 동그라미 · 고르면 천천히 돌아요) */
function Pin({ x, y, n, col, on, sm, scale, onPress, label }: PinProps) {
  const w = n ? (sm ? 19 : 21) + Math.min(n, 4) * 1.2 : 11; // 지도 단위
  const hw = w * 0.887;
  const size = w * scale;
  const spin = useSpin(on);
  const spinStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value * 360}deg` }] }));
  const hit = Math.max(44, size + 8);
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: on }} style={{ position: 'absolute', left: x - hit / 2, top: y - hit / 2, width: hit, height: hit, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{ width: size + 2.2 * scale, height: hw * scale + 2.2 * scale }, spinStyle]}>
        <Svg width={size + 2.2 * scale} height={hw * scale + 2.2 * scale} viewBox={`0 0 ${w + 2.2} ${hw + 2.2}`}>
          {n ? (
            <>
              <G transform={`translate(1.6 2.2) scale(${w / 426.31})`}>
                <Path d={SPARK} fill={C.ink} />
              </G>
              <G transform={`scale(${w / 426.31})`}>
                <Path d={SPARK} fill={col} stroke={C.ink} strokeWidth={2 / (w / 426.31)} strokeLinejoin="round" />
              </G>
            </>
          ) : (
            <G transform={`scale(${w / 426.31})`} opacity={0.75}>
              <Path d={SPARK} fill="#fff" stroke={C.ink} strokeWidth={1.4 / (w / 426.31)} />
            </G>
          )}
        </Svg>
      </Animated.View>
      {n ? (
        <View style={[styles.badge, { left: hit / 2 + w * 0.36 * scale - 5.6 * scale, top: hit / 2 - w * 0.3 * scale - 5.6 * scale, width: 11.2 * scale, height: 11.2 * scale, borderRadius: 5.6 * scale, borderWidth: 1.5 * (scale / 1.3) }]}>
          <PText style={{ fontFamily: Font.display, fontSize: 7.5 * scale, lineHeight: 9 * scale, color: C.ink }}>{n}</PText>
        </View>
      ) : null}
    </Pressable>
  );
}

function useSpin(on: boolean) {
  const still = useReducedMotion();
  const t = useSharedValue(0);
  useEffect(() => {
    if (!on || still) {
      cancelAnimation(t);
      t.set(0);
      return;
    }
    t.set(withRepeat(withTiming(1, { duration: 6000, easing: Easing.linear }), -1, false));
    return () => cancelAnimation(t);
  }, [on, still, t]);
  return t;
}

/** 고른 지역 말풍선 '서울 6' (보라 · 흰 글자) */
function RegionTag({ text, pos, k }: { text: string; pos: readonly [number, number]; k: number }) {
  const w = text.length * 9 + 14;
  const tagW = w * k;
  const left = pos[0] - tagW / 2;
  const top = pos[1] + (-32 - 10) * k;
  const tri = useMemo(() => ({ width: 10 * k, height: 7 * k }), [k]);
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left, top, width: tagW, alignItems: 'center' }}>
      <View style={[styles.tag, { height: 20 * k, borderRadius: 10 * k, width: tagW }]}>
        <PText style={{ fontFamily: Font.body900, fontSize: 11 * k, lineHeight: 14 * k, color: '#fff' }}>{text}</PText>
      </View>
      <Svg width={tri.width + 4} height={tri.height + 2} style={{ marginTop: -2.5 * k }}>
        <Path d={`M2 0 L${2 + tri.width / 2} ${tri.height} L${2 + tri.width} 0`} fill={C.pu} stroke={C.ink} strokeWidth={2} strokeLinejoin="round" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 2, borderColor: Colors.ink, borderRadius: 20, backgroundColor: Colors.white, overflow: 'hidden' },
  mhd: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: 12, paddingHorizontal: 14, height: 28 },
  kick: { fontFamily: Font.body800, fontSize: 11, lineHeight: 16, letterSpacing: 0.3, color: C.pu },
  kr: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 8, paddingHorizontal: 12, paddingBottom: 12 },
  mapCol: { width: '63%' },
  mapBox: { borderWidth: 2, borderColor: Colors.ink, borderRadius: 14, overflow: 'hidden', backgroundColor: SEA },
  rl: { flex: 1, gap: 4 },
  rb: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 27, borderWidth: 2, borderColor: Colors.ink, borderRadius: 9, backgroundColor: Colors.white, paddingHorizontal: 7 },
  rbOn: { backgroundColor: C.pu },
  rbT: { fontFamily: Font.body900, fontSize: 12, lineHeight: 16 },
  rbN: { minWidth: 18, height: 18, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.ink, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center' },
  rbNT: { fontFamily: Font.display, fontSize: 10, lineHeight: 13 },
  sp: { flex: 1 },
  lgd: { flexDirection: 'row', gap: 12, paddingHorizontal: 14, paddingBottom: 12 },
  lgdI: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  lgdT: { fontFamily: Font.body800, fontSize: 11.5, lineHeight: 16, color: Colors.inkSub },
  badge: { position: 'absolute', backgroundColor: '#fff', borderColor: C.ink, alignItems: 'center', justifyContent: 'center' },
  tag: { backgroundColor: C.pu, borderWidth: 2, borderColor: C.ink, alignItems: 'center', justifyContent: 'center' },
});
