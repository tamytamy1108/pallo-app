import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';

import { PText } from './text';

export type ToastAction = { label: string; onPress: () => void };
type ToastMsg = { message: string; action?: ToastAction; key: number };

let push: ((m: ToastMsg) => void) | null = null;
let seq = 0;

/**
 * 잠깐 뜨는 알림 (프로토타입 toast(msg, action): 위쪽 · 잉크 바탕 · 2.4초, 행동 버튼이 있으면 3.8초).
 * 어디서든 showToast('저장했어요') 처럼 불러요. ToastHost 는 맨 바깥(_layout)에 한 번만 있어요.
 * 담당: 공통 부품 — 모양 · 움직임은 프로토타입대로 다듬어요. 함수 이름 · 인자는 바꾸지 않아요.
 */
export function showToast(message: string, action?: ToastAction) {
  push?.({ message, action, key: ++seq });
}

export function ToastHost() {
  const insets = useSafeAreaInsets();
  const [msg, setMsg] = useState<ToastMsg | null>(null);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    push = (m) => {
      setMsg(m);
      clearTimeout(timer);
      timer = setTimeout(() => setMsg(null), m.action ? 3800 : 2400);
    };
    return () => {
      push = null;
      clearTimeout(timer);
    };
  }, []);
  if (!msg) return null;
  return (
    <View pointerEvents="box-none" style={StyleSheet.flatten([styles.wrap, { top: insets.top + 6 }])}>
      <View style={styles.toast} accessibilityLiveRegion="polite" accessibilityRole="alert">
        <PText variant="bodyStrong" color={Colors.white} style={styles.text}>
          {msg.message}
        </PText>
        {msg.action ? (
          <Pressable
            onPress={() => {
              msg.action?.onPress();
              setMsg(null);
            }}
            accessibilityRole="button"
            hitSlop={8}>
            <PText variant="bodyStrong" color={Colors.yellow}>
              {msg.action.label}
            </PText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, zIndex: 60 },
  toast: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, paddingHorizontal: 16, borderRadius: 18, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.ink },
  text: { flex: 1 },
});
