import { useMemo, useState, type ReactNode } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';

import type { ChallengeLounge } from '@/api/challenges';
import { useChallengeCategories, useChallengeLounge } from '@/api/use-challenge-lounge';
import { Pressable } from '@/components/ui/pressable';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { allChallenges, challengeSrc, isExpr, useChallengeState, type Challenge, type ChView } from '@/data/challenge';
import { haptic, sfx } from '@/lib/feedback';
import { useCenterChip } from '@/lib/center-chip';

import { ExprCard } from './cards';
import { ChxSheet } from './chx-sheet';
import { LoungeChallengeCard, LoungeHotBox } from './lounge-cards';
import { Empty, LgIn, LgLink, SearchBox, Sec, SUB } from './parts';

/** 'all' · 'on'(참여 중) · 'study'(표현 챌린지 — 출시 전이라 닫혀 있어요) · 그 밖에는 서버 분류 코드(대문자) */
type Sub = string;

/**
 * 라운지 '챌린지' 탭 본문 (docs/pages/05-challenge.md · 프로토타입 lgBody case 'chal'). 라운지 화면이 이 컴포넌트를 그대로 넣어요.
 * 서버 한 번에 받아요 (api/use-challenge-lounge: 핫 · 진행 중 · 참여 중 · 곧 시작). 분류 칩은 서버 마스터데이터(CHALLENGE_CATEGORY).
 * - branch: 라운지 위에서 고른 지점 — 챌린지는 지점에 묶이지 않아서(전역) 거르는 데 쓰지 않아요
 * - header: 라운지의 지점 선택 버튼 — 서브 칩 줄 맨 앞에 넣어요 (라운지 다른 탭과 줄 모양을 같게)
 * 라운지 세로 스크롤 안에 들어가서, 여기서는 세로 스크롤을 만들지 않아요 (옆으로 넘기는 줄만).
 * 참여 · 인증은 v2 API 가 아직 없어서 카드 버튼은 '준비 중' 알림만 (components/challenge/lounge-cards).
 * 담당: 챌린지. props 는 바꾸지 않아요(늘리기만).
 */
export function ChallengeTab({ header }: { branch: string; header?: ReactNode }) {
  const s = useChallengeState();
  const [sub, setSub] = useState<Sub>('all');
  const [seg, setSeg] = useState<'run' | 'on' | null>(null);
  const [q, setQ] = useState('');
  // 표현 챌린지 창 (lgDetail → chxSheet): 라운지 위에 시트로
  const [chx, setChx] = useState<{ p: Challenge; write: boolean; open: boolean } | null>(null);
  const openExpr = (p: Challenge, write = false) => {
    sfx('tap');
    setChx({ p, write, open: true });
  };
  const { width: winW } = useWindowDimensions();
  const [feedW, setFeedW] = useState(winW - 32);

  const cats = useChallengeCategories();
  const subs: [Sub, string][] = [['all', '전체'], ['on', '참여 중'], ...(cats.data ?? []).map((c): [Sub, string] => [c.code, c.label])];
  // '전체' · '참여 중' 은 같은 응답 · 분류 칩만 그 분류로 새로 받아요
  const lounge = useChallengeLounge(sub === 'all' || sub === 'on' || sub === 'study' ? null : sub);
  // 표현 챌린지는 아직 예시 데이터 (출시 전 · LAUNCH.exprChallenge)
  const exprs = useMemo(() => allChallenges(s).filter(isExpr), [s]);

  const [rowRef, onRow, onChip, centerChip] = useCenterChip();
  const pickSub = (v: Sub) => {
    centerChip(v);
    sfx('tap');
    haptic('select');
    setSub(v);
  };

  return (
    <View>
      {/* .lg-subs: 지점 버튼 · 구분선 · 서브 칩 */}
      <ScrollView ref={rowRef} onLayout={onRow} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subs}>
        {header ? (
          <>
            {header}
            <View style={styles.sep} />
          </>
        ) : null}
        {subs.map(([v, l]) => (
          <Pressable
            key={v}
            onLayout={(e) => onChip(v, e)}
            onPress={() => pickSub(v)}
            accessibilityRole="button"
            accessibilityState={{ selected: sub === v }}
            style={({ pressed }) => [styles.chip, sub === v && styles.chipOn, pressed && styles.pressed]}>
            <PText style={[styles.chipT, sub === v && styles.chipTOn]}>{l}</PText>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.feed} onLayout={(e) => setFeedW(e.nativeEvent.layout.width - 32)} key={sub}>
        {sub === 'study' ? (
          <ExprSearch list={exprs} s={s} q={q} setQ={setQ} onOpen={openExpr} />
        ) : lounge.isPending ? (
          <ActivityIndicator style={styles.spin} color={SUB} />
        ) : lounge.isError ? (
          <Empty>{'챌린지를 불러오지 못했어요.\n아래로 당겨 다시 시도해 주세요.'}</Empty>
        ) : (
          <Body data={lounge.data} exprs={exprs} s={s} sub={sub} seg={seg} setSeg={setSeg} feedW={feedW} onOpen={openExpr} onAll={() => pickSub('study')} />
        )}
      </View>

      {chx ? <ChxSheet p={chx.p} open={chx.open} write={chx.write} onClose={() => setChx({ ...chx, open: false })} onClosed={() => setChx(null)} /> : null}
    </View>
  );
}

/** 오늘 인증 남은 수 문구 (수는 서버가 세요) */
const leftHint = (data: ChallengeLounge) => {
  if (!data.joined.length) return '';
  return data.todayLeftCount ? `오늘 인증 ${data.todayLeftCount}개 남았어요` : '오늘 인증 다 했어요!';
};

function Body({
  data,
  exprs,
  s,
  sub,
  seg,
  setSeg,
  feedW,
  onOpen,
  onAll,
}: {
  data: ChallengeLounge;
  /** 표현 챌린지 (예시 데이터 · 출시 전이라 비어 있어요) */
  exprs: Challenge[];
  s: ChView;
  sub: Sub;
  seg: 'run' | 'on' | null;
  setSeg: (v: 'run' | 'on') => void;
  feedW: number;
  onOpen: (p: Challenge, write?: boolean) => void;
  onAll: () => void;
}) {
  const { hot, running, joined, upcoming } = data;
  const cards = (L: ChallengeLounge['running'], start = 0) =>
    L.map((c, i) => (
      <LgIn key={c.id} index={start + i}>
        <LoungeChallengeCard c={c} />
      </LgIn>
    ));

  if (sub === 'on') {
    return (
      <>
        <LgIn>
          <Sec title="참여 중" sub={leftHint(data)} />
        </LgIn>
        {joined.length ? cards(joined, 1) : <Empty>{'참여 중인 챌린지가 없어요.\n마음에 드는 챌린지에 참여해 보세요.'}</Empty>}
      </>
    );
  }

  // 처음엔 늘 '진행 중' 먼저 (참여 중은 눌러서)
  const cur = seg ?? 'run';
  const segList = cur === 'on' ? joined : running;
  const cardW = Math.round(feedW * 0.892);
  return (
    <>
      {hot.length ? (
        <LgIn index={0} style={styles.hotWrap}>
          <LoungeHotBox list={hot} />
        </LgIn>
      ) : null}
      {exprs.length ? (
        <>
          <LgIn index={1}>
            <Sec title="표현 챌린지" sub={`나만의 문장 완성하기 · ${exprs.length}개`} right={exprs.length > 1 ? <LgLink label="모두 보기 ›" onPress={onAll} /> : null} />
          </LgIn>
          <LgIn index={2}>
            {/* .lg-hs.chxs: 옆으로 넘기는 한 줄 (카드 폭 88%) */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={cardW + 12}
              snapToAlignment="start"
              // 한 번 밀면 한 장씩 (중간에 걸쳐 멈추지 않게)
              disableIntervalMomentum
              decelerationRate="fast"
              style={styles.hs}
              contentContainerStyle={styles.hsIn}
              accessibilityRole="list">
              {exprs.map((p) => (
                <ExprCard key={p.id} p={p} s={s} carousel width={cardW} onOpen={onOpen} />
              ))}
            </ScrollView>
          </LgIn>
        </>
      ) : null}
      <LgIn index={3}>
        <View style={styles.seg} accessibilityRole="tablist">
          {(
            [
              ['run', '진행 중', running.length],
              ['on', '참여 중', joined.length],
            ] as const
          ).map(([k, l, n]) => (
            <Pressable
              key={k}
              onPress={() => {
                sfx('tap');
                setSeg(k);
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: cur === k }}
              style={styles.segBtn}>
              <PText style={[styles.segT, cur === k && styles.segTOn]}>
                {l}
                <PText style={[styles.segN, cur === k && styles.segTOn]}>{` ${n}`}</PText>
              </PText>
              {cur === k ? <View style={styles.segBar} /> : null}
            </Pressable>
          ))}
          <View style={styles.sp} />
          <PText style={styles.segHint}>{cur === 'on' ? leftHint(data) : '지금 참여해도 함께해요'}</PText>
        </View>
      </LgIn>
      {segList.length ? cards(segList, 4) : <Empty>{cur === 'on' ? '참여 중인 챌린지가 없어요.\n진행 중 탭에서 골라 참여해 보세요.' : '지금 진행 중인 챌린지가 없어요.'}</Empty>}
      {upcoming.length ? (
        <>
          <LgIn index={4}>
            <Sec title="곧 시작해요" />
          </LgIn>
          {cards(upcoming, 4)}
        </>
      ) : null}
    </>
  );
}

/** 표현 필터: 찾기 (표현 · 뜻 · 예문 · 연 사람 · 출처) + 표현 챌린지 전체 (chxFind) */
function ExprSearch({ list, s, q, setQ, onOpen }: { list: Challenge[]; s: ChView; q: string; setQ: (t: string) => void; onOpen: (p: Challenge, write?: boolean) => void }) {
  const k = q.trim().toLowerCase();
  const hits = list.filter((p) => !k || [p.hl, p.ko, p.q, p.who, challengeSrc(p)].join(' ').toLowerCase().includes(k));
  // 머리 · 찾기 칸 · 첫 카드 사이를 이 안에서 정해요 (피드 gap 에 기대지 않게)
  return (
    <View style={styles.xWrap}>
      <LgIn style={styles.xHead}>
        <Sec title="표현 챌린지" sub="표현으로 나만의 문장 완성하기" />
      </LgIn>
      <LgIn index={1}>
        <SearchBox value={q} onChangeText={setQ} placeholder="표현 · 뜻 · 연 사람으로 찾기" label="표현 챌린지 찾기" />
      </LgIn>
      <LgIn index={2}>
        {hits.length ? (
          <View style={styles.xList}>
            {hits.map((p) => (
              <ExprCard key={p.id} p={p} s={s} onOpen={onOpen} />
            ))}
          </View>
        ) : (
          <Empty>{k ? `‘${q.trim()}’에 맞는 표현 챌린지가 없어요.\n직접 열어 보는 건 어때요?` : '아직 표현 챌린지가 없어요.\n내 표현함 표현으로 열어 보세요.'}</Empty>
        )}
      </LgIn>
    </View>
  );
}

const styles = StyleSheet.create({
  // .lg-subs: 위 12 · 옆 16 · 아래 4, 칩 사이 6
  subs: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 12, paddingHorizontal: 16, paddingBottom: 4 },
  sep: { width: 1.5, height: 22, marginHorizontal: 2, backgroundColor: '#DCD4C4' },
  chip: { height: 30, paddingHorizontal: 12, borderRadius: 15, borderWidth: 1.5, borderColor: '#CFC6B4', justifyContent: 'center' },
  chipOn: { backgroundColor: Colors.lavender, borderColor: Colors.purple },
  chipT: { fontFamily: Font.body800, fontSize: 12.5, lineHeight: 17, color: SUB },
  chipTOn: { color: Colors.purple },
  pressed: { opacity: 0.75 },
  // .lg-feed: 위 12 · 옆 16, 칸 사이 22
  feed: { paddingTop: 12, paddingHorizontal: 16, gap: 22 },
  hotWrap: { marginBottom: 18 },
  hs: { marginTop: -6, marginHorizontal: -16, marginBottom: 4 },
  hsIn: { gap: 12, paddingTop: 6, paddingHorizontal: 16, paddingBottom: 14 },
  seg: { flexDirection: 'row', alignItems: 'flex-end', gap: 18, marginTop: 4, marginBottom: -8, borderBottomWidth: 1.5, borderColor: Colors.line },
  segBtn: { paddingBottom: 9 },
  segT: { fontFamily: Font.body900, fontSize: 16, lineHeight: 24, color: SUB },
  segN: { fontFamily: Font.body800, fontSize: 12 },
  segTOn: { color: Colors.ink },
  segBar: { position: 'absolute', left: 0, right: 0, bottom: -1.5, height: 3, borderRadius: 2, backgroundColor: Colors.ink },
  sp: { flex: 1 },
  segHint: { paddingBottom: 9, fontFamily: Font.body700, fontSize: 12, lineHeight: 17, color: SUB },
  xWrap: { gap: 14 },
  // Sec 의 아래 여백 -8 (피드 gap 22 용)을 되돌려 찾기 칸과 14 띄워요
  xHead: { marginBottom: 8 },
  xList: { gap: 14 },
  spin: { paddingVertical: 30 },
});
