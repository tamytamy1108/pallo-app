import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { Icon } from '@/components/meet/icons';
import { LgButton } from '@/components/meet/parts';

import { padded } from '../_support/padded';

/** 라운지 알약 버튼 — 색 6종(y 노랑 · wh 흰 · pu 보라 · done 완료 · off 꺼짐 · on 켜짐), 아이콘 · 꽉 채움 · 크기. */
const meta = {
  title: 'Meet/LgButton',
  component: LgButton,
  args: { label: '참여하기', onPress: fn() },
  decorators: [padded],
} satisfies Meta<typeof LgButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Yellow: Story = { args: { variant: 'y' } };
export const White: Story = { args: { variant: 'wh', label: '후기 보기' } };
export const Purple: Story = { args: { variant: 'pu', label: '가입하기' } };
export const Done: Story = { args: { variant: 'done', label: '참여 완료' } };
/** 꺼짐 — 그림자 없음 · 누를 수 없음 */
export const Off: Story = { args: { variant: 'off', label: '모집 닫음' } };
/** 켜짐 (빈자리 알림 받는 중 등 — pressedState) */
export const On: Story = { args: { variant: 'on', label: '알림 받는 중', pressedState: true } };
/** onPress 가 없으면 눌리지 않는다 */
export const NoHandler: Story = { args: { onPress: undefined, label: '승인 대기' } };
export const WithIcon: Story = { args: { label: '번개 열기', icon: <Icon name="plus" size={15} strokeWidth={2.8} />, height: 34, fontSize: 12.5, paddingH: 12, shadow: 2 } };
/** 아이콘만 (찜 버튼 모양) */
export const IconOnly: Story = { args: { label: undefined, icon: <Icon name="heart" size={22} />, width: 57, height: 54, paddingH: 0, radius: 20, accessibilityLabel: '찜하기' } };
export const Grow: Story = { args: { grow: true, height: 54, fontSize: 15.5, radius: 20 }, render: (args) => <View style={{ flexDirection: 'row' }}><LgButton {...args} /></View> };
/** 긴 글 — 한 줄로 줄여 맞춘다 */
export const LongLabel: Story = { args: { label: '참여하기 · 남은 자리 3 · 오늘 마감되는 번개예요', width: 220 } };
/** 색 6종 한눈에 */
export const AllVariants: Story = {
  render: (args) => (
    <View style={{ gap: 12 }}>
      {(['y', 'wh', 'pu', 'done', 'off', 'on'] as const).map((v) => (
        <LgButton key={v} {...args} variant={v} label={v} />
      ))}
    </View>
  ),
};
