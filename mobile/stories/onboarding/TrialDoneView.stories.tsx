import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';

import { BODY_SRC } from '@/components/onboarding/start-palloro';
import { TrialDoneView } from '@/components/onboarding/trial-done-view';

import { EMPTY_TRIAL, FILLED_TRIAL, withOnboarding } from './_onb';

/**
 * 체험 예약 확정 '첫 무대 입장권' — 무대 판 · 입장권 · 연락 안내 · 버튼 하나.
 * 가입(앱 둘러보기)과 앱 안 예약(확인)이 같이 써요. 무대 팔로로는 온보딩 몸 색 · 앱 안에서는 hero.
 */
const meta = {
  title: 'Onboarding/TrialDoneView',
  component: TrialDoneView,
  args: { booking: FILLED_TRIAL, button: '앱 둘러보기', onDone: fn() },
  beforeEach: withOnboarding(),
} satisfies Meta<typeof TrialDoneView>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 가입 중 예약 — 전달 사항 포함 */
export const Onboarding: Story = {};
/** 앱 안 예약 — 버튼 '확인' · 꾸민 몸 색 */
export const InApp: Story = { args: { button: '확인', hero: BODY_SRC.green } };
/** 전달 사항 없음 */
export const NoNote: Story = { args: { booking: { ...FILLED_TRIAL, note: '' } } };
/** 다른 언어 · 몸 색 */
export const SpanishPinkBody: Story = { args: { booking: { ...FILLED_TRIAL, langs: ['es'], langLabel: '스페인어' } }, beforeEach: withOnboarding({ color: 'pink' }) };
/** 값이 거의 없음 (주소로 바로 들어온 경우 등) — 날짜 · 시간 '미정', 지점 · 예약자 '—' */
export const Minimal: Story = { args: { booking: EMPTY_TRIAL } };
/** 작은 폰 — 스크롤 */
export const SmallPhone: Story = { globals: { viewport: { value: 'phone-sm', isRotated: false } } };
