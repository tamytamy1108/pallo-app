import { useMutation, useQuery } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { signUpWithEmail, type Gender } from '@/api/auth';
import { apiErrorMessage, isApiError } from '@/api/errors';
import { signupOptionsQuery } from '@/api/queries';
import { PasswordField } from '@/components/auth/password-field';
import { BottomBar } from '@/components/bottom-bar';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/field';
import { Chip } from '@/components/ui/pill';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { TopBar } from '@/components/ui/top-bar';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { EMAIL_MAX, EMPTY_SIGNUP, firstSignupError, NAME_MAX, PASSWORD_MAX, signupFieldError, type SignupField, type SignupForm } from '@/data/signup';
import { formatPhone } from '@/data/trial';
import { sfx } from '@/lib/feedback';

const GENDERS: { code: Gender; label: string }[] = [
  { code: 'MALE', label: '남성' },
  { code: 'FEMALE', label: '여성' },
];

const ERROR = '#B23A5A';

/**
 * 이메일 회원가입 (첫 화면 [회원가입]). 백엔드 POST /auth/signup · GET /auth/signup/options.
 * 이메일 · 비밀번호 · 이름 · 전화번호는 꼭, 연령대 · 성별은 골라도 안 골라도 돼요.
 * 가입하면 토큰이 바로 와서, 로그인 상태(api/session.tsx)가 /me 를 받아 가입 과정(약관 …)으로 보내요 (app/_layout.tsx).
 */
export default function SignupScreen() {
  const [form, setForm] = useState<SignupForm>(EMPTY_SIGNUP);
  // 한 번 벗어난 칸만 틀린 점을 보여요 (쓰는 중에 빨갛게 하지 않게)
  const [touched, setTouched] = useState<Partial<Record<SignupField, boolean>>>({});
  const [ageGroup, setAgeGroup] = useState<string | null>(null);
  const [gender, setGender] = useState<Gender | null>(null);
  const [takenEmail, setTakenEmail] = useState<string | null>(null);
  const options = useQuery(signupOptionsQuery());

  const signup = useMutation({
    mutationFn: () =>
      signUpWithEmail({
        email: form.email.trim(),
        password: form.password,
        name: form.name.trim(),
        phone: formatPhone(form.phone),
        ageGroup,
        gender,
      }),
    onSuccess: () => sfx('save'),
    onError: (e) => {
      sfx('wrong');
      if (isApiError(e) && e.status === 409) {
        setTakenEmail(form.email.trim());
        showToast('이미 가입한 이메일이에요');
        return;
      }
      showToast(apiErrorMessage(e));
    },
  });

  const set = (field: SignupField) => (v: string) => setForm((f) => ({ ...f, [field]: v }));
  const blur = (field: SignupField) => () => setTouched((t) => ({ ...t, [field]: true }));
  const errorOf = (field: SignupField) => {
    if (field === 'email' && takenEmail && form.email.trim() === takenEmail) return '이미 가입한 이메일이에요';
    return touched[field] ? signupFieldError(field, form) : null;
  };

  const submit = () => {
    const problem = firstSignupError(form);
    if (problem) {
      setTouched({ email: true, password: true, passwordConfirm: true, name: true, phone: true });
      sfx('wrong');
      showToast(problem.message);
      return;
    }
    signup.mutate();
  };

  const filled = !!(form.email && form.password && form.passwordConfirm && form.name && form.phone);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <TopBar title="회원가입" fallback="/welcome" />
      <ScrollView automaticallyAdjustKeyboardInsets contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Field label="이메일" required error={errorOf('email')}>
          <TextField
            placeholder="example@email.com"
            value={form.email}
            onChangeText={set('email')}
            onBlur={blur('email')}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            maxLength={EMAIL_MAX}
            accessibilityLabel="이메일"
          />
        </Field>
        <Field label="비밀번호" required error={errorOf('password')}>
          <PasswordField
            placeholder="영문 · 숫자를 섞어 8자 이상"
            value={form.password}
            onChangeText={set('password')}
            onBlur={blur('password')}
            invalid={!!errorOf('password')}
            autoComplete="new-password"
            textContentType="newPassword"
            maxLength={PASSWORD_MAX}
            accessibilityLabel="비밀번호"
          />
        </Field>
        <Field label="비밀번호 확인" required error={errorOf('passwordConfirm')}>
          <PasswordField
            placeholder="비밀번호를 한 번 더 입력해 주세요"
            value={form.passwordConfirm}
            onChangeText={set('passwordConfirm')}
            onBlur={blur('passwordConfirm')}
            invalid={!!errorOf('passwordConfirm')}
            autoComplete="new-password"
            textContentType="newPassword"
            maxLength={PASSWORD_MAX}
            accessibilityLabel="비밀번호 확인"
          />
        </Field>
        <Field label="이름" required error={errorOf('name')} count={`${form.name.length}/${NAME_MAX}`}>
          <TextField
            placeholder="이름을 입력해 주세요"
            value={form.name}
            onChangeText={set('name')}
            onBlur={blur('name')}
            oneLine
            autoComplete="name"
            textContentType="name"
            maxLength={NAME_MAX}
            accessibilityLabel="이름"
          />
        </Field>
        <Field label="전화번호" required error={errorOf('phone')}>
          <TextField
            placeholder="010-0000-0000"
            value={form.phone}
            onChangeText={set('phone')}
            onBlur={blur('phone')}
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            maxLength={13}
            accessibilityLabel="전화번호"
          />
        </Field>

        {/* 연령대: 서버 선택지 (못 받으면 이 칸은 숨겨요 · 골라도 안 골라도 돼요) */}
        {options.data?.ageGroups.length ? (
          <View style={styles.group}>
            <PText style={styles.groupTitle} accessibilityRole="header">
              연령대 <PText style={styles.optional}>(선택)</PText>
            </PText>
            <View style={styles.chips}>
              {options.data.ageGroups.map((o) => (
                <Chip key={o.code} label={o.label} selected={ageGroup === o.code} onPress={() => setAgeGroup((v) => (v === o.code ? null : o.code))} />
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.group}>
          <PText style={styles.groupTitle} accessibilityRole="header">
            성별 <PText style={styles.optional}>(선택)</PText>
          </PText>
          <View style={styles.chips}>
            {GENDERS.map((o) => (
              <Chip key={o.code} label={o.label} selected={gender === o.code} onPress={() => setGender((v) => (v === o.code ? null : o.code))} />
            ))}
          </View>
        </View>

        {/* 가입 안내 */}
        <View style={styles.note}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={Colors.purple} strokeWidth={2.4} strokeLinecap="round">
            <Circle cx={12} cy={12} r={10} />
            <Path d="M12 11v6M12 7.5v.01" />
          </Svg>
          <View style={styles.noteText}>
            <PText style={styles.noteTitle}>가입 안내</PText>
            <PText style={styles.noteBody}>
              이메일 · 비밀번호 · 이름 · 전화번호는 꼭 입력해야 해요. 연령대 · 성별은 고르지 않아도 가입할 수 있어요. 가입한 이메일과 비밀번호로 다음에 로그인할 수 있어요.
            </PText>
          </View>
        </View>
      </ScrollView>
      <BottomBar>
        <Button label={signup.isPending ? '가입하는 중…' : '가입하기'} wide disabled={!filled || signup.isPending} onPress={submit} />
      </BottomBar>
    </SafeAreaView>
  );
}

/** 라벨 (+ 오른쪽 글자 수) · 칸 · 틀린 점 한 줄 */
function Field({ label, required, error, count, children }: { label: string; required?: boolean; error: string | null; count?: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <PText style={styles.label}>
          {label}
          {required ? <PText style={styles.req}> *</PText> : null}
        </PText>
        {count ? <PText style={styles.count}>{count}</PText> : null}
      </View>
      {children}
      {error ? (
        <PText style={styles.error} color={ERROR} accessibilityLiveRegion="polite">
          {error}
        </PText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  body: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 40, gap: 18 },
  field: { gap: 6 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  // TextField 라벨과 같아요 (.lg-fl label)
  label: { fontFamily: Font.body900, fontSize: 12.5, lineHeight: 12.5 * 1.4 },
  req: { color: '#E5484D' },
  count: { fontFamily: Font.body700, fontSize: 12, lineHeight: 12 * 1.4, color: Colors.inkSub },
  error: { fontFamily: Font.body700, fontSize: 12, lineHeight: 12 * 1.45 },
  group: { gap: 10, marginTop: 4 },
  groupTitle: { fontFamily: Font.body900, fontSize: 15, lineHeight: 20 },
  optional: { fontFamily: Font.body700, fontSize: 13, lineHeight: 20, color: Colors.inkSub },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  note: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: 18, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.lavender, marginTop: 4 },
  noteText: { flex: 1, gap: 4 },
  noteTitle: { fontFamily: Font.body900, fontSize: 13.5, lineHeight: 18 },
  noteBody: { fontFamily: Font.body600, fontSize: 12.5, lineHeight: 12.5 * 1.55, color: Colors.inkSub },
});
