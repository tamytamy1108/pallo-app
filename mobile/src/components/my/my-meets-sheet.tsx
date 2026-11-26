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
import { CLUBS, isPast, MEETS, type Club, type Meet } from '@/data/meet';
import { openChallenge } from '@/components/challenge/cards';
import { ChCover } from '@/components/challenge/cover';
import { useMyClubRoles } from '@/components/meet/model';
import { allChallenges, isExpr, isJoined, meaningOf, planText, useChallengeState, type Challenge } from '@/data/challenge';
import { useMe } from '@/state/me';

export type MyMeetTab = 'club' | 'meet' | 'chal' | 'event';
/** 내 모임 순서: 동아리 → 번개 → 챌린지 → 이벤트 (마이 · 찜한 모임 · 프로필 모임이 같아요) */
export const MY_MEET_ORDER: [MyMeetTab, string][] = [
  ['club', '동아리'],
  ['meet', '번개'],
  ['chal', '챌린지'],
  ['event', '이벤트'],
];

/** 번개를 이벤트 한 줄 모양으로 (포스터 · 종류 '번개' · 지점 · D-day · 남은 자리) */
const asRow = (m: Meet): EventItem => ({ id: m.id, ev: 'party', kind: '번개', br: m.br, day: m.day, mon: m.mon, wd: m.wd, title: m.title, place: m.place, host: m.host, cur: m.cur, max: m.max });

/** 내 동아리: 운영 중(호스트 · 코호스트)이 먼저, 그다음 가입한 곳 (겹치면 운영 중에만) */
function useMyClubs() {
  const me = useMe();
  const clubState = useMeetStore((s) => s.club);
  const { hostOf, coOf } = useMyClubRoles(me.name);
  const run: { c: Club; role: 'host' | 'co' }[] = [...hostOf.map((c) => ({ c, role: 'host' as const })), ...coOf.map((c) => ({ c, role: 'co' as const }))];
  const runIds = new Set(run.map((r) => r.c.id));
  const joined = CLUBS.filter((c) => clubState[c.id] === 'in' && !runIds.has(c.id));
  return { run, joined };
}

/** 내 챌린지: 내가 연 것 · 참여한 것 (표현 챌린지는 문장을 단 것) */
const useMyChallenges = () => {
  const s = useChallengeState();
  return allChallenges(s).filter((p) => isJoined(p, s));
};

/** 내 모임 숫자: 동아리(운영 중 + 가입) · 번개 · 챌린지 · 이벤트 · 제안 · '참여 중'(운영 · 가입한 동아리 + 다가오는 번개 · 이벤트 + 참여 중인 챌린지) */
export function useMyMeetCounts() {
  const s = useMeetStore((x) => x);
  const clubs = useMyClubs();
  const chals = useMyChallenges();
  const meets = MEETS.filter((m) => s.joined[m.id]);
  const events = EVENTS.filter((e) => s.joined[e.id]);
  const club = clubs.run.length + clubs.joined.length;
  return {
    club,
    meet: meets.length,
    chal: chals.length,
    event: events.length,
    proposed: s.props.length,
    total: club + meets.length + chals.length + events.length,
    active: club + meets.filter((m) => !isPast(m)).length + chals.length + events.filter((e) => !isPast(e)).length,
  };
}

/**
 * 마이 › 참여 중인 모임 · 내 모임: [동아리] 운영 중 · 가입한 · [번개] 다가오는 · 지난 · [챌린지] 참여 중 · [이벤트] 다가오는 · 지난 · 제안한 이벤트.
 * 순서는 동아리 → 번개 → 챌린지 → 이벤트 (MY_MEET_ORDER). 동아리 안에서는 내가 운영하는 동아리가 가장 먼저예요.
 * 누르면 시트를 닫고 그 상세로. 제안은 이벤트 탭 위 '내가 제안한 이벤트'와 같은 카드 (취소 · 되돌리기).
 * 맞는 API: 내 번개 · 동아리 · 챌린지 · 이벤트 목록 · `/me/roles`(A32) (지금은 기기에 남긴 가짜 상태)
 */
export function MyMeetsSheet({ open, onClose, start = 'club' }: { open: boolean; onClose: () => void; start?: MyMeetTab }) {
  const [tab, setTab] = useState<MyMeetTab>(start);
  const joined = useMeetStore((s) => s.joined);
  const props = useMeetStore((s) => s.props);
  const clubs = useMyClubs();
  const chals = useMyChallenges();
  const meets = splitEvents(MEETS.filter((m) => joined[m.id]).map(asRow));
  const events = splitEvents(EVENTS.filter((e) => joined[e.id]));
  const n: Record<MyMeetTab, number> = {
    club: clubs.run.length + clubs.joined.length,
    meet: meets.up.length + meets.past.length,
    chal: chals.length,
    event: events.up.length + events.past.length,
  };
  // 열 때마다 고른 탭부터 (비었으면 순서대로 뭔가 있는 첫 탭으로)
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      const has = (t: MyMeetTab) => n[t] > 0 || (t === 'event' && props.length > 0);
      setTab(has(start) ? start : (MY_MEET_ORDER.map(([k]) => k).find(has) ?? start));
    }
  }
  const go = (href: Href) => {
    onClose();
    runAfterSheetClose(() => router.push(href));
  };
  const goChal = (p: Challenge) => {
    onClose();
    runAfterSheetClose(() => openChallenge(p));
  };

  return (
    <Sheet open={open} onClose={onClose} title="내 모임" label="내 모임" tall>
      <View style={styles.seg} accessibilityRole="tablist">
        {MY_MEET_ORDER.map(([k, l]) => (
          <SegItem key={k} on={tab === k} label={l} n={n[k]} onPress={() => setTab(k)} />
        ))}
      </View>

      {tab === 'club' ? (
        n.club ? (
          <>
            {clubs.run.length ? (
              <Section title={`운영 중인 동아리 ${clubs.run.length}`} sub="호스트 · 코호스트로 맡고 있는 동아리예요.">
                <View style={styles.box}>
                  {clubs.run.map(({ c, role }, i) => (
                    <ClubRow key={c.id} c={c} role={role} first={i === 0} onOpen={() => go(`/club/${c.id}`)} />
                  ))}
                </View>
              </Section>
            ) : null}
            {clubs.joined.length ? (
              <Section title={`가입한 동아리 ${clubs.joined.length}`}>
                <View style={styles.box}>
                  {clubs.joined.map((c, i) => (
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

      {tab === 'chal' ? (
        n.chal ? (
          <Section title={`참여 중인 챌린지 ${chals.length}`}>
            <View style={styles.box}>
              {chals.map((p, i) => (
                <Pressable key={p.id} onPress={() => goChal(p)} accessibilityRole="button" accessibilityLabel={`${isExpr(p) ? p.hl || p.name : p.name} 열기`} style={({ pressed }) => [styles.chRow, i > 0 && styles.chLine, pressed && { opacity: 0.7 }]}>
                  <ChCover p={p} size={42} style={styles.chCover} />
                  <View style={styles.chTx}>
                    <View style={styles.chTop}>
                      <PText numberOfLines={1} style={styles.chT}>
                        {isExpr(p) ? p.hl || p.name : p.name}
                      </PText>
                      {p.mine ? <PText style={styles.chMine}>내가 연</PText> : null}
                    </View>
                    <PText numberOfLines={1} style={styles.chSub}>
                      {isExpr(p) ? `표현 챌린지 · ${meaningOf(p)}` : planText(p)}
                    </PText>
                  </View>
                </Pressable>
              ))}
            </View>
          </Section>
        ) : (
          <Empty title="아직 참여한 챌린지가 없어요" sub="라운지 › 챌린지에서 함께할 챌린지를 찾아보세요." button="챌린지 보러 가기" onPress={() => go('/lounge')} />
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
  // 챌린지 한 줄 (찜한 챌린지와 같은 모양)
  chRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  chLine: { borderTopWidth: 1.5, borderColor: Colors.line },
  chCover: { width: 42, height: 42, borderRadius: 12, borderWidth: 2, borderColor: Colors.ink, alignItems: 'center', justifyContent: 'center' },
  chTx: { flex: 1, minWidth: 0, gap: 2 },
  chTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chT: { flexShrink: 1, fontFamily: Font.body900, fontSize: 14.5, lineHeight: 20 },
  chMine: { fontFamily: Font.body900, fontSize: 11, lineHeight: 15, color: Colors.purple },
  chSub: { fontFamily: Font.body700, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
});
