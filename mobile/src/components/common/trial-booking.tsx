import type { ReactNode } from 'react';
import { Linking, StyleSheet, View } from 'react-native';

import { nowDate } from '@/components/home/attendance';
import { Button } from '@/components/ui/button';
import { CallButton, CopyButton } from '@/components/ui/contact-buttons';
import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { BRANCH_TEL_MOCK } from '@/state/link-events';
import type { StudyLang } from '@/state/me';
import { useOnboarding } from '@/state/onboarding';

/** 체험 예약 한 건 (서버 요약 upcomingTrials 를 카드 · 시트 모양으로 — api/use-branch-progress). day 'YYYY-MM-DD' · time 'HH:MM' */
export type TrialBooking = { branch: string; day: string; time: string; lang: StudyLang };

const WEEK = ['일', '월', '화', '수', '목', '금', '토'];
const LANG_KO = { en: '영어', ja: '일본어', zh: '중국어', es: '스페인어' } as const;

const dayOf = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/** 체험 날까지 남은 날 (오늘 0시 기준 · 지난 날은 음수) */
export function trialDaysLeft(t: TrialBooking, now = nowDate()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((dayOf(t.day).getTime() - today.getTime()) / 86400000);
}

/** '11.27 (금)' */
export function trialShortDate(t: TrialBooking) {
  const d = dayOf(t.day);
  return `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, '0')} (${WEEK[d.getDay()]})`;
}

/** 체험 날이 지났는지 (당일은 상담 시각 + 2시간까지 '오늘') */
export function trialStage(t: TrialBooking, now = nowDate()): 'before' | 'today' | 'after' {
  const left = trialDaysLeft(t, now);
  if (left > 0) return 'before';
  if (left < 0) return 'after';
  const [h, m] = t.time.split(':').map(Number);
  return now.getHours() * 60 + now.getMinutes() > h * 60 + m + 120 ? 'after' : 'today';
}

/**
 * 체험 예약 내용 시트 (홈 체험 카드 · 마이 잠긴 칸에서 열어요).
 * 지점 · 날짜 · 시간 · 언어 · 내용 · 전달 사항(가입 때 적었으면) → [예약 바꾸기](지금은 안내 토스트) [지점에 전화하기].
 * 맞는 API: 체험 예약 조회 (가입 단계 체험 예약 · docs/pages/09-onboarding.md)
 */
export function TrialBookingSheet({ trial, open, onClose }: { trial: TrialBooking; open: boolean; onClose: () => void }) {
  const note = useOnboarding((o) => o.note);
  const d = dayOf(trial.day);
  const call = () => {
    Linking.openURL(`tel:${BRANCH_TEL_MOCK.replace(/-/g, '')}`).catch(() => showToast(`${trial.branch} ${BRANCH_TEL_MOCK}`));
  };
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="체험 예약"
      footer={
        <>
          <Button
            label="예약 바꾸기"
            variant="secondary"
            wide
            onPress={() => {
              onClose();
              showToast('지점에 전화로 바꿀 수 있어요');
            }}
          />
          <Button label="지점에 전화하기" wide onPress={call} />
        </>
      }>
      <View style={styles.card}>
        <Row label="지점" value={trial.branch} />
        <Row label="지점 번호" value={BRANCH_TEL_MOCK} end={<View style={styles.btns}><CopyButton text={BRANCH_TEL_MOCK} label={`${trial.branch} 번호 복사`} /><CallButton tel={BRANCH_TEL_MOCK} label={`${trial.branch}에 전화하기`} /></View>} />
        <Row label="날짜" value={`${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEK[d.getDay()]})`} />
        <Row label="시간" value={trial.time} />
        <Row label="언어" value={LANG_KO[trial.lang]} />
        <Row label="내용" value="회화 상담" last={!note} />
        {note ? <Row label="전달 사항" value={note} last /> : null}
      </View>
      <PText style={styles.hint} color={Colors.inkSub}>
        상담 전에 지점에서 연락드려요. 시간을 바꾸거나 취소하려면 지점에 전화해 주세요.
      </PText>
    </Sheet>
  );
}

function Row({ label, value, last = false, end }: { label: string; value: string; last?: boolean; end?: ReactNode }) {
  return (
    <View style={[styles.row, !last && styles.rowLine]}>
      <PText style={styles.label} color={Colors.inkSub}>
        {label}
      </PText>
      <PText style={styles.value}>{value}</PText>
      {end}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 18, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, paddingHorizontal: 14 },
  row: { flexDirection: 'row', gap: 12, paddingVertical: 11 },
  rowLine: { borderBottomWidth: 1.5, borderColor: Colors.line },
  label: { width: 64, fontFamily: Font.body800, fontSize: 13, lineHeight: 20 },
  value: { flex: 1, fontFamily: Font.body800, fontSize: 14, lineHeight: 20 },
  btns: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: -4 },
  hint: { fontFamily: Font.body600, fontSize: 12.5, lineHeight: 19 },
});
