import { Redirect, router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Linking, StyleSheet, View } from 'react-native';

import type { TrialApplication } from '@/api/trial-applications';
import { useTrialApplications } from '@/api/use-trial-applications';
import { AccountPage, Head } from '@/components/account/parts';
import { nowDate } from '@/components/home/attendance';
import { Button } from '@/components/ui/button';
import { CallButton, CopyButton } from '@/components/ui/contact-buttons';
import { Pill } from '@/components/ui/pill';
import { Pressable } from '@/components/ui/pressable';
import { Sheet } from '@/components/ui/sheet';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state-view';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { sfx } from '@/lib/feedback';
import { isMember } from '@/state/access';
import { useMe } from '@/state/me';

const WEEK = ['일', '월', '화', '수', '목', '금', '토'];

const dayOf = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const shortDate = (iso: string) => {
  const d = dayOf(iso);
  return `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, '0')} (${WEEK[d.getDay()]})`;
};
const longDate = (iso: string) => {
  const d = dayOf(iso);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEK[d.getDay()]})`;
};
/** '오늘' · '내일' · 'D-3' */
const dDay = (iso: string) => {
  const n = nowDate();
  const left = Math.round((dayOf(iso).getTime() - new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime()) / 86400000);
  return left <= 0 ? '오늘' : left === 1 ? '내일' : `D-${left}`;
};
const appliedOn = (instant: string) => {
  const d = new Date(instant);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} 신청`;
};

/**
 * 상담 신청 내역 (/me/consultations) — 내가 보낸 체험 상담 신청 전부 (가입 때 · 앱 안에서).
 * 체험 전(지점 회원이 아닌) 사람만 봐요 — 회원은 마이에 줄이 없고, 주소로 와도 마이로 돌려보내요 (2026-11-26).
 * 다가오는 상담(가까운 순 · D-day) / 지난 신청(최근 순, 흐리게). 줄을 누르면 신청 내용 시트.
 * 바꾸기 · 취소는 앱에서 하지 않아요 — 지점에 전화 (지점 전화번호가 아직 서버에 없어 버튼 대신 안내).
 * API: GET /trial-applications (api/trial-applications) — mock 을 끄면 실제 서버. 언어 이름은 서버가 붙여 줘요.
 */
export default function ConsultationsScreen() {
  const member = useMe(isMember);
  if (member) return <Redirect href="/my" />;
  return <Consultations />;
}

function Consultations() {
  const q = useTrialApplications();
  const [open, setOpen] = useState<TrialApplication | null>(null);

  let body;
  if (q.isPending) body = <LoadingState />;
  else if (q.isError) body = <ErrorState onRetry={() => q.refetch()} />;
  else if (!q.data.upcoming.length && !q.data.past.length)
    body = <EmptyState title={'아직 신청한 체험 상담이 없어요.'} link={{ label: '체험 상담 신청하기 ›', onPress: () => router.push('/trial') }} />;
  else
    body = (
      <>
        {q.data.upcoming.length ? (
          <View>
            <Head>다가오는 상담</Head>
            {q.data.upcoming.map((a) => (
              <ConsultRow key={a.id} a={a} tag={dDay(a.date)} onPress={() => setOpen(a)} />
            ))}
          </View>
        ) : null}
        {q.data.past.length ? (
          <View>
            <Head>지난 신청</Head>
            {q.data.past.map((a) => (
              <ConsultRow key={a.id} a={a} past onPress={() => setOpen(a)} />
            ))}
          </View>
        ) : null}
      </>
    );

  return (
    <AccountPage title="상담 신청 내역" bodyStyle={styles.body}>
      {body}
      <ConsultSheet a={open} onClose={() => setOpen(null)} />
    </AccountPage>
  );
}

function ConsultRow({ a, tag, past = false, onPress }: { a: TrialApplication; tag?: string; past?: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={() => {
        sfx('tap');
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={`${a.branchName} ${shortDate(a.date)} ${a.time} 상담 신청 내용`}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.flex}>
        <PText style={styles.tg} color={past ? Colors.inkSub : Colors.purple}>{`${shortDate(a.date)} ${a.time}`}</PText>
        <PText style={styles.b} color={past ? Colors.inkSub : Colors.ink} numberOfLines={1}>
          {a.branchName}
        </PText>
        <PText style={styles.s} color={Colors.inkSub}>{`${a.languageLabel} 체험 상담 · ${appliedOn(a.createdAt)}`}</PText>
      </View>
      {tag ? <Pill label={tag} variant={tag === '오늘' ? 'yellow' : 'soft'} /> : null}
    </Pressable>
  );
}

function ConsultSheet({ a, onClose }: { a: TrialApplication | null; onClose: () => void }) {
  const phone = a?.branchPhone ?? null;
  const call = () => {
    if (!a || !phone) return;
    Linking.openURL(`tel:${phone.replace(/-/g, '')}`).catch(() => showToast(`${a.branchName} ${phone}`));
  };
  return (
    <Sheet
      open={!!a}
      onClose={onClose}
      title="상담 신청 내용"
      footer={phone ? <Button label="지점에 전화하기" wide onPress={call} /> : <Button label="확인" wide onPress={onClose} />}>
      {a ? (
        <>
          <View style={styles.card}>
            <Row label="지점" value={a.branchName} />
            {phone ? <Row label="지점 번호" value={phone} end={<View style={styles.sBtns}><CopyButton text={phone} label={`${a.branchName} 번호 복사`} /><CallButton tel={phone} label={`${a.branchName}에 전화하기`} /></View>} /> : null}
            <Row label="날짜" value={longDate(a.date)} />
            <Row label="시간" value={a.time} />
            <Row label="언어" value={a.languageLabel} />
            <Row label="이름" value={a.realName} />
            <Row label="연락처" value={a.phone} last={!a.note} />
            {a.note ? <Row label="전달 사항" value={a.note} last /> : null}
          </View>
          <PText style={styles.hint} color={Colors.inkSub}>
            {phone
              ? '상담 전에 지점에서 연락드려요. 시간을 바꾸거나 취소하려면 지점에 전화해 주세요.'
              : '상담 전에 지점에서 연락드려요. 시간을 바꾸거나 취소하려면 연락 온 번호로 알려 주세요.'}
          </PText>
        </>
      ) : null}
    </Sheet>
  );
}

function Row({ label, value, last = false, end }: { label: string; value: string; last?: boolean; end?: ReactNode }) {
  return (
    <View style={[styles.sRow, !last && styles.sRowLine]}>
      <PText style={styles.sLabel} color={Colors.inkSub}>
        {label}
      </PText>
      <PText style={styles.sValue}>{value}</PText>
      {end}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.7 },
  body: { paddingTop: 4, gap: 18 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16, borderBottomWidth: 1.5, borderColor: Colors.line },
  tg: { fontFamily: Font.body900, fontSize: 12.5, lineHeight: 18 },
  b: { marginTop: 3, fontFamily: Font.body900, fontSize: 15.5, lineHeight: 22 },
  s: { marginTop: 3, fontFamily: Font.body700, fontSize: 12.5, lineHeight: 18 },
  card: { borderRadius: 18, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, paddingHorizontal: 14 },
  sRow: { flexDirection: 'row', gap: 12, paddingVertical: 11 },
  sRowLine: { borderBottomWidth: 1.5, borderColor: Colors.line },
  sLabel: { width: 64, fontFamily: Font.body800, fontSize: 13, lineHeight: 20 },
  sBtns: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: -4 },
  sValue: { flex: 1, fontFamily: Font.body800, fontSize: 14, lineHeight: 20 },
  hint: { marginTop: 12, fontFamily: Font.body600, fontSize: 12.5, lineHeight: 19 },
});
