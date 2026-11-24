import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState, useRef } from 'react';
import { ScrollView, StyleSheet, View, type ViewInstance } from 'react-native';
import Svg, { G, Path, Rect, Text as SvgText } from 'react-native-svg';

import { Pressable } from '@/components/ui/pressable';
import { Icon, type IconName } from '@/components/meet/icons';
import { LgLink } from '@/components/meet/parts';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { PLACE_SPOTS } from '@/data/events';
import { C, WEEK } from '@/data/meet';
import { useCenterChip } from '@/lib/center-chip';
import { useRevealNext } from '@/components/ui/form-scroll';
import { sfx } from '@/lib/feedback';
import { Wheel } from '@/components/ui/time-wheel';

/*
 * 만들기 · 제안 폼 조각 (프로토타입 .lg-pup · .lg-plc · .lg-mpk · lgMapSvg · .lg-mcal).
 */

/** 포스터 여러 장 (최대 max장 · 첫 장이 대표 · 누르면 대표로 · × 빼기). max=1 이면 사진 한 장 */
/** coverTaken: 만든 카드가 대표라서 사진은 2번째부터 (대표 표시 없이) */
export function PosterPicker({ uris, onChange, emptyLabel = '포스터 넣기', max = 10, coverTaken = false }: { uris: string[]; onChange: (u: string[]) => void; emptyLabel?: string; max?: number; coverTaken?: boolean }) {
  const add = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: max > 1, selectionLimit: max - uris.length, quality: 0.8 });
    if (r.canceled) return;
    onChange([...uris, ...r.assets.map((a) => a.uri)].slice(0, max));
  };
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pup} contentContainerStyle={styles.pupIn}>
      {uris.map((u, i) => (
        <View key={u + i} style={styles.pt}>
          <Pressable
            onPress={() => i && onChange([u, ...uris.filter((_, k) => k !== i)])}
            accessibilityRole="button"
            accessibilityLabel={coverTaken ? `${i + 2}번째 포스터` : `${i + 1}번째 포스터${i ? ' · 대표로 정하기' : ' · 대표'}`}
            style={[styles.ptImg, !i && !coverTaken && styles.ptCov]}>
            <Image source={{ uri: u }} style={StyleSheet.absoluteFill} contentFit="cover" />
          </Pressable>
          <Pressable onPress={() => onChange(uris.filter((_, k) => k !== i))} accessibilityRole="button" accessibilityLabel={`${i + 1}번째 포스터 빼기`} style={styles.rm} hitSlop={8}>
            <Icon name="x" size={12} color="#fff" strokeWidth={3} />
          </Pressable>
          {max > 1 ? <PText style={[styles.ptS, !i && !coverTaken && styles.ptSCov]}>{coverTaken ? String(i + 2) : i ? String(i + 1) : '대표'}</PText> : null}
        </View>
      ))}
      {uris.length < max ? (
        <Pressable onPress={add} accessibilityRole="button" accessibilityLabel="포스터 넣기" style={styles.add}>
          <Icon name="plus" size={22} strokeWidth={2.6} />
          <PText style={styles.addS}>{uris.length ? `${uris.length}/${max}` : emptyLabel}</PText>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

export type Place = { name: string; addr: string };

/** 장소 · 지도에서 고르기 (프로토타입 lgPlcHTML · lgMapSvg): 닫혀 있으면 한 줄, 열면 지역 지도 + 핀 + 아래 목록 */
export function PlacePicker({ region, value, onChange }: { region: string; value: Place | null; onChange: (p: Place) => void }) {
  const [open, setOpen] = useState(false);
  const L = PLACE_SPOTS[region] || PLACE_SPOTS['서울'];
  const sel = value ? L.findIndex((x) => x[0] === value.name) : -1;
  if (!open)
    return (
      <Pressable onPress={() => setOpen(true)} accessibilityRole="button" style={[styles.plc, value && styles.plcSet]}>
        <View style={styles.plcIc}>
          <Icon name={value ? 'pin' : 'map'} size={18} color={C.pu} />
        </View>
        <View style={styles.plcTx}>
          <PText style={styles.plcB}>{value ? value.name : '지도에서 장소 고르기'}</PText>
          <PText style={styles.plcS}>{value ? value.addr : `${region} · 카페 · 펍 · 공원 · 지점 라운지`}</PText>
        </View>
        {value ? <PText style={styles.plcCh}>바꾸기</PText> : <PText style={styles.plcB}>›</PText>}
      </Pressable>
    );
  const water = ['서울', '경기', '부산', '울산'].includes(region);
  const roads = ['M0 110 L340 92', 'M110 0 L130 230', 'M0 40 L340 30', 'M210 0 L198 230', 'M40 230 L300 0'];
  return (
    <View style={styles.mpk}>
      <View style={styles.mhd}>
        <View style={{ flex: 1 }}>
          <PText style={styles.plcB}>{region} 지도</PText>
          <PText style={styles.plcS}>핀을 누르거나 아래 목록에서 골라요</PText>
        </View>
        <LgLink label="닫기" onPress={() => setOpen(false)} />
      </View>
      <Svg width="100%" height={undefined} viewBox="0 0 340 230" style={{ aspectRatio: 340 / 230 }}>
        <Rect width={340} height={230} fill="#F1ECDF" />
        {water ? <Path d="M0 196 C80 180 140 214 220 198 C270 188 310 204 340 196 L340 230 L0 230Z" fill="#BFDDEF" /> : null}
        <Path d="M232 112 C260 96 300 104 316 128 C320 150 292 170 262 166 C236 160 220 132 232 112Z" fill="#CFE6C8" />
        <Path d="M20 40 C60 30 90 44 120 40" fill="none" stroke="#CFE6C8" strokeWidth={14} strokeLinecap="round" />
        {roads.map((d, i) => (
          <Path key={d} d={d} stroke="#fff" strokeWidth={i < 2 ? 14 : 9} strokeLinecap="round" />
        ))}
        {roads.slice(0, 2).map((d) => (
          <Path key={d + 'c'} d={d} stroke="#E8D9A8" strokeWidth={2} strokeDasharray="6 6" />
        ))}
        {L.map(([n, ic, , x, y], i) => {
          const on = i === sel;
          return (
            <G key={n} transform={`translate(${x} ${y})`} onPress={() => onChange({ name: n, addr: L[i][2] })}>
              <Path d="M0 0 C-13 -14 -13 -30 0 -30 C13 -30 13 -14 0 0Z" transform={`scale(${on ? 1.35 : 1})`} fill={on ? C.pu : ic === 'flag' ? C.y : '#fff'} stroke={C.ink} strokeWidth={2.4} />
              {on ? (
                <G transform="translate(0 -52)">
                  <Rect x={-n.length * 6.3 - 10} y={-15} width={n.length * 12.6 + 20} height={24} rx={12} fill={C.ink} />
                  <SvgText x={0} y={2} textAnchor="middle" fontSize={12} fontWeight="900" fill="#fff">
                    {n}
                  </SvgText>
                </G>
              ) : null}
            </G>
          );
        })}
      </Svg>
      <View>
        {L.map(([n, ic, ad], i) => (
          <Pressable key={n} onPress={() => onChange({ name: n, addr: ad })} accessibilityRole="button" accessibilityState={{ selected: i === sel }} style={[styles.mr, i === sel && styles.mrOn]}>
            <View style={styles.mrIc}>
              <Icon name={ic as IconName} size={16} />
            </View>
            <View style={styles.plcTx}>
              <PText style={styles.mrB}>{n}</PText>
              <PText style={styles.plcS}>{ad}</PText>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** 달 넘기는 달력 (프로토타입 lgEvCal · .lg-mcal): min ~ max 안의 날만 고를 수 있어요 */
export function MonthCalendar({ value, onChange, minDays, maxDays, hint, pick }: { value: string; onChange: (d: string) => void; minDays: number; maxDays: number; hint: string; pick: (d: Date) => string }) {
  const [cm, setCm] = useState(0);
  const t0 = new Date();
  t0.setHours(0, 0, 0, 0);
  const min = new Date(t0);
  min.setDate(t0.getDate() + minDays);
  const max = new Date(t0);
  max.setDate(t0.getDate() + maxDays);
  const m0 = new Date(t0.getFullYear(), t0.getMonth() + cm, 1);
  const y = m0.getFullYear();
  const m = m0.getMonth();
  const days = new Date(y, m + 1, 0).getDate();
  const nextOk = new Date(y, m + 1, 1) <= max;
  const cells: (Date | null)[] = [...Array(m0.getDay()).fill(null), ...Array.from({ length: days }, (_, i) => new Date(y, m, i + 1))];
  return (
    <View style={styles.cal}>
      <View style={styles.calH}>
        <Pressable disabled={cm <= 0} onPress={() => setCm(cm - 1)} accessibilityRole="button" accessibilityLabel="이전 달" style={[styles.calNav, cm <= 0 && { opacity: 0.35 }]}>
          <PText style={styles.calNavT}>‹</PText>
        </Pressable>
        <PText style={styles.calT}>
          {y}년 {m + 1}월
        </PText>
        <Pressable disabled={!nextOk} onPress={() => setCm(cm + 1)} accessibilityRole="button" accessibilityLabel="다음 달" style={[styles.calNav, !nextOk && { opacity: 0.35 }]}>
          <PText style={styles.calNavT}>›</PText>
        </Pressable>
      </View>
      <View style={styles.wk}>
        {[...WEEK].map((w, i) => (
          <PText key={w} style={[styles.wkT, i === 0 && styles.sun, i === 6 && styles.sat]}>
            {w}
          </PText>
        ))}
      </View>
      <View style={styles.gd}>
        {cells.map((d, i) => {
          if (!d) return <View key={i} style={styles.cell} />;
          const ok = d >= min && d <= max;
          const on = iso(d) === value;
          const wd = d.getDay();
          return (
            <View key={i} style={styles.cell}>
              <Pressable disabled={!ok} onPress={() => onChange(iso(d))} accessibilityRole="button" accessibilityState={{ selected: on, disabled: !ok }} accessibilityLabel={`${m + 1}월 ${d.getDate()}일`} style={[styles.cd, !ok && styles.cdOff, on && styles.cdOn]}>
                <PText style={[styles.cdB, ok && wd === 0 && styles.sun, ok && wd === 6 && styles.sat, !ok && styles.cdBOff, on && { color: '#fff' }]}>{d.getDate()}</PText>
              </Pressable>
            </View>
          );
        })}
      </View>
      <PText style={styles.pick}>{value ? pick(new Date(value + 'T00:00')) : hint}</PText>
    </View>
  );
}

const styles = StyleSheet.create({
  pup: { marginHorizontal: -18, flexGrow: 0 },
  pupIn: { gap: 8, paddingHorizontal: 18, paddingTop: 4, paddingBottom: 2 },
  pt: { width: 76, alignItems: 'center', gap: 4 },
  ptImg: { width: 76, height: 95, borderRadius: 12, borderWidth: 2, borderColor: Colors.line, backgroundColor: Colors.ink, overflow: 'hidden' },
  ptCov: { borderColor: Colors.ink },
  rm: { position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(30,26,43,0.7)', alignItems: 'center', justifyContent: 'center' },
  ptS: { fontFamily: Font.body800, fontSize: 11, color: Colors.inkSub },
  ptSCov: { fontFamily: Font.body900, color: C.pu },
  add: { width: 76, height: 95, borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.ink, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', gap: 4 },
  addS: { fontFamily: Font.body800, fontSize: 10.5, lineHeight: 14 },
  plc: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 60, paddingVertical: 10, paddingHorizontal: 14, borderWidth: 2, borderColor: Colors.ink, borderRadius: 16, backgroundColor: '#fff' },
  plcSet: { borderColor: C.pu, backgroundColor: '#FBF9FF' },
  plcIc: { width: 34, height: 34, borderRadius: 12, backgroundColor: '#F3EEFB', alignItems: 'center', justifyContent: 'center' },
  plcTx: { flex: 1, minWidth: 0, gap: 1 },
  plcB: { fontFamily: Font.body900, fontSize: 14.5, lineHeight: 20 },
  plcS: { fontFamily: Font.body700, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  plcCh: { fontFamily: Font.body900, fontSize: 12.5, color: C.pu },
  mpk: { borderWidth: 2, borderColor: Colors.ink, borderRadius: 16, backgroundColor: '#fff', overflow: 'hidden' },
  mhd: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 14 },
  mr: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 14, borderTopWidth: 1, borderColor: Colors.line },
  mrOn: { backgroundColor: '#F3EEFB' },
  mrIc: { width: 30, height: 30, borderRadius: 10, backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center' },
  mrB: { fontFamily: Font.body900, fontSize: 13.5, lineHeight: 19 },
  cal: { borderWidth: 2, borderColor: Colors.ink, borderRadius: 18, backgroundColor: '#fff', paddingTop: 12, paddingHorizontal: 10, paddingBottom: 10 },
  calH: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, paddingBottom: 8 },
  calNav: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: Colors.line, alignItems: 'center', justifyContent: 'center' },
  calNavT: { fontFamily: Font.body900, fontSize: 18, lineHeight: 22 },
  calT: { fontFamily: Font.body900, fontSize: 15, lineHeight: 21 },
  wk: { flexDirection: 'row' },
  wkT: { flex: 1, textAlign: 'center', fontFamily: Font.body800, fontSize: 11.5, lineHeight: 16, color: Colors.inkSub, paddingBottom: 4 },
  sun: { color: '#D2477A' },
  sat: { color: '#2F6FD0' },
  gd: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 4 },
  cell: { width: `${100 / 7}%`, paddingHorizontal: 2 },
  cd: { height: 46, borderRadius: 14, backgroundColor: '#F6F1E6', alignItems: 'center', justifyContent: 'center' },
  cdOff: { backgroundColor: 'transparent' },
  cdOn: { backgroundColor: C.pu, transform: [{ translateY: -1 }], boxShadow: '2px 2px 0px #1E1A2B' },
  cdB: { fontFamily: Font.display, fontSize: 15, lineHeight: 17 },
  cdBOff: { color: '#CFC8BA' },
  pick: { marginTop: 8, paddingHorizontal: 4, fontFamily: Font.body900, fontSize: 13, lineHeight: 19, color: C.pu },
});

/** 여러 개 고르는 알약 줄 (.lg-pills multi — 고르면 보라) */
export function MultiPills({ options, value, onChange, label }: { options: string[]; value: string[]; onChange: (v: string[]) => void; label?: string }) {
  const [rowRef, onRow, onChip, centerChip] = useCenterChip();
  return (
    <ScrollView ref={rowRef} onLayout={onRow} horizontal showsHorizontalScrollIndicator={false} style={mp.wrap} contentContainerStyle={mp.row} accessibilityLabel={label}>
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <Pressable
            key={o}
            onLayout={(e) => onChip(o, e)}
            onPress={() => {
              centerChip(o);
              onChange(on ? value.filter((x) => x !== o) : [...value, o]);
            }}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            style={[mp.pill, on && mp.on]}>
            <PText style={[mp.t, on && { color: '#fff' }]}>{o}</PText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** 시간 칩 (.lg-mtm). 고른 시간이 처음부터 보이게 가운데로 데려와요 */
export function TimeChips({ times, value, onChange }: { times: string[]; value: string; onChange: (t: string) => void }) {
  const [rowRef, onRow, onChip, centerChip] = useCenterChip();
  const shown = useRef(false);
  const box = useRef<ViewInstance>(null);
  const revealNext = useRevealNext();
  return (
    <View ref={box} collapsable={false}>
    <ScrollView ref={rowRef} onLayout={onRow} horizontal showsHorizontalScrollIndicator={false} style={mp.wrap} contentContainerStyle={[mp.row, { gap: 6 }]}>
      {times.map((t) => {
        const on = t === value;
        const h = Number(t.slice(0, 2));
        return (
          <Pressable
            key={t}
            onLayout={(e) => {
              onChip(t, e);
              if (on && !shown.current) {
                shown.current = true;
                centerChip(t, false);
              }
            }}
            onPress={() => {
              centerChip(t);
              onChange(t);
              revealNext(box.current);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={[mp.pill, { height: 38 }, on && mp.on]}>
            <PText style={[mp.t, on && { color: '#fff' }]}>{`${h < 12 ? '오전' : '오후'} ${h % 12 || 12}:${t.slice(3)}`}</PText>
          </Pressable>
        );
      })}
    </ScrollView>
    </View>
  );
}

const mp = StyleSheet.create({
  wrap: { marginHorizontal: -18, flexGrow: 0 },
  row: { gap: 7, paddingHorizontal: 18, paddingTop: 2, paddingBottom: 4 },
  pill: { height: 36, paddingHorizontal: 13, borderRadius: 19, borderWidth: 2, borderColor: Colors.ink, backgroundColor: '#fff', justifyContent: 'center' },
  on: { backgroundColor: C.pu },
  t: { fontFamily: Font.body900, fontSize: 13, lineHeight: 18 },
});

/**
 * − 12명 + : 숫자 직접 정하기 (번개 정원 · 동아리 최대 인원 · 챌린지 주 몇 회 — 개설 화면 공통).
 * 누르면 하나씩, 끝에 닿으면 흐리게. format: 가운데 글자 (예: v => `${v}명`)
 */
/** unlimited: '인원 무관' 같은 제한 없음 칸 — 켜면 숫자 칸이 흐려지고 못 눌러요 */
export function CountStepper({ value, min, max, format, onChange, less = '하나 줄이기', more = '하나 늘리기', unlimited }: { value: number; min: number; max: number; format: (v: number) => string; onChange: (v: number) => void; less?: string; more?: string; unlimited?: { on: boolean; onChange: (on: boolean) => void; label: string } }) {
  const off = !!unlimited?.on;
  const step = (d: number) => {
    const v = Math.min(max, Math.max(min, value + d));
    if (v === value) return;
    sfx('tap');
    onChange(v);
  };
  const btn = (d: number, label: string, end: boolean) => (
    <Pressable onPress={() => step(d)} disabled={off || end} accessibilityRole="button" accessibilityLabel={label} hitSlop={6} style={({ pressed }) => [st.b, (off || end) && st.off, pressed && st.on]}>
      <PText style={st.bt}>{d < 0 ? '−' : '+'}</PText>
    </Pressable>
  );
  return (
    <View style={st.wrap}>
      <View style={[st.row, off && st.dim]} accessibilityRole="adjustable" accessibilityValue={{ min, max, now: value, text: off ? unlimited?.label : format(value) }}>
        {btn(-1, less, value <= min)}
        <PText style={st.v}>{format(value)}</PText>
        {btn(1, more, value >= max)}
      </View>
      {unlimited ? (
        <Pressable
          onPress={() => {
            sfx('pick');
            unlimited.onChange(!off);
          }}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: off }}
          style={[st.free, off && st.freeOn]}>
          <PText style={[st.freeT, off && st.freeTOn]}>{unlimited.label}</PText>
        </Pressable>
      ) : null}
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 14, flexWrap: 'wrap' },
  row: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 14 },
  dim: { opacity: 0.35 },
  free: { height: 38, paddingHorizontal: 14, borderRadius: 19, borderWidth: 2, borderColor: Colors.ink, backgroundColor: '#fff', justifyContent: 'center' },
  freeOn: { backgroundColor: C.pu },
  freeT: { fontFamily: Font.body900, fontSize: 13, lineHeight: 18 },
  freeTOn: { color: '#fff' },
  b: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  bt: { fontFamily: Font.body900, fontSize: 20, lineHeight: 24 },
  v: { minWidth: 56, textAlign: 'center', fontFamily: Font.display, fontSize: 18, lineHeight: 24 },
  off: { opacity: 0.35 },
  on: { transform: [{ scale: 0.94 }] },
});

// ---------------------------------------------------------------- 시간 ~ 시간 (번개 · 동아리 개설 공통)

/** 30분 칸: 하루 전체 (오전 12:00 ~ 오후 11:30) */
export const HALF_HOURS = Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`);
const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
const ofMin = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
/** 끝나는 시간에만 있는 자정 */
const MIDNIGHT = '24:00';
/** '20:00' → '오후 8:00' · '24:00' → '밤 12:00' */
export const timeLabel = (t: string) => {
  const h = Number(t.slice(0, 2));
  if (h === 24) return '밤 12:00';
  return `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}:${t.slice(3)}`;
};
/** 걸리는 시간 글자 (예: '2시간 30분') */
export const spanLabel = (start: string, end: string) => {
  const d = toMin(end) - toMin(start);
  const h = Math.floor(d / 60);
  return [h ? `${h}시간` : '', d % 60 ? `${d % 60}분` : ''].filter(Boolean).join(' ');
};
/** 끝나는 시간 기본: 시작 + 2시간 (자정까지) */
export const defaultEnd = (start: string) => ofMin(Math.min(toMin(start) + 120, toMin(MIDNIGHT)));

/**
 * 시작 시간 ~ 끝나는 시간: 시작 · 끝 칸을 누르면 그 칸 안에서 휠을 돌려 골라요. 시간을 누르면 바로 정해지고 닫혀요 (이름 줄 · 완료로도 닫혀요).
 * 끝은 시작 30분 뒤부터만 · 시작을 끝보다 늦게 바꾸면 끝이 시작 + 2시간으로 따라가요.
 */
export function TimeRange({ start, end, onChange }: { start: string; end: string; onChange: (start: string, end: string) => void }) {
  const [edit, setEdit] = useState<'s' | 'e' | null>(null);
  // 시작은 오후 11:30 까지 · 끝은 자정(밤 12:00)까지
  const starts = HALF_HOURS;
  // 끝은 시작 30분 뒤부터만
  const ends = [...HALF_HOURS, MIDNIGHT].filter((t) => toMin(t) >= toMin(start) + 30);
  const pickStart = (t: string) => onChange(t, toMin(end) > toMin(t) ? end : defaultEnd(t));
  const box = (k: 's' | 'e', label: string, t: string) => {
    const on = edit === k;
    const toggle = () => {
      sfx('tap');
      setEdit(on ? null : k);
    };
    // 고르는 중: 칸 안에서 바로 휠을 돌려요 (위 이름 줄을 누르면 닫혀요)
    if (on)
      return (
        <View style={[tr.box, tr.boxOn]}>
          <Pressable onPress={toggle} accessibilityRole="button" accessibilityLabel={`${label} 닫기`} hitSlop={6} style={tr.head}>
            <PText style={[tr.k, tr.kOn]}>{label}</PText>
            <PText style={tr.done}>완료</PText>
          </Pressable>
          <Wheel bare items={k === 's' ? starts : ends} value={t} label={timeLabel} onChange={(v) => (k === 's' ? pickStart(v) : onChange(start, v))} onTap={() => setEdit(null)} />
        </View>
      );
    return (
      <Pressable onPress={toggle} accessibilityRole="button" accessibilityLabel={`${label} ${timeLabel(t)} · 바꾸기`} style={tr.box}>
        <PText style={tr.k}>{label}</PText>
        <PText style={tr.v}>{timeLabel(t)}</PText>
      </Pressable>
    );
  };
  return (
    <View style={tr.row}>
      {box('s', '시작', start)}
      <PText style={tr.til}>~</PText>
      {box('e', '끝', end)}
    </View>
  );
}

const tr = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  // flexBasis 0 · minWidth 0: 휠을 열어도 두 칸 폭이 그대로 (옆 칸이 화면 밖으로 안 밀려요)
  box: { flex: 1, flexBasis: 0, minWidth: 0, borderWidth: 2, borderColor: Colors.ink, borderRadius: 14, backgroundColor: '#fff', paddingVertical: 8, paddingHorizontal: 12, gap: 1 },
  boxOn: { borderColor: C.pu, backgroundColor: '#F3EEFB', boxShadow: '2px 2px 0px #493087' },
  k: { fontFamily: Font.body800, fontSize: 11.5, lineHeight: 16, color: Colors.inkSub },
  kOn: { color: C.pu },
  v: { fontFamily: Font.display, fontSize: 16, lineHeight: 21 },
  til: { marginTop: 18, fontFamily: Font.display, fontSize: 16, color: Colors.inkSub },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  done: { fontFamily: Font.body900, fontSize: 11.5, lineHeight: 16, color: C.pu },
});
