import * as Tts from 'expo-speech';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LessonTop } from '@/components/lesson/lesson-top';
import { Peek } from '@/components/lesson/peek';
import { ConfirmDialog } from '@/components/ui/dialog';
import { showToast } from '@/components/ui/toast';
import { Colors } from '@/constants/theme';
import { CHEER_STREAK, pickOne } from '@/data/lessons';
import { sfx } from '@/lib/feedback';
import { setNoSpeak, useLearnPrefs } from '@/state/learn-prefs';
import { savePos, stepKey, useSavedPos } from '@/state/progress';

import { MatchBlock } from './blocks/match';
import { BlindBlock, ChooseBlock, DuoBlock, ExplainBlock, ReadBlock, ScoreBlock } from './blocks/misc';
import { ExprsBlock } from './blocks/exprs';
import { FillBlock } from './blocks/fill';
import { PickBlock } from './blocks/pick';
import { SayBlock } from './blocks/say';
import { leave34, useSoundToggle, useStepFinish, type StepCtx } from './finish';
import { RunnerCtx, type Runner } from './frame';
import { dropRun, loadRun, saveRun } from './store';
import type { LogItem, Task34 } from './types';
import { IMG, Kicker } from './ui';

/**
 * Lv.3 · 4 코너 진행기 (프로토타입 openTasks · tkRender · tkNext · tkClose).
 * 한 화면에 문제 하나 · 위 줄 X · 진행 막대 · n/전체 · 소리 · 그만두면 멈춘 곳 저장 · 다 풀면 축하 화면.
 */
export function TaskRunner({ ctx, kick, build }: { ctx: StepCtx; kick: string; build: () => Task34[] }) {
  const key = stepKey(ctx.lv, ctx.unit, ctx.step.id);
  const savedPos = useSavedPos(key);
  const [snap] = useState(() => (savedPos != null ? loadRun(key) : undefined));
  const [tasks, setTasksState] = useState<Task34[]>(() => snap?.tasks ?? build());
  // 끼워 넣은 문제를 바로 '다음'에서 볼 수 있게 지금 목록을 ref 에도 둬요 (고르고 바로 다음으로 넘어가요)
  const tasksRef = useRef(tasks);
  const setTasks = (next: Task34[] | ((list: Task34[]) => Task34[])) => {
    tasksRef.current = typeof next === 'function' ? next(tasksRef.current) : next;
    setTasksState(tasksRef.current);
  };
  const [i, setI] = useState(snap?.i ?? 0);
  const [nonce, setNonce] = useState(0);
  const [askResume, setAskResume] = useState(!!snap);
  const [askQuit, setAskQuit] = useState(false);
  const [kickOver, setKickOver] = useState<string | null>(null);
  const [combo, setCombo] = useState(0);
  // 보라 팔로 빼꼼: 2문제 연속 맞히면 응원 · 처음 틀리면 안내 (Lv.1·2 와 같은 규칙)
  const [peek, setPeek] = useState<{ n: number; line: [string, string] } | null>(null);
  const streak = useRef(0);
  const showPeek = (line: [string, string]) => setPeek((p) => ({ n: (p?.n ?? 0) + 1, line }));
  const res = useRef<Record<number, boolean>>(snap?.res ?? {});
  const logs = useRef<LogItem[]>([]);
  const score = useRef<{ right: number; total: number } | null>(null);
  const { noSpeak } = useLearnPrefs();
  const { soundOff, toggleSound } = useSoundToggle();
  const { finish, celebrate, finished } = useStepFinish(ctx);
  const t = tasks[Math.min(i, tasks.length - 1)];
  const last = i >= tasks.length - 1;

  useEffect(() => () => void Tts.stop(), []);

  const done = () => {
    const r = Object.values(res.current);
    finish(score.current ?? (r.length ? { right: r.filter(Boolean).length, total: r.length } : null));
  };
  const next = () => {
    Tts.stop();
    setKickOver(null);
    if (i >= tasksRef.current.length - 1) {
      done();
      return;
    }
    setI(i + 1);
  };

  const rt: Runner = useMemo(
    () => ({
      soundOff,
      noSpeak,
      toggleNoSpeak: () => {
        // 켜고 끄면 지금 문제를 처음부터 (프로토타입 NS_RE)
        Tts.stop();
        setNoSpeak(!noSpeak);
        sfx('toggle');
        setNonce((n) => n + 1);
      },
      goLabel: last ? '완료하기' : '다음',
      next,
      mark: (ok) => {
        const first = !(i in res.current);
        res.current = { ...res.current, [i]: ok };
        if (!first) return;
        streak.current = ok ? streak.current + 1 : 0;
        if (ok && streak.current >= 2 && streak.current % 2 === 0) setTimeout(() => showPeek([pickOne(CHEER_STREAK), '']), 900);
      },
      peek: showPeek,
      combo,
      setCombo,
      log: (x) => logs.current.push(x),
      logs: () => logs.current,
      insert: (add) => setTasks((list) => [...list.slice(0, i + 1), ...add, ...list.slice(i + 1)]),
      replaceRest: (add) => setTasks((list) => [...list.slice(0, i + 1), ...add]),
      setScore: (right, total) => {
        score.current = { right, total };
      },
      setKick: setKickOver,
      again: () => setNonce((n) => n + 1),
      source: ctx.source,
      bestKey: key,
    }),
    // next 는 i · tasks 가 바뀌면 새로 만들어져요
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [soundOff, noSpeak, last, combo, i, tasks, ctx.source, key],
  );

  // X → '정말 그만할까요?' → 그만하면 슬픈 소리 + 멈춘 곳 저장
  const quit = () => {
    // 슬픈 소리는 확인 창이 내요 (confirmSfx)
    setAskQuit(false);
    Tts.stop();
    if (i > 0 && i < tasks.length) {
      saveRun(key, { tasks, i, res: res.current });
      savePos(key, i);
      showToast('여기까지 저장했어요');
    }
    leave34();
  };
  const left = tasks.length - i;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <LessonTop index={i} total={tasks.length} soundOff={soundOff} onToggleSound={toggleSound} onClose={() => setAskQuit(true)} />
      <Kicker text={kickOver ?? t.kick ?? kick} />
      <RunnerCtx.Provider value={rt}>
        <View style={styles.flex}>
          <Block key={`${i}:${nonce}:${noSpeak ? 1 : 0}${soundOff ? 1 : 0}`} task={t} />
        </View>
      </RunnerCtx.Provider>
      <Peek n={peek?.n ?? 0} line={peek?.line ?? null} bottom={PEEK_BOTTOM} />
      <ConfirmDialog
        open={askQuit && !finished}
        variant="card"
        title="정말 그만할까요?"
        message={left <= 1 ? '마지막 문제만 남았어요!' : `${left}문제만 더 하면 끝나요`}
        confirmLabel="그만하기"
        cancelLabel="계속하기"
        destructive
        confirmSfx="quit"
        onConfirm={quit}
        onCancel={() => setAskQuit(false)}
      />
      <ConfirmDialog
        open={askResume && !askQuit}
        variant="card"
        image={IMG.yellow}
        title="이어서 할까요?"
        message={`${snap?.i ?? 0}/${snap?.tasks.length ?? 0}까지 했어요`}
        confirmLabel="이어서 하기"
        cancelLabel="처음부터 시작하기"
        onConfirm={() => setAskResume(false)}
        onCancel={() => {
          dropRun(key);
          res.current = {};
          logs.current = [];
          setTasks(build());
          setI(0);
          setNonce((n) => n + 1);
          setAskResume(false);
        }}
      />
      {celebrate}
    </SafeAreaView>
  );
}

function Block({ task }: { task: Task34 }) {
  switch (task.type) {
    case 'say':
      return <SayBlock task={task} />;
    case 'pick':
      return <PickBlock task={task} />;
    case 'match':
      return <MatchBlock task={task} />;
    case 'explain':
      return <ExplainBlock task={task} />;
    case 'choose':
      return <ChooseBlock task={task} />;
    case 'blind':
      return <BlindBlock task={task} />;
    case 'duo':
      return <DuoBlock task={task} />;
    case 'score':
      return <ScoreBlock task={task} />;
    case 'read':
      return <ReadBlock task={task} />;
    case 'exprs':
      return <ExprsBlock task={task} />;
    case 'fill':
      return <FillBlock task={task} />;
  }
}

/** 아래 고정 칸(버튼 · 마이크) 위쪽 빈 곳에서 나와요 */
const PEEK_BOTTOM = 150;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  flex: { flex: 1, overflow: 'hidden' },
});
