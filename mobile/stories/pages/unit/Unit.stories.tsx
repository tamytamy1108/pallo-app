import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import UnitScreenGate from '@/app/(app)/unit/[id]';
import { markDone, savePos, stepKey } from '@/state/progress';

import { LOADING_FOREVER } from '../../_support/api';
import { freshLesson, tap } from '../../lesson/_support';

const route = (id: string, extra: Record<string, string> = {}) => ({ route: { params: { id, ...extra }, pathname: `/unit/${id}` } });
const done = (...ids: string[]) => () => ids.forEach((s) => markDone(stepKey(1, 1, s)));

/**
 * 과 화면 (/unit/[id], id = '레벨-과' 또는 '과'?lv=) — 표지 · 요약 → 리스닝 룸 → 예습 · 본학습 · 복습 탭 → 단계 카드.
 * 다음 할 단계 = 연노랑 '다음', 하다 만 단계 = '이어서', 끝낸 단계 = 체크. 과 목록은 가짜 API 'books'. 비회원은 1과만.
 */
const meta = {
  title: 'Pages/Unit',
  component: UnitScreenGate,
  parameters: route('1-1'),
  beforeEach: freshLesson(),
} satisfies Meta<typeof UnitScreenGate>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Lv.1 1과 — 처음 (예습 탭 · 첫 단계 '다음') */
export const Default: Story = {};
/** 홈 스터디 맵 주소 '/unit/1?lv=1' */
export const NumberIdWithLv: Story = { parameters: route('1', { lv: '1' }) };
/** 예습 일부 끝냄 + 하다 만 단계 '이어서' */
export const InProgress: Story = { beforeEach: freshLesson({ seed: () => { done('pat'); savePos(stepKey(1, 1, 'dlg'), 1, 3); } }) };
/** 예습을 다 끝냄 — 본학습 탭으로 열려요 */
export const PreDone: Story = { beforeEach: freshLesson({ seed: done('pat', 'dlg', 'bank') }) };
/** 다 끝냄 — 복습 탭 · 전부 '다시 하기' */
export const AllDone: Story = { beforeEach: freshLesson({ seed: done('pat', 'dlg', 'bank', 'sit', 'story', 'talk', 'quiz', 'chal') }) };
/** 복습 탭 눌러 보기 */
export const PostTab: Story = { play: async () => tap(/^복습/) };
/** 단계 카드 누름 — 시작 창 */
export const StepPopup: Story = { play: async () => tap(/^오늘의 패턴/) };
/** 과 목록 시트 */
export const LessonSheet: Story = { play: async () => tap('과 목록 열기') };
/** Lv.2 1과 */
export const Lv2: Story = { parameters: route('2-1') };
/** Lv.3 TOPIC TALK 101 */
export const Lv3Topic: Story = { parameters: route('3-101') };
/** Lv.4 FREE TALK & DEBATE 101 */
export const Lv4Debate: Story = { parameters: route('4-101') };
/** 데이터 없는 과 (커밍순) — '교재 데이터가 들어오면 열려요' */
export const NoData: Story = { parameters: route('1-2') };
/** 없는 레벨 */
export const UnknownLevel: Story = { parameters: route('9-1') };
/** 과 목록 불러오는 중 */
export const Loading: Story = { parameters: { ...route('1-1'), api: { delayMs: LOADING_FOREVER } } };
/** 과 목록 오류 */
export const Error: Story = { parameters: { ...route('1-1'), api: { fail: ['books'] } } };
/** 비회원 · 1과 — 열려요 */
export const GuestFree: Story = { globals: { userKind: 'guest' } };
/** 비회원 · 2과 — 잠김 */
export const GuestLocked: Story = { globals: { userKind: 'guest' }, parameters: route('1-2') };
/** 연동 안 됨 · Lv.3 101 — 잠김 */
export const RejectedLocked: Story = { globals: { userKind: 'rejected' }, parameters: route('3-101') };
