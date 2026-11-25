import type { Href } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { RoleTag } from '@/components/common/role-tag';
import { Pressable } from '@/components/ui/pressable';
import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { CHALLENGES } from '@/data/challenge';
import { CLUBS, isPast, MEETS } from '@/data/meet';
import { nameHash } from '@/data/my';
import { sfx } from '@/lib/feedback';

export type MeetKind = 'club' | 'meet' | 'challenge';
type Row = { key: string; title: string; sub: string; href: Href; host: boolean };

const KINDS: { k: MeetKind; label: string }[] = [
  { k: 'club', label: '동아리' },
  { k: 'meet', label: '번개' },
  { k: 'challenge', label: '챌린지' },
];
const MON: Record<string, number> = { JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6, JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12 };
/** '하나 프로' → '하나' (호스트 이름 뒤에 붙은 역할 글자는 빼고 비교) */
const hostName = (h: string) => h.split(' ')[0];

/**
 * 그 사람이 참여 중인 동아리 · 번개(다가오는) · 챌린지. 호스트인 것(운영 중)이 맨 위 · HOST 글자.
 * 운영 중은 샘플 데이터의 호스트 이름으로 찾고, 그 밖의 참여는 아직 API가 없어서 이름으로 고른 샘플이에요.
 * 맞는 API: 멤버 프로필의 모임 목록 (운영 중 · 참여 중)
 */
export function profileMeets(name: string): Record<MeetKind, Row[]> {
  const h = nameHash(name);
  const pick = <T,>(list: T[], n: number) => list.filter((_, i) => (i + h) % 3 === 0).slice(0, n);
  const mine = <T extends { host: string }>(list: T[], n: number) => [...list.filter((x) => hostName(x.host) === name), ...pick(list.filter((x) => hostName(x.host) !== name), n)];
  return {
    club: mine(CLUBS, 1).map((c) => ({ key: c.id, title: c.name, sub: `${c.br} · ${c.when}`, href: `/club/${c.id}`, host: hostName(c.host) === name })),
    meet: mine(
      MEETS.filter((m) => !isPast(m)),
      2,
    ).map((m) => ({ key: m.id, title: m.title, sub: `${MON[m.mon] ?? ''}.${m.day} ${m.wd} · ${m.br}`, href: `/meet/${m.id}`, host: hostName(m.host) === name })),
    challenge: mine(CHALLENGES, 2).map((p) => ({ key: p.id, title: p.name, sub: `${p.br} · ${p.members}명 참여 중`, href: `/challenge/${p.id}`, host: hostName(p.host) === name })),
  };
}

export const profileMeetCount = (name: string) => {
  const L = profileMeets(name);
  return L.club.length + L.meet.length + L.challenge.length;
};

/**
 * 프로필 › '참여 중' 숫자를 누르면: 팔로워 목록 시트와 같은 모양 · 탭은 분야별(동아리 · 번개 · 챌린지).
 * 줄을 누르면 바로 그 상세로 (onGo).
 */
export function ProfileMeetsSheet({ name, open, onClose, onGo }: { name: string; open: boolean; onClose: () => void; onGo: (href: Href) => void }) {
  const L = profileMeets(name);
  const [tab, setTab] = useState<MeetKind>('club');
  // 열 때마다 뭔가 있는 첫 탭부터
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setTab(KINDS.find(({ k }) => L[k].length > 0)?.k ?? 'club');
  }
  const cur = L[tab];
  // 시트를 닫는 움직임 없이 바로 그 상세로 (프로필 화면 자리를 바꿔요)
  const go = (href: Href) => {
    sfx('tap');
    onGo(href);
  };
  return (
    <Sheet open={open} onClose={onClose} title={name} tall label={`${name} 참여 중`}>
      <View style={styles.tabs} accessibilityRole="tablist">
        {KINDS.map(({ k, label }) => {
          const on = tab === k;
          return (
            <Pressable key={k} onPress={() => setTab(k)} accessibilityRole="tab" accessibilityState={{ selected: on }} style={[styles.tab, on && styles.tabOn]}>
              <PText style={[styles.tabT, on && styles.tabTOn]}>
                {label} <PText style={styles.tabN}>{L[k].length}</PText>
              </PText>
            </Pressable>
          );
        })}
      </View>
      {cur.length ? (
        <View>
          {cur.map((r, i) => (
            <Pressable
              key={r.key}
              onPress={() => go(r.href)}
              accessibilityRole="button"
              accessibilityLabel={`${r.title}${r.host ? ' · 호스트' : ''}`}
              style={({ pressed }) => [styles.row, i > 0 && styles.line, pressed && styles.rowPressed]}>
              <View style={styles.tx}>
                <View style={styles.titleRow}>
                  <PText style={styles.title} numberOfLines={1}>
                    {r.title}
                  </PText>
                  {r.host ? <RoleTag kind="host" /> : null}
                </View>
                <PText style={styles.sub} numberOfLines={1}>
                  {r.sub}
                </PText>
              </View>
              <PText style={styles.chev}>›</PText>
            </Pressable>
          ))}
        </View>
      ) : (
        <PText style={styles.empty}>{`참여 중인 ${KINDS.find(({ k }) => k === tab)?.label}가 없어요.`}</PText>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  // 팔로워 목록 시트(my-sheets FollowSheet)와 같은 탭
  tabs: { flexDirection: 'row', gap: 18, borderBottomWidth: 1.5, borderColor: Colors.line },
  tab: { paddingTop: 6, paddingBottom: 10, marginBottom: -1.5, borderBottomWidth: 3, borderColor: 'transparent' },
  tabOn: { borderColor: Colors.ink },
  tabT: { fontFamily: Font.body900, fontSize: 14.5, lineHeight: 20, color: Colors.inkSub },
  tabTOn: { color: Colors.ink },
  tabN: { fontFamily: Font.body800, fontSize: 12, color: Colors.inkSub },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 64, paddingVertical: 10 },
  rowPressed: { opacity: 0.6 },
  line: { borderTopWidth: 1.5, borderColor: Colors.line },
  tx: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  title: { flexShrink: 1, fontFamily: Font.body900, fontSize: 15, lineHeight: 21 },
  sub: { marginTop: 1, fontFamily: Font.body700, fontSize: 12.5, lineHeight: 18, color: Colors.inkSub },
  chev: { fontFamily: Font.body900, fontSize: 18, lineHeight: 22, color: Colors.inkSub },
  empty: { textAlign: 'center', paddingVertical: 30, paddingHorizontal: 10, fontFamily: Font.body700, fontSize: 14, lineHeight: 22, color: Colors.inkSub },
});
