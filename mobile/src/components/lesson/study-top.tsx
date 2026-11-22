import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { CloseIcon } from '@/components/lesson/icons';
import { SoundButton } from '@/components/lesson/lesson-top';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';

/**
 * 단계 화면 위 줄: 왼쪽 X · 가운데 제목 · 오른쪽 소리 버튼 (프로토타입 #study .st-top · setStudyTop(title, inStep)).
 * 스피킹 퀴즈처럼 진행 막대가 있으면 제목 자리에 막대 · 숫자가 와요 (.st-ttl.prog) — center 로 넘겨요.
 */
export function StudyTop({ title, center, soundOff, onToggleSound, onClose }: { title?: string; center?: ReactNode; soundOff: boolean; onToggleSound: () => void; onClose: () => void }) {
  return (
    <View style={styles.top}>
      <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="그만하고 과 화면으로" style={styles.iconBtn} hitSlop={6}>
        <CloseIcon />
      </Pressable>
      <View style={styles.mid}>
        {center ?? (
          <PText style={styles.title} numberOfLines={1} accessibilityRole="header">
            {title}
          </PText>
        )}
      </View>
      <SoundButton off={soundOff} onPress={onToggleSound} />
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  mid: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  title: { fontFamily: Font.body900, fontSize: 14, lineHeight: 20, textAlign: 'center' },
});
