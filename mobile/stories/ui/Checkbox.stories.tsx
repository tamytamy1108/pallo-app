import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { fn } from 'storybook/test';

import { SheetLink } from '@/components/common/sheet-parts';
import { Checkbox } from '@/components/ui/field';
import { Spacing } from '@/constants/theme';

import { padded } from '../_support/padded';

/** 체크 — 둥근 네모 · 켜면 보라 바탕에 흰 체크. 크기 22(기본) · 20(체험 신청 동의) */
const meta = {
  title: 'UI/Checkbox',
  component: Checkbox,
  args: { checked: false, label: '내 글에도 같이 올리기', onChange: fn() },
  decorators: [padded],
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Off: Story = {};
export const On: Story = { args: { checked: true } };
export const WithSub: Story = { args: { sub: '라운지 피드에도 같이 보여요' } };
export const WithSubOn: Story = { args: { checked: true, sub: '라운지 피드에도 같이 보여요' } };
/** 작은 크기 20 (글자도 조금 작아요) */
export const Small: Story = { args: { size: 20, label: '개인정보 수집 · 이용에 동의해요 (필수)' } };
export const SmallOn: Story = { args: { size: 20, checked: true, label: '개인정보 수집 · 이용에 동의해요 (필수)' } };
/** 오른쪽에 [보기] 링크 */
export const WithRight: Story = { args: { size: 20, label: '이용약관 동의 (필수)', right: <SheetLink label="보기" onPress={fn()} /> } };
export const LongLabel: Story = {
  args: { label: '아주 긴 동의 문구가 들어가면 여러 줄로 바뀌어도 네모는 가운데에 그대로 있어요. 한 줄 더 들어가요.', sub: '작은 설명도 길면 줄이 바뀌어요. 확인용으로 길게 적었어요.' },
};

/** 눌러서 켜고 끄기 */
export const Interactive: Story = {
  render: function Render(args) {
    const [on, setOn] = useState(false);
    return <Checkbox {...args} checked={on} onChange={setOn} />;
  },
};

/** 켜짐 · 꺼짐 · 크기 비교 */
export const AllVariants: Story = {
  render: (args) => (
    <View style={styles.col}>
      <Checkbox {...args} checked={false} />
      <Checkbox {...args} checked />
      <Checkbox {...args} checked={false} size={20} />
      <Checkbox {...args} checked size={20} sub="작은 설명" />
    </View>
  ),
};

const styles = StyleSheet.create({ col: { gap: Spacing.tight } });
