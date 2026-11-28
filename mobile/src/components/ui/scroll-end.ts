import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScrollEnd } from '@/constants/theme';

/** 탭 없는 화면(쌓이는 페이지)의 스크롤 맨 아래 여백 — 홈 줄(아래 안전 영역) 위로 ScrollEnd 만큼. 모든 화면이 같아요. */
export function useScrollEndPad() {
  const insets = useSafeAreaInsets();
  return insets.bottom + ScrollEnd;
}
