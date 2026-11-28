import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import BadgesScreen from '@/app/(app)/me/badges';
import { BadgeDetailSheet } from '@/components/my/badge-detail-sheet';
import { MY_BADGES } from '@/data/my';

import { fresh } from '../../my/_state';

const pick = (code: string) => MY_BADGES.find((b) => b.code === code) ?? MY_BADGES[0];

/**
 * 배지 모두 보기 (/me/badges) — 받은 개수 · 거의 다 왔어요 · 칸 · 배지는 이렇게 받아요. 예시 배지(data/my MY_BADGES).
 * 아래는 칸을 누르면 뜨는 배지 상세 시트 (받는 방법 · 진행 · 하러 가기).
 */
const meta = {
  title: 'Pages/Me/Badges',
  component: BadgesScreen,
  parameters: { route: { pathname: '/me/badges' } },
  beforeEach: fresh(),
} satisfies Meta<typeof BadgesScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Page: Story = {};
/** 상세 — 못 받은 배지 · 진행 중 (번개 2 / 5번) */
export const DetailInProgress: Story = { render: () => <BadgeDetailSheet open={{ badge: pick('hangout-5'), colorIndex: 0 }} onClose={fn()} /> };
/** 상세 — 받은 배지 (받은 날) */
export const DetailEarned: Story = { render: () => <BadgeDetailSheet open={{ badge: pick('first-hangout'), colorIndex: 1 }} onClose={fn()} /> };
/** 상세 — 서버가 아직 진행을 못 세는 배지 (주간 랭킹) */
export const DetailPending: Story = { render: () => <BadgeDetailSheet open={{ badge: pick('weekly-top-3'), colorIndex: 2 }} onClose={fn()} /> };
