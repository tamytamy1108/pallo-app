import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Tts from 'expo-speech';
import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { offerChallenge } from '@/lib/chal-offer';
import { Pressable } from '@/components/ui/pressable';
import { Appear } from '@/components/ui/appear';
import { StudyButton } from '@/components/ui/study-button';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { haptic, sfx } from '@/lib/feedback';
import { useLearnPrefs } from '@/state/learn-prefs';
import { toggleExpression, useIsSaved } from '@/state/expressions';
import { LayerModal } from '@/components/ui/sheet-stack';

import { Check, Mark, Spk, XMark } from './icons';

/* 상황 장면 화면들이 같이 쓰는 작은 부품 (프로토타입 #study 의 .st-* · .ls-fb 모양) */

export const PINK_INK = '#C2416B'; // 오답 글자 (프로토타입 #C2416B)
export const SUB = Colors.inkSub;

/* ---------- 듣기 (프로토타입 sayEn · CAST_VOICE: 사람마다 높낮이 · 빠르기) ---------- */
const VOICE: Record<string, { pitch: number; rate: number }> = {
  Lily: { pitch: 1.18, rate: 1.0 },
  Sonya: { pitch: 0.98, rate: 0.95 },
  Aiden: { pitch: 1.06, rate: 1.0 },
  Logan: { pitch: 0.82, rate: 0.93 },
};

/** 영어로 읽어 주기. 소리 끄기면 읽지 않아요 (onEnd 는 불러요) */
export function useSay() {
  const { noListen } = useLearnPrefs();
  return (text: string, rate = 0.95, who?: string, onEnd?: () => void) => {
    if (noListen) {
      if (onEnd) setTimeout(onEnd, 300);
      return;
    }
    const v = who ? VOICE[who] : undefined;
    void Tts.stop();
    Tts.speak(text.replace(/[’‘]/g, "'"), { language: 'en-US', rate: rate * (v?.rate ?? 1), pitch: v?.pitch, onDone: onEnd, onError: onEnd ? () => onEnd() : undefined });
  };
}

/* ---------- 아래로만 지는 잉크 그림자 (box-shadow: 0 Npx 0 ink) — 자리를 차지하지 않아요 (CSS 처럼) ---------- */
export function Drop({
  dy = 4,
  dx = 0,
  radius,
  shadow = Colors.ink,
  style,
  children,
}: {
  dy?: number;
  dx?: number;
  radius: number;
  shadow?: string;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  return (
    <View style={style}>
      {dy || dx ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, { top: dy, left: dx, right: -dx, bottom: -dy, borderRadius: radius, backgroundColor: shadow }]} /> : null}
      {children}
    </View>
  );
}

/** 누르면 그림자 자리로 내려앉는 판 (프로토타입 .press / :active translateY) */
export function PressDrop({
  onPress,
  dy = 4,
  dx = 0,
  radius,
  disabled,
  style,
  inner,
  children,
  accessibilityLabel,
  accessibilityRole = 'button',
  accessibilityState,
  hitSlop,
}: {
  onPress?: () => void;
  dy?: number;
  dx?: number;
  radius: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  inner: StyleProp<ViewStyle>;
  children: ReactNode;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'radio' | 'tab';
  accessibilityState?: { selected?: boolean; checked?: boolean; disabled?: boolean };
  hitSlop?: number;
}) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={style} accessibilityRole={accessibilityRole} accessibilityLabel={accessibilityLabel} accessibilityState={accessibilityState} hitSlop={hitSlop}>
      {({ pressed }) => (
        <View>
          {!pressed && (dy || dx) ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, { top: dy, left: dx, right: -dx, bottom: -dy, borderRadius: radius, backgroundColor: Colors.ink }]} /> : null}
          <View style={[inner, pressed && { transform: [{ translateX: dx }, { translateY: dy }] }]}>{children}</View>
        </View>
      )}
    </Pressable>
  );
}

/* ---------- 작은 위 글씨 (.st-kick2) ---------- */
export const Kick = ({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) => (
  <View style={style}>
    <PText style={styles.kick} color={SUB}>
      {children}
    </PText>
  </View>
);

/* ---------- 둥근 듣기 · 저장 버튼 (.ls-spk · .ls-mk 32px) ---------- */
export function SpeakRound({ text, who, size = 32, bg = '#BFE4EC', rate = 0.92 }: { text: string; who?: string; size?: number; bg?: string; rate?: number }) {
  const { noListen } = useLearnPrefs();
  const say = useSay();
  if (noListen) return null; // 소리 끄기면 듣기 버튼이 사라져요
  return (
    <Pressable onPress={() => say(text, rate, who)} accessibilityRole="button" accessibilityLabel="듣기" hitSlop={6} style={[styles.round, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Spk size={size < 34 ? 15 : 17} />
    </Pressable>
  );
}

/** 내 표현함 저장 (toggleExpression) — 동그라미(.ls-mk) · 네모(.st-ib) */
export function SaveBtn({ en, ko, source, shape = 'round' }: { en: string; ko: string; source: string; shape?: 'round' | 'square' }) {
  const on = useIsSaved(en);
  const toggle = () => {
    const saved = toggleExpression({ en, ko, source });
    sfx(saved ? 'save' : 'tap');
    if (saved) offerChallenge(en);
    haptic('select');
  };
  return (
    <Pressable
      onPress={toggle}
      accessibilityRole="button"
      accessibilityLabel={on ? '저장 빼기' : '내 표현함에 저장'}
      accessibilityState={{ selected: on }}
      hitSlop={6}
      style={[shape === 'round' ? styles.round : styles.square, { backgroundColor: on ? Colors.yellow : Colors.white }]}>
      <Mark on={on} />
    </Pressable>
  );
}

/** 네모 듣기 버튼 (.st-ib 36px · 결과 목록) */
export function SpeakSquare({ text }: { text: string }) {
  const { noListen } = useLearnPrefs();
  const say = useSay();
  if (noListen) return null;
  return (
    <Pressable onPress={() => say(text, 0.92)} accessibilityRole="button" accessibilityLabel="듣기" hitSlop={4} style={[styles.square, { backgroundColor: Colors.white }]}>
      <Spk />
    </Pressable>
  );
}

/* ---------- 보기 (.st-opt) ---------- */
export type OptState = 'idle' | 'right' | 'wrong' | 'done';

export function Opt({ label, sub, state, onPress }: { label: string; sub?: string; state: OptState; onPress: () => void }) {
  const still = useReducedMotion();
  const shake = useSharedValue(0);
  useEffect(() => {
    // optNo: 틀리면 좌우로 흔들려요 (.45초)
    if (state !== 'wrong' || still) return;
    shake.set(withSequence(withTiming(-7, { duration: 90 }), withTiming(7, { duration: 90 }), withTiming(-4, { duration: 90 }), withTiming(4, { duration: 90 }), withTiming(0, { duration: 90, easing: Easing.out(Easing.quad) })));
  }, [state, still, shake]);
  const moved = useAnimatedStyle(() => ({ transform: [{ translateX: shake.get() }] }));
  const wrong = state === 'wrong';
  const locked = state !== 'idle';
  return (
    <Animated.View style={moved}>
      <Pressable onPress={onPress} disabled={locked} accessibilityRole="button" accessibilityLabel={sub ? `${label} ${sub}` : label} accessibilityState={{ disabled: locked, selected: state === 'right' }}>
        {({ pressed }) => (
          <View>
            {!wrong && !pressed ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.optShadow]} /> : null}
            <View
              style={[
                styles.opt,
                state === 'right' && { backgroundColor: Colors.yellow },
                wrong && styles.optWrong,
                pressed && !locked && { transform: [{ translateY: 3 }] },
              ]}>
              <PText style={[styles.optText, wrong && { color: '#8A6170' }]}>
                {label}
              </PText>
              {sub ? (
                <Appear kind="rise">
                  <PText style={styles.optKo} color="#5A5368">
                    {sub}
                  </PText>
                </Appear>
              ) : null}
            </View>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

/** 연속 정답 응원 팔로: 정답 띠 + 버튼(아래 고정 칸) 위에서 나와요 */
export const CHEER_BOTTOM = 200;

/* ---------- 정답 · 오답 반응 + 다음 버튼 (프로토타입 qFootFB · #study .ls-fb) ---------- */
export function FeedbackFoot({ ok, title, sub, say, ko, source, next, onNext }: { ok: boolean; title: string; sub: string; say?: string; ko?: string; source: string; next: string; onNext: () => void }) {
  return (
    <View style={styles.fb} accessibilityLiveRegion="polite">
      <View style={styles.fbRow}>
        <Appear kind="reactHop">
          <Image source={ok ? require('@/assets/characters/c-upright-yellow.png') : require('@/assets/characters/c-upright-purple.png')} style={styles.fbChar} contentFit="contain" />
        </Appear>
        <Appear kind="rise" style={styles.flex}>
          <PText style={[styles.fbTitle, { color: ok ? Colors.purple : PINK_INK }]}>{title}</PText>
          <PText style={styles.fbSub} color={SUB}>
            {sub}
          </PText>
        </Appear>
        {say ? <SpeakRound text={say} /> : null}
        {say ? <SaveBtn en={say} ko={ko ?? ''} source={source} /> : null}
      </View>
      <BigBtn label={next} onPress={onNext} />
    </View>
  );
}

/** 아래 고정 큰 버튼 (#stBody .st-foot .btn — 높이 54 · 둥글기 27 · 테두리 2.5 · 그림자 0 5) */
export function BigBtn({ label, onPress, color = Colors.yellow, disabled, icon, textColor = Colors.ink }: { label: string; onPress: () => void; color?: string; disabled?: boolean; icon?: ReactNode; textColor?: string }) {
  return <StudyButton label={label} onPress={onPress} disabled={disabled} bg={color} textColor={textColor} left={icon} />;
}

/** 화면 아래 고정 칸 (.st-foot): 위로 크림색이 번지며 본문을 덮어요 */
export function Foot({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.foot, { paddingBottom: 16 + insets.bottom }]}>
      <LinearGradient pointerEvents="none" colors={['rgba(251,246,234,0)', Colors.cream]} style={styles.footFade} />
      {children}
    </View>
  );
}

/* ---------- 결과 (.st-score · .st-res) ---------- */
export function ScoreCard({ kick, right, total, note, img }: { kick: string; right: number; total: number; note?: string; img?: boolean }) {
  return (
    <Drop dx={4} dy={4} radius={22}>
      <View style={styles.score}>
        {img ? <Image source={require('@/assets/characters/c-upright-yellow.png')} style={styles.scoreImg} contentFit="contain" /> : null}
        <PText style={styles.kick} color={SUB}>
          {kick}
        </PText>
        <PText style={styles.scoreNum}>
          {right}
          <PText style={styles.scoreOf}> / {total}</PText>
        </PText>
        {note ? (
          <PText style={styles.qko} color={SUB}>
            {note}
          </PText>
        ) : null}
      </View>
    </Drop>
  );
}

export function ResultRow({ ok, en, ko, head, source }: { ok: boolean; en: string; ko: string; head?: string; source: string }) {
  return (
    <View style={[styles.res, !ok && styles.resNo]}>
      <View style={[styles.resOk, !ok && { backgroundColor: '#F6D3DC' }]}>{ok ? <Check size={14} /> : <XMark size={12} />}</View>
      <View style={styles.flex}>
        {head ? (
          <PText style={styles.resHead} color={SUB}>
            {head}
          </PText>
        ) : null}
        <PText style={styles.resEn}>
          {en}
        </PText>
        <PText style={styles.resKo} color={SUB}>
          {ko}
        </PText>
      </View>
      <SpeakSquare text={en} />
      <SaveBtn en={en} ko={ko} source={source} shape="square" />
    </View>
  );
}

/* ---------- 사람 얼굴 (프로토타입 PPL · assets/ppl) ---------- */
const PPL: Record<string, number> = {
  Lily: require('@/assets/images/scene/ppl/lily.jpg'),
  Sonya: require('@/assets/images/scene/ppl/sonya.jpg'),
  Logan: require('@/assets/images/scene/ppl/logan.jpg'),
  Aiden: require('@/assets/images/scene/ppl/aiden.jpg'),
};

/** 얼굴 사진 — 없는 사람은 색 동그라미 + 첫 글자 (.st-av) */
export function Avatar({ who, size, color }: { who: string; size: number; color: string }) {
  const src = PPL[who];
  if (src) return <Image source={src} style={[styles.av, { width: size, height: size, borderRadius: size / 2 }]} contentFit="cover" contentPosition={{ top: '12%', left: '50%' }} accessibilityLabel={who} />;
  return (
    <View style={[styles.av, styles.avLetter, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
      <PText style={styles.avText} color={Colors.white}>
        {who[0]}
      </PText>
    </View>
  );
}

/* ---------- 그만할까요? (프로토타입 stQuitAsk · .ls-m) ---------- */
export function QuitSheet({ open, onStay, onQuit }: { open: boolean; onStay: () => void; onQuit: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <LayerModal visible={open} transparent animationType="fade" onRequestClose={onStay} statusBarTranslucent>
      <View style={[styles.quitDim, { paddingBottom: 16 + insets.bottom }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onStay} accessibilityLabel="계속하기" />
        <Drop dy={6} radius={26} style={styles.full}>
        <View style={styles.quitCard} accessibilityRole="alert" accessibilityLabel="정말 그만할까요?">
          <Image source={require('@/assets/characters/c-purple-standard-3d.png')} style={styles.quitImg} contentFit="contain" />
          <PText style={styles.quitTitle}>정말 그만할까요?</PText>
          <PText style={styles.quitMsg} color={SUB}>
            여기까지 한 건 저장돼요
          </PText>
          <View style={styles.full}>
            <BigBtn label="계속하기" onPress={onStay} />
          </View>
          <Pressable onPress={onQuit} accessibilityRole="button" accessibilityLabel="그만하기" style={styles.skip}>
            <PText style={styles.skipText}>그만하기</PText>
          </Pressable>
        </View>
        </Drop>
      </View>
    </LayerModal>
  );
}

/** 배열 섞기 (프로토타입 stShuffle) */
export function shuffle<T>(a: readonly T[]): T[] {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

export const pick = <T,>(a: readonly T[]): T => a[Math.floor(Math.random() * a.length)];

/** 프로토타입 REACT_BY[0] (영어) */
export const REACT_GOOD: [string, string][] = [
  ['Nailed it!', '완벽하게 해냈어요!'],
  ['Spot on!', '딱 맞았어요!'],
  ['You got it!', '맞혔어요!'],
  ['Way to go!', '잘했어요, 바로 그거예요!'],
  ["That's exactly right!", '정확히 맞아요!'],
];

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  full: { alignSelf: 'stretch' },
  kick: { fontFamily: Font.body800, fontSize: 12, lineHeight: 17 },
  round: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: Colors.ink, alignItems: 'center', justifyContent: 'center' },
  square: { width: 36, height: 36, borderRadius: 12, borderWidth: 2, borderColor: Colors.ink, alignItems: 'center', justifyContent: 'center' },
  optShadow: { top: 4, bottom: -4, borderRadius: 18, backgroundColor: Colors.ink },
  opt: { minHeight: 54, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 18, borderWidth: 2.5, borderColor: Colors.ink, backgroundColor: Colors.white, justifyContent: 'center' },
  optWrong: { backgroundColor: '#F6D3DC', borderStyle: 'dashed', transform: [{ translateY: 4 }] },
  optText: { fontFamily: Font.body800, fontSize: 15, lineHeight: 15 * 1.45 },
  optKo: { marginTop: 3, fontFamily: Font.body700, fontSize: 12.5, lineHeight: 12.5 * 1.4 },
  fb: { gap: 12, paddingTop: 2 },
  fbRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  fbChar: { width: 88, height: 82 },
  fbTitle: { fontFamily: Font.display, fontSize: 22, lineHeight: 22 * 1.2, letterSpacing: -0.4 },
  fbSub: { marginTop: 2, fontFamily: Font.body700, fontSize: 12.5, lineHeight: 12.5 * 1.5 },
  foot: { paddingTop: 12, paddingHorizontal: 16, gap: 8, backgroundColor: Colors.cream },
  footFade: { position: 'absolute', left: 0, right: 0, top: -22, height: 22 },
  score: { paddingVertical: 20, paddingHorizontal: 16, alignItems: 'center', gap: 4, borderWidth: 2, borderColor: Colors.ink, borderRadius: 22, backgroundColor: Colors.white },
  scoreImg: { width: 110, height: 100 },
  scoreNum: { fontFamily: Font.display, fontSize: 46, lineHeight: 46 * 1.1 },
  scoreOf: { fontFamily: Font.display, fontSize: 18 },
  qko: { fontFamily: Font.body700, fontSize: 13, lineHeight: 13 * 1.5, textAlign: 'center' },
  res: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingLeft: 14, paddingRight: 12, borderRadius: 18, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white },
  resNo: { borderStyle: 'dashed' },
  resOk: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.yellow, alignItems: 'center', justifyContent: 'center' },
  resHead: { fontFamily: Font.body600, fontSize: 12, lineHeight: 17 },
  resEn: { fontFamily: Font.body800, fontSize: 14, lineHeight: 14 * 1.4 },
  resKo: { marginTop: 1, fontFamily: Font.body600, fontSize: 12, lineHeight: 17 },
  av: { borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white },
  avLetter: { alignItems: 'center', justifyContent: 'center' },
  avText: { fontFamily: Font.display, fontSize: 14 },
  quitDim: { flex: 1, justifyContent: 'flex-end', padding: 16, backgroundColor: 'rgba(30,26,43,0.45)' },
  quitCard: { alignItems: 'center', gap: 6, paddingHorizontal: 18, paddingBottom: 12, borderWidth: 2, borderColor: Colors.ink, borderRadius: 26, backgroundColor: Colors.white },
  quitImg: { width: 104, height: 104, marginTop: -52 },
  quitTitle: { fontFamily: Font.body900, fontSize: 20, lineHeight: 28 },
  quitMsg: { marginBottom: 10, fontFamily: Font.body700, fontSize: 14, lineHeight: 20 },
  skip: { alignSelf: 'stretch', height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  skipText: { fontFamily: Font.body800, fontSize: 15, lineHeight: 20 },
});
