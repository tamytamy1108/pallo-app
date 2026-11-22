import { View } from 'react-native';

import { PText } from '@/components/ui/text';

/**
 * 마이 화면의 PRO'S NOTE 카드 (최신 노트 · 새 노트 n · 모두 보기 ›) — 마이 화면이 그대로 넣어요.
 * 담당: 마이 B. props 는 바꾸지 않아요(늘리기만).
 */
export function ProNoteCard() {
  return (
    <View>
      <PText variant="title">PRO&apos;S NOTE</PText>
    </View>
  );
}
