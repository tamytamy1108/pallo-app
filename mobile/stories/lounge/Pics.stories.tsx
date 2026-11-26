import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { PIC_BG, PosterArt, PostArt, Stripes } from '@/components/lounge/pics';
import { Colors } from '@/constants/theme';
import { LG_C, type PicKey } from '@/data/lounge';

import { padded } from '../_support/padded';

const PICS = Object.keys(PIC_BG) as PicKey[];

/** 글 사진 자리 그림 · 번개 포스터 — 실제 사진 대신 그리는 브랜드 색 그림. */
const meta = {
  title: 'Lounge/Pics',
  component: PostArt,
  args: { pic: 'party', uid: 'story' },
  decorators: [padded],
  render: (args) => (
    <View style={{ height: 330, borderRadius: 20, borderWidth: 2, borderColor: Colors.ink, overflow: 'hidden', backgroundColor: PIC_BG[args.pic] }}>
      <PostArt {...args} />
    </View>
  ),
} satisfies Meta<typeof PostArt>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Party: Story = {};
export const Ramen: Story = { args: { pic: 'ramen' } };
export const Book: Story = { args: { pic: 'book' } };
export const Run: Story = { args: { pic: 'run' } };
export const Trip: Story = { args: { pic: 'trip' } };
export const Cafe: Story = { args: { pic: 'cafe' } };

/** 글 그림 6가지 한눈에 */
export const AllPostArt: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {PICS.map((k) => (
        <View key={k} style={{ width: 160, height: 160, borderRadius: 16, borderWidth: 2, borderColor: Colors.ink, overflow: 'hidden', backgroundColor: PIC_BG[k] }}>
          <PostArt pic={k} uid={`all-${k}`} />
        </View>
      ))}
    </View>
  ),
};

/** 포스터 무늬 4가지 (id 글자 합으로 정해진다) — 위 줄 지금, 아래 줄 지난 번개(흑백) */
export const Posters: Story = {
  render: () => (
    <View style={{ gap: 10 }}>
      {[false, true].map((past) => (
        <View key={String(past)} style={{ flexDirection: 'row', gap: 8 }}>
          {['a', 'b', 'c', 'd'].map((id, i) => (
            <View key={id} style={{ width: 82, height: 120, borderRadius: 12, borderWidth: 2, borderColor: Colors.ink, overflow: 'hidden' }}>
              <PosterArt id={id} word={'NEW\nMEET'} bg={[LG_C.pk, LG_C.pu, LG_C.y, LG_C.sky][i]} past={past} wordSize={18} />
            </View>
          ))}
        </View>
      ))}
    </View>
  ),
};

/** 큰 포스터 (번개 카드 위 200px) */
export const PosterLarge: Story = {
  render: () => (
    <View style={{ height: 200, borderRadius: 16, borderWidth: 2, borderColor: Colors.ink, overflow: 'hidden' }}>
      <PosterArt id="m1" word={'AFTER\nWORK\nBEER'} bg={LG_C.pk} />
    </View>
  ),
};

/** 사선 줄무늬 진하기 */
export const StripesAlpha: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {[0.1, 0.18, 0.4].map((a) => (
        <View key={a} style={{ width: 100, height: 100, borderRadius: 12, overflow: 'hidden', backgroundColor: LG_C.pk }}>
          <Stripes id={`st-${a}`} alpha={a} />
        </View>
      ))}
    </View>
  ),
};
