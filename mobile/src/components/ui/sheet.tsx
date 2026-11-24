import { Children, createContext, Fragment, isValidElement, useCallback, useEffect, useId, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, useWindowDimensions, View, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaInsetsContext, SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Pressable } from '@/components/ui/pressable';
import { Colors, Radius } from '@/constants/theme';
import { useKeyboardHeight, useKeyboardShown } from '@/lib/keyboard';
import { EASE } from '@/lib/motion';

import { FormScrollContext, KeepVisibleContext, useFormScroll, useShowFocusedOnKeyboard } from './form-scroll';
import { NestedSheets, useSheetLayer } from './sheet-stack';
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
const IOS = Platform.OS === 'ios';
/** 아이폰 Modal 신호(onShow · onDismiss)가 안 올 때 기다리는 시간 */
const SHOW_FALLBACK_MS = 400;
const DISMISS_FALLBACK_MS = 500;
export function runAfterSheetClose(fn: () => void) {
  afterClose.push(fn);
}
function flushAfterClose() {
  afterClose.splice(0).forEach((fn) => fn());
}

export function Sheet({ open, onClose, title, children, footer, tall = false, scroll = true, gap = 12, onClosed, label, dismissible = true, contentStyle, scrollKey }: SheetProps) {
  const insets = useSafeAreaInsets();
  const kb = useKeyboardShown();
  const { height: winH } = useWindowDimensions();
  const still = useReducedMotion();
  // 닫히는 움직임 동안에도 Modal 을 남겨 둬요 (열릴 땐 그리는 중에 바로 켜요).
  // 아이폰: 처음부터 열린 채로 그려지는 시트(챌린지 열기 등 겹쳐 뜨는 화면)는 화면이 자리 잡은 다음 프레임에 Modal 을 띄워요.
  // 같은 커밋에 띄우면 아이폰이 Modal 을 못 띄우고, 투명한 겹친 화면만 남아 화면이 멈춘 것처럼 돼요
  const [ready, setReady] = useState(!IOS);
  useEffect(() => {
    if (ready) return;
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, [ready]);
  const [mounted, setMounted] = useState(open && ready);
  if (open && ready && !mounted) setMounted(true);
  const showToastHere = useToastLayer(mounted);
  const layerId = useId();

  const shown = useSharedValue(0);
  const dim = useSharedValue(0);
  const sheetH = useSharedValue(winH);
  const drag = useSharedValue(0);

  // 닫힌 뒤 부를 함수는 최신 것을 써요
  const closedRef = useRef(onClosed);
  useEffect(() => {
    closedRef.current = onClosed;
  }, [onClosed]);
  // 아이폰은 Modal 이 실제로 내려간 뒤(onDismiss)에 알려요 — 그 전에 다른 화면 · 시트를 열면 막혀서 아무 일도 안 일어나요.
  // onDismiss 가 안 오는 경우를 대비해 잠깐 뒤에는 그냥 알려요 (두 번은 안 불러요)
  const closing = useRef(false);
  // Modal 이 지금 떠 있는지 (아이폰 onShow) · 최신 open
  const presented = useRef(false);
  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  }, [open]);
  const closed = useCallback(() => {
    if (!closing.current) return;
    closing.current = false;
    closedRef.current?.();
    flushAfterClose();
  }, []);
  const finishClose = useCallback(() => {
    closing.current = true;
    presented.current = false;
    setMounted(false);
    if (!IOS) closed();
    else setTimeout(closed, DISMISS_FALLBACK_MS);
  }, [closed]);
  const onDismiss = closed;

  // 올라오는 움직임: 아이폰은 Modal 이 실제로 뜬 뒤(onShow)에 시작해요 (뜨기 전에 움직이면 시트가 화면 밖에 남을 수 있어요)
  const enter = useCallback(() => {
    drag.set(0);
    // .sheet { transition: transform .55s var(--ease) } · .lg-dim { transition: opacity .3s }
    shown.set(withTiming(1, { duration: still ? 0 : 550, easing: EASE }));
    dim.set(withTiming(1, { duration: still ? 0 : 300 }));
  }, [drag, shown, dim, still]);
  const onShow = useCallback(() => {
    presented.current = true;
    if (openRef.current) enter();
  }, [enter]);

  const wasOpen = useRef(false);
  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      if (!IOS || presented.current) {
        enter();
        return;
      }
      // onShow 가 안 오는 경우를 대비해 잠깐 뒤에는 그냥 올려요
      const t = setTimeout(() => {
        if (openRef.current && !presented.current) enter();
      }, SHOW_FALLBACK_MS);
      return () => clearTimeout(t);
    } else if (wasOpen.current) {
      wasOpen.current = false;
      dim.set(withTiming(0, { duration: still ? 0 : 300 }));
      shown.set(
        withTiming(0, { duration: still ? 0 : 450, easing: EASE }, (done) => {
          if (done) runOnJS(finishClose)();
        }),
      );
    }
  }, [open, still, shown, dim, enter, finishClose]);

  // 하나 고르면 다음 칸이 보이게 올려 줘요 (ui/form-scroll)
  // 길게 쓰는 칸이 늘어나면 쓰는 줄이 아래 버튼 · 키보드에 가리지 않게 따라 내려가요 (keepCaret)
  const [scrollRef, formBox, onFormScroll, revealNext, keepCaret, showFocused] = useFormScroll();
  // 칸을 눌러 키보드가 올라오면 그 칸이 키보드 · 아래 버튼 위로 보이게
  useShowFocusedOnKeyboard(formBox, showFocused);
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [scrollKey, scrollRef]);

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
  const bottomOf = (modal: { bottom: number } | null) => (kb ? 0 : Math.max(insets.bottom, modal?.bottom ?? 0));
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

  const node = (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={requestClose} onShow={IOS ? onShow : undefined} onDismiss={IOS ? onDismiss : undefined} statusBarTranslucent navigationBarTranslucent>
      <SafeAreaProvider>
        <SafeAreaInsetsContext.Consumer>
          {(modalInsets) => {
            const bottom = bottomOf(modalInsets);
            const padBottom = footer || tall ? 0 : 30 + bottom;
            const scrollPadBottom = footer ? 12 : tall ? 30 + bottom : 0;
            // 시트 위로 늘 빈 곳을 남겨요 (상태 바 + 72) → 바깥을 눌러 닫을 수 있게 (키보드가 올라와도)
            const topGap = Math.max(insets.top, modalInsets?.top ?? 0) + 72;
            return (
              <GestureHandlerRootView style={styles.fill}>
                <Animated.View style={[StyleSheet.absoluteFill, styles.dim, dimAnim]}>
                  <Pressable style={styles.fill} onPress={requestClose} accessibilityRole="button" accessibilityLabel="닫기" />
                </Animated.View>
                <KeyboardFill />
                <KeyboardAvoidingView behavior={Platform.OS === 'web' ? undefined : 'padding'} style={[styles.root, { paddingTop: topGap }]} pointerEvents="box-none">
                  <Animated.View
                    accessibilityViewIsModal
                    accessibilityLabel={label ?? title}
                    onLayout={(e) => sheetH.set(e.nativeEvent.layout.height)}
                    style={[styles.sheet, tall ? styles.tall : styles.auto, { maxHeight: tall ? '84%' : '100%', paddingBottom: padBottom }, sheetAnim]}>
                    <GestureDetector gesture={pan}>
                      <View style={[styles.grabZone, { paddingBottom: 4 + gap }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                        <View style={styles.grab} />
                      </View>
                    </GestureDetector>
                    {scroll ? (
                      <View ref={formBox} collapsable={false} style={tall ? styles.fill : styles.shrink}>
                        <ScrollView
                          ref={scrollRef}
                          onScroll={onFormScroll}
                          scrollEventThrottle={32}
                          bounces={false}
                          keyboardShouldPersistTaps="handled"
                          showsVerticalScrollIndicator={false}
                          style={tall ? styles.fill : styles.shrink}
                          contentContainerStyle={[{ gap, paddingHorizontal: 18, paddingBottom: scrollPadBottom }, contentStyle]}>
                          <FormScrollContext.Provider value={revealNext}>
                            <KeepVisibleContext.Provider value={keepCaret}>{body}</KeepVisibleContext.Provider>
                          </FormScrollContext.Provider>
                        </ScrollView>
                      </View>
                    ) : (
                      <View style={[tall ? styles.fill : styles.shrink, { gap, paddingHorizontal: 18 }, contentStyle]}>{body}</View>
                    )}
                    {footer ? (
                      <SheetFooterContext.Provider value>
                        {/* 키보드가 올라오면 버튼을 키보드 바로 위에 (아래 빈 틈 없이) */}
                        <View style={[styles.footer, { paddingBottom: kb ? KB_FOOT_PAD : 22 + bottom }]}>
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
                {/* 이 시트가 떠 있는 동안 연 다른 시트 (아이폰은 여기 안에 그려야 떠요) */}
                <NestedSheets id={layerId} />
              </GestureHandlerRootView>
            );
          }}
        </SafeAreaInsetsContext.Consumer>
      </SafeAreaProvider>
    </Modal>
  );
  const inParent = useSheetLayer(layerId, mounted, open, node);
  // 웹에서는 열려 있을 때만 Modal 을 그려요 (아이폰은 닫힘 onDismiss 를 받아야 해서 그대로 둬요): 웹(react-native-web)은 Modal 을 처음 그릴 때 body 맨 끝에 자리를 만들어서,
  // 앱 시작 때부터 그려 두면 나중에 연 시트(댓글 등) 밑에 깔려요. 열 때 새로 그려야 늘 맨 위에 떠요
  if (!mounted && Platform.OS === 'web') return null;
  return inParent ? null : node;
}

/**
 * 시트 안 맨 아래 칸(댓글 입력 줄 등)의 아래 여백: base + 홈 바 · 내비게이션 바 자리.
 * 시트 창 안에서 재야 맞아서 (안드로이드는 앱 화면 값이 0일 수 있어요) 이 칸을 시트 안에 그려요. 키보드가 올라오면 base 만.
 */
export function SheetBottom({ base, style, children }: { base: number; style?: StyleProp<ViewStyle>; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const kb = useKeyboardShown();
  return <View style={[style, { paddingBottom: base + (kb ? 0 : insets.bottom) }]}>{children}</View>;
}

/** 키보드가 떠 있을 때 아래 버튼 밑 여백 */
export const KB_FOOT_PAD = 10;

/**
 * 아이폰: 키보드 뒤(둥근 모서리 · 옆 틈)까지 시트 크림 바탕이 이어지게 — 시트 아래 끝과 키보드가 따로 떠 보이지 않게.
 * 시트(KeyboardAvoidingView) 바로 앞에 그려요. 안드로이드는 키보드만큼 화면이 줄어서 필요 없어요.
 */
const KB_FILL_OVERLAP = 48;
export function KeyboardFill() {
  const h = useKeyboardHeight();
  if (!h) return null;
  // 키보드 위끝보다 조금 더 올려 시트 뒤로 겹쳐 둬요 — 키보드 둥근 모서리 · 시트 아래 끝 사이에 1px 틈도 안 생기게 (겹친 부분은 시트가 덮어요)
  return <View pointerEvents="none" style={[styles.kbFill, { height: h + KB_FILL_OVERLAP }]} />;
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
  auto: { flexShrink: 1 },
  tall: { height: '84%' },
  // 손잡이: 위 12px + 막대 5px + 아래 4px(+ 내용 간격) — 이 칸 전체를 끌 수 있어요
  grabZone: { paddingTop: 12, alignItems: 'center' },
  grab: { width: 44, height: 5, borderRadius: 3, backgroundColor: '#CFC6B4' },
  footer: { flexDirection: 'row', gap: 10, paddingTop: 12, paddingHorizontal: 18, backgroundColor: Colors.cream, borderTopWidth: 1.5, borderColor: Colors.line },
  slot: { flex: 1 },
  kbFill: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: Colors.cream, borderLeftWidth: 2, borderRightWidth: 2, borderColor: Colors.ink },
});
