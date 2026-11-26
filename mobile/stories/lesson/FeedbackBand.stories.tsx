import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { FeedbackBand } from '@/components/lesson/feedback-band';
import { GhostButton, YellowButton } from '@/components/lesson/lesson-ui';

import { padded } from '../_support/padded';

/** 정답 · 오답 띠 — 정답(노랑 팔로 · 보라 글씨) · 오답(보라 팔로 · 분홍 글씨) · 한 번 더. 듣기 버튼은 소리 끄기면 숨어요. */
const meta = {
  title: 'Lesson/FeedbackBand',
  component: FeedbackBand,
  args: { kind: 'good', en: 'Nailed it!', ko: '완벽하게 해냈어요!', say: fn() },
  argTypes: { kind: { control: 'inline-radio', options: ['good', 'bad', 'retry'] } },
  decorators: [padded],
} satisfies Meta<typeof FeedbackBand>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 정답 + 듣기 + [계속하기] */
export const Good: Story = { render: (a) => <FeedbackBand {...a}><YellowButton label="계속하기" onPress={fn()} /></FeedbackBand> };
/** 오답 — 정답 문장을 뜻 자리에 */
export const Bad: Story = {
  args: { kind: 'bad', en: 'Almost!', ko: "정답 · I'd like to order an iced latte.", say: undefined },
  render: (a) => <FeedbackBand {...a}><YellowButton label="계속하기" onPress={fn()} /></FeedbackBand>,
};
/** 처음 틀렸을 때 — 버튼 없이 띠만 */
export const Retry: Story = { args: { kind: 'retry', en: 'Not quite!', ko: '한 번 더 골라 봐요 · 기회가 한 번 남았어요', say: undefined } };
/** 소리 끄기 — 듣기 버튼이 없어요 */
export const SoundOff: Story = { args: { soundOff: true } };
/** 뜻 줄 없음 */
export const NoKorean: Story = { args: { ko: '' } };
/** 버튼 두 개 (오답 · 다시 도전하기 / 계속하기) */
export const TwoButtons: Story = {
  args: { kind: 'bad', en: 'Not quite!', ko: '2줄의 자리가 달라요 · 맞은 앞줄은 남겨 둘게요', say: undefined },
  render: (a) => (
    <FeedbackBand {...a}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <GhostButton label="정답 확인하기" onPress={fn()} />
        <YellowButton label="다시 도전하기" onPress={fn()} style={{ flex: 1 }} />
      </View>
    </FeedbackBand>
  ),
};
/** 긴 리액션 · 긴 뜻 */
export const LongText: Story = {
  args: { en: "No worries, you'll get it next time!", ko: '처음 답변으로 저장했어요 · 복습 Before / After에서 비교해요 · 아주 긴 안내 문장이 두 줄 넘게 이어지면 어떻게 보이는지 확인해요' },
};
/** 세 가지 한 화면에 */
export const AllKinds: Story = {
  render: (a) => (
    <View style={{ gap: 24 }}>
      <FeedbackBand {...a} kind="good" en="Spot on!" ko="딱 맞았어요!" />
      <FeedbackBand {...a} kind="bad" en="Almost!" ko="정답 · Do you have Wi-Fi?" say={undefined} />
      <FeedbackBand {...a} kind="retry" en="Not quite!" ko="한 번 더 맞춰 봐요" say={undefined} />
    </View>
  ),
};
