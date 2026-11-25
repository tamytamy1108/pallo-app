import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Pressable } from '@/components/ui/pressable';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { PRO_NOTES, PRO_SENT_NOTES, teamNameByNo, type ProNote } from '@/data/account';
import { sfx } from '@/lib/feedback';
import { useMe } from '@/state/me';

import { Box, Icon, Lift } from './parts';
import { markNoteRead, useNoteState } from './store';

/**
 * 마이 화면의 PRO'S NOTE 카드 (최신 노트 · 새 노트 n · 모두 보기 ›) — 마이 화면이 그대로 넣어요.
 * 프로는 위에 [보낸 노트] [받은 노트] — 보낸 노트는 n/m명 읽음 · 고마워요, 받은 노트는 회원과 같아요 (프로도 멤버로 참여하면 노트를 받아요).
 * 프로토타입 myPnHTML (.my-pnx: 보라 카드 안 크림 버튼). 새 노트 수는 상자 없이 노랑 글자로.
 * 담당: 마이 B. props 는 바꾸지 않아요(늘리기만).
 */
export function ProNoteCard() {
  const me = useMe();
  const pro = me.role === 'leader';
  // 프로는 보낸 노트 · 받은 노트로 나눠요 (프로도 멤버로 참여하면 노트를 받아요)
  const [box, setBox] = useState<'sent' | 'got'>('sent');
  const { read } = useNoteState();
  const sent = pro && box === 'sent';
  const n: ProNote = sent ? { ...PRO_SENT_NOTES[0], pro: me.name } : PRO_NOTES[0];
  const s0 = PRO_SENT_NOTES[0];
  const fresh = PRO_NOTES.filter((x) => x.isNew && !read[x.id]).length;
  const cnt: Record<string, number> = {};
  n.items.forEach(([k]) => {
    cnt[k] = (cnt[k] ?? 0) + 1;
  });
  const open = () => {
    sfx('tap');
    if (!sent) markNoteRead(n.id);
    router.push(`/me/notes/${n.id}`);
  };

  return (
    <Box color={Colors.purple} style={styles.card}>
      <View style={styles.hd}>
        <Icon name="pen" size={18} color={Colors.yellow} fill={Colors.yellow} strokeWidth={2.4} />
        <PText style={styles.title}>PRO&apos;S NOTE</PText>
        {fresh && !sent ? <PText style={styles.fresh}>{`새 노트 ${fresh}`}</PText> : null}
        <View style={styles.sp} />
        <Pressable
          onPress={() => {
            sfx('tap');
            router.push(pro ? `/me/notes?box=${box}` : '/me/notes');
          }}
          accessibilityRole="button"
          hitSlop={10}>
          <PText style={styles.all}>모두 보기 ›</PText>
        </Pressable>
      </View>
      {pro ? (
        <View style={styles.tabs} accessibilityRole="tablist">
          {(
            [
              ['sent', `보낸 노트 ${PRO_SENT_NOTES.length}`],
              ['got', `받은 노트 ${PRO_NOTES.length}`],
            ] as const
          ).map(([k, l]) => (
            <Pressable
              key={k}
              onPress={() => {
                sfx('tap');
                setBox(k);
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: box === k }}
              style={[styles.tab, box === k && styles.tabOn]}>
              <PText style={[styles.tabT, box === k && styles.tabTOn]}>{l}</PText>
            </Pressable>
          ))}
        </View>
      ) : null}
      <Pressable onPress={open} accessibilityRole="button" accessibilityLabel={`${n.m}월 ${n.d}일 노트 열기`}>
        {({ pressed }) => (
          <Lift radius={18} dx={0} dy={4} pressed={pressed}>
            <View style={styles.ft}>
              <PText style={styles.meta}>{sent ? `${n.m}/${n.d}(${n.wd}) · ${teamNameByNo(n.team)} · 보낸 노트` : `${n.m}/${n.d}(${n.wd}) · ${teamNameByNo(n.team)} · ${n.pro} 프로`}</PText>
              <PText style={styles.head}>{n.items[0][1]}</PText>
              <PText style={styles.tags}>{sent ? `${s0.readN}/${s0.total}명 읽음 · 고마워요 ${s0.thanksN}` : Object.entries(cnt).map(([k, v]) => `${k} ${v}`).join(' · ')}</PText>
              <View style={styles.go}>
                <PText style={styles.goText}>노트 열기</PText>
              </View>
            </View>
          </Lift>
        )}
      </Pressable>
    </Box>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, gap: 12 },
  hd: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  title: { fontFamily: Font.display, fontSize: 17, lineHeight: 21, color: Colors.white },
  fresh: { fontFamily: Font.body900, fontSize: 13, lineHeight: 19, color: Colors.yellow },
  sp: { flex: 1 },
  all: { fontFamily: Font.body900, fontSize: 13, lineHeight: 19, color: 'rgba(255,255,255,0.85)' },
  ft: { gap: 4, padding: 14, borderRadius: 18, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.cream },
  meta: { fontFamily: Font.body800, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  head: { fontFamily: Font.display, fontSize: 20, lineHeight: 25 },
  tags: { fontFamily: Font.body800, fontSize: 12.5, lineHeight: 18, color: Colors.purple },
  go: { marginTop: 8, height: 46, borderRadius: 22, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.yellow, alignItems: 'center', justifyContent: 'center' },
  goText: { fontFamily: Font.body900, fontSize: 14, lineHeight: 20 },
  // 프로: 보낸 노트 · 받은 노트 (보라 카드 위 작은 알약)
  tabs: { flexDirection: 'row', gap: 6 },
  tab: { height: 30, paddingHorizontal: 12, borderRadius: 15, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)', justifyContent: 'center' },
  tabOn: { backgroundColor: Colors.yellow, borderColor: Colors.ink },
  tabT: { fontFamily: Font.body900, fontSize: 12.5, lineHeight: 17, color: Colors.white },
  tabTOn: { color: Colors.ink },
});
