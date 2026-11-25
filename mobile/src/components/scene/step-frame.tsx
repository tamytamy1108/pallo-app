import * as Tts from 'expo-speech';
import { router, type Href } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from '@/components/ui/safe-area';

import { Pressable } from '@/components/ui/pressable';
import { Celebrate, type CelebrateResult } from '@/components/lesson/celebrate';
import { LessonTop } from '@/components/lesson/lesson-top';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { haptic, sfx } from '@/lib/feedback';
import { SCENE_STEPS, sceneStepKey, type SceneStepId } from '@/data/situation';
import { setNoListen, useLearnPrefs } from '@/state/learn-prefs';
import { awardPoints } from '@/state/ledger';
import { clearPos, DAILY_GOAL, getTodayDone, isDone, markDone, sceneKey } from '@/state/progress';
import { sceneQuestTitle, shareQuest } from '@/state/quest-share';

import { Sound, XMark } from './icons';
import { QuitSheet } from './parts';

/** 장면 화면으로 (앞 화면이 장면이면 뒤로, 주소로 바로 들어왔으면 장면 화면으로 바꿔요) */
export const backToHub = (sceneId: string) => (router.canGoBack() ? router.back() : router.replace(`/scene/${sceneId}` as Href));

/**
 * 단계 끝내기 (프로토타입 finishStep): 진도 기록 · 처음이면 포인트 · 다섯 단계를 다 끝내면 지도에 도장(sceneKey).
 * 축하 화면에서 '이어서 하기' = 다음 단계, 아니면 장면 화면으로.
 */
export function useStepFinish(sceneId: string, stepId: SceneStepId) {
  const [cel, setCel] = useState<{ result: CelebrateResult; next: SceneStepId | null } | null>(null);
  const finish = (score?: { right: number; total: number }) => {
    Tts.stop();
    const step = SCENE_STEPS.find((s) => s.id === stepId) ?? SCENE_STEPS[0];
    const key = sceneStepKey(sceneId, stepId);
    const first = markDone(key);
    clearPos(key);
    if (first) awardPoints(`step:${key}`, 'step', step.xp);
    const allDone = SCENE_STEPS.every((s) => isDone(sceneStepKey(sceneId, s.id)));
    const stamp = allDone ? markDone(sceneKey(sceneId)) : false; // 장면 완료! 지도에 도장이 찍혔어요
    // 장면을 다 끝낸 순간 팔로워에게 '퀘스트 성공' (state/quest-share)
    if (stamp) shareQuest({ key: sceneKey(sceneId), title: sceneQuestTitle(sceneId), href: `/scene/${sceneId}` });
    const nextStep = SCENE_STEPS.find((s) => !isDone(sceneStepKey(sceneId, s.id)));
    sfx('fanfare');
    haptic('success');
    setCel({
      result: {
        correct: score?.right ?? 0,
        total: score?.total ?? 0, // 점수 없는 단계(따라 말하기)는 정확도 칸 없이
        points: first ? step.xp : 0,
        goalDone: Math.min(getTodayDone(), DAILY_GOAL),
        goalTotal: DAILY_GOAL,
        // 다섯 단계를 다 끝낸 순간: '장면 연습 완료!' 노랑 큰 축하 (프로토타입 stageDone · stageName = '장면 연습')
        unitComplete: stamp,
        title: stamp ? '장면 연습 완료!' : undefined,
        nextPoints: nextStep?.xp,
      },
      next: nextStep?.id ?? null,
    });
  };
  const celebrate = cel ? (
    <Celebrate
      visible
      result={cel.result}
      onHome={() => {
        setCel(null);
        backToHub(sceneId);
      }}
      onNext={cel.next ? () => router.replace({ pathname: '/scene/[id]/[step]', params: { id: sceneId, step: cel.next ?? 'mis' } }) : undefined}
    />
  ) : null;
  return { finish, celebrate, finished: cel != null };
}

/**
 * 단계 화면 틀 (#study 단계 · 위 줄 X / 진행 막대 또는 제목 / 소리).
 * X 는 '정말 그만할까요?' (끝낸 뒤엔 바로 장면 화면으로). onQuit 에서 멈춘 곳을 저장해요.
 */
export function StepShell({
  sceneId,
  progress,
  title,
  finished,
  onQuit,
  children,
}: {
  sceneId: string;
  /** 진행 막대 (index 0부터) — 없으면 제목 줄 */
  progress?: { index: number; total: number };
  title?: string;
  finished?: boolean;
  onQuit?: () => void;
  children: ReactNode;
}) {
  const { noListen } = useLearnPrefs();
  const [ask, setAsk] = useState(false);
  const quit = () => {
    Tts.stop();
    onQuit?.();
    backToHub(sceneId);
  };
  const close = () => {
    if (finished) quit();
    else {
      sfx('tap');
      setAsk(true);
    }
  };
  const toggleSound = () => {
    Tts.stop();
    setNoListen(!noListen);
  };
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {progress ? (
        <LessonTop index={progress.index} total={progress.total} soundOff={noListen} onToggleSound={toggleSound} onClose={close} />
      ) : (
        <View style={styles.top}>
          <Pressable onPress={close} accessibilityRole="button" accessibilityLabel="그만하고 장면 화면으로" style={styles.iconBtn} hitSlop={4}>
            <XMark size={18} w={2.6} />
          </Pressable>
          <PText style={styles.title} numberOfLines={1} accessibilityRole="header">
            {title}
          </PText>
          <Pressable
            onPress={toggleSound}
            accessibilityRole="switch"
            accessibilityState={{ checked: noListen }}
            accessibilityLabel={noListen ? '소리 켜기' : '15분 동안 소리 끄기'}
            style={[styles.snd, noListen && styles.sndOff]}
            hitSlop={4}>
            <Sound off={noListen} color={noListen ? '#5B4BA8' : Colors.ink} />
          </Pressable>
        </View>
      )}
      <View style={styles.flex}>{children}</View>
      <QuitSheet
        open={ask}
        onStay={() => setAsk(false)}
        onQuit={() => {
          setAsk(false);
          sfx('quit');
          quit();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  flex: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10 },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center', fontFamily: Font.body900, fontSize: 14, lineHeight: 20 },
  snd: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginRight: 3 },
  sndOff: { backgroundColor: '#E6DEFA' },
});
