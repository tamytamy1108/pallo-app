import { Image } from 'expo-image';
import * as Tts from 'expo-speech';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { offerChallenge } from '@/lib/chal-offer';
import { Pressable } from '@/components/ui/pressable';
import { Appear } from '@/components/ui/appear';
import { showToast } from '@/components/ui/toast';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { haptic, sfx } from '@/lib/feedback';
import { SPEECH_PROBLEM_TEXT, useSpeech } from '@/lib/speech';
import type { SceneWithContent } from '@/data/situation';
import type { Flow, MoreQ } from '@/data/situation-content';
import { toggleExpression, useIsSaved } from '@/state/expressions';
import { useLearnPrefs } from '@/state/learn-prefs';

import { Bulb, Check, Kbd, Mark, Mic, Send, Spk } from './icons';
import { Avatar, BigBtn, SUB, useSay } from './parts';
import { useQuizLevel } from './scene-store';
import { StepShell, useStepFinish } from './step-frame';
import { blankOne, dictOf, fixParts, FT_MORE, grade, marked, missionHits } from './talk-grade';

/** 대화 기록 한 줄: 직원 말(k = 질문 번호 · say = 다시 묻기) · 내 말 · 반응 */
type Msg = { who: 'staff'; k: number; say?: [string, string] } | { who: 'me'; en: string; k: number; retry?: boolean } | { who: 'react'; g: 'good' | 'tip' | 'ok'; en?: string; why?: string };

/** 프로토타입 chatCfg(talk · 상황 맵): 미션 3개 직원 말 → 장면 질문 6개 → 마무리 말. 추천 답 = 내 레벨 문장 근처 */
function talkCfg(X: Flow, more: MoreQ[], L: number) {
  const lines: [string, string][] = [...X.mis.map((m) => m.staff), ...more.map((q): [string, string] => [q[0], q[1]]), X.end];
  const replies = [...X.mis.map((m) => [...new Set([m.lv[L], m.lv[L < 4 ? L + 1 : L - 1], m.lv[Math.max(0, L - 1)], m.lv[Math.max(0, L - 2)]])].slice(0, 3)), ...more.map((q) => q[2])];
  return { lines, replies };
}

/**
 * AI 미션 대화 (프로토타입 talkView · 상황 맵 · v486).
 * 직원과 미션 3개를 해내고, 그 뒤에도 장면 이야기로 계속 물어봐요('대화 끝내기'로 마쳐요).
 * 말하기 · 쓰기 탭 (말하기가 어려워요면 처음부터 쓰기) · 전구 = 핵심 단어를 빈칸으로 둔 예시.
 * 끝나면 Great talk! — 내 말을 고쳐 보여 주고(분홍 취소선 → 초록) 표현함에 저장할 수 있어요.
 */
export function TalkStep({ sceneId, scene }: { sceneId: string; scene: SceneWithContent }) {
  const c = scene.content;
  const X = c.flow;
  const L = useQuizLevel();
  const { noSpeak } = useLearnPrefs();
  const say = useSay();
  const { finish, celebrate, finished } = useStepFinish(sceneId, 'talk');
  const [C] = useState(() => talkCfg(X, c.more, L));
  const [dict] = useState(() => dictOf(C.lines.map((l) => l[0]), C.replies, X.mis));
  const N = C.replies.length;
  const NM = X.mis.length;

  const [i, setI] = useState(0);
  const [log, setLog] = useState<Msg[]>([{ who: 'staff', k: 0 }]);
  const [mode, setMode] = useState<'say' | 'write'>(noSpeak ? 'write' : 'say');
  const [ex, setEx] = useState(false);
  const [draft, setDraft] = useState('');
  const [over, setOver] = useState(false);
  const retried = useRef<Record<number, true>>({});
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const done = over || i >= N;

  const mine = log.filter((m): m is Extract<Msg, { who: 'me' }> => m.who === 'me' && !m.retry);
  const used = X.mis.map((_, k) => mine.some((m) => missionHits(X.mis, m.en)[k]));

  // 새 직원 말이 나오면 읽어 줘요
  const lastStaff = [...log].reverse().find((m) => m.who === 'staff');
  const lastKey = lastStaff && lastStaff.who === 'staff' ? `${lastStaff.k}-${log.length}` : '';
  useEffect(() => {
    if (!lastStaff || lastStaff.who !== 'staff' || done) return;
    const line = lastStaff.say ?? C.lines[lastStaff.k];
    const t = setTimeout(() => say(line[0], 0.95, X.who), 300);
    return () => clearTimeout(t);
    // 새 말이 붙을 때만
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastKey]);

  const speech = useSpeech({
    onText: (t) => setDraft(t),
    onPause: () => speech.stop(),
    onEnd: (t) => {
      if (t.trim()) send(t);
    },
  });

  const send = (raw: string) => {
    const v = raw.trim();
    if (!v) {
      showToast('영어로 한마디 적어 주세요');
      return;
    }
    const g = grade(v, X.mis);
    sfx('tap');
    setDraft('');
    setEx(false);
    // 약한 답: 같은 질문에서 한 번은 '조금 더 말해 줄래요?' (다음 질문으로 안 넘어가요)
    if (g.k === 'weak' && !retried.current[i]) {
      retried.current[i] = true;
      const more = FT_MORE[i % FT_MORE.length];
      setLog((l) => [...l, { who: 'me', en: v, k: i, retry: true }, { who: 'react', g: 'tip', why: g.why }]);
      setTimeout(() => setLog((l) => [...l, { who: 'staff', k: i, say: more }]), 800);
      return;
    }
    const before = used;
    const now = missionHits(X.mis, v);
    if (now.some((x, k) => x && !before[k])) sfx('save');
    const rx: Msg = g.k === 'weak' ? { who: 'react', g: 'tip', en: 'Okay.', why: '다음엔 한 문장으로 말해 봐요' } : { who: 'react', g: g.k === 'good' ? 'good' : 'tip', en: g.en, why: g.why };
    const ni = i + 1;
    setI(ni);
    if (ni < N) {
      setLog((l) => [...l, { who: 'me', en: v, k: i }, rx]);
      setTimeout(() => setLog((l) => [...l, { who: 'staff', k: ni }]), 900);
    } else {
      sfx('correct');
      haptic('success');
      setLog((l) => [...l, { who: 'me', en: v, k: i }]);
    }
  };

  const mic = () => {
    if (speech.listening) {
      speech.stop();
      return;
    }
    Tts.stop();
    sfx('tap');
    showToast('듣고 있어요 · 영어로 말해 보세요');
    void speech.start(C.replies[i] ?? []);
  };

  const exs = (C.replies[i] ?? []).slice(0, 2).map((x) => blankOne(x, X.mis[i]));

  return (
    <StepShell sceneId={sceneId} title="AI 미션 대화" finished={finished || done} onQuit={() => speech.stop()}>
      <View style={styles.flex}>
        <ScrollView automaticallyAdjustKeyboardInsets keyboardShouldPersistTaps="handled" ref={scroll} style={styles.flex} contentContainerStyle={styles.body} onContentSizeChange={() => !done && log.length > 1 && scroll.current?.scrollToEnd({ animated: true })} showsVerticalScrollIndicator={false}>
          <View style={styles.head}>
            <Avatar who={X.who} size={36} color={X.c} />
            <PText style={styles.headB} numberOfLines={1}>
              {done ? `${X.who}와 이야기를 마쳤어요` : i < NM ? `${X.who}와 미션 대화` : `${X.who}와 계속 이야기해요`}
            </PText>
            <View style={styles.dots} accessibilityLabel={`미션 ${Math.min(i, NM)}/${NM}`}>
              {X.mis.map((_, k) => (
                <View key={k} style={[styles.dot, k < i && { backgroundColor: Colors.yellow }, k === i && { backgroundColor: Colors.purple }]} />
              ))}
              {!done ? (
                <PText style={styles.dotsEm} color={SUB}>
                  {i < NM ? (
                    <>
                      미션 <PText style={[styles.dotsEm, styles.dotsNum]}>{`${i + 1}/${NM}`}</PText>
                    </>
                  ) : (
                    `자유 대화 ${i - NM + 1}`
                  )}
                </PText>
              ) : null}
            </View>
          </View>

          {done ? (
            <TalkEnd X={X} C={C} log={log} dict={dict} used={used} scene={scene} />
          ) : (
            <>
              <Chips X={X} used={used} />
              <View style={styles.chat}>
                {log.map((m, k) => (
                  <Bubble key={k} m={m} X={X} lines={C.lines} />
                ))}
                <Wait />
              </View>
            </>
          )}
        </ScrollView>

        {done ? (
          <View style={styles.endFoot}>
            <BigBtn label="완료하기" onPress={() => finish({ right: used.filter(Boolean).length, total: X.mis.length })} />
          </View>
        ) : (
          <View style={styles.bar}>
            {ex ? (
              <Appear kind="rise" style={styles.exs}>
                {exs.map((x, k) => (
                  <Pressable
                    key={k}
                    onPress={() => {
                      setDraft(x);
                      setMode('write');
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={x}
                    style={styles.ex}>
                    <PText style={styles.exText}>{x}</PText>
                  </Pressable>
                ))}
              </Appear>
            ) : null}
            <View style={[styles.hrow, i >= NM && styles.hrowEnd]}>
              {i >= NM ? (
                <Pressable
                  onPress={() => {
                    sfx('correct');
                    speech.stop();
                    setOver(true);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="대화 끝내기"
                  style={styles.link}>
                  <PText style={styles.linkText}>대화 끝내기</PText>
                </Pressable>
              ) : null}
              <Pressable
                onPress={() => {
                  setEx((v) => !v);
                  sfx('tap');
                  haptic('select');
                }}
                accessibilityRole="button"
                accessibilityLabel="예시 보기"
                accessibilityState={{ selected: ex }}
                style={[styles.bulb, ex && { backgroundColor: Colors.yellow }]}>
                <Bulb />
              </Pressable>
            </View>
            <View style={styles.tabs} accessibilityRole="tablist">
              {(['say', 'write'] as const).map((k) => (
                <Pressable
                  key={k}
                  onPress={() => {
                    speech.stop();
                    setMode(k);
                    sfx('tap');
                  }}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: mode === k }}
                  style={[styles.tab, mode === k && styles.tabOn]}>
                  {k === 'say' ? <Mic color={mode === k ? Colors.ink : SUB} /> : <Kbd color={mode === k ? Colors.ink : SUB} />}
                  <PText style={styles.tabText} color={mode === k ? Colors.ink : SUB}>
                    {k === 'say' ? '말하기' : '쓰기'}
                  </PText>
                </Pressable>
              ))}
            </View>
            {mode === 'say' ? (
              <>
                {speech.problem ? (
                  <PText style={styles.problem} color={SUB}>
                    {SPEECH_PROBLEM_TEXT[speech.problem]}
                  </PText>
                ) : null}
                <BigBtn
                  label={speech.listening ? (draft || '듣고 있어요 · 눌러서 보내기') : '눌러서 말하기'}
                  onPress={mic}
                  disabled={!speech.available}
                  color={speech.listening ? '#C2416B' : Colors.purple}
                  textColor={Colors.white}
                  icon={<Mic color={Colors.white} />}
                />
              </>
            ) : (
              <View style={styles.inp}>
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  placeholder="영어로 답해 보세요"
                  placeholderTextColor="#A39C8E"
                  style={styles.field}
                  autoCapitalize="sentences"
                  autoCorrect={false}
                  returnKeyType="send"
                  onSubmitEditing={() => send(draft)}
                  accessibilityLabel="영어로 답해 보세요"
                />
                <Pressable onPress={() => send(draft)} accessibilityRole="button" accessibilityLabel="보내기" style={styles.send}>
                  <Send />
                </Pressable>
              </View>
            )}
          </View>
        )}
      </View>
      {celebrate}
    </StepShell>
  );
}

/** 미션 칩 (.ft-pats): 미션 문장을 쓰면 노랗게 */
function Chips({ X, used }: { X: Flow; used: boolean[] }) {
  return (
    <View style={styles.pats}>
      {X.mis.map((m, k) => (
        <View key={m.t} style={[styles.chip, used[k] && styles.chipOn]}>
          {used[k] ? <Check size={12} w={3} /> : null}
          <PText style={styles.chipText} color={used[k] ? Colors.ink : SUB}>
            {m.t}
          </PText>
        </View>
      ))}
    </View>
  );
}

function Bubble({ m, X, lines }: { m: Msg; X: Flow; lines: [string, string][] }) {
  if (m.who === 'react') {
    if (!m.en && !m.why) return null;
    const tone = m.g === 'good' ? styles.reactGood : m.g === 'tip' ? styles.reactTip : null;
    return (
      <Appear kind="rise" style={[styles.react, tone]}>
        {m.en ? <PText style={[styles.reactB, m.g === 'good' && { color: '#2F6B2A' }, m.g === 'tip' && { color: Colors.ink }]}>{m.en}</PText> : null}
        {m.why ? <PText style={styles.reactS} color={m.g === 'good' ? '#4F7F4A' : m.g === 'tip' ? SUB : '#6A5CA6'}>{m.why}</PText> : null}
      </Appear>
    );
  }
  if (m.who === 'me')
    return (
      <Appear kind="rise" style={styles.me}>
        <View style={styles.meB}>
          <PText style={styles.meText} color={Colors.white}>
            {m.en}
          </PText>
        </View>
      </Appear>
    );
  const L = m.say ?? lines[m.k];
  return (
    <Appear kind="rise" style={styles.staff}>
      <Avatar who={X.who} size={40} color={X.c} />
      <View style={styles.flex}>
        <View style={styles.staffB}>
          <PText style={styles.staffEn}>{L[0]}</PText>
          <PText style={styles.staffKo} color={SUB}>
            {L[1]}
          </PText>
          <StaffSay text={L[0]} who={X.who} />
        </View>
      </View>
    </Appear>
  );
}

function StaffSay({ text, who }: { text: string; who: string }) {
  const { noListen } = useLearnPrefs();
  const say = useSay();
  if (noListen) return null;
  return (
    <Pressable onPress={() => say(text, 0.95, who)} accessibilityRole="button" accessibilityLabel="다시 듣기" style={styles.staffSpk} hitSlop={6}>
      <Spk size={15} />
    </Pressable>
  );
}

/** 내 차례: 노란 말풍선 점 세 개 + 팔로 콩콩 (.ft-wait) */
function Wait() {
  const still = useReducedMotion();
  const hop = useSharedValue(0);
  const d = [useSharedValue(0), useSharedValue(0), useSharedValue(0)];
  useEffect(() => {
    if (still) return;
    hop.set(withRepeat(withTiming(1, { duration: 1100, easing: Easing.bezier(0.3, 0, 0.6, 1) }), -1, true));
    d.forEach((v, k) => v.set(withDelay(k * 150, withRepeat(withSequence(withTiming(1, { duration: 550 }), withTiming(0, { duration: 550 })), -1))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [still]);
  const hopStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -6 * hop.get() }] }));
  const s0 = useAnimatedStyle(() => ({ transform: [{ translateY: -3 * d[0].get() }], opacity: 0.45 + 0.55 * d[0].get() }));
  const s1 = useAnimatedStyle(() => ({ transform: [{ translateY: -3 * d[1].get() }], opacity: 0.45 + 0.55 * d[1].get() }));
  const s2 = useAnimatedStyle(() => ({ transform: [{ translateY: -3 * d[2].get() }], opacity: 0.45 + 0.55 * d[2].get() }));
  return (
    <View style={styles.wait} accessibilityLabel="내 차례">
      <View style={styles.waitBub}>
        {[s0, s1, s2].map((s, k) => (
          <Animated.View key={k} style={[styles.waitDot, s]} />
        ))}
      </View>
      <Animated.View style={hopStyle}>
        <Image source={require('@/assets/characters/c-upright-yellow.png')} style={styles.waitImg} contentFit="contain" />
      </Animated.View>
    </View>
  );
}

/** 끝: Great talk! — 질문과 내 답(고친 곳 표시) · 저장 */
function TalkEnd({ X, C, log, dict, used, scene }: { X: Flow; C: { lines: [string, string][] }; log: Msg[]; dict: Set<string>; used: boolean[]; scene: SceneWithContent }) {
  const pairs = log.filter((m): m is Extract<Msg, { who: 'me' }> => m.who === 'me' && !m.retry);
  return (
    <View style={styles.end}>
      <PText style={styles.endH}>Great talk!</PText>
      <View style={styles.tl}>
        <View style={styles.tlLine} />
        {pairs.map((m, k) => {
          const r = marked(fixParts(m.en, dict), X.mis);
          return (
            <View key={k} style={styles.it}>
              <View style={[styles.itDot, r.fixed && { backgroundColor: '#F6D3DD' }]} />
              <PText style={styles.itQ} color={SUB}>
                {X.who} · {C.lines[m.k][0]}
              </PText>
              <View style={styles.itA}>
                <PText style={styles.itText}>
                  {r.pieces.map((p, n) =>
                    p.fix ? (
                      <PText key={n} style={styles.itText}>
                        <PText style={[styles.itText, styles.strike]}>{p.t}</PText> <PText style={[styles.itText, styles.ins]}>{p.fix}</PText>
                      </PText>
                    ) : p.mark ? (
                      <PText key={n} style={[styles.itText, styles.mark]}>
                        {p.t}
                      </PText>
                    ) : (
                      p.t
                    ),
                  )}
                </PText>
                <SaveMine original={m.en} text={r.text} fixed={r.fixed} source={`${scene.title} · AI 미션 대화`} />
              </View>
            </View>
          );
        })}
      </View>
      <Chips X={X} used={used} />
    </View>
  );
}

/** 내 말 저장 (고쳤으면 고친 문장도 함께 — 표현 카드) */
function SaveMine({ original, text, fixed, source }: { original: string; text: string; fixed: boolean; source: string }) {
  const on = useIsSaved(original);
  return (
    <Pressable
      onPress={() => {
        const saved = toggleExpression({ en: original, ko: fixed ? '내가 고친 문장' : '내가 한 말', fixed: fixed ? text : undefined, source });
        sfx(saved ? 'save' : 'tap');
        haptic('select');
        if (saved) offerChallenge(original);
      }}
      accessibilityRole="button"
      accessibilityLabel="내 표현함에 저장"
      accessibilityState={{ selected: on }}
      style={[styles.mk, on && styles.mkOn]}>
      <Mark on={on} color={on ? Colors.ink : SUB} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  body: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  headB: { flexShrink: 1, fontFamily: Font.body900, fontSize: 16.5, lineHeight: 23 },
  dots: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 20, height: 7, borderRadius: 4, borderWidth: 1.5, borderColor: Colors.ink, backgroundColor: '#E6DFD0' },
  dotsEm: { marginLeft: 3, fontFamily: Font.body600, fontSize: 11, lineHeight: 15 },
  dotsNum: { fontFamily: Font.display, color: SUB },
  pats: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#CFC7B6', backgroundColor: Colors.white },
  chipOn: { borderStyle: 'solid', borderColor: Colors.ink, backgroundColor: Colors.yellow },
  chipText: { fontFamily: Font.body800, fontSize: 12.5, lineHeight: 17 },
  chat: { gap: 12, marginTop: 14, paddingBottom: 6 },
  staff: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', maxWidth: '90%' },
  staffB: { paddingVertical: 10, paddingLeft: 13, paddingRight: 48, borderRadius: 18, borderBottomLeftRadius: 6, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white },
  staffEn: { fontFamily: Font.body700, fontSize: 15, lineHeight: 15 * 1.45 },
  staffKo: { marginTop: 3, fontFamily: Font.body600, fontSize: 12, lineHeight: 17 },
  staffSpk: { position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: Colors.ink, backgroundColor: '#BFE4EC', alignItems: 'center', justifyContent: 'center' },
  me: { alignSelf: 'flex-end', maxWidth: '90%' },
  meB: { paddingVertical: 10, paddingHorizontal: 13, borderRadius: 18, borderBottomRightRadius: 6, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.ink },
  meText: { fontFamily: Font.body700, fontSize: 15, lineHeight: 15 * 1.45 },
  react: { alignSelf: 'flex-start', marginLeft: 44, gap: 1, paddingVertical: 6, paddingHorizontal: 11, borderRadius: 12, backgroundColor: '#F3EFFB' },
  reactGood: { backgroundColor: '#EAF6E7' },
  reactTip: { backgroundColor: '#F4F0E6' },
  reactB: { fontFamily: Font.body900, fontSize: 13, lineHeight: 18, color: Colors.purple },
  reactS: { fontFamily: Font.body700, fontSize: 12, lineHeight: 17 },
  wait: { alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginRight: -4 },
  waitBub: { flexDirection: 'row', gap: 6, alignItems: 'center', height: 40, paddingHorizontal: 15, borderRadius: 20, borderBottomRightRadius: 6, borderWidth: 2, borderColor: Colors.ink, backgroundColor: '#FFF6BF', boxShadow: '0 3px 0 #1E1A2B' },
  waitDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.ink },
  waitImg: { width: 58, height: 52, marginBottom: -6 },
  bar: { paddingTop: 10, paddingHorizontal: 16, paddingBottom: 18, gap: 10, backgroundColor: Colors.cream },
  exs: { gap: 6 },
  ex: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1.5, borderColor: '#F0E3A6', backgroundColor: '#FFF9D6' },
  exText: { fontFamily: Font.body800, fontSize: 14, lineHeight: 20 },
  hrow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: -2 },
  hrowEnd: { justifyContent: 'space-between', alignItems: 'center' },
  link: { height: 36, paddingHorizontal: 14, borderRadius: 18, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, justifyContent: 'center', boxShadow: '2px 2px 0 #1E1A2B' },
  linkText: { fontFamily: Font.body800, fontSize: 13, lineHeight: 18 },
  bulb: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: Colors.ink, backgroundColor: '#FFF6BF', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 0 #1E1A2B' },
  tabs: { flexDirection: 'row', gap: 6, padding: 4, borderRadius: 16, backgroundColor: '#EFE9DC' },
  tab: { flex: 1, height: 38, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  tabOn: { backgroundColor: Colors.white, boxShadow: '0 2px 0 #D8CFBE' },
  tabText: { fontFamily: Font.body900, fontSize: 13.5, lineHeight: 19 },
  problem: { textAlign: 'center', fontFamily: Font.body700, fontSize: 12.5, lineHeight: 18 },
  inp: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  field: { flex: 1, minWidth: 0, height: 50, paddingVertical: 0, includeFontPadding: false, textAlignVertical: 'center', borderRadius: 16, borderWidth: 1.5, borderColor: '#D6CDBA', backgroundColor: Colors.white, paddingHorizontal: 14, fontFamily: Font.body600, fontSize: 15, color: Colors.ink },
  send: { width: 50, height: 50, borderRadius: 25, borderWidth: 2.5, borderColor: Colors.ink, backgroundColor: Colors.yellow, alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 0 #1E1A2B' },
  endFoot: { paddingHorizontal: 16, paddingBottom: 18, paddingTop: 8 },
  end: { marginTop: 14, marginBottom: 22 },
  endH: { marginBottom: 14, fontFamily: Font.display, fontSize: 22, lineHeight: 28, color: Colors.purple },
  tl: { paddingLeft: 26, gap: 14 },
  tlLine: { position: 'absolute', left: 9, top: 6, bottom: 6, width: 2.5, borderRadius: 2, backgroundColor: '#DCD3F2' },
  it: {},
  itDot: { position: 'absolute', left: -23, top: 4, width: 14, height: 14, borderRadius: 7, borderWidth: 2.5, borderColor: Colors.ink, backgroundColor: Colors.yellow },
  itQ: { marginBottom: 4, fontFamily: Font.body700, fontSize: 12, lineHeight: 17 },
  itA: { paddingVertical: 9, paddingLeft: 12, paddingRight: 44, borderRadius: 14, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, justifyContent: 'center' },
  itText: { fontFamily: Font.body700, fontSize: 15, lineHeight: 15 * 1.55 },
  strike: { color: '#C2416B', textDecorationLine: 'line-through' },
  ins: { fontFamily: Font.body900, color: '#2E8B57', backgroundColor: '#E3F5EA' },
  mark: { backgroundColor: Colors.yellow },
  mk: { position: 'absolute', right: 8, top: '50%', marginTop: -15, width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, borderColor: '#D6CDBA', backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  mkOn: { borderColor: Colors.ink, backgroundColor: Colors.yellow },
});
