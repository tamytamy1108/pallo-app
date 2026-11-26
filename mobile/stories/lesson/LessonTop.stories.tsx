import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { LessonTop, ProgressBar, SoundButton } from '@/components/lesson/lesson-top';

/**
 * 레슨 위 줄 — X · 진행 막대 · n/전체 · 문제 시계 · 소리 버튼.
 * 시계: 남은 시간(0:24) → 3초 이하 분홍 → '시간 초과', 답한 뒤엔 걸린 시간(시간 안이면 노랑).
 */
const meta = {
  title: 'Lesson/LessonTop',
  component: LessonTop,
  args: { index: 2, total: 9, soundOff: false, onToggleSound: fn(), onClose: fn() },
  decorators: [(Story) => <View style={{ paddingVertical: 12 }}><Story /></View>],
} satisfies Meta<typeof LessonTop>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 시계 없는 문제 (역할 고르기 등) */
export const NoTimer: Story = {};
export const First: Story = { args: { index: 0 } };
export const Last: Story = { args: { index: 8 } };
/** 소리 끄기(15분) — 연보라 바탕 스피커 X */
export const SoundOff: Story = { args: { soundOff: true } };
/** 시계 도는 중 (20초 제한) */
export const TimerRunning: Story = { render: (a) => <LessonTop {...a} timer={{ start: Date.now(), limit: 20 }} /> };
/** 3초 이하 — 분홍 */
export const TimerLow: Story = { render: (a) => <LessonTop {...a} timer={{ start: Date.now() - 18_000, limit: 20 }} /> };
/** 시간 초과 */
export const TimerOver: Story = { render: (a) => <LessonTop {...a} timer={{ start: Date.now() - 60_000, limit: 20 }} /> };
/** 시간 안에 맞힘 — 노랑 'n초' */
export const ResultFast: Story = { args: { timer: { start: 0, limit: 20, result: { sec: 7, fast: true } } } };
/** 답했지만 빠른 답 아님 */
export const ResultBase: Story = { args: { timer: { start: 0, limit: 20, result: { sec: 15, fast: false } } } };
/** 제한보다 늦게 답함 */
export const ResultOver: Story = { args: { timer: { start: 0, limit: 20, result: { sec: 31, fast: false } } } };

/** 소리 버튼 켜짐 · 꺼짐 */
export const SoundButtons: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 16, padding: 20 }}>
      <SoundButton off={false} onPress={fn()} />
      <SoundButton off onPress={fn()} />
    </View>
  ),
};
/** 진행 막대 0 · 30 · 70 · 100% */
export const ProgressBars: Story = {
  render: () => (
    <View style={{ gap: 12, padding: 20 }}>
      {[0, 0.3, 0.7, 1].map((v) => (
        <View key={v} style={{ flexDirection: 'row' }}>
          <ProgressBar value={v} />
        </View>
      ))}
    </View>
  ),
};
