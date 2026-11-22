import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { Linking, Modal, Platform, StyleSheet, View } from 'react-native';
import Animated, { css, cubicBezier, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { Pressable } from '@/components/ui/pressable';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { haptic, sfx } from '@/lib/feedback';
import { EASE } from '@/lib/motion';

import { CHECK_PATH, CLOSE_PATH, LineIcon } from './icons';

/**
 * QR 출석 스캐너 (프로토타입 #scanner · openScanner).
 * 폰: 카메라로 입구 QR 을 읽어요 (처음 열 때 카메라 권한을 물어요).
 * 웹: 프로토타입처럼 1.8초 뒤 인식 → 0.8초 뒤 출석 완료로 흉내 내요.
 */
const FRAME = 250;
const SPRING_CSS = cubicBezier(0.2, 0.9, 0.3, 1.3);

export function QrScanner({ open, summaryText, onClose, onChange, onScanned }: { open: boolean; summaryText: string; onClose: () => void; onChange: () => void; onScanned: (qr: string) => void }) {
  const insets = useSafeAreaInsets();
  const still = useReducedMotion();
  const native = Platform.OS !== 'web';
  const [perm, askPerm] = useCameraPermissions();
  const [found, setFound] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const p = useSharedValue(0);
  // 타이머가 늦게 불러도 늘 최신 콜백을 쓰게
  const done = useRef(onScanned);
  useEffect(() => {
    done.current = onScanned;
  }, [onScanned]);

  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  // 열 때: 처음 상태로 (렌더 중에 이전 값과 비교해 맞춰요)
  const [seen, setSeen] = useState(open);
  if (open !== seen) {
    setSeen(open);
    if (open) setFound(false);
  }

  // 페이드 인(.35초) + 살짝 큰 데서 제자리로(.45초)
  useEffect(() => {
    clear();
    if (!open) return;
    p.set(0);
    p.set(withTiming(1, { duration: still ? 0 : 450, easing: EASE }));
    if (!native) {
      // 웹 흉내: 1.8초 뒤 인식 → 2.6초에 출석
      timers.current.push(setTimeout(() => recognize('PALLO-WEB-DEMO'), 1800));
    }
    return clear;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // 폰: 권한을 아직 안 물었으면 물어요
  useEffect(() => {
    if (open && native && perm && !perm.granted && perm.canAskAgain) void askPerm();
  }, [open, native, perm, askPerm]);

  function recognize(qr: string) {
    setFound(true);
    sfx('correct');
    haptic('success');
    timers.current.push(setTimeout(() => done.current(qr), 800));
  }

  const onBarcode = (r: BarcodeScanningResult) => {
    if (found) return;
    recognize(r.data);
  };

  const fade = useAnimatedStyle(() => ({ opacity: Math.min(p.get() * 1.3, 1), transform: [{ scale: 1.06 - 0.06 * p.get() }] }));
  const camOn = native && !!perm?.granted;
  const blocked = native && !!perm && !perm.granted && !perm.canAskAgain;

  return (
    <Modal visible={open} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[styles.root, fade]} accessibilityViewIsModal accessibilityLabel="QR 출석">
        {camOn ? (
          <>
            <CameraView style={StyleSheet.absoluteFill} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={found ? undefined : onBarcode} />
            <View style={[StyleSheet.absoluteFill, styles.tint]} pointerEvents="none" />
          </>
        ) : (
          <>
            <Blob left={-60} top={160} size={260} color="#3A3350" />
            <Blob right={-80} bottom={140} size={280} color="#4A3A2A" warm />
          </>
        )}

        <View style={StyleSheet.flatten([styles.top, { paddingTop: Math.max(insets.top, 24) - 4 }])}>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="닫기" style={styles.x}>
            <LineIcon d={CLOSE_PATH} size={18} width={2.6} color={Colors.white} />
          </Pressable>
          <View style={styles.pill}>
            <PText style={styles.pillText}>{summaryText}</PText>
          </View>
          <View style={styles.spacer} />
        </View>

        <PText style={styles.title} color={Colors.white} accessibilityLiveRegion="polite">
          {blocked ? '카메라 권한이 필요해요' : found ? 'QR 인식 완료!' : '입구의 PALLO QR을 비춰주세요'}
        </PText>
        <PText style={styles.sub} color="#B9B3C9">
          {blocked ? '설정에서 카메라를 허용해 주세요' : found ? '출석을 기록하고 있어요' : '화면 안에 QR이 들어오면 자동으로 찍혀요'}
        </PText>

        <Frame found={found} still={still} />
        {blocked && (
          <Pressable onPress={() => void Linking.openSettings()} accessibilityRole="button" style={styles.settings}>
            <PText style={styles.settingsText} color={Colors.ink}>
              설정 열기
            </PText>
          </Pressable>
        )}

        <View style={StyleSheet.flatten([styles.bottom, { bottom: 44 + insets.bottom }])}>
          <PText style={styles.bottomHint} color="#B9B3C9">
            다른 시간·언어로 왔나요?
          </PText>
          <Pressable onPress={onChange} accessibilityRole="button" style={({ pressed }) => StyleSheet.flatten([styles.change, pressed && styles.changePressed])}>
            <PText style={styles.changeText} color={Colors.white}>
              참석 정보 변경
            </PText>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}

/* ───────── 네 모서리 · 스캔 선 · 인식 표시 (.frame · .scanline · .found-mark) ───────── */

const scanline = css.keyframes({ from: { transform: [{ translateY: FRAME * 0.08 }] }, to: { transform: [{ translateY: FRAME * 0.88 }] } });
const rise = css.keyframes({
  from: { opacity: 0, transform: [{ translateY: 14 }, { scale: 0.97 }] },
  to: { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }] },
});

function Frame({ found, still }: { found: boolean; still: boolean }) {
  const s = useSharedValue(1);
  useEffect(() => {
    s.set(withTiming(found ? 0.92 : 1, { duration: still ? 0 : 400, easing: EASE }));
  }, [found, still, s]);
  const scale = useAnimatedStyle(() => ({ transform: [{ scale: s.get() }] }));
  const c = found ? Colors.yellow : Colors.white;
  return (
    <Animated.View style={[styles.frame, scale]} pointerEvents="none">
      <View style={[styles.corner, styles.c1, { borderColor: c }]} />
      <View style={[styles.corner, styles.c2, { borderColor: c }]} />
      <View style={[styles.corner, styles.c3, { borderColor: c }]} />
      <View style={[styles.corner, styles.c4, { borderColor: c }]} />
      {!found && (
        <Animated.View
          style={[
            styles.line,
            still
              ? { transform: [{ translateY: FRAME / 2 }] }
              : { animationName: scanline, animationDuration: '1600ms', animationIterationCount: 'infinite', animationDirection: 'alternate', animationTimingFunction: 'ease-in-out' },
          ]}
        />
      )}
      {found && (
        <Animated.View style={[styles.mark, still ? null : { animationName: rise, animationDuration: '500ms', animationTimingFunction: SPRING_CSS, animationFillMode: 'both' }]}>
          <LineIcon d={CHECK_PATH} size={56} width={3} />
        </Animated.View>
      )}
    </Animated.View>
  );
}

/** 뒤의 흐린 색 덩어리 (filter: blur(65px)) — 폰에서도 같게 보이도록 번지는 원으로 그려요 */
function Blob({ size, color, left, right, top, bottom, warm }: { size: number; color: string; left?: number; right?: number; top?: number; bottom?: number; warm?: boolean }) {
  const pad = 65;
  const S = size + pad * 2;
  const id = warm ? 'blobW' : 'blobC';
  return (
    <Svg
      width={S}
      height={S}
      pointerEvents="none"
      style={{ position: 'absolute', left: left !== undefined ? left - pad : undefined, right: right !== undefined ? right - pad : undefined, top: top !== undefined ? top - pad : undefined, bottom: bottom !== undefined ? bottom - pad : undefined }}>
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={color} stopOpacity={0.95} />
          <Stop offset="0.45" stopColor={color} stopOpacity={0.75} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={S / 2} cy={S / 2} r={S / 2} fill={`url(#${id})`} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#14121B', alignItems: 'center', overflow: 'hidden' },
  tint: { backgroundColor: 'rgba(20,18,27,0.45)' },
  top: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  x: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  pill: { height: 34, paddingHorizontal: 14, borderRadius: 17, backgroundColor: Colors.yellow, justifyContent: 'center' },
  pillText: { fontFamily: Font.display, fontSize: 13, lineHeight: 17 },
  spacer: { width: 44 },
  title: { marginTop: 40, fontFamily: Font.body900, fontSize: 22, lineHeight: 30, textAlign: 'center' },
  sub: { marginTop: 6, fontFamily: Font.body500, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  frame: { marginTop: 36, width: FRAME, height: FRAME },
  corner: { position: 'absolute', width: 46, height: 46 },
  c1: { left: 0, top: 0, borderLeftWidth: 5, borderTopWidth: 5, borderTopLeftRadius: 22 },
  c2: { right: 0, top: 0, borderRightWidth: 5, borderTopWidth: 5, borderTopRightRadius: 22 },
  c3: { left: 0, bottom: 0, borderLeftWidth: 5, borderBottomWidth: 5, borderBottomLeftRadius: 22 },
  c4: { right: 0, bottom: 0, borderRightWidth: 5, borderBottomWidth: 5, borderBottomRightRadius: 22 },
  line: { position: 'absolute', left: 18, right: 18, top: 0, height: 3, borderRadius: 2, backgroundColor: Colors.yellow, boxShadow: '0 0 18px 4px rgba(255,226,0,0.55)' },
  mark: { position: 'absolute', left: 60, top: 60, right: 60, bottom: 60, borderRadius: 65, backgroundColor: Colors.yellow, borderWidth: 3, borderColor: Colors.ink, alignItems: 'center', justifyContent: 'center' },
  settings: { marginTop: 20, height: 40, paddingHorizontal: 18, borderRadius: 20, backgroundColor: Colors.yellow, justifyContent: 'center' },
  settingsText: { fontFamily: Font.body900, fontSize: 14, lineHeight: 20 },
  bottom: { position: 'absolute', left: 20, right: 20, alignItems: 'center', gap: 10 },
  bottomHint: { fontFamily: Font.body500, fontSize: 13, lineHeight: 18 },
  change: { alignSelf: 'stretch', height: 56, borderRadius: 28, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)', backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  changePressed: { backgroundColor: 'rgba(255,255,255,0.16)' },
  changeText: { fontFamily: Font.body800, fontSize: 16, lineHeight: 22 },
});
