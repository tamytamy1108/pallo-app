import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';

export type ReportTarget = { kind: 'post' | 'comment' | 'story' | 'member' | 'meet' | 'club' | 'challenge' | 'event'; name: string };

/**
 * 신고 · 차단 시트 (docs/pages/08-common.md '신고 · 차단').
 * 담당: 공통 부품 — 사유 고르기 · 차단 확인 · 토스트까지 프로토타입대로 채워요. props 는 바꾸지 않아요(늘리기만).
 */
export function ReportSheet({ open, onClose, target, onBlocked }: { open: boolean; onClose: () => void; target: ReportTarget; onBlocked?: () => void }) {
  void onBlocked;
  return (
    <Sheet open={open} onClose={onClose} title="신고 · 차단">
      <PText>{target.name}</PText>
    </Sheet>
  );
}
