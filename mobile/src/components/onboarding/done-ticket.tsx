import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Line, Path } from 'react-native-svg';

import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { kf, kfc } from '@/lib/motion';

import type { ONB_LANGS } from './app-parts';
import { DONE_AT, useDoneClock } from './done-motion';
import { DONE_STAGE } from './done-stage';
import { OUT, POP } from './fx-motion';
import { SparkBurst, SparkMark } from './fx-spark';

type Lang = (typeof ONB_LANGS)[number];

/** 그림자 · 테두리 · 잘린 홈 · 그루터기(오른쪽 표 조각) 폭 */
const SHADOW = 4;
const BORDER = 2;
const RADIUS = 20;
const NOTCH = 11;
const STUB_W = 88;

const WEEK_EN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const WEEK_KO = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

/** 'YYYY-MM-DD' → 11.25 · WED · 수요일 (못 읽으면 null) */
function dayParts(day: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return { md: `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, '0')}`, say: `${d.getMonth() + 1}월 ${d.getDate()}일`, en: WEEK_EN[d.getDay()], ko: WEEK_KO[d.getDay()] };
}

/** 'HH:MM' → 오후 7시 30분 (못 읽으면 null) */
function timeKo(time: string) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h < 12 ? '오전' : '오후'} ${h12}시${min ? ` ${min}분` : ''}`;
}

/**
 * 체험 예약 확정 › 입장권.
 * 흰 표에 잉크 테두리 · 딱 떨어지는 그림자, 점선과 양쪽 반원 홈으로 본 표와 그루터기(ADMIT ONE)를 나눠요.
 * 아래에서 쑥 올라온 뒤, 그루터기에 'CONFIRMED' 도장이 쾅 찍혀요 (찍히는 순간 표가 살짝 눌려요).
 */
export function DoneTicket({ branch, lang, name, phone, day, time, note }: { branch: string; lang: Lang; name: string; phone: string; day: string; time: string; note: string }) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== size.w || height !== size.h) setSize({ w: width, h: height });
  };

  const slide = useDoneClock(DONE_AT.ticket, DONE_AT.ticketMs);
  const stamp = useDoneClock(DONE_AT.stamp, DONE_AT.stampMs);
  const slideStyle = useAnimatedStyle(() => {
    const t = slide.get();
    // 도장이 찍히는 순간 표가 3px 눌렸다 돌아와요
    const thump = kf(stamp.get(), [0, 55, 70, 100], [0, 0, 3, 0]);
    return {
      opacity: kf(t, [0, 20, 100], [0, 1, 1]),
      transform: [{ translateY: kfc(t, [0, 100], [150, 0], POP) + thump }, { rotate: `${kfc(t, [0, 100], [-4, 0], OUT)}deg` }],
    };
  });

  const date = dayParts(day);
  const when = timeKo(time);
  const who = [name.trim(), phone.trim()].filter(Boolean).join(' · ');

  return (
    <Animated.View style={[styles.wrap, slideStyle]}>
      {size.w > 0 && <TicketShape w={size.w} h={size.h} />}
      <View style={styles.row} onLayout={onLayout}>
        {/* 본 표 */}
        <View style={styles.main}>
          <PText style={styles.kicker}>무료 체험 상담</PText>
          <View style={styles.when} accessible accessibilityLabel={`${date ? `${date.say} ${date.ko}` : '날짜 미정'}, ${when ?? '시간 미정'}`}>
            <View style={styles.cell}>
              <PText style={styles.cellLabel}>DATE</PText>
              {date ? <PText style={styles.big}>{date.md}</PText> : <PText style={styles.bigTbd}>미정</PText>}
              {date ? <PText style={styles.cellSub}>{`${date.en} · ${date.ko}`}</PText> : null}
            </View>
            <View style={styles.cell}>
              <PText style={styles.cellLabel}>TIME</PText>
              {when ? <PText style={styles.big}>{time}</PText> : <PText style={styles.bigTbd}>미정</PText>}
              {when ? <PText style={styles.cellSub}>{when}</PText> : null}
            </View>
          </View>
          <View style={styles.rule} />
          <InfoRow label="지점" value={branch || '—'} />
          <View style={styles.info} accessible accessibilityLabel={`상담 언어, ${lang.ko}`}>
            <PText style={styles.infoLabel}>상담 언어</PText>
            <View style={styles.langValue}>
              <View style={[styles.tag, { backgroundColor: lang.color }]}>
                <PText style={[styles.tagText, { color: lang.tagInk }]}>{lang.tag}</PText>
              </View>
              <PText style={styles.infoValue}>{lang.ko}</PText>
            </View>
          </View>
          <InfoRow label="예약자" value={who || '—'} />
          {note ? (
            <View style={styles.noteBox} accessible accessibilityLabel={`전달 사항, ${note}`}>
              <PText style={styles.infoLabel}>전달 사항</PText>
              <PText style={styles.noteValue} numberOfLines={3}>
                {note}
              </PText>
            </View>
          ) : null}
        </View>

        {/* 그루터기 */}
        <View style={styles.stub}>
          <View style={styles.admit} accessible accessibilityLabel="체험 1회 입장권">
            <PText style={styles.admitText}>ADMIT</PText>
            <PText style={styles.admitText}>ONE</PText>
            <PText style={styles.admitSub}>체험 1회</PText>
          </View>
          <Stamp label={date?.md} />
        </View>
      </View>
    </Animated.View>
  );
}

/** 표 모양: 둥근 네모에 점선 자리 위아래로 반원 홈. 그림자 판도 같은 모양이라 홈 사이로 바탕(크림)이 보여요 */
function TicketShape({ w, h }: { w: number; h: number }) {
  const sx = w - STUB_W;
  const outline = ticketPath(BORDER / 2, BORDER / 2, w - BORDER / 2, h - BORDER / 2, sx);
  const stub = stubPath(sx, BORDER / 2, w - BORDER / 2, h - BORDER / 2);
  return (
    <Svg pointerEvents="none" width={w + SHADOW} height={h + SHADOW} style={styles.shape}>
      <Path d={ticketPath(SHADOW, SHADOW, w + SHADOW, h + SHADOW, sx + SHADOW)} fill={Colors.ink} />
      <Path d={outline} fill={Colors.white} />
      <Path d={stub} fill={Colors.yellow} />
      <Path d={outline} fill="none" stroke={Colors.ink} strokeWidth={BORDER} strokeLinejoin="round" />
      <Line x1={sx} y1={NOTCH + 7} x2={sx} y2={h - NOTCH - 7} stroke={Colors.ink} strokeWidth={2} strokeDasharray="5 5" strokeLinecap="round" />
    </Svg>
  );
}

/** 둥근 네모 (x0,y0)–(x1,y1), 위아래 x=sx 에 반원 홈 */
function ticketPath(x0: number, y0: number, x1: number, y1: number, sx: number) {
  const r = RADIUS;
  const n = NOTCH;
  return [
    `M${x0 + r},${y0}`,
    `H${sx - n}`,
    `A${n},${n} 0 0 0 ${sx + n},${y0}`,
    `H${x1 - r}`,
    `A${r},${r} 0 0 1 ${x1},${y0 + r}`,
    `V${y1 - r}`,
    `A${r},${r} 0 0 1 ${x1 - r},${y1}`,
    `H${sx + n}`,
    `A${n},${n} 0 0 0 ${sx - n},${y1}`,
    `H${x0 + r}`,
    `A${r},${r} 0 0 1 ${x0},${y1 - r}`,
    `V${y0 + r}`,
    `A${r},${r} 0 0 1 ${x0 + r},${y0}`,
    'Z',
  ].join(' ');
}

/** 그루터기 면 (점선 오른쪽 · 반원 홈 반쪽씩) */
function stubPath(sx: number, y0: number, x1: number, y1: number) {
  const r = RADIUS;
  const n = NOTCH;
  return [
    `M${sx + n},${y0}`,
    `H${x1 - r}`,
    `A${r},${r} 0 0 1 ${x1},${y0 + r}`,
    `V${y1 - r}`,
    `A${r},${r} 0 0 1 ${x1 - r},${y1}`,
    `H${sx + n}`,
    `A${n},${n} 0 0 0 ${sx},${y1 - n}`,
    `V${y0 + n}`,
    `A${n},${n} 0 0 0 ${sx + n},${y0}`,
    'Z',
  ].join(' ');
}

/** 'CONFIRMED' 동그란 도장: 위에서 크게 내려와 그루터기에 쾅, 찍히는 순간 스파크 */
function Stamp({ label }: { label?: string }) {
  const p = useDoneClock(DONE_AT.stamp, DONE_AT.stampMs);
  const anim = useAnimatedStyle(() => {
    const t = p.get();
    return {
      opacity: kf(t, [0, 25, 100], [0, 1, 1]),
      transform: [{ rotate: `${kf(t, [0, 55, 100], [-26, -12, -12])}deg` }, { scale: kfc(t, [0, 55, 75, 100], [2.2, 0.9, 1.05, 1], OUT) }],
    };
  });
  return (
    <View style={styles.stampAt} pointerEvents="none" accessible accessibilityLabel="예약 확정">
      <Animated.View style={[styles.stamp, anim]}>
        <View style={styles.stampRing}>
          <SparkMark size={11} color={Colors.yellow} stroke={Colors.ink} strokeWidth={1} />
          <PText style={styles.stampText}>CONFIRMED</PText>
          {label ? <PText style={styles.stampSub}>{label}</PText> : null}
        </View>
      </Animated.View>
      <SparkBurst trigger={0} onMount delay={DONE_AT.stamp + DONE_AT.stampMs * 0.5} count={7} radius={48} size={11} style={styles.stampBurst} />
    </View>
  );
}

/** 표 한 줄: 왼쪽 이름 · 오른쪽 값 */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.info} accessible accessibilityLabel={`${label}, ${value}`}>
      <PText style={styles.infoLabel}>{label}</PText>
      <PText style={styles.infoValue} numberOfLines={1}>
        {value}
      </PText>
    </View>
  );
}

const STAMP = 70;

const styles = StyleSheet.create({
  wrap: { marginRight: SHADOW, marginBottom: SHADOW },
  shape: { position: 'absolute', left: 0, top: 0 },
  row: { flexDirection: 'row' },
  main: { flex: 1, paddingLeft: 18, paddingRight: 16, paddingTop: 16, paddingBottom: 12 },
  kicker: { fontFamily: Font.body900, fontSize: 12, lineHeight: 16, color: Colors.purple },
  when: { flexDirection: 'row', marginTop: 8, gap: 10 },
  cell: { flex: 1 },
  cellLabel: { fontFamily: Font.display, fontSize: 9, lineHeight: 12, letterSpacing: 1.2, color: Colors.inkSub },
  big: { marginTop: 2, fontFamily: Font.display, fontSize: 27, lineHeight: 32, letterSpacing: -1, color: Colors.ink, fontVariant: ['tabular-nums'] },
  bigTbd: { marginTop: 2, fontFamily: Font.body900, fontSize: 22, lineHeight: 32, color: Colors.inkSub },
  cellSub: { marginTop: 1, fontFamily: Font.body800, fontSize: 12, lineHeight: 16, color: Colors.inkSub },
  rule: { height: 1.5, backgroundColor: Colors.line, marginTop: 12, marginBottom: 2 },
  info: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, minHeight: 32 },
  infoLabel: { fontFamily: Font.body700, fontSize: 13, lineHeight: 18, color: Colors.inkSub },
  infoValue: { flexShrink: 1, textAlign: 'right', fontFamily: Font.body900, fontSize: 13.5, lineHeight: 19, color: Colors.ink },
  langValue: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tag: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 },
  tagText: { fontFamily: Font.body900, fontSize: 11.5, lineHeight: 16 },
  // 전달 사항: 글이 길 수 있어 이름 아래로 내려 세 줄까지 (넘치면 …)
  noteBox: { marginTop: 4, paddingTop: 8, borderTopWidth: 1.5, borderColor: Colors.line, gap: 2 },
  noteValue: { fontFamily: Font.body800, fontSize: 13, lineHeight: 19, color: Colors.ink },
  stub: { width: STUB_W, alignItems: 'center', justifyContent: 'space-between', paddingTop: 18, paddingBottom: 16 },
  admit: { alignItems: 'center' },
  admitText: { fontFamily: Font.poster, fontSize: 24, lineHeight: 26, letterSpacing: 0.6, color: Colors.ink },
  admitSub: { marginTop: 4, fontFamily: Font.body900, fontSize: 11, lineHeight: 15, color: Colors.ink },
  stampAt: { width: STAMP, height: STAMP, marginTop: 10 },
  stamp: { width: STAMP, height: STAMP, borderRadius: STAMP / 2, borderWidth: 2, borderColor: Colors.ink, backgroundColor: DONE_STAGE.pink, alignItems: 'center', justifyContent: 'center' },
  stampRing: { width: STAMP - 10, height: STAMP - 10, borderRadius: (STAMP - 10) / 2, borderWidth: 1.5, borderStyle: 'dashed', borderColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  stampText: { fontFamily: Font.poster, fontSize: 11, lineHeight: 13, letterSpacing: 0.4, color: Colors.white },
  stampSub: { fontFamily: Font.display, fontSize: 7.5, lineHeight: 10, color: Colors.ink },
  stampBurst: { left: STAMP / 2, top: STAMP / 2 },
});
