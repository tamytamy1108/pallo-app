import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, type ReactNode } from 'react';
import { StyleSheet, View, type DimensionValue, type ViewStyle } from 'react-native';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';

import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { EVENT_POSTER_MORE, EVENT_POSTER_WORDS } from '@/data/events';
import { C, hashId, POSTER_MORE, POSTER_WORDS, type PosterWords } from '@/data/meet';
import { cardColor, cardDark, cardWords, fitWordSize, type MadeCard } from '@/data/poster-colors';

/*
 * 브랜드 색 포스터 (프로토타입 lgPoster · LG_PW). 실제 앱에서는 올린 포스터 사진으로 바뀌어요.
 * 무늬 4가지(동그라미 · 사선 띠 · 방울 셋 · 큰 원 + 캐릭터)는 id 로 정해져서 늘 같은 모습이에요.
 * 내가 만든 카드는 첫 무늬(동그라미) 위에 고른 색 · 적은 문구 (data/poster-colors).
 * '예시 포스터' 표시는 프로토타입 전용이라 넣지 않아요.
 */

/** 바탕색 → 무늬 색 (프로토타입 LG_ACC) */
const ACC: Record<string, string> = { [C.pk]: '#fff', [C.pu]: C.pk, [C.y]: C.pk, [C.sky]: C.y, [C.lpu]: C.pu };
export const isDarkBg = (bg: string) => bg === C.pu || bg === C.pk || cardDark(bg);
/** 포스터 위 글자색: 어두운 바탕이면 흰색 (프로토타입 lgCardFg · lgPstFg) */
export const posterFg = (bg: string) => (isDarkBg(bg) || bg === C.ink ? '#fff' : C.ink);

export type Slide = { words: string[]; bg: string; v: number; /** 올린 포스터 사진 */ uri?: string; /** 내가 만든 카드 (무늬는 늘 첫 무늬 · 긴 글자는 폭에 맞게) */ made?: boolean };

/** 한 모임의 포스터 장들 (첫 장 = 대표, 프로토타입 lgSlides · LG_PW2). 만든 카드가 있으면 카드가 대표, 올린 사진은 그 뒤에 */
export function posterSlides(id: string, club = false, posters?: string[], card?: MadeCard): Slide[] {
  const photos = (posters ?? []).map((uri, i) => ({ words: [], bg: C.ink, v: i + (card ? 1 : 0), uri }));
  if (card) return [{ words: cardWords(card.words, club ? ['NEW', 'CLUB'] : ['NEW', 'MEET']), bg: card.color, v: 0, made: true }, ...photos];
  if (photos.length) return photos;
  const first: PosterWords = POSTER_WORDS[id] ?? EVENT_POSTER_WORDS[id] ?? [club ? ['NEW', 'CLUB'] : ['NEW', 'MEET'], club ? C.lpu : C.pk];
  const more = POSTER_MORE[id] ?? EVENT_POSTER_MORE[id] ?? [];
  return [{ words: first[0], bg: first[1], v: 0 }, ...more.map(([w, bg], i) => ({ words: w, bg, v: i + 1 }))];
}

type Props = {
  id: string;
  slide: Slide;
  /** 큰 글자 크기 · 자리 (카드 28 · 상세 54 · 배너 26) */
  wordSize?: number;
  wordStyle?: ViewStyle;
  /** 높이 (없으면 aspectRatio) */
  height?: DimensionValue;
  aspectRatio?: number;
  /** 캐릭터 이미지 폭 기준 (포스터 폭, 없으면 % 로) */
  style?: ViewStyle;
  children?: ReactNode;
};

/** 포스터 한 장 */
export function Poster({ id, slide, wordSize = 36, wordStyle, height, aspectRatio, style, children }: Props) {
  const { bg, words } = slide;
  const acc = ACC[bg] ?? cardColor(bg)?.acc ?? C.y;
  const v = slide.made ? 0 : (hashId(id) + slide.v) % 4;
  const wc = isDarkBg(bg) ? C.y : C.ink;
  // 만든 카드: 긴 글자를 포스터 폭에 맞게 줄여요 (웹은 글자 자동 줄이기가 없어요)
  const [pw, setPw] = useState(0);
  const ws = slide.made && pw ? fitWordSize(words, pw, wordSize) : wordSize;
  if (slide.uri)
    return (
      <View style={StyleSheet.flatten([styles.wrap, { backgroundColor: C.ink, height, aspectRatio }, style])}>
        <Image source={{ uri: slide.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
        {/* 내가 올린 포스터는 위쪽에 그늘 (프로토타입 .lg-pst.ph::before) */}
        <LinearGradient colors={['rgba(20,17,30,0.45)', 'rgba(20,17,30,0)']} style={styles.shade} pointerEvents="none" />
        {children}
      </View>
    );
  return (
    <View onLayout={slide.made ? (e) => setPw(e.nativeEvent.layout.width) : undefined} style={StyleSheet.flatten([styles.wrap, { backgroundColor: bg, height, aspectRatio }, style])}>
      {v === 0 ? (
        <>
          <View style={[styles.circle, { right: -40, top: -40, width: 190, height: 190, borderRadius: 95, backgroundColor: acc }]} />
          <View style={[styles.circle, { right: 46, top: 52, width: 64, height: 64, borderRadius: 32, backgroundColor: '#fff' }]} />
        </>
      ) : v === 1 ? (
        <>
          <Stripes id={id + slide.v} />
          <View style={[styles.band, { backgroundColor: acc }]} />
        </>
      ) : v === 2 ? (
        ([
          [62, 30, 46],
          [128, 58, 30],
          [30, 70, 22],
        ] as const).map(([r, t, z]) => <View key={r} style={[styles.circle, { right: r, top: t, width: z * 2, height: z * 2, borderRadius: z, backgroundColor: acc }]} />)
      ) : (
        <>
          <View style={[styles.circle, { right: -30, bottom: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: acc }]} />
          <Image source={require('@/assets/characters/c-upright-yellow.png')} contentFit="contain" style={styles.char} />
        </>
      )}
      <View style={StyleSheet.flatten([styles.words, wordStyle])} pointerEvents="none">
        <PText style={{ fontFamily: Font.display, fontSize: ws, lineHeight: ws * 0.95, letterSpacing: -1.2, color: wc }}>{words.join('\n')}</PText>
      </View>
      {children}
    </View>
  );
}

/** repeating-linear-gradient(-45deg, transparent 0 18px, rgba(255,255,255,.2) 18px 36px) */
function Stripes({ id }: { id: string }) {
  const pid = `st-${id}`;
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
      <Defs>
        <Pattern id={pid} patternUnits="userSpaceOnUse" width={36} height={36} patternTransform="rotate(45)">
          <Rect x={18} y={0} width={18} height={36} fill="rgba(255,255,255,0.2)" />
        </Pattern>
      </Defs>
      <Rect x={0} y={0} width="100%" height="100%" fill={`url(#${pid})`} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative', overflow: 'hidden', width: '100%' },
  circle: { position: 'absolute', borderWidth: 2, borderColor: C.ink },
  band: { position: 'absolute', left: -20, right: -20, top: '42%', height: 54, borderTopWidth: 2, borderBottomWidth: 2, borderColor: C.ink, transform: [{ rotate: '-6deg' }] },
  char: { position: 'absolute', right: 6, bottom: -14, width: '38%', maxWidth: 150, aspectRatio: 480 / 306, zIndex: 1 },
  shade: { position: 'absolute', left: 0, right: 0, top: 0, height: 64, zIndex: 1 },
  words: { position: 'absolute', left: 16, right: 16, bottom: 16, zIndex: 2 },
});

/** 실제 포스터 폭 (번개 카드 · 상세 무늬가 이 크기에 맞춰져 있어요) — 미리보기는 이 크기로 그려서 줄여요 */
const PREVIEW_W = 300;

/** 카드 만들기 미리보기: 실제 크기 포스터(4:5)를 칸 폭(width)에 맞게 줄여 보여 줘요 */
export function PosterPreview({ card, words, width }: { card: MadeCard; words: string[]; width: number }) {
  const k = width / PREVIEW_W;
  const h = PREVIEW_W * 1.25;
  return (
    <View style={{ width, height: h * k, overflow: 'hidden' }}>
      <View style={{ position: 'absolute', width: PREVIEW_W, height: h, left: (width - PREVIEW_W) / 2, top: (h * k - h) / 2, transform: [{ scale: k }] }}>
        <Poster id="card-preview" slide={{ words, bg: card.color, v: 0, made: true }} height={h} wordSize={54} />
      </View>
    </View>
  );
}
