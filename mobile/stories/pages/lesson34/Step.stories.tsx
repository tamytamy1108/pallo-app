import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { userEvent, within } from 'storybook/test';

import Lesson34Screen from '@/app/(app)/lesson34/[step]';
import { setAns, setSide } from '@/components/lesson34/store';
import { LV3_101 } from '@/data/lesson34-lv3';
import { setNoListen, setNoSpeak } from '@/state/learn-prefs';
import { savePos, stepKey } from '@/state/progress';

import { LOADING_FOREVER } from '../../_support/api';
import { freshDevice } from '../../_support/fresh-device';

/**
 * Lv.3 · 4 레슨 단계 화면 (/lesson34/[단계]?lv=&unit=) — 단계마다 진행기(문제 하나씩) 또는 단계 화면(지문 · 별표 · AI 대화 · 퀴즈 · Before/After · FREE TALK 1:1).
 * 회차 콘텐츠는 가짜 API(lesson). 비회원은 1과만 열려서 101회차는 잠겨요(ChapterGate).
 */
const at = (lv: 3 | 4, step: string, unit = 101) => ({ route: { params: { step, lv: String(lv), unit: String(unit) }, pathname: `/lesson34/${step}` } });

const meta = {
  title: 'Pages/Lesson34/Step',
  component: Lesson34Screen,
  beforeEach: freshDevice(),
  parameters: at(3, 'kwl'),
} satisfies Meta<typeof Lesson34Screen>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ───────── Lv.3 · 예습 ───────── */
/** KEYWORDS 익히기 (예문 듣고 뜻 고르기) */
export const L3Keywords: Story = {};
/** JOURNAL 지문 읽기 */
export const L3TopicRead: Story = { parameters: at(3, 'tread') };
/** USEFUL EXPRESSIONS 30초 짝 맞추기 */
export const L3Match: Story = { parameters: at(3, 'match') };
/** 오늘의 질문 미리 보기 (별표 0개) */
export const L3Pick6: Story = { parameters: at(3, 'pick6') };
/** 오늘의 질문 · 별표 3개 다 고름 */
export const L3Pick6Starred: Story = { parameters: at(3, 'pick6'), beforeEach: () => setAns(stepKey(3, 101, 'pick6'), [[0, 2, 4]]) };
/* ───────── Lv.3 · 본학습 ───────── */
/** 지난주 단어 (5초 뜻 고르기) */
export const L3Warm: Story = { parameters: at(3, 'warm') };
/** AI 대화 · DAILY TOPIC */
export const L3DailyTalk: Story = { parameters: at(3, 'dtalk') };
/** AI 대화 · 예습에서 별표한 질문부터 */
export const L3DailyTalkStarred: Story = { parameters: at(3, 'dtalk'), beforeEach: () => setAns(stepKey(3, 101, 'pick6'), [[1, 3, 5]]) };
/** AI 대화 · 말하기가 어려워요(쓰기) */
export const L3DailyTalkNoSpeak: Story = { parameters: at(3, 'dtalk'), beforeEach: () => setNoSpeak(true) };
/** TOPIC 이야기하기 (꼬리 질문 → 독해 → 표현 예문) */
export const L3TopicTalk: Story = { parameters: at(3, 'ttalk') };
/* ───────── Lv.3 · 복습 ───────── */
/** 스피킹 퀴즈 */
export const L3SpeakQuiz: Story = { parameters: at(3, 'quiz') };
/** JOURNAL 빈칸 채우기 */
export const L3Journal: Story = { parameters: at(3, 'journal') };
/** Before / After — 예습 답변 없음 */
export const L3BeforeAfterEmpty: Story = { parameters: at(3, 'ba') };
/** Before / After — AI 대화 때 답이 있음 */
export const L3BeforeAfter: Story = {
  parameters: at(3, 'ba'),
  beforeEach: () => setAns(stepKey(3, 101, 'dtalk'), ['I like stay home.', undefined, 'I watch drama everyday.']),
};
/** Before / After — 다시 답하고 비교하기 */
export const L3BeforeAfterCompared: Story = {
  parameters: at(3, 'ba'),
  beforeEach: () => setAns(stepKey(3, 101, 'dtalk'), ['I like stay home.']),
  play: async () => {
    const c = within(document.body);
    await userEvent.type(await c.findByLabelText('Q1 다시 답하기'), `These days I am ${LV3_101.journal.use[0]} staying in because it helps me relax. For example, I read every night. It feels great.`);
    await userEvent.click(c.getByRole('button', { name: '비교하기' }));
  },
};

/* ───────── Lv.4 ───────── */
/** FREE TALK 준비 (5개 중 2개) */
export const L4FreeTalkPrep: Story = { parameters: at(4, 'free') };
/** KEY EXPRESSIONS */
export const L4KeyExpressions: Story = { parameters: at(4, 'key') };
/** 내 입장 정하기 (SITUATION) */
export const L4Side: Story = { parameters: at(4, 'side') };
/** FREE TALK · 1:1 (AI) */
export const L4FreeTalk1: Story = { parameters: at(4, 'free2') };
/** DEBATE — 예습에서 편을 안 골랐으면 안내 → 편 고르기 */
export const L4Debate: Story = { parameters: at(4, 'deb') };
/** DEBATE — 편이 있으면 안내 → 1차 주장 … (7문제) */
export const L4DebateWithSide: Story = { parameters: at(4, 'deb'), beforeEach: () => setSide('4:101', { side: 'B', text: 'I believe a ban protects people because money pressure is real.' }) };
/** FOLLOW-UP 질문 만들기 */
export const L4FollowUp: Story = { parameters: at(4, 'fq') };
/** SAY IT BETTER 즉시 변환 (5초) */
export const L4SayItBetter: Story = { parameters: at(4, 'better') };
/** 편 바꾸기 (15초 준비 + 1분) */
export const L4Swap: Story = { parameters: at(4, 'swap') };
/** FINAL POSITION — 예습 때 입장 카드 */
export const L4Final: Story = { parameters: at(4, 'final'), beforeEach: () => setSide('4:101', { side: 'A', text: 'I believe regulated sales are safer.' }) };
/** 다른 회차 (Lv.4 #102 Behind the Mask) */
export const L4Unit102: Story = { parameters: at(4, 'key', 102) };

/* ───────── 상태 ───────── */
/** 멈춘 곳이 있음 — '이어서 할까요?' */
export const ResumeAsk: Story = { beforeEach: () => savePos(stepKey(3, 101, 'kwl'), 5) };
/** 소리 끄기 + 말하기가 어려워요 */
export const PrefsOn: Story = {
  parameters: at(4, 'key'),
  beforeEach: () => {
    setNoListen(true);
    setNoSpeak(true);
  },
};
/** 없는 단계 id — '준비 중' */
export const UnknownStep: Story = { parameters: at(3, 'nope') };
/** 없는 회차 (404) — '준비 중' */
export const UnknownUnit: Story = { parameters: at(3, 'kwl', 999) };
/** 비회원 — 101회차는 지점 회원이 되면 열려요 */
export const LockedGuest: Story = { globals: { userKind: 'guest' } };
/** 연동 대기 — 잠금 (버튼 없이 안내만) */
export const LockedPending: Story = { globals: { userKind: 'pending' } };
/** 앱 구독만 — 비회원과 같이 잠겨요 */
export const AppOnlyLocked: Story = { globals: { userKind: 'app' } };
export const Loading: Story = { parameters: { api: { delayMs: LOADING_FOREVER } } };
export const Error: Story = { parameters: { api: { fail: ['lesson'] } } };
