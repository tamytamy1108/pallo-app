import { useContext, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { SheetFooterContext } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { sfx, type Sfx } from '@/lib/feedback';

/*
 * 시트 안에서 자주 쓰는 조각들 (프로토타입 라운지 시트 #lgSheet 의 .lg-btn · .lg-opts · p.ds · .lg-pills · .lg-link).
 * 여러 담당이 같이 써요 — 모양을 바꿀 땐 프로토타입 CSS 를 먼저 봐요.
 */

/** 설명 한 줄 (p.ds — 14px · 600 · 보조색) */
export function SheetDesc({ children, center = false }: { children: ReactNode; center?: boolean }) {
  return <PText style={[styles.ds, center && styles.center]}>{children}</PText>;
}

/** 작은 안내 (p.lg-brnote — 위아래로 조금 더 띄워요) */
export function SheetNote({ children }: { children: ReactNode }) {
  return <PText style={styles.note}>{children}</PText>;
}

/** 입력칸 · 고르기 위 이름표 (.lg-fl > .lb — 12.5px · 900) */
export function FieldLabel({ children }: { children: ReactNode }) {
  return <PText style={styles.lb}>{children}</PText>;
}

export type SheetButtonTone = 'yellow' | 'white' | 'purple' | 'dark' | 'bad';
/** inline: 시트 안 한 줄 버튼 (50px · 13px) · pair: 두 개 나란히 (50px · 15px) · foot: 아래 고정 칸에 하나 (52px · 15.5px) */
export type SheetButtonSize = 'inline' | 'pair' | 'foot';

const TONE: Record<SheetButtonTone, { bg: string; ink: string }> = {
  yellow: { bg: Colors.yellow, ink: Colors.ink },
  white: { bg: Colors.white, ink: Colors.ink },
  purple: { bg: Colors.purple, ink: Colors.white },
  dark: { bg: Colors.ink, ink: Colors.white },
  bad: { bg: '#E5484D', ink: Colors.white },
};
const SIZE: Record<SheetButtonSize, { h: number; fs: number }> = { inline: { h: 50, fs: 13 }, pair: { h: 50, fs: 15 }, foot: { h: 52, fs: 15.5 } };

/**
 * 시트 버튼 (.lg-btn: 잉크 2px · 둥글기 20 · 그림자 3px · 누르면 그림자 자리로 쏙).
 * tone: yellow(기본) · white(.wh) · purple(.pu) · dark(.done) · bad(빨강 — 차단하기)
 */
export function SheetButton({
  label,
  onPress,
  tone = 'yellow',
  size = 'pair',
  disabled = false,
  icon,
  style,
  sound,
}: {
  label: string;
  onPress?: () => void;
  tone?: SheetButtonTone;
  size?: SheetButtonSize;
  disabled?: boolean;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** 효과음 바꾸기 (기본: 노랑 '뿅' · 그 밖 '톡', 닫기 · 이전은 'back') */
  sound?: Sfx;
}) {
  const inFooter = useContext(SheetFooterContext);
  const t = TONE[tone];
  const { h, fs } = SIZE[size];
  const bg = disabled ? (tone === 'bad' ? '#EFE9DC' : '#E3DDD0') : t.bg;
  const ink = disabled ? (tone === 'bad' ? '#A39C8C' : '#8C8597') : t.ink;
  return (
    <Pressable
      onPress={() => {
        // .lg-btn 은 노란 큰 버튼 '뿅' · 흰 버튼은 '톡' (프로토타입 tapKind)
        sfx(sound ?? (tone === 'yellow' ? 'big' : 'tap'));
        onPress?.();
      }}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={[styles.btnWrap, inFooter && disabled && styles.dimmed, style]}>
      {({ pressed }) => (
        <>
          {!disabled && !pressed ? <View pointerEvents="none" style={[styles.btnShadow, { height: h }]} /> : null}
          <View style={[styles.btn, { height: h, backgroundColor: bg }, pressed && !disabled && styles.btnPressed]}>
            {icon}
            <PText numberOfLines={1} color={ink} style={[styles.btnText, { fontSize: fs, lineHeight: fs * 1.35 }]}>
              {label}
            </PText>
          </View>
        </>
      )}
    </Pressable>
  );
}

/** 버튼 두 개 나란히 (.lg-sbtns) — 아래 고정 칸이 아닌 시트 안에서 */
export function SheetButtons({ children }: { children: ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

export type SheetOption = { key: string; label: string; sub?: string; bad?: boolean };

/**
 * 줄 목록 (.lg-opts): 흰 칸 · 잉크 2px · 둥글기 18 · 줄 사이 연한 선.
 * radio 면 오른쪽 동그라미(.ck)로 하나 고르기 — 고른 줄은 연보라 바탕. 아니면 메뉴 (신고하기처럼 bad 는 빨간 글씨).
 */
export function SheetOptions({
  items,
  selected,
  onPick,
  radio = false,
  subStrong = false,
}: {
  items: SheetOption[];
  selected?: string | null;
  onPick: (key: string) => void;
  radio?: boolean;
  /** 작은 설명을 조금 굵게 (체험 지점 주소 .tr-br small — 700) */
  subStrong?: boolean;
}) {
  return (
    <View style={styles.opts} accessibilityRole={radio ? 'radiogroup' : undefined}>
      {items.map((o, i) => {
        const on = radio && selected === o.key;
        return (
          <Pressable
            key={o.key}
            onPress={() => {
              sfx(radio ? 'pick' : o.bad ? 'open' : 'tap');
              onPick(o.key);
            }}
            accessibilityRole={radio ? 'radio' : 'button'}
            accessibilityState={radio ? { checked: on } : undefined}
            accessibilityLabel={o.sub ? `${o.label}, ${o.sub}` : o.label}
            style={({ pressed }) => [styles.opt, i > 0 && styles.optLine, on && styles.optOn, pressed && styles.optPressed]}>
            <View style={styles.optText}>
              <PText color={o.bad ? '#B23A5A' : Colors.ink} style={styles.optLabel}>
                {o.label}
              </PText>
              {o.sub ? <PText style={[styles.optSub, subStrong && styles.optSubStrong]}>{o.sub}</PText> : null}
            </View>
            {radio ? <View style={styles.ck}>{on ? <View style={styles.ckDot} /> : null}</View> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

/** 알약 고르기 줄 (.lg-pills): 옆으로 밀어 보는 한 줄 · 고르면 보라 바탕 */
export function SheetPills<T extends string>({ options, value, onChange, label }: { options: readonly T[]; value: T | null; onChange: (v: T) => void; label?: string }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsWrap} contentContainerStyle={styles.pills} accessibilityLabel={label}>
      {options.map((o) => {
        const on = o === value;
        return (
          <Pressable
            key={o}
            onPress={() => {
              sfx('pick');
              onChange(o);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={({ pressed }) => [styles.pill, on && styles.pillOn, pressed && styles.pillPressed]}>
            <PText color={on ? Colors.white : Colors.ink} style={styles.pillText}>
              {o}
            </PText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** 글자 링크 (.lg-link — 보라 · 13px · 900) */
export function SheetLink({ label, onPress, color = Colors.purple }: { label: string; onPress: () => void; color?: string }) {
  return (
    <Pressable
      onPress={() => {
        sfx('soft');
        onPress();
      }}
      accessibilityRole="link"
      hitSlop={10}
      style={styles.link}>
      <PText color={color} style={styles.linkText}>
        {label}
      </PText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ds: { fontFamily: Font.body600, fontSize: 14, lineHeight: 14 * 1.6, color: Colors.inkSub },
  center: { textAlign: 'center' },
  note: { marginTop: 12, marginBottom: 14, marginHorizontal: 2, fontFamily: Font.body700, fontSize: 13, lineHeight: 13 * 1.5, color: Colors.inkSub },
  lb: { fontFamily: Font.body900, fontSize: 12.5, lineHeight: 12.5 * 1.4 },
  btnWrap: { alignSelf: 'stretch', paddingRight: 3, paddingBottom: 3 },
  dimmed: { opacity: 0.45 },
  btnShadow: { position: 'absolute', left: 3, right: 0, top: 3, borderRadius: 20, backgroundColor: Colors.ink },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 14, borderRadius: 20, borderWidth: 2, borderColor: Colors.ink },
  btnPressed: { transform: [{ translateX: 3 }, { translateY: 3 }] },
  btnText: { fontFamily: Font.body900 },
  row: { flexDirection: 'row', gap: 10 },
  opts: { borderWidth: 2, borderColor: Colors.ink, borderRadius: 18, backgroundColor: Colors.white, overflow: 'hidden' },
  opt: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 54, paddingHorizontal: 16, paddingVertical: 6 },
  optLine: { borderTopWidth: 1.5, borderColor: Colors.line },
  optOn: { backgroundColor: '#F3EEFB' },
  optPressed: { backgroundColor: '#F7F3EA' },
  optText: { flex: 1, minWidth: 0 },
  optLabel: { fontFamily: Font.body800, fontSize: 15, lineHeight: 15 * 1.45 },
  optSub: { marginTop: 2, fontFamily: Font.body600, fontSize: 12, lineHeight: 12 * 1.45, color: Colors.inkSub },
  optSubStrong: { fontFamily: Font.body700 },
  ck: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.ink, alignItems: 'center', justifyContent: 'center' },
  ckDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.purple },
  pillsWrap: { marginHorizontal: -18, flexGrow: 0 },
  pills: { gap: 7, paddingHorizontal: 18, paddingTop: 2, paddingBottom: 4 },
  pill: { height: 36, paddingHorizontal: 13, borderRadius: 18, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, justifyContent: 'center' },
  pillOn: { backgroundColor: Colors.purple },
  pillPressed: { transform: [{ scale: 0.96 }] },
  pillText: { fontFamily: Font.body900, fontSize: 13, lineHeight: 18 },
  link: { paddingVertical: 6, paddingHorizontal: 2 },
  linkText: { fontFamily: Font.body900, fontSize: 13, lineHeight: 18 },
});
