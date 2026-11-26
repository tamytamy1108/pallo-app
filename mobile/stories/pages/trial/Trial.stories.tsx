import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import TrialScreen from '@/app/(app)/trial/index';
import { updateMe } from '@/state/me';

import { freshDevice } from '../../_support/fresh-device';
import { withToast } from '../../onboarding/_onb';

const at = (params: Record<string, string> = {}) => ({ route: { pathname: '/trial', params } });

/**
 * 앱 안 체험 예약 (/trial · /trial?lang=ja) — 가입 때 '체험을 예약해요'와 같은 한 장. 이름 · 번호는 가입 때 값으로 미리 채워요.
 * 희망 언어는 주소의 lang(키 · 한글 이름) → 없으면 내 학습 언어. 이미 체험을 예약했으면 그 지점이 골라져 있어요.
 */
const meta = {
  title: 'Pages/Trial/Booking',
  component: TrialScreen,
  parameters: at(),
  globals: { userKind: 'guest' },
  decorators: [withToast],
  beforeEach: freshDevice(() => updateMe({ lang: 'en' })),
} satisfies Meta<typeof TrialScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 처음 — 희망 언어 = 내 학습 언어(영어) */
export const Default: Story = {};
/** ?lang=ja — 일본어가 골라져 있어요 */
export const LangParam: Story = { parameters: at({ lang: 'ja' }) };
/** ?lang=스페인어 — 한글 이름도 돼요 */
export const LangKoreanName: Story = { parameters: at({ lang: '스페인어' }) };
/** 모르는 lang → 내 학습 언어 (중국어) */
export const UnknownLang: Story = { parameters: at({ lang: 'fr' }), beforeEach: () => void updateMe({ lang: 'zh' }) };
/** 이미 체험을 예약한 사람 — 그 지점이 골라져 있어요 */
export const AlreadyBooked: Story = { globals: { userKind: 'trial' } };
