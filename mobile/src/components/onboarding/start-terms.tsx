import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Pressable } from '@/components/ui/pressable';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';

import { Pop } from './fx-motion';
import { SparkBurst } from './fx-spark';

/** 시안 #ok 체크 표시 */
function Tick({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke={color} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** 동그란 체크 칸 (.chk · .chk.on): 켜지면 보라 바탕 + 흰 체크. 켜지는 순간 톡 튀고 스파크가 터져요 */
export function TermsCheck({ on }: { on: boolean }) {
  return (
    <View>
      <Pop trigger={on} fire={on} peak={1.32} duration={520}>
        <View style={[styles.chk, on && styles.chkOn]}>{on ? <Tick size={15} color={Colors.white} /> : null}</View>
      </Pop>
      <SparkBurst trigger={on} fire={on} count={6} radius={26} size={10} style={styles.burst} />
    </View>
  );
}

/**
 * 약관 한 줄: 체크 · [필수]/[선택] 표 · 이름 · (전문이 있으면) 오른쪽 › 보기.
 * 줄을 누르면 켜고 끄고, › 는 따로 눌러 전문을 봐요.
 */
export function TermsRow({ label, required, on, onToggle, onOpen }: { label: string; required: boolean; on: boolean; onToggle: () => void; onOpen?: () => void }) {
  const tag = required ? '필수' : '선택';
  return (
    <View style={styles.row}>
      <Pressable
        style={styles.main}
        onPress={onToggle}
        accessibilityRole="checkbox"
        accessibilityLabel={`[${tag}] ${label}`}
        accessibilityState={{ checked: on }}
        hitSlop={{ top: 2, bottom: 2 }}>
        {({ pressed }) => (
          <View style={[styles.mainIn, pressed && styles.pressed]}>
            <Tick size={20} color={on ? Colors.purple : '#C9C1B0'} />
            <View style={[styles.tag, required ? styles.tagReq : styles.tagOpt]}>
              <PText style={[styles.tagText, { color: required ? Colors.purple : Colors.inkSub }]}>{tag}</PText>
            </View>
            <PText style={styles.label} numberOfLines={1}>
              {label}
            </PText>
          </View>
        )}
      </Pressable>
      {onOpen ? (
        <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel={`${label} 전문 보기`} style={({ pressed }) => [styles.open, pressed && styles.pressed]}>
          <Svg width={16} height={16} viewBox="0 0 24 24">
            <Path d="M9 5l7 7-7 7" fill="none" stroke={Colors.inkSub} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chk: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  burst: { left: 13, top: 13 },
  chkOn: { backgroundColor: Colors.purple, borderColor: Colors.purple },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 46 },
  main: { flex: 1, alignSelf: 'stretch' },
  mainIn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11 },
  tag: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 },
  tagReq: { backgroundColor: Colors.lavender },
  tagOpt: { backgroundColor: '#F0EBDF' },
  tagText: { fontFamily: Font.body900, fontSize: 12, lineHeight: 17 },
  label: { flexShrink: 1, fontFamily: Font.body700, fontSize: 15, lineHeight: 21 },
  open: { width: 44, height: 44, marginRight: -12, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.6 },
});
