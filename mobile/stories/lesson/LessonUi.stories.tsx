import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import {
  Avatar,
  BulbButton,
  GhostButton,
  Kicker,
  MicButton,
  ModeTabs,
  NoSpeakToggle,
  SaveButton,
  SpeakerButton,
  TaskMsg,
  YellowButton,
  type AnswerMode,
} from '@/components/lesson/lesson-ui';
import { PText } from '@/components/ui/text';

import { padded } from '../_support/padded';

/** 레슨 공용 부품 (lesson-ui) — 버튼 · 말하기 버튼 · 탭 · 전구 · 듣기 · 저장 · 말하기가 어려워요 · 얼굴 · 안내 글. */
const meta = {
  title: 'Lesson/LessonUi',
  decorators: [padded],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const Row = ({ children }: { children: ReactNode }) => <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>{children}</View>;

/** 노랑 큰 버튼 — 보통 · 막힘 · 긴 글 */
export const YellowButtons: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      <YellowButton label="계속하기" onPress={fn()} />
      <YellowButton label="다 놓으면 확인" onPress={fn()} disabled />
      <YellowButton label="모범 답 따라 말하고 완료하기까지 아주 긴 버튼 글자" onPress={fn()} />
    </View>
  ),
};
/** 흰 테두리 버튼 — 보통 · 막힘 · 옆에 노랑과 같이 */
export const GhostButtons: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      <GhostButton label="넘어가기" onPress={fn()} />
      <GhostButton label="정답 확인하기" onPress={fn()} disabled />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <GhostButton label="다시 하기" onPress={fn()} style={{ flex: 1 }} />
        <YellowButton label="계속하기" onPress={fn()} style={{ flex: 1 }} />
      </View>
    </View>
  ),
};
/** 말하기 버튼 — 기다림(보라) · 듣는 중(분홍 + 소리 막대) · 못 씀 */
export const MicButtons: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      <MicButton listening={false} label="눌러서 말하기" onPress={fn()} />
      <MicButton listening label="눌러서 말하기" onPress={fn()} />
      <MicButton listening={false} label="눌러서 말하기" disabled onPress={fn()} />
    </View>
  ),
};

function TabsDemo({ initial, disabled = false }: { initial: AnswerMode; disabled?: boolean }) {
  const [v, setV] = useState<AnswerMode>(initial);
  return (
    <ModeTabs
      tabs={[
        ['card', '단어 카드'],
        ['voice', '말하기'],
        ['write', '쓰기'],
      ]}
      value={v}
      onChange={setV}
      disabled={disabled}
    />
  );
}
/** 답하는 방식 탭 — 고른 칸마다 · 잠김 (눌러서 바꿔 볼 수 있어요) */
export const ModeTabsAll: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      <TabsDemo initial="card" />
      <TabsDemo initial="voice" />
      <TabsDemo initial="write" />
      <TabsDemo initial="voice" disabled />
    </View>
  ),
};
/** 전구 — 꺼짐 · 켜짐 · 단계 숫자 배지 · 다 씀(막힘) */
export const BulbButtons: Story = {
  render: () => (
    <Row>
      <BulbButton on={false} onPress={fn()} />
      <BulbButton on onPress={fn()} />
      <BulbButton on n={2} onPress={fn()} />
      <BulbButton on n={3} disabled onPress={fn()} />
    </Row>
  ),
};
/** 듣기(흰 · 하늘) · 표현 저장(안 함 · 함) */
export const SpeakerAndSave: Story = {
  render: () => (
    <Row>
      <SpeakerButton onPress={fn()} />
      <SpeakerButton onPress={fn()} tone="sky" size={40} />
      <SaveButton saved={false} onPress={fn()} />
      <SaveButton saved onPress={fn()} />
    </Row>
  ),
};
/** 말하기가 어려워요 — 꺼짐 · 켜짐 */
export const NoSpeakToggles: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      <NoSpeakToggle on={false} onPress={fn()} />
      <NoSpeakToggle on onPress={fn()} />
    </View>
  ),
};
/** 교재 인물 얼굴 4명 + 사진 없는 이름(첫 글자) */
export const Avatars: Story = {
  render: () => (
    <Row>
      {['Lily', 'Sonya', 'Logan', 'Aiden', 'Mina'].map((n) => (
        <View key={n} style={{ alignItems: 'center', gap: 4 }}>
          <Avatar name={n} size={56} />
          <PText>{n}</PText>
        </View>
      ))}
    </Row>
  ),
};
/** 작은 회색 안내 · 가운데 한 줄 */
export const Texts: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      <Kicker text="대화문 · ① 순서 맞추기" />
      <TaskMsg>섞인 대사를 순서대로 눌러 위에 쌓아요</TaskMsg>
      <TaskMsg color="#C2416B">빨간 줄은 자리가 달라요</TaskMsg>
    </View>
  ),
};
