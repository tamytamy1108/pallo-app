import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { submitChangeRequest } from '@/components/account/store';
import MyScreen from '@/app/(app)/(tabs)/my';

import { asRole, followingOf, fresh } from '../../my/_state';

/**
 * 마이 탭 (/my) — 회원은 PRO'S NOTE · 내 스터디 · 지점 안내까지 보이고, 비회원은 랭킹 윗부분 아래가 '지점 회원이 되면 열려요' 칸.
 * 설정 톱니는 회원 · 앱 구독자만 진하게. 아래 목록의 이용권 줄: 회원 '이용권 · 결제 내역' · 앱 구독 '결제 내역' · 그 밖엔 없음.
 * 역할(리더 · 매니저)로 갈리는 곳은 지금 없다 — 같은 모양인지 확인용.
 */
const meta = {
  title: 'Pages/Tabs/My',
  component: MyScreen,
  parameters: { route: { pathname: '/my' } },
  beforeEach: fresh(),
} satisfies Meta<typeof MyScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Member: Story = { globals: { userKind: 'member' } };
/** 연동 대기 — '연동 승인 대기중' · 회원 칸 없음 · 잠김 */
export const Pending: Story = { globals: { userKind: 'pending' } };
/** 연동 안 됨 — '연동 신청하기' 칩 · 잠김 */
export const Rejected: Story = { globals: { userKind: 'rejected' } };
export const Trial: Story = { globals: { userKind: 'trial' } };
/** 앱 구독만 — 비회원과 같이 잠김 칸 */
export const AppOnly: Story = { globals: { userKind: 'app' } };
export const Guest: Story = { globals: { userKind: 'guest' } };

export const Leader: Story = { globals: { userKind: 'member' }, beforeEach: asRole('leader') };
export const Manager: Story = { globals: { userKind: 'member' }, beforeEach: asRole('manager') };

/** 활동 많은 회원 — 연속 학습 · 랭킹 1위 · 모임 · 팔로잉 · 소개 */
export const ActiveMember: Story = {
  globals: { userKind: 'member' },
  beforeEach: fresh({ streak: 42, weekPoints: 800, joinedMeets: 5, savedMeets: 3, postCount: 12, sparks: 9870, bio: '매일 한 문장씩!', following: followingOf('지우', '소라', 'Leo') }),
};
/** 변경 신청 중 — 내 스터디 카드에 '연기 신청 · 운영진 확인 중' */
export const ChangeRequested: Story = {
  globals: { userKind: 'member' },
  beforeEach: fresh({}, () => submitChangeRequest({ label: '연기', txt: '영어 월수 21:00 수업을 11/25(수)부터 12/8(화)까지 쉬어요', msg: '' })),
};
