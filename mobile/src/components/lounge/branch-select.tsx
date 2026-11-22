import { useState } from 'react';
import { Pressable } from 'react-native';

import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';

/**
 * 지점 선택 버튼 + 시트 ('전체 지점 ▾', docs/pages/04-lounge.md '지점 선택 시트'). 라운지 · 이벤트 탭이 같이 써요.
 * value: '전체' 또는 지점 이름.
 * 담당: 라운지. props 는 바꾸지 않아요(늘리기만).
 */
export function BranchSelect({ value, onChange }: { value: string; onChange: (branch: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable onPress={() => setOpen(true)} accessibilityRole="button" accessibilityLabel="지점 선택">
        <PText variant="bodyStrong">{value === '전체' ? '전체 지점' : value} ▾</PText>
      </Pressable>
      <Sheet open={open} onClose={() => setOpen(false)} title="지점 선택">
        {['전체', '하남점'].map((b) => (
          <Pressable
            key={b}
            onPress={() => {
              onChange(b);
              setOpen(false);
            }}>
            <PText>{b}</PText>
          </Pressable>
        ))}
      </Sheet>
    </>
  );
}
