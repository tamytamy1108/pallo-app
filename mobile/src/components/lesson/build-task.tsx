import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { FeedbackBand } from '@/components/lesson/feedback-band';
import { YellowButton } from '@/components/lesson/lesson-ui';
import { TaskLayout, useTask } from '@/components/lesson/task-layout';
import { say } from '@/components/lesson/voice';
import { AnswerCards, makeWordBank, WordBank, wordBankText } from '@/components/lesson/word-bank';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { GOOD_REACTIONS, pickOne, type BuildTask as Task } from '@/data/lessons';
import { haptic, sfx } from '@/lib/feedback';
import { normalize } from '@/lib/words';

/**
 * 단어 카드로 문장 만들기 (프로토타입 TKV.build): 정답 단어 + 헷갈리는 단어 2개.
 * 처음 틀리면 'Not quite!' + 맞은 앞부분만 남기고 한 번 더, 두 번째도 틀리면 정답 문장이 단어 카드로 날아와 맞춰지고 읽어 줘요.
 */
export function BuildTask({ task }: { task: Task }) {
  const { mark, next, soundOff } = useTask();
  const [wb, setWb] = useState(() => makeWordBank(task.en, task.pool, 2));
  const [tries, setTries] = useState(0);
  const [kept, setKept] = useState(0);
  const [result, setResult] = useState<null | { ok: boolean; rx: [string, string] }>(null);
  const text = wordBankText(wb);

  const check = () => {
    const ok = normalize(text) === normalize(task.en);
    if (!ok && !tries) {
      // 처음 틀리면: 맞은 앞부분만 남기고 한 번 더
      const key = task.en.trim().split(/\s+/).map(normalize);
      let n = 0;
      while (n < wb.picked.length && normalize(wb.toks[wb.picked[n]].w) === key[n]) n += 1;
      setWb({ ...wb, picked: wb.picked.slice(0, n) });
      setKept(n);
      setTries(1);
      sfx('wrong');
      haptic('error');
      return;
    }
    setResult({ ok, rx: pickOne(GOOD_REACTIONS) });
    mark(ok);
    sfx(ok ? 'correct' : 'wrong');
    haptic(ok ? 'success' : 'error');
    const n = task.en.split(/\s+/).length;
    if (ok) say(task.en);
    else setTimeout(() => say(task.en), n * 110 + 450);
  };

  const foot = result ? (
    result.ok ? (
      <FeedbackBand kind="good" en={result.rx[0]} ko={tries ? '두 번째에 맞혔어요!' : '정확해요!'} soundOff={soundOff} say={() => say(task.en)}>
        <YellowButton label="계속하기" onPress={next} />
      </FeedbackBand>
    ) : (
      <FeedbackBand kind="bad" en="Almost!" ko="정답 카드를 보고 순서를 기억해요">
        <YellowButton label="계속하기" onPress={next} />
      </FeedbackBand>
    )
  ) : tries ? (
    <FeedbackBand kind="retry" en="Not quite!" ko={kept ? `맞은 앞부분 ${kept}단어는 남겨 뒀어요 · 이어서 맞춰요` : '한 번 더 맞춰 봐요 · 기회가 한 번 남았어요'}>
      <YellowButton label="확인" onPress={check} disabled={!text} />
    </FeedbackBand>
  ) : (
    <YellowButton label="확인" onPress={check} disabled={!text} />
  );

  return (
    <TaskLayout foot={foot}>
      <View style={styles.card}>
        <PText style={styles.cardh} color={Colors.inkSub}>
          {task.label ?? '단어 카드로 만들어요'}
        </PText>
        <PText style={styles.ko}>{task.ko}</PText>
      </View>
      {result && !result.ok ? (
        <AnswerCards sentence={task.en} soundOff={soundOff} onSay={() => say(task.en)} />
      ) : (
        <WordBank wb={wb} onChange={setWb} locked={!!result} />
      )}
    </TaskLayout>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10 },
  cardh: { fontFamily: Font.body800, fontSize: 12, lineHeight: 17 },
  ko: { fontFamily: Font.body900, fontSize: 15, lineHeight: 22 },
});
