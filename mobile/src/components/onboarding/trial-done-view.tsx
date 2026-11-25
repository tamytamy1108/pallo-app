import { useFocusEffect } from 'expo-router';
import { Stack } from 'expo-router/js-stack';
import { useCallback } from 'react';
import { BackHandler, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from '@/components/ui/safe-area';

import { Button } from '@/components/ui/button';
import { Colors } from '@/constants/theme';
import type { TrialDraft } from '@/state/trial-booking';

import { ONB_LANGS } from './app-parts';
import { DoneNotice } from './done-notice';
import { DoneStage, STAGE_OVERLAP } from './done-stage';
import { DoneTicket } from './done-ticket';

/** 화면 양옆 여백 · 표가 무대 판보다 안쪽으로 들어오는 폭 */
const GUTTER = 16;
const TICKET_INSET = 8;

/**
 * 체험 예약 확정 (진행 바 없음) — '첫 무대 입장권'. 가입(앱 둘러보기 → 홈)과 앱 안 예약(확인 → 보던 화면)이 같이 써요.
 * 위: 어두운 무대 판에 조명 · 팔로로 착지 · 'SEE YOU / ON STAGE.' (첫 화면 YOUR FIRST STAGE 와 이어져요)
 * 가운데: 무대 판 아래에 걸친 입장권 (날짜 · 시간 · 지점 · 상담 언어 · 예약자 · 전달 사항, 그루터기에 CONFIRMED 도장)
 * 아래: '곧 ○○점에서 연락드릴 거예요' 안내와 버튼 하나.
 * 예약 폼으로 되돌아가지 않게 뒤로 버튼 · 밀어서 뒤로를 두지 않고, 안드로이드 뒤로 키는 아래 버튼과 같아요.
 */
export function TrialDoneView({ booking: b, button, onDone, hero }: { booking: TrialDraft; button: string; onDone: () => void; hero?: number }) {
  const { width } = useWindowDimensions();
  const lang = ONB_LANGS.find((l) => l.key === b.langs[0]) ?? ONB_LANGS[0];
  const branch = b.branch.trim();

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        onDone();
        return true;
      });
      return () => sub.remove();
    }, [onDone]),
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <ScrollView style={styles.flex} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <DoneStage width={Math.min(width, 520) - GUTTER * 2} hero={hero} />
        <View style={styles.ticket}>
          <DoneTicket branch={branch} lang={lang} name={b.realName} phone={b.phone} day={b.trialDay} time={b.trialTime} note={b.note.trim()} />
        </View>
        <View style={styles.notice}>
          <DoneNotice branch={branch} phone={b.phone} />
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Button label={button} wide onPress={onDone} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  flex: { flex: 1 },
  // 키 큰 폰에서는 가운데로, 짧은 폰에서는 스크롤
  body: { flexGrow: 1, justifyContent: 'center', width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: GUTTER, paddingTop: 8, paddingBottom: 20 },
  // 표가 무대 판 아래쪽을 덮어요 (판 위에 올라오게 zIndex)
  ticket: { marginTop: -STAGE_OVERLAP, marginHorizontal: TICKET_INSET, zIndex: 2 },
  notice: { marginTop: 18, marginHorizontal: TICKET_INSET },
  footer: { paddingHorizontal: GUTTER, paddingTop: 8, paddingBottom: 12 },
});
