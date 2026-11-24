import { StyleSheet, View } from 'react-native';

import { Pressable } from '@/components/ui/pressable';
import { runAfterSheetClose, Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { findChallenge, isExpr, meaningOf, planText, useChallengeState, type Challenge, type ChView } from '@/data/challenge';

import { openChallenge, SaveHeart } from './cards';
import { ChCover } from './cover';
import { SUB } from './parts';

/** 찜한 챌린지 (최근 찜한 게 위) — 없어진 챌린지는 빼요 */
export const savedChallenges = (s: ChView): Challenge[] =>
  Object.keys(s.saved)
    .reverse()
    .map((id) => findChallenge(s, id))
    .filter((p): p is Challenge => !!p);

export const useSavedChallengeCount = () => savedChallenges(useChallengeState()).length;

/** 마이 > 찜한 챌린지: 챌린지 카드 · 표현 창의 하트로 모아요. 누르면 그 챌린지로 */
export function SavedChallengesSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useChallengeState();
  const list = savedChallenges(s);
  const go = (p: Challenge) => {
    runAfterSheetClose(() => openChallenge(p));
    onClose();
  };
  return (
    <Sheet open={open} onClose={onClose} title={`찜한 챌린지 ${list.length}개`} label="찜한 챌린지">
      {list.length ? (
        list.map((p, i) => (
          <View key={p.id} style={[styles.row, i > 0 && styles.line]}>
            <Pressable onPress={() => go(p)} accessibilityRole="button" accessibilityLabel={`${isExpr(p) ? p.hl : p.name} 열기`} style={styles.main}>
              <ChCover p={p} size={42} style={styles.cover} />
              <View style={styles.tx}>
                <PText numberOfLines={1} style={styles.t}>
                  {isExpr(p) ? p.hl || p.name : p.name}
                </PText>
                <PText numberOfLines={1} style={styles.sub}>
                  {isExpr(p) ? `표현 챌린지 · ${meaningOf(p)}` : planText(p)}
                </PText>
              </View>
            </Pressable>
            <SaveHeart id={p.id} size={32} />
          </View>
        ))
      ) : (
        <PText style={styles.empty}>{'챌린지 카드의 하트를 누르면 여기 모여요.'}</PText>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  line: { borderTopWidth: 1.5, borderColor: Colors.line },
  main: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10 },
  cover: { width: 42, height: 42, borderRadius: 12, borderWidth: 2, borderColor: Colors.ink, alignItems: 'center', justifyContent: 'center' },
  tx: { flex: 1, minWidth: 0, gap: 2 },
  t: { fontFamily: Font.body900, fontSize: 14.5, lineHeight: 20 },
  sub: { fontFamily: Font.body700, fontSize: 12, lineHeight: 17, color: SUB },
  empty: { textAlign: 'center', paddingVertical: 30, paddingHorizontal: 10, fontFamily: Font.body700, fontSize: 14, lineHeight: 22, color: Colors.inkSub },
});
