import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { Greeting } from '@/components/home/greeting';

import { padded } from '../_support/padded';

/** 홈 인사말 'Hey 이름, / let's talk!' — 이름이 길면 이름만 30px → 최소 20px 까지 줄어든다 (영문 · 한글 · 일본어 글꼴이 다름). */
const meta = {
  title: 'Home/Greeting',
  component: Greeting,
  args: { name: 'Tammy' },
  decorators: [padded],
} satisfies Meta<typeof Greeting>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Korean: Story = { args: { name: '망고' } };
/** 한글 10자 — 줄여서 한 줄 */
export const LongKorean: Story = { args: { name: '말많은망고말많은망고' } };
export const LongJapanese: Story = { args: { name: 'たなかゆうきたなかゆう' } };
/** 영문 20자 — 최소 크기에서도 넘치면 잘림 */
export const LongLatin: Story = { args: { name: 'Maximilian Alexander' } };
export const Mixed: Story = { args: { name: 'Tammy망고たな' } };
