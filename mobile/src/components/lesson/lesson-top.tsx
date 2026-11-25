import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';

import { Pressable } from '@/components/ui/pressable';
import { CloseIcon, SpeakerIcon } from '@/components/lesson/icons';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';

/** 문제 시계: 시작 시각 · 제한(초) · 답한 뒤 결과 (프로토타입 #lsTime · tkTimeUp · tkMark) */
export type LessonTimer = { start: number; limit: number; result?: { sec: number; fast: boolean } };

/**
 * 레슨 위 줄: 왼쪽 X · 진행 막대(노랑) · 1/9 · 문제 시계 · 오른쪽 소리 버튼 (프로토타입 #lesson .pr-top).
 * 레슨 A(Lv.1 · 2) · 레슨 B(Lv.3 · 4)가 같이 써요. 담당: 레슨 A. props 는 바꾸지 않아요(늘리기만).
 * 소리 버튼: 켜짐 = 스피커 · 꺼짐(15분) = 연보라 바탕 스피커 X (프로토타입 .snd-btn.off)
 */
export function LessonTop({
  index,
  total,
  soundOff,
  onToggleSound,
  onClose,
  timer,
}: {
  index: number;
  total: number;
  soundOff: boolean;
  onToggleSound: () => void;
  onClose: () => void;
  /** 문제 시계 (제한 시간이 있는 문제만) */
  timer?: LessonTimer | null;
}) {
  return (
    <View style={styles.top}>
      <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="그만하기" style={styles.iconBtn} hitSlop={6}>
        <CloseIcon />
      </Pressable>
      <ProgressBar value={total ? index / total : 0} />
      <PText style={styles.count}>
        {Math.min(index + 1, total)}/{total}
      </PText>
      {timer && timer.limit > 0 ? <TimePill timer={timer} /> : null}
      <SoundButton off={soundOff} onPress={onToggleSound} />
    </View>
  );
}

/** 소리 버튼 (단계 화면 위 줄에서도 같은 모양 · 같은 자리) */
export function SoundButton({ off, onPress }: { off: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="switch"
      accessibilityLabel={off ? '소리 켜기' : '15분 동안 소리 끄기'}
      accessibilityState={{ checked: off }}
      style={StyleSheet.flatten([styles.iconBtn, off && styles.soundOff])}
      hitSlop={6}>
      <SpeakerIcon size={22} off={off} color={off ? '#5B4BA8' : Colors.ink} />
    </Pressable>
  );
}

/** 진행 막대 (노랑 · 스피킹 퀴즈 위 줄에서도 써요) */
export function ProgressBar({ value }: { value: number }) {
  const fill = useAnimatedStyle(() => ({ width: withSpring(`${Math.max(0, Math.min(1, value)) * 100}%`, { damping: 18 }) }));
  return (
    <View style={styles.bar} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}>
      <Animated.View style={[styles.fill, fill]} />
    </View>
  );
}

/** 남은 시간 0:24 → 3초 남으면 분홍 → '시간 초과'. 답하면 걸린 시간 'n초' (시간 안에 맞히면 노랑) */
function TimePill({ timer }: { timer: LessonTimer }) {
  const [now, setNow] = useState(() => Date.now());
  const running = !timer.result;
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [running]);
  const r = timer.result;
  let text: string;
  let tone: 'base' | 'low' | 'over' | 'fast';
  if (r) {
    text = `${r.sec}초`;
    tone = r.fast ? 'fast' : r.sec > timer.limit ? 'over' : 'base';
  } else {
    const left = Math.max(0, timer.limit - Math.floor((now - timer.start) / 1000));
    text = left ? `0:${String(left).padStart(2, '0')}` : '시간 초과';
    tone = !left ? 'over' : left <= 3 ? 'low' : 'base';
  }
  return (
    <View style={StyleSheet.flatten([styles.time, tone === 'low' && styles.timeLow, tone === 'over' && styles.timeOver, tone === 'fast' && styles.timeFast])} accessibilityLabel={`시간 ${text}`}>
      <PText style={StyleSheet.flatten([styles.timeText, tone === 'over' && styles.timeTextOver])} color={tone === 'low' ? '#C2416B' : tone === 'over' ? Colors.inkSub : Colors.ink}>
        {text}
      </PText>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 2 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  soundOff: { backgroundColor: '#E6DEFA' },
  bar: { flex: 1, height: 16, borderRadius: 8, borderWidth: 2, borderColor: Colors.ink, backgroundColor: '#F1EBDC', overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: Colors.yellow, borderRightWidth: 2, borderColor: Colors.ink },
  count: { fontFamily: Font.display, fontSize: 13, lineHeight: 17 },
  time: { minWidth: 46, height: 28, paddingHorizontal: 9, borderRadius: 14, backgroundColor: '#F1EBDC', alignItems: 'center', justifyContent: 'center' },
  timeLow: { backgroundColor: '#FFE7EE' },
  timeOver: { backgroundColor: '#EFE8D8' },
  timeFast: { backgroundColor: Colors.yellow },
  timeText: { fontFamily: Font.display, fontSize: 13, lineHeight: 17, fontVariant: ['tabular-nums'] },
  timeTextOver: { fontFamily: Font.body800, fontSize: 12 },
});
