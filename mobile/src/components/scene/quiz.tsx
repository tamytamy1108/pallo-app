import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Pressable } from '@/components/ui/pressable';
import { Peek, useStreakCheer } from '@/components/lesson/peek';
import { showToast } from '@/components/ui/toast';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { haptic, sfx } from '@/lib/feedback';
import { MY_QUIZ_LEVELS, sceneStepKey, type QuizLevel, type SceneWithContent } from '@/data/situation';
import { useLearnPrefs } from '@/state/learn-prefs';
import { savePos } from '@/state/progress';

import { Spk } from './icons';
import { LevelPick } from './level-pick';
import { optionsOf, quizItems, type QuizItem, type QuizPart } from './quiz-items';
import { BigBtn, CHEER_BOTTOM, Drop, FeedbackFoot, Foot, Kick, Opt, PressDrop, REACT_GOOD, ResultRow, ScoreCard, SUB, pick, shuffle, useSay, type OptState } from './parts';
import { clearQuizPos, getBest, getQuizLevel, getQuizPos, pickLevel, saveBest, saveQuizPos, setQuizLevel, useLevelPicked } from './scene-store';
import { StepShell, useStepFinish } from './step-frame';

type Run = { lv: QuizLevel; items: QuizItem[]; order: number[]; i: number; right: number; res: (boolean | undefined)[] };

const newRun = (scene: SceneWithContent, lv: QuizLevel): Run => {
  const items = quizItems(scene.content, lv);
  return { lv, items, order: shuffle(items.map((_, k) => k)), i: 0, right: 0, res: [] };
};

/**
 * 상황 퀴즈 (프로토타입 STEP_VIEW.choice · exq). 15문제 · 고른 레벨의 방식으로.
 * 보기는 문제 바로 아래, 아래 고정 칸에는 정답 반응 + 다음 버튼 (v479). 처음 틀리면 그 보기만 지우고 한 번 더.
 * 결과: 맞힌 문제 · 문제별 다시 듣기 · 저장 · 'Lv.N로도 풀어 보기'(병행 레벨 중 안 푼 것) 또는 '다른 난이도로 다시 풀기'.
 */
export function QuizStep({ sceneId, scene }: { sceneId: string; scene: SceneWithContent }) {
  const picked = useLevelPicked(scene.title);
  const { finish, celebrate, finished } = useStepFinish(sceneId, 'exq');
  const [run, setRun] = useState<Run>(() => {
    const lv = getQuizLevel();
    const saved = getQuizPos(sceneId);
    const r = newRun(scene, saved?.lv ?? lv);
    return saved && saved.order.length === r.items.length ? { ...r, order: saved.order, i: saved.i, right: saved.right, res: saved.res } : r;
  });
  const [phase, setPhase] = useState<'pick' | 'q' | 'result'>(picked ? 'q' : 'pick');
  const [pickFrom, setPickFrom] = useState<'first' | 'again'>('first');
  const cheer = useStreakCheer();

  useEffect(() => {
    if (getQuizPos(sceneId)) {
      const t = setTimeout(() => showToast(`${run.i + 1}번 문제부터 이어서 해요`), 300);
      return () => clearTimeout(t);
    }
    // 처음 한 번만
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const N = run.items.length;

  // 문제를 넘길 때마다 멈춘 곳을 남겨요 — 그만하기 없이 앱이 꺼져도 이어서 해요
  useEffect(() => {
    if (phase !== 'q' || run.i <= 0 || run.i >= N) return;
    saveQuizPos(sceneId, { i: run.i, right: run.right, order: run.order, res: run.res, lv: run.lv });
    savePos(sceneStepKey(sceneId, 'exq'), run.i);
  }, [phase, run, N, sceneId]);

  const start = (lv: QuizLevel) => {
    clearQuizPos(sceneId);
    setRun(newRun(scene, lv));
    setPhase('q');
  };

  // 그만할 때 멈춘 곳 저장 (프로토타입 saveStepPos)
  const [answered, setAnswered] = useState(false);
  const onQuit = () => {
    if (phase !== 'q') return;
    const i = answered ? run.i + 1 : run.i;
    if (i <= 0 || i >= N) return;
    saveQuizPos(sceneId, { i, right: run.right, order: run.order, res: run.res, lv: run.lv });
    savePos(sceneStepKey(sceneId, 'exq'), i);
    showToast(`${i}/${N} 저장했어요 · 이어서 할 수 있어요`);
  };

  const index = phase === 'q' ? run.i : Math.max(0, N - 1);
  return (
    <StepShell sceneId={sceneId} progress={phase === 'pick' && pickFrom === 'first' ? undefined : { index, total: N }} title="상황 퀴즈" finished={finished || phase === 'result'} onQuit={onQuit}>
      {phase === 'pick' ? (
        <LevelPick
          title={scene.title}
          mode="quiz"
          initial={pickFrom === 'again' ? run.lv : MY_QUIZ_LEVELS.includes(getQuizLevel()) ? getQuizLevel() : (MY_QUIZ_LEVELS[0] ?? 1)}
          best={getBest(scene.title)}
          onGo={(lv) => {
            pickLevel(scene.title, lv);
            start(lv);
          }}
        />
      ) : phase === 'q' ? (
        <Question
          key={`${run.lv}-${run.i}`}
          scene={scene}
          item={run.items[run.order[run.i]]}
          last={run.i >= N - 1}
          onAnswered={(first) => {
            setAnswered(true);
            cheer.record(first);
            setRun((r) => {
              const res = [...r.res];
              res[r.order[r.i]] = first;
              return { ...r, right: r.right + (first ? 1 : 0), res };
            });
          }}
          onNext={() => {
            setAnswered(false);
            if (run.i + 1 >= N) {
              saveBest(scene.title, run.lv, run.right);
              clearQuizPos(sceneId);
              setPhase('result');
            } else setRun((r) => ({ ...r, i: r.i + 1 }));
          }}
        />
      ) : (
        <Result
          scene={scene}
          run={run}
          onAgain={(next) => {
            sfx('tap');
            if (next != null) {
              setQuizLevel(next);
              start(next);
              showToast(`Lv.${next} 난이도로 같은 상황을 다시 풀어요`);
            } else {
              setPickFrom('again');
              setPhase('pick');
            }
          }}
          onDone={() => finish({ right: run.right, total: N })}
        />
      )}
      {phase === 'q' ? <Peek n={cheer.peek?.n ?? 0} line={cheer.peek?.line ?? null} bottom={CHEER_BOTTOM} /> : null}
      {celebrate}
    </StepShell>
  );
}

/* ---------- 문제 한 개 ---------- */
function Question({ scene, item, last, onAnswered, onNext }: { scene: SceneWithContent; item: QuizItem; last: boolean; onAnswered: (first: boolean) => void; onNext: () => void }) {
  const say = useSay();
  const [opts] = useState(() => optionsOf(item));
  const [miss, setMiss] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [oops, setOops] = useState(0);
  const [rx] = useState(() => pick(REACT_GOOD));

  useEffect(() => {
    if (!item.auto) return;
    const t = setTimeout(() => say(item.auto ?? '', 0.92), 300);
    return () => clearTimeout(t);
    // 문제가 바뀔 때 한 번 (key 로 새로 그려요)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const choose = (o: string) => {
    if (done) return;
    const ok = o === item.ans;
    if (!ok && !miss) {
      // 처음 틀리면 그 보기만 지우고 한 번 더 (oopsPop)
      setMiss(o);
      sfx('wrong');
      haptic('error');
      setOops((n) => n + 1);
      return;
    }
    setDone(o);
    sfx(ok ? 'correct' : 'wrong');
    haptic(ok ? 'success' : 'error');
    onAnswered(ok && !miss);
  };

  const stateOf = (o: string): OptState => {
    if (o === miss) return 'wrong';
    if (!done) return 'idle';
    if (o === item.ans) return 'right';
    if (o === done) return 'wrong';
    return 'done';
  };
  const ok = done === item.ans;
  const source = `${scene.title} · 상황 퀴즈`;

  return (
    <View style={styles.flex}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Kick style={styles.kickTop}>{item.kick}</Kick>
        <Drop dx={4} dy={4} radius={22}>
          <View style={styles.qc}>
            <View style={styles.qcTop}>
              <Part part={item.top} top />
            </View>
            {item.q ? (
              <View style={styles.qcQ}>
                <Part part={item.q} />
              </View>
            ) : null}
          </View>
        </Drop>
        <View style={styles.opts} accessibilityLabel="보기">
          {opts.map((o, k) => (
            <Opt key={`${k}-${o}`} label={o} state={stateOf(o)} onPress={() => choose(o)} />
          ))}
        </View>
        {done && item.tip ? (
          <View style={styles.tip}>
            <PText style={styles.tipB} color="#2E5E9A">
              문법 팁
            </PText>
            <PText style={styles.tipS}>{item.tip}</PText>
          </View>
        ) : null}
      </ScrollView>
      {!done ? <Peek n={oops} line={oops ? ['한 번 더 골라 봐요', '기회가 한 번 남았어요!'] : null} bottom={40} /> : null}
      {done ? (
        <Foot>
          <FeedbackFoot
            ok={ok}
            title={ok ? rx[0] : 'Almost!'}
            sub={ok ? rx[1] : `정답 · ${item.q?.k === 'blank' ? item.mk[0] : item.ans}`}
            say={item.mk[0]}
            ko={item.mk[1]}
            source={source}
            next={last ? '결과 보기' : '다음 문제'}
            onNext={() => {
              sfx('tap');
              onNext();
            }}
          />
        </Foot>
      ) : null}
    </View>
  );
}

/** 문제 칸 하나 (.sq-word · .st-prompt · .sq-ctx · 빈칸 문장 · 말풍선) */
function Part({ part, top }: { part: QuizPart; top?: boolean }) {
  const { noListen } = useLearnPrefs();
  const say = useSay();
  switch (part.k) {
    case 'word':
      return <PText style={styles.word}>{part.text}</PText>;
    case 'prompt':
      return <PText style={styles.prompt}>{part.text}</PText>;
    case 'ctx':
      return (
        <PText style={top ? styles.ctx : styles.ctxSub} color={top ? Colors.ink : SUB}>
          {part.text}
        </PText>
      );
    case 'blank':
      return (
        <PText style={styles.blankLine}>
          {part.before}
          <View style={styles.blk} />
          {part.after}
        </PText>
      );
    case 'bubble': {
      // Lv.4: 글자 없이 듣기만 (답한 뒤에도 그대로) — 소리를 끄면 상대의 말을 글로 보여 줘요 (정답이 아니라 질문이라서)
      const hidden = part.hide && !noListen;
      return (
        <View style={[styles.bub, noListen && styles.bubNoSpk]}>
          <PText style={styles.bubWho} color={SUB}>
            {part.who}
          </PText>
          {hidden ? (
            <PText style={styles.bubHid} color={SUB}>
              듣고 답해요 · 스피커를 눌러 다시 들어요
            </PText>
          ) : (
            <PText style={styles.bubLine}>{part.line}</PText>
          )}
          {!noListen ? (
            <Pressable onPress={() => say(part.line, 0.92, part.who)} accessibilityRole="button" accessibilityLabel="다시 듣기" style={styles.sqSpk} hitSlop={6}>
              <Spk size={16} />
            </Pressable>
          ) : null}
        </View>
      );
    }
  }
}

/* ---------- 결과 ---------- */
function Result({ scene, run, onAgain, onDone }: { scene: SceneWithContent; run: Run; onAgain: (next: QuizLevel | null) => void; onDone: () => void }) {
  const N = run.items.length;
  const best = getBest(scene.title);
  // 병행 레벨 중 아직 안 푼 레벨이 있으면 'Lv.N로도 풀어 보기'
  const next = MY_QUIZ_LEVELS.find((n) => n !== run.lv && best[n] == null) ?? null;
  const source = `${scene.title} · 상황 퀴즈`;
  return (
    <View style={styles.flex}>
      <ScrollView style={styles.flex} contentContainerStyle={[styles.body, styles.resBody]} showsVerticalScrollIndicator={false}>
        <ScoreCard kick="맞힌 문제" right={run.right} total={N} note={run.right === N ? '하나도 안 틀렸어요!' : '틀린 문제는 아래에서 다시 들어 보세요.'} />
        <View style={styles.resList}>
          {run.order.map((k) => {
            const it = run.items[k];
            return <ResultRow key={k} ok={run.res[k] === true} en={it.mk[0]} ko={it.mk[1]} source={source} />;
          })}
        </View>
      </ScrollView>
      <Foot>
        <PressDrop onPress={() => onAgain(next)} dy={5} radius={27} inner={styles.again} accessibilityLabel={next != null ? `Lv.${next}로도 풀어 보기` : '다른 난이도로 다시 풀기'}>
          <PText style={styles.againText}>{next != null ? `Lv.${next}로도 풀어 보기` : '다른 난이도로 다시 풀기'}</PText>
        </PressDrop>
        <BigBtn label="완료하기" onPress={onDone} />
      </Foot>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 24, gap: 10 },
  resBody: { paddingTop: 14 },
  kickTop: { marginTop: 14 },
  qc: { borderWidth: 2, borderColor: Colors.ink, borderRadius: 22, backgroundColor: Colors.white, overflow: 'hidden' },
  qcTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 14, paddingHorizontal: 16 },
  qcQ: { paddingTop: 14, paddingHorizontal: 16, paddingBottom: 16, borderTopWidth: 2, borderColor: Colors.ink, backgroundColor: '#F6F1E4' },
  word: { flex: 1, fontFamily: Font.body900, fontSize: 26, lineHeight: 26 * 1.45, letterSpacing: -0.3 },
  prompt: { flex: 1, fontFamily: Font.body900, fontSize: 18, lineHeight: 18 * 1.45, letterSpacing: -0.3 },
  ctx: { flex: 1, fontFamily: Font.body700, fontSize: 15, lineHeight: 15 * 1.5 },
  ctxSub: { fontFamily: Font.body700, fontSize: 13, lineHeight: 13 * 1.5 },
  blankLine: { fontFamily: Font.body800, fontSize: 16, lineHeight: 16 * 1.6 },
  blk: { width: 64, height: 18, borderBottomWidth: 3, borderColor: Colors.ink },
  bub: { flex: 1, gap: 2, paddingVertical: 10, paddingLeft: 14, paddingRight: 44, borderWidth: 2, borderColor: Colors.ink, borderTopLeftRadius: 16, borderTopRightRadius: 16, borderBottomRightRadius: 16, borderBottomLeftRadius: 4, backgroundColor: '#F3EEFF' },
  bubNoSpk: { paddingRight: 14 },
  bubWho: { fontFamily: Font.display, fontSize: 10, lineHeight: 14, letterSpacing: 0.6 },
  bubLine: { fontFamily: Font.body800, fontSize: 16, lineHeight: 16 * 1.4 },
  bubHid: { fontFamily: Font.body700, fontSize: 13, lineHeight: 19 },
  sqSpk: { position: 'absolute', right: 8, top: '50%', marginTop: -16, width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.yellow, alignItems: 'center', justifyContent: 'center' },
  opts: { gap: 10 },
  tip: { marginTop: 10, gap: 2, paddingVertical: 10, paddingHorizontal: 14, borderWidth: 2, borderColor: Colors.ink, borderRadius: 14, backgroundColor: '#E9F4FF' },
  tipB: { fontFamily: Font.body900, fontSize: 11, lineHeight: 15, letterSpacing: 0.44 },
  tipS: { fontFamily: Font.body800, fontSize: 14, lineHeight: 14 * 1.45 },
  resList: { gap: 8 },
  again: { height: 54, borderRadius: 27, borderWidth: 2.5, borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  againText: { fontFamily: Font.body900, fontSize: 16, lineHeight: 22 },
});
