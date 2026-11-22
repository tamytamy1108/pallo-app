import { Image } from 'expo-image';
import { useEffect, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';

import { BookmarkIcon, BulbIcon, CardsIcon, KeyboardIcon, MicIcon, MicOffIcon, SpeakerIcon } from '@/components/lesson/icons';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { haptic, sfx } from '@/lib/feedback';

/**
 * 레슨 화면 공용 부품 — 프로토타입 #lesson · #study 의 버튼 · 탭 · 말풍선 모양을 한곳에.
 * 버튼은 모두 둥근 알약(54px) + 아래 잉크 그림자, 눌리면 내려앉아요 (.ls-foot .btn · .ls-skip · .st-bigmic).
 */
export const L = {
  wrong: '#C2416B',
  wrongBg: '#FBE1E8',
  okGreen: '#2E9E5B',
  okBg: '#DDF3E2',
  noRed: '#D83A56',
  noBg: '#FBD5DC',
  speakerBg: '#BFE4EC',
  muted: '#B9B2A3',
  disabledBg: '#EEE8DA',
  disabledInk: '#8C8597',
  dash: '#D9D1BF',
  tabBg: '#EFE9DC',
} as const;

/** 인물 얼굴 (교재 인물 그림) · 이름표 색 — 프로토타입 PPL */
export const PPL: Record<string, { img: number; color: string }> = {
  Lily: { img: require('@/assets/images/lesson/ppl/lily.jpg'), color: '#3B3550' },
  Sonya: { img: require('@/assets/images/lesson/ppl/sonya.jpg'), color: '#C9566E' },
  Logan: { img: require('@/assets/images/lesson/ppl/logan.jpg'), color: '#2F4E8C' },
  Aiden: { img: require('@/assets/images/lesson/ppl/aiden.jpg'), color: '#3F6B3A' },
};
export const pplColor = (n: string) => PPL[n]?.color ?? Colors.ink;

export function Avatar({ name, size }: { name: string; size: number }) {
  const p = PPL[name];
  if (!p)
    return (
      <View style={StyleSheet.flatten([styles.avFallback, { width: size, height: size, borderRadius: size / 2 }])}>
        <PText style={styles.avFallbackText} color={Colors.white}>
          {name[0]}
        </PText>
      </View>
    );
  return <Image source={p.img} style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white }} contentFit="cover" contentPosition={{ top: '12%' }} accessibilityIgnoresInvertColors />;
}

type BtnProps = { label: string; onPress: () => void; disabled?: boolean; style?: StyleProp<ViewStyle>; children?: ReactNode; accessibilityLabel?: string };

/** 노랑 큰 버튼 (확인 · 다음 · 계속하기) */
export function YellowButton({ label, onPress, disabled = false, style, children, accessibilityLabel }: BtnProps) {
  return (
    <Pressable
      onPress={() => {
        sfx('big');
        haptic('tap');
        onPress();
      }}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      style={style}>
      {({ pressed }) => (
        <View style={StyleSheet.flatten([styles.big, { backgroundColor: disabled ? L.disabledBg : Colors.yellow }, disabled && styles.bigDisabled, pressed && !disabled && styles.bigDown])}>
          <PText style={styles.bigText} color={disabled ? L.disabledInk : Colors.ink}>
            {label}
          </PText>
          {children}
        </View>
      )}
    </Pressable>
  );
}

/** 흰 테두리 버튼 (그만하기 · 한 번 더 · 정답 확인하기 · 넘어가기) */
export function GhostButton({ label, onPress, disabled = false, style, children }: BtnProps) {
  return (
    <Pressable
      onPress={() => {
        sfx('tap');
        onPress();
      }}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={style}>
      {({ pressed }) => (
        <View style={StyleSheet.flatten([styles.big, styles.ghost, disabled && styles.bigDisabled, pressed && !disabled && styles.bigDown])}>
          {children}
          <PText style={styles.ghostText} color={disabled ? L.disabledInk : Colors.ink}>
            {label}
          </PText>
        </View>
      )}
    </Pressable>
  );
}

/** 말하기 버튼: 보라 → 듣는 중엔 분홍 + 소리 막대 */
export function MicButton({ listening, label, disabled = false, onPress }: { listening: boolean; label: string; disabled?: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={() => {
        haptic('tap');
        onPress();
      }}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={listening ? '듣는 중, 누르면 멈춰요' : label}
      accessibilityState={{ disabled }}>
      {({ pressed }) => (
        <View style={StyleSheet.flatten([styles.big, styles.mic, { backgroundColor: disabled ? L.muted : listening ? Colors.rosePink : Colors.purple }, (pressed || listening) && styles.bigDown])}>
          <MicIcon size={22} color={Colors.white} />
          <PText style={styles.bigText} color={Colors.white}>
            {listening ? '듣는 중' : label}
          </PText>
          {listening && <Wave />}
        </View>
      )}
    </Pressable>
  );
}

function Wave() {
  return (
    <View style={styles.wave}>
      {[0, 1, 2, 3, 4].map((k) => (
        <WaveBar key={k} delay={k * 120} />
      ))}
    </View>
  );
}

function WaveBar({ delay }: { delay: number }) {
  // 움직임 줄이기면 막대가 가만히 있어요 (프로토타입 .wv i { animation: none })
  const still = useReducedMotion();
  const h = useSharedValue(still ? 12 : 6);
  useEffect(() => {
    if (still) {
      h.set(12);
      return;
    }
    h.set(withDelay(delay, withRepeat(withTiming(20, { duration: 350 }), -1, true)));
    return () => cancelAnimation(h);
  }, [h, delay, still]);
  const s = useAnimatedStyle(() => ({ height: h.get() }));
  return <Animated.View style={[styles.waveBar, s]} />;
}

export type AnswerMode = 'card' | 'voice' | 'write';

/** 답하는 방식 탭 (단어 카드 · 말하기 · 쓰기) — 프로토타입 modeTabs · .ft-tabs */
export function ModeTabs<K extends string>({ tabs, value, onChange, disabled = false }: { tabs: [K, string][]; value: K; onChange: (k: K) => void; disabled?: boolean }) {
  return (
    <View style={StyleSheet.flatten([styles.tabs, disabled && styles.tabsOff])} accessibilityRole="tablist" pointerEvents={disabled ? 'none' : 'auto'}>
      {tabs.map(([k, label]) => {
        const on = k === value;
        const c = on ? Colors.ink : Colors.inkSub;
        return (
          <Pressable
            key={k}
            onPress={() => {
              sfx('tab');
              onChange(k);
            }}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected: on }}
            style={StyleSheet.flatten([styles.tab, on && styles.tabOn])}>
            {k === 'card' ? <CardsIcon size={17} color={c} /> : k === 'write' ? <KeyboardIcon size={17} color={c} /> : <MicIcon size={17} color={c} />}
            <PText style={styles.tabText} color={c}>
              {label}
            </PText>
          </Pressable>
        );
      })}
    </View>
  );
}

/** 전구 (힌트 · 예시) — on 이면 노랑, n 이 있으면 단계 숫자 배지 */
export function BulbButton({ on, n, onPress, disabled = false, label = '힌트' }: { on: boolean; n?: number; onPress: () => void; disabled?: boolean; label?: string }) {
  return (
    <Pressable
      onPress={() => {
        sfx(on ? 'tap' : 'toggle');
        onPress();
      }}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: on, disabled }}
      hitSlop={4}>
      {({ pressed }) => (
        <View style={StyleSheet.flatten([styles.bulb, on && styles.bulbOn, disabled && styles.bulbOff, pressed && styles.roundDown])}>
          <BulbIcon size={22} />
          {n ? (
            <View style={styles.bulbBadge}>
              <PText style={styles.bulbBadgeText} color={Colors.white}>
                {n}
              </PText>
            </View>
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

/** 동그란 듣기 버튼 (.ls-spk) — 소리 끄기면 부르는 쪽에서 빼요 */
export function SpeakerButton({ onPress, size = 32, tone = 'white', label = '듣기' }: { onPress: () => void; size?: number; tone?: 'white' | 'sky'; label?: string }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={6}>
      {({ pressed }) => (
        <View style={StyleSheet.flatten([styles.round, { width: size, height: size, borderRadius: size / 2, backgroundColor: tone === 'sky' ? L.speakerBg : Colors.white }, pressed && styles.roundDown])}>
          <SpeakerIcon size={Math.round(size * 0.5)} />
        </View>
      )}
    </Pressable>
  );
}

/** 표현 저장 (책갈피) */
export function SaveButton({ saved, onPress, size = 32 }: { saved: boolean; onPress: () => void; size?: number }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={saved ? '표현함에서 빼기' : '표현 저장'} accessibilityState={{ selected: saved }} hitSlop={6}>
      {({ pressed }) => (
        <View style={StyleSheet.flatten([styles.round, { width: size, height: size, borderRadius: size / 2 }, saved && styles.saved, pressed && styles.roundDown])}>
          <BookmarkIcon size={Math.round(size * 0.45)} filled={saved} />
        </View>
      )}
    </Pressable>
  );
}

/** 말하기가 어려워요 (말하기 문제에서만) — 프로토타입 .ns-row .ns-tg */
export function NoSpeakToggle({ on, onPress }: { on: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="switch" accessibilityLabel="말하기가 어려워요" accessibilityState={{ checked: on }} style={StyleSheet.flatten([styles.ns, on && styles.nsOn])}>
      <MicOffIcon size={16} color={on ? Colors.white : 'rgba(30,26,43,0.62)'} />
      <PText style={styles.nsText} color={on ? Colors.white : 'rgba(30,26,43,0.62)'}>
        말하기가 어려워요
      </PText>
    </Pressable>
  );
}

/** 아래에서 살짝 떠오르며 나타나요 (프로토타입 lsFbIn .34s · 피드백 글씨 · 버튼이 차례로) */
const FB_EASE = Easing.bezier(0.2, 0.8, 0.3, 1);
export function FadeUp({ delay = 0, rotate = 0, style, children }: { delay?: number; /** 기울인 칸이면 각도(deg) — style 의 transform 은 움직임이 덮어써서 여기로 받아요 */ rotate?: number; style?: StyleProp<ViewStyle>; children: ReactNode }) {
  const still = useReducedMotion();
  const p = useSharedValue(still ? 1 : 0);
  useEffect(() => {
    if (!still) p.set(withDelay(delay, withTiming(1, { duration: 340, easing: FB_EASE })));
  }, [delay, still, p]);
  const a = useAnimatedStyle(() => ({ opacity: p.get(), transform: [{ translateY: (1 - p.get()) * 10 }, { rotate: `${rotate}deg` }] }));
  return <Animated.View style={[style, a]}>{children}</Animated.View>;
}

/** 작은 회색 안내 (위 '대화문 · ① 순서 맞추기') */
export function Kicker({ text }: { text: string }) {
  return (
    <PText style={styles.kicker} color={Colors.inkSub}>
      {text}
    </PText>
  );
}

/** 가운데 회색 한 줄 (.tk-msg) */
export function TaskMsg({ children, color = Colors.inkSub }: { children: ReactNode; color?: string }) {
  return (
    <PText style={styles.msg} color={color}>
      {children}
    </PText>
  );
}

const styles = StyleSheet.create({
  big: {
    height: 56,
    borderRadius: 28,
    borderWidth: 2.5,
    borderColor: Colors.ink,
    borderBottomWidth: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
  },
  bigDown: { borderBottomWidth: 2.5, marginTop: 3.5 },
  bigDisabled: { borderColor: L.muted, borderBottomColor: Colors.ink },
  bigText: { fontFamily: Font.body900, fontSize: 17, lineHeight: 22 },
  ghost: { backgroundColor: Colors.white, paddingHorizontal: 20 },
  ghostText: { fontFamily: Font.body900, fontSize: 15, lineHeight: 20 },
  mic: { gap: 10 },
  wave: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 22 },
  waveBar: { width: 3, borderRadius: 2, backgroundColor: Colors.white },
  tabs: { flexDirection: 'row', gap: 6, padding: 4, borderRadius: 16, backgroundColor: L.tabBg },
  tabsOff: { opacity: 0.4 },
  tab: { flex: 1, height: 40, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  tabOn: { backgroundColor: Colors.white, borderBottomWidth: 2, borderColor: '#D8CFBE' },
  tabText: { fontFamily: Font.body900, fontSize: 13.5, lineHeight: 18 },
  bulb: { width: 46, height: 46, borderRadius: 23, borderWidth: 2, borderColor: Colors.ink, borderBottomWidth: 5, backgroundColor: '#FFF6BF', alignItems: 'center', justifyContent: 'center' },
  bulbOn: { backgroundColor: Colors.yellow },
  bulbOff: { opacity: 0.55 },
  bulbBadge: { position: 'absolute', top: -9, right: -12, minWidth: 26, height: 20, paddingHorizontal: 6, borderRadius: 10, backgroundColor: '#8C8597', alignItems: 'center', justifyContent: 'center' },
  bulbBadgeText: { fontFamily: Font.display, fontSize: 11, lineHeight: 14 },
  round: { borderWidth: 2, borderColor: Colors.ink, borderBottomWidth: 4, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  roundDown: { borderBottomWidth: 2, marginTop: 2 },
  saved: { backgroundColor: Colors.yellow },
  ns: { height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.42)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  nsOn: { backgroundColor: 'rgba(208,121,142,0.85)' },
  nsText: { fontFamily: Font.body800, fontSize: 12.5, lineHeight: 17 },
  kicker: { fontFamily: Font.body800, fontSize: 12, lineHeight: 17 },
  msg: { textAlign: 'center', fontFamily: Font.body800, fontSize: 13, lineHeight: 20 },
  avFallback: { borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.sky, alignItems: 'center', justifyContent: 'center' },
  avFallbackText: { fontFamily: Font.body900, fontSize: 16, lineHeight: 20 },
});
