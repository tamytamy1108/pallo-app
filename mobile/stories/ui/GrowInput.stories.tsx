import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { fn } from 'storybook/test';

import { GrowInput } from '@/components/ui/grow-input';
import { Font } from '@/constants/fonts';
import { Colors, Radius } from '@/constants/theme';

import { padded } from '../_support/padded';

const LONG = Array.from({ length: 10 }, (_, i) => `${i + 1}번째 줄이에요. 길게 쓰면 칸이 한 줄씩 늘어나요.`).join('\n');

/**
 * 여러 줄 입력칸 — 길게 쓰면 칸이 저절로 늘어나요. maxLines 를 주면 그 줄 수까지만 늘고 칸 안에서 스크롤해요.
 * 모양(테두리 · 둥글기)은 쓰는 자리 style 그대로라, 스토리는 댓글 알약 모양을 줘요. 포커스하면 보라 링(ring=false 면 없음).
 */
const meta = {
  title: 'UI/GrowInput',
  component: GrowInput,
  args: { placeholder: '대화에 참여하세요…', placeholderTextColor: '#8C8597', onChangeText: fn() },
  decorators: [padded],
  render: function Render(args) {
    const [v, setV] = useState(args.value ?? '');
    return <GrowInput {...args} value={v} onChangeText={setV} style={styles.input} />;
  },
} satisfies Meta<typeof GrowInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};
export const OneLine: Story = { args: { value: '최고예요!' } };
/** 끝없이 늘어요 (양식 칸) */
export const Grows: Story = { args: { value: LONG } };
/** 최대 4줄 — 넘으면 칸 안에서 스크롤 */
export const MaxLines: Story = { args: { value: LONG, maxLines: 4 } };
/** 포커스 링 없이 */
export const NoRing: Story = { args: { ring: false, value: '포커스해도 보라 링이 안 생겨요' } };

const styles = StyleSheet.create({
  input: { minHeight: 44, paddingHorizontal: 16, paddingTop: 11, paddingBottom: 11, borderRadius: Radius.cardSm, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, fontFamily: Font.body600, fontSize: 14, lineHeight: 20, color: Colors.ink },
});
