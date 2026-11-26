import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { useCreateTrialApplication } from '@/api/use-onboarding';
import { leaveTrial } from '@/components/common/trial-guide';
import { ONB_LANGS } from '@/components/onboarding/app-parts';
import { TrialForm } from '@/components/onboarding/trial-form';
import { getMe } from '@/state/me';
import { getOnboarding } from '@/state/onboarding';
import { setLastTrial, type TrialDraft } from '@/state/trial-booking';

/**
 * 앱 안 체험 예약 (전체 화면) — 가입 때 '체험을 예약해요'와 같은 한 장 (TrialForm · 진행 바 없이 ‹ 는 닫기).
 * 들어오는 곳: 홈 비회원 카드 '체험 상담 신청' · 체험 권유 창 [상담 예약하기] · 마이 잠김 칸 · 체험 안내 시트(guardMember)
 * · 교재 소개 '이 레벨 상담 신청' · 마이 › 학습 언어 › 다른 언어 배우기 → openTrial({ lang }) 또는 /trial?lang=ja ('일본어' 도 돼요).
 * 이름 · 번호는 가입 때 적은 값으로 미리 채워요. 예약하면 POST /trial-applications → 예약 확정 화면으로 — 닉네임 · 구독 · 역할은 그대로.
 * 실패하면 토스트만 띄우고 이 화면에 남아요.
 */
export default function TrialScreen() {
  const params = useLocalSearchParams<{ lang?: string }>();
  const create = useCreateTrialApplication();
  const [draft, setDraft] = useState<TrialDraft>(() => {
    const onb = getOnboarding();
    const me = getMe();
    return {
      // 지점 code 는 아직 내 정보에 없어요 — 고른 적 있는 지점(가입 때 값)만 미리 채워요
      branchCode: onb.branchCode,
      branch: onb.branchCode ? onb.branch : '',
      realName: onb.realName,
      phone: onb.phone,
      // ?lang= 이 서버 언어 code 와 다를 수 있어요 — 폼이 목록에 없는 code 면 첫 언어로 바꿔 보여 줘요
      langs: [toLang(params.lang) ?? me.lang],
      langLabel: '',
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
      busy={create.isPending}
      onSubmit={(b) => {
        create.mutate(
          {
            body: { branchCode: b.branchCode, realName: b.realName, phone: b.phone, languageCode: b.langs[0] ?? '', date: b.trialDay, time: b.trialTime, reasons: b.why, note: b.note.trim() || null },
            names: { branchName: b.branch, languageLabel: b.langLabel },
          },
          {
            onSuccess: () => {
              setLastTrial(b);
              router.replace('/trial/done');
            },
          },
        );
      }}
    />
  );
}

/** 'ja' · '일본어' → 'ja' */
function toLang(v?: string): string | undefined {
  return ONB_LANGS.find((l) => l.key === v || l.ko === v)?.key ?? v;
}
