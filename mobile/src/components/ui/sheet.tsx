import { Children, createContext, Fragment, isValidElement, useCallback, useEffect, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, useWindowDimensions, View, type ScrollViewInstance, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaInsetsContext, SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Pressable } from '@/components/ui/pressable';
import { Colors, Radius } from '@/constants/theme';
import { EASE } from '@/lib/motion';

import { PText } from './text';
import { ToastView, useToastLayer } from './toast';

export type SheetProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** 아래 고정 행동 버튼 자리 (신청하기 · 보내기 등). 버튼이 여럿이면 칸을 똑같이 나눠요 (프로토타입 .lg-sfoot · .lg-sbtns) */
  footer?: ReactNode;
  /** 키 큰 시트: 화면 84% 높이로 고정 (프로토타입 #lgSheet.tall — 댓글 창 · 긴 만들기 시트) */
  tall?: boolean;
  /** false 면 children 을 스크롤 없이 그대로 둬요 (안쪽 목록이 따로 스크롤하고 아래 입력칸이 붙는 시트) */
  scroll?: boolean;
  /** 내용 칸 사이 간격 (기본 12 — #lgSheet { gap: 12px }) */
  gap?: number;
  /** 닫히는 움직임이 다 끝난 뒤 (다음 시트를 이어서 열 때) */
  onClosed?: () => void;
  /** 화면 읽기 이름 (없으면 title) */
  label?: string;
  /** false 면 바깥 누르기 · 끌어내리기 · 뒤로 가기로 안 닫혀요 */
  dismissible?: boolean;
  /** 내용 칸 스타일 덧붙이기 */
  contentStyle?: StyleProp<ViewStyle>;
  /** 이 값이 바뀌면 내용을 맨 위로 (같은 시트에서 단계를 넘길 때 — 체험 신청) */
  scrollKey?: string | number;
};

const CLOSE_DRAG = 110;

/** 아래 고정 칸 안인지 (칸 안 버튼은 비활성일 때 흐리게 — .lg-sfoot .lg-btn:disabled { opacity: .45 }) */
export const SheetFooterContext = createContext(false);

/**
 * 아래에서 올라오는 시트 (프로토타입 .sheet + #lgSheet: 크림 · 잉크 2px · 위 모서리 28px · 연한 손잡이 · 최대 92%).
 * 움직임: 바탕이 .3초 어두워지고, 시트는 .55초 --ease 로 올라와요. 손잡이를 아래로 끌면 닫혀요.
 * 시트가 떠 있는 동안 토스트는 시트 안에 그려요 (네이티브 Modal 위로 보이게).
 * 담당: 공통 부품. props 는 바꾸지 않아요(늘리기만).
 */
/** 시트가 다 닫힌 뒤에 할 일 (다른 화면으로 가기 등). 시트를 닫는 onClose() 바로 다음에 불러요 */
const afterClose: (() => void)[] = [];
export function runAfterSheetClose(fn: () => void) {
  afterClose.push(fn);
}
function flushAfterClose() {
  afterClose.splice(0).forEach((fn) => fn());
}

export function Sheet({ open, onClose, title, children, footer, tall = false, scroll = true, gap = 12, onClosed, label, dismissible = true, contentStyle, scrollKey }: SheetProps) {
  const insets = useSafeAreaInsets();
  const { height: winH } = useWindowDimensions();
  const still = useReducedMotion();
  // 닫히는 움직임 동안에도 Modal 을 남겨 둬요 (열릴 땐 그리는 중에 바로 켜요)
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);
  const showToastHere = useToastLayer(mounted);

  const shown = useSharedValue(0);
  const dim = useSharedValue(0);
  const sheetH = useSharedValue(winH);
  const drag = useSharedValue(0);

  // 닫힌 뒤 부를 함수는 최신 것을 써요
  const closedRef = useRef(onClosed);
  useEffect(() => {
    closedRef.current = onClosed;
  }, [onClosed]);
  // 아이폰은 Modal 이 실제로 내려간 뒤(onDismiss)에 알려요 — 그 전에 다른 화면 · 시트를 열면 막혀서 아무 일도 안 일어나요
  const closed = useCallback(() => {
    closedRef.current?.();
    flushAfterClose();
  }, []);
  const finishClose = useCallback(() => {
    setMounted(false);
    if (Platform.OS !== 'ios') closed();
  }, [closed]);
  const onDismiss = closed;

  const wasOpen = useRef(false);
  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      drag.set(0);
      // .sheet { transition: transform .55s var(--ease) } · .lg-dim { transition: opacity .3s }
      shown.set(withTiming(1, { duration: still ? 0 : 550, easing: EASE }));
      dim.set(withTiming(1, { duration: still ? 0 : 300 }));
    } else if (wasOpen.current) {
      wasOpen.current = false;
      dim.set(withTiming(0, { duration: still ? 0 : 300 }));
      shown.set(
        withTiming(0, { duration: still ? 0 : 450, easing: EASE }, (done) => {
          if (done) runOnJS(finishClose)();
        }),
      );
    }
  }, [open, still, shown, dim, drag, finishClose]);

  const scrollRef = useRef<ScrollViewInstance>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [scrollKey]);

  const requestClose = useCallback(() => {
    if (dismissible) onClose();
  }, [dismissible, onClose]);

  // 손잡이를 아래로 끌면 따라 내려오고, 충분히 끌었거나 빨리 튕기면 닫아요
  const pan = Gesture.Pan()
    .enabled(dismissible)
    .activeOffsetY([-8, 8])
    .onUpdate((e) => {
      drag.set(e.translationY > 0 ? e.translationY : e.translationY / 4);
    })
    .onEnd((e) => {
      if (e.translationY > CLOSE_DRAG || e.velocityY > 900) runOnJS(onClose)();
      else drag.set(withTiming(0, { duration: 250, easing: EASE }));
    });

  const sheetAnim = useAnimatedStyle(() => ({
    transform: [{ translateY: drag.get() + (1 - shown.get()) * sheetH.get() * 1.1 }],
  }));
  const dimAnim = useAnimatedStyle(() => ({ opacity: dim.get() }));

  // 아래 여백: 버튼 칸이 있으면 그 칸이, 키 큰 시트는 스크롤 안쪽이 안전 영역까지 챙겨요.
  // 안드로이드: 시트 창(Modal)은 내비게이션 바 뒤까지 그려서, 앱 화면의 안전 영역(0일 수 있어요)이 아니라
  // 시트 창 안에서 잰 값을 써요 (안 그러면 아래 버튼이 내비게이션 바에 가려져요)
  const bottomOf = (modal: { bottom: number } | null) => Math.max(insets.bottom, modal?.bottom ?? 0);
  const body = (
    <>
      {title ? (
        <PText variant="title" accessibilityRole="header">
          {title}
        </PText>
      ) : null}
      {children}
    </>
  );

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={requestClose} onDismiss={Platform.OS === 'ios' ? onDismiss : undefined} statusBarTranslucent navigationBarTranslucent>
      <SafeAreaProvider>
        <SafeAreaInsetsContext.Consumer>
          {(modalInsets) => {
            const bottom = bottomOf(modalInsets);
            const padBottom = footer || tall ? 0 : 30 + bottom;
            const scrollPadBottom = footer ? 12 : tall ? 30 + bottom : 0;
            return (
              <GestureHandlerRootView style={styles.fill}>
                <Animated.View style={[StyleSheet.absoluteFill, styles.dim, dimAnim]}>
                  <Pressable style={styles.fill} onPress={requestClose} accessibilityRole="button" accessibilityLabel="닫기" />
                </Animated.View>
                <KeyboardAvoidingView behavior={Platform.OS === 'web' ? undefined : 'padding'} style={styles.root} pointerEvents="box-none">
                  <Animated.View
                    accessibilityViewIsModal
                    accessibilityLabel={label ?? title}
                    onLayout={(e) => sheetH.set(e.nativeEvent.layout.height)}
                    style={[styles.sheet, tall ? styles.tall : styles.auto, { maxHeight: tall ? '84%' : '92%', paddingBottom: padBottom }, sheetAnim]}>
                    <GestureDetector gesture={pan}>
                      <View style={[styles.grabZone, { paddingBottom: 4 + gap }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                        <View style={styles.grab} />
                      </View>
                    </GestureDetector>
                    {scroll ? (
                      <ScrollView
                        ref={scrollRef}
                        bounces={false}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                        style={tall ? styles.fill : styles.shrink}
                        contentContainerStyle={[{ gap, paddingHorizontal: 18, paddingBottom: scrollPadBottom }, contentStyle]}>
                        {body}
                      </ScrollView>
                    ) : (
                      <View style={[tall ? styles.fill : styles.shrink, { gap, paddingHorizontal: 18 }, contentStyle]}>{body}</View>
                    )}
                    {footer ? (
                      <SheetFooterContext.Provider value>
                        <View style={[styles.footer, { paddingBottom: 22 + bottom }]}>
                          {footerItems(footer).map((child, i) => (
                            <View key={i} style={styles.slot}>
                              {child}
                            </View>
                          ))}
                        </View>
                      </SheetFooterContext.Provider>
                    ) : null}
                  </Animated.View>
                </KeyboardAvoidingView>
                {showToastHere ? <ToastView /> : null}
              </GestureHandlerRootView>
            );
          }}
        </SafeAreaInsetsContext.Consumer>
      </SafeAreaProvider>
    </Modal>
  );
}

/** 버튼 칸: <>…</> 로 묶어 넘겨도 버튼마다 한 칸씩 */
function footerItems(footer: ReactNode): ReactNode[] {
  return Children.toArray(footer).flatMap((child) =>
    isValidElement(child) && child.type === Fragment ? Children.toArray((child as ReactElement<{ children?: ReactNode }>).props.children) : [child],
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  shrink: { flexGrow: 0, flexShrink: 1 },
  dim: { backgroundColor: 'rgba(30,26,43,0.45)' },
  root: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.cream,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderColor: Colors.ink,
    borderTopLeftRadius: Radius.sheet,
    borderTopRightRadius: Radius.sheet,
    overflow: 'hidden',
  },
  auto: {},
  tall: { height: '84%' },
  // 손잡이: 위 12px + 막대 5px + 아래 4px(+ 내용 간격) — 이 칸 전체를 끌 수 있어요
  grabZone: { paddingTop: 12, alignItems: 'center' },
  grab: { width: 44, height: 5, borderRadius: 3, backgroundColor: '#CFC6B4' },
  footer: { flexDirection: 'row', gap: 10, paddingTop: 12, paddingHorizontal: 18, backgroundColor: Colors.cream, borderTopWidth: 1.5, borderColor: Colors.line },
  slot: { flex: 1 },
});
