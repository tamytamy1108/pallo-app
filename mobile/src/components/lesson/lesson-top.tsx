import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';

import { CloseIcon, SpeakerIcon } from '@/components/lesson/icons';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';

/**
 * 레슨 위 줄: 왼쪽 X · 진행 막대 · 1/9 · 오른쪽 소리 버튼 (프로토타입 #lesson 위 줄).
 * 레슨 A(Lv.1 · 2) · 레슨 B(Lv.3 · 4)가 같이 써요. 담당: 레슨 A. props 는 바꾸지 않아요(늘리기만).
 */
export function LessonTop({ index, total, soundOff, onToggleSound, onClose }: { index: number; total: number; soundOff: boolean; onToggleSound: () => void; onClose: () => void }) {
  return (
    <View style={styles.top}>
      <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="그만하기" style={styles.iconBtn} hitSlop={6}>
        <CloseIcon />
      </Pressable>
      <ProgressBar value={index / total} />
      <PText style={styles.count}>
        {index + 1}/{total}
      </PText>
      <Pressable
        onPress={onToggleSound}
        accessibilityRole="switch"
        accessibilityLabel="소리 끄기"
        accessibilityState={{ checked: soundOff }}
        style={StyleSheet.flatten([styles.iconBtn, soundOff && styles.soundOff])}
        hitSlop={6}>
        <SpeakerIcon off={soundOff} color={soundOff ? '#5B4BA8' : Colors.ink} />
      </Pressable>
    </View>
  );
}

function ProgressBar({ value }: { value: number }) {
  const fill = useAnimatedStyle(() => ({ width: withSpring(`${Math.max(value, 0.04) * 100}%`, { damping: 18 }) }));
  return (
    <View style={styles.bar} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}>
      <Animated.View style={[styles.fill, fill]} />
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 10 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  soundOff: { backgroundColor: '#E6DEFA' },
  bar: { flex: 1, height: 16, borderRadius: 8, borderWidth: 2, borderColor: Colors.ink, backgroundColor: '#F1EBDC', overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: Colors.purple, borderRightWidth: 2, borderColor: Colors.ink },
  count: { fontFamily: Font.display, fontSize: 13, lineHeight: 17 },
});
