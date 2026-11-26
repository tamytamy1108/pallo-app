import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { CapBar, RecChalCard, RecMeetCard } from '@/components/lounge/rec-cards';
import { Colors } from '@/constants/theme';
import { LG_C } from '@/data/lounge';

import { padded } from '../_support/padded';
import { feedItem, meetDay, setup } from './_fixtures';

const m1 = feedItem('m1', 'meet');
const m2 = feedItem('m2', 'meet');

/**
 * 추천 탭에 섞이는 번개 · 파티 티켓 카드. 날짜는 오늘 기준으로 맞춰(D-n) 예시 날짜가 지나도 같은 모습.
 * 버튼: 참여하기 · 빈자리 알림 받기(꽉 참) · 후기 보기(지남).
 */
const meta = {
  title: 'Lounge/RecMeetCard',
  component: RecMeetCard,
  args: { p: { ...m1, ...meetDay(3) } },
  decorators: [padded],
  beforeEach: setup(),
} satisfies Meta<typeof RecMeetCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 번개 · D-3 · 자리 있음 (점선 + 양옆 홈) */
export const Meet: Story = {};
export const Today: Story = { args: { p: { ...m1, ...meetDay(0) } } };
/** 꽉 참 — 빈자리 알림 받기 */
export const Full: Story = { args: { p: { ...m1, ...meetDay(2), cur: 8, max: 8 } } };
/** 지난 번개 — 흑백 · 흐림 · 후기 보기 */
export const Past: Story = { args: { p: { ...m1, ...meetDay(-3) } } };
/** 파티 (왕관 · 참가비) */
export const Party: Story = { args: { p: { ...m2, ...meetDay(4) } } };
/** 무료 파티 */
export const PartyFree: Story = { args: { p: { ...m2, ...meetDay(4), id: 'sb-free', fee: undefined } } };
/** 긴 제목 (두 줄에서 잘림) · 긴 장소 */
export const LongTitle: Story = {
  args: { p: { ...m1, ...meetDay(5), id: 'sb-long', title: '퇴근 후 영어로만 이야기하는 수제맥주 번개 — 처음 오는 분도 환영해요 꼭 오세요', place: '영등포 타임스퀘어 근처 2층 수제맥주집 (지하철 5번 출구)' } },
};

/** 인원 막대 — 0 · 반 · 꽉 · 넘침 · 흑백 */
export const CapBars: Story = {
  render: () => (
    <View style={{ gap: 10 }}>
      <CapBar cur={0} max={8} />
      <CapBar cur={4} max={8} />
      <CapBar cur={8} max={8} />
      <CapBar cur={10} max={8} />
      <CapBar cur={5} max={8} color={Colors.inkSub} />
    </View>
  ),
};

/** 표현 챌린지 카드 ('나만의 문장 완성하기') — 사람 5명(+2) */
export const Challenge: Story = { render: () => <RecChalCard p={feedItem('c1', 'chal')} /> };
/** 표현 챌린지 · 사람 3명 이하 (+N 없음) */
export const ChallengeFew: Story = { render: () => <RecChalCard p={{ ...feedItem('c1', 'chal'), people: ['소라', '하나'], lines: 2, left: 1 }} /> };
/** 표현 챌린지 · 긴 표현 */
export const ChallengeLong: Story = {
  render: () => <RecChalCard p={{ ...feedItem('c1', 'chal'), av: LG_C.pk, hl: 'I couldn’t agree with you more on that point', ko: '그 점에 대해서는 전적으로 동의해요', last: ['Leo', '회의에서 이 문장 그대로 썼는데 다들 놀랐어요. 진짜 자연스럽게 나왔어요!'] }} />,
};
/** 비회원 — 문장 쓰기를 누르면 회원 안내 */
export const ChallengeAsGuest: Story = { globals: { userKind: 'guest' }, render: () => <RecChalCard p={feedItem('c1', 'chal')} /> };
