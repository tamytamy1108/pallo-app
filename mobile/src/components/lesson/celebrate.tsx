import { Image } from 'expo-image';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, useWindowDimensions, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, Ellipse, LinearGradient, Polygon, Stop } from 'react-native-svg';

import { Pressable } from '@/components/ui/pressable';
import { HomeIcon } from '@/components/lesson/icons';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { pickOne, STAGE_KO, type Stage } from '@/data/lessons';
import { haptic, sfx } from '@/lib/feedback';
import { kfc } from '@/lib/motion';
import { LayerModal } from '@/components/ui/sheet-stack';

/**
 * 완료 등급 (docs 완료 화면 통일안). 위로 갈수록 화려해요.
 * step 단계 완료(칸 안 무대) · zone 구역 완료(예습 · 본학습 · 복습 · 화면 전체) · session 회차 완료(색종이) · level 레벨 완료(교재 레벨만 · 발판 점프)
 */
export type CelebrateTier = 'step' | 'zone' | 'session' | 'level';
/** 지금 어디 바 한 칸: 끝냄 · 지금(방금 끝낸 단계) · 안 함 · 건너뜀(테스트 통과) */
export type WhereCell = 'done' | 'now' | 'todo' | 'skip';
/** 지금 어디 바: 구역 묶음(예습 · 본학습 · 복습)마다 단계 칸, 아래 한 줄('예습 3/4' · 'USEFUL EXPRESSIONS') */
export type CelebrateWhere = { groups: { label: string; cells: WhereCell[] }[]; label: string; note?: string };

export type CelebrateResult = {
  /** 최종 점수: 맞힌 수 / 전체 (전체 0 이면 점수 줄 없이) */
  correct: number;
  total: number;
  /** 이번에 받은 포인트 (단계를 처음 끝낼 때만) — 0 이면 포인트 칸 없이 */
  points: number;
  /** 오늘 목표 (학습 n개 중 몇 개) */
  goalDone: number;
  goalTotal: number;
  /** 회차(과)를 다 끝냈어요 → tier 를 안 주면 session */
  unitComplete?: boolean;
  /** 제한 시간이 있던 문제 수 · 그중 시간 안에 맞힌 수 → 점수 줄에 '빠른 답' */
  timed?: number;
  fast?: number;
  /** 제목을 정해 주면 그대로 (예: '예습 완료!'). 없으면 점수로 정해요 (무작위 없이) */
  title?: string;
  /** 구역을 다 끝냈어요 → tier 를 안 주면 zone */
  big?: boolean;
  /** [이어서 하기] 옆 다음 단계 포인트 */
  nextPoints?: number;
  /** 제목 아래 한 줄 (예: 'STAGE 3까지 건너뛰었어요'). 없으면 점수('6/9') */
  sub?: string;
  /** 완료 등급 — 없으면 unitComplete · big 으로 정해요 */
  tier?: CelebrateTier;
  /** 무대 색을 고르는 구역 (zone 등급: 예습 노랑 · 본학습 분홍 · 복습 하늘) */
  zone?: Stage;
  /** 지금 어디 바 */
  where?: CelebrateWhere;
  /** 보상 줄에 붙는 배지 이름 (레벨 완료: 'Lv.2 배지' → 'Lv.2' · 이름 '배지') */
  badge?: string;
};

export const tierOf = (r: CelebrateResult): CelebrateTier => r.tier ?? (r.unitComplete ? 'session' : r.big ? 'zone' : 'step');

/** 단계 목록 → 지금 어디 바 (curId = 방금 끝낸 단계). note 는 바 아래 한 줄 뒤쪽 */
export function buildWhere(steps: readonly { id: string; stage: Stage }[], done: (id: string) => boolean, curId: string, note?: string, skipped?: (id: string) => boolean): CelebrateWhere {
  const order: Stage[] = ['pre', 'main', 'post'];
  const groups = order
    .map((stage) => {
      const list = steps.filter((s) => s.stage === stage);
      const cells = list.map((s): WhereCell => (s.id === curId ? 'now' : skipped?.(s.id) ? 'skip' : done(s.id) ? 'done' : 'todo'));
      return { stage, label: STAGE_KO[stage], cells, n: list.findIndex((s) => s.id === curId) + 1, len: list.length };
    })
    .filter((g) => g.len > 0);
  const cur = groups.find((g) => g.n > 0);
  return { groups: groups.map((g) => ({ label: g.label, cells: g.cells })), label: cur ? `${cur.label} ${cur.n}/${cur.len}` : '', note };
}

const YELLOW_POSES = [
  require('@/assets/characters/c-upright-yellow.png'),
  require('@/assets/characters/c-upright-yellow-flip.png'),
  require('@/assets/characters/c-tilted-yellow.png'),
  require('@/assets/characters/c-tilted-yellow-flip.png'),
];
const PURPLE_POSES = [require('@/assets/characters/c-upright-purple.png'), require('@/assets/characters/c-tilted-purple-flip.png')];
const MOVES = ['hop', 'twirl', 'boing', 'wiggle', 'flip', 'lean'] as const;
type Move = (typeof MOVES)[number];
const RISE = Easing.bezier(0.2, 0.9, 0.3, 1.3);
const CONFETTI = ['#FFE200', '#F28CB1', '#7FA7E8', '#5CBF8A', '#493087', '#FF7A59'];

/** 무대 모양 (등급 · 구역마다) */
type Look = { bg: string; text: string; light: string; purple: boolean; dark: boolean };
const ZONE_BG: Record<Stage, string> = { pre: Colors.yellow, main: '#F28CB1', post: '#9DC3EE' };
function lookOf(tier: CelebrateTier, zone: Stage | undefined): Look {
  if (tier === 'step') return { bg: Colors.purple, text: Colors.yellow, light: '#FFFFFF', purple: false, dark: true };
  if (tier === 'level') return { bg: '#2A1D52', text: Colors.yellow, light: Colors.yellow, purple: false, dark: true };
  if (tier === 'session') return { bg: '#F28CB1', text: Colors.ink, light: '#FFFFFF', purple: false, dark: false };
  const bg = ZONE_BG[zone ?? 'pre'];
  return { bg, text: Colors.ink, light: '#FFFFFF', purple: bg === Colors.yellow, dark: false };
}

/**
 * 완료(축하) 화면 — 무대 위 팔로 (docs 완료 화면 통일안 · 시안 3).
 * step: 크림 화면 안에 보라 무대 칸 · zone / session / level: 화면 전체가 무대. 글자(제목 · 한 줄 · 보상)는 무대 안 왼쪽 위 · 아래.
 * 맨 위 '지금 어디 바', 아래 집 아이콘 + [이어서 하기]. 팡파르. props 는 바꾸지 않아요(늘리기만).
 */
export function Celebrate({
  visible,
  result,
  onHome,
  onNext,
  sub: subProp,
}: {
  visible: boolean;
  result: CelebrateResult;
  onHome: () => void;
  onNext?: () => void;
  /** 제목 아래 한 줄 (예: '카페 장면 완료! 지도에 도장이 찍혔어요') */
  sub?: string;
}) {
  const insets = useSafeAreaInsets();
  const tier = tierOf(result);
  const look = lookOf(tier, result.zone);
  const full = tier !== 'step';
  const title = useMemo(() => {
    if (result.title) return result.title;
    const { correct, total } = result;
    if (!total) return '다 했어요!';
    return correct === total ? '완벽해요!' : correct >= Math.ceil(total / 2) ? '좋아요!' : '괜찮아요!';
    // 화면이 뜰 때 한 번만 정해요
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);
  const score = result.total ? `${result.correct}/${result.total}${result.timed ? ` · 빠른 답 ${result.fast ?? 0}/${result.timed}` : ''}` : '';
  const sub = subProp ?? result.sub ?? score;

  useEffect(() => {
    if (!visible) return;
    sfx('fanfare');
    haptic('success');
  }, [visible]);

  const nextLabel = onNext ? '이어서 하기' : '계속하기';
  const nextBg = full && look.bg === Colors.yellow ? Colors.white : Colors.yellow;

  return (
    <LayerModal visible={visible} animationType="fade" onRequestClose={onHome} statusBarTranslucent>
      <View style={StyleSheet.flatten([styles.root, { backgroundColor: full ? look.bg : Colors.cream, paddingTop: 16 + insets.top, paddingBottom: 22 + insets.bottom }])}>
        {result.where ? <WhereBar where={result.where} dark={full && look.dark} nowColor={full && look.bg === Colors.yellow ? Colors.white : Colors.yellow} /> : null}
        <StageView tier={tier} look={look} full={full} topInset={16 + insets.top}>
          <Rise delay={380} style={styles.words}>
            <PText style={styles.title} color={look.text} accessibilityRole="header">
              {title}
            </PText>
            {sub ? (
              <PText style={styles.sub} color={look.text}>
                {sub}
              </PText>
            ) : null}
          </Rise>
          <Rise delay={650} style={styles.rewards}>
            <Rewards result={result} look={look} />
          </Rise>
        </StageView>
        <Rise delay={850} style={styles.acts}>
          {onNext ? (
            <Pressable
              onPress={() => {
                sfx('back');
                onHome();
              }}
              accessibilityRole="button"
              accessibilityLabel="홈으로">
              {({ pressed }) => (
                <View style={StyleSheet.flatten([styles.home, pressed && styles.down])}>
                  <HomeIcon />
                </View>
              )}
            </Pressable>
          ) : null}
          <Nudge style={styles.flex}>
            <Pressable
              onPress={() => {
                sfx('big');
                (onNext ?? onHome)();
              }}
              accessibilityRole="button"
              accessibilityLabel={nextLabel}>
              {({ pressed }) => (
                <View style={StyleSheet.flatten([styles.next, { backgroundColor: nextBg }, pressed && styles.down])}>
                  <PText style={styles.nextText}>{nextLabel}</PText>
                  {onNext && result.nextPoints ? (
                    <View style={styles.nextPts}>
                      <PText style={styles.nextPtsText} color={Colors.yellow}>
                        +{result.nextPoints}P
                      </PText>
                    </View>
                  ) : null}
                </View>
              )}
            </Pressable>
          </Nudge>
        </Rise>
      </View>
    </LayerModal>
  );
}

/** 지금 어디 바: 구역마다 이름 + 단계 칸 (끝냄 보라 · 지금 노랑(노랑 무대에선 흰색) · 안 함 빈 칸 · 건너뜀 연보라) */
function WhereBar({ where, dark, nowColor }: { where: CelebrateWhere; dark: boolean; nowColor: string }) {
  const line = dark ? Colors.white : Colors.ink;
  const subC = dark ? '#C9BDF0' : Colors.inkSub;
  return (
    <View style={styles.where} accessibilityLabel={`지금 위치 ${where.label}${where.note ? ` · ${where.note}` : ''}`}>
      <View style={styles.whereRow}>
        {where.groups.map((g) => (
          <View key={g.label} style={[styles.whereGroup, { flex: g.cells.length }]}>
            <PText style={styles.whereName} color={subC} numberOfLines={1}>
              {g.label}
            </PText>
            <View style={styles.whereCells}>
              {g.cells.map((c, i) => (
                <View
                  key={i}
                  style={[
                    styles.whereCell,
                    { borderColor: line, backgroundColor: c === 'done' ? (dark ? Colors.white : Colors.purple) : c === 'now' ? nowColor : c === 'skip' ? '#C9BDF0' : 'transparent' },
                  ]}
                />
              ))}
            </View>
          </View>
        ))}
      </View>
      {where.label ? (
        <PText style={styles.whereLabel} color={line} numberOfLines={1}>
          {where.label}
          {where.note ? <PText style={styles.whereNote} color={subC}>{` · ${where.note}`}</PText> : null}
        </PText>
      ) : null}
    </View>
  );
}

/** 보상 줄 (형광펜 밑줄): 숫자 아래 굵은 색 밑줄 + 작은 이름. 포인트만 노랑 밑줄로 강조 */
function Rewards({ result, look }: { result: CelebrateResult; look: Look }) {
  const gd = Math.min(result.goalDone, result.goalTotal);
  const full = result.goalTotal > 0 && gd >= result.goalTotal;
  const numC = look.dark ? Colors.white : Colors.ink;
  const subC = look.dark ? '#C9BDF0' : '#3A3450';
  const hi = look.dark ? 'rgba(255,226,0,0.5)' : look.bg === Colors.yellow ? Colors.white : Colors.yellow;
  const soft = look.dark ? 'rgba(255,255,255,0.22)' : 'rgba(30,26,43,0.14)';
  const items: { k: string; num: string; label: string; mark: string; a11y: string }[] = [];
  if (result.points) items.push({ k: 'pt', num: `+${result.points}P`, label: '포인트', mark: hi, a11y: `포인트 ${result.points}` });
  if (result.goalTotal) items.push({ k: 'gl', num: full ? '달성!' : `${gd}/${result.goalTotal}`, label: '오늘 목표', mark: soft, a11y: `오늘 목표 ${gd}/${result.goalTotal}` });
  if (result.badge) items.push({ k: 'bd', num: result.badge.replace(/\s*배지$/, ''), label: '배지', mark: soft, a11y: result.badge });
  return (
    <View style={styles.marks}>
      {items.map((it) => (
        <View key={it.k} style={styles.markItem} accessibilityLabel={it.a11y}>
          <View>
            <View style={[styles.markLine, { backgroundColor: it.mark }]} />
            <PText style={styles.markNum} color={numC}>
              {it.num}
            </PText>
          </View>
          <PText style={styles.markLabel} color={subC}>
            {it.label}
          </PText>
        </View>
      ))}
    </View>
  );
}

/**
 * 무대: 조명(위에서 바닥까지 · 아래로 옅어짐) + 바닥(빛 웅덩이 · 레벨은 흰 발판 3개) + 팔로.
 * step 은 테두리 있는 칸, 그 밖은 화면 전체(조명은 화면 맨 위부터).
 */
function StageView({ tier, look, full, topInset, children }: { tier: CelebrateTier; look: Look; full: boolean; topInset: number; children: ReactNode }) {
  const [box, setBox] = useState<{ w: number; h: number; y: number } | null>(null);
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height, y } = e.nativeEvent.layout;
    setBox({ w: width, h: height, y });
  };
  const floorY = box ? box.h * (full ? 0.74 : 0.8) : 0;
  // 화면 전체 무대는 조명을 화면 맨 위(바 위)부터 그려요
  const lightTop = full && box ? -(box.y + topInset) : 0;
  const lw = box ? box.w * 0.84 : 0;
  const lh = floorY - lightTop;
  const charW = box ? Math.min(box.w * (tier === 'level' ? 0.3 : 0.46), 190) : 0;
  return (
    <View style={[styles.stage, !full && [styles.stageCard, { backgroundColor: look.bg }]]} onLayout={onLayout}>
      {box ? (
        <>
          <Svg pointerEvents="none" style={{ position: 'absolute', left: (box.w - lw) / 2, top: lightTop }} width={lw} height={lh} viewBox="0 0 100 100" preserveAspectRatio="none">
            <Defs>
              <LinearGradient id="stageLight" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={look.light} stopOpacity={0.6} />
                <Stop offset="1" stopColor={look.light} stopOpacity={0.06} />
              </LinearGradient>
            </Defs>
            <Polygon points="38,0 62,0 100,100 0,100" fill="url(#stageLight)" />
          </Svg>
          {tier === 'level' ? (
            <Pills box={box} floorY={floorY} />
          ) : (
            <Floor look={look} box={box} floorY={floorY} />
          )}
          {tier === 'session' || tier === 'level' ? <Confetti big /> : tier === 'zone' ? <Confetti big={false} /> : null}
          <Performer tier={tier} look={look} box={box} floorY={floorY} charW={charW} />
        </>
      ) : null}
      {children}
    </View>
  );
}

/** 무대 바닥 (빛 웅덩이): 조명이 바닥에 닿은 둥근 빛 + 발밑 그림자 */
function Floor({ look, box, floorY }: { look: Look; box: { w: number; h: number }; floorY: number }) {
  const W = box.w;
  const eh = box.h * 0.055;
  return (
    <Svg pointerEvents="none" style={{ position: 'absolute', left: 0, top: floorY - eh * 1.6 }} width={W} height={eh * 3.2}>
      <Ellipse cx={W / 2} cy={eh * 1.6} rx={W * 0.42} ry={eh * 1.4} fill={look.light} fillOpacity={0.28} />
      <Ellipse cx={W / 2} cy={eh * 1.6} rx={W * 0.2} ry={eh * 0.55} fill={Colors.ink} fillOpacity={0.22} />
    </Svg>
  );
}

/** 레벨 완료의 흰 발판 3개 (지금 타임어택 결과의 발판) */
function Pills({ box, floorY }: { box: { w: number; h: number }; floorY: number }) {
  const pw = box.w * 0.24;
  return (
    <>
      {[0.06, 0.38, 0.7].map((x) => (
        <View key={x} pointerEvents="none" style={[styles.pill, { left: box.w * x, top: floorY - 9, width: pw }]} />
      ))}
    </>
  );
}

/** 팔로: step 은 제자리 통통 · zone / session 은 춤 · level 은 발판 사이를 뛰어다녀요 */
function Performer({ tier, look, box, floorY, charW }: { tier: CelebrateTier; look: Look; box: { w: number; h: number }; floorY: number; charW: number }) {
  const still = useReducedMotion();
  const poses = look.purple ? PURPLE_POSES : YELLOW_POSES;
  const charH = charW * 0.72;
  const top = floorY - charH + (tier === 'level' ? -4 : 4);
  const left = (box.w - charW) / 2;
  if (tier === 'level') return <Hopper src={poses[0]} left={left} top={top} w={charW} h={charH} span={box.w * 0.32} still={still} />;
  if (tier === 'step') return <Bob src={poses[0]} left={left} top={top} w={charW} h={charH} still={still} />;
  return <DanceFloor poses={poses} left={left} top={top} w={charW} h={charH} still={still} />;
}

/** 제자리에서 통통 (1.4초마다) */
function Bob({ src, left, top, w, h, still }: { src: number; left: number; top: number; w: number; h: number; still: boolean }) {
  const p = useSharedValue(0);
  useEffect(() => {
    if (still) return;
    p.set(withDelay(500, withRepeat(withTiming(1, { duration: 1400, easing: Easing.linear }), -1, false)));
    return () => cancelAnimation(p);
  }, [still, p]);
  const a = useAnimatedStyle(() => {
    const t = p.get();
    return { transform: [{ translateY: kfc(t, [0, 30, 55, 70, 100], [0, -h * 0.16, 0, 0, 0], BOB_EASE) }, { scaleX: kfc(t, [0, 55, 62, 70, 100], [1, 1, 1.07, 1, 1], BOB_EASE) }, { scaleY: kfc(t, [0, 55, 62, 70, 100], [1, 1, 0.92, 1, 1], BOB_EASE) }] };
  });
  return (
    <Animated.View pointerEvents="none" style={[styles.performer, { left, top, width: w, height: h }, a]}>
      <Image source={src} style={styles.fill} contentFit="contain" />
    </Animated.View>
  );
}
const BOB_EASE = Easing.bezierFn(0.42, 0, 0.58, 1);

/** 발판 세 개 사이를 왼쪽 → 가운데 → 오른쪽 → 돌아서 다시 (3.2초) */
function Hopper({ src, left, top, w, h, span, still }: { src: number; left: number; top: number; w: number; h: number; span: number; still: boolean }) {
  const p = useSharedValue(0);
  useEffect(() => {
    if (still) return;
    p.set(withRepeat(withTiming(1, { duration: 3200, easing: Easing.linear }), -1, false));
    return () => cancelAnimation(p);
  }, [still, p]);
  const a = useAnimatedStyle(() => {
    const t = p.get();
    const S = [0, 6, 14, 22, 28, 36, 44, 50, 58, 66, 72, 80, 88, 100];
    const x = kfc(t, S, [-1, -1, -0.5, 0, 0, 0.5, 1, 1, 0.5, 0, 0, -0.5, -1, -1].map((v) => v * span), BOB_EASE);
    const y = kfc(t, S, [0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0].map((v) => v * h * 0.5), BOB_EASE);
    const face = t < 0.47 ? 1 : -1;
    return { transform: [{ translateX: x }, { translateY: y }, { scaleX: face }] };
  });
  return (
    <Animated.View pointerEvents="none" style={[styles.performer, { left, top, width: w, height: h }, still ? null : a]}>
      <Image source={src} style={styles.fill} contentFit="contain" />
    </Animated.View>
  );
}

/** 통통 뛰며 0.95초마다 춤 동작 (구역 · 회차 완료) */
function DanceFloor({ poses, left, top, w, h, still }: { poses: number[]; left: number; top: number; w: number; h: number; still: boolean }) {
  const [pose, setPose] = useState(0);
  const [move, setMove] = useState<{ m: Move | 'in'; n: number }>({ m: 'in', n: 0 });
  const bounce = useSharedValue(0);
  useEffect(() => {
    if (still) return;
    bounce.set(withDelay(800, withRepeat(withTiming(1, { duration: 500, easing: Easing.bezier(0.3, 0, 0.6, 1) }), -1, true)));
    let k = 0;
    let last: Move | '' = '';
    let iv: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      iv = setInterval(() => {
        let mv: Move = MOVES[k % MOVES.length];
        if (k >= MOVES.length) {
          do mv = pickOne([...MOVES]);
          while (mv === last);
        }
        last = mv;
        k += 1;
        if (k % 2 === 0) setPose(Math.floor(Math.random() * poses.length));
        setMove({ m: mv, n: k });
        if (mv === 'flip' || mv === 'twirl') sfx('hop');
      }, 950);
    }, 750);
    return () => {
      clearTimeout(start);
      clearInterval(iv);
      cancelAnimation(bounce);
    };
  }, [still, bounce, poses.length]);
  const hopStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -h * 0.18 * bounce.get() }] }));
  return (
    <Animated.View pointerEvents="none" style={[styles.performer, { left, top, width: w, height: h }, hopStyle]}>
      <Dancer move={move} src={poses[pose] ?? poses[0]} still={still} />
    </Animated.View>
  );
}

/** 춤 동작 하나 (프로토타입 celIn · dance · mvTwirl · mvFlip · mvWiggle · mvBoing · mvLean 키프레임) */
function Dancer({ move, src, still }: { move: { m: Move | 'in'; n: number }; src: number; still: boolean }) {
  const p = useSharedValue(still ? 1 : 0);
  const kind = useSharedValue<number>(0);
  useEffect(() => {
    if (still) return;
    const DUR: Record<Move | 'in', number> = { in: 800, hop: 600, twirl: 800, flip: 850, wiggle: 700, boing: 750, lean: 800 };
    kind.set(['in', ...MOVES].indexOf(move.m));
    p.set(0);
    // 시계는 선형으로 돌리고, 곡선은 danceStyle 에서 키프레임 구간마다 걸어요 (CSS 와 같게)
    p.set(withSequence(withTiming(0, { duration: 0 }), withTiming(1, { duration: DUR[move.m], easing: Easing.linear })));
  }, [move, still, p, kind]);
  const s = useAnimatedStyle(() => danceStyle(kind.get(), p.get()));
  return (
    <Animated.View style={[styles.charBox, s]}>
      <Image source={src} style={styles.fill} contentFit="contain" />
    </Animated.View>
  );
}

/** 동작마다 구간 곡선 (순서: in, ...MOVES — hop · twirl · flip · wiggle · boing · lean) */
const DANCE_EASE = [
  Easing.bezierFn(0.3, 1.5, 0.5, 1),
  Easing.bezierFn(0.3, 1.4, 0.5, 1),
  Easing.bezierFn(0.3, 1.2, 0.5, 1),
  Easing.bezierFn(0.3, 1.1, 0.5, 1),
  Easing.bezierFn(0.42, 0, 0.58, 1),
  Easing.bezierFn(0.3, 1.6, 0.5, 1),
  Easing.bezierFn(0.3, 1.4, 0.5, 1),
];

function danceStyle(kind: number, t: number) {
  'worklet';
  const pct = t;
  const e = DANCE_EASE[kind] ?? DANCE_EASE[0];
  const kf = (x: number, stops: number[], values: number[]) => kfc(x, stops, values, e);
  if (kind === 0) {
    // celIn: 아래에서 작게 튀어나와 위로 → 착지
    return {
      opacity: kf(pct, [0, 55, 100], [0, 1, 1]),
      transform: [{ translateY: kf(pct, [0, 55, 78, 100], [80, -34, 0, 0]) }, { scaleX: kf(pct, [0, 55, 78, 100], [0.3, 0.92, 1.12, 1]) }, { scaleY: kf(pct, [0, 55, 78, 100], [0.3, 1.12, 0.9, 1]) }],
    };
  }
  if (kind === 1) return { transform: [{ translateY: kf(pct, [0, 40, 100], [0, -20, 0]) }, { scaleX: kf(pct, [0, 40, 100], [1.1, 0.94, 1]) }, { scaleY: kf(pct, [0, 40, 100], [0.9, 1.08, 1]) }] };
  if (kind === 2)
    return {
      transform: [{ translateY: kf(pct, [0, 20, 60, 100], [0, 0, -46, 0]) }, { rotateY: `${kf(pct, [0, 20, 60, 100], [0, 0, 360, 360])}deg` }, { scaleX: kf(pct, [0, 20, 60], [1, 1.1, 1]) }, { scaleY: kf(pct, [0, 20, 60], [1, 0.88, 1]) }],
    };
  if (kind === 3)
    return {
      transform: [{ translateY: kf(pct, [0, 25, 55, 80, 100], [0, 0, -30, 0, 0]) }, { scaleX: kf(pct, [0, 25, 55, 80, 100], [1, 1.28, 0.82, 1.08, 1]) }, { scaleY: kf(pct, [0, 25, 55, 80, 100], [1, 0.7, 1.25, 0.92, 1]) }],
    };
  if (kind === 4) return { transform: [{ rotate: `${kf(pct, [0, 20, 40, 60, 80, 100], [0, -12, 11, -8, 5, 0])}deg` }] };
  if (kind === 5)
    return {
      transform: [
        { translateY: kf(pct, [0, 18, 60, 85, 100], [0, 6, -70, 0, 0]) },
        { rotate: `${kf(pct, [0, 18, 60, 85, 100], [0, 0, -300, -360, -360])}deg` },
        { scaleX: kf(pct, [0, 18, 60, 85, 100], [1, 1.12, 1, 1.08, 1]) },
        { scaleY: kf(pct, [0, 18, 60, 85, 100], [1, 0.86, 1, 0.9, 1]) },
      ],
    };
  return { transform: [{ translateX: kf(pct, [0, 35, 70, 100], [0, -26, 22, 0]) }, { rotate: `${kf(pct, [0, 35, 70, 100], [0, -14, 12, 0])}deg` }] };
}

type PieceDef = { x: number; y: number; vx: number; vy: number; r: number; vr: number; w: number; h: number; c: string; dot: boolean };
const makePieces = (n: number, width: number, height: number): PieceDef[] =>
  Array.from({ length: n }, () => ({
    x: width / 2 + (Math.random() - 0.5) * 40,
    y: height * 0.42,
    vx: (Math.random() - 0.5) * 13,
    vy: -Math.random() * 15 - 6,
    r: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.4,
    w: 5 + Math.random() * 7,
    h: 3 + Math.random() * 4,
    c: CONFETTI[Math.floor(Math.random() * CONFETTI.length)],
    dot: Math.random() < 0.3,
  }));

/** 컨페티 (브랜드 6색 · 가운데에서 위로 터져 떨어져요 · 약 1.8초) */
function Confetti({ big }: { big: boolean }) {
  const still = useReducedMotion();
  const { width, height } = useWindowDimensions();
  const t = useSharedValue(0);
  const [ps] = useState(() => makePieces(big ? 90 : 56, width, height));
  useEffect(() => {
    if (still) return;
    t.set(withTiming(110, { duration: 1830, easing: Easing.linear }));
  }, [still, t]);
  if (still) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {ps.map((p, i) => (
        <Piece key={i} p={p} t={t} />
      ))}
    </View>
  );
}

function Piece({ p, t }: { p: PieceDef; t: SharedValue<number> }) {
  const s = useAnimatedStyle(() => {
    const n = t.get();
    // 프로토타입: 매 프레임 vy += .9 (화면 2배) · vx *= .985
    const x = p.x + (p.vx * (1 - Math.pow(0.985, n))) / 0.015;
    const y = p.y + p.vy * n + 0.225 * n * n;
    return { opacity: n >= 110 ? 0 : 1, transform: [{ translateX: x - p.w / 2 }, { translateY: y - p.h / 2 }, { rotate: `${p.r + p.vr * n}rad` }] };
  });
  return <Animated.View style={[styles.piece, { width: p.dot ? p.h * 2 : p.w, height: p.dot ? p.h * 2 : p.h, borderRadius: p.dot ? p.h : 0, backgroundColor: p.c }, s]} />;
}

/** 아래에서 살짝 올라오며 나타나요 (.rise · 스프링) */
function Rise({ delay, style, children }: { delay: number; style?: object; children: React.ReactNode }) {
  const still = useReducedMotion();
  const p = useSharedValue(still ? 1 : 0);
  useEffect(() => {
    if (!still) p.set(withDelay(delay, withTiming(1, { duration: 500, easing: RISE })));
  }, [delay, still, p]);
  const a = useAnimatedStyle(() => ({ opacity: Math.min(1, p.get()), transform: [{ translateY: (1 - p.get()) * 14 }, { scale: 0.97 + 0.03 * p.get() }] }));
  return <Animated.View style={[style, a]}>{children}</Animated.View>;
}

const NUDGE_EASE = Easing.bezierFn(0.42, 0, 0.58, 1);

/** [이어서 하기]가 2.2초 뒤부터 2.4초마다 살짝 들썩 (nextNudge) */
function Nudge({ style, children }: { style?: object; children: React.ReactNode }) {
  const still = useReducedMotion();
  const p = useSharedValue(0);
  useEffect(() => {
    if (still) return;
    p.set(withDelay(2200, withRepeat(withTiming(1, { duration: 2400, easing: Easing.linear }), -1, false)));
    return () => cancelAnimation(p);
  }, [still, p]);
  const a = useAnimatedStyle(() => {
    const v = p.get();
    return { transform: [{ translateY: kfc(v, [0, 70, 80, 90, 100], [0, 0, -4, 0, 0], NUDGE_EASE) }, { scale: kfc(v, [0, 70, 80, 90, 100], [1, 1, 1.02, 1, 1], NUDGE_EASE) }] };
  });
  return <Animated.View style={[style, a]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 20, gap: 12 },
  flex: { flex: 1, minWidth: 0 },
  fill: { width: '100%', height: '100%' },
  stage: { flex: 1, minHeight: 0 },
  stageCard: { borderWidth: 2.5, borderColor: Colors.ink, borderRadius: 24, overflow: 'hidden' },
  words: { position: 'absolute', left: 20, right: 20, top: 18, gap: 4, zIndex: 3 },
  title: { fontFamily: Font.body900, fontSize: 32, lineHeight: 40, letterSpacing: -1.2 },
  sub: { fontFamily: Font.body800, fontSize: 14, lineHeight: 20, opacity: 0.85 },
  rewards: { position: 'absolute', left: 20, right: 16, bottom: 18, zIndex: 3 },
  marks: { flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'wrap', gap: 20 },
  markItem: { gap: 2 },
  markLine: { position: 'absolute', left: -3, right: -3, bottom: 3, height: 12, borderRadius: 3 },
  markNum: { fontFamily: Font.display, fontSize: 22, lineHeight: 28 },
  markLabel: { fontFamily: Font.body800, fontSize: 12, lineHeight: 16 },
  where: { gap: 4 },
  whereRow: { flexDirection: 'row', gap: 6 },
  whereGroup: { minWidth: 0, gap: 3 },
  whereName: { fontFamily: Font.body800, fontSize: 10, lineHeight: 13, textAlign: 'center' },
  whereCells: { flexDirection: 'row', gap: 2 },
  whereCell: { flex: 1, height: 9, borderRadius: 4, borderWidth: 1.5 },
  whereLabel: { fontFamily: Font.body900, fontSize: 12, lineHeight: 16 },
  whereNote: { fontFamily: Font.body700, fontSize: 12, lineHeight: 16 },
  pill: { position: 'absolute', height: 18, borderRadius: 9, borderWidth: 2.5, borderColor: Colors.ink, backgroundColor: Colors.white },
  performer: { position: 'absolute', zIndex: 2, transformOrigin: '50% 100%' },
  charBox: { width: '100%', height: '100%', transformOrigin: '50% 100%' },
  acts: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 10 },
  home: { width: 54, height: 59, borderRadius: 27, borderWidth: 2.5, borderColor: Colors.ink, borderBottomWidth: 7.5, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  next: { height: 59, borderRadius: 28, borderWidth: 2.5, borderColor: Colors.ink, borderBottomWidth: 7.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  down: { borderBottomWidth: 2.5, marginTop: 5 },
  nextText: { fontFamily: Font.body900, fontSize: 16, lineHeight: 21 },
  nextPts: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: Colors.ink },
  nextPtsText: { fontFamily: Font.display, fontSize: 13, lineHeight: 17 },
  piece: { position: 'absolute', left: 0, top: 0, borderWidth: 1, borderColor: Colors.ink },
});
