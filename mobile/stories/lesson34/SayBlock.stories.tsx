import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { userEvent, within } from 'storybook/test';

import { SayBlock } from '@/components/lesson34/blocks/say';
import type { ChooseTask, SayTask } from '@/components/lesson34/types';

import { freshDevice } from '../_support/fresh-device';
import { taskOf, tasksOf, withRunner } from './_runner';

/*
 * 시간 제한 말하기 블록 (프로토타입 TKV.say) — 진짜 코너(corners.ts)가 만든 문제를 그대로 넣는다.
 * 말하기(마이크)는 기기 음성 인식이라 Storybook 에선 '눌러서 말하기'까지만 — 결과 화면은 '쓰기'로 답해서 본다(play).
 */

const free1 = (taskOf(4, 'free', 0, 'choose') as ChooseTask).make([0, 2])[0] as SayTask;
const keySay = tasksOf(4, 'key').find((t): t is SayTask => t.type === 'say') as SayTask;
const better1 = taskOf(4, 'better', 0, 'say');
const fq1 = taskOf(4, 'fq', 0, 'say');
const fq2 = taskOf(4, 'fq', 1, 'say');
const swap1 = taskOf(4, 'swap', 0, 'say');
const roulette = taskOf(4, 'final', 1, 'say');
const finalPos = taskOf(4, 'final', 0, 'say');
const ttalk1 = taskOf(3, 'ttalk', 0, 'say');
/** 꼬리 질문 · 문장 업그레이드가 붙은 말하기 (지금 코너엔 없지만 블록이 지원하는 모양) */
const withFollow: SayTask = {
  ...ttalk1,
  kick: 'TOPIC · 꼬리 질문 붙은 말하기',
  follow: ['Why do you think that happens?', '왜 그런 일이 생긴다고 생각해요?', 'Because I was nervous, so my mind went blank.'],
  upgrade: true,
};

const GOOD = 'I think I once forgot my new coworker name right after lunch. It was very embarrassing because she remembered mine. So I played it cool and asked her again the next day.';

/** 쓰기로 답하고 확인 — tab: 말하기 · 쓰기 탭을 먼저 '쓰기'로 */
const writeAnswer =
  (text: string, opts: { tab?: boolean; times?: number } = {}) =>
  async () => {
    const c = within(document.body);
    if (opts.tab) await userEvent.click(await c.findByRole('tab', { name: /쓰기/ }));
    for (let i = 0; i < (opts.times ?? 1); i++) {
      if (i > 0) await userEvent.click(await c.findByRole('button', { name: '한 번 더' }));
      await userEvent.type(await c.findByLabelText('영어로 쓰기'), text);
      await userEvent.click(c.getByRole('button', { name: '확인' }));
    }
  };

const meta = {
  title: 'Lesson34/SayBlock',
  component: SayBlock,
  decorators: [withRunner],
  beforeEach: freshDevice(),
  args: { task: ttalk1 },
} satisfies Meta<typeof SayBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 말하기 · 기본 (팔로가 묻는 말풍선 · 마이크 키 · 말하기/쓰기 탭) */
export const Default: Story = {};
/** 준비 시간이 있는 문제 — 처음엔 보라 원형 시계 + [준비 시작 · 15초] */
export const PrepReady: Story = { args: { task: swap1 } };
/** 준비 중 — 시계가 돌고 [바로 말하기] */
export const PrepRunning: Story = {
  args: { task: swap1 },
  play: async () => {
    await userEvent.click(await within(document.body).findByRole('button', { name: /준비 시작/ }));
  },
};
/** 즉흥 룰렛 — 토픽을 뽑기 전 '?' */
export const RouletteSpin: Story = { args: { task: roulette } };
/** 말 시작 제한(5초) + 먼저 읽어 주는 문장 · 평소 표현 카드 — 5초가 지나면 '시간 초과' */
export const StartInCountdown: Story = { args: { task: better1 }, parameters: { runner: { soundOff: true } } };
/** 칸 나누기(답 · 이유 · 예시 · 사회적 관점) + FREE TALK 머리 + 배경 카드 */
export const SplitWithHead: Story = { args: { task: free1 } };
/** 콤보 문제 — 마이크 키에 '콤보 x3' */
export const KeyExpressionCombo: Story = { args: { task: keySay }, parameters: { runner: { combo: 3 } } };
/** 상대(Logan)가 묻는 말풍선 · USEFUL LINE 카드 */
export const OpponentAsk: Story = { args: { task: fq2 }, parameters: { runner: { soundOff: true } } };
/** 예습 때 내 입장 카드(Before)는 입장이 있을 때만 — 없을 때 모양 */
export const FinalPosition: Story = { args: { task: finalPos } };
/** 소리 끄기 — 듣기 버튼이 사라지고 '읽고 말 시작까지' */
export const SoundOff: Story = { args: { task: better1 }, parameters: { runner: { soundOff: true } } };
/** 말하기가 어려워요 — 쓰기로 (시간 제한 없음) */
export const NoSpeakWrite: Story = { args: { task: ttalk1 }, parameters: { runner: { noSpeak: true } } };
/** 말하기가 어려워요 + 대신 고르기(alt) 가 있는 문제 — 고르기 블록으로 바뀌어요 */
export const NoSpeakAltPick: Story = { args: { task: keySay }, parameters: { runner: { noSpeak: true } } };

/* ───────── 결과 (쓰기로 답해서) ───────── */

/** 기준을 다 채움 — 별 3개 · AI 교정 · 모범 답 */
export const ResultGood: Story = { args: { task: ttalk1 }, parameters: { runner: { noSpeak: true } }, play: writeAnswer(GOOD) };
/** 기준 미달 — 문장이 모자라요 · [다시 답변하기] */
export const ResultTooShort: Story = { args: { task: ttalk1 }, parameters: { runner: { noSpeak: true } }, play: writeAnswer('I forgot a name once.') };
/** 칸 나누기에서 빠진 칸 — '이유 · 예시 … 문장이 빠졌어요' */
export const ResultSplitMissing: Story = { args: { task: free1 }, parameters: { runner: { noSpeak: true } }, play: writeAnswer('I prefer staying home on weekends. It is my favorite.') };
/** 칸 나누기 다 채움 */
export const ResultSplitFull: Story = {
  args: { task: free1 },
  parameters: { runner: { noSpeak: true } },
  play: writeAnswer('I prefer staying home on weekends. I like it because it helps me recharge. For example, last weekend I read a book all day. These days many people feel the same way.'),
};
/** 꼬리 질문이 붙음 — 통과하면 팔로의 꼬리 질문 + [꼬리 질문 답하기] · 문장 업그레이드 카드 */
export const ResultWithFollow: Story = { args: { task: withFollow }, parameters: { runner: { noSpeak: true } }, play: writeAnswer(GOOD) };
/** 질문 날카로움(1~5) + 상대의 답 말풍선 */
export const ResultSharpness: Story = { args: { task: fq1 }, parameters: { runner: { soundOff: true } }, play: writeAnswer('If organ sales are legal, how would you protect poor people from pressure?', { tab: true }) };
/** 정답형(바꿔 말하기) 첫 오답 — '조금 달라요 · 힌트' + [한 번 더] */
export const ExactFirstMiss: Story = { args: { task: better1 }, parameters: { runner: { soundOff: true } }, play: writeAnswer('I do not know', { tab: true }) };
/** 정답형 두 번째도 오답 — 정답 문장이 카드로 */
export const ExactAnswerCards: Story = { args: { task: better1 }, parameters: { runner: { soundOff: true } }, play: writeAnswer('I do not know', { tab: true, times: 2 }) };
