import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, userEvent, within } from 'storybook/test';

import OnboardingNear from '@/app/(onboarding)/onboarding/near';
import { setLocateForTesting, type LocateResult } from '@/lib/location';
import { getOnboarding } from '@/state/onboarding';

import { LOADING_FOREVER } from '../../_support/api';
import { withOnboarding } from '../../onboarding/_onb';

/** 위치 받기를 바꿔 끼워요 — result 를 주면 그 값, 'forever' 면 계속 찾는 중 (스토리가 끝나면 되돌려요) */
const located = (result: LocateResult | 'forever') => () => {
  setLocateForTesting(() => (result === 'forever' ? new Promise<LocateResult>(() => {}) : Promise.resolve(result)));
  return () => setLocateForTesting(null);
};
/** 서울시청 */
const OK: LocateResult = { status: 'ok', point: { lat: 37.5665, lng: 126.978 }, canAskAgain: true };

/**
 * 가입 › 앱 구경 › 나에게 가장 가까운 지점 (/onboarding/near · 6/6) — 지점은 GET /branches (가짜 API 'branchOptions').
 * 내 위치는 스토리가 정해요(기본 = 서울시청을 받음). 받으면 가까운 순 · 방향 · 거리, 못 받으면 지역별 목록 + 다시 찾기 버튼.
 * 지점을 누르면 그 지점을 온보딩 값에 담고 지점 안내(/onboarding/branch)로 가요 (이동은 Actions 패널에 router.push 로 남아요).
 */
const meta = {
  title: 'Pages/Onboarding/Near',
  component: OnboardingNear,
  parameters: { route: { pathname: '/onboarding/near' } },
  beforeEach: [withOnboarding({ path: 'app' }), located(OK)],
} satisfies Meta<typeof OnboardingNear>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 위치를 받음 — 가까운 순 · 지점마다 방향 화살표 · 거리 (가짜 서버 좌표) */
export const Default: Story = {};
/** 위치 찾는 중 — 지역별 목록을 먼저 보여 줘요 */
export const Locating: Story = { beforeEach: located('forever') };
/** 위치 권한 거절 — 지역별 목록 + '위치 켜기' */
export const LocationDenied: Story = { beforeEach: located({ status: 'denied', point: null, canAskAgain: true }) };
/** 위치를 못 찾음(위치 꺼짐 · 시간 초과 · 위치 모듈 없는 옛 빌드) — 지역별 목록 + '다시 찾기' */
export const LocationOff: Story = { beforeEach: located({ status: 'off', point: null, canAskAgain: true }) };
/** 뒤로 와서 다시 볼 때 — 앞서 고른 지점이 표시돼요 */
export const Selected: Story = { beforeEach: withOnboarding({ path: 'app', branchCode: '하남점', branch: '하남점' }) };
export const Loading: Story = { parameters: { api: { delayMs: LOADING_FOREVER } } };
/** 지점 목록을 못 받음 */
export const LoadError: Story = { parameters: { api: { fail: ['branchOptions'] } } };
/** 지점 하나를 누름 → 온보딩 값에 담겨요 */
export const PickBranch: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByRole('button', { name: /^잠실점/ }));
    await expect(getOnboarding()).toMatchObject({ branchCode: '잠실점', branch: '잠실점' });
  },
};
