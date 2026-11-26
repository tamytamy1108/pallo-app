/*
 * 앱 안 지점 목록(data BRANCHES)으로 고르는 지점 시트 · 여러 곳 고르기 — 라운지 · 이벤트 지점 거르기, 이벤트 제안 진행 지점, 연기 · 지점 변경처럼
 * 아직 서버를 안 쓰는(목업) 화면용. 가입 · 체험 · 연동처럼 서버 지점(GET /branches)이 필요한 곳은 branch-sheet.tsx 의 BranchSheet · BranchPicker.
 */
import { useState, type ReactNode } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { Pressable } from '@/components/ui/pressable';
import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { BRANCH_REGIONS, BRANCHES } from '@/data/account';
import { sfx } from '@/lib/feedback';

/** 지점 이름은 늘 '…점'으로 보여요 (데이터에 '가산' · '대구동성로'처럼 섞여 있어요) */
export const withJeom = (n: string) => (n.endsWith('점') ? n : `${n}점`);
/** 지점 한 곳: key 는 데이터 이름 그대로(거르기 · 저장용), name 은 보이는 이름 */
const LIST = BRANCHES.map(([key, region]) => ({ key, name: withJeom(key), region }));
const ALL_KEYS = LIST.map((b) => b.key);
const TABS = ['전체', ...BRANCH_REGIONS] as const;
type Tab = (typeof TABS)[number];
type Branch = (typeof LIST)[number];

/** 같은 지점인지 ('가산' = '가산점') */
const same = (a: string, b: string) => withJeom(a) === withJeom(b);

/**
 * 지점 목록 시트 (프로토타입 .bs · 가입 단계의 '다니는 지점'): 제목 · 검색 · 권역 탭 · 권역별 묶음 카드. 하나 고르면 닫혀요.
 * raw: 데이터 이름 그대로('가산') 돌려줘요 — 기본은 보이는 이름('가산점', 가입 · 체험 예약이 저장하는 값).
 */
export function BranchListSheet({ open, onClose, title, value, onPick, raw = false }: { open: boolean; onClose: () => void; title: string; value: string; onPick: (name: string) => void; trial?: boolean; raw?: boolean }) {
  return (
    <Sheet open={open} onClose={onClose} title={title} tall>
      <BranchListPicker
        value={value}
        onPick={(b) => {
          onPick(raw ? b.key : b.name);
          onClose();
        }}
      />
    </Sheet>
  );
}

/**
 * 지점 하나 고르기 본문 (검색 · 권역 탭 · 권역별 묶음 카드).
 * 가입 단계 · 체험 예약 · 이벤트 제안(진행 지점) · 연기 · 팀 · 지점 변경이 같은 모양을 써요.
 */
export function BranchListPicker({ value, onPick }: { value: string | null; onPick: (b: Branch) => void }) {
  return (
    <PickerFrame
      // 고른 지점이 있는 권역 · 고른 지점을 먼저 (바꾸러 들어왔을 때 지금 값이 바로 보이게)
      sortKey={(b) => (value && same(b.key, value) ? 0 : 1)}
      row={(b, first) => {
        const on = !!value && same(b.key, value);
        return (
          <BranchRow
            key={b.key}
            b={b}
            first={first}
            on={on}
            role="radio"
            onPress={() => {
              sfx('tap');
              onPick(b);
            }}
          />
        );
      }}
    />
  );
}

type MultiProps = {
  /** 고른 지점 (데이터 이름 · '가산' 또는 '가산점' 둘 다 돼요) */
  selected: string[];
  onChange: (next: string[]) => void;
  /** 최대 몇 곳 (넘으면 먼저 고른 곳이 빠져요) · 없으면 제한 없음 */
  max?: number;
  /** 맨 위 '전체 지점' 칸 · 권역마다 '모두 선택' (라운지 · 이벤트 지점 거르기) */
  allOption?: boolean;
  /** '내 지점' 표시할 곳 */
  mine?: string[];
};

/**
 * 지점 여러 곳 고르기 본문 — BranchListPicker 와 같은 모양에 체크만 여러 개.
 * 라운지 · 이벤트 '어느 지점을 볼까요?'(allOption) · 설정 '내 지점'(max 2)이 써요. 돌려주는 이름은 데이터 이름 그대로.
 */
export function BranchMultiPicker({ selected, onChange, max, allOption = false, mine = [] }: MultiProps) {
  const keys = new Set(ALL_KEYS.filter((k) => selected.some((s) => same(k, s))));
  const has = (k: string) => keys.has(k);
  const emit = (next: Set<string>) => onChange(ALL_KEYS.filter((k) => next.has(k)));
  const setMany = (ks: string[], v: boolean) => {
    sfx('toggle');
    const next = new Set(keys);
    ks.forEach((k) => (v ? next.add(k) : next.delete(k)));
    emit(next);
  };
  const toggle = (k: string) => {
    sfx('tap');
    if (has(k)) {
      const next = new Set(keys);
      next.delete(k);
      return emit(next);
    }
    // 최대 수를 넘으면 먼저 고른 곳이 빠져요 (두 지점까지)
    const order = selected.filter((s) => ALL_KEYS.some((a) => same(a, s))).map((s) => ALL_KEYS.find((a) => same(a, s)) ?? s);
    const kept = max ? (max > 1 ? order.slice(-(max - 1)) : []) : order;
    onChange(ALL_KEYS.filter((a) => a === k || kept.includes(a)));
  };
  const allOn = ALL_KEYS.every(has);
  const isMine = (k: string) => mine.some((m) => same(k, m));
  return (
    <PickerFrame
      head={
        allOption ? (
          <View style={styles.group}>
            <Pressable
              onPress={() => setMany(ALL_KEYS, !allOn)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: allOn }}
              accessibilityLabel={`전체 지점 ${ALL_KEYS.length}곳`}
              style={({ pressed }) => [styles.row, allOn && styles.rowOn, pressed && styles.rowPressed]}>
              <PText style={[styles.rowName, allOn && styles.rowNameOn]}>전체 지점</PText>
              <PText style={styles.rowCount}>{ALL_KEYS.length}곳</PText>
              <Check on={allOn} />
            </Pressable>
          </View>
        ) : null
      }
      regionEnd={
        allOption
          ? (rows) => {
              const rOn = rows.every((b) => has(b.key));
              return (
                <Pressable onPress={() => setMany(rows.map((b) => b.key), !rOn)} accessibilityRole="button" hitSlop={8} style={styles.regAll}>
                  <PText style={styles.regAllT}>{rOn ? '모두 해제' : '모두 선택'}</PText>
                </Pressable>
              );
            }
          : undefined
      }
      // 내 지점이 있는 권역 · 내 지점을 먼저
      sortKey={(b) => (isMine(b.key) ? 0 : 1)}
      row={(b, first) => <BranchRow key={b.key} b={b} first={first} on={has(b.key)} mine={isMine(b.key)} role="checkbox" onPress={() => toggle(b.key)} />}
    />
  );
}

/** 검색 · 권역 탭 · 권역별 묶음 카드 틀 (하나 · 여러 개 고르기가 같이 써요) */
function PickerFrame({ head, row, regionEnd, sortKey }: { head?: ReactNode; row: (b: Branch, first: boolean) => ReactNode; regionEnd?: (rows: Branch[]) => ReactNode; sortKey?: (b: Branch) => number }) {
  const [tab, setTab] = useState<Tab>('전체');
  const [q, setQ] = useState('');
  const query = q.trim();
  const shown = LIST.filter((b) => (tab === '전체' || b.region === tab) && (!query || b.name.includes(query)));
  const order = (L: Branch[]) => (sortKey ? [...L].sort((a, b) => sortKey(a) - sortKey(b)) : L);
  const regions = [...BRANCH_REGIONS.filter((r) => shown.some((b) => b.region === r))].sort((a, b) =>
    sortKey ? Math.min(...shown.filter((x) => x.region === a).map(sortKey)) - Math.min(...shown.filter((x) => x.region === b).map(sortKey)) : 0,
  );
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
      {/* 검색 · 권역 탭으로 좁혔을 때는 '전체 지점' 칸을 숨겨요 (보이는 것만 고르는 것처럼 보이지 않게) */}
      {tab === '전체' && !query ? head : null}
      {regions.length === 0 ? <PText style={styles.empty}>찾는 지점이 없어요</PText> : null}
      {regions.map((r) => {
        const rows = order(shown.filter((b) => b.region === r));
        return (
          <View key={r}>
            <View style={styles.reg}>
              <PText style={styles.regName}>{r}</PText>
              <PText style={styles.regCount}>{rows.length}곳</PText>
              <View style={styles.sp} />
              {regionEnd ? regionEnd(rows) : null}
            </View>
            <View style={styles.group}>{rows.map((b, i) => row(b, i === 0))}</View>
          </View>
        );
      })}
    </View>
  );
}

function BranchRow({ b, first, on, mine, role, onPress }: { b: Branch; first: boolean; on: boolean; mine?: boolean; role: 'radio' | 'checkbox'; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={role}
      accessibilityState={role === 'radio' ? { selected: on } : { checked: on }}
      accessibilityLabel={mine ? `${b.name} · 내 지점` : b.name}
      style={({ pressed }) => [styles.row, !first && styles.rowLine, on && styles.rowOn, pressed && styles.rowPressed]}>
      <PText style={[styles.rowName, on && styles.rowNameOn]}>
        {b.name}
        {mine ? <PText style={styles.mine}>  내 지점</PText> : null}
      </PText>
      <Check on={on} />
    </Pressable>
  );
}

function Check({ on }: { on: boolean }) {
  return (
    <View style={[styles.chk, on && styles.chkOn]}>
      {on ? (
        <Svg width={12} height={12} viewBox="0 0 24 24">
          <Path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke={Colors.white} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // 시트 내용 칸 간격(12)과 같게
  picker: { gap: 12 },
  search: { height: 48, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, borderRadius: 14, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, boxShadow: '2px 2px 0 #1E1A2B' },
  // 웹: 브라우저 기본 포커스 테두리(주황)를 없애요 — 바깥 검색 상자가 이미 테두리를 그려요 ('auto' 외곽선은 굵기 0 이어도 그려져서 solid · 투명으로)
  searchInput: { flex: 1, height: '100%', paddingVertical: 0, includeFontPadding: false, fontFamily: Font.body700, fontSize: 15, color: Colors.ink, outlineStyle: 'solid', outlineWidth: 0, outlineColor: 'transparent' },
  seg: { flexDirection: 'row', padding: 3, borderRadius: 14, backgroundColor: '#EFE8D8' },
  segItem: { flex: 1, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  segOn: { backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.ink },
  segText: { fontFamily: Font.body800, fontSize: 13.5, lineHeight: 18, color: Colors.inkSub },
  segTextOn: { fontFamily: Font.body900, color: Colors.ink },
  segCount: { fontFamily: Font.display, fontSize: 12, color: Colors.inkSub },
  empty: { marginTop: 20, textAlign: 'center', fontFamily: Font.body700, fontSize: 14, color: Colors.inkSub },
  reg: { flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 32, paddingTop: 4, paddingBottom: 4, paddingHorizontal: 4 },
  regName: { fontFamily: Font.body900, fontSize: 14, lineHeight: 19 },
  regCount: { fontFamily: Font.body700, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  sp: { flex: 1 },
  regAll: { paddingVertical: 4, paddingHorizontal: 2 },
  regAllT: { fontFamily: Font.body800, fontSize: 12.5, lineHeight: 17, color: Colors.purple },
  group: { borderWidth: 2, borderColor: Colors.ink, borderRadius: 16, backgroundColor: Colors.white, overflow: 'hidden' },
  row: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 16, paddingRight: 14 },
  rowLine: { borderTopWidth: 1.5, borderColor: Colors.line },
  rowOn: { backgroundColor: Colors.lavender },
  rowPressed: { backgroundColor: '#F6F1E4' },
  rowName: { flex: 1, fontFamily: Font.body800, fontSize: 15.5, lineHeight: 21 },
  rowNameOn: { fontFamily: Font.body900, color: Colors.purple },
  rowCount: { fontFamily: Font.body700, fontSize: 12.5, lineHeight: 17, color: Colors.inkSub },
  mine: { fontFamily: Font.body800, fontSize: 12, color: Colors.purple },
  chk: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#CFC6B2', alignItems: 'center', justifyContent: 'center' },
  chkOn: { backgroundColor: Colors.purple, borderColor: Colors.purple },
});
