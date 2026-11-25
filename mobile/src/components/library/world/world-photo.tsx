import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { css, useReducedMotion } from 'react-native-reanimated';
import Svg, { Ellipse, G, Path } from 'react-native-svg';

import { MyCharacter } from '@/components/character/my-character';
import { Pressable } from '@/components/ui/pressable';
import { Colors } from '@/constants/theme';

import type { FlatMap, FlatStop } from './flat-maps';
import { FocusCard, type CardInfo } from './focus-card';
import { ICO, type WorldSC } from './scenes';
import type { LabelSpec } from './stage';
import { BOX, HERE_H, LabelBody } from './world-labels';

/** 3D 기둥 색 (scenes.js stops: done · cur = 노랑, soon = 회색, open = 흰색) */
const PILLAR = { lit: '#FFE200', soon: '#E4DFD5', open: '#FFFFFF' };
const ICON_BG = { soon: '#EFEAE0', other: '#FFFFFF' };
const ICON_FG = { soon: '#9A93A6', other: Colors.ink };
/** 팔로 그림 비율 (프로토타입 .av-char 520:332) · 키 (scenes.js pallo hgt) */
const RIDER_BASE_H = 64;
const RIDER_BASE_W = (RIDER_BASE_H * 520) / 332;
const RIDER_HGT = { study: 1.15, sit: 1.45 };

type Box4 = number[];

/**
 * 2D 섬 지도 (사진판) — 3D 지도를 '모두 열림'으로 찍은 사진 위에, 3D 와 같은 자리 · 모양으로
 * 지금 정류장(크고 노란 기둥) · 곧 열릴 정류장(회색 기둥) · 곧 열릴 섬(흐림 + 구름) · 이름표 · 팔로 · 누르는 자리를 올려요.
 * 3D 와 다른 점: 돌리기 · 확대가 없어요. 누르면 같은 아래 카드(교재 보기 · 장면 열기)가 떠요.
 */
export function WorldPhoto({ map, sc, onOpen }: { map: FlatMap; sc: WorldSC; onOpen: (no: number) => void }) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [focus, setFocus] = useState<CardInfo | null>(null);
  const cur = sc.sel != null && sc[sc.sel] ? sc.sel : sc.findIndex((q) => q[2] === 'cur');

  const info = (i: number): CardInfo => {
    const [n, sub, st] = sc[i];
    return map.study ? { n, st, no: i + 1, k: `Lv.${i} · ${sub}`, goT: '교재 보기', soonT: '커밍순' } : { n, st, no: i + 1 };
  };

  return (
    <View style={styles.fill} onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      <Image source={map.img} style={styles.fill} contentFit="fill" cachePolicy="memory-disk" transition={0} accessible={false} />
      {size && (
        <Photo map={map} sc={sc} cur={cur} w={size.w} h={size.h} onTap={(i) => setFocus(info(i))} />
      )}
      <FocusCard info={focus} onGo={(no) => onOpen(no)} onClose={() => setFocus(null)} />
    </View>
  );
}

function Photo({ map, sc, cur, w, h, onTap }: { map: FlatMap; sc: WorldSC; cur: number; w: number; h: number; onTap: (i: number) => void }) {
  const X = (f: number) => f * w;
  const Y = (f: number) => f * h;
  const ppu = map.ppu * w;
  const rows = sc.slice(0, map.stops.length);

  const labels: { spec: LabelSpec; x: number; y: number }[] = [];
  rows.forEach(([name, sub, st], i) => {
    const s = map.stops[i];
    if (map.study) {
      if (s.lbl) labels.push({ spec: { kind: 'lv', title: name, sub, st }, x: X(s.lbl[0]), y: Y(s.lbl[1]) });
    } else if (i === cur && s.cur) {
      labels.push({ spec: { kind: 'tag', text: name }, x: X(s.cur.tag[0]), y: Y(s.cur.tag[1]) });
      labels.push({ spec: { kind: 'here', text: 'START' }, x: X(s.cur.here[0]), y: Y(s.cur.here[1]) - HERE_H });
    } else if (s.open) {
      labels.push({ spec: { kind: 'min', num: i + 1, text: name, soon: st === 'soon' }, x: X(s.open.lbl[0]), y: Y(s.open.lbl[1]) });
    }
  });

  const curStop = cur >= 0 ? map.stops[cur] : undefined;
  const riderSpot = curStop ? (map.study ? curStop.pallo : (curStop.cur?.pallo ?? curStop.pallo)) : null;
  const riderH = (map.study ? RIDER_HGT.study : RIDER_HGT.sit) * ppu * 1.05;

  return (
    <>
      <Svg width={w} height={h} style={StyleSheet.absoluteFill} pointerEvents="none">
        {rows.map(([, icon, st], i) => {
          const s = map.stops[i];
          if (map.study) return st === 'soon' ? <Fog key={i} s={s} X={X} Y={Y} /> : null;
          if (st === 'open' && i !== cur) return null; // 사진에 그려져 있어요
          const g = i === cur ? s.cur : s.open;
          if (!g) return null;
          const fill = i === cur || st === 'done' ? PILLAR.lit : st === 'soon' ? PILLAR.soon : PILLAR.open;
          return <Pillar key={i} top={g.top} base={g.base} fill={fill} icon={icon} soon={st === 'soon'} X={X} Y={Y} />;
        })}
      </Svg>

      {/* 누르는 자리: 정류장 기둥 · 섬 */}
      {rows.map((_, i) => {
        const s = map.stops[i];
        const hit = hitBox(map, s, i === cur, X, Y, ppu);
        return (
          <Pressable
            key={i}
            onPress={() => onTap(i)}
            accessibilityRole="button"
            accessibilityLabel={`${sc[i][0]}${sc[i][2] === 'soon' ? ', 곧 열려요' : i === cur ? ', 지금' : ''}`}
            style={[styles.hit, hit]}
          />
        );
      })}

      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {riderSpot && <Rider x={X(riderSpot[0])} y={Y(riderSpot[1])} h={riderH} />}
        {labels.map((l, i) => (
          <View key={i} style={[styles.label, { transform: [{ translateX: l.x - BOX / 2 }, { translateY: l.y }] }]}>
            <LabelBody spec={l.spec} zoomed={false} />
          </View>
        ))}
      </View>
    </>
  );
}

/** 누르는 자리: 상황 맵은 기둥 둘레, 스터디 맵은 섬 둘레 (손가락 크기 이상) */
function hitBox(map: FlatMap, s: FlatStop, isCur: boolean, X: (f: number) => number, Y: (f: number) => number, ppu: number) {
  if (map.study) {
    const r = Math.max(44, 2 * ppu);
    return { left: X(s.xy[0]) - r, top: Y(s.xy[1]) - r * 0.7, width: r * 2, height: r * 1.4 };
  }
  const g = isCur ? s.cur : s.open;
  const t = g ? g.top : [s.xy[0], s.xy[1], s.xy[0], s.xy[1]];
  const b = g ? g.base : t;
  const cx = X((t[0] + t[2]) / 2);
  const top = Y(t[1]);
  const bottom = Y(b[3]);
  const size = Math.max(40, X(t[2]) - X(t[0]) + 12, bottom - top + 12);
  return { left: cx - size / 2, top: (top + bottom) / 2 - size / 2, width: size, height: size };
}

/** 3D 정류장 기둥 한 개 (옆면 + 윗면 + 아이콘 판) — 사진의 흰 기둥을 그대로 덮어요 */
function Pillar({ top, base, fill, icon, soon, X, Y }: { top: Box4; base: Box4; fill: string; icon: string; soon: boolean; X: (f: number) => number; Y: (f: number) => number }) {
  const t = ell(top, X, Y);
  const b = ell(base, X, Y);
  const side = `M${t.cx - t.rx},${t.cy} L${b.cx - b.rx},${b.cy} A${b.rx},${b.ry} 0 0 0 ${b.cx + b.rx},${b.cy} L${t.cx + t.rx},${t.cy} Z`;
  const d = ICO[icon];
  const ir = t.rx * 0.82;
  const k = (ir * 1.25) / 24;
  return (
    <G>
      <Ellipse cx={b.cx} cy={b.cy} rx={b.rx} ry={b.ry} fill={fill} stroke={Colors.ink} strokeWidth={1.6} />
      <Path d={side} fill={fill} stroke={Colors.ink} strokeWidth={1.6} strokeLinejoin="round" />
      <Ellipse cx={t.cx} cy={t.cy} rx={t.rx} ry={t.ry} fill={fill} stroke={Colors.ink} strokeWidth={1.6} />
      <Ellipse cx={t.cx} cy={t.cy} rx={ir} ry={t.ry * 0.82} fill={soon ? ICON_BG.soon : ICON_BG.other} />
      {d && (
        <G transform={`translate(${t.cx - 12 * k} ${t.cy - 12 * k * (t.ry / t.rx)}) scale(${k} ${k * (t.ry / t.rx)})`}>
          <Path d={d} fill="none" stroke={soon ? ICON_FG.soon : ICON_FG.other} strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round" />
        </G>
      )}
    </G>
  );
}

/** 곧 열릴 섬: 3D 처럼 흐리게 + 구름 두 덩이 */
function Fog({ s, X, Y }: { s: FlatStop; X: (f: number) => number; Y: (f: number) => number }) {
  const pts = s.isle ?? [];
  const xs = pts.map((p) => X(p[0]));
  const rx = xs.length ? (Math.max(...xs) - Math.min(...xs)) / 2 : 40;
  const cx = X(s.xy[0]);
  const cy = Y(s.xy[1]) + rx * 0.12;
  return (
    <G>
      <Ellipse cx={cx} cy={cy} rx={rx * 0.95} ry={rx * 0.62} fill="#F4F1EA" opacity={0.6} />
      <G fill="#FFFFFF" opacity={0.95}>
        <Ellipse cx={cx - rx * 0.45} cy={cy - rx * 0.05} rx={rx * 0.32} ry={rx * 0.16} />
        <Ellipse cx={cx - rx * 0.28} cy={cy - rx * 0.13} rx={rx * 0.2} ry={rx * 0.14} />
        <Ellipse cx={cx + rx * 0.5} cy={cy + rx * 0.12} rx={rx * 0.28} ry={rx * 0.14} />
        <Ellipse cx={cx + rx * 0.62} cy={cy + rx * 0.05} rx={rx * 0.17} ry={rx * 0.12} />
      </G>
    </G>
  );
}

const ell = (bx: Box4, X: (f: number) => number, Y: (f: number) => number) => ({
  cx: X((bx[0] + bx[2]) / 2),
  cy: Y((bx[1] + bx[3]) / 2),
  rx: (X(bx[2]) - X(bx[0])) / 2,
  ry: (Y(bx[3]) - Y(bx[1])) / 2,
});

/** 팔로(내 캐릭터): 발이 3D 와 같은 자리에 · 가끔 콩콩 */
const hopKf = css.keyframes({
  '0%, 60%, 100%': { transform: [{ translateY: 0 }, { scaleX: 1 }, { scaleY: 1 }] },
  '68%': { transform: [{ translateY: 0 }, { scaleX: 1.1 }, { scaleY: 0.9 }] },
  '80%': { transform: [{ translateY: -8 }, { scaleX: 0.95 }, { scaleY: 1.06 }] },
  '90%': { transform: [{ translateY: 0 }, { scaleX: 1.05 }, { scaleY: 0.95 }] },
});
function Rider({ x, y, h }: { x: number; y: number; h: number }) {
  const still = useReducedMotion();
  // 3D 지도(RiderView)처럼 정해진 크기로 그리고 scale 로 맞춰요 (캐릭터 그림이 제 크기를 가져요)
  const k = h / RIDER_BASE_H;
  return (
    <View style={{ position: 'absolute', left: x - RIDER_BASE_W / 2, top: y - RIDER_BASE_H, width: RIDER_BASE_W, height: RIDER_BASE_H, transformOrigin: 'bottom', transform: [{ scale: k }] }}>
      <Animated.View style={[{ width: RIDER_BASE_W, height: RIDER_BASE_H, transformOrigin: 'bottom' }, !still && { animationName: hopKf, animationDuration: '1800ms', animationIterationCount: 'infinite', animationTimingFunction: 'ease-in-out' }]}>
        <MyCharacter style={{ width: RIDER_BASE_W, height: RIDER_BASE_H }} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  hit: { position: 'absolute' },
  label: { position: 'absolute', left: 0, top: 0, width: BOX, alignItems: 'center' },
});
