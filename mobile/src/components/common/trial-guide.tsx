import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { keepAll, SheetButton, SheetButtons, SheetDesc } from '@/components/common/sheet-parts';
import { UpsellHost } from '@/components/common/upsell-sheet';
import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { userKind } from '@/state/access';
import { chapterUpsell, guideBusy, setIntroOpen, trialReminder } from '@/state/lock-hits';
import { getMe, type StudyLang } from '@/state/me';

let openIntro: ((why: string) => void) | null = null;

/**
 * 비회원 막힘 (프로토타입 lgGate(이유)): 회원만 할 수 있는 행동을 감싸요. 회원이면 그대로 실행.
 * 회원이 아니면 누를 때마다 누구냐(state/access userKind)에 따라 (09-onboarding '회원 · 비회원 권한'):
 * - 비회원 · 앱 구경 · 앱 구독(결제) → 체험 안내 시트 `${why}\n지점 회원이 되어야 해요` (→ 체험 상담 신청)
 * - 체험 예약 → '예약한 체험이 기다리고 있어요' 시트 (다시 예약하지 않게 · 예약 내용 보기)
 * - 연동 대기 → '…지점 연동이 끝나야 해요' 토스트 (이미 회원이라 체험 권유 없음)
 * - 연동 안 됨 → '…지점 연동이 필요해요' 토스트 + [다시 요청]
 * 다른 안내 · 권유 시트가 떠 있으면 겹쳐 띄우지 않아요. 좋아요는 막지 않아요 (v291).
 * why 는 '~하려면' 한 줄 — 예) '댓글을 달려면' · '번개에 참여하려면' · '2과를 하려면' · '설정을 쓰려면'.
 * 예) onPress={() => guardMember(() => setJoinOpen(true), '번개에 참여하려면')}
 * @returns 실행했으면 true, 막혔으면 false
 */
export function guardMember(run: () => void, why = '함께하려면') {
  const kind = userKind(getMe());
  if (kind === 'member') {
    run();
    return true;
  }
  if (kind === 'pending') showToast(`${why} 지점 연동이 끝나야 해요`);
  else if (kind === 'rejected') showToast(`${why} 지점 연동이 필요해요`, { label: '다시 요청', onPress: () => router.push('/link-rejected') });
  else if (guideBusy()) return false;
  else if (kind === 'trial') trialReminder(why);
  else openIntro?.(why);
  return false;
}

/** 실행할 것 없이 '막혔다'만 알려요 — 잠긴 칸 · 잠긴 챕터 · 흐린 설정 버튼처럼 보여 주기만 하는 잠금 */
export const memberGate = (why: string) => guardMember(() => undefined, why);

/**
 * 비회원이 잠긴 챕터(둘째부터)를 눌렀을 때: 무료 첫 챕터를 다 끝냈으면 '실제 대화' 권유 시트, 아니면 체험 안내 시트.
 * label 예) '2과' · '장면 2' → why '2과를 하려면'
 */
export function lockedChapter(label: string, firstDone: boolean) {
  const kind = userKind(getMe());
  if (firstDone && kind !== 'pending' && kind !== 'rejected') chapterUpsell();
  else memberGate(`${label}를 하려면`);
}

/**
 * 체험 예약 화면(/trial · 가입 때 '체험을 예약해요'와 같은 전체 화면)을 열어요 — 홈 '체험 상담 신청' · 마이 잠김 칸 · 체험 권유 창.
 * 예) openTrial({ lang: 'ja' }) — 희망 언어가 미리 골라져요. 예약하면 확정 화면 → '확인'으로 지금 보던 화면에 돌아와요.
 */
export function openTrial(start: { lang?: StudyLang } = {}) {
  router.push(start.lang ? { pathname: '/trial', params: { lang: start.lang } } : '/trial');
}

/** 체험 예약 화면 · 확정 화면을 닫고 보던 화면으로 (주소로 바로 들어왔으면 홈) */
export const leaveTrial = () => (router.canGoBack() ? router.back() : router.replace('/'));

/** 맨 바깥(_layout)에 한 번만 있어요: 체험 안내 시트 · 체험 권유 시트(UpsellHost) */
export function TrialGuideHost() {
  const [why, setWhy] = useState<string | null>(null);
  const [shown, setShown] = useState('함께하려면');
  const [book, setBook] = useState(false);
  // 닫히는 동안에도 글이 바뀌지 않게 마지막 이유를 기억해요
  if (why && why !== shown) setShown(why);
  // 권유 시트와 겹치지 않게 열림 상태를 알려요 (state/lock-hits guideBusy)
  useEffect(() => setIntroOpen(!!why), [why]);
  useEffect(() => {
    openIntro = setWhy;
    return () => {
      openIntro = null;
    };
  }, []);
  return (
    <>
      <TrialIntroSheet
        open={!!why}
        why={shown}
        onClose={() => setWhy(null)}
        onBook={() => {
          setBook(true);
          setWhy(null);
        }}
        // 시트가 다 닫힌 뒤 화면을 열어요 (겹쳐 움직이지 않게)
        onClosed={() => {
          if (book) openTrial();
          setBook(false);
        }}
      />
      {/* 잠김 3번 · 첫 챕터 끝 → 체험 권유 시트. [상담 예약하기]는 체험 예약 화면을 열어요 */}
      <UpsellHost onBook={() => openTrial()} />
    </>
  );
}

/**
 * 체험 안내 시트 (프로토타입 lgTrial 첫 칸): 왜 막혔는지 노란 카드로 알려 주고 [체험 신청하기] → 체험 예약 화면.
 * 댓글 · 참여처럼 하던 일이 있던 자리라, 바로 전체 화면으로 넘기지 않고 이 한 장으로 먼저 알려요.
 */
function TrialIntroSheet({ open, why, onClose, onBook, onClosed }: { open: boolean; why: string; onClose: () => void; onBook: () => void; onClosed: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} onClosed={onClosed} label="체험 신청 안내">
      <PText variant="title" accessibilityRole="header">
        {`${why}\n지점 회원이 되어야 해요`}
      </PText>
      {/* .lg-trial — 노란 카드 · 오른쪽 아래 노랑 팔로 */}
      <View style={styles.trial}>
        <PText style={styles.trialHead}>{'체험 상담 한 번이면\n바로 시작할 수 있어요'}</PText>
        <View style={styles.ul}>
          {['가까운 지점에서 회화 체험 1회', '프로님과 상담하고 내 레벨 확인', '회원이 되면 오프라인 스터디 · 글쓰기 · 동아리까지'].map((t) => (
            <View key={t} style={styles.li}>
              <PText style={styles.liDot}>•</PText>
              <PText style={styles.liText}>{t}</PText>
            </View>
          ))}
        </View>
        <Image source={require('@/assets/characters/c-upright-yellow.png')} style={styles.trialImg} contentFit="contain" accessible={false} />
      </View>
      <SheetDesc>지금은 둘러보기만 할 수 있어요. 신청은 1분이면 돼요.</SheetDesc>
      <SheetButtons>
        <SheetButton label="나중에 할게요" tone="white" sound="back" style={styles.flex} onPress={onClose} />
        <SheetButton label="체험 상담 신청" style={styles.flex} onPress={onBook} />
      </SheetButtons>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  // .lg-trial { padding: 16px 120px 16px 16px; min-height: 120px; border-radius: 20px }
  trial: { minHeight: 120, paddingTop: 16, paddingBottom: 16, paddingLeft: 16, paddingRight: 120, borderWidth: 2, borderColor: Colors.ink, borderRadius: 20, backgroundColor: Colors.yellow, overflow: 'hidden' },
  trialHead: { fontFamily: Font.display, fontSize: 19, lineHeight: 19 * 1.25, letterSpacing: -0.5, ...keepAll },
  ul: { marginTop: 8 },
  li: { flexDirection: 'row' },
  liDot: { width: 17, fontFamily: Font.body700, fontSize: 13, lineHeight: 13 * 1.7 },
  liText: { flex: 1, fontFamily: Font.body700, fontSize: 13, lineHeight: 13 * 1.7 },
  // .lg-trial img { right: -4px; bottom: -18px; width: 120px }
  trialImg: { position: 'absolute', right: -4, bottom: -18, width: 120, height: 120 * (306 / 480) },
});
