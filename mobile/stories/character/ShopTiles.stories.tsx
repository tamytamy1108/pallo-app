import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { StyleSheet, View } from 'react-native';

import { BodyArt, ItemArt, StageArt } from '@/components/character/avatar';
import { PText } from '@/components/ui/text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { AV_BG, AV_ITEMS, AVC_LIST, HAIR_SW } from '@/data/my';

import { padded } from '../_support/padded';

const TILE = 86;

function Tile({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <View style={styles.cell}>
      <View style={styles.tile}>{children}</View>
      <PText variant="small" numberOfLines={1} style={styles.name}>
        {name}
      </PText>
    </View>
  );
}

/** 꾸미기 상점 타일 그림 — 아이템(ItemArt) · 효과 · 배경(StageArt) · 몸 색(BodyArt). */
const meta = {
  title: 'Character/ShopTiles',
  component: ItemArt,
  args: { it: AV_ITEMS[0], width: 160, height: 160 },
  argTypes: { it: { control: false } },
  decorators: [padded],
} satisfies Meta<typeof ItemArt>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 아이템 하나 크게 */
export const Item: Story = {};
/** 헤어는 고르는 중인 머리 색으로 */
export const HairColors: Story = {
  render: () => {
    const hair = AV_ITEMS.find((i) => i.hair) ?? AV_ITEMS[0];
    return (
      <View style={styles.grid}>
        {HAIR_SW.map((hc) => (
          <Tile key={hc} name={hc}>
            <ItemArt it={hair} width={TILE} height={TILE} hc={hc} />
          </Tile>
        ))}
      </View>
    );
  },
};
/** 모든 아이템 (효과 빼고) */
export const AllItems: Story = {
  render: () => (
    <View style={styles.grid}>
      {AV_ITEMS.filter((i) => i.cat !== 'fx').map((it) => (
        <Tile key={it.id} name={it.name}>
          <ItemArt it={it} width={TILE} height={TILE} />
        </Tile>
      ))}
    </View>
  ),
};
/** 효과 타일 */
export const Effects: Story = {
  render: () => (
    <View style={styles.grid}>
      {AV_ITEMS.filter((i) => i.cat === 'fx').map((it) => (
        <Tile key={it.id} name={it.name}>
          <StageArt it={it} width={TILE} height={TILE} />
        </Tile>
      ))}
    </View>
  ),
};
/** 배경 타일 */
export const Backgrounds: Story = {
  render: () => (
    <View style={styles.grid}>
      {AV_BG.map((b) => (
        <Tile key={b.id} name={b.name}>
          <StageArt bgId={b.id} width={TILE} height={TILE} />
        </Tile>
      ))}
    </View>
  ),
};
/** 몸 색 타일 */
export const BodyColors: Story = {
  render: () => (
    <View style={styles.grid}>
      {[...AVC_LIST.map((c) => c[0]), '#E5484D', '#2F6FD0'].map((c) => (
        <Tile key={c} name={c}>
          <BodyArt color={c} width={TILE} />
        </Tile>
      ))}
    </View>
  ),
};

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.tight },
  cell: { width: TILE, gap: Spacing.tight / 2 },
  tile: { width: TILE, height: TILE, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: Radius.control, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white },
  name: { textAlign: 'center' },
});
