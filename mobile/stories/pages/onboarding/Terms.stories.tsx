import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, userEvent, within } from 'storybook/test';

import { onboardingInfoQuery } from '@/api/queries';
import TermsScreen from '@/app/(onboarding)/onboarding/terms';

import { LOADING_FOREVER } from '../../_support/api';
import { withOnboarding } from '../../onboarding/_onb';

/** 가짜 서버 약관 버전 id (api/onboarding MOCK_CONSENTS) */
const AGE = 'mock-consent-age_14';
const TERMS = 'mock-consent-terms';
const PRIVACY = 'mock-consent-privacy';
const MARKETING = 'mock-consent-marketing';
const answers = (on: string[]) => [AGE, TERMS, PRIVACY, MARKETING].map((versionId) => ({ versionId, agreed: on.includes(versionId) }));

/** 약관 동의 시트 (/onboarding/terms) — 약관은 GET /onboarding (가짜 서버 4개). 필수를 다 켜야 '동의하고 시작하기'가 켜져요 */
const meta = {
  title: 'Pages/Onboarding/Terms',
  component: TermsScreen,
  parameters: { route: { pathname: '/onboarding/terms' } },
  beforeEach: withOnboarding(),
} satisfies Meta<typeof TermsScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 아무것도 안 켬 — 버튼 꺼짐 */
export const Default: Story = {};
/** 필수 일부만 — 버튼 꺼짐 */
export const SomeRequired: Story = { beforeEach: withOnboarding({ consents: answers([AGE, TERMS]) }) };
/** 선택만 켬 — 버튼 꺼짐 */
export const OptionalOnly: Story = { beforeEach: withOnboarding({ consents: answers([MARKETING]) }) };
/** 필수 셋 다 — 버튼 켜짐 (전체 동의는 아님) */
export const RequiredAgreed: Story = { beforeEach: withOnboarding({ consents: answers([AGE, TERMS, PRIVACY]) }) };
/** 전부 — 전체 동의 줄도 라벤더 */
export const AllAgreed: Story = { beforeEach: withOnboarding({ consents: answers([AGE, TERMS, PRIVACY, MARKETING]) }) };
/** '전체 동의하기'를 누름 */
export const TapAgreeAll: Story = {
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(await c.findByRole('checkbox', { name: '전체 동의하기' }));
    await expect(c.getByRole('button', { name: '동의하고 시작하기' })).not.toHaveAttribute('aria-disabled', 'true');
  },
};
/** 약관 › 를 누름 → 전문 시트 (서버 body) */
export const OpenDocument: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByRole('button', { name: '서비스 이용약관 전문 보기' }));
  },
};
/** 서버 약관이 다섯 개 · 긴 제목 · 전문 없는 필수 약관 */
export const ServerDocs: Story = {
  parameters: {
    queries: [
      [
        onboardingInfoQuery().queryKey,
        {
          needsOnboarding: true,
          prefill: { nickname: null, realName: null, phone: null },
          nickname: { min: 2, max: 10 },
          languages: [],
          reasons: [],
          consents: [
            { versionId: 'v1', code: 'AGE_14', title: '만 14세 이상이에요', body: '', required: true, version: 1, effectiveFrom: '2026-01-01', sortOrder: 1 },
            { versionId: 'v2', code: 'TERMS', title: '서비스 이용약관', body: '제1조 (목적)\n이 약관은 …', required: true, version: 3, effectiveFrom: '2026-01-01', sortOrder: 2 },
            { versionId: 'v3', code: 'PRIVACY', title: '개인정보 수집 · 이용 (필수 항목: 이름 · 휴대폰 번호 · 카카오 식별자)', body: '수집 항목 …', required: true, version: 2, effectiveFrom: '2026-01-01', sortOrder: 3 },
            { versionId: 'v4', code: 'THIRD', title: '지점에 정보 제공', body: '제공받는 자 …', required: false, version: 1, effectiveFrom: '2026-01-01', sortOrder: 4 },
            { versionId: 'v5', code: 'MARKETING', title: '이벤트 · 번개 소식 받기', body: '…', required: false, version: 1, effectiveFrom: '2026-01-01', sortOrder: 5 },
          ],
        },
      ],
    ],
  },
};
export const Loading: Story = { parameters: { api: { delayMs: LOADING_FOREVER } } };
export const Error: Story = { parameters: { api: { fail: ['onboardingInfo'] } } };
