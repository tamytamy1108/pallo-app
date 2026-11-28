import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { Pressable } from '@/components/ui/pressable';
import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { BranchMultiPicker, withJeom } from '@/components/onboarding/branch-list';
import { useLoungeBranches } from '@/api/use-lounge-branches';
import { useMe } from '@/state/me';

import { LgIcon } from './icons';
import { LgButton } from './lg-button';

/** value 를 지점 목록으로: '전체' → [] · '가산' → ['가산'] · '가산,연신내' → 두 곳 */
export const branchList = (value: string) => (value === '전체' || !value ? [] : value.split(','));
/** 지점 목록을 value 로 (아무것도 안 고르면 '전체' — 모두 고른 건 시트가 적용할 때 '전체'로 바꿔요) */
export const branchValue = (brs: string[]) => (!brs.length ? '전체' : brs.join(','));
/**
 * 이 글 · 모임이 고른 지점에 맞는지 (프로토타입 lgBrOk). 지점 글자에 고른 지점이 들어 있으면 보여요.
 * '전 지점' 행사와 지점이 없는 글은 늘 보여요. 두 지점을 다니는 멤버('영등포 · 연신내')는 하나만 맞아도 보여요.
 */
export function branchMatches(value: string, br: string | undefined) {
  const brs = branchList(value);
  if (!brs.length) return true;
  const b = br ?? '';
  if (!b || b.includes('전 지점')) return true;
  // 서버 지점 이름은 '가산점', 예시 데이터는 '가산' 처럼 섞여 있어요 — 끝의 '점'은 빼고 견줘요
  return brs.some((x) => b.includes(x.replace(/점$/, '')));
}

/**
 * 지점 선택 버튼 + 시트 ('전체 지점 ▾', docs/pages/04-lounge.md '지점 선택 시트' · 프로토타입 lgBrSheet). 라운지 · 이벤트 탭이 같이 써요.
 * value: '전체' 또는 지점 이름. 여러 곳을 고르면 '가산,연신내' 처럼 쉼표로 이어져요 → 거를 때는 branchMatches(value, p.br) 를 쓰세요.
 * 담당: 라운지. props 는 바꾸지 않아요(늘리기만).
 */
export function BranchSelect({ value, onChange, title = '어느 지점 글을 볼까요?' }: { value: string; onChange: (branch: string) => void; title?: string }) {
  const [open, setOpen] = useState(false);
  // 열 때마다 고른 지점을 새로 읽으려고 새로 그려요. 닫히는 움직임이 끝날 때까지는 남겨 둬요
  const [kept, setKept] = useState(false);
  const brs = branchList(value);
  const label = !brs.length ? '전체 지점' : brs.length === 1 ? withJeom(brs[0]) : `${withJeom(brs[0])} 외 ${brs.length - 1}`;
  return (
    <>
      <Pressable onPress={() => {
          setOpen(true);
          setKept(true);
        }} accessibilityRole="button" accessibilityLabel={`지점 선택 · ${label}`} hitSlop={7} style={({ pressed }) => [styles.br, brs.length > 0 && styles.brOn, pressed && styles.pressed]}>
        <LgIcon name="pin" size={13} sw={2.4} />
        <PText style={styles.brText}>{label} ▾</PText>
      </Pressable>
      {kept ? <BranchSheet open={open} title={title} initial={brs} onClose={() => setOpen(false)} onClosed={() => setKept(false)} onApply={(next) => onChange(branchValue(next))} /> : null}
    </>
  );
}
/**
 * 지점 고르기 시트 — 가입 단계 지점 고르기와 같은 모양(검색 · 권역 탭 · 권역별 카드)에 여러 곳 체크.
 * 맨 위 '전체 지점' · 권역마다 '모두 선택'. 처음엔 아무것도 안 골라진 채로 열려요 — 안 고르고 적용하면 전체 지점이에요.
 */
function BranchSheet({ open, title, initial, onClose, onClosed, onApply }: { open: boolean; title: string; initial: string[]; onClose: () => void; onClosed: () => void; onApply: (brs: string[]) => void }) {
  const me = useMe();
  // 지점은 서버 목록 (GET /branches · 라운지 · 이벤트 공통)
  const branches = useLoungeBranches();
  const total = branches.length;
  const [pick, setPick] = useState<string[]>(initial);
  const all = !pick.length || pick.length === total;
  const apply = () => {
    onApply(pick.length === total ? [] : pick);
    onClose();
  };
  return (
    <Sheet
      open={open}
      onClose={onClose}
      onClosed={onClosed}
      title={title}
      tall
      footer={<LgButton label={all ? '적용하기 · 전체 지점' : `적용하기 · ${pick.length}곳`} wide height={52} fontSize={15.5} onPress={apply} />}>
      <BranchMultiPicker selected={pick} onChange={setPick} allOption mine={me.branch.split(' · ')} branches={branches} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  br: { height: 30, borderRadius: 15, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 5 },
  brOn: { backgroundColor: Colors.yellow },
  brText: { fontFamily: Font.body900, fontSize: 12.5, lineHeight: 17 },
  pressed: { transform: [{ scale: 0.96 }] },
});
