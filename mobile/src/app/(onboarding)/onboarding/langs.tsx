import { router } from 'expo-router';

import { LangList, LangRow } from '@/components/onboarding/app-langs';
import { ONB_LANGS } from '@/components/onboarding/app-parts';
import { NextButton, OnbScreen, useRequired } from '@/components/onboarding/parts';
import { stepsFor, updateOnboarding, useOnboarding } from '@/state/onboarding';

/**
 * 가입 › 앱 구경 › 희망 언어 (4/6) — 프로토타입 #dest-lang, docs/pages/09-onboarding.md 가입 단계 표 '희망 언어 (앱으로만)'.
 * 여러 개 고를 수 있어요. 고른 언어마다 오늘의 목표 · 레슨이 나와요. 실력은 묻지 않고 첫 AI 대화에서 맞춰요.
 */
export default function OnboardingLangs() {
  const langs = useOnboarding((s) => s.langs);
  const toggle = (key: (typeof ONB_LANGS)[number]['key']) =>
    // 고른 순서를 지켜요 (맨 앞 언어가 홈의 첫 언어)
    updateOnboarding({ langs: langs.includes(key) ? langs.filter((l) => l !== key) : [...langs, key] });
  // '다음'은 늘 켜 두고, 하나도 안 골랐으면 격자가 흔들리며 안내해요
  const form = useRequired([{ name: 'langs', ok: langs.length > 0, message: '궁금한 언어를 하나 이상 골라 주세요' }]);

  return (
    <OnbScreen
      step={4}
      total={stepsFor('app')}
      title={'어떤 언어가\n궁금해요?'}
      desc="여러 개 골라도 돼요. 나중에 바꿀 수 있어요."
      form={form}
      footer={
        <NextButton
          onPress={() =>
            form.submit(() => {
              updateOnboarding({ path: 'app' });
              router.push('/onboarding/why');
            })
          }
          ready={form.ready}
        />
      }>
      <LangList label="궁금한 언어" name="langs">
        {ONB_LANGS.map((l) => (
          <LangRow key={l.key} lang={l} on={langs.includes(l.key)} onPress={() => toggle(l.key)} />
        ))}
      </LangList>
    </OnbScreen>
  );
}
