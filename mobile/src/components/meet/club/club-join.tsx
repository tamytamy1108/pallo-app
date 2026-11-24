import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { GrowInput } from '@/components/ui/grow-input';
import { keepAll, SheetButton, SheetDesc } from '@/components/common/sheet-parts';
import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import type { Club } from '@/data/meet';
import { sfx } from '@/lib/feedback';

import { ConfirmCheck, DoneSheet } from '../detail/sheets';
import { Icon } from '../icons';
import { setClubState, setText } from '../meet-store';
import { clubHost } from '../model';

/**
 * 동아리 가입 (프로토타입 lgClubJoinSheet → lgClubJoinDone → lgGreetAsk):
 * '동아리 안내를 확인했어요' 체크 → 가입 → '가입했어요! 가입 인사 남길래요?' [인사 남기기 / 다음에 할게요].
 * 승인이 필요하면 '가입 신청을 보냈어요 · 미리 남길래요?'.
 */
export function ClubJoin({ c, open, onClose }: { c: Club; open: boolean; onClose: () => void }) {
  const [ok, setOk] = useState(false);
  const [done, setDone] = useState(false);
  const [hi, setHi] = useState('');
  const free = c.cond === '누구나';
  const host = clubHost(c);
  return (
    <>
      <Sheet
        open={open}
        onClose={onClose}
        title={c.name}
        label="동아리 가입"
        onClosed={() => setOk(false)}
        footer={
          <SheetButton
            label={free ? '가입하기' : '가입 신청하기'}
            size="foot"
            disabled={!ok}
            onPress={() => {
              setClubState(c.id, free ? 'in' : 'ask');
              sfx('save');
              onClose();
              setDone(true);
            }}
          />
        }>
        <SheetDesc>{free ? '가입하면 정기 모임 참석, 게시판, 사진첩을 함께 써요.' : `가입 조건은 '${c.cond}'이에요. 호스트 ${host}가 확인하면 가입돼요.`}</SheetDesc>
        <View style={styles.note}>
          <View style={{ marginTop: 2 }}>
            <Icon name="shield" size={15} color={Colors.inkSub} />
          </View>
          <PText style={[styles.noteT, keepAll]}>호스트에게만 내 지점이 보여요. 다른 정보는 공개되지 않아요.</PText>
        </View>
        <ConfirmCheck checked={ok} onChange={setOk} label="동아리 안내를 확인했어요" />
      </Sheet>
      <DoneSheet
        open={done}
        onClose={() => setDone(false)}
        label="가입 인사"
        title={free ? `${c.name}에 가입했어요!` : '가입 신청을 보냈어요'}
        desc={free ? "가입 인사 남길래요? 게시판 '가입 인사'와 멤버 목록에 보여요." : `호스트 ${host}가 확인하면 알려 드려요. 그동안 가입 인사를 미리 남길래요?`}
        button="인사 남기기"
        onMain={() => {
          if (!hi.trim()) return showToast('가입 인사를 적어 주세요');
          setText('greet', c.id, hi.trim());
          setDone(false);
          setHi('');
          showToast('가입 인사를 남겼어요 · 게시판에 올라갔어요');
        }}
        onSkip={() => {
          setDone(false);
          showToast('언제든 멤버 목록에서 인사를 남길 수 있어요');
        }}>
        <GrowInput value={hi} onChangeText={setHi} multiline maxLength={200} placeholder="예) 안녕하세요! 영어로 말하는 시간을 꾸준히 만들고 싶어요. 잘 부탁드려요!" placeholderTextColor="#8C8597" style={styles.ta} accessibilityLabel="가입 인사" />
      </DoneSheet>
    </>
  );
}

const styles = StyleSheet.create({
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  noteT: { flex: 1, fontFamily: Font.body700, fontSize: 12.5, lineHeight: 18.75, color: Colors.inkSub },
  ta: { minHeight: 110, borderRadius: 18, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12, fontFamily: Font.body600, fontSize: 14, lineHeight: 22.4, color: Colors.ink, textAlignVertical: 'top' },
});
