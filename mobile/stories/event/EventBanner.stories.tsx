import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { EventBanner } from '@/components/event/event-banner';
import { splitEvents } from '@/components/event/event-model';
import { EVENTS } from '@/data/events';

import { padded } from '../_support/padded';
import { ev } from './_fixtures';

/** 이벤트 탭 배너 — 다가오는 이벤트 최대 5개가 2초마다 넘어간다 (점 · n / 전체). 하나면 넘어가지 않는다. 비면 안 그린다. */
const meta = {
  title: 'Event/EventBanner',
  component: EventBanner,
  args: { list: splitEvents(EVENTS).up.slice(0, 5) },
  decorators: [padded],
} satisfies Meta<typeof EventBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 다가오는 이벤트 (마감 임박한 순) */
export const Default: Story = {};
/** 하나뿐 (자동 넘김 없음) */
export const Single: Story = { args: { list: [ev('e4')] } };
/** 무료 이벤트 · 긴 제목 */
export const FreeLongTitle: Story = { args: { list: [{ ...ev('e1'), title: '지점 대항 스피킹 대회 — 올해 마지막 대회라 상품도 두 배로 준비했어요' }] } };
