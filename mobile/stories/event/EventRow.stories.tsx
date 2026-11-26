import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { EventRow } from '@/components/event/event-row';
import { EVENTS } from '@/data/events';

import { freshDevice } from '../_support/fresh-device';
import { padded } from '../_support/padded';
import { applied, ev, fillUp } from './_fixtures';

/**
 * 이벤트 한 줄(초대장) — 포스터 썸네일 · 종류 · 지점 · D-day · 금액(할인 전 취소선) · 남은 자리.
 * 남은 자리 칸: n자리 남음 / 참여 완료 / 마감 / (지난 이벤트) n명 참여 · 흐림.
 */
const meta = {
  title: 'Event/EventRow',
  component: EventRow,
  args: { e: ev('m2') },
  decorators: [padded],
  beforeEach: freshDevice(),
} satisfies Meta<typeof EventRow>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 다가옴 · 유료 · 할인 전 금액 */
export const UpcomingPaidDiscount: Story = {};
/** 다가옴 · 무료 */
export const UpcomingFree: Story = { args: { e: ev('e1') } };
/** 다가옴 · 비싼 여행 · 긴 날짜 줄 */
export const Trip: Story = { args: { e: ev('e4') } };
/** 신청함 — '참여 완료' */
export const Joined: Story = { beforeEach: freshDevice(() => applied('m2')) };
/** 자리 없음 — '마감' */
export const Full: Story = { args: { e: ev('e1') }, beforeEach: freshDevice(() => fillUp('e1')) };
/** 지난 이벤트 — 흐림 · '끝남' · n명 참여 */
export const Past: Story = { args: { e: ev('e7') } };
export const PastFree: Story = { args: { e: ev('e6') } };
/** 긴 제목 (2줄에서 자름) */
export const LongTitle: Story = { args: { e: { ...ev('e2'), title: '크리스마스 마켓 영어 투어 — 따뜻한 뱅쇼 한 잔과 함께 원어민 강사와 마켓 구석구석 돌아보기' } } };
/** 전부 한눈에 */
export const All: Story = {
  render: () => (
    <View style={{ gap: 10 }}>
      {EVENTS.map((e) => (
        <EventRow key={e.id} e={e} />
      ))}
    </View>
  ),
};
