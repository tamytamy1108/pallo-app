import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { ClipPath, Defs, G, Path, Rect } from 'react-native-svg';

import { Pressable } from '@/components/ui/pressable';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { branchOk, daysFrom, LG_C, LG_REG, MAP_SPOTS } from '@/data/lounge';
import { KOREA_MAP } from '@/data/lounge-maps';
import { openRegion, useLounge } from '@/data/lounge-store';

import { BoltIcon, SparkIcon } from './icons';
import { SparkPin } from './map-parts';

/** 지역별 [열린 번개 수, 동아리 수] (프로토타입 lgRegCount: 지난 번개는 빼요) */
function useRegionCounts() {
  const brs = useLounge((s) => s.brs);
  const c: Record<string, [number, number]> = Object.fromEntries(LG_REG.map(([r]) => [r, [0, 0]]));
  MAP_SPOTS.forEach((p) => {
    if (!branchOk(brs, p.br) || !c[p.reg]) return;
    if (p.k === 'meet') {
      if (p.date && daysFrom(p.date) >= 0) c[p.reg][0]++;
    } else c[p.reg][1]++;
  });
  return c;
}

/**
 * 추천 탭의 작은 한국 지도 카드 (프로토타입 lgKoreaMap(mini)). 지역을 누르면 번개 · 동아리 탭으로 그 지역만.
 * 지도 윤곽: Natural Earth (크림 바다 · 노랑 땅 · 잉크 테두리 · 그림자 · 시 · 도 경계선)
 */
export function MiniMapCard() {
  const c = useRegionCounts();
  const cnt = (r: string) => c[r][0] + c[r][1];
  const tot = LG_REG.reduce((a, [r]) => a + cnt(r), 0);
  const totM = LG_REG.reduce((a, [r]) => a + c[r][0], 0);
  const totC = LG_REG.reduce((a, [r]) => a + c[r][1], 0);
  const [box, setBox] = useState(204);
  // 지도를 누르면 가장 가까운 지역으로 (프로토타입 lgZoomMaps 클릭 · 34 안쪽)
  const pickNear = (lx: number, ly: number) => {
    const s = (box - 4) / 166;
    const px = (lx - 2) / s + 46;
    const py = (ly - 2) / s;
    const near = LG_REG.map(([r, x, y]) => [r, Math.hypot(x - px, y - py)] as const).sort((a, b) => a[1] - b[1])[0];
    if (near && near[1] <= 34) openRegion(near[0]);
  };
  const list: [string | undefined, string, number][] = [[undefined, '전체', tot], ...LG_REG.filter(([r]) => cnt(r)).map(([r]): [string, string, number] => [r, r, cnt(r)])];
  return (
    <View style={styles.cardShadow}>
      <View style={styles.card} accessibilityLabel="번개 · 동아리 지도">
        <View style={styles.mhd}>
          <View style={styles.kickRow}>
            <BoltIcon />
            <PText style={styles.kick}>전국 번개 · 동아리 지도</PText>
          </View>
          <View style={styles.sp} />
          <Pressable onPress={() => openRegion(undefined)} accessibilityRole="button" hitSlop={8}>
            <PText style={styles.big}>지도 크게 ›</PText>
          </Pressable>
        </View>
        <View style={styles.kr}>
          <Pressable onLayout={(e) => setBox(e.nativeEvent.layout.width)} onPress={(e) => pickNear(e.nativeEvent.locationX, e.nativeEvent.locationY)} accessibilityLabel="번개 · 동아리 지도 · 지역을 누르면 그 지역만" style={styles.svgBox}>
            <Svg width="100%" height="100%" viewBox={`46 0 166 ${KOREA_MAP.h}`}>
              <Rect width={KOREA_MAP.w} height={KOREA_MAP.h} fill={Colors.cream} />
              <Path d={KOREA_MAP.near} fill="#F0E9D9" />
              <Path d={KOREA_MAP.kr} transform="translate(4 5)" fill={Colors.ink} />
              <Defs>
                <ClipPath id="lgKrClipMini">
                  <Path d={KOREA_MAP.kr} />
                </ClipPath>
              </Defs>
              <Path d={KOREA_MAP.kr} fill={Colors.yellow} />
              <Path d={KOREA_MAP.provinces} clipPath="url(#lgKrClipMini)" fill="none" stroke={Colors.ink} strokeWidth={1.6} strokeOpacity={0.85} strokeLinejoin="round" strokeLinecap="round" />
              <Path d={KOREA_MAP.kr} fill="none" stroke={Colors.ink} strokeWidth={2.4} strokeLinejoin="round" />
              {LG_REG.map(([r, x, y]) => {
                const [m, k] = c[r];
                if (!m && !k) return <SparkPin key={r} x={x} y={y} n={0} color="#fff" />;
                const both = m > 0 && k > 0;
                const dx = both ? 10 : 0;
                return (
                  <G key={r}>
                    {m ? <SparkPin x={x - dx} y={y} n={m} color={LG_C.pk} sm={both} /> : null}
                    {k ? <SparkPin x={x + dx} y={y + (both ? 4 : 0)} n={k} color={LG_C.pu} sm={both} /> : null}
                  </G>
                );
              })}
            </Svg>
          </Pressable>
          <View style={styles.rl}>
            {list.map(([v, l, n]) => (
              <Pressable key={l} onPress={() => openRegion(v)} accessibilityRole="button" accessibilityLabel={`${l} ${n}개`} style={({ pressed }) => [styles.rb, pressed && { transform: [{ scale: 0.96 }] }]}>
                <PText style={styles.rbText}>{l}</PText>
                <View style={styles.sp} />
                <View style={styles.rbN}>
                  <PText style={styles.rbNText}>{n}</PText>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={styles.lgd}>
          <View style={styles.ic}>
            <SparkIcon color={LG_C.pk} />
            <PText style={styles.lgdText}>번개 {totM}</PText>
          </View>
          <View style={styles.ic}>
            <SparkIcon color={LG_C.pu} />
            <PText style={styles.lgdText}>동아리 {totC}</PText>
          </View>
          <View style={styles.ic}>
            <SparkIcon color="#fff" />
            <PText style={styles.lgdText}>준비 중</PText>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sp: { flex: 1 },
  cardShadow: { borderRadius: 20, boxShadow: `4px 4px 0px ${Colors.ink}` },
  card: { backgroundColor: '#fff', borderWidth: 2, borderColor: Colors.ink, borderRadius: 20, overflow: 'hidden' },
  mhd: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 12, paddingHorizontal: 14 },
  kickRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  kick: { fontFamily: Font.display, fontSize: 11, lineHeight: 16, letterSpacing: 0.3, color: Colors.purple },
  big: { fontFamily: Font.body900, fontSize: 12.5, lineHeight: 19, color: Colors.purple, paddingVertical: 4 },
  kr: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 8, paddingHorizontal: 12, paddingBottom: 12 },
  svgBox: { width: '63%', aspectRatio: 170 / 285, borderWidth: 2, borderColor: Colors.ink, borderRadius: 14, overflow: 'hidden', backgroundColor: Colors.cream },
  rl: { flex: 1, gap: 4 },
  rb: { height: 27, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 7, backgroundColor: '#fff', borderWidth: 2, borderColor: Colors.ink, borderRadius: 9 },
  rbText: { fontFamily: Font.body900, fontSize: 12, lineHeight: 16 },
  rbN: { borderWidth: 1, borderColor: Colors.ink, borderRadius: 10, paddingHorizontal: 4, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  rbNText: { fontFamily: Font.display, fontSize: 10, lineHeight: 13 },
  lgd: { flexDirection: 'row', gap: 12, paddingHorizontal: 14, paddingBottom: 12 },
  ic: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  lgdText: { fontFamily: Font.body800, fontSize: 11.5, lineHeight: 16, color: Colors.inkSub },
});
