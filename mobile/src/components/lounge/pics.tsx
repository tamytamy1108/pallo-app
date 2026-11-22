import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';

import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { LG_C, type PicKey } from '@/data/lounge';

/*
 * 사진 · 포스터 대신 그리는 브랜드 색 그림 (프로토타입 LG_PICS · lgPoster).
 * 실제 앱에서는 업로드한 사진이 들어가요 — 이건 예시 그림이에요.
 */

const I = Colors.ink;

/** 프로토타입 .lg-pic .w — Unbounded · 줄 간격 1. outline = -webkit-text-stroke 1px (잉크 그림자로 비슷하게) */
function W({ children, size, color, style, outline }: { children: string; size: number; color: string; style: ViewStyle; outline?: boolean }) {
  return (
    <View style={[styles.abs, style]} pointerEvents="none">
      <PText style={[styles.w, { fontSize: size, lineHeight: size, color }, outline ? styles.stroke : null]}>{children}</PText>
    </View>
  );
}

const Circle = ({ size, bg, style, shadow }: { size: number; bg: string; style: ViewStyle; shadow?: boolean }) => (
  <View style={[styles.abs, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg, borderWidth: 2, borderColor: I }, shadow ? styles.hard4 : null, style]} />
);

/** 사선 줄무늬 (repeating-linear-gradient(-45deg, transparent 0 18px, rgba(255,255,255,a) 18px 36px)) */
export function Stripes({ alpha = 0.18, id }: { alpha?: number; id: string }) {
  return (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <Pattern id={id} width={36 * Math.SQRT2} height={36 * Math.SQRT2} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <Rect x={18 * Math.SQRT2} y={0} width={18 * Math.SQRT2} height={36 * Math.SQRT2} fill={`rgba(255,255,255,${alpha})`} />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

export const PIC_BG: Record<PicKey, string> = { party: LG_C.pu, ramen: LG_C.pk, book: LG_C.sky, run: LG_C.y, trip: LG_C.sky, cafe: LG_C.lpu };

/** 글 사진 자리 그림 (프로토타입 LG_PICS) — 부모가 크기 · 테두리 · 바탕을 정해요 */
export function PostArt({ pic, uid }: { pic: PicKey; uid: string }): ReactNode {
  switch (pic) {
    case 'party':
      return (
        <>
          <W size={36} color={LG_C.y} style={{ left: 18, bottom: 20 }}>
            {'HALLO\nWEEN\nNIGHT'}
          </W>
          <Circle size={170} bg={LG_C.pk} style={{ right: -30, top: -30 }} />
          <Circle size={62} bg="#fff" style={{ right: 40, top: 62 }} />
          <W size={11} color="#fff" style={{ right: 16, bottom: 22 }}>
            영등포 · 10.31
          </W>
        </>
      );
    case 'ramen':
      return (
        <>
          <Stripes id={`st-${uid}`} />
          <View style={[styles.abs, styles.bowl]} />
          <View style={[styles.abs, styles.rim]} />
          <W size={26} color="#fff" outline style={{ left: 18, bottom: 20 }}>
            {'RAMEN\nIN FUKUOKA'}
          </W>
        </>
      );
    case 'book':
      return (
        <>
          <View style={[styles.abs, styles.book, { left: '12%', top: '16%', height: '52%', backgroundColor: LG_C.y, transform: [{ rotate: '-8deg' }] }]} />
          <View style={[styles.abs, styles.book, { left: '37%', top: '12%', height: '56%', backgroundColor: '#fff' }]} />
          <View style={[styles.abs, styles.book, { left: '61%', top: '17%', height: '50%', backgroundColor: LG_C.pk, transform: [{ rotate: '7deg' }] }]} />
          <W size={22} color={I} style={{ left: 18, bottom: 20 }}>
            {'BOOK CLUB\nTHE LITTLE PRINCE'}
          </W>
        </>
      );
    case 'run':
      return (
        <>
          <View style={[styles.abs, styles.band, { left: -20, right: -20, top: '46%', height: 64, backgroundColor: LG_C.lsky }]} />
          <W size={26} color={I} style={{ left: 18, top: 46 }}>
            {'5K RUN &\nENGLISH'}
          </W>
          <W size={12} color={LG_C.pu} style={{ right: 16, bottom: 20 }}>
            석촌호수 · SUN 08:00
          </W>
        </>
      );
    case 'trip':
      return (
        <>
          <Circle size={86} bg={LG_C.y} style={{ right: 28, top: 26 }} />
          <View style={[styles.abs, styles.band, { left: -10, right: -10, bottom: 70, height: 46, backgroundColor: '#fff' }]} />
          <W size={30} color={I} style={{ left: 18, bottom: 18 }}>
            {'OSAKA\nDAY 2'}
          </W>
        </>
      );
    case 'cafe':
      return (
        <>
          <View style={styles.center}>
            <Circle size={120} bg="#fff" shadow style={{ position: 'relative' }} />
          </View>
          <View style={styles.center}>
            <Circle size={64} bg="#C49A6C" style={{ position: 'relative' }} />
          </View>
          <W size={15} color={LG_C.pu} style={{ left: 18, bottom: 18 }}>
            I’M ON THE FENCE.
          </W>
        </>
      );
  }
}

// ---- 번개 · 파티 포스터 (프로토타입 lgPoster) ----
const ACC: Record<string, string> = { [LG_C.pk]: '#fff', [LG_C.pu]: LG_C.pk, [LG_C.y]: LG_C.pk, [LG_C.sky]: LG_C.y, [LG_C.lpu]: LG_C.pu };
export const isDarkBg = (bg: string) => bg === LG_C.pu || bg === LG_C.pk;

/** 지난 번개 카드: filter grayscale(.9) 를 색마다 직접 섞어요 (안드로이드 · iOS 는 CSS filter 가 없어서) */
export function gray(hex: string, k = 0.9) {
  const n = hex.replace('#', '');
  const f =
    n.length === 3
      ? n
          .split('')
          .map((c) => c + c)
          .join('')
      : n;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16));
  const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const m = (v: number) => Math.round(v + (l - v) * k);
  return `rgb(${m(r)}, ${m(g)}, ${m(b)})`;
}

/** 포스터 그림 (바탕 + 무늬 + 큰 글씨). id 글자 합으로 무늬 4가지 중 하나 */
export function PosterArt({ id, word, bg, past = false, wordSize = 36 }: { id: string; word: string; bg: string; past?: boolean; wordSize?: number }) {
  const c = (x: string) => (past ? gray(x) : x);
  const acc = c(ACC[bg] ?? LG_C.y);
  const wc = c(isDarkBg(bg) ? LG_C.y : I);
  const v = [...id].reduce((a, ch) => a + ch.charCodeAt(0), 0) % 4;
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: c(bg), overflow: 'hidden' }]} pointerEvents="none">
      {v === 0 ? (
        <>
          <Circle size={190} bg={acc} style={{ right: -40, top: -40 }} />
          <Circle size={64} bg={c('#ffffff')} style={{ right: 46, top: 52 }} />
        </>
      ) : v === 1 ? (
        <>
          <Stripes id={`pst-${id}`} alpha={0.2} />
          <View style={[styles.abs, styles.band, { left: -20, right: -20, top: '42%', height: 54, backgroundColor: acc, transform: [{ rotate: '-6deg' }] }]} />
        </>
      ) : v === 2 ? (
        (
          [
            [62, 30, 46],
            [128, 58, 30],
            [30, 70, 22],
          ] as const
        ).map(([r, t, z]) => <Circle key={r} size={z * 2} bg={acc} style={{ right: r, top: t }} />)
      ) : (
        <>
          <Circle size={220} bg={acc} style={{ right: -30, bottom: -60 }} />
          <Image source={require('@/assets/characters/c-upright-yellow.png')} style={[styles.abs, { right: 6, bottom: -14, width: '38%', maxWidth: 150, aspectRatio: 1.57 }, past ? { opacity: 0.55 } : null]} contentFit="contain" />
        </>
      )}
      <PText style={[styles.pw, { color: wc, fontSize: wordSize, lineHeight: wordSize * 0.95 }]}>{word}</PText>
    </View>
  );
}

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
  w: { fontFamily: Font.display, letterSpacing: -0.6 },
  stroke: { textShadowColor: I, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 1.5 },
  hard4: { boxShadow: `4px 4px 0px ${I}` },
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', bottom: '8%' },
  bowl: { left: '21%', width: '58%', top: '42%', marginTop: -48, height: 96, borderBottomLeftRadius: 100, borderBottomRightRadius: 100, backgroundColor: '#fff', borderWidth: 2, borderColor: I },
  rim: { left: '17%', width: '66%', top: '27%', height: 15, borderRadius: 8, backgroundColor: LG_C.y, borderWidth: 2, borderColor: I },
  book: { width: '26%', borderRadius: 6, borderWidth: 2, borderColor: I },
  band: { borderTopWidth: 2, borderBottomWidth: 2, borderColor: I },
  pw: { position: 'absolute', left: 16, right: 16, bottom: 16, fontFamily: Font.display, letterSpacing: -1.2 },
});
