import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { View } from 'react-native';

import { LibHead, MapTabs, SitChips } from '@/components/library/lib-head';

import { padded } from '../_support/padded';
import { SIT_MAPS, SOON_MAPS } from './_fixtures';

/** 라이브러리 위 줄 — 제목 + 언어 배지(누르면 언어 메뉴). 언어 4종 · 메뉴 열림 · 맵 탭 · 상황 맵 칩. */
const meta = {
  title: 'Library/LibHead',
  component: LibHead,
  args: { lang: 0, open: false, onLang: fn(), setOpen: fn() },
  decorators: [padded],
} satisfies Meta<typeof LibHead>;

export default meta;
type Story = StoryObj<typeof meta>;

export const English: Story = {};
export const Japanese: Story = { args: { lang: 1 } };
export const Chinese: Story = { args: { lang: 2 } };
export const Spanish: Story = { args: { lang: 3 } };
/** 언어 메뉴 열림 (지금 언어 표시) — 메뉴가 아래로 떠서 높이를 둔다 */
export const MenuOpen: Story = {
  args: { open: true, lang: 1 },
  decorators: [
    (Story) => (
      <View style={{ height: 260 }}>
        <Story />
      </View>
    ),
  ],
};

/** [스터디 맵 | 상황 맵] 탭 — 스터디 · 상황 · 새 상황 맵 NEW */
export const Tabs: Story = {
  render: () => (
    <View style={{ gap: 16 }}>
      <MapTabs sitMode={false} sitNew={false} onMode={fn()} />
      <MapTabs sitMode sitNew={false} onMode={fn()} />
      <MapTabs sitMode={false} sitNew onMode={fn()} />
    </View>
  ),
};

/** 상황 맵 칩 — 고른 맵 · NEW · 곧 열릴 맵(점선) / NEW 맵을 고른 때 / 맵 하나뿐 */
export const Chips: Story = {
  render: () => (
    <View style={{ gap: 16 }}>
      <SitChips maps={SIT_MAPS} soons={SOON_MAPS} current={SIT_MAPS[0]?.id ?? ''} isNew={(m) => !!m.isNew} onPick={fn()} onSoon={fn()} />
      <SitChips maps={SIT_MAPS} soons={[]} current={SIT_MAPS.find((m) => m.isNew)?.id ?? ''} isNew={() => false} onPick={fn()} onSoon={fn()} />
      <SitChips maps={SIT_MAPS.slice(0, 1)} soons={[]} current={SIT_MAPS[0]?.id ?? ''} isNew={() => false} onPick={fn()} onSoon={fn()} />
    </View>
  ),
};
