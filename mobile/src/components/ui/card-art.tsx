import { Image } from 'expo-image';
import { useId, useState } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, Ellipse, Line, Path, Pattern, Polygon, Rect } from 'react-native-svg';

import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { cardColor, cardDark, type CardDesign } from '@/data/poster-colors';
import { glyphWidth, runFont, SCRIPT_RUNS } from '@/lib/script-fonts';

/*
 * 대표 카드 그림 (디자인 10가지 · 고른 색 · 적은 문구). 시안: 카드 고르기 보드에서 고른 A B D E F G H ① ② ⑤.
 * 시안 카드(136 × 170)를 기준으로 그리고, 칸 크기에 맞게 통째로 줄이거나 늘려요 (긴 칸은 옆으로, 높은 칸은 위아래로 늘어나요).
 * 부모 칸을 꽉 채워요 (absoluteFill) — 칸 모양 · 테두리 · 둥글기는 부모가 정해요.
 */

const BW = 136;
const BH = 170;
const INK = '#1E1A2B';
const YELLOW = '#FFE200';
const PINK = '#D0798E';

type Look = { bg: string; acc: string; text: string; dark: boolean };
const lookOf = (hex: string): Look => {
  const c = cardColor(hex);
  const dark = cardDark(hex);
  return { bg: hex, acc: c?.acc ?? (dark ? YELLOW : PINK), text: dark ? YELLOW : INK, dark };
};

/** safeTop: 칸 위에 다른 것(번개 카드의 '번개 · D-3' 줄)이 겹치면 그만큼(px) 위쪽 글자를 내려요 */
export function CardArt({ design = 'circle', color, words, style, safeTop = 0 }: { design?: CardDesign; color: string; words: string[]; style?: StyleProp<ViewStyle>; safeTop?: number }) {
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  return (
    <View
      pointerEvents="none"
      onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      style={[StyleSheet.absoluteFill, { backgroundColor: color, overflow: 'hidden' }, style]}>
      {box && box.w > 0 && box.h > 0 ? <Art design={design} look={lookOf(color)} words={words} w={box.w} h={box.h} safeTop={safeTop} /> : null}
    </View>
  );
}

function Art({ design, look, words, w, h, safeTop }: { design: CardDesign; look: Look; words: string[]; w: number; h: number; safeTop: number }) {
  const k = Math.min(w / BW, h / BH);
  const W = w / k;
  const H = h / k;
  return (
    <View style={{ position: 'absolute', width: W, height: H, left: (w - W) / 2, top: (h - H) / 2, transform: [{ scale: k }] }}>
      <Deco design={design} look={look} W={W} H={H} />
      <Words design={design} look={look} words={words} W={W} down={Math.max(0, safeTop / k - 8)} />
    </View>
  );
}

/** 글자 자리 · 크기 · 글꼴 (시안 그대로) */
function Words({ design, look, words, W, down }: { design: CardDesign; look: Look; words: string[]; W: number; down: number }) {
  const t = words.join('\n');
  const anton = !['circle', 'stripe', 'char'].includes(design);
  const font = anton ? Font.poster : Font.display;
  // 가장 긴 줄이 자리 폭에 들어가게 (Anton 대문자 ≈ 0.5em · Unbounded ≈ 0.95em · 한글 · 일본어 · 중국어 ≈ 1em)
  const fit = (size: number, room: number) => {
    const longest = Math.max(1, ...words.map((x) => [...x].reduce((n, ch) => n + glyphWidth(ch, anton ? 0.52 : 0.95), 0)));
    return Math.max(7, Math.min(size, room / longest));
  };
  // 영문 · 숫자는 디자인 글꼴, 한글 · 일본어 · 중국어는 홈 닉네임 글꼴 (lib/script-fonts)
  const runs = t.split(SCRIPT_RUNS).map((part, i) => (part ? <Text key={i} style={{ fontFamily: runFont(part, font) }}>{part}</Text> : null));
  const txt = (size: number, room: number, pos: ViewStyle, color = look.text) => {
    const fs = fit(size, room);
    if (down && typeof pos.top === 'number') pos = { ...pos, top: pos.top + down };
    return <PText style={[styles.w, pos, { fontFamily: font, fontSize: fs, lineHeight: fs * (anton ? 1.02 : 0.98), color }]}>{runs}</PText>;
  };
  switch (design) {
    case 'circle':
    case 'stripe':
      return txt(29, W - 26, { left: 13, bottom: 24 });
    case 'char':
      return txt(18, W - 26, { left: 13, top: 13 });
    case 'diag':
      return txt(32, W - 22, { left: 11, bottom: 11 });
    case 'bubble':
      return txt(32, 100, { left: 24, top: 34 }, INK);
    case 'big': {
      const sh = look.acc !== look.text ? look.acc : look.bg === INK ? PINK : INK;
      return (
        <>
          {txt(47, W - 25, { left: 14, top: 27 }, sh)}
          {txt(47, W - 25, { left: 11, top: 24 })}
        </>
      );
    }
    case 'stage':
      return txt(27.5, W - 22, { left: 11, top: 11 });
    default:
      return txt(32, W - 22, { left: 11, top: 13 });
  }
}

/** 무늬 (글자 뒤) */
function Deco({ design, look, W, H }: { design: CardDesign; look: Look; W: number; H: number }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const { acc } = look;
  switch (design) {
    case 'circle':
      return (
        <>
          <View style={[styles.round, { right: -32, top: -32, width: 154, height: 154, borderRadius: 77, backgroundColor: acc }]} />
          <View style={[styles.round, { right: 37, top: 42, width: 52, height: 52, borderRadius: 26, backgroundColor: '#fff' }]} />
        </>
      );
    case 'stripe':
      return (
        <>
          <Svg style={StyleSheet.absoluteFill} width={W} height={H}>
            <Defs>
              <Pattern id={`s${id}`} patternUnits="userSpaceOnUse" width={30} height={30} patternTransform="rotate(45)">
                <Rect x={15} y={0} width={15} height={30} fill="rgba(255,255,255,0.2)" />
              </Pattern>
            </Defs>
            <Rect x={0} y={0} width={W} height={H} fill={`url(#s${id})`} />
          </Svg>
          <View style={[styles.band, { top: H * 0.42, height: 44, backgroundColor: acc }]} />
        </>
      );
    case 'char': {
      const light = look.dark ? 'rgba(255,226,0,0.45)' : 'rgba(255,255,255,0.6)';
      return (
        <>
          <Svg style={{ position: 'absolute', left: W / 2 - 28, top: -5 }} width={81} height={H}>
            <Polygon points={`${81 * 0.4},0 ${81 * 0.6},0 81,${H} 0,${H}`} fill={light} />
          </Svg>
          <Svg style={{ position: 'absolute', left: 18, bottom: 27 }} width={W - 36} height={27}>
            <Ellipse cx={(W - 36) / 2} cy={13.5} rx={(W - 36) / 2 - 1} ry={12.5} fill={PINK} stroke={INK} strokeWidth={2} />
          </Svg>
          <Image
            source={look.bg === YELLOW ? require('@/assets/characters/c-upright-purple.png') : require('@/assets/characters/c-upright-yellow.png')}
            contentFit="contain"
            style={{ position: 'absolute', left: W / 2 - 24, bottom: 36, width: 74, height: 74 }}
          />
        </>
      );
    }
    case 'wave':
      return (
        <Svg style={{ position: 'absolute', left: -3, bottom: -3 }} width={W + 6} height={66} viewBox="0 0 168 80" preserveAspectRatio="none">
          <Path d="M0 26 C21 6,42 6,63 26 S105 46,126 26 S168 6,189 26 V90 H0Z" fill={acc} stroke={INK} strokeWidth={2.5} />
          <Path d="M0 52 C21 32,42 32,63 52 S105 72,126 52 S168 32,189 52" fill="none" stroke={INK} strokeWidth={2.5} />
        </Svg>
      );
    case 'diag':
      return (
        <View style={[styles.edge, { top: 0, height: 36, borderBottomWidth: 2.5 }]}>
          <Svg style={StyleSheet.absoluteFill} width={W} height={36}>
            <Defs>
              <Pattern id={`d${id}`} patternUnits="userSpaceOnUse" width={20} height={20} patternTransform="rotate(-35)">
                <Rect x={0} y={0} width={20} height={20} fill={acc} />
                <Rect x={0} y={0} width={10} height={20} fill={INK} />
              </Pattern>
            </Defs>
            <Rect x={0} y={0} width={W} height={36} fill={`url(#d${id})`} />
          </Svg>
        </View>
      );
    case 'bubble':
      return (
        <Svg style={{ position: 'absolute', left: 0, top: 0 }} width={132} height={166} viewBox="0 0 163 205">
          <Path d="M36 24H127Q147 24 147 44V122Q147 142 127 142H70L46 168L50 142H36Q16 142 16 122V44Q16 24 36 24Z" fill="#fff" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
        </Svg>
      );
    case 'big':
      return null;
    case 'stage': {
      const light = look.dark ? 'rgba(255,226,0,0.55)' : 'rgba(255,255,255,0.7)';
      return (
        <>
          <Svg style={{ position: 'absolute', left: W / 2 - 40, top: -4 }} width={80} height={H - 24}>
            <Polygon points={`${80 * 0.38},0 ${80 * 0.62},0 80,${H - 24} 0,${H - 24}`} fill={light} />
          </Svg>
          <Svg style={{ position: 'absolute', left: 11, bottom: 13 }} width={W - 22} height={28}>
            <Ellipse cx={(W - 22) / 2} cy={14} rx={(W - 22) / 2 - 1.25} ry={12.75} fill={acc === look.text ? PINK : acc} stroke={INK} strokeWidth={2.5} />
          </Svg>
        </>
      );
    }
    case 'check':
      return (
        <View style={[styles.edge, { bottom: 0, height: 36, borderTopWidth: 2.5 }]}>
          <Svg style={StyleSheet.absoluteFill} width={W} height={36}>
            <Defs>
              <Pattern id={`c${id}`} patternUnits="userSpaceOnUse" width={18} height={18}>
                <Rect x={0} y={0} width={18} height={18} fill={acc === INK ? '#fff' : acc} />
                <Rect x={9} y={0} width={9} height={9} fill={INK} />
                <Rect x={0} y={9} width={9} height={9} fill={INK} />
              </Pattern>
            </Defs>
            <Rect x={0} y={0} width={W} height={36} fill={`url(#c${id})`} />
          </Svg>
        </View>
      );
    case 'half':
      return (
        <Svg style={StyleSheet.absoluteFill} width={W} height={H}>
          <Polygon points={`0,${H * 0.7} ${W},${H * 0.44} ${W},${H} 0,${H}`} fill={acc} />
          <Line x1={0} y1={H * 0.7} x2={W} y2={H * 0.44} stroke={INK} strokeWidth={2.5} />
        </Svg>
      );
  }
}

const styles = StyleSheet.create({
  w: { position: 'absolute', letterSpacing: -0.5, zIndex: 3 },
  round: { position: 'absolute', borderWidth: 2, borderColor: INK },
  band: { position: 'absolute', left: -16, right: -16, borderTopWidth: 2, borderBottomWidth: 2, borderColor: INK, transform: [{ rotate: '-6deg' }] },
  edge: { position: 'absolute', left: 0, right: 0, borderColor: INK, overflow: 'hidden' },
});
