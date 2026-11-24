import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Pressable } from '@/components/ui/pressable';
import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { WEEK, type Meet } from '@/data/meet';
import { ChipScroll } from '@/components/ui/chip-scroll';

import { Icon } from './icons';
import { LgLink } from './parts';
import { meetN } from './model';

const DAYS = 7; // 전체 · 오늘부터 7일 (프로토타입 LG.mdays)

/** 날짜 줄 (프로토타입 .lg-dstrip): 전체 · 오늘 · 다음 6일 + 더보기(점선) → 5주 달력 */
export function DateStrip({ meets, day, onDay, region }: { meets: Meet[]; day: number | null; onDay: (d: number | null) => void; region: string | null }) {
  const [cal, setCal] = useState(false);
  const t0 = new Date();
  t0.setHours(0, 0, 0, 0);
  const count = (k: number) => meets.filter((m) => meetN(m) === k).length;
  return (
    <>
      <ChipScroll horizontal showsHorizontalScrollIndicator={false} style={styles.strip} contentContainerStyle={styles.stripIn} accessibilityRole="tablist" accessibilityLabel="날짜로 보기">
        <DayBtn on={day == null} onPress={() => onDay(null)} first label="전체" small={`${meets.length}개`} a11y={`전체 번개 ${meets.length}개`} />
        {Array.from({ length: DAYS }, (_, k) => {
          const d = new Date(t0);
          d.setDate(d.getDate() + k);
          const c = count(k);
          return <DayBtn key={k} on={day === k} no={!c} onPress={() => onDay(k)} label={String(d.getDate())} small={k ? WEEK[d.getDay()] : '오늘'} a11y={`${d.getMonth() + 1}월 ${d.getDate()}일 번개 ${c}개`} />;
        })}
        <Pressable onPress={() => setCal(true)} accessibilityRole="button" accessibilityLabel="더 많은 날짜 보기" style={[styles.btn, styles.more]}>
          <Icon name="cal" size={18} />
          <PText style={styles.small}>더보기</PText>
        </Pressable>
      </ChipScroll>
      <MeetCalendar
        open={cal}
        onClose={() => setCal(false)}
        meets={meets}
        region={region}
        day={day}
        onDay={(k) => {
          onDay(k);
          setCal(false);
        }}
      />
    </>
  );
}

function DayBtn({ on, no, first, label, small, onPress, a11y }: { on: boolean; no?: boolean; first?: boolean; label: string; small: string; onPress: () => void; a11y: string }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="tab" accessibilityState={{ selected: on }} accessibilityLabel={a11y} style={[styles.btn, no && !on && styles.no, on && styles.on]}>
      <PText style={[first ? styles.bFirst : styles.b, no && !on && { color: '#A39C8E' }, on && { color: '#fff' }]}>{label}</PText>
      <PText style={[styles.small, on && { color: '#E3DCCB' }]}>{small}</PText>
    </Pressable>
  );
}

/** 번개 일정 (프로토타입 lgMeetCal): 오늘이 있는 주부터 5주. 번개 있는 날엔 개수, 누르면 그날 번개만 */
function MeetCalendar({ open, onClose, meets, region, day, onDay }: { open: boolean; onClose: () => void; meets: Meet[]; region: string | null; day: number | null; onDay: (k: number | null) => void }) {
  const t0 = new Date();
  t0.setHours(0, 0, 0, 0);
  const st = new Date(t0);
  st.setDate(st.getDate() - st.getDay());
  const cells = Array.from({ length: 35 }, (_, i) => {
    const d = new Date(st);
    d.setDate(d.getDate() + i);
    const k = Math.round((d.getTime() - t0.getTime()) / 864e5);
    const n = k >= 0 ? meets.filter((m) => meetN(m) === k).length : 0;
    return { d, k, n, i };
  });
  return (
    <Sheet open={open} onClose={onClose} title="번개 일정">
      <PText style={styles.ds}>
        {region ? `${region} · ` : ''}다가오는 번개 {meets.length}개 · 날짜를 누르면 그날 번개만 보여요.
      </PText>
      <View style={styles.wk}>
        {[...WEEK].map((w) => (
          <PText key={w} style={styles.wkT}>
            {w}
          </PText>
        ))}
      </View>
      <View style={styles.gd}>
        {cells.map(({ d, k, n, i }) => {
          const on = day === k;
          return (
            <Pressable
              key={i}
              disabled={k < 0}
              onPress={() => onDay(k)}
              accessibilityRole="button"
              accessibilityState={{ selected: on, disabled: k < 0 }}
              accessibilityLabel={`${d.getMonth() + 1}월 ${d.getDate()}일${n ? ` 번개 ${n}개` : ''}`}
              style={[styles.cell, n > 0 && styles.cellHas, on && styles.cellOn, k < 0 && { opacity: 0.35 }]}>
              {d.getDate() === 1 || i === 0 ? <PText style={styles.cm}>{d.getMonth() + 1}월</PText> : null}
              <PText style={[styles.cb, on && { color: '#fff' }]}>{d.getDate()}</PText>
              {n ? (
                <View style={styles.cn}>
                  <PText style={styles.cnT}>{n}</PText>
                </View>
              ) : null}
              {k === 0 ? <PText style={[styles.today, on && { color: Colors.yellow }]}>오늘</PText> : null}
            </Pressable>
          );
        })}
      </View>
      <View style={{ alignItems: 'center', paddingVertical: 10 }}>
        <LgLink label="전체 일정 보기" onPress={() => onDay(null)} />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  strip: { marginHorizontal: -16, marginTop: 18, marginBottom: 4, flexGrow: 0 },
  stripIn: { gap: 8, paddingTop: 4, paddingBottom: 6, paddingHorizontal: 16 },
  btn: { minWidth: 50, height: 58, borderWidth: 2, borderColor: Colors.ink, borderRadius: 16, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', gap: 1, paddingHorizontal: 10 },
  no: { borderColor: Colors.line },
  on: { backgroundColor: Colors.ink, borderColor: Colors.ink },
  more: { borderStyle: 'dashed', gap: 2 },
  b: { fontFamily: Font.display, fontSize: 17, lineHeight: 18.7 },
  bFirst: { fontFamily: Font.body900, fontSize: 14, lineHeight: 15.4 },
  small: { fontFamily: Font.body800, fontSize: 11, lineHeight: 16, color: Colors.inkSub },
  ds: { fontFamily: Font.body600, fontSize: 13, lineHeight: 19, color: Colors.inkSub, marginBottom: 12 },
  wk: { flexDirection: 'row' },
  wkT: { flex: 1, textAlign: 'center', fontFamily: Font.body800, fontSize: 11.5, color: Colors.inkSub, paddingBottom: 6 },
  gd: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 4 },
  cell: { width: `${100 / 7}%`, height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 2, borderColor: 'transparent' },
  cellHas: { backgroundColor: Colors.white, borderColor: Colors.ink },
  cellOn: { backgroundColor: Colors.ink, borderColor: Colors.ink },
  cm: { position: 'absolute', top: 2, fontFamily: Font.body800, fontSize: 9, color: Colors.inkSub },
  cb: { fontFamily: Font.display, fontSize: 14, lineHeight: 18 },
  cn: { position: 'absolute', top: 2, right: 3, minWidth: 15, height: 15, borderRadius: 8, backgroundColor: Colors.rosePink, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  cnT: { fontFamily: Font.display, fontSize: 9, lineHeight: 11, color: '#fff' },
  today: { position: 'absolute', bottom: 2, fontFamily: Font.body900, fontSize: 9, color: Colors.purple },
});
