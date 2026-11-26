import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { WordCard } from '@/components/lesson/word-card';
import { PText } from '@/components/ui/text';

import { padded } from '../_support/padded';

/** 따라 말하기 단어 카드 — 놓기 전 · 줄에 이어짐 · 말로 들림 · 힌트(3번 틀리면). 패턴 부분은 보라 밑줄. */
const meta = {
  title: 'Lesson/WordCard',
  component: WordCard,
  args: { word: 'latte.', state: 'pool', focus: false, onPress: fn() },
  argTypes: { state: { control: 'inline-radio', options: ['pool', 'linked', 'said', 'hint'] } },
  decorators: [padded],
} satisfies Meta<typeof WordCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pool: Story = {};
export const Linked: Story = { args: { state: 'linked' } };
export const Said: Story = { args: { state: 'said' } };
export const Hint: Story = { args: { state: 'hint' } };
/** 패턴 부분 (보라 밑줄) */
export const Focus: Story = { args: { word: "I'd", focus: true } };
export const FocusLinked: Story = { args: { word: "I'd", focus: true, state: 'linked' } };

function ShakeDemo() {
  const [n, setN] = useState(1);
  return (
    <View style={{ gap: 12, alignItems: 'flex-start' }}>
      <WordCard word="order" shake={n} onPress={() => setN((x) => x + 1)} />
      <PText>카드를 누르면 다시 흔들려요 (틀렸을 때)</PText>
    </View>
  );
}
export const Shake: Story = { render: () => <ShakeDemo /> };
/** 문장을 다 이었을 때 파도처럼 차례로 통 */
export const Wave: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {"I'd like to order an iced latte.".split(' ').map((w, i) => (
        <WordCard key={i} word={w} state="linked" focus={i < 3} wave={i * 60} />
      ))}
    </View>
  ),
};
/** 모든 상태 한 줄에 */
export const AllStates: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      <WordCard word="pool" />
      <WordCard word="linked" state="linked" />
      <WordCard word="said" state="said" />
      <WordCard word="hint" state="hint" />
      <WordCard word="focus" focus />
    </View>
  ),
};
