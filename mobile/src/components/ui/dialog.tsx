import { Modal, StyleSheet, View } from 'react-native';

import { Colors, Radius } from '@/constants/theme';

import { Button } from './button';
import { PText } from './text';

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** 지우기 · 그만하기처럼 되돌리기 어려운 행동 */
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * 가운데 확인 창 (그만하기 · 신청 취소 · 삭제 등).
 * 담당: 공통 부품 — 모양은 프로토타입대로 다듬어요. props 는 바꾸지 않아요(늘리기만).
 */
export function ConfirmDialog({ open, title, message, confirmLabel, cancelLabel = '취소', destructive = false, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <View style={styles.root}>
        <View style={styles.card} accessibilityRole="alert">
          <PText variant="title" style={styles.center}>
            {title}
          </PText>
          {message ? (
            <PText color={Colors.inkSub} style={styles.center}>
              {message}
            </PText>
          ) : null}
          <View style={styles.row}>
            <View style={styles.slot}>
              <Button label={cancelLabel} variant="secondary" wide onPress={onCancel} />
            </View>
            <View style={styles.slot}>
              <Button label={confirmLabel} variant={destructive ? 'dark' : 'primary'} wide onPress={onConfirm} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: 'rgba(30,26,43,0.45)' },
  card: { width: '100%', maxWidth: 360, gap: 10, padding: 22, borderRadius: Radius.card, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.cream },
  center: { textAlign: 'center' },
  row: { flexDirection: 'row', gap: 10, marginTop: 8 },
  slot: { flex: 1 },
});
