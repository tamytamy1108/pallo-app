import { Image } from 'expo-image';
import { useEffect } from 'react';
import { Modal, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Pressable } from '@/components/ui/pressable';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { haptic, sfx } from '@/lib/feedback';
import { SCENE_STEPS, sceneIdOf, sceneListenItems, sceneStepKey, stepTitle, type Scene, type SceneStep, type SceneStepId, type SituationMap } from '@/data/situation';
import { useIsDone, useSavedPos } from '@/state/progress';

import { Back, Check, Chev, ChevDown, Coin, Headphones, XMark } from './icons';
import { Drop, PressDrop, SUB } from './parts';
import { useQuizLevel } from './scene-store';

/* 장면 화면 (프로토타입 #study showHub · 상황 맵이면 '장면' 화면) */

const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: "'DM Serif Display', Georgia, serif" });
const STAGE_PINK = Colors.rosePink; // 본학습 색 (STAGE_COL.main)

/** 위 줄: ‹ (라이브러리로) · 가운데 '여행 맵 ▾' (누르면 장면 목록) */
export function HubTop({ map, onBack, onList }: { map: SituationMap; onBack: () => void; onList: () => void }) {
  return (
    <View style={styles.top}>
      <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="라이브러리로" style={styles.iconBtn} hitSlop={4}>
        <Back />
      </Pressable>
      <Pressable onPress={onList} accessibilityRole="button" accessibilityLabel="장면 목록 열기" style={styles.mid} hitSlop={6}>
        <PText style={styles.midText} numberOfLines={1}>
          {map.title} 맵
        </PText>
        <View style={styles.dn}>
          <ChevDown />
        </View>
      </Pressable>
      <View style={styles.iconBtn} />
    </View>
  );
}

/** 장면 화면 본문 */
export function HubBody({ map, scene, onLevel, onListen, onStep }: { map: SituationMap; scene: Scene; onLevel: () => void; onListen: () => void; onStep: (s: SceneStep) => void }) {
  const lv = useQuizLevel();
  const c = scene.content;
  const id = sceneIdOf(map.id, scene.no);
  const doneFlags = [useIsDone(sceneStepKey(id, 'mis')), useIsDone(sceneStepKey(id, 'flow')), useIsDone(sceneStepKey(id, 'bank')), useIsDone(sceneStepKey(id, 'exq')), useIsDone(sceneStepKey(id, 'talk'))];
  const nextId = SCENE_STEPS.find((_, i) => !doneFlags[i])?.id;
  if (!c) return null;
  const items = sceneListenItems(scene).length;
  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <Drop dx={3} dy={3} radius={8}>
          <View style={[styles.cover, { backgroundColor: map.c }]}>
            <PText style={styles.coverN} color={Colors.white}>
              PALLO
            </PText>
            <View style={styles.coverL}>
              <PText style={styles.coverLText} color={Colors.white}>
                {map.title}
              </PText>
            </View>
            <PText style={styles.coverS} color={Colors.white}>
              {map.series}
            </PText>
          </View>
        </Drop>
        <View style={styles.flex}>
          <PText style={styles.heroKick} color={SUB}>
            {map.series} MAP · SCENE {String(scene.no).padStart(2, '0')}
          </PText>
          <PText style={styles.h1} accessibilityRole="header">
            {scene.title}
          </PText>
          <PText style={styles.heroSub} color={SUB}>
            {scene.sub}
          </PText>
        </View>
      </View>

      {/* 오늘의 미션 · 내 레벨 문장 */}
      <Drop dx={4} dy={4} radius={22}>
        <View style={styles.sum}>
          <View style={styles.mish}>
            <PText style={styles.h3} color={SUB}>
              오늘의 미션 · Lv.{lv}
            </PText>
            <PressDrop onPress={onLevel} dx={2} dy={2} radius={18} inner={styles.link} accessibilityLabel="레벨 바꾸기">
              <PText style={styles.linkText}>레벨 바꾸기</PText>
            </PressDrop>
          </View>
          {c.flow.mis.map((m, i) => (
            <View key={m.t} style={styles.pl}>
              <View style={styles.plNo}>
                <PText style={styles.plNoText}>{i + 1}</PText>
              </View>
              <View style={styles.flex}>
                <PText style={styles.plB}>{m.t}</PText>
                <PText style={styles.plS} color={SUB}>
                  {m.lv[lv]}
                </PText>
              </View>
            </View>
          ))}
        </View>
      </Drop>

      {/* 리스닝 룸 (보라 카드) */}
      <PressDrop onPress={onListen} dx={4} dy={4} radius={22} inner={styles.lr} accessibilityLabel={`리스닝 룸 · 이 장면 문장 ${items}개`}>
        <View style={styles.lrIc}>
          <Headphones />
        </View>
        <View style={styles.flex}>
          <PText style={styles.rtB} color={Colors.white}>
            리스닝 룸
          </PText>
          <PText style={styles.rtS} color="rgba(255,255,255,0.75)" numberOfLines={1}>
            이 장면 문장 {items}개 · 영어→뜻 · 따라 말하기
          </PText>
        </View>
        <Chev color={Colors.white} />
      </PressDrop>

      <PText style={styles.note} color={SUB}>
        미션 → 롤플레이 → 단어 → 퀴즈 → AI 대화. 레벨마다 문장이 달라요.
      </PText>

      <View style={styles.steps}>
        {SCENE_STEPS.map((s, i) => (
          <StepCard key={s.id} sceneId={id} step={s} index={i} done={doneFlags[i]} next={s.id === nextId} onPress={() => onStep(s)} />
        ))}
      </View>
    </ScrollView>
  );
}

function StepCard({ sceneId, step, index, done, next, onPress }: { sceneId: string; step: SceneStep; index: number; done: boolean; next: boolean; onPress: () => void }) {
  const resume = useSavedPos(sceneStepKey(sceneId, step.id)) != null;
  const tag = resume ? '이어서' : next ? '다음' : done ? '다시 하기' : '';
  return (
    <PressDrop
      onPress={onPress}
      dx={4}
      dy={4}
      radius={22}
      inner={[styles.step, next && styles.stepNext]}
      accessibilityLabel={`${index + 1}. ${stepTitle(step)} · ${step.d}${tag ? ` · ${tag}` : ''} · +${step.xp}P`}>
      <View style={[styles.sn, (next || done) && { backgroundColor: STAGE_PINK }]}>{done ? <Check size={16} /> : <PText style={styles.snText}>{index + 1}</PText>}</View>
      <View style={styles.flex}>
        <PText style={styles.rtB}>{stepTitle(step)}</PText>
        <PText style={styles.rtS} color={SUB} numberOfLines={1}>
          {step.d}
        </PText>
      </View>
      <View style={styles.min}>
        {tag ? <PText style={styles.minB}>{tag}</PText> : null}
        <PText style={styles.minP} color={SUB}>
          +{step.xp}P
        </PText>
      </View>
    </PressDrop>
  );
}

/** 장면 목록 시트 (프로토타입 stLessonSheet · .stc-sh) */
export function SceneListSheet({ open, map, current, doneOf, onPick, onClose }: { open: boolean; map: SituationMap; current: number; doneOf: (no: number) => boolean; onPick: (s: Scene) => void; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const doneN = map.scenes.filter((x) => x.content && doneOf(x.no)).length;
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.shRoot}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="닫기" />
        <View style={styles.pn} accessibilityRole="none" accessibilityLabel="장면 고르기">
          <View style={styles.grab} />
          <View style={styles.hd}>
            <PText style={styles.hdB}>{map.title} 맵</PText>
            <PText style={styles.hdS} color={SUB}>
              {doneN}/{map.scenes.length}장면 끝냄
            </PText>
          </View>
          <ScrollView contentContainerStyle={[styles.ls, { paddingBottom: 24 + insets.bottom }]}>
            {map.scenes.map((x) => {
              const cur = x.no === current;
              const off = !x.content;
              const dn = !off && doneOf(x.no);
              const row = (
                <View style={[styles.r, cur && styles.rCur, off && styles.rOff]}>
                  <View style={[styles.no, off && styles.dim]}>
                    <PText style={styles.noText}>{x.no}</PText>
                  </View>
                  <View style={[styles.flex, off && styles.dim]}>
                    <PText style={styles.txB} numberOfLines={1}>
                      {x.title}
                    </PText>
                    <PText style={styles.txS} color={SUB} numberOfLines={1}>
                      {x.sub}
                    </PText>
                  </View>
                  <PText style={styles.st} color={cur ? Colors.ink : SUB}>
                    {cur ? '지금' : dn ? '완료' : off ? '커밍순' : ''}
                  </PText>
                </View>
              );
              return (
                <Pressable key={x.no} onPress={() => onPick(x)} accessibilityRole="button" accessibilityLabel={`${x.no}. ${x.title}${off ? ' 커밍순' : ''}`}>
                  {cur ? <Drop dy={3} radius={16}>{row}</Drop> : row}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/** 단계 팝업 (프로토타입 stepPopup · .np-m): 처음 = 시작하기! · 멈춘 곳 있으면 이어서 / 처음부터 · 끝냈으면 다시 하기 */
export function StepPopup({
  step,
  index,
  done,
  pos,
  total,
  onClose,
  onGo,
}: {
  step: SceneStep | null;
  index: number;
  done: boolean;
  pos: number | undefined;
  total: number;
  onClose: () => void;
  onGo: (id: SceneStepId, mode: 'start' | 'resume' | 'restart') => void;
}) {
  const still = useReducedMotion();
  const bob = useSharedValue(0);
  useEffect(() => {
    // npPt: 포인트가 위아래로 살짝 (1.8초)
    if (still || !step) return;
    bob.set(withRepeat(withSequence(withTiming(-2, { duration: 900, easing: Easing.inOut(Easing.ease) }), withTiming(0, { duration: 900, easing: Easing.inOut(Easing.ease) })), -1));
  }, [still, step, bob]);
  const bobStyle = useAnimatedStyle(() => ({ transform: [{ translateY: bob.get() }] }));
  if (!step) return null;
  const resume = pos != null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.npDim}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="닫기" />
        <Drop dy={6} radius={28} style={styles.npWrap}>
          <View style={styles.np} accessibilityLabel={stepTitle(step)}>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="닫기" style={styles.npX} hitSlop={6}>
              <XMark size={18} w={2.8} />
            </Pressable>
            <Image source={done && !resume ? require('@/assets/characters/c-tilted-yellow.png') : require('@/assets/characters/c-upright-yellow.png')} style={styles.npImg} contentFit="contain" />
            <PText style={styles.npK} color={SUB}>
              본학습 · {index + 1}
            </PText>
            <PText style={styles.npT}>{stepTitle(step)}</PText>
            {resume ? (
              <>
                <PText style={styles.npS} color={SUB}>
                  {total ? `${pos}/${total}까지 했어요` : '하던 곳이 있어요'}
                </PText>
                {total ? (
                  <View style={styles.npBar}>
                    <View style={[styles.npFill, { width: `${Math.round((pos / total) * 100)}%` }]} />
                  </View>
                ) : null}
              </>
            ) : done ? (
              <PText style={styles.npS} color={SUB}>
                완료했어요
              </PText>
            ) : (
              <Animated.View style={[styles.npPt, bobStyle]} accessibilityLabel={`포인트 ${step.xp}점`}>
                <Coin />
                <PText style={styles.npPtText}>+{step.xp}P</PText>
              </Animated.View>
            )}
            <PressDrop
              onPress={() => {
                sfx('tap');
                haptic('tap');
                onGo(step.id, resume ? 'resume' : 'start');
              }}
              dx={4}
              dy={4}
              radius={30}
              inner={styles.npBtn}
              accessibilityLabel={resume ? '이어서 하기' : done ? '다시 하기' : '시작하기!'}>
              <PText style={styles.npBtnText}>{resume ? '이어서 하기' : done ? '다시 하기' : '시작하기!'}</PText>
            </PressDrop>
            {resume ? (
              <Pressable onPress={() => onGo(step.id, 'restart')} accessibilityRole="button" accessibilityLabel="처음부터 하기" style={styles.npSkip}>
                <PText style={styles.npSkipText}>처음부터 하기</PText>
              </Pressable>
            ) : null}
          </View>
        </Drop>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  dim: { opacity: 0.45 },
  top: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10 },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  mid: { flex: 1, height: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  midText: { fontFamily: Font.body900, fontSize: 14, lineHeight: 20 },
  dn: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 40, gap: 10 },
  hero: { flexDirection: 'row', gap: 14, alignItems: 'flex-end' },
  cover: { width: 76, height: 102, borderRadius: 8, borderWidth: 2, borderColor: Colors.ink, alignItems: 'center', paddingTop: 10 },
  coverN: { fontFamily: SERIF, fontSize: 18, lineHeight: 18 },
  coverL: { marginTop: 7, borderWidth: 1, borderColor: Colors.white, borderRadius: 999, paddingHorizontal: 8 },
  coverLText: { fontFamily: SERIF, fontSize: 10, lineHeight: 14 },
  coverS: { marginTop: 6, fontFamily: SERIF, fontSize: 6.5, lineHeight: 9, letterSpacing: 0.5, textAlign: 'center', paddingHorizontal: 4 },
  heroKick: { fontFamily: Font.display, fontSize: 11, lineHeight: 15, letterSpacing: 0.3 },
  h1: { marginTop: 4, fontFamily: Font.display, fontSize: 24, lineHeight: 24 * 1.15, letterSpacing: -0.8 },
  heroSub: { marginTop: 5, fontFamily: Font.body600, fontSize: 13, lineHeight: 13 * 1.4 },
  sum: { paddingVertical: 14, paddingHorizontal: 16, gap: 10, borderWidth: 2, borderColor: Colors.ink, borderRadius: 22, backgroundColor: Colors.white },
  mish: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  h3: { fontFamily: Font.body900, fontSize: 12, lineHeight: 17 },
  link: { height: 36, paddingHorizontal: 14, borderRadius: 18, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, justifyContent: 'center' },
  linkText: { fontFamily: Font.body800, fontSize: 12, lineHeight: 17 },
  pl: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  plNo: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.yellow, alignItems: 'center', justifyContent: 'center' },
  plNoText: { fontFamily: Font.body900, fontSize: 11, lineHeight: 14 },
  plB: { fontFamily: Font.body900, fontSize: 14.5, lineHeight: 14.5 * 1.35 },
  plS: { marginTop: 1, fontFamily: Font.body700, fontSize: 12.5, lineHeight: 12.5 * 1.45 },
  lr: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderWidth: 2, borderColor: Colors.ink, borderRadius: 22, backgroundColor: Colors.purple },
  lrIc: { width: 40, height: 40, borderRadius: 14, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.yellow, alignItems: 'center', justifyContent: 'center' },
  rtB: { fontFamily: Font.body900, fontSize: 15, lineHeight: 15 * 1.3, letterSpacing: -0.2 },
  rtS: { marginTop: 2, fontFamily: Font.body600, fontSize: 12, lineHeight: 17 },
  note: { marginTop: -4, marginHorizontal: 2, fontFamily: Font.body700, fontSize: 13, lineHeight: 13 * 1.55 },
  steps: { gap: 10 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderWidth: 2, borderColor: Colors.ink, borderRadius: 22, backgroundColor: Colors.white },
  stepNext: { backgroundColor: '#FFFBE0' },
  sn: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  snText: { fontFamily: Font.display, fontSize: 13, lineHeight: 17 },
  min: { alignItems: 'flex-end' },
  minB: { fontFamily: Font.body900, fontSize: 12, lineHeight: 18 },
  minP: { fontFamily: Font.body800, fontSize: 11, lineHeight: 16.5 },
  shRoot: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(30,26,43,0.45)' },
  pn: { maxHeight: '72%', borderWidth: 2, borderBottomWidth: 0, borderColor: Colors.ink, borderTopLeftRadius: 26, borderTopRightRadius: 26, backgroundColor: Colors.cream },
  grab: { width: 40, height: 5, borderRadius: 3, backgroundColor: 'rgba(30,26,43,0.2)', alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  hd: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingTop: 6, paddingHorizontal: 20, paddingBottom: 10 },
  hdB: { fontFamily: Font.body900, fontSize: 16, lineHeight: 22 },
  hdS: { fontFamily: Font.body800, fontSize: 12, lineHeight: 17 },
  ls: { paddingHorizontal: 16, gap: 8 },
  r: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 2, borderColor: Colors.ink, borderRadius: 16, backgroundColor: Colors.white },
  rCur: { backgroundColor: Colors.yellow },
  rOff: { borderColor: 'rgba(30,26,43,0.14)', backgroundColor: 'transparent' },
  no: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  noText: { fontFamily: Font.body900, fontSize: 14, lineHeight: 18 },
  txB: { fontFamily: Font.body900, fontSize: 15, lineHeight: 21 },
  txS: { marginTop: 2, fontFamily: Font.body700, fontSize: 12, lineHeight: 17 },
  st: { fontFamily: Font.body900, fontSize: 12, lineHeight: 17 },
  npDim: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: 'rgba(30,26,43,0.5)' },
  npWrap: { width: '100%', maxWidth: 320 },
  np: { alignItems: 'stretch', gap: 6, paddingHorizontal: 20, paddingBottom: 16, borderWidth: 2.5, borderColor: Colors.ink, borderRadius: 28, backgroundColor: Colors.white },
  npX: { position: 'absolute', top: 12, right: 12, width: 34, height: 34, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  npImg: { width: 112, height: 100, alignSelf: 'center', marginTop: -54, marginBottom: 2 },
  npK: { textAlign: 'center', fontFamily: Font.body900, fontSize: 12, lineHeight: 17 },
  npT: { textAlign: 'center', fontFamily: Font.body900, fontSize: 21, lineHeight: 29 },
  npS: { textAlign: 'center', marginBottom: 8, fontFamily: Font.body700, fontSize: 13.5, lineHeight: 19 },
  npBar: { height: 10, marginTop: -2, marginBottom: 12, borderWidth: 2, borderColor: Colors.ink, borderRadius: 6, backgroundColor: Colors.cream, overflow: 'hidden' },
  npFill: { height: '100%', backgroundColor: Colors.yellow, borderRightWidth: 2, borderColor: Colors.ink },
  npPt: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 2, marginBottom: 10 },
  npPtText: { fontFamily: Font.display, fontSize: 20, lineHeight: 26, letterSpacing: -0.2 },
  npBtn: { height: 60, borderRadius: 30, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.yellow, alignItems: 'center', justifyContent: 'center' },
  npBtnText: { fontFamily: Font.body900, fontSize: 17, lineHeight: 24 },
  npSkip: { height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  npSkipText: { fontFamily: Font.body800, fontSize: 15, lineHeight: 20 },
});
