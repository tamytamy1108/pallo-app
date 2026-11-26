import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { StyleSheet, View } from 'react-native';

import { TextField } from '@/components/ui/field';
import { Spacing } from '@/constants/theme';

import { padded } from '../_support/padded';

const LONG = '길게 쓰면 줄이 바뀌고 칸이 저절로 늘어나요. 옆으로 밀리거나 스크롤 막대가 생기지 않아요. 한 줄 더 쓰면 또 한 칸 늘어나요.';

/**
 * 글 칸 — box(네모) · round(알약). 글로 적는 칸은 길게 쓰면 저절로 늘어나고(GrowInput),
 * 번호 · 이메일 · 숫자 · 비밀번호 · oneLine 은 한 줄 그대로. multiline 은 처음부터 큰 칸(110).
 */
const meta = {
  title: 'UI/TextField',
  component: TextField,
  args: { label: '모임 이름', placeholder: '예) 홍대 이자카야 번개', onChangeText: fn() },
  argTypes: { variant: { control: 'inline-radio', options: ['box', 'round'] } },
  decorators: [padded],
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};
export const Filled: Story = { args: { value: '홍대 이자카야 번개' } };
/** 길게 쓰면 늘어나요 */
export const LongValue: Story = { args: { value: LONG } };
export const NoLabel: Story = { args: { label: undefined } };
/** 알약 칸 (댓글 · 검색) */
export const Round: Story = { args: { variant: 'round', label: undefined, placeholder: '검색' } };
export const RoundFilled: Story = { args: { variant: 'round', label: undefined, value: '영어 회화' } };
/** 늘 한 줄 — 길어도 늘지 않아요 */
export const OneLine: Story = { args: { oneLine: true, label: '이름', value: LONG } };
/** 휴대폰 번호 (한 줄 칸) */
export const Phone: Story = { args: { label: '휴대폰 번호', placeholder: '010-0000-0000', keyboardType: 'phone-pad' } };
export const Password: Story = { args: { label: '비밀번호', placeholder: '8자 이상', secureTextEntry: true, value: 'secret123' } };
/** 큰 칸 (공지 · 소개) */
export const Multiline: Story = { args: { label: '소개', placeholder: '모임을 소개해 주세요', multiline: true } };
export const MultilineFilled: Story = { args: { label: '소개', multiline: true, value: `${LONG}\n\n${LONG}` } };
export const Disabled: Story = { args: { value: '바꿀 수 없어요', editable: false } };

/** 모든 모양 비교 */
export const AllVariants: Story = {
  render: () => (
    <View style={styles.col}>
      <TextField label="네모 칸" placeholder="한 줄에서 시작해요" />
      <TextField variant="round" placeholder="알약 칸" />
      <TextField label="휴대폰 번호" placeholder="010-0000-0000" keyboardType="phone-pad" />
      <TextField label="큰 칸" placeholder="여러 줄" multiline />
    </View>
  ),
};

const styles = StyleSheet.create({ col: { gap: Spacing.stack } });
