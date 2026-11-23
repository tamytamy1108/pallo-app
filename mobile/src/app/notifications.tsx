import { router, type Href } from 'expo-router';
import { Stack } from 'expo-router/js-stack';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TOP_ICON, TopBar } from '@/components/ui/top-bar';
import { Pressable } from '@/components/ui/pressable';
import { SCREEN } from '@/lib/transitions';
import { ICON_PATH, LineIcon } from '@/components/home/icons';
import { MemberFace } from '@/components/home/member-face';
import { markAllNotiRead, markNotiRead, useNotiRead, useUnreadCount } from '@/components/home/noti-state';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { NOTI_TABS, NOTIS, type Noti, type NotiKind } from '@/data/home';
import { sfx } from '@/lib/feedback';

/**
 * 알림함 (프로토타입 notiHTML · .nt-tabs · .nt-row).
 * 최신 순 한 목록 · 안 읽은 알림은 노랑 바탕 + 분홍 점. 누르면 읽음이 되고 그 화면으로 가요.
 */
export default function NotificationsScreen() {
  const [tab, setTab] = useState<'all' | NotiKind>('all');
  const read = useNotiRead();
  const unread = useUnreadCount();
  const list = NOTIS.filter((n) => tab === 'all' || n.kind === tab);

  const open = (n: Noti) => {
    markNotiRead(n.id);
    sfx('tap');
    router.push(n.href as Href);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={SCREEN.push} />
      <TopBar
        title="알림"
        right={
          <>
        <Pressable
          onPress={() => {
            markAllNotiRead();
            showToast('모두 읽음으로 바꿨어요');
          }}
          disabled={!unread}
          accessibilityRole="button"
          accessibilityState={{ disabled: !unread }}
          style={StyleSheet.flatten([styles.link, !unread && styles.linkOff])}>
          <PText style={styles.linkText}>모두 읽음</PText>
        </Pressable>
        {/* 알림 설정: 설정 › 알림 칸으로 */}
        <Pressable onPress={() => router.push('/me/settings?section=noti' as Href)} accessibilityRole="button" accessibilityLabel="알림 설정" style={TOP_ICON}>
          <LineIcon d={ICON_PATH.grid} size={19} />
        </Pressable>
          </>
        }
      />

      <View style={styles.tabs} accessibilityRole="tablist">
        {NOTI_TABS.map((t) => {
          const on = t.key === tab;
          return (
            <Pressable key={t.key} onPress={() => setTab(t.key)} accessibilityRole="tab" accessibilityState={{ selected: on }} style={styles.tab}>
              <PText style={styles.tabText} color={on ? Colors.ink : Colors.inkSub}>
                {t.label}
              </PText>
              {on && <View style={styles.tabBar} />}
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {list.length ? (
          list.map((n) => <Row key={n.id} n={n} unread={!read[n.id]} onPress={() => open(n)} />)
        ) : (
          <PText style={styles.empty} color={Colors.inkSub}>
            아직 알림이 없어요.
          </PText>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ n, unread, onPress }: { n: Noti; unread: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${n.text}, ${n.time}${unread ? ', 안 읽음' : ''}`}
      style={({ pressed }) => StyleSheet.flatten([styles.row, unread && styles.rowNew, pressed && styles.rowPressed])}>
      {n.who ? (
        <MemberFace size={38} bg={n.who.bg} body={n.who.body} />
      ) : (
        <View style={styles.ic}>
          <LineIcon d={ICON_PATH[n.icon ?? 'tack']} size={18} />
        </View>
      )}
      <View style={styles.tx}>
        <PText style={styles.txB}>{n.text}</PText>
        <PText style={styles.txS} color={Colors.inkSub}>
          {n.time}
        </PText>
      </View>
      {unread && <View style={styles.dot} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  link: { paddingVertical: 6, paddingHorizontal: 2, minHeight: 44, justifyContent: 'center' },
  linkOff: { opacity: 0.4 },
  linkText: { fontFamily: Font.display, fontSize: 13, lineHeight: 17 },
  tabs: { flexDirection: 'row', gap: 18, paddingTop: 6, paddingHorizontal: 16, borderBottomWidth: 1.5, borderColor: Colors.line },
  tab: { paddingTop: 6, paddingBottom: 10 },
  tabText: { fontFamily: Font.body900, fontSize: 14.5, lineHeight: 20 },
  tabBar: { position: 'absolute', left: 0, right: 0, bottom: -1.5, height: 3, borderRadius: 2, backgroundColor: Colors.ink },
  body: { paddingTop: 12, paddingHorizontal: 16, paddingBottom: 110 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12, paddingHorizontal: 10, marginHorizontal: -10, marginTop: 2, borderRadius: 14 },
  rowNew: { backgroundColor: '#FFF8CC' },
  rowPressed: { opacity: 0.7 },
  ic: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  tx: { flex: 1, minWidth: 0 },
  txB: { fontFamily: Font.body800, fontSize: 14, lineHeight: 20.3 },
  txS: { marginTop: 2, fontFamily: Font.body700, fontSize: 12, lineHeight: 17 },
  dot: { width: 8, height: 8, marginTop: 8, borderRadius: 4, backgroundColor: Colors.rosePink },
  empty: { textAlign: 'center', paddingVertical: 30, paddingHorizontal: 10, fontFamily: Font.body700, fontSize: 14 },
});
