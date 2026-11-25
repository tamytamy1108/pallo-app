import { StyleSheet, View } from 'react-native';

import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';

/**
 * 이름 옆 역할 글자 (docs/pages/10-roles.md 8장 · prototype/role-badge-options.html 확정안).
 * 프로 · 스텝은 어디서나, 호스트 · 코호스트는 그 모임 화면 · 그 모임 글에서만 붙여요.
 */
export type RoleKind = 'pro' | 'staff' | 'host' | 'co';

const LABEL: Record<RoleKind, string> = { pro: 'PRO', staff: 'STAFF', host: 'HOST', co: 'CO-HOST' };

/** 모임 안 역할 글자('호스트' · '코호스트' · '호스트 · 나')를 태그 종류로 */
export function meetRoleKind(t?: string): RoleKind | null {
  if (!t) return null;
  if (t.startsWith('코호스트')) return 'co';
  if (t.startsWith('호스트')) return 'host';
  return null;
}

export function RoleTag({ kind }: { kind: RoleKind }) {
  return (
    <View style={[styles.tag, styles[kind]]} accessibilityLabel={LABEL[kind]}>
      <PText style={[styles.t, kind === 'pro' && styles.tPro, kind === 'staff' && styles.tStaff]}>{LABEL[kind]}</PText>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: { height: 17, paddingHorizontal: 6, borderRadius: 9, justifyContent: 'center', marginLeft: 5 },
  pro: { backgroundColor: Colors.purple },
  staff: { backgroundColor: Colors.ink },
  host: { backgroundColor: Colors.yellow, borderWidth: 1.5, borderColor: Colors.ink },
  co: { backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.ink },
  t: { fontFamily: Font.display, fontSize: 9, lineHeight: 12, letterSpacing: 0.3, color: Colors.ink },
  tPro: { color: Colors.white },
  tStaff: { color: Colors.yellow },
});
