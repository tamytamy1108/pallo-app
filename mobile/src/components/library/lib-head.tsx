import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Pressable } from '@/components/ui/pressable';
import { Raised } from '@/components/ui/raised';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors, Spacing } from '@/constants/theme';
import { LANGS, type SituationMap, type SoonMap } from '@/data/library';
import { sfx } from '@/lib/feedback';
import { ChipScroll } from '@/components/ui/chip-scroll';

const NEW_PINK = '#E0486E';

/** 언어 배지 (프로토타입 .g) */
function LangBadge({ i, size = 22 }: { i: number; size?: number }) {
  const l = LANGS[i];
  return (
    <View style={[styles.g, { width: size, height: size, backgroundColor: l.color }]}>
      <PText style={[styles.gText, { color: l.ink }]}>{l.g}</PText>
    </View>
  );
}

/** 제목 '라이브러리' + 공부하는 언어 고르기 (프로토타입 .st-head · .st-lang · .st-lmenu). 메뉴 밖을 누르면 닫히게 open 은 화면이 가져요 */
export function LibHead({ lang, onLang, open, setOpen }: { lang: number; onLang: (i: number) => void; open: boolean; setOpen: (o: boolean | ((x: boolean) => boolean)) => void }) {
  return (
    <View style={styles.head}>
      <PText variant="headline" accessibilityRole="header" style={styles.title}>
        라이브러리
      </PText>
      <View style={styles.lwrap}>
        <Pressable
          onPress={() => {
            sfx('tap');
            setOpen((o) => !o);
          }}
          accessibilityRole="button"
          accessibilityLabel={`공부하는 언어 ${LANGS[lang].ko}`}
          accessibilityState={{ expanded: open }}
          hitSlop={4}>
          {({ pressed }) => (
            <Raised radius={18} pressed={pressed}>
              <View style={styles.lang}>
                <LangBadge i={lang} />
                <PText style={styles.langText}>{LANGS[lang].ko}</PText>
                <Svg width={12} height={12} viewBox="0 0 12 12">
                  <Path d="M2.5 4.5L6 8l3.5-3.5" fill="none" stroke={Colors.ink} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </View>
            </Raised>
          )}
        </Pressable>
        {open && (
          <View style={styles.menu} accessibilityRole="menu">
            {LANGS.map((l, i) => (
              <Pressable
                key={l.ko}
                accessibilityRole="menuitem"
                accessibilityState={{ checked: i === lang }}
                onPress={() => {
                  setOpen(false);
                  if (i === lang) return;
                  sfx('tap');
                  onLang(i);
                }}
                style={({ pressed }) => [styles.mItem, i === lang && styles.mOn, pressed && styles.mPressed]}>
                <LangBadge i={i} />
                <PText style={[styles.mText, i === lang && { fontFamily: Font.body900 }]}>{l.ko}</PText>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

/** 스터디 맵 | 상황 맵 (프로토타입 .st-mtabs) */
export function MapTabs({ sitMode, sitNew, onMode }: { sitMode: boolean; sitNew: boolean; onMode: (sit: boolean) => void }) {
  const tab = (sit: boolean, label: string, isNew = false) => {
    const on = sit === sitMode;
    return (
      <Pressable
        key={label}
        accessibilityRole="tab"
        accessibilityState={{ selected: on }}
        onPress={() => {
          if (on) return;
          sfx('tap');
          onMode(sit);
        }}
        style={styles.mtab}>
        <PText style={[styles.mtabText, on && { color: Colors.ink }]}>{label}</PText>
        {isNew && (
          <PText style={styles.mtabNew} accessibilityLabel="새 맵">
            NEW
          </PText>
        )}
        {on && <View style={styles.mtabBar} />}
      </Pressable>
    );
  };
  return (
    <View style={styles.mtabs} accessibilityRole="tablist">
      {tab(false, '스터디 맵')}
      {tab(true, '상황 맵', sitNew)}
    </View>
  );
}

/** 상황 맵 고르기 칩 (프로토타입 .st-schips): 새 맵은 NEW, 곧 열릴 맵은 점선 */
export function SitChips({ maps, soons, current, isNew, onPick, onSoon }: { maps: SituationMap[]; soons: SoonMap[]; current: string; isNew: (m: SituationMap) => boolean; onPick: (id: string) => void; onSoon: () => void }) {
  return (
    <ChipScroll horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow} contentContainerStyle={styles.chips} accessibilityRole="tablist">
      {maps.map((m) => {
        const on = m.id === current;
        return (
          <Pressable
            key={m.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => {
              if (on) return;
              sfx('tap');
              onPick(m.id);
            }}
            style={({ pressed }) => [styles.chip, on && styles.chipOn, pressed && styles.pressed]}>
            <PText style={[styles.chipText, on && { color: Colors.white }]}>{m.title}</PText>
            {isNew(m) && <PText style={[styles.chipNew, on && { color: Colors.yellow }]}>NEW</PText>}
          </Pressable>
        );
      })}
      {soons.map((x) => (
        <Pressable key={x.id} accessibilityRole="button" onPress={onSoon} style={({ pressed }) => [styles.chip, styles.chipSoon, pressed && styles.pressed]}>
          <PText style={[styles.chipText, { color: '#8C8597' }]}>
            {x.title} · {x.when}
          </PText>
        </Pressable>
      ))}
    </ChipScroll>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44, zIndex: 6, transform: [{ translateY: Spacing.headDrop }] },
  title: { letterSpacing: -0.6 },
  lwrap: { position: 'relative' },
  lang: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingLeft: 6, paddingRight: 10, borderRadius: 18, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white },
  langText: { fontFamily: Font.body900, fontSize: 13.5, lineHeight: 18 },
  g: { borderRadius: 7, borderWidth: 1.5, borderColor: Colors.ink, alignItems: 'center', justifyContent: 'center' },
  gText: { fontFamily: Font.body900, fontSize: 10, lineHeight: 13 },
  menu: { position: 'absolute', right: 0, top: 44, minWidth: 150, padding: 6, borderRadius: 16, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, boxShadow: `3px 4px 0 ${Colors.ink}` },
  mItem: { flexDirection: 'row', alignItems: 'center', gap: 9, height: 42, paddingHorizontal: 10, borderRadius: 11 },
  mOn: { backgroundColor: '#FFF4B8' },
  mPressed: { backgroundColor: '#F6F1E4' },
  mText: { fontFamily: Font.body800, fontSize: 14, lineHeight: 19 },
  mtabs: { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: '#E2D9C7' },
  mtab: { flex: 1, height: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  mtabText: { fontFamily: Font.body900, fontSize: 17, lineHeight: 22, color: '#A39C8E' },
  mtabNew: { fontFamily: Font.display, fontSize: 10, lineHeight: 12, letterSpacing: 0.2, color: NEW_PINK, alignSelf: 'flex-start', marginTop: 8 },
  mtabBar: { position: 'absolute', left: '18%', right: '18%', bottom: -2, height: 4, borderRadius: 2, backgroundColor: Colors.ink },
  chipsRow: { marginTop: 12, marginHorizontal: -16 },
  chips: { gap: 7, paddingHorizontal: 16, paddingBottom: 2 },
  chip: { height: 34, paddingHorizontal: 14, borderRadius: 17, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, flexDirection: 'row', alignItems: 'center', gap: 5 },
  chipOn: { backgroundColor: Colors.ink },
  chipSoon: { borderStyle: 'dashed', borderColor: '#9A93A6', backgroundColor: 'transparent' },
  chipText: { fontFamily: Font.body800, fontSize: 13, lineHeight: 18 },
  chipNew: { fontFamily: Font.display, fontSize: 9, lineHeight: 11, letterSpacing: 0.2, color: NEW_PINK },
  pressed: { transform: [{ scale: 0.96 }] },
});
