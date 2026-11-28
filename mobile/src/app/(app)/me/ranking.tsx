import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { Stack } from 'expo-router/js-stack';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { css, cubicBezier, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect, Text as SvgText } from 'react-native-svg';

import { apiErrorMessage } from '@/api/errors';
import type { RankingPeriod } from '@/api/ranking';
import { useBranchRanking, useMemberRanking, type BranchRankingView, type MemberRankingView, type RankingRow } from '@/api/use-ranking';
import { Pressable } from '@/components/ui/pressable';
import { TopBar } from '@/components/ui/top-bar';
import { SCREEN } from '@/lib/transitions';
import { MemberFace } from '@/components/character/avatar';
import { ExprRows } from '@/components/my/expr-rows';
import { Lift } from '@/components/my/lift';
import { Appear } from '@/components/ui/appear';
import { Raised } from '@/components/ui/raised';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state-view';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors, Radius } from '@/constants/theme';
import { RANK_COLORS } from '@/data/my';
import { sfx } from '@/lib/feedback';
import { useSavedExpressions } from '@/state/expressions';
import { usePullRefresh } from '@/components/ui/pull-refresh';

const INK = Colors.ink;
/** --spring: cubic-bezier(.2,.9,.3,1.3) · --ease: cubic-bezier(.16,1,.3,1) (CSS 애니메이션용) */
const SPRING = cubicBezier(0.2, 0.9, 0.3, 1.3);
const EASE = cubicBezier(0.16, 1, 0.3, 1);
const SYMBOL =
  'M374.44,140.26h-62.65l40.05-59.4c16.01-23.75,9.74-55.98-14.01-71.99h0c-23.75-16.01-55.98-9.74-71.99,14.01l-54.77,81.24-42.86-63.57c-16.01-23.75-48.24-30.02-71.99-14.01h0c-23.75,16.01-30.02,48.24-14.01,71.99l28.13,41.73h-58.47c-28.64,0-51.86,23.22-51.86,51.86h0c0,28.64,23.22,51.86,51.86,51.86h64.91s-35.8,53.1-35.8,53.1c-16.01,23.75-9.74,55.98,14.01,71.99h0c23.75,16.01,55.98,9.74,71.99-14.01l44.08-65.39,36.42,54.03c16.01,23.75,48.24,30.02,71.99,14.01h0c23.75-16.01,30.02-48.24,14.01-71.99l-28.13-41.73h69.09c28.64,0,51.86-23.22,51.86-51.86h0c0-28.64-23.22-51.86-51.86-51.86Z';

/** 트로피 (프로토타입 ICONS.trophy · 48 상자) */
function Trophy({ size = 30 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path d="M14 10H8a6 6 0 0 0 7 9M34 10h6a6 6 0 0 1-7 9" fill="none" stroke={INK} strokeWidth={2.6} strokeLinecap="round" />
      <Path d="M13 6h22v10a11 11 0 0 1-22 0z" fill="#FFE200" stroke={INK} strokeWidth={2.8} strokeLinejoin="round" />
      <Path d="M21 27h6v7h-6z" fill="#FFE200" stroke={INK} strokeWidth={2.4} />
      <Rect x={14} y={34} width={20} height={8} rx={3} fill="#493087" stroke={INK} strokeWidth={2.6} />
      <Svg x={18.22} y={9.22} width={11.57} height={10.32} viewBox="-11 -11 448.31 399.94">
        <Path fill="#fff" stroke={INK} strokeWidth={22} d={SYMBOL} />
      </Svg>
    </Svg>
  );
}

/** 메달 1 · 2 · 3 (프로토타입 MEDAL) */
const MEDAL_C = ['#FFE200', '#F2A8BA', '#8FA6DC'];
function Medal({ n, size = 40 }: { n: number; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path d="M15 4h8l4 14h-8zM33 4h-8l-4 14h8z" fill="#fff" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      <Circle cx={24} cy={30} r={13} fill={MEDAL_C[n - 1]} stroke={INK} strokeWidth={2.8} />
      <Circle cx={24} cy={30} r={8.5} fill="none" stroke={INK} strokeWidth={1.6} strokeDasharray="2 2.4" />
      <SvgText x={24} y={34.6} textAnchor="middle" fontFamily={Font.display} fontSize={13} fill={INK}>
        {n}
      </SvgText>
    </Svg>
  );
}

/** 내 순위 띠 왼쪽 동그라미 (프로토타입 .face + ICON('pallo')) */
function PalloFace() {
  return (
    <View style={styles.face}>
      <Image source={require('@/assets/characters/c-upright-yellow.png')} style={styles.faceImg} contentFit="contain" />
    </View>
  );
}

// 시상대 막대가 아래에서 자라요 (@keyframes grow · .7s --spring) · 지점 막대는 왼쪽에서 (barIn .8s --ease)
const grow = css.keyframes({ from: { transform: [{ scaleY: 0 }] }, to: { transform: [{ scaleY: 1 }] } });
const barIn = css.keyframes({ from: { transform: [{ scaleX: 0 }] }, to: { transform: [{ scaleX: 1 }] } });
// 순위 줄이 차례로 올라와요 (@keyframes rise · .5s --spring · 줄마다 .05초)
const rise = css.keyframes({ from: { opacity: 0, transform: [{ translateY: 14 }, { scale: 0.97 }] }, to: { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }] } });

const POD = [
  { h: 96, bg: Colors.yellow },
  { h: 72, bg: Colors.rosePink },
  { h: 58, bg: Colors.sky },
];

/**
 * 랭킹 · 퀘스트 (프로토타입 #page-quest): PALLO 랭킹(개인 · 지점 대항전 × 이번 주 · 이번 달) → 챌린지 카드 → 내 표현함.
 * 프로토타입은 탭 화면이라 아래 탭 바가 보여요 — 앱은 마이 위로 쌓이는 화면이에요.
 */
export default function RankingScreen() {
  const pull = usePullRefresh();
  // 움직임 줄이기면 시상대 · 막대 · 순위 줄이 바로 다 보여요
  const still = useReducedMotion();
  const insets = useSafeAreaInsets();
  const marks = useSavedExpressions();
  const [view, setView] = useState<'me' | 'br'>('me');
  const [per, setPer] = useState<RankingPeriod>('WEEK');
  // 보고 있는 탭만 받아요 (순위 · 합계 · 남은 점수는 서버가 정해요)
  const members = useMemberRanking(per, view === 'me');
  const branches = useBranchRanking(per, view === 'br');
  const q = view === 'me' ? members : branches;
  const perLabel = per === 'WEEK' ? '이번 주' : '이번 달';

  // 프로필은 아직 이름으로 열어요 — 서버 연동 뒤 회원 code(p.code)로 바꿔요
  const openProfile = (n: string, isMe?: boolean) => {
    sfx('tap');
    router.push((isMe ? '/my' : `/me/profile/${encodeURIComponent(n)}`) as Href);
  };

  const row = (p: RankingRow, k: number) => (
    <Animated.View key={`${p.no}-${p.n}`} style={still ? undefined : { animationName: rise, animationDuration: '500ms', animationDelay: `${50 * k}ms`, animationFillMode: 'both', animationTimingFunction: SPRING }}>
      <View style={[styles.rkRow, p.me && styles.rkMe]}>
        <PText style={styles.no}>{p.no}</PText>
        <Pressable onPress={() => openProfile(p.n, p.me)} accessibilityRole="button" accessibilityLabel={`${p.n} 프로필`}>
          <MemberFace name={p.n} size={34} bg={p.c} />
        </Pressable>
        <View style={styles.nm}>
          <PText style={styles.nmT} numberOfLines={1}>
            {p.me ? '나 · ' : ''}
            {p.n}
          </PText>
          <PText style={styles.nmS} numberOfLines={1}>
            {p.b}
          </PText>
        </View>
        <PText style={styles.pt}>{p.pt.toLocaleString()}P</PText>
      </View>
    </Animated.View>
  );

  const mineBand = (label: string, rank: number | null, points: number) => (
    <View style={styles.mine}>
      <PalloFace />
      <PText style={styles.mineT}>{label}</PText>
      <PText style={styles.mineB}>{rank ? `${rank}위` : '–'}</PText>
      <PText style={styles.minePt}>{points.toLocaleString()}P</PText>
    </View>
  );

  const memberBody = (d: MemberRankingView) => (
    <>
      {mineBand('내 순위', d.myRank, d.myPoints)}
      {d.top.length === 0 ? (
        <EmptyState title={`아직 ${perLabel} 랭킹이 없어요`} compact />
      ) : (
        <View key={`me-${per}`}>
          <View style={styles.podium}>
            {[1, 0, 2].map((i) => {
              const p = d.top[i];
              if (!p) return <View key={i} style={styles.pod} />;
              return (
                <View key={i} style={styles.pod}>
                  <Pressable onPress={() => openProfile(p.n, p.me)} accessibilityRole="button" accessibilityLabel={`${i + 1}위 ${p.n} 프로필`} style={styles.podAv}>
                    <MemberFace name={p.n} size={52} bg={p.c} />
                    <View style={styles.medal} pointerEvents="none">
                      <Medal n={i + 1} />
                    </View>
                  </Pressable>
                  <PText style={styles.podNm} numberOfLines={1}>
                    {p.me ? '나 · ' : ''}
                    {p.n}
                  </PText>
                  <PText style={styles.podPt}>{p.pt.toLocaleString()}P</PText>
                  <Animated.View
                    style={[
                      styles.blk,
                      { height: POD[i].h, backgroundColor: POD[i].bg },
                      still ? null : { animationName: grow, animationDuration: '700ms', animationDelay: `${100 + i * 80}ms`, animationFillMode: 'both', animationTimingFunction: SPRING },
                    ]}>
                    <PText style={styles.blkT}>{i + 1}</PText>
                  </Animated.View>
                </View>
              );
            })}
          </View>
          {d.top.length > 3 || d.around.length > 0 ? (
            <View style={styles.rkList}>
              {d.top.slice(3).map((p, k) => row(p, k))}
              {d.gap && (
                <View style={styles.gap}>
                  {[0, 1, 2].map((i) => (
                    <View key={i} style={styles.gapDot} />
                  ))}
                </View>
              )}
              {d.around.map((p, k) => row(p, 7 + k))}
              {d.pointsToTop10 != null && (
                <PText style={styles.up}>
                  10위까지 <PText style={styles.upB}>{d.pointsToTop10.toLocaleString()}P</PText> 남았어요
                </PText>
              )}
            </View>
          ) : null}
        </View>
      )}
    </>
  );

  const branchBody = (d: BranchRankingView) => (
    <>
      {mineBand(d.myBranch ? `우리 지점 (${d.myBranch.name})` : '우리 지점', d.myBranch?.rank ?? null, d.myBranch?.points ?? 0)}
      {d.rows.length === 0 ? (
        <EmptyState title={`아직 ${perLabel} 지점 대항전 기록이 없어요`} compact />
      ) : (
        <View key={`br-${per}`} style={[styles.rkList, styles.rkListBr]}>
          {d.rows.map((b, k) => (
            <View key={b.code} style={[styles.rkRow, b.mine && styles.rkMe]}>
              <View style={styles.noBox}>{b.no <= 3 ? <Medal n={b.no} size={26} /> : <PText style={styles.no}>{b.no}</PText>}</View>
              <View style={styles.nm}>
                <PText style={styles.nmT} numberOfLines={1}>
                  {b.name}
                  {b.mine ? ' · 우리 지점' : ''}
                </PText>
                <View style={styles.bar}>
                  <Animated.View
                    style={[
                      styles.barFill,
                      { width: `${Math.round(b.ratio * 100)}%`, backgroundColor: b.mine ? Colors.ink : RANK_COLORS[k % RANK_COLORS.length] },
                      still ? null : { animationName: barIn, animationDuration: '800ms', animationDelay: `${100 + 60 * k}ms`, animationFillMode: 'both', animationTimingFunction: EASE },
                    ]}
                  />
                </View>
              </View>
              <PText style={styles.pt}>{b.pt.toLocaleString()}P</PText>
            </View>
          ))}
        </View>
      )}
    </>
  );

  return (
    <View style={styles.screen}>
      <Stack.Screen options={SCREEN.push} />
      <TopBar title="랭킹 · 퀘스트" fallback="/my" backLabel="마이로 돌아가기" safeTop />
      <ScrollView {...pull.scrollProps} contentContainerStyle={[styles.body, { paddingTop: 16, paddingBottom: insets.bottom + 60 }]}>

        <Appear kind="rise">
          <Raised radius={Radius.card}>
            <View style={styles.rank}>
              <View style={styles.hRow}>
                <Trophy />
                <PText style={styles.nbTitle}>PALLO 랭킹</PText>
              </View>
              <View style={styles.seg} accessibilityRole="tablist" accessibilityLabel="랭킹 종류">
                {(
                  [
                    ['me', '개인'],
                    ['br', '지점 대항전'],
                  ] as const
                ).map(([k, l]) => (
                  <Pressable key={k} onPress={() => setView(k)} accessibilityRole="tab" accessibilityState={{ selected: view === k }} style={[styles.segBtn, view === k && styles.segOn]}>
                    <PText style={[styles.segT, view === k && styles.segTOn]}>{l}</PText>
                  </Pressable>
                ))}
              </View>
              <View style={styles.period}>
                {(
                  [
                    ['WEEK', '이번 주'],
                    ['MONTH', '이번 달'],
                  ] as const
                ).map(([k, l]) => (
                  <Pressable key={k} onPress={() => setPer(k)} accessibilityRole="button" accessibilityState={{ selected: per === k }} style={[styles.perBtn, per === k && styles.perOn]}>
                    <PText style={[styles.perT, per === k && styles.perTOn]}>{l}</PText>
                  </Pressable>
                ))}
                <PText style={styles.perNote}>전 지점 · 포인트 기준</PText>
              </View>

              {q.isPending ? (
                <LoadingState />
              ) : q.isError ? (
                <ErrorState message={apiErrorMessage(q.error)} onRetry={() => q.refetch()} />
              ) : view === 'me' ? (
                members.data && memberBody(members.data)
              ) : (
                branches.data && branchBody(branches.data)
              )}
            </View>
          </Raised>
        </Appear>

        <Appear kind="rise" delay={60}>
          <Pressable
            onPress={() => {
              sfx('tap');
              router.push('/lounge');
            }}
            accessibilityRole="button"
            accessibilityLabel="챌린지 참여하러 가기">
            {({ pressed }) => (
              <Raised radius={Radius.card} pressed={pressed}>
                <View style={styles.ch}>
                  <View style={styles.chTop}>
                    <Image source={require('@/assets/characters/c-upright-yellow.png')} style={styles.chImg} contentFit="contain" />
                    <View style={styles.chTx}>
                      <PText style={styles.chB}>챌린지로 포인트 더 받기</PText>
                      <PText style={styles.chS} numberOfLines={1}>
                        인증할 때마다 +10P
                      </PText>
                    </View>
                  </View>
                  <Lift radius={23}>
                    <View style={styles.chGo}>
                      <PText style={styles.chGoT}>챌린지 참여하러 가기</PText>
                      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round">
                        <Path d="M5 12h14M13 6l6 6-6 6" />
                      </Svg>
                    </View>
                  </Lift>
                </View>
              </Raised>
            )}
          </Pressable>
        </Appear>

        <PText style={styles.secTitle} accessibilityRole="header">
          내 표현함
        </PText>
        <Appear kind="rise" delay={80}>
          <ExprRows list={marks} />
        </Appear>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.cream },
  body: { paddingHorizontal: 16, gap: 14 },
  rank: { padding: 16, gap: 12, borderWidth: 2, borderColor: INK, borderRadius: Radius.card, backgroundColor: Colors.white },
  hRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nbTitle: { fontFamily: Font.display, fontSize: 16, lineHeight: 22 },
  seg: { flexDirection: 'row', gap: 6, padding: 5, borderRadius: 18, borderWidth: 2, borderColor: INK, backgroundColor: Colors.white },
  segBtn: { flex: 1, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  segOn: { backgroundColor: INK },
  segT: { fontFamily: Font.body800, fontSize: 14, lineHeight: 20 },
  segTOn: { color: Colors.white },
  period: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  perBtn: { height: 32, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1.5, borderColor: INK, backgroundColor: Colors.white, justifyContent: 'center' },
  perOn: { backgroundColor: INK },
  perT: { fontFamily: Font.body800, fontSize: 12, lineHeight: 17 },
  perTOn: { color: Colors.white },
  perNote: { marginLeft: 'auto', fontFamily: Font.body500, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  mine: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16, borderWidth: 2, borderColor: INK, backgroundColor: Colors.yellow },
  face: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: INK, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  faceImg: { width: 36, height: 23 },
  mineT: { fontFamily: Font.body800, fontSize: 14, lineHeight: 20 },
  mineB: { fontFamily: Font.display, fontSize: 20, lineHeight: 26 },
  minePt: { marginLeft: 'auto', fontFamily: Font.display, fontSize: 14, lineHeight: 20 },
  podium: { flexDirection: 'row', gap: 8, alignItems: 'flex-end', marginTop: 8 },
  pod: { flex: 1, minWidth: 0, alignItems: 'center', gap: 6 },
  podAv: { width: 52, height: 52 },
  medal: { position: 'absolute', top: -20, right: -20 },
  podNm: { fontFamily: Font.body900, fontSize: 13, lineHeight: 18, maxWidth: '100%' },
  podPt: { fontFamily: Font.display, fontSize: 12, lineHeight: 16 },
  blk: { width: '100%', alignItems: 'center', paddingTop: 8, borderWidth: 2, borderBottomWidth: 0, borderColor: INK, borderTopLeftRadius: 14, borderTopRightRadius: 14, transformOrigin: 'center bottom' },
  blkT: { fontFamily: Font.display, fontSize: 22, lineHeight: 28 },
  rkList: { gap: 4, borderTopWidth: 2, borderColor: INK, paddingTop: 10 },
  rkListBr: { borderTopWidth: 0, paddingTop: 0 },
  rkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 50, paddingHorizontal: 10, borderRadius: 14, borderWidth: 2, borderColor: 'transparent' },
  rkMe: { backgroundColor: Colors.yellow, borderColor: INK },
  no: { width: 28, textAlign: 'center', fontFamily: Font.display, fontSize: 13, lineHeight: 18 },
  noBox: { width: 28, alignItems: 'center' },
  nm: { flex: 1, minWidth: 0, paddingVertical: 4 },
  nmT: { fontFamily: Font.body700, fontSize: 14, lineHeight: 19 },
  nmS: { fontFamily: Font.body500, fontSize: 11, lineHeight: 15, color: Colors.inkSub },
  pt: { fontFamily: Font.display, fontSize: 13, lineHeight: 18 },
  bar: { height: 10, marginTop: 5, borderRadius: 5, borderWidth: 1.5, borderColor: INK, backgroundColor: '#F6F1E4', overflow: 'hidden' },
  barFill: { height: '100%', transformOrigin: 'left center' },
  gap: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 6 },
  gapDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#BDB5A6' },
  up: { marginTop: 6, marginBottom: 2, textAlign: 'center', fontFamily: Font.body800, fontSize: 12.5, lineHeight: 18, color: Colors.inkSub },
  upB: { fontFamily: Font.body800, fontSize: 12.5, color: Colors.purple },
  ch: { gap: 12, paddingTop: 14, paddingHorizontal: 16, paddingBottom: 16, borderWidth: 2, borderColor: INK, borderRadius: Radius.card, backgroundColor: Colors.purple },
  chTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  chImg: { width: 50, height: 32, marginTop: -4, marginBottom: -6 },
  chTx: { flex: 1, minWidth: 0, gap: 3 },
  chB: { fontFamily: Font.body900, fontSize: 16, lineHeight: 22, color: Colors.white },
  chS: { fontFamily: Font.body700, fontSize: 12.5, lineHeight: 17, color: '#E3DBF7' },
  chGo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 46, paddingHorizontal: 12, borderRadius: 23, borderWidth: 2, borderColor: INK, backgroundColor: Colors.yellow },
  chGoT: { fontFamily: Font.body900, fontSize: 15, lineHeight: 21 },
  secTitle: { marginTop: 6, marginHorizontal: 2, fontFamily: Font.display, fontSize: 17, lineHeight: 24 },
});
