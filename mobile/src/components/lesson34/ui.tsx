import { Image } from 'expo-image';
import * as Tts from 'expo-speech';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { BookmarkIcon, CardsIcon, MicIcon, SpeakerIcon } from '@/components/lesson/icons';
import { Appear } from '@/components/ui/appear';
import { StudyButton } from '@/components/ui/study-button';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { haptic, sfx } from '@/lib/feedback';
import { useIsSaved, toggleExpression } from '@/state/expressions';

import type { Ask, Head } from './types';

/*
 * Lv.3 · 4 레슨 공용 조각 — 프로토타입 #lesson 의 .tk-* · .ls-* 모양 (마지막에 덮어쓴 CSS 값 기준).
 */
export const SUB = Colors.inkSub;
export const PINK_INK = '#C2416B';
export const LINE = '#D9D1BF';

export const IMG = {
  yellow: require('@/assets/characters/c-upright-yellow.png'),
  tilted: require('@/assets/characters/c-tilted-yellow.png'),
  purple: require('@/assets/characters/c-upright-purple.png'),
  purple3d: require('@/assets/characters/c-purple-standard-3d.png'),
} as const;
/** 교재 인물 그림 (프로토타입 PPL · assets/ppl) — 이름표 색 */
const PPL: Record<string, [number, string]> = {
  Logan: [require('@/assets/images/lesson34/logan.jpg'), '#2F4E8C'],
  Aiden: [require('@/assets/images/lesson34/aiden.jpg'), '#3F6B3A'],
};

/** 영어 읽어 주기 (소리 끄기면 안 읽어요) */
export function sayEn(text: string, soundOff: boolean, rate = 0.92, onDone?: () => void) {
  Tts.stop();
  if (soundOff || !text) {
    onDone?.();
    return;
  }
  Tts.speak(text, { language: 'en-US', rate, onDone, onStopped: undefined });
}

/** 듣기 단추 .ls-spk (32 · 흰 바탕 · 아래 그림자) — 소리 끄기면 숨겨요 */
export function Spk({ text, soundOff, label = '듣기', rate = 0.92 }: { text: string; soundOff: boolean; label?: string; rate?: number }) {
  if (soundOff) return null;
  return (
    <Pressable onPress={() => sayEn(text, false, rate)} accessibilityRole="button" accessibilityLabel={label} hitSlop={6} style={({ pressed }) => [s.round, pressed && s.roundOn]}>
      <SpeakerIcon size={15} />
    </Pressable>
  );
}

/** 표현함 저장 단추 (고친 문장 그대로 카드로) */
export function MarkBtn({ en, ko, source }: { en: string; ko: string; source: string }) {
  const on = useIsSaved(en);
  return (
    <Pressable
      onPress={() => {
        const now = toggleExpression({ en, ko, source });
        sfx(now ? 'save' : 'tap');
        haptic('select');
      }}
      accessibilityRole="button"
      accessibilityLabel="표현함에 저장"
      accessibilityState={{ selected: on }}
      hitSlop={6}
      style={({ pressed }) => [s.round, on && s.roundYellow, pressed && s.roundOn]}>
      <BookmarkIcon size={15} filled={on} />
    </Pressable>
  );
}

/** 위 작은 회색 안내 (#lsKick) */
export const Kicker = ({ text }: { text: string }) => (
  <PText style={s.kick} color={SUB} numberOfLines={1}>
    {text}
  </PText>
);

/** 문제 머리 .tk-head: 작은 회색 · 큰 디스플레이 글꼴 · 뜻 · 아래 점선 */
export function TkHead({ head }: { head: Head }) {
  return (
    <View style={s.head}>
      {head.k ? (
        <PText style={s.headK} color={SUB}>
          {head.k}
        </PText>
      ) : null}
      {head.p ? <PText style={s.headP}>{head.p}</PText> : null}
      {head.m ? (
        <PText style={s.headM} color={SUB}>
          {head.m}
        </PText>
      ) : null}
    </View>
  );
}

/** 캐릭터 · 인물이 묻는 말풍선 .ls-ask */
export function AskBubble({ ask, soundOff }: { ask: Ask; soundOff: boolean }) {
  return (
    <View style={s.ask}>
      {ask.who && PPL[ask.who] ? (
        <View style={s.pav}>
          <Image source={PPL[ask.who][0]} style={s.pavImg} contentFit="cover" contentPosition={{ top: '12%' }} />
          <PText style={s.pavT} color={PPL[ask.who][1]}>
            {ask.who}
          </PText>
        </View>
      ) : ask.who ? (
        <View style={StyleSheet.flatten([s.av, { backgroundColor: ask.c ?? Colors.sky }])}>
          <PText style={s.avT} color={Colors.white}>
            {ask.who[0]}
          </PText>
        </View>
      ) : (
        <Image source={IMG.purple3d} style={s.askChar} contentFit="contain" />
      )}
      <View style={s.bubWrap}>
        <View style={s.bub}>
          <PText style={s.bubEn}>{ask.en}</PText>
          {ask.ko ? (
            <PText style={s.bubKo} color={SUB}>
              {ask.ko}
            </PText>
          ) : null}
          <View style={s.bubSpk}>
            <Spk text={ask.en} soundOff={soundOff} />
          </View>
        </View>
        <View style={s.tail} />
      </View>
    </View>
  );
}

/** 카드 머리 .tk-cardh (왼쪽 회색 이름 · 오른쪽 도구) */
export const CardHead = ({ label, children }: { label: string; children?: ReactNode }) => (
  <View style={s.cardh}>
    <PText style={s.cardhT} color={SUB}>
      {label}
    </PText>
    <View style={s.tools}>{children}</View>
  </View>
);

/** 가운데 회색 안내 .tk-msg (굵은 분홍 부분은 **로 감싸요) */
export function Msg({ text, style }: { text: string; style?: StyleProp<ViewStyle> }) {
  if (!text) return null;
  return (
    <View style={style}>
      <PText style={s.msg} color={SUB}>
        <Rich text={text} boldColor={PINK_INK} />
      </PText>
    </View>
  );
}
/** '**굵게**' 조각을 나눠 그려요 */
export function Rich({ text, boldColor }: { text: string; boldColor?: string }) {
  return (
    <>
      {text.split(/\*\*/).map((part, i) =>
        i % 2 ? (
          <PText key={i} style={s.bold} color={boldColor ?? Colors.ink}>
            {part}
          </PText>
        ) : (
          part
        ),
      )}
    </>
  );
}

/** 별 3개 .tk-stars */
export const Stars = ({ n }: { n: number }) => (
  <View style={s.stars} accessibilityLabel={`별 ${n}개`}>
    {[0, 1, 2].map((i) => (
      <Appear key={i} kind="popIn" delay={150 + i * 150}>
        <Svg width={32} height={32} viewBox="0 0 24 24">
          <Path d="M12 2.6l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17.2l-5.9 3.2 1.3-6.5L2.5 9.4l6.6-.8z" fill={i < n ? Colors.yellow : '#E3DCCB'} stroke={Colors.ink} strokeWidth={1.4} strokeLinejoin="round" />
        </Svg>
      </Appear>
    ))}
  </View>
);

/** 키워드 줄 .st-chk (쓴 말은 노란 밑줄) */
export function ChkRow({ label, items, center }: { label?: string; items: { t: string; on?: boolean }[]; center?: boolean }) {
  return (
    <View style={StyleSheet.flatten([s.chk, center && s.center])}>
      {label ? (
        <PText style={s.chkT} color={SUB}>
          {label}
        </PText>
      ) : null}
      {items.map((x) => (
        <PText key={x.t} style={StyleSheet.flatten([s.chkT, x.on && s.chkOn])} color={x.on ? Colors.ink : '#9A93A6'}>
          {x.on ? `✓ ${x.t}` : x.t}
        </PText>
      ))}
    </View>
  );
}

/** 배경 글 .st-bg (왼쪽 회색 선) */
export const BgText = ({ text }: { text: string }) => (
  <PText style={s.bg} color={SUB}>
    {text}
  </PText>
);

/** 비교 칸 .st-cmp — before(점선) · after(노랑) */
export const CmpBox = ({ label, text, after }: { label: string; text: string; after?: boolean }) => (
  <View style={StyleSheet.flatten([s.cmp, after ? s.cmpAfter : s.cmpBefore])}>
    <PText style={s.cmpK} color={after ? Colors.ink : SUB}>
      {label}
    </PText>
    <PText style={s.cmpT} color={after ? Colors.ink : SUB}>
      {text}
    </PText>
  </View>
);

/** 체크 목록 카드 .st-used */
export function UsedList({ items, title }: { items: { l: string; on: boolean; sub?: ReactNode }[]; title?: string }) {
  return (
    <View style={s.used}>
      {title ? (
        <PText style={s.kick2} color={SUB}>
          {title}
        </PText>
      ) : null}
      {items.map((c, i) => (
        <View key={i} style={s.usedRow}>
          <View style={StyleSheet.flatten([s.usedI, c.on ? s.usedIOn : s.usedIOff])}>{c.on ? <Check size={12} /> : null}</View>
          <View style={s.flex}>
            <PText style={s.usedT} color={c.on ? Colors.ink : '#8C8597'}>
              {c.l}
            </PText>
            {c.sub}
          </View>
        </View>
      ))}
    </View>
  );
}

export const Check = ({ size = 14, color = Colors.ink }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M5 12.5l4.5 4.5L19 7.5" />
  </Svg>
);
export const XMark = ({ size = 14, color = Colors.ink }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={3.2} strokeLinecap="round">
    <Path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);

/** '말하기가 어려워요' 줄 .ns-row .ns-tg (켜면 분홍) */
export function NoSpeakToggle({ on, onPress }: { on: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="switch" accessibilityState={{ checked: on }} accessibilityLabel="말하기가 어려워요" style={StyleSheet.flatten([s.ns, on && s.nsOn])}>
      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={on ? Colors.white : 'rgba(30,26,43,0.62)'} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M9 5a3 3 0 0 1 6 0v6a3 3 0 0 1-5 2.2M5 11a7 7 0 0 0 11.5 5.4M12 18v3M19 11a7 7 0 0 1-.4 2.3M3 3l18 18" />
      </Svg>
      <PText style={s.nsT} color={on ? Colors.white : 'rgba(30,26,43,0.62)'}>
        말하기가 어려워요
      </PText>
    </Pressable>
  );
}

/** 답하는 방식 탭 .mode-tabs (말하기 · 쓰기) */
export function ModeTabs<K extends string>({ list, cur, onPick }: { list: [K, string][]; cur: K; onPick: (k: K) => void }) {
  return (
    <View style={s.tabs} accessibilityRole="tablist">
      {list.map(([k, l]) => {
        const on = k === cur;
        return (
          <Pressable key={k} onPress={() => onPick(k)} accessibilityRole="tab" accessibilityState={{ selected: on }} style={StyleSheet.flatten([s.tab, on && s.tabOn])}>
            {k === 'voice' ? <MicIcon size={16} color={on ? Colors.ink : SUB} /> : k === 'card' ? <CardsIcon size={16} color={on ? Colors.ink : SUB} /> : <KbdIcon color={on ? Colors.ink : SUB} />}
            <PText style={s.tabT} color={on ? Colors.ink : SUB}>
              {l}
            </PText>
          </Pressable>
        );
      })}
    </View>
  );
}
const KbdIcon = ({ color }: { color: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 7h18v10H3zM7 11h.01M11 11h.01M15 11h.01M8 14h8" />
  </Svg>
);

/** 넓은 말하기 키 .key.mk (보라 · 듣는 중이면 분홍 + 물결) */
export function MicKey({ label, live, on, combo, onPress }: { label: string; live: string; on: boolean; combo?: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={on ? live : label} accessibilityState={{ selected: on }}>
      {({ pressed }) => (
        <View style={StyleSheet.flatten([s.mk, on && s.mkOn, pressed && s.mkPressed])}>
          <MicIcon size={22} color={Colors.white} />
          <PText style={s.mkT} color={Colors.white}>
            {on ? live : label}
          </PText>
          {on ? <Wave /> : null}
          {combo ? (
            <PText style={s.mkCombo} color={on ? '#FDE7F0' : '#D9CDF3'}>
              {combo}
            </PText>
          ) : null}
        </View>
      )}
    </Pressable>
  );
}
const Wave = () => (
  <View style={s.wave}>
    {[6, 12, 18, 10, 20, 14, 8, 16, 11].map((h, i) => (
      <View key={i} style={{ width: 3, height: h, borderRadius: 2, backgroundColor: Colors.white }} />
    ))}
  </View>
);

/** 아래 띠의 결과 줄: 팔로(맞으면 노랑 · 아니면 보라) + 한 줄 (프로토타입 endFB) */
export function EndNote({ good, children }: { good: boolean; children: ReactNode }) {
  return (
    <View style={s.end} accessibilityLiveRegion="polite">
      <Appear kind="reactHop">
        <Image source={good ? IMG.yellow : IMG.purple} style={s.endImg} contentFit="contain" />
      </Appear>
      <View style={s.flex}>{children}</View>
    </View>
  );
}
export const EndMsg = ({ bold, rest }: { bold?: string; rest: string }) => (
  <PText style={s.endMsg}>
    {bold ? (
      <PText style={s.endBold} color={PINK_INK}>
        {bold}
        {'\n'}
      </PText>
    ) : null}
    {rest}
  </PText>
);

/** 아래 줄 단추: 테두리만(다시 하기 · 넘어가기) + 노랑 넓은 단추 */
export function FootRow({ children }: { children: ReactNode }) {
  return <View style={s.row}>{children}</View>;
}
export function SkipBtn({ label, onPress }: { label: string; onPress: () => void }) {
  return <StudyButton label={label} onPress={onPress} bg={Colors.white} small />;
}

/** 노랑 넓은 단추 — 모양은 학습 공용 StudyButton */
export function GoBtn({ label, onPress, disabled, color = Colors.yellow, compact }: { label: string; onPress: () => void; disabled?: boolean; color?: string; compact?: boolean }) {
  return <StudyButton label={label} onPress={onPress} disabled={disabled} bg={color} compact={compact} style={s.flex} />;
}

export const s = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  center: { justifyContent: 'center' },
  bold: { fontFamily: Font.body900 },
  round: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', boxShadow: `0px 3px 0px ${Colors.ink}` },
  roundOn: { transform: [{ translateY: 2 }], boxShadow: `0px 1px 0px ${Colors.ink}` },
  roundYellow: { backgroundColor: Colors.yellow },
  kick: { fontFamily: Font.body800, fontSize: 12, lineHeight: 17, paddingHorizontal: 20, marginTop: 20 },
  head: { paddingBottom: 14, borderBottomWidth: 2, borderStyle: 'dashed', borderColor: LINE },
  headK: { fontFamily: Font.body800, fontSize: 12, lineHeight: 17 },
  headP: { fontFamily: Font.display, fontSize: 23, lineHeight: 29.9, letterSpacing: -0.5, marginTop: 6 },
  headM: { fontFamily: Font.body800, fontSize: 13.5, lineHeight: 20, marginTop: 3 },
  ask: { flexDirection: 'row', alignItems: 'flex-end', gap: 20, marginTop: 6 },
  askChar: { width: 93, height: 63 },
  av: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  avT: { fontFamily: Font.body900, fontSize: 16, lineHeight: 20 },
  pav: { alignItems: 'center', gap: 2 },
  pavImg: { width: 72, height: 72, borderRadius: 36, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white },
  pavT: { fontFamily: Font.body900, fontSize: 12, lineHeight: 16 },
  bubWrap: { flex: 1, minWidth: 0, marginBottom: 28 },
  bub: { paddingVertical: 12, paddingLeft: 14, paddingRight: 52, borderWidth: 2, borderColor: Colors.ink, borderRadius: 20, backgroundColor: Colors.white, boxShadow: `3px 3px 0px ${Colors.ink}` },
  tail: { position: 'absolute', left: -8, bottom: 16, width: 14, height: 14, backgroundColor: Colors.white, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: Colors.ink, transform: [{ rotate: '45deg' }] },
  bubEn: { fontFamily: Font.body900, fontSize: 17, lineHeight: 23.8, letterSpacing: -0.2 },
  bubKo: { fontFamily: Font.body700, fontSize: 12.5, lineHeight: 18.1, marginTop: 6 },
  bubSpk: { position: 'absolute', top: 10, right: 10 },
  cardh: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, minHeight: 32 },
  cardhT: { fontFamily: Font.body800, fontSize: 12, lineHeight: 17, flexShrink: 1 },
  tools: { flexDirection: 'row', gap: 6 },
  msg: { fontFamily: Font.body800, fontSize: 13, lineHeight: 20.15, textAlign: 'center' },
  stars: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  chk: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 10, rowGap: 6 },
  chkT: { fontFamily: Font.body800, fontSize: 12, lineHeight: 17 },
  chkOn: { backgroundColor: 'transparent', textDecorationLine: 'underline', textDecorationColor: Colors.yellow },
  bg: { fontFamily: Font.body600, fontSize: 13, lineHeight: 20.8, paddingLeft: 10, borderLeftWidth: 3, borderColor: Colors.line },
  cmp: { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16 },
  cmpBefore: { borderWidth: 2, borderStyle: 'dashed', borderColor: '#B9B2A3' },
  cmpAfter: { borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.yellow, boxShadow: `3px 3px 0px ${Colors.ink}` },
  cmpK: { fontFamily: Font.display, fontSize: 10, lineHeight: 14, letterSpacing: 0.3, marginBottom: 3 },
  cmpT: { fontFamily: Font.body700, fontSize: 14.5, lineHeight: 22.5 },
  used: { padding: 14, paddingHorizontal: 16, gap: 8, borderWidth: 2, borderColor: Colors.ink, borderRadius: 22, backgroundColor: Colors.white, boxShadow: `4px 4px 0px ${Colors.ink}` },
  kick2: { fontFamily: Font.body900, fontSize: 12, lineHeight: 17 },
  usedRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  usedI: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  usedIOn: { borderColor: Colors.ink, backgroundColor: Colors.yellow },
  usedIOff: { borderColor: '#B9B2A3' },
  usedT: { fontFamily: Font.body800, fontSize: 14, lineHeight: 20 },
  ns: { height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.42)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8 },
  nsOn: { backgroundColor: 'rgba(208,121,142,0.85)' },
  nsT: { fontFamily: Font.body800, fontSize: 12.5, lineHeight: 18 },
  tabs: { flexDirection: 'row', gap: 6, padding: 4, borderRadius: 16, backgroundColor: '#EFE9DC', marginBottom: 10 },
  tab: { flex: 1, height: 38, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  tabOn: { backgroundColor: Colors.white, boxShadow: '0px 2px 0px #D8CFBE' },
  tabT: { fontFamily: Font.body900, fontSize: 13.5, lineHeight: 18 },
  mk: { height: 48, borderRadius: 24, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.purple, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 16, boxShadow: `0px 4px 0px ${Colors.ink}`, marginBottom: 6 },
  mkOn: { backgroundColor: Colors.rosePink },
  mkPressed: { transform: [{ translateY: 3 }], boxShadow: `0px 1px 0px ${Colors.ink}` },
  mkT: { fontFamily: Font.body900, fontSize: 15.5, lineHeight: 22 },
  mkCombo: { fontFamily: Font.display, fontSize: 12, lineHeight: 16, marginLeft: 'auto' },
  wave: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  end: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, paddingTop: 8, marginBottom: 12 },
  endImg: { width: 88, height: 82 },
  endMsg: { fontFamily: Font.body800, fontSize: 15, lineHeight: 21.75 },
  endBold: { fontFamily: Font.display, fontSize: 22, lineHeight: 26.4, letterSpacing: -0.4 },
  row: { flexDirection: 'row', gap: 10 },
});
