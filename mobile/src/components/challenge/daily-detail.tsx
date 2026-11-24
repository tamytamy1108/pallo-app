import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View, type LayoutChangeEvent, type ScrollViewInstance, type ViewInstance } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/ui/back-button';
import { FramedImage } from '@/components/ui/photo-frame';
import { Pressable } from '@/components/ui/pressable';
import { BottomBar } from '@/components/bottom-bar';
import { CommentsSheet, type Comment } from '@/components/common/comments-sheet';
import { ReportSheet, useBlockedNames } from '@/components/common/report-sheet';
import { guardMember } from '@/components/common/trial-guide';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import {
  addCheckinReply,
  CH_BG,
  chCat,
  checkinLikes,
  checkinReplies,
  dayOf,
  feedOf,
  isJoined,
  isPre,
  memberCount,
  rankingOf,
  todayCount,
  toggleJoin,
  toggleLiked,
  toggleSaved,
  unitOf,
  useChallengeState,
  weekOf,
  type ChCheckin,
  type Challenge,
  type ChView,
  type RankRow,
} from '@/data/challenge';
import { haptic, sfx } from '@/lib/feedback';
import { HeartPop } from '@/components/ui/heart-pop';

import { invite } from './cards';
import { CheckSheet } from './check-sheet';
import { CheerSheet } from './cheer-sheet';
import { Face } from './face';
import { ChIcon } from './icons';
import { Empty, LgBtn, LgLink, LINE, SUB } from './parts';
import { ChCover } from './cover';

type Tab = 'home' | 'feed' | 'rank';
const TABS: [Tab, string][] = [
  ['home', '홈'],
  ['feed', '인증'],
  ['rank', '순위'],
];
const TOP_H = 60;

/**
 * 일상 챌린지 상세 (프로토타입 lgChalDetail): 진행 카드 → 카테고리 · 이름 · 지점 · 멤버 → 홈 | 인증 | 순위 탭 → 아래 고정 [찜] [참여하기 / 오늘 인증하기].
 * 카드의 [참여하기]는 여기를 열기만 하고, 여기서 한 번 더 눌러야 참여돼요.
 */
export function DailyDetail({ p }: { p: Challenge }) {
  const s = useChallengeState();
  const [tab, setTab] = useState<Tab>('home');
  // 탭을 바꿀 때 탭 줄이 위에 붙어 있으면, 새 탭 맨 위(탭 줄 바로 아래)부터 보여요 (첫 글 머리가 탭 줄에 가리지 않게)
  const scroll = useRef<ScrollViewInstance>(null);
  const scrollY = useRef(0);
  const tabsY = useRef(0);
  const tabsH = useRef(0);
  useEffect(() => {
    if (scrollY.current > tabsY.current) scroll.current?.scrollTo({ y: tabsY.current, animated: false });
  }, [tab]);
  const [titled, setTitled] = useState(false);
  const [dbdY, setDbdY] = useState(9999);
  const [h2Bottom, setH2Bottom] = useState(0);
  const [cheer, setCheer] = useState(false);
  const [goCheck, setGoCheck] = useState(false);
  const [checkFor, setCheckFor] = useState<Challenge | null>(null);
  const [thread, setThread] = useState<ChCheckin | null>(null);
  const [report, setReport] = useState<string | null>(null);
  // 방금 올린 내 인증으로 화면을 옮길지 (인증 탭에서 그 글이 그려지면 한 번)
  const [revealMine, setRevealMine] = useState(false);
  const revealRow = (row: ViewInstance | null) => {
    setRevealMine(false);
    const inner = scroll.current?.getInnerViewRef();
    if (!row || !inner) return;
    row.measureLayout(inner, (_x, ry) => {
      // 탭 줄이 위에 붙으면 그 아래로 글 머리(얼굴)가 보이게. 맨 위 글이면 탭 줄 바로 아래(인증 탭 첫머리)부터
      const under = ry - tabsH.current - 12;
      scroll.current?.scrollTo({ y: under < tabsY.current + 60 ? tabsY.current : under, animated: true });
    });
  };

  const C = chCat(p.cat);
  const jn = isJoined(p, s);
  const pre = isPre(p);
  const j = !!s.checked[p.id];
  const d = dayOf(p, s);
  const u = unitOf(p);
  const saved = !!s.saved[p.id];

  // 아래 고정 버튼 (chmain): 참여 → 응원 시트 · 시작 전 신청 · 오늘 인증 · 이미 인증
  const main = () =>
    guardMember(() => {
      if (!jn || pre) {
        if (!(jn && pre)) {
          toggleJoin(p);
          sfx('pick');
          haptic('success');
          setCheer(true);
        } else showToast(`${p.start}하면 알려 드릴게요`);
      } else if (!j) setCheckFor(p);
      else showToast('오늘은 이미 인증했어요 · 내일 또 만나요');
    }, '챌린지에 참여하려면');
  const mainLabel = p.mine && pre ? '멤버 초대' : !jn ? (pre ? '도전 신청하기' : '참여하기') : pre ? '신청 완료 · 시작하면 알려 드려요' : j ? '오늘 인증 완료' : '오늘 인증하기';
  const mainDone = jn && (pre || j) && !(p.mine && pre);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/lounge'));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={[styles.dtop, titled && styles.dtopSolid]}>
        <BackButton onPress={back} />
        <TopTitle text={p.name} on={titled} />
        <View style={styles.ib} />
      </View>

      <ScrollView
        stickyHeaderIndices={[2]}
        scrollEventThrottle={16}
        ref={scroll}
        onScroll={(e) => {
          scrollY.current = e.nativeEvent.contentOffset.y;
          setTitled(e.nativeEvent.contentOffset.y > dbdY + h2Bottom);
        }}
        contentContainerStyle={styles.scroll}>
        {/* .lg-chhero: 진행 카드 */}
        <View style={styles.heroWrap}>
          <View pointerEvents="none" style={styles.heroShadow} />
          <View style={[styles.hero, { backgroundColor: CH_BG[C.tone] }]}>
            <View style={styles.heroRow}>
              <ChCover p={p} size={58} style={styles.heroIc} />
              <View style={styles.st}>
                {pre ? (
                  <PText style={styles.stPre}>{p.start}</PText>
                ) : (
                  <PText style={styles.stB}>
                    {d}
                    <PText style={styles.stOf}>{`/${p.of}${u}`}</PText>
                  </PText>
                )}
                <PText style={styles.stS}>{pre ? '곧 시작해요' : jn ? '내 진행' : `${p.day}${u}째 진행 중`}</PText>
              </View>
            </View>
            <HeroBar pct={pre ? 0 : Math.round((d / p.of) * 100)} />
          </View>
        </View>

        {/* 제목 칸 */}
        <View style={styles.dbd} onLayout={(e) => setDbdY(e.nativeEvent.layout.y)}>
          <View style={styles.dk}>
            <ChIcon name="flame" size={13} color={Colors.purple} width={2.6} />
            <PText style={styles.dkT}>{`챌린지 · ${C.label}`}</PText>
          </View>
          <PText style={styles.h2} accessibilityRole="header" onLayout={(e: LayoutChangeEvent) => setH2Bottom(e.nativeEvent.layout.y + e.nativeEvent.layout.height)}>
            {p.name}
          </PText>
          <PText style={styles.dmeta}>
            {`${p.br} · 멤버 ${memberCount(p, s)}명 · `}
            <PText style={styles.dmetaEm}>{jn ? '참여 중' : `${p.freqT || '매일'} 인증`}</PText>
          </PText>
        </View>

        {/* .lg-dtabs: 위에 붙는 탭. 위에 붙는 칸은 RN 이 스타일을 바꿔 끼워서(아이폰에서 세로로 쌓여요) 바깥 상자로 한 번 감싸요 */}
        <View
          style={styles.tabsSticky}
          onLayout={(e) => {
            tabsY.current = e.nativeEvent.layout.y;
            tabsH.current = e.nativeEvent.layout.height;
          }}>
        <View style={styles.tabs} accessibilityRole="tablist">
          {TABS.map(([k, l]) => (
            <Pressable
              key={k}
              onPress={() => {
                sfx('tap');
                setTab(k);
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === k }}
              style={[styles.tab, tab === k && styles.tabOn]}>
              <PText style={[styles.tabT, tab === k && styles.tabTOn]}>{l}</PText>
            </Pressable>
          ))}
        </View>
        </View>

        <View style={styles.body}>
          {tab === 'home' ? <HomeTab p={p} s={s} onAll={() => setTab('feed')} onThread={setThread} onReport={setReport} /> : null}
          {tab === 'feed' ? <FeedTab p={p} s={s} onThread={setThread} onReport={setReport} onMineShown={revealMine ? revealRow : undefined} /> : null}
          {tab === 'rank' ? <RankTab p={p} s={s} /> : null}
        </View>
      </ScrollView>

      {/* .lg-dcta: 찜 + 행동 버튼 (아래 고정) */}
      <BottomBar>
        <View style={styles.cta}>
          <LgBtn
            a11y="찜하기"
            tone="white"
            height={54}
            padX={0}
            width={54}
            icon={<HeartPop on={saved}><ChIcon name="heart" size={22} fill={saved ? Colors.rosePink : 'none'} /></HeartPop>}
            onPress={() => {
              const on = toggleSaved(p.id);
              showToast(on ? '저장했어요' : '저장을 취소했어요');
            }}
          />
          <View style={styles.ctaMain}>
            <LgBtn label={mainLabel} tone={mainDone ? 'done' : 'purple'} height={54} fontSize={15.5} wide onPress={p.mine && pre ? invite : main} />
          </View>
        </View>
      </BottomBar>

      <CheerSheet
        p={p}
        open={cheer}
        onClose={() => setCheer(false)}
        onGo={() => {
          setGoCheck(true);
          setCheer(false);
        }}
        onClosed={() => {
          if (goCheck) setCheckFor(p);
          setGoCheck(false);
        }}
      />
      <CheckSheet
        challenge={checkFor}
        onClose={() => setCheckFor(null)}
        onPosted={() => {
          // 올리고 나면 인증 탭의 내 글로
          setTab('feed');
          setRevealMine(true);
        }}
      />
      <CommentsSheet
        open={!!thread}
        onClose={() => setThread(null)}
        title="답글"
        comments={thread ? checkinReplies(thread, s).map((r): Comment => ({ id: r.id, author: r.n, text: r.x, time: r.t, mine: !!r.me, likes: r.lk })) : []}
        onSend={(t) => guardMember(() => thread && addCheckinReply(thread, t), '댓글을 달려면')}
      />
      <ReportSheet
        open={!!report}
        onClose={() => setReport(null)}
        target={{ kind: 'comment', name: report ?? '' }}
      />
    </SafeAreaView>
  );
}

/** 위 막대 제목: 이름이 위로 지나가면 나타나요 (.titled .dtt) */
function TopTitle({ text, on }: { text: string; on: boolean }) {
  const v = useSharedValue(on ? 1 : 0);
  useEffect(() => {
    v.set(withTiming(on ? 1 : 0, { duration: 200 }));
  }, [on, v]);
  const anim = useAnimatedStyle(() => ({ opacity: v.get(), transform: [{ translateY: (1 - v.get()) * 6 }] }));
  return (
    <Animated.View style={[styles.dtt, anim]}>
      <PText numberOfLines={1} style={styles.dttT}>
        {text}
      </PText>
    </Animated.View>
  );
}

/** 진행 막대: 처음 열 때 0 에서 차올라요 (@keyframes cbFillIn 1s) */
function HeroBar({ pct }: { pct: number }) {
  const still = useReducedMotion();
  const w = useSharedValue(still ? pct : 0);
  useEffect(() => {
    w.set(withTiming(pct, { duration: still ? 0 : 1000, easing: Easing.ease }));
  }, [pct, still, w]);
  const anim = useAnimatedStyle(() => ({ width: `${w.get()}%` }));
  return (
    <View style={styles.bar}>
      <Animated.View style={[styles.barI, anim]} />
    </View>
  );
}

// ---- 홈 탭 ----
function HomeTab({ p, s, onAll, onThread, onReport }: { p: Challenge; s: ChView; onAll: () => void; onThread: (q: ChCheckin) => void; onReport: (n: string) => void }) {
  const jn = isJoined(p, s);
  const pre = isPre(p);
  const u = unitOf(p);
  const F = feedOf(p, s, useBlockedNames());
  const rows: [Parameters<typeof ChIcon>[0]['name'], string, string][] = [
    ['cal', `${p.dur || p.of}일 · ${p.freqT || '매일'}`, `총 ${p.of}번 인증하면 완주해요${pre ? ' · ' + p.start : ''}`],
    [p.way === 'photo' ? 'cam' : 'cmt', p.way === 'photo' ? '사진 + 댓글로 인증' : '댓글로 인증', p.way === 'photo' ? '사진이 1장 이상 있어야 체크돼요' : '그날 댓글 한 줄이면 체크돼요'],
    ['crown', `호스트 ${p.host}${p.mine ? ' (나)' : ''}`, p.br],
    ['users', `멤버 ${memberCount(p, s)}명`, pre ? '시작하면 인증 순위가 생겨요' : `오늘 ${todayCount(p, s)}명이 인증했어요`],
  ];
  return (
    <>
      <PText style={styles.dsec}>챌린지 소개</PText>
      <View style={styles.dlist}>
        {(p.guide || '')
          .split('\n')
          .map((l) => l.replace(/^\s*[•·\-*]\s*/, '').trim())
          .filter(Boolean)
          .map((l, i) => (
            <View key={i} style={styles.dli}>
              <View style={styles.dot} />
              <PText style={styles.ddesc}>{l}</PText>
            </View>
          ))}
      </View>
      <View style={styles.drows}>
        {rows.map(([ic, a, b], i) => (
          <View key={a} style={[styles.drow, i > 0 && styles.drowLine]}>
            <View style={styles.drowIc}>
              <ChIcon name={ic} size={17} />
            </View>
            <View style={styles.drowTx}>
              <PText style={styles.drowA}>{a}</PText>
              <PText style={styles.drowB}>{b}</PText>
            </View>
          </View>
        ))}
      </View>
      {jn && !pre ? (
        <>
          <PText style={[styles.dsec, styles.secGap]}>
            {'내 인증 '}
            <PText style={styles.dsec}>{dayOf(p, s)}</PText>
            <PText style={styles.dsecS}>{` / ${p.of}${u}`}</PText>
          </PText>
          <View style={styles.wk}>
            {weekOf(p, s).map((c, i) => (
              <View key={i} style={styles.wkD}>
                <View style={[styles.wkC, c.ok ? styles.wkOk : c.today ? styles.wkTd : styles.wkNo]}>{c.ok ? <ChIcon name="check" size={15} width={3} /> : null}</View>
                <PText style={[styles.wkL, c.today && { color: Colors.purple }]}>{c.label}</PText>
              </View>
            ))}
          </View>
        </>
      ) : null}
      {F.length ? (
        <>
          <View style={[styles.schhd, styles.secGap]}>
            <PText style={styles.dsec}>최근 인증</PText>
            <View style={styles.sp} />
            <LgLink label="모두 보기 ›" onPress={onAll} color={SUB} />
          </View>
          <View style={styles.chfl}>
            {F.slice(0, 2).map((q, i) => (
              <CheckinRow key={q.key + i} p={p} q={q} i={i} s={s} onThread={onThread} onReport={onReport} />
            ))}
          </View>
        </>
      ) : null}
    </>
  );
}

// ---- 인증 탭 ----
function FeedTab({ p, s, onThread, onReport, onMineShown }: { p: Challenge; s: ChView; onThread: (q: ChCheckin) => void; onReport: (n: string) => void; onMineShown?: (row: ViewInstance | null) => void }) {
  const F = feedOf(p, s, useBlockedNames());
  // 맨 위 내 글 (방금 올린 인증 — 최근 순이라 맨 앞)
  const mineRow = useRef<ViewInstance>(null);
  if (!F.length) return <Empty>{isPre(p) ? `${p.start}하면 여기에 인증이 모여요.` : '아직 오늘 인증이 없어요.'}</Empty>;
  return (
    <>
      <PText style={styles.evsort}>{`오늘 인증 ${todayCount(p, s)}명 · 최근 순`}</PText>
      <View>
        {F.map((q, i) =>
          i === 0 && q.me && onMineShown ? (
            <View key={q.key + i} ref={mineRow} collapsable={false} onLayout={() => onMineShown(mineRow.current)}>
              <CheckinRow p={p} q={q} i={i} s={s} onThread={onThread} onReport={onReport} />
            </View>
          ) : (
            <CheckinRow key={q.key + i} p={p} q={q} i={i} s={s} onThread={onThread} onReport={onReport} />
          ),
        )}
      </View>
    </>
  );
}

/** 인증 한 줄 (.lg-chf): 사진(고른 비율) → 좋아요 · 답글 → 글. 다른 멤버 인증은 길게 눌러 신고 · 차단 */
function CheckinRow({ p, q, i, s, onThread, onReport }: { p: Challenge; q: ChCheckin; i: number; s: ChView; onThread: (q: ChCheckin) => void; onReport: (n: string) => void }) {
  const C = chCat(p.cat);
  const on = !!s.liked[q.key];
  const nl = checkinLikes(q, s);
  const nr = checkinReplies(q, s).length;
  const photo = q.photos?.[0];
  return (
    <Pressable onLongPress={q.me ? undefined : () => onReport(q.n)} delayLongPress={450} style={[styles.chf, i > 0 && styles.chfLine]}>
      {/* 위 줄: 얼굴 · 이름 · 시간 — 사진 · 버튼 · 글은 그 아래 폭 전체 (라운지 글처럼 왼쪽을 비우지 않아요) */}
      <View style={styles.chfHd}>
        <Face name={q.n} color={q.c} size={34} />
        <PText style={styles.chfN} numberOfLines={1}>{`${q.n}${q.me ? ' (나)' : ''}`}</PText>
        <PText style={styles.chfT}>{q.t}</PText>
      </View>
      <View style={styles.chfB}>
        {photo ? (
          <View style={[styles.pic, { aspectRatio: photo.ratio }]}>
            <FramedImage uri={photo.uri} framing={photo.framing} accessibilityLabel={`${q.n}의 인증 사진`} />
            {(q.photos?.length ?? 0) > 1 ? (
              <View style={styles.picN}>
                <PText style={styles.picNT}>{`1 / ${q.photos?.length}`}</PText>
              </View>
            ) : null}
          </View>
        ) : q.pic ? (
          <View style={[styles.pic, styles.picEx, { aspectRatio: [1, 0.8, 1.25, 1][i % 4], backgroundColor: [CH_BG[C.tone], '#FCE3EA', '#E3F5EA', '#FFF5B0'][i % 4] }]}>
            <ChIcon name={C.icon} size={34} />
          </View>
        ) : null}
        <View style={styles.acts}>
          <Pressable
            onPress={() => {
              toggleLiked(q.key);
            }}
            accessibilityRole="button"
            accessibilityLabel={`좋아요 ${nl}개`}
            accessibilityState={{ selected: on }}
            hitSlop={8}
            style={styles.ak}>
            <HeartPop on={on}><ChIcon name="heart" size={20} fill={on ? Colors.rosePink : 'none'} /></HeartPop>
            <PText style={styles.akN}>{nl || ''}</PText>
          </Pressable>
          <Pressable onPress={() => onThread(q)} accessibilityRole="button" accessibilityLabel={nr ? `답글 ${nr}개 보기` : '답글 달기'} hitSlop={8} style={styles.ak}>
            <ChIcon name="cmt" size={19} />
            <PText style={styles.akN}>{nr || ''}</PText>
          </Pressable>
        </View>
        <PText style={styles.chfX}>{q.x}</PText>
      </View>
    </Pressable>
  );
}

// ---- 순위 탭 ----
function RankTab({ p, s }: { p: Challenge; s: ChView }) {
  const jn = isJoined(p, s);
  const u = unitOf(p);
  const d = dayOf(p, s);
  const rows = rankingOf(p, s);
  if (!rows.length) return <Empty>시작하면 순위가 생겨요.</Empty>;
  const myI = rows.findIndex((r) => r.me);
  const top = rows.slice(0, 3);
  const rest = rows.slice(3, 10);
  const meOut = myI >= 10 ? rows[myI] : null;
  return (
    <>
      {jn ? (
        <View>
          <View pointerEvents="none" style={[styles.btnShadow3, { borderRadius: 18 }]} />
          <View style={styles.rme}>
            <PText style={styles.rmeNo}>
              {myI + 1}
              <PText style={styles.rmeWi}>위</PText>
            </PText>
            <View style={styles.rmeTx}>
              <PText style={styles.rmeB}>{`내 순위 · ${d}${u} 인증`}</PText>
              <PText style={styles.rmeS}>{`${myI ? `${rows[myI - 1].n}님까지 ${rows[myI - 1].d - d + 1}${u} 더` : '지금 1위예요!'} · 멤버 ${rows.length}명 중`}</PText>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.rmeNone}>
          <PText style={styles.rmeNoneT}>{`참여하면 순위에 들어가요 · 지금 ${memberCount(p, s)}명이 함께해요`}</PText>
        </View>
      )}
      {/* .lg-pod: 1~3위 시상대 (2 · 1 · 3 순서) */}
      <View style={styles.pod}>
        {[1, 0, 2]
          .filter((k) => top[k])
          .map((k) => {
            const r = top[k];
            return (
              <View key={k} style={styles.podCol}>
                <Face name={r.n} color={r.c} size={k === 0 ? 54 : 44} />
                <PText numberOfLines={1} style={[styles.podB, r.me && { color: Colors.purple }]}>{`${r.n}${r.me ? ' (나)' : ''}`}</PText>
                <PText style={styles.podS}>{`${r.d}${u}`}</PText>
                <View style={[styles.podSt, { height: [72, 54, 42][k], backgroundColor: [Colors.yellow, Colors.lavender, Colors.skyMist][k] }]}>
                  <PText style={styles.podNo}>{k + 1}</PText>
                </View>
              </View>
            );
          })}
      </View>
      <PText style={[styles.evsort, styles.rsort]}>인증 횟수 순 · 같으면 먼저 인증한 순</PText>
      {rest.length ? (
        <View style={styles.rank}>
          {rest.map((r, k) => (
            <RankLine key={r.n} r={r} no={k + 4} first={k === 0} of={p.of} u={u} host={p.host} />
          ))}
          {meOut ? (
            <>
              <PText style={styles.gap}>···</PText>
              <RankLine r={meOut} no={myI + 1} of={p.of} u={u} host={p.host} />
            </>
          ) : null}
        </View>
      ) : null}
    </>
  );
}

function RankLine({ r, no, first = false, of, u, host }: { r: RankRow; no: number; first?: boolean; of: number; u: string; host: string }) {
  return (
    <View style={[styles.rl, !first && styles.rlLine, r.me && styles.rlMe]}>
      <PText style={styles.rlNo}>{no}</PText>
      <Face name={r.n} color={r.c} size={30} />
      <View style={styles.rlNm}>
        <PText numberOfLines={1} style={styles.rlN}>
          {r.n}
          {r.me ? <PText style={styles.rlEm}> 나</PText> : r.n === host ? <PText style={styles.rlEm}> 호스트</PText> : null}
        </PText>
        <View style={styles.rlBar}>
          <View style={[styles.rlBarI, { width: `${Math.round((r.d / of) * 100)}%` as const }, r.me && styles.rlBarMe]} />
        </View>
      </View>
      <PText style={styles.rlD}>{`${r.d}${u}`}</PText>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  dtop: { height: TOP_H, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, backgroundColor: Colors.cream, borderBottomWidth: 1.5, borderColor: 'transparent', zIndex: 2 },
  dtopSolid: { borderColor: Colors.line },
  ib: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  ibOn: { transform: [{ scale: 0.92 }] },
  dtt: { flex: 1, minWidth: 0 },
  dttT: { fontFamily: Font.body900, fontSize: 15, lineHeight: 21 },
  scroll: { paddingBottom: 24 },
  heroWrap: { marginTop: 4, marginHorizontal: 18 },
  heroShadow: { position: 'absolute', top: 4, left: 4, right: -4, bottom: -4, borderRadius: 22, backgroundColor: Colors.ink },
  hero: { borderWidth: 2, borderColor: Colors.ink, borderRadius: 22, padding: 16, gap: 10 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroIc: { width: 58, height: 58, borderRadius: 16, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  st: { flex: 1, gap: 2 },
  stB: { fontFamily: Font.display, fontSize: 30, lineHeight: 32 },
  stOf: { fontFamily: Font.display, fontSize: 15, color: 'rgba(30,26,43,0.55)' },
  stPre: { fontFamily: Font.display, fontSize: 22, lineHeight: 28 },
  stS: { fontFamily: Font.body800, fontSize: 12, lineHeight: 17, color: SUB },
  bar: { height: 16, borderRadius: 6, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, overflow: 'hidden' },
  barI: { height: '100%', borderRadius: 4, backgroundColor: Colors.purple },
  // 아래 16 은 탭 위 여백 — 탭에 margin 을 주면 위에 붙을 때 틈이 생겨요
  dbd: { paddingTop: 18, paddingHorizontal: 18, paddingBottom: 16 },
  dk: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dkT: { fontFamily: Font.body900, fontSize: 12.5, lineHeight: 19, color: Colors.purple },
  h2: { marginTop: 8, fontFamily: Font.body900, fontSize: 24, lineHeight: 31.2, letterSpacing: -0.5 },
  dmeta: { marginTop: 6, fontFamily: Font.body700, fontSize: 13, lineHeight: 19, color: SUB },
  dmetaEm: { fontFamily: Font.body900, fontSize: 13, color: Colors.rosePink },
  tabsSticky: { backgroundColor: Colors.cream },
  tabs: { flexDirection: 'row', paddingHorizontal: 18, backgroundColor: Colors.cream, borderBottomWidth: 1.5, borderColor: LINE },
  tab: { flex: 1, height: 44, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 3, borderColor: 'transparent', marginBottom: -1.5 },
  tabOn: { borderColor: Colors.ink },
  tabT: { fontFamily: Font.body800, fontSize: 14.5, lineHeight: 20, color: SUB },
  tabTOn: { fontFamily: Font.body900, color: Colors.ink },
  body: { paddingTop: 20, paddingHorizontal: 18 },
  dsec: { fontFamily: Font.body900, fontSize: 15, lineHeight: 21 },
  dsecS: { fontFamily: Font.body700, fontSize: 12, color: SUB },
  secGap: { marginTop: 20 },
  ddesc: { flex: 1, fontFamily: Font.body600, fontSize: 14.5, lineHeight: 24.65 },
  dlist: { marginTop: 8, gap: 2 },
  dli: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 9.5, backgroundColor: Colors.purple },
  drows: { marginTop: 14, borderWidth: 2, borderColor: Colors.ink, borderRadius: 18, backgroundColor: Colors.white, paddingVertical: 2, paddingHorizontal: 14 },
  drow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  drowLine: { borderTopWidth: 1.5, borderColor: LINE },
  drowIc: { width: 32, height: 32, borderRadius: 10, backgroundColor: Colors.lavender, alignItems: 'center', justifyContent: 'center' },
  drowTx: { flex: 1, minWidth: 0 },
  drowA: { fontFamily: Font.body800, fontSize: 14, lineHeight: 20.3 },
  drowB: { fontFamily: Font.body700, fontSize: 12, lineHeight: 17.4, color: SUB },
  wk: { marginTop: 10, flexDirection: 'row', gap: 6 },
  wkD: { flex: 1, alignItems: 'center', gap: 4 },
  wkC: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  wkOk: { backgroundColor: Colors.yellow, borderColor: Colors.ink },
  wkTd: { borderColor: Colors.purple },
  wkNo: { borderStyle: 'dashed', borderColor: '#CFC7B6' },
  wkL: { fontFamily: Font.body800, fontSize: 11, lineHeight: 16, color: SUB },
  schhd: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sp: { flex: 1 },
  chfl: { marginTop: 8 },
  evsort: { fontFamily: Font.body700, fontSize: 12.5, lineHeight: 19, color: SUB },
  chf: { paddingVertical: 12 },
  chfLine: { borderTopWidth: 1.5, borderColor: LINE },
  chfB: { minWidth: 0 },
  chfHd: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chfN: { flexShrink: 1, fontFamily: Font.body900, fontSize: 13.5, lineHeight: 20 },
  chfT: { fontFamily: Font.body700, fontSize: 11.5, lineHeight: 16, color: SUB },
  pic: { marginTop: 8, width: '100%', borderWidth: 2, borderColor: Colors.ink, borderRadius: 14, overflow: 'hidden', backgroundColor: Colors.ink },
  picEx: { alignItems: 'center', justifyContent: 'center' },
  picN: { position: 'absolute', right: 8, top: 8, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, backgroundColor: 'rgba(30,26,43,0.6)' },
  picNT: { fontFamily: Font.display, fontSize: 10.5, lineHeight: 15, color: Colors.white },
  acts: { marginTop: 8, flexDirection: 'row', gap: 16 },
  ak: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 2 },
  akN: { fontFamily: Font.body800, fontSize: 12.5, lineHeight: 18, color: SUB },
  chfX: { marginTop: 4, fontFamily: Font.body600, fontSize: 14, lineHeight: 21 },
  btnShadow3: { position: 'absolute', top: 3, left: 3, right: -3, bottom: -3, backgroundColor: Colors.ink },
  rme: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 18, borderWidth: 2, borderColor: Colors.ink, backgroundColor: '#FFF8C2' },
  rmeNo: { fontFamily: Font.display, fontSize: 26, lineHeight: 30 },
  rmeWi: { fontFamily: Font.body900, fontSize: 12, color: SUB },
  rmeTx: { flex: 1, minWidth: 0 },
  rmeB: { fontFamily: Font.body900, fontSize: 14, lineHeight: 20 },
  rmeS: { fontFamily: Font.body700, fontSize: 12, lineHeight: 17, color: SUB },
  rmeNone: { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 18, borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.ink, backgroundColor: Colors.white },
  rmeNoneT: { fontFamily: Font.body800, fontSize: 13, lineHeight: 19, color: SUB },
  pod: { marginTop: 28, minHeight: 178, flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  podCol: { flex: 1, alignItems: 'center' },
  podB: { marginTop: 6, maxWidth: '100%', fontFamily: Font.body900, fontSize: 13, lineHeight: 19 },
  podS: { fontFamily: Font.display, fontSize: 12, lineHeight: 17, color: SUB },
  podSt: { marginTop: 8, alignSelf: 'stretch', marginHorizontal: -2, borderWidth: 2, borderBottomWidth: 0, borderColor: Colors.ink, borderTopLeftRadius: 12, borderTopRightRadius: 12, alignItems: 'center', paddingTop: 6 },
  podNo: { fontFamily: Font.display, fontSize: 18, lineHeight: 22 },
  rsort: { marginTop: 14 },
  rank: { marginTop: 8, borderWidth: 2, borderColor: Colors.ink, borderRadius: 18, backgroundColor: Colors.white, paddingVertical: 2, paddingHorizontal: 14, overflow: 'hidden' },
  rl: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9 },
  rlLine: { borderTopWidth: 1.5, borderColor: LINE },
  rlMe: { backgroundColor: '#FFF8C2', marginHorizontal: -14, paddingHorizontal: 14 },
  rlNo: { width: 18, fontFamily: Font.display, fontSize: 12, lineHeight: 15 },
  rlNm: { flex: 1, minWidth: 0 },
  rlN: { fontFamily: Font.body900, fontSize: 13.5, lineHeight: 19 },
  rlEm: { fontFamily: Font.body900, fontSize: 11, color: Colors.purple },
  rlBar: { marginTop: 6, height: 7, borderRadius: 4, backgroundColor: '#EEE8DA', overflow: 'hidden' },
  rlBarI: { height: '100%', borderRadius: 4, backgroundColor: Colors.purple },
  rlBarMe: { backgroundColor: Colors.yellow, borderWidth: 1.5, borderColor: Colors.ink },
  rlD: { width: 40, textAlign: 'right', fontFamily: Font.display, fontSize: 12, lineHeight: 17 },
  gap: { textAlign: 'center', paddingVertical: 2, color: SUB, fontFamily: Font.body900, letterSpacing: 2 },
  cta: { flexDirection: 'row', gap: 10 },
  ctaMain: { flex: 1 },
});

