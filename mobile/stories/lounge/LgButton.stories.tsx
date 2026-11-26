import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { LgIcon } from '@/components/lounge/icons';
import { CheckBox, LgButton } from '@/components/lounge/lg-button';

import { padded } from '../_support/padded';

/** 라운지 버튼 (.lg-btn) — 톤 5가지 · 끔 · 아이콘 · 넓게 · 크기 · 그림자. 체크 칸(CheckBox)도 여기서. */
const meta = {
  title: 'Lounge/LgButton',
  component: LgButton,
  args: { label: '참여하기', onPress: fn() },
  decorators: [padded],
} satisfies Meta<typeof LgButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Yellow: Story = {};
export const White: Story = { args: { tone: 'white', label: '후기 보기' } };
export const Purple: Story = { args: { tone: 'purple', label: '오픈채팅 열기' } };
export const Done: Story = { args: { tone: 'done', label: '신청 완료' } };
export const Bad: Story = { args: { tone: 'bad', label: '차단하기' } };
/** 끔 — 회색 바탕 · 그림자 없음 · 안 눌림 */
export const Disabled: Story = { args: { disabled: true, label: '모집 마감' } };
export const WithIcon: Story = { args: { label: '동행 구하기', icon: <LgIcon name="plus" size={15} sw={2.8} />, height: 34, fontSize: 12.5, shadow: 2 } };
/** 시트 아래 넓은 버튼 */
export const Wide: Story = { args: { label: '적용하기', wide: true, height: 52, fontSize: 15.5 } };
export const NoShadow: Story = { args: { shadow: 0 } };
/** 긴 글자 — 한 줄로 잘린다 */
export const LongLabel: Story = { args: { label: '아주 긴 버튼 글자가 들어가면 한 줄에서 말줄임으로 잘려요 확인용' } };

/** 톤 한눈에 */
export const AllTones: Story = {
  render: (args) => (
    <View style={{ gap: 12 }}>
      <LgButton {...args} tone="yellow" label="yellow" />
      <LgButton {...args} tone="white" label="white" />
      <LgButton {...args} tone="purple" label="purple" />
      <LgButton {...args} tone="done" label="done" />
      <LgButton {...args} tone="bad" label="bad" />
      <LgButton {...args} disabled label="disabled" />
    </View>
  ),
};

/** 체크 칸 — 꺼짐 · 켜짐 · 작게 */
export const CheckBoxes: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <CheckBox on={false} />
      <CheckBox on />
      <CheckBox on size={16} />
    </View>
  ),
};
