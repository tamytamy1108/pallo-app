import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import { SpeakerIcon } from '@/components/lesson/icons';
import { Avatar, NoSpeakToggle, pplColor } from '@/components/lesson/lesson-ui';
import { TaskLayout, useTask } from '@/components/lesson/task-layout';
import { say, toggleNoSpeak } from '@/components/lesson/voice';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { roleLineTasks, type RoleTask as Task } from '@/data/lessons';
import { haptic, sfx } from '@/lib/feedback';

/**
 * 역할 고르기 (프로토타입 TKV.role): '내 역할을 골라요' · 인물마다 얼굴(누르면 그 사람 목소리) · 이름(인물 색) · 역할 · 대사 n줄.
 * 고르면 내 대사마다 따라 말하기 문제가 다음에 끼워져요.
 */
export function RoleTask({ task }: { task: Task }) {
  const { insertAfter, next, noSpeak, soundOff } = useTask();
  const choose = (me: string) => {
    sfx('tap');
    haptic('select');
    insertAfter(roleLineTasks(task, me));
    next();
  };
  return (
    <TaskLayout foot={<NoSpeakToggle on={noSpeak} onPress={toggleNoSpeak} />}>
      <PText style={styles.msg} color="#C2416B">
        내 역할을 골라요
      </PText>
      <View style={styles.grid}>
        {task.cast.map((c) => {
          const first = task.lines.find((l) => l[0] === c);
          return <RoleCard key={c} name={c} role={task.roles[c]} n={task.lines.filter((l) => l[0] === c).length} soundOff={soundOff} onSay={() => say(first ? first[1] : c, 0.92, c)} onPick={() => choose(c)} />;
        })}
      </View>
    </TaskLayout>
  );
}

function RoleCard({ name, role, n, soundOff, onSay, onPick }: { name: string; role?: string; n: number; soundOff: boolean; onSay: () => void; onPick: () => void }) {
  const hop = useSharedValue(0);
  const [pressed, setPressed] = useState(false);
  const a = useAnimatedStyle(() => ({ transform: [{ translateY: hop.get() }] }));
  // 카드 전체(고르기)와 얼굴(목소리 듣기)이 겹치지 않게: 고르기는 카드 뒤에 깔고, 얼굴 버튼만 위에 올려요
  return (
    <View style={styles.flex}>
      <View style={StyleSheet.flatten([styles.card, pressed && styles.cardDown])}>
        <Pressable
          onPress={onPick}
          onPressIn={() => setPressed(true)}
          onPressOut={() => setPressed(false)}
          accessibilityRole="button"
          accessibilityLabel={`${name} 역할 고르기`}
          style={StyleSheet.absoluteFill}
        />
        <Pressable
          onPress={
            soundOff
              ? onPick
              : () => {
                  hop.set(withSequence(withTiming(-8, { duration: 160 }), withTiming(0, { duration: 260 })));
                  onSay();
                }
          }
          accessibilityRole="button"
          accessibilityLabel={soundOff ? `${name} 역할 고르기` : `${name} 목소리 듣기`}>
          <Animated.View style={a}>
            <Avatar name={name} size={92} />
            {!soundOff && (
              <View style={styles.spk}>
                <SpeakerIcon size={14} />
              </View>
            )}
          </Animated.View>
        </Pressable>
        <View style={styles.texts} pointerEvents="none">
          <PText style={styles.name} color={pplColor(name)}>
            {name}
          </PText>
          {role ? <PText style={styles.role}>{role}</PText> : null}
          <PText style={styles.lines} color={Colors.inkSub}>
            대사 {n}줄
          </PText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  texts: { alignItems: 'center', gap: 6 },
  msg: { textAlign: 'center', fontFamily: Font.body900, fontSize: 13, lineHeight: 20 },
  grid: { flexDirection: 'row', gap: 12 },
  card: { alignItems: 'center', gap: 6, paddingVertical: 18, paddingHorizontal: 10, borderRadius: 20, borderWidth: 2, borderColor: Colors.ink, borderBottomWidth: 6, backgroundColor: Colors.white },
  cardDown: { borderBottomWidth: 2, marginTop: 4 },
  spk: { position: 'absolute', right: -6, bottom: -2, width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: Font.body900, fontSize: 18, lineHeight: 24 },
  role: { fontFamily: Font.body900, fontSize: 13, lineHeight: 18 },
  lines: { fontFamily: Font.body700, fontSize: 12, lineHeight: 16 },
});
