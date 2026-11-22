import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import { LgLink, SecHead } from '@/components/meet/parts';
import { removeProposal, useMeetStore } from '@/components/meet/meet-store';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { WEEK } from '@/data/meet';

/** 내가 제안한 이벤트 (보낸 제안이 있을 때만, 프로토타입 lgPropCards · .lg-prop) */
export function ProposalCards() {
  const props = useMeetStore((s) => s.props);
  if (!props.length) return null;
  return (
    <View style={styles.wrap}>
      <SecHead title="내가 제안한 이벤트" sub={`${props.length}개`} style={{ marginBottom: 2 }} />
      {props.map((q) => {
        const d = new Date(q.date + 'T00:00');
        return (
          <View key={q.id} style={styles.card}>
            {q.cover ? <Image source={{ uri: q.cover }} style={styles.th} contentFit="cover" /> : <View style={[styles.th, { backgroundColor: Colors.lavender }]} />}
            <View style={styles.tx}>
              <PText numberOfLines={1} style={styles.t}>
                {q.title}
              </PText>
              <PText numberOfLines={1} style={styles.s}>
                {q.br} · {d.getMonth() + 1}월 {d.getDate()}일 ({WEEK[d.getDay()]}) 희망 · {q.cat}
              </PText>
              <PText style={styles.st}>매니저 검토 중 · 2~3일 안에 문자로 연락드려요</PText>
            </View>
            <LgLink
              label="취소"
              onPress={() => {
                removeProposal(q.id);
                showToast('제안을 취소했어요');
              }}
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderWidth: 2, borderColor: Colors.ink, borderRadius: 18, backgroundColor: Colors.white },
  th: { width: 56, height: 56, borderRadius: 12, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.ink },
  tx: { flex: 1, minWidth: 0, gap: 2 },
  t: { fontFamily: Font.body900, fontSize: 15, lineHeight: 20 },
  s: { fontFamily: Font.body700, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  st: { fontFamily: Font.body900, fontSize: 12, lineHeight: 17, color: Colors.purple },
});
