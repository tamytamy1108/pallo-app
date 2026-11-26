import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { MyPageNotePreview, MyPageProNote } from '@/api/my-page';
import { Pressable } from '@/components/ui/pressable';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { sfx } from '@/lib/feedback';

import { Box, Icon, Lift } from './parts';
import { markNoteRead } from './store';

const WD = '일월화수목금토';
/** 'YYYY-MM-DD' → '11/10(월)' */
function dayLabel(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${m}/${d}(${WD[new Date(y, m - 1, d).getDay()]})`;
}

/**
 * 마이 화면의 PRO'S NOTE 카드 (최신 노트 · 새 노트 n · 모두 보기 ›) — 값은 마이 BFF(GET /me/mypage proNote) 그대로.
 * note.sent 가 오면(서버가 프로로 판정) 위에 [보낸 노트] [받은 노트] — 보낸 노트는 n/m명 읽음 · 고마워요, 받은 노트는 회원과 같아요.
 * 상자에 노트가 하나도 없으면(latest null) 버튼 대신 안내 문구.
 * 프로토타입 myPnHTML (.my-pnx: 보라 카드 안 크림 버튼). 새 노트 수는 상자 없이 노랑 글자로.
 */
export function ProNoteCard({ note }: { note: MyPageProNote }) {
  const pro = note.sent != null;
  // 프로는 보낸 노트 · 받은 노트로 나눠요 (프로도 멤버로 참여하면 노트를 받아요)
  const [box, setBox] = useState<'sent' | 'got'>('sent');
  const sent = pro && box === 'sent';
  const n: MyPageNotePreview | null = (sent ? note.sent?.latest : note.received.latest) ?? null;
  const open = () => {
    if (!n) return;
    sfx('tap');
    if (!sent) markNoteRead(n.id);
    router.push(`/me/notes/${n.id}`);
  };

  return (
    <Box color={Colors.purple} style={styles.card}>
      <View style={styles.hd}>
        <Icon name="pen" size={18} color={Colors.yellow} fill={Colors.yellow} strokeWidth={2.4} />
        <PText style={styles.title}>PRO&apos;S NOTE</PText>
        {note.unreadCount > 0 && !sent ? <PText style={styles.fresh}>{`새 노트 ${note.unreadCount}`}</PText> : null}
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
      {note.sent ? (
        <View style={styles.tabs} accessibilityRole="tablist">
          {(
            [
              ['sent', `보낸 노트 ${note.sent.total}`],
              ['got', `받은 노트 ${note.received.total}`],
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
      {n ? (
        <Pressable onPress={open} accessibilityRole="button" accessibilityLabel={`${dayLabel(n.date)} 노트 열기`}>
          {({ pressed }) => (
            <Lift radius={18} dx={0} dy={4} pressed={pressed}>
              <View style={styles.ft}>
                <PText style={styles.meta}>{sent ? `${dayLabel(n.date)} · ${n.courseTitle} · 보낸 노트` : `${dayLabel(n.date)} · ${n.courseTitle} · ${n.leaderName} 프로`}</PText>
                <PText style={styles.head}>{n.previewQuestion ?? '질문 없이 보낸 노트'}</PText>
                <PText style={styles.tags}>{sent ? `${n.readCount}/${n.recipientCount}명 읽음 · 고마워요 ${n.thanksCount}` : `질문 ${n.questionCount}개`}</PText>
                <View style={styles.go}>
                  <PText style={styles.goText}>노트 열기</PText>
                </View>
              </View>
            </Lift>
          )}
        </Pressable>
      ) : (
        <View style={styles.ft}>
          <PText style={styles.meta}>{sent ? '아직 보낸 노트가 없어요' : '아직 받은 노트가 없어요'}</PText>
          <PText style={styles.tags}>{sent ? '수업이 끝나면 테이블 친구들에게 노트를 보낼 수 있어요' : '수업이 끝나면 프로가 노트를 보내 줘요'}</PText>
        </View>
      )}
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
