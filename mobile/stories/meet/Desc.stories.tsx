import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { Desc } from '@/components/meet/detail/detail-parts';

import { padded } from '../_support/padded';

const PARA = '퇴근 후 영등포 수제맥주집에서 만나요. 영어로 먼저 인사하고, 그다음은 편하게 이야기해요.';

/** 소개 글 — 220자 넘으면 더보기/접기. 문단이 있으면 첫 문단까지만, 없으면 8줄에서 자른다. */
const meta = {
  title: 'Meet/Desc',
  component: Desc,
  args: { text: PARA },
  decorators: [padded],
} satisfies Meta<typeof Desc>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 짧음 — 더보기 없음 */
export const Short: Story = {};
/** 길고 문단이 있음 — 첫 문단만 + 더보기 */
export const LongWithParagraphs: Story = { args: { text: `${PARA}\n\n[이렇게 진행돼요]\n${PARA.repeat(3)}\n\n[준비물]\n${PARA.repeat(2)}` } };
/** 길고 문단이 없음 — 8줄 자름 + 더보기 */
export const LongNoParagraph: Story = { args: { text: PARA.repeat(6) } };
