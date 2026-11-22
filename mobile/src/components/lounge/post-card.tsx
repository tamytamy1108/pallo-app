import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import { CommentsSheet } from '@/components/common/comments-sheet';
import { type ReportMenuItem, ReportSheet } from '@/components/common/report-sheet';
import { guardMember } from '@/components/common/trial-guide';
import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { type Abroad, LANG_COLOR, LG_C, LG_LIKERS, memberLangs, nameHash, type Post } from '@/data/lounge';
import { addPostComment, hideMember, likeOn, postComments, toggleLike, toggleSave, unhideMember, useLounge } from '@/data/lounge-store';
import { SPRING } from '@/lib/motion';
import { useMe } from '@/state/me';

import { Face } from './face';
import { LgIcon } from './icons';
import { LgButton } from './lg-button';
import { go } from './nav';
import { PIC_BG, PostArt } from './pics';

/** 글 머리: 프로필 · 이름 · 역할 · 학습 언어 · 지점 · 시간 · ⋯ (프로토타입 lgWho) */
export function Who({ who, av, role, sub, onMore, dark = false }: { who: string; av: string; role?: string; sub: string; onMore?: () => void; dark?: boolean }) {
  const me = useMe();
  const langs = memberLangs(who, me.name);
  return (
    <View style={styles.who}>
      <Pressable onPress={() => go(`/me/profile/${encodeURIComponent(who)}`)} accessibilityRole="button" accessibilityLabel={`${who} 프로필`}>
        <Face name={who} bg={av} />
      </Pressable>
      <Pressable onPress={() => go(`/me/profile/${encodeURIComponent(who)}`)} accessibilityRole="button" accessibilityLabel={`${who} 프로필`} style={styles.nm}>
        <View style={styles.nmRow}>
          <PText style={[styles.name, dark && { color: '#fff' }]} numberOfLines={1}>
            {who}
          </PText>
          {role ? <PText style={[styles.role, dark && { color: LG_C.y }]}>{role}</PText> : null}
          {langs.length ? (
            <PText style={styles.langs} accessibilityLabel={`학습 언어 ${langs.join(' · ')}`}>
              {langs.map((l, i) => (
                <PText key={l}>
                  {i ? <PText style={styles.langDot}> · </PText> : null}
                  <PText style={[styles.lang, { color: LANG_COLOR[l] }]}>{l}</PText>
                </PText>
              ))}
            </PText>
          ) : null}
        </View>
        <PText style={[styles.sub, dark && { color: 'rgba(255,255,255,.75)' }]} numberOfLines={1}>
          {sub}
        </PText>
      </Pressable>
      {onMore ? (
        <Pressable onPress={onMore} accessibilityRole="button" accessibilityLabel={`${who} 글 더보기`} hitSlop={4} style={styles.ib}>
          <LgIcon name="more" size={22} />
        </Pressable>
      ) : null}
    </View>
  );
}

/** 하트 · 댓글 · 보내기 · 저장 줄 (프로토타입 lgActs) — 수는 아이콘 바로 옆 */
function Acts({ id, likes, cmts, onCmt, onLikers }: { id: string; likes: number; cmts: number; onCmt: () => void; onLikers: () => void }) {
  const liked = useLounge((s) => !!s.liked[id]);
  const saved = useLounge((s) => !!s.saved[id]);
  const n = likes + (liked ? 1 : 0);
  return (
    <View style={styles.acts}>
      <PopButton label="좋아요" pressed={liked} onPress={() => toggleLike(id)} popKey={liked ? 1 : 0}>
        <LgIcon name="heart" size={25} fill={liked ? LG_C.pk : 'none'} />
      </PopButton>
      <Pressable onPress={onLikers} accessibilityRole="button" accessibilityLabel="좋아요 누른 사람 보기" style={styles.cnt}>
        <PText style={styles.cntText}>{n || ''}</PText>
      </Pressable>
      <Pressable onPress={onCmt} accessibilityRole="button" accessibilityLabel="댓글" style={styles.ib}>
        <LgIcon name="cmt" size={24} />
      </Pressable>
      <Pressable onPress={onCmt} accessibilityRole="button" accessibilityLabel="댓글 보기" style={styles.cnt}>
        <PText style={styles.cntText}>{cmts || ''}</PText>
      </Pressable>
      <Pressable onPress={() => showToast('링크를 복사했어요')} accessibilityRole="button" accessibilityLabel="보내기" style={styles.ib}>
        <LgIcon name="send" size={23} />
      </Pressable>
      <View style={styles.sp} />
      <Pressable onPress={() => showToast(toggleSave(id) ? '라운지 저장함에 담았어요' : '저장을 취소했어요')} accessibilityRole="button" accessibilityLabel="저장" accessibilityState={{ selected: saved }} style={styles.ib}>
        <LgIcon name="save" size={23} fill={saved ? LG_C.y : 'none'} />
      </Pressable>
    </View>
  );
}

/** 누르면 톡 커지는 아이콘 버튼 (프로토타입 .lg-ib.pop · lgPop .4s) */
function PopButton({ label, pressed, onPress, popKey, children }: { label: string; pressed: boolean; onPress: () => void; popKey: number; children: React.ReactNode }) {
  const still = useReducedMotion();
  const s = useSharedValue(1);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!still) s.set(withSequence(withTiming(1.3, { duration: 200, easing: SPRING }), withTiming(1, { duration: 200, easing: SPRING })));
  }, [popKey, still, s]);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: s.get() }] }));
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: pressed }} style={styles.ib}>
      <Animated.View style={a}>{children}</Animated.View>
    </Pressable>
  );
}

/** 사진 칸: 한 번 누르면 다음 장 · 두 번 누르면 좋아요(하트 터짐) · 옆으로 밀면 넘기기 (프로토타입 lgPic) */
function Pic({ p }: { p: Post }) {
  const [i, setI] = useState(0);
  const lastTap = useRef(0);
  const startX = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const still = useReducedMotion();
  const burst = useSharedValue(0);
  useEffect(() => () => clearTimeout(timer.current), []);
  const go = (d: number) => setI((x) => (x + d + p.n) % p.n);
  const onTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 320) {
      lastTap.current = 0;
      clearTimeout(timer.current);
      likeOn(p.id);
      if (!still) burst.set(withSequence(withTiming(0, { duration: 0 }), withTiming(1, { duration: 800 })));
      return;
    }
    lastTap.current = now;
    if (p.n > 1) timer.current = setTimeout(() => go(1), 330);
  };
  const burstStyle = useAnimatedStyle(() => {
    const t = burst.get();
    const sc = t < 0.3 ? (t / 0.3) * 1.15 : t < 0.7 ? 1.15 - ((t - 0.3) / 0.4) * 0.15 : 1;
    const op = t === 0 ? 0 : t < 0.3 ? t / 0.3 : t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;
    return { opacity: op, transform: [{ scale: sc }] };
  });
  const img = p.imgs?.[i] ?? p.imgs?.[0];
  if (!p.pic && !img) return null;
  return (
    <View>
      <View style={styles.picShadow}>
        <Pressable
          onPressIn={(e) => (startX.current = e.nativeEvent.pageX)}
          onPressOut={(e) => {
            const dx = e.nativeEvent.pageX - startX.current;
            if (p.n > 1 && Math.abs(dx) >= 40) {
              lastTap.current = 0;
              go(dx < 0 ? 1 : -1);
            }
          }}
          onPress={onTap}
          accessibilityRole="imagebutton"
          accessibilityLabel={`${p.who}의 사진${p.n > 1 ? ` ${i + 1}/${p.n} · 누르면 다음 장` : ''} · 두 번 누르면 좋아요`}
          style={[styles.pic, img ? { aspectRatio: p.ratio ?? 1, height: undefined, backgroundColor: Colors.ink } : { backgroundColor: PIC_BG[p.pic ?? 'party'] }]}>
          {img ? <Image source={{ uri: img }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <PostArt pic={p.pic ?? 'party'} uid={p.id} />}
          {p.n > 1 ? (
            <View style={styles.picCnt}>
              <PText style={styles.picCntText}>
                {i + 1}/{p.n}
              </PText>
            </View>
          ) : null}
          <Animated.View style={[styles.burst, burstStyle]} pointerEvents="none">
            <LgIcon name="heart" size={86} fill={LG_C.pk} sw={1.6} />
          </Animated.View>
        </Pressable>
      </View>
      {p.n > 1 ? (
        <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {Array.from({ length: p.n }, (_, k) => (
            <View key={k} style={[styles.dot, k === i && styles.dotOn]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** 커뮤니티 사진 글 카드 (프로토타입 LG_CARD.post) */
export function PostCard({ p }: { p: Post }) {
  const me = useMe();
  const cmts = useLounge((s) => postComments(s, p));
  const [sheet, setSheet] = useState<null | 'cmt' | 'more' | 'likers'>(null);
  return (
    <View>
      <Who who={p.who} av={p.av} role={p.role} sub={`${p.br}${p.club ? ` · ${p.club}` : ''} · ${p.time}`} onMore={() => setSheet('more')} />
      <Pic p={p} />
      <Acts id={p.id} likes={p.likes} cmts={cmts.length} onCmt={() => setSheet('cmt')} onLikers={() => setSheet('likers')} />
      <PText style={styles.capt}>
        <PText style={styles.captWho}>{p.who} </PText>
        {p.text}
      </PText>
      <CommentsSheet open={sheet === 'cmt'} onClose={() => setSheet(null)} comments={cmts} onSend={(t) => guardMember(() => addPostComment(p, me.name, t), '댓글을 달려면')} />
      <PostMenu open={sheet === 'more'} who={p.who} onClose={() => setSheet(null)} />
      <LikersSheet open={sheet === 'likers'} id={p.id} who={p.who} likes={p.likes} onClose={() => setSheet(null)} />
    </View>
  );
}

/** 해외살이 이야기 카드 (프로토타입 LG_CARD.abroad) */
export function AbroadCard({ p }: { p: Abroad }) {
  const me = useMe();
  const cmts = useLounge((s) => postComments(s, p));
  const [sheet, setSheet] = useState<null | 'cmt' | 'more' | 'likers' | 'ask'>(null);
  return (
    <View>
      <Who who={p.who} av={p.av} sub={`${p.br} · ${p.time}`} onMore={() => setSheet('more')} />
      <View style={styles.abShadow}>
        <View style={styles.ab}>
          <View style={styles.abTop}>
            <PText style={styles.kick}>{p.kick}</PText>
            <PText style={styles.abT}>{p.title}</PText>
            <View style={styles.stamp}>
              <PText style={styles.stampText}>{p.cc}</PText>
            </View>
          </View>
          <PText style={styles.abBd}>{p.body}</PText>
          <View style={styles.abRow}>
            <LgButton label={`${p.who}에게 질문하기`} height={40} onPress={() => guardMember(() => setSheet('ask'), '질문하려면')} />
          </View>
        </View>
      </View>
      <Acts id={p.id} likes={p.likes} cmts={cmts.length} onCmt={() => setSheet('cmt')} onLikers={() => setSheet('likers')} />
      <CommentsSheet open={sheet === 'cmt'} onClose={() => setSheet(null)} comments={cmts} onSend={(t) => guardMember(() => addPostComment(p, me.name, t), '댓글을 달려면')} />
      <PostMenu open={sheet === 'more'} who={p.who} onClose={() => setSheet(null)} />
      <LikersSheet open={sheet === 'likers'} id={p.id} who={p.who} likes={p.likes} onClose={() => setSheet(null)} />
      <AskSheet open={sheet === 'ask'} who={p.who} sub={p.br} onClose={() => setSheet(null)} />
    </View>
  );
}

/** ⋯ 글 메뉴 (프로토타입 lgMore): 링크 복사 · (리더 · 매니저) 공지 고정 · 숨기기 · 신고 · 차단 — 공통 신고 · 차단 시트 */
function PostMenu({ open, who, onClose }: { open: boolean; who: string; onClose: () => void }) {
  const me = useMe();
  const staff = me.role === 'leader' || me.role === 'manager';
  const extra: ReportMenuItem[] = staff
    ? [
        { key: 'pin', label: '공지로 고정', sub: '리더 · 매니저 도구', onPress: () => (onClose(), showToast('공지로 고정했어요')) },
        {
          key: 'hide',
          label: '이 글 숨기기',
          sub: '작성자에게 알림이 가요',
          onPress: () => {
            onClose();
            hideMember(who);
            showToast('글을 숨겼어요', { label: '되돌리기', onPress: () => unhideMember(who) });
          },
        },
      ]
    : [];
  return <ReportSheet open={open} onClose={onClose} target={{ kind: 'post', name: who }} extra={extra} />;
}

/** 좋아요 누른 사람 (30명까지 · 내가 눌렀으면 맨 위에 나) — 프로토타입 lgLikers */
export function LikersSheet({ open, id, who, likes, onClose }: { open: boolean; id: string; who: string; likes: number; onClose: () => void }) {
  const me = useMe();
  const liked = useLounge((s) => !!s.liked[id]);
  const n = likes + (liked ? 1 : 0);
  const pool = LG_LIKERS.filter(([x]) => x !== who);
  const h = nameHash(id);
  const show = Math.min(n, 30);
  const L: [string, string, string, boolean][] = [
    ...(liked ? [[me.name, LG_C.y, me.branch, true] as [string, string, string, boolean]] : []),
    ...Array.from({ length: show - (liked ? 1 : 0) }, (_, i): [string, string, string, boolean] => {
      const [x, c, b] = pool[(h + i) % pool.length];
      return [i >= pool.length ? x + (Math.floor(i / pool.length) + 1) : x, c, b, false];
    }),
  ];
  return (
    <Sheet open={open} onClose={onClose} title={`좋아요 ${n}개`}>
      <PText style={styles.ds}>{who}님의 글</PText>
      <View>
        {L.map(([x, c, b, mine], i) => (
          <View key={`${x}${i}`} style={[styles.mrow, i > 0 && styles.mrowLine]}>
            <Face name={x.replace(/\d+$/, '')} bg={c} />
            <PText style={styles.mName}>{x}</PText>
            {mine ? <PText style={styles.mMe}>나</PText> : null}
            <PText style={styles.mBr} numberOfLines={1}>
              {b}
            </PText>
            <View style={styles.sp} />
            <LgIcon name="heart" size={16} fill={LG_C.pk} color={LG_C.pk} />
          </View>
        ))}
      </View>
      {n > show ? <PText style={[styles.ds, { textAlign: 'center' }]}>외 {n - show}명이 좋아해요</PText> : null}
    </Sheet>
  );
}

/** ○○에게 질문하기 (프로토타입 lgAsk) */
export function AskSheet({ open, who, sub, onClose }: { open: boolean; who: string; sub: string; onClose: () => void }) {
  const [v, setV] = useState('');
  const send = () => {
    if (!v.trim()) return;
    onClose();
    setV('');
    showToast(`${who}에게 질문을 보냈어요`);
  };
  return (
    <Sheet open={open} onClose={onClose} title={`${who}에게 질문하기`} footer={<LgButton label="질문 보내기" wide height={50} onPress={send} />}>
      <PText style={styles.ds}>
        {sub}
        {'\n'}답이 오면 알림으로 알려 드려요.
      </PText>
      <TextInput value={v} onChangeText={setV} multiline placeholder="예) 집 구할 때 보증금은 보통 얼마였어요?" placeholderTextColor="#8C8597" style={styles.ta} accessibilityLabel="질문 입력" />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  who: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingBottom: 9 },
  nm: { flex: 1, minWidth: 0 },
  nmRow: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'nowrap' },
  name: { fontFamily: Font.body900, fontSize: 14, lineHeight: 16.8, flexShrink: 1 },
  role: { fontFamily: Font.body900, fontSize: 11, lineHeight: 13.2, color: Colors.purple, marginLeft: 5 },
  langs: { marginLeft: 6, fontFamily: Font.body900, fontSize: 11.5, lineHeight: 13.8 },
  lang: { fontFamily: Font.body900, fontSize: 11.5, lineHeight: 13.8 },
  langDot: { fontFamily: Font.body900, fontSize: 11.5, color: Colors.inkSub },
  sub: { fontFamily: Font.body700, fontSize: 11.5, lineHeight: 13.8, color: Colors.inkSub, marginTop: 2 },
  ib: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  picShadow: { borderRadius: 20, boxShadow: `4px 4px 0px ${Colors.ink}` },
  pic: { height: 330, borderRadius: 20, borderWidth: 2, borderColor: Colors.ink, overflow: 'hidden' },
  picCnt: { position: 'absolute', right: 12, top: 12, backgroundColor: Colors.ink, borderRadius: 10, paddingVertical: 4, paddingHorizontal: 8 },
  picCntText: { fontFamily: Font.display, fontSize: 11, lineHeight: 14, color: '#fff' },
  burst: { position: 'absolute', left: '50%', top: '50%', marginLeft: -43, marginTop: -43 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: 9 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#CFC6B4' },
  dotOn: { width: 16, backgroundColor: Colors.purple },
  acts: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 16, marginHorizontal: -6, marginBottom: 2 },
  cnt: { paddingVertical: 6, paddingHorizontal: 2, marginLeft: -9, marginRight: 2, minHeight: 33, justifyContent: 'center' },
  cntText: { fontFamily: Font.body800, fontSize: 15, lineHeight: 21 },
  sp: { flex: 1 },
  capt: { fontFamily: Font.body600, fontSize: 13.5, lineHeight: 20.9, marginTop: 4 },
  captWho: { fontFamily: Font.body900 },
  abShadow: { borderRadius: 20, boxShadow: `4px 4px 0px ${Colors.ink}` },
  ab: { backgroundColor: '#fff', borderWidth: 2, borderColor: Colors.ink, borderRadius: 20, overflow: 'hidden' },
  abTop: { backgroundColor: LG_C.sky, borderBottomWidth: 2, borderColor: Colors.ink, paddingTop: 14, paddingBottom: 14, paddingLeft: 16, paddingRight: 76 },
  kick: { fontFamily: Font.display, fontSize: 11, lineHeight: 16, letterSpacing: 0.3 },
  abT: { fontFamily: Font.body900, fontSize: 17, lineHeight: 22.95, marginTop: 6 },
  stamp: {
    position: 'absolute',
    right: 14,
    top: 13,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: LG_C.y,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-12deg' }],
  },
  stampText: { fontFamily: Font.display, fontSize: 11, lineHeight: 14 },
  abBd: { fontFamily: Font.body600, fontSize: 13, lineHeight: 20.8, paddingVertical: 12, paddingHorizontal: 16 },
  abRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16, paddingBottom: 14 },
  ds: { fontFamily: Font.body600, fontSize: 14, lineHeight: 22.4, color: Colors.inkSub },
  opts: { backgroundColor: '#fff', borderWidth: 2, borderColor: Colors.ink, borderRadius: 18, overflow: 'hidden' },
  opt: { minHeight: 54, paddingHorizontal: 16, paddingVertical: 10, justifyContent: 'center' },
  optLine: { borderTopWidth: 1, borderColor: Colors.line },
  optText: { fontFamily: Font.body800, fontSize: 15, lineHeight: 21 },
  optSub: { fontFamily: Font.body600, fontSize: 12, lineHeight: 17, color: Colors.inkSub, marginTop: 2 },
  mrow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, minHeight: 57 },
  mrowLine: { borderTopWidth: 1, borderColor: Colors.line },
  mName: { fontFamily: Font.body900, fontSize: 14, lineHeight: 19 },
  mMe: { fontFamily: Font.body900, fontSize: 11, lineHeight: 15, color: Colors.purple },
  mBr: { fontFamily: Font.body700, fontSize: 11.5, lineHeight: 16, color: Colors.inkSub, flexShrink: 1 },
  ta: {
    minHeight: 110,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: Colors.ink,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontFamily: Font.body600,
    fontSize: 14,
    lineHeight: 21,
    color: Colors.ink,
    textAlignVertical: 'top',
  },
});
