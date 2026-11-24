import { useIsFocused } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { css, cubicBezier, Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import { Pressable } from '@/components/ui/pressable';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { haptic, sfx } from '@/lib/feedback';
import { EASE, SPRING } from '@/lib/motion';

import { CHECK_PATH, CLOSE_PATH, LineIcon } from './icons';

const LOCK_PATH = 'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3M12 14.5v2.5';

/**
 * 순서 (ms) — 한 박자씩 눈으로 따라갈 수 있게 띄엄띄엄 (자물쇠 등장부터 반짝이까지 약 2.8초):
 * 배너가 먼저 내려앉고 → 자물쇠 톡 → 덜컹덜컹 → 풀리며 체크 → 카드가 뒤집혀 원래 카드 + 반짝이 → 말풍선 (누를 때까지)
 */
const AT = { lock: 800, shake: 1450, check: 2250, flip: 3000, swap: 3300, bubble: 3900 };

/**
 * 연동되는 순간 홈 출석 카드 (09-onboarding · 잠긴 출석 카드 → 원래 카드).
 * 잠긴 라벤더 카드(front) 위에 자물쇠가 톡 → 덜컹거리다 체크로 바뀌고, 카드가 휙 뒤집히며 원래 카드(children)가 나와요.
 * 반짝이가 터지고 위에 말풍선 '○○점 회원이 됐어요!'가 떠요 — 눌러야 닫혀요. 홈이 보일 때만 시작하고(다른 탭이면 돌아왔을 때), 한 번만.
 * 움직임 줄이기면 뒤집기 · 흔들기 · 반짝이 없이 바로 바꾸고 말풍선만 보여요.
 * play 가 꺼진 뒤에도 children 은 같은 자리에 그대로 있어서 원래 카드가 다시 그려지지 않아요.
 */
export function UnlockStage({ play, branch, front, onDone, children }: { play: boolean; branch: string; front: ReactNode; onDone: () => void; children: ReactNode }) {
  const focused = useIsFocused();
  const still = useReducedMotion();
  // 뒤집기가 끝났는지 (play 가 새로 켜지면 처음부터)
  const [swapped, setSwapped] = useState(false);
  const [badge, setBadge] = useState(false);
  const [bubble, setBubble] = useState<'in' | 'out' | null>(null);
  const [prevPlay, setPrevPlay] = useState(play);
  if (play !== prevPlay) {
    setPrevPlay(play);
    if (play) setSwapped(false);
  }
  // 효과 안에서 '이미 뒤집혔나'를 보는 용 (swapped 를 deps 에 넣으면 뒤집는 순간 순서가 처음부터 다시 돌아요)
  const swappedRef = useRef(false);

  const pop = useSharedValue(0);
  const shake = useSharedValue(0);
  const check = useSharedValue(0);
  const rot = useSharedValue(0);

  useEffect(() => {
    if (!play) {
      swappedRef.current = false;
      return;
    }
    if (!focused) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));

    // 다른 탭에 갔다가 돌아왔는데 이미 뒤집혔으면 말풍선만
    if (swappedRef.current || still) {
      if (!swappedRef.current) {
        swappedRef.current = true;
        setSwapped(true);
        sfx('fanfare');
        haptic('success');
      }
      at(still ? 300 : 0, () => setBubble('in'));
      return () => timers.forEach(clearTimeout);
    }

    pop.set(0);
    shake.set(0);
    check.set(0);
    rot.set(0);
    at(AT.lock, () => {
      setBadge(true);
      pop.set(withTiming(1, { duration: 480, easing: SPRING }));
    });
    // 덜컹덜컹: 잠긴 걸 흔들어 보는 느낌 (좌우 두 번)
    at(AT.shake, () => {
      sfx('card');
      const t = { duration: 90, easing: Easing.inOut(Easing.quad) };
      shake.set(withSequence(withTiming(-12, t), withTiming(12, t), withTiming(-10, t), withTiming(10, t), withTiming(-5, t), withTiming(0, t)));
    });
    at(AT.check, () => {
      check.set(withTiming(1, { duration: 380, easing: EASE }));
      sfx('save');
      haptic('success');
    });
    at(AT.flip, () => {
      rot.set(withTiming(90, { duration: AT.swap - AT.flip, easing: Easing.in(Easing.quad) }));
      pop.set(withTiming(0, { duration: 220 }));
    });
    at(AT.swap, () => {
      setBadge(false);
      swappedRef.current = true;
      setSwapped(true);
      sfx('fanfare');
      rot.set(-90);
      rot.set(withTiming(0, { duration: 560, easing: SPRING }));
    });
    at(AT.bubble, () => setBubble('in'));
    return () => timers.forEach(clearTimeout);
  }, [play, focused, still, pop, shake, check, rot]);

  // 말풍선을 누르면 살짝 올라가며 사라지고 끝
  const closeBubble = () => {
    sfx('soft');
    setBubble('out');
    setTimeout(() => {
      setBubble(null);
      onDone();
    }, still ? 0 : 300);
  };

  const flip = useAnimatedStyle(() => ({ transform: [{ perspective: 1000 }, { rotateY: `${rot.get()}deg` }] }));
  const badgeStyle = useAnimatedStyle(() => ({
    opacity: Math.min(pop.get() * 1.5, 1),
    transform: [{ scale: 0.4 + 0.6 * pop.get() + 0.12 * Math.sin(check.get() * Math.PI) }, { rotate: `${shake.get()}deg` }],
  }));
  const lockStyle = useAnimatedStyle(() => ({ opacity: 1 - check.get(), transform: [{ translateY: -4 * check.get() }] }));
  const checkStyle = useAnimatedStyle(() => ({ opacity: check.get(), transform: [{ scale: 0.6 + 0.4 * check.get() }] }));
  const badgeBg = useAnimatedStyle(() => ({ backgroundColor: check.get() > 0.5 ? Colors.yellow : Colors.white }));

  const showFront = play && !swapped;
  return (
    <View>
      <Animated.View style={flip}>{showFront ? front : children}</Animated.View>
      {play && badge && (
        <View pointerEvents="none" style={styles.center}>
          <Animated.View style={[styles.badge, badgeBg, badgeStyle]}>
            <Animated.View style={[styles.glyph, lockStyle]}>
              <LineIcon d={LOCK_PATH} size={30} width={2.4} />
            </Animated.View>
            <Animated.View style={[styles.glyph, checkStyle]}>
              <LineIcon d={CHECK_PATH} size={32} width={3} />
            </Animated.View>
          </Animated.View>
        </View>
      )}
      {play && swapped && !still && <Burst />}
      {play && bubble && <Bubble branch={branch} leaving={bubble === 'out'} still={still} onClose={closeBubble} />}
    </View>
  );
}

/* ───────── 반짝이 (한 번 터지고 사라져요) ───────── */

const SPARK_COLORS = [Colors.yellow, Colors.rosePink, Colors.sky, Colors.purple, Colors.yellow, Colors.lavender];
const PARTICLES = Array.from({ length: 16 }, (_, i) => {
  const a = (i / 16) * Math.PI * 2 + (i % 2 ? 0.18 : -0.1);
  const r = 96 + (i % 3) * 34;
  const dx = Math.cos(a) * r * 1.35;
  const dy = Math.sin(a) * r * 0.8;
  return {
    color: SPARK_COLORS[i % SPARK_COLORS.length],
    size: 8 + (i % 3) * 3,
    round: i % 3 !== 0,
    delay: (i % 4) * 30,
    anim: css.keyframes({
      '0%': { opacity: 0, transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 0.3 }, { rotate: '0deg' }] },
      '15%': { opacity: 1 },
      '70%': { opacity: 1 },
      '100%': { opacity: 0, transform: [{ translateX: dx }, { translateY: dy + 26 }, { scale: 1 }, { rotate: `${i % 2 ? 160 : -140}deg` }] },
    }),
  };
});

function Burst() {
  return (
    <View pointerEvents="none" style={styles.center}>
      {PARTICLES.map((p, i) => (
        <Animated.View
          key={i}
          style={[
            styles.spark,
            { width: p.size, height: p.size, borderRadius: p.round ? p.size / 2 : 2, backgroundColor: p.color, opacity: 0 },
            { animationName: p.anim, animationDuration: '900ms', animationDelay: `${p.delay}ms`, animationTimingFunction: 'ease-out', animationFillMode: 'forwards' },
          ]}
        />
      ))}
    </View>
  );
}

/* ───────── 말풍선 (토스트 모양 · 카드 위에) ───────── */

// --spring 과 같은 곡선 (CSS 애니메이션용)
const SPRING_CSS = cubicBezier(0.2, 0.9, 0.3, 1.3);

const bubbleIn = css.keyframes({
  '0%': { opacity: 0, transform: [{ translateY: 10 }, { scale: 0.85 }], animationTimingFunction: SPRING_CSS },
  '100%': { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }] },
});
const bubbleOut = css.keyframes({
  '0%': { opacity: 1, transform: [{ translateY: 0 }] },
  '100%': { opacity: 0, transform: [{ translateY: -8 }] },
});

function Bubble({ branch, leaving, still, onClose }: { branch: string; leaving: boolean; still: boolean; onClose: () => void }) {
  const motion = still
    ? {}
    : leaving
      ? { animationName: bubbleOut, animationDuration: '280ms', animationFillMode: 'forwards' as const, animationTimingFunction: 'ease-in' as const }
      : { animationName: bubbleIn, animationDuration: '520ms', animationFillMode: 'both' as const };
  return (
    <View pointerEvents="box-none" style={styles.bubbleWrap}>
      <Animated.View style={[styles.bubbleBox, motion]}>
        <Pressable
          onPress={onClose}
          disabled={leaving}
          sound={false}
          accessibilityRole="button"
          accessibilityLiveRegion="polite"
          accessibilityLabel={`${branch} 회원이 됐어요! 이제 출석체크할 수 있어요`}
          accessibilityHint="눌러서 닫아요"
          style={styles.bubbleBox}>
          {({ pressed }) => (
            <>
              <View style={styles.bubbleShadow} />
              <View style={[styles.bubble, pressed && styles.bubblePressed]}>
                <View style={styles.bubbleHead}>
                  <PText style={styles.bubbleTitle} color={Colors.yellow}>
                    {branch} 회원이 됐어요!
                  </PText>
                  <LineIcon d={CLOSE_PATH} size={14} width={2.6} color={Colors.white} />
                </View>
                <PText style={styles.bubbleText} color={Colors.white}>
                  이제 출석체크할 수 있어요
                </PText>
              </View>
              <View style={styles.tail} />
            </>
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { position: 'absolute', left: 0, right: 0, top: 35, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  badge: { width: 72, height: 72, borderRadius: 36, borderWidth: 2.5, borderColor: Colors.ink, alignItems: 'center', justifyContent: 'center', boxShadow: '3px 3px 0 #1E1A2B' },
  glyph: { position: 'absolute' },
  spark: { position: 'absolute', borderWidth: 1.5, borderColor: Colors.ink },
  bubbleWrap: { position: 'absolute', left: 0, right: 0, top: -8, alignItems: 'center' },
  bubbleBox: { alignItems: 'center' },
  bubbleShadow: { position: 'absolute', top: 4, left: 4, right: -4, bottom: 10, borderRadius: 18, backgroundColor: Colors.yellow },
  bubblePressed: { transform: [{ translateX: 2 }, { translateY: 2 }] },
  bubbleHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bubble: { paddingVertical: 9, paddingHorizontal: 18, borderRadius: 18, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.ink, alignItems: 'center' },
  bubbleTitle: { fontFamily: Font.body900, fontSize: 15, lineHeight: 21 },
  bubbleText: { fontFamily: Font.body800, fontSize: 13, lineHeight: 18 },
  tail: { width: 14, height: 14, marginTop: -8, backgroundColor: Colors.ink, transform: [{ rotate: '45deg' }] },
});
