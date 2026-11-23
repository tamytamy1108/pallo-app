import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Ellipse, G, Path } from 'react-native-svg';

import { Pressable } from '@/components/ui/pressable';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';

import { ICO, type WorldSC } from './scenes';
import { FocusCard, type CardInfo } from './focus-card';

const ISLE = 54;
const SOON_LINE = '#9A93A6';
const SOON_INK = '#6F6880';
/** 섬이 적으면 꼬불꼬불(가운데 · 오른쪽 · 가운데 · 왼쪽), 많으면 좌우로 번갈아 (위아래 섬이 겹치지 않게) */
const ZIG_FEW = [0, 1, 0, -1];
const ZIG_MANY = [-1, 1];

/**
 * 2D 섬 지도 — 3D(WebGL)를 못 그리는 기기에서 대신 보여 줘요 (world-view 가 골라요).
 * 3D 지도와 같은 데이터(sc) · 같은 동작: 섬을 누르면 아래 카드 → [교재 보기 · 장면 열기]. 지금 섬은 노랑, 곧 열릴 섬은 점선.
 * 아래에서 위로 꼬불꼬불 올라가요 (첫 섬이 맨 아래).
 */
export function WorldFlat({ id, sc, onOpen }: { id: string; sc: WorldSC; onOpen: (no: number) => void }) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [focus, setFocus] = useState<CardInfo | null>(null);
  const study = id === 'study2';
  const n = sc.length;
  const cur = sc.sel != null && sc[sc.sel] ? sc.sel : sc.findIndex((q) => q[2] === 'cur');

  const pts = size
    ? sc.map((_, i) => {
        const top = 64;
        const bottom = size.h - 70;
        const y = n > 1 ? bottom - ((bottom - top) * i) / (n - 1) : (top + bottom) / 2;
        const zig = n > 5 ? ZIG_MANY[i % 2] : ZIG_FEW[i % 4];
        return { x: size.w / 2 + zig * (size.w / 2 - 78), y };
      })
    : [];
  const route = pts.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `C${pts[i - 1].x},${(pts[i - 1].y + p.y) / 2} ${p.x},${(pts[i - 1].y + p.y) / 2} ${p.x},${p.y}`)).join(' ');

  const info = (i: number): CardInfo => {
    const [name, sub, st] = sc[i];
    return study ? { n: name, st, no: i + 1, k: `Lv.${i} · ${sub}`, goT: '교재 보기', soonT: '커밍순' } : { n: name, st, no: i + 1 };
  };

  return (
    <View style={styles.fill} onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      {size && (
        <>
          <Svg width={size.w} height={size.h} style={StyleSheet.absoluteFill} pointerEvents="none">
            {/* 잔물결 */}
            <G stroke="#FFFFFF" strokeOpacity={0.55} strokeWidth={2} strokeLinecap="round" fill="none">
              <Path d={`M24 ${size.h * 0.2}q8 -5 16 0t16 0`} />
              <Path d={`M${size.w - 70} ${size.h * 0.42}q8 -5 16 0t16 0`} />
              <Path d={`M30 ${size.h * 0.66}q8 -5 16 0t16 0`} />
              <Path d={`M${size.w - 60} ${size.h * 0.86}q8 -5 16 0t16 0`} />
            </G>
            {pts.length > 1 && <Path d={route} fill="none" stroke={Colors.white} strokeWidth={5} strokeLinecap="round" strokeDasharray="1 11" />}
          </Svg>

          {pts.map((p, i) => {
            const [name, sub, st] = sc[i];
            const soon = st === 'soon';
            const here = i === cur;
            const icon = !study ? ICO[sub] : undefined;
            const label = study ? `${name}, ${sub}` : name;
            return (
              <View key={i} style={StyleSheet.flatten([styles.stop, { left: p.x - 60, top: p.y - ISLE / 2 }])}>
                <Pressable
                  onPress={() => setFocus(info(i))}
                  accessibilityRole="button"
                  accessibilityLabel={`${label}${soon ? ', 곧 열려요' : st === 'done' ? ', 완료' : here ? ', 지금' : ''}`}
                  style={({ pressed }) => pressed && styles.pressed}>
                  <Svg width={ISLE + 8} height={ISLE * 0.62 + 10} viewBox="-4 -4 62 44">
                    <Ellipse cx={27} cy={22} rx={27} ry={14} fill={Colors.ink} />
                    <Ellipse cx={27} cy={18} rx={27} ry={14} fill={soon ? '#E9E3D6' : '#F2DDB0'} stroke={Colors.ink} strokeWidth={2.2} />
                    <Ellipse cx={27} cy={14} rx={19} ry={8} fill={soon ? '#D8D2C6' : here ? Colors.yellow : '#9BD27E'} stroke={Colors.ink} strokeWidth={2} />
                    {icon && (
                      <G transform="translate(19 6) scale(0.66)">
                        <Path d={icon} fill="none" stroke={soon ? SOON_INK : Colors.ink} strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round" />
                      </G>
                    )}
                  </Svg>
                </Pressable>
                <View style={StyleSheet.flatten([styles.tag, here && styles.tagCur, soon && styles.tagSoon])} pointerEvents="none">
                  <PText style={StyleSheet.flatten([styles.tagText, soon && { color: SOON_INK }])} numberOfLines={1}>
                    {study ? name : `${i + 1}. ${name}`}
                  </PText>
                  {study && (
                    <PText style={StyleSheet.flatten([styles.tagSub, soon && { color: SOON_INK }])} numberOfLines={1}>
                      {sub}
                    </PText>
                  )}
                </View>
              </View>
            );
          })}
        </>
      )}
      <View style={styles.note} pointerEvents="none">
        <PText style={styles.noteText} color={Colors.inkSub}>
          간단한 지도
        </PText>
      </View>
      <FocusCard info={focus} onGo={(no) => onOpen(no)} onClose={() => setFocus(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: '#BFE4EC' },
  stop: { position: 'absolute', width: 120, alignItems: 'center' },
  pressed: { transform: [{ scale: 0.95 }] },
  tag: { marginTop: 2, maxWidth: 120, paddingTop: 2, paddingBottom: 3, paddingHorizontal: 8, borderRadius: 11, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center' },
  tagCur: { backgroundColor: Colors.yellow, boxShadow: `2px 2px 0 ${Colors.ink}` },
  tagSoon: { borderStyle: 'dashed', borderColor: SOON_LINE, backgroundColor: 'rgba(255,255,255,0.88)' },
  tagText: { fontFamily: Font.body900, fontSize: 11, lineHeight: 14.3 },
  tagSub: { fontFamily: Font.body800, fontSize: 10, lineHeight: 11.5, color: '#5A5366' },
  note: { position: 'absolute', top: 12, left: 12, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.75)' },
  noteText: { fontFamily: Font.body800, fontSize: 10.5, lineHeight: 14 },
});
