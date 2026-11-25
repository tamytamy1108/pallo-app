import { router } from 'expo-router';

import { CardGrid, ReasonCard, WHY_REASONS } from '@/components/onboarding/app-parts';
import { NextButton, OnbScreen } from '@/components/onboarding/parts';
import { stepsFor, updateOnboarding, useOnboarding } from '@/state/onboarding';

/**
 * 가입 › 앱으로만 › 배우고 싶은 이유 (5/6) — 프로토타입 #a-why, docs/pages/09-onboarding.md 가입 단계 표 '배우고 싶은 이유'.
 * 여러 개 고르고 '다음' → 나에게 가장 가까운 지점 (near) → 지점 안내 → '앱 둘러보기' → 홈. 고른 이유로 첫 주제를 골라 줘요.
 * 안 골라도 넘어갈 수 있어요: 프로토타입 버튼이 늘 켜져 있고, 체험 길에서도 이유는 '선택'이에요. 마이에서 나중에 바꿀 수 있어요.
 */
export default function OnboardingWhy() {
  const why = useOnboarding((s) => s.why);
  const toggle = (r: string) => updateOnboarding({ why: why.includes(r) ? why.filter((w) => w !== r) : [...why, r] });

  return (
    <OnbScreen
      step={5}
      total={stepsFor('app')}
      title={'왜 배우고\n싶어요?'}
      desc="여러 개 골라도 돼요. 이유에 맞춰 첫 주제를 골라 드려요."
      footer={
        <NextButton
          onPress={() => {
            updateOnboarding({ path: 'app' });
            router.push('/onboarding/near');
          }}
        />
      }>
      <CardGrid label="배우고 싶은 이유">
        {WHY_REASONS.map((r) => (
          <ReasonCard key={r} label={r} on={why.includes(r)} onPress={() => toggle(r)} />
        ))}
      </CardGrid>
    </OnbScreen>
  );
}
