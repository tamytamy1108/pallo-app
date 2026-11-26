import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { Ring, RING_PURPLE } from '@/components/lesson34/ring';

import { padded } from '../_support/padded';

/** 원형 시계 — 1초마다 줄어들고, 3초 남으면 글자가 분홍 + 흔들림. 준비 시간은 보라 · 나머지는 분홍. 낮은 화면(<700)에선 작아요 */
const meta = {
  title: 'Lesson34/Ring',
  component: Ring,
  decorators: [padded],
  args: { left: 45, total: 60, label: '말하는 시간' },
} satisfies Meta<typeof Ring>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Speaking: Story = {};
/** 가득 (시작 직후) */
export const Full: Story = { args: { left: 60 } };
/** 3초 남음 — 분홍 글자 · 흔들림 */
export const Low: Story = { args: { left: 3 } };
/** 0초 */
export const Zero: Story = { args: { left: 0 } };
/** 준비 시간 (보라) */
export const Prep: Story = { args: { left: 12, total: 15, label: '준비 시간', color: RING_PURPLE } };
/** 시간 초과 문구 */
export const Late: Story = { args: { left: 0, total: 5, label: '시간 초과 · 그래도 말해 봐요' } };
/** 작은 화면 (휴대폰 작은 기기 · 높이 667) */
export const SmallPhone: Story = { globals: { viewport: { value: 'phone-sm', isRotated: false } } };
/** 나란히 — 준비 · 말 시작까지 · 말하는 시간 · 남은 시간 */
export const Compare: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
      <Ring left={10} total={15} label="준비 시간" color={RING_PURPLE} />
      <Ring left={4} total={5} label="말 시작까지" />
      <Ring left={30} total={60} label="말하는 시간" />
      <Ring left={2} total={5} label="남은 시간" />
    </View>
  ),
};
