import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { ClubChat } from '@/components/meet/club/club-chat';
import { setChat } from '@/components/meet/meet-store';

import { padded } from '../_support/padded';
import { CLUB_FREE, meetState } from './_fixtures';

/** 동아리 채팅 탭 — 고정 공지 · 날짜 구분 · 입장 알림 · 내 말(노랑). 가입 전엔 최근 4줄 흐리게 + 잠금. */
const meta = {
  title: 'Meet/ClubChat',
  component: ClubChat,
  args: { c: CLUB_FREE, inC: true, myName: '태미', staff: ['민서'] },
  decorators: [padded],
  beforeEach: meetState(),
} satisfies Meta<typeof ClubChat>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 멤버 — 예시 대화 + '태미님이 들어왔어요' */
export const Member: Story = {};
/** 비멤버 — 흐린 미리보기 */
export const NotMember: Story = { args: { inC: false } };
/** 내가 보낸 말 · 긴 말 */
export const WithMyMessages: Story = {
  beforeEach: meetState(() =>
    setChat(CLUB_FREE.id, [
      { day: '오늘' },
      { n: '민준', host: true, x: '오늘 장면은 노팅힐 서점 장면이에요!', t: '오후 7:40' },
      { n: '민서', x: '저 10분 늦어요 ㅠㅠ', t: '오후 7:52' },
      { n: '태미', me: true, x: '저도 가는 중이에요. 자리 맡아 주실 수 있나요? 창가 쪽이면 좋겠어요!', t: '오후 7:55' },
      { sys: '태미님이 들어왔어요' },
    ]),
  ),
};
/** 대화가 없음 — 공지만 */
export const Empty: Story = { beforeEach: meetState(() => setChat(CLUB_FREE.id, [])) };
