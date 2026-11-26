import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { userEvent, within } from 'storybook/test';

import PhoneLoginScreen from '@/app/(auth)/login/phone';
import { ToastHost } from '@/components/ui/toast';

/** 번호를 넣고 [인증번호 받기] — 가짜 API 'phoneCode' 가 3분을 돌려줘요 */
async function sendCode(canvasElement: HTMLElement) {
  const c = within(canvasElement);
  await userEvent.type(await c.findByLabelText('휴대폰 번호'), '01012345678');
  await userEvent.click(c.getByRole('button', { name: '인증번호 받기' }));
  return c;
}

/**
 * 휴대폰 번호로 시작하기 (/login/phone) — 번호 → [인증번호 받기] → 6자리 · 3분 타이머 → [확인].
 * 입력 단계는 화면 안 상태라 play 로 진행해요. 토스트를 보려고 ToastHost 를 같이 그려요.
 */
const meta = {
  title: 'Pages/Auth/PhoneLogin',
  component: PhoneLoginScreen,
  parameters: { route: { pathname: '/login/phone' } },
  render: () => (
    <>
      <PhoneLoginScreen />
      <ToastHost />
    </>
  ),
} satisfies Meta<typeof PhoneLoginScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 처음 — 번호가 비어 [인증번호 받기] 꺼짐 */
export const Default: Story = {};
/** 번호를 적음 — [인증번호 받기] 켜짐 */
export const PhoneTyped: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.type(await within(canvasElement).findByLabelText('휴대폰 번호'), '010-1234-5678');
  },
};
/** 인증번호 보냄 — 타이머 · 6자리 칸 · [확인] 꺼짐 */
export const CodeSent: Story = { play: async ({ canvasElement }) => void (await sendCode(canvasElement)) };
/** 6자리를 다 넣음 — [확인] 켜짐 */
export const CodeTyped: Story = {
  play: async ({ canvasElement }) => {
    const c = await sendCode(canvasElement);
    await userEvent.type(await c.findByLabelText('인증번호'), '123456');
  },
};
/** 인증번호 보내기 실패 — 오류 토스트 */
export const SendError: Story = {
  parameters: { api: { fail: ['phoneCode'] } },
  play: async ({ canvasElement }) => void (await sendCode(canvasElement)),
};
