import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { TrialSheet, type TrialStart } from '@/components/common/trial-sheet';
import { TRIAL_LANG_BY_CODE, TRIAL_LANGS, TRIAL_LEVELS, type TrialLang, type TrialLevel } from '@/data/trial';

/**
 * 체험 신청 (3단계 + 완료) — 보던 화면 위에 시트로 떠요 (프로토타입 trialStep 은 라운지 시트).
 * 들어오는 곳: 교재 소개 '이 레벨 상담 신청' · 마이 › 학습 언어 › 다른 언어 배우기 → /trial?lang=ja (en · ja · zh · es 또는 '일본어')
 * 화면 이동 없이 열려면 openTrial({ lang }) (components/common/trial-guide) 을 써도 돼요.
 */
export default function TrialScreen() {
  const params = useLocalSearchParams<{ lang?: string; level?: string }>();
  const [start] = useState<TrialStart>(() => ({ lang: toLang(params.lang), level: toLevel(params.level) }));
  const [open, setOpen] = useState(true);
  return (
    <>
      <Stack.Screen options={{ presentation: 'transparentModal', animation: 'none', contentStyle: { backgroundColor: 'transparent' } }} />
      <TrialSheet open={open} start={start} onClose={() => setOpen(false)} onClosed={leave} />
    </>
  );
}

const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));

function toLang(v?: string): TrialLang | undefined {
  if (!v) return undefined;
  if (v in TRIAL_LANG_BY_CODE) return TRIAL_LANG_BY_CODE[v as keyof typeof TRIAL_LANG_BY_CODE];
  return TRIAL_LANGS.find((l) => l === v);
}

const toLevel = (v?: string): TrialLevel | undefined => TRIAL_LEVELS.find((l) => l === v);
