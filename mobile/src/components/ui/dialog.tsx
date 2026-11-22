import { Image, type ImageSource } from 'expo-image';
import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SheetButton, SheetDesc } from '@/components/common/sheet-parts';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { sfx, type Sfx } from '@/lib/feedback';

import { Raised } from './raised';
import { Sheet } from './sheet';
import { PText } from './text';
import { ToastView, useToastLayer } from './toast';

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  /**
   * sheet: 넘겼을 때만 [취소][확인] 두 칸. 안 넘기면 프로토타입처럼 확인 버튼 하나 (바깥 누르기 · 끌어내리기로 취소).
   * card: 아래 두 번째 버튼 글자 (기본 '취소')
   */
  cancelLabel?: string;
  /** 지우기 · 그만하기처럼 되돌리기 어려운 행동 */
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  /**
   * sheet(기본): 라운지 · 마이 확인 시트 (프로토타입 '참여를 취소할까요?' · '로그아웃할까요?' — 제목 · 설명 · 아래 고정 버튼)
   * card: 학습 화면 확인 창 (프로토타입 .ls-m — 아래쪽 흰 카드 · 위에 캐릭터 · 노란 버튼 + 테두리 버튼)
   */
  variant?: 'sheet' | 'card';
  /** card 위 캐릭터 (기본 보라 팔로) — 원본 3D PNG 만 */
  image?: ImageSource | number;
  /** 확인을 누를 때 효과음 (예: 그만하기 'quit') */
  confirmSfx?: Sfx;
};

/**
 * 되돌릴 수 없는 행동 전에 묻는 확인 창 (참여 취소 · 동아리 나가기 · 신청 취소 · 학습 그만두기 · 로그아웃 · 탈퇴).
 * 담당: 공통 부품. props 는 바꾸지 않아요(늘리기만).
 */
export function ConfirmDialog(props: ConfirmDialogProps) {
  return props.variant === 'card' ? <ConfirmCard {...props} /> : <ConfirmSheet {...props} />;
}

function ConfirmSheet({ open, title, message, confirmLabel, cancelLabel, destructive = false, onConfirm, onCancel, confirmSfx }: ConfirmDialogProps) {
  const confirm = () => {
    if (confirmSfx) sfx(confirmSfx);
    onConfirm();
  };
  // 버튼 하나: 되돌릴 수 없는 쪽은 흰 버튼(.lg-btn.wh), 아니면 노랑. 두 개: [취소 흰색][확인]
  const footer = cancelLabel ? (
    <>
      <SheetButton label={cancelLabel} tone="white" onPress={onCancel} />
      <SheetButton label={confirmLabel} tone={destructive ? 'bad' : 'yellow'} onPress={confirm} />
    </>
  ) : (
    <SheetButton label={confirmLabel} tone={destructive ? 'white' : 'yellow'} size="foot" onPress={confirm} />
  );
  return (
    <Sheet open={open} onClose={onCancel} title={title} label="확인" footer={footer}>
      {message ? <SheetDesc>{message}</SheetDesc> : null}
    </Sheet>
  );
}

const DEFAULT_IMAGE = require('@/assets/characters/c-purple-standard-3d.png');

/** 프로토타입 lsModal(): 어두운 바탕 · 아래쪽 흰 카드(둥글기 26 · 아래 그림자 6px) · 위로 삐져나온 캐릭터 */
function ConfirmCard({ open, title, message, confirmLabel, cancelLabel = '취소', destructive = false, onConfirm, onCancel, image = DEFAULT_IMAGE, confirmSfx }: ConfirmDialogProps) {
  const insets = useSafeAreaInsets();
  const still = useReducedMotion();
  const showToastHere = useToastLayer(open);
  const fade = useSharedValue(0);

  useEffect(() => {
    // @keyframes lsMIn { from { opacity: 0 } } .18s — 닫힐 땐 바로 사라져요 (프로토타입은 바로 지워요)
    fade.set(open ? withTiming(1, { duration: still ? 0 : 180 }) : 0);
  }, [open, still, fade]);

  const anim = useAnimatedStyle(() => ({ opacity: fade.get() }));

  // 되돌릴 수 없는 확인(그만하기)은 아래 테두리 버튼, 머무는 쪽(계속하기)이 노란 버튼
  const yes = destructive ? { label: cancelLabel, run: onCancel } : { label: confirmLabel, run: onConfirm };
  const no = destructive ? { label: confirmLabel, run: onConfirm } : { label: cancelLabel, run: onCancel };
  const press = (run: () => void, isConfirm: boolean, base: Sfx) => {
    sfx(isConfirm && confirmSfx ? confirmSfx : base);
    run();
  };

  return (
    <Modal visible={open} transparent animationType="none" onRequestClose={onCancel} statusBarTranslucent navigationBarTranslucent>
      <Animated.View style={[styles.root, { paddingBottom: 16 + insets.bottom }, anim]}>
        <View style={styles.cardWrap}>
          <View pointerEvents="none" style={styles.cardShadow} />
          <View style={styles.card} accessibilityRole="alert" accessibilityViewIsModal accessibilityLabel={title}>
          <Image source={image} style={styles.img} contentFit="contain" accessible={false} />
          <PText style={styles.title}>{title}</PText>
          {message ? <PText style={styles.msg}>{message}</PText> : null}
          <Pressable onPress={() => press(yes.run, !destructive, 'big')} accessibilityRole="button" accessibilityLabel={yes.label} style={styles.full}>
            {({ pressed }) => (
              <Raised radius={30} pressed={pressed} style={styles.full}>
                <View style={[styles.btn, styles.btnYes]}>
                  <PText style={styles.btnText}>{yes.label}</PText>
                </View>
              </Raised>
            )}
          </Pressable>
          <Pressable
            onPress={() => press(no.run, destructive, 'back')}
            accessibilityRole="button"
            accessibilityLabel={no.label}
            style={({ pressed }) => [styles.full, pressed && styles.pressed]}>
            <View style={[styles.btn, styles.btnNo]}>
              <PText style={styles.noText}>{no.label}</PText>
            </View>
          </Pressable>
          </View>
        </View>
      </Animated.View>
      {showToastHere ? <ToastView /> : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 16, backgroundColor: 'rgba(30,26,43,0.45)' },
  // .ls-mc { padding: 0 18px 12px; border-radius: 26px; box-shadow: 0 6px 0 ink }
  cardWrap: { marginBottom: 6 },
  cardShadow: { position: 'absolute', left: 0, right: 0, top: 6, bottom: -6, borderRadius: 26, backgroundColor: Colors.ink },
  card: { alignItems: 'center', gap: 6, paddingHorizontal: 18, paddingBottom: 12, borderWidth: 2, borderColor: Colors.ink, borderRadius: 26, backgroundColor: Colors.white },
  img: { width: 104, height: 104, marginTop: -52 },
  title: { fontFamily: Font.body900, fontSize: 20, lineHeight: 28, textAlign: 'center' },
  msg: { marginBottom: 10, fontFamily: Font.body700, fontSize: 14, lineHeight: 21, color: Colors.inkSub, textAlign: 'center' },
  full: { alignSelf: 'stretch' },
  btn: { height: 60, borderRadius: 30, borderWidth: 2, borderColor: Colors.ink, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  btnYes: { backgroundColor: Colors.yellow },
  btnText: { fontFamily: Font.body900, fontSize: 17, lineHeight: 24 },
  btnNo: { backgroundColor: 'transparent' },
  noText: { fontFamily: Font.body800, fontSize: 15, lineHeight: 21 },
  pressed: { transform: [{ scale: 0.98 }] },
});
