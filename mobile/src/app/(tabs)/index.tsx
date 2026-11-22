import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { NoticeStrip } from '@/components/home/notice-strip';
import { SessionCard } from '@/components/home/session-card';
import { StudyMap } from '@/components/home/study-map';
import { Logo } from '@/components/logo';
import { Raised } from '@/components/ui/raised';
import { PText } from '@/components/ui/text';
import { Colors, Spacing, TabBarSpace } from '@/constants/theme';
import { ME } from '@/data/mock';
import { Appear } from '@/components/ui/appear';

/** 홈: 로고 · 알림 → 인사 → 공지 띠 → 오늘 스터디 카드 → 스터디 맵. */
export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.body}>
        {/* 칸마다 조금씩 늦게 아래에서 올라와요 (프로토타입 .rise · 0 / .04 / .06 / .1 / .14초) */}
        <Appear kind="rise" style={styles.head}>
          <Logo />
          <Pressable onPress={() => Alert.alert('알림', '알림함은 다음 단계에서 만들어요.')} accessibilityRole="button" accessibilityLabel="알림">
            {({ pressed }) => (
              <Raised radius={14} pressed={pressed}>
                <View style={styles.iconBtn}>
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={Colors.ink} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 20a2 2 0 0 0 4 0" />
                  </Svg>
                </View>
              </Raised>
            )}
          </Pressable>
        </Appear>

        <Appear kind="rise" delay={40}>
          <Greeting name={ME.name} />
        </Appear>
        <Appear kind="rise" delay={60}>
          <NoticeStrip />
        </Appear>
        <Appear kind="rise" delay={100}>
          <SessionCard onCheckIn={() => Alert.alert('출석체크', 'QR 출석은 다음 단계에서 만들어요.')} />
        </Appear>
        <Appear kind="rise" delay={140}>
          <StudyMap />
        </Appear>
      </ScrollView>
    </SafeAreaView>
  );
}

/** "Hey Tammy, / let's [talk!]" — talk! 은 노란 형광펜 상자 */
function Greeting({ name }: { name: string }) {
  return (
    <View style={styles.greet} accessibilityRole="header" accessibilityLabel={`Hey ${name}, let’s talk!`}>
      <PText variant="display">Hey {name},</PText>
      <View style={styles.greetRow}>
        <PText variant="display">let’s </PText>
        <View style={styles.mark}>
          <PText variant="display">talk!</PText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  body: { paddingHorizontal: Spacing.gutter, paddingTop: 12, paddingBottom: TabBarSpace + 40, gap: Spacing.stack },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBtn: { width: 44, height: 44, borderRadius: 14, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  greet: { marginTop: 6, marginHorizontal: 2 },
  greetRow: { flexDirection: 'row', alignItems: 'center' },
  mark: { backgroundColor: Colors.yellow, borderWidth: 2, borderColor: Colors.ink, borderRadius: 8, paddingHorizontal: 6 },
});
