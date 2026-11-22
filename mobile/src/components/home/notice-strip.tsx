import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';

import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { BOARD_NOTICES as NOTICES, NOTICE_TAG_STYLE } from '@/data/mock';

const ROTATE_MS = 3200;
const HEIGHT = 48;

/**
 * 홈 위쪽 Notice board 띠: 공지 · 이벤트 · 새 소식이 3.2초마다 옆으로 넘어가요.
 * 누르면 그때 보이는 게시물 상세로 가요 (프로토타입 v499 와 같아요).
 */
export function NoticeStrip() {
  const [index, setIndex] = useState(0);
  const [width, setWidth] = useState(0);
  const [x] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % NOTICES.length), ROTATE_MS);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    // 프로토타입 .nb-track: transform .7s var(--ease) = cubic-bezier(.16,1,.3,1)
    Animated.timing(x, { toValue: -index * width, duration: 700, easing: Easing.bezier(0.16, 1, 0.3, 1), useNativeDriver: true }).start();
  }, [index, width, x]);

  const current = NOTICES[index];

  return (
    <Pressable
      onPress={() => router.push(`/notice/${current.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`${current.tag} · ${current.title} 보기`}
      style={({ pressed }) => StyleSheet.flatten([styles.wrap, pressed && styles.pressed])}>
      <View style={styles.tag}>
        <PText style={styles.tagText} color={Colors.white}>
          {'Notice\nboard'}
        </PText>
      </View>
      <View style={styles.view} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        <Animated.View style={StyleSheet.flatten([styles.track, { transform: [{ translateX: x }] }])}>
          {NOTICES.map((n) => (
            <View key={n.id} style={StyleSheet.flatten([styles.item, { width }])}>
              <View style={StyleSheet.flatten([styles.chip, { backgroundColor: NOTICE_TAG_STYLE[n.tag].bg }])}>
                <PText variant="label" color={NOTICE_TAG_STYLE[n.tag].ink} style={styles.chipText}>
                  {n.tag}
                </PText>
              </View>
              <PText variant="bodyStrong" numberOfLines={1} style={styles.title}>
                [{n.title}]
              </PText>
            </View>
          ))}
        </Animated.View>
      </View>
      <PText style={styles.idx}>
        {index + 1}/{NOTICES.length}
      </PText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', height: HEIGHT, borderRadius: 16, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, overflow: 'hidden' },
  pressed: { transform: [{ scale: 0.98 }] },
  tag: { alignSelf: 'stretch', minWidth: 62, paddingHorizontal: 10, justifyContent: 'center', backgroundColor: Colors.ink },
  tagText: { fontFamily: Font.display, fontSize: 9.5, lineHeight: 11, letterSpacing: 0.3, textAlign: 'center' },
  view: { flex: 1, height: HEIGHT, overflow: 'hidden' },
  track: { flexDirection: 'row' },
  item: { height: HEIGHT, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  chip: { height: 22, paddingHorizontal: 8, borderRadius: 11, borderWidth: 1.5, borderColor: Colors.ink, justifyContent: 'center' },
  chipText: { fontSize: 11, lineHeight: 14 },
  title: { flex: 1, fontFamily: Font.body700 },
  idx: { paddingRight: 12, fontFamily: Font.display, fontSize: 11, lineHeight: 14 },
});
