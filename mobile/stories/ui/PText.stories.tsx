import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { StyleSheet, View } from 'react-native';

import { PText, type TextVariant } from '@/components/ui/text';
import { Colors, Spacing } from '@/constants/theme';

import { padded } from '../_support/padded';

const VARIANTS: TextVariant[] = ['poster', 'display', 'headline', 'title', 'body', 'bodyStrong', 'label', 'small'];

/** PALLO 글자 단계 — 제목 글꼴(Unbounded)은 한글 부분만 같은 굵기의 Noto 로 나눠 그려요. */
const meta = {
  title: 'UI/PText',
  component: PText,
  args: { children: '1과 Cafe Complaint', variant: 'body' },
  argTypes: { variant: { control: 'select', options: VARIANTS } },
  decorators: [padded],
} satisfies Meta<typeof PText>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Poster: Story = { args: { variant: 'poster', children: 'PALLO!' } };
export const Display: Story = { args: { variant: 'display', children: 'Hey Tammy,' } };
export const Headline: Story = { args: { variant: 'headline', children: '라이브러리' } };
/** 한글 · 영문 섞임 — 영문 · 숫자는 Unbounded, 한글은 Noto */
export const Title: Story = { args: { variant: 'title' } };
export const Body: Story = { args: { children: '세션 전에 예습하고, 세션 날에는 출석해요.' } };
export const BodyStrong: Story = { args: { variant: 'bodyStrong', children: '이번 주 진도 5 & 6챕터' } };
export const Label: Story = { args: { variant: 'label', children: 'NEW · 이번 주' } };
export const Small: Story = { args: { variant: 'small', color: Colors.inkSub, children: '보조 글자 · 12px' } };
export const Colored: Story = { args: { variant: 'title', color: Colors.purple, children: '보라 제목' } };
/** 한글은 낱말 단위로 줄바꿈 (keep-all) */
export const LongKorean: Story = {
  args: { variant: 'headline', children: '낯선 언어로 건넨 첫마디, 그게 당신의 첫 무대예요. 한 줄이 넘으면 낱말 단위로 줄이 바뀌어요.' },
};

/** 모든 단계 비교 */
export const AllVariants: Story = {
  render: () => (
    <View style={styles.col}>
      {VARIANTS.map((v) => (
        <PText key={v} variant={v}>
          {`${v} 1과 Cafe`}
        </PText>
      ))}
    </View>
  ),
};

const styles = StyleSheet.create({ col: { gap: Spacing.tight } });
