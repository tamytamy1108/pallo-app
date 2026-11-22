import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';

import { LgIcon } from './icons';
import { LgButton } from './lg-button';

/** 목록 위 제목 줄 (프로토타입 lgSec · .lg-sec): 제목 · 작은 글씨 · 오른쪽 버튼 */
export function Section({ title, sub, action }: { title: ReactNode; sub?: string; action?: { label: string; onPress: () => void } }) {
  return (
    <View style={styles.sec}>
      {typeof title === 'string' ? <PText style={styles.t}>{title}</PText> : title}
      {sub ? <PText style={styles.sub}>{sub}</PText> : null}
      <View style={styles.sp} />
      {action ? <LgButton label={action.label} height={34} fontSize={12.5} shadow={2} icon={<LgIcon name="plus" size={15} sw={2.8} />} onPress={action.onPress} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sec: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, marginBottom: -8 },
  t: { fontFamily: Font.body900, fontSize: 16, lineHeight: 24 },
  sub: { fontFamily: Font.body700, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  sp: { flex: 1 },
});
