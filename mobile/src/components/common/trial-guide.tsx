import { useEffect, useState } from 'react';

import { TrialSheet, type TrialStart } from '@/components/common/trial-sheet';
import { getMe } from '@/state/me';

let openSheet: ((start: TrialStart) => void) | null = null;

/**
 * 비회원 막힘 (프로토타입 lgGate(이유)): 회원만 할 수 있는 행동을 감싸요. 비회원이면 '체험 안내 시트'를 띄우고, 회원이면 그대로 실행.
 * 좋아요는 막지 않아요 (v291). why 는 시트 노란 카드 첫 줄 — 예) '댓글을 달려면' · '번개에 참여하려면' · '글을 올리려면'.
 * 예) onPress={() => guardMember(() => setJoinOpen(true), '번개에 참여하려면')}
 * @returns 실행했으면 true, 막혔으면 false
 */
export function guardMember(run: () => void, why = '함께하려면') {
  if (getMe().role === 'guest') {
    openSheet?.({ why });
    return false;
  }
  run();
  return true;
}

/**
 * 체험 신청 시트를 바로 열기 (안내 없이 1단계부터) — 교재 소개 '이 레벨 상담 신청' · 마이 › 다른 언어 배우기.
 * 예) openTrial({ lang: '일본어' }) — 언어가 미리 골라져요. 지금 보던 화면 위에 시트로 떠요 (프로토타입처럼).
 */
export function openTrial(start: Omit<TrialStart, 'why'> = {}) {
  openSheet?.({ lang: start.lang, level: start.level });
}

/** 맨 바깥(_layout)에 한 번만 있어요 */
export function TrialGuideHost() {
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState<TrialStart>({});
  useEffect(() => {
    openSheet = (s) => {
      setStart(s);
      setOpen(true);
    };
    return () => {
      openSheet = null;
    };
  }, []);
  return <TrialSheet open={open} start={start} onClose={() => setOpen(false)} />;
}
