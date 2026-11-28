import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { badgeProgress, useMyBadge } from '@/api/use-badges';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors, Radius } from '@/constants/theme';
import { BADGE_RULE, earnedDateLabel } from '@/data/badge-rules';
import type { Badge } from '@/data/my';
import { sfx } from '@/lib/feedback';

import { BadgeArt, badgeBg, BadgeIc } from './my-blocks';

/** 배지 상세를 열 때 넘기는 것 — 칸에서 누른 배지 · 그 칸 색 순서 */
export type BadgeOpen = { badge: Badge; colorIndex: number };

/**
 * 배지 상세 시트 — 칸을 누르면 떠요 (마이 탭 배지 칸 · 배지 모두 보기).
 * 큰 배지 그림 → 받았는지(받은 날) → 받는 방법(조건 한 줄 · 진행 막대 · 남은 만큼) → 세는 법 → [하러 가기].
 * 조건 · 진행은 배지 모두 보기(GET /me/badges)에서 찾아요. 서버가 아직 조건을 안 주면 설명 글만 보여요.
 */
export function BadgeDetailSheet({ open, onClose }: { open: BadgeOpen | null; onClose: () => void }) {
  const { badge } = useMyBadge(open?.badge.code ?? null, open?.badge ?? null);
  // 하러 가기는 시트가 다 닫힌 뒤에 옮겨요 (시트가 열린 채 다음 화면이 쌓이지 않게)
  const [go, setGo] = useState<Href | null>(null);
  const b = badge;
  const rule = b?.cond ? BADGE_RULE[b.cond.type] : null;
  const prog = b ? badgeProgress(b) : null;
  const pending = !!b && !b.on && !!b.cond && b.cond.progress == null && !rule?.lowerIsBetter;

  const leave = (to: Href) => {
    sfx('nav');
    setGo(to);
    onClose();
  };

  return (
    <Sheet
      open={!!open}
      onClose={onClose}
      onClosed={() => {
        if (go) router.push(go);
        setGo(null);
      }}
      label={b ? `${b.name} 배지` : '배지'}
      footer={
        b && rule && !b.on ? (
          <View>
            <Button label={rule.go.label} wide onPress={() => leave(rule.go.href)} />
          </View>
        ) : (
          <View>
            <Button label="확인" variant="secondary" wide onPress={onClose} />
          </View>
        )
      }>
      {b && open ? (
        <>
          <View style={styles.top}>
            <BadgeArt b={b} bg={badgeBg(open.colorIndex)} size={120} iconSize={50} />
            <PText style={styles.name} accessibilityRole="header">
              {b.name}
            </PText>
            <View style={[styles.state, b.on ? styles.stateOn : styles.stateOff]}>
              <PText style={[styles.stateT, !b.on && styles.stateTOff]}>{b.on ? (b.earnedAt ? `${earnedDateLabel(b.earnedAt)}에 받았어요` : '받았어요') : '아직 못 받았어요'}</PText>
            </View>
            <PText style={styles.desc}>{b.desc}</PText>
          </View>

          {rule && b.cond ? (
            <View style={styles.card}>
              <View style={styles.kindRow}>
                <View style={styles.kindIc}>
                  <BadgeIc ic={rule.ic} size={15} color={Colors.purple} />
                </View>
                <PText style={styles.kind}>받는 방법 · {rule.kind}</PText>
              </View>
              <PText style={styles.how}>{rule.how(b.cond.threshold)}</PText>

              {prog ? (
                <View style={styles.progWrap}>
                  <View style={styles.progHead}>
                    <PText style={styles.progNow}>
                      {prog.cur}
                      <PText style={styles.progNeed}>
                        {' '}
                        / {prog.need}
                        {rule.unit}
                      </PText>
                    </PText>
                    <PText style={styles.progPct}>{Math.round(prog.ratio * 100)}%</PText>
                  </View>
                  <View style={styles.track} accessible accessibilityRole="progressbar" accessibilityLabel={`${prog.need}${rule.unit} 중 ${prog.cur}${rule.unit}`} accessibilityValue={{ min: 0, max: prog.need, now: prog.cur }}>
                    <View style={[styles.fill, { width: `${Math.max(prog.ratio * 100, prog.cur > 0 ? 6 : 0)}%` }]} />
                  </View>
                  <PText style={styles.left}>{b.on ? '기준을 채웠어요' : rule.left(prog.left)}</PText>
                </View>
              ) : rule.lowerIsBetter && b.cond.progress != null && !b.on ? (
                <PText style={styles.left}>{`지난주 내 순위는 ${b.cond.progress}위였어요`}</PText>
              ) : pending ? (
                <PText style={styles.left}>진행은 곧 여기서 볼 수 있어요</PText>
              ) : null}

              <View style={styles.notes}>
                {rule.notes.map((n) => (
                  <View key={n} style={styles.note}>
                    <PText style={styles.dot}>·</PText>
                    <PText style={styles.noteT}>{n}</PText>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.card}>
              <PText style={styles.kind}>받는 방법</PText>
              <PText style={styles.how}>{b.desc}</PText>
              <PText style={styles.left}>기준을 채우면 저절로 들어와요</PText>
            </View>
          )}
        </>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  top: { alignItems: 'center', gap: 8, paddingTop: 4 },
  name: { marginTop: 4, fontFamily: Font.display, fontSize: 20, lineHeight: 26, textAlign: 'center' },
  state: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, borderWidth: 1.5 },
  stateOn: { backgroundColor: Colors.yellow, borderColor: Colors.ink },
  stateOff: { backgroundColor: '#EDE7DA', borderColor: '#C9C1B1' },
  stateT: { fontFamily: Font.body900, fontSize: 12, lineHeight: 17 },
  stateTOff: { color: Colors.inkSub },
  desc: { fontFamily: Font.body700, fontSize: 13.5, lineHeight: 20, color: Colors.inkSub, textAlign: 'center' },
  card: { marginTop: 6, gap: 8, padding: 16, borderWidth: 2, borderColor: Colors.ink, borderRadius: Radius.cardSm, backgroundColor: Colors.white },
  kindRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  kindIc: { width: 24, height: 24, borderRadius: 8, backgroundColor: Colors.lavender, alignItems: 'center', justifyContent: 'center' },
  kind: { fontFamily: Font.body800, fontSize: 12, lineHeight: 17, color: Colors.purple },
  how: { fontFamily: Font.body900, fontSize: 16, lineHeight: 23 },
  progWrap: { gap: 6, marginTop: 2 },
  progHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  progNow: { fontFamily: Font.display, fontSize: 20, lineHeight: 26 },
  progNeed: { fontFamily: Font.body800, fontSize: 13, lineHeight: 19, color: Colors.inkSub },
  progPct: { fontFamily: Font.body800, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  track: { height: 12, borderRadius: 6, borderWidth: 1.5, borderColor: Colors.ink, backgroundColor: Colors.cream, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: Colors.yellow, borderRightWidth: 1.5, borderColor: Colors.ink },
  left: { fontFamily: Font.body800, fontSize: 13, lineHeight: 19, color: Colors.purple },
  notes: { gap: 3, marginTop: 4, paddingTop: 10, borderTopWidth: 1.5, borderColor: Colors.line },
  note: { flexDirection: 'row', gap: 6 },
  dot: { fontFamily: Font.body900, fontSize: 12.5, lineHeight: 19, color: Colors.inkSub },
  noteT: { flex: 1, fontFamily: Font.body600, fontSize: 12.5, lineHeight: 19, color: Colors.inkSub },
});
