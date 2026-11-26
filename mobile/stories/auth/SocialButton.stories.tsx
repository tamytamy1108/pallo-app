import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { View } from 'react-native';

import { SocialButton } from '@/components/auth/social-buttons';

import { padded } from '../_support/padded';

const meta = {
  title: 'Auth/SocialButton',
  component: SocialButton,
  args: { provider: 'kakao', onPress: fn() },
  argTypes: { provider: { control: 'inline-radio', options: ['kakao', 'apple', 'google'] } },
  decorators: [padded],
} satisfies Meta<typeof SocialButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Kakao: Story = {};
export const Apple: Story = { args: { provider: 'apple' } };
export const Google: Story = { args: { provider: 'google' } };
export const Disabled: Story = { args: { disabled: true } };

export const All: Story = {
  render: (args) => (
    <View style={{ gap: 12 }}>
      <SocialButton {...args} provider="kakao" />
      <SocialButton {...args} provider="apple" />
      <SocialButton {...args} provider="google" />
    </View>
  ),
};
