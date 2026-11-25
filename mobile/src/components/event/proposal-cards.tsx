import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import { LgLink, SecHead } from '@/components/meet/parts';
import { addProposal, removeProposal, useMeetStore, type Proposal } from '@/components/meet/meet-store';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { ColorCard } from '@/components/ui/card-maker';
import { withJeom } from '@/components/onboarding/branch-sheet';
import { cardWords } from '@/data/poster-colors';
import { WEEK } from '@/data/meet';

/** 내가 제안한 이벤트 (보낸 제안이 있을 때만, 프로토타입 lgPropCards · .lg-prop) */
export function ProposalCards() {
  const props = useMeetStore((s) => s.props);
  if (!props.length) return null;
  return (
    <View style={styles.wrap}>
      <SecHead title="내가 제안한 이벤트" sub={`${props.length}개`} style={{ marginBottom: 2 }} />
      {props.map((q) => (
        <ProposalCard key={q.id} q={q} />
      ))}
    </View>
  );
}

/** 제안 한 장 — 제안하기 화면의 '이렇게 보여요' 미리보기도 이걸 써요 (date 가 비면 '날짜 고르기 전') */
export function ProposalCard({ q }: { q: Proposal }) {
  const d = new Date(q.date + 'T00:00');
  const hm = q.time ? ` ${q.time[0]}~${q.time[1] === '24:00' ? '24:00' : q.time[1]}` : '';
  const when = q.date ? `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEK[d.getDay()]})${hm} 희망` : '날짜 고르기 전';
  return (
    <View style={styles.card}>
      {q.card ? <ColorCard color={q.card.color} words={cardWords(q.card.words, ['NEW', 'EVENT'])} size={12} width={58} center style={styles.th} /> : q.cover ? <Image source={{ uri: q.cover }} style={styles.th} contentFit="cover" /> : <View style={[styles.th, { backgroundColor: Colors.lavender }]} />}
      <View style={styles.tx}>
        <PText numberOfLines={1} style={styles.t}>
          {q.title}
        </PText>
        <PText numberOfLines={1} style={styles.s}>
          {withJeom(q.br)} · {when} · {q.cat}
        </PText>
        <PText style={styles.st}>매니저 검토 중 · 2~3일 안에 문자로 연락드려요</PText>
      </View>
      <LgLink
        color={Colors.inkSub}
        size={12.5}
        label="취소"
        onPress={() => {
          // 한 번 누르면 바로 지워져서, 잘못 눌렀을 때 되돌릴 수 있게 해요
          removeProposal(q.id);
          showToast('제안을 취소했어요', { label: '되돌리기', onPress: () => addProposal(q) });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingLeft: 10, paddingRight: 12, borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.purple, borderRadius: 18, backgroundColor: '#FBF9FF' },
  th: { width: 58, height: 58, borderRadius: 12, borderWidth: 2, borderColor: Colors.ink },
  tx: { flex: 1, minWidth: 0, gap: 2 },
  t: { fontFamily: Font.body900, fontSize: 14.5, lineHeight: 20 },
  s: { fontFamily: Font.body700, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  st: { fontFamily: Font.body900, fontSize: 12, lineHeight: 17, color: Colors.purple },
});
