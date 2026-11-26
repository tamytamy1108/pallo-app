import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { ONB_LANGS } from '@/components/onboarding/app-parts';
import { DoneTicket } from '@/components/onboarding/done-ticket';

import { padded } from '../_support/padded';

/** 체험 예약 확정 › 입장권 — 날짜 · 시간 · 지점 · 상담 언어 · 예약자 · 전달 사항, 그루터기에 CONFIRMED 도장 */
const meta = {
  title: 'Onboarding/DoneTicket',
  component: DoneTicket,
  args: { branch: '하남점', lang: ONB_LANGS[0], name: '김서현', phone: '010-1234-5678', day: '2026-12-03', time: '19:30', note: '' },
  decorators: [padded],
} satisfies Meta<typeof DoneTicket>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithNote: Story = { args: { note: '퇴근 후라 7시 이후가 좋아요' } };
/** 전달 사항이 길면 세 줄까지 (넘치면 …) */
export const LongNote: Story = {
  args: { note: '퇴근 후라 7시 이후가 좋아요. 발음 위주로 상담받고 싶고, 회화 수업 시간표도 같이 알려 주세요. 주차가 되는지도 궁금해요. 친구와 함께 가도 되나요?' },
};
/** 오전 시간 · 분 없는 시각 */
export const MorningTime: Story = { args: { time: '10:00' } };
/** 날짜 · 시간을 못 읽으면 '미정' */
export const Undecided: Story = { args: { day: '', time: '' } };
/** 예약자 · 지점이 비면 '—' */
export const MissingInfo: Story = { args: { branch: '', name: '', phone: '' } };
/** 상담 언어 4가지 태그 색 비교 */
export const AllLangs: Story = {
  render: (args) => (
    <View style={{ gap: 16 }}>
      {ONB_LANGS.map((l) => (
        <DoneTicket key={l.key} {...args} lang={l} />
      ))}
    </View>
  ),
};
