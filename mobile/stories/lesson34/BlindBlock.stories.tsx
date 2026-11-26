import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { BlindBlock } from '@/components/lesson34/blocks/misc';
import type { BlindTask } from '@/components/lesson34/types';
import { LV3_101 } from '@/data/lesson34-lv3';

import { freshDevice } from '../_support/fresh-device';
import { withRunner } from './_runner';

/** 글 가리고 듣기 (2번까지) — 지금 코너엔 없지만 블록이 지원하는 모양. 지문은 Lv.3 #101 TOPIC 지문 */
const task: BlindTask = { type: 'blind', kick: 'TOPIC · 가리고 듣기', head: { k: 'TOPIC', p: LV3_101.topic.title, m: '글을 가린 채 두 번 들어요' }, lines: LV3_101.topic.lines.slice(0, 5) };

const meta = {
  title: 'Lesson34/BlindBlock',
  component: BlindBlock,
  decorators: [withRunner],
  beforeEach: freshDevice(),
  args: { task },
} satisfies Meta<typeof BlindBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 가린 글 · [듣기 시작] (0/2번) */
export const Hidden: Story = {};
/** 소리 끄기 — 글을 보며 읽어요 (가림 없음) */
export const SoundOffOpen: Story = { parameters: { runner: { soundOff: true } } };
/** 말하기가 어려워요 — 글을 보며 읽어요 · 토글 켜짐 */
export const NoSpeakOpen: Story = { parameters: { runner: { noSpeak: true } } };
