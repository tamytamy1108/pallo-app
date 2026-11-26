import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router/js-stack';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, Platform, StyleSheet, type TextInputInstance, useWindowDimensions, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedKeyboard, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { GrowInput } from '@/components/ui/grow-input';
import { Pressable } from '@/components/ui/pressable';
import { ProfileTap } from '@/components/common/profile-tap';
import { CARD, SCREEN } from '@/lib/transitions';
import { CommentsSheet } from '@/components/common/comments-sheet';
import { isBlocked } from '@/components/common/report-sheet';
import { guardMember } from '@/components/common/trial-guide';
import { Face } from '@/components/lounge/face';
import { LgIcon } from '@/components/lounge/icons';
import { LgButton } from '@/components/lounge/lg-button';
import { go } from '@/components/lounge/nav';
import { isDarkBg } from '@/components/lounge/pics';
import { PlacedSticker } from '@/components/lounge/story-sticker';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { branchOk, LG_C, LG_SCAT, type Story, STORY_CATS } from '@/data/lounge';
import { addStoryComment, dropStory, getLounge, isRecent, markSeen, restoreStory, setStoryPin, storyComments, type StoryGroup, storyGroups, toggleStoryLike, useLounge } from '@/data/lounge-store';
import { isMember } from '@/state/access';
import { useMe } from '@/state/me';
import { HeartPop } from '@/components/ui/heart-pop';
import { FramedImage } from '@/components/ui/photo-frame';
import { useKeyboardShown } from '@/lib/keyboard';
import { whenLabel } from '@/lib/when';

const DUR = 5000;

/**
 * 스토리 보기 (프로토타입 lgStoryOpen · lgStoryShow · #lgStory).
 * 전체 화면 · 5초씩 넘어가요. 왼쪽 / 오른쪽 누르기로 이동, 누르고 있으면 멈춤. 사람 → 다음 사람 → … → 하이라이트 순.
 * 아래: '○○에게 댓글 달기'(공개 댓글) + 보내기 · ♡ · 💬(전체 댓글 창). 번개 · 파티 스토리는 [참여하기]. 내 스토리는 위쪽 이름 줄에 작은 '지우기'.
 */
export default function StoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const me = useMe();
  const insets = useSafeAreaInsets();
  // 키보드가 올라오면 홈 바 자리 여백은 빼요 (입력칸과 키보드 사이가 뜨지 않게)
  const kb = useKeyboardShown();
  // 댓글 줄 · 뒤 판은 키보드와 같은 프레임에 움직여요 (아이폰 · UI 스레드). 안드로이드는 창이 줄어서 0
  const kbA = useAnimatedKeyboard();
  const IOS_KB = Platform.OS === 'ios';
  const footLift = useAnimatedStyle(() => ({ bottom: IOS_KB ? kbA.height.value : 0 }));
  const backLift = useAnimatedStyle(() => ({ height: (IOS_KB ? kbA.height.value : 0) + 84 }));
  // 연 순간의 묶음 순서를 그대로 써요 (보는 동안 '본 것'이 바뀌어도 순서가 흔들리지 않게)
  const [groups, setGroups] = useState<StoryGroup[]>(() => {
    const s = getLounge();
    return storyGroups(s, (x: Story) => branchOk(s.brs, x.br) && !isBlocked(x.who), STORY_CATS);
  });
  const [pos, setPos] = useState<{ gi: number; i: number; end?: boolean }>(() => {
    const gid = decodeURIComponent(String(id ?? ''));
    const gi = Math.max(
      0,
      groups.findIndex((g) => g.id === gid),
    );
    const L = groups[gi]?.list ?? [];
    const seen = getLounge().seen;
    return {
      gi,
      i: Math.max(
        0,
        L.findIndex((x) => !seen[x.id]),
      ),
    };
  });
  const group = groups[pos.gi];
  const st = group?.list[pos.i];
  const close = useCallback(() => (router.canGoBack() ? router.back() : router.replace('/lounge')), []);

  // ---- 넘기기 ----
  const next = useCallback(() => {
    setPos((p) => {
      const L = groups[p.gi]?.list ?? [];
      if (p.i < L.length - 1) return { gi: p.gi, i: p.i + 1 };
      if (p.gi < groups.length - 1) return { gi: p.gi + 1, i: 0 };
      return { ...p, end: true };
    });
  }, [groups]);
  // 마지막 스토리까지 보면 닫아요
  useEffect(() => {
    if (pos.end) close();
  }, [pos.end, close]);
  const prev = () =>
    setPos((p) => {
      if (p.i > 0) return { gi: p.gi, i: p.i - 1 };
      if (p.gi > 0) return { gi: p.gi - 1, i: groups[p.gi - 1].list.length - 1 };
      return { ...p };
    });

  // ---- 진행 막대 · 멈춤 ----
  const prog = useSharedValue(0);
  const holds = useRef(new Set<string>());
  const run = useCallback(
    (from: number) => {
      prog.set(from);
      prog.set(
        withTiming(1, { duration: (1 - from) * DUR, easing: Easing.linear }, (fin) => {
          if (fin) scheduleOnRN(next);
        }),
      );
    },
    [prog, next],
  );
  const pause = (why: string, on: boolean) => {
    const was = holds.current.size > 0;
    if (on) holds.current.add(why);
    else holds.current.delete(why);
    const now = holds.current.size > 0;
    if (now && !was) cancelAnimation(prog);
    if (!now && was) run(prog.get());
  };
  // ---- 아래로 끌어 닫기 (인스타 스토리처럼) ----
  const { width: winW, height: winH } = useWindowDimensions();
  const pullY = useSharedValue(0);
  // 끄는 동안은 진행 막대를 멈춰요
  const [pulling, setPulling] = useState(false);
  useEffect(() => {
    pause('pull', pulling);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pulling]);
  const pullDown = Gesture.Pan()
    .activeOffsetY(14)
    .failOffsetX([-24, 24])
    .onStart(() => {
      scheduleOnRN(setPulling, true);
    })
    .onUpdate((e) => {
      pullY.set(Math.max(0, e.translationY));
    })
    .onEnd((e) => {
      if (e.translationY > 110 || e.velocityY > 900) {
        pullY.set(withTiming(winH, { duration: 220 }, (done) => {
          if (done) scheduleOnRN(close);
        }));
      } else {
        pullY.set(withTiming(0, { duration: 200 }));
        scheduleOnRN(setPulling, false);
      }
    });
  // ---- 다른 사람 스토리로 넘어갈 때: 옆에서 밀려 들어오며 살짝 커져요 (같은 사람 안에서는 그대로) ----
  const still = useReducedMotion();
  const swap = useSharedValue(0);
  const lastGi = useRef(pos.gi);
  useEffect(() => {
    if (lastGi.current === pos.gi) return;
    const dir = pos.gi > lastGi.current ? 1 : -1;
    lastGi.current = pos.gi;
    if (still) return;
    swap.set(dir);
    swap.set(withTiming(0, { duration: 340, easing: Easing.out(Easing.cubic) }));
  }, [pos.gi, still, swap]);
  const pullStyle = useAnimatedStyle(() => {
    const y = pullY.get();
    const k = swap.get();
    const a = Math.abs(k);
    return {
      opacity: 1 - a * 0.5,
      transform: [{ perspective: 900 }, { translateX: k * winW * 0.4 }, { translateY: y }, { scale: (1 - Math.min(y / winH, 1) * 0.12) * (1 - a * 0.08) }, { rotateY: `${-k * 18}deg` }],
      borderRadius: y > 0 || a > 0.01 ? 24 : 0,
    };
  });

  useEffect(() => {
    if (!st) return;
    markSeen(st.id);
    if (holds.current.size === 0) run(0);
    else prog.set(0);
    return () => cancelAnimation(prog);
  }, [st, run, prog]);

  const [cmtOpen, setCmtOpen] = useState(false);
  const [text, setText] = useState('');
  const liked = useLounge((s) => (st ? !!s.sliked[st.id] : false));
  const cmts = useLounge((s) => (st ? storyComments(s, st.id) : storyComments(s, '')));
  const pinned = useLounge((s) => (st ? !!s.stories.find((x) => x.id === st.id)?.pin : false));
  const input = useRef<TextInputInstance>(null);

  const openCmts = (v: boolean) => {
    setCmtOpen(v);
    pause('sheet', v);
  };
  const send = () => {
    const v = text.trim();
    if (!st || !v) return input.current?.focus();
    guardMember(() => {
      addStoryComment(st.id, me.name, v);
      setText('');
      input.current?.blur();
      showToast('댓글을 남겼어요', { label: '보기', onPress: () => openCmts(true) });
    }, '댓글을 달려면');
  };
  const drop = (msg: string) => {
    if (!st) return;
    const gone = st;
    dropStory(gone.id);
    showToast(msg, { label: '되돌리기', onPress: () => restoreStory(gone) });
    const L = group.list.filter((x) => x.id !== gone.id);
    if (!L.length) {
      const G = groups.filter((_, k) => k !== pos.gi);
      if (pos.gi >= G.length) return setPos({ ...pos, end: true });
      setGroups(G);
      setPos({ gi: pos.gi, i: 0 });
      return;
    }
    setGroups(groups.map((g, k) => (k === pos.gi ? { ...g, list: L } : g)));
    setPos({ gi: pos.gi, i: Math.min(pos.i, L.length - 1) });
  };

  // 아래 조작 줄(댓글 · 참여 · 매니저 도구) 높이 — 글 · 캐릭터를 그 위에만 놓아 겹치지 않게
  const [footH, setFootH] = useState(0);
  const barStyle = useAnimatedStyle(() => ({ width: `${prog.get() * 100}%` }));
  const fresh = useMemo(() => (st ? !getLounge().seen[st.id] : false), [st]);
  if (!group || !st) return null;
  const c = LG_SCAT[st.cat];
  const top = Math.max(insets.top, 16);
  const recent = isRecent(st);
  const manager = me.role === 'manager';
  // 사진 위 글 스티커로 올린 스토리는 글을 사진 위 그 자리에 보여요 (아래 큰 글씨는 안 써요)
  const lbl = st.img && st.big ? st.lbl : undefined;
  const sticker = !!lbl;
  // 예전에 올린 내 스토리에 남은 안내 글('24시간 동안 …' · '커뮤니티 피드에도 올렸어요')은 보이지 않아요
  const ds = st.mine && (st.ds.startsWith('24시간') || st.ds.includes('피드에도 올렸어요')) ? '' : st.ds;
  // 노란 · 밝은 배경에서는 노란 글씨가 안 보여요 → 흰 글씨로
  const accent = { color: isDarkBg(st.art[0]) ? Colors.yellow : '#fff' };
  return (
    <GestureDetector gesture={pullDown}>
    <Animated.View style={[styles.root, { backgroundColor: c.bg }, pullStyle]}>
      <Stack.Screen options={{ ...SCREEN.fade, cardStyle: { ...CARD, backgroundColor: c.bg } }} />
      {/* 사진이 화면을 꽉 채우고 (예시는 큰 글씨 그림), 위 · 아래만 살짝 어둡게 */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: st.art[0] }]}>
        {st.img ? <FramedImage uri={st.img} framing={st.frame} /> : <PText style={[styles.word, { top: top + 84, color: isDarkBg(st.art[0]) ? LG_C.y : Colors.ink }]}>{st.art[1]}</PText>}
      </View>
      <LinearGradient colors={['rgba(30,26,43,0.38)', 'rgba(30,26,43,0)', 'rgba(30,26,43,0)', 'rgba(30,26,43,0.78)']} locations={[0, 0.13, 0.52, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />
      {lbl ? (
        <View style={[styles.stickerLayer, { top: top + 96, bottom: (footH || 120 + insets.bottom) + 8 }]} pointerEvents="none">
          <PlacedSticker text={st.big} spot={lbl} />
        </View>
      ) : null}

      {/* 글 · 캐릭터는 아래 조작 줄 위에서만 (캐릭터도 흐름 안에 두어 버튼 · 입력칸을 덮지 않아요) */}
      <View style={[styles.content, { paddingBottom: (footH || 190 + insets.bottom) + 16 }]} pointerEvents="none">
        {st.img ? null : <Image source={require('@/assets/characters/c-upright-yellow.png')} style={styles.char} contentFit="contain" />}
        <PText style={[styles.kick, accent]}>
          {c.name}
          {st.pin ? ' · 매니저 고정' : ''}
        </PText>
        {st.big && !sticker ? <PText style={styles.big}>{st.big}</PText> : null}
        {ds ? <PText style={styles.ds}>{ds}</PText> : null}
        {st.pin || !recent ? (
          <View style={styles.note}>
            <LgIcon name={st.pin ? 'tack' : 'check'} size={14} color="rgba(255,255,255,0.8)" />
            <PText style={styles.noteText}>{st.pin ? '매니저가 고정한 소식이라 계속 남아 있어요' : `${c.name} 하이라이트에 모아 둔 스토리예요`}</PText>
          </View>
        ) : null}
      </View>

      {/* 왼쪽 / 오른쪽 누르기 · 누르고 있으면 멈춤 · 키보드가 떠 있으면 먼저 키보드만 내려요 */}
      <Pressable
        onPress={() => (Keyboard.isVisible() ? Keyboard.dismiss() : prev())}
        onPressIn={() => pause('hold', true)}
        onPressOut={() => pause('hold', false)}
        delayLongPress={250}
        accessibilityRole="button"
        accessibilityLabel="이전 스토리"
        style={[styles.tap, { top: top + 104, left: 0, width: '35%' }]}
      />
      <Pressable
        onPress={() => (Keyboard.isVisible() ? Keyboard.dismiss() : next())}
        onPressIn={() => pause('hold', true)}
        onPressOut={() => pause('hold', false)}
        delayLongPress={250}
        accessibilityRole="button"
        accessibilityLabel="다음 스토리"
        style={[styles.tap, { top: top + 104, right: 0, width: '65%' }]}
      />

      <View style={[styles.head, { paddingTop: Math.max(insets.top, 10) }]}>
        <View style={styles.bars}>
          {group.list.map((x, k) => (
            <View key={x.id} style={styles.bar}>
              {k < pos.i ? <View style={[styles.barFill, { width: '100%' }]} /> : k === pos.i ? <Animated.View style={[styles.barFill, barStyle]} /> : null}
            </View>
          ))}
        </View>
        <View style={styles.sh}>
          <ProfileTap name={st.mine ? me.name : st.who}>
            <Face name={st.mine ? me.name : st.who} bg={st.av} />
          </ProfileTap>
          <View style={styles.nm}>
            <View style={styles.nmRow}>
              <PText style={styles.name}>{st.mine ? '내 스토리' : st.who}</PText>
              {fresh ? <PText style={[styles.newtag, accent]}>● 새 글</PText> : null}
              {st.role ? <PText style={[styles.role, accent]}>{st.role}</PText> : null}
            </View>
            <PText style={styles.small} numberOfLines={1}>
              {group.kind === 'c' ? `${c.name} 하이라이트 ${pos.i + 1}/${group.list.length}` : c.name} · {st.br} · {whenLabel(st.time)}
            </PText>
          </View>
          {st.mine ? (
            <Pressable onPress={() => drop('내 스토리를 지웠어요')} accessibilityRole="button" accessibilityLabel="내 스토리 지우기" hitSlop={8} style={styles.del}>
              <PText style={styles.delText}>지우기</PText>
            </Pressable>
          ) : null}
          <Pressable onPress={close} accessibilityRole="button" accessibilityLabel="스토리 닫기" hitSlop={6} style={styles.x}>
            <LgIcon name="x" size={24} color="#fff" />
          </Pressable>
        </View>
      </View>

      {/* 댓글 줄: 키보드가 올라오면 그 높이만큼 위로 (가리지 않게) */}
      {/* 키보드가 떠 있으면 입력 줄 뒤 ~ 키보드 아래까지 어둡게 채워요 (스토리 글자가 비치거나 키보드 모서리에 틈이 보이지 않게) */}
      {kb && <Animated.View pointerEvents="none" style={[styles.kbBack, backLift]} />}
      <Animated.View
        style={[styles.foot, { paddingBottom: kb ? 12 : 22 + insets.bottom }, footLift]}
        pointerEvents="box-none"
        // 키보드가 떠 있을 땐 높이를 다시 재지 않아요 (글이 키보드 따라 출렁이지 않게)
        onLayout={(e) => (kb ? undefined : setFootH(e.nativeEvent.layout.height))}>
        {manager ? (
          <View style={styles.mgr}>
            <LgIcon name="shield" size={15} color="#fff" />
            <PText style={styles.mgrText}>매니저 도구</PText>
            <View style={styles.sp} />
            <MgrButton
              label={pinned ? '고정 풀기' : '고정하기'}
              on={pinned}
              onPress={() => {
                setStoryPin(st.id, !pinned);
                showToast(!pinned ? `고정했어요 · ${c.name} 하이라이트 맨 앞에 계속 남아요` : '고정을 풀었어요');
              }}
            />
            <MgrButton label="내리기" onPress={() => drop(`${st.who}의 스토리를 내렸어요`)} />
          </View>
        ) : null}
        {st.meet ? (
          <View style={styles.sf}>
            <LgButton label="참여하기" wide height={48} fontSize={14.5} onPress={() => guardMember(() => go(`/events/${st.meet}`), '참여하려면')} />
          </View>
        ) : null}
        <View style={[styles.sf, styles.sfc]}>
          <View style={styles.sin}>
            <GrowInput
              ref={input}
              maxLines={4}
              ring={false}
              submitBehavior="submit"
              value={text}
              onChangeText={setText}
              placeholder={st.mine ? '내 스토리에 댓글 달기' : `${st.who}에게 댓글 달기`}
              placeholderTextColor="#8C8597"
              onFocus={() => (!isMember(me) ? (input.current?.blur(), guardMember(() => undefined, '댓글을 달려면')) : pause('input', true))}
              onBlur={() => pause('input', false)}
              onSubmitEditing={send}
              returnKeyType="send"
              style={styles.sinInput}
              accessibilityLabel="스토리 댓글 쓰기"
            />
            <Pressable onPress={send} accessibilityRole="button" accessibilityLabel="댓글 올리기" style={styles.sinSend}>
              <LgIcon name="send" size={18} />
            </Pressable>
          </View>
          <SquareButton label="좋아요" selected={liked} onPress={() => toggleStoryLike(st.id)}>
            <HeartPop on={liked}><LgIcon name="heart" size={20} fill={liked ? LG_C.pk : 'none'} /></HeartPop>
          </SquareButton>
          <SquareButton label="댓글 보기" onPress={() => openCmts(true)}>
            <LgIcon name="cmt" size={20} />
          </SquareButton>
        </View>
      </Animated.View>

      <CommentsSheet open={cmtOpen} onClose={() => openCmts(false)} comments={cmts} onSend={(t) => guardMember(() => addStoryComment(st.id, me.name, t), '댓글을 달려면')} />
    </Animated.View>
    </GestureDetector>
  );
}

function MgrButton({ label, on = false, onPress }: { label: string; on?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" hitSlop={6} style={({ pressed }) => [styles.mgrBtn, on && { backgroundColor: Colors.yellow }, pressed && { transform: [{ scale: 0.96 }] }]}>
      <PText style={styles.mgrBtnText}>{label}</PText>
    </Pressable>
  );
}

/** 48px 흰 정사각 버튼 (프로토타입 .lg-btn.wh.ic) */
function SquareButton({ label, selected, onPress, children }: { label: string; selected?: boolean; onPress: () => void; children: ReactNode }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected }}>
      {({ pressed }) => <View style={[styles.sq, pressed ? styles.sqDown : null]}>{children}</View>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  word: { position: 'absolute', left: 20, right: 16, fontFamily: Font.display, fontSize: 76, lineHeight: 68.4, letterSpacing: -3 },
  char: { alignSelf: 'flex-end', marginRight: -42, marginBottom: 4, width: '50%', maxWidth: 200, aspectRatio: 1.569 },
  stickerLayer: { position: 'absolute', left: 0, right: 0 },
  content: { ...StyleSheet.absoluteFill, paddingHorizontal: 20, justifyContent: 'flex-end', gap: 8 },
  kick: { fontFamily: Font.display, fontSize: 11, lineHeight: 16, letterSpacing: 0.3, color: Colors.yellow },
  big: { fontFamily: Font.display, fontSize: 30, lineHeight: 34.5, letterSpacing: -1, color: '#fff', textShadowColor: 'rgba(30,26,43,0.35)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 12 },
  ds: { fontFamily: Font.body700, fontSize: 14, lineHeight: 22.4, color: 'rgba(255,255,255,0.92)' },
  note: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  noteText: { fontFamily: Font.body800, fontSize: 12, lineHeight: 17, color: 'rgba(255,255,255,0.8)' },
  tap: { position: 'absolute', height: 650 },
  head: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 16 },
  bars: { flexDirection: 'row', gap: 4, height: 4 },
  bar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.35)', overflow: 'hidden' },
  barFill: { height: 4, backgroundColor: '#fff' },
  sh: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 12 },
  nm: { flex: 1, minWidth: 0 },
  nmRow: { flexDirection: 'row', alignItems: 'baseline' },
  name: { fontFamily: Font.body900, fontSize: 14, lineHeight: 16.8, color: '#fff' },
  newtag: { fontFamily: Font.body900, fontSize: 11.5, lineHeight: 13.8, color: Colors.yellow, marginLeft: 7 },
  role: { fontFamily: Font.body900, fontSize: 11, lineHeight: 13.2, color: Colors.yellow, marginLeft: 5 },
  small: { fontFamily: Font.body700, fontSize: 11.5, lineHeight: 13.8, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  x: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  del: { height: 28, paddingHorizontal: 8, justifyContent: 'center' },
  delText: { fontFamily: Font.body700, fontSize: 12, lineHeight: 16, color: 'rgba(255,255,255,0.72)' },
  foot: { position: 'absolute', left: 16, right: 16, bottom: 0 },
  kbBack: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(30,26,43,0.92)' },
  sp: { flex: 1 },
  mgr: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 12, paddingTop: 6, paddingRight: 8, paddingBottom: 6, paddingLeft: 12 },
  mgrText: { fontFamily: Font.body900, fontSize: 12.5, lineHeight: 17, color: '#fff' },
  mgrBtn: { height: 32, borderRadius: 10, borderWidth: 2, borderColor: Colors.ink, backgroundColor: '#fff', paddingHorizontal: 10, justifyContent: 'center' },
  mgrBtnText: { fontFamily: Font.body900, fontSize: 12.5, lineHeight: 17 },
  sf: { flexDirection: 'row', gap: 10, marginTop: 14 },
  sfc: { gap: 8 },
  // 길게 쓰면 위로 한 줄씩 늘어요 (4줄까지) · 보내기는 아래 줄에 맞춰요 · 안드로이드 글자 잘림 없게 includeFontPadding 끔
  sin: { flex: 1, minHeight: 48, flexDirection: 'row', alignItems: 'flex-end', backgroundColor: '#fff', borderWidth: 2, borderColor: Colors.ink, borderRadius: 24, paddingLeft: 16, paddingRight: 5, boxShadow: `3px 3px 0px ${Colors.ink}` },
  sinInput: { flex: 1, minHeight: 44, paddingVertical: 12, includeFontPadding: false, fontFamily: Font.body700, fontSize: 14, lineHeight: 20, color: Colors.ink },
  sinSend: { width: 36, height: 36, marginBottom: 4, borderRadius: 18, backgroundColor: Colors.yellow, borderWidth: 2, borderColor: Colors.ink, alignItems: 'center', justifyContent: 'center' },
  sq: { width: 48, height: 48, borderRadius: 20, backgroundColor: '#fff', borderWidth: 2, borderColor: Colors.ink, alignItems: 'center', justifyContent: 'center', boxShadow: `3px 3px 0px ${Colors.ink}` },
  sqDown: { transform: [{ translateX: 3 }, { translateY: 3 }], boxShadow: `0px 0px 0px ${Colors.ink}` },
});
