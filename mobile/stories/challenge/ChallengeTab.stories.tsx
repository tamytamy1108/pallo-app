import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { queryKeys } from '@/api/queries';
import { ChallengeTab } from '@/components/challenge/challenge-tab';

import { LOADING_FOREVER } from '../_support/api';
import { setup, tap } from '../lounge/_fixtures';
import { lounge, ongoing, OTHERS, seed, upcoming } from './_lounge-fixtures';

/**
 * 라운지 '챌린지' 탭 본문 — 서버 응답(GET /challenges/lounge · /challenges/categories)을 미리 채워 상태마다 그려요.
 * 서브 칩(전체 · 참여 중 · 서버 분류) · 핫한 TOP 3 · 진행 중 | 참여 중 · 곧 시작해요.
 * '역할별' 스토리 — 내가 그 챌린지의 호스트 · 미참여 · 참여 중 · 참여 희망(승인 대기)일 때 카드 버튼 · 섹션이 어떻게 달라지는지.
 * 서브 칩 · 진행 중|참여 중은 컴포넌트 안 상태라 play 로 누른다.
 */
const meta = {
  title: 'Challenge/ChallengeTab',
  component: ChallengeTab,
  args: { branch: '전체' },
  beforeEach: setup(),
  parameters: {
    queries: seed(
      lounge([
        OTHERS.diary,
        OTHERS.walk,
        ongoing({ id: 'm1', title: '아침 7시 기상', category: 'HABIT', viewerRole: 'MEMBER', participantCount: 52, todayVerifiedCount: 20 }),
        ongoing({ id: 'm2', title: '주말 영어 라디오', viewerRole: 'MEMBER', verifiedToday: true, saved: true }),
        OTHERS.book,
      ]),
    ),
  },
} satisfies Meta<typeof ChallengeTab>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// ---- 역할별 ----

/** 호스트 — 내가 연 챌린지(진행 중 · 시작 전)는 '참여 중'에 들어가고 카드에 '참여 중' 표시 없이 오늘 인증 · 신청 완료 버튼 */
export const AsHost: Story = {
  parameters: {
    queries: seed(
      lounge([
        ongoing({ id: 'h1', title: '내가 연 · 하루 한 문장', viewerRole: 'HOST', participantCount: 18, todayVerifiedCount: 7 }),
        upcoming({ id: 'h2', title: '내가 연 · 다음 주 쉐도잉', viewerRole: 'HOST', participantCount: 3 }),
        OTHERS.diary,
        OTHERS.walk,
      ]),
    ),
  },
};
/** 호스트 · 참여 중 칩 — 내가 연 챌린지 목록 · 오늘 인증 남은 수 */
export const AsHostJoinedList: Story = { parameters: AsHost.parameters, play: () => tap('참여 중') };

/** 미참여 — 모든 카드가 참여하기 · 도전 신청, 참여 중은 비어 있어요 */
export const AsNonMember: Story = {
  parameters: { queries: seed(lounge([OTHERS.diary, OTHERS.walk, OTHERS.words, OTHERS.fit, OTHERS.book])) },
};
/** 미참여 · 참여 중 칩 — 빈 안내 */
export const AsNonMemberJoinedList: Story = { parameters: AsNonMember.parameters, play: () => tap('참여 중') };

/** 참여 중 — 오늘 인증 / 인증 완료 · 시작 전 신청 완료, 핫에도 '참여 중' 표시 */
export const AsMember: Story = {
  parameters: {
    queries: seed(
      lounge([
        ongoing({ ...OTHERS.diary, viewerRole: 'MEMBER' }),
        ongoing({ ...OTHERS.walk, viewerRole: 'MEMBER', verifiedToday: true }),
        upcoming({ ...OTHERS.book, viewerRole: 'MEMBER' }),
        OTHERS.words,
      ]),
    ),
  },
};
/** 참여 중 칩 — '오늘 인증 1개 남았어요' */
export const AsMemberJoinedList: Story = { parameters: AsMember.parameters, play: () => tap('참여 중') };
/** 참여 중 · 오늘 다 인증 — '오늘 인증 다 했어요!' */
export const AsMemberAllVerified: Story = {
  parameters: {
    queries: seed(lounge([ongoing({ ...OTHERS.diary, viewerRole: 'MEMBER', verifiedToday: true }), ongoing({ ...OTHERS.walk, viewerRole: 'MEMBER', verifiedToday: true })])),
  },
  play: () => tap('참여 중'),
};

/** 참여 희망(승인제 신청 · 승인 대기) — 진행 중 · 곧 시작에 남고 버튼이 '승인 대기', 참여 중 · 남은 인증 수에는 안 들어가요 */
export const AsPending: Story = {
  parameters: {
    queries: seed(
      lounge([
        ongoing({ ...OTHERS.diary, viewerRole: 'PENDING' }),
        upcoming({ ...OTHERS.book, viewerRole: 'PENDING' }),
        OTHERS.walk,
      ]),
    ),
  },
};
/** 참여 희망 · 참여 중 칩 — 아직 참여가 아니라 빈 안내 */
export const AsPendingJoinedList: Story = { parameters: AsPending.parameters, play: () => tap('참여 중') };

// ---- 그 밖의 상태 ----

/** 찜한 카드 — 하트가 채워져요 */
export const Saved: Story = {
  parameters: { queries: seed(lounge([ongoing({ ...OTHERS.diary, saved: true }), ongoing({ ...OTHERS.walk, saved: true }), OTHERS.words])) },
};
/** 운동 칩 — 그 분류로 새로 받은 목록 */
export const CategoryChip: Story = {
  parameters: {
    queries: seed(lounge([OTHERS.diary, OTHERS.walk, OTHERS.words]), [[queryKeys.challengeLounge('EXERCISE'), lounge([OTHERS.walk, OTHERS.fit])]]),
  },
  play: () => tap('운동'),
};
/** 열린 챌린지가 하나도 없음 */
export const Empty: Story = { parameters: { queries: seed(lounge([])) } };
/** 불러오는 중 */
export const Loading: Story = { parameters: { queries: [], api: { delayMs: LOADING_FOREVER } } };
/** 불러오지 못함 */
export const LoadError: Story = { parameters: { queries: [], api: { fail: ['challengeLounge'] } } };
/** 비회원 — 버튼 · 하트를 누르면 체험 안내 */
export const AsGuest: Story = { globals: { userKind: 'guest' } };
