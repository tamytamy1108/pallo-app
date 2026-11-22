import * as Tts from 'expo-speech';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Pressable } from '@/components/ui/pressable';
import { SpeakerIcon } from '@/components/lesson/icons';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import type { Lv3Unit } from '@/data/lessons34';
import { haptic, sfx } from '@/lib/feedback';
import { stepKey } from '@/state/progress';

import type { StepCtx } from '../finish';
import { answers, setAfter, setAns, useAnswers } from '../store';
import { sentences, words } from '../text';
import { CmpBox, GoBtn, sayEn, Spk, SUB } from '../ui';
import { Intro, PCard, PFoot, Stats, Tool } from './common';
import type { PageApi } from './study-shell';

type P = { ctx: StepCtx; D: Lv3Unit; api: PageApi };

/** 예습 ② TOPIC 지문 읽기 (프로토타입 STEP_VIEW.tread · 말하지 않아요 · 듣고 읽기만) */
export function TopicRead({ D, api }: P) {
  const T = D.topic;
  const [noKo, setNoKo] = useState(false);
  const [now, setNow] = useState<number | null>(null);
  const tok = useRef(0);
  useEffect(
    () => () => {
      tok.current += 1;
      Tts.stop();
    },
    [],
  );
  // 전체 듣기: 줄마다 차례로 읽고 지금 줄을 표시해요 (한 번 더 누르면 멈춰요)
  const playAll = () => {
    if (now != null) {
      tok.current += 1;
      Tts.stop();
      setNow(null);
      return;
    }
    const my = (tok.current += 1);
    const step = (i: number) => {
      if (tok.current !== my) return;
      if (i >= T.lines.length) {
        setNow(null);
        return;
      }
      setNow(i);
      sayEn(T.lines[i][0], api.soundOff, 0.92, () => {
        setTimeout(() => step(i + 1), 250);
      });
    };
    step(0);
  };
  const hl = new RegExp(`(${T.expr.map(([x]) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/'/g, "['’]")).join('|')})`, 'i');
  return (
    <>
      <ScrollView style={st.flex} contentContainerStyle={st.body} showsVerticalScrollIndicator={false}>
        <View style={st.sit}>
          <PText style={st.sitK}>TOPIC</PText>
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
        <GoBtn label="다 읽었어요" onPress={() => api.finish()} />
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
  return (
    <>
      <ScrollView style={st.flex} contentContainerStyle={st.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Intro text={none ? '예습 답변이 없어요. 지금 답해도 돼요. 다음엔 예습부터 하면 성장을 비교할 수 있어요.' : '예습 때 했던 같은 질문에 다시 답해요. 수업에서 배운 표현을 넣어 보세요.'} />
        {idx.map((i) => (
          <PCard key={i} style={st.baQ}>
            <View style={st.baH}>
              <PText style={st.qnBig}>{`Q${i + 1}`}</PText>
              <Spk text={qs[i].en} soundOff={api.soundOff} />
            </View>
            <PText style={st.qb}>{qs[i].en}</PText>
            {before[i] ? <CmpBox label="BEFORE · 예습 때" text={before[i] ?? ''} /> : null}
            <TextInput value={after[i] ?? ''} onChangeText={(v) => write(i, v)} multiline placeholder="지금 다시 답해 보세요" placeholderTextColor="#B9B2A3" style={st.ta} accessibilityLabel={`Q${i + 1} 다시 답하기`} />
          </PCard>
        ))}
        {!out ? <GoBtn label="비교하기" onPress={compare} /> : null}
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
              <View key={i} style={st.cmp}>
                <CmpBox label="BEFORE" text={before[i] || '(예습 답변 없음)'} />
                <CmpBox label="AFTER" text={out.a[i]} after />
              </View>
            ))}
            <Intro
              text={`${words(view.all) > words(view.old) ? '답이 더 길고 구체적이 됐어요! ' : ''}${view.used.length ? `쓴 키워드: ${view.used.join(', ')}` : '다음엔 키워드를 하나 넣어 말해 봐요.'}${view.sAvg >= 3 ? ' · 선택 + 이유 + 예시 기준을 채웠어요.' : ' · 이유와 예시를 붙여 3문장을 채워 봐요.'}`}
            />
          </>
        ) : null}
      </ScrollView>
      {out ? (
        <PFoot>
          <GoBtn label="완료하기" onPress={() => api.finish()} />
        </PFoot>
      ) : null}
    </>
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
  line: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 9, borderRadius: 14 },
  lineTop: { borderTopWidth: 1, borderColor: Colors.line },
  lineNow: { backgroundColor: '#FFF6BF' },
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
  cmp: { gap: 8 },
});
