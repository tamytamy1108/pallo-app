import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View, type ScrollViewInstance, type TextInputInstance } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSequence, withTiming } from 'react-native-reanimated';

import { GrowInput } from '@/components/ui/grow-input';
import { Pressable } from '@/components/ui/pressable';
import { SparkIcon, SpeakerIcon } from '@/components/lesson/icons';
import { LessonModal } from '@/components/lesson/lesson-modal';
import { L, MicButton, ModeTabs, YellowButton } from '@/components/lesson/lesson-ui';
import { StudyLayout } from '@/components/lesson/study-layout';
import { StudyTop } from '@/components/lesson/study-top';
import { say, useDictation, useSoundToggle } from '@/components/lesson/voice';
import { showToast } from '@/components/ui/toast';
import { StudyButton } from '@/components/ui/study-button';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import type { LessonData } from '@/data/lessons';
import { haptic, sfx } from '@/lib/feedback';
import { SPEECH_PROBLEM_TEXT } from '@/lib/speech';
import { checkKeyword, type KeywordCheck } from '@/lib/words';
import { useLearnPrefs } from '@/state/learn-prefs';
import { getStepData, setStepData } from '@/state/progress';
import { ChipScroll } from '@/components/ui/chip-scroll';

type Saved = { pick: number | null; a: string[]; para: string };

/**
 * My Story (프로토타입 STEP_VIEW.story): 주제 칩 고르기 → 질문마다 키워드 칸(예시 키워드 2개 점선 칩)
 * → [키워드로 문단 만들기](다 채우기 전엔 흐림, 누르면 첫 빈칸으로 이동 · 강조) → 완성 문단(제목 옆 스피커로 전체 듣기)
 * → [완료하기] → 문장 순서 맞추기 → 한 문장씩 따라 읽기 (onParagraph 로 진행기에 넘겨요).
 * 키워드 검사: 입력을 멈추고 0.8초 뒤(또는 칸을 벗어날 때). 오타면 연보라 띠 + 후보 2개 + [그대로 둘게요]. 고치지 않으면 문단을 만들지 않아요.
 */
export function StoryView({ D, skey, onParagraph, onLeave }: { D: LessonData; skey: string; onParagraph: (para: string) => void; onLeave: () => void }) {
  const St = D.story;
  const { noSpeak } = useLearnPrefs();
  const sound = useSoundToggle();
  const [sv, setSv] = useState<Saved>(() => getStepData<Saved>(skey) ?? { pick: null, a: [], para: '' });
  useEffect(() => setStepData(skey, sv), [skey, sv]);
  const [kmode, setKmode] = useState<'voice' | 'write'>(noSpeak ? 'write' : 'voice');
  const firstEmpty = (a = sv.a) => {
    const k = St.qs.findIndex((_, i) => !(a[i] ?? '').trim());
    return k < 0 ? null : k;
  };
  const [kq, setKq] = useState(() => firstEmpty() ?? 0);
  const [checks, setChecks] = useState<Record<number, KeywordCheck>>({});
  const [keep, setKeep] = useState<Record<number, string>>({});
  const [flash, setFlash] = useState<{ k: number | 'chips'; n: number } | null>(null);
  const [quit, setQuit] = useState(false);
  const scroll = useRef<ScrollViewInstance>(null);
  const ys = useRef<Record<string, number>>({});
  const listY = useRef(0);
  const inputs = useRef<Record<number, TextInputInstance | null>>({});
  const timers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const exOf = (i: number) => (St.ex ? St.ex[sv.pick ?? 0][i] : []);
  const allExOf = (i: number) => (St.ex ? St.ex.flatMap((g) => g[i]) : []);
  const ready = sv.pick != null && St.qs.every((_, i) => (sv.a[i] ?? '').trim());

  const runCheck = (i: number, v: string) => {
    const t = v.trim();
    const r: KeywordCheck = !t || keep[i] === t ? { kind: 'ok' } : checkKeyword(t, exOf(i), allExOf(i));
    setChecks((c) => ({ ...c, [i]: r }));
    return r.kind !== 'bad';
  };
  const setKw = (i: number, v: string) => {
    setSv((s) => {
      const a = s.a.slice();
      a[i] = v;
      return { ...s, a };
    });
    runCheck(i, v);
    sfx('tap');
  };
  const scrollTo = (key: string) => {
    const y = ys.current[key];
    if (y != null) scroll.current?.scrollTo({ y: Math.max(0, listY.current + y - 80), animated: true });
  };
  const go = (i: number, noScroll = false) => {
    setKq(i);
    if (!noScroll) scrollTo(`q${i}`);
  };

  const mic = useDictation((t) => {
    const v = t.trim().replace(/[.!?]$/, '');
    if (!v) return;
    const a = sv.a.slice();
    a[kq] = v;
    setKw(kq, v);
    const nx = firstEmpty(a);
    if (nx != null) go(nx);
  });

  const build = () => {
    if (sv.pick == null) {
      showToast('먼저 이야기 주제를 골라요');
      setFlash((f) => ({ k: 'chips', n: (f?.n ?? 0) + 1 }));
      scrollTo('chips');
      sfx('wrong');
      return;
    }
    const empty = firstEmpty();
    if (empty != null) {
      showToast(`Q${empty + 1} 키워드를 채워 주세요`);
      setFlash((f) => ({ k: empty, n: (f?.n ?? 0) + 1 }));
      go(empty);
      setTimeout(() => inputs.current[empty]?.focus(), 450);
      sfx('wrong');
      return;
    }
    const badI = St.qs.map((_, i) => i).filter((i) => sv.a[i] && !runCheck(i, sv.a[i]));
    if (badI.length) {
      showToast(`Q${badI[0] + 1} 키워드를 고쳐 주세요 · 예시를 눌러도 돼요`);
      go(badI[0]);
      inputs.current[badI[0]]?.focus();
      return;
    }
    let k = 0;
    const ks = sv.a.filter(Boolean);
    const para = St.template.replace(/___/g, () => ks[k++] ?? '___');
    setSv((s) => ({ ...s, para }));
    sfx('correct');
    haptic('success');
    setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 120);
  };

  const done = () => {
    const p = sv.para.trim();
    if (/___/.test(p)) {
      showToast('빈칸(___)을 내 말로 채워 주세요');
      return;
    }
    onParagraph(p);
  };

  const foot = sv.para ? (
    <YellowButton label="완료하기" onPress={done} />
  ) : (
    <>
      <ModeTabs
        tabs={[
          ['voice', '말하기'],
          ['write', '쓰기'],
        ]}
        value={kmode}
        onChange={(m) => {
          mic.stop();
          setKmode(m);
          if (m === 'write') inputs.current[kq]?.focus();
        }}
      />
      {kmode === 'voice' && mic.problem ? (
        <PText style={styles.problem} color={Colors.inkSub}>
          {SPEECH_PROBLEM_TEXT[mic.problem]}
        </PText>
      ) : null}
      {kmode === 'voice' && !ready ? (
        <MicButton listening={mic.listening} label={`Q${kq + 1} 키워드 말하기`} disabled={!mic.available} onPress={() => mic.toggle(exOf(kq).flatMap((e) => e.split(' ')))} />
      ) : (
        <BuildButton ready={ready} onPress={build} />
      )}
    </>
  );

  return (
    <View style={styles.flex}>
      <StudyTop title="My Story" soundOff={sound.soundOff} onToggleSound={sound.toggle} onClose={() => setQuit(true)} />
      <StudyLayout foot={foot} scrollRef={scroll}>
        <PText style={styles.intro} color={Colors.inkSub}>
          {St.ask} 질문마다 키워드만 적으면, 키워드로 내 이야기 문단을 만들어 줘요. 그 문단으로 스터디에서 말해요.
        </PText>
        <View onLayout={(e) => (ys.current.chips = e.nativeEvent.layout.y)}>
          <Flash n={flash?.k === 'chips' ? flash.n : 0}>
            <ChipScroll horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={styles.chipsWrap}>
              {St.options.map((o, i) => (
                <TopicChip
                  key={o}
                  label={o}
                  on={sv.pick === i}
                  onPress={() => {
                    sfx(sv.pick === i ? 'tap' : 'toggle');
                    setSv((s) => ({ ...s, pick: i }));
                  }}
                />
              ))}
            </ChipScroll>
          </Flash>
        </View>
        <View style={styles.list} onLayout={(e) => (listY.current = e.nativeEvent.layout.y)}>
          {St.qs.map(([en, ko], i) => {
            const c = checks[i];
            return (
              <View key={i} onLayout={(e) => (ys.current[`q${i}`] = e.nativeEvent.layout.y)}>
                <Flash n={flash?.k === i ? flash.n : 0}>
                  <Pressable onPress={() => go(i, true)} accessible={false} style={StyleSheet.flatten([styles.q, !sv.para && kq === i && styles.qNow])}>
                    <View style={styles.qh}>
                      <PText style={styles.qn}>Q{i + 1}</PText>
                      {!sound.soundOff && (
                        <Pressable onPress={() => say(en)} accessibilityRole="button" accessibilityLabel="듣기" style={styles.ib} hitSlop={4}>
                          <SpeakerIcon size={17} />
                        </Pressable>
                      )}
                    </View>
                    <PText style={styles.qen}>{en}</PText>
                    <PText style={styles.qko} color={Colors.inkSub}>
                      {ko}
                    </PText>
                    <TextInput
                      ref={(r) => {
                        inputs.current[i] = r;
                      }}
                      value={sv.a[i] ?? ''}
                      onChangeText={(v) => {
                        setSv((s) => {
                          const a = s.a.slice();
                          a[i] = v;
                          return { ...s, a };
                        });
                        clearTimeout(timers.current[i]);
                        timers.current[i] = setTimeout(() => runCheck(i, v), 800);
                      }}
                      onFocus={() => go(i, true)}
                      onBlur={() => runCheck(i, sv.a[i] ?? '')}
                      placeholder="키워드 (영어)"
                      placeholderTextColor="#A39C8E"
                      autoCapitalize="none"
                      autoCorrect={false}
                      style={StyleSheet.flatten([styles.in, c?.kind === 'bad' && styles.inBad])}
                      accessibilityLabel={`Q${i + 1} 키워드`}
                    />
                    {c && c.kind !== 'ok' ? (
                      <Fix
                        c={c}
                        onFix={(v) => setKw(i, v)}
                        onKeep={() => {
                          setKeep((k) => ({ ...k, [i]: (sv.a[i] ?? '').trim() }));
                          setChecks((x) => ({ ...x, [i]: { kind: 'ok' } }));
                          sfx('tap');
                        }}
                      />
                    ) : null}
                    {exOf(i).length > 0 && (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ex}>
                        <PText style={styles.exLabel} color={Colors.inkSub}>
                          예시
                        </PText>
                        {exOf(i).map((w) => (
                          <Pressable
                            key={w}
                            onPress={() => {
                              const a = sv.a.slice();
                              a[i] = w;
                              setKw(i, w);
                              const nx = firstEmpty(a);
                              if (nx != null) go(nx, true);
                            }}
                            accessibilityRole="button"
                            accessibilityLabel={`예시 ${w}`}
                            style={styles.exBtn}>
                            <PText style={styles.exText}>{w}</PText>
                          </Pressable>
                        ))}
                      </ScrollView>
                    )}
                  </Pressable>
                </Flash>
              </View>
            );
          })}
        </View>
        {sv.para ? (
          <View style={styles.para}>
            <View style={styles.spHead}>
              <Image source={require('@/assets/characters/c-upright-yellow.png')} style={styles.spChar} contentFit="contain" />
              <View style={styles.flex}>
                <PText style={styles.spTitle} color={Colors.purple}>
                  My Story
                </PText>
                <PText style={styles.spSub} color={Colors.inkSub}>
                  다듬어서 소리 내어 읽어 보세요
                </PText>
              </View>
              {!sound.soundOff && (
                <Pressable onPress={() => say(sv.para)} accessibilityRole="button" accessibilityLabel="내 문단 듣기" style={styles.spSay}>
                  <SpeakerIcon size={20} />
                </Pressable>
              )}
            </View>
            <GrowInput
              value={sv.para}
              onChangeText={(v) => setSv((s) => ({ ...s, para: v }))}
              multiline
              // 높이는 GrowInput 이 글에 맞춰요 (spTa minHeight 160 부터)
              style={styles.spTa}
              accessibilityLabel="내 문단"
            />
          </View>
        ) : null}
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
          onLeave();
        }}
      />
    </View>
  );
}

function TopicChip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  const s = useSharedValue(1);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: s.get() }] }));
  return (
    <Pressable
      onPress={() => {
        if (!on) s.set(withSequence(withTiming(1.12, { duration: 160 }), withTiming(1, { duration: 260 })));
        onPress();
      }}
      accessibilityRole="radio"
      accessibilityState={{ checked: on }}
      accessibilityLabel={label}>
      {({ pressed }) => (
        <Animated.View style={[styles.chip, on && styles.chipOn, pressed && styles.chipDown, a]}>
          <PText style={styles.chipText}>{label}</PText>
        </Animated.View>
      )}
    </Pressable>
  );
}

/** 문단 만들기 버튼: 다 채우기 전엔 흐리고, 다 채우면 노랗게 살아나요 */
function BuildButton({ ready, onPress }: { ready: boolean; onPress: () => void }) {
  const still = useReducedMotion();
  const s = useSharedValue(1);
  const was = useRef(ready);
  useEffect(() => {
    if (ready && !was.current) {
      // 움직임 줄이기면 커지지 않고 색만 바뀌어요 (프로토타입 .kw-build.wake { animation: none })
      if (!still) s.set(withSequence(withTiming(1.05, { duration: 200 }), withTiming(1, { duration: 300 })));
      sfx('toggle');
    }
    was.current = ready;
  }, [ready, s, still]);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: s.get() }] }));
  return (
    <Animated.View style={a}>
      <StudyButton label="키워드로 문단 만들기" onPress={onPress} bg={ready ? Colors.yellow : '#EDE8DD'} textColor={ready ? Colors.ink : '#A39C8E'} />
    </Animated.View>
  );
}

/** 오타 · 영어 아님 안내 (프로토타입 .kw-fix) */
function Fix({ c, onFix, onKeep }: { c: Exclude<KeywordCheck, { kind: 'ok' }>; onFix: (v: string) => void; onKeep: () => void }) {
  if (c.kind === 'bad')
    return (
      <View style={styles.fixRow}>
        <PText style={styles.fixMsg} color="#B23A5A">
          {c.msg}
        </PText>
        {c.fix ? (
          <Pressable onPress={() => onFix(c.fix ?? '')} accessibilityRole="button" accessibilityLabel={`${c.fix} 로 바꾸기`} style={styles.fixBtn}>
            <PText style={styles.fixBtnSmall}>바꾸기 </PText>
            <PText style={styles.fixBtnText}>{c.fix}</PText>
          </Pressable>
        ) : null}
      </View>
    );
  return (
    <View style={styles.typo} accessibilityLiveRegion="polite">
      <View style={styles.tq}>
        <SparkIcon color="#9C8BDB" />
        <PText style={styles.tqText} color="#5B4BA8">
          오타 같아요 · <PText style={styles.tqWord}>{c.word}</PText>
        </PText>
        <Pressable onPress={onKeep} accessibilityRole="button" hitSlop={6}>
          <PText style={styles.keep} color="#8478B5">
            그대로 둘게요
          </PText>
        </Pressable>
      </View>
      <PText style={styles.ask} color="#8478B5">
        혹시 이 단어인가요?
      </PText>
      <View style={styles.opts}>
        {c.options.map((o) => (
          <Pressable key={o.word} onPress={() => onFix(o.value)} accessibilityRole="button" accessibilityLabel={o.word} style={styles.opt}>
            <PText style={styles.optText}>{o.word}</PText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

/** 빠진 칸 강조: 연보라로 두 번 깜빡여요 (kwNeed) */
function Flash({ n, children }: { n: number; children: React.ReactNode }) {
  const still = useReducedMotion();
  const v = useSharedValue(0);
  useEffect(() => {
    if (!n) return;
    // 움직임 줄이기면 깜빡이지 않고 3px 테두리만 잠깐 (프로토타입 reduced-motion: outline 3px solid #9C8BDB)
    if (still) v.set(withSequence(withTiming(1, { duration: 0 }), withDelay(1600, withTiming(0, { duration: 0 }))));
    else v.set(withSequence(withTiming(1, { duration: 200 }), withTiming(0.2, { duration: 300 }), withTiming(1, { duration: 300 }), withTiming(0, { duration: 800 })));
  }, [n, v, still]);
  const a = useAnimatedStyle(() => {
    const k = v.get();
    if (k <= 0.01) return { boxShadow: undefined, borderRadius: 22 };
    return { boxShadow: still ? '0 0 0 3px #9C8BDB' : `0 0 0 ${4 * k}px rgba(156,139,219,${0.9 * k})`, borderRadius: 22 };
  });
  return <Animated.View style={a}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  intro: { marginHorizontal: 2, marginTop: 8, fontFamily: Font.body700, fontSize: 13.5, lineHeight: 21 },
  chipsWrap: { marginHorizontal: -16 },
  chips: { gap: 8, paddingHorizontal: 16, paddingTop: 2, paddingBottom: 8 },
  chip: { minHeight: 40, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 14, borderWidth: 2.5, borderColor: Colors.ink, borderBottomWidth: 5.5, backgroundColor: Colors.white, justifyContent: 'center' },
  chipOn: { backgroundColor: Colors.yellow },
  chipDown: { borderBottomWidth: 2.5, marginTop: 3 },
  chipText: { fontFamily: Font.body800, fontSize: 14, lineHeight: 19 },
  list: { gap: 10 },
  q: { gap: 6, padding: 16, borderWidth: 2, borderColor: Colors.ink, borderRadius: 22, backgroundColor: Colors.white, boxShadow: '4px 4px 0 #1E1A2B' },
  qNow: { borderColor: Colors.purple, boxShadow: '4px 4px 0 #493087' },
  qh: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  qn: { fontFamily: Font.display, fontSize: 11.5, lineHeight: 15 },
  ib: { width: 36, height: 36, borderRadius: 12, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  qen: { fontFamily: Font.body900, fontSize: 15, lineHeight: 21 },
  qko: { fontFamily: Font.body700, fontSize: 13, lineHeight: 19 },
  in: { height: 44, paddingHorizontal: 12, borderRadius: 12, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.cream, fontFamily: Font.body500, fontSize: 15, color: Colors.ink },
  inBad: { borderColor: L.noRed, backgroundColor: '#FFF4F6' },
  ex: { alignItems: 'center', gap: 6, paddingTop: 2 },
  exLabel: { fontFamily: Font.body800, fontSize: 11, lineHeight: 15, marginRight: 2 },
  exBtn: { height: 30, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1.5, borderStyle: 'dashed', borderColor: L.muted, justifyContent: 'center' },
  exText: { fontFamily: Font.body700, fontSize: 12.5, lineHeight: 17 },
  fixRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  fixMsg: { fontFamily: Font.body800, fontSize: 12.5, lineHeight: 18 },
  fixBtn: { flexDirection: 'row', alignItems: 'center', height: 30, paddingHorizontal: 10, borderRadius: 8, borderWidth: 2, borderColor: Colors.ink, borderBottomWidth: 4, backgroundColor: Colors.yellow },
  fixBtnSmall: { fontFamily: Font.body700, fontSize: 11, lineHeight: 15 },
  fixBtnText: { fontFamily: Font.body800, fontSize: 12.5, lineHeight: 17 },
  typo: { gap: 8, paddingTop: 10, paddingHorizontal: 12, paddingBottom: 12, borderRadius: 14, backgroundColor: '#F3EFFB' },
  tq: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tqText: { flex: 1, fontFamily: Font.body800, fontSize: 12.5, lineHeight: 18 },
  tqWord: { fontFamily: Font.body800, fontSize: 12.5, lineHeight: 18, color: '#5B4BA8', textDecorationLine: 'underline', textDecorationStyle: 'dotted', textDecorationColor: '#E07A97' },
  keep: { fontFamily: Font.body700, fontSize: 11.5, lineHeight: 16, textDecorationLine: 'underline' },
  ask: { fontFamily: Font.body700, fontSize: 12, lineHeight: 16 },
  opts: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  opt: { height: 34, paddingHorizontal: 16, borderRadius: 17, borderWidth: 1.5, borderColor: '#C9BDEB', borderBottomWidth: 3.5, backgroundColor: Colors.white, justifyContent: 'center' },
  optText: { fontFamily: Font.body800, fontSize: 14.5, lineHeight: 19 },
  problem: { textAlign: 'center', fontFamily: Font.body800, fontSize: 12.5, lineHeight: 17 },
  para: { marginTop: 6, gap: 12, paddingTop: 18, paddingHorizontal: 16, paddingBottom: 16, borderWidth: 2, borderColor: Colors.ink, borderRadius: 22, backgroundColor: Colors.white, boxShadow: '4px 4px 0 #1E1A2B' },
  spHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  spChar: { width: 46, height: 30 },
  spTitle: { fontFamily: Font.display, fontSize: 22, lineHeight: 28 },
  spSub: { fontFamily: Font.body800, fontSize: 12.5, lineHeight: 17 },
  spSay: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: Colors.ink, borderBottomWidth: 5, backgroundColor: L.speakerBg, alignItems: 'center', justifyContent: 'center' },
  spTa: { minHeight: 160, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1.5, borderColor: Colors.line, backgroundColor: '#FBF8F1', fontFamily: Font.body500, fontSize: 15.5, lineHeight: 26, color: Colors.ink, textAlignVertical: 'top' },
});
