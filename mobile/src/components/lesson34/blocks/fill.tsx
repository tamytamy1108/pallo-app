import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import { Appear } from '@/components/ui/appear';
import { Pressable } from '@/components/ui/pressable';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { haptic, sfx } from '@/lib/feedback';
import { shuffled } from '@/lib/words';

import { Body, Foot, useRunner } from '../frame';
import { TopPart } from '../parts';
import type { FillTask } from '../types';
import { EndMsg, EndNote, FootRow, GoBtn, LINE, MarkBtn, PINK_INK, Spk, Stars, SUB, sayEn } from '../ui';

type Ph = 'fill' | 'retry' | 'done';
/** 칸 상태: 맞음(초록 · 잠김) · 틀림(분홍 · 흔들림) · 다시 채울 칸(분홍 점선) · 정답 보여 줌 */
type Mark = 'ok' | 'bad' | 'again' | 'shown' | undefined;

const BLANK = '___';
const GREEN = '#2E9E5B';
const GREEN_BG = '#DDF3E2';
const PINK = '#D83A56';
const PINK_BG = '#FBD5DC';

/**
 * JOURNAL 빈칸 채우기: 써 둔 일기 문장마다 빈칸 하나 · 아래 단어 칩을 눌러 넣어요.
 * 칩 → 고른 칸(없으면 첫 빈칸) · 채운 칸을 누르면 칩이 돌아가요.
 * 확인: 맞은 칸 초록 · 틀린 칸 분홍으로 흔들리고 칩이 돌아가요 → 한 번 더 → 그래도 틀리면 정답을 보여 줘요.
 */
export function FillBlock({ task: t }: { task: FillTask }) {
  const rt = useRunner();
  const N = t.lines.length;
  // 칩 순서는 문장 순서와 다르게 한 번 섞어요
  const [order] = useState(() => shuffled(N));
  const bank = order.map((k) => t.lines[k][1]);
  /** 칸마다 넣은 칩 번호 (bank 기준) */
  const [put, setPut] = useState<(number | null)[]>(() => Array(N).fill(null));
  const [marks, setMarks] = useState<Mark[]>(() => Array(N).fill(undefined));
  const [sel, setSel] = useState<number | null>(null);
  const [ph, setPh] = useState<Ph>('fill');
  const [shake, setShake] = useState(0);
  const [firstOk, setFirstOk] = useState(0);
  /** 틀린 칩이 돌아가는 동안 잠깐 막아요 */
  const [busy, setBusy] = useState(false);

  const full = put.every((p) => p != null);
  const text = t.lines.map(([en, ans]) => en.replace(BLANK, ans)).join(' ');
  const allFirst = firstOk === N;
  const stars = ph !== 'done' ? 0 : allFirst ? 3 : marks.every((m) => m === 'ok') ? 2 : 1;

  useEffect(() => {
    if (ph !== 'done') return;
    rt.mark(allFirst);
    rt.log({ k: t.kick, v: text, ok: allFirst });
    t.done?.(text, allFirst);
    sfx(stars >= 2 ? 'correct' : 'soft');
    const tm = setTimeout(() => sayEn(text, rt.soundOff, 0.92), 500);
    return () => clearTimeout(tm);
    // 끝났을 때 한 번만
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ph]);

  const locked = (i: number) => ph === 'done' || busy || marks[i] === 'ok';

  const tapChip = (b: number) => {
    if (ph === 'done' || busy || put.includes(b)) return;
    const open = (i: number) => put[i] == null && marks[i] !== 'ok';
    const to = sel != null && open(sel) ? sel : put.findIndex((_, i) => open(i));
    if (to < 0) return;
    const next = put.slice();
    next[to] = b;
    setPut(next);
    // 다음 빈칸으로 고른 칸을 옮겨요
    const after = next.findIndex((p, i) => p == null && marks[i] !== 'ok');
    setSel(after >= 0 ? after : null);
    sfx('card');
    haptic('select');
  };

  const tapSlot = (i: number) => {
    if (locked(i)) return;
    if (put[i] != null) {
      const next = put.slice();
      next[i] = null;
      setPut(next);
      setSel(i);
      sfx('back');
      return;
    }
    setSel(sel === i ? null : i);
    sfx('tap');
  };

  const check = () => {
    const ok = put.map((b, i) => b != null && bank[b] === t.lines[i][1]);
    const nOk = ok.filter(Boolean).length;
    if (ph === 'fill') setFirstOk(nOk);
    if (nOk === N) {
      setMarks(ok.map(() => 'ok'));
      setPh('done');
      return;
    }
    if (ph === 'retry') {
      // 두 번째도 틀린 칸은 정답으로 채워 보여 줘요
      setMarks(ok.map((y) => (y ? 'ok' : 'shown')));
      setPut(t.lines.map(([, ans]) => order.findIndex((k) => t.lines[k][1] === ans)));
      setPh('done');
      return;
    }
    // 처음 틀림: 분홍으로 흔들고 → 칩을 돌려보내요
    setMarks(ok.map((y) => (y ? 'ok' : 'bad')));
    setShake((n) => n + 1);
    setBusy(true);
    setPh('retry');
    sfx('wrong');
    haptic('warning');
    setTimeout(() => {
      setPut((p) => p.map((b, i) => (ok[i] ? b : null)));
      setMarks(ok.map((y) => (y ? 'ok' : 'again')));
      setSel(ok.findIndex((y) => !y));
      setBusy(false);
    }, 750);
  };

  const doneMsg = allFirst ? '완벽해요! 일기가 완성됐어요' : stars === 2 ? '잘했어요! 다시 해서 다 맞혔어요' : '괜찮아요! 정답으로 채웠어요';

  return (
    <>
      {/* 다시 채울 때 · 끝났을 때 아래(단어 칩 · 결과)까지 내려가요 */}
      <Body toEnd={ph === 'fill' ? undefined : ph}>
        <TopPart head={t.head} soundOff={rt.soundOff} />
        {ph === 'done' ? (
          <Appear kind="tkRise" style={styles.res}>
            <Stars n={stars} />
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <PText style={styles.date} color={SUB}>
                  {`JOURNAL · ${t.date}`}
                </PText>
                <View style={styles.tools}>
                  <Spk text={text} soundOff={rt.soundOff} label="일기 듣기" />
                  <MarkBtn en={text} ko={`JOURNAL · ${t.date}`} source={`${rt.source} · JOURNAL`} />
                </View>
              </View>
              <PText style={styles.para}>
                {t.lines.map(([en, ans], i) => {
                  const [a, b] = en.split(BLANK);
                  return (
                    <PText key={i}>
                      {a}
                      <PText style={StyleSheet.flatten([styles.hl, marks[i] === 'shown' && styles.hlShown])}>{ans}</PText>
                      {b}
                      {i < N - 1 ? ' ' : ''}
                    </PText>
                  );
                })}
              </PText>
            </View>
          </Appear>
        ) : (
          <>
            <View style={styles.card}>
              {t.lines.map(([en, , ko], i) => (
                <Line key={i} en={en} ko={ko} word={put[i] != null ? bank[put[i] ?? 0] : undefined} mark={marks[i]} sel={sel === i && put[i] == null} shake={marks[i] === 'bad' ? shake : 0} onPress={() => tapSlot(i)} />
              ))}
            </View>
          </>
        )}
      </Body>
      <Foot>
        {ph === 'done' ? (
          <EndNote good={stars >= 2}>
            <EndMsg rest={doneMsg} good={stars >= 2} />
          </EndNote>
        ) : ph === 'retry' ? (
          <EndNote good={false}>
            <EndMsg rest="아쉬워요! 분홍 칸만 한 번 더" />
          </EndNote>
        ) : null}
        {/* 넣어 볼 단어: 빈칸을 채우는 동안 늘 보이게 아래 고정 칸에 */}
        {ph !== 'done' ? (
        <View style={styles.bankWrap}>
          <PText style={styles.bankT} color={SUB}>
            넣어 볼 단어
          </PText>
          <View style={styles.bank}>
            {bank.map((w, b) =>
              put.includes(b) ? (
                <View key={`${b}:off`} style={styles.chipOff}>
                  <PText style={styles.chipT} color="transparent">
                    {w}
                  </PText>
                </View>
              ) : (
                <Appear key={`${b}:on`} kind="popIn">
                  <Pressable onPress={() => tapChip(b)} disabled={busy} accessibilityRole="button" accessibilityLabel={`${w} 넣기`} hitSlop={4}>
                    {({ pressed }) => (
                      <View style={StyleSheet.flatten([styles.chip, pressed && styles.pressed])}>
                        <PText style={styles.chipT}>{w}</PText>
                      </View>
                    )}
                  </Pressable>
                </Appear>
              ),
            )}
          </View>
        </View>
        ) : null}
        <FootRow>{ph === 'done' ? <GoBtn label={rt.goLabel} onPress={rt.next} /> : <GoBtn label="확인" disabled={!full || busy} onPress={check} />}</FootRow>
      </Foot>
    </>
  );
}

/** 문장 한 줄: 낱말 + 빈칸(눌러요) · 아래 뜻 */
function Line({ en, ko, word, mark, sel, shake, onPress }: { en: string; ko: string; word?: string; mark: Mark; sel: boolean; shake: number; onPress: () => void }) {
  const [a, b] = en.split(BLANK);
  const pre = a.split(' ').filter(Boolean);
  const post = b.split(' ').filter(Boolean);
  // 빈칸 바로 뒤 마침표 · 쉼표는 칸에 붙여요
  const tail = post[0] && /^[.,!?]/.test(post[0]) ? post.shift() : undefined;
  return (
    <View style={styles.line}>
      <View style={styles.words}>
        {pre.map((w, k) => (
          <PText key={`a${k}`} style={styles.w}>
            {w}
          </PText>
        ))}
        <View style={styles.slotRow}>
          <Slot word={word} mark={mark} sel={sel} shake={shake} onPress={onPress} />
          {tail ? <PText style={styles.w}>{tail}</PText> : null}
        </View>
        {post.map((w, k) => (
          <PText key={`b${k}`} style={styles.w}>
            {w}
          </PText>
        ))}
      </View>
      <PText style={styles.ko} color={SUB}>
        {ko}
      </PText>
    </View>
  );
}

function Slot({ word, mark, sel, shake, onPress }: { word?: string; mark: Mark; sel: boolean; shake: number; onPress: () => void }) {
  const x = useSharedValue(0);
  useEffect(() => {
    if (!shake) return;
    x.set(withSequence(withTiming(-6, { duration: 70 }), withTiming(6, { duration: 90 }), withTiming(-4, { duration: 80 }), withTiming(0, { duration: 70 })));
  }, [shake, x]);
  const anim = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));
  const filled = word != null;
  const label = filled ? `${word} · 눌러서 빼기` : '빈칸';
  return (
    <Pressable onPress={onPress} disabled={mark === 'ok'} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: sel }} hitSlop={4}>
      <Animated.View
        style={[
          styles.slot,
          filled && styles.slotOn,
          sel && styles.slotSel,
          mark === 'again' && !filled && styles.slotBadEmpty,
          mark === 'bad' && styles.slotBad,
          mark === 'ok' && styles.slotOk,
          anim,
        ]}>
        {filled ? (
          <Appear key={word} kind="popIn">
            <PText style={styles.slotT} color={mark === 'ok' ? '#1D6B3B' : mark === 'bad' ? '#A3243C' : Colors.ink}>
              {word}
            </PText>
          </Appear>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { paddingVertical: 14, paddingHorizontal: 16, gap: 14, borderWidth: 2, borderColor: Colors.ink, borderRadius: 22, backgroundColor: Colors.white, boxShadow: `4px 4px 0px ${Colors.ink}` },
  line: { gap: 4 },
  words: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 5, rowGap: 6 },
  w: { fontFamily: Font.body800, fontSize: 15.5, lineHeight: 22 },
  slotRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  slot: { minWidth: 88, height: 32, paddingHorizontal: 10, borderRadius: 10, borderWidth: 2, borderStyle: 'dashed', borderColor: '#B9B2A3', backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center' },
  slotSel: { borderColor: Colors.purple, backgroundColor: Colors.lavender },
  slotOn: { borderStyle: 'solid', borderColor: Colors.ink, backgroundColor: Colors.yellow, boxShadow: `2px 2px 0px ${Colors.ink}` },
  slotOk: { borderStyle: 'solid', borderColor: GREEN, backgroundColor: GREEN_BG, boxShadow: 'none' },
  slotBad: { borderStyle: 'solid', borderColor: PINK, backgroundColor: PINK_BG, boxShadow: 'none' },
  slotBadEmpty: { borderColor: PINK, backgroundColor: '#FDEBEF' },
  slotT: { fontFamily: Font.body900, fontSize: 14.5, lineHeight: 20 },
  ko: { fontFamily: Font.body700, fontSize: 12.5, lineHeight: 18 },
  bankWrap: { gap: 8 },
  bankT: { fontFamily: Font.body800, fontSize: 12, lineHeight: 17 },
  bank: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { height: 40, paddingHorizontal: 14, borderRadius: 20, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', boxShadow: `0px 3px 0px ${Colors.ink}`, marginBottom: 3 },
  chipOff: { height: 40, paddingHorizontal: 14, borderRadius: 20, borderWidth: 2, borderStyle: 'dashed', borderColor: LINE, alignItems: 'center', justifyContent: 'center', marginBottom: 3 },
  chipT: { fontFamily: Font.body900, fontSize: 14.5, lineHeight: 20 },
  pressed: { transform: [{ translateY: 2 }], boxShadow: `0px 1px 0px ${Colors.ink}` },
  res: { gap: 14 },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  date: { fontFamily: Font.body800, fontSize: 12, lineHeight: 17, flexShrink: 1 },
  tools: { flexDirection: 'row', gap: 6 },
  para: { fontFamily: Font.body700, fontSize: 16, lineHeight: 27 },
  hl: { fontFamily: Font.body900, backgroundColor: Colors.yellow },
  hlShown: { backgroundColor: PINK_BG, color: PINK_INK },
});
