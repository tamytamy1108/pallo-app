import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { fn, userEvent, within } from 'storybook/test';

import { StepShell } from '@/components/scene/step-frame';
import { PText } from '@/components/ui/text';
import { setNoListen } from '@/state/learn-prefs';

import { freshDevice } from '../_support/fresh-device';

/** 상황 장면 단계 틀 — 위 줄(X · 진행 막대 또는 제목 · 소리) · X 를 누르면 '정말 그만할까요?' 시트 (끝낸 뒤엔 바로 장면 화면) */
const body = (
  <View style={{ padding: 20 }}>
    <PText>단계 본문 자리</PText>
  </View>
);

const meta = {
  title: 'Scene/StepShell',
  component: StepShell,
  beforeEach: freshDevice(),
  args: { sceneId: 'travel-1', title: 'AI 미션 대화', onQuit: fn(), children: body },
} satisfies Meta<typeof StepShell>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 제목 줄 */
export const Title: Story = {};
/** 진행 막대 (3/15) */
export const Progress: Story = { args: { progress: { index: 2, total: 15 } } };
/** 소리 끔 (스피커 보라 바탕) */
export const SoundOff: Story = { beforeEach: () => setNoListen(true) };
export const ProgressSoundOff: Story = { args: { progress: { index: 0, total: 3 } }, beforeEach: () => setNoListen(true) };
/** X → 그만하기 시트 */
export const QuitAsk: Story = {
  play: async () => {
    await userEvent.click(await within(document.body).findByRole('button', { name: '그만하고 장면 화면으로' }));
  },
};
