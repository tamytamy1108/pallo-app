import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import { apiConfig } from '@/api/config';
import { FieldLabel, keepAll, SheetButton, SheetButtons, SheetNote } from '@/components/common/sheet-parts';
import { SumCard } from '@/components/meet/detail/sheets';
import { decideMyClub, removeMyClub, resubmitMyClub, useMeetStore } from '@/components/meet/meet-store';
import { LgLink, SecHead } from '@/components/meet/parts';
import { withJeom } from '@/components/onboarding/branch-sheet';
import { ColorCard } from '@/components/ui/card-maker';
import { Pressable } from '@/components/ui/pressable';
import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { NO_LIMIT, WEEK, type Club } from '@/data/meet';
import { cardWords } from '@/data/poster-colors';
import { CLUB_RULE } from '@/data/host-rules';

/** 거절 (필수 표시 * 와 같은 빨강) */
const RED = '#E5484D';

/**
 * 내가 신청한 동아리 (이벤트 탭 '내가 제안한 이벤트'와 같은 모양).
 * 동아리 만들기 → 관리자 검토 중 → 승인(호스트가 돼요) 또는 거절(이유가 보여요 · 다시 신청 · 지우기).
 * 승인된 동아리는 여기서 빠지고 목록 · 내 모임에 보여요.
 * 맞는 API: `GET /me/club-applications` (A31) · 관리자 64 `/admin/clubs/:id/approve` · `/reject`
 */
export function ClubApplyCards() {
  const mine = useMeetStore((s) => s.myClubs);
  const L = mine.filter((c) => c.wait || c.rejected);
  const [openId, setOpenId] = useState<string | null>(null);
  const [shown, setShown] = useState<Club | null>(null);
  // 시트가 내려가는 동안에도 내용이 남게 · 결정이 바뀌면 최신 모양으로
  const cur = shown ? mine.find((c) => c.id === shown.id) ?? shown : null;
  if (!L.length && !cur) return null;
  return (
    <View style={styles.wrap}>
      {L.length ? <SecHead title="내가 신청한 동아리" sub={`${L.length}개`} style={{ marginBottom: 2 }} /> : null}
      {L.map((c) => (
        <ApplyCard
          key={c.id}
          c={c}
          onOpen={() => {
            setShown(c);
            setOpenId(c.id);
          }}
        />
      ))}
      {cur ? <ClubApplySheet c={cur} open={openId === cur.id} onClose={() => setOpenId(null)} onClosed={() => setShown(null)} /> : null}
    </View>
  );
}

/** 상태 한 줄 */
export const applyLine = (c: Club) => (c.rejected ? `거절됐어요 · ${c.rejected.reason}` : c.closed ? '닫힌 동아리예요' : `관리자 검토 중 · ${CLUB_RULE.reviewDays} 안에 알려 드려요`);

function ApplyCard({ c, onOpen }: { c: Club; onOpen: () => void }) {
  const bad = !!c.rejected;
  return (
    <View style={[styles.card, bad && styles.cardBad]}>
      <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel={`${c.name} 신청 내용 보기`} style={({ pressed }) => [styles.main, pressed && { opacity: 0.7 }]}>
        <Cover c={c} size={58} />
        <View style={styles.tx}>
          <PText numberOfLines={1} style={styles.t}>
            {c.name}
          </PText>
          <PText numberOfLines={1} style={styles.s}>
            {withJeom(c.br)} · {c.when}
          </PText>
          <PText numberOfLines={2} style={[styles.st, bad && { color: RED }]}>
            {applyLine(c)}
          </PText>
        </View>
      </Pressable>
      {bad ? null : (
        <LgLink
          color={Colors.inkSub}
          size={12.5}
          label="취소"
          onPress={() => {
            removeMyClub(c.id);
            showToast('동아리 신청을 취소했어요');
          }}
        />
      )}
    </View>
  );
}

/** '11월 13일 (일)' */
const dayLabel = (ms: number) => {
  const d = new Date(ms);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEK[d.getDay()]})`;
};

/** 신청 내용 보기 (읽기만) — 적어 보낸 칸 · 보낸 날 · 지금 상태 · 거절 이유. 동아리 화면의 '승인 대기' · '거절됨' 버튼도 이걸 열어요 */
export function ClubApplySheet({ c, open, onClose, onClosed }: { c: Club; open: boolean; onClose: () => void; onClosed?: () => void }) {
  const wait = !!c.wait;
  const bad = !!c.rejected;
  const foot = bad ? (
    <SheetButtons>
      <SheetButton
        label="지우기"
        tone="white"
        style={styles.flex}
        onPress={() => {
          onClose();
          removeMyClub(c.id);
          showToast('신청을 지웠어요');
        }}
      />
      <SheetButton
        label="다시 신청하기"
        style={styles.flex}
        onPress={() => {
          resubmitMyClub(c.id);
          showToast('다시 신청했어요 · 관리자가 확인하면 알려 드려요');
        }}
      />
    </SheetButtons>
  ) : (
    <SheetButton label="닫기" tone="white" size="foot" onPress={onClose} />
  );
  return (
    <Sheet open={open} onClose={onClose} onClosed={onClosed} label="내가 신청한 동아리" footer={foot}>
      <PText style={[styles.dk, bad && { color: RED }]}>내가 신청한 동아리 · {bad ? '거절됨' : wait ? '관리자 검토 중' : '승인됨'}</PText>
      <View style={styles.head}>
        <Cover c={c} size={72} />
        <PText variant="title" style={styles.headT}>
          {c.name}
        </PText>
      </View>
      <SumCard
        rows={[
          ['pin', `지점 · ${withJeom(c.br)}${c.reg ? ' · ' + c.reg : ''}`],
          ['cal', `모이는 때 · ${c.when}`],
          ['grid', `언어 · ${c.lang}`],
          ['users', `최대 인원 · ${c.max === NO_LIMIT ? '무관' : `${c.max}명`}`],
          ['check', `가입 조건 · ${c.cond}`],
        ]}
      />
      {c.intro ? (
        <View style={styles.sec}>
          <FieldLabel>소개</FieldLabel>
          <View style={styles.bodyBox}>
            <PText style={[styles.bodyT, keepAll]}>{c.intro}</PText>
          </View>
        </View>
      ) : null}
      <View style={styles.sec}>
        <FieldLabel>진행 상황</FieldLabel>
        <View style={[styles.status, bad && styles.statusBad]}>
          {c.at ? <Row k="보낸 날" v={dayLabel(c.at)} /> : null}
          <Row k="상태" v={bad ? '거절됐어요' : wait ? '관리자 검토 중' : '승인됐어요 · 내가 호스트예요'} color={bad ? RED : Colors.purple} />
          {bad ? <Row k="이유" v={c.rejected!.reason} /> : null}
          <PText style={[styles.stNote, keepAll]}>
            {bad
              ? '이유를 확인하고 다시 신청할 수 있어요. 내용을 고치려면 지우고 새로 만들어 주세요.'
              : wait
                ? `관리자가 확인하고 ${CLUB_RULE.reviewDays} 안에 알림으로 알려 드려요. 승인되면 지도에 보이고, 나는 이 동아리의 호스트가 돼요.`
                : '이 동아리의 호스트예요. 관리에서 코호스트를 정할 수 있어요.'}
          </PText>
        </View>
      </View>
      {apiConfig.useMock && wait ? (
        // 가짜 서버로 볼 때만: 관리자 결정을 미리 해 봐요 (진짜 서버면 관리자 웹에서 정해요)
        <View style={styles.sec}>
          <SheetNote>가짜 서버 시험용 · 관리자 결정 미리 보기</SheetNote>
          <SheetButtons>
            <SheetButton
              label="거절해 보기"
              tone="white"
              size="pair"
              style={styles.flex}
              onPress={() => {
                decideMyClub(c.id, false, '같은 지점에 비슷한 동아리가 이미 있어요');
                showToast('동아리 신청이 거절됐어요 · 이유를 확인해 주세요');
              }}
            />
            <SheetButton
              label="승인해 보기"
              tone="purple"
              size="pair"
              style={styles.flex}
              onPress={() => {
                decideMyClub(c.id, true);
                onClose();
                showToast(`${c.name} 동아리가 승인됐어요 · 이제 호스트예요`);
              }}
            />
          </SheetButtons>
        </View>
      ) : null}
    </Sheet>
  );
}

function Row({ k, v, color }: { k: string; v: string; color?: string }) {
  return (
    <View style={styles.stRow}>
      <PText style={styles.stK}>{k}</PText>
      <PText style={[styles.stV, color ? { color } : null, keepAll]}>{v}</PText>
    </View>
  );
}

/** 대표 그림: 사진 · 만든 카드 · 없으면 연보라 칸 */
function Cover({ c, size }: { c: Club; size: number }) {
  const box = [styles.th, { width: size, height: size }];
  if (c.posters?.[0]) return <Image source={{ uri: c.posters[0] }} style={box} contentFit="cover" />;
  if (c.card) return <ColorCard design={c.card.design ?? 'circle'} color={c.card.color} words={cardWords(c.card.words, ['NEW', 'CLUB'])} size={(12 * size) / 58} width={size} center style={box} />;
  return <View style={[box, { backgroundColor: Colors.lavender }]} />;
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  flex: { flex: 1 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingLeft: 10, paddingRight: 12, borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.purple, borderRadius: 18, backgroundColor: '#FBF9FF' },
  cardBad: { borderColor: RED, backgroundColor: '#FFF6F5' },
  main: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 12 },
  th: { width: 58, height: 58, borderRadius: 12, borderWidth: 2, borderColor: Colors.ink },
  tx: { flex: 1, minWidth: 0, gap: 2 },
  t: { fontFamily: Font.body900, fontSize: 14.5, lineHeight: 20 },
  s: { fontFamily: Font.body700, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  st: { fontFamily: Font.body900, fontSize: 12, lineHeight: 17, color: Colors.purple },
  dk: { fontFamily: Font.body900, fontSize: 12.5, lineHeight: 18, color: Colors.purple, marginBottom: -4 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headT: { flex: 1, minWidth: 0 },
  sec: { gap: 6 },
  bodyBox: { borderWidth: 1.5, borderColor: Colors.line, borderRadius: 16, backgroundColor: Colors.white, paddingHorizontal: 14, paddingVertical: 12 },
  bodyT: { fontFamily: Font.body600, fontSize: 14, lineHeight: 22 },
  status: { borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.purple, borderRadius: 16, backgroundColor: '#FBF9FF', paddingHorizontal: 14, paddingVertical: 12, gap: 6 },
  statusBad: { borderColor: RED, backgroundColor: '#FFF6F5' },
  stRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  stK: { width: 48, fontFamily: Font.body800, fontSize: 12.5, lineHeight: 19, color: Colors.inkSub },
  stV: { flex: 1, fontFamily: Font.body900, fontSize: 13.5, lineHeight: 19 },
  stNote: { marginTop: 2, fontFamily: Font.body700, fontSize: 12, lineHeight: 18, color: Colors.inkSub },
});
