import { useRef, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { BackButton } from '@/components/ui/back-button';
import { Pressable } from '@/components/ui/pressable';
import { LayerModal } from '@/components/ui/sheet-stack';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';

export type PhotoBox = { width: number; height: number };

type Props = {
  /** 사진 몇 장 */
  count: number;
  /** 처음 보여 줄 장 (null 이면 닫혀 있어요) */
  start: number | null;
  onClose: () => void;
  /** j 번째 사진 그리기 — box 는 사진이 들어갈 수 있는 가장 큰 칸이에요 */
  renderPhoto: (j: number, box: PhotoBox) => ReactNode;
  /** 위 줄 이름 (없으면 'n / 전체' 만) */
  title?: string;
  /** 닫는 단추: 오른쪽 위 X (기본) · 왼쪽 위 ‹ */
  close?: 'x' | 'back';
  /** 아래 점 (눌러서 그 장으로) */
  dots?: boolean;
  /** 양옆 화살표 (손가락으로 밀기 어려운 컴퓨터 화면용) */
  arrows?: boolean;
};

const PAD = 16;

/**
 * 사진 크게 보기 — 앱 어디서나 같은 동작이에요.
 * 어두운 바깥(위 · 아래 · 사진 옆 빈 곳)을 누르면 닫히고, 사진 자체를 누르면 닫히지 않아요.
 * 옆으로 밀면 한 장씩 넘어가요.
 */
export function PhotoViewer({ count, start, onClose, renderPhoto, title, close = 'x', dots, arrows }: Props) {
  const [box, setBox] = useState<PhotoBox>({ width: 0, height: 0 });
  const [i, setI] = useState(start ?? 0);
  const track = useRef<ScrollViewInstance>(null);
  const insets = useSafeAreaInsets();
  const w = box.width;
  // 다른 사진을 눌러 다시 열면 그 장부터 (그리는 중에 맞춰요)
  const [seenStart, setSeenStart] = useState(start);
  if (start !== seenStart) {
    setSeenStart(start);
    if (start != null) setI(start);
  }
  const goTo = (k: number, animated = true) => {
    const n = Math.max(0, Math.min(count - 1, k));
    setI(n);
    track.current?.scrollTo({ x: n * w, animated });
  };
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const n = Math.round(e.nativeEvent.contentOffset.x / (w || 1));
    if (n !== i && n >= 0 && n < count) setI(n);
  };
  const many = count > 1;
  const counter = `${i + 1} / ${count}`;
  const inner: PhotoBox = { width: Math.max(0, w - PAD * 2), height: Math.max(0, box.height - PAD * 2) };
  return (
    <LayerModal visible={start != null} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      {/* 바탕 전체가 닫기 — 사진 · 단추만 따로 받아요 */}
      <Pressable onPress={onClose} sound="back" accessible={false} style={styles.root}>
        {close === 'back' ? (
          <View pointerEvents="box-none" style={[styles.topBack, { paddingTop: insets.top + 4 }]}>
            <BackButton onPress={onClose} color="#fff" label="닫기" />
            <PText style={styles.nBack}>{counter}</PText>
          </View>
        ) : (
          <View pointerEvents="box-none" style={[styles.topX, { paddingTop: insets.top + 10 }]}>
            {title ? <PText style={styles.title}>{title}</PText> : null}
            {title ? many && <PText style={styles.nSub}>{counter}</PText> : <PText style={styles.n}>{counter}</PText>}
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="닫기" style={styles.x} hitSlop={8}>
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.6} strokeLinecap="round">
                <Path d="M6 6l12 12M18 6 6 18" />
              </Svg>
            </Pressable>
          </View>
        )}
        <View style={styles.body} onLayout={(e) => setBox({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}>
          {w ? (
            <ScrollView
              ref={track}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={onScroll}
              scrollEventThrottle={16}
              contentOffset={{ x: (start ?? 0) * w, y: 0 }}
              onLayout={() => goTo(start ?? 0, false)}>
              {Array.from({ length: count }, (_, j) => (
                <View key={j} style={[styles.page, { width: w }]}>
                  {/* 사진을 누르면 여기서 멈춰서 닫히지 않아요 */}
                  <View onStartShouldSetResponder={() => true}>{renderPhoto(j, inner)}</View>
                </View>
              ))}
            </ScrollView>
          ) : null}
        </View>
        {dots && many ? (
          <View pointerEvents="box-none" style={[styles.dots, { paddingBottom: 22 + insets.bottom }]}>
            {Array.from({ length: count }, (_, k) => (
              <Pressable key={k} onPress={() => goTo(k)} sound="pick" accessibilityRole="button" accessibilityLabel={`${k + 1}번째 사진`} hitSlop={8}>
                <View style={[styles.dot, k === i && styles.dotOn]} />
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={{ height: 20 + insets.bottom }} />
        )}
        {arrows && many && i > 0 ? (
          <Pressable onPress={() => goTo(i - 1)} accessibilityRole="button" accessibilityLabel="이전 사진" style={[styles.arrow, styles.prev]}>
            <Chevron d="M15 4.5L7.5 12l7.5 7.5" />
          </Pressable>
        ) : null}
        {arrows && many && i < count - 1 ? (
          <Pressable onPress={() => goTo(i + 1)} accessibilityRole="button" accessibilityLabel="다음 사진" style={[styles.arrow, styles.next]}>
            <Chevron d="M9 4.5l7.5 7.5L9 19.5" />
          </Pressable>
        ) : null}
      </Pressable>
    </LayerModal>
  );
}

const Chevron = ({ d }: { d: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={Colors.white} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <Path d={d} />
  </Svg>
);

/** 사진 원래 비율(가로 ÷ 세로)을 칸 안에 다 들어오게 맞춘 크기 */
export const fitPhoto = (ratio: number, box: PhotoBox): PhotoBox => {
  if (!box.width || !box.height || !ratio) return { width: box.width, height: box.width };
  return box.width / box.height > ratio ? { width: box.height * ratio, height: box.height } : { width: box.width, height: box.width / ratio };
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'rgba(20,17,30,0.96)' },
  topX: { alignItems: 'center', paddingBottom: 10, minHeight: 44 },
  topBack: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingBottom: 6 },
  title: { fontFamily: Font.body900, fontSize: 14, lineHeight: 20, color: Colors.white },
  n: { fontFamily: Font.display, fontSize: 13, lineHeight: 18, color: Colors.white },
  nSub: { fontFamily: Font.display, fontSize: 12, lineHeight: 16, color: Colors.yellow },
  nBack: { fontFamily: Font.display, fontSize: 14, lineHeight: 20, color: Colors.white },
  x: { position: 'absolute', right: 14, bottom: 4, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1 },
  page: { height: '100%', padding: PAD, alignItems: 'center', justifyContent: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.35)' },
  dotOn: { width: 18, backgroundColor: Colors.white },
  arrow: { position: 'absolute', top: '50%', marginTop: -22, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.16)' },
  prev: { left: 10 },
  next: { right: 10 },
});
