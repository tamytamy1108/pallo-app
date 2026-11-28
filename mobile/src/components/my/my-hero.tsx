import { router, useIsFocused } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Mask, Rect } from 'react-native-svg';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSequence, withTiming } from 'react-native-reanimated';

import { useBranchProgress, type BranchProgress } from '@/api/use-branch-progress';
import { RoleTag, type RoleKind } from '@/components/common/role-tag';
import { Pressable } from '@/components/ui/pressable';
import { AvatarStage } from '@/components/character/avatar';
import { Raised } from '@/components/ui/raised';
import { SheetOptions } from '@/components/common/sheet-parts';
import { runAfterSheetClose, Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors, Radius } from '@/constants/theme';
import { sfx } from '@/lib/feedback';
import { EASE, SPRING } from '@/lib/motion';
import { finishMyMoment, useLinkEvents } from '@/state/link-events';
import { useMyAvatar } from '@/state/avatar';
import { isMember } from '@/state/access';
import { myBranches, useMe, type Me } from '@/state/me';

import { BioSheet } from './bio-sheet';
import { DecoIcon, SparkIcon } from './icons';

const LANG_NAME = { en: '영어', ja: '일본어', zh: '중국어', es: '스페인어' } as const;

/** 계정 역할 → 이름 옆 글자 (회원 · 비회원은 없음) */
const staffKind = (role: Me['role']): RoleKind | null => (role === 'leader' ? 'pro' : role === 'manager' ? 'staff' : null);

/**
 * 프로 · 직원 이름 아래 줄 (시안 prototype/assets/roles/my-pro-1 · my-staff-1): 등록된 지점 모두 → 언어 (지점마다 짝짓지 않아요).
 * 예: 하남점 · 잠실점 · 영어 · 일본어 / 지점 관리자는 하남점 · 잠실점 · 지점 관리자
 */
function staffLine(me: Me) {
  const branches = myBranches(me);
  if (me.role === 'manager') return [...branches, '지점 관리자'].join(' · ');
  const langs = me.teachLangs.length ? me.teachLangs : [me.lang];
  return [...branches, ...langs.map((l) => LANG_NAME[l])].join(' · ');
}

/**
 * 마이 맨 위 캐릭터 룸 카드 (프로토타입 .my-hero): 무대 + 붓(누르면 캐릭터 꾸미기 · 한 줄 소개 수정하기 메뉴) · 스파크 잔액 + 이름 · 지점 줄 · 한 줄 소개(글만) · 팔로잉/팔로워.
 * width = 카드 바깥 폭 (그림자 제외).
 * sparks · follow = 마이 집계(GET /me/mypage) 값 — 아직 못 받았으면(undefined) '–' 이고, 팔로우 칸은 눌리지 않아요.
 */
export function MyHero({
  width,
  sparks,
  follow,
  onFollow,
}: {
  width: number;
  sparks: number | undefined;
  follow: { following: number; followers: number } | undefined;
  onFollow: (t: 'fing' | 'fer') => void;
}) {
  const me = useMe();
  const av = useMyAvatar();
  const [bioOpen, setBioOpen] = useState(false);
  // 붓 버튼 메뉴: 캐릭터 꾸미기 · 한 줄 소개 수정하기
  const [menu, setMenu] = useState(false);
  const staff = staffKind(me.role);
  const member = isMember(me);
  const progress = useBranchProgress();
  const link = branchStatus(member, progress);
  const branch = branchOf(link, me.branch, progress);
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
              setMenu(true);
            }}
            accessibilityRole="button"
            accessibilityLabel="꾸미기 · 한 줄 소개 수정하기"
            hitSlop={4}
            style={styles.deco}>
            {({ pressed }) => (
              // 투명한 동그라미 (캐릭터 방이 그대로 비쳐요) · 그림자는 버튼 밖으로 삐져나온 초승달만 그려요
              // (꽉 찬 그림자 원을 깔면 투명한 칸 안으로 비쳐 회색이 돼요)
              <View style={styles.decoWrap}>
                {!pressed ? <DecoShadow /> : null}
                <View style={[styles.decoBtn, pressed && styles.decoDown]}>
                  <DecoIcon />
                </View>
              </View>
            )}
          </Pressable>
          <View style={styles.spark} accessibilityLabel={sparks == null ? '스파크 불러오는 중' : `스파크 ${sparks}개`}>
            <SparkIcon />
            <PText style={styles.sparkN}>{sparks == null ? '–' : sparks.toLocaleString()}</PText>
          </View>
          <View style={styles.id}>
            <View style={styles.nameRow}>
              <PText style={styles.name}>{me.name}</PText>
              {/* 프로 · 직원은 이름 옆에 PRO · STAFF (10-roles 8장). 여러 지점이면 프로가 먼저 (state/me topBranchRole).
                  HOST · CO-HOST 는 이름 옆이 아니라 아래 '참여중' 칸에 붙어요 (2026-11-28) */}
              {staff ? <RoleTag kind={staff} big /> : null}
            </View>
            {staff ? (
              // 프로: 지점 · 가르치는 언어 / 지점 관리자: 지점 · 지점 관리자 — 연동 표시는 붙이지 않아요
              <PText style={styles.sub}>{staffLine(me)}</PText>
            ) : (
              <View style={styles.subRow}>
                {/* 지점(연동된 회원은 등록된 지점 모두 · 아니면 요청 · 체험 예약한 지점) → 언어. 레벨은 보이지 않아요 (2026-11-28).
                    앱 구경(비회원)은 지점이 없어서 언어만 */}
                <PText style={styles.sub}>
                  {[...(link === 'linked' ? myBranches(me) : branch ? [branch] : []), LANG_NAME[me.lang]].join(' · ')}
                  {link === 'linked' ? ' · 회원' : ''}
                </PText>
                {/* 지점 회원(연동을 요청한 사람)만: 연동됨 · 연동 승인 대기중 · 연동 신청하기(연동 안 됨 → 다시 신청).
                    비회원은 '체험 예약' · '비회원' 표시만 */}
                {link === 'rejected' ? <LinkRequestChip /> : <LinkTag link={link} />}
              </View>
            )}
            {/* 한 줄 소개: 글만 보여요. 쓰기 · 수정은 캐릭터 방 붓 버튼 › 한 줄 소개 수정하기 */}
            <PText style={[styles.bio, styles.bioBtn, !me.bio && styles.bioEmpty]} numberOfLines={2}>
              {me.bio || '한 줄 소개를 남겨 보세요'}
            </PText>
            <View style={styles.fol}>
              <FollowCount label="팔로잉" n={follow?.following} onPress={follow ? () => onFollow('fing') : undefined} />
              <FollowCount label="팔로워" n={follow?.followers} onPress={follow ? () => onFollow('fer') : undefined} />
            </View>
          </View>
        </View>
      </Raised>
      <Sheet open={menu} onClose={() => setMenu(false)} title="꾸미기" label="꾸미기 메뉴">
        <SheetOptions
          items={[
            { key: 'char', label: '캐릭터 꾸미기', sub: '옷 · 소품 · 방 배경' },
            { key: 'bio', label: me.bio ? '한 줄 소개 수정하기' : '한 줄 소개 남기기', sub: me.bio || '프로필에 보이는 한 줄' },
          ]}
          onPick={(k) => {
            setMenu(false);
            if (k === 'char') runAfterSheetClose(() => router.push('/me/customize'));
            else runAfterSheetClose(() => setBioOpen(true));
          }}
        />
      </Sheet>
      <BioSheet open={bioOpen} onClose={() => setBioOpen(false)} bio={me.bio} />
    </>
  );
}

/** 팔로잉 · 팔로워 한 칸: 숫자를 아직 못 받았으면 '–' 이고 눌리지 않아요 */
function FollowCount({ label, n, onPress }: { label: string; n: number | undefined; onPress: (() => void) | undefined }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={n == null ? `${label} 불러오는 중` : `${label} ${n}명`}
      accessibilityState={{ disabled: !onPress }}
      hitSlop={10}
      style={styles.folBtn}>
      <PText style={styles.folN}>{n == null ? '–' : n.toLocaleString()}</PText>
      <PText style={styles.folT}>{label}</PText>
    </Pressable>
  );
}

const TAG_LABEL = { pending: '연동 승인 대기중', linked: '연동됨', trial: '체험 예약', guest: '비회원' } as const;

type BranchStatus = keyof typeof TAG_LABEL | 'rejected';

/** 마이 지점 줄 표시: 회원(서버 /me 회원 등급)이면 연동됨, 아니면 서버 요약에서 연동 대기 → 확인 안 한 반려 → 체험 예약 순 */
function branchStatus(member: boolean, p: BranchProgress): BranchStatus {
  if (member) return 'linked';
  if (p.pending) return 'pending';
  if (p.rejected) return 'rejected';
  return p.trial ? 'trial' : 'guest';
}

/** 지점 줄의 지점: 회원은 내 지점 · 나머지는 요청 · 반려 · 체험 예약한 지점. 앱 구경(비회원)은 지점이 없어요 */
function branchOf(link: BranchStatus, myBranch: string, p: BranchProgress): string | null {
  if (link === 'linked') return myBranch;
  if (link === 'pending') return p.pending?.branchName ?? null;
  if (link === 'rejected') return p.rejected?.branchName ?? null;
  if (link === 'trial') return p.trial?.branch ?? null;
  return null;
}

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

/** 붓 버튼 그림자: 오른쪽 아래로 2px 밀린 원에서 버튼 원을 뺀 초승달 (안은 비워 둬요) */
function DecoShadow() {
  return (
    <Svg width={40} height={40} style={styles.decoShadow} pointerEvents="none">
      <Defs>
        <Mask id="deco-cut">
          <Rect width={40} height={40} fill="#fff" />
          <Circle cx={19} cy={19} r={19} fill="#000" />
        </Mask>
      </Defs>
      <Circle cx={21} cy={21} r={19} fill={Colors.ink} mask="url(#deco-cut)" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  card: { padding: 10, gap: 12, borderWidth: 2, borderColor: Colors.ink, borderRadius: Radius.card, backgroundColor: Colors.white },
  deco: { position: 'absolute', top: 22, right: 22, zIndex: 4 },
  decoWrap: { width: 40, height: 40 },
  decoShadow: { position: 'absolute', left: 0, top: 0 },
  decoDown: { transform: [{ translateX: 2 }, { translateY: 2 }] },
  decoBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: Colors.ink,
    // 투명 (캐릭터 방이 그대로 비쳐요)
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spark: { position: 'absolute', top: 28, left: 22, zIndex: 4, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 14, paddingVertical: 4, paddingHorizontal: 10 },
  sparkN: { fontFamily: Font.display, fontSize: 13, lineHeight: 17 },
  id: { paddingHorizontal: 6, paddingBottom: 6, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
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
  // 비어 있으면 본문이 아니라 누르는 자리로 보이게: 흐린 보조색
  bioEmpty: { color: Colors.inkSub, fontFamily: Font.body700 },
  fol: { flexDirection: 'row', gap: 16, marginTop: 8 },
  folBtn: { flexDirection: 'row', alignItems: 'baseline' },
  folN: { fontFamily: Font.display, fontSize: 15, lineHeight: 20, marginRight: 4 },
  folT: { fontFamily: Font.body800, fontSize: 13, lineHeight: 19, color: Colors.inkSub },
});
