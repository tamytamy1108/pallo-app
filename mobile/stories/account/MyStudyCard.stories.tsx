import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { mockStudy } from '@/api/my-page';
import { MyStudyCard } from '@/components/account/my-study-card';
import { submitChangeRequest } from '@/components/account/store';

import { padded } from '../_support/padded';
import { fresh } from '../my/_state';

/** 마이 '내 스터디' 카드 — 남은 횟수 고리 · 이용권 · 팀 시간표 · [연기 · 팀 · 지점 변경] 또는 '○○ 신청 · 운영진 확인 중'. */
const meta = {
  title: 'Account/MyStudyCard',
  component: MyStudyCard,
  decorators: [padded],
  beforeEach: fresh(),
  args: { study: mockStudy() },
} satisfies Meta<typeof MyStudyCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 신청 없음 — [연기 · 팀 · 지점 변경] */
export const Default: Story = {};
/** 제목 없이 (내 스터디 화면) */
export const NoTitle: Story = { args: { title: false } };
/** 팀 변경 · 연기 제한이 있고 리더가 안 정해진 팀 */
export const LimitedNoLeader: Story = {
  args: { study: { ...mockStudy(), remainingHoldingCount: 1, remainingCourseChangeCount: 0, teams: mockStudy().teams.map((t, i) => (i ? t : { ...t, leaderName: null })) } },
};
/** 연기 신청 중 — [신청 취소] */
export const RequestPending: Story = {
  beforeEach: fresh({}, () => submitChangeRequest({ label: '연기', txt: '영어 월수 21:00 · 14일 연기 · 11/25(수)~12/8(화) · 12/9(수) 복귀', msg: '' })),
};
/** 지점 변경 신청 중 — 긴 안내 */
export const BranchChangePending: Story = {
  beforeEach: fresh({}, () =>
    submitChangeRequest({ label: '지점 변경', txt: '11/30(월)까지 영어 화목 19:30, 12/1(화)부터 잠실점 영어 화목 20:00에서 들어요 · 이사 때문에 지점을 옮기고 싶어요. 가능한 빨리 부탁드려요.', msg: '이사해요' }),
  ),
};
