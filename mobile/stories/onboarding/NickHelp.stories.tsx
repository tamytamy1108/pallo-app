import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { checkNickname, NickHelp, type NickStatus } from '@/components/onboarding/start-nickname';

import { padded } from '../_support/padded';

/** 글자 모양 확인 결과 (모양이 괜찮으면 중복 확인 결과를 대신 넣어요) */
const shape = (name: string): NickStatus => checkNickname(name) ?? { tone: 'ok', text: '쓸 수 있는 닉네임이에요' };
const count = (name: string) => [...name].length;

/** 닉네임 칸 아래 도움말 — 왼쪽 확인 결과(보라 ✓ · 빨간 ! · 회색 안내) · 오른쪽 글자 수 n/10 */
const meta = {
  title: 'Onboarding/NickHelp',
  component: NickHelp,
  args: { status: shape(''), count: 0 },
  decorators: [padded],
} satisfies Meta<typeof NickHelp>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 비었음 */
export const Empty: Story = {};
/** 한글 쓰는 중 (낱자) */
export const Composing: Story = { args: { status: shape('서ㅎ'), count: 2 } };
export const TooShort: Story = { args: { status: shape('서'), count: 1 } };
/** 11자 이상 (입력칸이 10자에서 막아서 화면에선 거의 안 보여요) */
export const TooLong: Story = { args: { status: shape('가나다라마바사아자차카'), count: 11 } };
export const InvalidChars: Story = { args: { status: shape('서현!'), count: 3 } };
export const Checking: Story = { args: { status: { tone: 'wait', text: '쓸 수 있는지 확인하는 중…' }, count: 4 } };
export const Taken: Story = { args: { status: { tone: 'error', text: '이미 쓰는 닉네임이에요' }, count: 3 } };
export const Available: Story = { args: { status: shape('서현'), count: 2 } };
export const MaxLength: Story = { args: { status: shape('가나다라마바사아자차'), count: 10 } };

/** 모든 경우 비교 */
export const AllStatuses: Story = {
  render: () => (
    <View style={{ gap: 4 }}>
      {['', '서ㅎ', '서', '서현!', '가나다라마바사아자차카', '서현'].map((n) => (
        <NickHelp key={n} status={shape(n)} count={count(n)} />
      ))}
      <NickHelp status={{ tone: 'wait', text: '쓸 수 있는지 확인하는 중…' }} count={4} />
      <NickHelp status={{ tone: 'error', text: '이미 쓰는 닉네임이에요' }} count={3} />
    </View>
  ),
};
