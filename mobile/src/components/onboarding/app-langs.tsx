import { Children, type ReactNode } from 'react';
import { StyleSheet, View, type TextStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Appear } from '@/components/ui/appear';
import { Pressable } from '@/components/ui/pressable';
import { Raised } from '@/components/ui/raised';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import type { StudyLang } from '@/state/me';

import { ONB_LANGS } from './app-parts';
import { Pop, useEntranceDelay } from './fx-motion';
import { ERROR_RED, FieldShell, useFieldInvalid } from './parts';
import { STAGE } from './start-stage';

/*
 * 희망 언어 화면 부품 (langs.tsx) · 시안 A 굵은 알약 (prototype/langs-options.html):
 * 흰 알약 · 잉크 테두리 2 · 딱딱한 그림자, 고르면 무대 분홍 바탕 · 잉크 체크.
 */

type OnbLang = (typeof ONB_LANGS)[number];

/** 언어마다: 쓰임 (화면 읽기용) · 인사말 글꼴 크기 */
const ROW: Record<StudyLang, { sub: string; helloSize: number }> = {
  en: { sub: '여행 · 비즈니스', helloSize: 19 },
  ja: { sub: '애니 · 여행', helloSize: 17 },
  zh: { sub: '비즈니스 · 여행', helloSize: 21 },
  es: { sub: '여행 · 라틴 문화', helloSize: 19 },
};

// 인사말 글꼴: 라틴은 Unbounded, 일본어는 Dela Gothic One, 중국어는 你好 전용 Noto Sans SC 900 (app-parts ONB_LANGS)
const helloFont = (lang: OnbLang): TextStyle => (lang.key === 'ja' ? { fontFamily: Font.nameJa } : lang.helloFont);

/**
 * 언어 한 줄 · 굵은 알약 (시안 A). 왼쪽 체크 → 한국어 이름 크게 → 오른쪽 끝에 그 언어 색 인사말.
 * 고르면 바탕이 무대 분홍, 체크가 잉크로 톡, 인사말은 잉크 (언어 색은 분홍 위에서 흐려요).
 */
export function LangRow({ lang, on, onPress }: { lang: OnbLang; on: boolean; onPress: () => void }) {
  const invalid = useFieldInvalid();
  const row = ROW[lang.key];
  return (
    <Pressable sound="pick" onPress={onPress} accessibilityRole="checkbox" accessibilityLabel={`${lang.ko}, ${row.sub}`} accessibilityState={{ checked: on }}>
      {({ pressed }) => (
        <Raised radius={RADIUS} pressed={pressed}>
          <View style={[styles.pill, on && styles.pillOn, invalid && styles.pillInvalid]}>
            <Pop trigger={on} fire={on} peak={1.25}>
              <View style={[styles.check, on && styles.checkOn]}>
                {on ? (
                  <Svg width={14} height={14} viewBox="0 0 24 24">
                    <Path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke={Colors.white} strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                ) : null}
              </View>
            </Pop>
            <PText style={styles.name} numberOfLines={1}>
              {lang.ko}
            </PText>
            <PText style={[helloFont(lang), { fontSize: row.helloSize, lineHeight: Math.round(row.helloSize * 1.3), color: on ? Colors.ink : lang.color }]} numberOfLines={1}>
              {lang.hello}
            </PText>
          </View>
        </Raised>
      )}
    </Pressable>
  );
}

/**
 * 언어 카드 목록 (한 줄씩 · 12 간격). 화면에 들어올 때 하나씩 차례로 올라와요.
 * name 을 주면 꼭 골라야 하는 칸이에요 (useRequired): 안 고르고 넘어가려 하면 흔들리고 아래에 안내 한 줄.
 */
export function LangList({ children, label, name }: { children: ReactNode; label: string; name?: string }) {
  const start = useEntranceDelay();
  return (
    <FieldShell name={name}>
      <View style={styles.list} accessibilityLabel={label}>
        {Children.toArray(children).map((child, i) => (
          <Appear key={i} kind="rise" delay={start + i * ROW_STEP}>
            {child}
          </Appear>
        ))}
      </View>
    </FieldShell>
  );
}
LangList.ownsEntrance = true as const;

const ROW_H = 66;
const RADIUS = ROW_H / 2;
const ROW_STEP = 55;

const styles = StyleSheet.create({
  list: { marginTop: 22, gap: 12 },
  pill: { height: ROW_H, flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 16, paddingRight: 20, borderRadius: RADIUS, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white },
  pillOn: { backgroundColor: STAGE.pink },
  pillInvalid: { borderColor: ERROR_RED },
  name: { flex: 1, fontFamily: Font.body900, fontSize: 18, lineHeight: 24 },
  check: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: '#CFC6B2', backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: Colors.ink, borderColor: Colors.ink },
});
