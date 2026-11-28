import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps, type TabsDescriptor, type TabsSlotRenderOptions } from 'expo-router/ui';
import { router, useIsFocused, usePathname } from 'expo-router';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { Platform, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { canPreloadWorld } from '@/components/library/world/world-support';
import { Pressable } from '@/components/ui/pressable';
import { Colors } from '@/constants/theme';
import { SPRING } from '@/lib/motion';
import { noteTouch, quietFor, setTabsFront } from '@/lib/quiet';
import { emitTabReselect, restoreTabScroll, type TabName } from '@/lib/tab-reselect';

/** 프로토타입(prototype/index.html 의 TABS)과 같은 다섯 탭 · 같은 아이콘이에요. */
const TABS = [
  { name: 'home', href: '/home', label: '홈', d: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z' },
  { name: 'library', href: '/library', label: '라이브러리', d: 'M4 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4zM20 4h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z' },
  { name: 'lounge', href: '/lounge', label: '라운지', d: 'M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z' },
  { name: 'event', href: '/event', label: '이벤트', d: 'M3 7h18v3.5a1.5 1.5 0 0 0 0 3V17H3v-3.5a1.5 1.5 0 0 0 0-3zM15 7v10' },
  { name: 'my', href: '/my', label: '마이', d: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 21a7.5 7.5 0 0 1 15 0' },
] as const;

/** 지금 탭 번호: 주소의 첫 칸으로 (/home → 0, /library → 1 …) */
function tabIndexOf(path: string) {
  const first = `/${path.split('/')[1] ?? ''}`;
  const i = TABS.findIndex((t) => t.href === first);
  return i < 0 ? 0 : i;
}

export default function TabBar() {
  const insets = useSafeAreaInsets();
  const at = tabIndexOf(usePathname());
  const [barW, setBarW] = useState(0);
  const slotW = barW ? (barW - 12) / TABS.length : 0;
  const libReady = useLibraryPreload();
  // 레슨 · 장면 같은 화면이 위에 올라와 있으면 라이브러리 지도 미리 만들기를 쉬어요 (lib/quiet)
  const front = useIsFocused();
  useEffect(() => {
    setTabsFront(front);
    return () => setTabsFront(false);
  }, [front]);
  return (
    <Tabs onTouchStart={noteTouch}>
      {/* 화면 떼기(react-native-screens)는 쓰지 않아요 — 숨은 탭은 display: none, 라이브러리는 붙여 둔 채 투명하게 (renderTab).
          떼기를 켜면 숨은 라이브러리가 창에서 빠져 iOS 에서 GL 판이 안 만들어지거나, 두 화면을 붙여 두면 홈이 안 그려졌어요 */}
      <TabSlot style={styles.slot} detachInactiveScreens={false} renderFn={(d, o) => renderTab(d, o, libReady)} />
      <TabList asChild>
        <View style={StyleSheet.flatten([styles.bar, LIQUID ? styles.barLiquid : [styles.barFrost, webBlur], { bottom: Math.max(insets.bottom, 12) }])} onLayout={(e) => setBarW(e.nativeEvent.layout.width)}>
          {/* 고른 탭 알약: 누른 탭으로 스프링처럼 살짝 지나쳤다 돌아오며 미끄러져요 (프로토타입 .tab-ind · transform .45s var(--spring)) */}
          {/* 아이폰(iOS 26~)은 시스템 유리(Liquid Glass)를 그대로 깔아요 */}
          {LIQUID ? <GlassView pointerEvents="none" glassEffectStyle="regular" style={styles.glass} /> : null}
          {slotW ? <TabIndicator at={at} slotW={slotW} /> : null}
          {TABS.map((t) => (
            <TabTrigger key={t.name} name={t.name} href={t.href} asChild>
              <TabButton tab={t.name} icon={t.d} label={t.label} />
            </TabTrigger>
          ))}
        </View>
      </TabList>
    </Tabs>
  );
}

/** 앱을 켜고 이만큼(ms) 뒤부터, 화면을 LIB_QUIET_MS 동안 안 만지면 라이브러리 탭을 뒤에서 미리 열어 둬요 */
const LIB_PRELOAD_MS = 1500;
const LIB_QUIET_MS = 1200;

/**
 * 라이브러리 탭(3D 섬 지도)을 처음 누르기 전에 뒤에서 미리 열어 둬요 — 지도(GL 판 · 3D 장면)를 만드는 데
 * 폰에서 한 장에 0.4~0.8초 걸려서, 누른 뒤에 만들면 사진판 → 3D 로 바뀌는 게 보여요. 화면을 안 만질 때만 열어요 (만드는 동안 JS 가 멈춰요).
 */
function useLibraryPreload() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (ready || !canPreloadWorld()) return;
    let t: ReturnType<typeof setTimeout>;
    const check = () => {
      const quiet = quietFor();
      if (quiet >= LIB_QUIET_MS) {
        // 아래 탭은 가 본 탭만 길(route)이 있어서, 라이브러리 길을 미리 넣어 둬요 (주소는 그대로)
        router.prefetch('/library');
        setReady(true);
      }
      else t = setTimeout(check, LIB_QUIET_MS - quiet + 30);
    };
    t = setTimeout(check, LIB_PRELOAD_MS);
    return () => clearTimeout(t);
  }, [ready]);
  return ready;
}

/**
 * 탭을 바꾸면 새 화면이 살짝 아래에서 떠오르며 나타나요 (프로토타입 .page → .page.active:
 * 투명도 .35초 · 14px 올라오기 .45초).
 * 라이브러리 탭은 숨을 때도 화면에서 빼지 않고(display: none 대신) 뒤에 투명하게만 둬요 —
 * 떼면 폰의 GL 판이 없어져서 돌아올 때마다 3D 지도를 다시 붙이느라 사진판이 잠깐 보였어요. 그리기는 지도가 멈춰 둬요.
 */
function renderTab(descriptor: TabsDescriptor, { isFocused, loaded }: TabsSlotRenderOptions, libReady: boolean) {
  const { lazy = true } = descriptor.options;
  const keepAlive = descriptor.route.name === 'library';
  if (lazy && !loaded && !isFocused && !(keepAlive && libReady)) return null;
  const hidden = !isFocused;
  return (
    <View
      key={descriptor.route.key}
      style={[styles.screen, isFocused ? styles.focused : keepAlive ? styles.kept : styles.unfocused]}
      pointerEvents={hidden ? 'none' : 'auto'}
      accessibilityElementsHidden={hidden}
      importantForAccessibility={hidden ? 'no-hide-descendants' : 'auto'}
      aria-hidden={hidden}>
      <TabPage focused={isFocused} tab={tabNameOf(descriptor.route.name)}>
        {descriptor.render()}
      </TabPage>
    </View>
  );
}

const PAGE_EASE = Easing.bezier(0.16, 1, 0.3, 1);

/** 프로토타입 --spring: cubic-bezier(.2,.9,.3,1.3) — 끝에서 살짝 지나쳤다 돌아와요 */
const IND_EASE = Easing.bezier(0.2, 0.9, 0.3, 1.3);

/**
 * 고른 탭 알약. 지나쳤다 돌아오는 건 그대로지만, 맨 왼쪽(홈) · 맨 오른쪽(마이) 탭으로 갈 때
 * 탭 칸 밖(화면 밖)으로 튀어 나가지 않게 가로 위치를 첫 칸 ~ 끝 칸 사이로 묶어 둬요.
 */
function TabIndicator({ at, slotW }: { at: number; slotW: number }) {
  const still = useReducedMotion();
  const x = useSharedValue(at * slotW);
  // 젤리: 움직이기 시작하면 옆으로 늘어나며 납작해졌다가, 멈추면 몇 번 출렁이며 돌아와요
  const squish = useSharedValue(0);
  const lastW = useRef(slotW);
  useEffect(() => {
    const to = at * slotW;
    // 처음 자리 잡기 · 탭 칸 크기가 바뀐 때는 미끄러지지 않고 바로
    if (still || lastW.current !== slotW) x.set(to);
    else {
      x.set(withTiming(to, { duration: 280, easing: IND_EASE }));
      squish.set(withSequence(withTiming(1, { duration: 120, easing: Easing.out(Easing.quad) }), withSpring(0, JELLY)));
    }
    lastW.current = slotW;
  }, [at, slotW, still, x, squish]);
  const maxX = (TABS.length - 1) * slotW;
  const slide = useAnimatedStyle(() => ({
    transform: [{ translateX: Math.min(maxX, Math.max(0, x.get())) }, { scaleX: 1 + 0.12 * squish.get() }, { scaleY: 1 - 0.1 * squish.get() }],
  }));
  return <Animated.View pointerEvents="none" style={[styles.ind, { width: slotW }, slide]} />;
}

/** 출렁임: 덜 잡아서(damping 낮게) 두세 번 흔들리고 멈춰요 */
const JELLY = { damping: 7, stiffness: 260, mass: 0.6 };

/** iOS 26 유리 탭 바처럼: 시스템 유리를 쓸 수 있으면 쓰고, 아니면 반투명 + (웹) 뒤 흐리기 */
const LIQUID = isLiquidGlassAvailable();
const webBlur = Platform.OS === 'web' ? ({ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' } as ViewStyle) : null;

/** 길 이름(index · library …) → 탭 이름 */
const tabNameOf = (route: string): TabName | null => TABS.find((t) => t.name === route || (t.name === 'home' && route === 'index'))?.name ?? null;

function TabPage({ focused, tab, children }: { focused: boolean; tab: TabName | null; children: ReactNode }) {
  const still = useReducedMotion();
  const fade = useSharedValue(1);
  const rise = useSharedValue(0);
  // 다른 탭에 갔다 돌아오면 마지막으로 보던 자리로 (lib/tab-reselect)
  useEffect(() => {
    if (focused && tab) restoreTabScroll(tab);
  }, [focused, tab]);
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

type TabButtonProps = TabTriggerSlotProps & { tab: TabName; icon: string; label: string };

// ref 는 Pressable 과 타입이 달라서 넘기지 않아요 (탭 전환에는 필요 없어요).
function TabButton({ tab, icon, label, isFocused, ref: _ref, onPress, ...props }: TabButtonProps) {
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
      // 이미 보고 있는 탭을 또 누르면 화면을 맨 위로 · 다른 탭으로 갈 때는 그 탭의 보던 자리 그대로
      onPress={(e) => {
        if (isFocused) emitTabReselect(tab);
        onPress?.(e);
      }}
      sound="nav"
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: isFocused }}
      style={({ pressed }) => StyleSheet.flatten([styles.tab, pressed && styles.pressed])}>
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
  /** 숨은 라이브러리 탭: 크기는 그대로(지도 GL 판 유지) · 안 보이고 뒤에 */
  kept: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: -1, opacity: 0 },
  page: { flex: 1 },
  bar: {
    position: 'absolute',
    // 탭 화면(focused zIndex 1)보다 위에 — 탭 칸은 평범한 View 라 폰에서 납작해져(view flattening) 화면과 형제가 돼요
    zIndex: 10,
    left: 14,
    right: 14,
    height: 62,
    padding: 6,
    borderRadius: 30,
    flexDirection: 'row',
    shadowColor: Colors.ink,
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  /** 유리 대신: 비치는 흰색 + 가장자리 흰 빛 한 줄 */
  barFrost: { backgroundColor: 'rgba(255,255,255,0.55)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)' },
  barLiquid: { backgroundColor: 'transparent' },
  glass: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 30 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, borderRadius: 24 },
  ind: { position: 'absolute', top: 6, bottom: 6, left: 6, borderRadius: 24, backgroundColor: 'rgba(120,120,128,0.14)' },
  pressed: { transform: [{ scale: 0.92 }] },
  label: { fontSize: 11.5, fontWeight: '600', color: '#3A3A48' },
  labelOn: { fontWeight: '900', color: Colors.ink },
});
