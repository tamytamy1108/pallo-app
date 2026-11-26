import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { AskBubble, BgText, CardHead, ChkRow, CmpBox, EndMsg, EndNote, FootRow, GoBtn, Kicker, MarkBtn, MicKey, ModeTabs, Msg, NoSpeakToggle, SkipBtn, Spk, Stars, TkHead, UsedList } from '@/components/lesson34/ui';
import { saveExpression } from '@/state/expressions';

import { freshDevice } from '../_support/fresh-device';
import { padded } from '../_support/padded';
import { STORY_SOURCE } from './_runner';

/*
 * Lv.3 · 4 문제 화면의 작은 조각 (lesson34/ui.tsx) — 블록들이 나눠 쓴다. 조각마다 스토리 하나, 모양이 갈리는 값은 나란히.
 * 기본 컴포넌트는 묻는 말풍선(AskBubble).
 */
const LONG_EN = 'Have you ever forgotten someone’s name right after meeting them, even though they remembered yours perfectly?';
const SAVED = 'It was on the tip of my tongue.';

const meta = {
  title: 'Lesson34/Ui',
  component: AskBubble,
  decorators: [padded],
  beforeEach: freshDevice(),
  args: { ask: { en: 'Have you ever forgotten someone’s name?', ko: '누군가의 이름을 잊은 적 있어요?' }, soundOff: false },
} satisfies Meta<typeof AskBubble>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 팔로(보라)가 묻는 말풍선 */
export const AskPallo: Story = {};
/** 교재 인물(사진 · 이름표) · 이니셜 원(사진 없는 사람) · 긴 문장 · 소리 끄기 */
export const AskVariants: Story = {
  render: () => (
    <View style={{ gap: 16 }}>
      <AskBubble ask={{ who: 'Logan', en: 'I’m on side B. A ban protects people.', ko: 'SIDE B · 금지가 사람을 지켜요' }} soundOff={false} />
      <AskBubble ask={{ who: 'Aiden', en: 'What would you do?' }} soundOff={false} />
      <AskBubble ask={{ who: 'Mina', c: '#C2416B', en: 'Who is Mina?', ko: '사진 없는 사람은 이니셜' }} soundOff={false} />
      <AskBubble ask={{ en: LONG_EN, ko: '만나자마자 이름을 잊은 적 있어요? 상대는 내 이름을 다 기억했는데도요.' }} soundOff={false} />
      <AskBubble ask={{ en: '소리 끄기 — 듣기 버튼 없음', ko: '' }} soundOff />
    </View>
  ),
};
/** 위 작은 회색 안내 (한 줄 · 넘치면 말줄임) */
export const KickerLine: Story = {
  render: () => (
    <View style={{ gap: 8 }}>
      <Kicker text="KEYWORDS 익히기 · 3/12" />
      <Kicker text="DEBATE · ② 반박 배틀 · 20초 · 아주 긴 안내가 들어가면 한 줄에서 말줄임으로 잘려요" />
    </View>
  ),
};
/** 문제 머리 — 세 줄 다 · 큰 글씨만 · 작은 글씨만 */
export const Head: Story = {
  render: () => (
    <View style={{ gap: 16 }}>
      <TkHead head={{ k: 'FREE TALK 1', p: 'Do you prefer staying in or going out on weekends?', m: '주말엔 집에 있는 게 좋아요, 나가는 게 좋아요?' }} />
      <TkHead head={{ p: 'To sum up, …' }} />
      <TkHead head={{ k: 'BONUS', m: '처음 보는 토픽 · 15초 준비 → 1분' }} />
    </View>
  ),
};
/** 카드 머리 + 듣기 · 저장 버튼 (저장됨 = 노랑) */
export const CardHeadTools: Story = {
  beforeEach: () => void saveExpression({ en: SAVED, ko: '생각날 듯 말 듯했어요', source: STORY_SOURCE }),
  render: () => (
    <View style={{ gap: 16 }}>
      <CardHead label="예문을 듣고 뜻을 골라요">
        <MarkBtn en="Not saved yet." ko="아직 안 저장" source={STORY_SOURCE} />
        <Spk text="Not saved yet." soundOff={false} />
      </CardHead>
      <CardHead label="저장된 표현">
        <MarkBtn en={SAVED} ko="생각날 듯 말 듯했어요" source={STORY_SOURCE} />
        <Spk text={SAVED} soundOff={false} label="내 말 듣기" />
      </CardHead>
      <CardHead label="소리 끄기 — 듣기 없음">
        <Spk text={SAVED} soundOff />
      </CardHead>
    </View>
  ),
};
/** 가운데 안내 (**굵은 분홍**) · 빈 글이면 안 그림 */
export const Message: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      <Msg text="영어로 내 생각을 써요 · 3문장 이상" />
      <Msg text="**이유 · 예시**만 이어서 말해요" />
      <Msg text="" />
    </View>
  ),
};
/** 별 0 ~ 3개 */
export const StarRow: Story = {
  render: () => (
    <View style={{ gap: 8 }}>
      {[0, 1, 2, 3].map((n) => (
        <Stars key={n} n={n} />
      ))}
    </View>
  ),
};
/** 쓴 키워드 줄 (쓴 말은 노란 밑줄) · 가운데 정렬 · 라벨 없음 */
export const CheckRow: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      <ChkRow label="오늘 단어" items={[{ t: 'hooked on', on: true }, { t: 'daily grind' }, { t: 'slow down', on: true }, { t: 'grow on' }, { t: 'breathing room' }, { t: 'the norm' }]} />
      <ChkRow center items={[{ t: 'reminisce', on: true }, { t: 'curfew' }]} />
    </View>
  ),
};
/** 배경 글 · Before / After 비교 상자 */
export const Boxes: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      <BgText text="Some people say weekends are for rest, while others say they are for adventure." />
      <CmpBox label="BEFORE · 예습 때" text="I like stay home." />
      <CmpBox label="AFTER" text="These days I’m hooked on staying in because it helps me unwind." after />
    </View>
  ),
};
/** 체크 목록 — 맞은 것 · 빠진 것 · 아래 설명이 붙은 줄 */
export const Used: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      <UsedList items={[{ l: '주장 (I believe / I think)', on: true }, { l: '이유 (because)', on: true }, { l: '예시 (For example)', on: false }, { l: '3문장 이상', on: false }]} />
      <UsedList title="고칠 문장 1개" items={[{ l: '', on: true, sub: <Msg text="I like stay home → I like **staying** home" /> }]} />
    </View>
  ),
};
/** 말하기가 어려워요 (꺼짐 · 켜짐) */
export const NoSpeak: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      <NoSpeakToggle on={false} onPress={fn()} />
      <NoSpeakToggle on onPress={fn()} />
    </View>
  ),
};
/** 답하는 방식 탭 — 눌러서 바꿔 볼 수 있어요 */
export const Tabs: Story = {
  render: function TabsDemo() {
    const [cur, setCur] = useState<'voice' | 'write'>('voice');
    return (
      <ModeTabs
        list={[
          ['voice', '말하기'],
          ['write', '쓰기'],
        ]}
        cur={cur}
        onPick={setCur}
      />
    );
  },
};
/** 말하기 키 — 기본 · 듣는 중(분홍 · 물결) · 콤보 */
export const Mic: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      <MicKey label="눌러서 말하기" live="다 말했어요" on={false} onPress={fn()} />
      <MicKey label="말하기 시작" live="다 말했어요" on onPress={fn()} />
      <MicKey label="말하기 시작" live="다 말했어요" on={false} combo="콤보 x4" onPress={fn()} />
    </View>
  ),
};
/** 결과 줄 — 잘함(노랑 팔로 · 보라 제목) · 아쉬움(보라 팔로 · 분홍 제목) · 제목 따로 */
export const EndNotes: Story = {
  render: () => (
    <View style={{ gap: 16 }}>
      <EndNote good>
        <EndMsg rest="좋아요! 기준을 다 채웠어요 · 단어 32개" good />
      </EndNote>
      <EndNote good={false}>
        <EndMsg rest="기준을 다 채우지 못했어요 · 한 번 더 해 볼까요? · 단어 6개" />
      </EndNote>
      <EndNote good={false}>
        <EndMsg title="5초를 넘겼어요" rest=" · 콤보가 끊겼어요 · 단어 9개" />
      </EndNote>
    </View>
  ),
};
/** 아래 버튼 줄 — 넘어가기 + 다음 · 꺼진 버튼 · 작은 버튼 */
export const Buttons: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      <FootRow>
        <SkipBtn label="그냥 넘어가기" onPress={fn()} />
        <GoBtn label="다시 답변하기" onPress={fn()} />
      </FootRow>
      <FootRow>
        <GoBtn label="예문 1/3" disabled onPress={fn()} />
      </FootRow>
      <FootRow>
        <GoBtn label="완료하기" compact onPress={fn()} />
      </FootRow>
    </View>
  ),
};
