import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { logout } from '@/api/auth';
import { Field, NextButton, OnbInput, OnbScreen, useRequired } from '@/components/onboarding/parts';
import { checkNickname, NICKNAME_MAX, NickHelp, useNicknameStatus } from '@/components/onboarding/start-nickname';
import { NameStage } from '@/components/onboarding/start-stage';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { getOnboarding, stepsFor, updateOnboarding, useOnboarding } from '@/state/onboarding';

const HERO = require('@/assets/characters/c-purple-lash-sticker.png');

/**
 * 가입 1단계 · 닉네임 (시안 2장 'B · 작은 무대' · docs/pages/09-onboarding.md).
 * 위에 작은 무대 카드(입력하는 대로 닉네임이 바뀜), 아래 크림 바탕에 질문 · 입력칸 · 도움말(오른쪽 글자 수).
 * 카카오 이름을 미리 채우고(규칙에 안 맞으면 빈칸), 2~10자 한글 · 영문 · 숫자, 입력하는 동안 중복 확인.
 * '다음'은 키보드 바로 위.
 */
export default function NicknameScreen() {
  const insets = useSafeAreaInsets();
  const path = useOnboarding((s) => s.path);
  // 동의할 약관이 없어 약관 단계를 건너뛰고 왔으면(terms.tsx) 돌아갈 곳이 없으니, 뒤로 = 가입 그만두기 (로그아웃 → 첫 화면)
  const { noTerms } = useLocalSearchParams<{ noTerms?: string }>();
  const [name, setName] = useState(() => {
    const kakao = getOnboarding().nickname;
    return checkNickname(kakao) ? '' : kakao;
  });
  const [focused, setFocused] = useState(false);
  const status = useNicknameStatus(name);
  const ok = status.tone === 'ok';
  // '다음'은 늘 켜 두고, 쓸 수 없는 이름이면 입력칸이 흔들리며 빨간 테두리 (안내는 아래 NickHelp 가 이미 보여 줘요)
  const form = useRequired([{ name: 'nickname', ok, message: status.text }]);

  const next = () =>
    form.submit(() => {
      updateOnboarding({ nickname: name });
      router.push('/onboarding/character');
    });

  return (
    // iOS: 키보드가 올라오면 '다음'이 키보드 바로 위에 붙어요 (아래 안전 영역만큼은 겹쳐서 빼요)
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={-insets.bottom}>
      <OnbScreen step={1} total={stepsFor(path)} form={form} onBack={noTerms === '1' ? () => void logout() : undefined} footer={<NextButton onPress={next} ready={ok} />}>
        <View style={styles.stage}>
          <NameStage kind="nickname" name={name} hero={HERO} cheer={ok} label={`무대 위 팔로로: HELLO, ${name || '닉네임'}!`} />
        </View>
        <PText style={styles.title} accessibilityRole="header">
          무대에 오를 닉네임은요?
        </PText>

        <PText style={styles.label} nativeID="nickLabel">
          닉네임
        </PText>
        <Field name="nickname" quiet style={[styles.ring, focused && styles.ringOn]}>
          <OnbInput
            ring={false}
            value={name}
            onChangeText={setName}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onSubmitEditing={next}
            autoFocus
            maxLength={NICKNAME_MAX}
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            autoComplete="off"
            textContentType="nickname"
            returnKeyType="next"
            submitBehavior="submit"
            placeholder="닉네임을 써 주세요"
            accessibilityLabel="닉네임"
            accessibilityLabelledBy="nickLabel"
            accessibilityHint="2자에서 10자, 한글 · 영문 · 숫자만 쓸 수 있어요"
          />
        </Field>
        <NickHelp status={status} count={[...name].length} />
      </OnbScreen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.cream },
  stage: { marginTop: 8 },
  title: { marginTop: 18, fontFamily: Font.body900, fontSize: 24, lineHeight: 32, letterSpacing: -0.7 },
  label: { marginTop: 14, fontFamily: Font.body900, fontSize: 13.5, lineHeight: 18, color: Colors.inkSub },
  // 입력 중이면 보라 테두리 링 (시안 .inp outline 3px · offset 2px). 자리는 늘 잡아 두어 흔들리지 않아요
  ring: { marginTop: 3, marginHorizontal: -5, padding: 2, borderWidth: 3, borderColor: 'transparent', borderRadius: 21 },
  ringOn: { borderColor: Colors.purple },
});
