import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';

import { padded } from '../_support/padded';

const meta = {
  title: 'UI/Button',
  component: Button,
  args: { label: '시작하기', onPress: fn() },
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'dark', 'ghost'] },
  },
  decorators: [padded],
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
export const Secondary: Story = { args: { variant: 'secondary' } };
export const Dark: Story = { args: { variant: 'dark' } };
export const Ghost: Story = { args: { variant: 'ghost', label: '나중에 할게요' } };
export const Wide: Story = { args: { wide: true } };
export const Disabled: Story = { args: { disabled: true } };
export const LongLabel: Story = { args: { label: '아주 긴 버튼 글자가 들어가면 어떻게 보이는지 확인해요' } };

/** 모든 변형을 한 화면에서 비교 */
export const AllVariants: Story = {
  render: (args) => (
    <View style={{ gap: 12 }}>
      <Button {...args} variant="primary" />
      <Button {...args} variant="secondary" />
      <Button {...args} variant="dark" />
      <Button {...args} variant="ghost" />
      <Button {...args} disabled />
      <Button {...args} wide />
    </View>
  ),
};
