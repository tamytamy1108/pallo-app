import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { apiErrorMessage } from '@/api/errors';
import { usePatchMe } from '@/api/session';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/field';
import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { showToast, showWarnToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { sfx } from '@/lib/feedback';

/** 한 줄 소개 최대 글자 수 (설정 › 닉네임 · 한 줄 소개 칸과 같아요) */
export const BIO_MAX = 40;

/** 줄바꿈 · 겹친 빈칸을 한 칸으로 (늘 한 줄로 보여요) */
const oneLine = (v: string) => v.replace(/\s+/g, ' ');

/**
 * 한 줄 소개 쓰기 · 고치기 (마이 맨 위 카드의 소개 줄을 누르면 열려요).
 * 저장은 4 PATCH /me (usePatchMe) — 저장하면 마이 카드 · 내 프로필에 바로 보여요. 비우고 저장하면 지워져요.
 */
export function BioSheet({ open, onClose, bio }: { open: boolean; onClose: () => void; bio: string }) {
  const [draft, setDraft] = useState(bio);
  // 열 때마다 지금 소개에서 시작해요 (쓰다 닫은 글은 남기지 않아요)
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(bio);
  }
  const save = usePatchMe();
  const next = draft.trim();
  const same = next === bio.trim();

  const submit = () => {
    if (save.isPending) return;
    if (same) {
      onClose();
      return;
    }
    save.mutate(
      { bio: next },
      {
        onSuccess: () => {
          sfx('save');
          onClose();
          showToast(next ? '한 줄 소개를 저장했어요' : '한 줄 소개를 지웠어요');
        },
        onError: (e) => showWarnToast(apiErrorMessage(e)),
      },
    );
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="한 줄 소개"
      footer={<Button label={save.isPending ? '저장하는 중…' : '저장하기'} wide disabled={save.isPending} onPress={submit} />}>
      <PText style={styles.desc}>프로필에 보여요 · 라운지 멤버들이 나를 알아볼 수 있게 짧게 남겨 보세요.</PText>
      <View style={styles.field}>
        <TextField
          value={draft}
          onChangeText={(t) => setDraft(oneLine(t))}
          placeholder="예) 주말마다 번개 나가요!"
          maxLength={BIO_MAX}
          oneLine
          returnKeyType="done"
          onSubmitEditing={submit}
          accessibilityLabel="한 줄 소개"
        />
        <PText style={styles.count} accessibilityLabel={`${draft.length}자 · 최대 ${BIO_MAX}자`}>{`${draft.length}/${BIO_MAX}`}</PText>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  desc: { fontFamily: Font.body700, fontSize: 14, lineHeight: 21, color: Colors.inkSub },
  field: { gap: 6 },
  count: { alignSelf: 'flex-end', fontFamily: Font.body800, fontSize: 12, lineHeight: 16, color: Colors.inkSub },
});
