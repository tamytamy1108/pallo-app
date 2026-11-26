import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { ProposalCards } from '@/components/event/proposal-cards';

import { freshDevice } from '../_support/fresh-device';
import { padded } from '../_support/padded';
import { PROPOSALS, proposed } from './_fixtures';

/** '내가 제안한 이벤트' 카드 — 보낸 제안(기기 저장)이 있을 때만. 사진 없으면 연보라 칸. 없으면 아무것도 안 그린다. */
const meta = {
  title: 'Event/ProposalCards',
  component: ProposalCards,
  decorators: [padded],
  beforeEach: freshDevice(() => proposed()),
} satisfies Meta<typeof ProposalCards>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 두 개 (사진 없음 · 사진 + 긴 제목) */
export const Default: Story = {};
/** 하나 */
export const One: Story = { beforeEach: freshDevice(() => proposed(PROPOSALS.slice(0, 1))) };
/** 제안 없음 — 빈 칸 (아무것도 안 그림) */
export const None: Story = { beforeEach: freshDevice() };
