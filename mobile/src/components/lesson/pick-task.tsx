import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Pressable } from '@/components/ui/pressable';
import { FeedbackBand } from '@/components/lesson/feedback-band';
import { SpeakerIcon } from '@/components/lesson/icons';
import { L, NoSpeakToggle, YellowButton } from '@/components/lesson/lesson-ui';
import { TaskLayout, useTask } from '@/components/lesson/task-layout';
import { say, toggleNoSpeak } from '@/components/lesson/voice';
import { AnswerCards } from '@/components/lesson/word-bank';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { GOOD_REACTIONS, pickOne, type PickTask as Task } from '@/data/lessons';
import { haptic, sfx } from '@/lib/feedback';
import { shuffled } from '@/lib/words';

/**
 * 고르기 (프로토타입 TKV.pick): O/X · 듣고 고르기 · 빈칸 · 제한 시간.
 * 처음 틀리면 그 보기만 지우고 'Not quite! 한 번 더', 두 번째도 틀리면 정답이 단어 카드로 날아와 맞춰지고 읽어 줘요.
 * 소리 끄기면 듣고 고르기 대신 글자 보고 고르기(readAlt)로 바꿔요.
 */
export function PickTask({ task: t0, fromSpeak = false }: { task: Task; fromSpeak?: boolean }) {
  const { mark, next, isLast, soundOff, noSpeak } = useTask();
  const t: Task = t0.play && t0.readAlt && soundOff ? { ...t0.readAlt, type: 'pick' } : t0;
  const P = t.opts;
  const [order] = useState(() => (t.ox ? P.map((_, i) => i) : shuffled(P.length)));
  const [sel, setSel] = useState<number | null>(null);
  const [miss, setMiss] = useState<number[]>([]);
  const [rx] = useState(() => pickOne(GOOD_REACTIONS));
  const done = sel != null;
  const right = done && (t.ans < 0 ? sel >= 0 : sel === t.ans);

  // 듣고 고르기: 처음 한 번 들려줘요 (글로는 안 보여 줘요)
  useEffect(() => {
    if (!t.play || soundOff) return;
    const tm = setTimeout(() => say(t.play ?? '', 0.85), 300);
    return () => clearTimeout(tm);
  }, [t.play, soundOff]);

  const pick = (k: number) => {
    const ok = t.ans < 0 || k === t.ans;
    if (!ok && !miss.length) {
      setMiss([k]);
      sfx('wrong');
      haptic('error');
      return;
    }
    setSel(k);
    if (t.ans >= 0) mark(ok);
    sfx(ok ? 'correct' : 'wrong');
    haptic(ok ? 'success' : 'error');
    if (!ok && t.ans >= 0) setTimeout(() => say(P[t.ans]), P[t.ans].split(/\s+/).length * 110 + 450);
  };

  const label = isLast ? '완료하기' : '계속하기';
  const foot = done ? (
    <FeedbackBand kind={right ? 'good' : 'bad'} en={right ? rx[0] : 'Almost!'} ko={t.explain ?? (right ? '정답이에요' : `정답 · ${P[t.ans] ?? ''}`)} soundOff={soundOff} say={right && t.ans >= 0 ? () => say(P[t.ans]) : undefined}>
      <YellowButton label={label} onPress={next} />
    </FeedbackBand>
  ) : miss.length ? (
    <FeedbackBand kind="retry" en="Not quite!" ko="한 번 더 골라 봐요 · 기회가 한 번 남았어요" />
  ) : fromSpeak ? (
    <NoSpeakToggle on={noSpeak} onPress={toggleNoSpeak} />
  ) : null;

  return (
    <TaskLayout foot={foot}>
      {t.q ? (
        <View style={styles.card}>
          <PText style={styles.cardh} color={Colors.inkSub}>
            {t.label ?? '골라요'}
          </PText>
          {t.q.en ? <PText style={styles.sent}>{t.q.en}</PText> : null}
          {t.q.ko ? <PText style={styles.ko}>{t.q.ko}</PText> : null}
        </View>
      ) : null}
      {t.play && !soundOff ? (
        <Pressable onPress={() => say(t.play ?? '', 0.85)} accessibilityRole="button" accessibilityLabel="다시 듣기" style={styles.play}>
          <SpeakerIcon size={18} />
          <PText style={styles.playText}>다시 듣기</PText>
        </Pressable>
      ) : null}
      <View style={t.ox ? styles.ox : styles.opts}>
        {order.map((i) => {
          const isRight = done && (i === t.ans || (t.ans < 0 && i === sel));
          const isWrong = (done && i === sel && !right) || miss.includes(i);
          return (
            <Pressable key={i} onPress={() => pick(i)} disabled={done || miss.includes(i)} accessibilityRole="button" accessibilityLabel={P[i]} style={t.ox ? styles.flex : undefined}>
              {({ pressed }) => (
                <View style={StyleSheet.flatten([styles.opt, t.ox && styles.optOx, isRight && styles.optRight, isWrong && styles.optWrong, pressed && styles.optDown])}>
                  <PText style={t.ox ? styles.oxText : styles.optText} color={isWrong ? '#A3243C' : Colors.ink}>
                    {P[i]}
                  </PText>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
      {done && !right && t.ans >= 0 ? <AnswerCards sentence={P[t.ans]} soundOff={soundOff} onSay={() => say(P[t.ans])} /> : null}
    </TaskLayout>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { gap: 8 },
  cardh: { fontFamily: Font.body800, fontSize: 12, lineHeight: 17 },
  sent: { fontFamily: Font.display, fontSize: 19, lineHeight: 27 },
  ko: { fontFamily: Font.body900, fontSize: 20, lineHeight: 28 },
  play: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, paddingHorizontal: 18, borderRadius: 22, borderWidth: 2, borderColor: Colors.ink, borderBottomWidth: 5, backgroundColor: L.speakerBg },
  playText: { fontFamily: Font.body900, fontSize: 14, lineHeight: 19 },
  opts: { gap: 10 },
  ox: { flexDirection: 'row', gap: 12 },
  opt: { minHeight: 54, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 18, borderWidth: 2.5, borderColor: Colors.ink, borderBottomWidth: 6, backgroundColor: Colors.white, justifyContent: 'center' },
  optOx: { minHeight: 96, alignItems: 'center' },
  optDown: { borderBottomWidth: 2.5, marginTop: 3.5 },
  optRight: { backgroundColor: L.okBg, borderColor: L.okGreen, borderBottomWidth: 2.5, marginTop: 3.5 },
  optWrong: { backgroundColor: L.noBg, borderColor: L.noRed, borderStyle: 'dashed', borderBottomWidth: 2.5, marginTop: 3.5, opacity: 0.8 },
  optText: { fontFamily: Font.body800, fontSize: 15, lineHeight: 21 },
  oxText: { fontFamily: Font.display, fontSize: 34, lineHeight: 42 },
});
