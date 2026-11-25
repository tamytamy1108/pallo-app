import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollViewInstance } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useReducedMotion } from 'react-native-reanimated';

import { Pressable } from '@/components/ui/pressable';
import { Poster, posterSlides } from '@/components/meet/poster';
import { Shadowed } from '@/components/meet/parts';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import type { EventItem } from '@/data/events';
import { dday, monthDay } from '@/data/meet';

import { feeText } from './event-model';

/**
 * 이벤트 배너 (프로토타입 lgEvBanner · lgEvAuto): 다가오는 이벤트 5개가 2초마다 넘어가요.
 * 손으로 넘기면 4초 멈춤, 상세가 열려 있으면(화면이 가려지면) 멈춤.
 */
export function EventBanner({ list }: { list: EventItem[] }) {
  const [w, setW] = useState(0);
  const [i, setI] = useState(0);
  const ref = useRef<ScrollViewInstance>(null);
  const hold = useRef(0);
  const still = useReducedMotion();
  const n = list.length;

  useFocusEffect(
    useCallback(() => {
      if (n < 2 || !w) return;
      const t = setInterval(() => {
        if (Date.now() < hold.current) return;
        setI((cur) => {
          const next = (cur + 1) % n;
          ref.current?.scrollTo({ x: next * w, animated: !still });
          return next;
        });
      }, 2000);
      return () => clearInterval(t);
    }, [n, w, still]),
  );

  if (!n) return null;
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!w) return;
    const k = Math.round(e.nativeEvent.contentOffset.x / w);
    if (k !== i) setI(k);
  };
  const touch = () => {
    hold.current = Date.now() + 4000;
  };

  return (
    <Shadowed radius={22} offset={3}>
      <View style={styles.box} onLayout={(e) => setW(e.nativeEvent.layout.width - 4)} accessibilityLabel="이벤트 소식">
        {w ? (
          <ScrollView ref={ref} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onScroll={onScroll} scrollEventThrottle={32} onTouchStart={touch} onScrollBeginDrag={touch}>
            {list.map((e, k) => (
              <Pressable key={e.id} onPress={() => router.push(`/events/${e.id}`)} accessibilityRole="button" accessibilityLabel={`${k + 1} / ${n} ${e.title}`} style={{ width: w, height: 188 }}>
                <Poster id={e.id} slide={posterSlides(e.id)[0]} height={188} wordSize={26} wordStyle={styles.pw} />
                {/* 노란 · 밝은 포스터 위에서도 노란 첫 줄(종류 · 지점 · D-day)이 읽히게, 첫 줄 높이부터 충분히 어둡게 */}
                <LinearGradient colors={['rgba(20,17,30,0)', 'rgba(20,17,30,0.62)', 'rgba(20,17,30,0.86)']} locations={[0, 0.38, 1]} style={styles.ov} pointerEvents="none">
                  <PText numberOfLines={1} style={styles.k}>
                    {e.kind} · {e.br || '전 지점'} · {dday(e)}
                  </PText>
                  <PText numberOfLines={1} style={styles.b}>
                    {e.title}
                  </PText>
                  <PText numberOfLines={1} style={styles.m}>
                    {monthDay(e)} {e.wd} · <PText style={styles.em}>{feeText(e)}</PText>
                  </PText>
                </LinearGradient>
              </Pressable>
            ))}
          </ScrollView>
        ) : (
          <View style={{ height: 188 }} />
        )}
        <PText style={styles.cnt}>
          {i + 1} / {n}
        </PText>
        <View style={styles.dots} pointerEvents="none">
          {list.map((e, k) => (
            <View key={e.id} style={[styles.dot, k === i && styles.dotOn]} />
          ))}
        </View>
      </View>
    </Shadowed>
  );
}

const styles = StyleSheet.create({
  box: { height: 192, borderWidth: 2, borderColor: Colors.ink, borderRadius: 22, overflow: 'hidden', backgroundColor: Colors.ink },
  pw: { top: 34, bottom: undefined },
  ov: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 40, paddingHorizontal: 16, paddingBottom: 14, gap: 2, zIndex: 3 },
  k: { fontFamily: Font.body900, fontSize: 12, lineHeight: 17, color: Colors.yellow },
  b: { fontFamily: Font.body900, fontSize: 18, lineHeight: 26, color: '#fff' },
  m: { fontFamily: Font.body800, fontSize: 13, lineHeight: 19, color: '#fff' },
  em: { fontFamily: Font.body900, fontSize: 13, color: Colors.yellow },
  // 1 / n · 점: 밝은 포스터 위에서도 보이게 어두운 바탕을 깔아요
  cnt: { position: 'absolute', top: 10, right: 12, zIndex: 4, paddingHorizontal: 8, borderRadius: 10, overflow: 'hidden', backgroundColor: 'rgba(20,17,30,0.5)', fontFamily: Font.body900, fontSize: 12, lineHeight: 19, color: '#fff' },
  dots: { position: 'absolute', top: 14, left: 12, zIndex: 4, flexDirection: 'row', gap: 4, paddingHorizontal: 6, paddingVertical: 5, borderRadius: 8, backgroundColor: 'rgba(20,17,30,0.5)' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.55)' },
  dotOn: { width: 16, backgroundColor: '#fff' },
});
