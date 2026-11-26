import type { Decorator, Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { ProgressRail } from '@/components/onboarding/fx-progress';

import { padded } from '../_support/padded';

/** 진행 바는 줄 안에서 남은 폭을 채워요 (flex 1) — 가입 화면 위 줄처럼 가로 줄에 넣어 봐요 */
const inRow: Decorator = (Story) => (
  <View style={{ flexDirection: 'row' }}>
    <Story />
  </View>
);

/** 가입 단계 진행 바 — 보라가 차오르고 끝에 노란 스파크가 올라타요 (앞 화면 값에서부터 차올라요) */
const meta = {
  title: 'Onboarding/ProgressRail',
  component: ProgressRail,
  args: { step: 1, total: 4 },
  decorators: [inRow, padded],
} satisfies Meta<typeof ProgressRail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Step1of4: Story = {};
export const Step2of4: Story = { args: { step: 2 } };
export const Step3of4: Story = { args: { step: 3 } };
export const Full4of4: Story = { args: { step: 4 } };
/** 앱 구경 길 (5칸) */
export const Step4of5: Story = { args: { step: 4, total: 5 } };
export const Full5of5: Story = { args: { step: 5, total: 5 } };
