import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { HiForm } from '@/components/meet/detail/detail-parts';

import { padded } from '../_support/padded';

/** 인사 남기기 칸 — 새로 쓰기(남기기) · 고치기(저장 + 취소). 빈 글은 저장되지 않는다. */
const meta = {
  title: 'Meet/HiForm',
  component: HiForm,
  args: { button: '남기기', placeholder: '함께할 멤버들에게 인사 남기기', onSave: fn() },
  decorators: [padded],
} satisfies Meta<typeof HiForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const New: Story = {};
export const Editing: Story = { args: { button: '저장', initial: '잘 부탁드려요!', placeholder: undefined, onCancel: fn() } };
export const LongInitial: Story = { args: { button: '저장', initial: '안녕하세요! 영어로 말하는 시간을 꾸준히 만들고 싶어서 들어왔어요. 매주 빠지지 않고 나올게요.', onCancel: fn() } };
