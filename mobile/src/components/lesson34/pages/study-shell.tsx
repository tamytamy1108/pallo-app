import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Pressable } from '@/components/ui/pressable';
import { CloseIcon, SpeakerIcon } from '@/components/lesson/icons';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { stopSpeaking } from '@/lib/tts';

import { leave34, useSoundToggle, useStepFinish, type StepCtx } from '../finish';

export type PageApi = { soundOff: boolean; finish: (score?: { right: number; total: number } | null) => void };

/**
 * 단계 화면 틀 (프로토타입 #study 위 줄): 왼쪽 X · 가운데 단계 이름 · 오른쪽 소리 버튼.
 * 내용은 children(api) — 다 하면 api.finish() 로 축하 화면.
 */
export function StudyShell({ ctx, title, children }: { ctx: StepCtx; title: string; children: (api: PageApi) => ReactNode }) {
  const { soundOff, toggleSound } = useSoundToggle();
  const { finish, celebrate } = useStepFinish(ctx);
  // 다 하면 읽던 소리부터 멈추고 축하 화면으로
  const finishQuiet: PageApi['finish'] = (sc) => {
    stopSpeaking();
    finish(sc);
  };
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.top}>
        <Pressable onPress={leave34} accessibilityRole="button" accessibilityLabel="닫기" style={styles.icon} hitSlop={6}>
          <CloseIcon />
        </Pressable>
        <PText style={styles.title} numberOfLines={1}>
          {title}
        </PText>
        <Pressable
          onPress={toggleSound}
          accessibilityRole="switch"
          accessibilityLabel="소리 끄기"
          accessibilityState={{ checked: soundOff }}
          style={StyleSheet.flatten([styles.icon, soundOff && styles.off])}
          hitSlop={6}>
          <SpeakerIcon off={soundOff} color={soundOff ? '#5B4BA8' : Colors.ink} />
        </Pressable>
      </View>
      <View style={styles.flex}>{children({ soundOff, finish: finishQuiet })}</View>
      {celebrate}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  flex: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6 },
  icon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  off: { backgroundColor: '#E6DEFA' },
  title: { flex: 1, textAlign: 'center', fontFamily: Font.body900, fontSize: 16, lineHeight: 22 },
});
