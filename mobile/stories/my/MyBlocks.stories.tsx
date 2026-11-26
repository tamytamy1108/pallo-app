import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { LgIcon } from '@/components/my/icons';
import { BadgeGrid, MyList, MyStats, RankSummary, SecHead } from '@/components/my/my-blocks';
import { MY_BADGES, rankPeople } from '@/data/my';

import { padded } from '../_support/padded';

/** 마이 화면 블록 — 섹션 제목 · 숫자 4칸 · 랭킹 요약 · 배지 칸 · 목록 카드. */
const meta = {
  title: 'My/Blocks',
  component: SecHead,
  args: { title: '랭킹', more: '전체 보기 ›', onMore: fn() },
  decorators: [padded],
} satisfies Meta<typeof SecHead>;

export default meta;
type Story = StoryObj<typeof meta>;

const people = (weekPoints: number) => rankPeople('w', { name: '나', branch: '하남점', weekPoints });
const rankOf = (weekPoints: number) => people(weekPoints).findIndex((p) => p.me) + 1;
const rank = (weekPoints: number) => <RankSummary podium={people(weekPoints).slice(0, 3)} myRank={rankOf(weekPoints)} myPoints={weekPoints} branch="하남점" onPress={fn()} />;

/** 제목 + 오른쪽 '전체 보기 ›' */
export const SecHeadWithMore: Story = {};
/** 제목만 (more 없음) */
export const SecHeadTitleOnly: Story = { args: { more: undefined } };

/** 숫자 4칸 — 처음 값 (모두 0) */
export const StatsZero: Story = {
  render: () => (
    <MyStats
      items={[
        { ic: 'flame', v: '0일', l: '연속 학습', onPress: fn() },
        { ic: 'crown', v: '11위', l: '이번 주 랭킹', onPress: fn() },
        { ic: 'users', v: '0개', l: '참여 중인 모임', onPress: fn() },
        { ic: 'heart', v: '0개', l: '받은 배지', onPress: fn() },
      ]}
    />
  ),
};
/** 숫자 4칸 — 큰 숫자 · 긴 라벨 (한 줄로 잘림) */
export const StatsBig: Story = {
  render: () => (
    <MyStats
      items={[
        { ic: 'flame', v: '365일', l: '연속 학습', onPress: fn() },
        { ic: 'crown', v: '1위', l: '이번 주 랭킹', onPress: fn() },
        { ic: 'users', v: '128개', l: '참여 중인 모임 (번개 · 동아리)', onPress: fn() },
        { ic: 'heart', v: '8개', l: '받은 배지', onPress: fn() },
      ]}
    />
  ),
};

/** 랭킹 요약 — 내가 꼴찌 (이번 주 0P) */
export const RankLast: Story = { render: () => rank(0) };
/** 랭킹 요약 — 가운데 (300P) */
export const RankMiddle: Story = { render: () => rank(300) };
/** 랭킹 요약 — 내가 1위 (시상대 가운데에 나) */
export const RankFirst: Story = { render: () => rank(1200) };
/** 랭킹 요약 — 이번 주 순위 없음 (포인트 0 · 서버 예시 값과 같은 모양) */
export const RankNone: Story = { render: () => <RankSummary podium={people(0).slice(0, 3)} myRank={null} myPoints={0} branch="하남점" onPress={fn()} /> };
/** 랭킹 요약 — 시상대가 1명뿐 (빈 자리) */
export const RankPodiumOne: Story = { render: () => <RankSummary podium={people(0).slice(0, 1)} myRank={null} myPoints={0} branch="" onPress={fn()} /> };

/** 배지 4칸 (마이 화면) — 받은 것 · 못 받은 것(흐림) 섞임 */
export const BadgesFour: Story = { render: () => <BadgeGrid list={MY_BADGES.slice(0, 4)} /> };
/** 배지 모두 + 설명 (배지 시트) */
export const BadgesAllWithDesc: Story = { render: () => <BadgeGrid list={MY_BADGES} desc /> };
/** 모두 받음 */
export const BadgesAllOn: Story = { render: () => <BadgeGrid list={MY_BADGES.map((b) => ({ ...b, on: true }))} /> };
/** 하나도 못 받음 */
export const BadgesAllOff: Story = { render: () => <BadgeGrid list={MY_BADGES.map((b) => ({ ...b, on: false }))} /> };
/** 아이콘 크게 */
export const BadgesBigIcon: Story = { render: () => <BadgeGrid list={MY_BADGES.slice(0, 4)} iconSize={30} /> };

/** 목록 카드 — 아이콘 · 개수 있는 줄 */
export const ListWithIcons: Story = {
  render: () => (
    <MyList
      rows={[
        { label: '내 모임', icon: <LgIcon name="users" size={18} />, value: '3개', onPress: fn() },
        { label: '찜한 모임', icon: <LgIcon name="heart" size={18} />, value: '0개', onPress: fn() },
        { label: '내 표현함', icon: <LgIcon name="save" size={18} />, value: '14개', onPress: fn() },
        { label: '랭킹 · 퀘스트', icon: <LgIcon name="flame" size={18} />, onPress: fn() },
      ]}
    />
  ),
};
/** 목록 카드 — 글자만 (설정 · 상담 신청 내역 · 버그 보고) */
export const ListPlain: Story = {
  render: () => (
    <MyList
      rows={[
        { label: '설정', onPress: fn() },
        { label: '상담 신청 내역', onPress: fn() },
        { label: '버그 보고', onPress: fn() },
      ]}
    />
  ),
};
/** 목록 카드 — 긴 라벨 · 긴 값 */
export const ListLongText: Story = {
  render: () => <MyList rows={[{ label: '아주 길게 늘어나는 목록 라벨이 들어가면 줄이 어떻게 보이는지 확인해요', icon: <LgIcon name="book" size={18} />, value: '12,345개', onPress: fn() }]} />,
};
