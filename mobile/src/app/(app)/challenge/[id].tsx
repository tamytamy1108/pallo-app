import { router, useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router/js-stack';
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from '@/components/ui/safe-area';

import { TopBar } from '@/components/ui/top-bar';
import { SCREEN } from '@/lib/transitions';
import { ChxSheet } from '@/components/challenge/chx-sheet';
import { DailyDetail } from '@/components/challenge/daily-detail';
import { Empty } from '@/components/challenge/parts';
import { Colors } from '@/constants/theme';
import { findChallenge, isExpr, useChallengeState, type Challenge } from '@/data/challenge';

const back = () => (router.canGoBack() ? router.back() : router.replace('/lounge'));

/**
 * 챌린지 상세 (`/challenge/:id`, ?write=1 이면 문장 입력칸부터).
 * - 일상 챌린지: 상세 화면 (lgChalDetail)
 * - 표현 챌린지: 나만의 문장 완성하기 창 (chxSheet) — 앞 화면 위에 시트로 떠요
 */
export default function ChallengeScreen() {
  const { id, write } = useLocalSearchParams<{ id: string; write?: string }>();
  const s = useChallengeState();
  const p = findChallenge(s, String(id));

  if (!p) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Stack.Screen options={SCREEN.push} />
        <TopBar onBack={back} />
        <Empty>챌린지를 찾을 수 없어요.</Empty>
      </SafeAreaView>
    );
  }
  if (isExpr(p)) return <ExprWindow p={p} write={write === '1'} />;
  return (
    <>
      <Stack.Screen options={SCREEN.push} />
      <DailyDetail p={p} />
    </>
  );
}

/** 표현 챌린지: 투명한 화면 위에 창만 — 닫으면 앞 화면으로 */
function ExprWindow({ p, write }: { p: Challenge; write: boolean }) {
  const [open, setOpen] = useState(true);
  return (
    <>
      <Stack.Screen options={SCREEN.overlay} />
      <ChxSheet p={p} open={open} write={write} onClose={() => setOpen(false)} onClosed={back} />
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
});
