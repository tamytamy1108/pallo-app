import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { keepAll } from '@/components/common/sheet-parts';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';

import { Icon, type IconName } from '../icons';

/**
 * 가입 전 흐린 미리보기 + 잠금 칸 (프로토타입 .lg-peek · .lg-lock): 내용이 55% 부터 아래로 흐려지고,
 * 점선 칸이 26px 겹쳐 올라와요.
 */
export function Peek({ children, icon, title, desc }: { children: ReactNode; icon: IconName; title: string; desc: string }) {
  return (
    <View style={{ marginTop: 14 }}>
      <View pointerEvents="none">
        {children}
        <LinearGradient colors={['rgba(251,246,234,0)', 'rgba(251,246,234,1)']} locations={[0.55, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />
      </View>
      <View style={styles.lock}>
        <Icon name={icon} size={26} />
        <PText style={styles.lockB}>{title}</PText>
        <PText style={[styles.lockS, keepAll]}>{desc}</PText>
      </View>
    </View>
  );
}

/** 게시판 칩 줄 · 정렬 칩 (.lg-csort) */
export const chipStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, marginTop: 14 },
  b: { height: 32, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: Colors.line, backgroundColor: Colors.white, justifyContent: 'center' },
  on: { borderWidth: 2, borderColor: Colors.ink },
  t: { fontFamily: Font.body800, fontSize: 12.5, lineHeight: 17, color: Colors.inkSub },
  tOn: { fontFamily: Font.body900, color: Colors.ink },
});

const styles = StyleSheet.create({
  lock: { marginTop: -26, alignItems: 'center', gap: 6, paddingVertical: 30, paddingHorizontal: 18, borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.ink, borderRadius: 18, backgroundColor: Colors.cream },
  lockB: { fontFamily: Font.body900, fontSize: 15, lineHeight: 21, textAlign: 'center' },
  lockS: { fontFamily: Font.body700, fontSize: 13, lineHeight: 19, color: Colors.inkSub, textAlign: 'center' },
});
