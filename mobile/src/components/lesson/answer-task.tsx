import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AskBubble } from '@/components/lesson/bubbles';
import { FeedbackBand } from '@/components/lesson/feedback-band';
import { MicButton, ModeTabs, NoSpeakToggle, YellowButton, type AnswerMode } from '@/components/lesson/lesson-ui';
import { TaskLayout, useTask } from '@/components/lesson/task-layout';
import { say, toggleNoSpeak, useDictation } from '@/components/lesson/voice';
import { makeWordBank, WordBank, wordBankText } from '@/components/lesson/word-bank';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { GOOD_REACTIONS, pickOne, type AnswerTask as Task } from '@/data/lessons';
import { haptic, sfx } from '@/lib/feedback';
import { SPEECH_PROBLEM_TEXT } from '@/lib/speech';
import { getStepData, setStepData } from '@/state/progress';

/**
 * 질문에 답하기 (프로토타입 TKV.answer): 질문 듣기 · 예시 답 → 말하기(기본) · 단어 카드 · 쓰기로 내 답.
 * 답은 '처음 답변'으로 저장 → 복습 Before / After 에서 비교해요. 말하기가 어려우면 처음부터 단어 카드.
 */
export function AnswerTask({ task }: { task: Task }) {
  const { mark, next, noSpeak, soundOff } = useTask();
  const q = task.q;
  const [mode, setMode] = useState<AnswerMode>(noSpeak ? 'card' : 'voice');
  const [wb, setWb] = useState(() => makeWordBank(q.hint, task.pool, 2));
  const [draft, setDraft] = useState('');
  const [saved, setSaved] = useState<null | [string, string]>(null);
  const mic = useDictation((t) => setDraft(t));
  const text = mode === 'card' ? wordBankText(wb) : mode === 'voice' ? mic.text || draft : draft;

  const switchMode = (m: AnswerMode) => {
    mic.stop();
    setMode(m);
    setDraft('');
    mic.setText('');
    setWb(makeWordBank(q.hint, task.pool, 2));
  };
  const check = () => {
    const v = text.trim();
    if (!v) return;
    mic.stop();
    const a = getStepData<string[]>(task.key) ?? [];
    a[task.qi] = v;
    setStepData(task.key, a);
    setDraft(v);
    setSaved(pickOne(GOOD_REACTIONS));
    mark(true);
    sfx('correct');
    haptic('success');
  };

  const foot = saved ? (
    <FeedbackBand kind="good" en={saved[0]} ko="처음 답변으로 저장했어요 · 복습 Before / After에서 비교해요" soundOff={soundOff} say={() => say(draft)}>
      <YellowButton label="계속하기" onPress={next} />
    </FeedbackBand>
  ) : (
    <>
      <NoSpeakToggle on={noSpeak} onPress={toggleNoSpeak} />
      <ModeTabs
        tabs={[
          ['card', '단어 카드'],
          ['voice', '말하기'],
          ['write', '쓰기'],
        ]}
        value={mode}
        onChange={switchMode}
      />
      {mode === 'voice' && mic.problem ? (
        <PText style={styles.problem} color={Colors.inkSub}>
          {SPEECH_PROBLEM_TEXT[mic.problem]}
        </PText>
      ) : null}
      {mode === 'voice' && <MicButton listening={mic.listening} label="눌러서 말하기" disabled={!mic.available} onPress={() => mic.toggle(q.hint.split(/\s+/))} />}
      <YellowButton label="확인" onPress={check} disabled={!text.trim()} />
    </>
  );

  return (
    <TaskLayout foot={foot}>
      <AskBubble char="purple" en={q.en} ko={q.ko} soundOff={soundOff} onSay={() => say(q.en)} />
      <PText style={styles.msg} color={Colors.inkSub}>
        예시 답에서 단어를 바꿔{' '}
        <PText style={styles.msgB} color="#C2416B">
          내 이야기
        </PText>
        로 답해요 · 예) {q.hint}
      </PText>
      <View style={saved ? styles.locked : undefined} pointerEvents={saved ? 'none' : 'auto'}>
        {mode === 'card' ? (
          <WordBank wb={wb} onChange={setWb} locked={!!saved} />
        ) : mode === 'voice' ? (
          <View style={styles.said}>
            <PText style={styles.saidText}>{text}</PText>
          </View>
        ) : (
          <TextInput value={draft} onChangeText={setDraft} multiline placeholder="영어로 내 이야기를 적어 보세요" placeholderTextColor="#A39C8E" style={styles.ta} autoCapitalize="sentences" accessibilityLabel="내 답" />
        )}
      </View>
    </TaskLayout>
  );
}

const styles = StyleSheet.create({
  msg: { textAlign: 'center', fontFamily: Font.body800, fontSize: 13, lineHeight: 20 },
  msgB: { fontFamily: Font.body900, fontSize: 13, lineHeight: 20 },
  locked: { opacity: 1 },
  said: { minHeight: 86, paddingVertical: 10, borderBottomWidth: 3, borderColor: Colors.ink },
  saidText: { fontFamily: Font.body800, fontSize: 17, lineHeight: 25 },
  ta: { minHeight: 100, padding: 14, borderWidth: 2, borderColor: Colors.ink, borderRadius: 16, backgroundColor: Colors.white, fontFamily: Font.body600, fontSize: 16, lineHeight: 23, textAlignVertical: 'top' },
  problem: { textAlign: 'center', fontFamily: Font.body800, fontSize: 12.5, lineHeight: 17 },
});
