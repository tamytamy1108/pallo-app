import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { userEvent, within } from 'storybook/test';

import SceneScreen from '@/app/(app)/scene/[id]/index';
import { saveBest } from '@/components/scene/scene-store';
import { SCENE_STEPS, sceneStepKey } from '@/data/situation';
import { markDone, savePos } from '@/state/progress';

import { LOADING_FOREVER } from '../../_support/api';
import { freshDevice } from '../../_support/fresh-device';
import { pickedAll } from '../../scene/_scene';

/**
 * 상황 맵 장면 화면 (/scene/[id]) — 처음 들어오면 '내 레벨을 골라요', 고른 뒤엔 표지 · 내 레벨 · 리스닝 룸 · 단계 5개.
 * 단계를 누르면 단계 팝업, 위 가운데를 누르면 장면 목록 시트. 비회원은 맵마다 장면 1만 열려요.
 */
const at = (id: string) => ({ route: { params: { id }, pathname: `/scene/${id}` } });
const key = (i: number) => sceneStepKey('travel-1', SCENE_STEPS[i].id);
const tap = (name: RegExp | string) => async () => {
  await userEvent.click(await within(document.body).findByRole('button', { name }));
};

const meta = {
  title: 'Pages/Scene/Intro',
  component: SceneScreen,
  beforeEach: freshDevice(() => pickedAll()),
  parameters: at('travel-1'),
} satisfies Meta<typeof SceneScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 레벨을 고른 뒤 — 장면 화면 */
export const Default: Story = {};
/** 처음 들어옴 — '내 레벨을 골라요' (장면 화면보다 먼저) */
export const FirstVisit: Story = { beforeEach: freshDevice() };
/** 처음 들어옴 · 최고 기록 있음 */
export const FirstVisitWithBest: Story = {
  beforeEach: freshDevice(() => {
    saveBest('공항 체크인', 1, 12);
    saveBest('공항 체크인', 2, 7);
  }),
};
/** 진행 중 — 끝낸 단계 · 다음 · 이어서 */
export const InProgress: Story = {
  beforeEach: () => {
    markDone(key(0));
    markDone(key(1));
    savePos(key(3), 6);
  },
};
/** 레벨 바꾸기 — 레벨 고르기가 다시 */
export const ChangeLevel: Story = { play: tap('레벨 바꾸기') };
/** 장면 목록 시트 */
export const SceneList: Story = { play: tap('장면 목록 열기') };
/** 단계 팝업 — 처음 [시작하기!] */
export const StepPopupStart: Story = { play: tap(/^1\. 미션 익히기/) };
/** 단계 팝업 — 멈춘 곳 [이어서 하기] + 처음부터 */
export const StepPopupResume: Story = { beforeEach: () => savePos(key(3), 6), play: tap(/^4\. 상황 퀴즈/) };
/** 단계 팝업 — 끝낸 단계 [다시 하기] */
export const StepPopupDone: Story = { beforeEach: () => void markDone(key(4)), play: tap(/^5\. AI 미션 대화/) };
/** 다른 맵의 장면 (비즈니스 1) */
export const OtherMap: Story = { parameters: at('biz-1') };
/** 콘텐츠가 아직 없는 장면 — '곧 열려요' */
export const Soon: Story = { parameters: at('travel-4') };
/** 없는 장면 id — '곧 열려요' */
export const Unknown: Story = { parameters: at('nope-1') };
/** 비회원 · 장면 1 — 열려요 */
export const GuestFree: Story = { globals: { userKind: 'guest' } };
/** 비회원 · 장면 2 — 지점 회원이 되면 열려요 */
export const GuestLocked: Story = { globals: { userKind: 'guest' }, parameters: at('travel-2') };
export const Loading: Story = { parameters: { api: { delayMs: LOADING_FOREVER } } };
/** 맵 목록 오류 */
export const Error: Story = { parameters: { api: { fail: ['maps'] } } };
/** 장면 콘텐츠 오류 (맵은 받음) */
export const ContentError: Story = { parameters: { api: { fail: ['lesson'] } } };
