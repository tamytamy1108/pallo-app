/**
 * PRO'S NOTE 부품: 항목 → 표현 카드 변환 · 노트 한 줄 · 스터디 일기 카드.
 * 프로토타입 pnRow · pnDiaryHTML (.pn-row · .pn-dy). 항목 저장은 내 표현함(@/state/expressions)으로 가요.
 */
import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { GrowInput } from '@/components/ui/grow-input';
import { Pressable } from '@/components/ui/pressable';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { DIARY_EXAMPLES, DIARY_QUESTIONS, DIARY_STICKERS, PRO_NOTES, teamNameByNo, type Diary, type ProNote } from '@/data/account';
import { sfx } from '@/lib/feedback';
import type { SavedExpression } from '@/state/expressions';
import { ChipScroll } from '@/components/ui/chip-scroll';

import { Box, Icon, Lift } from './parts';
import { saveDiary, useNoteState } from './store';

export const PN_SOURCE = "PRO'S NOTE";

/** 노트 항목 → 표현 카드 (바로잡기는 '틀린 문장 → 고친 문장'을 나눠 고친 문장도 같이 저장) */
export function noteExpression(n: ProNote, i: number): Omit<SavedExpression, 'id' | 'savedAt'> {
  const [tag, title, desc] = n.items[i];
  const source = `${PN_SOURCE} · ${n.m}/${n.d} ${teamNameByNo(n.team)}`;
  if (tag === '바로잡기' && title.includes(' → ')) {
    const [from, to] = title.split(' → ');
    return { en: from, fixed: to, ko: desc, source };
  }
  return { en: title, ko: desc, source };
}

/** 저장한 PRO'S NOTE 항목 (저장한 순서 — 마지막이 최근) */
export function savedNoteItems(list: SavedExpression[]) {
  const all = PRO_NOTES.flatMap((n) => n.items.map((_, i) => ({ n, i, en: noteExpression(n, i).en })));
  return list
    .filter((x) => x.source.startsWith(PN_SOURCE))
    .slice()
    .sort((a, b) => a.savedAt - b.savedAt)
    .map((x) => all.find((a) => a.en === x.en))
    .filter((x): x is { n: ProNote; i: number; en: string } => !!x);
}

/** 노트 목록 한 줄 (프로토타입 .pn-row: 날짜 · 팀 · 프로 · NEW · 항목 미리 보기) */
export function NoteRow({ n, fresh, first, onPress }: { n: ProNote; fresh: boolean; first: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${n.m}월 ${n.d}일 ${n.pro} 프로 노트`} style={({ pressed }) => [styles.row, !first && styles.rowLine, pressed && styles.pressed]}>
      <View style={styles.dt}>
        <PText style={styles.dtS}>{`${n.m}월`}</PText>
        <PText style={styles.dtB}>{n.d}</PText>
        <PText style={styles.dtS}>{n.wd}</PText>
      </View>
      <View style={styles.tx}>
        <PText style={styles.h} numberOfLines={1}>
          {`${teamNameByNo(n.team)} · ${n.pro} 프로`}
          {fresh ? <PText style={styles.new}>{'  NEW'}</PText> : null}
        </PText>
        <PText style={styles.p} numberOfLines={1}>
          {n.items.map((x) => x[1]).join(' · ')}
        </PText>
      </View>
      <PText style={styles.chev}>›</PText>
    </Pressable>
  );
}

/** 그 노트의 일기 (내가 쓴 것 → 없으면 예시) */
export function useDiaryOf(id: string): Diary | null {
  const { diary } = useNoteState();
  return diary[id] ?? DIARY_EXAMPLES[id] ?? null;
}

const stamp = () => {
  const t = new Date();
  return `${t.getMonth() + 1}.${t.getDate()} ${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
};

/** 오늘의 스터디 일기: 잘한 것 스티커(여러 개) + 질문 하나 + 자유롭게 쓰기 · 나만 봐요 (프로토타입 pnDiaryHTML) */
export function DiaryCard({ n }: { n: ProNote }) {
  const saved = useDiaryOf(n.id);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Diary>(() => saved ?? { st: [], q: 0, t: '' });
  const ed = !saved?.at || editing;
  const d = ed ? draft : (saved ?? draft);
  const shown = ed ? DIARY_STICKERS : DIARY_STICKERS.filter(([k]) => d.st.includes(k));

  const toggleSticker = (k: string) => {
    const on = !draft.st.includes(k);
    sfx(on ? 'pick' : 'tap');
    setDraft({ ...draft, st: on ? [...draft.st, k] : draft.st.filter((x) => x !== k) });
  };
  const save = () => {
    if (!draft.t.trim() && !draft.st.length) {
      showToast('스티커를 고르거나 한 줄 써 주세요');
      return;
    }
    saveDiary(n.id, { ...draft, at: stamp() });
    setEditing(false);
    sfx('save');
    showToast('스터디 일기를 저장했어요 · 나만 볼 수 있어요');
  };

  return (
    <Box style={styles.dy}>
      <View style={styles.dyHd}>
        <Image source={require('@/assets/characters/c-upright-yellow.png')} style={styles.dyImg} contentFit="contain" />
        <View style={styles.flex}>
          <PText style={styles.dyB}>오늘의 스터디 일기</PText>
          <PText style={styles.dyS}>{`${n.m}.${n.d} ${n.wd} · ${teamNameByNo(n.team)}`}</PText>
        </View>
        <View style={styles.lk}>
          <Icon name="lock" size={12} color={Colors.purple} strokeWidth={2.8} />
          <PText style={styles.lkText}>나만</PText>
        </View>
      </View>
      <View style={styles.dyBd}>
        {shown.length ? (
          <ChipScroll horizontal showsHorizontalScrollIndicator={false} style={styles.sts} contentContainerStyle={styles.stsIn}>
            {shown.map(([k, l, p]) => {
              const on = d.st.includes(k);
              return (
                <Pressable key={k} disabled={!ed} onPress={() => toggleSticker(k)} accessibilityRole="button" accessibilityState={{ selected: on }} style={[styles.st, on && styles.stOn]}>
                  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={on ? Colors.ink : Colors.inkSub} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
                    <Path d={p} />
                  </Svg>
                  <PText style={[styles.stText, on && styles.stTextOn]}>{l}</PText>
                </Pressable>
              );
            })}
          </ChipScroll>
        ) : null}
        <View style={styles.q}>
          <PText style={styles.qText}>{DIARY_QUESTIONS[d.q % DIARY_QUESTIONS.length]}</PText>
        </View>
        {ed ? (
          <>
            <GrowInput
              value={draft.t}
              onChangeText={(t) => setDraft({ ...draft, t })}
              multiline
              placeholder="생각나는 대로 짧게 써요"
              placeholderTextColor="#9B94A6"
              accessibilityLabel="스터디 일기 쓰기"
              style={styles.ta}
            />
            <View style={styles.ft}>
              <Pressable
                onPress={() => {
                  sfx('tap');
                  setDraft({ ...draft, q: draft.q + 1 });
                }}
                accessibilityRole="button"
                hitSlop={8}>
                <PText style={styles.ch}>질문 바꾸기 ↻</PText>
              </Pressable>
              <Pressable onPress={save} accessibilityRole="button" style={styles.edit}>
                {({ pressed }) => (
                  <Lift radius={20} dx={0} dy={3} pressed={pressed}>
                    <View style={styles.sv}>
                      <PText style={styles.svText}>{saved?.at ? '고쳐서 저장' : '일기 저장'}</PText>
                    </View>
                  </Lift>
                )}
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <PText style={[styles.ta, styles.done]}>{d.t}</PText>
            <View style={styles.ft}>
              <PText style={styles.at}>{`${saved?.at ?? ''} 저장`}</PText>
              <Pressable
                onPress={() => {
                  sfx('tap');
                  setDraft(saved ?? draft);
                  setEditing(true);
                }}
                accessibilityRole="button"
                hitSlop={8}
                style={styles.edit}>
                <PText style={[styles.ch, styles.chOn]}>고치기</PText>
              </Pressable>
            </View>
          </>
        )}
      </View>
    </Box>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.7 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, paddingVertical: 10 },
  rowLine: { borderTopWidth: 1.5, borderColor: Colors.line },
  dt: { width: 44, alignItems: 'center' },
  dtS: { fontFamily: Font.body800, fontSize: 10.5, lineHeight: 12, color: Colors.inkSub },
  dtB: { fontFamily: Font.display, fontSize: 20, lineHeight: 22 },
  tx: { flex: 1, minWidth: 0, gap: 2 },
  h: { fontFamily: Font.body900, fontSize: 13.5, lineHeight: 19 },
  new: { fontFamily: Font.body900, fontSize: 11.5, color: '#D2477A' },
  p: { fontFamily: Font.body700, fontSize: 12.5, lineHeight: 18, color: Colors.inkSub },
  chev: { fontFamily: Font.body900, fontSize: 16, color: Colors.inkSub },
  dy: { marginTop: 16, marginBottom: 6, overflow: 'hidden' },
  dyHd: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 14, paddingHorizontal: 14, paddingBottom: 10 },
  dyImg: { width: 44, height: 28, marginTop: -6, marginBottom: -10 },
  dyB: { fontFamily: Font.body900, fontSize: 15, lineHeight: 21 },
  dyS: { fontFamily: Font.body800, fontSize: 11.5, lineHeight: 16, color: Colors.inkSub },
  lk: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  lkText: { fontFamily: Font.body900, fontSize: 11, lineHeight: 15, color: Colors.purple },
  dyBd: { paddingHorizontal: 14, paddingBottom: 14 },
  sts: { marginHorizontal: -14 },
  stsIn: { gap: 6, paddingHorizontal: 14, paddingVertical: 2 },
  st: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 32, paddingHorizontal: 11, borderRadius: 16, borderWidth: 1.5, borderColor: Colors.line, backgroundColor: Colors.white },
  stOn: { borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.yellow },
  stText: { fontFamily: Font.body800, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  stTextOn: { color: Colors.ink },
  q: { marginTop: 12, paddingVertical: 10, paddingHorizontal: 12, borderTopLeftRadius: 14, borderTopRightRadius: 14, borderBottomRightRadius: 14, borderBottomLeftRadius: 4, backgroundColor: '#F3EEFB' },
  qText: { fontFamily: Font.body900, fontSize: 13, lineHeight: 19, color: Colors.purple },
  ta: { marginTop: 8, padding: 12, minHeight: 92, borderRadius: 14, backgroundColor: Colors.cream, fontFamily: Font.body700, fontSize: 14, lineHeight: 22.4, color: Colors.ink, textAlignVertical: 'top' },
  done: { minHeight: 0 },
  ft: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
  ch: { paddingVertical: 4, fontFamily: Font.body800, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  chOn: { fontFamily: Font.body900, color: Colors.purple },
  edit: { marginLeft: 'auto' },
  at: { fontFamily: Font.body800, fontSize: 11.5, lineHeight: 16, color: Colors.inkSub },
  sv: { height: 40, paddingHorizontal: 18, borderRadius: 20, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.yellow, justifyContent: 'center' },
  svText: { fontFamily: Font.body900, fontSize: 13.5, lineHeight: 19 },
});
