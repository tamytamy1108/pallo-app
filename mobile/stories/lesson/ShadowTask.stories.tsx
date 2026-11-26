import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { ShadowTask } from '@/components/lesson/shadow-task';
import { chalFinishTasks, patternTasks, roleLineTasks, storyTasks, type ShadowTask as ShadowTaskData } from '@/data/lessons';
import { saveExpression } from '@/state/expressions';

import { D1, DLG, freshLesson, tap } from './_support';

const PAT = patternTasks(D1)[0];
const ROLE = roleLineTasks(DLG.role, 'Sonya')[1];
const PARA = storyTasks('I was at a cafe. I said, "Hi." "Do you have oat milk?" It wasn’t hot.').filter((t): t is ShadowTaskData => t.type === 'shadow')[2];
const CHAL = chalFinishTasks("Excuse me. I'd like to change the milk to soy milk.", '카페에서 우유를 두유로 바꿔 달라고 하고 싶어요.')[0] as ShadowTaskData;

const linkAll = async (root: HTMLElement, task: ShadowTaskData) => {
  for (const w of task.en.split(/\s+/)) await tap(w, root);
};

/**
 * 따라 말하기 — 한국어 뜻을 보고 섞인 단어 카드를 말로(또는 눌러서) 순서대로 이어요.
 * 머리(오늘의 패턴) · 앞사람 대사 + 내 차례(대화문) · 내 문단(My Story) · 머리 없음(챌린지) 네 모양.
 * 말하기 탭은 브라우저 음성 인식이 있어야 해서, 이은 상태 · 틀린 카드는 '말하기가 어려워요'(카드 탭)로 눌러서 만들어요.
 */
const meta = {
  title: 'Lesson/ShadowTask',
  component: ShadowTask,
  args: { task: PAT, soundOff: false, onNext: fn(), nextLabel: '다음', onMark: fn(), source: 'Lv.1 1과 · 스토리북' },
  decorators: [(Story) => <View style={{ flex: 1, paddingTop: 16 }}><Story /></View>],
  beforeEach: freshLesson(),
} satisfies Meta<typeof ShadowTask>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 오늘의 패턴 — 말하기 탭(기본) */
export const Pattern: Story = {};
/** 카드 탭 (말하기가 어려워요) */
export const PatternCards: Story = { args: { noSpeak: true } };
/** 대화문 역할 연기 — 앞사람 대사 + 내 차례 */
export const RoleLine: Story = { args: { task: ROLE, noSpeak: true } };
/** My Story 따라 읽기 — 맞춘 문장만 글자, 남은 문장은 회색 점선 */
export const StoryParagraph: Story = { args: { task: PARA, noSpeak: true } };
/** 챌린지 모범 답 — 머리 없이 */
export const ChallengeModel: Story = { args: { task: CHAL, noSpeak: true } };
/** 몇 장 이음 */
export const Selected: Story = {
  args: { noSpeak: true },
  play: async ({ canvasElement }) => {
    for (const w of ["I'd", 'like', 'to']) await tap(w, canvasElement);
  },
};
/** 틀린 카드 — 흔들림 + 보라 팔로 한마디 */
export const WrongCard: Story = { args: { noSpeak: true }, play: async ({ canvasElement }) => tap('latte.', canvasElement) };
/** 같은 칸에서 3번 틀림 — 정답 카드가 노랗게 통통 */
export const HintAfterThreeMisses: Story = {
  args: { noSpeak: true },
  play: async ({ canvasElement }) => {
    for (let k = 0; k < 3; k++) await tap('latte.', canvasElement);
  },
};
/** 다 이음 — 완성 문장 · 리액션 · [다음] */
export const Done: Story = { args: { noSpeak: true }, play: async ({ canvasElement }) => linkAll(canvasElement, PAT) };
/** 다 이음 · 표현함에 이미 저장됨 */
export const DoneSaved: Story = {
  args: { noSpeak: true },
  beforeEach: freshLesson({ seed: () => saveExpression({ en: PAT.en, ko: PAT.ko, source: 'Lv.1 1과 · 스토리북' }) }),
  play: async ({ canvasElement }) => linkAll(canvasElement, PAT),
};
/** 다 이음 · 소리 끄기 — 듣기 버튼 없음 */
export const DoneSoundOff: Story = { args: { noSpeak: true, soundOff: true }, play: async ({ canvasElement }) => linkAll(canvasElement, PAT) };
/** 내 문단 다 이음 */
export const StoryDone: Story = { args: { task: PARA, noSpeak: true }, play: async ({ canvasElement }) => linkAll(canvasElement, PARA) };
/** 역할 연기 다 이음 — [완료하기] */
export const RoleDone: Story = { args: { task: ROLE, noSpeak: true, nextLabel: '완료하기' }, play: async ({ canvasElement }) => linkAll(canvasElement, ROLE) };
