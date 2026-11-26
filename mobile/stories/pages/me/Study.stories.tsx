import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { submitChangeRequest } from '@/components/account/store';
import MyStudyScreen from '@/app/(app)/me/study';

import { fresh } from '../../my/_state';

/** 내 스터디 (/me/study) — 회원만. 변경 신청 중이면 카드에 '운영진 확인 중'. */
const meta = {
  title: 'Pages/Me/Study',
  component: MyStudyScreen,
  parameters: { route: { pathname: '/me/study' } },
  beforeEach: fresh(),
} satisfies Meta<typeof MyStudyScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Member: Story = { globals: { userKind: 'member' } };
export const ChangeRequested: Story = {
  globals: { userKind: 'member' },
  beforeEach: fresh({}, () => submitChangeRequest({ label: '팀 변경', txt: '11/30(월)까지 영어 화목 19:30, 12/1(화)부터 영어 월수 21:00에서 들어요', msg: '' })),
};
export const Guest: Story = { globals: { userKind: 'guest' } };
export const Pending: Story = { globals: { userKind: 'pending' } };
