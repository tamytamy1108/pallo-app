/**
 * 글 칸을 누르면 키보드가 다 올라온 뒤 그 칸이 키보드 · 아래 버튼 위로 보이게 내려 줘요.
 * 폼 시트(SheetPage · Sheet)의 useKeepVisible 을 그대로 써요 (위로는 안 올리고, 이미 보이면 그대로).
 *   const reveal = useRevealOnFocus();
 *   <View ref={box} collapsable={false}><TextField onFocus={() => reveal(box.current)} /></View>
 */
import { Keyboard, Platform, type ViewInstance } from 'react-native';

import { useKeepVisible } from './form-scroll';

/** 키보드 알림이 안 오는 곳(하드웨어 키보드 등)에서도 한 번은 맞춰요 */
const FALLBACK_MS = 600;

export function useRevealOnFocus() {
  const keep = useKeepVisible();
  return (target: ViewInstance | null) => {
    if (!keep || Platform.OS === 'web') return;
    const run = () => keep(target);
    // 이미 키보드가 떠 있으면 (칸을 옮겨 다닐 때) 포커스 링이 그려진 뒤 바로
    if (Keyboard.isVisible()) {
      setTimeout(run, 60);
      return;
    }
    // 아이폰: 키보드가 올라오는 도중에 한 번(같이 움직이게) · 다 올라오면 한 번 더 (이미 보이면 그대로)
    const early =
      Platform.OS === 'ios'
        ? Keyboard.addListener('keyboardWillShow', (e) => {
            early?.remove();
            setTimeout(run, Math.max(0, (e.duration || 250) * 0.45));
          })
        : null;
    const sub = Keyboard.addListener('keyboardDidShow', () => {
      sub.remove();
      early?.remove();
      clearTimeout(fallback);
      // 시트가 키보드만큼 줄어든 뒤에 재요 (아이폰은 같은 프레임에 줄어서 바로)
      setTimeout(run, Platform.OS === 'ios' ? 0 : 40);
    });
    const fallback = setTimeout(() => {
      sub.remove();
      early?.remove();
      run();
    }, FALLBACK_MS);
  };
}
