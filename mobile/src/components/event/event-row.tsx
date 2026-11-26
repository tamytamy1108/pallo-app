import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Pressable } from '@/components/ui/pressable';
import { Poster, posterSlides } from '@/components/meet/poster';
import { useMeetStore } from '@/components/meet/meet-store';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import type { EventItem } from '@/data/events';
import { dday, isPast, monthDay, won } from '@/data/meet';

import { feeText } from './event-model';

/**
 * 이벤트 한 줄 = 초대장 (프로토타입 lgEvRow · .lg-evr): 왼쪽 포스터 썸네일 96px + 종류 · 지점 · D-day,
 * 제목(2줄), 날짜 · 장소, 금액(할인 전 금액 취소선), 남은 자리. 지난 이벤트는 흐리게.
 */
/** onOpen: 시트 안 등에서 열 때 (안 주면 바로 상세로) · feeLabel: 금액 대신 보일 글 (번개 '각자 계산') */
export function EventRow({ e, onOpen, feeLabel }: { e: EventItem; onOpen?: () => void; feeLabel?: string }) {
  const joined = useMeetStore((s) => !!s.joined[e.id]);
  const cur = e.cur + (joined ? 1 : 0);
  const left = e.max - cur;
  const past = isPast(e);
  return (
    <Pressable onPress={onOpen ?? (() => router.push(`/events/${e.id}`))} accessibilityRole="button" accessibilityLabel={`${e.title} 자세히 보기`} style={({ pressed }) => [styles.row, past && styles.past, pressed && { transform: [{ scale: 0.98 }] }]}>
      <View style={styles.th}>
        {/* 270px 포스터를 0.3556배로 줄여요 (프로토타입 .lg-evr .th .lg-pst) */}
        <View style={styles.thIn}>
          <Poster id={e.id} slide={posterSlides(e.id, false, e.posters, e.card)[0]} height={270} />
        </View>
      </View>
      <View style={styles.tx}>
        <View style={styles.k}>
          <PText numberOfLines={1} style={styles.kT}>
            {e.kind} · {e.br || '전 지점'}
          </PText>
          <View style={styles.sp} />
          <PText style={styles.dd}>{past ? '끝남' : dday(e)}</PText>
        </View>
        <PText numberOfLines={2} style={styles.t}>
          {e.title}
        </PText>
        <PText numberOfLines={1} style={styles.m}>
          {monthDay(e)} {e.wd} · {e.place}
        </PText>
        <View style={styles.sp} />
        <View style={styles.f}>
          <PText style={feeLabel ? styles.feeLabel : styles.fee}>{feeLabel ?? feeText(e)}</PText>
          {!feeLabel && e.fee0 ? <PText numberOfLines={1} style={styles.fee0}>{won(e.fee0)}</PText> : null}
          <View style={styles.sp} />
          <PText numberOfLines={1} style={styles.left}>{past ? `${cur}명 참여` : e.mine ? '내가 주최' : joined ? '참여 완료' : e.noCap ? '인원 무관' : left <= 0 ? '마감' : `${left}자리 남음`}</PText>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, padding: 10, borderWidth: 2, borderColor: Colors.ink, borderRadius: 18, backgroundColor: Colors.white, minHeight: 120 },
  past: { opacity: 0.6 },
  th: { width: 96, height: 96, borderWidth: 2, borderColor: Colors.ink, borderRadius: 14, overflow: 'hidden' },
  thIn: { position: 'absolute', left: 0, top: 0, width: 270, height: 270, transform: [{ scale: 0.3556 }], transformOrigin: 'left top' },
  tx: { flex: 1, minWidth: 0, gap: 2 },
  k: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  kT: { flexShrink: 1, fontFamily: Font.body900, fontSize: 11.5, lineHeight: 16, color: Colors.purple },
  dd: { fontFamily: Font.body900, fontSize: 11.5, lineHeight: 16, color: '#D2477A' },
  sp: { flex: 1 },
  t: { fontFamily: Font.body900, fontSize: 15, lineHeight: 19.5 },
  m: { fontFamily: Font.body700, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  f: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  fee: { fontFamily: Font.display, fontSize: 15, lineHeight: 21 },
  feeLabel: { fontFamily: Font.body800, fontSize: 12.5, lineHeight: 21, color: Colors.inkSub },
  fee0: { flexShrink: 1, fontFamily: Font.body700, fontSize: 11.5, lineHeight: 16, color: '#A39C8E', textDecorationLine: 'line-through' },
  left: { flexShrink: 0, fontFamily: Font.body900, fontSize: 11.5, lineHeight: 16, color: Colors.inkSub },
});
