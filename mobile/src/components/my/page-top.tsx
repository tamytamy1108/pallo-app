import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { sfx } from '@/lib/feedback';

import { LgIcon } from './icons';

/**
 * 마이에서 겹쳐 뜨는 화면의 위 줄 (프로토타입 mpTop · .lg-det.mp .dtop): 뒤로 ‹ · 제목 · 오른쪽 칸 · 아래 연한 선.
 * 맨 위 안전 영역까지 크림으로 채워요.
 */
export function PageTop({ title, right, onBack }: { title: string; right?: ReactNode; onBack?: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
      <Pressable
        onPress={() => {
          sfx('back');
          if (onBack) onBack();
          else if (router.canGoBack()) router.back();
          else router.replace('/my');
        }}
        accessibilityRole="button"
        accessibilityLabel="뒤로"
        style={styles.back}>
        <LgIcon name="back" size={22} />
      </Pressable>
      <PText style={styles.title} numberOfLines={1} accessibilityRole="header">
        {title}
      </PText>
      <View style={styles.sp} />
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingBottom: 8, backgroundColor: Colors.cream, borderBottomWidth: 1.5, borderColor: Colors.line, zIndex: 3 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { flexShrink: 1, fontFamily: Font.body900, fontSize: 15, lineHeight: 21 },
  sp: { flex: 1 },
});
