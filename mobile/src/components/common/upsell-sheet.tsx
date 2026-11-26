import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useBranchProgress } from '@/api/use-branch-progress';
import { TrialBookingSheet, trialShortDate } from '@/components/common/trial-booking';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { closeUpsell, useUpsell, useUpsellWhy, type Upsell } from '@/state/lock-hits';

const PALLO = require('@/assets/characters/c-upright-yellow.png');

const COPY: Record<Exclude<Upsell, 'trial'>, { kicker: string; title: string; body: string }> = {
  lock: {
    kicker: 'MEMBERS ONLY',
    title: '체험해 보시겠어요?',
    body: '잠긴 챕터 · 라운지 · 이벤트는 지점 회원이 되면 다 열려요. 가까운 지점에서 회화 상담과 체험 세션을 한 번 받아 보세요.',
  },
  chapter: {
    kicker: 'NEXT TAKE',
    title: '더 다양한 사람들과\n실제 대화 함께 해 보기!',
    body: '첫 챕터를 다 끝냈어요. 다음부터는 지점에서 다른 회원들 · 프로와 함께 라이브 세션으로 직접 말해 봐요.',
  },
};

/**
 * 체험 권유 시트 (state/lock-hits): 잠김을 3번 누를 때마다 · 무료 첫 챕터를 끝내고 다음 챕터로 가려 할 때.
 * 비회원 · 연동 안 됨 → [상담 예약하기] = 체험 예약 화면(openTrial · 가입 때 '체험을 예약해요'와 같은 전체 화면) · [다음에 할게요].
 * 체험 예약한 사람 → 다시 예약하지 않게 '예약한 체험' 알림 + [예약 내용 보기].
 * TrialGuideHost(맨 바깥 _layout) 안에 한 번만 그려요.
 */
export function UpsellHost({ onBook }: { onBook: () => void }) {
  const upsell = useUpsell();
  const why = useUpsellWhy();
  const { trial } = useBranchProgress();
  // 닫힌 뒤 열 것 (시트 두 개가 겹치지 않게 닫히는 움직임이 끝난 뒤)
  const [after, setAfter] = useState<null | 'book' | 'trial'>(null);
  const [trialOpen, setTrialOpen] = useState(false);
  // 닫히는 동안에도 글이 바뀌지 않게 마지막 종류를 기억해요
  const [shown, setShown] = useState<Upsell>('lock');
  if (upsell && upsell !== shown) setShown(upsell);
  // 체험 예약한 사람: 다시 예약하라고 하지 않고 예약한 체험을 알려요 (회원 전용을 눌렀으면 why 를 제목에)
  const copy =
    trial || shown === 'trial'
      ? { kicker: 'YOUR TRIAL', title: shown === 'trial' && why ? `${why}\n지점 회원이 되어야 해요` : '예약한 체험이\n기다리고 있어요', body: '' }
      : COPY[shown];

  const closed = () => {
    if (after === 'book') onBook();
    if (after === 'trial') setTrialOpen(true);
    setAfter(null);
  };

  return (
    <>
      <Sheet
        open={!!upsell}
        onClose={closeUpsell}
        onClosed={closed}
        label={copy.title.replace('\n', ' ')}
        footer={
          trial ? (
            <>
              <Button label="닫기" variant="secondary" wide onPress={closeUpsell} />
              <Button
                label="예약 내용 보기"
                wide
                onPress={() => {
                  setAfter('trial');
                  closeUpsell();
                }}
              />
            </>
          ) : (
            <>
              <Button label={shown === 'chapter' ? '나중에' : '다음에 할게요'} variant="secondary" wide onPress={closeUpsell} />
              <Button
                label="상담 예약하기"
                wide
                onPress={() => {
                  setAfter('book');
                  closeUpsell();
                }}
              />
            </>
          )
        }>
        <View style={styles.hero}>
          <View style={styles.burst} />
          <Image source={PALLO} style={styles.char} contentFit="contain" accessibilityIgnoresInvertColors />
        </View>
        <PText style={styles.kicker} color={Colors.purple}>
          {copy.kicker}
        </PText>
        <PText style={styles.title} accessibilityRole="header">
          {copy.title}
        </PText>
        <PText style={styles.body} color={Colors.inkSub}>
          {trial ? `예약한 ${trial.branch} 체험이 ${trialShortDate(trial)} ${trial.time}에 기다리고 있어요. 체험 상담 때 회원 등록을 하면 바로 열려요.` : copy.body}
        </PText>
      </Sheet>
      {trial ? <TrialBookingSheet trial={trial} open={trialOpen} onClose={() => setTrialOpen(false)} /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  // 동그라미(120)가 칸 안에 다 들어오고, 팔로 팔 끝도 동그라미 안에 들어오게 (잘리지 않게)
  hero: { alignSelf: 'center', width: 150, height: 128, alignItems: 'center', justifyContent: 'center' },
  burst: { position: 'absolute', top: 4, width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.lavender },
  char: { width: 104, height: 70 },
  kicker: { textAlign: 'center', fontFamily: Font.display, fontSize: 11, lineHeight: 15, letterSpacing: 1.4 },
  title: { textAlign: 'center', fontFamily: Font.body900, fontSize: 21, lineHeight: 28, letterSpacing: -0.5 },
  body: { textAlign: 'center', fontFamily: Font.body600, fontSize: 13.5, lineHeight: 21 },
});
