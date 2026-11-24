import { LinearGradient } from 'expo-linear-gradient';
import { createContext, useContext, type ReactNode, type RefObject } from 'react';
import { StyleSheet, View, type ScrollViewInstance } from 'react-native';

import { KeyboardScrollView } from '@/components/ui/form-scroll';
import { Colors } from '@/constants/theme';
import { useFootPadding } from '@/lib/keyboard';
import type { Task } from '@/data/lessons';

/** 레슨 진행기가 문제 화면에 내려 주는 것 (프로토타입 TK · tkMark · tkNext · lsPeek) */
export type TaskApi = {
  task: Task;
  index: number;
  total: number;
  isLast: boolean;
  soundOff: boolean;
  noSpeak: boolean;
  /** 표현 저장 출처 (예: 'Lv.1 1과 · 대화문') */
  source: string;
  /** 결과 기록 — 문제마다 마지막 결과가 최종 점수. once: 이미 기록했으면 그대로 */
  mark: (ok: boolean, once?: boolean) => void;
  next: () => void;
  /** 이 문제를 처음부터 다시 (짝 맞추기 '한 번 더' · 순서 '다시 도전하기') */
  again: () => void;
  /** 다음 자리에 문제 끼워 넣기 (역할 고르기 → 내 대사들) */
  insertAfter: (tasks: Task[]) => void;
  /** 보라 팔로 빼꼼 한마디 */
  peek: (line: [string, string]) => void;
  setFootH: (h: number) => void;
};

export const TaskCtx = createContext<TaskApi | null>(null);
export function useTask() {
  const c = useContext(TaskCtx);
  if (!c) throw new Error('useTask 는 레슨 진행기 안에서만 써요');
  return c;
}

/**
 * 한 문제 화면 틀 (프로토타입 #lsBody + #lsFoot): 위는 스크롤(아래 26px 흐리게), 아래는 버튼 자리 고정.
 * 아래 높이를 진행기에 알려 줘요 → 보라 팔로가 버튼 위 빈 곳에서 나와요.
 */
export function TaskLayout({ children, foot, scrollRef, onScrollY }: { children: ReactNode; foot?: ReactNode; scrollRef?: RefObject<ScrollViewInstance | null>; onScrollY?: (y: number) => void }) {
  const bottom = useFootPadding(16);
  const { setFootH } = useTask();
  return (
    <View style={styles.flex}>
      <View style={styles.flex}>
        {/* 글 칸을 누르면 키보드 · 아래 칸 위로 보이게 (아래 칸은 키보드 위로 올라와요) */}
        <KeyboardScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
          room={34}
          onScroll={onScrollY ? (e) => onScrollY(e.nativeEvent.contentOffset.y) : undefined}>
          {children}
        </KeyboardScrollView>
        <LinearGradient colors={['rgba(251,246,234,0)', Colors.cream]} style={styles.fade} pointerEvents="none" />
      </View>
      <View style={StyleSheet.flatten([styles.foot, { paddingBottom: bottom }])} onLayout={(e) => setFootH(e.nativeEvent.layout.height)}>
        {foot}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  body: { paddingHorizontal: 20, paddingTop: 2, paddingBottom: 24, gap: 14 },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 26 },
  foot: { paddingHorizontal: 20, paddingTop: 10, gap: 10, backgroundColor: Colors.cream },
});
