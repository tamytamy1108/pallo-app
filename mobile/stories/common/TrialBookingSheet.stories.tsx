import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { TrialBookingSheet } from '@/components/common/trial-booking';
import { resetOnboarding, updateOnboarding } from '@/state/onboarding';

import { behindSheet } from '../ui/_overlay';

/** 전달 사항(가입 때 적은 값 · state/onboarding note)을 맞춰요 — 앞 스토리 값이 남지 않게 */
const withNote = (note: string) => () => {
  resetOnboarding();
  updateOnboarding({ note });
  return resetOnboarding;
};

/** 체험 예약 내용 시트 — 지점 · 날짜 · 시간 · 언어 · 내용 · 전달 사항(있으면) + [예약 바꾸기] [지점에 전화하기]. */
const meta = {
  title: 'Common/TrialBookingSheet',
  component: TrialBookingSheet,
  args: { open: true, onClose: fn(), trial: { branch: '하남점', day: '2026-12-03', time: '19:30', lang: 'en' } },
  decorators: [behindSheet],
  beforeEach: withNote(''),
} satisfies Meta<typeof TrialBookingSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 영어 · 전달 사항 없음 */
export const English: Story = {};
export const Japanese: Story = { args: { trial: { branch: '잠실점', day: '2026-12-05', time: '14:00', lang: 'ja' } } };
export const Chinese: Story = { args: { trial: { branch: '홍대점', day: '2026-12-08', time: '20:00', lang: 'zh' } } };
export const Spanish: Story = { args: { trial: { branch: '영등포점', day: '2026-12-10', time: '11:30', lang: 'es' } } };
/** 가입 때 전달 사항을 적었으면 한 줄 더 */
export const WithNote: Story = { beforeEach: withNote('주차 가능한지 궁금해요. 조금 늦을 수도 있어요.') };
export const LongNote: Story = {
  beforeEach: withNote('처음이라 많이 긴장돼요. 영어는 중학교 이후로 거의 안 써서 아주 기초부터 해야 할 것 같아요. 퇴근하고 바로 가서 5~10분 늦을 수 있어요. 미리 연락드릴게요!'),
};
