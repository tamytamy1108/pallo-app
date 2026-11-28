import { Stack } from 'expo-router/js-stack';
import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Pressable } from '@/components/ui/pressable';
import { SCREEN } from '@/lib/transitions';
import { BottomBar } from '@/components/bottom-bar';
import { openChallenge, sayEn, unsave } from '@/components/my/expr-rows';
import { LgIcon, type IcName } from '@/components/my/icons';
import { Lift } from '@/components/my/lift';
import { PageTop } from '@/components/my/page-top';
import { Button } from '@/components/ui/button';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors, ScrollEnd } from '@/constants/theme';
import { sfx } from '@/lib/feedback';
import { exprCard, exprFrom, type ExpressionFrom, type SavedExpression } from '@/state/expressions';
import { apiErrorMessage } from '@/api/errors';
import { useMyExpressions } from '@/api/use-my-activity';
import { ErrorState, LoadingState } from '@/components/ui/state-view';
import { ChipScroll } from '@/components/ui/chip-scroll';

/** 나온 곳 4가지 (프로토타입 CH_SRC: 이름 · 아이콘) */
const SRC: Record<ExpressionFrom, readonly [string, IcName]> = { book: ['교재', 'book'], trip: ['상황', 'pin'], free: ['프리토킹', 'cmt'], listen: ['리스닝 룸', 'spk'] };
const PAGE = 6;
const norm = (s: string) => s.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9가-힣' ]/g, '');

/** 표현 카드 한 장 (프로토타입 .ch-card: 체크 · 핵심 표현 · 뜻 · 나온 곳 · 예문 — 고친 문장이 있으면 고친 문장 + '내 문장') */
function ExprCard({ x, on, onToggle, all }: { x: SavedExpression; on: boolean; onToggle: () => void; all: SavedExpression[] }) {
  const c = exprCard(x);
  const k = exprFrom(x);
  return (
    <Pressable onPress={onToggle} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={`${c.p} · ${c.m}`}>
      <Lift radius={14} x={0} y={3} shadow={on}>
        <View style={[styles.card, on && styles.cardOn]}>
          <View style={[styles.ck, on && styles.ckOn]}>{on && <LgIcon name="check" size={14} sw={3.4} />}</View>
          <View style={styles.tx}>
            <PText style={styles.p}>{c.p}</PText>
            {!!c.m && <PText style={styles.m}>{c.m}</PText>}
            <View style={styles.from}>
              <LgIcon name={SRC[k][1]} size={12} stroke={Colors.inkSub} />
              <PText style={styles.fromT} numberOfLines={1}>
                {x.source || SRC[k][0]}
              </PText>
            </View>
            <PText style={styles.ex}>{c.ex}</PText>
          </View>
          {c.mine && <PText style={styles.mine}>내 문장</PText>}
          <View style={styles.tools}>
            <Pressable onPress={() => sayEn(c.ex)} accessibilityRole="button" accessibilityLabel="듣기" hitSlop={6} style={styles.tool}>
              <LgIcon name="spk" size={16} stroke={Colors.purple} />
            </Pressable>
            <Pressable onPress={() => unsave(x, all)} accessibilityRole="button" accessibilityLabel="저장 취소" hitSlop={6} style={styles.tool}>
              <LgIcon name="save" size={16} fill={Colors.purple} stroke={Colors.purple} />
            </Pressable>
          </View>
        </View>
      </Lift>
    </Pressable>
  );
}

/**
 * 내 표현함 (프로토타입 내 활동 › 표현함 + 챌린지 열기의 표현 카드 목록 lgChalList).
 * 학습 중 저장한 표현 카드 · 7개부터 찾기 칸 · 나온 곳 칩 · 'n개 더 보기'. 1개 이상 고르면 아래 [챌린지 열기] → 챌린지 만들기.
 */
export default function ExpressionsScreen() {
  // GET /me/expressions (api/use-my-activity) — 찾기 · 나온 곳 칩은 받은 첫 쪽 안에서 거르고, 저장 취소는 아직 기기 상태
  const exprs = useMyExpressions();
  const all = exprs.list ?? [];
  const [sel, setSel] = useState<string[]>([]);
  const [q, setQ] = useState('');
  const [chip, setChip] = useState<'all' | ExpressionFrom>('all');
  const [more, setMore] = useState(false);

  const picked = sel.filter((id) => all.some((x) => x.id === id));
  const toggle = (id: string) => {
    sfx(picked.includes(id) ? 'tap' : 'pick');
    setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  const tools = all.length > PAGE;
  const kinds = (Object.keys(SRC) as ExpressionFrom[]).filter((k) => all.some((x) => exprFrom(x) === k));
  const nq = norm(q.trim());
  const match = (x: SavedExpression) => {
    if (chip !== 'all' && exprFrom(x) !== chip) return false;
    if (!nq) return true;
    const c = exprCard(x);
    return norm(`${c.p} ${c.ex}`).includes(nq) || (c.m || '').includes(q.trim());
  };
  // 고른 카드는 늘 위에 · 나머지는 거른 것만 (프로토타입 ord)
  const list = tools ? [...all.filter((x) => picked.includes(x.id)), ...all.filter((x) => !picked.includes(x.id) && match(x))] : all;
  const lim = !tools || more ? list.length : Math.max(PAGE, picked.length);

  return (
    <View style={styles.screen}>
      <Stack.Screen options={SCREEN.push} />
      <PageTop title="내 표현함" />
      <ScrollView automaticallyAdjustKeyboardInsets contentContainerStyle={[styles.body, { paddingBottom: ScrollEnd }]} keyboardShouldPersistTaps="handled">
        {tools && (
          <>
            <View style={styles.find}>
              <LgIcon name="search" size={16} />
              <TextInput
                value={q}
                onChangeText={(t) => {
                  setQ(t);
                  setMore(false);
                }}
                placeholder="표현 · 뜻으로 찾기"
                placeholderTextColor="#9A93A6"
                autoComplete="off"
                accessibilityLabel="내 표현함에서 찾기"
                style={styles.findIn}
              />
            </View>
            <ChipScroll horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {(['all', ...kinds] as const).map((k) => {
                const on = chip === k;
                const n = k === 'all' ? all.length : all.filter((x) => exprFrom(x) === k).length;
                return (
                  <Pressable
                    key={k}
                    onPress={() => {
                      setChip(k);
                      setMore(false);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    style={[styles.chip, on && styles.chipOn]}>
                    <PText style={[styles.chipT, on && styles.chipTOn]}>
                      {k === 'all' ? '전체' : SRC[k][0]} {n}
                    </PText>
                  </Pressable>
                );
              })}
            </ChipScroll>
          </>
        )}

        {exprs.isPending ? (
          <LoadingState />
        ) : exprs.isError ? (
          <ErrorState message={apiErrorMessage(exprs.error)} onRetry={() => exprs.refetch()} />
        ) : !all.length ? (
          <PText style={styles.empty}>{'아직 저장한 표현이 없어요.\n학습 중에 저장 버튼을 누르면\n여기서 불러올 수 있어요.'}</PText>
        ) : !list.length ? (
          <PText style={styles.empty}>‘{q}’에 맞는 표현이 없어요.</PText>
        ) : (
          <View style={styles.list}>
            {list.slice(0, lim).map((x) => (
              <ExprCard key={x.id} x={x} on={picked.includes(x.id)} onToggle={() => toggle(x.id)} all={all} />
            ))}
          </View>
        )}
        {list.length > lim && (
          <Pressable onPress={() => setMore(true)} accessibilityRole="button" style={styles.more}>
            <PText style={styles.moreT}>{list.length - lim}개 더 보기</PText>
          </Pressable>
        )}
      </ScrollView>
      <BottomBar>
        <Button
          label="챌린지 열기"
          wide
          disabled={!picked.length}
          onPress={() => {
            sfx('tap');
            openChallenge(picked);
          }}
        />
      </BottomBar>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.cream },
  body: { paddingTop: 8, paddingHorizontal: 16 },
  find: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, paddingHorizontal: 14, marginVertical: 8, borderWidth: 2, borderColor: Colors.ink, borderRadius: 22, backgroundColor: Colors.white },
  findIn: { flex: 1, minWidth: 0, fontFamily: Font.body700, fontSize: 14, color: Colors.ink, paddingVertical: 0 },
  chips: { gap: 6, marginBottom: 10 },
  chip: { height: 32, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1.5, borderColor: Colors.line, backgroundColor: Colors.white, justifyContent: 'center' },
  chipOn: { backgroundColor: Colors.ink, borderColor: Colors.ink },
  chipT: { fontFamily: Font.body800, fontSize: 12.5, lineHeight: 17 },
  chipTOn: { color: Colors.white },
  list: { gap: 8 },
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 11, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1.5, borderColor: '#E1D9C8', backgroundColor: Colors.white },
  cardOn: { borderWidth: 2, borderColor: Colors.ink, backgroundColor: '#FFF9D6' },
  ck: { width: 22, height: 22, marginTop: 1, borderRadius: 7, borderWidth: 2, borderColor: '#CFC7B6', alignItems: 'center', justifyContent: 'center' },
  ckOn: { backgroundColor: Colors.yellow, borderColor: Colors.ink },
  tx: { flex: 1, minWidth: 0, gap: 2, paddingRight: 58 },
  p: { fontFamily: Font.body900, fontSize: 15, lineHeight: 21 },
  m: { fontFamily: Font.body700, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  from: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  fromT: { flexShrink: 1, fontFamily: Font.body800, fontSize: 11.5, lineHeight: 16, color: Colors.inkSub },
  ex: { fontFamily: Font.body600, fontSize: 12.5, lineHeight: 18, color: '#8478B5' },
  mine: { position: 'absolute', right: 10, top: 10, fontFamily: Font.body900, fontSize: 10.5, lineHeight: 14, color: '#2E8B57', backgroundColor: '#E3F5EA', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2, overflow: 'hidden' },
  tools: { position: 'absolute', right: 6, bottom: 6, flexDirection: 'row' },
  tool: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  more: { height: 44, marginTop: 8, borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.line, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  moreT: { fontFamily: Font.body800, fontSize: 13.5, lineHeight: 19, color: Colors.inkSub },
  empty: { padding: 14, textAlign: 'center', fontFamily: Font.body700, fontSize: 14, lineHeight: 22, color: Colors.inkSub },
});
