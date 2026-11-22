import * as Speech from 'expo-speech';
import { router } from 'expo-router';
import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { Pressable } from '@/components/ui/pressable';
import { useBlockedNames } from '@/components/common/report-sheet';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { kfc } from '@/lib/motion';
import {
  CH_BG,
  CH_C,
  challengeSrc,
  chCat,
  clearFlash,
  dayOf,
  entriesOf,
  hotScore,
  isDarkBg,
  isJoined,
  isPre,
  leftText,
  meaningOf,
  memberCount,
  planText,
  posterBg,
  posterFontSize,
  posterWords,
  progressText,
  srcKindOf,
  CH_SRC,
  todayCount,
  type Challenge,
  type ChView,
} from '@/data/challenge';
import { haptic, sfx } from '@/lib/feedback';

import { Face } from './face';
import { ChIcon } from './icons';
import { CapBar, IconLine, LgBtn, SUB } from './parts';

/*
 * 챌린지 카드 (프로토타입 LG_CARD.chal · chHotHTML).
 * - DailyCard: 일상 챌린지 가로 카드 (.lg-pc.chl — 왼쪽 색 칸 96 + 오른쪽 상태 · 이름 · 일정 · 인원 · 막대 · 버튼)
 * - ExprCard: 표현 챌린지 (.lg-pc.chx — 노랑 머리 + 문장 미리보기 · 프사 · 문장 쓰기)
 * - HotBox: 지금 핫한 챌린지 TOP 3 (.lg-hot)
 */

export const openChallenge = (p: Challenge, write = false) => {
  sfx('tap');
  router.push(write ? { pathname: '/challenge/[id]', params: { id: p.id, write: '1' } } : { pathname: '/challenge/[id]', params: { id: p.id } });
};
const openProfile = (name: string) => router.push({ pathname: '/me/profile/[id]', params: { id: name } });

/** 카드 테두리 · 4px 하드 섀도 (box-shadow 는 자리를 차지하지 않아서 Raised 대신 그림자만 깔아요) */
function Shell({ radius, children, flash }: { radius: number; children: ReactNode; flash?: boolean }) {
  return (
    <FlashWrap on={!!flash} radius={radius}>
      <View pointerEvents="none" style={[styles.shadow, { borderRadius: radius }]} />
      <View style={[styles.shell, { borderRadius: radius }]}>{children}</View>
    </FlashWrap>
  );
}

/**
 * 방금 연 챌린지: 노란 빛이 한 번 퍼졌다 사라져요 (@keyframes lgNew 1.5s cubic-bezier(.3,1.4,.5,1)).
 */
/** lgNew cubic-bezier(.3,1.4,.5,1) */
const NEW_EASE = Easing.bezierFn(0.3, 1.4, 0.5, 1);

function FlashWrap({ on, radius, children }: { on: boolean; radius: number; children: ReactNode }) {
  const still = useReducedMotion();
  const t = useSharedValue(on && !still ? 0 : 1);
  useEffect(() => {
    if (!on) return;
    if (still) {
      clearFlash();
      return;
    }
    t.set(0);
    t.set(withTiming(1, { duration: 1500, easing: Easing.linear }));
    const id = setTimeout(clearFlash, 1600);
    return () => clearTimeout(id);
  }, [on, still, t]);
  // 시계는 선형 · 곡선은 키프레임 구간마다 (CSS 와 같게)
  const box = useAnimatedStyle(() => ({ transform: [{ scale: kfc(t.get(), [0, 30, 100], [0.94, 1.02, 1], NEW_EASE) }] }));
  const ring = useAnimatedStyle(() => {
    const spread = Math.max(0, kfc(t.get(), [0, 30, 100], [0, 10, 0], NEW_EASE));
    return { top: -spread, left: -spread, right: -spread, bottom: -spread, borderRadius: radius + spread, opacity: Math.max(0, kfc(t.get(), [0, 30, 100], [0.9, 0.55, 0], NEW_EASE)) };
  });
  // 빛이 꺼져도 같은 Animated.View 를 그대로 둬요 (바꿔 끼우면 카드 전체가 새로 그려져 이미지가 깜빡여요)
  return (
    <Animated.View style={box}>
      {on ? <Animated.View pointerEvents="none" style={[styles.flashRing, ring]} /> : null}
      {children}
    </Animated.View>
  );
}

// ---- 일상 챌린지 가로 카드 ----
export function DailyCard({ p, s, onCheck }: { p: Challenge; s: ChView; onCheck: (p: Challenge) => void }) {
  const jn = isJoined(p, s);
  const pre = isPre(p);
  const j = !!s.checked[p.id];
  const d = dayOf(p, s);
  const bg = posterBg(p);
  const w = posterWords(p);
  const mem = memberCount(p, s);

  // 버튼 하나: 멤버 초대 · 참여하기 / 도전 신청 · 신청 완료 · 오늘 인증 / 인증 완료
  let btn: ReactNode;
  if (p.mine && pre) btn = <LgBtn label="멤버 초대" tone="purple" onPress={invite} />;
  else if (!jn) btn = <LgBtn label={pre ? '도전 신청' : '참여하기'} tone="purple" onPress={() => openChallenge(p)} />;
  else if (pre) btn = <LgBtn label="신청 완료" tone="done" onPress={() => openChallenge(p)} />;
  else btn = <LgBtn label={j ? '인증 완료' : '오늘 인증'} tone={j ? 'done' : 'yellow'} onPress={() => onCheck(p)} />;

  return (
    <Shell radius={18} flash={s.flash === p.id}>
      <View style={styles.row}>
        <Pressable onPress={() => openChallenge(p)} accessibilityRole="button" accessibilityLabel={`${p.name} 자세히 보기`} style={[styles.pst, { backgroundColor: bg }]}>
          <PText style={[styles.pw, { fontSize: posterFontSize(w), color: isDarkBg(bg) ? CH_C.y : Colors.ink }]}>{w}</PText>
        </Pressable>
        <View style={styles.pcb}>
          <PText numberOfLines={1} style={styles.ck}>
            {jn && !p.mine ? <PText style={styles.ckOn}>참여 중</PText> : null}
            {jn && !p.mine ? ' · ' : ''}
            {progressText(p, s)}
          </PText>
          <Pressable onPress={() => openChallenge(p)} accessibilityRole="button" hitSlop={4}>
            <PText numberOfLines={1} style={styles.t}>
              {p.name}
            </PText>
          </Pressable>
          <View style={styles.m}>
            <IconLine icon="cal" text={planText(p)} />
            <IconLine icon={p.way === 'photo' ? 'cam' : 'cmt'} text={p.way === 'photo' ? '사진 인증' : '댓글 인증'} />
          </View>
          <View style={styles.foot}>
            <View style={styles.footL}>
              <PText numberOfLines={1} style={styles.n}>
                {pre ? `${mem}명 신청` : `${mem}명 · 오늘 ${todayCount(p, s)}명 인증`}
              </PText>
              <CapBar cur={pre ? 0 : d} max={p.of} />
            </View>
            {btn}
          </View>
        </View>
      </View>
      <Pressable onPress={() => openProfile(p.who)} accessibilityRole="button" accessibilityLabel={`${p.who} 프로필`} style={styles.chav}>
        <Face name={p.who} color={p.av} size={42} shadow />
      </Pressable>
    </Shell>
  );
}

/** 프로토타입 chinv: 초대 링크 복사 알림 */
export const invite = () => {
  sfx('pick');
  showToast('초대 링크를 복사했어요 · 멤버에게 보내 보세요');
};

// ---- 표현 챌린지 카드 ----
export function ExprCard({
  p,
  s,
  carousel = false,
  width,
  onOpen = openChallenge,
}: {
  p: Challenge;
  s: ChView;
  carousel?: boolean;
  width?: number;
  /** 표현 챌린지 창 열기 (라운지 안에서는 그 자리에서 시트로) — write: 입력칸에 바로 */
  onOpen?: (p: Challenge, write?: boolean) => void;
}) {
  const L = entriesOf(p, s, useBlockedNames());
  const last = L[L.length - 1];
  const people = [...new Map(L.map((c) => [c.n, c])).values()];
  const jn = isJoined(p, s);
  const src = challengeSrc(p);
  const say = () => {
    haptic('tap');
    Speech.stop();
    Speech.speak(p.q || p.hl || '', { language: p.lang, rate: 0.95 });
  };
  const face = carousel ? 22 : 24;
  return (
    <View style={width ? { width } : null}>
      <Shell radius={18} flash={s.flash === p.id}>
        {/* 카드 칸 전체가 창을 여는 버튼 — 안쪽 버튼(얼굴 · 듣기 · 문장 쓰기)과 겹치지 않게 뒤에 깔아요 (웹에서 버튼 안 버튼 금지) */}
        <View style={styles.exh}>
          <Pressable onPress={() => onOpen(p)} accessibilityRole="button" accessibilityLabel={`${p.hl} 나만의 문장 완성하기`} style={StyleSheet.absoluteFill} />
          <Pressable onPress={() => openProfile(p.who)} accessibilityRole="button" accessibilityLabel={`${p.who} 프로필`}>
            <Face name={p.who} color={p.av} size={38} />
          </Pressable>
          <View style={[styles.exTx, styles.passThrough]}>
            <PText style={styles.who} numberOfLines={carousel ? 2 : undefined}>
              <PText style={styles.ms}>나만의 문장 완성하기</PText>
              {` · ${p.mine ? '내가 연 챌린지' : p.who + (jn ? ' · 참여 중' : '')} · `}
              <PText style={styles.left}>{leftText(p)}</PText>
            </PText>
            <PText style={styles.e} numberOfLines={carousel ? 1 : undefined}>
              {p.hl || p.q}
            </PText>
            <PText style={styles.mean}>{meaningOf(p)}</PText>
            <IconLine icon={CH_SRC[srcKindOf(p.src)].icon} text={src} style={styles.src} textStyle={styles.srcT} />
          </View>
          <Pressable onPress={say} accessibilityRole="button" accessibilityLabel="표현 듣기" style={({ pressed }) => [styles.say, pressed && styles.sayOn]}>
            <ChIcon name="spk" size={18} />
          </Pressable>
        </View>
        <View style={[styles.chxc, carousel && styles.chxcHs]}>
          <Pressable onPress={() => onOpen(p)} accessibilityRole="button" accessibilityLabel="문장 보기" style={StyleSheet.absoluteFill} />
          {!carousel && last ? (
            <View style={[styles.pv, styles.passThrough]}>
              <Face name={last.n} color={last.c} size={26} />
              <PText numberOfLines={1} style={styles.pvT}>
                <PText style={styles.pvB}>{last.n}</PText> {last.x}
              </PText>
            </View>
          ) : null}
          <View style={[styles.ft, carousel && styles.ftHs, styles.passBox]}>
            {people.length ? (
              <>
                <View style={[styles.avs, styles.passThrough]}>
                  {people.slice(0, 3).map((c, i) => (
                    <Face key={c.n} name={c.n} color={c.c} size={face} style={i ? { marginLeft: carousel ? -8 : -7 } : null} />
                  ))}
                  {people.length > 3 ? (
                    <View style={[styles.more, { height: face, minWidth: face, marginLeft: carousel ? -8 : -7 }]}>
                      <PText style={styles.moreT}>+{people.length - 3}</PText>
                    </View>
                  ) : null}
                </View>
                <PText numberOfLines={1} style={[styles.cnt, styles.passThrough]}>{`${people.length}명 · 문장 ${L.length}`}</PText>
              </>
            ) : (
              <View style={[styles.first, styles.passThrough]}>
                <ChIcon name="edit" size={14} />
                <PText numberOfLines={1} style={styles.cntFirst}>
                  첫 문장을 만들어 보세요
                </PText>
              </View>
            )}
            <LgBtn label="문장 쓰기" padX={11} icon={<ChIcon name="edit" size={15} />} onPress={() => onOpen(p, true)} />
          </View>
        </View>
      </Shell>
    </View>
  );
}

// ---- 지금 핫한 챌린지 TOP 3 ----
const NO_STYLE = [
  { color: Colors.rosePink, fontSize: 22 },
  { color: Colors.purple, fontSize: 18 },
  { color: SUB, fontSize: 18 },
];
export function HotBox({ list, s }: { list: Challenge[]; s: ChView }) {
  const top = list
    .filter((p) => !p.mine)
    .sort((a, b) => hotScore(b, s) - hotScore(a, s))
    .slice(0, 3);
  if (!top.length) return null;
  return (
    <View>
      <View pointerEvents="none" style={[styles.shadow, { borderRadius: 20 }]} />
      <View style={styles.hot}>
        <View style={styles.hh}>
          <ChIcon name="flame" size={17} fill={Colors.rosePink} width={1.8} />
          <PText style={styles.hhB}>지금 핫한 챌린지</PText>
          <PText style={styles.hhS}>참여 · 인증이 많은 순</PText>
        </View>
        {top.map((p, i) => {
          const C = chCat(p.cat);
          return (
            <Pressable
              key={p.id}
              onPress={() => openChallenge(p)}
              accessibilityRole="button"
              accessibilityLabel={`${i + 1}위 ${p.name}`}
              style={({ pressed }) => [styles.hr, i > 0 && styles.hrLine, pressed && { opacity: 0.7 }]}>
              <PText style={[styles.no, NO_STYLE[i], { lineHeight: NO_STYLE[i].fontSize * 1.25 }]}>{i + 1}</PText>
              <View style={[styles.hic, { backgroundColor: CH_BG[C.tone] }]}>
                <ChIcon name={C.icon} size={17} />
              </View>
              <View style={styles.htx}>
                <PText numberOfLines={1} style={styles.hb}>
                  {p.name}
                </PText>
                <PText numberOfLines={1} style={styles.hs}>
                  {`${memberCount(p, s)}명 참여 · ${isPre(p) ? p.start : `오늘 ${todayCount(p, s)}명 인증`}`}
                </PText>
              </View>
              {isJoined(p, s) ? <PText style={styles.hem}>참여 중</PText> : null}
              <PText style={styles.go}>›</PText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: { position: 'absolute', top: 4, left: 4, right: -4, bottom: -4, backgroundColor: Colors.ink },
  shell: { borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, overflow: 'hidden' },
  flashRing: { position: 'absolute', backgroundColor: 'rgb(255,214,0)' },
  row: { flexDirection: 'row' },
  // 왼쪽 색 칸 (.lg-pc.chl .lg-pst: 96 · 오른쪽 잉크 선 · 글씨는 위 12 왼쪽 10)
  pst: { width: 96, minHeight: 112, borderRightWidth: 2, borderColor: Colors.ink },
  pw: { position: 'absolute', top: 12, left: 10, right: 6, fontFamily: Font.display, letterSpacing: -0.3, lineHeight: 14 },
  chav: { position: 'absolute', left: 10, bottom: 10 },
  pcb: { flex: 1, minWidth: 0, paddingTop: 11, paddingHorizontal: 12, paddingBottom: 12 },
  ck: { fontFamily: Font.body800, fontSize: 11.5, lineHeight: 16, color: SUB },
  ckOn: { fontFamily: Font.body900, fontSize: 11.5, color: Colors.purple },
  t: { marginTop: 2, fontFamily: Font.body900, fontSize: 15.5, lineHeight: 20.15 },
  m: { marginTop: 3, flexDirection: 'row', flexWrap: 'wrap', columnGap: 12, rowGap: 3 },
  foot: { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 10 },
  footL: { flex: 1, minWidth: 0 },
  n: { fontFamily: Font.body900, fontSize: 11.5, lineHeight: 18 },
  // 표현 챌린지 (.lg-pc.chx)
  exh: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 10, paddingRight: 10, paddingBottom: 10, paddingLeft: 12, backgroundColor: '#FFF8CC', borderBottomWidth: 2, borderColor: Colors.ink },
  exTx: { flex: 1, minWidth: 0 },
  who: { fontFamily: Font.body800, fontSize: 11.5, lineHeight: 16, color: SUB },
  ms: { fontFamily: Font.body900, fontSize: 11.5, color: Colors.ink },
  left: { fontFamily: Font.body900, fontSize: 11.5, color: Colors.purple },
  e: { marginTop: 2, fontFamily: Font.body900, fontSize: 19, lineHeight: 22.8 },
  mean: { marginTop: 2, fontFamily: Font.body800, fontSize: 13, lineHeight: 19, color: Colors.purple },
  src: { marginTop: 5 },
  srcT: { fontFamily: Font.body800, fontSize: 11.5, lineHeight: 16 },
  say: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', boxShadow: [{ offsetX: 2, offsetY: 2, blurRadius: 0, color: Colors.ink }] },
  sayOn: { transform: [{ translateX: 2 }, { translateY: 2 }], boxShadow: [] },
  chxc: { paddingTop: 10, paddingRight: 12, paddingBottom: 12, paddingLeft: 14 },
  chxcHs: { paddingTop: 8, paddingRight: 10, paddingBottom: 10, paddingLeft: 12, marginTop: 'auto' },
  pv: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pvT: { flex: 1, minWidth: 0, fontFamily: Font.body600, fontSize: 13, lineHeight: 19 },
  pvB: { fontFamily: Font.body900, fontSize: 13 },
  ft: { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  ftHs: { marginTop: 0, gap: 5 },
  avs: { flexDirection: 'row', flexShrink: 0 },
  passThrough: { pointerEvents: 'none' },
  passBox: { pointerEvents: 'box-none' },
  more: { borderRadius: 12, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.ink, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center' },
  moreT: { fontFamily: Font.body900, fontSize: 10, lineHeight: 13, color: Colors.white, letterSpacing: -0.2 },
  cnt: { flex: 1, minWidth: 0, fontFamily: Font.body900, fontSize: 12, lineHeight: 17 },
  first: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 4 },
  cntFirst: { flexShrink: 1, fontFamily: Font.body900, fontSize: 12, lineHeight: 17 },
  // 지금 핫한 챌린지 (.lg-hot)
  hot: { borderWidth: 2, borderColor: Colors.ink, borderRadius: 20, backgroundColor: Colors.white, paddingTop: 12, paddingHorizontal: 14, paddingBottom: 6 },
  hh: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  hhB: { fontFamily: Font.body900, fontSize: 15, lineHeight: 21 },
  hhS: { marginLeft: 'auto', fontFamily: Font.body700, fontSize: 11.5, lineHeight: 16, color: SUB },
  hr: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  hrLine: { borderTopWidth: 1.5, borderColor: Colors.line },
  no: { width: 20, textAlign: 'center', fontFamily: Font.display },
  hic: { width: 42, height: 42, borderRadius: 12, borderWidth: 2, borderColor: Colors.ink, alignItems: 'center', justifyContent: 'center' },
  htx: { flex: 1, minWidth: 0, gap: 2 },
  hb: { fontFamily: Font.body900, fontSize: 14, lineHeight: 20 },
  hs: { fontFamily: Font.body700, fontSize: 11.5, lineHeight: 16, color: SUB },
  hem: { fontFamily: Font.body900, fontSize: 11, lineHeight: 16, color: Colors.purple },
  go: { fontFamily: Font.body500, fontSize: 18, lineHeight: 26, color: SUB },
});
