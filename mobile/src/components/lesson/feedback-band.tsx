import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { FadeUp, SpeakerButton } from '@/components/lesson/lesson-ui';
import { Appear } from '@/components/ui/appear';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';

/**
 * 정답 · 오답 띠 (프로토타입 #lesson .ls-fb · .ls-react): 바탕 그대로 + 팔로(정답 노랑 · 오답 보라)가 통 튀어 오르고
 * 큰 글씨 리액션(정답 보라 · 오답 분홍) + 한국어 한 줄. 아래 버튼은 children 으로 받아 차례로 떠올라요(lsFbIn).
 * 레슨 A · B가 같이 써요. 담당: 레슨 A. props 는 바꾸지 않아요(늘리기만).
 * - kind: good 정답 · bad 오답 · retry 'Not quite! 한 번 더'
 * - say: 듣기 버튼 (소리 끄기면 숨어요). 같은 문장 스피커가 화면에 이미 있으면 넘기지 않아요(dedupeSay).
 */
export function FeedbackBand({
  kind,
  en,
  ko,
  soundOff = false,
  say,
  children,
}: {
  kind: 'good' | 'bad' | 'retry';
  en: string;
  ko: string;
  soundOff?: boolean;
  say?: () => void;
  children?: ReactNode;
}) {
  const good = kind === 'good';
  return (
    <View style={styles.wrap} accessibilityLiveRegion="polite" accessibilityLabel={`${en}. ${ko}`}>
      <FadeUp style={styles.row}>
        <Appear kind="reactHop">
          <Image source={good ? require('@/assets/characters/c-upright-yellow.png') : require('@/assets/characters/c-upright-purple.png')} style={styles.char} contentFit="contain" />
        </Appear>
        <View style={styles.t}>
          <PText style={styles.en} color={good ? Colors.purple : '#C2416B'}>
            {en}
          </PText>
          {ko ? (
            <PText style={styles.ko} color={Colors.inkSub}>
              {ko}
            </PText>
          ) : null}
        </View>
        {say && !soundOff ? <SpeakerButton onPress={say} /> : null}
      </FadeUp>
      {children ? (
        <FadeUp delay={70} style={styles.acts}>
          {children}
        </FadeUp>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12, paddingTop: 8 },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  char: { width: 88, height: 70, marginBottom: -2 },
  t: { flex: 1, minWidth: 0, paddingBottom: 2 },
  en: { fontFamily: Font.display, fontSize: 25, lineHeight: 30, letterSpacing: -0.4 },
  ko: { marginTop: 2, fontFamily: Font.body700, fontSize: 13, lineHeight: 19 },
  acts: { gap: 10 },
});
