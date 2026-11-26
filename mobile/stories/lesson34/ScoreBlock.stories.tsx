import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { ScoreBlock } from '@/components/lesson34/blocks/misc';
import type { LogItem, ScoreTask } from '@/components/lesson34/types';
import { LV4_101 } from '@/data/lesson34-lv4';

import { freshDevice } from '../_support/fresh-device';
import { withRunner } from './_runner';

/** 디베이트 결과 (논리 · 근거 · 표현 · 유창성 바 + MVP 문장) — 점수는 진행기에 쌓인 라운드 기록(logs)으로 계산 */
const task: ScoreTask = { type: 'score', kick: 'DEBATE · 결과', keys: LV4_101.key.map((k) => k[0]) };
const kw = LV4_101.key.slice(0, 3).map((k) => k[0]);

const strong: LogItem[] = [
  { k: '1차', deb: true, ok: true, v: `I believe this matters because a ban only pushes the problem underground. For example, ${kw[0]} is what most people feel. Therefore we need clear rules.` },
  { k: '반박', deb: true, ok: true, v: `I see your point, but research shows that 70 percent of people agree, which means ${kw[1]} is real.` },
  { k: '재반박', deb: true, ok: true, v: `However, if we act now, then the risk goes down. In fact, data supports this and ${kw[2]} too.` },
  { k: '정리', deb: true, ok: true, v: 'To sum up, my side is safer and that is why we should choose it with strict rules.' },
];
const weak: LogItem[] = [
  { k: '1차', deb: true, ok: false, late: true, v: 'I think no.' },
  { k: '반박', deb: true, ok: false, late: true, v: 'It is bad.' },
];

const meta = {
  title: 'Lesson34/ScoreBlock',
  component: ScoreBlock,
  decorators: [withRunner],
  beforeEach: freshDevice(),
  args: { task },
} satisfies Meta<typeof ScoreBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 잘한 토론 — 높은 점수 · MVP 문장 · KEY 표현 수 · [완료하기] */
export const High: Story = { parameters: { runner: { logs: strong, goLabel: '완료하기' } } };
/** 짧게 · 늦게 답한 토론 — 기운 팔로 · 낮은 점수 · MVP 없음 */
export const Low: Story = { parameters: { runner: { logs: weak } } };
/** 기록 없음 (라운드 0개) */
export const Empty: Story = {};
