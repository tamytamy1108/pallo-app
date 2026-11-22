import { Image } from 'expo-image';
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Appear } from '@/components/ui/appear';
import { showToast } from '@/components/ui/toast';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { haptic, sfx } from '@/lib/feedback';
import type { Scene } from '@/data/situation';

import { Bolt, Clock, XMark } from './icons';
import { BigBtn, Foot, Kick, PINK_INK, PressDrop, SUB, shuffle } from './parts';
import { StepShell, useStepFinish } from './step-frame';

const TIME = 30;

type Board = { L: number[]; R: number[]; done: Record<number, true>; sel: number | null; combo: number; best: number; miss: number; bad: number | null; badL: number | null; just: number | null };
const newBoard = (n: number): Board => ({ L: shuffle([...Array(n).keys()]), R: shuffle([...Array(n).keys()]), done: {}, sel: null, combo: 0, best: 0, miss: 0, bad: null, badL: null, just: null });

/** 이 장면의 최고 기록(초) — 프로토타입 ST.best[lk:bank] */
const BEST: Record<string, number> = {};

/**
 * Word Bank 30초 타임어택 (프로토타입 runBank → TKV.match).
 * 왼쪽 영어를 누르고 맞는 뜻을 오른쪽에서 골라요. 연속으로 맞히면 콤보. 결과: 맞힌 짝 · 별 · 걸린 시간 · 최고 콤보 · 틀린 짝.
 */
export function BankStep({ sceneId, scene }: { sceneId: string; scene: Scene }) {
  const P = scene.content!.bank.map((b) => [b[1], b[3]] as const);
  const N = P.length;
  const { finish, celebrate, finished } = useStepFinish(sceneId, 'bank');
  const [round, setRound] = useState(0);
  const [b, setB] = useState<Board>(() => newBoard(N));
  const [left, setLeft] = useState(TIME);
  const [won, setWon] = useState<number | null>(null);
  const nDone = Object.keys(b.done).length;
  // 다 맞히면 걸린 시간, 시간이 다 되면 30초
  const end = won != null ? { used: won } : left <= 0 ? { used: TIME } : null;
  const running = end == null;

  // 1초마다 시간이 줄어요
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [running, round]);

  const again = () => {
    setB(newBoard(N));
    setLeft(TIME);
    setWon(null);
    setRound((r) => r + 1);
  };

  const tapLeft = (i: number) => {
    sfx('tap');
    haptic('select');
    setB((s) => ({ ...s, sel: i, bad: null, badL: null, just: null }));
  };
  const tapRight = (j: number) => {
    if (b.sel == null) {
      showToast('왼쪽 영어를 먼저 골라요');
      return;
    }
    if (j === b.sel) {
      sfx('correct');
      haptic('success');
      const done = { ...b.done, [j]: true as const };
      setB({ ...b, done, just: j, combo: b.combo + 1, best: Math.max(b.best, b.combo + 1), sel: null, bad: null, badL: null });
      if (Object.keys(done).length === N) {
        // 마지막 짝도 잠깐 보여 준 뒤 결과로
        const used = Math.max(1, TIME - left); // 걸린 시간 (초)
        setTimeout(() => setWon(used), 650);
      }
    } else {
      sfx('wrong');
      haptic('error');
      setB({ ...b, miss: b.miss + 1, combo: 0, bad: j, badL: b.sel, sel: null, just: null });
    }
  };

  return (
    <StepShell sceneId={sceneId} progress={{ index: 0, total: 1 }} finished={finished || !!end}>
      {end ? (
        <BankEnd key={round} sceneId={sceneId} n={nDone} N={N} used={end.used} best={b.best} miss={b.miss} onAgain={again} onDone={() => finish({ right: nDone, total: N })} />
      ) : (
        <View style={styles.flex}>
          <ScrollView style={styles.flex} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            <Kick>Word Bank · 30초 타임어택</Kick>
            <View style={styles.timer}>
              <PText style={styles.time}>0:{String(Math.max(0, left)).padStart(2, '0')}</PText>
              <View style={styles.bar}>
                <View style={[styles.fill, { width: `${(Math.max(0, left) / TIME) * 100}%` }]} />
              </View>
              <View style={styles.combo}>
                <PText style={styles.comboText} color={Colors.yellow}>
                  x{b.combo}
                </PText>
              </View>
            </View>
            <PText style={styles.msg} color={SUB}>
              영어와 뜻을 짝지어요 · 연속으로 맞히면 콤보
            </PText>
            <View style={styles.grid}>
              <View style={styles.col}>
                {b.L.map((i) => (
                  <Card key={i} label={P[i][0]} en done={!!b.done[i]} sel={b.sel === i} bad={b.badL === i} onPress={() => tapLeft(i)} />
                ))}
              </View>
              <View style={styles.col}>
                {b.R.map((i) => (
                  <Card key={i} label={P[i][1]} done={!!b.done[i]} bad={b.bad === i} onPress={() => tapRight(i)} />
                ))}
              </View>
            </View>
          </ScrollView>
          <Foot>
            <PText style={[styles.msg, styles.center]} color={SUB}>
              {nDone}/{N} 짝
            </PText>
          </Foot>
        </View>
      )}
      {celebrate}
    </StepShell>
  );
}

/** 짝 카드 (#lesson .tk-mc) */
function Card({ label, en, done, sel, bad, onPress }: { label: string; en?: boolean; done: boolean; sel?: boolean; bad?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} disabled={done} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: sel, disabled: done }}>
      {({ pressed }) => (
        <View style={done && styles.okWrap}>
          {!done && !bad && !pressed ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.mcShadow]} /> : null}
          <View style={[styles.mc, (sel || done) && { backgroundColor: Colors.yellow }, bad && styles.mcBad, (done || (pressed && !bad)) && { transform: [{ translateY: done ? 4 : 3 }] }]}>
            <PText style={[styles.mcText, en ? styles.mcEn : null]} color={bad ? '#8A6170' : Colors.ink}>
              {label}
            </PText>
          </View>
        </View>
      )}
    </Pressable>
  );
}

function BankEnd({ sceneId, n, N, used, best, miss, onAgain, onDone }: { sceneId: string; n: number; N: number; used: number; best: number; miss: number; onAgain: () => void; onDone: () => void }) {
  const all = n === N;
  const stars = all ? (used <= 20 && miss <= 1 ? 3 : 2) : n >= N / 2 ? 1 : 0;
  const [prev] = useState(() => BEST[sceneId]);
  useEffect(() => {
    if (all && (!prev || used < prev)) BEST[sceneId] = used;
  }, [all, prev, used, sceneId]);
  const msg = all && prev && used < prev ? `지난 기록 ${prev}초를 깼어요!` : prev ? `내 최고 기록 ${Math.min(prev, all ? used : prev)}초` : all ? '첫 기록이에요! 한 번 더 하면 더 빨라져요' : '시간이 끝났어요 · 한 번 더 해 볼까요?';
  return (
    <View style={styles.flex}>
      <ScrollView style={styles.flex} contentContainerStyle={[styles.body, styles.res]} showsVerticalScrollIndicator={false}>
        <Appear kind="reactHop">
          <Image source={all ? require('@/assets/characters/c-upright-yellow.png') : require('@/assets/characters/c-tilted-yellow.png')} style={styles.resImg} contentFit="contain" />
        </Appear>
        <Appear kind="reactWord" delay={150}>
          <PText style={styles.rn}>
            {n} / {N}
          </PText>
        </Appear>
        <View style={styles.stars} accessibilityLabel={`별 ${stars}개`}>
          {[0, 1, 2].map((k) => (
            <PText key={k} style={styles.star} color={k < stars ? Colors.yellow : '#E3DCCB'}>
              ★
            </PText>
          ))}
        </View>
        <View style={styles.rs}>
          <Stat bg="#E3EAF8" icon={<Clock />} value={all ? `${used}초` : '시간 끝'} label="걸린 시간" />
          <Stat bg={Colors.yellow} dark icon={<Bolt />} value={`x${best}`} label="최고 콤보" tilt />
          <Stat bg="#FBE1E8" icon={<XMark size={22} color={PINK_INK} w={2.6} />} value={String(miss)} label="틀린 짝" />
        </View>
      </ScrollView>
      <Foot>
        <View style={styles.endFb}>
          <Image source={all ? require('@/assets/characters/c-upright-yellow.png') : require('@/assets/characters/c-upright-purple.png')} style={styles.endChar} contentFit="contain" />
          <PText style={styles.endMsg}>{msg}</PText>
        </View>
        <View style={styles.row}>
          <PressDrop onPress={onAgain} dy={5} radius={27} inner={styles.skip} accessibilityLabel="한 번 더">
            <PText style={styles.skipText}>한 번 더</PText>
          </PressDrop>
          <View style={styles.flex}>
            <BigBtn label="완료하기" onPress={onDone} />
          </View>
        </View>
      </Foot>
    </View>
  );
}

function Stat({ bg, icon, value, label, dark, tilt }: { bg: string; icon: ReactNode; value: string; label: string; dark?: boolean; tilt?: boolean }) {
  return (
    <View style={[styles.rt, { backgroundColor: bg }, tilt && { transform: [{ rotate: '-2deg' }] }]}>
      <View style={[styles.rtIc, dark && { backgroundColor: Colors.ink }]}>{icon}</View>
      <PText style={styles.rtB}>{value}</PText>
      <PText style={styles.rtS}>{label}</PText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  body: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 24, gap: 14 },
  timer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  time: { minWidth: 62, fontFamily: Font.display, fontSize: 24, lineHeight: 30 },
  bar: { flex: 1, height: 12, borderRadius: 8, borderWidth: 2, borderColor: Colors.ink, backgroundColor: '#F1EBDC', overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: Colors.rosePink, borderRightWidth: 2, borderColor: Colors.ink },
  combo: { height: 30, paddingHorizontal: 10, borderRadius: 15, backgroundColor: Colors.ink, justifyContent: 'center' },
  comboText: { fontFamily: Font.display, fontSize: 12, lineHeight: 16 },
  msg: { fontFamily: Font.body800, fontSize: 13, lineHeight: 13 * 1.55, textAlign: 'center' },
  grid: { flexDirection: 'row', gap: 10 },
  col: { flex: 1, gap: 7 },
  mcShadow: { top: 4, bottom: -4, borderRadius: 18, backgroundColor: Colors.ink },
  okWrap: { opacity: 0.45 },
  mc: { minHeight: 56, paddingVertical: 5, paddingHorizontal: 8, borderRadius: 18, borderWidth: 2.5, borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  mcBad: { backgroundColor: '#F6D3DC', borderStyle: 'dashed' },
  mcText: { fontFamily: Font.body800, fontSize: 15, lineHeight: 15 * 1.3, textAlign: 'center' },
  mcEn: { fontFamily: Font.display },
  res: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  resImg: { width: 130, height: 120 },
  rn: { fontFamily: Font.display, fontSize: 44, lineHeight: 52, letterSpacing: -1 },
  stars: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  star: { fontSize: 32, lineHeight: 36 },
  rs: { alignSelf: 'stretch', flexDirection: 'row', gap: 10, marginTop: 10 },
  rt: { flex: 1, alignItems: 'center', gap: 4, paddingTop: 14, paddingHorizontal: 6, paddingBottom: 12, borderWidth: 2, borderColor: Colors.ink, borderRadius: 18 },
  rtIc: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  rtB: { fontFamily: Font.display, fontSize: 19, lineHeight: 23 },
  rtS: { fontFamily: Font.body800, fontSize: 11.5, lineHeight: 16 },
  endFb: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  endChar: { width: 88, height: 82 },
  endMsg: { flex: 1, fontFamily: Font.body800, fontSize: 15, lineHeight: 15 * 1.45 },
  row: { flexDirection: 'row', gap: 10 },
  skip: { height: 54, minWidth: 76, paddingHorizontal: 20, borderRadius: 27, borderWidth: 2.5, borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  skipText: { fontFamily: Font.body900, fontSize: 15, lineHeight: 20 },
});
