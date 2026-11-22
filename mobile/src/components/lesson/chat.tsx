import { useEffect, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { BookmarkIcon, SpeakerIcon } from '@/components/lesson/icons';
import { Avatar, L } from '@/components/lesson/lesson-ui';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';

/**
 * 대화 말풍선 (프로토타입 .st-msg · .ft-lily · .ft-me): 상대는 왼쪽 얼굴 + 흰 말풍선(영어 · 뜻 · 듣기), 나는 오른쪽 잉크 말풍선.
 * 새로 들어온 말은 살짝 떠오르며 (wcIn).
 */
export function GuestMsg({ who, en, ko, showWho = false, soundOff, onSay, fresh = false }: { who: string; en: string; ko?: string; showWho?: boolean; soundOff: boolean; onSay: () => void; fresh?: boolean }) {
  return (
    <In fresh={fresh} style={styles.msg}>
      <Avatar name={who} size={40} />
      <View style={styles.msgCol}>
        {showWho ? (
          <PText style={styles.who} color={Colors.inkSub}>
            {who}
          </PText>
        ) : null}
        <View style={StyleSheet.flatten([styles.b, !soundOff && styles.bSpk])}>
          <PText style={styles.bEn}>{en}</PText>
          {ko ? (
            <PText style={styles.bKo} color={Colors.inkSub}>
              {ko}
            </PText>
          ) : null}
          {!soundOff && (
            <Pressable onPress={onSay} accessibilityRole="button" accessibilityLabel="다시 듣기" hitSlop={6} style={styles.say}>
              <SpeakerIcon size={15} />
            </Pressable>
          )}
        </View>
      </View>
    </In>
  );
}

export function MyMsg({ children, saved, onSave, fresh = false }: { children: ReactNode; saved?: boolean; onSave?: () => void; fresh?: boolean }) {
  return (
    <In fresh={fresh} style={styles.me}>
      {onSave ? <MarkButton saved={!!saved} onPress={onSave} /> : null}
      <View style={styles.meB}>{children}</View>
    </In>
  );
}

/** 작은 표현 저장 (.ft-mk · .wc-mk) */
export function MarkButton({ saved, onPress }: { saved: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={saved ? '표현함에서 빼기' : '내 표현함에 저장'} accessibilityState={{ selected: saved }} hitSlop={8} style={StyleSheet.flatten([styles.mk, saved && styles.mkOn])}>
      <BookmarkIcon size={16} filled={saved} color={saved ? Colors.ink : Colors.inkSub} />
    </Pressable>
  );
}

function In({ fresh, style, children }: { fresh: boolean; style: object; children: ReactNode }) {
  const still = useReducedMotion();
  const p = useSharedValue(fresh && !still ? 0 : 1);
  useEffect(() => {
    if (fresh && !still) p.set(withTiming(1, { duration: 320, easing: Easing.bezier(0.16, 1, 0.3, 1) }));
  }, [fresh, still, p]);
  const a = useAnimatedStyle(() => ({ opacity: p.get(), transform: [{ translateY: (1 - p.get()) * 10 }] }));
  return <Animated.View style={[style, a]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  msg: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, maxWidth: '90%' },
  msgCol: { flexShrink: 1, minWidth: 0 },
  who: { fontFamily: Font.body800, fontSize: 11, lineHeight: 15, marginBottom: 2 },
  b: { paddingVertical: 10, paddingHorizontal: 13, borderRadius: 18, borderBottomLeftRadius: 6, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white },
  bSpk: { paddingRight: 48 },
  bEn: { fontFamily: Font.body700, fontSize: 15, lineHeight: 22 },
  bKo: { marginTop: 3, fontFamily: Font.body600, fontSize: 12, lineHeight: 17 },
  say: { position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: Colors.ink, backgroundColor: L.speakerBg, alignItems: 'center', justifyContent: 'center' },
  me: { alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: '90%' },
  meB: { flexShrink: 1, paddingVertical: 10, paddingHorizontal: 13, borderRadius: 18, borderBottomRightRadius: 6, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.ink },
  mk: { width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, borderColor: '#D6CDBA', backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  mkOn: { backgroundColor: Colors.yellow, borderColor: Colors.ink },
});
