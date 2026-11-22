import { type ReactNode, useState } from 'react';
import { type LayoutChangeEvent, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';

import { useBlockedNames } from '@/components/common/report-sheet';
import { guardMember } from '@/components/common/trial-guide';
import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { type AbroadPerson, CC_KEYS, ccOf, type CountryCode, daysFrom, LG_C, LG_CC, LG_STY, LG_TYPES, monthDay, type Trip } from '@/data/lounge';
import { WORLD_MAP } from '@/data/lounge-maps';
import { addPerson, addTrip, closeTrip, removeMyPerson, setCountry, setTripState, useLounge } from '@/data/lounge-store';
import { useMe } from '@/state/me';

import { Face } from './face';
import { LgIcon, SparkIcon } from './icons';
import { CheckBox, LgButton } from './lg-button';
import { SparkPin } from './map-parts';
import { go } from './nav';
import { gray } from './pics';

/*
 * 해외 동행 탭 (프로토타입 lgWorldMap · .lg-pps · LG_CARD.trip · lgMkTrip · lgRegAbroad · lgPerson).
 * 해외살이 = 보라 스파크, 여행 동행 = 분홍 스파크. 나라를 누르면 그 나라로 확대 · 아래 목록도 그 나라만.
 */

/** 나라별 [글 · 동행 수, 사람 수] (프로토타입 lgCcCount) */
function useCountryCounts(mode: 'live' | 'trip') {
  const feed = useLounge((s) => s.feed);
  const people = useLounge((s) => s.people);
  const blocked = useBlockedNames();
  const hidden = useLounge((s) => s.hidden);
  const off = (who: string) => blocked.includes(who) || !!hidden[who];
  const c = Object.fromEntries(CC_KEYS.map((k) => [k, [0, 0]])) as Record<CountryCode, [number, number]>;
  if (mode === 'trip') feed.forEach((p) => p.k === 'trip' && !off(p.who) && !p.closed && p.cur < p.cap && c[p.cc][0]++);
  else {
    feed.forEach((p) => p.k === 'abroad' && !off(p.who) && c[p.cc][0]++);
    people.forEach((p) => c[p.cc][1]++);
  }
  return c;
}

const VW = WORLD_MAP.w;
const VH = WORLD_MAP.h;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** 세계 지도 카드 — 지도를 누르면 가장 가까운 나라로 확대, 멀리 누르면 다시 전체 */
export function WorldMapCard({ mode }: { mode: 'live' | 'trip' }) {
  const cc = useLounge((s) => s.cc);
  const c = useCountryCounts(mode);
  const [w, setW] = useState(348);
  const z = cc ? 2.6 : 1;
  const [cx, cy] = cc ? [clamp(LG_CC[cc][1], VW / 2 / z, VW - VW / 2 / z), clamp(LG_CC[cc][2], VH / 2 / z, VH - VH / 2 / z)] : [VW / 2, VH / 2];
  const tf = `translate(${(VW / 2 - cx * z).toFixed(2)} ${(VH / 2 - cy * z).toFixed(2)}) scale(${z})`;
  // 핀은 화면에서 살짝만 커져요 (프로토타입 lgZoomMaps ps)
  const ps = (1 / z) * Math.min(1.35, Math.sqrt(z));
  const shown = CC_KEYS.filter((k) => c[k][0] + c[k][1] > 0);
  const onMapPress = (lx: number, ly: number) => {
    const s = w / VW;
    const px = (lx / s - (VW / 2 - cx * z)) / z;
    const py = (ly / s - (VH / 2 - cy * z)) / z;
    const near = shown.map((k) => [k, Math.hypot(LG_CC[k][1] - px, LG_CC[k][2] - py)] as const).sort((a, b) => a[1] - b[1])[0];
    const lim = (40 / z) * Math.max(1, z * 0.8);
    const v = near && near[1] <= lim ? near[0] : null;
    if (v === cc) return;
    setCountry(v);
  };
  const sel = cc ? c[cc] : null;
  return (
    <View style={styles.cardShadow}>
      <View style={styles.card} accessibilityLabel="해외 지도">
        <View style={styles.mhd}>
          <LgIcon name={mode === 'trip' ? 'plane' : 'globe'} size={13} color={Colors.purple} sw={2.4} />
          <PText style={styles.kick}>{mode === 'trip' ? '모집 중인 여행 동행' : 'PALLO 사람들이 사는 곳'}</PText>
        </View>
        <Pressable onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)} onPress={(e) => onMapPress(e.nativeEvent.locationX, e.nativeEvent.locationY)} style={styles.wd} accessibilityLabel="지도 · 누르면 그 나라로 확대">
          <Svg width="100%" height="100%" viewBox={`0 0 ${VW} ${VH}`}>
            <G transform={tf}>
              <Path d={WORLD_MAP.land} transform="translate(2 2.6)" fill={Colors.ink} />
              <Path d={WORLD_MAP.land} fill="none" stroke={Colors.ink} strokeWidth={1.8} strokeLinejoin="round" />
              <Path d={WORLD_MAP.land} fill={Colors.yellow} />
              {shown.map((k) => {
                const n = c[k][0] + c[k][1];
                const [, x, y] = LG_CC[k];
                return <SparkPin key={k} x={x} y={y} n={n} color={mode === 'trip' ? LG_C.pk : LG_C.pu} scale={ps} />;
              })}
            </G>
          </Svg>
        </Pressable>
        <View style={styles.cap}>
          {cc && sel ? (
            <>
              <LgIcon name="pin" size={16} />
              <PText style={styles.capText}>
                <PText style={styles.capB}>{LG_CC[cc][0]}</PText> · {mode === 'trip' ? `모집 중인 동행 ${sel[0]}개` : `글 ${sel[0]} · 사람 ${sel[1]}`}
              </PText>
              <View style={styles.sp} />
              <Pressable onPress={() => setCountry(null)} accessibilityRole="button" hitSlop={8}>
                <PText style={styles.capAll}>전체 보기</PText>
              </Pressable>
            </>
          ) : (
            <>
              <SparkIcon color={LG_C.pu} width={16} />
              <PText style={styles.capText}>지도를 누르면 그 나라로 확대돼요</PText>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

/** 해외에 있는 PALLO 사람들 (옆으로 넘기는 카드 · 맨 앞 '나도 해외에 있어요') */
export function PeopleRow({ people, onAdd, onPick }: { people: AbroadPerson[]; onAdd: () => void; onPick: (p: AbroadPerson) => void }) {
  const mine = people.some((p) => p.me);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.ppsWrap} contentContainerStyle={styles.pps}>
      {mine ? null : (
        <Pressable onPress={onAdd} accessibilityRole="button" accessibilityLabel="나도 해외에 있어요" style={styles.ppAdd}>
          <View style={styles.ppPlus}>
            <LgIcon name="plus" size={20} sw={2.8} />
          </View>
          <PText style={styles.ppAddText}>{'나도 해외에\n있어요'}</PText>
        </Pressable>
      )}
      {people.map((p) => (
        <Pressable key={p.n + p.city} onPress={() => onPick(p)} accessibilityRole="button" accessibilityLabel={`${p.n} · ${LG_CC[p.cc][0]} ${p.city}`} style={styles.pp}>
          <View style={[styles.pph, { backgroundColor: LG_CC[p.cc][3] }]}>
            <PText style={styles.pphText}>{p.cc}</PText>
            <View style={styles.sp} />
            <LgIcon name="plane" size={16} />
          </View>
          <View style={styles.ppb}>
            <PText style={styles.ppName} numberOfLines={1}>
              {p.n}
              {p.me ? <PText style={styles.ppMe}> 나</PText> : null}
            </PText>
            <PText style={styles.ppSmall} numberOfLines={2}>
              {p.city} · {p.since}
              {'\n'}
              {p.job}
            </PText>
            <PText style={styles.ppEm} numberOfLines={1}>
              {p.br} 출신
            </PText>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

/** 여행 동행 탑승권 카드 (프로토타입 LG_CARD.trip) */
export function TripCard({ p }: { p: Trip }) {
  const s = useLounge((x) => x.trip[p.id]);
  const cur = p.cur + (s === 'ok' ? 1 : 0);
  const full = cur >= p.cap;
  const dd = daysFrom(p.from);
  const off = !!p.closed || (full && !s);
  const dim = (off && !p.mine) || !!p.closed;
  const col = (x: string) => (dim ? gray(x, 0.85) : x);
  const onBtn = () => {
    if (p.mine) {
      closeTrip(p.id, true);
      showToast('동행 모집을 닫았어요', { label: '되돌리기', onPress: () => closeTrip(p.id, false) });
      return;
    }
    if (s === 'ok') return showToast('오픈채팅으로 이동해요');
    if (s === 'wait') {
      setTripState(p.id, null);
      return showToast('동행 신청을 취소했어요');
    }
    guardMember(() => go(`/trip/${p.id}`), '동행을 신청하려면');
  };
  const btn = p.mine ? (
    p.closed ? (
      <LgButton label="모집 닫음" disabled />
    ) : (
      <LgButton label="모집 닫기" tone="white" onPress={onBtn} />
    )
  ) : s === 'ok' ? (
    <LgButton label="오픈채팅 열기" tone="purple" onPress={onBtn} />
  ) : s === 'wait' ? (
    <LgButton label="수락 기다리는 중" tone="white" onPress={onBtn} />
  ) : off ? (
    <LgButton label="모집 마감" disabled />
  ) : (
    <LgButton label="동행 신청" onPress={onBtn} />
  );
  return (
    <View style={[styles.tkShadow, dim && { opacity: 0.75 }]}>
      <View style={[styles.tk, { backgroundColor: col(LG_C.sky) }]}>
        <View style={styles.stub}>
          <PText style={styles.stubKick}>{monthDay(p.from)}</PText>
          <PText style={styles.stubD}>{dd > 0 ? `D-${dd}` : 'D-DAY'}</PText>
          <PText style={styles.stubSmall}>~ {monthDay(p.to)}</PText>
        </View>
        <View style={styles.tkBody}>
          <View style={styles.kickRow}>
            <LgIcon name="plane" size={13} />
            <PText style={styles.tkKick}>
              {LG_CC[p.cc][0]} · {p.city}
            </PText>
          </View>
          <PText style={styles.tkT}>{p.title}</PText>
          <PText style={styles.tkS}>
            {p.type} · {p.who}
            {p.mine ? ' (나)' : ''} · {p.br}
          </PText>
          <PText style={styles.tkSty}>{[p.age, ...p.styles].join(' · ')}</PText>
          <View style={styles.tkFoot}>
            <View style={styles.avs}>
              {Array.from({ length: Math.min(cur, 3) }, (_, k) => (
                <Face key={k} name={k ? 'MS'[k - 1] : p.who} size={26} bg={[p.av, '#fff', LG_C.y][k]} style={k ? { marginLeft: -9 } : undefined} />
              ))}
            </View>
            <PText style={styles.tkN}>
              {cur}/{p.cap}명
            </PText>
            <View style={styles.sp} />
            {btn}
          </View>
        </View>
      </View>
    </View>
  );
}

/** 해외 사람 카드를 누르면: 질문 보내기 (내 카드면 내리기) — 프로토타입 lgPerson */
export function PersonSheet({ p, onClose }: { p: AbroadPerson | null; onClose: () => void }) {
  const [v, setV] = useState('');
  if (!p) return null;
  const send = () =>
    guardMember(() => {
      if (!v.trim()) return;
      onClose();
      setV('');
      showToast(`${p.n}에게 질문을 보냈어요`);
    }, '질문하려면');
  return (
    <Sheet
      open
      onClose={onClose}
      title={`${p.n}${p.me ? ' (나)' : ''}`}
      footer={
        p.me ? <LgButton label="내 카드 내리기" tone="white" wide height={50} onPress={() => (removeMyPerson(), onClose(), showToast('내 카드를 내렸어요'))} /> : <LgButton label={`${p.n}에게 질문 보내기`} wide height={50} onPress={send} />
      }>
      <PText style={styles.ds}>
        {LG_CC[p.cc][0]} {p.city} · {p.since}
        {'\n'}
        {p.job} · {p.br} 출신
      </PText>
      {p.me ? null : <TextInput value={v} onChangeText={setV} multiline placeholder="예) 집 구할 때 보증금은 보통 얼마였어요?" placeholderTextColor="#8C8597" style={styles.ta} accessibilityLabel="질문 입력" />}
    </Sheet>
  );
}

/** 알약 고르기 줄 (프로토타입 lgPills · 옆으로 넘겨요) */
export function Pills({ opts, on, onPick, multi = false }: { opts: string[]; on: string[]; onPick: (v: string) => void; multi?: boolean }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsWrap} contentContainerStyle={styles.pills} accessibilityRole={multi ? undefined : 'radiogroup'}>
      {opts.map((o) => {
        const sel = on.includes(o);
        return (
          <Pressable key={o} onPress={() => onPick(o)} accessibilityRole={multi ? 'checkbox' : 'radio'} accessibilityState={multi ? { checked: sel } : { selected: sel }} style={[styles.pill, sel && styles.pillOn]}>
            <PText style={[styles.pillText, sel && { color: '#fff' }]}>{o}</PText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <View style={styles.fl}>
      <PText style={styles.lb}>{label}</PText>
      <TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor="#8C8597" style={styles.input} accessibilityLabel={label} />
    </View>
  );
}

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const addDays = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return iso(d);
};

/** 동행 구하기 (프로토타입 lgMkTrip) */
export function TripMakeSheet({ open, onClose, onClosed }: { open: boolean; onClose: () => void; onClosed?: () => void }) {
  const me = useMe();
  const cc0 = useLounge((s) => s.cc);
  const [cc, setCc] = useState(cc0 ? LG_CC[cc0][0] : '일본');
  const [city, setCity] = useState('');
  const [from, setFrom] = useState(addDays(14));
  const [to, setTo] = useState(addDays(17));
  const [type, setType] = useState('식사 · 투어');
  const [cap, setCap] = useState('3명');
  const [sty, setSty] = useState<string[]>(['맛집']);
  const [title, setTitle] = useState('');
  const submit = () => {
    if (!city.trim()) return showToast('도시를 적어 주세요');
    const code = ccOf(cc) ?? 'JP';
    addTrip({
      id: `u${Date.now()}`,
      k: 'trip',
      cc: code,
      city: city.trim(),
      from,
      to,
      type,
      cap: parseInt(cap, 10) || 3,
      cur: 1,
      who: me.name,
      av: LG_C.y,
      br: me.branch,
      age: '나이 무관',
      styles: sty.length ? sty : ['자유'],
      title: title.trim() || `${city.trim()} 같이 가요`,
      intro: '',
      mine: true,
    });
    onClose();
    showToast('동행 구하기를 올렸어요 · 신청이 오면 알려 드려요');
  };
  return (
    <Sheet open={open} onClose={onClose} onClosed={onClosed} title="동행 구하기" footer={<LgButton label="동행 구하기 올리기" wide height={50} onPress={submit} />}>
      <PText style={styles.ds}>신청이 오면 내가 수락한 사람에게만 오픈채팅 링크가 가요.</PText>
      <View style={styles.fl}>
        <PText style={styles.lb}>나라</PText>
        <Pills opts={CC_KEYS.map((k) => LG_CC[k][0])} on={[cc]} onPick={setCc} />
      </View>
      <Field label="도시" value={city} onChange={setCity} placeholder="예) 오사카" />
      <View style={styles.fl2}>
        <View style={styles.flex}>
          <Field label="가는 날" value={from} onChange={setFrom} />
        </View>
        <View style={styles.flex}>
          <Field label="오는 날" value={to} onChange={setTo} />
        </View>
      </View>
      <View style={styles.fl}>
        <PText style={styles.lb}>동행 방식</PText>
        <Pills opts={LG_TYPES} on={[type]} onPick={setType} />
      </View>
      <View style={styles.fl}>
        <PText style={styles.lb}>구하는 인원 (나 포함)</PText>
        <Pills opts={['2명', '3명', '4명', '5명']} on={[cap]} onPick={setCap} />
      </View>
      <View style={styles.fl}>
        <PText style={styles.lb}>여행 스타일 · 여러 개 골라요</PText>
        <Pills multi opts={LG_STY} on={sty} onPick={(v) => setSty((L) => (L.includes(v) ? L.filter((x) => x !== v) : [...L, v]))} />
      </View>
      <Field label="제목" value={title} onChange={setTitle} placeholder="예) 오사카 맛집 투어 같이 가요" />
    </Sheet>
  );
}

/** 나도 해외에 있어요 (프로토타입 lgRegAbroad) */
export function AbroadRegSheet({ open, onClose, onClosed }: { open: boolean; onClose: () => void; onClosed?: () => void }) {
  const me = useMe();
  const [cc, setCc] = useState('호주');
  const [city, setCity] = useState('');
  const [since, setSince] = useState('');
  const [job, setJob] = useState('');
  const submit = () => {
    if (!city.trim()) return showToast('도시를 적어 주세요');
    const code = ccOf(cc) ?? 'AU';
    addPerson({ n: me.name, cc: code, city: city.trim(), since: since.trim() || '이번 달부터', job: job.trim() || '해외살이', br: me.branch, av: LG_C.y, me: true });
    onClose();
    showToast(`내 카드를 올렸어요 · ${LG_CC[code][0]}에 표시돼요`);
  };
  return (
    <Sheet open={open} onClose={onClose} onClosed={onClosed} title="나도 해외에 있어요" footer={<LgButton label="내 카드 올리기" wide height={50} onPress={submit} />}>
      <PText style={styles.ds}>지도에 내 나라가 표시되고, PALLO 사람들이 질문을 보낼 수 있어요.</PText>
      <View style={styles.fl}>
        <PText style={styles.lb}>나라</PText>
        <Pills opts={CC_KEYS.map((k) => LG_CC[k][0])} on={[cc]} onPick={setCc} />
      </View>
      <Field label="도시" value={city} onChange={setCity} placeholder="예) 브리즈번" />
      <View style={styles.fl2}>
        <View style={styles.flex}>
          <Field label="언제부터" value={since} onChange={setSince} placeholder="예) 2개월째" />
        </View>
        <View style={styles.flex}>
          <Field label="하는 일" value={job} onChange={setJob} placeholder="예) 워홀 · 카페" />
        </View>
      </View>
    </Sheet>
  );
}

/** 체크 칸 상자 (프로토타입 .lg-chk) */
export function CheckBoxList({ children }: { children: ReactNode }) {
  return <View style={styles.chk}>{children}</View>;
}

/** 체크 한 줄 (줄 전체가 체크 칸) */
export function CheckRow({ text, on, onPress, first = false }: { text: string; on: boolean; onPress: () => void; first?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={text} style={[styles.safe, !first && styles.safeLine]}>
      <CheckBox on={on} />
      <PText style={styles.safeText}>{text}</PText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sp: { flex: 1 },
  flex: { flex: 1 },
  cardShadow: { borderRadius: 20, boxShadow: `4px 4px 0px ${Colors.ink}` },
  card: { backgroundColor: '#fff', borderWidth: 2, borderColor: Colors.ink, borderRadius: 20, overflow: 'hidden' },
  mhd: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: 12, paddingHorizontal: 14 },
  kick: { fontFamily: Font.display, fontSize: 11, lineHeight: 16, letterSpacing: 0.3, color: Colors.purple },
  wd: { marginTop: 10, backgroundColor: Colors.cream, borderTopWidth: 2, borderBottomWidth: 2, borderColor: Colors.ink, aspectRatio: VW / VH, overflow: 'hidden' },
  cap: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 10, paddingHorizontal: 14, paddingBottom: 12 },
  capText: { fontFamily: Font.body800, fontSize: 12.5, lineHeight: 19 },
  capB: { fontFamily: Font.body900 },
  capAll: { fontFamily: Font.body900, fontSize: 12.5, lineHeight: 19, color: Colors.purple },
  ppsWrap: { marginTop: -8, marginHorizontal: -16 },
  pps: { gap: 10, paddingTop: 4, paddingHorizontal: 16, paddingBottom: 8 },
  ppAdd: { width: 148, height: 140, backgroundColor: Colors.cream, borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.ink, borderRadius: 18, alignItems: 'center', justifyContent: 'center', gap: 8 },
  ppPlus: { width: 44, height: 44, borderRadius: 20, backgroundColor: Colors.yellow, borderWidth: 2, borderColor: Colors.ink, alignItems: 'center', justifyContent: 'center' },
  ppAddText: { fontFamily: Font.body900, fontSize: 13, lineHeight: 18, textAlign: 'center' },
  pp: { width: 148, height: 140, backgroundColor: '#fff', borderWidth: 2, borderColor: Colors.ink, borderRadius: 18, overflow: 'hidden', boxShadow: `3px 3px 0px ${Colors.ink}`, marginRight: 3, marginBottom: 3 },
  pph: { height: 34, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 2, borderColor: Colors.ink },
  pphText: { fontFamily: Font.display, fontSize: 13, lineHeight: 17 },
  ppb: { paddingTop: 9, paddingHorizontal: 11, paddingBottom: 11 },
  ppName: { fontFamily: Font.body900, fontSize: 14, lineHeight: 20 },
  ppMe: { fontFamily: Font.body900, fontSize: 14, color: Colors.purple },
  ppSmall: { fontFamily: Font.body700, fontSize: 11.5, lineHeight: 17.25, color: Colors.inkSub, marginTop: 2 },
  ppEm: { fontFamily: Font.body900, fontSize: 11.5, lineHeight: 16, color: Colors.purple, marginTop: 5 },
  tkShadow: { borderRadius: 20, boxShadow: `4px 4px 0px ${Colors.ink}` },
  tk: { flexDirection: 'row', borderWidth: 2, borderColor: Colors.ink, borderRadius: 20, overflow: 'hidden' },
  stub: { width: 86, backgroundColor: '#fff', paddingVertical: 12, alignItems: 'center', justifyContent: 'center', borderRightWidth: 2, borderStyle: 'dashed', borderColor: Colors.ink },
  stubKick: { fontFamily: Font.display, fontSize: 11, lineHeight: 14, letterSpacing: 0.3 },
  stubD: { fontFamily: Font.display, fontSize: 24, lineHeight: 24, letterSpacing: -0.5, marginVertical: 2, textAlign: 'center' },
  stubSmall: { fontFamily: Font.body900, fontSize: 11.5, lineHeight: 16 },
  tkBody: { flex: 1, paddingTop: 13, paddingHorizontal: 13, paddingBottom: 12 },
  kickRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tkKick: { fontFamily: Font.display, fontSize: 11, lineHeight: 16, letterSpacing: 0.3 },
  tkT: { fontFamily: Font.body900, fontSize: 17, lineHeight: 22.1, marginTop: 6 },
  tkS: { fontFamily: Font.body700, fontSize: 12, lineHeight: 17, color: '#2C2640', marginTop: 4 },
  tkSty: { fontFamily: Font.body800, fontSize: 12, lineHeight: 17, marginTop: 6 },
  tkFoot: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  avs: { flexDirection: 'row' },
  tkN: { fontFamily: Font.body900, fontSize: 12, lineHeight: 17 },
  ds: { fontFamily: Font.body600, fontSize: 14, lineHeight: 22.4, color: Colors.inkSub },
  ta: {
    minHeight: 110,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: Colors.ink,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontFamily: Font.body600,
    fontSize: 14,
    lineHeight: 21,
    color: Colors.ink,
    textAlignVertical: 'top',
  },
  fl: { gap: 6 },
  fl2: { flexDirection: 'row', gap: 10 },
  lb: { fontFamily: Font.body900, fontSize: 12.5, lineHeight: 17 },
  input: { height: 46, backgroundColor: '#fff', borderWidth: 2, borderColor: Colors.ink, borderRadius: 14, paddingHorizontal: 14, fontFamily: Font.body700, fontSize: 14, color: Colors.ink },
  pillsWrap: { marginHorizontal: -18, flexGrow: 0 },
  pills: { gap: 7, paddingTop: 2, paddingHorizontal: 18, paddingBottom: 4 },
  pill: { height: 36, paddingHorizontal: 13, borderRadius: 18, borderWidth: 2, borderColor: Colors.ink, backgroundColor: '#fff', justifyContent: 'center' },
  pillOn: { backgroundColor: Colors.purple },
  pillText: { fontFamily: Font.body900, fontSize: 13, lineHeight: 18 },
  safe: { flexDirection: 'row', alignItems: 'center', gap: 11, minHeight: 50, paddingHorizontal: 14, paddingVertical: 8 },
  safeLine: { borderTopWidth: 1.5, borderColor: Colors.line },
  safeText: { flex: 1, fontFamily: Font.body800, fontSize: 13.5, lineHeight: 18.9 },
  chk: { backgroundColor: '#fff', borderWidth: 2, borderColor: Colors.ink, borderRadius: 18, overflow: 'hidden' },
});
