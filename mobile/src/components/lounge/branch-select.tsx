import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { LG_BREG, LG_BRS } from '@/data/lounge';
import { useMe } from '@/state/me';

import { LgIcon } from './icons';
import { CheckBox, LgButton } from './lg-button';

/** value 를 지점 목록으로: '전체' → [] · '가산' → ['가산'] · '가산,연신내' → 두 곳 */
export const branchList = (value: string) => (value === '전체' || !value ? [] : value.split(','));
/** 지점 목록을 value 로 (아무것도 · 모두 고르면 '전체') */
export const branchValue = (brs: string[]) => (!brs.length || brs.length === LG_BRS.length ? '전체' : brs.join(','));
/**
 * 이 글 · 모임이 고른 지점에 맞는지 (프로토타입 lgBrOk). 지점 글자에 고른 지점이 들어 있으면 보여요.
 * '전 지점' 행사와 지점이 없는 글은 늘 보여요. 두 지점을 다니는 멤버('영등포 · 연신내')는 하나만 맞아도 보여요.
 */
export function branchMatches(value: string, br: string | undefined) {
  const brs = branchList(value);
  if (!brs.length) return true;
  const b = br ?? '';
  if (!b || b.includes('전 지점')) return true;
  return brs.some((x) => b.includes(x));
}

/**
 * 지점 선택 버튼 + 시트 ('전체 지점 ▾', docs/pages/04-lounge.md '지점 선택 시트' · 프로토타입 lgBrSheet). 라운지 · 이벤트 탭이 같이 써요.
 * value: '전체' 또는 지점 이름. 여러 곳을 고르면 '가산,연신내' 처럼 쉼표로 이어져요 → 거를 때는 branchMatches(value, p.br) 를 쓰세요.
 * 담당: 라운지. props 는 바꾸지 않아요(늘리기만).
 */
export function BranchSelect({ value, onChange }: { value: string; onChange: (branch: string) => void }) {
  const [open, setOpen] = useState(false);
  const brs = branchList(value);
  const label = !brs.length ? '전체 지점' : brs.length === 1 ? brs[0] : `${brs[0]} 외 ${brs.length - 1}`;
  return (
    <>
      <Pressable onPress={() => setOpen(true)} accessibilityRole="button" accessibilityLabel={`지점 선택 · ${label}`} hitSlop={7} style={({ pressed }) => [styles.br, brs.length > 0 && styles.brOn, pressed && styles.pressed]}>
        <LgIcon name="pin" size={13} sw={2.4} />
        <PText style={styles.brText}>{label} ▾</PText>
      </Pressable>
      {open ? <BranchSheet initial={brs} onClose={() => setOpen(false)} onApply={(next) => onChange(branchValue(next))} /> : null}
    </>
  );
}

/** 지점 고르기 시트: 전체 → 내 지점 권역 → 다른 권역. 전체를 누르면 모두 · 권역을 누르면 그 권역 모두 */
function BranchSheet({ initial, onClose, onApply }: { initial: string[]; onClose: () => void; onApply: (brs: string[]) => void }) {
  const me = useMe();
  const myB = me.branch.split(' · ');
  const [on, setOn] = useState<Set<string>>(() => new Set(initial.length ? initial : LG_BRS.map((x) => x[0])));
  const has = (b: string) => on.has(b);
  const set = (names: string[], v: boolean) =>
    setOn((prev) => {
      const next = new Set(prev);
      names.forEach((n) => (v ? next.add(n) : next.delete(n)));
      return next;
    });
  const all = LG_BRS.every((x) => has(x[0]));
  const mine = (r: string) => LG_BRS.some((x) => x[1] === r && myB.includes(x[0]));
  const regs = [...LG_BREG].sort((a, b) => Number(mine(b)) - Number(mine(a)));
  const apply = () => {
    const pick = LG_BRS.map((x) => x[0]).filter(has);
    onApply(pick.length === LG_BRS.length ? [] : pick);
    onClose();
  };
  return (
    <Sheet open onClose={onClose} title="어느 지점 글을 볼까요?" footer={<LgButton label="적용하기" wide height={52} fontSize={15.5} onPress={apply} />}>
      <PText style={styles.ds}>권역이나 지점을 여러 개 함께 고를 수 있어요. 전 지점 행사는 늘 보여요.</PText>
      <View style={styles.box} accessibilityRole="list">
        <Row
          kind="all"
          label="전체 지점"
          count={LG_BRS.length}
          on={all}
          onPress={() =>
            set(
              LG_BRS.map((x) => x[0]),
              !all,
            )
          }
        />
        {regs.map((r) => {
          const L = LG_BRS.filter((x) => x[1] === r).sort((a, b) => Number(myB.includes(b[0])) - Number(myB.includes(a[0])));
          const rOn = L.every((x) => has(x[0]));
          return (
            <View key={r}>
              <Row
                kind="rg"
                label={r}
                count={L.length}
                on={rOn}
                onPress={() =>
                  set(
                    L.map((x) => x[0]),
                    !rOn,
                  )
                }
              />
              {L.map(([b]) => (
                <Row key={b} kind="sub" label={b} mine={myB.includes(b)} on={has(b)} onPress={() => set([b], !has(b))} />
              ))}
            </View>
          );
        })}
      </View>
    </Sheet>
  );
}

function Row({ kind, label, count, on, mine, onPress }: { kind: 'all' | 'rg' | 'sub'; label: string; count?: number; on: boolean; mine?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={label} style={[styles.row, kind === 'rg' && styles.rg, kind === 'sub' && styles.sub]}>
      <CheckBox on={on} />
      <PText style={kind === 'sub' ? styles.subText : styles.rowText}>{label}</PText>
      {mine ? <PText style={styles.mine}>내 지점</PText> : null}
      <View style={styles.sp} />
      {count != null ? <PText style={styles.count}>{count}곳</PText> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  br: { height: 30, borderRadius: 15, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 5 },
  brOn: { backgroundColor: Colors.yellow },
  brText: { fontFamily: Font.body900, fontSize: 12.5, lineHeight: 17 },
  pressed: { transform: [{ scale: 0.96 }] },
  ds: { fontFamily: Font.body600, fontSize: 14, lineHeight: 22.4, color: Colors.inkSub },
  box: { backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.ink, borderRadius: 18, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 14, minHeight: 50 },
  rg: { backgroundColor: Colors.cream, borderTopWidth: 2, borderColor: Colors.ink },
  sub: { minHeight: 46, borderTopWidth: 1, borderColor: Colors.line },
  rowText: { fontFamily: Font.body900, fontSize: 14, lineHeight: 19.6 },
  subText: { fontFamily: Font.body700, fontSize: 13.5, lineHeight: 18.9 },
  mine: { fontFamily: Font.body700, fontSize: 12, lineHeight: 16.8, color: Colors.purple },
  sp: { flex: 1 },
  count: { fontFamily: Font.body700, fontSize: 12, lineHeight: 16.8, color: Colors.inkSub },
});
