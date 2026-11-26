import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { Mic } from '@/components/scene/icons';
import { Avatar, BigBtn, Drop, FeedbackFoot, Kick, Opt, PressDrop, QuitSheet, ResultRow, SaveBtn, ScoreCard, SpeakRound, SpeakSquare } from '@/components/scene/parts';
import { PText } from '@/components/ui/text';
import { Colors } from '@/constants/theme';
import { saveExpression } from '@/state/expressions';
import { setNoListen } from '@/state/learn-prefs';

import { freshDevice } from '../_support/fresh-device';
import { padded } from '../_support/padded';

/*
 * 상황 장면 단계가 나눠 쓰는 조각 (scene/parts.tsx) — 보기(4가지 상태) · 정답 띠 · 큰 버튼 · 점수 카드 · 결과 줄 · 듣기 · 저장 · 그만하기 시트.
 * 기본 컴포넌트는 보기(Opt).
 */
const SRC = '상황 · 공항 체크인 · 스토리';
const SAVED = 'Could I get a window seat, please?';
const LONG = 'I’m sorry, but could you check whether there’s an aisle seat available near the front of the plane?';

const meta = {
  title: 'Scene/Parts',
  component: Opt,
  decorators: [padded],
  beforeEach: freshDevice(),
  args: { label: 'Could I get a window seat?', state: 'idle', onPress: fn() },
} satisfies Meta<typeof Opt>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OptIdle: Story = {};
/** 보기 4가지 상태 + 뜻이 붙은 정답 · 긴 문장 */
export const OptStates: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      <Opt label="idle · Here is my passport." state="idle" onPress={fn()} />
      <Opt label="right · Could I get a window seat?" sub="창가 자리로 주실 수 있나요?" state="right" onPress={fn()} />
      <Opt label="wrong · Give me window." state="wrong" onPress={fn()} />
      <Opt label="done · One bag, please." state="done" onPress={fn()} />
      <Opt label={LONG} state="idle" onPress={fn()} />
    </View>
  ),
};
/** 정답 띠 — 맞음(듣기 · 저장) / 아쉬움 */
export const FeedbackGood: Story = {
  decorators: [(Story) => <View style={{ flex: 1, justifyContent: 'flex-end' }}><Story /></View>],
  render: () => <FeedbackFoot ok title="Nice!" sub="자연스럽게 부탁했어요" say={SAVED} ko="창가 자리로 주실 수 있나요?" source={SRC} next="다음" onNext={fn()} />,
};
export const FeedbackBad: Story = {
  decorators: [(Story) => <View style={{ flex: 1, justifyContent: 'flex-end' }}><Story /></View>],
  render: () => <FeedbackFoot ok={false} title="Almost!" sub={`정답 · ${SAVED}`} say={SAVED} ko="창가 자리로 주실 수 있나요?" source={SRC} next="완료하기" onNext={fn()} />,
};
/** 큰 버튼 — 노랑 · 색 바꿈 + 아이콘 · 꺼짐 */
export const Buttons: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      <BigBtn label="완료하기" onPress={fn()} />
      <BigBtn label="눌러서 말하기" color={Colors.purple} textColor={Colors.white} icon={<Mic color={Colors.white} />} onPress={fn()} />
      <BigBtn label="다 골라야 해요" disabled onPress={fn()} />
    </View>
  ),
};
/** 점수 카드 — 만점(그림) · 일부 · 0점 + 안내 */
export const Scores: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      <ScoreCard kick="상황 퀴즈 · Lv.1" right={15} total={15} img />
      <ScoreCard kick="상황 퀴즈 · Lv.2" right={9} total={15} note="틀린 문제를 다시 볼까요?" />
      <ScoreCard kick="장면 롤플레이" right={0} total={4} note="처음엔 다 어려워요" />
    </View>
  ),
};
/** 결과 줄 — 맞음 · 틀림 · 머리 글씨 · 저장됨 */
export const Results: Story = {
  beforeEach: () => void saveExpression({ en: SAVED, ko: '창가 자리로 주실 수 있나요?', source: SRC }),
  render: () => (
    <View style={{ gap: 8 }}>
      <ResultRow ok en={SAVED} ko="창가 자리로 주실 수 있나요?" head="요청" source={SRC} />
      <ResultRow ok={false} en="How many bags are you checking?" ko="짐 몇 개 부치세요?" source={SRC} />
      <ResultRow ok en={LONG} ko="앞쪽 통로 자리가 있는지 확인해 주실 수 있나요?" source={SRC} />
    </View>
  ),
};
/** 듣기 · 저장 버튼 — 둥근 · 네모 · 저장됨(노랑) · 작은 글씨 · 그림자 판 */
export const SmallButtons: Story = {
  beforeEach: () => void saveExpression({ en: SAVED, ko: '창가 자리로 주실 수 있나요?', source: SRC }),
  render: () => (
    <View style={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <SpeakRound text={SAVED} />
        <SpeakRound text={SAVED} size={40} bg={Colors.yellow} />
        <SpeakSquare text={SAVED} />
        <SaveBtn en="Not saved." ko="저장 안 함" source={SRC} />
        <SaveBtn en={SAVED} ko="저장됨" source={SRC} />
        <SaveBtn en={SAVED} ko="저장됨" source={SRC} shape="square" />
      </View>
      <Kick>공항 체크인 · 미션 1/3</Kick>
      <Drop dy={4} radius={16}>
        <View style={{ padding: 16, borderRadius: 16, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white }}>
          <PText>Drop — 아래로 지는 잉크 그림자</PText>
        </View>
      </Drop>
      <PressDrop radius={16} onPress={fn()} inner={{ padding: 16, borderRadius: 16, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.sky }}>
        <PText>PressDrop — 누르면 그림자 자리로</PText>
      </PressDrop>
    </View>
  ),
};
/** 소리 끄기 — 듣기 버튼이 사라져요 (저장만) */
export const SoundOff: Story = {
  beforeEach: () => setNoListen(true),
  render: () => (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <SpeakRound text={SAVED} />
      <SpeakSquare text={SAVED} />
      <SaveBtn en={SAVED} ko="저장" source={SRC} />
    </View>
  ),
};
/** 이니셜 원 (직원 · 손님) */
export const Avatars: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <Avatar who="Staff" size={40} color={Colors.sky} />
      <Avatar who="Mina" size={32} color={Colors.rosePink} />
      <Avatar who="Agent" size={56} color={Colors.yellow} />
    </View>
  ),
};
/** 그만하기 시트 — [계속하기] · 그만하기 */
export const Quit: Story = { render: () => <QuitSheet open onStay={fn()} onQuit={fn()} /> };
