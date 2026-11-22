import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { FeedbackBand } from '@/components/lesson/feedback-band';
import { SpeakerIcon } from '@/components/lesson/icons';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { GOOD_REACTIONS } from '@/data/lessons';
import { haptic, sfx } from '@/lib/feedback';

import { Body, Foot, useRunner } from '../frame';
import { AnsCards, TopPart } from '../parts';
import { Ring, useCountdown } from '../ring';
import { pickOne, shuffle } from '../text';
import type { PickTask, SayTask } from '../types';
import { CardHead, FootRow, GoBtn, MarkBtn, Msg, NoSpeakToggle, Spk, SUB, sayEn } from '../ui';

/**
 * 고르기 (프로토타입 TKV.pick): 뜻 · O/X · 듣고 고르기 · 빈칸 · 말하기 대신 고르기(alt) · 제한 시간.
 * 처음 틀리면 그 보기만 지우고 한 번 더 — 두 번째도 틀리면 정답 문장이 카드로 날아와요.
 * from: 말하기 문제(say)를 대신할 때, 그 문제의 머리 · 말풍선 · 카드를 그대로 보여요.
 */
export function PickBlock({ task, from }: { task: PickTask; from?: SayTask }) {
  const rt = useRunner();
  // 소리 끄기: 듣고 고르기 → 글자 보고 고르기
  const t = task.play && task.readAlt && rt.soundOff ? task.readAlt : task;
  return <PickInner key={t === task ? 'a' : 'b'} t={t} from={from} />;
}

function PickInner({ t, from }: { t: PickTask; from?: SayTask }) {
  const rt = useRunner();
  const { soundOff } = rt;
  const [order] = useState(() => (t.keep ? t.opts.map((_, i) => i) : shuffle(t.opts.map((_, i) => i))));
  const [sel, setSel] = useState<number | null>(null);
  const [miss, setMiss] = useState<number[]>([]);
  const [rx] = useState(() => pickOne(GOOD_REACTIONS));
  const cd = useCountdown();
  const timed = !!t.limit && !rt.noSpeak;
  const done = sel != null;
  const right = done && (t.ans < 0 ? sel >= 0 : sel === t.ans);
  const answer = typeof t.sayAns === 'string' ? t.sayAns : t.opts[t.ans];
  const showCards = done && !right && t.ans >= 0 && !t.noCards;
  const missRef = useRef(miss);
  useEffect(() => {
    missRef.current = miss;
  });

  useEffect(() => {
    if (t.play && !soundOff) {
      const tm = setTimeout(() => sayEn(t.play ?? '', false, 0.85), 300);
      return () => clearTimeout(tm);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!timed || !t.limit) return;
    cd.start(t.limit, () => {
      // 시간이 끝나면 정답 공개 (프로토타입처럼 점수에는 넣지 않아요)
      setSel(-1);
      rt.setCombo(0);
      sfx('wrong');
      haptic('warning');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // 틀린 뒤 정답 카드가 다 날아오면 읽어 줘요
  useEffect(() => {
    if (!showCards || !answer) return;
    const n = answer.trim().split(/\s+/).length;
    const tm = setTimeout(() => sayEn(answer, soundOff, 0.92), n * 110 + 450);
    return () => clearTimeout(tm);
  }, [showCards, answer, soundOff]);

  const choose = (k: number) => {
    const ok = t.ans < 0 || k === t.ans;
    // 처음 틀리면 그 보기만 지우고 한 번 더 (시계는 계속 돌아요)
    if (!ok && !missRef.current.length) {
      setMiss([k]);
      if (t.combo) rt.setCombo(0);
      sfx('wrong');
      haptic('error');
      return;
    }
    cd.stop();
    setSel(k);
    if (t.ans >= 0) rt.mark(ok);
    if (t.combo) rt.setCombo(ok && !missRef.current.length ? rt.combo + 1 : 0);
    rt.log({ k: t.kick ?? '', v: t.opts[k], ok });
    sfx(ok ? 'correct' : 'wrong');
    haptic(ok ? 'success' : 'error');
    if (t.then) {
      const add = t.then(k, ok);
      if (add.length) rt.insert(add);
    }
  };

  const head = from ?? t;
  return (
    <>
      <Body toEnd={showCards || undefined}>
        <TopPart head={head.head} ask={from?.ask} card={from?.card} soundOff={soundOff} />
        {t.q ? (
          <View style={styles.card}>
            <CardHead label={t.label || '골라요'}>
              {t.mark ? <MarkBtn en={t.mark[0]} ko={t.mark[1]} source={rt.source} /> : null}
              {t.q.en ? <Spk text={t.q.en} soundOff={soundOff} /> : null}
            </CardHead>
            {t.q.big ? <PText style={styles.big}>{t.q.big}</PText> : null}
            {t.q.ex ? (
              <View style={styles.ex}>
                <PText style={styles.exEn}>{t.q.ex[0]}</PText>
                <PText style={styles.exKo} color={SUB}>
                  {t.q.ex[1]}
                </PText>
              </View>
            ) : null}
            {t.q.blank ? <PText style={styles.blank}>{t.q.blank}</PText> : null}
            {!t.q.big && !t.q.ex && !t.q.blank && t.q.en ? <PText style={styles.sent}>{t.q.en}</PText> : null}
            {t.q.ko ? <PText style={styles.ko}>{t.q.ko}</PText> : null}
          </View>
        ) : t.label ? (
          <CardHead label={t.label} />
        ) : null}
        {t.play && !soundOff ? (
          <Pressable onPress={() => sayEn(t.play ?? '', false, 0.85)} accessibilityRole="button" style={({ pressed }) => [styles.play, pressed && styles.playOn]}>
            <SpeakerIcon size={18} />
            <PText style={styles.playT}>다시 듣기</PText>
          </Pressable>
        ) : null}
        {timed && !done ? <Ring left={cd.left ?? t.limit ?? 0} total={t.limit ?? 1} label="남은 시간" /> : null}
        <View style={t.ox ? styles.ox : styles.opts}>
          {order.map((i) => {
            const isRight = done && (i === t.ans || (t.ans < 0 && i === sel));
            const isWrong = (done && i === sel && !right) || miss.includes(i);
            return (
              <Pressable
                key={i}
                disabled={done || miss.includes(i)}
                onPress={() => choose(i)}
                accessibilityRole="button"
                accessibilityLabel={t.opts[i]}
                accessibilityState={{ selected: sel === i, disabled: done || miss.includes(i) }}
                style={t.ox ? styles.oxCell : undefined}>
                {({ pressed }) => (
                  <View style={StyleSheet.flatten([styles.opt, t.ox && styles.oxOpt, isRight && styles.right, isWrong && styles.wrong, pressed && !done && styles.optOn])}>
                    <PText style={t.ox ? styles.oxT : styles.optT} color={isWrong ? '#8A6170' : Colors.ink}>
                      {t.opts[i]}
                    </PText>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
        {showCards && answer ? <AnsCards sentence={answer} soundOff={soundOff} /> : null}
      </Body>
      <Foot>
        {done ? (
          <>
            <FeedbackBand
              kind={right ? 'good' : 'bad'}
              en={right ? rx[0] : sel === -1 ? 'Time’s up!' : 'Almost!'}
              ko={t.explain ? t.explain : right ? '정답이에요' : `정답 · ${t.opts[t.ans] ?? ''}`}
              soundOff={soundOff}
            />
            <FootRow>
              <GoBtn label={rt.goLabel} onPress={rt.next} />
            </FootRow>
          </>
        ) : miss.length ? (
          <FeedbackBand kind="retry" en="Not quite!" ko="한 번 더 골라 봐요 · 기회가 한 번 남았어요" soundOff={soundOff} />
        ) : from ? (
          <NoSpeakToggle on={rt.noSpeak} onPress={rt.toggleNoSpeak} />
        ) : t.footMsg ? (
          <Msg text={t.footMsg} style={styles.footMsg} />
        ) : null}
      </Foot>
    </>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10 },
  big: { fontFamily: 'Unbounded_800ExtraBold', fontSize: 24, lineHeight: 30, paddingTop: 6, paddingBottom: 2 },
  ex: { backgroundColor: '#F6F1E4', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, gap: 3, marginTop: 6 },
  exEn: { fontFamily: Font.body800, fontSize: 14.5, lineHeight: 21.75 },
  exKo: { fontFamily: Font.body700, fontSize: 12.5, lineHeight: 18 },
  sent: { fontFamily: Font.display, fontSize: 19, lineHeight: 27.55, letterSpacing: -0.3 },
  blank: { fontFamily: Font.body900, fontSize: 18, lineHeight: 28, letterSpacing: -0.3 },
  ko: { fontFamily: Font.body900, fontSize: 20, lineHeight: 28, letterSpacing: -0.3 },
  play: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, height: 52, paddingHorizontal: 22, borderRadius: 26, borderWidth: 2.5, borderColor: Colors.ink, backgroundColor: Colors.sky, boxShadow: `0px 4px 0px ${Colors.ink}` },
  playOn: { transform: [{ translateY: 3 }], boxShadow: `0px 1px 0px ${Colors.ink}` },
  playT: { fontFamily: Font.body900, fontSize: 15, lineHeight: 20 },
  opts: { gap: 10 },
  ox: { flexDirection: 'row', gap: 12 },
  oxCell: { flex: 1 },
  opt: { minHeight: 54, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 18, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, boxShadow: `0px 4px 0px ${Colors.ink}`, justifyContent: 'center', marginBottom: 4 },
  oxOpt: { minHeight: 96, alignItems: 'center' },
  optOn: { transform: [{ translateY: 3 }], boxShadow: `0px 1px 0px ${Colors.ink}` },
  right: { backgroundColor: Colors.yellow },
  wrong: { backgroundColor: '#F6D3DC', borderStyle: 'dashed', boxShadow: 'none', transform: [{ translateY: 4 }] },
  optT: { fontFamily: Font.body800, fontSize: 15, lineHeight: 21.75 },
  oxT: { fontFamily: Font.display, fontSize: 40, lineHeight: 48 },
  footMsg: { paddingBottom: 6 },
});
