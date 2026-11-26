import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { userEvent, within } from 'storybook/test';

import NicknameScreen from '@/app/(onboarding)/onboarding/nickname';

import { withOnboarding } from '../../onboarding/_onb';

/** 닉네임 칸을 비우고 새로 써요 */
const typeName = (text: string) => async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const input = await within(canvasElement).findByLabelText('닉네임', { selector: 'input' });
  await userEvent.clear(input);
  if (text) await userEvent.type(input, text);
};

/**
 * 가입 1단계 · 닉네임 (/onboarding/nickname) — 카카오 이름을 미리 채우고(규칙에 안 맞으면 빈칸),
 * 2~10자 한글 · 영문 · 숫자 (서버와 같은 규칙). 같은 닉네임은 여럿이 써도 돼서 중복 확인은 없어요.
 * 카카오 이름은 약관 화면이 GET /onboarding prefill 로 채워 둬요 — 스토리는 그 값을 직접 넣어요.
 */
const meta = {
  title: 'Pages/Onboarding/Nickname',
  component: NicknameScreen,
  parameters: { route: { pathname: '/onboarding/nickname' } },
  beforeEach: withOnboarding({ nickname: '서현' }),
} satisfies Meta<typeof NicknameScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 카카오 이름 '서현' 을 채움 — 쓸 수 있음 · 다음 켜짐 */
export const Default: Story = {};
/** 앱 구경 길로 돌아왔을 때 — 1/5 */
export const AppPath: Story = { beforeEach: withOnboarding({ nickname: '서현', path: 'app' }) };
/** 카카오 이름이 규칙에 안 맞아 빈칸으로 시작 */
export const KakaoNameInvalid: Story = { beforeEach: withOnboarding({ nickname: 'Seo Hyun!' }) };
/** 다른 사람이 쓰는 닉네임도 그대로 쓸 수 있어요 */
export const SameAsOthers: Story = { beforeEach: withOnboarding({ nickname: '팔로로' }) };
/** 긴 이름 (10자) — 무대에 두 줄 */
export const MaxLength: Story = { beforeEach: withOnboarding({ nickname: '가나다라마바사아자차' }) };
/** 한 글자 — 2자 이상 안내 */
export const TooShort: Story = { play: typeName('서') };
/** 기호를 씀 */
export const InvalidChars: Story = { play: typeName('ab!') };
/** 비움 */
export const Cleared: Story = { play: typeName('') };
/** 새 이름 — 바로 쓸 수 있음 */
export const TypedNew: Story = { play: typeName('pallo22') };
