import { router, Stack, useLocalSearchParams, type Href } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HubBody, HubTop, SceneListSheet, StepPopup } from '@/components/scene/hub';
import { LevelPick } from '@/components/scene/level-pick';
import { getBest, pickLevel, useLevelPicked, useQuizLevel, clearQuizPos } from '@/components/scene/scene-store';
import { showToast } from '@/components/ui/toast';
import { EmptyState } from '@/components/ui/state-view';
import { Colors } from '@/constants/theme';
import { sfx } from '@/lib/feedback';
import { MY_QUIZ_LEVELS, SCENE_STEPS, findScene, sceneIdOf, sceneStepKey, type SceneStep } from '@/data/situation';
import { clearPos, isDone, sceneKey, useSavedPos } from '@/state/progress';

/**
 * 상황 맵 장면 화면 (프로토타입 openStudy → showHub, 상황 맵이면 '장면' 화면).
 * 장면에 처음 들어오면 장면 화면보다 먼저 '내 레벨을 골라요'. 단계를 누르면 단계 팝업 → /scene/[id]/[단계].
 * id = '맵 id-장면 번호' (예: travel-1).
 */
export default function SceneScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const found = findScene(id);
  if (!found || !found.scene.content) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <EmptyState title="곧 열려요" />
      </SafeAreaView>
    );
  }
  return <SceneHub key={id} sceneId={sceneIdOf(found.map.id, found.scene.no)} />;
}

const leave = () => (router.canGoBack() ? router.back() : router.replace('/library'));

function SceneHub({ sceneId }: { sceneId: string }) {
  const { map, scene } = findScene(sceneId)!;
  const picked = useLevelPicked(scene.title);
  const lv = useQuizLevel();
  const [changing, setChanging] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [pop, setPop] = useState<SceneStep | null>(null);
  const popPos = useSavedPos(pop ? sceneStepKey(sceneId, pop.id) : '');

  // 처음 고를 땐 내 레벨 중 낮은 것 (또는 마지막에 고른 레벨)
  const initial = MY_QUIZ_LEVELS.includes(lv) ? lv : (MY_QUIZ_LEVELS[0] ?? 1);
  const showPick = !picked || changing;

  const openStep = (s: SceneStep, mode: 'start' | 'resume' | 'restart') => {
    setPop(null);
    if (mode === 'restart') {
      clearPos(sceneStepKey(sceneId, s.id));
      if (s.id === 'exq') clearQuizPos(sceneId);
    }
    router.push({ pathname: '/scene/[id]/[step]', params: { id: sceneId, step: s.id } });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ animation: 'slide_from_right' }} />
      <HubTop
        map={map}
        onBack={() => {
          sfx('back');
          if (changing) setChanging(false);
          else leave();
        }}
        onList={() => {
          sfx('tap');
          setSheet(true);
        }}
      />
      {showPick ? (
        <LevelPick
          key={changing ? 'change' : 'first'}
          title={scene.title}
          mode="scene"
          initial={initial}
          best={getBest(scene.title)}
          onGo={(n) => {
            pickLevel(scene.title, n);
            setChanging(false);
          }}
        />
      ) : (
        <View style={styles.flex}>
          <HubBody
            map={map}
            scene={scene}
            onLevel={() => {
              sfx('tap');
              setChanging(true);
            }}
            onListen={() => router.push(`/listening?key=${sceneId}` as Href)}
            onStep={(s) => {
              sfx('tap');
              setPop(s);
            }}
          />
        </View>
      )}
      <SceneListSheet
        open={sheet}
        map={map}
        current={scene.no}
        doneOf={(no) => isDone(sceneKey(sceneIdOf(map.id, no)))}
        onClose={() => setSheet(false)}
        onPick={(x) => {
          if (!x.content) {
            showToast(`${x.no}장면은 교재 데이터가 들어오면 열려요`);
            return;
          }
          setSheet(false);
          if (x.no !== scene.no) router.replace(`/scene/${sceneIdOf(map.id, x.no)}` as Href);
        }}
      />
      <StepPopup
        step={pop}
        index={pop ? SCENE_STEPS.indexOf(pop) : 0}
        done={pop ? isDone(sceneStepKey(sceneId, pop.id)) : false}
        pos={popPos}
        total={pop?.id === 'exq' ? 15 : 0}
        onClose={() => setPop(null)}
        onGo={(_, mode) => pop && openStep(pop, mode)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  flex: { flex: 1 },
});
