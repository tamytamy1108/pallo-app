import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { userEvent, within } from 'storybook/test';

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
