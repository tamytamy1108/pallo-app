import { useState } from 'react';
import { View } from 'react-native';

import { SheetButton, SheetDesc, SheetNote, SheetOptions } from '@/components/common/sheet-parts';
import { Sheet } from '@/components/ui/sheet';
import { TextField } from '@/components/ui/field';

import { REJECT_REASONS, type RejectCode } from '../join-rules';

/**
 * 번개 참여 신청 거절 (호스트). 사유를 꼭 골라요 — 신청자에게는 정해진 문구만 보이고,
 * '기타'에 적은 말은 운영진만 봐요 (app-hub 호스트 거절 현황). 맞는 API: POST /hangouts/{id}/join-requests/{participantId}/reject
 */
export function RejectSheet({ name, onClose, onReject }: { name: string | null; onClose: () => void; onReject: (phrase: string, code: RejectCode, text: string) => void }) {
  const [code, setCode] = useState<RejectCode | null>(null);
  const [text, setText] = useState('');
  const ready = code != null && (code !== 'OTHER' || text.trim().length > 0);
  const reason = REJECT_REASONS.find((r) => r.key === code);
  return (
    <Sheet
      open={!!name}
      onClose={onClose}
      onClosed={() => {
        setCode(null);
        setText('');
      }}
      title={`${name ?? ''}님 신청을 거절할까요?`}
      label="참여 신청 거절"
      footer={<SheetButton label="거절하기" tone="white" size="foot" disabled={!ready} onPress={() => reason && onReject(reason.phrase, reason.key, text.trim())} />}>
      <SheetDesc>거절 사유를 골라 주세요. 신청한 사람에게는 아래 문구로만 알려 드려요.</SheetDesc>
      <SheetOptions radio items={REJECT_REASONS.map((r) => ({ key: r.key, label: r.label, sub: `신청자에게: ${r.phrase}` }))} selected={code} onPick={(k) => setCode(k as RejectCode)} />
      {code === 'OTHER' ? (
        <View style={{ gap: 6 }}>
          <TextField label="사유 · 운영진만 봐요" value={text} onChangeText={setText} placeholder="예) 이번 모임은 아는 사람끼리 하기로 했어요" maxLength={300} />
        </View>
      ) : null}
      <SheetNote>거절 사유와 횟수는 운영진이 확인해요. 이유 없이 자주 거절하면 번개 열기가 제한될 수 있어요.</SheetNote>
    </Sheet>
  );
}
