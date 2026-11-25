/**
 * 키보드가 올라와 있는지. 키보드가 있으면 아래 안전 영역(홈 바 자리) 여백은 빼요
 * — 키보드가 그 자리를 덮으니까, 그대로 두면 입력칸과 키보드 사이가 떠요.
 */
import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

export function useKeyboardShown() {
  // 키보드가 이미 떠 있을 때 그려지는 칸(시트 등)도 처음부터 맞는 값으로
  const [shown, setShown] = useState(() => Keyboard.isVisible());
  useEffect(() => {
    // iOS 는 올라오기 시작할 때(Will), 안드로이드는 다 올라온 뒤(Did)만 알려 줘요
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setShown(true));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setShown(false));
    return () => {
      show.remove();
      hide.remove();
    };
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
