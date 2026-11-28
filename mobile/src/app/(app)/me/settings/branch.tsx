import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { LinkRequestStatus } from '@/api/branch-link';
import { useMyLinkRequests, type LinkRequestRow } from '@/api/use-link-requests';
import { AccountPage, Head, TextLink } from '@/components/account/parts';
import { Button } from '@/components/ui/button';
import { Pill } from '@/components/ui/pill';
import { Pressable } from '@/components/ui/pressable';
import { Sheet } from '@/components/ui/sheet';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state-view';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { sfx } from '@/lib/feedback';
import { getOnboarding, updateOnboarding } from '@/state/onboarding';

const STATUS: Record<LinkRequestStatus, { label: string; variant: 'yellow' | 'soft' | 'dark' }> = {
  PENDING: { label: '확인 중', variant: 'yellow' },
  APPROVED: { label: '연동됨', variant: 'dark' },
  REJECTED: { label: '반려됨', variant: 'soft' },
};

const pad = (n: number) => String(n).padStart(2, '0');
/** 'YYYY.MM.DD' (기기 시간대) */
const day = (instant: string) => {
  const d = new Date(instant);
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
};
/** 'YYYY.MM.DD HH:mm' (기기 시간대) */
const dayTime = (instant: string) => {
  const d = new Date(instant);
  return `${day(instant)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** 연동 요청 화면으로 — 지점 회원 길로 맞추고, 다시 요청이면 그 지점 · 보냈던 이름 · 번호를 미리 채워요 */
function openLinkRequest(from?: LinkRequestRow) {
  const s = getOnboarding();
  updateOnboarding(
    from
      ? { path: 'member', branch: from.branchName, branchCode: from.branchCode, realName: from.realName ?? s.realName, phone: from.phone ?? s.phone }
      : { path: 'member', branch: '', branchCode: '' },
  );
  router.push('/onboarding/link');
}

/**
 * 설정 › 내 지점 (/me/settings/branch) — 내가 보낸 지점 연동 요청 전부 (가입 때 · 가입 뒤). 누구나 열어요.
 * 확인 중(최근 순) / 지난 요청(연동됨 · 반려됨, 최근 순). 줄을 누르면 요청 내용 시트 — 보낸 이름 · 번호 · 요청 · 처리 시각 · 지점이 남긴 말.
 * 반려된 요청이 그 지점의 가장 최근 요청이면 [다시 요청하기] (보냈던 값으로 칸을 채워 연동 요청 화면으로). 아래 '다른 지점 연동 요청하기'.
 * API: GET /me/branch-link-requests (api/use-link-requests) — mock 을 끄면 실제 서버. 상세는 목록 값으로 그려요 (서버에 단건 조회 없음).
 */
export default function MyBranchLinksScreen() {
  const q = useMyLinkRequests();
  const [open, setOpen] = useState<LinkRequestRow | null>(null);

  let body;
  if (q.isPending) body = <LoadingState />;
  else if (q.isError) body = <ErrorState onRetry={() => q.refetch()} />;
  else if (!q.data.pending.length && !q.data.done.length)
    body = <EmptyState title={'아직 보낸 지점 연동 요청이 없어요.'} link={{ label: '지점 연동 요청하기 ›', onPress: () => openLinkRequest() }} />;
  else
    body = (
      <>
        {q.data.pending.length ? (
          <View>
            <Head>확인 중</Head>
            {q.data.pending.map((r) => (
              <LinkRow key={r.id} r={r} onPress={() => setOpen(r)} />
            ))}
          </View>
        ) : null}
        {q.data.done.length ? (
          <View>
            <Head>지난 요청</Head>
            {q.data.done.map((r) => (
              <LinkRow key={r.id} r={r} onPress={() => setOpen(r)} />
            ))}
          </View>
        ) : null}
        <View style={styles.more}>
          <TextLink label="다른 지점 연동 요청하기 ›" onPress={() => openLinkRequest()} />
        </View>
      </>
    );

  return (
    <AccountPage title="내 지점" bodyStyle={styles.body}>
      {body}
      <LinkSheet
        r={open}
        onClose={() => setOpen(null)}
        onRetry={(r) => {
          setOpen(null);
          openLinkRequest(r);
        }}
      />
    </AccountPage>
  );
}

function LinkRow({ r, onPress }: { r: LinkRequestRow; onPress: () => void }) {
  const st = STATUS[r.status];
  const past = r.status !== 'PENDING';
  return (
    <Pressable
      onPress={() => {
        sfx('tap');
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={`${r.branchName} ${st.label} 연동 요청 내용`}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.flex}>
        <PText style={styles.b} color={past ? Colors.inkSub : Colors.ink} numberOfLines={1}>
          {r.branchName}
        </PText>
        <PText style={styles.s} color={Colors.inkSub} numberOfLines={1}>
          {r.status === 'PENDING' || !r.decidedAt ? `${day(r.createdAt)} 요청` : `${day(r.createdAt)} 요청 · ${day(r.decidedAt)} ${r.status === 'APPROVED' ? '연동' : '반려'}`}
        </PText>
      </View>
      <Pill label={st.label} variant={st.variant} />
    </Pressable>
  );
}

function LinkSheet({ r, onClose, onRetry }: { r: LinkRequestRow | null; onClose: () => void; onRetry: (r: LinkRequestRow) => void }) {
  const rows: [string, string][] = r
    ? [
        ['지점', r.branchName],
        ['상태', STATUS[r.status].label],
        // 옛 앱으로 보낸 요청에는 이름 · 번호가 없어요
        ...(r.realName ? ([['이름', r.realName]] as [string, string][]) : []),
        ...(r.phone ? ([['휴대폰', r.phone]] as [string, string][]) : []),
        ['요청한 때', dayTime(r.createdAt)],
        ...(r.decidedAt ? ([[r.status === 'APPROVED' ? '연동된 때' : '반려된 때', dayTime(r.decidedAt)]] as [string, string][]) : []),
        ...(r.status === 'REJECTED' ? ([['지점이 남긴 말', r.rejectionReason || '남긴 말이 없어요']] as [string, string][]) : []),
      ]
    : [];
  const hint = !r
    ? ''
    : r.status === 'PENDING'
      ? '지점에서 등록된 이름 · 번호로 회원을 찾고 있어요. 연동되면 알려 드려요.'
      : r.status === 'APPROVED'
        ? '이 지점 회원으로 연동됐어요. 출석 · 스터디를 앱에서 볼 수 있어요.'
        : r.canRetry
          ? '지점에 등록한 이름 · 번호와 같게 고쳐서 다시 요청해 보세요.'
          : '이 지점에는 이 뒤에 다시 보낸 요청이 있어요.';
  return (
    <Sheet
      open={!!r}
      onClose={onClose}
      title="연동 요청 내용"
      footer={r?.canRetry ? <Button label="다시 요청하기" wide onPress={() => onRetry(r)} /> : <Button label="확인" wide onPress={onClose} />}>
      {r ? (
        <>
          <View style={styles.card}>
            {rows.map(([label, value], i) => (
              <View key={label} style={[styles.sRow, i < rows.length - 1 && styles.sRowLine]}>
                <PText style={styles.sLabel} color={Colors.inkSub}>
                  {label}
                </PText>
                <PText style={styles.sValue}>{value}</PText>
              </View>
            ))}
          </View>
          <PText style={styles.hint} color={Colors.inkSub}>
            {hint}
          </PText>
        </>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.7 },
  body: { paddingTop: 4, gap: 18 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16, borderBottomWidth: 1.5, borderColor: Colors.line },
  b: { fontFamily: Font.body900, fontSize: 15.5, lineHeight: 22 },
  s: { marginTop: 3, fontFamily: Font.body700, fontSize: 12.5, lineHeight: 18 },
  more: { alignItems: 'center', paddingVertical: 4 },
  card: { borderRadius: 18, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, paddingHorizontal: 14 },
  sRow: { flexDirection: 'row', gap: 12, paddingVertical: 11 },
  sRowLine: { borderBottomWidth: 1.5, borderColor: Colors.line },
  sLabel: { width: 88, fontFamily: Font.body800, fontSize: 13, lineHeight: 20 },
  sValue: { flex: 1, fontFamily: Font.body800, fontSize: 14, lineHeight: 20 },
  hint: { marginTop: 12, fontFamily: Font.body600, fontSize: 12.5, lineHeight: 19 },
});
