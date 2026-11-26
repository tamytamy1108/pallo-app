import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { userEvent, within } from 'storybook/test';

import SceneStepScreen from '@/app/(app)/scene/[id]/[step]';
import { saveQuizPos, setQuizLevel } from '@/components/scene/scene-store';
import { setNoListen, setNoSpeak } from '@/state/learn-prefs';

import { LOADING_FOREVER } from '../../_support/api';
import { freshDevice } from '../../_support/fresh-device';
import { pickedAll } from '../../scene/_scene';

/**
 * 상황 장면 단계 화면 (/scene/[id]/[단계]) — 미션 익히기 · 장면 롤플레이 · Word Bank · 상황 퀴즈 · AI 미션 대화.
 * 말하기(마이크)는 기기 음성 인식이라 웹에선 쓰기/고르기로 본다. 끝내면 축하 화면 → 다음 단계 또는 장면 화면.
 */
const at = (step: string, id = 'travel-1') => ({ route: { params: { id, step }, pathname: `/scene/${id}/${step}` } });
const tapFirst = (name: RegExp | string) => async () => {
  await userEvent.click((await within(document.body).findAllByRole('button', { name }))[0]);
};

const meta = {
  title: 'Pages/Scene/Step',
  component: SceneStepScreen,
  beforeEach: freshDevice(() => pickedAll()),
  parameters: at('mis'),
} satisfies Meta<typeof SceneStepScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 미션 익히기 (내 레벨 문장 듣고 따라 말하기) */
export const Mission: Story = {};
/** 미션 익히기 · Lv.2 문장 */
export const MissionLevel2: Story = { beforeEach: () => setQuizLevel(2) };
/** 장면 롤플레이 (직원 말에 대답 고르기) */
export const Flow: Story = { parameters: at('flow') };
/** Word Bank 30초 타임어택 */
export const Bank: Story = { parameters: at('bank') };
/** 상황 퀴즈 — 레벨을 골라 둔 뒤 첫 문제 */
export const Quiz: Story = { parameters: at('exq') };
/** 상황 퀴즈 — 처음이면 '어떤 난이도로 할까요?' */
export const QuizFirstPick: Story = { parameters: at('exq'), beforeEach: freshDevice() };
/** 상황 퀴즈 — 왕기초(Lv.0) 문제 */
export const QuizLevel0: Story = { parameters: at('exq'), beforeEach: () => setQuizLevel(0) };
/** 상황 퀴즈 — 고급(Lv.4, 글자 없이 듣기) */
export const QuizLevel4: Story = { parameters: at('exq'), beforeEach: () => setQuizLevel(4) };
/** 상황 퀴즈 — 멈춘 곳(7번째)부터 */
export const QuizResumed: Story = {
  parameters: at('exq'),
  beforeEach: () => saveQuizPos('travel-1', { i: 6, right: 4, order: Array.from({ length: 15 }, (_, k) => k), res: [true, true, false, true, true, false], lv: 1 }),
};
/** 상황 퀴즈 — 보기 하나 고름 (맞거나 틀린 띠) */
export const QuizAnswered: Story = {
  parameters: at('exq'),
  play: async () => {
    const opts = await within(document.body).findByLabelText('보기');
    await userEvent.click(within(opts).getAllByRole('button')[0]);
  },
};
/** AI 미션 대화 */
export const Talk: Story = { parameters: at('talk') };
/** AI 미션 대화 — 말하기가 어려워요(쓰기로 시작) */
export const TalkWrite: Story = { parameters: at('talk'), beforeEach: () => setNoSpeak(true) };
/** AI 미션 대화 — 예시 보기 펼침 */
export const TalkExample: Story = { parameters: at('talk'), play: tapFirst('예시 보기') };
/** 소리 끔 — 듣기 버튼이 사라져요 */
export const SoundOff: Story = { parameters: at('flow'), beforeEach: () => setNoListen(true) };
/** 다른 맵 (카페 1 · 롤플레이) */
export const OtherMap: Story = { parameters: at('flow', 'cafe-1') };
/** 없는 단계 — '곧 열려요' */
export const UnknownStep: Story = { parameters: at('nope') };
/** 콘텐츠가 없는 장면 — '곧 열려요' */
export const Soon: Story = { parameters: at('mis', 'travel-4') };
/** 비회원 · 장면 2 — 잠금 */
export const GuestLocked: Story = { globals: { userKind: 'guest' }, parameters: at('mis', 'travel-2') };
export const Loading: Story = { parameters: { api: { delayMs: LOADING_FOREVER } } };
export const Error: Story = { parameters: { api: { fail: ['maps'] } } };
