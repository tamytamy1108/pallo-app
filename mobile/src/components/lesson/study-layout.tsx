import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode, RefObject } from 'react';
import { ScrollView, StyleSheet, View, type ScrollViewInstance, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';

/**
 * 단계 화면 틀 (프로토타입 #study .st-body + .st-foot): 위는 스크롤, 아래 버튼 · 탭은 화면 맨 아래 고정.
 * onFootH: 아래 높이 (보라 팔로가 버튼 위 빈 곳에서 나오게)
 */
export function StudyLayout({
  children,
  foot,
  scrollRef,
  onFootH,
  onContentSize,
  bodyStyle,
}: {
  children: ReactNode;
  foot?: ReactNode;
  scrollRef?: RefObject<ScrollViewInstance | null>;
  onFootH?: (h: number) => void;
  onContentSize?: (h: number) => void;
  bodyStyle?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.flex}>
      <View style={styles.flex}>
        <ScrollView automaticallyAdjustKeyboardInsets
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={[styles.body, !foot && { paddingBottom: 30 + insets.bottom }, bodyStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={onContentSize ? (_, h) => onContentSize(h) : undefined}>
          {children}
        </ScrollView>
        {foot ? <LinearGradient colors={['rgba(251,246,234,0)', Colors.cream]} style={styles.fade} pointerEvents="none" /> : null}
      </View>
      {foot ? (
        <View style={StyleSheet.flatten([styles.foot, { paddingBottom: 16 + insets.bottom }])} onLayout={(e) => onFootH?.(e.nativeEvent.layout.height)}>
          {foot}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  body: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 20, gap: 10 },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 18 },
  foot: { paddingHorizontal: 16, paddingTop: 12, gap: 8, backgroundColor: Colors.cream },
});
