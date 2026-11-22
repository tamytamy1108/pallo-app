import * as Speech from 'expo-speech';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { CommentsSheet } from '@/components/common/comments-sheet';
import { guardMember } from '@/components/common/trial-guide';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { daysFrom, LG_C, LG_PW, meetIso, meetMonth, type RecChal, type RecMeet, won } from '@/data/lounge';
import { addPostComment, postComments, useLounge } from '@/data/lounge-store';
import { useMe } from '@/state/me';

import { Face } from './face';
import { LgIcon } from './icons';
import { LgButton } from './lg-button';
import { go } from './nav';
import { gray, PosterArt } from './pics';

/*
 * 추천 탭에 섞이는 번개 · 파티 · 표현 챌린지 카드 (프로토타입 LG_CARD.meet · LG_CARD.chal).
 * 카드의 참여하기는 바로 참여하지 않고 상세 화면을 열어요 — 상세는 번개 · 이벤트 · 챌린지 담당 화면.
 */

const meetHref = (p: RecMeet) => (p.party ? `/events/${p.id}` : `/meet/${p.id}`);

/** 인원 막대 (프로토타입 lgCapBar) */
export function CapBar({ cur, max, color = Colors.purple }: { cur: number; max: number; color?: string }) {
  return (
    <View style={styles.capb}>
      <View style={[styles.capFill, { width: `${Math.min(100, Math.round((cur / max) * 100))}%`, backgroundColor: color }]} />
    </View>
  );
}

/** 번개 · 파티 티켓 카드: 포스터가 카드 맨 위까지 · 점선 + 양옆 반원 홈 (번개만) */
export function RecMeetCard({ p }: { p: RecMeet }) {
  const me = useMe();
  const cmts = useLounge((s) => postComments(s, p));
  const [cmtOpen, setCmtOpen] = useState(false);
  const n = daysFrom(meetIso(p));
  const past = n < 0;
  const dd = n > 0 ? `D-${n}` : n === 0 ? 'D-DAY' : '지남';
  const [word, bg] = LG_PW[p.id] ?? ['NEW\nMEET', LG_C.pk];
  const ev = !!p.party;
  const full = p.cur >= p.max;
  const open = () => go(meetHref(p));
  return (
    <View style={[styles.pcShadow, { borderRadius: ev ? 22 : 16 }, past && styles.past]}>
      <View style={[styles.pc, { borderRadius: ev ? 22 : 16 }]}>
        <Pressable onPress={open} accessibilityRole="button" accessibilityLabel={`${p.title} 자세히 보기`} style={[styles.pst, !ev && styles.pstMt]}>
          <PosterArt id={p.id} word={word} bg={bg} past={past} />
          <View style={styles.tbar} pointerEvents="none">
            {ev ? <LgIcon name="crown" size={15} sw={2.4} /> : <LgIcon name="bolt" size={15} fill={Colors.ink} sw={1.6} />}
            <PText style={styles.tbarB}>{p.kind}</PText>
            <View style={styles.sp} />
            <PText style={styles.tbarDd}>{dd}</PText>
          </View>
        </Pressable>
        <View style={styles.pcb}>
          {!ev ? (
            <>
              <View style={[styles.notch, { left: -15 }]} />
              <View style={[styles.notch, { right: -15 }]} />
            </>
          ) : null}
          <Pressable onPress={open} accessibilityRole="link">
            <PText style={styles.t} numberOfLines={2}>
              {p.title}
            </PText>
          </Pressable>
          <View style={styles.m}>
            <View style={styles.mi}>
              <LgIcon name="cal" size={13} color={Colors.inkSub} />
              <PText style={styles.mt}>
                {meetMonth(p)}.{p.day} {p.wd}
              </PText>
            </View>
            <View style={styles.mi}>
              <LgIcon name="pin" size={13} color={Colors.inkSub} />
              <PText style={styles.mt}>{p.place}</PText>
            </View>
          </View>
          <View style={styles.foot}>
            <View>
              <PText style={styles.n}>
                {p.cur}/{p.max}명 · {ev ? <PText style={styles.fee}>{p.fee ? won(p.fee) : '무료'}</PText> : p.host}
              </PText>
              <CapBar cur={p.cur} max={p.max} color={past ? gray(Colors.purple) : Colors.purple} />
            </View>
            <View style={styles.sp} />
            {past ? (
              <LgButton label="후기 보기" tone="white" onPress={() => setCmtOpen(true)} />
            ) : full ? (
              <LgButton label="빈자리 알림 받기" tone="white" onPress={open} />
            ) : (
              <LgButton label="참여하기" onPress={open} />
            )}
          </View>
        </View>
      </View>
      <CommentsSheet open={cmtOpen} onClose={() => setCmtOpen(false)} comments={cmts} onSend={(t) => guardMember(() => addPostComment(p, me.name, t))} />
    </View>
  );
}

/** 표현 챌린지 카드 '나만의 문장 완성하기' (프로토타입 LG_CARD.chal · study) */
export function RecChalCard({ p }: { p: RecChal }) {
  const open = () => go(`/challenge/${p.id}`);
  const shown = p.people.slice(0, 3);
  return (
    <View style={styles.chShadow}>
      <View style={styles.ch}>
        <Pressable onPress={open} accessibilityRole="button" accessibilityLabel={`${p.hl} 챌린지 자세히 보기`} style={styles.exh}>
          <Face name={p.who} bg={p.av} size={38} />
          <View style={styles.tx}>
            <PText style={styles.chWho} numberOfLines={1}>
              <PText style={styles.chMs}>나만의 문장 완성하기</PText> · {p.who} · <PText style={styles.chLeft}>{p.left}일 남음</PText>
            </PText>
            <PText style={styles.chE}>{p.hl}</PText>
            <PText style={styles.chMean}>{p.ko}</PText>
            <View style={styles.chSrc}>
              <LgIcon name="book" size={13} color={Colors.inkSub} />
              <PText style={styles.chSrcText}>{p.src}</PText>
            </View>
          </View>
          <Pressable onPress={() => Speech.speak(p.q, { language: p.lang, rate: 0.95 })} accessibilityRole="button" accessibilityLabel="표현 듣기" style={styles.say}>
            <LgIcon name="spk" size={18} />
          </Pressable>
        </Pressable>
        <Pressable onPress={open} accessibilityRole="button" accessibilityLabel="문장 모두 보기" style={styles.chxc}>
          <View style={styles.pv}>
            <Face name={p.last[0]} bg={LG_C.lpu} size={26} />
            <PText style={styles.pvText} numberOfLines={1}>
              <PText style={styles.pvWho}>{p.last[0]}</PText> {p.last[1]}
            </PText>
          </View>
          <View style={styles.ft}>
            <View style={styles.avs}>
              {shown.map((x, i) => (
                <Face key={x} name={x} size={24} bg={LG_C.mint} style={i ? { marginLeft: -7 } : undefined} />
              ))}
              {p.people.length > 3 ? (
                <View style={styles.more}>
                  <PText style={styles.moreText}>+{p.people.length - 3}</PText>
                </View>
              ) : null}
            </View>
            <PText style={styles.chN}>
              {p.people.length}명 · 문장 {p.lines}
            </PText>
            <View style={styles.sp} />
            <LgButton label="문장 쓰기" icon={<LgIcon name="edit" size={15} />} onPress={() => guardMember(open)} />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sp: { flex: 1 },
  pcShadow: { boxShadow: `4px 4px 0px ${Colors.ink}` },
  past: { opacity: 0.8 },
  pc: { backgroundColor: '#fff', borderWidth: 2, borderColor: Colors.ink, overflow: 'hidden' },
  pst: { height: 200, borderBottomWidth: 2, borderColor: Colors.ink },
  pstMt: { borderStyle: 'dashed' },
  tbar: { position: 'absolute', top: 0, left: 0, right: 0, height: 40, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 6 },
  tbarB: { fontFamily: Font.body900, fontSize: 13, lineHeight: 19 },
  tbarDd: { fontFamily: Font.display, fontSize: 14, lineHeight: 20, letterSpacing: -0.3 },
  pcb: { paddingTop: 12, paddingHorizontal: 14, paddingBottom: 14 },
  notch: { position: 'absolute', top: -15, width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.cream, borderWidth: 2, borderColor: Colors.ink },
  t: { fontFamily: Font.body900, fontSize: 17, lineHeight: 22.1 },
  m: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 12, rowGap: 3, marginTop: 5 },
  mi: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  mt: { fontFamily: Font.body700, fontSize: 12.5, lineHeight: 19, color: Colors.inkSub },
  foot: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 11 },
  n: { fontFamily: Font.body900, fontSize: 12, lineHeight: 17 },
  fee: { fontFamily: Font.body900, fontSize: 12, color: Colors.ink },
  capb: { width: 84, height: 8, borderRadius: 4, backgroundColor: '#EEE8DA', marginTop: 4, overflow: 'hidden' },
  capFill: { height: 8, borderRadius: 4 },
  chShadow: { borderRadius: 18, boxShadow: `4px 4px 0px ${Colors.ink}` },
  ch: { backgroundColor: '#fff', borderWidth: 2, borderColor: Colors.ink, borderRadius: 18, overflow: 'hidden' },
  exh: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFF8CC', borderBottomWidth: 2, borderColor: Colors.ink, paddingTop: 10, paddingRight: 10, paddingBottom: 10, paddingLeft: 12 },
  tx: { flex: 1, minWidth: 0 },
  chWho: { fontFamily: Font.body800, fontSize: 11.5, lineHeight: 16, color: Colors.inkSub },
  chMs: { fontFamily: Font.body900, color: Colors.ink },
  chLeft: { fontFamily: Font.body900, color: Colors.purple },
  chE: { fontFamily: Font.body900, fontSize: 19, lineHeight: 22.8, marginTop: 2 },
  chMean: { fontFamily: Font.body800, fontSize: 13, lineHeight: 19, color: Colors.purple, marginTop: 2 },
  chSrc: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  chSrcText: { fontFamily: Font.body800, fontSize: 11.5, lineHeight: 16, color: Colors.inkSub },
  say: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', borderWidth: 2, borderColor: Colors.ink, alignItems: 'center', justifyContent: 'center', boxShadow: `2px 2px 0px ${Colors.ink}` },
  chxc: { paddingTop: 10, paddingRight: 12, paddingBottom: 12, paddingLeft: 14 },
  pv: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pvText: { flex: 1, fontFamily: Font.body700, fontSize: 13, lineHeight: 19 },
  pvWho: { fontFamily: Font.body900 },
  ft: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  avs: { flexDirection: 'row', alignItems: 'center' },
  more: { height: 24, minWidth: 24, borderRadius: 12, paddingHorizontal: 6, marginLeft: -7, backgroundColor: Colors.ink, borderWidth: 2, borderColor: Colors.ink, alignItems: 'center', justifyContent: 'center' },
  moreText: { fontFamily: Font.body900, fontSize: 10, lineHeight: 13, color: '#fff', letterSpacing: -0.2 },
  chN: { fontFamily: Font.body900, fontSize: 12, lineHeight: 17 },
});
