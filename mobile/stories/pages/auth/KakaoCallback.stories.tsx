import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import KakaoCallbackScreen from '@/app/(auth)/auth/kakao/callback';

import { LOADING_FOREVER } from '../../_support/api';

/**
 * 카카오 웹 로그인 콜백 (/auth/kakao/callback?code=&state=) — 처리 중이면 불러오는 중, 실패면 문구 + '처음으로'.
 * 성공하면 로그인 상태가 화면을 바꿔요 (스토리에는 로그인 상태가 없어서 처리 중은 응답을 늦춰 고정해요).
 */
const meta = {
  title: 'Pages/Auth/KakaoCallback',
  component: KakaoCallbackScreen,
  parameters: { route: { pathname: '/auth/kakao/callback', params: { code: 'mock-code' } }, api: { delayMs: LOADING_FOREVER } },
} satisfies Meta<typeof KakaoCallbackScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 인가 코드로 로그인하는 중 */
export const Processing: Story = {};
/** 지점 QR 유입 (state=지점코드,마케팅id) — 모양은 같아요 */
export const WithReferral: Story = { parameters: { route: { pathname: '/auth/kakao/callback', params: { code: 'mock-code', state: 'HANAM,12' } } } };
/** 코드 없이 들어옴 */
export const NoCode: Story = { parameters: { route: { pathname: '/auth/kakao/callback' } } };
/** 사용자가 카카오 로그인을 취소 */
export const Cancelled: Story = { parameters: { route: { pathname: '/auth/kakao/callback', params: { error: 'access_denied' } } } };
/** 카카오가 다른 오류로 돌려보냄 (설명 그대로) */
export const KakaoError: Story = {
  parameters: { route: { pathname: '/auth/kakao/callback', params: { error: 'invalid_request', error_description: '잘못된 요청이에요 (redirect_uri 불일치)' } } },
};
/** 서버 로그인 실패 */
export const ServerError: Story = { parameters: { api: { delayMs: 0, fail: ['login'] } } };
