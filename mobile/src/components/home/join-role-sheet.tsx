import { StyleSheet, View } from 'react-native';

import { RoleTag } from '@/components/common/role-tag';
import { keepAll, SheetButton, SheetDesc } from '@/components/common/sheet-parts';
import { Pressable } from '@/components/ui/pressable';
import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { sfx } from '@/lib/feedback';

export type JoinRole = 'member' | 'pro';

/**
 * 프로 · 스텝이 테이블 QR 을 찍은 뒤 '어떻게 참여할까요?' (docs/pages/10-roles.md 3-1 · 지금 앱 메뉴 시트 모양).
 * 멤버 = 노랑, 프로 = 보라 (앱 PRO 글자와 같은 보라). 맡은 세션이면 프로가 위, 아니면 멤버가 위. 회원에게는 뜨지 않아요.
 */
export function JoinRoleSheet({ open, context, proFirst, onPick, onClose }: { open: boolean; context: string; proFirst: boolean; onPick: (role: JoinRole) => void; onClose: () => void }) {
  const rows: { role: JoinRole; label: string; sub: string }[] = [
    { role: 'member', label: '멤버로 참여', sub: '학생으로 들어가요 · 회원과 같은 출석 · 포인트' },
    { role: 'pro', label: '프로로 참여', sub: '이 세션을 맡아요 · 프로 출석에 들어가요' },
  ];
  if (proFirst) rows.reverse();
  return (
    <Sheet open={open} onClose={onClose} title="어떻게 참여할까요?">
      <SheetDesc>{context}</SheetDesc>
      <View style={styles.opts}>
        {rows.map((r, i) => (
          <Pressable
            key={r.role}
            onPress={() => {
              sfx('tap');
              onPick(r.role);
            }}
            accessibilityRole="button"
            accessibilityLabel={`${r.label}, ${r.sub}`}
            style={({ pressed }) => [styles.opt, i > 0 && styles.optLine, pressed && styles.optPressed]}>
            <View style={[styles.bar, r.role === 'pro' ? styles.barPro : styles.barMember]} />
            <View style={styles.optText}>
              <View style={styles.labelRow}>
                <PText style={styles.optLabel}>{r.label}</PText>
                {r.role === 'pro' ? <RoleTag kind="pro" /> : <MemberTag />}
              </View>
              <PText style={styles.optSub}>{r.sub}</PText>
            </View>
          </Pressable>
        ))}
      </View>
      <SheetButton label="취소" tone="white" size="inline" sound="back" onPress={onClose} />
    </Sheet>
  );
}

/** 멤버 글자 (RoleTag 와 같은 크기 · 노랑) */
export function MemberTag() {
  return (
    <View style={styles.tag} accessibilityLabel="MEMBER">
      <PText style={styles.tagT}>MEMBER</PText>
    </View>
  );
}

const styles = StyleSheet.create({
  // SheetOptions(.lg-opts) 와 같은 칸
  opts: { borderWidth: 2, borderColor: Colors.ink, borderRadius: 18, backgroundColor: Colors.white, overflow: 'hidden' },
  opt: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 60, paddingHorizontal: 14, paddingVertical: 8 },
  optLine: { borderTopWidth: 1.5, borderColor: Colors.line },
  optPressed: { backgroundColor: '#F7F3EA' },
  bar: { width: 6, alignSelf: 'stretch', borderRadius: 3 },
  barMember: { backgroundColor: Colors.yellow, borderWidth: 1.5, borderColor: Colors.ink },
  barPro: { backgroundColor: Colors.purple },
  optText: { flex: 1, minWidth: 0 },
  labelRow: { flexDirection: 'row', alignItems: 'center' },
  optLabel: { fontFamily: Font.body800, fontSize: 15, lineHeight: 15 * 1.45, ...keepAll },
  optSub: { marginTop: 2, fontFamily: Font.body600, fontSize: 12, lineHeight: 12 * 1.45, color: Colors.inkSub },
  tag: { height: 17, paddingHorizontal: 6, borderRadius: 9, justifyContent: 'center', marginLeft: 5, backgroundColor: Colors.yellow, borderWidth: 1.5, borderColor: Colors.ink },
  tagT: { fontFamily: Font.display, fontSize: 9, lineHeight: 12, letterSpacing: 0.3, color: Colors.ink },
});
