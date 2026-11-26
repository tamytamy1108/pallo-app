import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { Screen } from '@/components/screen';
import { Card } from '@/components/ui/card';
import { PText } from '@/components/ui/text';
import { Colors } from '@/constants/theme';

/** 탭 화면 공통 틀 — 크림 바탕 · 큰 제목 · 아래 탭 바만큼 여백 · 스크롤. */
const meta = {
  title: 'Shell/Screen',
  component: Screen,
  args: {
    title: '라이브러리',
    children: Array.from({ length: 6 }, (_, i) => (
      <Card key={i}>
        <PText variant="title">{`${i + 1}과 Cafe Complaint`}</PText>
        <PText color={Colors.inkSub}>스터디 맵 · Lv.1</PText>
      </Card>
    )),
  },
} satisfies Meta<typeof Screen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
/** 제목만 */
export const Empty: Story = { args: { children: undefined } };
export const LongTitle: Story = { args: { title: '아주 긴 탭 제목이 들어가면 두 줄로 바뀌어요 확인용' } };
