import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type ScrollViewInstance } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';

import { saveExpressionToggle } from '@/components/lesson/bubbles';
import { GuestMsg, MyMsg } from '@/components/lesson/chat';
import { SpeakerIcon } from '@/components/lesson/icons';
import { LessonModal } from '@/components/lesson/lesson-modal';
import { Avatar, GhostButton, pplColor, YellowButton } from '@/components/lesson/lesson-ui';
import { StudyLayout } from '@/components/lesson/study-layout';
import { StudyTop } from '@/components/lesson/study-top';
import { say, stopSay, useSoundToggle } from '@/components/lesson/voice';
import { makeWordBank, WordBank, type WordBankState } from '@/components/lesson/word-bank';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import type { LessonData } from '@/data/lessons';
import { haptic, sfx } from '@/lib/feedback';
import { getStepData, setStepData } from '@/state/progress';
import { useSavedExpressions } from '@/state/expressions';

/** 교재 그림 (data 의 photo 이름 → 파일) */
const PHOTOS: Record<string, number> = { 'lv1-01-lobby': require('@/assets/images/lesson/lv1-01-lobby.jpg') };

type Scene = NonNullable<LessonData['scene']>;
type Log = { who: 0 | 1; k: number };

/**
 * 상황 활동 Lv.1 (프로토타입 STEP_VIEW.act · wcTalk): 교재 9쪽 그림 위 인물 이름표 → 누르면 그 사람 목소리로 먼저 말해요 → [응대하기]
 * → 응대 대화: 손님 말(영어 + 뜻) → 나는 뜻을 보고 단어 카드로 답(카드마다 바로 채점) → 3번 주고받아 6마디.
 * 한 칸에서 3번 틀리면 맞는 카드가 노랗게 반짝(정답을 대신 보여 주지 않아요). 응대한 인물은 이름표가 회색.
 */
export function SitView({ D, skey, source, onFinish, onLeave }: { D: LessonData; skey: string; source: string; onFinish: (s: { right: number; total: number }) => void; onLeave: () => void }) {
  const Sc = D.scene as Scene;
  const P = Sc.people;
  const sound = useSoundToggle();
  const [found, setFound] = useState<Record<number, true>>(() => getStepData<Record<number, true>>(skey) ?? {});
  const [hear, setHear] = useState<number | null>(null);
  const [talk, setTalk] = useState<number | null>(null);
  const [quit, setQuit] = useState(false);
  useEffect(() => setStepData(skey, found), [skey, found]);

  const tapSpot = (i: number) => {
    const k = Sc.talks.findIndex((r) => r.who === P[i].name);
    if (k < 0) return;
    if (hear !== i) {
      setHear(i);
      sfx('tap');
      say(P[i].say, 0.92, P[i].name);
      return;
    }
    startTalk(i);
  };
  const startTalk = (i: number) => {
    const k = Sc.talks.findIndex((r) => r.who === P[i].name);
    stopSay();
    sfx('open');
    setHear(null);
    setTalk(k);
  };

  const top = <StudyTop title={talk != null ? `${Sc.talks[talk].who} 응대하기` : D.actTitle} soundOff={sound.soundOff} onToggleSound={sound.toggle} onClose={() => setQuit(true)} />;

  return (
    <View style={styles.flex}>
      {top}
      {talk != null ? (
        <WcTalk
          key={talk}
          R={Sc.talks[talk]}
          others={P.filter((p, k) => p.name !== Sc.talks[talk].who && !found[k]).map((p) => p.name)}
          soundOff={sound.soundOff}
          source={source}
          onDone={() => {
            const pi = P.findIndex((p) => p.name === Sc.talks[talk].who);
            if (pi >= 0) setFound((f) => ({ ...f, [pi]: true }));
          }}
          onFinish={onFinish}
          onOther={() => {
            sfx('tap');
            setTalk(null);
          }}
        />
      ) : (
        <StudyLayout>
          <PText style={styles.intro} color={Colors.inkSub}>
            대화할 캐릭터를 눌러 보세요
          </PText>
          <View style={styles.scene}>
            <Image source={PHOTOS[Sc.photo]} style={styles.photo} contentFit="cover" accessibilityLabel="호텔 로비 사진" />
            {P.map((p, i) => (
              <Pressable
                key={p.name}
                onPress={() => tapSpot(i)}
                accessibilityRole="button"
                accessibilityLabel={`${p.name} 목소리 듣기`}
                style={StyleSheet.flatten([styles.spot, { left: `${p.x - 10}%`, top: `${p.y - 21}%` }])}>
                <NameTag name={p.name} seen={!!found[i]} talking={hear === i} />
              </Pressable>
            ))}
          </View>
          <PText style={styles.count} color={Colors.inkSub}>
            응대한 손님 {Object.keys(found).length}/{P.length}
          </PText>
          {hear != null && (
            <View style={styles.hear}>
              <View style={styles.hr}>
                <View style={styles.hf}>
                  <Avatar name={P[hear].name} size={56} />
                  <PText style={styles.hfName} color={pplColor(P[hear].name)}>
                    {P[hear].name}
                  </PText>
                </View>
                <View style={styles.hb}>
                  <View style={styles.hbTail} />
                  <PText style={styles.hbText}>{P[hear].say.replace(/-/g, '‑')}</PText>
                  {!sound.soundOff && (
                    <Pressable onPress={() => say(P[hear].say, 0.92, P[hear].name)} accessibilityRole="button" accessibilityLabel="다시 듣기" style={styles.hs} hitSlop={4}>
                      <SpeakerIcon size={16} />
                    </Pressable>
                  )}
                </View>
              </View>
              {found[hear] ? (
                <>
                  <PText style={styles.hkDone}>해결했어요</PText>
                  <GhostButton label="한 번 더 하기" onPress={() => startTalk(hear)} />
                </>
              ) : (
                <>
                  <PText style={styles.hk} color={Colors.inkSub}>
                    {P[hear].clue}
                  </PText>
                  <YellowButton label={`${P[hear].name} 응대하기`} onPress={() => startTalk(hear)} />
                </>
              )}
            </View>
          )}
        </StudyLayout>
      )}
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

/** 이름표: 인물 색 바탕 · 응대 끝나면 회색 · 말하는 중엔 흰 바탕 + 소리 막대 */
function NameTag({ name, seen, talking }: { name: string; seen: boolean; talking: boolean }) {
  return (
    <View style={StyleSheet.flatten([styles.tag, { backgroundColor: talking ? Colors.white : seen ? '#9A93A6' : pplColor(name) }])}>
      {talking && <TalkWave />}
      <PText style={styles.tagText} color={talking ? pplColor(name) : Colors.white}>
        {name}
      </PText>
    </View>
  );
}

function TalkWave() {
  return (
    <View style={styles.wv} pointerEvents="none">
      {[5, 11, 7].map((h, k) => (
        <WaveBar key={k} h={h} delay={k * 150} />
      ))}
    </View>
  );
}
function WaveBar({ h, delay }: { h: number; delay: number }) {
  const still = useReducedMotion();
  const v = useSharedValue(1);
  useEffect(() => {
    if (still) return;
    v.set(withDelay(delay, withRepeat(withTiming(0.4, { duration: 700 }), -1, true)));
    return () => cancelAnimation(v);
  }, [still, v, delay]);
  const a = useAnimatedStyle(() => ({ height: h * v.get() }));
  return <Animated.View style={[styles.wvBar, a]} />;
}

/** 단어 카드 응대 대화 (프로토타입 wcTalk) */
function WcTalk({
  R,
  others,
  soundOff,
  source,
  onDone,
  onFinish,
  onOther,
}: {
  R: Scene['talks'][number];
  others: string[];
  soundOff: boolean;
  source: string;
  onDone: () => void;
  onFinish: (s: { right: number; total: number }) => void;
  onOther: () => void;
}) {
  const W = R.lines;
  const [i, setI] = useState(0);
  const [log, setLog] = useState<Log[]>([{ who: 1, k: 0 }]);
  const [right, setRight] = useState(0);
  const [wb, setWb] = useState<WordBankState>(() => makeWordBank(W[0][2], W.flatMap((x) => x[2].split(/\s+/)), 2));
  const [slotMiss, setSlotMiss] = useState(0);
  const [shake, setShake] = useState<{ id: number; n: number } | null>(null);
  const bad = useRef(0);
  const done = i >= W.length;
  const cur = W[Math.min(i, W.length - 1)];
  const wsAns = cur[2].trim().split(/\s+/);
  const key = (x: string) => x.replace(/[’‘]/g, "'").toLowerCase();
  const scroll = useRef<ScrollViewInstance>(null);
  const savedList = useSavedExpressions();
  // 틀린 카드 표시는 0.9초만
  useEffect(() => {
    if (!shake) return;
    const t = setTimeout(() => setShake(null), 900);
    return () => clearTimeout(t);
  }, [shake]);

  // 손님 말은 나올 때 한 번 읽어 줘요 (내 답은 맞춘 뒤에만)
  useEffect(() => {
    if (done) return;
    const t = setTimeout(() => say(W[i][0], 0.92, R.who), 350);
    return () => clearTimeout(t);
  }, [i, done, W, R.who]);

  const hintId = slotMiss >= 3 ? (wb.toks.find((tk) => !wb.picked.includes(tk.id) && key(tk.w) === key(wsAns[wb.picked.length]))?.id ?? null) : null;

  const tap = (id: number) => {
    const tk = wb.toks[id];
    if (key(tk.w) !== key(wsAns[wb.picked.length])) {
      sfx('wrong');
      haptic('error');
      bad.current += 1;
      setSlotMiss((m) => m + 1);
      setShake((s) => ({ id, n: (s?.n ?? 0) + 1 }));
      return false;
    }
    setSlotMiss(0);
    if (wb.picked.length + 1 >= wsAns.length) {
      sfx('correct');
      haptic('success');
      if (!bad.current) setRight((r) => r + 1);
      setTimeout(post, 350);
    }
    return true;
  };

  const post = () => {
    setLog((l) => [...l, { who: 0, k: i }]);
    say(W[i][2], 0.92);
    bad.current = 0;
    setSlotMiss(0);
    const ni = i + 1;
    setI(ni);
    if (ni < W.length) {
      setWb(makeWordBank(W[ni][2], W.flatMap((x) => x[2].split(/\s+/)), 2));
      setTimeout(() => setLog((l) => [...l, { who: 1, k: ni }]), 1300);
    } else onDone();
  };

  useEffect(() => {
    const t = setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(t);
  }, [log.length, done]);

  const foot = done ? (
    <>
      <YellowButton label="완료하기" onPress={() => onFinish({ right, total: W.length })} />
      <GhostButton label="다른 캐릭터 도전하기" onPress={onOther}>
        {others.length ? (
          <View style={styles.faces}>
            {others.map((n, k) => (
              <View key={n} style={k ? styles.faceOver : undefined}>
                <Avatar name={n} size={30} />
              </View>
            ))}
          </View>
        ) : null}
      </GhostButton>
    </>
  ) : null;

  return (
    <StudyLayout foot={foot} scrollRef={scroll}>
      <PText style={styles.intro} color={Colors.inkSub}>
        {R.me} 역할로 {R.who}에게 답해요 · 단어 카드를 순서대로 눌러요
      </PText>
      <View style={styles.dots} accessibilityLabel={`주고받기 ${Math.min(i + 1, W.length)}/${W.length}`}>
        {W.map((_, k) => (
          <View key={k} style={StyleSheet.flatten([styles.dot, k < i && styles.dotOn, k === i && styles.dotNow])} />
        ))}
        <PText style={styles.dotsN} color={Colors.inkSub}>
          {done ? W.length : i + 1}/{W.length}
        </PText>
      </View>
      <View style={styles.chat}>
        {log.map((m, k) =>
          m.who ? (
            <GuestMsg key={k} who={R.who} showWho en={W[m.k][0]} ko={W[m.k][1]} soundOff={soundOff} onSay={() => say(W[m.k][0], 0.92, R.who)} fresh={k === log.length - 1} />
          ) : (
            <MyMsg
              key={k}
              fresh={k === log.length - 1}
              saved={savedList.some((x) => x.en === W[m.k][2])}
              onSave={done ? () => saveExpressionToggle({ en: W[m.k][2], ko: W[m.k][3], source }) : undefined}>
              <PText style={styles.meText} color={Colors.white}>
                {W[m.k][2]}
              </PText>
            </MyMsg>
          ),
        )}
      </View>
      {done ? (
        <>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <PText style={styles.statN}>{W.length * 2}</PText>
              <PText style={styles.statL} color={Colors.inkSub}>
                주고받은 말
              </PText>
            </View>
            <View style={StyleSheet.flatten([styles.stat, styles.statLine])}>
              <PText style={styles.statN}>
                {right}/{W.length}
              </PText>
              <PText style={styles.statL} color={Colors.inkSub}>
                한 번에 맞힘
              </PText>
            </View>
          </View>
          <PText style={styles.intro} color={Colors.inkSub}>
            {right === W.length ? `완벽해요! ${R.who}의 문제를 다 해결했어요.` : `${R.who}의 문제를 해결했어요. 틀렸던 문장은 한 번 더 소리 내어 읽어 봐요.`}
          </PText>
        </>
      ) : (
        <View style={styles.me}>
          <PText style={styles.meKo}>{cur[3]}</PText>
          <WordBank wb={wb} onChange={setWb} onTap={tap} hintId={hintId} shake={shake} />
        </View>
      )}
    </StudyLayout>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  intro: { marginHorizontal: 2, marginTop: 8, fontFamily: Font.body700, fontSize: 13.5, lineHeight: 21 },
  scene: { borderWidth: 2, borderColor: Colors.ink, borderRadius: 22, overflow: 'hidden', backgroundColor: '#E9E2D4', boxShadow: '4px 4px 0 #1E1A2B' },
  photo: { width: '100%', aspectRatio: 1440 / 996 },
  spot: { position: 'absolute', width: '20%', height: '42%', alignItems: 'center', justifyContent: 'flex-end' },
  tag: { paddingVertical: 1, paddingHorizontal: 8, borderRadius: 8, borderWidth: 1.5, borderColor: Colors.ink, borderBottomWidth: 3.5 },
  tagText: { fontFamily: Font.body900, fontSize: 12, lineHeight: 17 },
  wv: { position: 'absolute', left: 0, right: 0, bottom: '100%', marginBottom: 5, flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: 2, height: 11 },
  wvBar: { width: 2.5, borderRadius: 2, backgroundColor: Colors.white },
  count: { textAlign: 'center', fontFamily: Font.body800, fontSize: 13.5, lineHeight: 20 },
  hear: { gap: 10, padding: 14, borderWidth: 2, borderColor: Colors.ink, borderRadius: 22, backgroundColor: Colors.white, boxShadow: '4px 4px 0 #1E1A2B' },
  hr: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  hf: { alignItems: 'center', gap: 2 },
  hfName: { fontFamily: Font.body900, fontSize: 12, lineHeight: 16 },
  hb: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 11, paddingLeft: 14, paddingRight: 12, borderWidth: 2, borderColor: Colors.ink, borderRadius: 18, backgroundColor: Colors.white, boxShadow: '2px 2px 0 #1E1A2B' },
  hbTail: { position: 'absolute', left: -9, top: 18, width: 14, height: 14, backgroundColor: Colors.white, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: Colors.ink, transform: [{ rotate: '45deg' }] },
  hbText: { flex: 1, fontFamily: Font.body800, fontSize: 15.5, lineHeight: 21 },
  hs: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  hk: { fontFamily: Font.body700, fontSize: 12.5, lineHeight: 18 },
  hkDone: { fontFamily: Font.body900, fontSize: 14, lineHeight: 20 },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2, marginBottom: 10 },
  dot: { width: 26, height: 8, borderRadius: 4, borderWidth: 1.5, borderColor: Colors.ink, backgroundColor: '#E6DFD0' },
  dotOn: { backgroundColor: Colors.yellow },
  dotNow: { backgroundColor: Colors.purple },
  dotsN: { marginLeft: 4, fontFamily: Font.display, fontSize: 12, lineHeight: 16 },
  chat: { gap: 10 },
  meText: { fontFamily: Font.body700, fontSize: 15, lineHeight: 22 },
  me: { marginTop: 12, gap: 12, padding: 14, borderWidth: 2, borderColor: Colors.ink, borderRadius: 22, backgroundColor: Colors.white, boxShadow: '4px 4px 0 #1E1A2B' },
  meKo: { fontFamily: Font.body800, fontSize: 15, lineHeight: 22 },
  stats: { flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 6, borderWidth: 2, borderColor: Colors.ink, borderRadius: 22, backgroundColor: Colors.white },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statLine: { borderLeftWidth: 2, borderColor: Colors.line },
  statN: { fontFamily: Font.display, fontSize: 17, lineHeight: 22 },
  statL: { fontFamily: Font.body800, fontSize: 11.5, lineHeight: 16 },
  faces: { flexDirection: 'row' },
  faceOver: { marginLeft: -8 },
});
