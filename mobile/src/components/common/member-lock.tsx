import { router } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from '@/components/ui/safe-area';

import { TrialBookingSheet } from '@/components/common/trial-booking';
import { memberGate, openTrial } from '@/components/common/trial-guide';
import { ICON_PATH, LineIcon, QR_PATH } from '@/components/home/icons';
import { Button } from '@/components/ui/button';
import { Pressable } from '@/components/ui/pressable';
import { PText } from '@/components/ui/text';
import { TopBar } from '@/components/ui/top-bar';
import { Font } from '@/constants/fonts';
import { Colors, Radius } from '@/constants/theme';
import { sfx } from '@/lib/feedback';
import { canUse, isFreeChapter, userKind, type Feature } from '@/state/access';
import { useMe } from '@/state/me';
import { updateOnboarding } from '@/state/onboarding';

const LOCK_PATH = 'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3M12 14.5v2.5';
const TEAM_PATH = 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14a6 6 0 0 1 3.5 6';
const PASS_PATH = 'M4 7h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4zM10 7v12';

/** 회원이 되면 열리는 것 (마이 잠긴 칸 · 회원 전용 화면 공통) */
const OPENS = [
  { label: '출석', d: QR_PATH },
  { label: '내 팀', d: TEAM_PATH },
  { label: '이용권', d: PASS_PATH },
  { label: '프로 노트', d: ICON_PATH.pen },
];

/**
 * '지점 회원이 되면 열려요' 칸 (09-onboarding '회원 · 비회원 권한').
 * 마이의 PRO'S NOTE · 내 스터디 · 지점 안내 자리를 이 칸 하나로 바꿔요. 회원 전용 화면을 비회원이 열었을 때도 이 칸을 보여 줘요.
 * 아래 행동은 누구냐에 따라: 연동 대기 → 안내만 · 연동 안 됨 → [다시 요청하기] · 체험 예약 → [체험 예약 보기]
 * · 둘러보기 / 앱 구독 → [체험 신청하기] + '이미 회원이에요 · 연동 요청'.
 */
export function MemberLock({ title = '지점 회원이 되면 열려요', sub = '지점에서 연동하면 출석부터 프로 노트까지 여기서 봐요.' }: { title?: string; sub?: string }) {
  const kind = useMe(userKind);
  const trial = useMe((m) => m.trial);
  const [sheet, setSheet] = useState(false);
  const linkRequest = () => {
    sfx('soft');
    updateOnboarding({ path: 'member' });
    router.push('/onboarding/link');
  };

  return (
    <View style={styles.card} accessibilityLabel={title}>
      <View style={styles.head}>
        <View style={styles.lock}>
          <LineIcon d={LOCK_PATH} size={20} width={2.3} />
        </View>
        <View style={styles.headTx}>
          <PText style={styles.title}>{title}</PText>
          <PText style={styles.sub} color={Colors.inkSub}>
            {sub}
          </PText>
        </View>
      </View>
      <View style={styles.opens}>
        {OPENS.map((o) => (
          <View key={o.label} style={styles.open}>
            <View style={styles.openIc}>
              <LineIcon d={o.d} size={17} width={2.1} color={Colors.purple} />
            </View>
            <PText style={styles.openLabel}>{o.label}</PText>
          </View>
        ))}
      </View>

      {kind === 'pending' ? (
        <View style={styles.wait}>
          <View style={styles.waitDot} />
          <PText style={styles.waitText} color={Colors.purple}>
            연동 승인 대기중이에요 · 승인되면 알림으로 알려 드려요
          </PText>
        </View>
      ) : kind === 'rejected' ? (
        <Button label="다시 요청하기" wide onPress={() => router.push('/link-rejected')} />
      ) : kind === 'trial' && trial ? (
        <>
          <Button label="체험 예약 보기" wide onPress={() => setSheet(true)} />
          <TrialBookingSheet trial={trial} open={sheet} onClose={() => setSheet(false)} />
        </>
      ) : (
        <>
          <Button label="체험 신청하기" wide onPress={() => openTrial()} />
          <Pressable onPress={linkRequest} sound={false} accessibilityRole="link" accessibilityLabel="이미 회원이에요 · 연동 요청" hitSlop={8} style={styles.linkWrap}>
            {({ pressed }) => (
              <PText style={[styles.link, pressed && styles.linkPressed]} color={Colors.inkSub}>
                이미 회원이에요 · 연동 요청
              </PText>
            )}
          </Pressable>
        </>
      )}
    </View>
  );
}

/**
 * 회원 전용 화면 틀: 회원이면 그대로, 아니면 위 줄(뒤로 · 제목) + '지점 회원이 되면 열려요' 칸.
 * 알림 · 주소로 바로 들어와도 비회원에게 실제 데이터가 보이지 않게 해요.
 */
export function MemberOnly({ feature, title, children }: { feature: Feature; title: string; children: ReactNode }) {
  const allowed = useMe((m) => canUse(m, feature));
  // 주소 · 공유 링크로 바로 들어오면 체험 안내도 한 번 (보통은 들어오기 전에 막혀요)
  useGateOnce(!allowed, GATE_WHY[feature] ?? `${title}을 보려면`);
  if (allowed) return children;
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <TopBar title={title} fallback="/my" />
      <View style={styles.gateBody}>
        <MemberLock />
      </View>
    </SafeAreaView>
  );
}

/**
 * 챕터 화면 틀 (과 · 레슨 단계 · 상황 장면): 비회원은 맵마다 첫 챕터만 (state/access FREE_CHAPTER).
 * 둘째 챕터부터를 주소 · 알림으로 바로 열면 위 줄 + '○○는 지점 회원이 되면 열려요' 칸만 보여요.
 */
export function ChapterGate({ no, label, children }: { no: number; label: string; children: ReactNode }) {
  const allowed = useMe((m) => canUse(m, 'allChapters')) || isFreeChapter(no);
  useGateOnce(!allowed, `${label}를 하려면`);
  if (allowed) return children;
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <TopBar title={label} fallback="/library" />
      <View style={styles.gateBody}>
        <MemberLock title={`${label}는 지점 회원이 되면 열려요`} sub="비회원은 맵마다 첫 챕터를 끝까지 해 볼 수 있어요." />
      </View>
    </SafeAreaView>
  );
}

/** 회원 전용 화면이 막혔을 때 안내 한 줄 */
const GATE_WHY: Partial<Record<Feature, string>> = {
  pass: '이용권을 보려면',
  myStudy: '내 스터디를 보려면',
  proNote: '프로 노트를 보려면',
};

/** 막힌 화면이 처음 그려질 때 체험 안내 시트를 한 번 */
function useGateOnce(locked: boolean, why: string) {
  useEffect(() => {
    if (!locked) return;
    const t = setTimeout(() => memberGate(why), 350);
    return () => clearTimeout(t);
  }, [locked, why]);
}

const styles = StyleSheet.create({
  card: { gap: 14, padding: 16, borderRadius: Radius.card, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  lock: { width: 44, height: 44, borderRadius: 14, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.lavender, alignItems: 'center', justifyContent: 'center' },
  headTx: { flex: 1, minWidth: 0 },
  title: { fontFamily: Font.body900, fontSize: 16.5, lineHeight: 23 },
  sub: { fontFamily: Font.body600, fontSize: 12.5, lineHeight: 18 },
  opens: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 6, borderRadius: 16, backgroundColor: Colors.cream },
  open: { flex: 1, alignItems: 'center', gap: 5 },
  openIc: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.lavender, alignItems: 'center', justifyContent: 'center' },
  openLabel: { fontFamily: Font.body800, fontSize: 12, lineHeight: 16 },
  wait: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4, justifyContent: 'center' },
  waitDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.purple },
  waitText: { fontFamily: Font.body800, fontSize: 13, lineHeight: 18 },
  linkWrap: { alignSelf: 'center', minHeight: 32, justifyContent: 'center' },
  link: { fontFamily: Font.body800, fontSize: 12.5, lineHeight: 18, textDecorationLine: 'underline' },
  linkPressed: { opacity: 0.6 },
  safe: { flex: 1, backgroundColor: Colors.cream },
  gateBody: { padding: 16 },
});
