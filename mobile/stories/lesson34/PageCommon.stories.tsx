import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { Intro, PCard, PFoot, Stats, Tool } from '@/components/lesson34/pages/common';
import { GoBtn } from '@/components/lesson34/ui';
import { PText } from '@/components/ui/text';

import { padded } from '../_support/padded';

/** 단계 화면 공용 조각 (lesson34/pages/common.tsx) — 회색 안내 · 흰 카드 · 숫자 칸 · 알약 도구(켜짐/꺼짐) · 아래 고정 칸 */
const meta = {
  title: 'Lesson34/PageCommon',
  component: Stats,
  decorators: [padded],
  args: {
    items: [
      ['12→34', '단어 수'],
      ['3', '키워드'],
      ['3', '문장 / 답'],
    ],
  },
} satisfies Meta<typeof Stats>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 숫자 칸 (Before / After 결과) */
export const StatsRow: Story = {};
/** 숫자 칸 둘 */
export const StatsTwo: Story = {
  args: {
    items: [
      ['4/6', '맞힌 문제'],
      ['2', '힌트'],
    ],
  },
};
/** 회색 안내 · 흰 카드 */
export const IntroAndCard: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      <Intro text="본학습에서 AI와 이야기할 질문이에요. 끌리는 질문 3개에 별표해요. 답은 아직 안 해도 돼요." />
      <PCard style={{ padding: 16 }}>
        <PText>흰 카드 (잉크 테두리 · 4px 그림자)</PText>
      </PCard>
    </View>
  ),
};
/** 알약 도구 — 꺼짐 · 켜짐(노랑) */
export const Tools: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <Tool label="전체 듣기" onPress={fn()} />
      <Tool label="한국어" on onPress={fn()} />
      <Tool label="1x" onPress={fn()} />
    </View>
  ),
};
/** 아래 고정 칸 (위 흐림 + 버튼) */
export const Foot: Story = {
  decorators: [(Story) => <View style={{ flex: 1, justifyContent: 'flex-end' }}><Story /></View>],
  render: () => (
    <PFoot>
      <GoBtn label="비교하기" onPress={fn()} />
    </PFoot>
  ),
};
