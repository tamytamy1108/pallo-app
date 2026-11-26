import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { LgIcon } from '@/components/common/icons';
import { Pressable } from '@/components/ui/pressable';
import { HeartPop } from '@/components/ui/heart-pop';
import { PText } from '@/components/ui/text';
import { Colors, Spacing } from '@/constants/theme';

import { padded } from '../_support/padded';

const PINK = '#E5484D';

/** 하트를 누르면 톡 커졌다 돌아오고, 끄면 살짝 줄었다 돌아와요. 처음 그릴 때는 움직이지 않아요. */
const meta = {
  title: 'UI/HeartPop',
  component: HeartPop,
  args: { on: false, children: null },
  decorators: [padded],
  render: function Render(args) {
    const [on, setOn] = useState(args.on);
    return (
      <Pressable onPress={() => setOn((v) => !v)} accessibilityRole="button" accessibilityLabel="좋아요" style={styles.row}>
        <HeartPop on={on}>
          <LgIcon name="heart" size={28} fill={on ? PINK : 'none'} color={on ? PINK : Colors.ink} />
        </HeartPop>
        <PText variant="bodyStrong">{on ? '좋아요 누름 · 눌러서 끄기' : '눌러서 좋아요'}</PText>
      </Pressable>
    );
  },
} satisfies Meta<typeof HeartPop>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Off: Story = {};
/** 이미 좋아요한 글을 열었을 때 (움직임 없이 켜진 채) */
export const On: Story = { args: { on: true } };

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.tight } });
