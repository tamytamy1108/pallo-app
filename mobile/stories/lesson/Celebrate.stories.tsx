import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { Celebrate } from '@/components/lesson/celebrate';

/**
 * 완료(축하) 화면 — 숫자 카드(포인트 · 정확도 · 빠른 답 · 오늘 목표), 아래 집 + [이어서 하기].
 * 제목은 점수로 고르니(만점 · 잘함 · 끝까지) 매번 다를 수 있어요. onNext 가 없으면 노랑 버튼만 꽉 차게.
 */
const meta = {
  title: 'Lesson/Celebrate',
  component: Celebrate,
  args: {
    visible: true,
    result: { correct: 7, total: 9, points: 10, goalDone: 1, goalTotal: 3, nextPoints: 5 },
    onHome: fn(),
    onNext: fn(),
  },
} satisfies Meta<typeof Celebrate>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 잘했어요 (7/9) */
export const Good: Story = {};
/** 만점 */
export const Perfect: Story = { args: { result: { correct: 9, total: 9, points: 10, goalDone: 2, goalTotal: 3, nextPoints: 5 } } };
/** 많이 틀렸어도 끝까지 */
export const Tried: Story = { args: { result: { correct: 2, total: 9, points: 10, goalDone: 1, goalTotal: 3 } } };
/** 빠른 답 칸 (시간 안에 맞힌 수) */
export const WithFast: Story = { args: { result: { correct: 8, total: 9, points: 13, goalDone: 1, goalTotal: 3, timed: 9, fast: 6, nextPoints: 10 } } };
/** 점수 없는 단계 (챌린지 · My Story) — 정확도 칸 없음 */
export const NoAccuracy: Story = { args: { result: { correct: 0, total: 0, points: 15, goalDone: 3, goalTotal: 3 } } };
/** 다시 한 단계 — 포인트 0 */
export const NoPoints: Story = { args: { result: { correct: 9, total: 9, points: 0, goalDone: 3, goalTotal: 3, nextPoints: 10 } } };
/** 마지막 단계 — [이어서 하기] 없이 노랑 버튼만 */
export const NoNext: Story = { args: { onNext: undefined } };
/** 구역(예습)을 다 끝냄 — 노랑 바탕 큰 축하 + 정해 준 제목 */
export const StageComplete: Story = { args: { result: { correct: 9, total: 9, points: 5, goalDone: 3, goalTotal: 3, big: true, title: '예습 완료!', nextPoints: 15 } } };
/** 과를 다 끝냄 */
export const UnitComplete: Story = { args: { onNext: undefined, result: { correct: 8, total: 8, points: 10, goalDone: 3, goalTotal: 3, big: true, unitComplete: true, title: '1과 완료!' } } };
/** 제목 아래 한 줄 (sub prop) */
export const WithSub: Story = { args: { sub: '카페 장면 완료! 지도에 도장이 찍혔어요' } };
/** 결과 안의 sub */
export const ResultSub: Story = { args: { result: { correct: 5, total: 5, points: 20, goalDone: 2, goalTotal: 3, sub: 'STAGE 3까지 건너뛰었어요' } } };
/** 숨김 */
export const Hidden: Story = { args: { visible: false } };
