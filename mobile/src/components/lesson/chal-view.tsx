import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { GrowInput } from '@/components/ui/grow-input';
import { Pressable } from '@/components/ui/pressable';
import { CheckIcon, SpeakerIcon } from '@/components/lesson/icons';
import { LessonModal } from '@/components/lesson/lesson-modal';
import { BulbButton, GhostButton, MicButton, ModeTabs, YellowButton } from '@/components/lesson/lesson-ui';
import { StudyLayout } from '@/components/lesson/study-layout';
import { StudyTop } from '@/components/lesson/study-top';
import { say, stopSay, useSoundToggle } from '@/components/lesson/voice';
import { showToast } from '@/components/ui/toast';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { patRe, type LessonData } from '@/data/lessons';
import { sfx } from '@/lib/feedback';
import { SPEECH_PROBLEM_TEXT, useSpeech } from '@/lib/speech';
import { useLearnPrefs } from '@/state/learn-prefs';

const CH_SEC = 30;
const randomIndex = (n: number) => Math.floor(Math.random() * n);
type Graded = { used: boolean[]; words: number; sec: number; timeUp: boolean };

/**
 * 30초 말하기 챌린지 (프로토타입 STEP_VIEW.chal): 상황 카드 → [시작] → 30초 동안 말하기(또는 쓰기) → 오늘 패턴 사용 체크 + 모범 답
 * → [모범 답 따라 말하고 완료] (말하기가 어려우면 [완료]). 시간이 끝나면 마이크를 멈추고 칸을 잠가요 → 쓴 게 있으면 바로 채점.
 */
export function ChalView({ D, title, onShadow, onFinish, onLeave }: { D: LessonData; title: string; onShadow: (model: string, sit: string) => void; onFinish: () => void; onLeave: () => void }) {
  const { noSpeak } = useLearnPrefs();
  const sound = useSoundToggle();
  const [ci, setCi] = useState(() => randomIndex(D.chal.length));
  const [cm, setCm] = useState<'voice' | 'write'>(noSpeak ? 'write' : 'voice');
  const [started, setStarted] = useState(false);
  const [over, setOver] = useState(false);
  const [graded, setGraded] = useState<Graded | null>(null);
  const [text, setText] = useState('');
  const [left, setLeft] = useState(CH_SEC);
  const [hint, setHint] = useState(false);
  const [quit, setQuit] = useState(false);
  const textRef = useRef('');
  useEffect(() => {
    textRef.current = text;
  }, [text]);
  const [sit, model] = D.chal[ci];
  const voice = cm === 'voice';
  const run = started && !over && !graded;
  const speech = useSpeech({ onText: (t) => setText(t) });

  const grade = (timeUp: boolean, raw = text) => {
    const ans = raw.trim();
    if (!ans) {
      showToast(voice ? '마이크를 누르고 말해 보세요' : '영어로 적어 주세요');
      return;
    }
    speech.stop();
    const used = D.patterns.map((p) => patRe(p).test(ans.replace(/[’]/g, "'")));
    sfx(used.some(Boolean) ? 'correct' : 'tap');
    setGraded({ used, words: ans.split(/\s+/).filter(Boolean).length, sec: CH_SEC - Math.max(0, left), timeUp });
  };
  const gradeRef = useRef(grade);
  useEffect(() => {
    gradeRef.current = grade;
  });

  // 1초씩 줄어요 · 0이면 마이크를 멈추고 칸을 잠가요 → 쓴 게 있으면 채점
  useEffect(() => {
    if (!run) return;
    const iv = setInterval(() => {
      setLeft((l) => {
        const n = l - 1;
        if (n <= 0) {
          clearInterval(iv);
          setTimeout(() => {
            speech.stop();
            sfx('tap');
            if (textRef.current.trim()) gradeRef.current(true, textRef.current);
            else setOver(true);
          }, 0);
        }
        return Math.max(0, n);
      });
    }, 1000);
    return () => clearInterval(iv);
    // speech.stop 은 ref 로만 움직여요
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run]);

  const reset = (next?: number) => {
    speech.stop();
    stopSay();
    if (next != null) setCi(next);
    setStarted(false);
    setOver(false);
    setGraded(null);
    setText('');
    setLeft(CH_SEC);
  };
  const start = () => {
    reset();
    setStarted(true);
    sfx('big');
  };
  const nextSit = () => reset((ci + 1) % D.chal.length);
  const mm = (n: number) => `0:${String(Math.max(n, 0)).padStart(2, '0')}`;
  const nUsed = graded ? graded.used.filter(Boolean).length : 0;

  const foot = graded ? (
    <>
      <View style={styles.row}>
        <GhostButton label="다시 하기" onPress={() => reset()} style={styles.flex} />
        <GhostButton label="다른 상황" onPress={nextSit} style={styles.flex} />
      </View>
      <YellowButton label={noSpeak ? '완료' : '모범 답 따라 말하고 완료'} onPress={() => (noSpeak ? onFinish() : onShadow(model, sit))} />
    </>
  ) : (
    <>
      <View style={styles.hrow}>
        <BulbButton
          on={hint}
          label="힌트 · 오늘의 패턴"
          onPress={() => {
            setHint((h) => !h);
          }}
        />
      </View>
      <ModeTabs
        tabs={[
          ['voice', '말하기'],
          ['write', '쓰기'],
        ]}
        value={cm}
        onChange={(m) => {
          speech.stop();
          setCm(m);
        }}
      />
      {voice && speech.problem && run ? (
        <PText style={styles.problem} color={Colors.inkSub}>
          {SPEECH_PROBLEM_TEXT[speech.problem]}
        </PText>
      ) : null}
      {run && voice && (
        <MicButton
          listening={speech.listening}
          label="눌러서 말하기"
          disabled={!speech.available}
          onPress={() => {
            if (speech.listening) speech.stop();
            else {
              stopSay();
              void speech.start(D.patterns.map((p) => p.short));
            }
          }}
        />
      )}
      <View style={styles.row}>
        {!started || over ? <YellowButton label={over ? '다시 하기' : '시작'} onPress={start} style={styles.flex2} /> : <YellowButton label={voice ? '다 말했어요' : '다 적었어요'} onPress={() => grade(false)} style={styles.flex2} />}
        <GhostButton label="다른 상황" onPress={nextSit} style={styles.flex} />
      </View>
    </>
  );

  return (
    <View style={styles.flex}>
      <StudyTop title={title} soundOff={sound.soundOff} onToggleSound={sound.toggle} onClose={() => (graded ? onLeave() : setQuit(true))} />
      <StudyLayout foot={foot}>
        <View style={styles.sit}>
          <PText style={styles.sitK}>
            상황 카드 {ci + 1}/{D.chal.length}
          </PText>
          <PText style={styles.sitB}>{sit}</PText>
          <PText style={styles.sitS}>
            오늘의 패턴을 하나 이상 넣어 {CH_SEC}초 동안 {voice ? '말해' : '적어'} 보세요.
          </PText>
        </View>
        <PText style={styles.timer} color={over || (run && left <= 5) ? '#C2416B' : Colors.ink} accessibilityLabel={`남은 시간 ${left}초`}>
          {mm(left)}
        </PText>
        <GrowInput
          value={text}
          onChangeText={setText}
          multiline
          editable={run && !voice}
          placeholder={!started ? `시작을 누르고 영어로 ${voice ? '말해' : '적어'} 보세요` : voice ? '마이크를 누르고 말하면 여기에 적혀요' : '영어로 적어 보세요'}
          placeholderTextColor="#9A93A6"
          style={StyleSheet.flatten([styles.ta, !run && styles.taOff, run && !voice && styles.taOn])}
          accessibilityLabel="내 답"
        />
        {over && !graded && (
          <View style={styles.over}>
            <PText style={styles.overB} color="#B4233A">
              시간이 끝났어요
            </PText>
            <PText style={styles.overS} color={Colors.inkSub}>
              {voice ? '말한 내용이 없어요' : '적은 내용이 없어요'} · 다시 해 볼까요?
            </PText>
          </View>
        )}
        {hint && !graded && (
          <View style={styles.hint}>
            <PText style={styles.kick2} color={Colors.inkSub}>
              힌트 · 오늘의 패턴
            </PText>
            {D.patterns.map((p) => (
              <View key={p.id}>
                <PText style={styles.hintB}>{p.p}</PText>
                <PText style={styles.hintS} color={Colors.inkSub}>
                  {p.m}
                </PText>
              </View>
            ))}
          </View>
        )}
        {graded && (
          <>
            {graded.timeUp && (
              <PText style={styles.tup} color="#B4233A">
                시간이 끝나서 여기까지 채점했어요
              </PText>
            )}
            <View style={styles.used}>
              <PText style={styles.kick2} color={Colors.inkSub}>
                사용한 오늘의 패턴 {nUsed}/{graded.used.length}
              </PText>
              {D.patterns.map((p, i) => (
                <View key={p.id} style={styles.usedRow}>
                  <View style={StyleSheet.flatten([styles.usedI, graded.used[i] ? styles.usedOn : styles.usedOff])}>{graded.used[i] ? <CheckIcon size={13} /> : null}</View>
                  <PText style={styles.usedT} color={graded.used[i] ? Colors.ink : '#8C8597'}>
                    {p.p}
                  </PText>
                </View>
              ))}
              <PText style={styles.qko} color={Colors.inkSub}>
                {nUsed >= 2 ? '패턴을 자연스럽게 섞었어요!' : nUsed === 1 ? '좋아요. 다음엔 패턴 하나를 더 넣어 봐요.' : '아래 모범 답처럼 오늘의 패턴을 넣어 다시 해 봐요.'} · 단어 {graded.words}개 · {graded.sec}초
              </PText>
            </View>
            <View style={styles.model}>
              <View style={styles.modelH}>
                <PText style={styles.modelN}>모범 답</PText>
                {!sound.soundOff && (
                  <Pressable onPress={() => say(model)} accessibilityRole="button" accessibilityLabel="모범 답 듣기" style={styles.ib} hitSlop={4}>
                    <SpeakerIcon size={17} />
                  </Pressable>
                )}
              </View>
              <PText style={styles.modelT}>{model}</PText>
            </View>
          </>
        )}
      </StudyLayout>
      <LessonModal
        open={quit}
        img="purple"
        title="정말 그만할까요?"
        desc="여기까지 한 건 저장돼요"
        yes="계속하기"
        no="그만하기"
        onYes={() => setQuit(false)}
        onNo={() => {
          setQuit(false);
          sfx('quit');
          speech.stop();
          onLeave();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  flex2: { flex: 2, minWidth: 0 },
  row: { flexDirection: 'row', gap: 10 },
  hrow: { flexDirection: 'row', justifyContent: 'flex-end' },
  sit: { marginTop: 10, gap: 6, padding: 18, borderWidth: 2, borderColor: Colors.ink, borderRadius: 22, backgroundColor: Colors.rosePink, boxShadow: '4px 4px 0 #1E1A2B' },
  sitK: { fontFamily: Font.body900, fontSize: 11, lineHeight: 15 },
  sitB: { fontFamily: Font.body900, fontSize: 19, lineHeight: 27, letterSpacing: -0.3 },
  sitS: { fontFamily: Font.body700, fontSize: 13, lineHeight: 18 },
  timer: { fontFamily: Font.display, fontSize: 44, lineHeight: 54, textAlign: 'center', fontVariant: ['tabular-nums'] },
  ta: { minHeight: 84, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.cream, fontFamily: Font.body500, fontSize: 15, lineHeight: 22, color: Colors.ink, textAlignVertical: 'top' },
  taOff: { opacity: 0.55 },
  taOn: { backgroundColor: Colors.white },
  over: { gap: 2, paddingVertical: 12, paddingHorizontal: 14, borderWidth: 2, borderColor: '#C2416B', borderRadius: 22, backgroundColor: '#FFF1F3', alignItems: 'center' },
  overB: { fontFamily: Font.body900, fontSize: 14.5, lineHeight: 20 },
  overS: { fontFamily: Font.body700, fontSize: 12.5, lineHeight: 18 },
  hint: { gap: 6, paddingVertical: 12, paddingHorizontal: 14, borderWidth: 2, borderColor: Colors.ink, borderRadius: 22, backgroundColor: '#FFF9D6', boxShadow: '4px 4px 0 #1E1A2B' },
  kick2: { fontFamily: Font.body800, fontSize: 12, lineHeight: 17 },
  hintB: { fontFamily: Font.body900, fontSize: 15, lineHeight: 21 },
  hintS: { fontFamily: Font.body700, fontSize: 12.5, lineHeight: 17 },
  tup: { textAlign: 'center', fontFamily: Font.body900, fontSize: 13, lineHeight: 18 },
  used: { gap: 8, paddingVertical: 14, paddingHorizontal: 16, borderWidth: 2, borderColor: Colors.ink, borderRadius: 22, backgroundColor: Colors.white, boxShadow: '4px 4px 0 #1E1A2B' },
  usedRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  usedI: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  usedOn: { borderColor: Colors.ink, backgroundColor: Colors.yellow },
  usedOff: { borderColor: '#B9B2A3' },
  usedT: { fontFamily: Font.body800, fontSize: 14, lineHeight: 20 },
  qko: { fontFamily: Font.body700, fontSize: 13, lineHeight: 19 },
  model: { gap: 8, padding: 16, borderWidth: 2, borderColor: Colors.ink, borderRadius: 22, backgroundColor: Colors.white, boxShadow: '4px 4px 0 #1E1A2B', marginTop: 2 },
  modelH: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modelN: { fontFamily: Font.body900, fontSize: 11.5, lineHeight: 15 },
  ib: { width: 36, height: 36, borderRadius: 12, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  modelT: { fontFamily: Font.body900, fontSize: 15.5, lineHeight: 22 },
  problem: { textAlign: 'center', fontFamily: Font.body800, fontSize: 12.5, lineHeight: 17 },
});
