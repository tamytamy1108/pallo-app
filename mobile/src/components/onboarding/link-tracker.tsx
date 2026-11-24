import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { EASE, kf, useLoop } from '@/lib/motion';

export type LinkStepState = 'done' | 'now' | 'todo';
export type LinkStep = { label: string; sub: string; state: LinkStepState };

const DOT = 26;
const ROW = 44;

/**
 * 연동 진행 표시 (프로토타입 .trk · .tk-r): 세로 3칸 — 동그라미 · 이름 · 오른쪽 작은 글.
 * 끝난 칸은 보라 ✓, 지금 칸은 보라 점이 숨 쉬듯 퍼져요 (@keyframes pl, 1.4초). 움직임 줄이기면 멈춰 있어요.
 */
export function LinkTracker({ steps }: { steps: LinkStep[] }) {
  return (
    <View style={styles.wrap}>
      {steps.map((s, i) => (
        <View key={s.label} style={styles.row} accessible accessibilityLabel={`${i + 1}단계 ${s.label}, ${s.sub}, ${STATE_LABEL[s.state]}`}>
          {i < steps.length - 1 ? <StepLink from={s.state} to={steps[i + 1].state} order={i} /> : null}
          <StepDot state={s.state} />
          <PText style={[styles.label, s.state === 'done' && styles.labelDone, s.state === 'now' && styles.labelNow]}>{s.label}</PText>
          <PText style={[styles.sub, s.state === 'now' && styles.subOn]}>{s.sub}</PText>
        </View>
      ))}
    </View>
  );
}

const STATE_LABEL: Record<LinkStepState, string> = { done: '끝남', now: '진행 중', todo: '아직' };

/**
 * 두 동그라미 사이 선: 끝난 칸 → 다음 칸 선은 보라로 위에서 아래로 차올라요 (들어올 때 한 번).
 * 지금 칸 → 다음 칸 선은 보라가 조금씩 흘러 내려가요 (아직 진행 중).
 */
function StepLink({ from, to, order }: { from: LinkStepState; to: LinkStepState; order: number }) {
  const still = useReducedMotion();
  const filled = from === 'done' && to !== 'todo';
  const fill = useSharedValue(still || !filled ? 1 : 0);
  useEffect(() => {
    if (!still && filled) fill.set(withDelay(450 + order * 250, withTiming(1, { duration: 650, easing: EASE })));
  }, [still, filled, order, fill]);
  const flow = useLoop(1600, { enabled: from === 'now', delay: 1100 });
  const anim = useAnimatedStyle(() => {
    if (filled) return { transform: [{ scaleY: fill.get() }] };
    // 진행 중: 짧은 보라 줄이 위에서 아래로 흘러요
    const t = flow.get();
    return { opacity: from === 'now' && !still ? kf(t, [0, 15, 75, 100], [0, 0.9, 0.9, 0]) : 0, transform: [{ scaleY: kf(t, [0, 100], [0.05, 0.6]) }] };
  });
  return (
    <View style={styles.link}>
      <Animated.View style={[styles.linkFill, anim]} />
    </View>
  );
}

function StepDot({ state }: { state: LinkStepState }) {
  if (state === 'done') {
    return (
      <View style={[styles.dot, styles.dotDone]}>
        <Svg width={13} height={13} viewBox="0 0 24 24">
          <Path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke={Colors.white} strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </View>
    );
  }
  if (state === 'now') return <NowDot />;
  return <View style={styles.dot} />;
}

/** 지금 칸: 보라 테두리 · 흰 틈 · 보라 속 + 바깥으로 라벤더 고리가 퍼졌다 줄어요 */
function NowDot() {
  const still = useReducedMotion();
  const p = useSharedValue(0);
  useEffect(() => {
    if (still) return;
    p.set(withRepeat(withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }), -1, true));
    return () => cancelAnimation(p);
  }, [still, p]);
  const halo = useAnimatedStyle(() => ({ transform: [{ scale: 1 + p.get() * 0.38 }], opacity: p.get() }));
  return (
    <View style={styles.dotBox}>
      {still ? null : <Animated.View style={[styles.halo, halo]} />}
      <View style={[styles.dot, styles.dotNow]}>
        <View style={styles.core} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 22, paddingLeft: 2 },
  row: { height: ROW, flexDirection: 'row', alignItems: 'center', gap: 12 },
  // 동그라미 아래에서 다음 동그라미까지 잇는 선 (.tk-r:after)
  link: { position: 'absolute', left: DOT / 2 - 1, top: (ROW + DOT) / 2, width: 2, height: ROW - DOT, backgroundColor: Colors.line, overflow: 'hidden' },
  linkFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: Colors.purple, transformOrigin: '50% 0%' },
  dotBox: { width: DOT, height: DOT, alignItems: 'center', justifyContent: 'center' },
  dot: { width: DOT, height: DOT, borderRadius: DOT / 2, borderWidth: 2, borderColor: '#CFC6B2', backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  dotDone: { backgroundColor: Colors.purple, borderColor: Colors.purple },
  dotNow: { borderColor: Colors.purple },
  core: { width: DOT - 12, height: DOT - 12, borderRadius: (DOT - 12) / 2, backgroundColor: Colors.purple },
  halo: { position: 'absolute', width: DOT, height: DOT, borderRadius: DOT / 2, backgroundColor: Colors.lavender },
  label: { flex: 1, fontFamily: Font.body800, fontSize: 15.5, lineHeight: 21, color: '#A79F8F' },
  labelDone: { color: Colors.ink },
  labelNow: { fontFamily: Font.body900, color: Colors.purple },
  sub: { fontFamily: Font.body700, fontSize: 13, lineHeight: 18, color: '#B4AC9B' },
  subOn: { color: Colors.inkSub },
});
