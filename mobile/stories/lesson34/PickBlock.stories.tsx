import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { userEvent, within } from 'storybook/test';

import { PickBlock } from '@/components/lesson34/blocks/pick';
import type { PickTask, SayTask } from '@/components/lesson34/types';

import { freshDevice } from '../_support/fresh-device';
import { taskOf, tasksOf, withRunner } from './_runner';

/*
 * 고르기 블록 (프로토타입 TKV.pick) — 뜻 · 빈칸 · 독해 · 편 고르기 · 제한 시간 · 말하기 대신 고르기.
 * 처음 틀리면 그 보기만 지우고 한 번 더, 두 번째도 틀리면 정답 문장이 카드로 날아와요. 보기 순서는 열 때마다 섞여요.
 */

const kwl = taskOf(3, 'kwl', 0, 'pick');
const warm = tasksOf(3, 'warm') as PickTask[];
const meaningTimed = warm[0];
const blank = warm.find((t) => t.q?.blank) as PickTask;
const reading = taskOf(3, 'ttalk', 1, 'pick');
const sidePick = taskOf(4, 'side', 1, 'pick');
const betterSay = taskOf(4, 'better', 0, 'say');
const betterAlt = betterSay.alt as PickTask;
const keySay = tasksOf(4, 'key').find((t): t is SayTask => t.type === 'say') as SayTask;
/** O/X 문제 (블록이 지원하는 모양 · 지금 코너엔 없음) */
const ox: PickTask = { type: 'pick', kick: 'O / X', label: '지문 내용과 맞으면 O', q: { en: 'The coworker read the name off a coffee mug.', ko: '동료는 머그컵에서 이름을 읽었어요.' }, opts: ['O', 'X'], ans: 0, ox: true, keep: true };
/** 듣고 고르기 + 소리 끄기면 글자 보고 고르기(readAlt) */
const listen: PickTask = {
  type: 'pick',
  kick: '듣고 고르기',
  label: '듣고 알맞은 뜻을 골라요',
  play: 'It was on the tip of my tongue.',
  opts: ['생각이 날 듯 말 듯했어요', '혀를 깨물었어요', '말을 아꼈어요'],
  ans: 0,
  readAlt: { type: 'pick', kick: '글자 보고 고르기', label: '알맞은 뜻을 골라요', q: { en: 'It was on the tip of my tongue.' }, opts: ['생각이 날 듯 말 듯했어요', '혀를 깨물었어요', '말을 아꼈어요'], ans: 0 },
};

const choose = (pick: (t: PickTask) => string[]) => async ({ args }: { args: { task: PickTask } }) => {
  const c = within(document.body);
  for (const name of pick(args.task)) await userEvent.click(await c.findByRole('button', { name }));
};
const right = (t: PickTask) => [t.opts[Math.max(0, t.ans)]];
const wrongs = (t: PickTask) => t.opts.filter((_, i) => i !== t.ans);

const meta = {
  title: 'Lesson34/PickBlock',
  component: PickBlock,
  decorators: [withRunner],
  beforeEach: freshDevice(),
  args: { task: kwl },
} satisfies Meta<typeof PickBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 큰 낱말 + 예문 · 뜻 (KEYWORDS 익히기) · 표현함 저장 버튼 */
export const KeywordMeaning: Story = {};
/** 5초 제한 — 원형 시계, 시간이 끝나면 'Time’s up!' */
export const Timed: Story = { args: { task: meaningTimed } };
/** 빈칸 문장 · 보기 순서 고정 */
export const Blank: Story = { args: { task: blank } };
/** 독해 질문 (영어 + 한국어 질문 · 긴 보기) */
export const Reading: Story = { args: { task: reading } };
/** 편 고르기 (정답 없음) · 아래 안내 한 줄 */
export const SidePick: Story = { args: { task: sidePick } };
export const OX: Story = { args: { task: ox } };
/** 듣고 고르기 — [다시 듣기] */
export const Listen: Story = { args: { task: listen } };
/** 소리 끄기 — 듣고 고르기가 글자 보고 고르기로 */
export const ListenSoundOff: Story = { args: { task: listen }, parameters: { runner: { soundOff: true } } };
/** 말하기 대신 고르기 (말하기가 어려워요) — 말하기 문제의 머리를 그대로 · 아래 '말하기가 어려워요' 켜짐 */
export const InsteadOfSay: Story = { args: { task: keySay.alt as PickTask, from: keySay }, parameters: { runner: { noSpeak: true } } };

/* ───────── 고른 뒤 ───────── */

/** 맞힘 — 노랑 보기 · 칭찬 띠 · [다음] */
export const Correct: Story = { args: { task: betterAlt }, play: choose(right) };
/** 마지막 문제에서 맞힘 — [완료하기] */
export const CorrectLast: Story = { args: { task: betterAlt }, parameters: { runner: { goLabel: '완료하기' } }, play: choose(right) };
/** 처음 틀림 — 그 보기만 지우고 'Not quite! 한 번 더' */
export const WrongOnce: Story = { args: { task: betterAlt }, play: choose((t) => wrongs(t).slice(0, 1)) };
/** 두 번 틀림 — 정답 문장이 카드로 */
export const WrongTwiceCards: Story = { args: { task: betterAlt }, play: choose(wrongs) };
/** 두 번 틀림 · 카드 없는 문제 — 정답 · 뜻 설명 띠만 */
export const WrongTwiceExplain: Story = { args: { task: blank }, play: choose((t) => wrongs(t).slice(0, 2)) };
/** 편 고른 뒤 — 'A · …' 선택 + 다음 안내 */
export const SidePicked: Story = { args: { task: sidePick }, play: choose((t) => [t.opts[0]]) };
