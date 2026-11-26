import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { PickTask } from '@/components/lesson/pick-task';
import type { PickTask as PickTaskData } from '@/data/lessons';

import { freshLesson, tap, withTask } from './_support';

/** 빈칸 고르기 (정답 = 0번 'Do you have') — 보기는 섞여 나와요 */
const BLANK: PickTaskData = {
  type: 'pick',
  label: '빈칸에 알맞은 표현은?',
  q: { en: '___ a menu in English?', ko: '영어로 된 메뉴판이 있나요?' },
  opts: ['Do you have', "I'd like to", "It doesn't"],
  ans: 0,
};
/** O/X (정답 O) */
const OX: PickTaskData = { type: 'pick', label: '맞는 뜻이면 O', q: { en: "It doesn't fit me.", ko: '사이즈가 저한테 맞지 않아요.' }, opts: ['O', 'X'], ans: 0, ox: true };
/** 듣고 고르기 — 소리 끄기면 readAlt(글자 보고 고르기)로 */
const LISTEN: PickTaskData = {
  type: 'pick',
  label: '들은 문장의 뜻은?',
  play: 'Do you have Wi-Fi?',
  opts: ['와이파이 있나요?', '충전기 있나요?', '창가 자리 있나요?'],
  ans: 0,
  readAlt: { type: 'pick', label: '이 문장의 뜻은?', q: { en: 'Do you have Wi-Fi?' }, opts: ['와이파이 있나요?', '충전기 있나요?', '창가 자리 있나요?'], ans: 0 },
};
/** 정답 없이 고르기만 (ans -1) + 풀이 */
const FREE: PickTaskData = { type: 'pick', label: '나라면 뭐라고 할까요?', q: { ko: '라테가 차가워요.' }, opts: ["It isn't hot enough.", "It's not iced.", 'Can I get a new one?'], ans: -1, explain: '정답은 없어요 · 마음에 드는 말을 골라요' };

/**
 * 고르기 — O/X · 듣고 고르기 · 빈칸. 처음 틀리면 그 보기만 지우고 'Not quite!', 두 번째도 틀리면 정답 카드 + 오답 띠.
 * 틀림 · 맞음 상태는 play 로 눌러서 만들어요.
 */
const meta = {
  title: 'Lesson/PickTask',
  component: PickTask,
  args: { task: BLANK },
  decorators: [withTask],
  beforeEach: freshLesson(),
} satisfies Meta<typeof PickTask>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 아직 안 고름 */
export const Unanswered: Story = {};
/** 맞힘 — 초록 보기 + 정답 띠 [계속하기] */
export const Correct: Story = { play: async ({ canvasElement }) => tap('Do you have', canvasElement) };
/** 마지막 문제에서 맞힘 — [완료하기] */
export const CorrectLast: Story = { parameters: { task: { isLast: true } }, play: async ({ canvasElement }) => tap('Do you have', canvasElement) };
/** 처음 틀림 — 그 보기만 점선 · 'Not quite! 한 번 더' */
export const WrongOnce: Story = { play: async ({ canvasElement }) => tap("I'd like to", canvasElement) };
/** 두 번 틀림 — 오답 띠 + 정답 카드 */
export const WrongTwice: Story = {
  play: async ({ canvasElement }) => {
    await tap("I'd like to", canvasElement);
    await tap("It doesn't", canvasElement);
  },
};
/** O/X */
export const OxUnanswered: Story = { args: { task: OX } };
export const OxCorrect: Story = { args: { task: OX }, play: async ({ canvasElement }) => tap('O', canvasElement) };
/** 듣고 고르기 — [다시 듣기] */
export const Listen: Story = { args: { task: LISTEN } };
/** 듣고 고르기 + 소리 끄기 → 글자 보고 고르기 */
export const ListenSoundOff: Story = { args: { task: LISTEN }, parameters: { task: { soundOff: true } } };
/** 말하기 문제 대신 나온 고르기 — 아래 '말하기가 어려워요' */
export const FromSpeak: Story = { args: { task: BLANK, fromSpeak: true }, parameters: { task: { noSpeak: true } } };
/** 정답 없는 고르기 */
export const FreeChoice: Story = { args: { task: FREE } };
export const FreeChoicePicked: Story = { args: { task: FREE }, play: async ({ canvasElement }) => tap('Can I get a new one?', canvasElement) };
