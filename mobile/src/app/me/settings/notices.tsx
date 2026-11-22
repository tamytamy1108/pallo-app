import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AccountPage, Icon } from '@/components/account/parts';
import { markNoticeRead, useNoticeRead } from '@/components/account/store';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { NOTICES } from '@/data/mock';
import { sfx } from '@/lib/feedback';

/**
 * 설정 › 공지사항 목록 (프로토타입 noticeHTML): 고정 · 태그 · 제목(안 읽음 분홍 점) · 날짜 · 쓴 곳 → 공지 상세(/notice/[id]).
 * 공지 데이터는 홈 담당 NOTICES 를 그대로 읽어요 (맨 위 = 본사 고정 공지). 맞는 API: 12 `/notices`
 */
export default function NoticesScreen() {
  const read = useNoticeRead();
  return (
    <AccountPage title="공지사항" bodyStyle={styles.body}>
      {NOTICES.map((n, i) => (
        <Pressable
          key={n.id}
          onPress={() => {
            sfx('tap');
            markNoticeRead(n.id);
            router.push({ pathname: '/notice/[id]', params: { id: n.id } });
          }}
          accessibilityRole="button"
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
          <View style={styles.tg}>
            {i === 0 ? <Icon name="tack" size={13} color={Colors.purple} /> : null}
            <PText style={styles.tgText}>{i === 0 ? '고정' : n.tag}</PText>
          </View>
          <View style={styles.titleRow}>
            <PText style={styles.b}>{n.title}</PText>
            {read[n.id] ? null : <View style={styles.dot} accessibilityLabel="새 글" />}
          </View>
          <PText style={styles.s}>{`${n.date} · ${n.author}`}</PText>
        </Pressable>
      ))}
    </AccountPage>
  );
}

const styles = StyleSheet.create({
  body: { paddingTop: 4 },
  pressed: { opacity: 0.7 },
  row: { gap: 3, paddingVertical: 16, borderBottomWidth: 1.5, borderColor: Colors.line },
  tg: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tgText: { fontFamily: Font.body900, fontSize: 12.5, lineHeight: 18, color: Colors.purple },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  b: { flexShrink: 1, fontFamily: Font.body900, fontSize: 15.5, lineHeight: 22 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.rosePink },
  s: { fontFamily: Font.body700, fontSize: 12.5, lineHeight: 18, color: Colors.inkSub },
});
