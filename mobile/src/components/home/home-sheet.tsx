import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Raised } from '@/components/ui/raised';
import { Colors } from '@/constants/theme';
import { EASE } from '@/lib/motion';

import { CLOSE_PATH, LineIcon } from './icons';

/**
 * 홈 출석 · 건너뛰기 시트 (프로토타입 #sheet · .sheet · .dim).
 * 바탕은 .35초 동안 어두워지고, 시트는 .55초 동안 아래에서 올라와요 (공통 Sheet 와 달리 잉크 손잡이 · 자체 머리).
 */
export function HomeSheet({ open, onClose, label, children }: { open: boolean; onClose: () => void; label: string; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const still = useReducedMotion();
  const [mounted, setMounted] = useState(open);
  const [h, setH] = useState(800);
  const p = useSharedValue(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 열리면 바로 그려요 (닫힐 때는 내려가는 움직임이 끝난 뒤 지워요)
  if (open && !mounted) setMounted(true);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (open) {
      p.set(withTiming(1, { duration: still ? 0 : 550, easing: EASE }));
    } else {
      p.set(withTiming(0, { duration: still ? 0 : 350, easing: EASE }));
      timer.current = setTimeout(() => setMounted(false), still ? 0 : 360);
    }
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [open, still, p]);

  const dim = useAnimatedStyle(() => ({ opacity: Math.min(p.get() * 1.6, 1) }));
  const sheet = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - p.get()) * h * 1.1 }] }));

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.dim, dim]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="닫기" />
        </Animated.View>
        <Animated.View
          style={[styles.sheet, { paddingBottom: 30 + insets.bottom }, sheet]}
          onLayout={(e) => setH(e.nativeEvent.layout.height)}
          accessibilityViewIsModal
          accessibilityLabel={label}>
          <View style={styles.grab} />
          {/* 칸 그림자(오른쪽 · 아래 3~4px)가 잘리지 않게 스크롤 칸만 양옆으로 6px 넓혀요 */}
          <ScrollView bounces={false} showsVerticalScrollIndicator={false} style={styles.scroll} contentContainerStyle={styles.scrollIn}>
            {children}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

/** 시트 오른쪽 위 닫기 (프로토타입 .icon-btn.press · 44px · 하드 그림자) */
export function SheetClose({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="닫기">
      {({ pressed }) => (
        <Raised radius={14} pressed={pressed}>
          <View style={styles.close}>
            <LineIcon d={CLOSE_PATH} size={18} width={2.6} />
          </View>
        </Raised>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  dim: { backgroundColor: 'rgba(30,26,43,0.45)' },
  sheet: {
    maxHeight: '92%',
    backgroundColor: Colors.cream,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderColor: Colors.ink,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 18,
  },
  scroll: { marginHorizontal: -6 },
  scrollIn: { paddingHorizontal: 6, paddingBottom: 4 },
  grab: { alignSelf: 'center', width: 44, height: 6, borderRadius: 3, backgroundColor: Colors.ink },
  close: { width: 44, height: 44, borderRadius: 14, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
});
