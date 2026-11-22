import { router, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ICON_PATH, LineIcon } from '@/components/home/icons';
import { useNoticeRead } from '@/components/home/noti-state';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { NOTICES } from '@/data/mock';

/**
 * 공지사항 목록 (프로토타입 noticeHTML · .nc-row).
 * 고정 공지(압정) 맨 위 · 태그 · 제목 · 날짜 · 쓴 곳 · 새 글 점. 누르면 상세로.
 */
export default function NoticeListScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.top}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} accessibilityRole="button" accessibilityLabel="뒤로" style={styles.iconBtn}>
          <LineIcon d={ICON_PATH.back} size={22} />
        </Pressable>
        <PText style={styles.topTitle} accessibilityRole="header">
          공지사항
        </PText>
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        {NOTICES.map((n) => (
          <Row key={n.id} id={n.id} tag={n.tag} pinned={!!n.pinned} title={n.title} meta={`${n.date} · ${n.author}`} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ id, tag, pinned, title, meta }: { id: string; tag: string; pinned: boolean; title: string; meta: string }) {
  const read = useNoticeRead(id);
  return (
    <Pressable
      onPress={() => router.push(`/notice/${id}` as Href)}
      accessibilityRole="button"
      accessibilityLabel={`${pinned ? '고정 ' : ''}${tag} ${title}, ${meta}${read ? '' : ', 새 글'}`}
      style={({ pressed }) => StyleSheet.flatten([styles.row, pressed && styles.rowPressed])}>
      <View style={styles.tg}>
        {pinned && <LineIcon d={ICON_PATH.tack} size={13} color={Colors.purple} />}
        <PText style={styles.tgText} color={Colors.purple}>
          {pinned ? '고정' : tag}
        </PText>
      </View>
      <View style={styles.titleRow}>
        <PText style={styles.title}>{title}</PText>
        {!read && <View style={styles.dot} />}
      </View>
      <PText style={styles.meta} color={Colors.inkSub}>
        {meta}
      </PText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  top: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingTop: 2, paddingBottom: 8, borderBottomWidth: 1.5, borderColor: Colors.line },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontFamily: Font.body900, fontSize: 15, lineHeight: 20 },
  body: { paddingTop: 4, paddingHorizontal: 16, paddingBottom: 110 },
  row: { paddingVertical: 14, borderBottomWidth: 1.5, borderColor: Colors.line },
  rowPressed: { opacity: 0.7 },
  tg: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  tgText: { fontFamily: Font.body900, fontSize: 12, lineHeight: 17 },
  titleRow: { marginTop: 3, flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontFamily: Font.body900, fontSize: 15, lineHeight: 21, flexShrink: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.rosePink },
  meta: { marginTop: 3, fontFamily: Font.body700, fontSize: 12, lineHeight: 17 },
});
