import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { CrownFace } from '@/components/meet/member-face';
import { PText } from '@/components/ui/text';

import { padded } from '../_support/padded';

/** 멤버 얼굴 + 왕관 — 호스트 노랑 왕관 · 서브 호스트 흰 왕관 · 나 · 일반. */
const meta = {
  title: 'Meet/CrownFace',
  component: CrownFace,
  args: { name: '소라', size: 44 },
  decorators: [padded],
} satisfies Meta<typeof CrownFace>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Plain: Story = {};
export const Host: Story = { args: { role: '호스트' } };
export const SubHost: Story = { args: { role: '서브 호스트' } };
export const Me: Story = { args: { name: '태미', me: true, role: '나' } };
export const HostIsMe: Story = { args: { name: '태미', me: true, role: '호스트 · 나' } };
export const Compare: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 20 }}>
      {(['', '호스트', '서브 호스트', '나', '호스트 · 나'] as const).map((r) => (
        <View key={r} style={{ alignItems: 'center', gap: 6 }}>
          <CrownFace name={r.includes('나') ? '태미' : '민준'} me={r.includes('나')} role={r} size={36} />
          <PText variant="small">{r || '일반'}</PText>
        </View>
      ))}
    </View>
  ),
};
