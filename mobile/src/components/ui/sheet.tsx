import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Radius } from '@/constants/theme';

import { PText } from './text';

export type SheetProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** 아래 고정 행동 버튼 자리 (신청하기 · 보내기 등) */
  footer?: ReactNode;
};

/**
 * 아래에서 올라오는 시트 (프로토타입 .sheet: 크림 · 잉크 2px · 위 모서리 28px · 손잡이).
 * 담당: 공통 부품 — 모양 · 움직임은 프로토타입대로 다듬어요. props 는 바꾸지 않아요(늘리기만).
 */
export function Sheet({ open, onClose, title, children, footer }: SheetProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Pressable style={styles.dim} onPress={onClose} accessibilityRole="button" accessibilityLabel="닫기" />
        <View style={StyleSheet.flatten([styles.sheet, { paddingBottom: 30 + insets.bottom }])}>
          <View style={styles.grab} />
          {title ? (
            <PText variant="title" style={styles.title}>
              {title}
            </PText>
          ) : null}
          <ScrollView bounces={false} style={styles.body}>
            {children}
          </ScrollView>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  dim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(30,26,43,0.45)' },
  sheet: { maxHeight: '88%', backgroundColor: Colors.cream, borderWidth: 2, borderBottomWidth: 0, borderColor: Colors.ink, borderTopLeftRadius: Radius.sheet, borderTopRightRadius: Radius.sheet, paddingTop: 12, paddingHorizontal: 18 },
  grab: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: '#D6CDB9', marginBottom: 14 },
  title: { marginBottom: 12 },
  body: { flexGrow: 0 },
  footer: { flexDirection: 'row', gap: 10, paddingTop: 14 },
});
