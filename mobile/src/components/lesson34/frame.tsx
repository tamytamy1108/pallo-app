import { createContext, useContext, useEffect, useRef, type ComponentRef, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';

import type { LogItem, Task34 } from './types';

/** 진행기가 문제(블록)에게 주는 것 (프로토타입 TK + tkNext · tkMark …) */
export type Runner = {
  soundOff: boolean;
  noSpeak: boolean;
  toggleNoSpeak: () => void;
  /** 마지막 문제면 '완료하기' */
  goLabel: string;
  next: () => void;
  /** 이 문제의 결과 (처음 결과만 시간 기록) */
  mark: (ok: boolean) => void;
  combo: number;
  setCombo: (n: number) => void;
  log: (x: LogItem) => void;
  logs: () => LogItem[];
  /** 지금 문제 바로 뒤에 끼워요 (고른 질문 · 편 고르기 뒤 리허설) */
  insert: (tasks: Task34[]) => void;
  /** 지금 문제 뒤를 모두 이걸로 바꿔요 (저널 → 다시 읽기) */
  replaceRest: (tasks: Task34[]) => void;
  /** 최종 점수를 직접 정해요 (디베이트 20점 → 5점) */
  setScore: (right: number, total: number) => void;
  /** 위 작은 안내를 잠깐 바꿔요 (꼬리 질문) — null 이면 문제 것 */
  setKick: (k: string | null) => void;
  /** 같은 문제를 처음 상태로 다시 */
  again: () => void;
  /** 표현 저장 출처 (예: 'Lv.3 #101 The Present · KEYWORDS 익히기') */
  source: string;
  /** 매치 최고 기록 열쇠 */
  bestKey: string;
};
export const RunnerCtx = createContext<Runner | null>(null);
export function useRunner() {
  const r = useContext(RunnerCtx);
  if (!r) throw new Error('useRunner: TaskRunner 안에서만 써요');
  return r;
}

/** 문제 본문 (스크롤) · 결과가 아래에 생기면 끝까지 내려가요 */
export function Body({ children, toEnd }: { children: ReactNode; toEnd?: unknown }) {
  const ref = useRef<ComponentRef<typeof ScrollView>>(null);
  useEffect(() => {
    if (toEnd == null || toEnd === false) return;
    const t = setTimeout(() => ref.current?.scrollToEnd({ animated: true }), 150);
    return () => clearTimeout(t);
  }, [toEnd]);
  return (
    <ScrollView ref={ref} style={styles.flex} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}

/** 아래 고정 칸 (프로토타입 #lsFoot): 말하기가 어려워요 · 답하는 방식 · 행동 단추 */
export function Foot({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={StyleSheet.flatten([styles.foot, { paddingBottom: 18 + insets.bottom }])}>
      <FootFade />
      {children}
    </View>
  );
}

/** 아래 고정 칸 위 흐림: 글이 칸 밑으로 스르르 사라지게 (리액션이 떠 있는 느낌) */
export const FootFade = () => (
  <LinearGradient pointerEvents="none" colors={['rgba(251,246,234,0)', Colors.cream]} style={{ position: 'absolute', left: 0, right: 0, top: -28, height: 28 }} />
);


const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 12, gap: 14 },
  foot: { paddingHorizontal: 20, paddingTop: 10, backgroundColor: Colors.cream },
});
