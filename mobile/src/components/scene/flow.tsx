import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Peek, useStreakCheer } from '@/components/lesson/peek';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { haptic, sfx } from '@/lib/feedback';
import type { Scene } from '@/data/situation';
import type { Flow, Moment } from '@/data/situation-content';
import { useLearnPrefs } from '@/state/learn-prefs';

import { Avatar, BigBtn, CHEER_BOTTOM, Drop, FeedbackFoot, Foot, Opt, PINK_INK, REACT_GOOD, ResultRow, ScoreCard, SpeakRound, SUB, pick, shuffle, useSay, type OptState } from './parts';
import { useQuizLevel } from './scene-store';
import { StepShell, useStepFinish } from './step-frame';

/** 장면 순간: 도착 → 요청 → 요청 → 돌발 → 마무리 (프로토타입 STEP_VIEW.flow 의 M) */
type Beat = Moment & { k: string; t?: string; twist?: string };
const beatsOf = (X: Flow): Beat[] => [
  { k: '도착', ...X.arrive },
  { k: '요청', ...X.mis[0] },
  { k: '요청', ...X.mis[1] },
  { ...X.twist, k: '돌발', twist: X.twist.k },
  { k: '마무리', ...X.mis[2] },
];

/**
 * 장면 롤플레이 (프로토타입 STEP_VIEW.flow · v480).
 * 직원 말에 대답 고르기 — 보기 = 내 레벨 문장, 다른 순간 문장이 헷갈리는 보기.
 * 자막: Lv.0 · 1 한국어 / Lv.2 영어 / Lv.3 · 4 자막 없이 듣고(답하면 열려요). 소리 끄기면 영어 글자로 보여 줘요.
 */
export function FlowStep({ sceneId, scene }: { sceneId: string; scene: Scene }) {
  const X = scene.content!.flow;
  const L = useQuizLevel();
  const M = beatsOf(X);
  const { finish, celebrate, finished } = useStepFinish(sceneId, 'flow');
  const [i, setI] = useState(0);
  const [res, setRes] = useState<boolean[]>([]);
  const cheer = useStreakCheer();
  const right = res.filter(Boolean).length;
  const end = i >= M.length;
  return (
    <StepShell sceneId={sceneId} progress={{ index: Math.min(i, M.length - 1), total: M.length }} finished={finished || end}>
      {end ? (
        <FlowEnd X={X} M={M} L={L} res={res} right={right} scene={scene} onDone={() => finish({ right, total: M.length })} />
      ) : (
        <BeatView
          key={i}
          X={X}
          M={M}
          i={i}
          L={L}
          scene={scene}
          onAnswered={(first) => {
            cheer.record(first);
            setRes((r) => [...r.slice(0, i), first]);
          }}
          onNext={() => setI(i + 1)}
        />
      )}
      {!end ? <Peek n={cheer.peek?.n ?? 0} line={cheer.peek?.line ?? null} bottom={CHEER_BOTTOM} /> : null}
      {celebrate}
    </StepShell>
  );
}

/** 위 진행 줄 (.fl-trk) */
function Track({ M, i }: { M: Beat[]; i: number }) {
  return (
    <View style={styles.trk} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {M.map((x, k) => (
        <View key={k} style={styles.trkItem}>
          <View style={[styles.trkBar, k < i && { backgroundColor: Colors.ink }, k === i && { backgroundColor: Colors.rosePink }]} />
          <PText style={styles.trkLabel} color={k === i ? Colors.ink : SUB}>
            {x.k}
          </PText>
        </View>
      ))}
    </View>
  );
}

/** 직원 말풍선 (.fl-bub · .fl-say) */
function StaffBubble({ X, en, ko, show, L, revealed }: { X: Flow; en: string; ko: string; show: boolean; L: number; revealed: boolean }) {
  const open = show || revealed;
  const koShown = L <= 1 || (!show && revealed);
  return (
    <View style={styles.bubRow}>
      <Avatar who={X.who} size={46} color={X.c} />
      <Drop dy={4} radius={18} style={styles.flex}>
        <View style={styles.say}>
          <PText style={styles.who} color={SUB}>
            {X.who} · {X.role}
          </PText>
          {open ? <PText style={styles.sayEn}>{en}</PText> : <PText style={styles.sayHid}>듣고 대답해요</PText>}
          {koShown ? (
            <PText style={styles.sayKo} color={SUB}>
              {ko}
            </PText>
          ) : null}
          <View style={styles.sayBtn}>
            <SpeakRound text={en} who={X.who} />
          </View>
        </View>
      </Drop>
    </View>
  );
}

function BeatView({ X, M, i, L, scene, onAnswered, onNext }: { X: Flow; M: Beat[]; i: number; L: number; scene: Scene; onAnswered: (first: boolean) => void; onNext: () => void }) {
  const { noListen } = useLearnPrefs();
  const say = useSay();
  const m = M[i];
  const ans = m.lv[L];
  const ansKo = m.kos[L] ?? m.ko;
  const show = L <= 2 || noListen;
  const [opts] = useState(() => shuffle([ans, ...shuffle(M.filter((_, k) => k !== i).map((x) => x.lv[L])).slice(0, 2)]));
  const [miss, setMiss] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [oops, setOops] = useState(0);
  const [rx] = useState(() => pick(REACT_GOOD));

  useEffect(() => {
    const t = setTimeout(() => say(m.staff[0], L >= 3 ? 0.98 : 0.88, X.who), 350);
    return () => clearTimeout(t);
    // 순간마다 한 번 (key 로 새로 그려요)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const choose = (o: string) => {
    if (done) return;
    const ok = o === ans;
    if (!ok && !miss) {
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
    setTimeout(() => say(ans, 0.92), 250);
  };
  const stateOf = (o: string): OptState => (o === miss ? 'wrong' : !done ? 'idle' : o === ans ? 'right' : o === done ? 'wrong' : 'done');
  const ok = done === ans;

  return (
    <View style={styles.flex}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Track M={M} i={i} />
        {m.twist ? <PText style={styles.tw}>{m.twist}</PText> : null}
        <StaffBubble X={X} en={m.staff[0]} ko={m.staff[1]} show={show} L={L} revealed={!!done} />
        <View style={styles.opts} accessibilityLabel="보기">
          {opts.map((o, k) => (
            <Opt key={`${k}-${o}`} label={o} sub={done && o === ans && ansKo ? ansKo : undefined} state={stateOf(o)} onPress={() => choose(o)} />
          ))}
        </View>
      </ScrollView>
      {!done ? <Peek n={oops} line={oops ? ['한 번 더 골라 봐요', '기회가 한 번 남았어요!'] : null} bottom={40} /> : null}
      {done ? (
        <Foot>
          <FeedbackFoot
            ok={ok}
            title={ok ? rx[0] : 'Almost!'}
            sub={ok ? rx[1] : `정답 · ${ans}`}
            say={ans}
            ko={ansKo}
            source={`${scene.title} · 장면 롤플레이`}
            next={i < M.length - 1 ? '다음 상황' : '결과 보기'}
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

function FlowEnd({ X, M, L, res, right, scene, onDone }: { X: Flow; M: Beat[]; L: number; res: boolean[]; right: number; scene: Scene; onDone: () => void }) {
  const say = useSay();
  useEffect(() => {
    const t = setTimeout(() => say(X.end[0], 0.92, X.who), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <View style={styles.flex}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Track M={M} i={M.length} />
        <StaffBubble X={X} en={X.end[0]} ko={X.end[1]} show L={L} revealed />
        <ScoreCard kick="한 번에 맞힌 대답" right={right} total={M.length} />
        <View style={styles.resList}>
          {M.map((x, k) => (
            <ResultRow key={k} ok={!!res[k]} head={`${x.k}${x.t ? ` · ${x.t}` : ''}`} en={x.lv[L]} ko={x.kos[L] ?? x.ko} source={`${scene.title} · 장면 롤플레이`} />
          ))}
        </View>
      </ScrollView>
      <Foot>
        <BigBtn label="완료하기" onPress={onDone} />
      </Foot>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  body: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 24, gap: 10 },
  trk: { flexDirection: 'row', gap: 6 },
  trkItem: { flex: 1, gap: 5 },
  trkBar: { height: 8, borderRadius: 4, backgroundColor: '#E2D9C7' },
  trkLabel: { textAlign: 'center', fontFamily: Font.body800, fontSize: 11, lineHeight: 15 },
  tw: { fontFamily: Font.body900, fontSize: 13, lineHeight: 18, color: PINK_INK },
  bubRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  say: { gap: 3, paddingTop: 10, paddingBottom: 12, paddingLeft: 14, paddingRight: 50, borderWidth: 2.5, borderColor: Colors.ink, borderTopLeftRadius: 4, borderTopRightRadius: 18, borderBottomRightRadius: 18, borderBottomLeftRadius: 18, backgroundColor: Colors.white },
  who: { fontFamily: Font.body800, fontSize: 11, lineHeight: 15 },
  sayEn: { fontFamily: Font.body800, fontSize: 16, lineHeight: 16 * 1.4 },
  sayHid: { fontFamily: Font.body800, fontSize: 14, lineHeight: 20, color: Colors.purple },
  sayKo: { fontFamily: Font.body700, fontSize: 12.5, lineHeight: 18 },
  sayBtn: { position: 'absolute', top: 10, right: 10 },
  opts: { gap: 10 },
  resList: { gap: 8 },
});
