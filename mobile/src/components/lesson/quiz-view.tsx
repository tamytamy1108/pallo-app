import { Image } from 'expo-image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Pressable } from '@/components/ui/pressable';
import { SentenceCard } from '@/components/lesson/bubbles';
import { CheckIcon } from '@/components/lesson/icons';
import { LessonModal } from '@/components/lesson/lesson-modal';
import { ProgressBar } from '@/components/lesson/lesson-top';
import { BulbButton, GhostButton, MicButton, ModeTabs, YellowButton, type AnswerMode } from '@/components/lesson/lesson-ui';
import { Peek } from '@/components/lesson/peek';
import { StudyLayout } from '@/components/lesson/study-layout';
import { StudyTop } from '@/components/lesson/study-top';
import { say, stopSay, useDictation, useSoundToggle } from '@/components/lesson/voice';
import { makeWordBank, WordBank, wordBankText } from '@/components/lesson/word-bank';
import { showToast } from '@/components/ui/toast';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { BAD_REACTIONS, GOOD_REACTIONS, pickOne, speakItems, type LessonData } from '@/data/lessons';
import { haptic, sfx } from '@/lib/feedback';
import { SPEECH_PROBLEM_TEXT } from '@/lib/speech';
import { gradeWords, shuffled, type WordGrade } from '@/lib/words';
import { clearPos, getSnapshot, savePos, saveSnapshot } from '@/state/progress';
import { useLearnPrefs } from '@/state/learn-prefs';

type Snap = { order: number[]; i: number; right: number };
type Res = { g: WordGrade; ans: string; rx: [string, string] };

/**
 * 스피킹 퀴즈 (프로토타입 STEP_VIEW.speak): 한국어 보고 영어로. 탭: 단어 카드 · 말하기 · 직접 쓰기.
 * 단어별 채점(축약형은 펼쳐서 비교, 빠진 단어는 분홍 칸). 처음 틀리면 분홍 칸만 다시 · 두 번째도 틀리면 정답이 칸에 차례로.
 * 힌트: 카드 · 말하기 2단계, 쓰기 3단계(패턴 → 시작 부분 → 단어 조각). 힌트를 쓰면 맞혀도 정답 수에 안 들어가요.
 */
export function QuizView({ D, skey, source, onFinish, onLeave }: { D: LessonData; skey: string; source: string; onFinish: (s: { right: number; total: number }) => void; onLeave: () => void }) {
  const items = useMemo(() => speakItems(D), [D]);
  const { noSpeak } = useLearnPrefs();
  const sound = useSoundToggle();
  const [st, setSt] = useState<Snap>(() => {
    const s = getSnapshot<Snap>(skey);
    if (s && s.i > 0) return s;
    return { order: shuffled(items.length).slice(0, 8), i: 0, right: 0 };
  });
  const resumed = useRef(st.i > 0);
  useEffect(() => {
    if (resumed.current) showToast(`${st.i + 1}번 문제부터 이어서 해요`);
    // 처음 한 번만
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [quit, setQuit] = useState(false);
  const [footH, setFootH] = useState(0);
  const [peek, setPeek] = useState<{ n: number; line: [string, string] } | null>(null);
  const [answered, setAnswered] = useState(false);
  const n = st.order.length;
  const finished = st.i >= n;

  const close = () => {
    stopSay();
    if (st.i > 0 && st.i < n) {
      savePos(skey, st.i, n);
      saveSnapshot(skey, st);
      showToast(`${st.i}/${n} 저장했어요 · 이어서 할 수 있어요`);
    }
    onLeave();
  };

  return (
    <View style={styles.flex}>
      <StudyTop
        soundOff={sound.soundOff}
        onToggleSound={sound.toggle}
        onClose={() => (finished ? onLeave() : setQuit(true))}
        center={
          finished ? undefined : (
            <>
              <ProgressBar value={(st.i + (answered ? 1 : 0)) / n} />
              <PText style={styles.count}>
                {st.i + 1}/{n}
              </PText>
            </>
          )
        }
        title="스피킹 퀴즈"
      />
      {finished ? (
        <StudyLayout
          foot={
            <YellowButton
              label="완료하기"
              onPress={() => {
                clearPos(skey);
                onFinish({ right: st.right, total: n });
              }}
            />
          }>
          <View style={styles.score}>
            <Image source={require('@/assets/characters/c-upright-yellow.png')} style={styles.scoreChar} contentFit="contain" />
            <PText style={styles.kick2} color={Colors.inkSub}>
              힌트 없이 한 번에 맞힌 문장
            </PText>
            <PText style={styles.scoreNum}>
              {st.right}
              <PText style={styles.scoreOf}> / {n}</PText>
            </PText>
            <PText style={styles.qko} color={Colors.inkSub}>
              틀린 문장은 다음 복습 때 먼저 나와요.
            </PText>
          </View>
        </StudyLayout>
      ) : (
        <Question
          key={st.i}
          item={items[st.order[st.i]]}
          pool={items.flatMap((x) => x.en.split(/\s+/))}
          isLast={st.i === n - 1}
          noSpeak={noSpeak}
          soundOff={sound.soundOff}
          source={source}
          onFootH={setFootH}
          onOops={(line) => setPeek((p) => ({ n: (p?.n ?? 0) + 1, line }))}
          onAnswered={setAnswered}
          onNext={(right) => {
            setAnswered(false);
            setSt((s) => ({ ...s, i: s.i + 1, right: s.right + (right ? 1 : 0) }));
          }}
        />
      )}
      <Peek n={peek?.n ?? 0} line={peek?.line ?? null} bottom={footH + 12} />
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
          close();
        }}
      />
    </View>
  );
}

function Question({
  item,
  pool,
  isLast,
  noSpeak,
  soundOff,
  source,
  onFootH,
  onOops,
  onAnswered,
  onNext,
}: {
  item: { en: string; ko: string; hint: string };
  pool: string[];
  isLast: boolean;
  noSpeak: boolean;
  soundOff: boolean;
  source: string;
  onFootH: (h: number) => void;
  onOops: (line: [string, string]) => void;
  onAnswered: (v: boolean) => void;
  onNext: (rightFirst: boolean) => void;
}) {
  const [mode, setMode] = useState<AnswerMode>(noSpeak ? 'card' : 'voice');
  const [wb, setWb] = useState(() => makeWordBank(item.en, pool, 3));
  const [draft, setDraft] = useState('');
  const [hint, setHint] = useState(0);
  const [used, setUsed] = useState(false);
  const [tries, setTries] = useState(0);
  const [res, setRes] = useState<Res | null>(null);
  const [rightFirst, setRightFirst] = useState(false);
  const [chips] = useState(() => shuffled(item.en.split(/\s+/).length));
  const [chipUsed, setChipUsed] = useState<number[]>([]);
  const ws = item.en.split(/\s+/);
  const hMax = mode === 'write' ? 3 : 2;
  const again = !!(res && !res.g.perfect && tries < 2);
  const answer = useRef<(v: string) => void>(() => {});
  const mic = useDictation((v) => answer.current(v));
  const text = mode === 'card' ? wordBankText(wb) : mode === 'voice' ? mic.text : draft;
  useEffect(() => {
    onAnswered(!!res);
  }, [res, onAnswered]);

  const submit = (raw: string) => {
    const ans = raw.trim();
    if (!ans) {
      showToast(mode === 'card' ? '단어 카드를 눌러 문장을 만들어요' : mode === 'voice' ? '마이크를 누르고 말해 보세요' : '영어로 답을 적어 주세요');
      return;
    }
    const g = gradeWords(ans, item.en);
    const good = g.perfect;
    const rx = pickOne(good ? GOOD_REACTIONS : BAD_REACTIONS);
    const t = tries + 1;
    if (tries === 0 && good && !used) setRightFirst(true);
    setRes({ g, ans, rx });
    setTries(t);
    if (!good) {
      setDraft('');
      mic.setText('');
      setWb(makeWordBank(item.en, pool, 3));
      if (t < 2) onOops(['분홍 칸만 다시 해 봐요', '마지막 기회예요!']);
    }
    sfx(good ? 'correct' : 'wrong');
    haptic(good ? 'success' : 'error');
    if (good) say(item.en);
    else if (t >= 2) setTimeout(() => say(item.en), 900);
  };
  useEffect(() => {
    answer.current = (v) => {
      if (!res || again) submit(v);
    };
  });

  const switchMode = (m: AnswerMode) => {
    mic.stop();
    setMode(m);
    setDraft('');
    mic.setText('');
    setWb(makeWordBank(item.en, pool, 3));
    setHint((h) => Math.min(h, m === 'write' ? 3 : 2));
  };

  const shown = res && !again;
  const slotsState = res ? (res.g.perfect ? 'ok' : tries >= 2 ? 'ans' : 'no') : 'idle';

  const foot = shown ? (
    <>
      <View style={styles.react}>
        <Image source={res.g.perfect ? require('@/assets/characters/c-upright-yellow.png') : require('@/assets/characters/c-upright-purple.png')} style={styles.reactChar} contentFit="contain" />
        <View style={styles.flex}>
          <PText style={styles.reactEn} color={res.g.perfect ? Colors.purple : '#C2416B'}>
            {res.rx[0]}
          </PText>
          <PText style={styles.reactKo} color={Colors.inkSub}>
            {res.rx[1]}
            {res.g.perfect && tries > 1 ? ' · 두 번째에 맞혔어요' : ''}
          </PText>
        </View>
      </View>
      <YellowButton label={isLast ? '결과 보기' : '다음 문제'} onPress={() => onNext(rightFirst)} />
    </>
  ) : (
    <>
      <View style={styles.hrow}>
        <BulbButton
          on={hint > 0}
          n={hint || undefined}
          disabled={hint >= hMax}
          label={`힌트 ${hint}/${hMax}`}
          onPress={() => {
            setUsed(true);
            setHint((h) => Math.min(hMax, h + 1));
          }}
        />
      </View>
      <ModeTabs
        tabs={[
          ['card', '단어 카드'],
          ['voice', '말하기'],
          ['write', '쓰기'],
        ]}
        value={mode}
        onChange={switchMode}
      />
      {mode === 'voice' && mic.problem ? (
        <PText style={styles.problem} color={Colors.inkSub}>
          {SPEECH_PROBLEM_TEXT[mic.problem]}
        </PText>
      ) : null}
      {mode === 'voice' && <MicButton listening={mic.listening} label="눌러서 말하기" disabled={!mic.available} onPress={() => mic.toggle(ws)} />}
      {again ? (
        <View style={styles.row}>
          <GhostButton label="넘어가기" onPress={() => onNext(false)} style={styles.flex} />
          <YellowButton label="답변하기" onPress={() => submit(text)} style={styles.flex} />
        </View>
      ) : (
        <YellowButton label="답변하기" onPress={() => submit(text)} />
      )}
    </>
  );

  return (
    <StudyLayout foot={foot} onFootH={onFootH} bodyStyle={styles.bodyTop}>
      <PText style={styles.kick2} color={Colors.inkSub}>
        한국어를 보고 영어로 말해요
      </PText>
      <View style={styles.qc}>
        <View style={styles.qcTop}>
          <PText style={styles.prompt}>{item.ko}</PText>
        </View>
        <View style={StyleSheet.flatten([styles.slots, slotsState === 'ok' && styles.slotsOk, slotsState === 'ans' && styles.slotsAns])}>
          {res && (res.g.perfect || tries >= 2) ? (
            <View style={styles.lb}>
              {res.g.perfect ? <CheckIcon size={12} color="#2F6B2A" /> : null}
              <PText style={styles.lbText} color={res.g.perfect ? '#2F6B2A' : '#B4233A'}>
                정답
              </PText>
            </View>
          ) : null}
          {res
            ? res.g.words.map((w, k) =>
                res.g.ok[k] ? (
                  <PText key={k} style={styles.w} color={res.g.perfect ? '#2F6B2A' : Colors.ink}>
                    {w}
                  </PText>
                ) : !res.g.perfect && tries >= 2 ? (
                  <PText key={k} style={StyleSheet.flatten([styles.w, styles.wFill])} color="#C2416B">
                    {w}
                  </PText>
                ) : (
                  <PText key={k} style={StyleSheet.flatten([styles.w, styles.wMiss])} color="transparent">
                    {w}
                  </PText>
                ),
              )
            : ws.map((w, k) => <View key={k} style={StyleSheet.flatten([styles.slot, { width: Math.max(22, w.length * 10) }])} />)}
        </View>
      </View>
      {shown ? (
        <>
          {!res.g.perfect && (
            <PText style={styles.mine} color={Colors.inkSub}>
              내 답 · <PText style={styles.mineB}>{res.ans}</PText>
            </PText>
          )}
          <SentenceCard en={item.en} ko={item.ko} soundOff={soundOff} source={source} onSay={() => say(item.en)} />
        </>
      ) : (
        <>
          {hint > 0 && (
            <View style={styles.hint}>
              <PText style={styles.hintText}>
                ① 힌트 · <PText style={styles.hintB}>{item.hint}</PText>
              </PText>
              {hint >= 2 && (
                <PText style={styles.hintText}>
                  ② 시작 · <PText style={styles.hintB}>{ws.slice(0, Math.max(1, Math.ceil(ws.length / 3))).join(' ')} …</PText>
                </PText>
              )}
              {hint >= 3 && mode === 'write' && (
                <>
                  <PText style={styles.hintText}>③ 단어 조각 · 눌러서 입력</PText>
                  <View style={styles.chips}>
                    {chips.map((k) => (
                      <Pressable
                        key={k}
                        disabled={chipUsed.includes(k)}
                        onPress={() => {
                          setDraft((d) => (d.trim() ? `${d.trim()} ` : '') + ws[k]);
                          setChipUsed((u) => [...u, k]);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={ws[k]}
                        style={StyleSheet.flatten([styles.chip, chipUsed.includes(k) && styles.chipOff])}>
                        <PText style={styles.chipText}>{ws[k]}</PText>
                      </Pressable>
                    ))}
                  </View>
                </>
              )}
            </View>
          )}
          {mode === 'card' ? (
            <WordBank wb={wb} onChange={setWb} />
          ) : mode === 'voice' ? (
            mic.text ? (
              <View style={styles.said}>
                <PText style={styles.saidText}>{mic.text}</PText>
              </View>
            ) : null
          ) : (
            <TextInput value={draft} onChangeText={setDraft} multiline placeholder="영어로 적거나 마이크로 말해 보세요" placeholderTextColor="#A39C8E" style={styles.ta} accessibilityLabel="내 답" />
          )}
        </>
      )}
    </StudyLayout>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  row: { flexDirection: 'row', gap: 10 },
  bodyTop: { paddingTop: 26 },
  count: { fontFamily: Font.display, fontSize: 13, lineHeight: 17 },
  kick2: { fontFamily: Font.body800, fontSize: 12, lineHeight: 17 },
  qc: { borderWidth: 2, borderColor: Colors.ink, borderRadius: 22, backgroundColor: Colors.white, overflow: 'hidden', boxShadow: '4px 4px 0 #1E1A2B' },
  qcTop: { paddingVertical: 14, paddingHorizontal: 16 },
  prompt: { fontFamily: Font.body900, fontSize: 18, lineHeight: 26, letterSpacing: -0.3 },
  slots: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', columnGap: 7, rowGap: 6, minHeight: 30, paddingTop: 10, paddingHorizontal: 16, paddingBottom: 12, borderTopWidth: 2, borderStyle: 'dashed', borderColor: '#E3DCCB', backgroundColor: '#FBF8F1' },
  slotsOk: { backgroundColor: '#EAF6E7', borderColor: '#BFE0B9' },
  slotsAns: { backgroundColor: '#FFF1F3', borderColor: '#F5C7D2' },
  lb: { flexBasis: '100%', flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  lbText: { fontFamily: Font.body900, fontSize: 12, lineHeight: 16 },
  slot: { height: 4, borderRadius: 2, backgroundColor: '#CFC7B5', marginBottom: 6 },
  w: { fontFamily: Font.body900, fontSize: 19, lineHeight: 26 },
  wMiss: { minWidth: 24, borderBottomWidth: 3, borderColor: '#E9789B' },
  wFill: { borderBottomWidth: 3, borderColor: '#E9789B' },
  mine: { fontFamily: Font.body700, fontSize: 13.5, lineHeight: 20 },
  mineB: { fontFamily: Font.body800, fontSize: 13.5, lineHeight: 20, color: Colors.ink },
  hint: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#F1EBDC', gap: 3 },
  hintText: { fontFamily: Font.body700, fontSize: 13.5, lineHeight: 20 },
  hintB: { fontFamily: Font.body900, fontSize: 13.5, lineHeight: 20 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: { height: 36, paddingHorizontal: 12, borderRadius: 12, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, justifyContent: 'center' },
  chipOff: { opacity: 0.3 },
  chipText: { fontFamily: Font.body800, fontSize: 14, lineHeight: 19 },
  said: { minHeight: 50, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16, borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.ink },
  saidText: { fontFamily: Font.body800, fontSize: 16, lineHeight: 23, textAlign: 'center' },
  ta: { minHeight: 70, paddingVertical: 12, paddingHorizontal: 14, borderWidth: 2, borderColor: Colors.ink, borderRadius: 16, backgroundColor: Colors.white, fontFamily: Font.body600, fontSize: 16, lineHeight: 23, textAlignVertical: 'top' },
  hrow: { flexDirection: 'row', justifyContent: 'flex-end' },
  problem: { textAlign: 'center', fontFamily: Font.body800, fontSize: 12.5, lineHeight: 17 },
  react: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginBottom: 4 },
  reactChar: { width: 88, height: 70, marginBottom: -2 },
  reactEn: { fontFamily: Font.display, fontSize: 22, lineHeight: 27, letterSpacing: -0.4 },
  reactKo: { marginTop: 2, fontFamily: Font.body700, fontSize: 12.5, lineHeight: 18 },
  score: { alignItems: 'center', gap: 4, paddingVertical: 20, paddingHorizontal: 16, borderWidth: 2, borderColor: Colors.ink, borderRadius: 22, backgroundColor: Colors.white, boxShadow: '4px 4px 0 #1E1A2B', marginTop: 14 },
  scoreChar: { width: 120, height: 77 },
  scoreNum: { fontFamily: Font.display, fontSize: 46, lineHeight: 52 },
  scoreOf: { fontFamily: Font.display, fontSize: 18, lineHeight: 22 },
  qko: { fontFamily: Font.body700, fontSize: 13, lineHeight: 20, textAlign: 'center' },
});
