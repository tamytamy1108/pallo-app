import { Image } from 'expo-image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { css, cubicBezier, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';

import { Pressable } from '@/components/ui/pressable';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import type { ChestReward } from '@/data/home';
import { haptic, sfx } from '@/lib/feedback';
import { LayerModal } from '@/components/ui/sheet-stack';

import { CHEST_RATIO, TreasureChest } from './treasure-chest';

const CHEST_W = 110;
const CHEST_H = CHEST_W * CHEST_RATIO;
const BIG = 1.5;
const FOOT_PAD = 14;
/** 열고 나서: 0.22초 뒤 장면 시작 → 1.6초 뒤 '다음 코너로' 켜짐 */
const GO_AT = 220;
const UNLOCK_AT = 1600;
const COUNT_AT = GO_AT + 1050;
const HINT_AT = 4000;
const SPARK_COLORS = [Colors.yellow, Colors.rosePink, Colors.sky, Colors.lavender, Colors.white];

/**
 * 챕터 완료 보상 상자 (이슈 #7 · 시안 C 'XP 크게' · prototype/celebration-chest-quick.html).
 * 1) 상자가 빈 곳 한가운데 크게 → 한 번 누르면 뚜껑이 열리고 반짝이가 터져요 (팡파르)
 * 2) 팔로가 상자에서 솟아올라 옆에 착지하고, 상자는 위로 작게 미끄러져 올라가요
 * 3) +XP 가 0부터 차오르고 레벨 막대 · 작은 칸 세 개(배지 · 새 표현 · 연속)가 나와요. 2.5초 안에 끝
 * 4초 동안 안 누르면 '눌러서 열기' 힌트만 (저절로 열리지 않아요). 이미 연 상자 · 움직임 줄이기면 처음부터 열린 모습.
 * 버튼(다음 코너로 · 홈으로)은 아래 고정, 상자가 열려야 '다음 코너로'가 켜져요.
 */
export function ChestCelebrate({
  unit,
  unitLabel = `${unit}과`,
  title,
  reward,
  opened,
  onOpen,
  onHome,
  onNext,
}: {
  unit: number;
  /** 과 이름표 (Lv.1 · 2 '5과' · Lv.3 '#101' · Lv.4 '1회') */
  unitLabel?: string;
  title: string;
  reward: ChestReward;
  /** 이미 연 상자 (다시 보기) */
  opened: boolean;
  /** 처음 열었을 때 (보상 받음 기록) */
  onOpen: () => void;
  onHome: () => void;
  /** 없으면 마지막 과: '홈으로'만 */
  onNext?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  // 처음부터 열린 모습 (전환 없이)
  const [instant] = useState(() => opened || reduced);
  const [open, setOpen] = useState(instant);
  const [go, setGo] = useState(instant);
  const [ready, setReady] = useState(instant);
  const [hint, setHint] = useState(false);
  const [xp, setXp] = useState(instant ? reward.xp : 0);
  const [firstOpen, setFirstOpen] = useState(false);

  // 큰 상자 자리: 제목 아래 ~ 버튼 위 빈 곳의 한가운데 (재고 나서야 보여요)
  const [stageY, setStageY] = useState<number | null>(null);
  const [footY, setFootY] = useState<number | null>(null);
  const [slot, setSlot] = useState<{ y: number; h: number } | null>(null);
  const measured = stageY != null && footY != null && slot != null;
  const target = measured ? (footY - stageY + FOOT_PAD) / 2 : 0;
  const cy = measured ? Math.round(target - (slot.y + slot.h / 2)) : 0;

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));
  useEffect(() => {
    const list = timers.current;
    return () => list.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (instant) return;
    const t = setTimeout(() => setHint(true), HINT_AT);
    return () => clearTimeout(t);
  }, [instant]);

  const openChest = () => {
    if (open) return;
    setOpen(true);
    setHint(false);
    setFirstOpen(true);
    onOpen();
    sfx('fanfare'); // 소리 끄기면 sfx 가 조용해요
    haptic('success');
    later(() => setGo(true), GO_AT);
    later(() => {
      const t0 = Date.now();
      const tick = setInterval(() => {
        const k = Math.min(1, (Date.now() - t0) / 900);
        setXp(Math.round(reward.xp * (1 - Math.pow(1 - k, 3))));
        if (k >= 1) clearInterval(tick);
      }, 30);
      timers.current.push(tick as unknown as ReturnType<typeof setTimeout>);
    }, COUNT_AT);
    later(() => setReady(true), UNLOCK_AT);
  };

  const anim = !instant;
  const heading = !open ? `${unitLabel} 끝!\n상자를 열어 봐요` : firstOpen ? `${unitLabel} 완료!` : `${unitLabel} 보상`;

  return (
    <LayerModal visible animationType="fade" onRequestClose={onHome} statusBarTranslucent>
      <View style={StyleSheet.flatten([styles.root, { paddingTop: 54 + insets.top }])}>
        <View style={styles.kick}>
          <PText style={styles.kickText} color={Colors.purple}>
            {title}
          </PText>
        </View>
        <PText style={styles.title} accessibilityRole="header">
          {heading}
        </PText>

        <View style={StyleSheet.flatten([styles.stage, !measured && styles.hidden])} onLayout={(e) => setStageY(e.nativeEvent.layout.y)}>
          {/* 상자: 처음엔 가운데 크게 → 열리면 위로 작게 */}
          <Animated.View
            onLayout={(e) => setSlot({ y: e.nativeEvent.layout.y, h: e.nativeEvent.layout.height })}
            style={[styles.slot, { transform: go ? [{ translateY: 0 }, { scale: 1 }] : [{ translateY: cy }, { scale: BIG }] }, anim && measured && slide]}>
            <Pressable onPress={openChest} disabled={open} accessibilityRole="button" accessibilityLabel={open ? `${unitLabel} 보상 상자, 열림` : `${unitLabel} 보상 상자 열기`} sound={false}>
              <View style={styles.chestBox}>
                <Animated.View pointerEvents="none" style={[styles.glow, { opacity: open ? 1 : 0, transform: [{ scale: open ? 1 : 0.3 }] }, anim && glowEase]}>
                  <Glow />
                </Animated.View>
                <Animated.View style={[{ transformOrigin: '50% 90%' }, !open && !reduced && bob]}>
                  <TreasureChest width={CHEST_W} open={open} animated={anim} />
                </Animated.View>
                {open && anim && <Sparks />}
              </View>
            </Pressable>
          </Animated.View>

          <Animated.View style={[styles.xpRow, { opacity: go ? 1 : 0, transform: [{ scale: go ? 1 : 0.6 }] }, anim && xpEase]}>
            <PText style={styles.xp} accessibilityLabel={`경험치 ${reward.xp} 받음`}>
              +{xp}
            </PText>
            <PText style={styles.xpUnit}>XP</PText>
          </Animated.View>
          <Animated.View style={[styles.bar, { opacity: go ? 1 : 0 }, anim && barShow]}>
            <Animated.View style={[styles.barFill, { transform: [{ scaleX: go ? reward.barTo : reward.barFrom }] }, anim && barFill]} />
          </Animated.View>
          <Animated.View style={[{ opacity: go ? 1 : 0 }, anim && lvShow]}>
            <PText style={styles.lv} color={Colors.inkSub}>
              Lv.{reward.nextLevel}까지 {reward.toNext} XP
            </PText>
          </Animated.View>

          <View style={styles.minis}>
            {[
              { c: '#F6D9E0', ic: '★', t: `${reward.badge}\n배지` },
              { c: Colors.lavender, ic: 'Aa', t: `새 표현\n${reward.newWords}개` },
              { c: '#FFF3B8', ic: '🔥', t: `연속\n${reward.streak}일` },
            ].map((m, i) => (
              <Animated.View key={m.ic} style={[styles.miniWrap, { opacity: go ? 1 : 0, transform: [{ translateY: go ? 0 : 16 }] }, anim && miniEase[i]]}>
                <View style={styles.miniShadow} />
                <View style={styles.mini}>
                  <View style={StyleSheet.flatten([styles.ic, { backgroundColor: m.c }])}>
                    <PText style={styles.icText}>{m.ic}</PText>
                  </View>
                  <PText style={styles.miniText}>{m.t}</PText>
                </View>
              </Animated.View>
            ))}
          </View>

          {go && measured && <Pallo cy={cy} anim={anim} />}

          {hint && !open && measured && (
            <Animated.View pointerEvents="none" style={[styles.hint, { top: target + CHEST_H * BIG * 0.5 + 14 }, !reduced && hintBob]}>
              <PText style={styles.hintText} color={Colors.white}>
                눌러서 열기
              </PText>
            </Animated.View>
          )}
        </View>

        {/* 행동 버튼: 아래 고정 */}
        <View style={StyleSheet.flatten([styles.foot, { paddingBottom: 26 + insets.bottom }])} onLayout={(e) => setFootY(e.nativeEvent.layout.y)}>
          {onNext && <NextButton ready={ready} still={reduced} onPress={onNext} />}
          <Pressable onPress={onHome} accessibilityRole="button" accessibilityLabel="홈으로" sound="back">
            {({ pressed }) => (
              <View style={styles.btnWrap}>
                <View style={styles.btnShadow} />
                <View style={StyleSheet.flatten([styles.btn, styles.btnWhite, pressed && styles.btnDown])}>
                  <PText style={styles.btnText}>홈으로</PText>
                </View>
              </View>
            )}
          </Pressable>
        </View>
      </View>
    </LayerModal>
  );
}

/** 다음 코너로: 켜지면 2.4초마다 살짝 눌렸다 올라오고, 화살표가 톡, 빛줄기가 훑고 지나가요 */
function NextButton({ ready, still, onPress }: { ready: boolean; still: boolean; onPress: () => void }) {
  const [w, setW] = useState(0);
  const loop = ready && !still;
  const sweep = useMemo(
    () =>
      w
        ? css.keyframes({
            '0%, 45%': { transform: [{ translateX: -w * 0.4 }, { skewX: '-18deg' }] },
            '75%, 100%': { transform: [{ translateX: w * 1.4 }, { skewX: '-18deg' }] },
          })
        : null,
    [w],
  );
  return (
    <Pressable
      onPress={() => {
        sfx('big');
        onPress();
      }}
      disabled={!ready}
      accessibilityRole="button"
      accessibilityLabel="다음 코너로"
      accessibilityState={{ disabled: !ready }}>
      {({ pressed }) => (
        <View style={StyleSheet.flatten([styles.btnWrap, !ready && styles.off])}>
          <View style={styles.btnShadow} />
          <Animated.View
            onLayout={(e) => setW(e.nativeEvent.layout.width)}
            style={[styles.btn, styles.btnYellow, pressed && styles.btnDown, loop && !pressed && { animationName: nudgeKf, animationDuration: '2400ms', animationDelay: '400ms', animationIterationCount: 'infinite', animationTimingFunction: 'ease-in-out' }]}>
            {loop && sweep && (
              <Animated.View pointerEvents="none" style={[styles.shine, { width: w * 0.34 }, { animationName: sweep, animationDuration: '2400ms', animationDelay: '400ms', animationIterationCount: 'infinite', animationTimingFunction: 'ease-in-out' }]} />
            )}
            <PText style={styles.btnText}>다음 코너로</PText>
            <Animated.View style={loop ? { animationName: arrowKf, animationDuration: '2400ms', animationDelay: '400ms', animationIterationCount: 'infinite', animationTimingFunction: 'ease-in-out' } : null}>
              <Svg width={18} height={18} viewBox="0 0 20 20">
                <Path d="M4 10h11M10.5 5l5 5-5 5" stroke={Colors.ink} strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </Animated.View>
          </Animated.View>
        </View>
      )}
    </Pressable>
  );
}

/** 팔로 (원본 PNG 그대로): 큰 상자 한가운데서 솟아올라 옆에 착지(찌그러졌다 펴짐) → 신나서 콩콩 */
function Pallo({ cy, anim }: { cy: number; anim: boolean }) {
  const out = useMemo(
    () =>
      css.keyframes({
        '0%': { opacity: 0, transform: [{ translateX: -86 }, { translateY: cy + 8 }, { scaleX: 0.3 }, { scaleY: 0.3 }, { rotate: '0deg' }] },
        '12%': { opacity: 1 },
        '42%': { transform: [{ translateX: -70 }, { translateY: -30 }, { scaleX: 0.95 }, { scaleY: 1.15 }, { rotate: '-12deg' }] },
        '68%': { transform: [{ translateX: 0 }, { translateY: 0 }, { scaleX: 1.2 }, { scaleY: 0.8 }, { rotate: '8deg' }] },
        '82%': { transform: [{ translateX: 0 }, { translateY: -9 }, { scaleX: 0.95 }, { scaleY: 1.06 }, { rotate: '8deg' }] },
        '100%': { opacity: 1, transform: [{ translateX: 0 }, { translateY: 0 }, { scaleX: 1 }, { scaleY: 1 }, { rotate: '8deg' }] },
      }),
    [cy],
  );
  return (
    <View pointerEvents="none" style={styles.pallo}>
      <Animated.View style={[styles.palloShadow, anim ? { animationName: shdIn, animationDuration: '900ms', animationDelay: '100ms', animationFillMode: 'both' } : null]} />
      <Animated.View style={[{ transformOrigin: '50% 92%' }, anim ? { animationName: out, animationDuration: '900ms', animationDelay: '100ms', animationFillMode: 'both', animationTimingFunction: cubicBezier(0.3, 0.7, 0.4, 1) } : { transform: [{ rotate: '8deg' }] }]}>
        <Animated.View style={[{ transformOrigin: '50% 92%' }, anim && { animationName: hopKf, animationDuration: '1700ms', animationDelay: '1100ms', animationIterationCount: 'infinite', animationTimingFunction: 'ease-in-out' }]}>
          <Image source={require('@/assets/characters/c-upright-yellow.png')} style={styles.palloImg} contentFit="contain" />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

/** 상자 뒤 노란 빛 */
function Glow() {
  return (
    <Svg width={180} height={180} viewBox="0 0 180 180">
      <Defs>
        <RadialGradient id="cclGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={Colors.yellow} stopOpacity={1} />
          <Stop offset="0.36" stopColor={Colors.yellow} stopOpacity={0.9} />
          <Stop offset="0.6" stopColor={Colors.yellow} stopOpacity={0.35} />
          <Stop offset="1" stopColor={Colors.yellow} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={90} cy={90} r={90} fill="url(#cclGlow)" />
    </Svg>
  );
}

/** 열 때 반짝이 14개가 위로 터져요 (방향 · 거리는 앱을 켤 때 한 번 정해요) */
const SPARKS = Array.from({ length: 14 }, (_, i) => {
  const a = ((-160 + Math.random() * 140) * Math.PI) / 180;
  const d = 70 + Math.random() * 70;
  return {
    c: SPARK_COLORS[i % SPARK_COLORS.length],
    delay: Math.round(Math.random() * 80),
    kf: css.keyframes({
      '0%': { opacity: 1, transform: [{ translateX: 0 }, { translateY: 0 }, { rotate: '0deg' }] },
      '100%': { opacity: 0, transform: [{ translateX: Math.cos(a) * d }, { translateY: Math.sin(a) * d }, { rotate: '200deg' }] },
    }),
  };
});
function Sparks() {
  return (
    <View pointerEvents="none" style={styles.sparks}>
      {SPARKS.map((s, i) => (
        <Animated.View
          key={i}
          style={[styles.spark, { backgroundColor: s.c }, { animationName: s.kf, animationDuration: '700ms', animationDelay: `${s.delay}ms`, animationFillMode: 'both', animationTimingFunction: cubicBezier(0.2, 0.7, 0.4, 1) }]}
        />
      ))}
    </View>
  );
}

const bobKf = css.keyframes({
  '0%, 78%, 100%': { transform: [{ translateY: 0 }, { rotate: '0deg' }] },
  '84%': { transform: [{ translateY: -3 }, { rotate: '-3deg' }] },
  '90%': { transform: [{ translateY: -3 }, { rotate: '3deg' }] },
  '95%': { transform: [{ translateY: 0 }, { rotate: '0deg' }] },
});
const hopKf = css.keyframes({
  '0%, 55%, 100%': { transform: [{ translateY: 0 }, { scaleX: 1 }, { scaleY: 1 }, { rotate: '0deg' }] },
  '63%': { transform: [{ translateY: 0 }, { scaleX: 1.12 }, { scaleY: 0.88 }, { rotate: '0deg' }] },
  '76%': { transform: [{ translateY: -16 }, { scaleX: 0.94 }, { scaleY: 1.08 }, { rotate: '-21deg' }] },
  '88%': { transform: [{ translateY: 0 }, { scaleX: 1.08 }, { scaleY: 0.92 }, { rotate: '0deg' }] },
});
const shdIn = css.keyframes({
  '0%, 40%': { opacity: 0, transform: [{ scale: 0.4 }] },
  '66%': { opacity: 1, transform: [{ scale: 1.15 }] },
  '100%': { opacity: 1, transform: [{ scale: 1 }] },
});
const hintKf = css.keyframes({
  '0%, 100%': { transform: [{ translateY: 0 }] },
  '50%': { transform: [{ translateY: -4 }] },
});
const nudgeKf = css.keyframes({
  '0%, 8%, 26%, 100%': { transform: [{ translateX: 0 }, { translateY: 0 }] },
  '14%': { transform: [{ translateX: 2 }, { translateY: 2 }] },
  '20%': { transform: [{ translateX: -1 }, { translateY: -1 }] },
});
const arrowKf = css.keyframes({
  '0%, 8%, 30%, 100%': { transform: [{ translateX: 0 }] },
  '16%': { transform: [{ translateX: 4 }] },
  '24%': { transform: [{ translateX: -1 }] },
});

const bob = { animationName: bobKf, animationDuration: '2400ms', animationIterationCount: 'infinite' as const, animationTimingFunction: 'ease-in-out' as const };
const hintBob = { animationName: hintKf, animationDuration: '1000ms', animationIterationCount: 'infinite' as const, animationTimingFunction: 'ease-in-out' as const };

const slideCss = css.create({ t: { transitionProperty: 'transform', transitionDuration: '950ms', transitionDelay: '350ms', transitionTimingFunction: cubicBezier(0.45, 0, 0.15, 1) } }).t;
const glowCss = css.create({ t: { transitionProperty: ['opacity', 'transform'], transitionDuration: ['400ms', '500ms'] } }).t;
const xpCss = css.create({ t: { transitionProperty: ['transform', 'opacity'], transitionDuration: ['450ms', '200ms'], transitionDelay: '1050ms', transitionTimingFunction: cubicBezier(0.3, 1.6, 0.5, 1) } }).t;
const barShowCss = css.create({ t: { transitionProperty: 'opacity', transitionDuration: '200ms', transitionDelay: '1150ms' } }).t;
const barFillCss = css.create({ t: { transitionProperty: 'transform', transitionDuration: '1000ms', transitionDelay: '1300ms', transitionTimingFunction: cubicBezier(0.3, 0.8, 0.4, 1) } }).t;
const lvCss = css.create({ t: { transitionProperty: 'opacity', transitionDuration: '200ms', transitionDelay: '1200ms' } }).t;
const m0Css = css.create({ t: { transitionProperty: ['transform', 'opacity'], transitionDuration: ['400ms', '200ms'], transitionDelay: '1300ms', transitionTimingFunction: cubicBezier(0.3, 1.4, 0.5, 1) } }).t;
const m1Css = css.create({ t: { transitionProperty: ['transform', 'opacity'], transitionDuration: ['400ms', '200ms'], transitionDelay: '1380ms', transitionTimingFunction: cubicBezier(0.3, 1.4, 0.5, 1) } }).t;
const m2Css = css.create({ t: { transitionProperty: ['transform', 'opacity'], transitionDuration: ['400ms', '200ms'], transitionDelay: '1460ms', transitionTimingFunction: cubicBezier(0.3, 1.4, 0.5, 1) } }).t;
const slide = slideCss;
const barShow = barShowCss;
const barFill = barFillCss;
const glowEase = glowCss;
const xpEase = xpCss;
const lvShow = lvCss;
const miniEase = [m0Css, m1Css, m2Css];

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.cream, alignItems: 'center', paddingHorizontal: 20 },
  hidden: { opacity: 0 },
  kick: { zIndex: 3, backgroundColor: Colors.lavender, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  kickText: { fontFamily: Font.body900, fontSize: 12.5 },
  title: { zIndex: 3, marginTop: 20, fontFamily: Font.display, fontSize: 26, lineHeight: 30, letterSpacing: -0.6, textAlign: 'center' },
  stage: { flex: 1, alignSelf: 'stretch', alignItems: 'center', paddingTop: 46 },
  // 큰 상자가 아래의 (아직 안 보이는) XP 줄 위로 내려와 있어도 눌리게 맨 앞에
  slot: { zIndex: 2 },
  chestBox: { width: CHEST_W, height: CHEST_H, alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', left: CHEST_W / 2 - 90, top: CHEST_H * 0.44 - 90, width: 180, height: 180 },
  sparks: { position: 'absolute', left: CHEST_W / 2 - 5, top: CHEST_H * 0.44 - 5 },
  spark: { position: 'absolute', width: 10, height: 10, borderRadius: 2, borderWidth: 1.5, borderColor: Colors.ink },
  xpRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 6 },
  xp: { fontFamily: Font.display, fontSize: 64, lineHeight: 70, letterSpacing: -2.5, fontVariant: ['tabular-nums'] },
  xpUnit: { fontFamily: Font.display, fontSize: 22, letterSpacing: -0.5, marginLeft: 4 },
  bar: { width: 220, height: 14, marginTop: 12, borderWidth: 2, borderColor: Colors.ink, borderRadius: 8, backgroundColor: Colors.white, overflow: 'hidden' },
  barFill: { width: '100%', height: '100%', backgroundColor: Colors.purple, transformOrigin: 'left' },
  lv: { marginTop: 6, fontFamily: Font.body700, fontSize: 12 },
  minis: { flexDirection: 'row', gap: 8, marginTop: 20 },
  miniWrap: { width: 86 + 3, paddingRight: 3, paddingBottom: 3 },
  miniShadow: { position: 'absolute', left: 3, top: 3, right: 0, bottom: 0, borderRadius: 18, backgroundColor: Colors.ink },
  mini: { alignItems: 'center', gap: 5, paddingVertical: 10, paddingHorizontal: 4, borderWidth: 2, borderColor: Colors.ink, borderRadius: 18, backgroundColor: Colors.white },
  ic: { width: 36, height: 36, borderRadius: 11, borderWidth: 2, borderColor: Colors.ink, alignItems: 'center', justifyContent: 'center' },
  icText: { fontFamily: Font.display, fontSize: 13 },
  miniText: { fontFamily: Font.body900, fontSize: 12.5, lineHeight: 16, textAlign: 'center' },
  pallo: { position: 'absolute', left: '50%', marginLeft: 50, top: 52, width: 70 },
  palloImg: { width: 70, height: Math.round((70 * 306) / 480) },
  palloShadow: { position: 'absolute', left: '18%', right: '18%', bottom: -4, height: 9, borderRadius: 5, backgroundColor: 'rgba(30,26,43,0.18)' },
  hint: { position: 'absolute', alignSelf: 'center', backgroundColor: Colors.ink, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6 },
  hintText: { fontFamily: Font.body900, fontSize: 12.5 },
  foot: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: FOOT_PAD, paddingHorizontal: 20, gap: 10, backgroundColor: Colors.cream },
  btnWrap: { paddingRight: 4, paddingBottom: 4 },
  btnShadow: { position: 'absolute', left: 4, top: 4, right: 0, bottom: 0, borderRadius: 27, backgroundColor: Colors.ink },
  btn: { height: 54, borderRadius: 27, borderWidth: 2, borderColor: Colors.ink, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, overflow: 'hidden' },
  btnYellow: { backgroundColor: Colors.yellow },
  btnWhite: { backgroundColor: Colors.white },
  btnDown: { transform: [{ translateX: 4 }, { translateY: 4 }] },
  btnText: { fontFamily: Font.body900, fontSize: 15 },
  off: { opacity: 0.35 },
  shine: { position: 'absolute', top: -6, bottom: -6, left: 0, backgroundColor: 'rgba(255,255,255,0.85)' },
});
