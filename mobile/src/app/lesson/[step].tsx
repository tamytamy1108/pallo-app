import { router, useLocalSearchParams } from 'expo-router';
import * as Tts from 'expo-speech';
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LessonTop } from '@/components/lesson/lesson-top';
import { ShadowTask } from '@/components/lesson/shadow-task';
import { Screen } from '@/components/screen';
import { PText } from '@/components/ui/text';
import { Colors } from '@/constants/theme';
import { patternTasks } from '@/data/lessons';

/**
 * 레슨 화면 (프로토타입 #lesson · 한 화면에 한 문제).
 * 지금은 '오늘의 패턴'(따라 말하기)만 있어요. 다른 단계는 하나씩 늘려요.
 */
export default function LessonScreen() {
  const { step } = useLocalSearchParams<{ step: string }>();
  if (step !== 'pat') {
    return (
      <Screen title="준비 중">
        <PText>이 단계는 다음에 만들어요.</PText>
      </Screen>
    );
  }
  return <PatternLesson />;
}

/** 레슨 닫기: 앞 화면이 있으면 그리로, 주소로 바로 들어왔으면 홈으로 */
const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));

function PatternLesson() {
  const [tasks] = useState(patternTasks);
  const [i, setI] = useState(0);
  const [soundOff, setSoundOff] = useState(false);
  const last = i === tasks.length - 1;

  const next = () => {
    Tts.stop();
    if (last) leave();
    else setI(i + 1);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <LessonTop
        index={i}
        total={tasks.length}
        soundOff={soundOff}
        onToggleSound={() => {
          Tts.stop();
          setSoundOff((v) => !v);
        }}
        onClose={leave}
      />
      {/* key 가 바뀌면 다음 문제를 새로 시작해요 */}
      <ShadowTask key={i} task={tasks[i]} soundOff={soundOff} onNext={next} nextLabel={last ? '완료' : '다음'} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
});
