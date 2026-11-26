import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { GuestMsg, MarkButton, MyMsg } from '@/components/lesson/chat';
import { PText } from '@/components/ui/text';

import { padded } from '../_support/padded';

/** 대화 말풍선 (상황 활동 · 프리토킹) — 왼쪽 상대(얼굴 · 이름 · 듣기) · 오른쪽 나(노랑 · 표현 저장). fresh 면 아래에서 떠올라요. */
const meta = {
  title: 'Lesson/Chat',
  component: GuestMsg,
  args: { who: 'Logan', en: 'Hi, excuse me. My remote doesn’t work.', ko: '저기요, 리모컨이 작동하지 않아요.', soundOff: false, onSay: fn() },
  decorators: [padded],
} satisfies Meta<typeof GuestMsg>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 상대 말 — 이름 없이 */
export const Guest: Story = {};
/** 이름 줄 보이기 */
export const GuestWithName: Story = { args: { showWho: true } };
/** 소리 끄기 — 듣기 버튼 없음 */
export const GuestSoundOff: Story = { args: { soundOff: true } };
/** 뜻 없이 영어만 */
export const GuestNoKorean: Story = { args: { ko: undefined } };
/** 사진 없는 인물 */
export const GuestUnknown: Story = { args: { who: 'Mina', showWho: true } };
/** 새로 들어온 말 (떠오르며 나타나요) */
export const GuestFresh: Story = { args: { fresh: true } };

const Mine = ({ text }: { text: string }) => <PText>{text}</PText>;
/** 내 말 — 저장 버튼 없이 */
export const Me: Story = { render: () => <MyMsg><Mine text="I’m sorry to hear that. Let me check it." /></MyMsg> };
/** 내 말 + 저장 안 함 */
export const MeSavable: Story = { render: () => <MyMsg saved={false} onSave={fn()}><Mine text="Sure. I’ll send someone right away." /></MyMsg> };
/** 내 말 + 저장됨 */
export const MeSaved: Story = { render: () => <MyMsg saved onSave={fn()}><Mine text="Yes, we have one at the front desk." /></MyMsg> };
/** 책갈피 버튼만 — 안 함 · 함 */
export const MarkButtons: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 16 }}>
      <MarkButton saved={false} onPress={fn()} />
      <MarkButton saved onPress={fn()} />
    </View>
  ),
};
/** 주고받기 한 번 (상황 활동 화면처럼) */
export const Conversation: Story = {
  render: (a) => (
    <View style={{ gap: 12 }}>
      <GuestMsg {...a} showWho />
      <MyMsg saved={false} onSave={fn()}><Mine text="I’m sorry to hear that. Let me check it." /></MyMsg>
      <GuestMsg {...a} en="I changed the batteries, but it still doesn’t work. Could you send someone?" ko="건전지를 바꿨는데도 안 돼요. 사람을 보내 주실 수 있나요?" />
      <MyMsg saved onSave={fn()}><Mine text="Sure. I’ll send someone right away." /></MyMsg>
    </View>
  ),
};
