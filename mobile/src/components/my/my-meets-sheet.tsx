import { router, type Href } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { splitEvents } from '@/components/event/event-model';
import { EventRow } from '@/components/event/event-row';
import { ProposalCard } from '@/components/event/proposal-cards';
import { ClubRow } from '@/components/meet/club-list';
import { useMeetStore } from '@/components/meet/meet-store';
import { Button } from '@/components/ui/button';
import { Pressable } from '@/components/ui/pressable';
import { runAfterSheetClose, Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { EVENTS, type EventItem } from '@/data/events';
import { CLUBS, isPast, MEETS, type Meet } from '@/data/meet';

export type MyMeetTab = 'meet' | 'club' | 'event';

/** 번개를 이벤트 한 줄 모양으로 (포스터 · 종류 '번개' · 지점 · D-day · 남은 자리) */
const asRow = (m: Meet): EventItem => ({ id: m.id, ev: 'party', kind: '번개', br: m.br, day: m.day, mon: m.mon, wd: m.wd, title: m.title, place: m.place, host: m.host, cur: m.cur, max: m.max });

/** 내 모임 숫자: 번개 · 동아리(가입한 곳) · 이벤트 · 제안 · '참여 중'(다가오는 번개 · 이벤트 + 가입한 동아리) */
export function useMyMeetCounts() {
  const s = useMeetStore((x) => x);
  const meets = MEETS.filter((m) => s.joined[m.id]);
  const events = EVENTS.filter((e) => s.joined[e.id]);
  const clubs = CLUBS.filter((c) => s.club[c.id] === 'in');
  return {
    meet: meets.length,
    club: clubs.length,
    event: events.length,
    proposed: s.props.length,
    total: meets.length + clubs.length + events.length,
    active: meets.filter((m) => !isPast(m)).length + events.filter((e) => !isPast(e)).length + clubs.length,
  };
}

/**
 * 마이 › 내 활동 › 내 모임: [번개] 다가오는 · 지난 · [동아리] 가입한 · [이벤트] 다가오는 · 지난 · 제안한 이벤트.
 * 누르면 시트를 닫고 그 상세로. 제안은 이벤트 탭 위 '내가 제안한 이벤트'와 같은 카드 (취소 · 되돌리기).
 * 맞는 API: 내 번개 · 동아리 · 이벤트 신청 목록 (지금은 기기에 남긴 가짜 상태 · components/meet/meet-store)
 */
export function MyMeetsSheet({ open, onClose, start = 'meet' }: { open: boolean; onClose: () => void; start?: MyMeetTab }) {
  const [tab, setTab] = useState<MyMeetTab>(start);
  const joined = useMeetStore((s) => s.joined);
  const clubState = useMeetStore((s) => s.club);
  const props = useMeetStore((s) => s.props);
  const meets = splitEvents(MEETS.filter((m) => joined[m.id]).map(asRow));
  const events = splitEvents(EVENTS.filter((e) => joined[e.id]));
  const clubsIn = CLUBS.filter((c) => clubState[c.id] === 'in');
  const n = { meet: meets.up.length + meets.past.length, club: clubsIn.length, event: events.up.length + events.past.length };
  // 열 때마다 고른 탭부터 (비었으면 뭔가 있는 탭으로)
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      const has = (t: MyMeetTab) => n[t] > 0 || (t === 'event' && props.length > 0);
      setTab(has(start) ? start : ((['meet', 'club', 'event'] as const).find(has) ?? start));
    }
  }
  const go = (href: Href) => {
    onClose();
    runAfterSheetClose(() => router.push(href));
  };

  return (
    <Sheet open={open} onClose={onClose} title="내 모임" label="내 모임" tall>
      <View style={styles.seg} accessibilityRole="tablist">
        <SegItem on={tab === 'meet'} label="번개" n={n.meet} onPress={() => setTab('meet')} />
        <SegItem on={tab === 'club'} label="동아리" n={n.club} onPress={() => setTab('club')} />
        <SegItem on={tab === 'event'} label="이벤트" n={n.event} onPress={() => setTab('event')} />
      </View>

      {tab === 'meet' ? (
        n.meet ? (
          <>
            <Group title="다가오는 번개" rows={meets.up} render={(e) => <EventRow key={e.id} e={e} feeLabel="각자 계산" onOpen={() => go(`/meet/${e.id}`)} />} />
            <Group title="지난 번개" rows={meets.past} render={(e) => <EventRow key={e.id} e={e} feeLabel="각자 계산" onOpen={() => go(`/meet/${e.id}`)} />} />
          </>
        ) : (
          <Empty title="아직 참여한 번개가 없어요" sub="라운지 › 번개 · 동아리에서 가볍게 만나 보세요." button="번개 보러 가기" onPress={() => go('/lounge')} />
        )
      ) : null}

      {tab === 'club' ? (
        n.club ? (
          <>
            {clubsIn.length ? (
              <Section title={`가입한 동아리 ${clubsIn.length}`}>
                <View style={styles.box}>
                  {clubsIn.map((c, i) => (
                    <ClubRow key={c.id} c={c} first={i === 0} onOpen={() => go(`/club/${c.id}`)} />
                  ))}
                </View>
              </Section>
            ) : null}
          </>
        ) : (
          <Empty title="아직 가입한 동아리가 없어요" sub="매주 함께 만나는 동아리를 찾아보세요." button="동아리 보러 가기" onPress={() => go('/lounge')} />
        )
      ) : null}

      {tab === 'event' ? (
        n.event || props.length ? (
          <>
            <Group title="다가오는 이벤트" rows={events.up} render={(e) => <EventRow key={e.id} e={e} onOpen={() => go(`/events/${e.id}`)} />} />
            <Group title="지난 이벤트" rows={events.past} render={(e) => <EventRow key={e.id} e={e} onOpen={() => go(`/events/${e.id}`)} />} />
            {props.length ? (
              <Section title={`제안한 이벤트 ${props.length}`} sub="매니저가 확인하고 2~3일 안에 문자로 연락드려요. 확정되면 이벤트 탭에 올라가요.">
                {props.map((q) => (
                  <ProposalCard key={q.id} q={q} />
                ))}
              </Section>
            ) : null}
          </>
        ) : (
          <Empty title="아직 참여한 이벤트가 없어요" sub="파티 · 클래스 · 여행에 참여하면 여기 모여요." button="이벤트 보러 가기" onPress={() => go('/event')} />
        )
      ) : null}
    </Sheet>
  );
}

function Group({ title, rows, render }: { title: string; rows: EventItem[]; render: (e: EventItem) => ReactNode }) {
  if (!rows.length) return null;
  return <Section title={`${title} ${rows.length}`}>{rows.map(render)}</Section>;
}

function Section({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <View style={styles.group}>
      <PText style={styles.h} accessibilityRole="header">
        {title}
      </PText>
      {sub ? <PText style={styles.sub}>{sub}</PText> : null}
      {children}
    </View>
  );
}

function SegItem({ on, label, n, onPress }: { on: boolean; label: string; n: number; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="tab" accessibilityState={{ selected: on }} accessibilityLabel={`${label} ${n}개`} style={[styles.segItem, on && styles.segOn]}>
      <PText style={[styles.segText, on && styles.segTextOn]}>
        {label}
        <PText style={[styles.segCount, on && styles.segTextOn]}> {n}</PText>
      </PText>
    </Pressable>
  );
}

function Empty({ title, sub, button, onPress }: { title: string; sub: string; button: string; onPress: () => void }) {
  return (
    <View style={styles.empty}>
      <PText style={styles.emptyT}>{title}</PText>
      <PText style={styles.emptyS}>{sub}</PText>
      <View style={styles.emptyBtn}>
        <Button label={button} variant="secondary" onPress={onPress} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // 지점 고르기 · 체험 예약의 권역 탭과 같은 모양
  seg: { flexDirection: 'row', padding: 3, borderRadius: 14, backgroundColor: '#EFE8D8' },
  segItem: { flex: 1, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  segOn: { backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.ink },
  segText: { fontFamily: Font.body800, fontSize: 13.5, lineHeight: 18, color: Colors.inkSub },
  segTextOn: { fontFamily: Font.body900, color: Colors.ink },
  segCount: { fontFamily: Font.display, fontSize: 12, color: Colors.inkSub },
  group: { gap: 10, marginTop: 6 },
  h: { fontFamily: Font.body900, fontSize: 14, lineHeight: 19, paddingHorizontal: 2 },
  sub: { fontFamily: Font.body700, fontSize: 12.5, lineHeight: 18, color: Colors.inkSub, paddingHorizontal: 2, marginTop: -6 },
  box: { paddingHorizontal: 14, borderWidth: 2, borderColor: Colors.ink, borderRadius: 18, backgroundColor: Colors.white },
  empty: { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 10, gap: 6 },
  emptyT: { fontFamily: Font.body900, fontSize: 15, lineHeight: 21 },
  emptyS: { textAlign: 'center', fontFamily: Font.body700, fontSize: 13.5, lineHeight: 20, color: Colors.inkSub },
  emptyBtn: { marginTop: 10 },
});
