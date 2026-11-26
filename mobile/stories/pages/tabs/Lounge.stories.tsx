import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import LoungeScreen from '@/app/(app)/(tabs)/lounge';
import { blockMember } from '@/components/common/report-sheet';
import { FEED } from '@/data/lounge';
import { setAllSub, setBranches, setComSub, setCountry, setLoungeTab, setTripMode } from '@/data/lounge-store';

import { setup, tap } from '../../lounge/_fixtures';

/**
 * 라운지 탭 (/lounge) — 제목 → 밑줄 탭(추천 · 커뮤니티 · 챌린지 · 번개/동아리 · 해외 동행) → 스토리 줄 → 지점 + 서브 칩 → 피드 · 오른쪽 아래 +.
 * 보던 탭 · 칩 · 지점은 라운지 가게 값이라 스토리마다 맞춘다. 비회원은 위쪽(카드 1~2개)까지만 보이고 아래는 잠김.
 */
const meta = {
  title: 'Pages/Tabs/Lounge',
  component: LoungeScreen,
  parameters: { route: { pathname: '/lounge' } },
  beforeEach: setup(),
} satisfies Meta<typeof LoungeScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 추천 · 전체 */
export const Default: Story = {};
/** 추천 · 인기 */
export const RecommendHot: Story = { beforeEach: setup(() => setAllSub('hot')) };
/** 커뮤니티 · 전체 */
export const Community: Story = { beforeEach: setup(() => setLoungeTab('com')) };
/** 커뮤니티 · 여행 칩 */
export const CommunityTravel: Story = { beforeEach: setup(() => (setLoungeTab('com'), setComSub('travel'))) };
/** 커뮤니티 · 글 없음 (그 지점 · 그 칩에 글이 없을 때) */
export const CommunityEmpty: Story = { beforeEach: setup(() => (setLoungeTab('com'), setComSub('study'), setBranches(['울산점']))) };
/** 모든 글쓴이를 차단 — 커뮤니티가 빈 안내 */
export const CommunityAllBlocked: Story = {
  beforeEach: setup(() => {
    setLoungeTab('com');
    FEED.forEach((p) => 'who' in p && blockMember(p.who));
  }),
};
/** 지점 고름 (영등포) */
export const BranchFiltered: Story = { beforeEach: setup(() => setBranches(['영등포'])) };
/** 챌린지 탭 */
export const Challenge: Story = { beforeEach: setup(() => setLoungeTab('chal')) };
/** 번개 · 동아리 탭 */
export const Meet: Story = { beforeEach: setup(() => setLoungeTab('meet')) };
/** 해외 동행 · 해외살이 */
export const TripLive: Story = { beforeEach: setup(() => setLoungeTab('trip')) };
/** 해외 동행 · 여행 동행 */
export const TripCompanion: Story = { beforeEach: setup(() => (setLoungeTab('trip'), setTripMode('trip'))) };
/** 해외 동행 · 나라 고름 (일본) */
export const TripCountry: Story = { beforeEach: setup(() => (setLoungeTab('trip'), setTripMode('trip'), setCountry('JP'))) };
/** 해외 동행 · 그 나라 동행 없음 (아일랜드) */
export const TripCountryEmpty: Story = { beforeEach: setup(() => (setLoungeTab('trip'), setTripMode('trip'), setCountry('IE'))) };
/** 주소로 탭 열기 (?tab=chal) */
export const TabFromUrl: Story = { parameters: { route: { pathname: '/lounge', params: { tab: 'chal' } } } };
/** + → 만들기 시트 */
export const CreateSheetOpen: Story = { play: () => tap(/만들기/) };
/** 비회원 — 위쪽만 보이고 잠김 칸 */
export const AsGuest: Story = { globals: { userKind: 'guest' } };
/** 연동 대기 */
export const AsPending: Story = { globals: { userKind: 'pending' } };
