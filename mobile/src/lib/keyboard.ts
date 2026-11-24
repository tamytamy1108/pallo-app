/**
 * 키보드가 올라와 있는지. 키보드가 있으면 아래 안전 영역(홈 바 자리) 여백은 빼요
 * — 키보드가 그 자리를 덮으니까, 그대로 두면 입력칸과 키보드 사이가 떠요.
 */
import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function useKeyboardShown() {
  const [shown, setShown] = useState(false);
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
  const [h, setH] = useState(0);
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
 * 화면 맨 아래 고정 칸(버튼 · 입력 줄)의 아래 여백: 키보드가 올라오면 칸째로 키보드 위로 (아이폰).
 * 키보드가 없으면 base + 홈 바 자리. 위 스크롤 칸은 그만큼 줄어서, 누른 칸은 KeyboardScrollView 가 보이게 내려요.
 */
export function useFootPadding(base: number, { gap = 10, homeBar = true }: { gap?: number; homeBar?: boolean } = {}) {
  const kb = useKeyboardHeight();
  const insets = useSafeAreaInsets();
  return kb ? kb + gap : base + (homeBar ? insets.bottom : 0);
}
