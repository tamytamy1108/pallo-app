import { StyleSheet, View } from 'react-native';

import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';

import type { LabelSpec } from './stage';

/** 이름표를 가운데 맞추려고 두는 상자 너비 (프로토타입 translate(-50%)) */
export const BOX = 240;
export const HERE_H = 20;
const SUB = '#5A5366';
const SOON_LINE = '#9A93A6';
const SOON_INK = '#6F6880';

/** 지도 이름표 (프로토타입 .m3-lv · .m3-tag · .m3-here) — 3D 지도 · 2D 지도가 같이 써요 */
export function LabelBody({ spec, zoomed }: { spec: LabelSpec; zoomed: boolean }) {
  if (spec.kind === 'lv') {
    const soon = spec.st === 'soon';
    return (
      <View style={[styles.lv, spec.st === 'cur' && styles.lvCur, soon && styles.lvSoon]}>
        <PText style={[styles.lvTitle, soon && { color: SOON_INK }]} numberOfLines={1}>
          {spec.title}
        </PText>
        <PText style={[styles.lvSub, soon && { color: SOON_INK }]} numberOfLines={1}>
          {spec.sub}
        </PText>
      </View>
    );
  }
  if (spec.kind === 'here')
    return (
      <View style={styles.here}>
        <PText style={styles.hereText}>{spec.text}</PText>
      </View>
    );
  if (spec.kind === 'tag')
    return (
      <View style={[styles.tag, styles.tagCur]}>
        <PText style={styles.tagText} numberOfLines={1}>
          {spec.text}
        </PText>
      </View>
    );
  // 정류장 번호: 멀리서는 동그라미 번호, 확대하면 장면 이름 (.m3-tag.min)
  return zoomed ? (
    <View style={[styles.tag, spec.soon && styles.tagSoon]}>
      <PText style={[styles.tagText, spec.soon && { color: SOON_INK }]} numberOfLines={1}>
        {spec.text}
      </PText>
    </View>
  ) : (
    <View style={[styles.min, spec.soon && styles.tagSoon]}>
      <PText style={[styles.minText, spec.soon && { color: SOON_INK }]}>{spec.num}</PText>
    </View>
  );
}

const styles = StyleSheet.create({
  lv: { paddingTop: 4, paddingBottom: 5, paddingHorizontal: 10, borderRadius: 12, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center', boxShadow: `2px 2px 0 ${Colors.ink}` },
  lvCur: { backgroundColor: Colors.yellow },
  lvSoon: { borderStyle: 'dashed', borderColor: SOON_LINE, backgroundColor: 'rgba(255,255,255,0.9)', boxShadow: 'none' },
  lvTitle: { fontFamily: Font.display, fontSize: 11, lineHeight: 12.65 },
  lvSub: { fontFamily: Font.body800, fontSize: 10, lineHeight: 11.5, color: SUB },
  tag: { paddingTop: 2, paddingBottom: 3, paddingHorizontal: 8, borderRadius: 11, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white },
  tagCur: { backgroundColor: Colors.yellow, boxShadow: `2px 2px 0 ${Colors.ink}` },
  tagSoon: { borderStyle: 'dashed', borderColor: SOON_LINE, backgroundColor: 'rgba(255,255,255,0.88)' },
  tagText: { fontFamily: Font.body900, fontSize: 11, lineHeight: 14.3 },
  min: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  minText: { fontFamily: Font.display, fontSize: 10, lineHeight: 12 },
  here: { height: HERE_H, paddingHorizontal: 9, borderRadius: 10, backgroundColor: Colors.ink, justifyContent: 'center' },
  hereText: { fontFamily: Font.display, fontSize: 10, lineHeight: 12, color: Colors.yellow },
});
