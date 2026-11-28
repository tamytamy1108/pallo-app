import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { apiErrorMessage } from '@/api/errors';
import { badgeProgress, useMyBadges } from '@/api/use-badges';
import { AccountPage } from '@/components/account/parts';
import { BadgeDetailSheet, type BadgeOpen } from '@/components/my/badge-detail-sheet';
import { BadgeArt, badgeBg, BadgeGrid, SecHead } from '@/components/my/my-blocks';
import { Appear } from '@/components/ui/appear';
import { Pressable } from '@/components/ui/pressable';
import { Raised } from '@/components/ui/raised';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state-view';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors, Radius } from '@/constants/theme';
import { BADGE_GUIDE, BADGE_RULE, badgeLeftLabel, earnedDateLabel } from '@/data/badge-rules';
import type { Badge } from '@/data/my';

/**
 * 배지 모두 보기 (마이 › 배지 '모두 보기 ›' · '받은 배지' 숫자 칸 · 배지 알림).
 * 받은 개수 · 최근 받은 배지 → 거의 다 왔어요(진행 막대) → 모든 배지 칸 → 배지는 이렇게 받아요.
 * 칸을 누르면 배지 상세 시트(받는 방법 · 진행 · 하러 가기). 목록 · 진행은 서버 GET /me/badges 그대로예요.
 */
export default function BadgesScreen() {
  const q = useMyBadges();
  const [open, setOpen] = useState<BadgeOpen | null>(null);
  const title = q.data ? `배지 ${q.data.earned} / ${q.data.list.length}` : '배지';

  if (q.isPending) {
    return (
      <AccountPage title={title}>
        <LoadingState />
      </AccountPage>
    );
  }
  if (q.isError) {
    return (
      <AccountPage title={title}>
        <ErrorState message={apiErrorMessage(q.error)} onRetry={() => q.refetch()} />
      </AccountPage>
    );
  }

  const { list, earned, latest, near } = q.data;
  // 칸 색은 전체 목록 순서로 (거의 다 왔어요 · 상세 시트도 같은 색)
  const order = new Map(list.map((b, i) => [b.code, i]));
  const colorOf = (b: Badge) => order.get(b.code) ?? 0;
  const openBadge = (b: Badge) => setOpen({ badge: b, colorIndex: colorOf(b) });
  const ratio = list.length ? earned / list.length : 0;

  return (
    <AccountPage title={title} bodyStyle={styles.body}>
      {list.length === 0 ? (
        <EmptyState title="아직 준비된 배지가 없어요" />
      ) : (
        <>
          {/* 받은 개수 · 최근 받은 배지 */}
          <Appear kind="rise">
            <Raised radius={Radius.card}>
              <View style={styles.sum}>
                <View style={styles.sumTop}>
                  <View style={styles.sumL}>
                    <PText style={styles.sumK}>받은 배지</PText>
                    <PText style={styles.sumV}>
                      {earned}
                      <PText style={styles.sumOf}> / {list.length}개</PText>
                    </PText>
                  </View>
                  {latest ? (
                    <Pressable onPress={() => openBadge(latest)} accessibilityRole="button" accessibilityLabel={`최근 받은 배지 ${latest.name}`} style={({ pressed }) => [styles.latest, pressed && styles.pressed]}>
                      <BadgeArt b={latest} bg={badgeBg(colorOf(latest))} size={40} iconSize={18} />
                      <View style={styles.latestT}>
                        <PText style={styles.latestK}>최근 받은 배지</PText>
                        <PText style={styles.latestN} numberOfLines={1}>
                          {latest.name}
                        </PText>
                        {latest.earnedAt ? <PText style={styles.latestD}>{earnedDateLabel(latest.earnedAt)}</PText> : null}
                      </View>
                    </Pressable>
                  ) : (
                    // 아직 받은 배지가 없을 때 — 같은 자리에 빈 동그라미로 첫 배지를 기다려요
                    <View style={styles.latest} accessible accessibilityLabel="최근 받은 배지 없음 · 첫 배지를 기다리고 있어요">
                      <View style={styles.latestEmpty}>
                        <PText style={styles.latestQ}>?</PText>
                      </View>
                      <View style={styles.latestT}>
                        <PText style={styles.latestK}>최근 받은 배지</PText>
                        <PText style={[styles.latestN, styles.latestNOff]}>아직 없어요</PText>
                        <PText style={styles.latestD}>첫 배지를 기다려요</PText>
                      </View>
                    </View>
                  )}
                </View>
                <View style={styles.track} accessible accessibilityRole="progressbar" accessibilityLabel={`배지 ${list.length}개 중 ${earned}개 받음`}>
                  <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
                </View>
                <PText style={styles.sumHint}>{earned === 0 ? '번개 · 동아리에 참여하면 첫 배지를 받아요' : earned === list.length ? '배지를 모두 모았어요!' : `${list.length - earned}개 더 모을 수 있어요`}</PText>
              </View>
            </Raised>
          </Appear>

          {/* 거의 다 왔어요 */}
          {near.length > 0 ? (
            <>
              <SecHead title="거의 다 왔어요" />
              <Appear kind="rise">
                <View style={styles.nearList}>
                  {near.map((b) => (
                    <NearRow key={b.code} b={b} bg={badgeBg(colorOf(b))} onPress={() => openBadge(b)} />
                  ))}
                </View>
              </Appear>
            </>
          ) : null}

          {/* 칸 */}
          <SecHead title="모든 배지" />
          <Appear kind="rise">
            <BadgeGrid list={list} desc onPress={openBadge} colorIndex={colorOf} />
          </Appear>

          {/* 받는 법 */}
          <SecHead title="배지는 이렇게 받아요" />
          <View style={styles.guide}>
            {BADGE_GUIDE.map((g, i) => (
              <View key={g.t} style={[styles.gRow, i > 0 && styles.gLine]}>
                <View style={styles.gNo}>
                  <PText style={styles.gNoT}>{i + 1}</PText>
                </View>
                <View style={styles.gText}>
                  <PText style={styles.gT}>{g.t}</PText>
                  <PText style={styles.gD}>{g.d}</PText>
                </View>
              </View>
            ))}
          </View>
        </>
      )}

      <BadgeDetailSheet open={open} onClose={() => setOpen(null)} />
    </AccountPage>
  );
}

/** 거의 다 온 배지 한 줄 — 그림 · 이름 · 진행 막대 · 남은 만큼 */
function NearRow({ b, bg, onPress }: { b: Badge; bg: string; onPress: () => void }) {
  const p = badgeProgress(b);
  const c = b.cond;
  if (!p || !c) return null;
  const rule = BADGE_RULE[c.type];
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${b.name} · ${badgeLeftLabel(c.type, p.left)}`} style={({ pressed }) => [styles.near, pressed && styles.pressed]}>
      <BadgeArt b={b} bg={bg} size={44} iconSize={19} />
      <View style={styles.nearT}>
        <View style={styles.nearHead}>
          <PText style={styles.nearN} numberOfLines={1}>
            {b.name}
          </PText>
          <PText style={styles.nearV}>
            {p.cur} / {p.need}
            {rule.unit}
          </PText>
        </View>
        <View style={styles.trackSm}>
          <View style={[styles.fill, { width: `${Math.max(p.ratio * 100, 6)}%` }]} />
        </View>
        <PText style={styles.nearL}>{badgeLeftLabel(c.type, p.left)}</PText>
      </View>
      <PText style={styles.chev}>›</PText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: { gap: 12 },
  pressed: { opacity: 0.6 },
  sum: { gap: 10, padding: 16, borderWidth: 2, borderColor: Colors.ink, borderRadius: Radius.card, backgroundColor: Colors.white },
  sumTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sumL: { flex: 1, gap: 2 },
  sumK: { fontFamily: Font.body800, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  sumV: { fontFamily: Font.display, fontSize: 28, lineHeight: 34 },
  sumOf: { fontFamily: Font.body800, fontSize: 14, lineHeight: 20, color: Colors.inkSub },
  latest: { flexDirection: 'row', alignItems: 'center', gap: 8, maxWidth: '58%', paddingVertical: 6, paddingHorizontal: 8, borderRadius: Radius.control, backgroundColor: Colors.cream },
  latestT: { flexShrink: 1 },
  latestK: { fontFamily: Font.body700, fontSize: 10.5, lineHeight: 14, color: Colors.inkSub },
  latestN: { fontFamily: Font.body900, fontSize: 13, lineHeight: 18 },
  latestD: { fontFamily: Font.body700, fontSize: 10.5, lineHeight: 14, color: Colors.inkSub },
  latestEmpty: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderStyle: 'dashed', borderColor: '#C9C1B1', backgroundColor: '#EDE7DA', alignItems: 'center', justifyContent: 'center' },
  latestQ: { fontFamily: Font.display, fontSize: 15, lineHeight: 20, color: '#A39C8E' },
  latestNOff: { color: '#A39C8E' },
  track: { height: 12, borderRadius: 6, borderWidth: 1.5, borderColor: Colors.ink, backgroundColor: Colors.cream, overflow: 'hidden' },
  trackSm: { height: 8, borderRadius: 4, borderWidth: 1.5, borderColor: Colors.ink, backgroundColor: Colors.cream, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: Colors.yellow },
  sumHint: { fontFamily: Font.body800, fontSize: 12.5, lineHeight: 18, color: Colors.purple },
  nearList: { gap: 8 },
  near: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderWidth: 2, borderColor: Colors.ink, borderRadius: Radius.cardSm, backgroundColor: Colors.white },
  nearT: { flex: 1, minWidth: 0, gap: 5 },
  nearHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
  nearN: { flexShrink: 1, fontFamily: Font.body900, fontSize: 14, lineHeight: 20 },
  nearV: { fontFamily: Font.body800, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  nearL: { fontFamily: Font.body800, fontSize: 12, lineHeight: 17, color: Colors.purple },
  chev: { fontFamily: Font.body800, fontSize: 14.5, lineHeight: 21 },
  guide: { paddingHorizontal: 14, paddingVertical: 4, borderWidth: 2, borderColor: Colors.ink, borderRadius: Radius.card, backgroundColor: Colors.white },
  gRow: { flexDirection: 'row', gap: 12, paddingVertical: 12 },
  gLine: { borderTopWidth: 1.5, borderColor: Colors.line },
  gNo: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.ink, backgroundColor: Colors.yellow, alignItems: 'center', justifyContent: 'center' },
  gNoT: { fontFamily: Font.display, fontSize: 11.5, lineHeight: 15 },
  gText: { flex: 1, gap: 2 },
  gT: { fontFamily: Font.body900, fontSize: 14, lineHeight: 20 },
  gD: { fontFamily: Font.body600, fontSize: 12.5, lineHeight: 19, color: Colors.inkSub },
});
