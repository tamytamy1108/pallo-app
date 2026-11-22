import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaInsetsContext, SafeAreaView } from 'react-native-safe-area-context';

import { Pressable } from '@/components/ui/pressable';
import { guardMember } from '@/components/common/trial-guide';
import { EventBanner } from '@/components/event/event-banner';
import { splitEvents } from '@/components/event/event-model';
import { EventRow } from '@/components/event/event-row';
import { ProposalCards } from '@/components/event/proposal-cards';
import { BranchSelect } from '@/components/lounge/branch-select';
import { Icon } from '@/components/meet/icons';
import { branchOk } from '@/components/meet/model';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors, TabBarSpace } from '@/constants/theme';
import { EVENT_FILTERS, EVENTS, type EventKind } from '@/data/events';
import { useMe } from '@/state/me';

/**
 * 이벤트 탭 (docs/pages/06-event.md): 지점 · 본사가 여는 파티 · 클래스 · 여행.
 * 프로토타입은 라운지 화면을 이벤트만 보이게 써요 (lgMode('event') — 탭 줄 · 스토리 · 지도는 숨김).
 * 위 → 아래: 제목 · 내가 제안한 이벤트 · 지점 선택 + 종류 칩 · 배너 · 다가오는/지난 탭 · 목록 · 오른쪽 아래 [오픈하기].
 */
export default function EventScreen() {
  const role = useMe((m) => m.role);
  const [branch, setBranch] = useState('전체');
  const [kind, setKind] = useState<EventKind | 'all'>('all');
  const [tab, setTab] = useState<'up' | 'past'>('up');

  const all = EVENTS.filter((e) => branchOk(e.br, branch) && (kind === 'all' || e.ev === kind));
  const { up, past } = splitEvents(all);
  const isPastTab = tab === 'past';
  const L = isPastTab ? past : up;
  const staff = role === 'leader' || role === 'manager';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.hd}>
          <PText variant="headline" accessibilityRole="header" style={styles.h1}>
            이벤트
          </PText>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subs} contentContainerStyle={styles.subsIn} accessibilityLabel="세부 카테고리">
          <BranchSelect value={branch} onChange={setBranch} />
          <View style={styles.sep} />
          {EVENT_FILTERS.map(([k, l]) => {
            const on = kind === k;
            return (
              <Pressable key={k} onPress={() => setKind(k)} accessibilityRole="button" accessibilityState={{ selected: on }} style={[styles.chip, on && styles.chipOn]}>
                <PText style={[styles.chipT, on && { color: Colors.purple }]}>{l}</PText>
              </Pressable>
            );
          })}
        </ScrollView>
        <View style={styles.feed}>
          <ProposalCards />
          {/* 칩 · 지점을 바꾸면 배너를 처음(1 / n)부터 */}
          <EventBanner key={up.slice(0, 5).map((e) => e.id).join()} list={up.slice(0, 5)} />
          <View style={styles.tabs} accessibilityRole="tablist">
            <TabBtn on={!isPastTab} label="다가오는 이벤트" n={up.length} onPress={() => setTab('up')} />
            <TabBtn on={isPastTab} label="지난 이벤트" onPress={() => setTab('past')} />
          </View>
          <PText style={styles.sort}>{isPastTab ? '최근에 끝난 순 · 누르면 후기와 사진을 볼 수 있어요' : '마감 임박한 순'}</PText>
          {L.length ? (
            <View style={styles.list}>
              {L.map((e) => (
                <EventRow key={e.id} e={e} />
              ))}
            </View>
          ) : (
            <PText style={styles.empty}>{isPastTab ? '지난 이벤트가 없어요.' : '예정된 이벤트가 없어요.'}</PText>
          )}
        </View>
      </ScrollView>
      {/* 오픈하기: 라운지 + 버튼과 같은 자리 · 멤버는 제안서, 리더 · 매니저는 바로 열기(관리자 화면이라 나중에) */}
      <SafeAreaInsetsContext.Consumer>
        {(insets) => (
          <Pressable
            onPress={() => guardMember(() => router.push('/events/propose'))}
            accessibilityRole="button"
            accessibilityLabel={staff ? '이벤트 오픈하기' : '이벤트 제안하기'}
            style={({ pressed }) => [styles.fab, { bottom: Math.max(insets?.bottom ?? 0, 12) + 62 + 32 }, pressed && styles.fabPressed]}>
            <Icon name="pen" size={16} />
            <PText style={styles.fabT}>오픈하기</PText>
          </Pressable>
        )}
      </SafeAreaInsetsContext.Consumer>
    </SafeAreaView>
  );
}

function TabBtn({ on, label, n, onPress }: { on: boolean; label: string; n?: number; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="tab" accessibilityState={{ selected: on }} style={styles.tab}>
      <PText style={[styles.tabT, !on && { color: '#A39C8E' }]}>{label}</PText>
      {n != null ? <PText style={[styles.tabN, !on && { color: '#A39C8E' }]}>{n}</PText> : null}
      {on ? <View style={styles.tabLine} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  page: { paddingTop: 16, paddingBottom: TabBarSpace + 80 },
  hd: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, paddingHorizontal: 16, paddingBottom: 10 },
  h1: { fontSize: 26, lineHeight: 37, letterSpacing: -0.6 },
  subs: { flexGrow: 0, marginTop: 6 },
  subsIn: { gap: 6, paddingTop: 12, paddingBottom: 4, paddingHorizontal: 16, alignItems: 'center' },
  sep: { width: 1.5, height: 22, marginVertical: 4, marginHorizontal: 2, backgroundColor: '#DCD4C4' },
  chip: { height: 30, borderRadius: 15, borderWidth: 1.5, borderColor: '#CFC6B4', paddingHorizontal: 12, justifyContent: 'center' },
  chipOn: { backgroundColor: Colors.lavender, borderColor: Colors.purple },
  chipT: { fontFamily: Font.body800, fontSize: 12.5, lineHeight: 17, color: Colors.inkSub },
  feed: { paddingTop: 12, paddingHorizontal: 16, gap: 22 },
  tabs: { flexDirection: 'row', gap: 18, height: 39, borderBottomWidth: 1, borderColor: Colors.line, marginBottom: -10 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 2, height: 38 },
  tabT: { fontFamily: Font.body900, fontSize: 15, lineHeight: 21 },
  tabN: { fontFamily: Font.display, fontSize: 11, lineHeight: 14 },
  tabLine: { position: 'absolute', left: 0, right: 0, bottom: -1, height: 3, borderRadius: 2, backgroundColor: Colors.ink },
  sort: { fontFamily: Font.body700, fontSize: 12.5, lineHeight: 19, color: Colors.inkSub, marginHorizontal: 2, marginBottom: -8 },
  list: { gap: 10 },
  empty: { textAlign: 'center', paddingVertical: 30, paddingHorizontal: 10, fontFamily: Font.body700, fontSize: 14, lineHeight: 22, color: Colors.inkSub },
  fab: { position: 'absolute', right: 16, height: 44, borderRadius: 22, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.yellow, flexDirection: 'row', alignItems: 'center', gap: 5, paddingLeft: 13, paddingRight: 15, boxShadow: '0px 4px 0px #1E1A2B' },
  fabPressed: { transform: [{ translateY: 4 }], boxShadow: '0px 0px 0px #1E1A2B' },
  fabT: { fontFamily: Font.body900, fontSize: 13, lineHeight: 19 },
});
