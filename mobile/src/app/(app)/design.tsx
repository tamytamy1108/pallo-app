import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from '@/components/ui/safe-area';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip, Pill } from '@/components/ui/pill';
import { PText } from '@/components/ui/text';
import { Colors, Spacing } from '@/constants/theme';

/** 개발용: 디자인 부품 모음. 프로토타입과 나란히 놓고 같은지 확인하는 화면이에요. */
export default function DesignScreen() {
  const [lang, setLang] = useState('영어');
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.body}>
        <Button label="← 닫기" variant="ghost" onPress={() => router.back()} />

        <Section title="글자">
          <PText variant="poster">PALLO!</PText>
          <PText variant="display">Hey Tammy,</PText>
          <PText variant="headline">라이브러리</PText>
          <PText variant="title">1과 Cafe Complaint</PText>
          <PText variant="body">세션 전에 예습하고, 세션 날에는 출석해요.</PText>
          <PText variant="label">이번 주 진도 5 & 6챕터</PText>
          <PText variant="small" color={Colors.inkSub}>
            보조 글자 · 12px
          </PText>
        </Section>

        <Section title="버튼">
          <Button label="출석체크 하기" wide />
          <View style={styles.row}>
            <Button label="자세히 보기" />
            <Button label="닫기" variant="secondary" />
          </View>
          <View style={styles.row}>
            <Button label="시작하기" variant="dark" />
            <Button label="나중에" variant="ghost" />
          </View>
          <Button label="마감됐어요" disabled wide />
        </Section>

        <Section title="알약 · 칩">
          <View style={styles.row}>
            <Pill label="스터디 맵 · Lv.1" />
            <Pill label="전체 보기" variant="yellow" />
            <Pill label="커밍순" variant="soft" />
          </View>
          <View style={styles.row}>
            {['영어', '일본어', '중국어', '스페인어'].map((l) => (
              <Chip key={l} label={l} selected={lang === l} onPress={() => setLang(l)} />
            ))}
          </View>
        </Section>

        <Section title="카드">
          <Card>
            <Pill label="공지" />
            <PText variant="title">이번 달 스터디 일정</PText>
            <PText variant="body" color={Colors.inkSub}>
              12월 둘째 주는 지점 휴무예요.
            </PText>
          </Card>
          <Card color={Colors.rosePink} onPress={() => {}} accessibilityLabel="오늘 스터디">
            <PText variant="label" color={Colors.white}>
              오늘 스터디
            </PText>
            <PText variant="display" color={Colors.white}>
              20:00
            </PText>
          </Card>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <PText variant="label" color={Colors.inkSub}>
        {title}
      </PText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  body: { padding: Spacing.gutter, gap: Spacing.feed, paddingBottom: 60 },
  section: { gap: Spacing.stack },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' },
});
