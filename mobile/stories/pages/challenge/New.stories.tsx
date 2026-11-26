import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import NewChallengeScreen from '@/app/(app)/challenge/new';

import { setup, tapText } from '../../lounge/_fixtures';

const at = (expr?: string) => ({ route: { params: expr ? { expr } : {}, pathname: '/challenge/new' } });

/** 챌린지 열기 (/challenge/new, ?expr=<id,id>) — 키 큰 시트. 내 표현함에서 고른 표현 · 같은 표현이 이미 있을 때 · 일상 챌린지. */
const meta = {
  title: 'Pages/Challenge/New',
  component: NewChallengeScreen,
  parameters: at(),
  beforeEach: setup(),
} satisfies Meta<typeof NewChallengeScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
/** ?expr=m1 — 고른 표현 */
export const PresetExpression: Story = { parameters: at('m1') };
/** ?expr=m3 — 같은 표현 챌린지가 이미 있음 */
export const PresetDuplicate: Story = { parameters: at('m3') };
/** 없는 표현 id (고른 것 없이 열림) */
export const PresetUnknown: Story = { parameters: at('nope') };
/** 일상 챌린지 (아침 루틴) */
export const Daily: Story = { play: () => tapText('아침 루틴') };
/** 비회원 */
export const AsGuest: Story = { globals: { userKind: 'guest' } };
