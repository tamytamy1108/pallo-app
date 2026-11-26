import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { popupsQuery } from '@/api/queries';
import { LaunchPopup } from '@/components/home/launch-popup';
import { LAUNCH_POPUPS } from '@/data/home';

import { behindSheet, homeDevice, withNote } from './_home';

const KEY = popupsQuery().queryKey;
// 가짜 팝업은 노출 종료(publishUntil)가 지나면 안 떠서, 스토리는 먼 날짜로 고정
const FAR = LAUNCH_POPUPS.map((p) => ({ ...p, publishUntil: '2099-12-31T00:00:00Z' }));

/**
 * 앱 시작 팝업 — 0.9초 뒤 뜬다. 여러 개면 ‹ › · 점, '오늘은 그만 보기'.
 * 주의: 앱을 켠 뒤 한 번만 뜨는 값(모듈 변수 shownOnce)이 있어, 이 카탈로그 탭에서 팝업을 한 번 본 뒤 다른 팝업 스토리로 옮기면 안 뜬다 — 새로고침하면 다시 뜬다.
 */
const meta = {
  title: 'Home/LaunchPopup',
  component: LaunchPopup,
  decorators: [behindSheet],
  beforeEach: homeDevice(),
} satisfies Meta<typeof LaunchPopup>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 두 개 — ‹ › 로 넘김 */
export const Many: Story = { parameters: { queries: [[KEY, FAR]] } };
/** 하나 — 넘김 버튼 없음 */
export const Single: Story = { parameters: { queries: [[KEY, FAR.slice(0, 1)]] } };
/** 긴 제목 · 부제 */
export const LongCopy: Story = {
  parameters: { queries: [[KEY, [{ ...FAR[0], title: 'PALLO 연말\n랭귀지 파티 · 전 지점 동시 개최', sub: '11.29 토 19:00 · 전 지점 · 친구 1명 무료 · 드레스 코드 RED' }]]] },
};
/** 오늘 보여 줄 팝업이 없음 (기간 지남) */
export const Expired: Story = {
  decorators: [withNote('기간이 지난 팝업 — 뜨지 않아요')],
  parameters: { queries: [[KEY, FAR.map((p) => ({ ...p, publishUntil: '2000-01-01T00:00:00Z' }))]] },
};
export const Error: Story = { decorators: [withNote('실패 — 뜨지 않아요')], parameters: { api: { fail: ['popups'] } } };
