import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { Pressable } from '@/components/ui/pressable';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { SPRING } from '@/lib/motion';
import { createStore } from '@/lib/store';

import { PText } from './text';

export type ToastAction = { label: string; onPress: () => void };
type ToastMsg = { message: string; action?: ToastAction; key: number };

/** 지금 토스트 (shown=false 여도 사라지는 움직임 동안 글은 남겨 둬요) */
const toastStore = createStore<{ msg: ToastMsg | null; shown: boolean }>({ msg: null, shown: false });
// React Compiler 가 x.use() 를 React use() 로 보고 건너뛰지 않게, 저장소 훅은 useXxx 이름으로 불러요
const useToastState = toastStore.use;
let seq = 0;
let timer: ReturnType<typeof setTimeout> | undefined;

const hideToast = () => toastStore.set((s) => ({ ...s, shown: false }));

/**
 * 잠깐 뜨는 알림 (프로토타입 toast(msg, action): 위쪽 · 잉크 바탕 · 노랑 그림자 · 2.4초, 행동 버튼이 있으면 3.8초).
 * 어디서든 showToast('저장했어요') 처럼 불러요. ToastHost 는 맨 바깥(_layout)에 한 번만 있어요.
 * 담당: 공통 부품. 함수 이름 · 인자는 바꾸지 않아요.
 */
export function showToast(message: string, action?: ToastAction) {
  clearTimeout(timer);
  toastStore.set({ msg: { message, action, key: ++seq }, shown: true });
  timer = setTimeout(hideToast, action ? 3800 : 2400);
  // 화면 읽기: 토스트 글을 바로 읽어 줘요
  if (Platform.OS !== 'web') AccessibilityInfo.announceForAccessibility(message);
}

/*
 * 시트 · 확인 창은 RN Modal 이라 네이티브에서는 앱 위에 따로 뜬 창이에요. 맨 바깥 토스트가 그 아래 가려지지 않게,
 * 모달이 열려 있으면 맨 위 모달 안에 토스트를 그려요 (showToast 쓰는 쪽은 신경 쓰지 않아도 돼요).
 */
const layerStore = createStore<number[]>([]);
const useLayers = layerStore.use;
let layerSeq = 0;

/** 모달(Sheet · ConfirmDialog)이 부르는 훅: 떠 있는 동안 등록하고, 맨 위면 true → 그 안에 <ToastView /> 를 그려요 */
export function useToastLayer(visible: boolean) {
  const [id] = useState(() => ++layerSeq);
  useEffect(() => {
    if (!visible) return;
    layerStore.set((s) => [...s, id]);
    return () => layerStore.set((s) => s.filter((x) => x !== id));
  }, [visible, id]);
  return useLayers((s) => s.length > 0 && s[s.length - 1] === id);
}

/** 맨 바깥(_layout)에 한 번만 — 열린 모달이 없을 때 여기서 그려요 */
export function ToastHost() {
  const free = useLayers((s) => s.length === 0);
  return free ? <ToastView /> : null;
}

const HIDDEN_Y = -120;

/** 토스트 모양 (프로토타입 .toast · .toast-go · 왼쪽 노랑 동그라미 체크) */
export function ToastView() {
  const insets = useSafeAreaInsets();
  const { msg, shown } = useToastState();
  const still = useReducedMotion();
  // 이미 떠 있는 토스트를 다른 층(모달 ↔ 바깥)에서 이어 그릴 땐 처음부터 보이게
  const y = useSharedValue(shown ? 0 : HIDDEN_Y);
  const fade = useSharedValue(shown ? 1 : 0);
  const key = msg?.key;

  useEffect(() => {
    // .toast { transition: transform .5s var(--spring), opacity .3s }
    y.set(withTiming(shown ? 0 : HIDDEN_Y, { duration: still ? 0 : 500, easing: SPRING }));
    fade.set(withTiming(shown ? 1 : 0, { duration: still ? 0 : 300 }));
  }, [shown, key, still, y, fade]);

  const anim = useAnimatedStyle(() => ({ opacity: fade.get(), transform: [{ translateY: y.get() }] }));

  if (!msg) return null;
  const action = msg.action;
  return (
    <Animated.View pointerEvents="box-none" style={[styles.wrap, { top: insets.top + 10 }, anim]}>
      {/* box-shadow: 4px 4px 0 yellow */}
      <View pointerEvents="none" style={styles.shadow} />
      <View pointerEvents="box-none" style={styles.toast} accessibilityLiveRegion="polite" accessibilityRole="alert">
        <View style={styles.ico}>
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={Colors.ink} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round">
            <Path d="m5 12 5 5 9-10" />
          </Svg>
        </View>
        <PText color={Colors.white} style={styles.text}>
          {msg.message}
        </PText>
        {action ? (
          <Pressable
            onPress={() => {
              clearTimeout(timer);
              hideToast();
              action.onPress();
            }}
            accessibilityRole="button"
            accessibilityLabel={action.label}
            hitSlop={8}
            style={({ pressed }) => [styles.go, pressed && styles.goPressed]}>
            <PText color={Colors.ink} style={styles.goText}>
              {action.label}
            </PText>
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, zIndex: 60 },
  shadow: { position: 'absolute', top: 4, left: 4, right: -4, bottom: -4, borderRadius: 18, backgroundColor: Colors.yellow },
  toast: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 18, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.ink },
  ico: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.yellow, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, fontFamily: Font.body800, fontSize: 14, lineHeight: 20 },
  go: { height: 32, paddingHorizontal: 12, borderRadius: 16, backgroundColor: Colors.yellow, justifyContent: 'center' },
  goPressed: { transform: [{ scale: 0.96 }] },
  goText: { fontFamily: Font.body900, fontSize: 13, lineHeight: 18 },
});
