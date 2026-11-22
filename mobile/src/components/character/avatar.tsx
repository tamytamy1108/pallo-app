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

import { AV_ART, AV_BG_ART, AV_BODY, AV_GEO, AV_HAIR_FILL, AV_HAIR_PART, AV_TINT, type AvRect } from './av-assets';

/*
 * 꾸민 캐릭터 그리기 (프로토타입 avCharHTML · avStage · lgFace).
 * 몸은 원본 3D PNG 그대로 — 추천 색은 색마다 원본, 직접 고른 색은 노랑 원본의 노랑 몸 픽셀만 같은 계산으로 바꿔요.
 * 아이템은 캐릭터 원본 좌표 위에 그린 그림(scripts/av-art)을 뜬 PNG 라 눈 · 팔 · 다리 자리에 꼭 맞아요.
 * 겹침: 날개 · 망토 · 손에 든 것 · 헤어 → 모자(캐릭터 뒤) · 몸 · 칠한 옷 · 눈 · 깜빡임 · 앞머리(모자 없을 때) · 앞 아이템. 효과(fx)는 무대에서 캐릭터 위에.
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

const rectStyle = (r: AvRect, w: number, h: number) => ({ position: 'absolute' as const, left: r[0] * w, top: r[1] * h, width: r[2] * w, height: r[3] * h });

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

type LidSpec = { t?: number; b?: number; only?: number };

/** 몸 색 눈꺼풀: t = 위에서 덮는 정도 · b = 아래에서 둥글게 올라오는 정도(웃는 눈) · only = 한쪽 눈만. 끝에 속눈썹 선 */
function Lids({ color, lid, w, h }: { color: string; lid: LidSpec; w: number; h: number }) {
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
        if (lid.only != null && lid.only !== i) return null;
        const t = y - ERY - 3;
        const b = y - ERY + 2 * ERY * (lid.t ?? 0);
        const bt = y + ERY + 3;
        const tp = y + ERY - 2 * ERY * (lid.b ?? 0);
        return (
          <G key={i} clipPath={`url(#c${u}${i})`}>
            {!!lid.t && <Path d={`M${x - 42} ${t} L${x + 42} ${t} L${x + 42} ${b} Q${x} ${b + 12} ${x - 42} ${b}Z`} fill={`url(#g${u})`} />}
            {!!lid.t && <Path d={`M${x + 42} ${b} Q${x} ${b + 12} ${x - 42} ${b}`} fill="none" stroke={Colors.ink} strokeWidth={7} />}
            {!!lid.b && <Path d={`M${x - 42} ${bt} L${x + 42} ${bt} L${x + 42} ${tp + 16} Q${x} ${tp - 22} ${x - 42} ${tp + 16}Z`} fill={col} />}
            {!!lid.b && <Path d={`M${x + 42} ${tp + 16} Q${x} ${tp - 22} ${x - 42} ${tp + 16}`} fill="none" stroke={Colors.ink} strokeWidth={7} />}
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
const BLINK: LidSpec = { t: 1.04 };

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
      <Lids color={color} lid={BLINK} w={w} h={h} />
    </Animated.View>
  );
}

// ---------------------------------------------------------------- 아이템

/** 바탕 위에 머리 색 칠하기 */
function Tinted({ base, fill, r, hc, w, h }: { base: number; fill: number; r: AvRect; hc: string; w: number; h: number }) {
  const box = rectStyle(r, w, h);
  return (
    <>
      <Image source={base} style={box} contentFit="fill" />
      <Image source={fill} style={box} contentFit="fill" tintColor={hc} />
    </>
  );
}

/** 아이템 한 개 (캐릭터 상자 w × h 기준 자리) — 헤어는 뒷머리 (모자를 덮어쓰면 모자 속을 뺀 뒷머리) */
function Sticker({ it, hc, w, h, capped = false }: { it: AvItem; hc: string; w: number; h: number; capped?: boolean }) {
  const g = AV_GEO[it.id];
  if (!g) return null;
  if (g.k === 'hair') {
    const p = AV_HAIR_PART[it.id];
    if (capped) return p?.cap && g.cap ? <Tinted base={p.cap.base} fill={p.cap.fill} r={g.cap} hc={hc} w={w} h={h} /> : null;
    return <Tinted base={AV_ART[it.id]} fill={AV_HAIR_FILL[it.id]} r={g.back} hc={hc} w={w} h={h} />;
  }
  if (g.k !== 'box') return null;
  return <Image source={AV_ART[it.id]} style={rectStyle(g.r, w, h)} contentFit="fill" />;
}

/** 눈 위 헤어: 모자가 없으면 앞머리 · 머리를 덮는 모자를 쓰면 모자 아랫선(clipY) 아래로 옆머리 */
function HairFront({ it, cover, hc, w, h }: { it: AvItem; cover?: AvItem; hc: string; w: number; h: number }) {
  const g = AV_GEO[it.id];
  const p = AV_HAIR_PART[it.id];
  if (!g || g.k !== 'hair' || !p) return null;
  if (!cover) return p.front && g.front ? <Tinted base={p.front.base} fill={p.front.fill} r={g.front} hc={hc} w={w} h={h} /> : null;
  const top = ((cover.clipY ?? 40) / 332) * h;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: -w, top, width: w * 3, height: h * 2, overflow: 'hidden' }}>
      <View style={{ position: 'absolute', left: w, top: -top, width: w, height: h }}>
        <Tinted base={p.side.base} fill={p.side.fill} r={g.side} hc={hc} w={w} h={h} />
      </View>
    </View>
  );
}

function EyeLayer({ it, color, w, h }: { it: AvItem; color: string; w: number; h: number }) {
  return (
    <>
      {it.lid && <Lids color={color} lid={it.lid} w={w} h={h} />}
      <Sticker it={it} hc="" w={w} h={h} />
    </>
  );
}

// ---------------------------------------------------------------- 캐릭터 · 무대 · 얼굴

type CharProps = { av: Avatar; width: number; flip?: boolean; blink?: boolean; style?: StyleProp<ViewStyle> };

/** 캐릭터(몸 + 입은 아이템)만 · 배경 없이 — 상자 크기 = width × width·332/520 (아이템은 상자 밖으로 삐져나와요) */
export const AvatarChar = memo(function AvatarChar({ av, width: w, flip = av.flip, blink = true, style }: CharProps) {
  const h = w * CHAR_RATIO;
  const its = wornItems(av);
  const hc = av.hc || '#3B2A20';
  const cover = its.find((i) => i.hat && i.cover);
  return (
    <View pointerEvents="none" style={[{ width: w, height: h }, flip && styles.flip, style]}>
      {its.filter((i) => i.layer === 'back').map((i) => <Sticker key={i.id} it={i} hc={hc} w={w} h={h} capped={!!cover} />)}
      <Body color={av.color} w={w} h={h} />
      {its.filter((i) => i.layer === 'paint').map((i) => <Sticker key={i.id} it={i} hc={hc} w={w} h={h} />)}
      {its.filter((i) => i.layer === 'eye').map((i) => <EyeLayer key={i.id} it={i} color={av.color} w={w} h={h} />)}
      {blink && <Blink color={av.color} w={w} h={h} />}
      {its.filter((i) => i.hair).map((i) => <HairFront key={i.id} it={i} cover={cover} hc={hc} w={w} h={h} />)}
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
        return g && g.k === 'stage' ? <Image key={i.id} source={AV_ART[i.id]} style={rectStyle(g.r, iw, ih)} contentFit="fill" /> : null;
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

/** 타일에서 보여 줄 캐릭터 부분 [x, y, 폭, 높이] (캐릭터 원본 좌표) */
const TILE_VIEW: Record<string, readonly [number, number, number, number]> = {
  hair: [150, -110, 300, 240],
  hat: [150, -125, 300, 255],
  eye: [200, 0, 200, 130],
  face: [180, 10, 240, 210],
  wear: [-10, 20, 540, 320],
  mitt: [-10, 30, 540, 170],
  shoe: [70, 160, 380, 230],
  hand: [330, -200, 320, 360],
  acc: [-90, -110, 700, 450],
};

/**
 * 상점 타일 그림: 노랑 캐릭터에 그 아이템 하나만 입혀서, 아이템이 있는 부분만 보여 줘요 (캐릭터에 어떻게 맞는지 바로 보여요).
 * 헤어는 고르는 중인 머리 색으로.
 */
export function ItemArt({ it, width, height, hc = '#3B2A20' }: { it: AvItem; width: number; height: number; hc?: string }) {
  const [vx, vy, vw, vh] = TILE_VIEW[it.cat] ?? TILE_VIEW.acc;
  const k = Math.min(width / vw, height / vh);
  const av = useMemo<Avatar>(() => ({ color: 'yellow', flip: false, bg: 'cream', hc, say: '', eq: { hair: null, eye: null, mitt: null, shoe: null, hat: null, face: null, wear: null, hand: null, acc: null, [it.cat]: it.id } }), [it, hc]);
  return (
    <View style={{ width, height, overflow: 'hidden' }}>
      <AvatarChar av={av} width={520 * k} blink={false} style={{ position: 'absolute', left: -vx * k + (width - vw * k) / 2, top: -vy * k + (height - vh * k) / 2 }} />
    </View>
  );
}

/** 효과 · 배경 타일 그림 (무대 그림을 작게) */
export function StageArt({ it, bgId, width, height }: { it?: AvItem; bgId?: string; width: number; height: number }) {
  if (bgId) return <Image source={AV_BG_ART[bgId]} style={{ width, height }} contentFit="cover" />;
  const g = it ? AV_GEO[it.id] : null;
  if (!it || !g || g.k !== 'stage') return null;
  return (
    <View style={{ width, height, backgroundColor: Colors.cream }}>
      <Image source={AV_ART[it.id]} style={rectStyle(g.r, width, height)} contentFit="fill" />
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
