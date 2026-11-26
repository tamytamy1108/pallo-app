import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { LessonModal } from '@/components/lesson/lesson-modal';

/** 레슨 위 아래쪽 확인 창 — 그만하기(보라 팔로) · 이어서 할까요(노랑 팔로). */
const meta = {
  title: 'Lesson/LessonModal',
  component: LessonModal,
  args: { open: true, img: 'purple', title: '정말 그만할까요?', desc: '6문제만 더 하면 끝나요', yes: '계속하기', no: '그만하기', onYes: fn(), onNo: fn() },
  argTypes: { img: { control: 'inline-radio', options: ['purple', 'yellow'] } },
} satisfies Meta<typeof LessonModal>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 그만하기 확인 */
export const Quit: Story = {};
/** 마지막 문제만 남았을 때 */
export const QuitLastOne: Story = { args: { desc: '마지막 문제만 남았어요!' } };
/** 다시 열 때 — 이어서 할까요? */
export const Resume: Story = { args: { img: 'yellow', title: '이어서 할까요?', desc: '3/9까지 했어요', yes: '이어서 하기', no: '처음부터 시작하기' } };
/** 닫힘 — 아무것도 안 보여요 */
export const Closed: Story = { args: { open: false } };
