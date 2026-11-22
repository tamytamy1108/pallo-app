import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, G, Path, Pattern, Rect } from 'react-native-svg';

import { XmasBackLayer, XmasGarland } from '@/components/home/christmas';
import { CurrentFx, NodeHop, Rider } from '@/components/home/map-current';
import { Raised } from '@/components/ui/raised';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { seasonOf, XMAS } from '@/constants/season';
import { Colors } from '@/constants/theme';
import { LESSON_STEPS, MY_BOOK, STAGES } from '@/data/mock';

const NODE = 64;
const NODE_CUR = 78;
const ZIG = [-1, 0, 1, 0]; // 왼쪽 → 가운데 → 오른쪽 → 가운데 … 꼬불꼬불 (프로토타입과 같아요)

type Point = { x: number; y: number };

/** 프로토타입 renderMap 과 같은 계산: 구역 알약 · 정류장 · 보상 상자 위치 */
function layout(width: number) {
  const amp = width / 2 - 52;
  let y = 26;
  const zones: { y: number; stage: (typeof STAGES)[number]; num: number }[] = [];
  const nodes: (Point & { i: number })[] = [];
  LESSON_STEPS.forEach((s, i) => {
    const first = i === 0 || LESSON_STEPS[i - 1].stage !== s.stage;
    if (first) {
      const si = STAGES.findIndex((g) => g.key === s.stage);
      zones.push({ y: y + (i ? 6 : 0), stage: STAGES[si], num: si + 1 });
      y += 106;
    }
    nodes.push({ x: Math.round(width / 2 + ZIG[i % 4] * amp), y, i });
    y += 66;
  });
  const chest = {
    x: Math.round(width / 2 + ZIG[LESSON_STEPS.length % 4] * amp),
    y: y - 6,
  };
  return { nodes, zones, chest, height: y + 70 };
}

/** 정류장을 잇는 부드러운 곡선 */
const curve = (p: Point[]) => p.map((q, i) => (i === 0 ? `M${q.x},${q.y}` : `C${p[i - 1].x},${(p[i - 1].y + q.y) / 2} ${q.x},${(p[i - 1].y + q.y) / 2} ${q.x},${q.y}`)).join(' ');

/** 홈 스터디 맵 카드: 지금 과 · 챕터 줄 · 진도 · 꼬불꼬불 퀘스트 길 */
export function StudyMap() {
  const [lesson, setLesson] = useState(1);
  const [width, setWidth] = useState(0);
  // 11월 22일 ~ 12월 31일은 크리스마스 맵
  const [xmas] = useState(() => seasonOf() === 'xmas');
  const onDark = xmas ? XMAS.cream : Colors.ink;
  const done = MY_BOOK.doneSteps;
  const current = LESSON_STEPS.findIndex((s) => !done.includes(s.id));
  const title = MY_BOOK.titles[lesson] ?? '';
  const next = MY_BOOK.titles[lesson + 1];
  const map = width ? layout(width) : null;
  const soon = (what: string) => Alert.alert(what, '학습 화면은 다음 단계에서 만들어요.');

  return (
    <Raised radius={26}>
      <View style={StyleSheet.flatten([styles.card, xmas && { backgroundColor: XMAS.bg }])}>
        {xmas ? <XmasBackLayer /> : <DotPattern />}
        {/* 가랜드는 버튼 · 알약 뒤에 깔려요 */}
        {xmas && <XmasGarland />}

        {/* 맵 내용은 늘 장식보다 앞에 */}
        <View style={styles.content}>
          <View style={styles.head}>
            <View style={styles.headLeft}>
              <View style={styles.pillDark}>
                <PText style={styles.pillDarkText} color={Colors.white}>
                  스터디 맵 · {MY_BOOK.level}
                </PText>
              </View>
              <View style={StyleSheet.flatten([styles.weekChip, xmas && { backgroundColor: XMAS.cream }])}>
                <PText style={styles.weekText}>이번 주 진도 {MY_BOOK.weekLessons.join(' & ')}챕터</PText>
              </View>
            </View>
            <Pressable onPress={() => soon('전체 보기')} accessibilityRole="button" accessibilityLabel="전체 보기">
              {({ pressed }) => (
                <Raised radius={16} pressed={pressed}>
                  <View style={styles.allBtn}>
                    <PText style={styles.allText}>전체 보기</PText>
                  </View>
                </Raised>
              )}
            </Pressable>
          </View>

          <PText variant="title" numberOfLines={2} style={styles.title} color={onDark}>
            {lesson}과 {title}
          </PText>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chapScroll} contentContainerStyle={styles.chapRow}>
            {Array.from({ length: MY_BOOK.lessonCount }, (_, k) => k + 1).map((n) => {
              const on = n === lesson;
              const week = MY_BOOK.weekLessons.includes(n);
              return (
                <Pressable
                  key={n}
                  onPress={() => setLesson(n)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={`${n}과${week ? ', 이번 주 진도' : ''}`}
                  style={StyleSheet.flatten([styles.chap, week && styles.chapWeek, on && styles.chapOn])}>
                  <PText style={styles.chapText} color={on ? Colors.white : Colors.ink}>
                    {n}과
                  </PText>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.prog}>
            <View style={styles.track}>
              <View style={StyleSheet.flatten([styles.fill, { width: `${(done.length / LESSON_STEPS.length) * 100}%` }])} />
            </View>
            <PText style={styles.progText} color={onDark}>
              {done.length}/{LESSON_STEPS.length}
            </PText>
          </View>

          <View style={StyleSheet.flatten([styles.map, { height: map?.height ?? 900 }])} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
            {map && (
              <>
                <Svg width={width} height={map.height} style={StyleSheet.absoluteFill}>
                  <Path d={curve([...map.nodes, map.chest])} fill="none" stroke="#C9C2B3" strokeWidth={6} strokeLinecap="round" strokeDasharray="2 12" />
                </Svg>

                {map.zones.map((z) => (
                  <View key={z.stage.key} style={StyleSheet.flatten([styles.zoneWrap, { top: z.y }])}>
                    <View style={StyleSheet.flatten([styles.zone, { backgroundColor: z.stage.color }])}>
                      <View style={styles.zoneNum}>
                        <PText style={styles.zoneNumText}>{z.num}</PText>
                      </View>
                      <PText style={styles.zoneLabel}>{z.stage.label}</PText>
                      <Pressable onPress={() => soon(`${z.stage.label} 건너뛰기`)} accessibilityRole="button" accessibilityLabel={`${z.stage.label}까지 건너뛰기`} style={styles.skip}>
                        <PText style={styles.skipText}>건너뛰기</PText>
                      </Pressable>
                    </View>
                  </View>
                ))}

                {map.nodes.map((n) => {
                  const step = LESSON_STEPS[n.i];
                  const color = STAGES.find((g) => g.key === step.stage)!.color;
                  const isCur = n.i === current;
                  const size = isCur ? NODE_CUR : NODE;
                  return (
                    <View
                      key={step.id}
                      style={StyleSheet.flatten([
                        styles.nodeWrap,
                        {
                          left: n.x - size / 2,
                          top: n.y - size / 2,
                          width: size,
                        },
                      ])}>
                      {isCur && (
                        <View style={{ position: 'absolute', left: size / 2, top: size / 2 }}>
                          <CurrentFx />
                        </View>
                      )}
                      <Pressable
                        onPress={() => (step.id === 'pat' ? router.push('/lesson/pat') : soon(step.title))}
                        accessibilityRole="button"
                        accessibilityLabel={`${STAGES.find((g) => g.key === step.stage)!.label} ${step.title}`}>
                        {({ pressed }) => (
                          <NodeHop on={isCur && !pressed} style={{ width: size, height: size + 5 }}>
                            <View
                              style={StyleSheet.flatten([
                                styles.node,
                                {
                                  width: size,
                                  height: size,
                                  borderRadius: size / 2,
                                  backgroundColor: isCur ? color : Colors.white,
                                },
                                pressed && styles.nodePressed,
                              ])}>
                              <PText style={isCur ? styles.nodeNumCur : styles.nodeNum} color={isCur ? Colors.ink : '#A39C8E'}>
                                {n.i + 1}
                              </PText>
                            </View>
                          </NodeHop>
                        )}
                      </Pressable>
                      <PText style={StyleSheet.flatten([styles.nodeLabel, xmas && styles.labelXmas])}>{step.title}</PText>
                      {isCur && (
                        <View style={{ position: 'absolute', left: size / 2, top: size / 2, zIndex: 4 }}>
                          <Rider />
                        </View>
                      )}
                    </View>
                  );
                })}

                <View style={StyleSheet.flatten([styles.chestWrap, { left: map.chest.x - 36, top: map.chest.y - 34 }])}>
                  <Chest />
                  <PText style={StyleSheet.flatten([styles.nodeLabel, styles.chestLabel, xmas && styles.labelXmas])}>{lesson}과 보상</PText>
                </View>
              </>
            )}
          </View>

          {next && (
            <Pressable onPress={() => setLesson(lesson + 1)} accessibilityRole="button" accessibilityLabel={`다음 챕터 ${lesson + 1}과 ${next}`}>
              {({ pressed }) => (
                <Raised radius={20} pressed={pressed}>
                  <View style={styles.nextBtn}>
                    <PText style={styles.nextText} numberOfLines={1}>
                      다음 챕터 · {lesson + 1}과 {next}
                    </PText>
                    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={Colors.ink} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M5 12h14M13 6l6 6-6 6" />
                    </Svg>
                  </View>
                </Raised>
              )}
            </Pressable>
          )}
        </View>
      </View>
    </Raised>
  );
}

/** 카드 바탕의 옅은 점 무늬 */
function DotPattern() {
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <Pattern id="dots" width={18} height={18} patternUnits="userSpaceOnUse">
          <Circle cx={9} cy={9} r={1.2} fill="#ECE5D3" />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#dots)" />
    </Svg>
  );
}

/** 잠긴 보상 상자 (프로토타입 .tchest 와 같은 그림) */
function Chest() {
  const b = '#E4DED2',
    l = '#EFEAE0',
    s = '#D6CFC0',
    k = '#9A93A6';
  return (
    <Svg width={72} height={64} viewBox="0 0 84 74">
      <Rect x={7} y={38} width={70} height={32} rx={7} fill="#CFC8BA" />
      <G>
        <Rect x={7} y={34} width={70} height={32} rx={7} fill={b} stroke={k} strokeWidth={2.5} />
        <Rect x={17} y={34} width={8} height={32} fill={s} stroke={k} strokeWidth={2} />
        <Rect x={59} y={34} width={8} height={32} fill={s} stroke={k} strokeWidth={2} />
      </G>
      <Path d="M7 36V24C7 11 22 6 42 6s35 5 35 18v12Z" fill={l} stroke={k} strokeWidth={2.5} strokeLinejoin="round" />
      <Path d="M17 36V12.5c2.4-1.2 5-2.1 8-2.8V36Z M59 36V9.7c3 .7 5.6 1.6 8 2.8V36Z" fill={s} stroke={k} strokeWidth={2} strokeLinejoin="round" />
      <Rect x={5} y={31} width={74} height={7} rx={3.5} fill={s} stroke={k} strokeWidth={2.5} />
      <Rect x={33.5} y={30} width={17} height={19} rx={4} fill={s} stroke={k} strokeWidth={2.5} />
      <Circle cx={42} cy={37.5} r={2.6} fill={k} />
      <Path d="M42 39v5" stroke={k} strokeWidth={2.6} strokeLinecap="round" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingTop: 16,
    paddingHorizontal: 14,
    paddingBottom: 20,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: Colors.ink,
    backgroundColor: Colors.white,
    overflow: 'hidden',
  },
  content: { zIndex: 1 },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  headLeft: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pillDark: {
    height: 26,
    paddingHorizontal: 11,
    borderRadius: 13,
    backgroundColor: Colors.ink,
    justifyContent: 'center',
  },
  pillDarkText: { fontFamily: Font.body800, fontSize: 12, lineHeight: 16 },
  weekChip: {
    height: 26,
    paddingHorizontal: 9,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: Colors.ink,
    backgroundColor: '#F1EBDC',
    justifyContent: 'center',
  },
  weekText: { fontFamily: Font.body900, fontSize: 11, lineHeight: 14 },
  allBtn: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.ink,
    backgroundColor: Colors.yellow,
    justifyContent: 'center',
  },
  allText: { fontFamily: Font.body800, fontSize: 12, lineHeight: 16 },
  title: { marginTop: 8, fontSize: 20, lineHeight: 25 },
  chapScroll: { marginHorizontal: -14, marginTop: 6 },
  chapRow: { gap: 8, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 6 },
  chap: {
    minWidth: 58,
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.ink,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapWeek: { backgroundColor: '#F1EBDC' },
  chapOn: { backgroundColor: Colors.ink },
  chapText: { fontFamily: Font.display, fontSize: 13, lineHeight: 16 },
  prog: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  track: {
    flex: 1,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: Colors.ink,
    backgroundColor: '#F6F1E4',
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: Colors.yellow },
  progText: { fontFamily: Font.display, fontSize: 12, lineHeight: 16 },
  map: { marginTop: 8 },
  zoneWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2,
  },
  zone: {
    height: 40,
    paddingHorizontal: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.ink,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 5,
  },
  zoneNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.ink,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoneNumText: { fontFamily: Font.display, fontSize: 12, lineHeight: 15 },
  zoneLabel: {
    fontFamily: Font.body900,
    fontSize: 14,
    lineHeight: 18,
    marginRight: 6,
  },
  skip: {
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(30,26,43,0.25)',
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
  },
  skipText: { fontFamily: Font.body800, fontSize: 11.5, lineHeight: 15 },
  nodeWrap: { position: 'absolute', alignItems: 'center', zIndex: 3 },
  // 사탕 같은 볼록 동전: 위쪽 반달 광택 · 아래로 갈수록 살짝 어둡게 · 안쪽 아래 그늘 · 잉크 바닥 그림자 (프로토타입 #qmapInner .node)
  node: {
    borderWidth: 2.5,
    borderColor: Colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundImage:
      'radial-gradient(ellipse 62% 36% at 50% 20%, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.35) 55%, rgba(255, 255, 255, 0) 72%), radial-gradient(ellipse 90% 60% at 50% 100%, rgba(30, 26, 43, 0.14) 0%, rgba(30, 26, 43, 0) 70%), linear-gradient(180deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0) 45%)',
    boxShadow: 'inset 0 -6px 0 rgba(30, 26, 43, 0.1), inset 0 2px 0 rgba(255, 255, 255, 0.7), 0 5px 0 #1E1A2B, 0 12px 14px -4px rgba(30, 26, 43, 0.22)',
  },
  nodePressed: {
    transform: [{ translateY: 4 }],
    boxShadow: 'inset 0 -6px 0 rgba(30, 26, 43, 0.1), inset 0 2px 0 rgba(255, 255, 255, 0.7), 0 1px 0 #1E1A2B',
  },
  nodeNum: { fontFamily: Font.display, fontSize: 17, lineHeight: 21 },
  nodeNumCur: { fontFamily: Font.display, fontSize: 22, lineHeight: 27 },
  nodeLabel: {
    marginTop: 5,
    fontFamily: Font.body800,
    fontSize: 12,
    lineHeight: 16,
    width: 180,
    textAlign: 'center',
  },
  chestWrap: {
    position: 'absolute',
    width: 72,
    alignItems: 'center',
    zIndex: 3,
  },
  chestLabel: { color: '#9A93A6', marginTop: 2 },
  labelXmas: {
    color: XMAS.cream,
    textShadowColor: XMAS.top,
    textShadowRadius: 4,
    textShadowOffset: { width: 0, height: 1 },
  },
  nextBtn: {
    height: 56,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.ink,
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  nextText: { flex: 1, fontFamily: Font.body900, fontSize: 15, lineHeight: 20 },
});
