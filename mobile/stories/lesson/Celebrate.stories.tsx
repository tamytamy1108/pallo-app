import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { Celebrate, type CelebrateWhere } from '@/components/lesson/celebrate';

/**
 * 완료(축하) 화면 — 무대 위 팔로 (완료 화면 통일안 · 시안 3).
 * ① 단계 완료: 크림 화면 안 보라 무대 칸 · ② 구역 완료: 화면 전체가 구역 색 무대 · ③ 회차 완료: 분홍 무대 + 색종이 · ④ 레벨 완료: 밤 무대 + 발판 점프.
 * 제목은 무작위 없이 점수로 (완벽해요! · 좋아요! · 괜찮아요! · 점수 없으면 다 했어요!).
 */
const lv3Where = (pre: string, main: string, post: string, label: string, note?: string): CelebrateWhere => {
  const cells = (s: string) => [...s].map((c) => (c === 'd' ? 'done' : c === 'n' ? 'now' : c === 's' ? 'skip' : 'todo') as 'done' | 'now' | 'todo' | 'skip');
  return { groups: [{ label: '예습', cells: cells(pre) }, { label: '본학습', cells: cells(main) }, { label: '복습', cells: cells(post) }], label, note };
};

const meta = {
  title: 'Lesson/Celebrate',
  component: Celebrate,
  args: {
    visible: true,
    result: { correct: 6, total: 6, points: 5, goalDone: 1, goalTotal: 2, nextPoints: 5, where: lv3Where('ddn_', '___', '___', '예습 3/4', 'USEFUL EXPRESSIONS') },
    onHome: fn(),
    onNext: fn(),
  },
} satisfies Meta<typeof Celebrate>;

export default meta;
type Story = StoryObj<typeof meta>;

/** ① 단계 완료 — 칸 안 보라 무대 · 팔로 제자리 통통 */
export const Step: Story = {};
/** ① 점수가 낮을 때 */
export const StepTried: Story = { args: { result: { correct: 2, total: 9, points: 5, goalDone: 1, goalTotal: 2, where: lv3Where('dn__', '___', '___', '예습 2/4', '지문 읽기') } } };
/** ① 점수 없는 단계 */
export const StepNoScore: Story = { args: { result: { correct: 0, total: 0, points: 5, goalDone: 2, goalTotal: 2, where: lv3Where('dddn', '___', '___', '예습 4/4', '질문 미리 보기') } } };
/** ① 다시 한 단계 — 포인트 없이 */
export const StepAgain: Story = { args: { result: { correct: 8, total: 9, points: 0, goalDone: 2, goalTotal: 2 } } };
/** ② 예습 완료 — 노랑 무대 · 보라 팔로 */
export const ZonePre: Story = {
  args: { result: { correct: 0, total: 0, points: 5, goalDone: 2, goalTotal: 2, tier: 'zone', zone: 'pre', title: '예습 완료!', sub: '다음은 본학습 · 지난주 단어로 말하기', nextPoints: 5, where: lv3Where('dddn', '___', '___', '예습 4/4', '질문 미리 보기') } },
};
/** ② 본학습 완료 — 분홍 무대 */
export const ZoneMain: Story = {
  args: { result: { correct: 0, total: 0, points: 10, goalDone: 2, goalTotal: 2, tier: 'zone', zone: 'main', title: '본학습 완료!', sub: '다음은 복습 · 스피킹 퀴즈', nextPoints: 10, where: lv3Where('dddd', 'ddn', '___', '본학습 3/3', 'TOPIC 이야기하기') } },
};
/** ② 복습 완료 — 하늘 무대 */
export const ZonePost: Story = {
  args: { result: { correct: 7, total: 8, points: 10, goalDone: 2, goalTotal: 2, tier: 'zone', zone: 'post', title: '복습 완료!', where: lv3Where('dddd', 'ddd', 'd_n', '복습 3/3', 'Before / After') } },
};
/** ③ 회차 완료 — 분홍 무대 · 색종이 · 집 버튼 없이 */
export const Session: Story = {
  args: { onNext: undefined, result: { correct: 0, total: 0, points: 10, goalDone: 2, goalTotal: 2, tier: 'session', title: '101회 완료!', sub: '10단계를 다 했어요', where: lv3Where('dddd', 'ddd', 'ddn', '복습 3/3', 'Before / After') } },
};
/** ④ 레벨 완료 (교재 레벨만) — 밤 무대 · 금색 조명 · 발판 점프 · 배지 */
export const Level: Story = {
  args: {
    onNext: undefined,
    result: {
      correct: 0,
      total: 0,
      points: 15,
      goalDone: 2,
      goalTotal: 2,
      tier: 'level',
      title: 'Lv.2 완료!',
      sub: '교재 12과를 다 했어요',
      badge: 'Lv.2 배지',
      where: { groups: [{ label: 'Lv.2 교재', cells: [...Array(11).fill('done'), 'now'] }], label: '12/12 과', note: 'Lv.2 끝' },
    },
  },
};
/** 건너뛰기 테스트 통과 — ② 모양 · 포인트 없음 · 건너뛴 칸은 연보라 */
export const SkipPass: Story = {
  args: {
    onNext: undefined,
    result: { correct: 0, total: 0, points: 0, goalDone: 2, goalTotal: 2, tier: 'zone', zone: 'pre', title: '테스트 통과!', sub: '예습까지 건너뛰었어요 · 퀘스트 4개 완료', where: lv3Where('ssss', '___', '___', '예습까지 건너뜀') },
  },
};
/** 숨김 */
export const Hidden: Story = { args: { visible: false } };
