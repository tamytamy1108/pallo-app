import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View, type TextInputInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TopBar } from '@/components/ui/top-bar';
import { BottomBar } from '@/components/bottom-bar';
import { SheetLink } from '@/components/common/sheet-parts';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/field';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { sendPhoneCode, verifyPhoneCode } from '@/api/auth';
import { errorMessage, isApiError } from '@/api/errors';
import { queryKeys } from '@/api/queries';
import { queryClient } from '@/api/query-client';
import { CODE_LENGTH } from '@/data/auth';
import { formatPhone, isPhone, phoneDigits } from '@/data/trial';
import { sfx } from '@/lib/feedback';

/**
 * 휴대폰 번호로 시작하기: 번호 → [인증번호 받기] → 6자리 · 3분 → [확인].
 * 프로토타입에는 이 화면이 없어요 (설정 › 휴대폰 번호 변경 시트의 문구 · 토스트만 따왔어요) — 프로토타입에서 먼저 확정해야 해요.
 */
export default function PhoneLoginScreen() {
  const [phone, setPhone] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [left, setLeft] = useState(0);
  const codeRef = useRef<TextInputInstance>(null);

  // 남은 시간 (초)
  useEffect(() => {
    if (!sentTo) return;
    const t = setInterval(() => setLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [sentTo]);

  const send = async () => {
    if (!isPhone(phone)) {
      showToast('휴대폰 번호를 확인해 주세요');
      return;
    }
    let r: { seconds: number };
    try {
      r = await sendPhoneCode(phoneDigits(phone));
    } catch (e) {
      showToast(errorMessage(e));
      return;
    }
    setSentTo(formatPhone(phone));
    setCode('');
    setLeft(r.seconds);
    showToast('인증번호를 보냈어요 · 3분 안에 입력해 주세요');
    setTimeout(() => codeRef.current?.focus(), 50);
  };

  const confirm = async () => {
    if (!sentTo) return;
    if (left === 0) {
      showToast('인증 시간이 지났어요 · 다시 받아 주세요');
      return;
    }
    try {
      await verifyPhoneCode(phoneDigits(sentTo), code);
    } catch (e) {
      sfx('wrong');
      showToast(isApiError(e) && e.code === 'INVALID_CODE' ? '인증번호를 확인해 주세요' : errorMessage(e));
      return;
    }
    sfx('save');
    await queryClient.invalidateQueries({ queryKey: queryKeys.me });
    router.replace('/');
  };

  const mm = Math.floor(left / 60);
  const ss = String(left % 60).padStart(2, '0');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* 프로토타입 하위 화면 머리 (.dtop.mp-top · .icon-btn) */}
      <TopBar fallback="/login" />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <PText variant="title" accessibilityRole="header">
          휴대폰 번호로 시작해요
        </PText>
        <TextField
          label="휴대폰 번호"
          placeholder="010-0000-0000"
          value={phone}
          onChangeText={(v) => {
            setPhone(v);
            if (sentTo) setSentTo(null);
          }}
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          returnKeyType="done"
          onSubmitEditing={send}
        />
        {sentTo ? (
          <View style={styles.codeBlock}>
            <View style={styles.codeHead}>
              <PText style={styles.lb}>인증번호</PText>
              <PText color={left > 0 ? Colors.purple : '#B23A5A'} style={styles.timer} accessibilityLabel={`남은 시간 ${mm}분 ${ss}초`}>
                {mm}:{ss}
              </PText>
            </View>
            <TextInput
              ref={codeRef}
              value={code}
              onChangeText={(v) => setCode(v.replace(/[^0-9]/g, '').slice(0, CODE_LENGTH))}
              placeholder={`${CODE_LENGTH}자리 숫자`}
              placeholderTextColor="#8C8597"
              selectionColor={Colors.purple}
              cursorColor={Colors.purple}
              keyboardType="number-pad"
              autoComplete="sms-otp"
              textContentType="oneTimeCode"
              maxLength={CODE_LENGTH}
              accessibilityLabel="인증번호"
              // 안내 글은 본문 글꼴, 숫자를 넣으면 Unbounded · 넓은 자간
              style={[styles.code, code ? styles.codeFilled : null]}
            />
            <View style={styles.resend}>
              <SheetLink label="인증번호 다시 받기" color={Colors.inkSub} onPress={send} />
            </View>
          </View>
        ) : null}
      </ScrollView>
      <BottomBar>
        {sentTo ? (
          <Button label="확인" wide disabled={code.length < CODE_LENGTH} onPress={confirm} />
        ) : (
          <Button label="인증번호 받기" wide disabled={!phoneDigits(phone)} onPress={send} />
        )}
      </BottomBar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  body: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 40, gap: 18 },
  codeBlock: { gap: 6 },
  codeHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  lb: { fontFamily: Font.body900, fontSize: 12.5, lineHeight: 12.5 * 1.4 },
  timer: { fontFamily: Font.display, fontSize: 13, lineHeight: 18 },
  code: {
    height: 56,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.ink,
    backgroundColor: Colors.white,
    fontFamily: Font.body700,
    fontSize: 15,
    color: Colors.ink,
  },
  codeFilled: { fontFamily: Font.display, fontSize: 22, letterSpacing: 8 },
  resend: { alignItems: 'flex-start' },
});
