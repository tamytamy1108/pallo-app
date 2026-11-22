import { Children, type ReactNode } from 'react';
import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';

/** DESIGN.md 의 글자 단계 (typography). */
const VARIANTS = {
  poster: { fontFamily: Font.display, fontSize: 36, lineHeight: 36 * 0.95, letterSpacing: -1.2 },
  display: { fontFamily: Font.display, fontSize: 30, lineHeight: 30 * 1.14, letterSpacing: -1 },
  headline: { fontFamily: Font.display, fontSize: 26, lineHeight: 26 * 1.15, letterSpacing: -0.6 },
  title: { fontFamily: Font.display, fontSize: 21, lineHeight: 21 * 1.25, letterSpacing: -0.5 },
  body: { fontFamily: Font.body600, fontSize: 14, lineHeight: 14 * 1.6 },
  bodyStrong: { fontFamily: Font.body800, fontSize: 14, lineHeight: 14 * 1.6 },
  label: { fontFamily: Font.body900, fontSize: 12.5, lineHeight: 12.5 * 1.4 },
  small: { fontFamily: Font.body600, fontSize: 12, lineHeight: 12 * 1.5 },
} satisfies Record<string, TextStyle>;

export type TextVariant = keyof typeof VARIANTS;

// 프로토타입 --f-display: 'Unbounded', 'Noto Sans KR' — 한글은 같은 굵기의 Noto 로 그려요
const HANGUL_FONT: Record<string, string> = { [Font.display]: Font.body800, [Font.displaySemi]: Font.body600 };
const HANGUL_RUN = /([ㄱ-ㆎ가-힣]+)/;

/**
 * 제목 글꼴(Unbounded)에는 한글이 없어요. 웹 프로토타입처럼 영문 · 숫자는 Unbounded,
 * 한글 부분만 같은 굵기의 Noto Sans KR 로 나눠 그려요. ("1과 Cafe Complaint" → 1 · Cafe Complaint 는 Unbounded)
 */
function mixKorean(children: ReactNode, hangulFont: string, letterSpacing: number) {
  return Children.map(children, (c) => {
    if (typeof c !== 'string' || !HANGUL_RUN.test(c)) return c;
    return c.split(HANGUL_RUN).map((part, i) =>
      i % 2 === 1 ? (
        <Text key={i} style={{ fontFamily: hangulFont, letterSpacing: letterSpacing / 2 }}>
          {part}
        </Text>
      ) : (
        part
      ),
    );
  });
}

type Props = TextProps & { variant?: TextVariant; color?: string };

/** PALLO 글자. variant 로 크기 · 글꼴을 골라요. */
export function PText({ variant = 'body', color = Colors.ink, style, children, ...rest }: Props) {
  const flat: TextStyle = StyleSheet.flatten([VARIANTS[variant] as TextStyle, { color }, style]) ?? {};
  // 글꼴이 Unbounded 면 (variant 든 style 이든) 한글만 Noto 로 나눠요. 안 그러면 한글이 기기 기본 글꼴로 나와요
  const hangulFont = flat.fontFamily ? HANGUL_FONT[flat.fontFamily] : undefined;
  return (
    // hangul-word: 한글을 낱말 단위로 줄바꿈 (iOS). 안드로이드 · 웹은 기본 동작을 따라요.
    <Text lineBreakStrategyIOS="hangul-word" {...rest} style={flat}>
      {hangulFont ? mixKorean(children, hangulFont, flat.letterSpacing ?? 0) : children}
    </Text>
  );
}
