import { Modal, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { PText } from '@/components/ui/text';
import { Colors } from '@/constants/theme';

export type CelebrateResult = {
  /** 최종 점수: 맞힌 수 / 전체 */
  correct: number;
  total: number;
  /** 이번에 받은 포인트 (단계를 처음 끝낼 때만 +5 / +10 / +15) */
  points: number;
  /** 오늘 목표 (학습 n개 중 몇 개) */
  goalDone: number;
  goalTotal: number;
  /** 과를 다 끝냈으면 노랑 큰 축하 */
  unitComplete?: boolean;
};

/**
 * 완료(축하) 화면 (docs/pages/03-lesson.md '완료(축하) 화면'). 레슨 A · B가 같이 써요.
 * onNext 가 없으면(마지막 단계) 노랑 버튼만 꽉 차게.
 * 담당: 레슨 A — 캐릭터 춤 · 빛줄기 · 컨페티 · 숫자 카드 · 팡파르를 프로토타입대로 채워요. props 는 바꾸지 않아요(늘리기만).
 */
export function Celebrate({ visible, result, onHome, onNext }: { visible: boolean; result: CelebrateResult; onHome: () => void; onNext?: () => void }) {
  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onHome}>
      <View style={styles.root}>
        <PText variant="display">완벽해요!</PText>
        <PText>
          {result.correct} / {result.total} · +{result.points}P
        </PText>
        <View style={styles.row}>
          <Button label="홈" variant="secondary" onPress={onHome} />
          {onNext ? <Button label="이어서 하기" onPress={onNext} /> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, backgroundColor: Colors.cream },
  row: { flexDirection: 'row', gap: 10 },
});
