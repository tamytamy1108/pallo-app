import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import ChallengeScreen from '@/app/(app)/challenge/[id]';
import { addEntry, createDaily, planOf, toggleChecked } from '@/data/challenge';

import { __setStoryRoute } from '../../../.storybook/expo-router-stub';
import { challenge, setup } from '../../lounge/_fixtures';

const at = (id: string, write?: boolean) => ({ route: { params: write ? { id, write: '1' } : { id }, pathname: `/challenge/${id}` } });

/**
 * 챌린지 상세 (/challenge/[id], ?write=1) — 일상 챌린지 = 상세 화면 · 표현 챌린지 = 나만의 문장 창(시트) · 없는 id = 안내.
 * 역할별: 미참여 = Default · 참여 중 = Joined · CheckedToday · 호스트 = HostOngoing · MineUpcoming.
 * 참여 희망(승인 대기)은 아직 없어요 — 상세가 예시 데이터로 그려지고 예시 데이터에 승인제 · 신청 대기가 없어서, 상세를 서버로 바꿀 때 더해요.
 */
const meta = {
  title: 'Pages/Challenge/Detail',
  component: ChallengeScreen,
  parameters: at('c4'),
  beforeEach: setup(),
} satisfies Meta<typeof ChallengeScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 일상 · 참여 안 함 */
export const Default: Story = {};
/** 일상 · 참여 중 */
export const Joined: Story = { parameters: at('c5') };
/** 일상 · 오늘 인증 완료 */
export const CheckedToday: Story = { parameters: at('c5'), beforeEach: setup(() => void toggleChecked(challenge('c5'))) };
/** 일상 · 대표 사진 */
export const WithCover: Story = { parameters: at('c6') };
/** 호스트 · 진행 중 — 오늘 시작한 내 챌린지 (오늘 인증하기 · 호스트 (나)) */
export const HostOngoing: Story = {
  beforeEach: (ctx) => {
    setup()(ctx);
    const p = createDaily({ cat: 'habit', name: '오늘부터 하루 단어 10개', way: 'cmt', guide: '외운 단어로 한 문장', pw: ['10', 'WORDS'], plan: planOf('오늘', 14, false, 7, []) });
    __setStoryRoute(at(p.id).route);
  },
};
/** 내가 방금 연 챌린지 (시작 전 · 멤버 초대) — 만든 id 로 주소를 바꾼다 */
export const MineUpcoming: Story = {
  beforeEach: (ctx) => {
    setup()(ctx);
    const p = createDaily({ cat: 'move', name: '다음 주부터 매일 30분 걷기', way: 'photo', guide: '', pw: ['WALK'], plan: planOf('다음 주 월요일', 14, false, 3, []) });
    __setStoryRoute(at(p.id).route);
  },
};
/** 표현 챌린지 창 */
export const Expression: Story = { parameters: at('c1') };
/** 표현 챌린지 · 참여 중 */
export const ExpressionJoined: Story = { parameters: at('c1'), beforeEach: setup(() => void addEntry(challenge('c1'), 'I’m on the fence about the trip.')) };
/** 표현 챌린지 · 문장 쓰기로 열기 (?write=1) */
export const ExpressionWrite: Story = { parameters: at('c1', true) };
/** 없는 챌린지 */
export const NotFound: Story = { parameters: at('nope') };
/** 비회원 */
export const AsGuest: Story = { globals: { userKind: 'guest' } };
