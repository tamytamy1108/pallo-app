import { StyleSheet, View } from 'react-native';

import { useChangeHistory, type ChangeHistoryItem } from '@/api/change-requests';
import { apiErrorMessage } from '@/api/errors';
import { useMyPage } from '@/api/use-my-page';
import { MyStudyCard } from '@/components/account/my-study-card';
import { AccountPage, Box } from '@/components/account/parts';
import { RequestSummary } from '@/components/account/request-summary';
import { MemberOnly } from '@/components/common/member-lock';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state-view';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';

/**
 * 내 스터디 (마이 › 내 스터디 '전체 보기' · 알림 · 홈에서 바로 여는 주소).
 * 위 = 마이와 같은 카드 (확인 중인 신청 + [신청 취소]), 아래 = 지난 연기 · 팀 · 지점 변경 신청 (승인 · 반려 · 취소).
 * 값은 마이 BFF(GET /me/mypage study) · 지난 신청(제안 GET /me/change-requests/history — 지금은 예시) — 이용 중인 멤버십이 없으면 빈 상태.
 */
function MyStudyScreen() {
  const page = useMyPage();
  return (
    <AccountPage title="내 스터디" bodyStyle={styles.body}>
      {page.isPending ? (
        <LoadingState />
      ) : page.isError ? (
        <ErrorState message={apiErrorMessage(page.error)} onRetry={() => page.refetch()} />
      ) : page.data.study ? (
        <>
          <MyStudyCard study={page.data.study} title={false} />
          <History />
        </>
      ) : (
        <EmptyState title="이용 중인 이용권이 없어요" />
      )}
    </AccountPage>
  );
}

/** 지난 신청 — 최근 순 · 칸마다 종류 · 상태 · 신청한 날 + 신청 글(지금 · 바뀌면) · 반려면 사유 */
function History() {
  const q = useChangeHistory();
  return (
    <View style={styles.hist}>
      <PText style={styles.histTitle} accessibilityRole="header">
        지난 신청
      </PText>
      {q.isPending ? (
        <LoadingState />
      ) : q.isError ? (
        <ErrorState message={apiErrorMessage(q.error)} onRetry={() => q.refetch()} />
      ) : q.data.length === 0 ? (
        <PText style={styles.empty}>아직 신청한 연기 · 변경이 없어요</PText>
      ) : (
        q.data.map((h) => <HistoryRow key={h.id} h={h} />)
      )}
    </View>
  );
}

const STATUS: Record<ChangeHistoryItem['status'], { text: string; color: string; bg: string }> = {
  approved: { text: '승인됐어요', color: Colors.rateHigh, bg: '#E6F4EC' },
  rejected: { text: '반려됐어요', color: Colors.rateLow, bg: '#FBE9E9' },
  canceled: { text: '취소했어요', color: Colors.inkSub, bg: Colors.cream },
};

/** 'YYYY-MM-DD' → '9/18 신청' */
const askedOn = (iso: string) => {
  const [, m, d] = iso.split('-').map(Number);
  return `${m}/${d} 신청`;
};

function HistoryRow({ h }: { h: ChangeHistoryItem }) {
  const st = STATUS[h.status];
  return (
    <Box style={styles.row}>
      <View style={styles.rowHead}>
        <PText style={styles.kind}>{h.label}</PText>
        <View style={[styles.chip, { backgroundColor: st.bg }]}>
          <PText style={[styles.chipT, { color: st.color }]}>{st.text}</PText>
        </View>
        <View style={styles.sp} />
        <PText style={styles.date}>{askedOn(h.requestedAt)}</PText>
      </View>
      <RequestSummary txt={h.txt} />
      {h.status === 'rejected' && h.reason ? (
        <View style={styles.reason}>
          <PText style={styles.reasonK}>반려 사유</PText>
          <PText style={styles.reasonT}>{h.reason}</PText>
        </View>
      ) : null}
    </Box>
  );
}

const styles = StyleSheet.create({
  body: { paddingTop: 16 },
  hist: { gap: 10, marginTop: 22 },
  histTitle: { marginHorizontal: 2, fontFamily: Font.display, fontSize: 17, lineHeight: 24 },
  empty: { marginHorizontal: 2, fontFamily: Font.body700, fontSize: 13, lineHeight: 19, color: Colors.inkSub },
  row: { paddingVertical: 14, paddingHorizontal: 16, gap: 10 },
  rowHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  kind: { fontFamily: Font.body900, fontSize: 15, lineHeight: 21 },
  chip: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 9 },
  chipT: { fontFamily: Font.body900, fontSize: 11.5, lineHeight: 16 },
  sp: { flex: 1 },
  date: { fontFamily: Font.body700, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  reason: { gap: 2, paddingTop: 10, borderTopWidth: 1.5, borderColor: Colors.line },
  reasonK: { fontFamily: Font.body900, fontSize: 12, lineHeight: 17, color: Colors.rateLow },
  reasonT: { fontFamily: Font.body700, fontSize: 13, lineHeight: 19, color: Colors.ink },
});

/** 회원 전용 화면 (state/access 'myStudy'): 비회원이 알림 · 주소로 바로 들어와도 '지점 회원이 되면 열려요' 칸만 보여요 */
export default function MyStudyScreenGate() {
  return (
    <MemberOnly feature="myStudy" title="내 스터디">
      <MyStudyScreen />
    </MemberOnly>
  );
}
