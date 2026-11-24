import { router, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Pressable } from '@/components/ui/pressable';
import { Raised } from '@/components/ui/raised';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors, Radius } from '@/constants/theme';
import { sfx } from '@/lib/feedback';
import { sayExpression } from '@/lib/say-expression';
import { removeExpression, restoreExpression, type SavedExpression } from '@/state/expressions';

import { LgIcon } from './icons';

/** 영어 문장 듣기 (프로토타입 lgSay · 0.92배) */
export const sayEn = (t: string) => sayExpression(t, { rate: 0.92 });

/** 표현함에서 빼기 + [되돌리기] (프로토타입 data-nbrm) */
export function unsave(x: SavedExpression, list: SavedExpression[]) {
  const at = list.findIndex((y) => y.en === x.en);
  removeExpression(x.en);
  sfx('tap');
  showToast('표현함에서 뺐어요', { label: '되돌리기', onPress: () => restoreExpression(x, at) });
}

/** 저장한 표현 하나로 챌린지 열기 (챌린지 담당 /challenge/new?expr=) */
export const openChallenge = (ids: string[]) => router.push(`/challenge/new?expr=${ids.map(encodeURIComponent).join(',')}` as Href);

/**
 * 내 표현함 줄 목록 (프로토타입 notesHTML .nb-list: 문장 · 뜻 · 듣기 · 챌린지 · 저장 표시).
 * 랭킹 · 퀘스트 화면 아래에 붙어요.
 */
export function ExprRows({ list }: { list: SavedExpression[] }) {
  if (!list.length) {
    return (
      <Raised radius={Radius.card}>
        <View style={styles.empty}>
          <PText style={styles.emptyB}>저장한 문장이 없어요</PText>
          <PText style={styles.emptyP}>홈의 ‘오늘의 한 문장’에서{'\n'}저장 버튼을 누르면 여기에 모여요.</PText>
        </View>
      </Raised>
    );
  }
  return (
    <Raised radius={Radius.card}>
      <View style={styles.list}>
        {list.map((x, i) => (
          <View key={x.id} style={[styles.row, i > 0 && styles.line]}>
            <View style={styles.tx}>
              <PText style={styles.b}>{x.fixed || x.en}</PText>
              <PText style={styles.s}>{x.ko}</PText>
            </View>
            <Pressable onPress={() => sayEn(x.fixed || x.en)} accessibilityRole="button" accessibilityLabel="듣기" style={styles.spk}>
              <LgIcon name="spk" size={16} stroke={Colors.purple} />
            </Pressable>
            <Pressable
              onPress={() => {
                sfx('tap');
                openChallenge([x.id]);
              }}
              accessibilityRole="button"
              accessibilityLabel="이 표현으로 챌린지 열기"
              style={styles.ch}>
              <LgIcon name="flame" size={14} />
              <PText style={styles.chT}>챌린지</PText>
            </Pressable>
            <Pressable onPress={() => unsave(x, list)} accessibilityRole="button" accessibilityLabel="저장 취소" accessibilityState={{ selected: true }} style={styles.mk}>
              <LgIcon name="save" size={17} fill={Colors.purple} stroke={Colors.purple} />
            </Pressable>
          </View>
        ))}
      </View>
    </Raised>
  );
}

const styles = StyleSheet.create({
  list: { paddingVertical: 4, paddingHorizontal: 16, borderWidth: 2, borderColor: Colors.ink, borderRadius: Radius.card, backgroundColor: Colors.white },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  line: { borderTopWidth: 1.5, borderColor: Colors.line },
  tx: { flex: 1, minWidth: 0, gap: 2 },
  b: { fontFamily: Font.body800, fontSize: 15, lineHeight: 21 },
  s: { fontFamily: Font.body700, fontSize: 12.5, lineHeight: 17.5, color: Colors.inkSub },
  spk: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  ch: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 30, paddingHorizontal: 10, borderRadius: 15, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.yellow },
  chT: { fontFamily: Font.body900, fontSize: 12, lineHeight: 16 },
  mk: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  empty: { padding: 22, alignItems: 'center', gap: 6, borderWidth: 2, borderColor: Colors.ink, borderRadius: Radius.card, backgroundColor: Colors.white },
  emptyB: { fontFamily: Font.body900, fontSize: 15, lineHeight: 21 },
  emptyP: { fontFamily: Font.body700, fontSize: 13, lineHeight: 19, color: Colors.inkSub, textAlign: 'center' },
});
