import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useBranchProgress } from '@/api/use-branch-progress';
import { openTrial } from '@/components/common/trial-guide';
import { TrialBookingSheet, trialDaysLeft, trialShortDate, trialStage, type TrialBooking } from '@/components/common/trial-booking';
import { Pressable } from '@/components/ui/pressable';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { sfx } from '@/lib/feedback';
import { isMember } from '@/state/access';
import { useMe } from '@/state/me';
import { updateOnboarding } from '@/state/onboarding';

import { useClock } from './attendance';
import { ARROW_PATH, ICON_PATH, LineIcon } from './icons';
import { ClapperArm, clapperStyles as cs, HeroChar, SessionCard, useHeroRoom } from './session-card';

const PLAY_PATH = 'M8 5.5v13l10.5-6.5z';
/** 첫 레슨: Lv.1 1과 (라이브러리 › 교재와 같은 화면) */
const FIRST_LESSON = '/unit/1?lv=1' as Href;

/**
 * 홈 오늘 스터디 자리 — 회원인지(state/access) · 비회원이 무엇을 기다리는지(api/use-branch-progress)에 따라 카드가 달라요 (09-onboarding '회원 · 비회원 권한').
 * 회원 · 연동 대기 · 연동 안 됨 → 출석 카드(SessionCard) / 다가오는 체험(서버 요약) → 체험 카드 / 둘러보는 비회원 → 둘러보기 카드.
 * 앱 구독자(plan app)는 홈이 이 자리 대신 오늘의 목표 카드를 그려요.
 */
export function HomeCard({ onOpen }: { onOpen: (mode: 'rsvp' | 'checkin') => void }) {
  const member = useMe(isMember);
  const link = useMe((m) => m.link);
  const { trial } = useBranchProgress();
  // 연동 대기 · 못 찾음은 출석 카드 자리에 잠긴 카드 (session-card 가 me.link 로 그려요)
  if (member || link === 'pending' || link === 'rejected') return <SessionCard onOpen={onOpen} />;
  if (trial) return <TrialCard trial={trial} />;
  return <GuestCard />;
}

/**
 * 체험 예약한 사람: 같은 클래퍼보드에 체험 D-n · 날짜 · 시각. 출석 · QR 버튼은 없어요.
 * 전날까지 'Your first take.' → 당일 'D-DAY · 오늘 19:30 상담이에요' → 지난 뒤 '체험은 어땠어요?' + [회원 등록 안내].
 */
function TrialCard({ trial }: { trial: TrialBooking }) {
  const heroRoom = useHeroRoom();
  const now = useClock();
  const [sheet, setSheet] = useState(false);
  const stage = trialStage(trial, now);
  const left = trialDaysLeft(trial, now);
  const dday = stage === 'before' ? `D-${left}` : stage === 'today' ? 'D-DAY' : 'DONE';
  const copy = {
    before: { badge: 'TRIAL', title: 'Your first take.', line: `${trial.branch} 회화 상담`, note: '상담 전에 지점에서 연락드려요' },
    today: { badge: 'D-DAY', title: "Today's your take.", line: `오늘 ${trial.time} 상담이에요`, note: `${trial.branch}에서 기다릴게요` },
    after: { badge: "THAT'S A WRAP", title: 'How was your take?', line: '체험은 어땠어요?', note: '마음에 들었다면 지점에서 바로 회원 등록을 도와드려요' },
  }[stage];

  return (
    <View style={cs.wrap}>
      <ClapperArm />
      <View style={cs.shadowBox}>
        <View style={cs.shadow} />
        <View style={StyleSheet.flatten([cs.body, styles.bodyTrial])}>
          <View style={cs.fields}>
            <Cell label="체험" value={dday} big flex={1} />
            <Cell label="DATE" value={trialShortDate(trial)} divider flex={1.05} />
            <Cell label="TIME" value={trial.time} big divider flex={0.95} />
          </View>
          <View style={StyleSheet.flatten([cs.main, styles.main])} onLayout={heroRoom.onMain}>
            <HeroChar pose={stage === 'after' ? 'standard' : 'jump'} room={heroRoom.room} />
            <View style={cs.live}>
              <View style={StyleSheet.flatten([cs.liveDot, stage === 'today' ? styles.dotToday : styles.dotWhite])} />
              <PText style={cs.liveText}>{copy.badge}</PText>
            </View>
            <PText variant="title" style={cs.heroTitle}>
              {copy.title}
            </PText>
            <PText style={styles.line}>{copy.line}</PText>
            <PText style={styles.note} color={Colors.inkSub}>
              {copy.note}
            </PText>
            <View style={StyleSheet.flatten([cs.actions, styles.actions])} onLayout={heroRoom.onActions}>
              {stage === 'after' ? (
                <CardButton
                  label="회원 등록 안내"
                  icon={ICON_PATH.flag}
                  tint={Colors.purple}
                  onPress={() => showToast('회원 등록은 지점에서 도와드려요 · 곧 앱에서도 돼요')}
                />
              ) : (
                <CardButton label="예약 내용 보기" icon={ICON_PATH.cal} tint={Colors.purple} onPress={() => setSheet(true)} />
              )}
            </View>
          </View>
        </View>
      </View>
      <TrialBookingSheet trial={trial} open={sheet} onClose={() => setSheet(false)} />
    </View>
  );
}

/**
 * 가입 뒤 둘러보는 비회원 ('앱 구경할래요' · '일단 구경만'): 출석 대신 바로 해 볼 수 있는 것.
 * [1과 무료로 시작하기](Lv.1 1과) · [체험 신청하기] · '지점 회원이라면 연동 요청'.
 */
function GuestCard() {
  const heroRoom = useHeroRoom();
  const linkRequest = () => {
    sfx('soft');
    updateOnboarding({ path: 'member' });
    router.push('/onboarding/link');
  };
  return (
    <View style={cs.wrap}>
      <ClapperArm />
      <View style={cs.shadowBox}>
        <View style={cs.shadow} />
        <View style={StyleSheet.flatten([cs.body, styles.bodyGuest])}>
          <View style={StyleSheet.flatten([cs.main, styles.main])} onLayout={heroRoom.onMain}>
            <HeroChar pose="tilt" room={heroRoom.room} />
            <View style={cs.live}>
              <View style={StyleSheet.flatten([cs.liveDot, styles.dotWhite])} />
              <PText style={cs.liveText}>BACKSTAGE</PText>
            </View>
            <PText variant="title" style={cs.heroTitle}>
              Welcome backstage.
            </PText>
            <PText style={styles.line}>먼저 둘러보는 중이에요.</PText>
            <View style={StyleSheet.flatten([cs.actions, styles.actions])} onLayout={heroRoom.onActions}>
              <CardButton
                label="1과 무료로 시작하기"
                icon={PLAY_PATH}
                tint={Colors.purple}
                onPress={() => {
                  sfx('tap');
                  router.push(FIRST_LESSON);
                }}
              />
            </View>
          </View>
          {/* 아래 칸 두 개 (출석 카드 위 칸과 같은 모양): 처음이라면 체험 · 지점 회원이라면 연동 */}
          <View style={styles.foot}>
            <FootCell
              label="처음이라면"
              action="체험 상담 신청"
              onPress={() => {
                sfx('tap');
                openTrial();
              }}
            />
            <FootCell label="지점 회원이라면" action="연동 요청하기" onPress={linkRequest} divider />
          </View>
        </View>
      </View>
    </View>
  );
}

/** 게스트 카드 아래 칸 한 개: 작은 안내 + 굵은 행동 › (누르면 살짝 어두워져요) */
function FootCell({ label, action, onPress, divider }: { label: string; action: string; onPress: () => void; divider?: boolean }) {
  return (
    <Pressable onPress={onPress} sound={false} accessibilityRole="button" accessibilityLabel={`${label} ${action}`} style={StyleSheet.flatten([styles.cell, divider && styles.cellDivider])}>
      {({ pressed }) => (
        <View style={[styles.cellIn, pressed && styles.cellPressed]}>
          <PText style={styles.cellLabel} color={Colors.inkSub}>
            {label}
          </PText>
          <View style={styles.cellRow}>
            <PText style={styles.cellAction}>{action}</PText>
            <LineIcon d={ARROW_PATH} size={15} width={2.6} />
          </View>
        </View>
      )}
    </Pressable>
  );
}

/** 카드 안 흰 버튼 (출석 버튼과 같은 모양 · 왼쪽 색 동그라미 아이콘) */
function CardButton({ label, icon, tint, onPress }: { label: string; icon: string; tint: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      {({ pressed }) => (
        <View style={StyleSheet.flatten([cs.btn, cs.btnAgain, pressed && cs.btnAgainPressed])}>
          <View style={StyleSheet.flatten([cs.qr, cs.qrAgain, { backgroundColor: tint }])}>
            <LineIcon d={icon} size={16} width={2.4} color={Colors.white} />
          </View>
          <PText style={cs.btnTextOff}>{label}</PText>
          <LineIcon d={ARROW_PATH} size={17} width={2.4} />
        </View>
      )}
    </Pressable>
  );
}

/** 위 칸 하나 (체험 카드는 칸 폭을 조금씩 달리 줘요) */
function Cell({ label, value, big, divider, flex }: { label: string; value: string; big?: boolean; divider?: boolean; flex: number }) {
  return (
    <View style={StyleSheet.flatten([cs.field, divider && cs.fieldDivider, { flex }])}>
      <PText style={cs.fieldLabel} color={Colors.inkSub}>
        {label}
      </PText>
      <PText style={big ? cs.fieldBig : cs.fieldValue} numberOfLines={1}>
        {value}
      </PText>
    </View>
  );
}

const styles = StyleSheet.create({
  // 체험: 하늘 안개 · 둘러보기: 노랑 (회원 분홍 · 연동 대기 라벤더와 구분)
  bodyTrial: { backgroundColor: Colors.skyMist },
  bodyGuest: { backgroundColor: Colors.yellow },
  main: { paddingTop: 12, paddingBottom: 14, minHeight: 0 },
  dotWhite: { backgroundColor: Colors.white },
  dotToday: { backgroundColor: Colors.rosePink },
  line: { marginTop: 3, maxWidth: 240, fontFamily: Font.body800, fontSize: 13.5, lineHeight: 20 },
  note: { maxWidth: 230, fontFamily: Font.body700, fontSize: 12.5, lineHeight: 18 },
  actions: { marginTop: 10 },
  // 아래 두 칸: 크림 바탕 · 위 잉크 선 · 가운데 세로 선 (출석 카드 위 칸 cs.fields 와 같은 결)
  foot: { flexDirection: 'row', backgroundColor: Colors.cream, borderTopWidth: 2, borderColor: Colors.ink },
  cell: { flex: 1 },
  cellDivider: { borderLeftWidth: 2, borderColor: Colors.ink },
  cellIn: { paddingTop: 9, paddingBottom: 11, paddingHorizontal: 14 },
  cellPressed: { backgroundColor: '#F1EAD9' },
  cellLabel: { fontFamily: Font.body700, fontSize: 11.5, lineHeight: 16 },
  cellRow: { marginTop: 2, flexDirection: 'row', alignItems: 'center', gap: 4 },
  cellAction: { fontFamily: Font.body900, fontSize: 15, lineHeight: 21 },
});
