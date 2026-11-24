import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { apiErrorMessage } from '@/api/errors';
import { sendSessionInvite } from '@/api/home';
import { MemberFace } from '@/components/character/avatar';
import { Button } from '@/components/ui/button';
import { Pressable } from '@/components/ui/pressable';
import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { followLists } from '@/data/my';
import { sfx } from '@/lib/feedback';
import { snoozeInvite } from '@/state/invite-prompt';
import { useMe } from '@/state/me';

import { summary } from './attendance';
import { CHECK_PATH, LineIcon } from './icons';

/**
 * '함께 가자고 할까요?' (사전 출석이 끝나면 · docs/pages/01-home.md 함께 가자).
 * 내가 팔로우한 멤버 목록(얼굴 · 이름 · 지점)에서 여러 명 고르기 + 모두 선택 → [n명에게 보내기] · [다음에].
 * 아래 '2주간 보지 않기'를 누르면 14일 동안 안 떠요 (state/invite-prompt). 맞는 API: 추가 제안 POST /sessions/:id/invites.
 */
export function InviteSheet({ at, onClose }: { at: { slot: number; lang: number } | null; onClose: () => void }) {
  const me = useMe();
  const people = followLists(me.name, me, me.following).fing;
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  // 새로 열 때마다 아무도 안 고른 채로 (렌더 중에 이전 값과 비교)
  const [seen, setSeen] = useState(at);
  if (at !== seen) {
    setSeen(at);
    if (at) setPicked({});
  }
  const names = people.filter((p) => picked[p.name]).map((p) => p.name);
  const all = people.length > 0 && names.length === people.length;

  const send = useMutation({
    mutationFn: sendSessionInvite,
    onSuccess: ({ sent }) => {
      sfx('send');
      showToast(`${sent}명에게 알렸어요`);
      onClose();
    },
    onError: (e) => showToast(apiErrorMessage(e)),
  });

  const toggle = (name: string) => setPicked((s) => ({ ...s, [name]: !s[name] }));
  const toggleAll = () => setPicked(all ? {} : Object.fromEntries(people.map((p) => [p.name, true])));

  return (
    <Sheet
      open={!!at}
      onClose={onClose}
      title="함께 가자고 할까요?"
      footer={
        <>
          <Button label="다음에" variant="secondary" wide onPress={onClose} />
          <Button label={names.length ? `${names.length}명에게 보내기` : '멤버를 골라요'} wide disabled={!names.length || send.isPending} onPress={() => at && send.mutate({ slot: at.slot, lang: at.lang, names })} />
        </>
      }>
      <PText style={styles.sub} color={Colors.inkSub}>
        {at ? `${summary(at.slot, at.lang)} 세션에 간다고 팔로우한 멤버에게 알려요.` : ''}
      </PText>

      <View style={styles.card}>
        <Pressable onPress={toggleAll} accessibilityRole="checkbox" accessibilityState={{ checked: all }} accessibilityLabel="모두 선택" style={styles.allRow}>
          <Check on={all} />
          <PText style={styles.allText}>모두 선택</PText>
          <PText style={styles.count} color={Colors.inkSub}>
            {names.length}/{people.length}
          </PText>
        </Pressable>
        {people.map((p) => {
          const on = !!picked[p.name];
          return (
            <Pressable
              key={p.name}
              onPress={() => toggle(p.name)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={`${p.name}, ${p.branch}`}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
              <MemberFace name={p.name} size={38} bg={p.color} />
              <View style={styles.who}>
                <PText style={styles.name}>{p.name}</PText>
                <PText style={styles.branch} color={Colors.inkSub} numberOfLines={1}>
                  {p.branch}
                </PText>
              </View>
              <Check on={on} />
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={() => {
          snoozeInvite();
          showToast('2주 동안 묻지 않을게요');
          onClose();
        }}
        sound={false}
        accessibilityRole="button"
        accessibilityLabel="2주간 보지 않기"
        hitSlop={8}
        style={styles.snooze}>
        {({ pressed }) => (
          <PText style={[styles.snoozeText, pressed && styles.snoozePressed]} color={Colors.inkSub}>
            2주간 보지 않기
          </PText>
        )}
      </Pressable>
    </Sheet>
  );
}

/** 고르기 네모 (잉크 테두리 · 고르면 노랑 + 체크) */
function Check({ on }: { on: boolean }) {
  return <View style={[styles.box, on && styles.boxOn]}>{on && <LineIcon d={CHECK_PATH} size={14} width={3.2} />}</View>;
}

const styles = StyleSheet.create({
  sub: { marginTop: -4, fontFamily: Font.body700, fontSize: 13.5, lineHeight: 20 },
  card: { borderRadius: 18, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, paddingHorizontal: 12 },
  allRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, borderBottomWidth: 1.5, borderColor: Colors.line },
  allText: { flex: 1, fontFamily: Font.body900, fontSize: 14, lineHeight: 20 },
  count: { fontFamily: Font.display, fontSize: 11, lineHeight: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 58, paddingVertical: 8 },
  rowPressed: { opacity: 0.7 },
  who: { flex: 1, minWidth: 0 },
  name: { fontFamily: Font.body900, fontSize: 14.5, lineHeight: 20 },
  branch: { fontFamily: Font.body700, fontSize: 12, lineHeight: 17 },
  box: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: Colors.yellow },
  snooze: { alignSelf: 'center', minHeight: 32, justifyContent: 'center' },
  snoozeText: { fontFamily: Font.body800, fontSize: 12.5, lineHeight: 18, textDecorationLine: 'underline' },
  snoozePressed: { opacity: 0.6 },
});
