import type { ReactNode } from 'react';
import { View } from 'react-native';

import { PText } from '@/components/ui/text';

/**
 * 라운지 '챌린지' 탭 본문 (docs/pages/05-challenge.md). 라운지 화면이 이 컴포넌트를 그대로 넣어요.
 * - branch: 라운지 위에서 고른 지점 ('전체' 또는 지점 이름)
 * - header: 라운지의 지점 선택 버튼 — 서브 칩 줄 맨 앞에 넣어요
 * 담당: 챌린지. props 는 바꾸지 않아요(늘리기만).
 */
export function ChallengeTab({ branch, header }: { branch: string; header?: ReactNode }) {
  void branch;
  return (
    <View>
      {header}
      <PText>챌린지</PText>
    </View>
  );
}
