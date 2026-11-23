import { router, useLocalSearchParams, type Href } from 'expo-router';
import { Stack } from 'expo-router/js-stack';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { TopBar } from '@/components/ui/top-bar';
import { Pressable } from '@/components/ui/pressable';
import { SCREEN } from '@/lib/transitions';
import { BottomBar } from '@/components/bottom-bar';
import { MiniCover } from '@/components/library/unit-parts';
import { Raised } from '@/components/ui/raised';
import { EmptyState } from '@/components/ui/state-view';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { findBook } from '@/data/library';
import { sfx } from '@/lib/feedback';

/** 목차 미리 보기 (프로토타입 bookHTML — 1과만 미리 보기) */
const TOC_EN = ['Hello! · 인사하기', 'My Name Is · 내 소개', 'Numbers · 숫자 말하기', 'My Day · 하루 이야기'];
const TOC_JA = ['はじめまして · 처음 만나요', 'これは何ですか · 이건 뭐예요?', 'どこですか · 어디예요?', 'いくらですか · 얼마예요?'];

const back = () => (router.canGoBack() ? router.back() : router.replace('/library'));

/**
 * 교재 소개 (잠긴 교재 · 프로토타입 bookHTML): 표지 · 소개 · 목차(1과만 미리 보기) · [1과 미리 보기] [이 레벨 상담 신청 → 체험 신청]
 */
export default function BookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const b = findBook(id ?? '');
  const jp = !!b?.jp;
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={SCREEN.push} />
      <TopBar title={b ? `${b.l} 교재` : '교재'} onBack={back} />
      {!b ? (
        <EmptyState title="교재를 찾을 수 없어요" />
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.body}>
            <View style={styles.hero}>
              <Raised radius={8} style={styles.coverWrap}>
                <MiniCover width={110} color={b.c} n={b.n} l={b.l} s={b.s} jp={jp} />
              </Raised>
              <View style={styles.tx}>
                <PText style={styles.txB}>
                  {jp ? '일본어' : '영어'} {b.l.replace('レベル', 'Lv.')}
                </PText>
                <PText style={styles.txP}>{jp ? '히라가나부터 시작해 짧은 대화까지. 한 과에 30분 예습, 50분 세션.' : '알파벳 · 기초 표현부터. 처음 배우는 분을 위한 레벨이에요.'}</PText>
                <PText style={styles.txS}>20과 · 예습 · 본학습 · 복습</PText>
              </View>
            </View>
            <PText style={styles.h}>목차 미리 보기</PText>
            <Raised radius={22}>
              <View style={styles.log}>
                {(jp ? TOC_JA : TOC_EN).map((t, i) => (
                  <View key={t} style={[styles.r, i > 0 && styles.rLine]}>
                    <PText style={styles.d}>{i + 1}과</PText>
                    <PText style={styles.t}>{t}</PText>
                    {i ? (
                      <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={Colors.rosePink} strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round" accessibilityLabel="잠김">
                        <Path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z" />
                      </Svg>
                    ) : (
                      <PText style={styles.pre}>미리 보기</PText>
                    )}
                  </View>
                ))}
              </View>
            </Raised>
          </ScrollView>
          <BottomBar>
            <LgButton label="1과 미리 보기" white onPress={() => showToast('1과 미리 보기는 교재 데이터가 들어오면 열려요')} />
            <LgButton
              label="이 레벨 상담 신청"
              onPress={() => {
                sfx('tap');
                router.push(`/trial?lang=${jp ? 'ja' : 'en'}` as Href);
              }}
            />
          </BottomBar>
        </>
      )}
    </SafeAreaView>
  );
}

/** 아래 고정 칸 버튼 (프로토타입 .lg-dcta .lg-btn: 54 높이 · 둥글기 20 · 3px 그림자) */
function LgButton({ label, white = false, onPress }: { label: string; white?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      {({ pressed }) => (
        <View style={[styles.lg, white && { backgroundColor: Colors.white }, pressed && styles.lgPressed]}>
          <PText style={styles.lgText}>{label}</PText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  body: { paddingHorizontal: 16, paddingBottom: 30 },
  hero: { flexDirection: 'row', gap: 14, marginTop: 12 },
  coverWrap: { marginRight: 0, marginBottom: 0 },
  tx: { flex: 1, minWidth: 0 },
  txB: { fontFamily: Font.body900, fontSize: 18, lineHeight: 25 },
  txP: { marginVertical: 6, fontFamily: Font.body600, fontSize: 13.5, lineHeight: 21.6 },
  txS: { fontFamily: Font.body800, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  h: { marginTop: 22, marginBottom: 8, fontFamily: Font.body900, fontSize: 15, lineHeight: 21 },
  log: { paddingVertical: 2, paddingHorizontal: 14, borderRadius: 22, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white },
  r: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  rLine: { borderTopWidth: 1.5, borderTopColor: Colors.line },
  d: { width: 64, fontFamily: Font.body700, fontSize: 13.5, lineHeight: 19, color: Colors.inkSub },
  t: { flex: 1, fontFamily: Font.body800, fontSize: 13.5, lineHeight: 19 },
  pre: { fontFamily: Font.body900, fontSize: 12.5, lineHeight: 17, color: Colors.purple },
  lg: { height: 54, borderRadius: 20, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.yellow, alignItems: 'center', justifyContent: 'center', boxShadow: `3px 3px 0 ${Colors.ink}` },
  lgPressed: { transform: [{ translateX: 3 }, { translateY: 3 }], boxShadow: `0 0 0 ${Colors.ink}` },
  lgText: { fontFamily: Font.body900, fontSize: 15.5, lineHeight: 21 },
});
