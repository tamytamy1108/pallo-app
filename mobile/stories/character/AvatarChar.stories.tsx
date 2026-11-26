import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { StyleSheet, View } from 'react-native';

import { AvatarChar } from '@/components/character/avatar';
import { PText } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { AVC_LIST, avFresh, memberAvatar, type Avatar } from '@/data/my';

import { padded } from '../_support/padded';

const bare = (color: string): Avatar => ({ ...avFresh(), color, eq: { hair: null, eye: null, mitt: null, shoe: null, hat: null, face: null, wear: null, hand: null, acc: null, fx: null } });

/**
 * 꾸민 캐릭터(몸 + 입은 아이템)만 · 배경 없이. 추천 색은 원본 PNG, 직접 고른 색('#…')은 노랑 원본을 색만 바꿔요.
 * 깜빡임(blink)은 3초마다 · 움직임 줄이기면 안 깜빡여요.
 */
const meta = {
  title: 'Character/AvatarChar',
  component: AvatarChar,
  args: { av: avFresh(), width: 220 },
  decorators: [padded],
} satisfies Meta<typeof AvatarChar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 처음 모습 (비니 · 줄무늬 티 · 나비넥타이 · 깃발 · 보라 운동화) */
export const Fresh: Story = {};
/** 아이템 없이 몸만 */
export const Bare: Story = { args: { av: bare('yellow') } };
export const Flipped: Story = { args: { flip: true } };
export const NoBlink: Story = { args: { blink: false } };
/** 직접 고른 색 (#8B5CF6) */
export const CustomColor: Story = { args: { av: { ...avFresh(), color: '#8B5CF6' } } };
export const Small: Story = { args: { width: 80 } };

/** 추천 몸 색 전부 + 직접 고른 색 */
export const AllColors: Story = {
  render: () => (
    <View style={styles.grid}>
      {[...AVC_LIST.map((c) => c[0]), '#2DD4BF', '#E5484D', '#3A3A48'].map((c) => (
        <View key={c} style={styles.cell}>
          <AvatarChar av={bare(c)} width={100} />
          <PText variant="small">{c}</PText>
        </View>
      ))}
    </View>
  ),
};

/** 멤버마다 이름으로 고른 모습 (모자 · 헤어 · 눈 · 옷 · 손 아이템 섞임) */
export const Members: Story = {
  render: () => (
    <View style={styles.grid}>
      {['하나', 'Jay', '민서', '라파', '서준', '예린', 'Kenji', '다온', '지우', '소라', 'Leo', '유키'].map((n) => (
        <View key={n} style={styles.cell}>
          <AvatarChar av={memberAvatar(n)} width={100} />
          <PText variant="small">{n}</PText>
        </View>
      ))}
    </View>
  ),
};

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.feed },
  cell: { alignItems: 'center', gap: Spacing.tight, paddingTop: Spacing.feed + Spacing.stack },
});
