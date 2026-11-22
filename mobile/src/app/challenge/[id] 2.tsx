import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChxSheet } from '@/components/challenge/chx-sheet';
import { DailyDetail } from '@/components/challenge/daily-detail';
import { ChIcon } from '@/components/challenge/icons';
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
        <Stack.Screen options={{ animation: 'slide_from_right' }} />
        <View style={styles.top}>
          <Pressable onPress={back} accessibilityRole="button" accessibilityLabel="뒤로" hitSlop={8} style={styles.ib}>
            <ChIcon name="back" size={22} />
          </Pressable>
        </View>
        <Empty>챌린지를 찾을 수 없어요.</Empty>
      </SafeAreaView>
    );
  }
  if (isExpr(p)) return <ExprWindow p={p} write={write === '1'} />;
  return (
    <>
      <Stack.Screen options={{ animation: 'slide_from_right' }} />
      <DailyDetail p={p} />
    </>
  );
}

/** 표현 챌린지: 투명한 화면 위에 창만 — 닫으면 앞 화면으로 */
function ExprWindow({ p, write }: { p: Challenge; write: boolean }) {
  const [open, setOpen] = useState(true);
  return (
    <>
      <Stack.Screen options={{ presentation: 'transparentModal', animation: 'none', contentStyle: { backgroundColor: 'transparent' } }} />
      <ChxSheet p={p} open={open} write={write} onClose={() => setOpen(false)} onClosed={back} />
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  top: { height: 60, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  ib: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
