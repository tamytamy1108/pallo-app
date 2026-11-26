import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { Chip, Chips, Field, FieldLabel, OnbInput, PickField } from '@/components/onboarding/parts';

import { padded } from '../_support/padded';

/**
 * 가입 양식 칸 부품 (parts.tsx) — 칸 이름 · 글 입력 · 눌러서 고르는 칸 · 알약 · 칸(Field) 의 빨간 안내.
 * 칸이 빨간 테두리가 되는 건 Field 에 안내(error · 빠진 칸)가 있을 때예요.
 */
const meta = {
  title: 'Onboarding/FormParts',
  component: Field,
  args: { children: null },
  decorators: [padded],
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Labels: Story = {
  render: () => (
    <View>
      <FieldLabel>전달 사항</FieldLabel>
      <FieldLabel required>지점</FieldLabel>
      <FieldLabel hint="선택 · 지점에 전할 말">전달 사항</FieldLabel>
      <FieldLabel required hint="여러 개">희망 언어</FieldLabel>
    </View>
  ),
};

export const InputEmpty: Story = {
  render: () => (
    <Field>
      <FieldLabel required>이름</FieldLabel>
      <OnbInput placeholder="이름" accessibilityLabel="이름" />
    </Field>
  ),
};
export const InputFilled: Story = {
  render: () => (
    <Field>
      <FieldLabel required>이름</FieldLabel>
      <OnbInput value="김서현" accessibilityLabel="이름" />
    </Field>
  ),
};
/** 틀린 값 — 빨간 테두리 + 아래 안내 */
export const InputInvalid: Story = {
  render: () => (
    <Field error="휴대폰 번호를 다시 확인해 주세요">
      <FieldLabel required>휴대폰 번호</FieldLabel>
      <OnbInput value="010-12" accessibilityLabel="휴대폰 번호" />
    </Field>
  ),
};
/** quiet — 빨간 테두리만, 안내 줄은 화면이 따로 */
export const InputInvalidQuiet: Story = {
  render: () => (
    <Field error="안 보이는 안내" quiet>
      <OnbInput value="ab!" accessibilityLabel="닉네임" />
    </Field>
  ),
};
/** 길게 쓰는 칸 — 쓰는 만큼 늘어나요 */
export const InputMultiline: Story = {
  render: () => (
    <Field>
      <FieldLabel hint="선택 · 지점에 전할 말">전달 사항</FieldLabel>
      <OnbInput multiline value={'퇴근 후라 7시 이후가 좋아요.\n발음 위주로 상담받고 싶어요.\n주차가 되는지도 알려 주세요.'} accessibilityLabel="전달 사항" />
    </Field>
  ),
};

export const PickEmpty: Story = {
  render: () => (
    <Field>
      <FieldLabel required>지점</FieldLabel>
      <PickField value="" placeholder="지점 선택하기" onPress={fn()} />
    </Field>
  ),
};
/** 고른 값 — 라벤더 · 보라 테두리 */
export const PickChosen: Story = {
  render: () => (
    <Field>
      <FieldLabel required>지점</FieldLabel>
      <PickField value="하남점" placeholder="지점 선택하기" onPress={fn()} />
    </Field>
  ),
};
export const PickInvalid: Story = {
  render: () => (
    <Field error="지점을 골라 주세요">
      <FieldLabel required>지점</FieldLabel>
      <PickField value="" placeholder="지점 선택하기" onPress={fn()} />
    </Field>
  ),
};

/** 알약 — 꺼짐 · 켜짐 · 못 고름(취소선) */
export const ChipStates: Story = {
  render: () => (
    <Chips>
      <Chip label="영어" on={false} onPress={fn()} />
      <Chip label="일본어" on onPress={fn()} />
      <Chip label="중국어" on={false} disabled onPress={fn()} />
    </Chips>
  ),
};

function ChipsDemo() {
  const [on, setOn] = useState<string[]>(['새 취미']);
  const list = ['여행 가서 말하기', '일 · 이직', '유학 · 워홀 · 이민', '시험 · 자격증', '외국인 친구', '새 취미', '말하기 자신감', '기타'];
  return (
    <Chips>
      {list.map((l) => (
        <Chip key={l} label={l} on={on.includes(l)} onPress={() => setOn((p) => (p.includes(l) ? p.filter((x) => x !== l) : [...p, l]))} />
      ))}
    </Chips>
  );
}
/** 눌러서 켜고 꺼 보기 (여러 줄로 감김) */
export const ChipsInteractive: Story = { render: () => <ChipsDemo /> };
