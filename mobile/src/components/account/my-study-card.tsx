import { View } from 'react-native';

import { PText } from '@/components/ui/text';

/**
 * 마이 화면의 '내 스터디' 카드 (남은 횟수 고리 · 이용권 · 팀 시간표 · [연기 · 팀 · 지점 변경]) — 마이 화면이 그대로 넣어요.
 * 담당: 마이 B. props 는 바꾸지 않아요(늘리기만).
 */
export function MyStudyCard() {
  return (
    <View>
      <PText variant="title">내 스터디</PText>
    </View>
  );
}
