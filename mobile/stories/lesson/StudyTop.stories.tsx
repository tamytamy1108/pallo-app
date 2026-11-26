import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { ProgressBar } from '@/components/lesson/lesson-top';
import { StudyTop } from '@/components/lesson/study-top';
import { PText } from '@/components/ui/text';

/** 단계 화면 위 줄 — X · 가운데 제목(또는 진행 막대) · 소리 버튼. */
const meta = {
  title: 'Lesson/StudyTop',
  component: StudyTop,
  args: { title: 'My Story', soundOff: false, onToggleSound: fn(), onClose: fn() },
  decorators: [(Story) => <View style={{ paddingVertical: 12 }}><Story /></View>],
} satisfies Meta<typeof StudyTop>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Title: Story = {};
export const SoundOff: Story = { args: { soundOff: true } };
/** 긴 제목 — 한 줄로 자름 */
export const LongTitle: Story = { args: { title: '호텔 로비에서 손님 응대하기 · 상황 활동 아주 긴 제목' } };
/** 스피킹 퀴즈 — 제목 대신 진행 막대 + 숫자 */
export const WithProgress: Story = {
  args: {
    center: (
      <>
        <ProgressBar value={3 / 8} />
        <PText>4/8</PText>
      </>
    ),
  },
};
