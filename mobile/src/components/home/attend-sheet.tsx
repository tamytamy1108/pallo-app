import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { css, cubicBezier, useReducedMotion } from 'react-native-reanimated';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';

import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { ATTEND_POINTS, LANGS, SLOTS } from '@/data/home';
import { haptic, sfx } from '@/lib/feedback';

import { firstSelectable, minuteOf, nowDate, slotSelectable, slotSub, summary, useAttend, type SheetMode } from './attendance';
import { HomeSheet, SheetClose } from './home-sheet';
import { CHECK_PATH, QR_PATH } from './icons';
import { Hard, SumRow, WideButton } from './parts';

/**
 * 출석 시트 (프로토타입 #sheet · #sheetForm · #sheetDone · renderSheet · openSheet).
 * 사전 출석(rsvp) · 출석(checkin) 두 모드를 같은 시트로 쓰고, 출석이 끝나면 같은 자리에서 출석 완료(done)를 보여 줘요.
 * 언어는 처음엔 비어 있어요 (출석 모드에서 사전 출석한 수업이면 그 언어가 미리 골라져요).
 */
export type AttendSheetMode = SheetMode | 'done';

export function AttendSheet({
  mode,
  onClose,
  onConfirm,
}: {
  mode: AttendSheetMode | null;
  onClose: () => void;
  /** 사전 출석: 참석 알리기 · 출석: QR 스캐너 열기 */
  onConfirm: (mode: SheetMode, slot: number, lang: number) => void;
}) {
  const a = useAttend();
  // 시트를 열 때마다 처음 값으로 (프로토타입 openSheet: sheetLang · firstSelectable)
  const [slot, setSlot] = useState(a.slot);
  const [lang, setLang] = useState<number | null>(null);
  const [m, setM] = useState(() => minuteOf(nowDate()));
  const [shown, setShown] = useState<AttendSheetMode>(mode ?? 'rsvp');
  const [seen, setSeen] = useState<AttendSheetMode | null>(null);

  // 시트가 새로 열리면(모드가 바뀌면) 처음 값으로 — 렌더 중에 바로 맞춰요 (React: 이전 값과 비교해 상태 고치기)
  if (mode !== seen) {
    setSeen(mode);
    if (mode) {
      setShown(mode);
      if (mode !== 'done') {
        const now = minuteOf(nowDate());
        const f = firstSelectable(a.slot, mode, now);
        setM(now);
        setSlot(f >= 0 ? f : a.slot);
        setLang(mode === 'checkin' && a.rsvp === 'yes' ? a.lang : null);
      }
    }
  }

  return (
    <HomeSheet open={!!mode} onClose={onClose} label={shown === 'done' ? '출석 완료' : shown === 'checkin' ? '출석체크' : '사전 출석체크'}>
      {shown === 'done' ? (
        <DoneView summaryText={summary(a.slot, a.lang)} week={a.week} onClose={onClose} />
      ) : (
        <FormView mode={shown} m={m} slot={slot} lang={lang} rsvpd={a.rsvp === 'yes'} onSlot={setSlot} onLang={setLang} onClose={onClose} onConfirm={() => lang !== null && onConfirm(shown, slot, lang)} />
      )}
    </HomeSheet>
  );
}

/* ───────── 시간 · 언어 고르기 ───────── */

function FormView({
  mode,
  m,
  slot,
  lang,
  rsvpd,
  onSlot,
  onLang,
  onClose,
  onConfirm,
}: {
  mode: SheetMode;
  m: number;
  slot: number;
  lang: number | null;
  rsvpd: boolean;
  onSlot: (i: number) => void;
  onLang: (i: number) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const checkin = mode === 'checkin';
  const ready = lang !== null;
  const sum = ready ? summary(slot, lang) : `${SLOTS[slot].t} · 언어 선택 전`;
  const sub = checkin ? (rsvpd && ready ? '미리 알린 수업으로 골라뒀어요 · 맞는지 확인해요' : '시간과 언어를 골라요') : '오늘 들을 스터디의 시간과 언어를 골라요';
  const btn = !ready ? '언어를 골라주세요' : checkin ? `${summary(slot, lang)} QR 찍고 출석` : `${summary(slot, lang)} 참석 알리기`;

  return (
    <View style={styles.form}>
      <View style={styles.head}>
        <View style={styles.headText}>
          <PText variant="title" accessibilityRole="header">
            {checkin ? '출석체크' : '사전 출석체크'}
          </PText>
          <PText style={styles.sub} color={Colors.inkSub}>
            {sub}
          </PText>
        </View>
        <SheetClose onPress={onClose} />
      </View>

      <PText style={styles.label}>① 시간</PText>
      <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel="스터디 시간">
        {SLOTS.map((s, i) => {
          const can = slotSelectable(i, mode, m);
          const on = i === slot;
          return (
            <Pressable
              key={s.id}
              disabled={!can}
              onPress={() => {
                sfx('tap');
                onSlot(i);
              }}
              accessibilityRole="radio"
              accessibilityState={{ checked: on, disabled: !can }}
              accessibilityLabel={`${s.t} ${slotSub(i, mode, m)}`}
              style={styles.cell}>
              <Hard x={on || !can ? 0 : 3} y={on || !can ? 0 : 3} radius={18} color={on || !can ? 'transparent' : Colors.ink}>
                <View style={StyleSheet.flatten([styles.time, on && styles.timeOn, !can && styles.timeOff])}>
                  {!can && <Stripes />}
                  <PText style={styles.timeT} color={can ? Colors.ink : '#8C8597'}>
                    {s.t}
                  </PText>
                  <PText style={styles.timeSub} color={can ? Colors.ink : '#8C8597'}>
                    {slotSub(i, mode, m)}
                  </PText>
                </View>
              </Hard>
            </Pressable>
          );
        })}
      </View>

      <PText style={styles.label}>② 언어</PText>
      <View style={styles.row4} accessibilityRole="radiogroup" accessibilityLabel="스터디 언어">
        {LANGS.map((l, i) => {
          const on = i === lang;
          return (
            <Pressable
              key={l.key}
              onPress={() => {
                sfx('tap');
                onLang(i);
              }}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              accessibilityLabel={l.ko}
              style={styles.cell}>
              <Hard x={on ? 0 : 3} y={on ? 0 : 3} radius={18} color={on ? 'transparent' : Colors.ink}>
                <View style={StyleSheet.flatten([styles.lang, { backgroundColor: on ? l.color : Colors.white }, on && styles.langOn, !ready && styles.langNeed])}>
                  <View style={StyleSheet.flatten([styles.glyph, { backgroundColor: on ? Colors.white : l.color }])}>
                    <PText style={styles.glyphText} color={on ? Colors.ink : l.ink}>
                      {l.g}
                    </PText>
                  </View>
                  <PText style={styles.langText} color={on ? l.ink : Colors.ink}>
                    {l.ko}
                  </PText>
                </View>
              </Hard>
            </Pressable>
          );
        })}
      </View>

      <SumRow label={checkin ? '③ 입구 QR 찍기' : '도착하면 QR만 찍으면 돼요'} value={sum} />
      <WideButton label={btn} icon={checkin ? QR_PATH : CHECK_PATH} disabled={!ready} onPress={onConfirm} style={styles.go} />
    </View>
  );
}

/** 못 고르는 시간 칩의 빗금 (repeating-linear-gradient(-45deg, #EFEAE0 0 6px, #F7F3EA 6px 12px)) */
function Stripes() {
  return (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <Pattern id="slotOff" width={12 * Math.SQRT2} height={12 * Math.SQRT2} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <Rect width={6 * Math.SQRT2} height={12 * Math.SQRT2} fill="#EFEAE0" />
          <Rect x={6 * Math.SQRT2} width={6 * Math.SQRT2} height={12 * Math.SQRT2} fill="#F7F3EA" />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#slotOff)" />
    </Svg>
  );
}

/* ───────── 출석 완료 (프로토타입 .done-view · .dn-*) ───────── */

const SPRING_CSS = cubicBezier(0.2, 0.9, 0.3, 1.3);
/** stamp .6초: 크게 기울어져 들어와서 쾅 찍혀요 */
const stampIn = css.keyframes({
  '0%': { opacity: 0, transform: [{ scale: 2.2 }, { rotate: '-24deg' }] },
  '60%': { opacity: 1, transform: [{ scale: 0.94 }, { rotate: '-9deg' }] },
  '100%': { opacity: 1, transform: [{ scale: 1 }, { rotate: '-8deg' }] },
});
/** jump .8초: 노랑 팔로가 아래에서 폴짝 */
const jumpIn = css.keyframes({
  '0%': { opacity: 0, transform: [{ translateY: 40 }, { scale: 0.8 }] },
  '60%': { opacity: 1, transform: [{ translateY: -12 }, { scale: 1 }] },
  '100%': { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }] },
});
// 한 번만 (--spring · 끝난 모양 그대로)
const once = css.create({
  stamp: { animationName: stampIn, animationDuration: '600ms', animationDelay: '150ms', animationTimingFunction: SPRING_CSS, animationFillMode: 'both' },
  hop: { animationName: jumpIn, animationDuration: '800ms', animationDelay: '450ms', animationTimingFunction: SPRING_CSS, animationFillMode: 'both' },
});

function DoneView({ summaryText, week, onClose }: { summaryText: string; week: number; onClose: () => void }) {
  const still = useReducedMotion();
  const d = nowDate();
  const date = `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, '0')}`;
  useEffect(() => {
    sfx('fanfare');
    haptic('success');
  }, []);
  return (
    <View style={styles.done} accessibilityLiveRegion="polite">
      <View style={styles.art} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Animated.View style={[styles.stamp, still ? { transform: [{ rotate: '-8deg' }] } : once.stamp]}>
          <View style={styles.stampRing} />
          <PText style={styles.stampSmall} color={Colors.purple}>
            PALLO
          </PText>
          <PText style={styles.stampBig} color={Colors.purple}>
            출석
          </PText>
          <PText style={styles.stampDate} color={Colors.purple}>
            {date}
          </PText>
        </Animated.View>
        <Animated.View style={[styles.hop, still ? null : once.hop]}>
          <Image source={require('@/assets/characters/c-upright-yellow-flip.png')} style={styles.hopImg} contentFit="contain" />
        </Animated.View>
      </View>
      <PText style={styles.doneTitle}>출석 완료!</PText>
      <PText style={styles.doneInfo}>{summaryText} 스터디</PText>
      <PText style={styles.doneMsg} color={Colors.inkSub}>
        오늘도 와줘서 반가워요. 즐겁게 말하고 와요!
      </PText>
      <View style={styles.reward}>
        <PText style={styles.rewardText}>
          출석 포인트{' '}
          <PText style={styles.rewardNum} color={Colors.purple}>
            +{ATTEND_POINTS}P
          </PText>
        </PText>
        <View style={styles.rewardLine} />
        <PText style={styles.rewardText}>
          이번 주{' '}
          <PText style={styles.rewardNum} color={Colors.purple}>
            {week}
          </PText>
          번째 출석
        </PText>
      </View>
      <WideButton label="좋아요, 다녀올게요" onPress={onClose} style={styles.doneBtn} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {},
  head: { marginTop: 18, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  headText: { flex: 1 },
  sub: { marginTop: 4, fontFamily: Font.body700, fontSize: 13, lineHeight: 18 },
  label: { marginTop: 18, fontFamily: Font.body900, fontSize: 14, lineHeight: 20 },
  row: { marginTop: 8, flexDirection: 'row', gap: 10 },
  row4: { marginTop: 8, flexDirection: 'row', gap: 8 },
  cell: { flex: 1 },
  time: { height: 72, paddingHorizontal: 14, justifyContent: 'center', borderRadius: 18, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, overflow: 'hidden' },
  timeOn: { backgroundColor: Colors.yellow, transform: [{ translateX: 3 }, { translateY: 3 }] },
  timeOff: { borderColor: '#C9C2B3' },
  timeT: { fontFamily: Font.display, fontSize: 19, lineHeight: 24 },
  timeSub: { marginTop: 3, fontFamily: Font.body700, fontSize: 12, lineHeight: 16 },
  lang: { height: 80, alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 18, borderWidth: 2, borderColor: Colors.ink },
  langOn: { transform: [{ translateX: 3 }, { translateY: 3 }] },
  langNeed: { borderStyle: 'dashed' },
  glyph: { width: 32, height: 32, borderRadius: 11, borderWidth: 2, borderColor: Colors.ink, alignItems: 'center', justifyContent: 'center' },
  glyphText: { fontFamily: Font.body900, fontSize: 13, lineHeight: 17 },
  langText: { fontFamily: Font.body900, fontSize: 13, lineHeight: 17 },
  go: { marginTop: 12, marginRight: 4 },
  done: { alignItems: 'center', paddingBottom: 6 },
  art: { width: 250, height: 150, marginTop: 4 },
  stamp: { position: 'absolute', left: 14, top: 8, width: 132, height: 132, borderRadius: 66, borderWidth: 4, borderColor: Colors.purple, backgroundColor: 'rgba(73,48,135,0.06)', alignItems: 'center', justifyContent: 'center' },
  stampRing: { position: 'absolute', top: 7, left: 7, right: 7, bottom: 7, borderRadius: 60, borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.purple, opacity: 0.7 },
  stampSmall: { fontFamily: Font.display, fontSize: 10, lineHeight: 13, letterSpacing: 2 },
  stampBig: { fontFamily: Font.body900, fontSize: 30, lineHeight: 33, letterSpacing: -1 },
  stampDate: { fontFamily: Font.display, fontSize: 11, lineHeight: 14 },
  hop: { position: 'absolute', right: 0, bottom: 4, width: 118, height: (118 * 306) / 480 },
  hopImg: { width: '100%', height: '100%' },
  doneTitle: { marginTop: 10, fontFamily: Font.body900, fontSize: 26, lineHeight: 34, letterSpacing: -0.6 },
  doneInfo: { marginTop: 6, fontFamily: Font.body800, fontSize: 15, lineHeight: 21 },
  doneMsg: { marginTop: 4, fontFamily: Font.body700, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  reward: { marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  rewardText: { paddingHorizontal: 14, fontFamily: Font.body800, fontSize: 13.5, lineHeight: 19 },
  rewardNum: { fontFamily: Font.display, fontSize: 13.5, lineHeight: 19 },
  rewardLine: { width: 2, alignSelf: 'stretch', backgroundColor: Colors.line },
  doneBtn: { marginTop: 22, alignSelf: 'stretch', marginRight: 4 },
});
