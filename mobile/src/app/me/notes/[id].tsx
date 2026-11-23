import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Pressable } from '@/components/ui/pressable';
import { MemberFace } from '@/components/account/member-face';
import { AccountPage, Bar, Box, Icon, Lift, TextLink } from '@/components/account/parts';
import { DiaryCard, noteExpression } from '@/components/account/pro-note-parts';
import { markNoteRead, sendNoteMessage, toggleNoteThanks, useNoteState } from '@/components/account/store';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { noteReactions, PN_TAG_COLOR, PN_THANKS, PRO_NOTES, teamNameByNo, type ProNote } from '@/data/account';
import { haptic, sfx } from '@/lib/feedback';
import { toggleExpression, useIsSaved } from '@/state/expressions';
import { useMe } from '@/state/me';

/**
 * PRO'S NOTE 한 장 (프로토타입 pnDetHTML): 표현 · 바로잡기 · 뜻 · 질문 항목(항목별 저장 → 내 표현함) · 스터디 일기 · 프로님께 보낸 마음.
 * 아래 고정: [고마워요] · [감사 인사 보내기]. 알림 · 마이 카드에서 바로 열면 위에 '전체 보기'.
 * 맞는 API: 44 `/pro-notes/:id` · 45 `/pro-notes/:id/thanks`
 */
export default function ProNoteScreen() {
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  const n = PRO_NOTES.find((x) => x.id === id);
  useEffect(() => {
    if (n) markNoteRead(n.id);
  }, [n]);
  if (!n) {
    return (
      <AccountPage title="PRO'S NOTE">
        <PText style={styles.missing}>노트를 찾을 수 없어요.</PText>
      </AccountPage>
    );
  }
  return <Note n={n} fromList={from === 'list' || from === 'diary'} />;
}

function Note({ n, fromList }: { n: ProNote; fromList: boolean }) {
  const { thanks, msgs } = useNoteState();
  const me = useMe();
  const [sheet, setSheet] = useState(false);
  const R = noteReactions(n.id);
  const ty = !!thanks[n.id];
  const hearts: [string, string, boolean][] = [...(ty ? [[me.name, Colors.yellow, true] as [string, string, boolean]] : []), ...R.hearts.map(([w, c]): [string, string, boolean] => [w, c, false])];
  const mine = msgs[n.id] ?? [];

  return (
    <AccountPage
      title={`${n.m}/${n.d}(${n.wd}) PRO'S NOTE`}
      right={
        fromList ? null : (
          <TextLink
            label="전체 보기"
            onPress={() => {
              sfx('tap');
              router.replace('/me/notes');
            }}
            style={styles.all}
          />
        )
      }
      bodyStyle={styles.body}
      bottom={
        <Bar>
          <Pressable
            onPress={() => {
              const on = toggleNoteThanks(n.id);
              if (on) {
                sfx('save');
                haptic('success');
                showToast('고마워요를 보냈어요');
              }
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: ty }}
            accessibilityLabel={ty ? '고마워요 보냈어요' : '고마워요'}
            style={styles.tyWrap}>
            {({ pressed }) => (
              <Lift radius={30} pressed={pressed}>
                <View style={[styles.ty, ty && styles.tyOn]}>
                  <Icon name="heart" size={18} color={ty ? '#C2416B' : Colors.ink} fill={ty ? '#C2416B' : 'none'} />
                  <PText style={styles.tyText} color={ty ? '#C2416B' : Colors.ink}>
                    {ty ? '보냈어요' : '고마워요'}
                  </PText>
                </View>
              </Lift>
            )}
          </Pressable>
          <View style={styles.flex}>
            <Button label="감사 인사 보내기" wide onPress={() => setSheet(true)} />
          </View>
        </Bar>
      }>
      <View style={styles.dh}>
        <PText style={styles.dhB}>{`${n.m}월 ${n.d}일 ${n.wd}요일`}</PText>
        <PText style={styles.dhS}>{`${teamNameByNo(n.team)} · ${n.pro} 프로 · 정리 ${n.items.length}개`}</PText>
      </View>
      {n.items.map((_, i) => (
        <NoteItem key={i} n={n} i={i} />
      ))}
      <DiaryCard n={n} />
      <View style={styles.sent}>
        <PText style={styles.sentH}>{`${n.pro} 프로님께 보낸 마음`}</PText>
        <View style={styles.hearts}>
          <View style={styles.avs}>
            {hearts.slice(0, 5).map(([w, c, isMe], i) => (
              <View key={w} style={i ? styles.avOver : undefined}>
                <MemberFace name={w} color={c} size={26} me={isMe} />
              </View>
            ))}
          </View>
          <Icon name="heart" size={14} color={Colors.rosePink} />
          <PText style={styles.heartsText}>
            <PText style={styles.heartsName}>{hearts[0][2] ? '나' : hearts[0][0]}</PText>
            {`${hearts.length > 1 ? ` 외 ${hearts.length - 1}명` : ''}이 고마워요를 보냈어요`}
          </PText>
        </View>
        {R.msgs.map((m) => (
          <Msg key={m.who} who={m.who} color={m.color} text={m.text} time={m.time} />
        ))}
        {mine.map((m, i) => (
          <Msg key={`me${i}`} who={me.name} color={Colors.yellow} text={m.text} time="방금" me />
        ))}
      </View>
      <ThanksSheet n={n} open={sheet} onClose={() => setSheet(false)} />
    </AccountPage>
  );
}

/** 노트 항목 하나 (프로토타입 .pn-it: 번호 · 태그 · 제목 · 설명 · 예문 · 책갈피) */
function NoteItem({ n, i }: { n: ProNote; i: number }) {
  const [tg, t, b, ex] = n.items[i];
  const expr = noteExpression(n, i);
  const on = useIsSaved(expr.en);
  return (
    <Box style={styles.it}>
      <View style={styles.no}>
        <PText style={styles.noText}>{i + 1}</PText>
      </View>
      <View style={styles.itB}>
        <PText style={[styles.itTag, { color: PN_TAG_COLOR[tg] }]}>{tg}</PText>
        <PText style={styles.itTitle}>{t}</PText>
        <PText style={styles.itP}>{b}</PText>
        {ex.length ? (
          <View style={styles.ul}>
            {ex.map((e) => (
              <PText key={e} style={styles.li}>
                {e}
              </PText>
            ))}
          </View>
        ) : null}
      </View>
      <Pressable
        onPress={() => {
          const saved = toggleExpression(expr);
          sfx(saved ? 'save' : 'tap');
          showToast(saved ? "PRO'S NOTE › 저장한 표현에 담았어요" : '저장을 취소했어요');
        }}
        accessibilityRole="button"
        accessibilityState={{ selected: on }}
        accessibilityLabel={on ? '저장 취소' : '내 표현함에 저장'}
        hitSlop={4}
        style={[styles.mk, on && styles.mkOn]}>
        <Icon name="save" size={18} color={on ? Colors.white : Colors.inkSub} />
      </Pressable>
    </Box>
  );
}

function Msg({ who, color, text, time, me = false }: { who: string; color: string; text: string; time: string; me?: boolean }) {
  return (
    <View style={[styles.m, me && styles.mMe]}>
      <MemberFace name={who} color={color} size={34} me={me} />
      <View style={styles.mTx}>
        <View style={styles.mHd}>
          <PText style={styles.mWho}>{who}</PText>
          {me ? <PText style={styles.mMeTag}>나</PText> : null}
          <PText style={styles.mTime}>{time}</PText>
        </View>
        <PText style={styles.mText}>{text}</PText>
      </View>
    </View>
  );
}

/** 프로님께 감사 인사 (프로토타입 pnMsgSheet: 고르기 5개 + 직접 쓰기) */
function ThanksSheet({ n, open, onClose }: { n: ProNote; open: boolean; onClose: () => void }) {
  const [pick, setPick] = useState<number | null>(null);
  const [typed, setTyped] = useState('');
  const send = () => {
    const t = typed.trim() || (pick != null ? PN_THANKS[pick] : '');
    if (!t) {
      showToast('감사 인사를 고르거나 써 주세요');
      return;
    }
    sendNoteMessage(n.id, { kind: '감사 인사', text: t });
    sfx('save');
    setPick(null);
    setTyped('');
    onClose();
    showToast('감사 인사를 보냈어요');
  };
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`${n.pro} 프로님께 감사 인사`}
      footer={
        <View style={styles.flex}>
          <Button label="감사 인사 보내기" wide onPress={send} />
        </View>
      }>
      <View style={styles.thx}>
        {PN_THANKS.map((t, i) => {
          const on = pick === i;
          return (
            <Pressable
              key={t}
              onPress={() => {
                sfx('tap');
                setPick(i);
              }}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              style={[styles.thxBtn, on && styles.thxOn]}>
              <View style={[styles.rd, on && styles.rdOn]} />
              <PText style={styles.thxText}>{t}</PText>
            </Pressable>
          );
        })}
        <TextInput value={typed} onChangeText={setTyped} multiline placeholder="직접 써도 돼요" placeholderTextColor="#9B94A6" accessibilityLabel="감사 인사 직접 쓰기" style={styles.thxIn} />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  missing: { padding: 20 },
  all: { alignSelf: 'center', paddingHorizontal: 4 },
  body: { paddingTop: 8, paddingBottom: 30, gap: 12 },
  dh: { gap: 2, paddingVertical: 4, paddingHorizontal: 2 },
  dhB: { fontFamily: Font.display, fontSize: 22, lineHeight: 28 },
  dhS: { fontFamily: Font.body700, fontSize: 13, lineHeight: 19, color: Colors.inkSub },
  it: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 14, paddingLeft: 14, paddingRight: 12 },
  no: { width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.ink, alignItems: 'center', justifyContent: 'center' },
  noText: { fontFamily: Font.display, fontSize: 13, lineHeight: 16, color: Colors.white },
  itB: { flex: 1, minWidth: 0, gap: 3 },
  itTag: { fontFamily: Font.body900, fontSize: 12, lineHeight: 17 },
  itTitle: { fontFamily: Font.body900, fontSize: 16, lineHeight: 21.6 },
  itP: { fontFamily: Font.body600, fontSize: 13.5, lineHeight: 21 },
  ul: { marginTop: 4, paddingVertical: 8, paddingHorizontal: 12, gap: 4, borderRadius: 12, backgroundColor: Colors.cream },
  li: { fontFamily: Font.body700, fontSize: 13.5, lineHeight: 19.6 },
  mk: { width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, borderColor: Colors.line, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  mkOn: { backgroundColor: Colors.purple, borderColor: Colors.purple },
  sent: { gap: 10, paddingTop: 16, paddingHorizontal: 2, paddingBottom: 8 },
  sentH: { fontFamily: Font.body900, fontSize: 13, lineHeight: 19, color: Colors.inkSub },
  hearts: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  avs: { flexDirection: 'row', marginRight: 2 },
  avOver: { marginLeft: -8 },
  heartsText: { flexShrink: 1, fontFamily: Font.body800, fontSize: 13, lineHeight: 19, color: Colors.inkSub },
  heartsName: { fontFamily: Font.body900, color: Colors.ink },
  m: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.line, backgroundColor: Colors.white },
  mMe: { backgroundColor: '#F3EEFB', borderColor: 'transparent' },
  mTx: { flex: 1, minWidth: 0, gap: 2 },
  mHd: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  mWho: { fontFamily: Font.body900, fontSize: 13.5, lineHeight: 19 },
  mMeTag: { fontFamily: Font.body900, fontSize: 11, lineHeight: 15, color: Colors.purple },
  mTime: { fontFamily: Font.body700, fontSize: 11.5, lineHeight: 16, color: Colors.inkSub },
  mText: { fontFamily: Font.body700, fontSize: 14, lineHeight: 21 },
  tyWrap: { width: 136 },
  ty: { height: 60, borderRadius: 30, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  tyOn: { backgroundColor: '#FFE7EE' },
  tyText: { fontFamily: Font.body900, fontSize: 17, lineHeight: 22 },
  thx: { gap: 8 },
  thxBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 14, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white },
  thxOn: { backgroundColor: '#F3EEFB', borderColor: Colors.purple },
  rd: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.ink },
  rdOn: { borderWidth: 6, borderColor: Colors.purple },
  thxText: { flex: 1, fontFamily: Font.body800, fontSize: 14, lineHeight: 20 },
  thxIn: { minHeight: 84, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, fontFamily: Font.body600, fontSize: 14, color: Colors.ink, textAlignVertical: 'top' },
});
