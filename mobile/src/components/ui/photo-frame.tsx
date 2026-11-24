import { Image } from 'expo-image';
import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { isPlainFraming as isPlain, MAX_PHOTO_ZOOM, type PhotoFraming } from '@/lib/photo-framing';

import { PText } from './text';

/*
 * 올린 사진 맞추기 (두 손가락 확대 · 한 손가락 이동 · 두 번 눌러 처음대로) · 맞춘 모양대로 보여 주기.
 * 맞춘 값(PhotoFraming)은 @/lib/photo-framing — 사진 옆에 같이 들고 다녀요.
 */
export { MAX_PHOTO_ZOOM, plainFraming, type PhotoFraming } from '@/lib/photo-framing';

type Box = { w: number; h: number };

/** 틀(w × h) 안에서 사진의 크기 · 왼쪽 위 자리 (px). 사진이 늘 틀을 다 덮게 잡아 줘요 */
function placePhoto(f: PhotoFraming, box: Box) {
  const scale = Math.min(MAX_PHOTO_ZOOM, Math.max(1, f.scale));
  const w = Math.max(box.w, box.h * f.aspect) * scale;
  const h = w / f.aspect;
  return {
    scale,
    w,
    h,
    left: Math.min(0, Math.max(box.w - w, box.w / 2 - f.x * w)),
    top: Math.min(0, Math.max(box.h - h, box.h / 2 - f.y * h)),
  };
}

/** 맞춘 모양대로 사진 보여 주기 — 부모 칸을 꽉 채워요 (부모에 overflow: hidden) */
export function FramedImage({ uri, framing, accessibilityLabel }: { uri: string; framing?: PhotoFraming; accessibilityLabel?: string }) {
  const [box, setBox] = useState<Box | null>(null);
  if (!framing || isPlain(framing)) return <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel={accessibilityLabel} />;
  const at = box ? placePhoto(framing, box) : null;
  return (
    <View
      style={[StyleSheet.absoluteFill, styles.clip]}
      onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      accessible={!!accessibilityLabel}
      accessibilityRole={accessibilityLabel ? 'image' : undefined}
      accessibilityLabel={accessibilityLabel}>
      {at ? <Image source={{ uri }} style={{ position: 'absolute', left: at.left, top: at.top, width: at.w, height: at.h }} contentFit="fill" /> : null}
    </View>
  );
}

type PhotoFrameProps = {
  uri: string;
  framing: PhotoFraming;
  /** 손을 뗄 때마다 (움직이는 동안은 안 불러요) */
  onChange: (f: PhotoFraming) => void;
  /** 틀 모양: 크기 · 비율 · 테두리 · 모서리 */
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  /** 맞추기 전엔 위에 쓰는 법을 살짝 보여 줘요 */
  hint?: boolean;
  /** 사진 위에 얹는 버튼들 (사진 빼기 · 비율 등) — 이 버튼들은 맞추기 손짓에 안 걸려요 */
  children?: ReactNode;
};

/**
 * 사진 맞추기 틀. 시트 안에서도 사진을 잡고 있는 동안은 틀이 손짓을 가져가요 (시트 끌어내리기는 손잡이에서만).
 * 움직임은 UI 스레드에서 (Gesture Handler + Reanimated), 사진이 늘 틀을 꽉 채우게 막아요.
 */
export function PhotoFrame({ uri, framing, onChange, style, accessibilityLabel = '올릴 사진 맞추기', hint = true, children }: PhotoFrameProps) {
  const still = useReducedMotion();
  const [box, setBox] = useState<Box | null>(null);
  const scale = useSharedValue(1);
  const left = useSharedValue(0);
  const top = useSharedValue(0);
  const boxW = useSharedValue(0);
  const boxH = useSharedValue(0);
  const active = useSharedValue(0);
  const { aspect } = framing;

  // 틀 크기나 맞춘 모양이 밖에서 바뀌면 (처음 · 비율 바꾸기 · 다른 사진) 그대로 옮겨 놓아요
  useEffect(() => {
    if (!box) return;
    const at = placePhoto(framing, box);
    boxW.set(box.w);
    boxH.set(box.h);
    scale.set(at.scale);
    left.set(at.left);
    top.set(at.top);
  }, [box, framing, boxW, boxH, scale, left, top]);

  const settle = (sc: number, l: number, t: number) => {
    'worklet';
    const W = boxW.get();
    const H = boxH.get();
    const w = Math.max(W, H * aspect) * sc;
    const h = w / aspect;
    scale.set(sc);
    left.set(Math.min(0, Math.max(W - w, l)));
    top.set(Math.min(0, Math.max(H - h, t)));
  };
  const commit = () => {
    'worklet';
    const W = boxW.get();
    const H = boxH.get();
    const sc = scale.get();
    const w = Math.max(W, H * aspect) * sc;
    const h = w / aspect;
    scheduleOnRN(onChange, { aspect, scale: sc, x: (W / 2 - left.get()) / w, y: (H / 2 - top.get()) / h });
  };

  const pan = Gesture.Pan()
    .minDistance(4)
    .averageTouches(true)
    .onStart(() => {
      active.set(withTiming(1, { duration: 120 }));
    })
    .onChange((e) => {
      settle(scale.get(), left.get() + e.changeX, top.get() + e.changeY);
    })
    .onEnd(commit)
    .onFinalize(() => {
      active.set(withTiming(0, { duration: 220 }));
    });
  // 손가락 사이(focal)를 기준으로 키워요 — 집은 곳이 손가락 아래 그대로 남아요
  const pinch = Gesture.Pinch()
    .onStart(() => {
      active.set(withTiming(1, { duration: 120 }));
    })
    .onChange((e) => {
      const prev = scale.get();
      const sc = Math.min(MAX_PHOTO_ZOOM, Math.max(1, prev * e.scaleChange));
      const k = sc / prev;
      settle(sc, e.focalX - (e.focalX - left.get()) * k, e.focalY - (e.focalY - top.get()) * k);
    })
    .onEnd(commit)
    .onFinalize(() => {
      active.set(withTiming(0, { duration: 220 }));
    });
  const reset = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      const W = boxW.get();
      const H = boxH.get();
      const w = Math.max(W, H * aspect);
      const h = w / aspect;
      const d = still ? 0 : 260;
      scale.set(withTiming(1, { duration: d }));
      left.set(withTiming((W - w) / 2, { duration: d }));
      top.set(
        withTiming((H - h) / 2, { duration: d }, (done) => {
          if (done) scheduleOnRN(onChange, { aspect, scale: 1, x: 0.5, y: 0.5 });
        }),
      );
    });
  const gesture = Gesture.Race(Gesture.Simultaneous(pan, pinch), reset);

  const imgStyle = useAnimatedStyle(() => {
    const w = Math.max(boxW.get(), boxH.get() * aspect);
    const h = w / aspect;
    const sc = scale.get();
    // scale 은 가운데 기준이라, 왼쪽 위 자리(left · top)에 맞게 옮겨 줘요
    return { width: w, height: h, transform: [{ translateX: left.get() - (w * (1 - sc)) / 2 }, { translateY: top.get() - (h * (1 - sc)) / 2 }, { scale: sc }] };
  });
  const gridStyle = useAnimatedStyle(() => ({ opacity: active.get() }));

  return (
    <View style={[styles.frame, style]}>
      <GestureDetector gesture={gesture}>
        <View
          style={StyleSheet.absoluteFill}
          onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
          accessible
          accessibilityRole="image"
          accessibilityLabel={accessibilityLabel}
          accessibilityHint="두 손가락으로 벌려 키우고, 끌어서 위치를 맞춰요. 두 번 누르면 처음대로 돌아가요">
          {box ? (
            <Animated.View style={[styles.img, imgStyle]}>
              <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="fill" />
            </Animated.View>
          ) : null}
          <Animated.View style={[StyleSheet.absoluteFill, gridStyle]} pointerEvents="none">
            <View style={[styles.gridV, { left: '33.33%' }]} />
            <View style={[styles.gridV, { left: '66.66%' }]} />
            <View style={[styles.gridH, { top: '33.33%' }]} />
            <View style={[styles.gridH, { top: '66.66%' }]} />
          </Animated.View>
        </View>
      </GestureDetector>
      {hint && isPlain(framing) ? (
        <View style={styles.hint} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <PText style={styles.hintT}>두 손가락으로 키우고 · 끌어서 맞춰요</PText>
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden', backgroundColor: Colors.ink },
  clip: { overflow: 'hidden' },
  img: { position: 'absolute', left: 0, top: 0 },
  gridV: { position: 'absolute', top: 0, bottom: 0, width: StyleSheet.hairlineWidth * 2, backgroundColor: 'rgba(255,255,255,0.55)' },
  gridH: { position: 'absolute', left: 0, right: 0, height: StyleSheet.hairlineWidth * 2, backgroundColor: 'rgba(255,255,255,0.55)' },
  hint: { position: 'absolute', top: 10, alignSelf: 'center', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: 'rgba(30,26,43,0.72)' },
  hintT: { fontFamily: Font.body800, fontSize: 11, lineHeight: 15, color: Colors.white },
});
