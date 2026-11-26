import { StyleSheet, View } from 'react-native';

import { keepAll } from '@/components/common/sheet-parts';
import { Checkbox } from '@/components/ui/field';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';

/**
 * 만들기 화면 아래 '운영 규칙' 상자 + 확인 체크 (동아리 만들기 · 챌린지 열기).
 * 호스트가 만들 때 경고 · 닫기 규칙을 알고 있게, 체크해야 올릴 수 있어요. 줄은 data/host-rules.
 */
export function HostRulesBox({ title, lines, checked, onChange }: { title: string; lines: string[]; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.box}>
      <PText style={styles.t}>{title}</PText>
      <View style={styles.list}>
        {lines.map((l, i) => (
          <View key={i} style={styles.row}>
            <PText style={styles.dot}>•</PText>
            <PText style={[styles.l, keepAll]}>{l}</PText>
          </View>
        ))}
      </View>
      <Checkbox checked={checked} onChange={onChange} label="운영 규칙을 확인했어요" size={20} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 2, borderColor: Colors.ink, borderRadius: 16, backgroundColor: Colors.white, paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  t: { fontFamily: Font.body900, fontSize: 13.5, lineHeight: 19 },
  list: { gap: 5 },
  row: { flexDirection: 'row', gap: 6 },
  dot: { fontFamily: Font.body900, fontSize: 12.5, lineHeight: 19, color: Colors.purple },
  l: { flex: 1, fontFamily: Font.body600, fontSize: 12.5, lineHeight: 19, color: Colors.inkSub },
});
