import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { CurrPanel, EmptyBlock, PanelCard, SitPanel } from '@/components/library/lib-panel';

import { freshDevice } from '../_support/fresh-device';
import { padded } from '../_support/padded';
import { book, doneLesson, doneScene, doneSteps, level, pauseNext, practiceScene, sitMap } from './_fixtures';

/**
 * 라이브러리 아래 카드 — 교재(과 목록) · 상황 맵(장면 목록) · 빈 칸.
 * 비회원(툴바 '회원 유형')은 첫 과 · 첫 장면만 열리고 나머지는 '회원' 줄. 데이터 없는 과는 점선 '커밍순'.
 */
const meta = {
  title: 'Library/LibPanel',
  component: CurrPanel,
  args: { book: book('en-1') },
  decorators: [padded],
  beforeEach: freshDevice(),
} satisfies Meta<typeof CurrPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 내 레벨(Lv.1) — 위에 '스터디 맵 이어서' · 1과만 데이터, 나머지 커밍순 */
export const MyLevel: Story = {};
/** 진도 — 1과 단계 몇 개 끝냄 (점이 색칠) */
export const InProgress: Story = { beforeEach: freshDevice(() => doneSteps(level(1), 1, 4)) };
/** 1과 다 끝냄 */
export const LessonDone: Story = { beforeEach: freshDevice(() => doneLesson(level(1), 1)) };
/** 멈춘 곳 있음 (이어서 카드를 누르면 '이어서 하기' 팝업) */
export const Paused: Story = {
  beforeEach: freshDevice(() => {
    doneSteps(level(1), 1, 2);
    pauseNext(level(1), 1, 2);
  }),
};
/** 내 레벨이 아닌 교재 (이어서 카드 없음) — Lv.2 */
export const OtherLevel: Story = { args: { book: book('en-2') } };
/** Lv.3 토픽 (#101 번호) */
export const Topic: Story = { args: { book: book('en-3') } };
/** Lv.4 토론 */
export const Debate: Story = { args: { book: book('en-4') } };
/** 과 목록이 없는 교재 (Lv.0) — '구름에 가려 있어요' + 교재 소개 버튼 */
export const NoLessons: Story = { args: { book: book('en-0') } };
/** 일본어 교재 (과 목록 없음 · 일본어 표기) */
export const JapaneseNoLessons: Story = { args: { book: book('ja-1') } };
/** 비회원 — 첫 과만 열림 · 나머지 '회원' 줄 */
export const Guest: Story = { globals: { userKind: 'guest' }, args: { book: book('en-2') } };
export const GuestMyLevel: Story = { globals: { userKind: 'guest' } };

/** 상황 맵 장면 목록 */
export const Situation: Story = { render: () => <SitPanel map={sitMap('travel')} /> };
/** 장면 하나 끝냄 · 다음 장면 연습 점 일부 */
export const SituationProgress: Story = {
  beforeEach: freshDevice(() => {
    doneScene('travel', 1);
    practiceScene('travel', 2, 2);
  }),
  render: () => <SitPanel map={sitMap('travel')} />,
};
/** 비회원 — 첫 장면만 */
export const SituationGuest: Story = { globals: { userKind: 'guest' }, render: () => <SitPanel map={sitMap('travel')} /> };
/** 장면 수가 적은 맵 (카페) */
export const SituationCafe: Story = { render: () => <SitPanel map={sitMap('cafe')} /> };

/** 빈 칸 — 버튼 있음 */
export const Empty: Story = {
  render: () => (
    <PanelCard>
      <EmptyBlock title="중국어 교재 · 커밍순" sub="섬이 열리면 여기서 바로 예습 · 본학습 · 복습할 수 있어요." button="열리면 알림 받기" onPress={fn()} />
    </PanelCard>
  ),
};
/** 빈 칸 — 버튼 없음 */
export const EmptyNoButton: Story = {
  render: () => (
    <PanelCard>
      <EmptyBlock title="중국어 상황 맵 · 커밍순" sub="여행 · 카페 맵부터 열려요." />
    </PanelCard>
  ),
};
