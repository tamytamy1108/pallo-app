import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { View } from 'react-native';

import { ListenCard, MiniCover, UnitHero, UnitSummary } from '@/components/library/unit-parts';

import { padded } from '../_support/padded';
import { book, level } from './_fixtures';

/** 과 화면 조각 — 교재 표지 · 머리(LESSON 01 / SESSION #101) · 이번 과 핵심 카드 · 리스닝 룸 카드. */
const meta = {
  title: 'Library/UnitParts',
  component: MiniCover,
  args: { color: '#138A9E', n: 'PALLO', l: 'Lv.1', s: 'EVERYDAY ENGLISH' },
  decorators: [padded],
} satisfies Meta<typeof MiniCover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Cover: Story = {};
/** 교재 소개 크기 (110 폭) */
export const CoverLarge: Story = { args: { width: 110 } };
/** 일본어 표지 (시리즈 줄 없음) */
export const CoverJapanese: Story = { args: { color: '#2A7F5A', n: '日本語の旅', l: 'レベル 1', s: undefined, jp: true } };
/** 책장 표지 한눈에 */
export const AllCovers: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
      {['en-0', 'en-1', 'en-2', 'en-3', 'en-4', 'ja-0', 'ja-05', 'ja-1', 'ja-2'].map((id) => {
        const b = book(id);
        return <MiniCover key={id} color={b.c} n={b.n} l={b.l} s={b.s} jp={!!b.jp} />;
      })}
    </View>
  ),
};

const L1 = level(1);
const L3 = level(3);
const L4 = level(4);

/** 과 머리 — 패턴(LESSON 01) · 토픽(SESSION #101) · 토론 */
export const Hero: Story = {
  render: () => (
    <View style={{ gap: 24 }}>
      <UnitHero L={L1} ls={L1.lessons[0]} />
      <UnitHero L={L3} ls={L3.lessons[0]} />
      <UnitHero L={L4} ls={L4.lessons[1]} />
    </View>
  ),
};

/** 오늘의 패턴 (Lv.1) */
export const SummaryPattern: Story = { render: () => <UnitSummary L={L1} ls={L1.lessons[0]} /> };
/** 이번 회차 · 토픽 + 자료 PDF */
export const SummaryTopic: Story = { render: () => <UnitSummary L={L3} ls={L3.lessons[0]} /> };
/** 이번 회차 · 토론 + 자료 PDF */
export const SummaryDebate: Story = { render: () => <UnitSummary L={L4} ls={L4.lessons[0]} /> };
/** 토론 · 자료 없음 */
export const SummaryDebateNoPdf: Story = { render: () => <UnitSummary L={L4} ls={L4.lessons[1]} /> };

/** 리스닝 룸 카드 */
export const Listen: Story = { render: () => <ListenCard sub="이번 과 문장 12개 · 듣고 따라 말해요" onPress={fn()} /> };
