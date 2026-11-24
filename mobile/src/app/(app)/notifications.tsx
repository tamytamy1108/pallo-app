import { router, type Href } from 'expo-router';
import { Stack } from 'expo-router/js-stack';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TOP_ICON, TopBar } from '@/components/ui/top-bar';
import { Pressable } from '@/components/ui/pressable';
import { SCREEN } from '@/lib/transitions';
import { CHECK_PATH, ICON_PATH, LineIcon } from '@/components/home/icons';
import { MemberFace } from '@/components/home/member-face';
import { markAllNotiRead, markNotiRead, useNotiList, useNotiRead, useUnreadCount } from '@/components/home/noti-state';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { NOTI_TABS, type Noti, type NotiKind } from '@/data/home';
import { sfx } from '@/lib/feedback';
import { canUse, type Feature } from '@/state/access';
import { memberGate } from '@/components/common/trial-guide';
import { getMe, useMe } from '@/state/me';
import { getLastStep } from '@/state/progress';

/**
 * 알림함 (프로토타입 notiHTML · .nt-tabs · .nt-row).
 * 최신 순 한 목록 · 안 읽은 알림은 노랑 바탕 + 분홍 점. 누르면 읽음이 되고 그 화면으로 가요.
 */
/** 회원 전용 화면 주소 → 기능 · 막혔을 때 안내 한 줄 */
const MEMBER_HREFS: [string, Feature, string][] = [
  ['/me/notes', 'proNote', '프로 노트를 보려면'],
  ['/me/pass', 'pass', '이용권을 보려면'],
  ['/me/study', 'myStudy', '내 스터디를 보려면'],
  ['/me/change', 'myStudy', '연기 · 변경을 신청하려면'],
];

/** 내가 마지막으로 연 단계 (없으면 홈 스터디 맵) — 친구 퀘스트 알림의 [나도 이어서 하기] */
function myLastHref() {
  const l = getLastStep();
  if (!l) return '/';
  return `${l.lv <= 2 ? '/lesson' : '/lesson34'}/${l.step}?lv=${l.lv}&unit=${l.unit}`;
}

export default function NotificationsScreen() {
  const [tab, setTab] = useState<'all' | NotiKind>('all');
  const read = useNotiRead();
  const unread = useUnreadCount();
  const canSettings = useMe((m) => canUse(m, 'settings'));
  // 앱을 쓰는 동안 새로 온 알림(지점 연동 결과 등)이 맨 위에 쌓여요
  const list = useNotiList().filter((n) => tab === 'all' || n.kind === tab);

  const open = (n: Noti) => {
    markNotiRead(n.id);
    // 회원 전용 화면으로 가는 알림(프로 노트 · 이용권 · 내 스터디)은 비회원이면 열지 않고 체험 안내
    const gate = MEMBER_HREFS.find(([prefix]) => n.href.startsWith(prefix));
    if (gate && !canUse(getMe(), gate[1])) {
      memberGate(gate[2]);
      return;
    }
    sfx('tap');
    router.push((n.toMyLast ? myLastHref() : n.href) as Href);
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
        {/* 설정은 회원만: 비회원은 흐리게 · 누르면 체험 안내 (trial-guide memberGate) */}
        <Pressable
          onPress={() => (canSettings ? router.push('/me/settings?section=noti' as Href) : memberGate('설정을 쓰려면'))}
          accessibilityRole="button"
          accessibilityLabel="알림 설정"
          accessibilityHint={canSettings ? undefined : '지점 회원이 되면 쓸 수 있어요'}
          style={StyleSheet.flatten([TOP_ICON, !canSettings && styles.linkOff])}>
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
      ) : n.badge ? (
        <LinkBadge kind={n.badge} />
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
        {n.action ? (
          <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={n.action} hitSlop={4} style={({ pressed }) => StyleSheet.flatten([styles.act, pressed && styles.actPressed])}>
            <PText style={styles.actText}>{n.action} ›</PText>
          </Pressable>
        ) : null}
      </View>
      {unread && <View style={styles.dot} />}
    </Pressable>
  );
}

/** 지점 연동 결과 동그라미 (프로토타입 .nt-ic.ok): 연동됨 보라 + 흰 체크 · 못 찾음 분홍 + ? */
function LinkBadge({ kind }: { kind: 'ok' | 'fail' }) {
  if (kind === 'ok')
    return (
      <View style={StyleSheet.flatten([styles.ic, styles.icOk])}>
        <LineIcon d={CHECK_PATH} size={18} width={2.8} color={Colors.white} />
      </View>
    );
  return (
    <View style={StyleSheet.flatten([styles.ic, styles.icFail])}>
      <PText style={styles.icQ}>?</PText>
    </View>
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
  icOk: { backgroundColor: Colors.purple, borderColor: Colors.purple },
  icFail: { backgroundColor: '#FCE3EA' },
  icQ: { fontFamily: Font.display, fontSize: 16, lineHeight: 20 },
  tx: { flex: 1, minWidth: 0 },
  txB: { fontFamily: Font.body800, fontSize: 14, lineHeight: 20.3 },
  txS: { marginTop: 2, fontFamily: Font.body700, fontSize: 12, lineHeight: 17 },
  // 줄 안 작은 노랑 버튼 ('나도 이어서 하기' · '같이 가기')
  act: { alignSelf: 'flex-start', marginTop: 8, height: 30, paddingHorizontal: 12, borderRadius: 15, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.yellow, justifyContent: 'center', boxShadow: '2px 2px 0 #1E1A2B' },
  actPressed: { transform: [{ translateX: 2 }, { translateY: 2 }], boxShadow: '0 0 0 #1E1A2B' },
  actText: { fontFamily: Font.body900, fontSize: 12.5, lineHeight: 17 },
  dot: { width: 8, height: 8, marginTop: 8, borderRadius: 4, backgroundColor: Colors.rosePink },
  empty: { textAlign: 'center', paddingVertical: 30, paddingHorizontal: 10, fontFamily: Font.body700, fontSize: 14 },
});
