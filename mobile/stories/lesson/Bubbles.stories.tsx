import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { AskBubble, MyTurnBubble, SentenceCard } from '@/components/lesson/bubbles';
import { saveExpression } from '@/state/expressions';

import { padded } from '../_support/padded';
import { freshLesson } from './_support';

/**
 * 레슨 말풍선 — 질문 말풍선(팔로 노랑 · 보라 / 교재 인물 얼굴) · 내 차례(노랑) · 완성 문장 카드(듣기 + 표현 저장).
 */
const meta = {
  title: 'Lesson/Bubbles',
  component: AskBubble,
  args: { en: 'What did you eat or drink today?', ko: '오늘 무엇을 먹거나 마셨나요?', soundOff: false, onSay: fn() },
  argTypes: { char: { control: 'inline-radio', options: ['yellow', 'purple'] } },
  decorators: [padded],
  beforeEach: freshLesson(),
} satisfies Meta<typeof AskBubble>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 팔로(노랑)가 묻는 말풍선 */
export const AskYellow: Story = { args: { char: 'yellow' } };
/** 팔로(보라) — 질문에 답하기 */
export const AskPurple: Story = { args: { char: 'purple' } };
/** 교재 인물이 말해요 (얼굴 + 이름, 꼬리 위쪽) */
export const AskPerson: Story = { args: { who: 'Lily', en: 'Hi. What can I get you today?', ko: '안녕하세요. 오늘 무엇을 드릴까요?' } };
/** 사진 없는 인물 — 첫 글자 얼굴 */
export const AskUnknownPerson: Story = { args: { who: 'Mina', en: 'Is this seat taken?', ko: '이 자리 있나요?' } };
/** 소리 끄기 — 듣기 버튼 없음 */
export const AskSoundOff: Story = { args: { soundOff: true } };
/** 뜻 없이 영어만 */
export const AskNoKorean: Story = { args: { ko: undefined } };
/** 긴 질문 */
export const AskLong: Story = {
  args: { who: 'Sonya', en: "Excuse me. I think there is something wrong with my latte. It doesn't taste like oat milk. Did you use oat milk?", ko: '실례합니다. 제 라테에 문제가 있는 것 같아요. 오트밀크 맛이 아닌 것 같아요. 오트밀크를 넣으셨나요?' },
};

/** 내 차례 — 노랑 말풍선에 뜻 + 오른쪽 '나 · Sonya' */
export const MyTurn: Story = {
  render: () => <MyTurnBubble me="Sonya" ko="안녕하세요. 오트밀크 있나요?" />,
};
/** 앞사람 대사 → 내 차례 (대화문 역할 연기 화면 그대로) */
export const Dialogue: Story = {
  render: (a) => (
    <View style={{ gap: 16 }}>
      <AskBubble {...a} who="Lily" en="Yes, we do." ko="네, 있습니다." />
      <MyTurnBubble me="Sonya" ko="오트밀크 아이스 라테로 주세요." />
    </View>
  ),
};

const SENT = { en: "I'd like to order an iced latte.", ko: '아이스 라테 한 잔을 주문하고 싶어요.', source: 'Lv.1 1과 · 스토리북' };
/** 완성 문장 카드 — 아직 저장 안 함 */
export const Sentence: Story = { render: () => <SentenceCard {...SENT} soundOff={false} onSay={fn()} /> };
/** 완성 문장 카드 — 표현함에 저장됨 (노랑 책갈피) */
export const SentenceSaved: Story = {
  beforeEach: freshLesson({ seed: () => saveExpression(SENT) }),
  render: () => <SentenceCard {...SENT} soundOff={false} onSay={fn()} />,
};
/** 완성 문장 카드 — 소리 끄기 · 뜻 없음 */
export const SentenceSoundOffNoKo: Story = { render: () => <SentenceCard {...SENT} ko="" soundOff onSay={fn()} /> };
