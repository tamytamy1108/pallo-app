import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { userEvent, within } from 'storybook/test';

import EventScreen from '@/app/(app)/(tabs)/event';
import { updateMe } from '@/state/me';

import { applied, proposed } from '../../event/_fixtures';
import { freshDevice } from '../../_support/fresh-device';

/** 화면 안 글자를 눌러 탭 · 칩을 바꾼다 (화면 상태가 안에 있어서) */
const press = (text: string) => async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  await userEvent.click(await within(canvasElement).findByText(text));
};

/**
 * 이벤트 탭 (/event) — 제목 · 내가 제안한 이벤트 · 지점 + 종류 칩 · 배너 · 다가오는/지난 탭 · 목록 · [오픈하기].
 * 이벤트는 가짜 데이터(data/events) 고정이라 불러오는 중 · 오류 상태가 없다. 다가오는/지난 은 기기 날짜로 갈린다.
 * 비회원은 위쪽만 보이고 아래는 잠김 칸(ScrollLock).
 */
const meta = {
  title: 'Pages/Tabs/Event',
  component: EventScreen,
  parameters: { route: { pathname: '/event' } },
  beforeEach: freshDevice(),
} satisfies Meta<typeof EventScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 회원 · 다가오는 이벤트 */
export const Default: Story = {};
/** 내가 제안한 이벤트 카드 + 신청한 이벤트('참여 완료') */
export const WithProposalsAndApplied: Story = {
  beforeEach: freshDevice(() => {
    proposed();
    applied('m2');
  }),
};
/** 지난 이벤트 탭 */
export const PastTab: Story = { play: press('지난 이벤트') };
/** 종류 칩 · 여행만 */
export const TripFilter: Story = { play: press('여행') };
/** 종류 칩 · 클래스 — 다가오는 클래스 없음 → 빈 문구 · 배너 없음 */
export const EmptyUpcoming: Story = { play: press('클래스') };
/** 리더 · 매니저 — [오픈하기]가 바로 열기 (접근성 이름만 다름) */
export const Staff: Story = { beforeEach: freshDevice(() => updateMe({ role: 'leader' })) };
/** 비회원 — 위쪽만 보이고 잠김 칸 */
export const Guest: Story = { globals: { userKind: 'guest' } };
export const Pending: Story = { globals: { userKind: 'pending' } };
export const Trial: Story = { globals: { userKind: 'trial' } };
