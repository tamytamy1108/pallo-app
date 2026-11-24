import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { leaveTrial } from '@/components/common/trial-guide';
import { ONB_LANGS } from '@/components/onboarding/app-parts';
import { TrialForm } from '@/components/onboarding/trial-form';
import { getMe, updateMe, type StudyLang } from '@/state/me';
import { getOnboarding } from '@/state/onboarding';
import { setLastTrial, type TrialDraft } from '@/state/trial-booking';

/**
 * 앱 안 체험 예약 (전체 화면) — 가입 때 '체험을 예약해요'와 같은 한 장 (TrialForm · 진행 바 없이 ‹ 는 닫기).
 * 들어오는 곳: 홈 비회원 카드 '체험 상담 신청' · 체험 권유 창 [상담 예약하기] · 마이 잠김 칸 · 체험 안내 시트(guardMember)
 * · 교재 소개 '이 레벨 상담 신청' · 마이 › 학습 언어 › 다른 언어 배우기 → openTrial({ lang }) 또는 /trial?lang=ja ('일본어' 도 돼요).
 * 이름 · 번호는 가입 때 적은 값으로 미리 채워요. 예약하면 내 체험 예약(me.trial)만 바꾸고 예약 확정 화면으로 — 닉네임 · 구독 · 역할은 그대로.
 */
export default function TrialScreen() {
  const params = useLocalSearchParams<{ lang?: string }>();
  const [draft, setDraft] = useState<TrialDraft>(() => {
    const onb = getOnboarding();
    const me = getMe();
    return {
      branch: me.trial?.branch ?? '',
      realName: onb.realName,
      phone: onb.phone,
      langs: [toLang(params.lang) ?? me.lang],
      why: [],
      trialDay: '',
      trialTime: '',
      note: '',
    };
  });

  return (
    <TrialForm
      mode="app"
      value={draft}
      onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
      onBack={leaveTrial}
      onSubmit={(b) => {
        setLastTrial(b);
        updateMe({ trial: { branch: b.branch, day: b.trialDay, time: b.trialTime, lang: b.langs[0] ?? 'en' } });
        router.replace('/trial/done');
      }}
    />
  );
}

/** 'ja' · '일본어' → 'ja' */
function toLang(v?: string): StudyLang | undefined {
  return ONB_LANGS.find((l) => l.key === v || l.ko === v)?.key;
}
