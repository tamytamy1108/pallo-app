/**
 * 키보드가 올라와 있는지. 키보드가 있으면 아래 안전 영역(홈 바 자리) 여백은 빼요
 * — 키보드가 그 자리를 덮으니까, 그대로 두면 입력칸과 키보드 사이가 떠요.
 */
import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';
import { useAnimatedKeyboard, useAnimatedStyle } from 'react-native-reanimated';

export function useKeyboardShown() {
  // 키보드가 이미 떠 있을 때 그려지는 칸(시트 등)도 처음부터 맞는 값으로
  const [shown, setShown] = useState(() => Keyboard.isVisible());
  useEffect(() => {
    // iOS 는 올라오기 시작할 때(Will), 안드로이드는 다 올라온 뒤(Did)만 알려 줘요.
    // iOS 도 Did 를 한 번 더 들어요: Keyboard.isVisible() 은 Did 알림에서야 바뀌어서, 키보드가 내려가는 중(Will ~ Did)에 그려진 칸은
    // '떠 있음'으로 시작한 채 Will 알림을 놓쳐요 → 키보드가 없는데도 아래 버튼 칸이 홈 바 여백을 빼서 화면 끝에 잘렸어요 (2026-11-26)
    const on = () => setShown(true);
    const off = () => setShown(false);
    const subs =
      Platform.OS === 'ios'
        ? [Keyboard.addListener('keyboardWillShow', on), Keyboard.addListener('keyboardDidShow', on), Keyboard.addListener('keyboardWillHide', off), Keyboard.addListener('keyboardDidHide', off)]
        : [Keyboard.addListener('keyboardDidShow', on), Keyboard.addListener('keyboardDidHide', off)];
    return () => subs.forEach((s) => s.remove());
  }, []);
  return shown;
}

/**
 * 화면 맨 아래에 붙은 입력 줄을 키보드 위로 올릴 만큼 (내려가 있으면 0).
 * 아이폰만: 키보드가 화면을 덮어요. 안드로이드는 키보드만큼 화면이 줄어들어서 0 이에요 (더하면 두 번 올라가요).
 */
export function useKeyboardHeight() {
  const [h, setH] = useState(() => (Platform.OS === 'ios' && Keyboard.isVisible() ? (Keyboard.metrics()?.height ?? 0) : 0));
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', (e) => setH(e.endCoordinates.height));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setH(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return h;
}

/**
 * 떠 있는 창(시트 · 팝업)이 열릴 때: 뒤 화면 칸에서 올라온 키보드가 있으면 내려요.
 * 아이폰은 창이 떠도 뒤 화면 키보드가 그대로 남아 창 아래(확인 버튼 등)를 덮고, 새로 뜬 창은 그 키보드를 몰라서 비켜 주지 못해요.
 * 창 안 칸이 스스로 포커스(autoFocus)하는 경우는 아직 키보드가 안 떠 있어서 건드리지 않아요.
 */
export function dismissKeyboardBehind() {
  if (Keyboard.isVisible()) Keyboard.dismiss();
}

/**
 * 아이폰: 키보드가 올라오는 움직임에 맞춰 같은 프레임에 따라 올라가요 (UI 스레드 · reanimated).
 * KeyboardAvoidingView 는 키보드 알림이 JS 로 온 다음에 움직임을 시작해서, 앱이 바쁘면 칸이 키보드보다 늦게 따라왔어요 (2026-11-26).
 * 시트 · 화면 맨 바깥 칸(아래에 붙은 시트)에 style 로 주면 키보드 높이만큼 아래 여백이 생겨요.
 * 안드로이드는 키보드만큼 창이 줄어들어 0 이에요 (KeyboardAvoidingView 를 그대로 써요).
 */
const IOS = Platform.OS === 'ios';
/** base: 키보드가 없을 때도 늘 두는 아래 여백 (키보드가 오면 그 위에 더해요) */
export function useKeyboardLiftStyle(base = 0) {
  const kb = useAnimatedKeyboard();
  return useAnimatedStyle(() => ({ paddingBottom: base + (IOS ? Math.max(0, kb.height.value) : 0) }));
}

/** 키보드 뒤를 채우는 판 높이 (키보드 높이 + 겹침) — useKeyboardLiftStyle 과 같은 프레임에 움직여요 */
export function useKeyboardFillStyle(overlap: number) {
  const kb = useAnimatedKeyboard();
  return useAnimatedStyle(() => ({ height: IOS && kb.height.value > 0 ? kb.height.value + overlap : 0 }));
}

/**
 * 키보드가 올라오기 시작할 때(아이폰 Will) 알려 준 '다 올라왔을 때의 위끝'.
 * Keyboard.metrics() 는 다 올라온 뒤(Did)에야 바뀌어서, 올라오는 중에 재면 옛 값이에요.
 */
let pendingTop: number | null = null;
if (Platform.OS === 'ios') {
  Keyboard.addListener('keyboardWillShow', (e) => (pendingTop = e.endCoordinates.screenY));
  Keyboard.addListener('keyboardWillHide', () => (pendingTop = null));
}
/** 키보드 위끝 (화면 기준). 올라오는 중이면 다 올라왔을 때 값. 없으면 Infinity */
export function keyboardTopY() {
  if (Platform.OS === 'web') return Infinity;
  return pendingTop ?? Keyboard.metrics()?.screenY ?? Infinity;
}
