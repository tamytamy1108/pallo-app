import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNeedsOnboarding } from '@/api/session';
import { useCreateLinkRequest, useSubmitOnboarding } from '@/api/use-onboarding';
import { BranchSheet } from '@/components/onboarding/branch-sheet';
import { LinkConsent } from '@/components/onboarding/link-consent';
import { Field, FieldLabel, NextButton, OnbInput, OnbScreen, PickField, useRequired } from '@/components/onboarding/parts';
import { Colors } from '@/constants/theme';
import { formatPhone, isPhone } from '@/data/trial';
import { stepsFor, updateOnboarding, useOnboarding } from '@/state/onboarding';

/** 지점에 등록한 이름: 2~20자 (docs/pages/09-onboarding.md '3. 지점 연동 요청') */
const isRealName = (v: string) => v.trim().length >= 2 && v.trim().length <= 20;

/**
 * 가입 4/4 · 지점 회원: 다니는 지점에 연동을 요청해요 (프로토타입 onboarding-options.html #dest-link · #m-sheet).
 * 칸: 지점(시트로 고르기) · 이름(지점에 등록한 이름) · 휴대폰 번호 — 모두 필수. 배우는 언어 · '확인됨' 표시는 두지 않아요.
 * 아래: 조용한 동의 한 줄(처음부터 켜짐) + `연동 요청 보내기`(늘 켜짐 · 빠진 칸이 있으면 그 칸으로 스크롤해 알려 줌) → 확인 중 화면.
 * 보내기: 가입 중이면 POST /onboarding (MEMBER · 약관 · 닉네임 · 팔로로까지 한 번에), 가입을 마친 뒤면 POST /me/branch-link-requests.
 * 지점 시트는 이미 연동된 · 확인 중인 지점을 막아요. 실패하면 토스트만 띄우고 이 화면에 남아요.
 */
export default function LinkScreen() {
  const insets = useSafeAreaInsets();
  const branch = useOnboarding((s) => s.branch);
  const branchCode = useOnboarding((s) => s.branchCode);
  // 가입 중이면 가입 전체를 POST /onboarding (MEMBER) 으로, 가입을 마친 뒤(못 찾음 뒤 고쳐서 다시 등)면 연동 요청만 POST /me/branch-link-requests
  const inOnboarding = useNeedsOnboarding();
  const submitOnboarding = useSubmitOnboarding();
  const createLink = useCreateLinkRequest();
  const busy = submitOnboarding.isPending || createLink.isPending;
  const realName = useOnboarding((s) => s.realName);
  const phone = useOnboarding((s) => s.phone);
  const [sheet, setSheet] = useState(false);
  const [agree, setAgree] = useState(true);
  // 칸을 한 번 떠난 뒤에만 틀린 곳을 알려 줘요 (적는 동안 빨간 글씨가 먼저 뜨지 않게)
  const [touched, setTouched] = useState({ name: false, phone: false });

  const nameOk = isRealName(realName);
  const phoneOk = isPhone(phone);
  // 버튼은 늘 켜 두고, 누를 때 빠진 칸이 있으면 그 칸으로 데려가요 (useRequired)
  const form = useRequired([
    { name: 'branch', ok: !!branchCode, message: '지점을 골라 주세요' },
    { name: 'name', ok: nameOk, message: realName.trim() ? '이름은 2~20자로 적어 주세요' : '이름을 적어 주세요' },
    { name: 'phone', ok: phoneOk, message: '휴대폰 번호를 확인해 주세요' },
    { name: 'agree', ok: agree, message: '정보 보내기에 동의해 주세요' },
  ]);

  const send = () => {
    if (busy) return;
    form.submit(() => {
      const sent = { realName: realName.trim(), phone: formatPhone(phone) };
      updateOnboarding(sent);
      const onSuccess = () => router.replace('/onboarding/link-wait');
      if (inOnboarding) submitOnboarding.mutate('MEMBER', { onSuccess });
      else createLink.mutate({ branchCode, branchName: branch, ...sent }, { onSuccess });
    });
  };

  return (
    // 키보드가 올라오면 아래 버튼도 같이 올라와요. 아래 안전 영역만큼은 키보드가 덮으니 빼 줘요
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? -insets.bottom : 0}>
      <OnbScreen
        step={stepsFor('member')}
        total={stepsFor('member')}
        title={'다니는 지점에\n연동을 요청해요'}
        desc="지점에 등록한 이름 · 번호와 같게 적어 주세요."
        form={form}
        footer={
          <>
            <Field name="agree" fixed style={styles.consent}>
              <LinkConsent on={agree} onChange={setAgree} branch={branch} />
            </Field>
            <NextButton label={busy ? '보내는 중…' : '연동 요청 보내기'} onPress={send} ready={form.ready && !busy} />
          </>
        }>
        <Field name="branch">
          <FieldLabel required>지점</FieldLabel>
          <PickField value={branch} placeholder="다니는 지점을 골라요" onPress={() => setSheet(true)} />
        </Field>
        <Field name="name" error={touched.name && !nameOk ? '이름은 2~20자로 적어 주세요' : undefined}>
          <FieldLabel required hint="지점에 등록한 이름">
            이름
          </FieldLabel>
          <OnbInput
            value={realName}
            onChangeText={(v) => updateOnboarding({ realName: v })}
            onBlur={() => setTouched((t) => ({ ...t, name: true }))}
            placeholder="김팔로"
            maxLength={20}
            autoComplete="name"
            textContentType="name"
            returnKeyType="done"
            accessibilityLabel="이름, 필수, 지점에 등록한 이름"
          />
        </Field>
        <Field name="phone" error={touched.phone && !phoneOk ? '휴대폰 번호를 다시 확인해 주세요' : undefined}>
          <FieldLabel required>휴대폰 번호</FieldLabel>
          <OnbInput
            value={phone}
            onChangeText={(v) => updateOnboarding({ phone: v.replace(/[^0-9-]/g, '') })}
            onBlur={() => {
              setTouched((t) => ({ ...t, phone: true }));
              if (isPhone(phone)) updateOnboarding({ phone: formatPhone(phone) });
            }}
            placeholder="010-0000-0000"
            maxLength={13}
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            returnKeyType="done"
            accessibilityLabel="휴대폰 번호, 필수"
          />
        </Field>
      </OnbScreen>
      <BranchSheet
        open={sheet}
        onClose={() => setSheet(false)}
        title="다니는 지점을 골라요"
        value={branchCode}
        purpose="link"
        onPick={(b) => {
          updateOnboarding({ branchCode: b.code, branch: b.name });
          form.reveal('name', 'phone');
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.cream },
  // 동의 줄은 아래 고정 칸이라 위 간격 없이 (안내는 가운데)
  consent: { marginTop: 0, alignItems: 'center' },
});
