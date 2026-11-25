import { router, useIsFocused } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSequence, withTiming } from 'react-native-reanimated';

import { Pressable } from '@/components/ui/pressable';
import { AvatarStage } from '@/components/character/avatar';
import { Raised } from '@/components/ui/raised';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors, Radius } from '@/constants/theme';
import { followLists } from '@/data/my';
import { sfx } from '@/lib/feedback';
import { EASE, SPRING } from '@/lib/motion';
import { finishMyMoment, useLinkEvents } from '@/state/link-events';
import { useMyAvatar } from '@/state/avatar';
import { useMe } from '@/state/me';

import { BioSheet } from './bio-sheet';
import { DecoIcon, LgIcon, SparkIcon } from './icons';
import { Lift } from './lift';

const LANG_NAME = { en: '영어', ja: '일본어', zh: '중국어', es: '스페인어' } as const;

/**
 * 마이 맨 위 캐릭터 룸 카드 (프로토타입 .my-hero): 무대 + [꾸미기] 붓 · 스파크 잔액 + 이름 · 지점 줄 · 한 줄 소개(누르면 쓰기 · 고치기 창) · 팔로잉/팔로워.
 * width = 카드 바깥 폭 (그림자 제외).
 */
export function MyHero({ width, onFollow }: { width: number; onFollow: (t: 'fing' | 'fer') => void }) {
  const me = useMe();
  const av = useMyAvatar();
  const [bioOpen, setBioOpen] = useState(false);
  const lists = followLists(me.name, me, me.following);
  // 카드 테두리 2 · 안쪽 여백 10
  const stageW = width - 4 - 20;
  return (
    <>
      <Raised radius={Radius.card}>
        <View style={[styles.card, { width }]}>
          <AvatarStage av={av} width={stageW} border big />
          <Pressable
            onPress={() => {
              sfx('tap');
              router.push('/me/customize');
            }}
            accessibilityRole="button"
            accessibilityLabel="캐릭터 꾸미기"
            hitSlop={4}
            style={styles.deco}>
            {({ pressed }) => (
              <Lift radius={19} pressed={pressed}>
                <View style={styles.decoBtn}>
                  <DecoIcon />
                </View>
              </Lift>
            )}
          </Pressable>
          <View style={styles.spark} accessibilityLabel={`스파크 ${me.sparks}개`}>
            <SparkIcon />
            <PText style={styles.sparkN}>{me.sparks.toLocaleString()}</PText>
          </View>
          <View style={styles.id}>
            <PText style={styles.name}>{me.name}</PText>
            <View style={styles.subRow}>
              {/* 지점: 연동했거나 요청한 지점 · 체험 예약한 지점. 앱 구경(비회원)은 지점이 없어서 언어 · 레벨만 */}
              <PText style={styles.sub}>
                {me.link !== 'none' ? `${me.branch} · ` : me.trial ? `${me.trial.branch} · ` : ''}
                {LANG_NAME[me.lang]}
                {/* 레벨은 지점 회원(연동 요청 · 연동됨)만 — 비회원은 아직 레벨 테스트 전이에요 */}
                {me.link !== 'none' ? ` ${me.level}` : ''}
                {me.link === 'linked' ? ' · 회원' : ''}
              </PText>
              {/* 지점 회원(연동을 요청한 사람)만: 연동됨 · 연동 승인 대기중 · 연동 신청하기(연동 안 됨 → 다시 신청).
                  비회원은 '체험 예약' · '비회원' 표시만 */}
              {me.link === 'rejected' ? <LinkRequestChip /> : <LinkTag link={me.link !== 'none' ? me.link : me.trial ? 'trial' : 'guest'} />}
            </View>
            {/* 한 줄 소개: 누르면 바로 쓰기 · 고치기 창 (비어 있으면 흐린 안내 글 + 연필) */}
            <Pressable
              onPress={() => {
                sfx('tap');
                setBioOpen(true);
              }}
              accessibilityRole="button"
              accessibilityLabel={me.bio ? `한 줄 소개 ${me.bio} · 고치기` : '한 줄 소개 남기기'}
              hitSlop={6}
              style={styles.bioBtn}>
              {({ pressed }) => (
                <View style={[styles.bioRow, pressed && styles.bioPressed]}>
                  <PText style={[styles.bio, !me.bio && styles.bioEmpty]} numberOfLines={2}>
                    {me.bio || '한 줄 소개를 남겨 보세요'}
                  </PText>
                  <View style={styles.bioPen}>
                    <LgIcon name="pen" size={14} stroke={Colors.inkSub} sw={2.2} />
                  </View>
                </View>
              )}
            </Pressable>
            <View style={styles.fol}>
              <Pressable onPress={() => onFollow('fing')} accessibilityRole="button" accessibilityLabel={`팔로잉 ${lists.fing.length}명`} hitSlop={10} style={styles.folBtn}>
                <PText style={styles.folN}>{lists.fing.length}</PText>
                <PText style={styles.folT}>팔로잉</PText>
              </Pressable>
              <Pressable onPress={() => onFollow('fer')} accessibilityRole="button" accessibilityLabel={`팔로워 ${lists.fer.length}명`} hitSlop={10} style={styles.folBtn}>
                <PText style={styles.folN}>{lists.fer.length}</PText>
                <PText style={styles.folT}>팔로워</PText>
              </Pressable>
            </View>
          </View>
        </View>
      </Raised>
      <BioSheet open={bioOpen} onClose={() => setBioOpen(false)} bio={me.bio} />
    </>
  );
}

const TAG_LABEL = { pending: '연동 승인 대기중', linked: '연동됨', trial: '체험 예약', guest: '비회원' } as const;

/**
 * 지점 연동 표시 (본인 마이에만): 흰 알약 + 잉크 테두리 + 색 점. 점 색으로 상태를 구분해요
 * — 연동됨 초록 · 승인 대기중 보라 · 체험 예약 파랑 · 비회원 회색(테두리 · 글자도 흐리게).
 * 방금 연동됐으면(state/link-events myMoment) 마이가 처음 보일 때 '연동됨'이 톡 튀어나와요 (한 번만 · 움직임 줄이기면 그냥 보여요).
 */
function LinkTag({ link }: { link: keyof typeof TAG_LABEL }) {
  const label = TAG_LABEL[link];
  const pop = usePopOnce(link === 'linked');
  const guest = link === 'guest';
  return (
    <Animated.View style={[styles.tag, guest && styles.tagGuest, pop]} accessible accessibilityLabel={guest || link === 'trial' ? label : `지점 ${label}`}>
      <View style={[styles.tagDot, DOT[link]]} />
      <PText style={[styles.tagText, guest && styles.tagTextGuest]}>{label}</PText>
    </Animated.View>
  );
}

/** 연동 직후 마이가 보이는 첫 순간: 0 → 1.25 → 1 로 튀어나와요 */
function usePopOnce(linked: boolean) {
  const focused = useIsFocused();
  const still = useReducedMotion();
  const moment = useLinkEvents((s) => s.myMoment);
  const play = linked && moment && focused;
  const s = useSharedValue(1);
  useEffect(() => {
    if (!play) return;
    finishMyMoment();
    if (still) return;
    sfx('pick');
    s.set(0);
    s.set(withDelay(450, withSequence(withTiming(1.25, { duration: 380, easing: EASE }), withTiming(1, { duration: 360, easing: SPRING }))));
  }, [play, still, s]);
  return useAnimatedStyle(() => ({ opacity: Math.min(s.get() * 2, 1), transform: [{ scale: s.get() }] }));
}

/** 연동 신청하기 (흰 바탕 · 잉크 테두리 · ›): 연동이 안 된 지점 회원 — 누르면 지점이 남긴 말을 보고 다시 요청 (/link-rejected) */
function LinkRequestChip() {
  return (
    <Pressable
      onPress={() => {
        sfx('tap');
        router.push('/link-rejected');
      }}
      accessibilityRole="button"
      accessibilityLabel="지점 연동 신청하기"
      hitSlop={8}>
      {({ pressed }) => (
        <View style={[styles.reqChip, pressed && styles.reqChipPressed]}>
          <PText style={styles.reqText}>연동 신청하기 ›</PText>
        </View>
      )}
    </Pressable>
  );
}

/** 점 색: 연동됨 초록 · 승인 대기중 보라 · 체험 예약 파랑 · 비회원 회색 (연동 안 됨은 점 없이 '연동 신청하기 ›' 칩) */
const DOT = {
  linked: { backgroundColor: '#24834B' },
  pending: { backgroundColor: Colors.purple },
  trial: { backgroundColor: Colors.langEn },
  guest: { backgroundColor: '#B9B0A0' },
} as const;

const styles = StyleSheet.create({
  card: { padding: 10, gap: 12, borderWidth: 2, borderColor: Colors.ink, borderRadius: Radius.card, backgroundColor: Colors.white },
  deco: { position: 'absolute', top: 22, right: 22, zIndex: 4 },
  decoBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: Colors.ink,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spark: { position: 'absolute', top: 28, left: 22, zIndex: 4, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 14, paddingVertical: 4, paddingHorizontal: 10 },
  sparkN: { fontFamily: Font.display, fontSize: 13, lineHeight: 17 },
  id: { paddingHorizontal: 6, paddingBottom: 6, gap: 2 },
  name: { fontFamily: Font.display, fontSize: 22, lineHeight: 28 },
  subRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 5 },
  sub: { fontFamily: Font.body800, fontSize: 13, lineHeight: 19, color: Colors.inkSub },
  // 연동 표시 · 연동 신청하기 칩: 같은 흰 알약 (높이 · 테두리 · 글자 같게)
  tag: { height: 19, paddingLeft: 6, paddingRight: 8, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.ink, backgroundColor: Colors.white, flexDirection: 'row', alignItems: 'center', gap: 4 },
  tagGuest: { borderColor: '#CFC6B4' },
  reqChip: { height: 19, paddingHorizontal: 8, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.ink, backgroundColor: Colors.white, justifyContent: 'center' },
  reqChipPressed: { backgroundColor: '#F1EAD9' },
  reqText: { fontFamily: Font.body900, fontSize: 10.5, lineHeight: 14, letterSpacing: -0.2 },
  tagDot: { width: 6, height: 6, borderRadius: 3 },
  tagText: { fontFamily: Font.body900, fontSize: 10.5, lineHeight: 14, letterSpacing: -0.2, color: Colors.ink },
  tagTextGuest: { color: Colors.inkSub },
  bio: { flexShrink: 1, fontFamily: Font.body600, fontSize: 14, lineHeight: 21 },
  bioBtn: { alignSelf: 'flex-start', maxWidth: '100%', marginTop: 4 },
  bioRow: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8 },
  bioPressed: { opacity: 0.6 },
  // 비어 있으면 본문이 아니라 누르는 자리로 보이게: 흐린 보조색
  bioEmpty: { color: Colors.inkSub, fontFamily: Font.body700 },
  bioPen: { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center' },
  fol: { flexDirection: 'row', gap: 16, marginTop: 8 },
  folBtn: { flexDirection: 'row', alignItems: 'baseline' },
  folN: { fontFamily: Font.display, fontSize: 15, lineHeight: 20, marginRight: 4 },
  folT: { fontFamily: Font.body800, fontSize: 13, lineHeight: 19, color: Colors.inkSub },
});
