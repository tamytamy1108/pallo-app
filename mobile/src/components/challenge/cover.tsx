import { Image } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { isDarkBg } from '@/components/lounge/pics';
import { CardArt } from '@/components/ui/card-art';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { CH_C, posterBg, posterFontSize, posterWords, type Challenge } from '@/data/challenge';

/**
 * 챌린지 네모 칸 (핫한 챌린지 순위 · 카드 왼쪽 · 상세 위): 연 사람이 올린 대표 사진.
 * 만든 카드(pbg)가 있으면 카드(고른 색 + 카드 문구)가 대표, 없으면 사진, 둘 다 없으면 기본 배경색 + 카드 문구 (예: WALK / 30 MIN).
 * size: 칸 한 변 (px) — 문구 글씨 크기를 칸에 맞춰요. 칸 모양 · 테두리는 style 로.
 */
export function ChCover({ p, size, style, words = true }: { p: Challenge; size: number; style?: StyleProp<ViewStyle>; words?: boolean }) {
  const bg = posterBg(p);
  const w = posterWords(p);
  // 카드 왼쪽(96px)에서 쓰는 글씨 크기를 칸 크기에 맞추고, 가장 긴 줄이 칸 폭(테두리 · 여백 뺀)에 들어가게 (Unbounded 대문자 한 글자 ≈ 1em)
  const longest = Math.max(...w.split('\n').map((x) => x.length));
  const fs = Math.max(6, Math.min((posterFontSize(w) * size) / 96 + 1, (size - 12) / (longest * 0.98)));
  // 만든 카드: 고른 디자인 · 색 · 문구
  if (p.pbg)
    return (
      <View style={[styles.box, style]}>
        <CardArt design={p.pdes} color={p.pbg} words={w.split('\n')} />
      </View>
    );
  if (p.cover != null) {
    return (
      <View style={[styles.box, style]}>
        <Image source={typeof p.cover === 'string' ? { uri: p.cover } : p.cover} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel={`${p.name} 대표 사진`} />
      </View>
    );
  }
  return (
    <View style={[styles.box, style, { backgroundColor: bg }]}>
      {words ? (
        <PText style={[styles.w, { fontSize: fs, lineHeight: fs * 1.05, color: isDarkBg(bg) ? CH_C.y : Colors.ink }]} numberOfLines={2}>
          {w}
        </PText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  w: { fontFamily: Font.display, letterSpacing: -0.3, textAlign: 'center', paddingHorizontal: 2 },
});
