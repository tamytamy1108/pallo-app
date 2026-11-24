import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { kfc } from '@/lib/motion';

import { DONE_AT, useDoneClock } from './done-motion';
import { OUT } from './fx-motion';

/** 전화번호 뒤 조사: 끝 숫자를 읽었을 때 받침이 있으면 '으로' (0 영 · 3 삼 · 6 육), 없거나 ㄹ 이면 '로' */
function withRo(phone: string) {
  return /[036]$/.test(phone) ? `${phone}으로` : `${phone}로`;
}

/**
 * 체험 예약 확정 › 연락 안내: 라벤더 상자 속 전화 아이콘 + '곧 ○○점에서 연락드릴 거예요'.
 * 도장이 찍힌 뒤 살짝 올라오며 나타나요.
 */
export function DoneNotice({ branch, phone }: { branch: string; phone: string }) {
  const p = useDoneClock(DONE_AT.notice, DONE_AT.noticeMs);
  const anim = useAnimatedStyle(() => ({ opacity: p.get(), transform: [{ translateY: kfc(p.get(), [0, 100], [10, 0], OUT) }] }));
  const where = branch || '지점';
  const tel = phone.trim();
  return (
    <Animated.View style={[styles.row, anim]} accessible>
      <View style={styles.icon}>
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"
            fill={Colors.white}
            stroke={Colors.purple}
            strokeWidth={2}
            strokeLinejoin="round"
          />
        </Svg>
      </View>
      <View style={styles.text}>
        <PText style={styles.title}>{where}에서 전화로 확정해 드려요</PText>
        <PText style={styles.sub}>
          {tel ? `상담 전에 ${withRo(tel)} 시간을 한 번 더 확인해 드려요.` : '상담 전에 전화로 시간을 한 번 더 확인해 드려요.'} 바꾸고 싶으면 그때 말씀해 주세요.
        </PText>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 4 },
  icon: { width: 44, height: 44, borderRadius: 14, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.lavender, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, paddingTop: 1 },
  title: { fontFamily: Font.body900, fontSize: 15, lineHeight: 21, letterSpacing: -0.3, color: Colors.ink },
  sub: { marginTop: 2, fontFamily: Font.body600, fontSize: 13, lineHeight: 19.5, color: Colors.inkSub },
});
