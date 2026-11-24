import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View, type ScrollViewInstance, type TextInputInstance } from 'react-native';
import Svg, { Line } from 'react-native-svg';

import { GrowInput } from '@/components/ui/grow-input';
import { Pressable } from '@/components/ui/pressable';
import { ReportSheet, useBlockedNames } from '@/components/common/report-sheet';
import { guardMember } from '@/components/common/trial-guide';
import { Sheet, SheetBottom } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import {
  addEntry,
  challengeSrc,
  CH_SRC,
  daysLeft,
  editEntry,
  entriesOf,
  isJoined,
  leftText,
  meaningOf,
  removeEntry,
  srcKindOf,
  toggleLiked,
  useChallengeState,
  type Challenge,
  type ChEntry,
  type ChView,
} from '@/data/challenge';
import { haptic, sfx } from '@/lib/feedback';
import { useMe } from '@/state/me';
import { HeartPop } from '@/components/ui/heart-pop';

import { SaveHeart } from './cards';
import { Face } from './face';
import { ChIcon } from './icons';
import { SUB } from './parts';

type Mode = { t: 'reply' | 'edit'; e: ChEntry } | null;

/**
 * 표현 챌린지 창 — 나만의 문장 완성하기 (프로토타입 chxSheet + lgCS 댓글 창).
 * 위에 표현 카드(예문 · 출처) + '예문 말고, 내 이야기로 문장을 만들어요.' → 나만의 문장 목록(좋아요 · 답글) → 아래 입력칸.
 * 문장 · 답글을 처음 다는 순간 자동 참여('챌린지에 참여했어요'). 다른 멤버 문장은 길게 눌러 신고 · 차단.
 */
export function ChxSheet({ p, open, onClose, onClosed, write = false }: { p: Challenge; open: boolean; onClose: () => void; onClosed?: () => void; write?: boolean }) {
  const s = useChallengeState();
  const me = useMe();
  const hide = useBlockedNames();
  const L = entriesOf(p, s, hide);
  const [text, setText] = useState('');
  const [mode, setMode] = useState<Mode>(null);
  const [openReps, setOpenReps] = useState<Record<string, true>>({});
  const [report, setReport] = useState<ChEntry | null>(null);
  const input = useRef<TextInputInstance>(null);
  const list = useRef<ScrollViewInstance>(null);

  // '문장 쓰기'로 열면 입력칸에 바로 (시트가 올라온 뒤)
  useEffect(() => {
    if (!open || !write) return;
    const id = setTimeout(() => input.current?.focus(), 600);
    return () => clearTimeout(id);
  }, [open, write]);

  const send = () =>
    guardMember(() => {
      const v = text.trim();
      if (!v) {
        input.current?.focus();
        return;
      }
      if (mode?.t === 'edit') {
        editEntry(p, mode.e.id, v);
        showToast('댓글을 고쳤어요');
      } else {
        const key = mode?.t === 'reply' ? repKey(p, mode.e) : undefined;
        if (key) setOpenReps((o) => ({ ...o, [key]: true }));
        if (addEntry(p, v, key)) showToast('챌린지에 참여했어요');
        if (!mode) setTimeout(() => list.current?.scrollToEnd({ animated: true }), 80);
      }
      sfx('send');
      setText('');
      setMode(null);
    }, '댓글을 달려면');

  const startReply = (e: ChEntry) =>
    guardMember(() => {
      setMode({ t: 'reply', e });
      input.current?.focus();
    }, '댓글을 달려면');
  const startEdit = (e: ChEntry) => {
    setMode({ t: 'edit', e });
    setText(e.x);
    input.current?.focus();
  };
  const remove = (e: ChEntry) => {
    const undo = removeEntry(p, e.id);
    setMode(null);
    showToast('댓글을 지웠어요', { label: '되돌리기', onPress: undo });
  };

  const jn = isJoined(p, s);
  const soon = daysLeft(p) > 0 && daysLeft(p) <= 3;
  return (
    <>
      <Sheet open={open} onClose={onClose} onClosed={onClosed} tall scroll={false} gap={0} label="나만의 문장" contentStyle={styles.content}>
        <View style={styles.cst}>
          <PText style={styles.cstT} accessibilityRole="header">
            나만의 문장 완성하기
          </PText>
        </View>
        <ScrollView ref={list} style={styles.fill} contentContainerStyle={styles.csl} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* .chx-head: 연 사람 · 남은 날 → 표현 · 뜻 · 예문 · 출처 */}
          <View style={styles.head}>
            <View style={styles.by}>
              <Pressable onPress={() => router.push({ pathname: '/me/profile/[id]', params: { id: p.who } })} accessibilityRole="button" accessibilityLabel={`${p.who} 프로필`}>
                <Face name={p.who} color={p.av} size={34} />
              </Pressable>
              <View style={styles.nm}>
                <PText style={styles.nmT}>{p.mine ? '나' : p.who}</PText>
                {jn && !p.mine ? <PText style={styles.jn}>참여 중</PText> : null}
              </View>
              <View style={styles.lf}>
                <ChIcon name="clock" size={15} color={soon ? '#C2416B' : Colors.ink} />
                <PText style={[styles.lfT, soon && { color: '#C2416B' }]}>{leftText(p)}</PText>
              </View>
              <SaveHeart id={p.id} size={32} />
            </View>
            <DashLine />
            <PText style={styles.hl}>{p.hl}</PText>
            <PText style={styles.ko}>{meaningOf(p)}</PText>
            <PText style={styles.ex}>{`예문 · ${p.q || ''}`}</PText>
            <View style={styles.src}>
              <ChIcon name={CH_SRC[srcKindOf(p.src)].icon} size={14} />
              <PText style={styles.srcT}>{challengeSrc(p)}</PText>
            </View>
          </View>
          <View style={styles.mission}>
            <View style={styles.missionIc}>
              <ChIcon name="edit" size={16} color={Colors.purple} />
            </View>
            <PText style={styles.missionP}>
              <PText style={styles.missionB}>{'예문 말고, 내 이야기로 문장을 만들어요.\n'}</PText>
              오늘 있었던 일이나 내 생각에 이 표현을 넣어 보세요.
            </PText>
          </View>
          <View style={styles.tabs}>
            <PText style={styles.tabOne}>
              나만의 문장 <PText style={styles.tabN}>{L.length}</PText>
            </PText>
          </View>
          {L.length ? (
            L.map((e) => (
              <Row
                key={e.id}
                e={e}
                p={p}
                s={s}
                me={me.name}
                open={!!openReps[repKey(p, e)]}
                onOpen={() => setOpenReps((o) => ({ ...o, [repKey(p, e)]: true }))}
                onReply={() => startReply(e)}
                onEdit={() => startEdit(e)}
                onRemove={() => remove(e)}
                onReport={() => setReport(e)}
              />
            ))
          ) : (
            <View style={styles.cs0}>
              <PText style={styles.cs0B}>아직 댓글이 없어요</PText>
              <PText style={styles.cs0S}>첫 댓글을 남겨 보세요.</PText>
            </View>
          )}
        </ScrollView>
        {mode ? (
          <View style={styles.csm}>
            <PText style={styles.csmT}>{mode.t === 'edit' ? '댓글 수정 중' : `${mode.e.n}님에게 답글 남기는 중`}</PText>
            <Pressable
              onPress={() => {
                setMode(null);
                setText('');
              }}
              accessibilityRole="button"
              hitSlop={10}>
              <PText style={styles.csmX}>취소</PText>
            </Pressable>
          </View>
        ) : null}
        {/* .csf: 내 얼굴 · 입력칸 · 보내기 */}
        <SheetBottom base={14} style={styles.csf}>
          <Face name={me.name} color={Colors.yellow} size={38} />
          <GrowInput
            ref={input}
            maxLines={6}
            value={text}
            onChangeText={setText}
            // 안내 글이 두 줄이 되면 입력칸에서 잘려요 → 한 줄로 짧게
            placeholder={`${p.hl}로 문장 만들기…`}
            placeholderTextColor="#9B94A6"
            multiline
            accessibilityLabel="댓글 쓰기"
            style={styles.csIn}
          />
          <Pressable onPress={send} accessibilityRole="button" accessibilityLabel="올리기" style={({ pressed }) => [styles.sendBtn, pressed && styles.pressed]}>
            <ChIcon name="send" size={18} />
          </Pressable>
        </SheetBottom>
      </Sheet>
      <ReportSheet
        open={!!report}
        onClose={() => setReport(null)}
        target={{ kind: 'comment', name: report?.n ?? '' }}
      />
    </>
  );
}

const repKey = (p: Challenge, e: ChEntry) => `chx:${p.id}:${e.id}`;

/** 댓글 한 줄 (.lg-cs .cr): 얼굴 · 이름 · 시간 · 글 · [답글 달기] (내 글은 수정 · 삭제) · 오른쪽 좋아요 */
function Row({
  e,
  p,
  s,
  me,
  open,
  onOpen,
  onReply,
  onEdit,
  onRemove,
  onReport,
  reply = false,
}: {
  e: ChEntry;
  p: Challenge;
  s: ChView;
  me: string;
  open?: boolean;
  onOpen?: () => void;
  onReply?: () => void;
  onEdit?: () => void;
  onRemove?: () => void;
  onReport: () => void;
  reply?: boolean;
}) {
  const key = repKey(p, e);
  const liked = !!s.liked[key];
  const reps = reply ? [] : s.replies[key] ?? [];
  const mine = e.n === me;
  return (
    <Pressable onLongPress={mine ? undefined : onReport} delayLongPress={450} style={[styles.cr, reply && styles.crRp]} accessibilityHint={mine ? undefined : '길게 누르면 신고 · 차단'}>
      <Face name={e.n} color={e.c} size={reply ? 28 : 38} />
      <View style={styles.cb}>
        <View style={styles.ch}>
          <PText style={styles.chB}>{e.n}</PText>
          <PText style={styles.chT}>{`${e.t}${e.n === p.who ? ' · 작성자' : ''}`}</PText>
        </View>
        <PText style={styles.cp}>{e.x}</PText>
        {!reply ? (
          <View style={styles.ca}>
            <Pressable onPress={onReply} accessibilityRole="button" hitSlop={8}>
              <PText style={styles.caT}>답글 달기</PText>
            </Pressable>
            {mine ? (
              <>
                <Pressable onPress={onEdit} accessibilityRole="button" hitSlop={8}>
                  <PText style={styles.caT}>수정</PText>
                </Pressable>
                <Pressable onPress={onRemove} accessibilityRole="button" hitSlop={8}>
                  <PText style={styles.caT}>삭제</PText>
                </Pressable>
              </>
            ) : null}
          </View>
        ) : null}
        {reps.length ? (
          open ? (
            reps.map((r) => <Row key={r.id} e={r} p={p} s={s} me={me} onReport={onReport} reply />)
          ) : (
            <Pressable onPress={onOpen} accessibilityRole="button" style={styles.cmore}>
              <View style={styles.cmoreLine} />
              <PText style={styles.caT}>{`답글 ${reps.length}개 더 보기`}</PText>
            </Pressable>
          )
        ) : null}
      </View>
      <Pressable
        onPress={() => {
          haptic('tap');
          toggleLiked(key);
        }}
        accessibilityRole="button"
        accessibilityLabel="좋아요"
        accessibilityState={{ selected: liked }}
        hitSlop={6}
        style={styles.cl}>
        <HeartPop on={liked}><ChIcon name="heart" size={18} fill={liked ? Colors.rosePink : 'none'} /></HeartPop>
        <PText style={styles.clN}>{e.lk + (liked ? 1 : 0) || ''}</PText>
      </Pressable>
    </Pressable>
  );
}

/** 점선 (.chx-by 아래 1.5px dashed) — 한쪽만 점선은 기기마다 달라서 선을 그려요 */
function DashLine() {
  return (
    <Svg height={2} width="100%" style={styles.dash}>
      <Line x1="0" y1="1" x2="100%" y2="1" stroke="rgba(30,26,43,0.18)" strokeWidth={1.5} strokeDasharray="4 3" />
    </Svg>
  );
}

/** 댓글 줄: 오른쪽 하트 칸 폭 · 칸 사이 */
const HEART_COL = 34;
const ROW_GAP = 10;

const styles = StyleSheet.create({
  content: { paddingHorizontal: 0 },
  fill: { flex: 1 },
  cst: { paddingTop: 2, paddingBottom: 10, borderBottomWidth: 1.5, borderColor: Colors.line },
  cstT: { textAlign: 'center', fontFamily: Font.display, fontSize: 16, lineHeight: 24, letterSpacing: -0.5 },
  csl: { paddingTop: 8, paddingHorizontal: 18, paddingBottom: 12 },
  head: { gap: 2, paddingVertical: 12, paddingHorizontal: 14, marginTop: 4, marginBottom: 6, borderRadius: 16, borderWidth: 2, borderColor: Colors.ink, backgroundColor: '#FFF8CC' },
  by: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 10 },
  dash: { marginBottom: 6 },
  nm: { flex: 1, minWidth: 0 },
  nmT: { fontFamily: Font.body900, fontSize: 14.5, lineHeight: 17.4 },
  jn: { marginTop: 2, fontFamily: Font.body900, fontSize: 11.5, lineHeight: 15, color: Colors.rosePink },
  lf: { flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 4 },
  lfT: { fontFamily: Font.body900, fontSize: 13.5, lineHeight: 20 },
  hl: { marginTop: 2, fontFamily: Font.body900, fontSize: 21, lineHeight: 25.2 },
  ko: { fontFamily: Font.body800, fontSize: 13, lineHeight: 19, color: Colors.purple },
  ex: { marginTop: 4, fontFamily: Font.body600, fontSize: 12.5, lineHeight: 19, color: SUB },
  src: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  srcT: { flexShrink: 1, fontFamily: Font.body800, fontSize: 13, lineHeight: 19, color: Colors.purple },
  mission: { flexDirection: 'row', gap: 8, marginTop: 2, marginHorizontal: 2, marginBottom: 10 },
  missionIc: { marginTop: 2 },
  missionP: { flex: 1, fontFamily: Font.body700, fontSize: 12.5, lineHeight: 18.75, color: SUB },
  missionB: { fontFamily: Font.body900, fontSize: 13.5, lineHeight: 20.25, color: Colors.purple },
  tabs: { flexDirection: 'row', borderBottomWidth: 1.5, borderColor: Colors.line, marginHorizontal: 2, marginBottom: 4 },
  tabOne: { paddingTop: 4, paddingBottom: 9, fontFamily: Font.body900, fontSize: 14.5, lineHeight: 21 },
  tabN: { fontFamily: Font.body800, fontSize: 12, color: SUB },
  cs0: { minHeight: 220, alignItems: 'center', justifyContent: 'center', gap: 4 },
  cs0B: { fontFamily: Font.body900, fontSize: 16, lineHeight: 23 },
  cs0S: { fontFamily: Font.body700, fontSize: 13, lineHeight: 19, color: SUB },
  cr: { flexDirection: 'row', alignItems: 'flex-start', gap: ROW_GAP, paddingVertical: 10 },
  // 답글은 윗댓글 글 칸 안에 들어가요 → 하트 칸(+ 사이) 만큼 오른쪽으로 늘려 윗댓글 하트와 같은 줄에 맞춰요
  crRp: { paddingTop: 8, paddingBottom: 0, marginRight: -(HEART_COL + ROW_GAP) },
  cb: { flex: 1, minWidth: 0 },
  ch: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  chB: { fontFamily: Font.body900, fontSize: 13.5, lineHeight: 20 },
  chT: { fontFamily: Font.body700, fontSize: 12, lineHeight: 17, color: SUB },
  cp: { fontFamily: Font.body600, fontSize: 14.5, lineHeight: 21.75 },
  ca: { flexDirection: 'row', gap: 12, marginTop: 4 },
  caT: { fontFamily: Font.body800, fontSize: 12.5, lineHeight: 18, color: SUB },
  cmore: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  cmoreLine: { width: 24, height: 1.5, backgroundColor: Colors.line },
  cl: { width: HEART_COL, alignItems: 'center', paddingTop: 4, gap: 2 },
  clN: { fontFamily: Font.body800, fontSize: 11.5, lineHeight: 16, color: SUB },
  csm: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 18, backgroundColor: Colors.lavender },
  csmT: { fontFamily: Font.body800, fontSize: 12.5, lineHeight: 18, color: Colors.purple },
  csmX: { fontFamily: Font.body900, fontSize: 12.5, lineHeight: 18 },
  // 칸이 여러 줄로 늘면 얼굴 · 보내기는 아래 줄에 맞춰요 (최대 줄 수는 GrowInput maxLines)
  csf: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingTop: 10, paddingHorizontal: 18, borderTopWidth: 1.5, borderColor: Colors.line, backgroundColor: Colors.cream },
  csIn: { flex: 1, minHeight: 46, paddingTop: 12, paddingBottom: 12, paddingHorizontal: 16, borderRadius: 23, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, fontFamily: Font.body600, fontSize: 15, lineHeight: 21, color: Colors.ink, includeFontPadding: false },
  sendBtn: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.yellow, alignItems: 'center', justifyContent: 'center' },
  pressed: { transform: [{ scale: 0.94 }] },
});
