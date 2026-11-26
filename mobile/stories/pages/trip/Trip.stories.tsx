import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { userEvent, within } from 'storybook/test';

import TripApplyScreen from '@/app/(app)/trip/[id]';
import { PText } from '@/components/ui/text';
import { LG_SAFE } from '@/data/lounge';

import { freshDevice } from '../../_support/fresh-device';

/**
 * 여행 동행 신청 시트 (/trip/[id]) — 안전 수칙 4개를 모두 체크해야 [동행 신청하기]가 켜져요.
 * 진짜 앱에선 라운지 위에 투명하게 뜨는 시트라, 여기선 시트만 보여요. 동행 글이 아니거나 없는 id 면 아무것도 안 떠요.
 */
const at = (id: string) => ({ route: { params: { id }, pathname: `/trip/${id}` } });
const check = (n: number) => async () => {
  const c = within(document.body);
  for (const t of LG_SAFE.slice(0, n)) await userEvent.click(await c.findByRole('checkbox', { name: t }));
};

const meta = {
  title: 'Pages/Trip',
  component: TripApplyScreen,
  beforeEach: freshDevice(),
  parameters: at('t1'),
} satisfies Meta<typeof TripApplyScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 화면이 아무것도 그리지 않는 경우 — 무엇을 보는 스토리인지 한 줄 (앱에선 뒤의 라운지가 그대로 보여요) */
const nothingNote: NonNullable<Story['decorators']> = [
  (Story) => (
    <View style={{ padding: 20 }}>
      <PText>시트가 뜨지 않아요 (동행 글이 아님)</PText>
      <Story />
    </View>
  ),
];

/** 처음 — 체크 0개 · 버튼 꺼짐 '네 가지 모두 확인하면…' */
export const Default: Story = {};
/** 소개 글이 없는 동행 */
export const NoIntro: Story = { parameters: at('t4') };
/** 둘 체크 */
export const PartlyChecked: Story = { play: check(2) };
/** 넷 다 체크 + 메시지 — [동행 신청하기] 켜짐 */
export const AllChecked: Story = {
  play: async () => {
    await check(LG_SAFE.length)();
    await userEvent.type(await within(document.body).findByLabelText('신청 메시지'), '안녕하세요! 라멘 좋아해요.');
  },
};
/** 동행 글이 아닌 id (일반 글) — 시트 없음 */
export const NotTrip: Story = { parameters: at('p1'), decorators: nothingNote };
/** 없는 id — 시트 없음 */
export const Unknown: Story = { parameters: at('nope'), decorators: nothingNote };
