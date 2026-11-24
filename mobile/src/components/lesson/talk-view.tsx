import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput, View, type ScrollViewInstance } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';

import { Pressable } from '@/components/ui/pressable';
import { saveExpressionToggle } from '@/components/lesson/bubbles';
import { GuestMsg, MarkButton, MyMsg } from '@/components/lesson/chat';
import { CheckIcon, SendIcon } from '@/components/lesson/icons';
import { LessonModal } from '@/components/lesson/lesson-modal';
import { Avatar, BulbButton, MicButton, ModeTabs, YellowButton } from '@/components/lesson/lesson-ui';
import { StudyLayout } from '@/components/lesson/study-layout';
import { StudyTop } from '@/components/lesson/study-top';
import { say, stopSay, useDictation, useSoundToggle } from '@/components/lesson/voice';
import { showToast } from '@/components/ui/toast';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import type { LessonData } from '@/data/lessons';
import { haptic, sfx } from '@/lib/feedback';
import { SPEECH_PROBLEM_TEXT } from '@/lib/speech';
import { fixedText, fixSentence, gradeTalk, patternsUsed, type FixPart } from '@/lib/words';
import { useLearnPrefs } from '@/state/learn-prefs';
import { useSavedExpressions } from '@/state/expressions';

/** 대화 설정: 상대 · 질문들 · 질문마다 예시 답 (프로토타입 chatCfg → D.talk) */
export type TalkConfig = { who: string; lines: [string, string][]; replies: string[][] };

type Msg = { who: 1; k?: number; say?: [string, string] } | { who: 0; en: string; k: number; retry?: boolean } | { react: true; g: 'good' | 'tip'; en?: string; why: string };

const MORE: [string, string][] = [
  ['Haha! Can you tell me a bit more?', '하하! 조금 더 말해 줄래요?'],
  ['Hmm, can you say it in a full sentence?', '음, 한 문장으로 말해 줄래요?'],
];

/**
 * AI 프리토킹 (프로토타입 talkView): Lily와 3번 주고받아요. 위: 진행 칸 1/3 + 오늘 패턴 칩(쓰면 노랑 + 체크).
 * 내 차례엔 연노랑 '…' 말풍선 + 통통 뛰는 팔로. 아래: 말하기 · 쓰기 탭 + 전구(예시 2개 → 누르면 쓰기 칸에 채움).
 * Lily 반응: 약함 → 칭찬 없이 '한 문장으로 답해 볼까요?' + 다시 물음(다음 질문으로 안 넘어감) · 보통 'I see.' · 좋음 초록 띠.
 * 끝나면 질문-대답 타임라인: 고칠 곳은 분홍 취소선 → 초록, 대답 카드마다 표현 저장(고친 문장 그대로). 프로토타입은 대본 · 실제 앱은 AI.
 */
export function TalkView({ D, C, title, source, onFinish, onLeave }: { D: LessonData; C: TalkConfig; title: string; source: string; onFinish: (s: { right: number; total: number }) => void; onLeave: () => void }) {
  const { noSpeak } = useLearnPrefs();
  const sound = useSoundToggle();
  const N = Math.min(3, C.replies.length);
  const P = D.patterns;
  const res = P.map((p) => p.re);
  const known = [...C.lines.map((l) => l[0]), ...C.replies.flat(), ...P.map((p) => p.short)];
  const [i, setI] = useState(0);
  const [log, setLog] = useState<Msg[]>([{ who: 1, k: 0 }]);
  const [mode, setMode] = useState<'voice' | 'write'>(noSpeak ? 'write' : 'voice');
  const [ex, setEx] = useState(false);
  const [draft, setDraft] = useState('');
  const [quit, setQuit] = useState(false);
  const retried = useRef<Record<number, true>>({});
  const scroll = useRef<ScrollViewInstance>(null);
  const savedList = useSavedExpressions();
  const done = i >= N;
  const mine = log.filter((m): m is Extract<Msg, { who: 0 }> => 'who' in m && m.who === 0 && !m.retry);
  const used = P.map((_, k) => mine.some((m) => patternsUsed(m.en, res)[k]));

  // 질문은 나올 때 한 번 읽어 줘요
  useEffect(() => {
    if (done) return;
    const t = setTimeout(() => say(C.lines[i][0], 0.95, C.who), 300);
    return () => clearTimeout(t);
  }, [i, done, C]);
  useEffect(() => {
    const t = setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(t);
  }, [log.length, ex]);

  const send = (raw: string) => {
    const v = raw.trim();
    if (!v) {
      showToast('영어로 한마디 적어 주세요');
      return;
    }
    const g = gradeTalk(v, res);
    sfx('send');
    setDraft('');
    setEx(false);
    // 약한 답: 같은 질문에서 한 번은 다시 물어요 (칭찬 없이, 다음 질문으로 안 넘어가요)
    if (g.k === 'weak' && !retried.current[i]) {
      retried.current[i] = true;
      setLog((l) => [...l, { who: 0, en: v, k: i, retry: true }, { react: true, g: 'tip', why: g.why }]);
      const more = MORE[i % MORE.length];
      setTimeout(() => {
        setLog((l) => [...l, { who: 1, say: more }]);
        say(more[0], 0.95, C.who);
      }, 800);
      return;
    }
    const before = used;
    const now = patternsUsed(v, res);
    if (now.some((x, k) => x && !before[k])) sfx('toggle');
    const rx: Msg = g.k === 'weak' ? { react: true, g: 'tip', en: 'Okay.', why: '다음엔 한 문장으로 말해 봐요' } : { react: true, g: g.k === 'good' ? 'good' : 'tip', en: g.k === 'good' ? (g.pattern ? 'Great answer!' : g.reason ? 'Oh, that makes sense!' : 'Nice!') : 'I see.', why: g.why };
    const ni = i + 1;
    if (ni < N) {
      setLog((l) => [...l, { who: 0, en: v, k: i }, rx]);
      setI(ni);
      setTimeout(() => setLog((l) => [...l, { who: 1, k: ni }]), 900);
    } else {
      sfx('correct');
      haptic('success');
      setLog((l) => [...l, { who: 0, en: v, k: i }]);
      setTimeout(() => setI(ni), 500);
    }
  };
  const sendRef = useRef(send);
  useEffect(() => {
    sendRef.current = send;
  });
  const mic = useDictation((t) => sendRef.current(t));

  const head = (
    <View style={styles.head}>
      <Avatar name={C.who} size={36} />
      <PText style={styles.headT}>{done ? `${C.who}와 이야기를 마쳤어요` : `${C.who}와 ${N}번 이야기해요`}</PText>
      <View style={styles.dots} accessibilityLabel={`${Math.min(i + 1, N)}/${N}`}>
        {Array.from({ length: N }, (_, k) => (
          <View key={k} style={StyleSheet.flatten([styles.dot, k < i && styles.dotOn, k === i && styles.dotNow])} />
        ))}
        <PText style={styles.dotsN} color={Colors.inkSub}>
          {Math.min(i + (done ? 0 : 1), N)}/{N}
        </PText>
      </View>
    </View>
  );
  const chips = (
    <View style={styles.pats}>
      {P.map((p, k) => (
        <View key={p.id} style={StyleSheet.flatten([styles.chip, used[k] && styles.chipOn])}>
          {used[k] ? <CheckIcon size={12} /> : null}
          <PText style={styles.chipText} color={used[k] ? Colors.ink : Colors.inkSub}>
            {p.short}
          </PText>
        </View>
      ))}
    </View>
  );

  const exs = (C.replies[i] ?? []).slice(0, 2);
  const foot = done ? (
    <YellowButton label="완료하기" onPress={() => onFinish({ right: used.filter(Boolean).length, total: P.length || 1 })} />
  ) : (
    <>
      {ex && (
        <View style={styles.exs}>
          {exs.map((x) => (
            <Pressable
              key={x}
              onPress={() => {
                mic.stop();
                setDraft(x);
                setMode('write');
                say(x, 0.92);
              }}
              accessibilityRole="button"
              accessibilityLabel={`예시 ${x}`}
              style={styles.ex}>
              <PText style={styles.exText}>{x}</PText>
            </Pressable>
          ))}
        </View>
      )}
      <View style={styles.hrow}>
        <BulbButton on={ex} label="예시 보기" onPress={() => setEx((e) => !e)} />
      </View>
      <ModeTabs
        tabs={[
          ['voice', '말하기'],
          ['write', '쓰기'],
        ]}
        value={mode}
        onChange={(m) => {
          mic.stop();
          setMode(m);
        }}
      />
      {mode === 'voice' && mic.problem ? (
        <PText style={styles.problem} color={Colors.inkSub}>
          {SPEECH_PROBLEM_TEXT[mic.problem]}
        </PText>
      ) : null}
      {mode === 'voice' ? (
        <MicButton listening={mic.listening} label="눌러서 말하기" disabled={!mic.available} onPress={() => mic.toggle(exs.flatMap((x) => x.split(' ')))} />
      ) : (
        <View style={styles.inp}>
          <TextInput value={draft} onChangeText={setDraft} placeholder="영어로 답해 보세요" placeholderTextColor="#A39C8E" style={styles.f} onSubmitEditing={() => send(draft)} returnKeyType="send" accessibilityLabel="내 대답" />
          <Pressable onPress={() => send(draft)} accessibilityRole="button" accessibilityLabel="보내기" style={({ pressed }) => StyleSheet.flatten([styles.send, pressed && styles.sendDown])}>
            <SendIcon />
          </Pressable>
        </View>
      )}
    </>
  );

  return (
    <View style={styles.flex}>
      <StudyTop title={title} soundOff={sound.soundOff} onToggleSound={sound.toggle} onClose={() => (done ? onLeave() : setQuit(true))} />
      <StudyLayout foot={foot} scrollRef={scroll}>
        {head}
        {done ? (
          <View style={styles.end}>
            <PText style={styles.endH} color={Colors.purple}>
              Great talk!
            </PText>
            <View style={styles.tl}>
              <View style={styles.tlLine} />
              {mine.map((m, k) => {
                const parts = fixSentence(m.en, known);
                const fixed = parts.some((p) => p.fix);
                const text = fixedText(parts);
                return (
                  <View key={k} style={styles.it}>
                    <View style={StyleSheet.flatten([styles.itDot, fixed && styles.itDotFx])} />
                    <PText style={styles.itQ} color={Colors.inkSub}>
                      {C.who} · {C.lines[m.k][0]}
                    </PText>
                    <View style={styles.itA}>
                      <PText style={styles.itAText}>
                        <TalkText parts={parts} patterns={res} fix />
                      </PText>
                      <View style={styles.itMk}>
                        <MarkButton saved={savedList.some((x) => x.en === text)} onPress={() => saveExpressionToggle({ en: text, ko: fixed ? '내가 고친 문장' : '내가 한 말', fixed: fixed ? text : undefined, source })} />
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
            {chips}
          </View>
        ) : (
          <>
            {chips}
            <View style={styles.chat}>
              {log.map((m, k) =>
                'react' in m ? (
                  <View key={k} style={StyleSheet.flatten([styles.react, m.g === 'good' ? styles.reactGood : styles.reactTip])}>
                    {m.en ? (
                      <PText style={styles.reactB} color={m.g === 'good' ? '#2F6B2A' : Colors.ink}>
                        {m.en}
                      </PText>
                    ) : null}
                    {m.why ? (
                      <PText style={styles.reactS} color={m.g === 'good' ? '#4F7F4A' : Colors.inkSub}>
                        {m.why}
                      </PText>
                    ) : null}
                  </View>
                ) : m.who === 1 ? (
                  <GuestMsg
                    key={k}
                    who={C.who}
                    en={(m.say ?? C.lines[m.k ?? 0])[0]}
                    ko={(m.say ?? C.lines[m.k ?? 0])[1]}
                    soundOff={sound.soundOff}
                    onSay={() => say((m.say ?? C.lines[m.k ?? 0])[0], 0.95, C.who)}
                    fresh={k === log.length - 1}
                  />
                ) : (
                  <MyMsg key={k} fresh={k === log.length - 1}>
                    <PText style={styles.meText} color={Colors.white}>
                      <TalkText parts={m.en.split(/(\s+)/).map((t) => ({ t }))} patterns={res} color={Colors.white} />
                    </PText>
                  </MyMsg>
                ),
              )}
              <Waiting />
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
          stopSay();
          onLeave();
        }}
      />
    </View>
  );
}

/** 문장 그리기: 오늘 패턴은 노란 형광펜, (fix 면) 틀린 말 분홍 취소선 + 고친 말 초록 (프로토타입 ftHTML) */
function TalkText({ parts, patterns, fix = false, color = Colors.ink }: { parts: FixPart[]; patterns: string[]; fix?: boolean; color?: string }) {
  const joined = parts.map((p) => p.fix ?? p.t).join('');
  const marks: [number, number][] = [];
  for (const re of patterns) {
    const r = new RegExp(re, 'ig');
    let m: RegExpExecArray | null;
    while ((m = r.exec(joined.replace(/[’]/g, "'")))) {
      marks.push([m.index, m.index + m[0].length]);
      if (!m[0].length) break;
    }
  }
  // 조각마다 문장 안 위치 [시작, 끝]
  const spans = parts.reduce<[number, number][]>((acc, p) => {
    const s0 = acc.length ? acc[acc.length - 1][1] : 0;
    return [...acc, [s0, s0 + (p.fix ?? p.t).length]];
  }, []);
  return (
    <>
      {parts.map((p, k) => {
        const shown = p.fix ?? p.t;
        const [a, b] = spans[k];
        if (p.fix && fix)
          return (
            <PText key={k} color={color}>
              <PText style={styles.x}>{p.t}</PText>{' '}
              <PText style={styles.o}>{p.fix}</PText>
            </PText>
          );
        const inMark = shown.trim() && marks.some(([x, y]) => a < y && b > x);
        return inMark ? (
          <PText key={k} style={styles.mark}>
            {shown}
          </PText>
        ) : (
          <PText key={k} color={color}>
            {shown}
          </PText>
        );
      })}
    </>
  );
}

/** 내 차례: 연노랑 '…' 말풍선(점이 물결) + 통통 뛰는 팔로 */
function Waiting() {
  const still = useReducedMotion();
  const hop = useSharedValue(0);
  useEffect(() => {
    if (still) return;
    hop.set(withRepeat(withTiming(1, { duration: 1100, easing: Easing.bezier(0.3, 0, 0.6, 1) }), -1, true));
    return () => cancelAnimation(hop);
  }, [still, hop]);
  const a = useAnimatedStyle(() => ({ transform: [{ translateY: -8 * hop.get() }] }));
  return (
    <View style={styles.wait} accessibilityLabel="내 차례">
      <View style={styles.waitBub}>
        {[0, 150, 300].map((d) => (
          <Dot key={d} delay={d} />
        ))}
      </View>
      <Animated.View style={a}>
        <Image source={require('@/assets/characters/c-upright-yellow.png')} style={styles.waitChar} contentFit="contain" />
      </Animated.View>
    </View>
  );
}
function Dot({ delay }: { delay: number }) {
  const still = useReducedMotion();
  const v = useSharedValue(0);
  useEffect(() => {
    if (still) return;
    v.set(withDelay(delay, withRepeat(withTiming(1, { duration: 550 }), -1, true)));
    return () => cancelAnimation(v);
  }, [still, v, delay]);
  const a = useAnimatedStyle(() => ({ opacity: 0.35 + 0.65 * v.get(), transform: [{ translateY: -3 * v.get() }] }));
  return <Animated.View style={[styles.waitDot, a]} />;
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  headT: { flexShrink: 1, fontFamily: Font.body900, fontSize: 16.5, lineHeight: 23 },
  dots: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 20, height: 7, borderRadius: 4, borderWidth: 1.5, borderColor: Colors.ink, backgroundColor: '#E6DFD0' },
  dotOn: { backgroundColor: Colors.yellow },
  dotNow: { backgroundColor: Colors.purple },
  dotsN: { marginLeft: 3, fontFamily: Font.display, fontSize: 11, lineHeight: 15 },
  pats: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#CFC7B6', backgroundColor: Colors.white },
  chipOn: { borderStyle: 'solid', borderColor: Colors.ink, backgroundColor: Colors.yellow },
  chipText: { fontFamily: Font.body800, fontSize: 12.5, lineHeight: 17 },
  chat: { gap: 12, marginTop: 6, paddingBottom: 6 },
  meText: { fontFamily: Font.body700, fontSize: 15, lineHeight: 22 },
  mark: { backgroundColor: Colors.yellow, color: Colors.ink },
  x: { color: '#C2416B', textDecorationLine: 'line-through' },
  o: { color: '#2E8B57', fontFamily: Font.body900, backgroundColor: '#E3F5EA' },
  react: { alignSelf: 'flex-start', marginLeft: 44, gap: 1, paddingVertical: 6, paddingHorizontal: 11, borderRadius: 12 },
  reactGood: { backgroundColor: '#EAF6E7' },
  reactTip: { backgroundColor: '#F4F0E6' },
  reactB: { fontFamily: Font.body900, fontSize: 13, lineHeight: 18 },
  reactS: { fontFamily: Font.body700, fontSize: 12, lineHeight: 17 },
  wait: { alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginRight: -4 },
  waitBub: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 42, paddingHorizontal: 15, borderRadius: 20, borderBottomRightRadius: 6, borderWidth: 2, borderColor: Colors.ink, borderBottomWidth: 5, backgroundColor: '#FFF6BF' },
  waitDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.ink },
  waitChar: { width: 58, height: 37, marginBottom: -6 },
  hrow: { flexDirection: 'row', justifyContent: 'flex-end' },
  exs: { gap: 6 },
  ex: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1.5, borderColor: '#F0E3A6', backgroundColor: '#FFF9D6' },
  exText: { fontFamily: Font.body800, fontSize: 14, lineHeight: 20 },
  inp: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  f: { flex: 1, minWidth: 0, height: 50, paddingVertical: 0, includeFontPadding: false, textAlignVertical: 'center', paddingHorizontal: 14, borderRadius: 16, borderWidth: 1.5, borderColor: '#D6CDBA', backgroundColor: Colors.white, fontFamily: Font.body600, fontSize: 15, color: Colors.ink },
  send: { width: 50, height: 53, borderRadius: 25, borderWidth: 2.5, borderColor: Colors.ink, borderBottomWidth: 5.5, backgroundColor: Colors.yellow, alignItems: 'center', justifyContent: 'center' },
  sendDown: { borderBottomWidth: 2.5, marginTop: 3 },
  problem: { textAlign: 'center', fontFamily: Font.body800, fontSize: 12.5, lineHeight: 17 },
  end: { marginTop: 14, marginBottom: 22, gap: 14 },
  endH: { fontFamily: Font.display, fontSize: 22, lineHeight: 28 },
  tl: { paddingLeft: 26, gap: 14 },
  tlLine: { position: 'absolute', left: 9, top: 6, bottom: 6, width: 2.5, borderRadius: 2, backgroundColor: '#DCD3F2' },
  it: {},
  itDot: { position: 'absolute', left: -23, top: 4, width: 14, height: 14, borderRadius: 7, borderWidth: 2.5, borderColor: Colors.ink, backgroundColor: Colors.yellow },
  itDotFx: { backgroundColor: '#F6D3DD' },
  itQ: { marginBottom: 4, fontFamily: Font.body700, fontSize: 12, lineHeight: 17 },
  itA: { paddingVertical: 9, paddingLeft: 12, paddingRight: 44, borderWidth: 2, borderColor: Colors.ink, borderRadius: 14, backgroundColor: Colors.white },
  itAText: { fontFamily: Font.body700, fontSize: 15, lineHeight: 23 },
  itMk: { position: 'absolute', right: 8, top: 0, bottom: 0, justifyContent: 'center' },
});
