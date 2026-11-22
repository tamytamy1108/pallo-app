import { router, Stack } from 'expo-router';
import { useEffect, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SheetFooterContext } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { Colors, Radius } from '@/constants/theme';
import { EASE } from '@/lib/motion';

/**
 * 시트 모양 화면 (프로토타입 #lgSheet.tall — 이벤트 제안 · 번개 열기 · 동아리 만들기 같은 긴 폼).
 * 주소가 있는 화면(/events/propose 등)이라 공통 Sheet 대신 같은 모양을 화면으로 그려요: 어두운 바탕 · 크림 · 잉크 2px · 위 모서리 28 · 아래 고정 버튼.
 */
export function SheetPage({ title, label, children, footer }: { title: string; label: string; children: ReactNode; footer: ReactNode }) {
  const insets = useSafeAreaInsets();
  const still = useReducedMotion();
  const y = useSharedValue(still ? 0 : 1);
  useEffect(() => {
    y.set(withTiming(0, { duration: still ? 0 : 550, easing: EASE }));
  }, [still, y]);
  const st = useAnimatedStyle(() => ({ transform: [{ translateY: `${y.value * 100}%` }] }));
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/event'));
  // 닫을 때도 시트가 아래로 내려간 뒤 화면을 닫아요 (.sheet { transition: transform .55s var(--ease) })
  const close = () => {
    if (still) return leave();
    y.set(
      withTiming(1, { duration: 550, easing: EASE }, (done) => {
        if (done) runOnJS(leave)();
      }),
    );
  };
  return (
    <View style={styles.root}>
      <Stack.Screen options={{ presentation: 'transparentModal', animation: 'fade', contentStyle: { backgroundColor: 'transparent' } }} />
      <Pressable style={styles.dim} onPress={close} accessibilityRole="button" accessibilityLabel="닫기" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kav} pointerEvents="box-none">
        <Animated.View style={[styles.sheet, { marginTop: insets.top + 40 }, st]} accessibilityLabel={label} accessibilityViewIsModal>
          <View style={styles.grab} />
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <PText variant="title" accessibilityRole="header">
              {title}
            </PText>
            {children}
          </ScrollView>
          <SheetFooterContext.Provider value>
            <View style={[styles.foot, { paddingBottom: 22 + insets.bottom }]}>
              <View style={{ flex: 1 }}>{footer}</View>
            </View>
          </SheetFooterContext.Provider>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  dim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(30,26,43,0.45)' },
  kav: { flex: 1, justifyContent: 'flex-end' },
  sheet: { flex: 1, backgroundColor: Colors.cream, borderWidth: 2, borderBottomWidth: 0, borderColor: Colors.ink, borderTopLeftRadius: Radius.sheet, borderTopRightRadius: Radius.sheet, overflow: 'hidden' },
  grab: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: '#CFC6B4', marginTop: 12, marginBottom: 4 },
  body: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 20, gap: 12 },
  foot: { flexDirection: 'row', paddingTop: 12, paddingHorizontal: 18, borderTopWidth: 1, borderColor: Colors.line, backgroundColor: Colors.cream },
});
