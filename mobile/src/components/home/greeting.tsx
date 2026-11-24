import { useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';

const BASE = 30;
const MIN = 20;
const HANGUL = /[ㄱ-ㆎ가-힣]/;
const JAPANESE = /[぀-ヿ㐀-鿿ｦ-ﾟ]/;
const RUNS = /([ㄱ-ㆎ가-힣]+|[぀-ヿ㐀-鿿ｦ-ﾟ]+)/;

/** 닉네임을 글자 종류별로 나눠 글꼴을 붙여요: 영문 · 숫자 Unbounded, 한글 Black Han Sans, 일본어 Dela Gothic One */
function NameRuns({ name, size }: { name: string; size: number }) {
  return (
    <Text style={{ fontSize: size, letterSpacing: -size / 30 }}>
      {name.split(RUNS).map((part, i) => {
        if (!part) return null;
        const font = HANGUL.test(part) ? Font.nameKo : JAPANESE.test(part) ? Font.nameJa : Font.display;
        const ls = font === Font.display ? -size / 30 : -size / 60;
        return (
          <Text key={i} style={{ fontFamily: font, letterSpacing: ls }}>
            {part}
          </Text>
        );
      })}
    </Text>
  );
}

/**
 * 홈 인사말 "Hey Tammy, / let's [talk!]" — talk! 은 노란 형광펜 상자.
 * 'Hey 이름,'은 늘 한 줄이에요. 폭을 넘치면 이름만 30px → 최소 20px 까지 줄여요 (한글 10자 ≈ 29.5px · 일본어 10자 ≈ 27.5px).
 */
export function Greeting({ name }: { name: string }) {
  const [box, setBox] = useState(0);
  const [full, setFull] = useState(0);
  const [fixed, setFixed] = useState(0);
  const w = (set: (n: number) => void) => (e: LayoutChangeEvent) => set(e.nativeEvent.layout.width);

  // 'Hey 이름,'을 30px 로 그렸을 때 폭(full)과 'Hey ,'만의 폭(fixed)을 재서, 이름이 남은 폭에 맞을 크기를 구해요
  const nameW = full - fixed;
  const room = box - fixed - 2;
  const size = box && nameW > 0 && nameW > room ? Math.max(MIN, Math.floor(((BASE * room) / nameW) * 2) / 2) : BASE;

  return (
    <View style={styles.greet} onLayout={w(setBox)} accessibilityRole="header" accessibilityLabel={`Hey ${name}, let’s talk!`}>
      <PText variant="display" numberOfLines={1}>
        Hey <NameRuns name={name} size={size} />,
      </PText>
      <View style={styles.row}>
        <PText variant="display">let’s </PText>
        <View style={styles.mark}>
          <PText variant="display">talk!</PText>
        </View>
      </View>

      {/* 재기 전용 (안 보여요) */}
      <View style={styles.measure} pointerEvents="none" aria-hidden>
        <View style={styles.measureRow}>
          <PText variant="display" onLayout={w(setFull)}>
            Hey <NameRuns name={name} size={BASE} />,
          </PText>
        </View>
        <View style={styles.measureRow}>
          <PText variant="display" onLayout={w(setFixed)}>
            Hey ,
          </PText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // 재기 전용 칸(폭 2000)이 화면 밖으로 삐져나가지 않게 잘라요
  greet: { marginTop: 6, marginHorizontal: 2, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center' },
  mark: { backgroundColor: Colors.yellow, borderWidth: 2, borderColor: Colors.ink, borderRadius: 8, paddingHorizontal: 6 },
  measure: { position: 'absolute', left: 0, top: 0, width: 2000, opacity: 0 },
  measureRow: { flexDirection: 'row', alignItems: 'flex-start' },
});
