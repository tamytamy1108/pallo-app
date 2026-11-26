import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { ExplainBlock } from '@/components/lesson34/blocks/misc';
import type { ExplainTask } from '@/components/lesson34/types';

import { freshDevice } from '../_support/fresh-device';
import { taskOf, withRunner } from './_runner';

/** 설명 카드 (프로토타입 TKV.explain) — 큰 제목 · 본문(굵은 글씨) · 예문 줄(듣기) · 아래 안내 · [알겠어요] */
const situation = taskOf(4, 'side', 0, 'explain');
const debateHow = taskOf(4, 'deb', 0, 'explain');
const askBack = (taskOf(4, 'side', 1, 'pick').then?.(0, true) ?? []).find((t): t is ExplainTask => t.type === 'explain') as ExplainTask;

const meta = {
  title: 'Lesson34/ExplainBlock',
  component: ExplainBlock,
  decorators: [withRunner],
  beforeEach: freshDevice(),
  args: { task: situation },
} satisfies Meta<typeof ExplainBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

/** SITUATION — 한 문장씩 예문 줄 + 한국어 안내 (열리면 읽어 줘요) */
export const Situation: Story = {};
/** 본문(**굵게**) · 버튼 이름 '토론 시작' */
export const WithBody: Story = { args: { task: debateHow } };
/** 질문 목록 + 버튼 '준비 끝' */
export const QuestionList: Story = { args: { task: askBack } };
/** 소리 끄기 — 예문 줄의 듣기 버튼 없음 */
export const SoundOff: Story = { args: { task: situation }, parameters: { runner: { soundOff: true } } };
/** 가장 짧은 모양 (제목만 · 기본 버튼 '알겠어요') */
export const TitleOnly: Story = { args: { task: { type: 'explain', kick: '안내', k: 'TIP', title: '반박할 때는 들은 말 하나를 골라 받아쳐요' } } };
