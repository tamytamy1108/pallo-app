import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { Bolt, Icon } from '@/components/meet/icons';
import { LgButton, SecHead } from '@/components/meet/parts';
import { PText } from '@/components/ui/text';

import { padded } from '../_support/padded';

/** 섹션 제목 줄 — 제목만 · 회색 작은 글 · 오른쪽 버튼 · 아이콘 섞인 제목. */
const meta = {
  title: 'Meet/SecHead',
  component: SecHead,
  args: { title: '동아리' },
  decorators: [padded],
} satisfies Meta<typeof SecHead>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TitleOnly: Story = {};
export const WithSub: Story = { args: { sub: '5개 · 옆으로 넘겨 보세요' } };
export const WithRight: Story = {
  args: {
    title: (
      <>
        <Bolt />
        <PText>서울 번개</PText>
      </>
    ),
    sub: '3개',
    right: <LgButton label="번개 열기" icon={<Icon name="plus" size={15} strokeWidth={2.8} />} height={34} fontSize={12.5} paddingH={12} shadow={2} onPress={fn()} />,
  },
};
