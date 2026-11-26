import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import LessonScreenGate from '@/app/(app)/lesson/[step]';
import { savePos } from '@/state/progress';

import { LOADING_FOREVER } from '../../_support/api';
import { freshLesson } from '../../lesson/_support';

const route = (step: string, extra: Record<string, string> = {}) => ({ route: { params: { step, lv: '1', unit: '1', ...extra }, pathname: `/lesson/${step}` } });

/**
 * 레슨 화면 (/lesson/[step]?lv=1&unit=1) — 단계마다 진행기(오늘의 패턴 · 대화문 · Bank) 또는 단계 화면.
 * 과 콘텐츠는 가짜 API 'lesson'. 비회원은 맵마다 첫 챕터만(2과부터 잠김).
 */
const meta = {
  title: 'Pages/Lesson/Step',
  component: LessonScreenGate,
  parameters: route('pat'),
  beforeEach: freshLesson(),
} satisfies Meta<typeof LessonScreenGate>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 예습 · 오늘의 패턴 (따라 말하기 진행기) */
export const Pattern: Story = {};
/** 예습 · 대화문 (순서 맞추기부터) */
export const Dialogue: Story = { parameters: route('dlg') };
/** 예습 · Word Bank 퀴즈 (짝 맞추기) */
export const Bank: Story = { parameters: route('bank') };
/** 본학습 · 상황 활동 Lv.1 (그림 · 이름표) */
export const Situation: Story = { parameters: route('sit') };
/** 본학습 · 상황 활동 옛 주소 'act' */
export const SituationActAlias: Story = { parameters: route('act') };
/** 본학습 · Lv.2 상황 역할극 (대화 화면) */
export const SituationLv2: Story = { parameters: route('sit', { lv: '2' }) };
/** 본학습 · My Story */
export const MyStory: Story = { parameters: route('story') };
/** 본학습 · AI 프리토킹 */
export const FreeTalk: Story = { parameters: route('talk') };
/** 복습 · 스피킹 퀴즈 */
export const Quiz: Story = { parameters: route('quiz') };
/** 복습 · 30초 말하기 챌린지 */
export const Challenge: Story = { parameters: route('chal') };
/** Lv.2 오늘의 패턴 */
export const PatternLv2: Story = { parameters: route('pat', { lv: '2' }) };
/** 멈춘 곳이 있음 — '이어서 할까요?' */
export const ResumePrompt: Story = { beforeEach: freshLesson({ seed: () => savePos('1:1:pat', 4, 9) }) };
/** 앞 화면에서 '처음부터' 를 골랐음 — 묻지 않음 */
export const Restart: Story = { parameters: route('pat', { resume: 'restart' }), beforeEach: freshLesson({ seed: () => savePos('1:1:pat', 4, 9) }) };
/** 없는 단계 — '준비 중' */
export const UnknownStep: Story = { parameters: route('nope') };
/** 콘텐츠 없는 과 (회원 · 3과) — 404 → '준비 중' */
export const NoContent: Story = { parameters: route('pat', { unit: '3' }) };
/** 과 콘텐츠 불러오는 중 */
export const Loading: Story = { parameters: { ...route('pat'), api: { delayMs: LOADING_FOREVER } } };
/** 과 콘텐츠 오류 — 다시 시도 */
export const Error: Story = { parameters: { ...route('pat'), api: { fail: ['lesson'] } } };
/** 비회원 · 1과 — 첫 챕터는 열려요 */
export const GuestFreeChapter: Story = { globals: { userKind: 'guest' } };
/** 비회원 · 2과 — 잠김 (지점 회원이 되면 열려요) */
export const GuestLocked: Story = { globals: { userKind: 'guest' }, parameters: route('pat', { unit: '2' }) };
/** 연동 대기 · 2과 — 잠김 */
export const PendingLocked: Story = { globals: { userKind: 'pending' }, parameters: route('pat', { unit: '2' }) };
