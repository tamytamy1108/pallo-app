import { Image } from 'expo-image';
import { memo, useId, useMemo, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { css, useReducedMotion } from 'react-native-reanimated';
import Svg, { ClipPath, Defs, Ellipse, G, LinearGradient, Path, Stop } from 'react-native-svg';

import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { AV_BG, AV_COLOR_HEX, AV_ITEM, memberAvatar, type Avatar, type AvItem } from '@/data/my';
import { getMe } from '@/state/me';
import { useMyAvatar } from '@/state/avatar';

import { AV_ART, AV_BG_ART, AV_BODY, AV_GEO, AV_HAIR_FILL, AV_TINT } from './av-assets';

/*
 * 꾸민 캐릭터 그리기 (프로토타입 avCharHTML · avStage · lgFace).
 * 몸은 원본 3D PNG 그대로 — 추천 색은 색마다 원본, 직접 고른 색은 노랑 원본의 노랑 몸 픽셀만 같은 계산으로 바꿔요.
 * 아이템은 프로토타입 SVG 를 그대로 뜬 PNG 를 같은 자리(캐릭터 상자 % 기준)에 얹어요.
 * 겹침: 날개 → 헤어 → 모자(캐릭터 뒤) · 몸 · 칠한 옷 · 눈 · 깜빡임 · 앞 아이템. 효과(fx)는 무대에서 캐릭터 위에.
 */

export const CHAR_RATIO = 332 / 520;
export const STAGE_RATIO = 220 / 300;

const hexRgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const rgbHex = (r: number, g: number, b: number) => '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase();
const mixHex = (h: string, t: string, k: number) => {
  const a = hexRgb(h);
  const b = hexRgb(t);
  return rgbHex(a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k);
};
export const bodyHex = (color: string) => (color[0] === '#' ? color : AV_COLOR_HEX[color] || '#FFE200');

/** 입은 아이템 (모자 > 헤어 > 나머지 순으로 뒤에서 앞으로) */
const wornItems = (a: Avatar) =>
  Object.values(a.eq)
    .map((id) => (id ? AV_ITEM[id] : undefined))
    .filter((i): i is AvItem => !!i)
    .sort((x, y) => (x.hat ? 2 : x.hair ? 1 : 0) - (y.hat ? 2 : y.hair ? 1 : 0));

// ---------------------------------------------------------------- 몸

/** 몸: 추천 색은 원본 PNG · 직접 고른 색은 4장 겹치기 (노랑을 뺀 원본 + 회색(명도) + 목표 색(채도만큼) + 그림자) */
function Body({ color, w, h }: { color: string; w: number; h: number }) {
  const box = { position: 'absolute' as const, left: 0, top: 0, width: w, height: h };
  if (color[0] !== '#') return <Image source={AV_BODY[color] ?? AV_BODY.yellow} style={box} contentFit="fill" />;
  const v = Math.max(...hexRgb(color));
  const gray = rgbHex(v, v, v);
  return (
    <>
      <Image source={AV_TINT.base} style={box} contentFit="fill" />
      <Image source={AV_TINT.fill} style={box} contentFit="fill" tintColor={gray} />
      <Image source={AV_TINT.sat} style={box} contentFit="fill" tintColor={color} />
      <Image source={AV_TINT.shade} style={box} contentFit="fill" />
    </>
  );
}

// ---------------------------------------------------------------- 눈꺼풀 (졸린 · 느긋한 눈 · 깜빡임) — 몸 색

const EYES = [
  { x: 258.5, y: 64, ix: 260, iy: 64.5 },
  { x: 339.5, y: 65.5, ix: 341, iy: 65.5 },
];
const ERY = 57.5;
const EIRX = 25.5;
const EIRY = 44;

/** 프로토타입 avLids: 몸 색 + 위는 밝게 아래는 살짝 어둡게 + 아래 끝 속눈썹 선. k = 덮는 정도 */
function Lids({ color, k, w, h }: { color: string; k: number; w: number; h: number }) {
  const u = useId().replace(/[^a-zA-Z0-9]/g, '');
  const col = bodyHex(color);
  return (
    <Svg width={w} height={h} viewBox="0 0 520 332" style={styles.abs} pointerEvents="none">
      <Defs>
        <LinearGradient id={`g${u}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={mixHex(col, '#FFFFFF', 0.28)} />
          <Stop offset="0.7" stopColor={col} />
          <Stop offset="1" stopColor={mixHex(col, '#1E1A2B', 0.14)} />
        </LinearGradient>
        {EYES.map((e, i) => (
          <ClipPath key={i} id={`c${u}${i}`}>
            <Ellipse cx={e.ix} cy={e.iy} rx={EIRX} ry={EIRY} />
          </ClipPath>
        ))}
      </Defs>
      {EYES.map(({ x, y }, i) => {
        const t = y - ERY - 3;
        const b = y - ERY + 2 * ERY * k;
        return (
          <G key={i} clipPath={`url(#c${u}${i})`}>
            <Path d={`M${x - 42} ${t} L${x + 42} ${t} L${x + 42} ${b} Q${x} ${b + 12} ${x - 42} ${b}Z`} fill={`url(#g${u})`} />
            <Path d={`M${x + 42} ${b} Q${x} ${b + 12} ${x - 42} ${b}`} fill="none" stroke={Colors.ink} strokeWidth={7} />
          </G>
        );
      })}
    </Svg>
  );
}

/**
 * 깜빡임 (프로토타입 avBlink: 3초마다 93~95% 동안 눈꺼풀이 덮여요 · 캐릭터마다 때가 달라요).
 * 다 덮인 눈꺼풀을 위에서부터 드러내는 칸의 높이를 움직여요 (홈 맵 캐릭터와 같은 방법). 움직임 줄이기면 안 깜빡여요.
 */
function Blink({ color, w, h }: { color: string; w: number; h: number }) {
  const still = useReducedMotion();
  const [delay] = useState(() => `${Math.round(Math.random() * 3000)}ms`);
  const lidH = (112 / 332) * h;
  const kf = useMemo(() => css.keyframes({ '0%, 90%, 100%': { height: 0 }, '93%, 95%': { height: lidH } }), [lidH]);
  if (still) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.lidBox, { width: w, animationName: kf, animationDuration: '3s', animationDelay: delay, animationIterationCount: 'infinite' }]}>
      <Lids color={color} k={1.04} w={w} h={h} />
    </Animated.View>
  );
}

// ---------------------------------------------------------------- 아이템

/** 스티커 아이템 한 개 (캐릭터 상자 w × h 안 자리) */
function Sticker({ it, hc, w, h }: { it: AvItem; hc: string; w: number; h: number }) {
  const g = AV_GEO[it.id];
  if (!g) return null;
  if (g.k === 'box') {
    return <Image source={AV_ART[it.id]} style={{ position: 'absolute', left: g.r[0] * w, top: g.r[1] * h, width: g.r[2] * w, height: g.r[3] * h }} contentFit="fill" />;
  }
  if (!it.p) return null;
  const [cx, top, pw] = it.p;
  const iw = (pw / 100) * w;
  const box = { position: 'absolute' as const, left: ((cx - pw / 2) / 100) * w + g.r[0] * iw, top: (top / 100) * h + g.r[1] * iw, width: g.r[2] * iw, height: g.r[3] * iw };
  return (
    <>
      <Image source={AV_ART[it.id]} style={box} contentFit="fill" />
      {it.hair && <Image source={AV_HAIR_FILL[it.id]} style={box} contentFit="fill" tintColor={hc} />}
    </>
  );
}

function EyeLayer({ it, color, w, h }: { it: AvItem; color: string; w: number; h: number }) {
  if (it.lid) return <Lids color={color} k={it.lid} w={w} h={h} />;
  return <Sticker it={it} hc="" w={w} h={h} />;
}

// ---------------------------------------------------------------- 캐릭터 · 무대 · 얼굴

type CharProps = { av: Avatar; width: number; flip?: boolean; blink?: boolean; style?: StyleProp<ViewStyle> };

/** 캐릭터(몸 + 입은 아이템)만 · 배경 없이 — 상자 크기 = width × width·332/520 (아이템은 상자 밖으로 삐져나와요) */
export const AvatarChar = memo(function AvatarChar({ av, width: w, flip = av.flip, blink = true, style }: CharProps) {
  const h = w * CHAR_RATIO;
  const its = wornItems(av);
  const hc = av.hc || '#3B2A20';
  return (
    <View pointerEvents="none" style={[{ width: w, height: h }, flip && styles.flip, style]}>
      {its.filter((i) => i.layer === 'back').map((i) => <Sticker key={i.id} it={i} hc={hc} w={w} h={h} />)}
      <Body color={av.color} w={w} h={h} />
      {its.filter((i) => i.layer === 'paint').map((i) => <Sticker key={i.id} it={i} hc={hc} w={w} h={h} />)}
      {its.filter((i) => i.layer === 'eye').map((i) => <EyeLayer key={i.id} it={i} color={av.color} w={w} h={h} />)}
      {blink && <Blink color={av.color} w={w} h={h} />}
      {its.filter((i) => i.layer === 'front').map((i) => <Sticker key={i.id} it={i} hc={hc} w={w} h={h} />)}
    </View>
  );
});

type StageProps = { av: Avatar; width: number; border?: boolean; big?: boolean; style?: StyleProp<ViewStyle> };

/** 캐릭터 룸: 배경 + 효과 + 캐릭터 + 말풍선 (프로토타입 .av-stage · 300:220 · 둥글기 20) */
export function AvatarStage({ av, width, border = false, big = false, style }: StageProps) {
  const bw = border ? 2 : 0;
  const iw = width - bw * 2;
  const ih = width * STAGE_RATIO - bw * 2;
  const cw = iw * 0.64;
  const fx = wornItems(av).filter((i) => i.layer === 'fx');
  const hexBg = av.bg[0] === '#';
  const bg = hexBg ? null : AV_BG.find((b) => b.id === av.bg) ? av.bg : 'cream';
  return (
    <View style={[styles.stage, { width, height: width * STAGE_RATIO, borderWidth: bw, backgroundColor: hexBg ? av.bg : Colors.cream }, style]}>
      {bg && <Image source={AV_BG_ART[bg]} style={{ position: 'absolute', left: 0, top: 0, width: iw, height: ih }} contentFit="fill" />}
      <AvatarChar av={av} width={cw} style={{ position: 'absolute', left: iw * 0.18, top: ih * 0.9 - cw * CHAR_RATIO }} />
      {fx.map((i) => {
        const g = AV_GEO[i.id];
        return g ? <Image key={i.id} source={AV_ART[i.id]} style={{ position: 'absolute', left: g.r[0] * iw, top: g.r[1] * ih, width: g.r[2] * iw, height: g.r[3] * ih }} contentFit="fill" /> : null;
      })}
      {!!av.say && <SayBubble text={av.say} big={big} maxWidth={iw * 0.46} left={iw * 0.06} top={ih * 0.2} />}
    </View>
  );
}

/** 말풍선 (프로토타입 .av-say: 흰 바탕 · 잉크 2px · 오른쪽 아래 꼬리) */
function SayBubble({ text, big, maxWidth, left, top }: { text: string; big: boolean; maxWidth: number; left: number; top: number }) {
  return (
    <View style={[styles.say, { left, top, maxWidth }]}>
      <PText style={[styles.sayText, big && styles.sayBig]}>{text}</PText>
      <View style={styles.sayTail} />
    </View>
  );
}

/** 동그란 프로필 얼굴 (프로토타입 lgFace · .fc .lgf: 캐릭터를 116% 로 크게 · 위 22%) — 내 이름이면 내 캐릭터 */
export function MemberFace({ name, size, border = 2, bg, style }: { name: string; size: number; border?: number; bg?: string; style?: StyleProp<ViewStyle> }) {
  const mine = useMyAvatar();
  const av = name === getMe().name ? mine : memberAvatar(name);
  const face = av.bg[0] === '#' ? av.bg : (AV_BG.find((b) => b.id === av.bg) ?? AV_BG[0]).face;
  const inner = size - border * 2;
  return (
    <View style={[{ width: size, height: size, borderRadius: size / 2, borderWidth: border, borderColor: Colors.ink, backgroundColor: bg ?? face, overflow: 'hidden' }, style]}>
      <View style={[styles.abs, { width: inner, height: inner, borderRadius: inner / 2, overflow: 'hidden', backgroundColor: face }]}>
        <AvatarChar av={av} width={inner * 1.16} style={{ position: 'absolute', left: -inner * 0.08, top: inner * 0.22 }} />
      </View>
    </View>
  );
}

/**
 * 상점 타일 그림: 아이템 하나만 (프로토타입 .av-tile .art svg — 가로 76% · 세로 60px 안에 맞춰요).
 * 헤어는 고르는 중인 머리 색으로.
 */
export function ItemArt({ it, maxW, maxH, hc = '#3B2A20' }: { it: AvItem; maxW: number; maxH: number; hc?: string }) {
  const g = AV_GEO[it.id];
  if (!g || g.k !== 'item') return null;
  const a = g.a ?? 1;
  const sw = Math.min(maxW, maxH / a);
  const box = { position: 'absolute' as const, left: g.r[0] * sw, top: g.r[1] * sw, width: g.r[2] * sw, height: g.r[3] * sw };
  return (
    <View style={{ width: sw, height: sw * a }}>
      <Image source={AV_ART[it.id]} style={box} contentFit="fill" />
      {it.hair && <Image source={AV_HAIR_FILL[it.id]} style={box} contentFit="fill" tintColor={hc} />}
    </View>
  );
}

/** 효과 · 배경 타일 그림 (무대 그림을 작게) */
export function StageArt({ it, bgId, width, height }: { it?: AvItem; bgId?: string; width: number; height: number }) {
  if (bgId) return <Image source={AV_BG_ART[bgId]} style={{ width, height }} contentFit="cover" />;
  const g = it ? AV_GEO[it.id] : null;
  if (!it || !g) return null;
  return (
    <View style={{ width, height, backgroundColor: Colors.cream }}>
      <Image source={AV_ART[it.id]} style={{ position: 'absolute', left: g.r[0] * width, top: g.r[1] * height, width: g.r[2] * width, height: g.r[3] * height }} contentFit="fill" />
    </View>
  );
}

/** 몸 색 타일 (원본 색 PNG) */
export function BodyArt({ color, width }: { color: string; width: number }) {
  return (
    <View style={{ width, height: width * CHAR_RATIO }}>
      <Body color={color} w={width} h={width * CHAR_RATIO} />
    </View>
  );
}

/** 노랑 캐릭터에 아이템 하나만 입힌 작은 그림 (프로토타입 .wmini — 칠한 옷 · 눈 타일) */
export function MiniWear({ it, width }: { it: AvItem; width: number }) {
  const h = width * CHAR_RATIO;
  return (
    <View style={{ width, height: h }}>
      <Body color="yellow" w={width} h={h} />
      {it.layer === 'eye' ? <EyeLayer it={it} color="yellow" w={width} h={h} /> : <Sticker it={it} hc="" w={width} h={h} />}
    </View>
  );
}

const styles = StyleSheet.create({
  abs: { position: 'absolute', left: 0, top: 0 },
  flip: { transform: [{ scaleX: -1 }] },
  lidBox: { position: 'absolute', left: 0, top: 0, height: 0, overflow: 'hidden' },
  stage: { position: 'relative', overflow: 'hidden', borderRadius: 20, borderColor: Colors.ink },
  say: { position: 'absolute', zIndex: 4, backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.ink, borderRadius: 14, paddingVertical: 5, paddingHorizontal: 10 },
  sayText: { fontFamily: Font.body900, fontSize: 12, lineHeight: 15 },
  sayBig: { fontSize: 13.5, lineHeight: 17 },
  sayTail: {
    position: 'absolute',
    right: 16,
    bottom: -7,
    width: 11,
    height: 11,
    backgroundColor: Colors.white,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: Colors.ink,
    borderBottomRightRadius: 2,
    transform: [{ rotate: '45deg' }],
  },
});
