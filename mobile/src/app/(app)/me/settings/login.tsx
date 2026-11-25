import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Pressable } from '@/components/ui/pressable';
import { AccountPage, Box, Head } from '@/components/account/parts';
import { toggleLogin, useLogins } from '@/components/account/store';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { sfx } from '@/lib/feedback';

/**
 * 설정 › 로그인 계정 (프로토타입 loginHTML): 카카오 · 애플 · 구글 연결 · 해제(마지막 하나는 해제 못 함),
 * 휴대폰 번호 변경(번호 확인) · 이메일 등록(형식 확인). 맞는 API: `/me/auth-providers/:provider`
 */
export default function LoginAccountScreen() {
  const logins = useLogins();
  const [sheet, setSheet] = useState<null | 'phone' | 'email'>(null);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  return (
    <AccountPage title="로그인 계정" bodyStyle={styles.body}>
      <Head style={styles.h1}>간편 로그인</Head>
      <Box style={styles.go}>
        {Object.keys(logins).map((k, i) => {
          const on = logins[k];
          return (
            <Pressable
              key={k}
              onPress={() => {
                sfx('tap');
                if (!toggleLogin(k)) {
                  showToast('로그인 방법이 하나는 있어야 해요');
                  return;
                }
                showToast(on ? `${k} 연결을 해제했어요` : `${k} 계정을 연결했어요`);
              }}
              accessibilityRole="button"
              accessibilityLabel={`${k} ${on ? '연결 해제' : '연결'}`}
              style={({ pressed }) => [styles.row, i > 0 && styles.line, pressed && styles.pressed]}>
              <View style={styles.flex}>
                <PText style={styles.b}>{k}</PText>
                <PText style={styles.s}>{on ? '연결됨' : '연결 안 됨'}</PText>
              </View>
              <PText style={[styles.act, { color: on ? Colors.rosePink : Colors.purple }]}>{on ? '해제' : '연결'}</PText>
            </Pressable>
          );
        })}
      </Box>
      <Head>연락처</Head>
      <Box style={styles.go}>
        <Pressable onPress={() => setSheet('phone')} accessibilityRole="button" style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
          <View style={styles.flex}>
            <PText style={styles.b}>휴대폰 번호</PText>
            <PText style={styles.s}>010-****-5678 · 로그인 · 알림에 써요</PText>
          </View>
          <PText style={styles.more}>변경 ›</PText>
        </Pressable>
        <Pressable onPress={() => setSheet('email')} accessibilityRole="button" style={({ pressed }) => [styles.row, styles.line, pressed && styles.pressed]}>
          <View style={styles.flex}>
            <PText style={styles.b}>이메일</PText>
            <PText style={styles.s}>영수증을 받을 곳 · 아직 없어요</PText>
          </View>
          <PText style={styles.more}>등록 ›</PText>
        </Pressable>
      </Box>

      <Sheet
        open={sheet === 'phone'}
        onClose={() => setSheet(null)}
        title="휴대폰 번호 변경"
        footer={
          <View>
            <Button
              label="인증번호 받기"
              wide
              onPress={() => {
                if (!/^01\d{8,9}$/.test(phone.replace(/[^0-9]/g, ''))) {
                  showToast('휴대폰 번호를 확인해 주세요');
                  return;
                }
                setSheet(null);
                showToast('인증번호를 보냈어요 · 3분 안에 입력해 주세요');
              }}
            />
          </View>
        }>
        <PText style={styles.lb}>새 휴대폰 번호</PText>
        <TextInput value={phone} onChangeText={setPhone} placeholder="010-0000-0000" placeholderTextColor="#9B94A6" keyboardType="phone-pad" autoComplete="tel" accessibilityLabel="새 휴대폰 번호" style={styles.input} />
      </Sheet>
      <Sheet
        open={sheet === 'email'}
        onClose={() => setSheet(null)}
        title="이메일 등록"
        footer={
          <View>
            <Button
              label="인증 메일 보내기"
              wide
              onPress={() => {
                const v = email.trim();
                if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) {
                  showToast('이메일 주소를 확인해 주세요');
                  return;
                }
                setSheet(null);
                showToast(`${v}로 인증 메일을 보냈어요`);
              }}
            />
          </View>
        }>
        <PText style={styles.lb}>이메일</PText>
        <TextInput value={email} onChangeText={setEmail} placeholder="name@example.com" placeholderTextColor="#9B94A6" keyboardType="email-address" autoCapitalize="none" autoComplete="email" accessibilityLabel="이메일" style={styles.input} />
      </Sheet>
    </AccountPage>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.7 },
  body: { paddingTop: 4, paddingBottom: 40 },
  h1: { marginTop: 22 },
  go: { paddingVertical: 2, paddingHorizontal: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 66, paddingVertical: 10 },
  line: { borderTopWidth: 1.5, borderColor: Colors.line },
  b: { fontFamily: Font.body900, fontSize: 15, lineHeight: 21 },
  s: { fontFamily: Font.body700, fontSize: 12.5, lineHeight: 18, color: Colors.inkSub },
  act: { fontFamily: Font.body900, fontSize: 14, lineHeight: 20 },
  more: { fontFamily: Font.body900, fontSize: 13, lineHeight: 19, color: Colors.inkSub },
  lb: { marginBottom: 6, fontFamily: Font.body900, fontSize: 13, lineHeight: 19 },
  input: { minHeight: 52, paddingHorizontal: 16, borderRadius: 16, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, fontFamily: Font.body600, fontSize: 15, color: Colors.ink },
});
