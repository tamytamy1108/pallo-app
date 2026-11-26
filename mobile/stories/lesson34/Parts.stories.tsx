import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { AnsCards, CardView, ExtraView, FollowBubble, Marked, ModelCard, SplitView, TopPart, UpgradeCard } from '@/components/lesson34/parts';
import { phraseRe, splitAnswer } from '@/components/lesson34/text';
import type { CardBlock } from '@/components/lesson34/types';
import { LV3_101 } from '@/data/lesson34-lv3';
import { LV4_101 } from '@/data/lesson34-lv4';

import { freshDevice } from '../_support/fresh-device';
import { padded } from '../_support/padded';
import { STORY_SOURCE } from './_runner';

/*
 * 문제 위아래에 붙는 조각 (lesson34/parts.tsx) — 머리 · 말풍선 · 카드(7종) · 내 말 표시 · 칸 나누기 · 모범 답 · 업그레이드 · 꼬리 질문 · 정답 카드 · 결과 더 보기.
 * 기본 컴포넌트는 문제 위 묶음(TopPart).
 */
const KW = LV3_101.keywords;
const J = LV3_101.journal;

const CARDS: Record<CardBlock['kind'], CardBlock> = {
  kw2: { kind: 'kw2', items: [{ w: KW[0][0], m: KW[0][1], star: true }, { w: KW[1][0], m: KW[1][1] }] },
  chips: { kind: 'chips', label: '넣어 볼 단어', items: J.use },
  bg: { kind: 'bg', text: LV4_101.free[0].bg },
  before: { kind: 'before', label: '예습 때 내 입장 · SIDE A', text: LV4_101.debate.A.t },
  plain: { kind: 'plain', label: '평소 표현', en: LV4_101.better[0][0] },
  useful: { kind: 'useful', label: 'USEFUL LINE · 반박을 부드럽게', en: 'Be that as it may, I still think we need rules.' },
  guide: { kind: 'guide', steps: [['1', '요즘 하는 일'], ['2', '좋은 점 · 힘든 점'], ['3', '요즘 느끼는 것']], chips: { label: '넣어 볼 단어', items: J.use.slice(0, 4) } },
};

const SPLIT_FULL = 'I prefer staying home. I like it because it helps me recharge. For example, last weekend I read all day. These days many people feel the same.';

const meta = {
  title: 'Lesson34/Parts',
  component: TopPart,
  decorators: [padded],
  beforeEach: freshDevice(),
  args: {
    head: { k: 'FREE TALK 1', p: LV4_101.free[0].en, m: LV4_101.free[0].ko },
    ask: { en: LV3_101.topic.follow[0], ko: LV3_101.topic.follow[1] },
    card: CARDS.bg,
    soundOff: false,
  },
} satisfies Meta<typeof TopPart>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 머리 + 말풍선 + 카드 다 있을 때 */
export const Top: Story = {};
/** 머리만 */
export const TopHeadOnly: Story = { args: { ask: undefined, card: undefined } };
/** 카드 7종 */
export const Cards: Story = {
  render: () => (
    <View style={{ gap: 16 }}>
      {Object.values(CARDS).map((c) => (
        <CardView key={c.kind} card={c} soundOff={false} />
      ))}
      <CardView card={{ kind: 'chips', items: J.use.slice(0, 3), on: true }} soundOff={false} />
    </View>
  ),
};
/** 카드 · 소리 끄기 */
export const CardsSoundOff: Story = {
  render: () => (
    <View style={{ gap: 16 }}>
      <CardView card={CARDS.plain} soundOff />
      <CardView card={CARDS.useful} soundOff />
    </View>
  ),
};
/** 내 말 — 표현이 노란 밑줄로 · 표시 없음 */
export const MarkedText: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      <Marked text="The name was on the tip of my tongue, so I tried to play it cool." marks={[phraseRe('on the tip of my tongue'), phraseRe('play it cool')]} />
      <Marked text="I forgot her name." />
    </View>
  ),
};
/** 칸 나누기 — 다 채움 · 빠진 칸 · 예시 문장 있음 */
export const Split: Story = {
  render: () => (
    <View style={{ gap: 16 }}>
      <SplitView split={splitAnswer(SPLIT_FULL, ['choice', 'reason', 'example', 'society'])} />
      <SplitView split={splitAnswer('I prefer staying home.', ['choice', 'reason', 'example', 'society'], ['I prefer ___.', 'because ___', 'For example, ___', 'These days people ___'])} />
    </View>
  ),
};
/** 모범 답 (한국어 있음 · 없음) · 업그레이드 · 꼬리 질문 */
export const Cards2: Story = {
  name: 'Model · Upgrade · Follow',
  render: () => (
    <View style={{ gap: 16 }}>
      <ModelCard label="이렇게 말할 수도 있어요" en="Yes! I once forgot a new coworker’s name right after lunch." ko="네! 점심 먹고 바로 새 동료 이름을 잊은 적이 있어요." soundOff={false} source={STORY_SOURCE} />
      <ModelCard label="예문" en={LV4_101.key[0][2]} soundOff source={STORY_SOURCE} />
      <UpgradeCard from="I think" to="I’d say" ko="생각해요 → ~라고 할 수 있죠" soundOff={false} source={STORY_SOURCE} />
      <FollowBubble en="Why do you think that happens?" ko="왜 그런 일이 생긴다고 생각해요?" />
    </View>
  ),
};
/** 정답 문장이 카드로 날아와요 (짧은 · 긴 문장) */
export const AnswerCards: Story = {
  render: () => (
    <View style={{ gap: 16 }}>
      <AnsCards sentence="I’m stretched too thin right now." soundOff={false} />
      <AnsCards sentence="The writer tried to sneak a peek at his ID card and searched the company chat for hours." label="정답 문장" soundOff />
    </View>
  ),
};
/** 결과 더 보기 — 저널 정리(고칠 문장 있음 · 없음) */
export const ExtraJournal: Story = {
  render: () => (
    <View style={{ gap: 16 }}>
      <ExtraView
        soundOff={false}
        extra={{ kind: 'journal', date: '2026. 11. 25.', text: J.sample, marks: J.use.map((w) => phraseRe(w)), use: J.use, used: J.use.slice(0, 3), fixes: [['I am hooked on drama', 'I’m hooked on a drama'], ['I watch it everyday', 'I watch it every day']] }}
      />
      <ExtraView soundOff extra={{ kind: 'journal', date: '2026. 11. 25.', text: 'These days I’m hooked on running.', marks: [], use: J.use, used: [], fixes: [] }} />
    </View>
  ),
};
/** 결과 더 보기 — 질문 날카로움 (높음 · 낮음) + 상대의 답 */
export const ExtraSharp: Story = {
  render: () => (
    <View style={{ gap: 16 }}>
      <ExtraView soundOff={false} extra={{ kind: 'sharp', n: 5, who: 'Logan', c: '#2F4E8C', en: 'That’s a fair question. Strict checks would protect them.', ko: 'SIDE B가 답해요' }} />
      <ExtraView soundOff extra={{ kind: 'sharp', n: 2, who: 'Logan', c: '#2F4E8C', en: 'Well, I don’t think so.', ko: 'SIDE B가 답해요' }} />
    </View>
  ),
};
