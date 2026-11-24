import { Children, type ReactNode } from 'react';
import { StyleSheet, View, type TextStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Appear } from '@/components/ui/appear';
import { Pressable } from '@/components/ui/pressable';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import type { StudyLang } from '@/state/me';

import { Pop, useEntranceDelay } from './fx-motion';
import { FieldShell } from './parts';

/**
 * 앱으로만 길(희망 언어 · 배우고 싶은 이유) 부품 — 프로토타입 onboarding-options.html #dest-lang(.lcs/.lc) · #a-why(.mvs/.mv).
 * 배우고 싶은 이유 목록은 체험 예약 화면도 같이 써요.
 */

/** 배우고 싶은 이유 (docs/pages/09-onboarding.md 가입 단계 표). 체험은 상담 때 참고, 앱으로만은 첫 주제를 고를 때 써요 */
export const WHY_REASONS = ['여행 가서 말하기', '일 · 이직', '유학 · 워홀 · 이민', '시험 · 자격증', '외국인 친구', '새 취미', '말하기 자신감', '기타'] as const;

/** 고르는 언어 4개: 이름 · 인사말(그 언어 색) · 태그 글자 */
export const ONB_LANGS: { key: StudyLang; ko: string; hello: string; helloFont: TextStyle; color: string; tag: string; tagInk: string }[] = [
  { key: 'en', ko: '영어', hello: 'Hello', helloFont: { fontFamily: Font.display }, color: Colors.langEn, tag: 'EN', tagInk: Colors.white },
  { key: 'ja', ko: '일본어', hello: 'こんにちは', helloFont: { fontFamily: Font.body900 }, color: Colors.langJa, tag: 'JA', tagInk: Colors.ink },
  // Noto Sans KR 에는 你 가 없어서 기기 글꼴로 섞여 보였어요 → 你好 두 글자만 담은 Noto Sans SC 900 (Dela 는 너무 두꺼워 획이 뭉개졌어요)
  { key: 'zh', ko: '중국어', hello: '你好', helloFont: { fontFamily: Font.zhHello }, color: Colors.langZh, tag: 'ZH', tagInk: Colors.white },
  { key: 'es', ko: '스페인어', hello: '¡Hola!', helloFont: { fontFamily: Font.display }, color: Colors.langEs, tag: 'ES', tagInk: Colors.ink },
];

/** 체크 동그라미 (.mv i · .lc i): 고르면 보라 바탕 + 흰 체크. 켜지는 순간 톡 튀어요 */
function CheckDot({ on }: { on: boolean }) {
  return (
    <Pop trigger={on} fire={on} peak={1.28}>
      <View style={[styles.dot, on && styles.dotOn]}>
        {on ? (
          <Svg width={12} height={12} viewBox="0 0 24 24">
            <Path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke={Colors.white} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        ) : null}
      </View>
    </Pop>
  );
}

/** 이유 카드 (.mv): 왼쪽 체크 동그라미 + 글 */
export function ReasonCard({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <View style={styles.reasonCell}>
      <Pressable
        sound="pick"
        onPress={onPress}
        accessibilityRole="checkbox"
        accessibilityLabel={label}
        accessibilityState={{ checked: on }}
        style={({ pressed }) => [styles.reason, on && styles.reasonOn, pressed && styles.pressed]}>
        <CheckDot on={on} />
        <PText style={[styles.reasonText, on && styles.reasonTextOn]}>{label}</PText>
      </Pressable>
    </View>
  );
}

/**
 * 카드 두 줄 격자 (.lcs · .mvs). 화면에 들어올 때 카드가 하나씩 차례로 올라와요.
 * name 을 주면 꼭 골라야 하는 칸이에요 (useRequired): 안 고르고 넘어가려 하면 격자가 흔들리고 아래에 안내 한 줄.
 */
export function CardGrid({ children, label, name }: { children: ReactNode; label: string; name?: string }) {
  const start = useEntranceDelay();
  return (
    <FieldShell name={name}>
      <View style={styles.grid} accessibilityLabel={label}>
        {Children.toArray(children).map((child, i) => (
          <Appear key={i} kind="rise" delay={start + i * CARD_STEP} style={styles.cell}>
            {child}
          </Appear>
        ))}
      </View>
    </FieldShell>
  );
}
CardGrid.ownsEntrance = true as const;

const CARD_STEP = 45;

const styles = StyleSheet.create({
  dot: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#CFC6B2', backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  dotOn: { backgroundColor: Colors.purple, borderColor: Colors.purple },
  grid: { marginTop: 18, flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 },
  cell: { width: '50%' },
  reasonCell: { padding: 4 },
  reason: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 10, paddingLeft: 11, paddingRight: 10, borderRadius: 14, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white },
  reasonOn: { backgroundColor: Colors.lavender, borderColor: Colors.purple },
  reasonText: { flex: 1, fontFamily: Font.body800, fontSize: 14.5, lineHeight: 19 },
  reasonTextOn: { fontFamily: Font.body900, color: Colors.purple },
  pressed: { opacity: 0.85 },
});
