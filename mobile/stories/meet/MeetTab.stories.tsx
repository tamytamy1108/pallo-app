import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { ScrollView } from 'react-native';

import { addMyClub, addMyMeet, toggleIn } from '@/components/meet/meet-store';
import { MeetTab } from '@/components/meet/meet-tab';
import { PText } from '@/components/ui/text';

import { meetState, myClub, upcomingMeet } from './_fixtures';

/** 다가오는 번개 몇 개 (예시 번개는 날짜가 지나 모두 '지난 번개'로 간다) */
const withUpcoming = () => {
  addMyMeet(upcomingMeet('t-1', 0, { title: '오늘 저녁 영어 산책' }));
  addMyMeet(upcomingMeet('t-2', 1, { cur: 8, max: 8, title: '내일 점심 영어 수다' }));
  addMyMeet(upcomingMeet('t-3', 3, { reg: '부산', br: '부산 수영점', title: '광안리 바다 산책' }));
  addMyMeet(upcomingMeet('t-4', 5, { closed: true, mine: true, host: '태미', title: '내가 연 번개 (닫음)' }));
  toggleIn('joined', 't-1');
};

/**
 * 라운지 '번개 · 동아리' 탭 본문 — 서브 칩(전체 · 번개 · 동아리) · 지도 · 번개 카드 줄(날짜 줄) · 지난 번개 · 동아리 목록.
 * branch 로 지점을 거르고, region 으로 처음 고른 지역을 준다. 라운지 화면 안에서 스크롤되므로 여기선 ScrollView 로 감싼다.
 */
const meta = {
  title: 'Meet/MeetTab',
  component: MeetTab,
  args: { branch: '전체' },
  decorators: [
    (Story) => (
      <ScrollView>
        <Story />
      </ScrollView>
    ),
  ],
  beforeEach: meetState(withUpcoming),
} satisfies Meta<typeof MeetTab>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 전 지점 · 다가오는 번개 + 지난 번개 + 동아리 */
export const Default: Story = {};
/** 다가오는 번개가 없음 — '첫 번개를 열어 보세요!' + 지난 번개 n개 보기 */
export const NoUpcoming: Story = { beforeEach: meetState() };
/** 지점 하나로 거름 (영등포) */
export const OneBranch: Story = { args: { branch: '영등포' } };
/** 번개 · 동아리가 하나도 없는 지점 */
export const EmptyBranch: Story = { args: { branch: '없는 지점' } };
/** 추천 탭 지도에서 '부산'을 눌러 들어옴 */
export const RegionPreset: Story = { args: { region: '부산' } };
/** 내가 만든 동아리(승인 대기)가 목록에 NEW 로 */
export const WithMyClub: Story = { beforeEach: meetState(() => addMyClub(myClub('u-club', true))) };
/** 라운지 지점 선택 버튼이 칩 줄 맨 앞에 */
export const WithHeader: Story = { args: { header: <PText variant="label">전체 지점 ▾</PText> } };
/** 비회원 — 번개 열기 · 동아리 만들기가 체험 안내로 막힌다 (모양은 같다) */
export const Guest: Story = { globals: { userKind: 'guest' } };
