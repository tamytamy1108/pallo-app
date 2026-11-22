import { useEffect, useState } from 'react';

import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { getMe } from '@/state/me';

let openGuide: (() => void) | null = null;

/**
 * 비회원 막힘: 회원만 할 수 있는 행동을 감싸요. 비회원이면 '체험 안내 시트'를 띄우고, 회원이면 그대로 실행.
 * 예) onPress={() => guardMember(() => setJoinOpen(true))}
 * 담당: 공통 부품 — 시트 내용 · 체험 신청(/trial) 연결을 채워요 (docs/pages/08-common.md '체험 안내 시트').
 */
export function guardMember(run: () => void) {
  if (getMe().role === 'guest') openGuide?.();
  else run();
}

/** 맨 바깥(_layout)에 한 번만 있어요 */
export function TrialGuideHost() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    openGuide = () => setOpen(true);
    return () => {
      openGuide = null;
    };
  }, []);
  return (
    <Sheet open={open} onClose={() => setOpen(false)} title="회원만 할 수 있어요">
      <PText>체험 수업을 신청해 보세요.</PText>
    </Sheet>
  );
}
