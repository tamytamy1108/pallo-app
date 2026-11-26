import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { AlbumThumb } from '@/components/meet/album-art';
import type { AlbumArt } from '@/data/meet';

import { padded } from '../_support/padded';

const KINDS: AlbumArt[] = ['party', 'ramen', 'book', 'run', 'trip', 'cafe'];

/** 동아리 사진첩 · 정기 모임 썸네일 예시 그림 6가지 (350 판을 칸 크기로 줄인다). */
const meta = {
  title: 'Meet/AlbumThumb',
  component: AlbumThumb,
  args: { k: 'party', size: 160 },
  decorators: [padded],
} satisfies Meta<typeof AlbumThumb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Party: Story = {};
export const All: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {KINDS.map((k) => (
        <AlbumThumb key={k} k={k} size={104} />
      ))}
    </View>
  ),
};
/** 작은 칸 (일정 줄 썸네일 72) */
export const Small: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {KINDS.map((k) => (
        <AlbumThumb key={k} k={k} size={48} />
      ))}
    </View>
  ),
};
