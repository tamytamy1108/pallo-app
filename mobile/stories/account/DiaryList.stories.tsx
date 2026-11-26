import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { DiaryList } from '@/components/account/diary-list';
import { saveDiary } from '@/components/account/store';

import { fresh } from '../my/_state';

/**
 * 나의 스터디 일기 모아 보기 (화면 전체) — 예시 일기 3편 · 내가 하나 더 쓴 상태.
 * 예시 일기(DIARY_EXAMPLES)는 늘 깔려 있어서 '일기 0편' 모양은 만들 수 없다.
 */
const meta = {
  title: 'Account/DiaryList',
  component: DiaryList,
  beforeEach: fresh(),
} satisfies Meta<typeof DiaryList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
/** 오늘 노트(pn4)에도 일기를 씀 — 4편 · 스티커 요약 바뀜 */
export const OneMore: Story = { beforeEach: fresh({}, () => saveDiary('pn4', { st: ['new', 'ask'], q: 1, t: '오늘은 질문을 많이 했다.', at: '11.10 22:40' })) };
