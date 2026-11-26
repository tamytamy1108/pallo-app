import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import { LgLink, SecHead } from '@/components/meet/parts';
import type { Proposal } from '@/components/meet/meet-store';
import { apiErrorMessage } from '@/api/errors';
import type { EventProposal } from '@/api/event-proposals';
import { useCancelEventProposal, useMyEventProposals } from '@/api/use-event-proposals';
import { ConfirmDialog } from '@/components/ui/dialog';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { ColorCard } from '@/components/ui/card-maker';
import { withJeom } from '@/components/onboarding/branch-list';
import { cardWords, type CardDesign } from '@/data/poster-colors';
import { WEEK, won } from '@/data/meet';
import { FieldLabel, keepAll, SheetButton } from '@/components/common/sheet-parts';
import { SumCard } from '@/components/meet/detail/sheets';
import { Pressable } from '@/components/ui/pressable';
import { Sheet } from '@/components/ui/sheet';

/** 서버 제안 → 카드 모양 (지점 · 분류는 서버가 붙인 이름, 대표 사진 = 0번) */
export function toProposal(r: EventProposal): Proposal {
  return {
    id: r.id,
    title: r.title,
    br: r.branchName,
    date: r.date,
    cat: r.categoryLabel,
    cover: r.photos[0],
    card: r.card ? { color: r.card.color, words: r.card.words, design: (r.card.design ?? undefined) as CardDesign | undefined } : undefined,
    cap: r.expectedAttendees ?? 0,
    time: [r.startTime, r.endTime],
    body: r.description,
    fee: r.fee,
    status: r.status,
    rejectionReason: r.rejectionReason,
    sentAt: r.createdAt,
  };
}

/** 상태 한 줄 (카드 아래 · 시트 상태 칸) */
const STATUS_TEXT: Record<NonNullable<Proposal['status']>, string> = {
  PENDING: '매니저 검토 중',
  APPROVED: '확정됐어요',
  REJECTED: '이번엔 어려워요',
  CANCELED: '취소했어요',
};
const statusOf = (q: Proposal) => q.status ?? 'PENDING';

/** 내가 제안한 이벤트 (보낸 제안이 있을 때만, 프로토타입 lgPropCards · .lg-prop) — 서버 GET /event-proposals (취소한 건 빼고) */
export function ProposalCards() {
  const list = useMyEventProposals();
  const cancel = useCancelEventProposal();
  const props = (list.data ?? []).map(toProposal);
  // 누른 제안 (시트가 내려가는 동안에도 내용이 남게 따로 둬요)
  const [openId, setOpenId] = useState<string | null>(null);
  const [shown, setShown] = useState<Proposal | null>(null);
  // 취소 확인 — 서버에서 바로 취소돼 되돌릴 수 없어서 한 번 물어요
  const [canceling, setCanceling] = useState<Proposal | null>(null);
  if (!props.length && !shown) return null;
  return (
    <View style={styles.wrap}>
      {props.length ? <SecHead title="내가 제안한 이벤트" sub={`${props.length}개`} style={{ marginBottom: 2 }} /> : null}
      {props.map((q) => (
        <ProposalCard
          key={q.id}
          q={q}
          onOpen={() => {
            setShown(q);
            setOpenId(q.id);
          }}
          onCancel={statusOf(q) === 'PENDING' ? () => setCanceling(q) : undefined}
        />
      ))}
      {shown ? <ProposalSheet q={shown} open={openId === shown.id && props.some((p) => p.id === shown.id)} onClose={() => setOpenId(null)} onClosed={() => setShown(null)} /> : null}
      <ConfirmDialog
        open={!!canceling}
        title="제안을 취소할까요?"
        message={canceling ? `'${canceling.title}' 제안을 거둬요. 취소하면 되돌릴 수 없어요.` : undefined}
        confirmLabel="제안 취소"
        cancelLabel="그대로 두기"
        destructive
        onCancel={() => setCanceling(null)}
        onConfirm={() => {
          const target = canceling;
          setCanceling(null);
          if (!target) return;
          cancel.mutate(target.id, {
            onSuccess: () => showToast('제안을 취소했어요'),
            onError: (e) => showToast(apiErrorMessage(e)),
          });
        }}
      />
    </View>
  );
}

/** '11월 13일 (일)' */
const dayLabel = (d: Date) => `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEK[d.getDay()]})`;
/** 희망 날짜 · 시간 ('12월 13일 (일) 14:00~17:00') */
function whenText(q: Proposal) {
  if (!q.date) return '날짜 고르기 전';
  const hm = q.time ? ` ${q.time[0]}~${q.time[1]}` : '';
  return dayLabel(new Date(q.date + 'T00:00')) + hm;
}
/** 보낸 날 (서버 createdAt). 미리보기처럼 없으면 null */
function sentAt(q: Proposal) {
  return q.sentAt ? new Date(q.sentAt) : null;
}

/** 상태 아래 안내 */
function statusNote(q: Proposal) {
  switch (statusOf(q)) {
    case 'APPROVED':
      return '매니저가 확정했어요. 확정된 날짜 · 시간 · 장소로 이벤트 탭에 올라가요.';
    case 'REJECTED':
      return q.rejectionReason ? `매니저 메모 · ${q.rejectionReason}` : '이번에는 열기 어려워요. 다른 날짜나 내용으로 다시 제안해 주세요.';
    default:
      return '지점 매니저가 확인하고 2~3일 안에 문자로 연락드려요. 확정되면 이벤트 탭에 올라가요.';
  }
}

/** 내가 보낸 제안 보기 (읽기만) — 적어 보낸 칸 전부 · 보낸 날 · 지금 상태 */
function ProposalSheet({ q, open, onClose, onClosed }: { q: Proposal; open: boolean; onClose: () => void; onClosed: () => void }) {
  const sent = sentAt(q);
  return (
    <Sheet open={open} onClose={onClose} onClosed={onClosed} label="내가 제안한 이벤트" footer={<SheetButton label="닫기" tone="white" size="foot" onPress={onClose} />}>
      <PText style={styles.dk}>내가 제안한 이벤트 · {STATUS_TEXT[statusOf(q)]}</PText>
      <View style={styles.head}>
        <Cover q={q} size={72} />
        <PText variant="title" style={styles.headT}>
          {q.title}
        </PText>
      </View>
      <SumCard
        rows={[
          ['pin', `진행 지점 · ${withJeom(q.br)}`],
          ['cal', `희망 날짜 · ${whenText(q)}`],
          ['grid', `분류 · ${q.cat}`],
          ['users', `예상 인원 · ${q.cap ? `${q.cap}명` : '무관'}`],
          ['save', `1인 참가비 · ${q.fee ? won(q.fee) : '무료'}`],
        ]}
      />
      {q.body ? (
        <View style={styles.sec}>
          <FieldLabel>어떤 이벤트인지</FieldLabel>
          <View style={styles.bodyBox}>
            <PText style={[styles.bodyT, keepAll]}>{q.body}</PText>
          </View>
        </View>
      ) : null}
      <View style={styles.sec}>
        <FieldLabel>진행 상황</FieldLabel>
        <View style={styles.status}>
          {sent ? (
            <View style={styles.stRow}>
              <PText style={styles.stK}>보낸 날</PText>
              <PText style={styles.stV}>{dayLabel(sent)}</PText>
            </View>
          ) : null}
          <View style={styles.stRow}>
            <PText style={styles.stK}>상태</PText>
            <PText style={[styles.stV, { color: statusOf(q) === 'REJECTED' ? Colors.inkSub : Colors.purple }]}>{STATUS_TEXT[statusOf(q)]}</PText>
          </View>
          <PText style={[styles.stNote, keepAll]}>{statusNote(q)}</PText>
        </View>
      </View>
    </Sheet>
  );
}

/** 대표 그림: 만든 카드 · 사진 · 없으면 연보라 칸 */
function Cover({ q, size }: { q: Proposal; size: number }) {
  const box = [styles.th, { width: size, height: size }];
  if (q.card) return <ColorCard design={q.card.design ?? 'circle'} color={q.card.color} words={cardWords(q.card.words, ['NEW', 'EVENT'])} size={(12 * size) / 58} width={size} center style={box} />;
  if (q.cover) return <Image source={{ uri: q.cover }} style={box} contentFit="cover" />;
  return <View style={[box, { backgroundColor: Colors.lavender }]} />;
}

/**
 * 제안 한 장 — 제안하기 화면의 '이렇게 보여요' 미리보기도 이걸 써요 (date 가 비면 '날짜 고르기 전').
 * onOpen 을 주면 카드를 눌러 내가 보낸 내용을 볼 수 있어요 (이벤트 탭)
 */
export function ProposalCard({ q, onOpen, onCancel }: { q: Proposal; onOpen?: () => void; /** 주면 옆에 '취소' (대기 중일 때만) */ onCancel?: () => void }) {
  const d = new Date(q.date + 'T00:00');
  const hm = q.time ? ` ${q.time[0]}~${q.time[1] === '24:00' ? '24:00' : q.time[1]}` : '';
  const when = q.date ? `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEK[d.getDay()]})${hm} 희망` : '날짜 고르기 전';
  const body = (
    <>
      <Cover q={q} size={58} />
      <View style={styles.tx}>
        <PText numberOfLines={1} style={styles.t}>
          {q.title}
        </PText>
        <PText numberOfLines={1} style={styles.s}>
          {withJeom(q.br)} · {when} · {q.cat}
        </PText>
        <PText style={[styles.st, statusOf(q) === 'REJECTED' && { color: Colors.inkSub }]}>
          {statusOf(q) === 'PENDING' ? '매니저 검토 중 · 2~3일 안에 문자로 연락드려요' : statusOf(q) === 'APPROVED' ? '확정됐어요 · 이벤트 탭에 올라가요' : '이번엔 어려워요 · 눌러서 매니저 메모 보기'}
        </PText>
      </View>
    </>
  );
  // 카드 몸통만 누르는 칸이고 '취소'는 그 옆 따로예요 (버튼 안에 버튼을 두지 않게)
  return (
    <View style={styles.card}>
      {onOpen ? (
        <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel={`${q.title} 제안 내용 보기`} style={({ pressed }) => [styles.main, pressed && styles.cardPressed]}>
          {body}
        </Pressable>
      ) : (
        <View style={styles.main}>{body}</View>
      )}
      {onCancel ? <LgLink color={Colors.inkSub} size={12.5} label="취소" onPress={onCancel} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingLeft: 10, paddingRight: 12, borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.purple, borderRadius: 18, backgroundColor: '#FBF9FF' },
  th: { width: 58, height: 58, borderRadius: 12, borderWidth: 2, borderColor: Colors.ink },
  main: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 12 },
  tx: { flex: 1, minWidth: 0, gap: 2 },
  t: { fontFamily: Font.body900, fontSize: 14.5, lineHeight: 20 },
  s: { fontFamily: Font.body700, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  st: { fontFamily: Font.body900, fontSize: 12, lineHeight: 17, color: Colors.purple },
  cardPressed: { opacity: 0.7 },
  // 시트 (정기 모임 상세 시트와 같은 글자 단계)
  dk: { fontFamily: Font.body900, fontSize: 12.5, lineHeight: 18, color: Colors.purple, marginBottom: -4 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headT: { flex: 1, minWidth: 0 },
  sec: { gap: 6 },
  bodyBox: { borderWidth: 1.5, borderColor: Colors.line, borderRadius: 16, backgroundColor: Colors.white, paddingHorizontal: 14, paddingVertical: 12 },
  bodyT: { fontFamily: Font.body600, fontSize: 14, lineHeight: 22 },
  status: { borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.purple, borderRadius: 16, backgroundColor: '#FBF9FF', paddingHorizontal: 14, paddingVertical: 12, gap: 6 },
  stRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stK: { width: 48, fontFamily: Font.body800, fontSize: 12.5, lineHeight: 18, color: Colors.inkSub },
  stV: { flex: 1, fontFamily: Font.body900, fontSize: 13.5, lineHeight: 19 },
  stNote: { marginTop: 2, fontFamily: Font.body700, fontSize: 12, lineHeight: 18, color: Colors.inkSub },
});
