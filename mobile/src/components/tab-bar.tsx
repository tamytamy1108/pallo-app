import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps, type TabsDescriptor, type TabsSlotRenderOptions } from 'expo-router/ui';
import { type ReactNode, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { Screen } from 'react-native-screens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { Pressable } from '@/components/ui/pressable';
import { Colors } from '@/constants/theme';
import { SPRING } from '@/lib/motion';

/** 프로토타입(prototype/index.html 의 TABS)과 같은 다섯 탭 · 같은 아이콘이에요. */
const TABS = [
  { name: 'home', href: '/', label: '홈', d: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z' },
  { name: 'library', href: '/library', label: '라이브러리', d: 'M4 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4zM20 4h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z' },
  { name: 'lounge', href: '/lounge', label: '라운지', d: 'M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z' },
  { name: 'event', href: '/event', label: '이벤트', d: 'M3 7h18v3.5a1.5 1.5 0 0 0 0 3V17H3v-3.5a1.5 1.5 0 0 0 0-3zM15 7v10' },
  { name: 'my', href: '/my', label: '마이', d: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 21a7.5 7.5 0 0 1 15 0' },
] as const;

export default function TabBar() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs>
      <TabSlot style={styles.slot} renderFn={renderTab} />
      <TabList asChild>
        <View style={StyleSheet.flatten([styles.bar, { bottom: Math.max(insets.bottom, 12) }])}>
          {TABS.map((t) => (
            <TabTrigger key={t.name} name={t.name} href={t.href} asChild>
              <TabButton icon={t.d} label={t.label} />
            </TabTrigger>
          ))}
        </View>
      </TabList>
    </Tabs>
  );
}

/**
 * 탭을 바꾸면 새 화면이 살짝 아래에서 떠오르며 나타나요 (프로토타입 .page → .page.active:
 * 투명도 .35초 · 14px 올라오기 .45초).
 */
function renderTab(descriptor: TabsDescriptor, { isFocused, loaded, detachInactiveScreens }: TabsSlotRenderOptions) {
  const { lazy = true } = descriptor.options;
  if (lazy && !loaded && !isFocused) return null;
  return (
    <Screen key={descriptor.route.key} enabled={detachInactiveScreens} activityState={isFocused ? 2 : 0} freezeOnBlur={false} style={[styles.screen, isFocused ? styles.focused : styles.unfocused]}>
      <TabPage focused={isFocused}>{descriptor.render()}</TabPage>
    </Screen>
  );
}

const PAGE_EASE = Easing.bezier(0.16, 1, 0.3, 1);

function TabPage({ focused, children }: { focused: boolean; children: ReactNode }) {
  const still = useReducedMotion();
  const fade = useSharedValue(1);
  const rise = useSharedValue(0);
  useEffect(() => {
    if (!focused || still) return;
    fade.set(0);
    rise.set(14);
    fade.set(withTiming(1, { duration: 350, easing: PAGE_EASE }));
    rise.set(withTiming(0, { duration: 450, easing: PAGE_EASE }));
  }, [focused, still, fade, rise]);
  const style = useAnimatedStyle(() => ({ opacity: fade.get(), transform: [{ translateY: rise.get() }] }));
  return <Animated.View style={[styles.page, style]}>{children}</Animated.View>;
}

type TabButtonProps = TabTriggerSlotProps & { icon: string; label: string };

// ref 는 Pressable 과 타입이 달라서 넘기지 않아요 (탭 전환에는 필요 없어요).
function TabButton({ icon, label, isFocused, ref: _ref, ...props }: TabButtonProps) {
  // 탭을 고르면 아이콘이 톡 커졌다 돌아와요 (프로토타입 tabBounce .5초)
  const still = useReducedMotion();
  const b = useSharedValue(0);
  useEffect(() => {
    if (!isFocused || still) return;
    b.set(withSequence(withTiming(1, { duration: 175, easing: SPRING }), withTiming(0, { duration: 325, easing: SPRING })));
  }, [isFocused, still, b]);
  const bounce = useAnimatedStyle(() => ({ transform: [{ translateY: -3 * b.get() }, { scale: 1 + 0.3 * b.get() }] }));
  return (
    <Pressable
      {...props}
      sound="nav"
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: isFocused }}
      style={({ pressed }) => StyleSheet.flatten([styles.tab, isFocused && styles.tabOn, pressed && styles.pressed])}>
      <Animated.View style={bounce}>
        <Svg width={21} height={21} viewBox="0 0 24 24">
          <Path d={icon} fill={isFocused ? Colors.yellow : 'none'} stroke={isFocused ? Colors.ink : '#3A3A48'} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </Animated.View>
      <Text style={[styles.label, isFocused && styles.labelOn]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  slot: { flex: 1 },
  screen: { flex: 1, position: 'relative', height: '100%' },
  focused: { zIndex: 1, display: 'flex', flexShrink: 0, flexGrow: 1 },
  unfocused: { zIndex: -1, display: 'none', flexShrink: 1, flexGrow: 0 },
  page: { flex: 1 },
  bar: {
    position: 'absolute',
    left: 14,
    right: 14,
    height: 62,
    padding: 6,
    borderRadius: 30,
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(30,26,43,0.06)',
    shadowColor: Colors.ink,
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, borderRadius: 24 },
  tabOn: { backgroundColor: 'rgba(30,26,43,0.06)' },
  pressed: { transform: [{ scale: 0.92 }] },
  label: { fontSize: 11.5, fontWeight: '600', color: '#3A3A48' },
  labelOn: { fontWeight: '900', color: Colors.ink },
});
