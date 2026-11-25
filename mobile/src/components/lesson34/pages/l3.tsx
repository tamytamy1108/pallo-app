import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View, type ScrollViewInstance } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { GrowInput } from '@/components/ui/grow-input';
import { Pressable } from '@/components/ui/pressable';
import { SpeakerIcon } from '@/components/lesson/icons';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import type { Lv3Unit } from '@/data/lessons34';
import { haptic, sfx } from '@/lib/feedback';
import { stepKey } from '@/state/progress';
import { readLines, stopSpeaking } from '@/lib/tts';

import type { StepCtx } from '../finish';
import { answers, setAfter, setAns, useAnswers } from '../store';
import { sentences, words } from '../text';
import { CmpBox, GoBtn, sayEn, Spk, SUB } from '../ui';
import { Intro, PCard, PFoot, Stats, Tool } from './common';
import type { PageApi } from './study-shell';

type P = { ctx: StepCtx; D: Lv3Unit; api: PageApi };

/** 읽기 속도 [이름, 말 빠르기] */
const SPEEDS: [string, number][] = [
  ['느리게', 0.7],
  ['보통', 0.92],
  ['빠르게', 1.15],
];

/** 예습 ② JOURNAL 지문 읽기 (프로토타입 STEP_VIEW.tread · 말하지 않아요 · 듣고 읽기만) */
export function TopicRead({ D, api }: P) {
  const T = D.topic;
  const [noKo, setNoKo] = useState(false);
  // 읽기 속도: 느리게 · 보통 · 빠르게 (누를 때마다 바뀌어요 · 다음 줄부터 적용)
  const [speed, setSpeed] = useState(1);
  const speedRef = useRef(1);
  const [now, setNow] = useState<number | null>(null);
  // 전체 듣기를 멈추는 함수 (듣는 중일 때만)
  const cancel = useRef<(() => void) | null>(null);
  useEffect(() => () => cancel.current?.(), []);
  // 전체 듣기: 줄마다 차례로 읽고 지금 줄을 표시해요 (한 번 더 누르면 멈춰요).
  // 줄 옆 듣기 단추 · 소리 끄기 · 다음으로 가면 거기서 멈춰요 (lib/tts readLines)
  const playAll = () => {
    if (cancel.current) {
      cancel.current();
      return;
    }
    cancel.current = readLines(
      T.lines.map(([en]) => en),
      {
        rate: () => SPEEDS[speedRef.current][1],
        onLine: setNow,
        onFinish: () => {
          cancel.current = null;
          setNow(null);
        },
      },
    );
  };
  const hl = new RegExp(`(${T.expr.map(([x]) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/'/g, "['’]")).join('|')})`, 'i');
  return (
    <>
      <ScrollView style={st.flex} contentContainerStyle={st.body} showsVerticalScrollIndicator={false}>
        <View style={st.sit}>
          <PText style={st.sitK}>JOURNAL</PText>
          <PText style={st.sitB}>{T.title}</PText>
          <PText style={st.sitS}>천천히 듣고 읽어요 · 표현 6개가 나와요</PText>
        </View>
        <View style={st.tools}>
          {!api.soundOff ? (
            <Tool
              label="전체 듣기"
              on={now != null}
              onPress={playAll}
              icon={
                <Svg width={12} height={12} viewBox="0 0 24 24">
                  <Path d="M6 4l14 8-14 8z" fill={Colors.ink} />
                </Svg>
              }
            />
          ) : null}
          <Tool label="한국어" on={!noKo} onPress={() => setNoKo((v) => !v)} />
          {!api.soundOff ? (
            <Tool
              label={`속도 · ${SPEEDS[speed][0]}`}
              on={speed !== 1}
              onPress={() => {
                const n = (speed + 1) % SPEEDS.length;
                speedRef.current = n;
                setSpeed(n);
              }}
            />
          ) : null}
        </View>
        <PCard style={st.read}>
          {T.lines.map(([e, k], i) => (
            <View key={i} style={StyleSheet.flatten([st.line, i > 0 && st.lineTop, now === i && st.lineNow])}>
              <View style={st.flex}>
                <PText style={st.e}>
                  {e.split(hl).map((part, j) =>
                    j % 2 ? (
                      <PText key={j} style={StyleSheet.flatten([st.e, st.hl])}>
                        {part}
                      </PText>
                    ) : (
                      part
                    ),
                  )}
                </PText>
                {!noKo ? (
                  <PText style={st.k} color={SUB}>
                    {k}
                  </PText>
                ) : null}
              </View>
              {!api.soundOff ? (
                <Pressable onPress={() => sayEn(e, false, 0.92)} accessibilityRole="button" accessibilityLabel="듣기" style={st.sq}>
                  <SpeakerIcon size={15} />
                </Pressable>
              ) : null}
            </View>
          ))}
        </PCard>
      </ScrollView>
      <PFoot>
        <GoBtn
          label="다 읽었어요"
          onPress={() => {
            // 전체 듣기 중이면 소리부터 멈춰요 (축하 화면 위로 계속 읽지 않게)
            cancel.current?.();
            stopSpeaking();
            api.finish();
          }}
        />
      </PFoot>
    </>
  );
}

/** 예습 ④ 오늘의 질문 미리 보기: 6개 훑고 말하고 싶은 3개에 별표 (프로토타입 STEP_VIEW.pick6) — 별표는 본학습 AI 대화 순서가 돼요 */
export function Pick6({ ctx, D, api }: P) {
  const key = stepKey(ctx.lv, ctx.unit, 'pick6');
  const sel = ((useAnswers().ans[key]?.[0] as number[] | undefined) ?? []).filter((i) => i != null);
  const tap = (i: number) => {
    if (sel.includes(i)) setAns(key, [sel.filter((x) => x !== i)]);
    else if (sel.length >= 3) {
      showToast('3개까지 골라요 · 하나를 빼고 골라 주세요');
      return;
    } else setAns(key, [[...sel, i]]);
    sfx('tap');
    haptic('select');
  };
  return (
    <>
      <ScrollView style={st.flex} contentContainerStyle={st.body} showsVerticalScrollIndicator={false}>
        <Intro text="본학습에서 AI와 이야기할 질문이에요. 끌리는 질문 3개에 별표해요. 답은 아직 안 해도 돼요." />
        {D.daily.map((q, i) => {
          const on = sel.includes(i);
          return (
            <Pressable key={i} onPress={() => tap(i)} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={q.en}>
              <PCard style={StyleSheet.flatten([st.q, on && st.qOn])}>
                <View style={StyleSheet.flatten([st.star, on && st.starOn])}>
                  <PText style={st.starT}>{on ? '★' : '☆'}</PText>
                </View>
                <View style={st.flex}>
                  <PText style={st.qn} color={SUB}>{`Q${i + 1}`}</PText>
                  <PText style={st.qb}>{q.en}</PText>
                  <PText style={st.qe} color={SUB}>
                    {q.ko}
                  </PText>
                  <View style={st.kws}>
                    {q.kw.map((k) => (
                      <PText key={k} style={st.kw} color={Colors.purple}>
                        {D.keywords[k][0]}
                      </PText>
                    ))}
                  </View>
                </View>
              </PCard>
            </Pressable>
          );
        })}
      </ScrollView>
      <PFoot>
        <GoBtn label={sel.length === 3 ? '별표 3개로 준비 끝' : `별표 ${sel.length}/3`} disabled={sel.length !== 3} onPress={() => api.finish()} />
      </PFoot>
    </>
  );
}

/** 복습 Before / After: AI 대화 때 답 ↔ 지금 답 (단어 수 · 키워드 · 문장 / 답) — 프로토타입 STEP_VIEW.ba */
export function BeforeAfter({ ctx, D, api }: P) {
  const fromKey = stepKey(ctx.lv, ctx.unit, 'dtalk');
  const meKey = stepKey(ctx.lv, ctx.unit, 'ba');
  const qs = D.daily;
  const [before] = useState(() => (answers().ans[fromKey] ?? []) as (string | undefined)[]);
  const [idx] = useState(() => {
    const has = qs.map((_, i) => i).filter((i) => before[i]);
    return has.length ? has : [0, 1];
  });
  const none = !qs.some((_, i) => before[i]);
  const [after, setAfterLocal] = useState<string[]>(() => {
    const a = answers().after[meKey];
    return Array.isArray(a) ? a : [];
  });
  const [out, setOut] = useState<null | { a: string[] }>(null);
  const write = (i: number, v: string) => {
    const a = [...after];
    a[i] = v;
    setAfterLocal(a);
    setAfter(meKey, a);
  };
  const compare = () => {
    if (!idx.some((i) => after[i]?.trim())) {
      showToast('한 문장이라도 다시 답해 주세요');
      return;
    }
    sfx('tap');
    setOut({ a: after.map((x) => x?.trim() ?? '') });
  };
  const view = (() => {
    if (!out) return null;
    const a = out.a;
    const all = idx.map((i) => a[i] || '').join(' ');
    const old = idx.map((i) => before[i] || '').join(' ');
    const used = D.keywords.filter(([w]) => all.toLowerCase().includes(w.split(' ')[0])).map((k) => k[0]);
    const filled = idx.filter((i) => a[i]);
    const sAvg = Math.round(filled.reduce((n, i) => n + sentences(a[i]), 0) / Math.max(1, filled.length));
    return { all, old, used, filled, sAvg };
  })();
  // 비교하기를 누르면 아래에 생긴 결과로 스르르 내려가요 (안 내리면 생긴 줄 몰라요)
  const baScroll = useRef<ScrollViewInstance>(null);
  useEffect(() => {
    if (!out) return;
    const tm = setTimeout(() => baScroll.current?.scrollToEnd({ animated: true }), 120);
    return () => clearTimeout(tm);
  }, [out]);
  return (
    <>
      <ScrollView ref={baScroll} style={st.flex} contentContainerStyle={st.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Intro text={none ? '예습 답변이 없어요. 지금 답해도 돼요. 다음엔 예습부터 하면 성장을 비교할 수 있어요.' : '예습 때 했던 같은 질문에 다시 답해요. 수업에서 배운 표현을 넣어 보세요.'} />
        {idx.map((i) => (
          <PCard key={i} style={st.baQ}>
            <View style={st.baH}>
              <PText style={st.qnBig}>{`Q${i + 1}`}</PText>
              <Spk text={qs[i].en} soundOff={api.soundOff} />
            </View>
            <PText style={st.qb}>{qs[i].en}</PText>
            {before[i] ? <CmpBox label="BEFORE · 예습 때" text={before[i] ?? ''} /> : null}
            <GrowInput value={after[i] ?? ''} onChangeText={(v) => write(i, v)} multiline placeholder="지금 다시 답해 보세요" placeholderTextColor="#B9B2A3" style={st.ta} accessibilityLabel={`Q${i + 1} 다시 답하기`} />
          </PCard>
        ))}
        {out && view ? (
          <>
            <Stats
              items={[
                [`${words(view.old)}→${words(view.all)}`, '단어 수'],
                [String(view.used.length), '키워드'],
                [String(view.sAvg), '문장 / 답'],
              ]}
            />
            {view.filled.map((i) => (
              <View key={i} style={st.cmpOne}>
                <CmpBox label="BEFORE" text={before[i] || '(예습 답변 없음)'} />
                <CmpBox label="AFTER" text={out.a[i]} after />
              </View>
            ))}
            <BaNext longer={words(view.all) > words(view.old)} used={view.used} sAvg={view.sAvg} />
          </>
        ) : null}
      </ScrollView>
      <PFoot>{out ? <GoBtn label="완료하기" onPress={() => api.finish()} /> : <GoBtn label="비교하기" onPress={compare} />}</PFoot>
    </>
  );
}

/** 비교 아래 한 줄: 쓴 키워드 · 다음엔 (프로토타입 .ba-next) */
function BaNext({ longer, used, sAvg }: { longer: boolean; used: string[]; sAvg: number }) {
  const tips = [used.length ? '' : '키워드 하나 넣기', sAvg < 3 ? '이유 · 예시로 3문장' : ''].filter(Boolean);
  return (
    <PText style={st.next} color={SUB}>
      {longer ? '답이 더 길어졌어요! ' : ''}
      {used.length ? (
        <>
          {'쓴 키워드 '}
          <PText style={st.nextB}>{used.join(', ')}</PText>
        </>
      ) : null}
      {tips.length ? (
        <>
          {used.length ? ' · ' : ''}
          <PText style={st.nextB}>다음엔</PText>
          {` ${tips.join(' · ')}`}
        </>
      ) : null}
    </PText>
  );
}

const st = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  body: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 20, gap: 10 },
  sit: { padding: 18, gap: 6, borderWidth: 2, borderColor: Colors.ink, borderRadius: 22, backgroundColor: '#F2C79E', boxShadow: `4px 4px 0px ${Colors.ink}` },
  sitK: { fontFamily: Font.display, fontSize: 10.5, lineHeight: 13 },
  sitB: { fontFamily: Font.body900, fontSize: 19, lineHeight: 27.55, letterSpacing: -0.3 },
  sitS: { fontFamily: Font.body700, fontSize: 13, lineHeight: 19 },
  tools: { flexDirection: 'row', gap: 8 },
  read: { paddingVertical: 6, paddingHorizontal: 14 },
  line: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 11, paddingHorizontal: 12, marginHorizontal: -6 },
  lineTop: { borderTopWidth: 1, borderColor: Colors.line },
  lineNow: { backgroundColor: '#FFF6BF', borderRadius: 14, borderTopColor: 'transparent' },
  e: { fontFamily: Font.body700, fontSize: 15, lineHeight: 23.25 },
  hl: { backgroundColor: Colors.yellow },
  k: { fontFamily: Font.body700, fontSize: 12.5, lineHeight: 18.75, marginTop: 2 },
  sq: { width: 36, height: 36, borderRadius: 12, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  q: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14 },
  qOn: { backgroundColor: '#FFF6BF' },
  star: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  starOn: { backgroundColor: Colors.yellow },
  starT: { fontFamily: Font.body900, fontSize: 15, lineHeight: 20 },
  qn: { fontFamily: Font.body900, fontSize: 11.5, lineHeight: 16 },
  qnBig: { fontFamily: Font.display, fontSize: 12, lineHeight: 16 },
  qb: { fontFamily: Font.body900, fontSize: 15, lineHeight: 21.75 },
  qe: { fontFamily: Font.body700, fontSize: 12.5, lineHeight: 18.75, marginTop: 3 },
  kws: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  kw: { fontFamily: Font.body800, fontSize: 12, lineHeight: 17 },
  baQ: { padding: 14, gap: 8 },
  baH: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ta: { minHeight: 90, borderWidth: 2, borderColor: Colors.ink, borderRadius: 16, backgroundColor: Colors.cream, paddingHorizontal: 14, paddingVertical: 12, fontFamily: Font.body500, fontSize: 15, lineHeight: 22.5, color: Colors.ink, textAlignVertical: 'top' },
  cmpOne: { gap: 10, marginTop: 8 },
  next: { fontFamily: Font.body700, fontSize: 13.5, lineHeight: 20, textAlign: 'center', marginTop: 4 },
  nextB: { fontFamily: Font.body900, fontSize: 13.5, lineHeight: 20, color: Colors.ink },
});
