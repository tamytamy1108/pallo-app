import { useEffect } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';

/** 닉네임 규칙 (정함 2026-11-24): 2~10자, 한글 · 영문 · 숫자만 */
export const NICKNAME_MIN = 2;
export const NICKNAME_MAX = 10;
const SHAPE = /^[가-힣a-zA-Z0-9]+$/;
/** 한글을 쓰는 중 (ㅅ → 서) 잠깐 보이는 낱자 */
const JAMO = /[ㄱ-ㆎ]/;

const ERROR = '#C2416B';

export type NickStatus = { tone: 'ok' | 'error' | 'wait'; text: string };

/** 글자 모양만 보고 문제를 알려 줘요. 괜찮으면 null — 서버(POST /onboarding)와 같은 규칙이고, 같은 닉네임은 여럿이 써도 돼요 */
export function checkNickname(name: string): NickStatus | null {
  if (!name) return { tone: 'wait', text: '2~10자 한글 · 영문 · 숫자로 써 주세요' };
  if (JAMO.test(name) && /^[가-힣a-zA-Z0-9ㄱ-ㆎ]+$/.test(name)) return { tone: 'wait', text: '글자를 끝까지 써 주세요' };
  if (!SHAPE.test(name)) return { tone: 'error', text: '한글 · 영문 · 숫자만 쓸 수 있어요' };
  const n = [...name].length;
  if (n < NICKNAME_MIN) return { tone: 'wait', text: `${NICKNAME_MIN}자 이상 써 주세요` };
  if (n > NICKNAME_MAX) return { tone: 'error', text: `${NICKNAME_MAX}자까지 쓸 수 있어요` };
  return null;
}

/** 입력하는 대로 규칙 확인 — 중복 확인은 하지 않아요 (서버가 같은 닉네임을 허용해요) */
export function useNicknameStatus(name: string): NickStatus {
  return checkNickname(name) ?? { tone: 'ok', text: '쓸 수 있는 닉네임이에요' };
}

/** 입력칸 아래 도움말 (.help): 왼쪽 확인 결과 · 오른쪽 글자 수 n/10 */
export function NickHelp({ status, count }: { status: NickStatus; count: number }) {
  const color = status.tone === 'ok' ? Colors.purple : status.tone === 'error' ? ERROR : Colors.inkSub;

  // iOS 화면 읽기: 확인이 끝나면 결과를 읽어 줘요 (안드로이드는 accessibilityLiveRegion)
  useEffect(() => {
    if (Platform.OS === 'ios' && status.tone !== 'wait') AccessibilityInfo.announceForAccessibility(status.text);
  }, [status.tone, status.text]);

  return (
    <View style={styles.row}>
      <View style={styles.msg} accessibilityLiveRegion="polite">
        {status.tone === 'ok' ? (
          <Svg width={15} height={15} viewBox="0 0 24 24">
            <Path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke={color} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        ) : status.tone === 'error' ? (
          <Svg width={15} height={15} viewBox="0 0 24 24">
            <Circle cx={12} cy={12} r={9.5} fill="none" stroke={color} strokeWidth={2.4} />
            <Path d="M12 7.5v5.5M12 16.6v.1" fill="none" stroke={color} strokeWidth={2.6} strokeLinecap="round" />
          </Svg>
        ) : null}
        <PText style={[styles.text, { color, fontFamily: status.tone === 'wait' ? Font.body700 : Font.body900 }]}>{status.text}</PText>
      </View>
      <PText style={styles.count} accessibilityLabel={`${NICKNAME_MAX}자 중 ${count}자`}>
        {count}/{NICKNAME_MAX}
      </PText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  msg: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5 },
  text: { flexShrink: 1, fontSize: 13.5, lineHeight: 19 },
  count: { fontFamily: Font.body800, fontSize: 13, lineHeight: 19, color: Colors.inkSub, fontVariant: ['tabular-nums'] },
});
