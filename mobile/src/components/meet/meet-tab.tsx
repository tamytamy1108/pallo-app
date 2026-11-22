import type { ReactNode } from 'react';
import { View } from 'react-native';

import { PText } from '@/components/ui/text';

/**
 * 라운지 '번개 · 동아리' 탭 본문 (docs/pages/04-lounge.md '번개 · 동아리'). 라운지 화면이 이 컴포넌트를 그대로 넣어요.
 * - branch: 라운지 위에서 고른 지점 ('전체' 또는 지점 이름)
 * - header: 라운지의 지점 선택 버튼 — 서브 칩 줄(전체 n · 번개 n · 동아리 n) 맨 앞에 넣어요
 * - region: 추천 탭 작은 지도에서 지역을 눌러 들어왔을 때 (없으면 전체)
 * 담당: 번개 · 동아리 · 이벤트. props 는 바꾸지 않아요(늘리기만).
 */
export function MeetTab({ branch, header, region }: { branch: string; header?: ReactNode; region?: string }) {
  void branch;
  void region;
  return (
    <View>
      {header}
      <PText>번개 · 동아리</PText>
    </View>
  );
}
