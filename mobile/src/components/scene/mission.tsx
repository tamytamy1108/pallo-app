import { useState } from 'react';

import { ShadowTask } from '@/components/lesson/shadow-task';
import type { SceneWithContent } from '@/data/situation';
import type { ShadowTask as Task } from '@/data/lessons';
import { useLearnPrefs } from '@/state/learn-prefs';
import { stopSpeaking } from '@/lib/tts';

import { useQuizLevel } from './scene-store';
import { StepShell, useStepFinish } from './step-frame';

/** 패턴 밑줄이 없는 따라 말하기 (미션 문장은 통째로 익혀요) */
const NO_FOCUS = /$^/;

/**
 * 미션 익히기 (프로토타입 runMission): 미션마다 내 레벨 문장을 듣고 따라 말하기.
 * 레슨의 따라 말하기(ShadowTask)를 그대로 써요 — 말하기 · 단어 카드 · 소리 끄기 흐름도 같아요.
 */
export function MissionStep({ sceneId, scene }: { sceneId: string; scene: SceneWithContent }) {
  const X = scene.content.flow;
  const L = useQuizLevel();
  const { noListen } = useLearnPrefs();
  const { finish, celebrate, finished } = useStepFinish(sceneId, 'mis');
  const [tasks] = useState<Task[]>(() =>
    X.mis.map((m, i) => ({
      type: 'shadow' as const,
      en: m.lv[L],
      ko: m.kos[L] ?? m.ko,
      head: { kicker: `미션 ${i + 1} / ${X.mis.length} · Lv.${L}`, pattern: m.t, short: '', meaning: m.sit },
      focus: NO_FOCUS,
    })),
  );
  const [i, setI] = useState(0);
  const last = i === tasks.length - 1;
  return (
    <StepShell sceneId={sceneId} progress={{ index: i, total: tasks.length }} finished={finished}>
      <ShadowTask
        key={i}
        task={tasks[i]}
        soundOff={noListen}
        nextLabel={last ? '완료' : '다음'}
        onNext={() => {
          stopSpeaking();
          if (last) finish();
          else setI(i + 1);
        }}
      />
      {celebrate}
    </StepShell>
  );
}
