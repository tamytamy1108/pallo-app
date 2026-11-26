import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import NewMeet from '@/app/(app)/meet/new';

import { meetState } from '../../meet/_fixtures';

/**
 * 번개 열기 폼 (/meet/new) — 지역 · 제목 · 날짜(오늘부터 1주) · 시간 · 장소 · 상세 주소 · 정원 · 포스터.
 * 폼 값은 화면 안 useState 라 처음 상태만 보인다. 제목 · 장소가 비면 토스트로 막는데,
 * Storybook 바탕에 ToastHost 가 없어 그 안내는 보이지 않는다.
 */
const meta = {
  title: 'Pages/Meet/New',
  component: NewMeet,
  parameters: { route: { pathname: '/meet/new' } },
  beforeEach: meetState(),
} satisfies Meta<typeof NewMeet>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 처음 상태 (서울 · 3일 뒤 · 20:00 · 6명) */
export const Default: Story = {};
/** 작은 휴대폰 폭 — 달력 칸 · 칩 줄 확인 */
export const SmallPhone: Story = { globals: { viewport: { value: 'phone-sm', isRotated: false } } };
