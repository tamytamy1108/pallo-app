import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { unitId, type StudyLevel } from '@/data/library';
import { sfx } from '@/lib/feedback';

import { lessonDone, useProgressVersion } from './library-state';

/** 과 고르기 시트 (프로토타입 stLessonSheet · .stc-sh): 지금 과는 노랑, 끝낸 과 '완료', 데이터 없는 과 '커밍순' */
export function LessonSheet({ open, onClose, L, current }: { open: boolean; onClose: () => void; L: StudyLevel; current: number }) {
  useProgressVersion();
  const dn = L.lessons.filter((x) => x.data && lessonDone(L, x)).length;
  return (
    <Sheet open={open} onClose={onClose} label="과 고르기" gap={8}>
      <View style={styles.hd}>
        <PText style={styles.hdB}>{`LV.${L.lv} ${L.series}`}</PText>
        <PText style={styles.hdS}>
          {dn}/{L.lessons.length}과 끝냄
        </PText>
      </View>
      {L.lessons.map((x) => {
        const cur = x.no === current;
        const off = !x.data;
        const st = cur ? '지금' : x.data && lessonDone(L, x) ? '완료' : x.data ? '' : '커밍순';
        return (
          <Pressable
            key={x.no}
            accessibilityRole="button"
            accessibilityLabel={`${x.no} ${x.title} ${st}`}
            onPress={() => {
              if (!x.data) {
                showToast(`${x.no}과는 교재 데이터가 들어오면 열려요`);
                return;
              }
              sfx('tap');
              onClose();
              if (!cur) router.replace(`/unit/${unitId(L.lv, x.no)}` as Href);
            }}
            style={[styles.r, cur && styles.rCur, off && styles.rOff]}>
            <View style={[styles.no, off && styles.dim]}>
              <PText style={styles.noText}>{x.no}</PText>
            </View>
            <View style={[styles.tx, off && styles.dim]}>
              <PText style={styles.txB} numberOfLines={1}>
                {x.title}
              </PText>
              {x.sub ? (
                <PText style={styles.txS} numberOfLines={1}>
                  {x.sub}
                </PText>
              ) : null}
            </View>
            {st ? <PText style={[styles.st, cur && { color: Colors.ink }]}>{st}</PText> : null}
          </Pressable>
        );
      })}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  hd: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 2, paddingTop: 2, paddingBottom: 2 },
  hdB: { fontFamily: Font.body900, fontSize: 16, lineHeight: 22 },
  hdS: { fontFamily: Font.body800, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  r: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 2, borderColor: Colors.ink, borderRadius: 16, backgroundColor: Colors.white },
  rCur: { backgroundColor: Colors.yellow, boxShadow: `0 3px 0 ${Colors.ink}` },
  rOff: { borderColor: 'rgba(30,26,43,0.14)', backgroundColor: 'transparent' },
  dim: { opacity: 0.45 },
  no: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  noText: { fontFamily: Font.body900, fontSize: 14, lineHeight: 19 },
  tx: { flex: 1, minWidth: 0, gap: 2 },
  txB: { fontFamily: Font.body900, fontSize: 15, lineHeight: 20 },
  txS: { fontFamily: Font.body700, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  st: { fontFamily: Font.body900, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
});
