import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AnswerTask } from '@/components/lesson/answer-task';
import { BuildTask } from '@/components/lesson/build-task';
import { LessonModal } from '@/components/lesson/lesson-modal';
import { LessonTop } from '@/components/lesson/lesson-top';
import { Kicker } from '@/components/lesson/lesson-ui';
import { MatchTask } from '@/components/lesson/match-task';
import { OrderTask } from '@/components/lesson/order-task';
import { Peek } from '@/components/lesson/peek';
import { PickTask } from '@/components/lesson/pick-task';
import { RoleTask } from '@/components/lesson/role-task';
import { ShadowTask } from '@/components/lesson/shadow-task';
import { TaskCtx, type TaskApi } from '@/components/lesson/task-layout';
import { stopSay, useSoundToggle } from '@/components/lesson/voice';
import { showToast } from '@/components/ui/toast';
import { CHEER_STREAK, pickOne, taskLimit, type Task } from '@/data/lessons';
import { haptic, sfx } from '@/lib/feedback';
import { clearPos, getSavedPos, getSnapshot, savePos, saveSnapshot } from '@/state/progress';
import { useLearnPrefs } from '@/state/learn-prefs';

/** 최종 점수: 문제마다 마지막 결과를 모아요 + 제한 시간 안에 맞힌 문제 수 (프로토타입 tkClose → LAST_SCORE) */
export type TaskScore = { right: number; total: number; timed: number; fast: number };

type Snap = { tasks: Task[]; i: number; res: Record<number, boolean>; times: Record<number, Time> };
type Time = { sec: number; lim: number; fast: boolean };

/**
 * 레슨 진행기 (프로토타입 #lesson · openTasks · tkRender): 한 화면에 문제 하나.
 * 위 줄(X · 진행 막대 · n/전체 · 문제 시계 · 소리) → 작은 회색 안내 → 문제 → 아래 버튼.
 * - X: '정말 그만할까요? · n문제만 더 하면 끝나요' → 그만하기면 슬픈 소리 + 멈춘 곳 저장
 * - 다시 열면 '이어서 할까요?' [이어서 하기 / 처음부터 시작하기]
 * - 두 번 연속 맞히면 보라 팔로가 빼꼼 응원
 */
export function TaskRunner({
  skey,
  kick,
  tasks: initial,
  source,
  resume,
  onDone,
  onLeave,
}: {
  /** 진도 키 (stepKey) — 멈춘 곳 · 최고 기록 */
  skey: string;
  kick: string;
  tasks: Task[];
  /** 표현 저장 출처 */
  source: string;
  /** 앞 화면에서 이미 골랐으면 묻지 않아요 */
  resume?: 'resume' | 'restart';
  onDone: (score: TaskScore) => void;
  onLeave: () => void;
}) {
  const { noSpeak } = useLearnPrefs();
  const sound = useSoundToggle();
  const [saved] = useState(() => {
    if (resume === 'restart') {
      clearPos(skey);
      return null;
    }
    const s = getSnapshot<Snap>(skey);
    if (s && s.i > 0 && s.i < s.tasks.length) return s;
    // 화면 상태를 못 남긴 채 앱을 다시 켰으면: 멈춘 문제 번호부터 (같은 문제 목록)
    const at = getSavedPos(skey);
    return at != null && at > 0 && at < initial.length ? { tasks: initial, i: at, res: {}, times: {} } : null;
  });
  const [tasks, setTasks] = useState<Task[]>(saved?.tasks ?? initial);
  const [i, setI] = useState(saved?.i ?? 0);
  const [res, setRes] = useState<Record<number, boolean>>(saved?.res ?? {});
  const [times, setTimes] = useState<Record<number, Time>>(saved?.times ?? {});
  const [start, setStart] = useState(() => Date.now());
  const [nonce, setNonce] = useState(0);
  const [askResume, setAskResume] = useState(!!saved && resume !== 'resume');
  const [quit, setQuit] = useState(false);
  const [peek, setPeek] = useState<{ n: number; line: [string, string] } | null>(null);
  const [footH, setFootH] = useState(0);
  const streak = useRef(0);
  // 결과 · 시간은 그리기를 기다리지 않고 바로 읽어야 해서 ref 에도 둬요
  const resRef = useRef(res);
  const timesRef = useRef(times);
  const task = tasks[i];
  const lim = taskLimit(task, noSpeak);

  const goTo = (k: number) => {
    stopSay();
    setI(k);
    setStart(Date.now());
    setNonce((n) => n + 1);
  };

  const finish = () => {
    stopSay();
    const r = Object.values(resRef.current);
    const T = Object.values(timesRef.current).filter((x) => x.lim);
    clearPos(skey);
    onDone({ right: r.filter(Boolean).length, total: r.length, timed: T.length, fast: T.filter((x) => x.fast).length });
  };

  const api: TaskApi = {
    task,
    index: i,
    total: tasks.length,
    isLast: i === tasks.length - 1,
    soundOff: sound.soundOff,
    noSpeak,
    source,
    mark: (ok, once) => {
      if (once && resRef.current[i] != null) return;
      const first = resRef.current[i] == null;
      resRef.current = { ...resRef.current, [i]: ok };
      setRes(resRef.current);
      if (!first) return;
      const sec = Math.round((Date.now() - start) / 1000);
      timesRef.current = { ...timesRef.current, [i]: { sec, lim, fast: !!(ok && lim && sec <= lim) } };
      setTimes(timesRef.current);
      // 보라 팔로는 늘 있지 않고 가끔: 두 번 연속 맞혔을 때만 잠깐 (틀렸을 땐 오답 리액션이 이미 나와요)
      if (ok) {
        streak.current += 1;
        if (streak.current >= 2 && streak.current % 2 === 0) setTimeout(() => setPeek((p) => ({ n: (p?.n ?? 0) + 1, line: [pickOne(CHEER_STREAK), ''] })), 900);
      } else streak.current = 0;
    },
    next: () => (i + 1 >= tasks.length ? finish() : goTo(i + 1)),
    again: () => {
      stopSay();
      setStart(Date.now());
      setNonce((n) => n + 1);
    },
    insertAfter: (add) => setTasks((ts) => [...ts.slice(0, i + 1), ...add, ...ts.slice(i + 1)]),
    peek: (line) => setPeek((p) => ({ n: (p?.n ?? 0) + 1, line })),
    setFootH,
  };

  const left = tasks.length - i;
  const timer = lim ? { start, limit: lim, result: times[i] ? { sec: times[i].sec, fast: times[i].fast } : undefined } : null;
  // 패턴 머리가 있는 문제는 위 작은 안내를 숨겨요 (프로토타입 #lesson:has(.tk-head.pat) #lsKick)
  const showKick = !(task.type === 'shadow' && task.head);

  return (
    <View style={styles.flex}>
      <LessonTop index={i} total={tasks.length} soundOff={sound.soundOff} onToggleSound={sound.toggle} onClose={() => setQuit(true)} timer={timer} />
      {showKick && (
        <View style={styles.kick}>
          <Kicker text={task.kick ?? kick} />
        </View>
      )}
      <View style={StyleSheet.flatten([styles.flex, showKick && styles.bodyTop])}>
        <TaskCtx.Provider value={api}>
          <Block key={`${i}:${nonce}`} task={task} api={api} recordKey={skey} />
        </TaskCtx.Provider>
        {task.type !== 'shadow' || peek ? <Peek n={peek?.n ?? 0} line={peek?.line ?? null} bottom={footH + 12} /> : null}
      </View>

      <LessonModal
        open={quit}
        img="purple"
        title="정말 그만할까요?"
        desc={left <= 1 ? '마지막 문제만 남았어요!' : `${left}문제만 더 하면 끝나요`}
        yes="계속하기"
        no="그만하기"
        onYes={() => setQuit(false)}
        onNo={() => {
          setQuit(false);
          sfx('quit');
          haptic('warning');
          stopSay();
          if (i > 0 && i < tasks.length) {
            savePos(skey, i, tasks.length);
            saveSnapshot(skey, { tasks, i, res: resRef.current, times: timesRef.current } satisfies Snap);
            showToast('여기까지 저장했어요');
          }
          onLeave();
        }}
      />
      <LessonModal
        open={askResume}
        img="yellow"
        title="이어서 할까요?"
        desc={`${i}/${tasks.length}까지 했어요`}
        yes="이어서 하기"
        no="처음부터 시작하기"
        onYes={() => setAskResume(false)}
        onNo={() => {
          setAskResume(false);
          clearPos(skey);
          resRef.current = {};
          timesRef.current = {};
          setRes({});
          setTimes({});
          setTasks(initial);
          goTo(0);
        }}
      />
    </View>
  );
}

function Block({ task, api, recordKey }: { task: Task; api: TaskApi; recordKey: string }) {
  switch (task.type) {
    case 'shadow':
      return (
        <ShadowTask
          task={task}
          soundOff={api.soundOff}
          noSpeak={api.noSpeak}
          source={api.source}
          onMark={(ok) => api.mark(ok)}
          onFootHeight={api.setFootH}
          onNext={api.next}
          nextLabel="다음"
        />
      );
    case 'order':
      return <OrderTask task={task} />;
    case 'role':
      return <RoleTask task={task} />;
    case 'build':
      return <BuildTask task={task} />;
    case 'match':
      return <MatchTask task={task} recordKey={recordKey} />;
    case 'answer':
      return <AnswerTask task={task} />;
    case 'pick':
      return <PickTask task={task} />;
  }
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  kick: { paddingHorizontal: 20, marginTop: 20 },
  bodyTop: { marginTop: 14 },
});
