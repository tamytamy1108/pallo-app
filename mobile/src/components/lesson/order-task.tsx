import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type ScrollViewInstance } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { FeedbackBand } from '@/components/lesson/feedback-band';
import { GripIcon } from '@/components/lesson/icons';
import { GhostButton, L, TaskMsg, YellowButton } from '@/components/lesson/lesson-ui';
import { TaskLayout, useTask } from '@/components/lesson/task-layout';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import type { OrderTask as Task } from '@/data/lessons';
import { haptic, sfx } from '@/lib/feedback';
import { shuffled } from '@/lib/words';

/**
 * 줄 순서 맞추기 (프로토타입 TKV.order): 아래 섞인 줄을 순서대로 눌러(또는 위로 끌어 놓아) 위에 쌓아요.
 * 맞은 줄 초록 · 틀린 줄 빨강 → [정답 확인하기 / 다시 도전하기]. 쌓일 때마다 다음 빈칸이 보이게 자동으로 내려가요.
 */
export function OrderTask({ task }: { task: Task }) {
  const { mark, next, again } = useTask();
  const L_ = task.lines;
  const N = L_.length;
  const [pool, setPool] = useState(() => shuffled(N));
  const [placed, setPlaced] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const [shown, setShown] = useState(false);
  const full = placed.length === N;
  const wrong = checked ? placed.map((v, i) => v !== i) : [];
  const allRight = checked && !wrong.some(Boolean) && !shown;

  const place = (i: number) => {
    sfx('tap');
    haptic('select');
    setPool((p) => p.filter((x) => x !== i));
    setPlaced((p) => [...p, i]);
  };
  const unplace = (k: number) => {
    sfx('tap');
    const v = placed[k];
    setPlaced((p) => p.filter((_, j) => j !== k));
    setPool((p) => [...p, v]);
  };

  // 줄이 쌓여 아래 줄이 화면 밖으로 밀리면, 다음에 놓을 칸이 위쪽에 오게 자동으로 내려가요
  const scroll = useRef<ScrollViewInstance>(null);
  const scrollY = useRef(0);
  const viewH = useRef(0);
  const slotY = useRef(0);
  const ordY = useRef(0);
  useEffect(() => {
    if (!placed.length || full) return;
    const t = setTimeout(() => {
      const y = ordY.current + slotY.current;
      const rel = y - scrollY.current;
      if (rel > viewH.current * 0.3) scroll.current?.scrollTo({ y: Math.max(0, y - 80), animated: true });
    }, 60);
    return () => clearTimeout(t);
  }, [placed.length, full]);

  const msg = shown ? '이게 정답 순서예요 · 흐름을 한 번 읽어 봐요' : allRight ? '순서가 완벽해요!' : checked ? '빨간 줄은 자리가 달라요' : `섞인 ${task.what ?? '대사'}${task.what ? '을' : '를'} 순서대로 눌러 위에 쌓아요`;
  const nNo = wrong.filter(Boolean).length;

  const foot = allRight ? (
    <FeedbackBand kind="good" en="Perfect order!" ko={task.after ?? '흐름을 다 맞췄어요'}>
      <YellowButton label="계속하기" onPress={next} />
    </FeedbackBand>
  ) : shown ? (
    <FeedbackBand kind="bad" en="Here's the order" ko="정답 순서를 기억하고 다음으로 가요">
      <View style={styles.row}>
        <GhostButton label="다시 도전하기" onPress={again} />
        <YellowButton label="계속하기" onPress={next} style={styles.flex} />
      </View>
    </FeedbackBand>
  ) : checked ? (
    <FeedbackBand kind="bad" en="Not quite!" ko={`${nNo}줄의 자리가 달라요${nNo < N && !wrong[0] ? ' · 맞은 앞줄은 남겨 둘게요' : ''}`}>
      <View style={styles.row}>
        <GhostButton
          label="정답 확인하기"
          onPress={() => {
            setPlaced(L_.map((_, i) => i));
            setPool([]);
            setShown(true);
          }}
        />
        <YellowButton
          label="다시 도전하기"
          style={styles.flex}
          onPress={() => {
            const k = wrong.indexOf(true);
            setPool((p) => [...p, ...placed.slice(k)]);
            setPlaced(placed.slice(0, k));
            setChecked(false);
          }}
        />
      </View>
    </FeedbackBand>
  ) : (
    <YellowButton
      label={full ? '확인' : '다 놓으면 확인'}
      disabled={!full}
      onPress={() => {
        const ok = placed.every((v, i) => v === i);
        setChecked(true);
        mark(ok, true);
        sfx(ok ? 'correct' : 'wrong');
        haptic(ok ? 'success' : 'error');
      }}
    />
  );

  return (
    <View style={styles.flex} onLayout={(e) => (viewH.current = e.nativeEvent.layout.height)}>
      <TaskLayout foot={foot} scrollRef={scroll} onScrollY={(y) => (scrollY.current = y)}>
        <TaskMsg>{msg}</TaskMsg>
        <View style={styles.ord} onLayout={(e) => (ordY.current = e.nativeEvent.layout.y)}>
          {placed.map((i, k) => (
            <Line key={i} who={L_[i].who} en={L_[i].en} num={String(k + 1)} state={shown ? 'ok' : checked ? (wrong[k] ? 'no' : 'ok') : 'in'} onPress={checked ? undefined : () => unplace(k)} />
          ))}
          {!full && (
            <View style={styles.slot} onLayout={(e) => (slotY.current = e.nativeEvent.layout.y)}>
              <PText style={styles.slotText} color="#9A93A6">
                {placed.length + 1}번째 줄을 아래에서 골라요
              </PText>
            </View>
          )}
        </View>
        {pool.length > 0 && (
          <View style={styles.pool}>
            {pool.map((i) => (
              <DragLine key={i} onPlace={() => place(i)}>
                <Line who={L_[i].who} en={L_[i].en} state="pool" onPress={() => place(i)} />
              </DragLine>
            ))}
          </View>
        )}
      </TaskLayout>
    </View>
  );
}

/** 아래 줄을 위로 끌어 놓으면 그 자리에 쌓여요 (앱: 끌어서 놓기) */
function DragLine({ children, onPlace }: { children: React.ReactNode; onPlace: () => void }) {
  const y = useSharedValue(0);
  const x = useSharedValue(0);
  const lift = useSharedValue(0);
  const pan = Gesture.Pan()
    .activateAfterLongPress(180)
    .onStart(() => {
      lift.set(withSpring(1));
    })
    .onUpdate((e) => {
      y.set(e.translationY);
      x.set(e.translationX * 0.2);
    })
    .onEnd((e) => {
      if (e.translationY < -48) runOnJS(onPlace)();
      y.set(withSpring(0));
      x.set(withSpring(0));
      lift.set(withSpring(0));
    });
  const a = useAnimatedStyle(() => ({ zIndex: lift.get() > 0.01 ? 5 : 0, transform: [{ translateY: y.get() }, { translateX: x.get() }, { scale: 1 + 0.03 * lift.get() }] }));
  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={a}>{children}</Animated.View>
    </GestureDetector>
  );
}

function Line({ who, en, num, state, onPress }: { who: string; en: string; num?: string; state: 'pool' | 'in' | 'ok' | 'no'; onPress?: () => void }) {
  const box = StyleSheet.flatten([styles.ln, state === 'ok' && styles.lnOk, state === 'no' && styles.lnNo]);
  const n = StyleSheet.flatten([styles.n, state === 'in' && styles.nIn, state === 'ok' && styles.nOk, state === 'no' && styles.nNo]);
  return (
    <Pressable onPress={onPress} disabled={!onPress} accessibilityRole="button" accessibilityLabel={`${who ? who + ' ' : ''}${en}`} accessibilityHint={state === 'pool' ? '위 줄에 놓기' : state === 'in' ? '빼기' : undefined}>
      {({ pressed }) => (
        <View style={StyleSheet.flatten([box, pressed && styles.lnDown])}>
          <View style={n}>{num ? <PText style={styles.nText} color={state === 'ok' || state === 'no' ? Colors.white : Colors.ink}>{num}</PText> : <GripIcon />}</View>
          <View style={styles.tx}>
            {who ? (
              <PText style={styles.who} color={Colors.inkSub}>
                {who}
              </PText>
            ) : null}
            <PText style={styles.en}>{en}</PText>
          </View>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  row: { flexDirection: 'row', gap: 10 },
  ord: { gap: 8 },
  pool: { gap: 8, paddingTop: 12, borderTopWidth: 2, borderStyle: 'dashed', borderColor: L.dash },
  ln: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, paddingHorizontal: 12, borderRadius: 16, borderWidth: 2, borderColor: Colors.ink, borderBottomWidth: 5, backgroundColor: Colors.white },
  lnDown: { borderBottomWidth: 2, marginTop: 3 },
  lnOk: { backgroundColor: L.okBg, borderColor: L.okGreen, borderBottomWidth: 2, marginTop: 3 },
  lnNo: { backgroundColor: L.noBg, borderColor: L.noRed, borderBottomWidth: 2, marginTop: 3 },
  n: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  nIn: { backgroundColor: Colors.yellow },
  nOk: { backgroundColor: L.okGreen },
  nNo: { backgroundColor: L.noRed },
  nText: { fontFamily: Font.display, fontSize: 10, lineHeight: 13 },
  tx: { flex: 1, minWidth: 0 },
  who: { fontFamily: Font.body800, fontSize: 11.5, lineHeight: 15 },
  en: { fontFamily: Font.body800, fontSize: 15, lineHeight: 20 },
  slot: { minHeight: 48, borderRadius: 16, borderWidth: 2, borderStyle: 'dashed', borderColor: '#9A93A6', alignItems: 'center', justifyContent: 'center' },
  slotText: { fontFamily: Font.body800, fontSize: 12.5, lineHeight: 17 },
});
