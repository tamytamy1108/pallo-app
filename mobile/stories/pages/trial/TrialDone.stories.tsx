import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import TrialDoneScreen from '@/app/(app)/trial/done';
import { setAvatarBody } from '@/state/avatar';
import { setLastTrial, type TrialDraft } from '@/state/trial-booking';

import { freshDevice } from '../../_support/fresh-device';
import { FILLED_TRIAL } from '../../onboarding/_onb';

/** 방금 한 예약(state/trial-booking — 앱을 켠 동안만 있는 값)을 넣어요 */
const booked = (b: Partial<TrialDraft> = {}, body?: string) =>
  freshDevice(() => {
    setLastTrial({ ...FILLED_TRIAL, ...b });
    if (body) setAvatarBody(body);
  });

/**
 * 앱 안 체험 예약 확정 (/trial/done) — '첫 무대 입장권'. 무대에는 마이에서 꾸민 몸 색 팔로로. [확인] → 보던 화면으로.
 * 예약 없이 주소로 바로 들어오면 홈으로 보내서(빈 화면) 스토리는 두지 않아요.
 */
const meta = {
  title: 'Pages/Trial/Done',
  component: TrialDoneScreen,
  parameters: { route: { pathname: '/trial/done' } },
  globals: { userKind: 'trial' },
  beforeEach: booked(),
} satisfies Meta<typeof TrialDoneScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 하남점 · 영어 · 전달 사항 있음 */
export const Default: Story = {};
/** 전달 사항 없음 */
export const NoNote: Story = { beforeEach: booked({ note: '' }) };
/** 일본어 · 다른 지점 */
export const Japanese: Story = { beforeEach: booked({ branch: '잠실점', langs: ['ja'] }) };
/** 마이에서 몸 색을 분홍으로 꾸몄을 때 */
export const PinkPalloro: Story = { beforeEach: booked({}, 'pink') };
