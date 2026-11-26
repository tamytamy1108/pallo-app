import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { userEvent, within } from 'storybook/test';

import type { EventProposal } from '@/api/event-proposals';
import { queryKeys } from '@/api/queries';
import ProposeEvent from '@/app/(app)/events/propose';
import { updateMe } from '@/state/me';

import { freshDevice } from '../../_support/fresh-device';

/**
 * 이벤트 제안 (/events/propose) — 시트 모양 긴 폼: 사진 · 진행 지점 · 장소(지도) · 상세 주소 · 희망 날짜 · 카테고리 · 제목 · 소개 · 인원 · 참가비.
 * 빈 칸 검사는 [제안 보내기]를 눌렀을 때 토스트로만 알린다(토스트 자리는 앱 루트에 있어 스토리에는 안 보인다).
 */
const meta = {
  title: 'Pages/Events/Propose',
  component: ProposeEvent,
  parameters: { route: { pathname: '/events/propose' } },
  beforeEach: freshDevice(),
} satisfies Meta<typeof ProposeEvent>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 처음 — 진행 지점 = 내 지점(하남점 · 경기 지도) */
export const Default: Story = {};
/** 내 지점이 목록에 없으면 첫 지점(가산 · 서울 지도) */
export const UnknownBranch: Story = { beforeEach: freshDevice(() => updateMe({ branch: '없는 지점' })) };
/** 몇 칸 채움 — 카테고리 · 제목 · 인원 */
export const PartlyFilled: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(await c.findByText('액티비티'));
    await userEvent.type(c.getByPlaceholderText('예) 한강 영어 피크닉'), '미사 리버뷰 영어 산책');
    await userEvent.click(c.getByText('30명 정도'));
  },
};
/** 장소 지도 열림 */
export const PlaceMap: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByText('지도에서 장소 고르기'));
  },
};
/** 진행 지점 고르기 시트 */
export const BranchSheet: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByLabelText('진행 지점 하남점'));
  },
};

const PENDING: EventProposal = {
  id: 'pr-edit',
  branchCode: '영등포점',
  branchName: '영등포점',
  categoryCode: 'ACTIVITY',
  categoryLabel: '액티비티',
  title: '한강 영어 피크닉',
  description: '돗자리 펴고 영어로 수다 떠는 피크닉이에요.',
  date: (() => {
    const t = new Date();
    t.setDate(t.getDate() + 17);
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  })(),
  startTime: '14:00',
  endTime: '17:00',
  placeName: null,
  placeAddress: null,
  addressDetail: null,
  expectedAttendees: 20,
  fee: 0,
  photos: [],
  card: { color: '#FFE200', words: ['PICNIC', ''], design: 'circle' },
  status: 'PENDING',
  rejectionReason: null,
  eventId: null,
  decidedAt: null,
  createdAt: new Date().toISOString(),
};
const editAt = (rows: EventProposal[]) => ({ route: { pathname: '/events/propose', params: { edit: 'pr-edit' } }, queries: [[queryKeys.eventProposals, rows]] as const });

/** 고치기 — 매니저 검토 중인 내 제안 (내가 제안한 이벤트 시트 › 수정하기): 보낸 값이 채워진 채로 · [수정 내용 보내기] */
export const Edit: Story = { parameters: editAt([PENDING]) };
/** 고치기 · 이미 확정된 제안 — '이미 처리된 제안이라 고칠 수 없어요' */
export const EditApproved: Story = { parameters: editAt([{ ...PENDING, status: 'APPROVED' }]) };
