import { StyleSheet, View } from 'react-native';

import { PText } from '@/components/ui/text';
import { Colors } from '@/constants/theme';

/**
 * 정답 · 오답 띠: 아래에서 차례로 떠오르는 띠 — 팔로(정답 노랑 · 오답 보라) + 큰 글씨 리액션 + 한국어 뜻 + 듣기.
 * 레슨 A · B가 같이 써요. 담당: 레슨 A (프로토타입 모양 · 움직임 · 소리로 채워요). props 는 바꾸지 않아요(늘리기만).
 */
export function FeedbackBand({ kind, en, ko, soundOff = false }: { kind: 'good' | 'bad' | 'retry'; en: string; ko: string; soundOff?: boolean }) {
  void soundOff;
  return (
    <View style={StyleSheet.flatten([styles.band, kind === 'good' ? styles.good : styles.bad])} accessibilityLiveRegion="polite">
      <PText variant="title">{en}</PText>
      <PText>{ko}</PText>
    </View>
  );
}

const styles = StyleSheet.create({
  band: { padding: 16, borderRadius: 20, borderWidth: 2, borderColor: Colors.ink, gap: 4 },
  good: { backgroundColor: '#FFF6B8' },
  bad: { backgroundColor: Colors.lavender },
});
