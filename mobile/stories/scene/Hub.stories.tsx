import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { HubBody, HubTop, SceneListSheet, StepPopup } from '@/components/scene/hub';
import { setQuizLevel } from '@/components/scene/scene-store';
import { SCENE_STEPS, sceneStepKey } from '@/data/situation';
import { markDone, savePos } from '@/state/progress';

import { freshDevice } from '../_support/fresh-device';
import { sceneOf } from './_scene';

/*
 * 상황 장면 화면 조각 (scene/hub.tsx) — 위 줄(뒤로 · 맵 이름 · 장면 목록) · 본문(표지 · 내 레벨 · 리스닝 룸 · 단계 5개) ·
 * 장면 목록 시트 · 단계 팝업. 기본 컴포넌트는 본문(HubBody).
 */
const { map, scene } = sceneOf('travel-1');
const ID = 'travel-1';
const key = (i: number) => sceneStepKey(ID, SCENE_STEPS[i].id);

const meta = {
  title: 'Scene/Hub',
  component: HubBody,
  beforeEach: freshDevice(),
  args: { map, scene, onLevel: fn(), onListen: fn(), onStep: fn() },
  decorators: [
    (Story) => (
      <View style={{ flex: 1 }}>
        <HubTop map={map} onBack={fn()} onList={fn()} />
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof HubBody>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 처음 — 첫 단계에 '다음' */
export const Default: Story = {};
/** 두 단계 끝냄 · 세 번째에 '다음' · 네 번째는 멈춘 곳 '이어서' */
export const InProgress: Story = {
  beforeEach: () => {
    markDone(key(0));
    markDone(key(1));
    savePos(key(3), 6);
  },
};
/** 다섯 단계 다 끝냄 — 모두 '다시 하기' */
export const AllDone: Story = { beforeEach: () => SCENE_STEPS.forEach((_, i) => void markDone(key(i))) };
/** 내 레벨 Lv.2 */
export const Level2: Story = { beforeEach: () => setQuizLevel(2) };

/** 장면 목록 시트 — 지금 장면 · 끝낸 장면 · 커밍순 */
export const ListSheet: Story = {
  render: () => <SceneListSheet open map={map} current={1} doneOf={(no) => no === 2} onPick={fn()} onClose={fn()} />,
};

const step = (i: number) => SCENE_STEPS[i];
/** 단계 팝업 — 처음 [시작하기!] */
export const PopupStart: Story = { render: () => <StepPopup step={step(0)} index={0} done={false} pos={undefined} total={0} onClose={fn()} onGo={fn()} /> };
/** 단계 팝업 — 멈춘 곳 있음 [이어서 하기] + 처음부터 (상황 퀴즈 6/15) */
export const PopupResume: Story = { render: () => <StepPopup step={step(3)} index={3} done={false} pos={6} total={15} onClose={fn()} onGo={fn()} /> };
/** 단계 팝업 — 끝낸 단계 [다시 하기] (기운 팔로) */
export const PopupDone: Story = { render: () => <StepPopup step={step(4)} index={4} done pos={undefined} total={0} onClose={fn()} onGo={fn()} /> };
