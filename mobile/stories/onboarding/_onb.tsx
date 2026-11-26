import type { Decorator } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { mockTrialSlots } from '@/api/onboarding';
import { ToastHost } from '@/components/ui/toast';
import { resetOnboarding, updateOnboarding, type Onboarding } from '@/state/onboarding';
import type { TrialDraft } from '@/state/trial-booking';

/** 약관 화면을 지난 뒤 모습 — 카카오 값(가짜 서버 GET /onboarding prefill)이 채워져 있어요 */
const AFTER_TERMS: Partial<Onboarding> = { prefilled: true, nickname: '서현', realName: '김서현', phone: '010-1234-5678' };

/**
 * 가입(온보딩) 스토리 공통 도우미.
 * 온보딩 값은 모듈 안 스토어라 앞 스토리 값이 남아요 — 스토리마다 처음 값으로 되돌린 뒤 카카오 값 + 필요한 값만 채워요.
 */
export const withOnboarding = (patch: Partial<Onboarding> = {}) => () => {
  resetOnboarding();
  updateOnboarding({ ...AFTER_TERMS, ...patch });
};

/** 토스트를 보이게 (preview 에는 ToastHost 가 없어요 — 실패 토스트 · '전문 준비 중' 토스트를 보는 스토리용) */
export const withToast: Decorator = (Story) => (
  <View style={{ flex: 1 }}>
    <Story />
    <ToastHost />
  </View>
);

/** 가짜 시간표(api/onboarding)에서 그 지점의 첫 빈 상담 시간 — 날짜가 오늘 기준이라 스토리가 매번 계산해요 */
export function openSlot(branchCode: string) {
  const day = mockTrialSlots(branchCode).days.find((d) => d.times.length);
  return { trialDay: day?.date ?? '', trialTime: day?.times[0] ?? '' };
}

/** 칸을 다 채운 체험 예약 값 (하남점 · 영어 · 첫 빈 시간) */
export const FILLED_TRIAL: TrialDraft = {
  branchCode: '하남점',
  branch: '하남점',
  realName: '김서현',
  phone: '010-1234-5678',
  langs: ['en'],
  langLabel: '영어',
  why: ['여행 가서 말하기', '말하기 자신감'],
  ...openSlot('하남점'),
  note: '퇴근 후라 7시 이후가 좋아요',
};

/** 아무것도 안 채운 체험 예약 값 */
export const EMPTY_TRIAL: TrialDraft = { branchCode: '', branch: '', realName: '', phone: '', langs: [], langLabel: '', why: [], trialDay: '', trialTime: '', note: '' };
