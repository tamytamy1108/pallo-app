import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { css, cubicBezier, useAnimatedProps, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { ClipPath, Defs, Ellipse, G, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useBranchProgress } from '@/api/use-branch-progress';
import { memberGate } from '@/components/common/trial-guide';
import { Pressable } from '@/components/ui/pressable';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { QR_AFTER, QR_BEFORE, SLOTS } from '@/data/home';
import { sfx } from '@/lib/feedback';
import { kf, SPRING, useLoop, useStill } from '@/lib/motion';
import { createStore } from '@/lib/store';
import { finishHomeMoment, useLinkEvents } from '@/state/link-events';
import { isMember } from '@/state/access';
import { useMe } from '@/state/me';
import { updateOnboarding } from '@/state/onboarding';

import { countOf, fmtMin, heroOf, minuteOf, rsvpOpen, todayTeam, useAttend, useClock, type Hero } from './attendance';
import { ARROW_PATH, CHECK_PATH, LineIcon, QR_PATH } from './icons';
import { UnlockStage } from './link-unlock';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

export const pad = (n: number) => String(n).padStart(2, '0');

/**
 * 클래퍼보드 줄무늬 팔 (프로토타입 .hero-arm: repeating-linear-gradient(-55deg, ink 0 22px, cream 22px 44px)).
 * 체험 · 둘러보기 카드도 같이 써요 (home-card).
 * SVG 로 그리면 아이폰에서 줄이 뭉개지고 오른쪽 끝이 잘려서, 기울인 막대(View · skewX)를 나란히 놓아요.
 * 테두리 안쪽 폭(onLayout 은 안쪽 칸에서 재요)만큼만 채워요.
 */
const ARM_H = 32;
const STRIPE = 22;
// -55deg 줄무늬: 줄은 세로에서 35° 기울고, 가로로 재면 한 줄 폭이 STRIPE / sin55°
const SIN55 = Math.sin((55 * Math.PI) / 180);
const BAR_W = STRIPE / SIN55;
const PERIOD = BAR_W * 2;
export function ClapperArm() {
  const [w, setW] = useState(0);
  const n = w ? Math.ceil((w + ARM_H) / PERIOD) + 2 : 0;
  return (
    <View style={styles.arm}>
      <View style={StyleSheet.absoluteFill} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
        {Array.from({ length: n }, (_, i) => (
          <View key={i} style={[styles.armBar, { left: (i - 1) * PERIOD }]} />
        ))}
      </View>
    </View>
  );
}

/**
 * 오늘 스터디 카드 (프로토타입 홈의 클래퍼보드 hero).
 * 위 칸: 스터디 시각 · 시작까지 · 날짜 / 아래 분홍 칸: ACTION! · 출석체크 하기 · 캐릭터.
 */
/**
 * 카드 제목 · 보라 팔로 포즈: 홈에 들어올 때마다 차례로 바뀌어요 (프로토타입 STAGE_LINES · 기본 → 기울이기 → 점프).
 * 앱을 다시 켜도 다음 차례부터 — 마지막 차례를 기기에 남겨요 (프로토타입 `pallo-stage-line`)
 */
const STAGE_LINES = ['Take the stage.', 'Your stage is ready.', 'The stage is yours.'];
const stageTurn = createStore(-1, { persist: { key: 'stage-line' } });

/** 회원 · 연동 대기 · 연동 안 됨일 때 홈 출석 카드. 체험 · 둘러보기는 home-card 가 골라요 */
export function SessionCard({ onOpen }: { onOpen: (mode: 'rsvp' | 'checkin') => void }) {
  const member = useMe(isMember);
  const branch = useMe((m) => m.branch);
  // 비회원이 기다리는 것: 연동 대기 · 확인 안 한 반려 (서버 요약 GET /me/branch-summary)
  const { pending, rejected } = useBranchProgress();
  // 방금 연동됐으면: 잠긴 카드가 풀리며 원래 카드로 뒤집혀요 (한 번만 · link-unlock)
  const moment = useLinkEvents((s) => s.homeMoment);
  return (
    <UnlockStage play={member && moment} branch={branch} front={<PendingCard />} onDone={finishHomeMoment}>
      {member ? <StudyCard onOpen={onOpen} /> : pending ? <PendingCard branch={pending.branchName} /> : rejected ? <PendingCard rejected branch={rejected.branchName} branchCode={rejected.branchCode} /> : <StudyCard onOpen={onOpen} />}
    </UnlockStage>
  );
}

/**
 * 지점 연동 확인 중일 때 (09-onboarding · A 잠긴 출석 카드): 같은 클래퍼보드를 라벤더로 잠가요.
 * 칸: 스터디 미정 · 연동 확인 중 · DATE / STANDBY · Almost on stage. · 한 줄 안내 · 점선으로 꺼 둔 버튼.
 * 연동되면(서버 /me 가 회원 등급을 주면) 원래 카드로 돌아와요.
 * rejected: 지점이 반려했을 때 — 같은 잠긴 카드에 '반려됨' · [다시 신청하기](→ 연동 요청) · [알림 확인하기](사유는 알림에서)만 열어 둬요.
 */
function PendingCard({ rejected = false, branch: requested, branchCode }: { rejected?: boolean; branch?: string; branchCode?: string }) {
  const myBranch = useMe((m) => m.branch);
  // 요청한 지점 (서버 요약) — 풀리는 순간의 앞면처럼 지점을 모를 땐 내 지점
  const branch = requested ?? myBranch;
  const now = useClock();
  const heroRoom = useHeroRoom();
  if (rejected) return <RejectedCard branch={branch} branchCode={branchCode ?? branch} now={now} />;
  const off = '연동되면 출석이 열려요';
  return (
    <View style={styles.wrap}>
      <ClapperArm />
      <View style={styles.shadowBox}>
        <View style={styles.shadow} />
        <View style={StyleSheet.flatten([styles.body, styles.bodyWait])}>
          <View style={styles.fields}>
            <Field label="스터디" value="미정" big color="#A79F8F" />
            <View style={StyleSheet.flatten([styles.field, styles.fieldDivider, { flex: 1 }])}>
              <PText style={styles.fieldLabel} color={Colors.inkSub}>
                연동
              </PText>
              <View style={styles.waitRow}>
                <PulseDot size={9} />
                <PText style={styles.fieldValue} color={Colors.purple}>
                  승인 대기
                </PText>
              </View>
            </View>
            <Field label="DATE" value={`${now.getMonth() + 1}.${pad(now.getDate())}`} divider narrow />
          </View>
          <View style={StyleSheet.flatten([styles.main, styles.mainWait])} onLayout={heroRoom.onMain}>
            <HeroChar pose="tilt" room={heroRoom.room} />
            <View style={styles.live}>
              <PulseDot size={10} square />
              <PText style={styles.liveText}>STANDBY</PText>
            </View>
            <PText variant="title" style={styles.heroTitle}>
              Almost on stage.
            </PText>
            <PText style={styles.waitSub}>{branch}이 회원 정보를 확인하고 있어요.</PText>
            <View style={StyleSheet.flatten([styles.actions, styles.actionsWait])} onLayout={heroRoom.onActions}>
              {/* 꺼 둔 버튼: 누르면 '출석하려면 지점 연동이 끝나야 해요' 토스트 (trial-guide memberGate) */}
              <Pressable onPress={() => memberGate('출석하려면')} sound={false} accessibilityRole="button" accessibilityLabel={off} accessibilityState={{ disabled: true }}>
                <View style={StyleSheet.flatten([styles.btn, styles.btnOff])}>
                  <View style={StyleSheet.flatten([styles.qr, styles.qrOff])}>
                    <LineIcon d={QR_PATH} size={16} width={2.2} color={Colors.white} />
                  </View>
                  <PText style={styles.btnTextOff} color={Colors.inkSub}>
                    {off}
                  </PText>
                </View>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

/**
 * 반려됨 (rejected): 권한은 비회원과 같아요. 출석은 잠긴 채, 다시 신청하는 길만 홈에 남겨요.
 * 반려 사유는 카드에 쓰지 않고 알림에서 봐요 (알림 → 연동 안 됨 화면의 '지점에서 남긴 말').
 */
function RejectedCard({ branch, branchCode, now }: { branch: string; branchCode: string; now: Date }) {
  const heroRoom = useHeroRoom();
  const again = () => {
    sfx('tap');
    // 연동 요청 화면이 보내면 서버 요약에 대기 한 건 → 카드가 '승인 대기'로 바뀌어요 (useCreateLinkRequest)
    updateOnboarding({ path: 'member', branch, branchCode });
    router.push('/onboarding/link');
  };
  const notis = () => {
    sfx('tap');
    router.push('/notifications');
  };
  return (
    <View style={styles.wrap}>
      <ClapperArm />
      <View style={styles.shadowBox}>
        <View style={styles.shadow} />
        <View style={StyleSheet.flatten([styles.body, styles.bodyWait])}>
          <View style={styles.fields}>
            <Field label="스터디" value="미정" big color="#A79F8F" />
            <View style={StyleSheet.flatten([styles.field, styles.fieldDivider, { flex: 1 }])}>
              <PText style={styles.fieldLabel} color={Colors.inkSub}>
                연동
              </PText>
              <View style={styles.waitRow}>
                <View style={styles.failDot} />
                <PText style={styles.fieldValue} color={FAIL_INK}>
                  반려됨
                </PText>
              </View>
            </View>
            <Field label="DATE" value={`${now.getMonth() + 1}.${pad(now.getDate())}`} divider narrow />
          </View>
          <View style={StyleSheet.flatten([styles.main, styles.mainWait])} onLayout={heroRoom.onMain}>
            <HeroChar pose="standard" room={heroRoom.room} />
            <View style={styles.live}>
              <View style={StyleSheet.flatten([styles.liveDot, styles.failLive])} />
              <PText style={styles.liveText}>RETAKE</PText>
            </View>
            <PText variant="title" style={styles.heroTitle}>
              One more take.
            </PText>
            <PText style={styles.waitSub}>{branch} 연동이 반려됐어요. 사유는 알림에서 볼 수 있어요.</PText>
            {/* 두 버튼을 위아래로 — 옆으로 놓으면 오른쪽 캐릭터 자리가 없어요 */}
            <View style={StyleSheet.flatten([styles.actions, styles.actionsWait, styles.actionsCol])} onLayout={heroRoom.onActions}>
              <Pressable onPress={again} accessibilityRole="button" accessibilityLabel="연동 반려됨 · 다시 신청하기">
                {({ pressed }) => (
                  <View style={StyleSheet.flatten([styles.btn, styles.btnAgain, pressed && styles.btnAgainPressed])}>
                    <View style={StyleSheet.flatten([styles.qr, styles.qrAgain])}>
                      <LineIcon d={RETRY_PATH} size={16} width={2.4} color={Colors.white} />
                    </View>
                    <PText style={styles.btnTextOff}>다시 신청하기</PText>
                    <LineIcon d={ARROW_PATH} size={17} width={2.4} />
                  </View>
                )}
              </Pressable>
              <Pressable onPress={notis} accessibilityRole="button" accessibilityLabel="반려 사유 · 알림 확인하기" hitSlop={4}>
                {({ pressed }) => (
                  <View style={StyleSheet.flatten([styles.link, pressed && styles.linkPressed])}>
                    <PText style={styles.linkText}>알림 확인하기</PText>
                  </View>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

/** 못 찾음 표시 글자색 (로즈 핑크를 진하게 — 라벤더 위에서 읽히게) */
const FAIL_INK = '#A8485F';
const RETRY_PATH = 'M4 12a8 8 0 0 1 14-5.3M20 4v4h-4M20 12a8 8 0 0 1-14 5.3M4 20v-4h4';

/** 보라 점: 둘레로 보라 빛이 퍼져요 (기다리는 중 표시 · plP 1.4초) */
const pulseRing = css.keyframes({
  '0%': { opacity: 0.45, transform: [{ scale: 1 }] },
  '100%': { opacity: 0, transform: [{ scale: 2.6 }] },
});
function PulseDot({ size, square }: { size: number; square?: boolean }) {
  const still = useStill();
  const shape = { width: size, height: size, borderRadius: square ? 5 : size / 2 };
  return (
    <View>
      {!still && (
        <Animated.View
          style={[styles.pulse, shape, { opacity: 0, animationName: pulseRing, animationDuration: '1.4s', animationIterationCount: 'infinite', animationTimingFunction: 'ease-out' }]}
        />
      )}
      <View style={[styles.pulseDot, shape]} />
    </View>
  );
}

function StudyCard({ onOpen }: { onOpen: (mode: 'rsvp' | 'checkin') => void }) {
  const [stage, setStage] = useState(0);
  const heroRoom = useHeroRoom();
  useFocusEffect(
    useCallback(() => {
      stageTurn.set((n) => (n + 1) % STAGE_LINES.length);
      setStage(stageTurn.get());
    }, []),
  );
  const now = useClock();
  const attend = useAttend();
  const hero = heroOf(attend, now);
  const count = countOf(attend, now);
  // 출석하고 스터디가 시작되면 제목이 바뀌어요 (포즈는 그대로)
  const title = hero.kind === 'onair' ? "You're on stage." : STAGE_LINES[stage];

  return (
    <View style={styles.wrap}>
      <ClapperArm />
      <View style={styles.shadowBox}>
        <View style={styles.shadow} />
        <View style={styles.body}>
          <View style={styles.fields}>
            <StudyField name={count.name} />
            <Field label={count.label} value={count.value} big divider />
            <Field label="DATE" value={`${now.getMonth() + 1}.${pad(now.getDate())}`} divider flex={0.62} />
          </View>
          <View style={styles.main} onLayout={heroRoom.onMain}>
            <HeroChar pose={POSES[stage]} room={heroRoom.room} />
            <View style={styles.live}>
              <LiveDot live={hero.live} />
              <PText style={styles.liveText}>{hero.badge}</PText>
            </View>
            <SwapTitle text={title} />
            <HeroActions hero={hero} slot={todayTeam(attend, minuteOf(now))?.slot ?? null} m={minuteOf(now)} onOpen={onOpen} onLayout={heroRoom.onActions} />
          </View>
        </View>
      </View>
    </View>
  );
}

/** 상태마다 버튼 (프로토타입 #heroActions: .hero-btn · .go · [disabled] · .done · .hero-link) */
function HeroActions({ hero, slot, m, onOpen, onLayout }: { hero: Hero; slot: number | null; m: number; onOpen: (mode: 'rsvp' | 'checkin') => void; onLayout?: (e: LayoutChangeEvent) => void }) {
  if (hero.kind === 'onair' || hero.kind === 'entered') {
    const label = hero.kind === 'onair' ? '입장 완료 · 무대 위' : '입장 완료!';
    return (
      <View style={styles.actions} onLayout={onLayout} accessible accessibilityLabel={label}>
        <View style={StyleSheet.flatten([styles.btn, styles.btnWhite])}>
          <QrBadge d={CHECK_PATH} />
          <PText style={styles.btnText}>{label}</PText>
        </View>
      </View>
    );
  }
  // 오늘 수업이 없어요 (전산에서 연 내 팀 수업 없음)
  if (slot === null && hero.kind !== 'action') return <WaitPill label="스터디 쉬는 날" />;
  // 사전 출석은 24시간 전까지라 오늘 수업은 기다렸다가 QR 출석만 (사전 출석 마감 · 아직 QR 전)
  if (slot !== null && (hero.kind === 'ready' || hero.kind === 'off') && !rsvpOpen(slot, m))
    return <WaitPill label={m > SLOTS[slot].start + QR_AFTER ? '오늘 출석 마감' : `${fmtMin(SLOTS[slot].start - QR_BEFORE)}부터 출석`} />;
  if (hero.kind === 'rsvp' && slot !== null) {
    const from = `${fmtMin(SLOTS[slot].start - QR_BEFORE)}부터 출석`;
    return (
      <View style={styles.actions} onLayout={onLayout}>
        <View style={StyleSheet.flatten([styles.btn, styles.btnWhite, styles.btnFlat])} accessible accessibilityLabel={from} accessibilityState={{ disabled: true }}>
          <QrBadge d={QR_PATH} />
          <PText style={styles.btnText}>{from}</PText>
        </View>
        <Pressable onPress={() => onOpen('rsvp')} accessibilityRole="button" accessibilityLabel="사전 출석 변경" hitSlop={4}>
          {({ pressed }) => (
            <View style={StyleSheet.flatten([styles.link, pressed && styles.linkPressed])}>
              <PText style={styles.linkText}>변경</PText>
            </View>
          )}
        </Pressable>
      </View>
    );
  }
  const go = hero.kind === 'action';
  const label = go ? '출석체크 하기' : hero.kind === 'off' ? '그래도 갈래요' : '사전 출석체크';
  return (
    <View style={styles.actions} onLayout={onLayout}>
      <Pressable onPress={() => onOpen(go ? 'checkin' : 'rsvp')} accessibilityRole="button" accessibilityLabel={label}>
        {({ pressed }) => (
          <View style={StyleSheet.flatten([styles.btn, pressed && styles.btnPressed])}>
            {go && <Shine />}
            <QrBadge d={QR_PATH} />
            <PText style={styles.btnText}>{label}</PText>
            <LineIcon d={ARROW_PATH} size={20} width={2.4} />
          </View>
        )}
      </Pressable>
    </View>
  );
}

/** 눌리지 않는 안내 버튼 (QR 출석 시간 전 · 오늘 수업 없음) */
function WaitPill({ label }: { label: string }) {
  return (
    <View style={styles.actions}>
      <View style={StyleSheet.flatten([styles.btn, styles.btnWhite, styles.btnFlat])} accessible accessibilityLabel={label} accessibilityState={{ disabled: true }}>
        <QrBadge d={QR_PATH} />
        <PText style={styles.btnText}>{label}</PText>
      </View>
    </View>
  );
}

/** 버튼 왼쪽 보라 동그라미 아이콘 (.qi) */
function QrBadge({ d }: { d: string }) {
  return (
    <View style={styles.qr}>
      <LineIcon d={d} size={20} width={2.2} color={Colors.white} />
    </View>
  );
}

/* ───────── 움직임 (프로토타입 .hero-*) ───────── */

/** 제목 문구가 바뀔 때마다 아래에서 톡 올라와요 (lineIn .55초) */
function SwapTitle({ text }: { text: string }) {
  const still = useStill();
  const p = useSharedValue(1);
  useEffect(() => {
    if (still) return;
    p.set(0);
    p.set(withTiming(1, { duration: 550, easing: SPRING }));
  }, [text, still, p]);
  const style = useAnimatedStyle(() => ({ opacity: Math.min(p.get() * 1.4, 1), transform: [{ translateY: 8 * (1 - p.get()) }] }));
  return (
    <Animated.View style={style}>
      <PText variant="title" style={styles.heroTitle}>
        {text}
      </PText>
    </Animated.View>
  );
}

const SHINE_EASE = cubicBezier(0.45, 0, 0.25, 1);

/** ACTION! 빨간 점: 둘레로 빨간 빛이 퍼지며 사라져요 (liveDot 1.4초 ease-out · CSS 애니메이션) */
const liveRing = css.keyframes({
  '0%': { opacity: 0.7, transform: [{ scale: 1 }] },
  '70%, 100%': { opacity: 0, transform: [{ scale: 2.6 }] },
});
function LiveDot({ live }: { live: Hero['live'] }) {
  const still = useStill();
  // 대기: 흰 점 · 출석 가능 / 스터디 중: 빨간 점 + 퍼지는 빛 · 입장 완료: 잉크 점 (.hero-live · .on · .done)
  const fill = live === 'on' ? '#FF4D4D' : live === 'done' ? Colors.ink : Colors.white;
  return (
    <View>
      {live === 'on' && !still && (
        <Animated.View
          style={[styles.liveRing, { opacity: 0, animationName: liveRing, animationDuration: '1.4s', animationIterationCount: 'infinite', animationTimingFunction: 'ease-out' }]}
        />
      )}
      <View style={StyleSheet.flatten([styles.liveDot, { backgroundColor: fill }])} />
    </View>
  );
}

/** 출석 버튼 위로 흰 빛이 5초마다 스쳐 지나가요 (btnShine 5초 · 1초 뒤 시작 · CSS 애니메이션) */
function Shine() {
  const still = useStill();
  const [w, setW] = useState(0);
  const kf = useMemo(
    () =>
      css.keyframes({
        '0%, 40%': { transform: [{ translateX: -0.7 * w }, { skewX: '-18deg' }], animationTimingFunction: SHINE_EASE },
        '100%': { transform: [{ translateX: 1.35 * w }, { skewX: '-18deg' }] },
      }),
    [w],
  );
  return (
    <View style={styles.shineBox} pointerEvents="none" onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {w > 0 && !still && (
        <Animated.View
          style={[
            styles.shine,
            { width: w * 0.46, transform: [{ translateX: -0.7 * w }, { skewX: '-18deg' }] },
            { animationName: kf, animationDuration: '5s', animationDelay: '1s', animationIterationCount: 'infinite', animationTimingFunction: 'linear' },
          ]}>
          <Svg width="100%" height="100%">
            <Defs>
              <LinearGradient id="shine" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor="#fff" stopOpacity={0} />
                <Stop offset="0.3" stopColor="#FFEC8C" stopOpacity={0.22} />
                <Stop offset="0.5" stopColor="#fff" stopOpacity={0.9} />
                <Stop offset="0.7" stopColor="#FFEC8C" stopOpacity={0.22} />
                <Stop offset="1" stopColor="#fff" stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#shine)" />
          </Svg>
        </Animated.View>
      )}
    </View>
  );
}

/** cornerBreathe 3초: 숨 쉬듯 살짝 눌렸다 펴져요 (아래 기준) */
const breathe = css.keyframes({
  '0%, 100%': { transform: [{ scaleX: 1 }, { scaleY: 1 }] },
  '50%': { transform: [{ scaleX: 1.03 }, { scaleY: 0.97 }] },
});

export type Pose = 'standard' | 'tilt' | 'jump';
const POSES: Pose[] = ['standard', 'tilt', 'jump'];
/** 포즈마다 이미지 · 크기 · 자리 · 눈 위치 [가운데 x, y, 가로 반지름, 세로 반지름, 기울기°] (원본 픽셀 — 그림의 검은 테 안쪽 흰자에 맞춰 잰 값 · 테 쪽으로 1.5 더) */
// 카드 안쪽에 다 들어오게 — 캐릭터가 카드 검은 테에 닿거나 잘리지 않게 그림 끝이 테 안쪽에서 3pt 넘게 떨어져요
const POSE = {
  standard: { src: require('@/assets/characters/c-purple-standard-3d.png'), W: 480, H: 335, width: 132, right: 8, bottom: 0, eyes: [[166.5, 68.7, 25.2, 44.9, -0.5], [245.3, 67.0, 25.2, 44.9, -0.6]] },
  tilt: { src: require('@/assets/characters/c-purple-tilt-3d.png'), W: 480, H: 352, width: 116, right: 8, bottom: 0, eyes: [[174.6, 66.9, 25.3, 45.0, 11.5], [252.1, 81.7, 25.3, 44.9, 11.7]] },
  jump: { src: require('@/assets/characters/c-purple-jump-3d.png'), W: 480, H: 484, width: 92, right: 10, bottom: -4, eyes: [[173.2, 66.4, 24.7, 44.4, 9.6], [251.0, 78.6, 25.3, 44.7, 9.8]] },
} as const;

/** 보라 팔로: 숨 쉬듯 살짝 눌렸다 펴지고(cornerBreathe 3초), 3초마다 눈을 깜빡여요 (avBlink) */
/**
 * 카드 안 버튼 줄의 오른쪽 끝을 재요: 캐릭터가 버튼 검은 테에 겹치지 않게, 좁은 폰에서는 캐릭터를 그만큼 줄여요.
 * 본문 칸에 onMain, 버튼 줄(왼쪽 정렬 · 내용 폭)에 onActions 를 달고 room 을 HeroChar 에 넘겨요.
 */
export function useHeroRoom() {
  const [mainW, setMainW] = useState(0);
  const [btnR, setBtnR] = useState(0);
  const onMain = useCallback((e: LayoutChangeEvent) => setMainW(e.nativeEvent.layout.width), []);
  const onActions = useCallback((e: LayoutChangeEvent) => {
    const l = e.nativeEvent.layout;
    setBtnR(l.x + l.width);
  }, []);
  return { room: mainW && btnR ? mainW - btnR : undefined, onMain, onActions };
}

/** 그림 왼쪽 투명 여백(7px)을 뺀 몫 · 버튼과 띄울 거리 · 가장 작은 폭 */
const VIS_L = 473 / 480;
const ROOM_GAP = 6;
const MIN_CHAR_W = 72;

export function HeroChar({ pose, room }: { pose: Pose; room?: number }) {
  const p = POSE[pose];
  const width = room == null ? p.width : Math.max(MIN_CHAR_W, Math.min(p.width, (room - p.right - ROOM_GAP) / VIS_L));
  const h = (width * p.H) / p.W;
  const still = useStill();
  const body = still ? {} : { animationName: breathe, animationDuration: '3s', animationIterationCount: 'infinite' as const, animationTimingFunction: 'ease-in-out' as const };
  const [delay] = useState(() => Math.round(Math.random() * 3000));
  const blink = useLoop(3000, { delay });
  const ry0 = p.eyes[0][3];
  const ry1 = p.eyes[1][3];
  const lid0 = useAnimatedProps(() => ({ height: (ry0 * 2 + 4) * kf(blink.get(), [0, 90, 93, 95, 100], [0, 0, 1, 1, 0]) }));
  const lid1 = useAnimatedProps(() => ({ height: (ry1 * 2 + 4) * kf(blink.get(), [0, 90, 93, 95, 100], [0, 0, 1, 1, 0]) }));
  const lids = [lid0, lid1];
  return (
    <Animated.View style={[styles.char, { width, height: h, right: p.right, bottom: p.bottom, transformOrigin: 'center bottom' }, body]} pointerEvents="none">
      <Image source={p.src} style={StyleSheet.absoluteFill} contentFit="contain" accessibilityIgnoresInvertColors />
      <Svg width={width} height={h} viewBox={`0 0 ${p.W} ${p.H}`} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={`lid-${pose}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#8B73E3" />
            <Stop offset="0.7" stopColor="#6C4FD6" />
            <Stop offset="1" stopColor="#5B40C0" />
          </LinearGradient>
          {p.eyes.map(([x, y, rx, ry], i) => (
            <ClipPath key={i} id={`eye-${pose}-${i}`}>
              <Ellipse cx={x} cy={y} rx={rx} ry={ry} />
            </ClipPath>
          ))}
        </Defs>
        {p.eyes.map(([x, y, rx, ry, a], i) => (
          <G key={i} transform={`rotate(${a} ${x} ${y})`} clipPath={`url(#eye-${pose}-${i})`}>
            <AnimatedRect x={x - rx - 2} y={y - ry - 2} width={rx * 2 + 4} fill={`url(#lid-${pose})`} animatedProps={lids[i]} />
          </G>
        ))}
      </Svg>
    </Animated.View>
  );
}

/** 위 첫 칸: 오늘 스터디 이름 (영어 월수 8시) · 더보기 → 내 스터디(내 팀 전체) */
function StudyField({ name }: { name: string }) {
  return (
    <View style={StyleSheet.flatten([styles.field, styles.studyField])}>
      <View style={styles.studyHead}>
        <PText style={styles.fieldLabel} color={Colors.inkSub}>
          스터디
        </PText>
        <Pressable
          onPress={() => {
            sfx('tap');
            router.push('/me/study');
          }}
          accessibilityRole="link"
          accessibilityLabel="내 팀 더보기"
          hitSlop={10}>
          {({ pressed }) => (
            <PText style={StyleSheet.flatten([styles.fieldLabel, pressed && styles.morePressed])} color={Colors.inkSub}>
              더보기 ›
            </PText>
          )}
        </Pressable>
      </View>
      <PText style={styles.studyName} numberOfLines={1}>
        {name}
      </PText>
    </View>
  );
}

export function Field({ label, value, big, divider, narrow, flex, color }: { label: string; value: string; big?: boolean; divider?: boolean; narrow?: boolean; flex?: number; color?: string }) {
  return (
    <View style={StyleSheet.flatten([styles.field, divider && styles.fieldDivider, { flex: flex ?? (narrow ? 0.8 : 1) }])}>
      <PText style={styles.fieldLabel} color={Colors.inkSub}>
        {label}
      </PText>
      <PText style={big ? styles.fieldBig : styles.fieldValue} color={color}>
        {value}
      </PText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 4, paddingTop: 35 },
  arm: { position: 'absolute', left: 0, right: 0, top: 0, height: 32, borderWidth: 2.5, borderColor: Colors.ink, borderTopLeftRadius: 10, borderTopRightRadius: 10, borderBottomLeftRadius: 4, borderBottomRightRadius: 4, overflow: 'hidden', backgroundColor: Colors.cream },
  armBar: { position: 'absolute', top: -4, height: ARM_H + 8, width: BAR_W, backgroundColor: Colors.ink, transform: [{ skewX: '-35deg' }] },
  shadowBox: { marginRight: 4, marginBottom: 4 },
  shadow: { position: 'absolute', top: 4, left: 4, right: -4, bottom: -4, backgroundColor: Colors.ink, borderTopLeftRadius: 6, borderTopRightRadius: 6, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  body: { borderWidth: 2.5, borderColor: Colors.ink, borderTopLeftRadius: 6, borderTopRightRadius: 6, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, overflow: 'hidden', backgroundColor: Colors.rosePink },
  fields: { flexDirection: 'row', backgroundColor: Colors.cream, borderBottomWidth: 2, borderColor: Colors.ink },
  field: { paddingTop: 9, paddingBottom: 10, paddingHorizontal: 12 },
  fieldDivider: { borderLeftWidth: 2, borderColor: Colors.ink },
  studyField: { flex: 1.2 },
  studyHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  morePressed: { opacity: 0.5 },
  studyName: { marginTop: 4, fontFamily: Font.body900, fontSize: 15.5, lineHeight: 26, letterSpacing: -0.4 },
  fieldLabel: { fontFamily: Font.display, fontSize: 9.5, lineHeight: 12, letterSpacing: 1.5 },
  fieldBig: { marginTop: 2, fontFamily: Font.display, fontSize: 25, lineHeight: 30, letterSpacing: -0.3, fontVariant: ['tabular-nums'] },
  fieldValue: { marginTop: 2, fontFamily: Font.body900, fontSize: 15, lineHeight: 30 },
  main: { paddingTop: 14, paddingHorizontal: 14, paddingBottom: 16, minHeight: 150 },
  char: { position: 'absolute' },
  liveRing: { position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF4D4D' },
  shineBox: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 28, overflow: 'hidden' },
  shine: { position: 'absolute', top: -2, bottom: -2, left: 0 },
  live: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  liveDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: Colors.ink, backgroundColor: '#FF4D4D' },
  liveText: { fontFamily: Font.display, fontSize: 13, lineHeight: 16, letterSpacing: 1.5 },
  heroTitle: { marginTop: 6, fontSize: 22, lineHeight: 25, letterSpacing: -0.8 },
  /** 내용 폭만큼 (오른쪽 끝을 재서 캐릭터 자리를 정해요) */
  actions: { alignSelf: 'flex-start', marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  btn: { height: 52, paddingLeft: 6, paddingRight: 18, borderRadius: 28, borderWidth: 2.5, borderColor: Colors.ink, backgroundColor: Colors.cream, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 6 },
  btnPressed: { transform: [{ translateY: 4 }], borderBottomWidth: 2.5 },
  // 입장 완료 · 출석 전(잠김): 흰 바탕 (.hero-btn.done · [disabled] 는 그림자도 없이)
  btnWhite: { backgroundColor: Colors.white },
  btnFlat: { borderBottomWidth: 2.5 },
  link: { height: 36, paddingHorizontal: 14, borderRadius: 18, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, justifyContent: 'center', boxShadow: '2px 2px 0 #1E1A2B' },
  linkPressed: { transform: [{ translateX: 2 }, { translateY: 2 }], boxShadow: '0 0 0 #1E1A2B' },
  linkText: { fontFamily: Font.body800, fontSize: 13.5, lineHeight: 18 },
  qr: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.purple, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontFamily: Font.body900, fontSize: 16, lineHeight: 22 },
  // 연동 확인 중 (PendingCard): 라벤더 · 조금 낮게 · 점선 버튼
  bodyWait: { backgroundColor: Colors.lavender },
  mainWait: { paddingTop: 10, paddingBottom: 12, minHeight: 0 },
  waitRow: { marginTop: 2, flexDirection: 'row', alignItems: 'center', gap: 7 },
  waitSub: { marginTop: 3, maxWidth: 230, fontFamily: Font.body700, fontSize: 13, lineHeight: 19 },
  actionsWait: { marginTop: 8 },
  btnOff: { height: 40, paddingLeft: 5, paddingRight: 16, gap: 8, borderBottomWidth: 2.5, borderStyle: 'dashed', backgroundColor: Colors.white },
  qrOff: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#CFC6B2' },
  btnTextOff: { fontFamily: Font.body900, fontSize: 14, lineHeight: 20 },
  // 반려됨 (RejectedCard): 분홍 점 · 누를 수 있는 '다시 신청하기' (그림자 있음) · 옆에 '알림 확인하기'
  failDot: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: Colors.rosePink, borderWidth: 1.5, borderColor: Colors.ink },
  failLive: { backgroundColor: Colors.rosePink },
  btnAgain: { height: 42, paddingLeft: 5, paddingRight: 14, gap: 8, borderBottomWidth: 5, backgroundColor: Colors.white },
  btnAgainPressed: { transform: [{ translateY: 3 }], borderBottomWidth: 2.5 },
  actionsCol: { flexDirection: 'column', alignItems: 'flex-start', gap: 10 },
  qrAgain: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.rosePink },
  pulse: { position: 'absolute', backgroundColor: Colors.purple },
  pulseDot: { backgroundColor: Colors.purple },
});

/** 같은 클래퍼보드 틀을 쓰는 다른 카드용 (home-card: 체험 · 둘러보기) */
export const clapperStyles = styles;
