import { StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Pressable } from '@/components/ui/pressable';
import { Colors } from '@/constants/theme';
import { copyTel, copyText, openSms, openTel } from '@/lib/open-out';

/*
 * 작은 네모 아이콘 버튼 (지점 안내 '주차 · 와이파이' 복사 버튼 모양): 28 × 28 · 둥글기 9 · 연한 베이지 바탕 · 보라 선 아이콘.
 * 복사 · 전화 · 문자는 앱 어디서나 이 버튼으로 통일해요 (2026-11-28).
 */

const ICON = {
  copy: 'M9 9h11v11H9zM5 15H4V4h11v1',
  tel: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2',
  sms: 'M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H10l-5 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM7.5 9.5h9M7.5 12.5h5.5',
} as const;

function IconSquare({ icon, label, onPress }: { icon: keyof typeof ICON; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={8} style={({ pressed }) => [styles.btn, pressed && styles.pressed]}>
      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={Colors.purple} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <Path d={ICON[icon]} />
      </Svg>
    </Pressable>
  );
}

/** 복사 (전화번호면 msg 없이 — '번호를 복사했어요 · 번호') */
export function CopyButton({ text, msg, label = '복사' }: { text: string; msg?: string; label?: string }) {
  return <IconSquare icon="copy" label={label} onPress={() => (msg ? copyText(text, msg) : copyTel(text))} />;
}

/** 전화 앱에 번호를 넣어 열어요 */
export function CallButton({ tel, label = '전화하기' }: { tel: string; label?: string }) {
  return <IconSquare icon="tel" label={label} onPress={() => openTel(tel)} />;
}

/** 문자 앱에 번호를 넣어 열어요 */
export function SmsButton({ tel, label = '문자 보내기' }: { tel: string; label?: string }) {
  return <IconSquare icon="sms" label={label} onPress={() => openSms(tel)} />;
}

const styles = StyleSheet.create({
  btn: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3EEE2' },
  pressed: { opacity: 0.7, transform: [{ scale: 0.94 }] },
});
