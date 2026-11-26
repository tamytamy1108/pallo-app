import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { StyleSheet, View } from 'react-native';

import { AvatarStage } from '@/components/character/avatar';
import { PText } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { AV_BG, AV_ITEMS, avFresh } from '@/data/my';

import { padded } from '../_support/padded';

const FX = AV_ITEMS.filter((i) => i.cat === 'fx');

/** 캐릭터 룸 — 배경 + 효과 + 캐릭터 + 말풍선 (300:220 · 둥글기 20). 배경은 이름(그림) 또는 '#…' 단색. */
const meta = {
  title: 'Character/AvatarStage',
  component: AvatarStage,
  args: { av: avFresh(), width: 320 },
  decorators: [padded],
} satisfies Meta<typeof AvatarStage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Bordered: Story = { args: { border: true } };
/** 말풍선 */
export const Say: Story = { args: { av: { ...avFresh(), say: '같이 말해요' } } };
/** 큰 말풍선 글씨 (마이 큰 무대) */
export const SayBig: Story = { args: { big: true, av: { ...avFresh(), say: "Let's go!" } } };
/** 말풍선 14자 꽉 채움 */
export const SayLong: Story = { args: { av: { ...avFresh(), say: '오늘도 출석했어요 다들 화이팅' } } };
/** 단색 배경 */
export const HexBackground: Story = { args: { av: { ...avFresh(), bg: '#493087' } } };
/** 효과 아이템 (첫 번째 fx) */
export const WithEffect: Story = { args: { av: { ...avFresh(), eq: { ...avFresh().eq, fx: FX[0]?.id ?? null } } } };
/** 없는 배경 이름 → 크림 룸 */
export const UnknownBackground: Story = { args: { av: { ...avFresh(), bg: 'nope' } } };

/** 배경 전부 */
export const AllBackgrounds: Story = {
  render: () => (
    <View style={styles.grid}>
      {AV_BG.map((b) => (
        <View key={b.id} style={styles.cell}>
          <AvatarStage av={{ ...avFresh(), bg: b.id }} width={150} border />
          <PText variant="small">{b.name}</PText>
        </View>
      ))}
    </View>
  ),
};

/** 효과 전부 */
export const AllEffects: Story = {
  render: () => (
    <View style={styles.grid}>
      {FX.map((f) => (
        <View key={f.id} style={styles.cell}>
          <AvatarStage av={{ ...avFresh(), eq: { ...avFresh().eq, fx: f.id } }} width={150} border />
          <PText variant="small">{f.name}</PText>
        </View>
      ))}
    </View>
  ),
};

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.stack },
  cell: { gap: Spacing.tight / 2 },
});
