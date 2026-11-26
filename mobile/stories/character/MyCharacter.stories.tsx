import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { MyCharacter } from '@/components/character/my-character';
import { setAvatarBody } from '@/state/avatar';

import { freshDevice } from '../_support/fresh-device';
import { padded } from '../_support/padded';

/** 내 캐릭터 (마이 › 꾸미기에서 저장한 모습) — size × size 칸. flip 은 저장한 방향을 한 번 더 뒤집어요. */
const meta = {
  title: 'Character/MyCharacter',
  component: MyCharacter,
  args: { size: 200 },
  decorators: [padded],
  // 저장한 모습(기기에 남는 값)을 처음 모습으로
  beforeEach: freshDevice(),
} satisfies Meta<typeof MyCharacter>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 처음 모습 */
export const Default: Story = {};
export const Flipped: Story = { args: { flip: true } };
export const NoBlink: Story = { args: { blink: false } };
export const Small: Story = { args: { size: 64 } };
/** 몸 색을 보라로 저장했을 때 */
export const PurpleBody: Story = { beforeEach: () => setAvatarBody('purple') };
/** 직접 고른 색으로 저장했을 때 */
export const CustomBody: Story = { beforeEach: () => setAvatarBody('#2DD4BF') };
