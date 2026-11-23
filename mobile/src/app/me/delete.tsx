import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { Stack } from 'expo-router/js-stack';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AccountPage } from '@/components/account/parts';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/field';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { LEAVE_REASONS } from '@/data/account';
import { haptic } from '@/lib/feedback';
import { clearSavedData } from '@/lib/store';

/**
 * 회원 탈퇴 (애플 '앱 안에서 계정 삭제' 요구). 프로토타입은 설정 맨 아래 확인 시트 하나('정말 탈퇴할까요?')뿐이라,
 * 그 문구를 그대로 쓰고 이유 고르기 → 확인 창(되돌릴 수 없음) → 끝 화면을 공통 부품으로 더했어요.
 * 지금은 가짜로 끝나요 (이 기기에 저장한 기록만 지워요). 맞는 API: `DELETE /me`
 */
export default function DeleteAccountScreen() {
  const [why, setWhy] = useState<string[]>([]);
  const [ask, setAsk] = useState(false);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <View style={styles.done}>
        <Stack.Screen options={{ gestureEnabled: false }} />
        <Image source={require('@/assets/characters/c-upright-yellow.png')} style={styles.img} contentFit="contain" />
        <PText style={styles.doneB}>탈퇴했어요</PText>
        <PText style={styles.doneS}>그동안 함께해 줘서 고마워요.</PText>
        <View style={styles.doneBtn}>
          <Button
            label="처음으로"
            wide
            onPress={() => {
              if (router.canDismiss()) router.dismissAll();
              router.replace('/login' as Href);
            }}
          />
        </View>
      </View>
    );
  }

  return (
    <AccountPage title="회원 탈퇴" bodyStyle={styles.body} footer={<Button label="탈퇴하기" variant="secondary" wide onPress={() => setAsk(true)} />}>
      <PText style={styles.h}>정말 탈퇴할까요?</PText>
      <PText style={styles.ds}>탈퇴하면 스파크 · 아이템 · 랭킹 기록이 사라지고 되돌릴 수 없어요. 남은 이용권은 지점에서 먼저 정리해 주세요.</PText>
      <PText style={styles.lb}>탈퇴하는 이유</PText>
      {LEAVE_REASONS.map((r) => (
        <Checkbox key={r} label={r} checked={why.includes(r)} onChange={(on) => setWhy(on ? [...why, r] : why.filter((x) => x !== r))} />
      ))}
      <ConfirmDialog
        open={ask}
        title="정말 탈퇴할까요?"
        message="되돌릴 수 없어요."
        confirmLabel="탈퇴하기"
        destructive
        onCancel={() => setAsk(false)}
        onConfirm={() => {
          setAsk(false);
          haptic('warning');
          // 이 기기에 남긴 내 기록(진도 · 포인트 · 꾸미기 · 설정 …)도 지워요. 실서비스: DELETE /me 성공 뒤에
          clearSavedData();
          setDone(true);
        }}
      />
    </AccountPage>
  );
}

const styles = StyleSheet.create({
  body: { paddingTop: 18, paddingBottom: 40, gap: 4 },
  h: { fontFamily: Font.display, fontSize: 22, lineHeight: 28 },
  ds: { marginTop: 6, fontFamily: Font.body700, fontSize: 15, lineHeight: 23, color: Colors.inkSub },
  lb: { marginTop: 22, marginBottom: 4, fontFamily: Font.body900, fontSize: 15, lineHeight: 21 },
  done: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: Colors.cream },
  img: { width: 120, height: 77 },
  doneB: { marginTop: 18, fontFamily: Font.display, fontSize: 22, lineHeight: 28 },
  doneS: { marginTop: 6, fontFamily: Font.body700, fontSize: 15, lineHeight: 23, color: Colors.inkSub },
  doneBtn: { alignSelf: 'stretch', marginTop: 28 },
});
