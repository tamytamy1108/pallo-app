import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { Pressable } from '@/components/ui/pressable';
import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { BRANCH_REGIONS, BRANCHES } from '@/data/account';
import { sfx } from '@/lib/feedback';

/** 지점 이름은 늘 '…점'으로 (데이터에 '가산' · '대구동성로'처럼 섞여 있어요) */
const withJeom = (n: string) => (n.endsWith('점') ? n : `${n}점`);
const LIST = BRANCHES.map(([n, r]) => ({ name: withJeom(n), region: r }));
const TABS = ['전체', ...BRANCH_REGIONS] as const;


/**
 * 지점 목록 시트 (프로토타입 .bs): 제목 · 검색 · 권역 탭 · 권역별 묶음 카드. 고르면 닫혀요.
 * 전체 탭 옆에 지점이 모두 몇 곳인지 보여 줘요. (trial 은 예전 '이번 주 가능' 표시용 — 지금은 안 써요)
 */
export function BranchSheet({ open, onClose, title, value, onPick }: { open: boolean; onClose: () => void; title: string; value: string; onPick: (name: string) => void; trial?: boolean }) {
  return (
    <Sheet open={open} onClose={onClose} title={title} tall>
      <BranchPicker
        value={value}
        onPick={(name) => {
          onPick(name);
          onClose();
        }}
      />
    </Sheet>
  );
}

/**
 * 지점 고르기 본문 (검색 · 권역 탭 · 권역별 묶음 카드). 시트 안에 그대로 넣어 써요
 * — 가입 단계 · 앱 안 체험 예약(TrialForm)의 지점 시트(BranchSheet)가 써요.
 */
export function BranchPicker({ value, onPick }: { value: string | null; onPick: (name: string) => void }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>('전체');
  const [q, setQ] = useState('');
  const shown = LIST.filter((b) => (tab === '전체' || b.region === tab) && (!q || b.name.includes(q.trim())));
  const regions = BRANCH_REGIONS.filter((r) => shown.some((b) => b.region === r));
  return (
    <View style={styles.picker}>
      <View style={styles.search}>
        <Svg width={18} height={18} viewBox="0 0 24 24">
          <Circle cx={11} cy={11} r={6.5} fill="none" stroke={Colors.inkSub} strokeWidth={2.4} />
          <Path d="M16 16l4 4" stroke={Colors.inkSub} strokeWidth={2.4} strokeLinecap="round" />
        </Svg>
        <TextInput value={q} onChangeText={setQ} placeholder="지점 이름으로 찾기" placeholderTextColor="#A79F8F" style={styles.searchInput} accessibilityLabel="지점 이름으로 찾기" />
      </View>
      <View style={styles.seg} accessibilityRole="tablist">
        {TABS.map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} accessibilityRole="tab" accessibilityState={{ selected: tab === t }} style={[styles.segItem, tab === t && styles.segOn]}>
            <PText style={[styles.segText, tab === t && styles.segTextOn]}>
              {t}
              {t === '전체' ? <PText style={[styles.segCount, tab === t && styles.segTextOn]}> {LIST.length}</PText> : null}
            </PText>
          </Pressable>
        ))}
      </View>
      {regions.length === 0 ? <PText style={styles.empty}>찾는 지점이 없어요</PText> : null}
      {regions.map((r) => {
        const rows = shown.filter((b) => b.region === r);
        return (
          <View key={r}>
            <View style={styles.reg}>
              <PText style={styles.regName}>{r}</PText>
              <PText style={styles.regCount}>{rows.length}곳</PText>
            </View>
            <View style={styles.group}>
              {rows.map((b, i) => {
                const on = b.name === value;
                return (
                  <Pressable
                    key={b.name}
                    onPress={() => {
                      sfx('tap');
                      onPick(b.name);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={b.name}
                    style={({ pressed }) => [styles.row, i > 0 && styles.rowLine, on && styles.rowOn, pressed && styles.rowPressed]}>
                    <PText style={[styles.rowName, on && styles.rowNameOn]}>{b.name}</PText>
                    <View style={[styles.chk, on && styles.chkOn]}>
                      {on ? (
                        <Svg width={12} height={12} viewBox="0 0 24 24">
                          <Path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke={Colors.white} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
                        </Svg>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  // 시트 내용 칸 간격(12)과 같게
  picker: { gap: 12 },
  search: { height: 48, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, borderRadius: 14, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, boxShadow: '2px 2px 0 #1E1A2B' },
  searchInput: { flex: 1, height: '100%', fontFamily: Font.body700, fontSize: 15, color: Colors.ink },
  seg: { flexDirection: 'row', padding: 3, borderRadius: 14, backgroundColor: '#EFE8D8' },
  segItem: { flex: 1, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  segOn: { backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.ink },
  segText: { fontFamily: Font.body800, fontSize: 13.5, lineHeight: 18, color: Colors.inkSub },
  segTextOn: { fontFamily: Font.body900, color: Colors.ink },
  segCount: { fontFamily: Font.display, fontSize: 12, color: Colors.inkSub },
  empty: { marginTop: 20, textAlign: 'center', fontFamily: Font.body700, fontSize: 14, color: Colors.inkSub },
  reg: { flexDirection: 'row', alignItems: 'baseline', gap: 5, paddingTop: 6, paddingBottom: 6, paddingHorizontal: 4 },
  regName: { fontFamily: Font.body900, fontSize: 14, lineHeight: 19 },
  regCount: { fontFamily: Font.body700, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  group: { borderWidth: 2, borderColor: Colors.ink, borderRadius: 16, backgroundColor: Colors.white, overflow: 'hidden' },
  row: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 16, paddingRight: 14 },
  rowLine: { borderTopWidth: 1.5, borderColor: Colors.line },
  rowOn: { backgroundColor: Colors.lavender },
  rowPressed: { backgroundColor: '#F6F1E4' },
  rowName: { flex: 1, fontFamily: Font.body800, fontSize: 15.5, lineHeight: 21 },
  rowNameOn: { fontFamily: Font.body900, color: Colors.purple },
  chk: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#CFC6B2', alignItems: 'center', justifyContent: 'center' },
  chkOn: { backgroundColor: Colors.purple, borderColor: Colors.purple },
});
