import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';

import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { formatPhone, isPhone } from '@/data/trial';
import { sfx } from '@/lib/feedback';
import { stepsFor } from '@/state/onboarding';
import type { TrialDraft } from '@/state/trial-booking';

import { ONB_LANGS, WHY_REASONS } from './app-parts';
import { BranchSheet } from './branch-sheet';
import { Chip, Chips, Field, FieldLabel, NextButton, OnbInput, OnbScreen, PickField, useRequired } from './parts';
import { TrialSlots, TrialWait, trialDayTiles, trialSlots } from './trial-slots';

/** onboarding: 가입 4/4 (진행 바 · 뒤로는 앞 단계) · app: 앱 안 전체 화면 (진행 바 없이 ‹ 는 닫기) */
export type TrialFormMode = 'onboarding' | 'app';

const NOTE_MAX = 200;

/**
 * 체험 예약 한 장 — docs/pages/09-onboarding.md '3-2. 체험 예약', 프로토타입 #dest-trial · #t-sheet · #t-pick.
 * 지점 → 이름 → 번호 → 희망 언어(하나) → 상담 시간 → 배우고 싶은 이유(선택) → 전달 사항(선택)을 위에서 아래로 채워요.
 * 값은 바깥이 들고 있어요 (가입: 온보딩 값 · 앱: 그 화면). 고르는 대로 onChange, '체험 예약하기'를 누르면
 * 빠진 칸으로 데려가거나(useRequired) 다듬은 값으로 onSubmit (이름 다듬기 · 번호 꾸미기 · 보이던 날짜 · 고른 시간).
 * 맞는 API: 47 `POST /trial-bookings`.
 */
export function TrialForm({ mode, value: v, onChange, onSubmit, onBack }: { mode: TrialFormMode; value: TrialDraft; onChange: (patch: Partial<TrialDraft>) => void; onSubmit: (booking: TrialDraft) => void; onBack?: () => void }) {
  const [sheet, setSheet] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [days] = useState(trialDayTiles);

  const lang = ONB_LANGS.find((l) => l.key === v.langs[0]) ?? ONB_LANGS[0];
  // 날짜는 고른 게 없으면 첫날(내일)을 보여 줘요. 시간은 직접 골라야 해요
  const day = days.some((d) => d.key === v.trialDay) ? v.trialDay : days[0].key;
  const slots = v.branch ? trialSlots(v.branch, day, lang.key) : [];
  const time = slots.some((s) => s.time === v.trialTime && !s.full) ? v.trialTime : '';

  const nameOk = v.realName.trim().length > 0;
  const phoneOk = isPhone(v.phone);
  // 버튼은 늘 켜 두고, 누를 때 빠진 칸이 있으면 그 칸으로 데려가요 (useRequired). 희망 언어는 늘 하나 골라져 있어요
  const form = useRequired([
    { name: 'branch', ok: !!v.branch, message: '지점을 골라 주세요' },
    { name: 'name', ok: nameOk, message: '이름을 적어 주세요' },
    { name: 'phone', ok: phoneOk, message: '휴대폰 번호를 확인해 주세요' },
    { name: 'time', ok: !!time, message: '상담 시간을 골라 주세요' },
  ]);

  // 전달 사항은 맨 아래 칸이라, 누르면 키보드가 다 올라온 뒤 맨 끝까지 내려서 칸이 키보드 위에 보이게 해요
  const revealNote = () => {
    const toEnd = () => form.scrollRef.current?.scrollToEnd({ animated: true });
    if (Keyboard.isVisible()) return toEnd();
    const sub = Keyboard.addListener('keyboardDidShow', () => {
      sub.remove();
      clearTimeout(fallback);
      toEnd();
    });
    // 키보드 알림이 없는 곳(웹 · 하드웨어 키보드)에서도 내려가게
    const fallback = setTimeout(() => {
      sub.remove();
      toEnd();
    }, 450);
  };

  // 한 칸을 마치면 다음 칸이 아래 버튼에 가려 있을 때만 그만큼 내려 줘요 (form.reveal · 위로는 안 올려요)
  const toggleWhy = (r: string) => {
    onChange({ why: v.why.includes(r) ? v.why.filter((w) => w !== r) : [...v.why, r] });
    form.reveal('note');
  };

  const submit = () =>
    form.submit(() => {
      sfx('save');
      onSubmit({ ...v, realName: v.realName.trim(), phone: formatPhone(v.phone), langs: [lang.key], trialDay: day, trialTime: time, note: v.note.trim() });
    });

  const progress = mode === 'onboarding' ? stepsFor('trial') : undefined;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <OnbScreen
        step={progress}
        total={progress}
        onBack={onBack}
        title="체험을 예약해요"
        desc="매니저님이 재밌고 디테일하게 상담 진행을 도와드려요! 신청이 확정되면 연락드려요."
        form={form}
        footer={
          <>
            {/* 스크롤 내용이 버튼 뒤로 스르르 사라지게 (.t1-ft::before) */}
            <LinearGradient colors={['rgba(251,246,234,0)', Colors.cream]} style={styles.fade} pointerEvents="none" />
            <NextButton label="체험 예약하기" onPress={submit} ready={form.ready} />
          </>
        }>
        <Field name="branch" style={styles.first}>
          <FieldLabel required>지점</FieldLabel>
          <PickField value={v.branch} placeholder="지점 선택하기" onPress={() => setSheet(true)} />
        </Field>

        <Field name="name">
          <FieldLabel required>이름</FieldLabel>
          <OnbInput
            value={v.realName}
            onChangeText={(t) => onChange({ realName: t })}
            placeholder="이름"
            accessibilityLabel="이름"
            textContentType="name"
            autoComplete="name"
            autoCorrect={false}
            returnKeyType="done"
            maxLength={20}
          />
        </Field>

        <Field name="phone" error={phoneTouched && !phoneOk ? '휴대폰 번호를 다시 확인해 주세요' : undefined}>
          <FieldLabel required>휴대폰 번호</FieldLabel>
          <OnbInput
            value={v.phone}
            onChangeText={(t) => onChange({ phone: t })}
            onEndEditing={() => {
              setPhoneTouched(true);
              if (isPhone(v.phone)) onChange({ phone: formatPhone(v.phone) });
            }}
            placeholder="010-0000-0000"
            accessibilityLabel="휴대폰 번호"
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
            autoComplete="tel"
            returnKeyType="done"
            maxLength={13}
          />
        </Field>

        <Field name="lang">
          <FieldLabel required>희망 언어</FieldLabel>
          <Chips>
            {ONB_LANGS.map((l) => (
              <Chip
                key={l.key}
                label={l.ko}
                on={l.key === lang.key}
                onPress={() => {
                  onChange({ langs: [l.key], trialTime: '' });
                  form.reveal('time');
                }}
              />
            ))}
          </Chips>
        </Field>

        <Field name="time">
          <FieldLabel required>상담 시간</FieldLabel>
          {v.branch ? (
            <TrialSlots
              days={days}
              day={day}
              onDay={(key) => onChange({ trialDay: key, trialTime: '' })}
              slots={slots}
              time={time}
              onTime={(t) => {
                onChange({ trialDay: day, trialTime: t });
                form.reveal('why');
              }}
              note={`${v.branch} ${lang.ko} 프로님이 상담할 수 있는 시간이에요`}
            />
          ) : (
            <TrialWait />
          )}
        </Field>

        <Field name="why">
          <FieldLabel hint="여러 개 · 골라 주면 상담 때 참고해요">배우고 싶은 이유</FieldLabel>
          <Chips>
            {WHY_REASONS.map((r) => (
              <Chip key={r} label={r} on={v.why.includes(r)} onPress={() => toggleWhy(r)} />
            ))}
          </Chips>
        </Field>

        <Field name="note">
          <FieldLabel hint="선택 · 지점에 전할 말">전달 사항</FieldLabel>
          <OnbInput
            value={v.note}
            onChangeText={(t) => onChange({ note: t })}
            onFocus={revealNote}
            multiline
            maxLength={NOTE_MAX}
            placeholder="예: 퇴근 후라 7시 이후가 좋아요 · 발음 위주로 상담받고 싶어요"
            accessibilityLabel="전달 사항"
            accessibilityHint={`선택이에요. ${NOTE_MAX}자까지 지점에 전할 말을 적을 수 있어요`}
          />
          <PText style={styles.count} accessibilityLabel={`${v.note.length}자, 최대 ${NOTE_MAX}자`}>
            {v.note.length}/{NOTE_MAX}
          </PText>
        </Field>
      </OnbScreen>

      <BranchSheet
        open={sheet}
        onClose={() => setSheet(false)}
        title="체험할 지점을 골라요"
        value={v.branch}
        // 지점이 바뀌면 시간표도 바뀌어서 고른 시간을 비워요
        onPick={(name) => {
          onChange(name === v.branch ? {} : { branch: name, trialTime: '' });
          form.reveal('name', 'phone');
        }}
        trial
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.cream },
  first: { marginTop: 16 },
  count: { marginTop: 6, marginRight: 4, textAlign: 'right', fontFamily: Font.body700, fontSize: 12, lineHeight: 16, color: Colors.inkSub, fontVariant: ['tabular-nums'] },
  fade: { position: 'absolute', left: 0, right: 0, bottom: '100%', height: 20 },
});
