import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { TaskRunner } from '@/components/lesson/task-runner';
import { bankTasks, dialogueTasks, patternTasks, storyTasks, type Task } from '@/data/lessons';
import { savePos } from '@/state/progress';

import { D1, freshLesson, tap } from './_support';

const SKEY = 'story:runner';
const PAT = patternTasks(D1);
const DLG = dialogueTasks(D1);
/** 문제 유형을 하나씩 섞은 진행기 (고르기 · 만들기 · 짝 맞추기 · 따라 말하기) */
const MIXED: Task[] = [
  { type: 'pick', label: '빈칸에 알맞은 표현은?', q: { en: '___ Wi-Fi?', ko: '와이파이 있나요?' }, opts: ['Do you have', "I'd like to", "It doesn't"], ans: 0, kick: '고르기' },
  DLG[2],
  { ...bankTasks(D1)[0], kick: 'Word Bank · 짝 맞추기' } as Task,
  PAT[0],
];

/**
 * 레슨 진행기 — 한 화면에 문제 하나. 위 줄(X · 진행 막대 · n/전체 · 시계 · 소리) → 작은 안내 → 문제 → 아래 버튼.
 * X → '정말 그만할까요?', 멈춘 곳이 있으면 '이어서 할까요?'.
 */
const meta = {
  title: 'Lesson/TaskRunner',
  component: TaskRunner,
  args: { skey: SKEY, kick: '오늘의 패턴', tasks: PAT, source: 'Lv.1 1과 · 오늘의 패턴', onDone: fn(), onLeave: fn() },
  beforeEach: freshLesson(),
} satisfies Meta<typeof TaskRunner>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 오늘의 패턴 — 따라 말하기 9문제 (패턴 머리가 있어 위 안내는 숨김) */
export const Pattern: Story = {};
/** 대화문 — 순서 맞추기부터 */
export const Dialogue: Story = { args: { kick: '대화문', tasks: DLG } };
/** Word Bank 타임어택 */
export const Bank: Story = { args: { kick: D1.bankName, tasks: bankTasks(D1) } };
/** My Story — 문장 순서 → 따라 읽기 */
export const MyStory: Story = { args: { kick: 'My Story', tasks: storyTasks('I was at a cafe. I said, "I’d like to order a latte." In the end, they made a new one.') } };
/** 여러 유형 섞음 — 고르기부터 (시계 있음) */
export const Mixed: Story = { args: { kick: '복습', tasks: MIXED } };
/** 소리 끄기 · 말하기가 어려워요 켠 채로 */
export const SoundOffNoSpeak: Story = { beforeEach: freshLesson({ noSpeak: true, noListen: true }) };
/** 멈춘 곳이 있음 — '이어서 할까요? 3/9까지 했어요' */
export const ResumePrompt: Story = { beforeEach: freshLesson({ seed: () => savePos(SKEY, 3, PAT.length) }) };
/** 앞 화면에서 이어서 하기를 골랐음 — 묻지 않고 4번째부터 */
export const Resumed: Story = { args: { resume: 'resume' }, beforeEach: freshLesson({ seed: () => savePos(SKEY, 3, PAT.length) }) };
/** X — '정말 그만할까요? n문제만 더 하면 끝나요' */
export const QuitConfirm: Story = { play: async () => tap('그만하기') };
/** 한 문제짜리 — '마지막 문제만 남았어요!' */
export const QuitLastOne: Story = { args: { tasks: [PAT[0]] }, play: async () => tap('그만하기') };
