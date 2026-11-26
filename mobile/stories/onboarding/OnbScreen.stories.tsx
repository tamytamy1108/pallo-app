import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { Field, FieldLabel, NextButton, OnbInput, OnbScreen, useRequired } from '@/components/onboarding/parts';
import { PText } from '@/components/ui/text';

/** 꼭 채울 칸 하나가 빈 양식 — '다음'을 누르면 칸이 흔들리고 빨간 안내가 떠요 */
function RequiredDemo() {
  const form = useRequired([{ name: 'name', ok: false, message: '이름을 적어 주세요' }]);
  return (
    <OnbScreen step={1} total={4} title={'이름을\n알려 주세요'} form={form} footer={<NextButton onPress={() => form.submit(() => {})} ready={form.ready} />}>
      <Field name="name">
        <FieldLabel required>이름</FieldLabel>
        <OnbInput placeholder="이름" accessibilityLabel="이름" />
      </Field>
    </OnbScreen>
  );
}

const Body = () => <PText>여기에 단계 내용이 와요.</PText>;

/**
 * 가입 단계 공통 틀 — 위 진행 바(n/N) · 제목(줄마다 올라옴) · 설명 · 내용 · 아래 고정 버튼.
 * 진행 바는 step · total 이 있을 때만 (약관 · 예약 확정에는 없어요).
 */
const meta = {
  title: 'Onboarding/OnbScreen',
  component: OnbScreen,
  args: {
    step: 2,
    total: 4,
    title: '두 줄 제목이\n여기에 와요',
    desc: '설명 한 줄이 제목 아래에 와요.',
    children: <Body />,
    footer: <NextButton onPress={fn()} />,
  },
} satisfies Meta<typeof OnbScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const FirstStep: Story = { args: { step: 1 } };
export const LastStep: Story = { args: { step: 4 } };
/** 앱 구경 길 — 칸이 5개 */
export const AppPathLastStep: Story = { args: { step: 5, total: 5 } };
/** 진행 바 없음 (약관 · 확인 중 · 예약 확정) */
export const NoProgress: Story = { args: { step: undefined, total: undefined } };
export const TitleOnly: Story = { args: { desc: undefined } };
export const NoFooter: Story = { args: { footer: undefined } };
export const NoScroll: Story = { args: { scroll: false } };
/** 내용이 길어 스크롤 */
export const LongContent: Story = {
  args: {
    children: Array.from({ length: 24 }, (_, i) => <PText key={i}>{`${i + 1}번째 줄 내용이에요`}</PText>),
  },
};
/** 꼭 채울 칸이 빈 채 '다음' → 칸 흔들림 · 빨간 테두리 · 안내 한 줄 */
export const RequiredMissing: Story = {
  render: () => <RequiredDemo />,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(await c.findByRole('button', { name: '다음' }));
    await expect(await c.findByText('이름을 적어 주세요')).toBeInTheDocument();
  },
};
