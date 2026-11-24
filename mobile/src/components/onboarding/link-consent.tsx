import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { SheetButton, SheetDesc } from '@/components/common/sheet-parts';
import { Pressable } from '@/components/ui/pressable';
import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';

import { ERROR_RED, useFieldInvalid } from './parts';

/**
 * 연동 요청 동의 한 줄 (프로토타입 .agr): 가운데 정렬 · 작은 동그라미 체크 + '(필수) 지점에 정보 보내기 동의' + 밑줄 '보기'.
 * 아주 조용하게 두고, 처음부터 켜져 있어요. 줄을 누르면 켜고 끄기, '보기'를 누르면 동의 내용 시트가 올라와요.
 */
export function LinkConsent({ on, onChange, branch }: { on: boolean; onChange: (on: boolean) => void; branch: string }) {
  const [open, setOpen] = useState(false);
  // 끈 채로 보내려 하면 동그라미가 빨간 테두리 (useRequired · Field 가 알려 줘요)
  const invalid = useFieldInvalid();
  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => onChange(!on)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: on }}
        accessibilityLabel="(필수) 지점에 정보 보내기 동의"
        hitSlop={{ top: 10, bottom: 10, left: 8 }}
        style={({ pressed }) => [styles.toggle, pressed && styles.pressed]}>
        <View style={[styles.check, on && styles.checkOn, invalid && styles.checkInvalid]}>
          {on ? (
            <Svg width={10} height={10} viewBox="0 0 24 24">
              <Path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke={Colors.white} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          ) : null}
        </View>
        <PText style={styles.text}>(필수) 지점에 정보 보내기 동의</PText>
      </Pressable>
      <Pressable onPress={() => setOpen(true)} sound="soft" accessibilityRole="button" accessibilityLabel="지점에 정보 보내기 동의 내용 보기" hitSlop={{ top: 10, bottom: 10, left: 4, right: 10 }}>
        {({ pressed }) => <PText style={[styles.text, styles.view, pressed && styles.pressed]}>보기</PText>}
      </Pressable>
      <LinkConsentSheet
        open={open}
        branch={branch}
        onClose={() => setOpen(false)}
        onAgree={() => {
          onChange(true);
          setOpen(false);
        }}
      />
    </View>
  );
}

/** 동의 내용 (예시 문안 — 법무 확인 전). 받는 곳은 고른 지점 이름으로 보여 줘요 */
function LinkConsentSheet({ open, branch, onClose, onAgree }: { open: boolean; branch: string; onClose: () => void; onAgree: () => void }) {
  const rows: [string, string][] = [
    ['받는 곳', branch || '고른 지점'],
    ['보내는 정보', '이름 · 휴대폰 번호'],
    ['쓰는 곳', '지점 회원 정보와 맞춰 앱 계정을 연동해요'],
    ['보관 기간', '연동이 끝나거나 요청이 닫히면 지점에서 지워요'],
  ];
  return (
    <Sheet open={open} onClose={onClose} title="지점에 정보 보내기 동의" footer={<SheetButton label="동의하기" size="foot" onPress={onAgree} />}>
      <SheetDesc>연동 요청을 보내려면 고른 지점에 아래 정보를 보내야 해요.</SheetDesc>
      <View style={styles.table}>
        {rows.map(([k, v], i) => (
          <View key={k} style={[styles.tr, i > 0 && styles.trLine]}>
            <PText style={styles.th}>{k}</PText>
            <PText style={styles.td}>{v}</PText>
          </View>
        ))}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, minHeight: 28 },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  check: { width: 17, height: 17, borderRadius: 9, borderWidth: 1.5, borderColor: '#CFC6B2', backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: Colors.purple, borderColor: Colors.purple },
  checkInvalid: { borderWidth: 2, borderColor: ERROR_RED },
  text: { fontFamily: Font.body700, fontSize: 13, lineHeight: 18, color: Colors.inkSub },
  view: { marginLeft: 2, textDecorationLine: 'underline' },
  pressed: { opacity: 0.6 },
  table: { borderWidth: 2, borderColor: Colors.ink, borderRadius: 16, backgroundColor: Colors.white, overflow: 'hidden' },
  tr: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingVertical: 13 },
  trLine: { borderTopWidth: 1.5, borderColor: Colors.line },
  th: { width: 76, fontFamily: Font.body900, fontSize: 14, lineHeight: 20 },
  td: { flex: 1, fontFamily: Font.body700, fontSize: 14, lineHeight: 20, color: Colors.inkSub },
});
