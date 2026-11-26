import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { HopStage, PopStars } from '@/components/lesson34/blocks/match-result-fx';

import { padded } from '../_support/padded';

/** 짝 맞추기 결과의 움직임 조각 — 캐릭터 무대(다 맞힘 · 아니면) · 튀어나오는 별 (움직임 줄이기면 멈춘 그림) */
const meta = {
  title: 'Lesson34/MatchResultFx',
  component: HopStage,
  decorators: [padded],
  args: { good: true },
} satisfies Meta<typeof HopStage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 다 맞힘 — 노랑 무대 · 색종이 · 반짝이 */
export const StageGood: Story = {};
/** 못 다 맞힘 — 기운 캐릭터 · 먼지 */
export const StageSad: Story = { args: { good: false } };
/** 별 0 ~ 3개 */
export const Stars: Story = {
  render: () => (
    <View style={{ gap: 16 }}>
      {[0, 1, 2, 3].map((n) => (
        <PopStars key={n} n={n} delay={n * 200} />
      ))}
    </View>
  ),
};
