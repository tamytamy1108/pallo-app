import { useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router/js-stack';
import type { ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SCREEN } from '@/lib/transitions';
import { BankStep } from '@/components/scene/bank';
import { FlowStep } from '@/components/scene/flow';
import { MissionStep } from '@/components/scene/mission';
import { QuizStep } from '@/components/scene/quiz';
import { TalkStep } from '@/components/scene/talk';
import { EmptyState } from '@/components/ui/state-view';
import { Colors } from '@/constants/theme';
import { findScene, isSceneStep, sceneIdOf, type Scene, type SceneStepId } from '@/data/situation';

const STEP_VIEW: Record<SceneStepId, (p: { sceneId: string; scene: Scene }) => ReactElement> = { mis: MissionStep, flow: FlowStep, bank: BankStep, exq: QuizStep, talk: TalkStep };

/**
 * 상황 장면 단계 화면 (프로토타입 #study openStep): 미션 익히기 · 장면 롤플레이 · Word Bank · 상황 퀴즈 · AI 미션 대화.
 * /scene/travel-1/exq 처럼 열어요. 끝내면 축하 → 다음 단계 또는 장면 화면.
 */
export default function SceneStepScreen() {
  const { id, step } = useLocalSearchParams<{ id: string; step: string }>();
  const found = findScene(id);
  if (!found || !found.scene.content || !isSceneStep(step)) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <EmptyState title="곧 열려요" />
      </SafeAreaView>
    );
  }
  const sceneId = sceneIdOf(found.map.id, found.scene.no);
  const Step = STEP_VIEW[step];
  return (
    <>
      {/* 단계는 장면 화면 위로 쌓여요 (뒤로 가기 = 장면 화면). 스와이프로 닫으면 멈춘 곳을 못 남겨서 막아요 */}
      <Stack.Screen options={{ ...SCREEN.push, gestureEnabled: false }} />
      <Step key={`${sceneId}-${step}`} sceneId={sceneId} scene={found.scene} />
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
});
