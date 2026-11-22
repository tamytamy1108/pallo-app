import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { Pressable } from '@/components/ui/pressable';
import { ResetIcon } from '@/components/lesson/icons';
import { SpeakerButton } from '@/components/lesson/lesson-ui';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { sfx } from '@/lib/feedback';

/** 단어 카드 묶음: 정답 낱말 + 헷갈리는 낱말 n개를 섞은 카드 · 고른 순서 (프로토타입 makeWB) */
export type WordBankState = { toks: { w: string; id: number }[]; picked: number[] };

const shuffle = <T,>(a: T[]) => {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};

export function makeWordBank(sentence: string, pool: string[], n = 2): WordBankState {
  const words = sentence.trim().split(/\s+/);
  const lw = new Set(words.map((w) => w.toLowerCase()));
  const ds = shuffle([...new Set(pool.filter((w) => w && !lw.has(w.toLowerCase())))]).slice(0, n);
  return { toks: shuffle([...words, ...ds]).map((w, i) => ({ w, id: i })), picked: [] };
}
export const wordBankText = (wb: WordBankState) => wb.picked.map((id) => wb.toks[id].w).join(' ');

/**
 * 단어 카드로 문장 만들기 (프로토타입 mountWB · .st-wb): 누르면 위 줄에 쌓이고, 쌓인 카드를 누르면 빠져요. 오른쪽 아래 작은 '모두 지우기'.
 * onTap 을 주면 카드마다 바로 채점하는 방식(응대 대화) — 맞으면 true 를 돌려줘요. 그때는 빼기 · 모두 지우기가 없어요.
 */
export function WordBank({
  wb,
  onChange,
  onTap,
  hintId,
  shake,
  locked = false,
}: {
  wb: WordBankState;
  onChange: (wb: WordBankState) => void;
  onTap?: (id: number) => boolean;
  hintId?: number | null;
  /** 틀린 카드 흔들기: 숫자가 바뀔 때마다 */
  shake?: { id: number; n: number } | null;
  locked?: boolean;
}) {
  const strict = !!onTap;
  const pick = (id: number) => {
    if (locked) return;
    if (onTap && !onTap(id)) return;
    sfx('card');
    onChange({ ...wb, picked: [...wb.picked, id] });
  };
  return (
    <View>
      <View style={styles.line} accessibilityLiveRegion="polite">
        <View style={styles.rule} />
        {wb.picked.length ? (
          wb.picked.map((id) => (
            <Pressable
              key={id}
              disabled={strict || locked}
              onPress={() => onChange({ ...wb, picked: wb.picked.filter((x) => x !== id) })}
              accessibilityRole="button"
              accessibilityLabel={`${wb.toks[id].w} 빼기`}>
              <Chip w={wb.toks[id].w} state="in" />
            </Pressable>
          ))
        ) : (
          <PText style={styles.ph} color="#9A93A6">
            단어 카드를 순서대로 눌러 문장을 만들어요
          </PText>
        )}
      </View>
      <View style={styles.pool}>
        {wb.toks.map((tk) => {
          const used = wb.picked.includes(tk.id);
          if (used)
            return (
              <View key={tk.id} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                <Chip w={tk.w} state="used" />
              </View>
            );
          return (
            <Pressable key={tk.id} onPress={() => pick(tk.id)} accessibilityRole="button" accessibilityLabel={tk.w} hitSlop={3}>
              {({ pressed }) => <Chip w={tk.w} state={tk.id === hintId ? 'hint' : 'pool'} pressed={pressed} shake={shake?.id === tk.id ? shake.n : 0} />}
            </Pressable>
          );
        })}
      </View>
      {!strict && (
        <Pressable
          onPress={() => onChange({ ...wb, picked: [] })}
          disabled={!wb.picked.length || locked}
          style={StyleSheet.flatten([styles.clear, !wb.picked.length && styles.hidden])}
          accessibilityRole="button"
          accessibilityLabel="모두 지우기"
          hitSlop={8}>
          <ResetIcon />
          <PText style={styles.clearText} color={Colors.inkSub}>
            모두 지우기
          </PText>
        </Pressable>
      )}
    </View>
  );
}

/** 작은 단어 카드 (.st-wc2) */
export function Chip({ w, state = 'pool', pressed = false, shake = 0, tone }: { w: string; state?: 'pool' | 'in' | 'hint' | 'used'; pressed?: boolean; shake?: number; tone?: 'pink' | 'purple' }) {
  const still = useReducedMotion();
  const x = useSharedValue(0);
  const bob = useSharedValue(0);
  useEffect(() => {
    if (!shake) return;
    x.set(withSequence(withTiming(-6, { duration: 70 }), withTiming(6, { duration: 90 }), withTiming(-4, { duration: 80 }), withTiming(0, { duration: 70 })));
  }, [shake, x]);
  // 3번 틀리면 맞는 카드가 노랗게 통통 (shHint 1.1초)
  useEffect(() => {
    if (state !== 'hint' || still) {
      cancelAnimation(bob);
      bob.set(0);
      return;
    }
    bob.set(withRepeat(withTiming(1, { duration: 550, easing: Easing.inOut(Easing.ease) }), -1, true));
    return () => cancelAnimation(bob);
  }, [state, still, bob]);
  const a = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }, { translateY: -3 * bob.get() }] }));
  const wrong = shake > 0;
  return (
    <Animated.View style={a}>
      <View
        style={StyleSheet.flatten([
          styles.chip,
          (state === 'in' || state === 'hint') && styles.chipIn,
          tone === 'pink' && styles.chipPink,
          tone === 'purple' && styles.chipPurple,
          (pressed || state === 'in') && styles.chipDown,
          wrong && styles.chipWrong,
          state === 'used' && styles.used,
        ])}>
        <PText style={styles.chipText} color={state === 'used' ? 'transparent' : wrong ? '#A3243C' : tone === 'purple' ? Colors.white : Colors.ink}>
          {w}
        </PText>
        {wrong && (
          <View style={styles.badge}>
            <Svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke={Colors.white} strokeWidth={3.6} strokeLinecap="round">
              <Path d="M7 7l10 10M17 7 7 17" />
            </Svg>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

/**
 * 두 번 틀리면: 정답 문장이 단어 카드로 하나씩 날아와 맞춰지고 다 맞춰지면 읽어 줘요 (프로토타입 ansCardsHTML · ansCardsSay).
 * 카드 색은 노랑 · 분홍 · 보라 차례.
 */
export function AnswerCards({ sentence, label = '정답 · 카드로 맞춰 볼게요', soundOff, onSay }: { sentence: string; label?: string; soundOff: boolean; onSay: () => void }) {
  const ws = sentence.trim().split(/\s+/).filter(Boolean);
  return (
    <View style={styles.ans} accessibilityRole="summary" accessibilityLabel={`정답 ${sentence}`}>
      <PText style={styles.ansLabel} color={Colors.inkSub}>
        {label}
      </PText>
      <View style={styles.ansLine}>
        {ws.map((w, i) => (
          <Fly key={i} delay={i * 110}>
            <Chip w={w} state="in" tone={i % 3 === 1 ? 'pink' : i % 3 === 2 ? 'purple' : undefined} />
          </Fly>
        ))}
      </View>
      {!soundOff && (
        <View style={styles.ansSpk}>
          <SpeakerButton onPress={onSay} label="정답 듣기" />
        </View>
      )}
    </View>
  );
}

function Fly({ delay, children }: { delay: number; children: React.ReactNode }) {
  const still = useReducedMotion();
  const p = useSharedValue(still ? 1 : 0);
  useEffect(() => {
    if (!still) p.set(withDelay(delay, withTiming(1, { duration: 420, easing: Easing.bezier(0.16, 1, 0.3, 1) })));
  }, [delay, still, p]);
  const a = useAnimatedStyle(() => {
    const v = p.get();
    return { opacity: v, transform: [{ translateY: (1 - v) * 28 }, { rotate: `${(1 - v) * -8}deg` }, { scale: 0.9 + 0.1 * v }] };
  });
  return <Animated.View style={a}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  line: { minHeight: 46, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, paddingTop: 5, paddingBottom: 8, borderBottomWidth: 3, borderColor: Colors.ink },
  rule: { position: 'absolute', left: 0, right: 0, top: 41, height: 1.5, backgroundColor: Colors.line },
  ph: { fontFamily: Font.body700, fontSize: 13, lineHeight: 34 },
  pool: { marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, rowGap: 8 },
  chip: { height: 36, paddingHorizontal: 11, borderRadius: 10, borderWidth: 2, borderColor: Colors.ink, borderBottomWidth: 5, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  chipIn: { backgroundColor: Colors.yellow },
  chipPink: { backgroundColor: '#F2B8C6' },
  chipPurple: { backgroundColor: Colors.purple },
  chipDown: { borderBottomWidth: 2, marginTop: 3 },
  chipWrong: { backgroundColor: '#FBE1E8', borderStyle: 'dashed', borderColor: '#C2416B', borderBottomWidth: 2, marginTop: 3 },
  used: { backgroundColor: '#EFE8D8', borderColor: '#DCD3C1', borderBottomWidth: 2, marginTop: 3 },
  chipText: { fontFamily: Font.body800, fontSize: 14, lineHeight: 19 },
  badge: { position: 'absolute', top: -9, right: -9, width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.white, backgroundColor: '#C2416B', alignItems: 'center', justifyContent: 'center' },
  clear: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', gap: 5, height: 26, marginTop: 6, paddingHorizontal: 2 },
  hidden: { opacity: 0 },
  clearText: { fontFamily: Font.body800, fontSize: 13, lineHeight: 18 },
  ans: { paddingTop: 12, paddingHorizontal: 14, paddingBottom: 14, borderWidth: 2, borderColor: Colors.ink, borderRadius: 18, backgroundColor: '#F1ECFB', boxShadow: '3px 3px 0 #1E1A2B', gap: 8 },
  ansLabel: { paddingRight: 40, fontFamily: Font.body800, fontSize: 11.5, lineHeight: 16 },
  ansLine: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, rowGap: 8 },
  ansSpk: { position: 'absolute', top: 8, right: 8 },
});
