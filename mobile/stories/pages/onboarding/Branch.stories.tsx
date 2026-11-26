import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, userEvent, within } from 'storybook/test';

import { mockBranchPublicGuide } from '@/api/onboarding';
import { branchPublicGuideQuery } from '@/api/queries';
import OnboardingBranch from '@/app/(onboarding)/onboarding/branch';

import { LOADING_FOREVER } from '../../_support/api';
import { withOnboarding, withToast } from '../../onboarding/_onb';

/** 앱 안에 있는 사진 (스토리북은 서버 사진 대신 이걸 주소로 써요) */
const PHOTOS: string[] = [require('@/assets/images/partners/cafe-room.webp'), require('@/assets/images/partners/cafe-poster.webp')];

const at = (code: string, name = code) => withOnboarding({ path: 'app', langs: ['en'], why: ['여행 가서 말하기'], branchCode: code, branch: name });
const guideOf = (code: string, patch: Partial<ReturnType<typeof mockBranchPublicGuide>> = {}) =>
  [[branchPublicGuideQuery(code).queryKey, { ...mockBranchPublicGuide(code), ...patch }]] as const;

/**
 * 가입 › 앱 구경 › 고른 지점 안내 (/onboarding/branch · 진행 바 없음) — 내용은 GET /branches/{code}/guide (가짜 API 'branchPublicGuide'),
 * 지점이 콘솔 설정 > 지점 > 지점 안내에 적은 사진 · 소개 · 문의 · 운영 시간과 열린 수업의 언어. 적지 않은 줄은 그리지 않아요.
 * '앱 둘러보기'가 POST /onboarding (APP) 뒤 가입을 끝내요 (가짜 API 'submitOnboarding' → 'completeOnboarding').
 */
const meta = {
  title: 'Pages/Onboarding/Branch',
  component: OnboardingBranch,
  parameters: { route: { pathname: '/onboarding/branch' } },
  beforeEach: at('하남점'),
} satisfies Meta<typeof OnboardingBranch>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 다 적은 지점 — 사진은 아직 없어서 빈 사진 칸 */
export const Default: Story = {};
/** 사진 여러 장 — 옆으로 넘겨요 (n / 전체 · 점) */
export const WithPhotos: Story = { parameters: { queries: guideOf('하남점', { photoPaths: PHOTOS }) } };
export const OnePhoto: Story = { parameters: { queries: guideOf('하남점', { photoPaths: PHOTOS.slice(0, 1) }) } };
/** 주소만 적은 지점 — 소개 · 운영 시간 · 전화 줄이 없어요 */
export const AddressOnly: Story = { beforeEach: at('김포점') };
/** 아무것도 없는 지점 — 열린 수업도 없으면 안내 칸이 통째로 빠져요 */
export const Nothing: Story = {
  beforeEach: at('김포점'),
  parameters: { queries: guideOf('김포점', { address: null, languages: [] }) },
};
/** 긴 지점 이름 · 긴 소개 글 */
export const LongText: Story = {
  beforeEach: at('하남점', '팝업 스튜디오 경기 남양주 다산신도시 현대프리미어캠퍼스점'),
  parameters: {
    queries: guideOf('하남점', {
      branchName: '팝업 스튜디오 경기 남양주 다산신도시 현대프리미어캠퍼스점',
      intro: '미사역 바로 앞, 통창 라운지가 있는 지점이에요.\n평일 저녁 스터디가 가장 많고, 스터디 끝나고 라운지에서 프리토킹을 이어 가는 분이 많아요. '.repeat(4),
    }),
  },
};
export const Loading: Story = { parameters: { api: { delayMs: LOADING_FOREVER } } };
/** 안내를 못 받음 — 다시 시도 · '앱 둘러보기'는 그대로 눌러요 */
export const LoadError: Story = { parameters: { api: { fail: ['branchPublicGuide'] } } };
/** 보내는 중 — 버튼이 '보내는 중…' 으로 바뀌고 막혀요 */
export const Submitting: Story = {
  parameters: { queries: guideOf('하남점'), api: { delayMs: LOADING_FOREVER } },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(await c.findByRole('button', { name: '앱 둘러보기' }));
    await expect(await c.findByRole('button', { name: '보내는 중…' })).toBeInTheDocument();
  },
};
/** 가입 보내기 실패 → 오류 토스트 */
export const SubmitError: Story = {
  decorators: [withToast],
  parameters: { api: { fail: ['submitOnboarding'] } },
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByRole('button', { name: '앱 둘러보기' }));
  },
};
/** 보내기는 됐는데 가입 끝내기 실패 → 오류 토스트 */
export const CompleteError: Story = {
  decorators: [withToast],
  parameters: { api: { fail: ['completeOnboarding'] } },
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByRole('button', { name: '앱 둘러보기' }));
  },
};
