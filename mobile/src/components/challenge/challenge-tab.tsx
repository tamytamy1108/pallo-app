import { useMemo, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';

import { guardMember } from '@/components/common/trial-guide';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { allChallenges, challengeSrc, CH_CATS, isExpr, isJoined, isPre, toggleChecked, unitOf, useChallengeState, type ChCatKey, type Challenge, type ChView } from '@/data/challenge';
import { haptic, sfx } from '@/lib/feedback';

import { DailyCard, ExprCard, HotBox } from './cards';
import { CheckSheet } from './check-sheet';
import { ChxSheet } from './chx-sheet';
import { Empty, LgIn, LgLink, SearchBox, Sec, SUB } from './parts';

type Sub = 'all' | 'on' | ChCatKey;
const SUBS: [Sub, string][] = [['all', '전체'], ['on', '참여 중'], ...CH_CATS.map((c): [Sub, string] => [c.key, c.label])];

/** 지점 거르기 (lgBrOk): 전 지점 챌린지는 늘 보여요 */
const inBranch = (p: Challenge, branch: string) => branch === '전체' || !p.br || p.br.includes('전 지점') || p.br.includes(branch);

/**
 * 라운지 '챌린지' 탭 본문 (docs/pages/05-challenge.md · 프로토타입 lgBody case 'chal'). 라운지 화면이 이 컴포넌트를 그대로 넣어요.
 * - branch: 라운지 위에서 고른 지점 ('전체' 또는 지점 이름)
 * - header: 라운지의 지점 선택 버튼 — 서브 칩 줄 맨 앞에 넣어요
 * 라운지 세로 스크롤 안에 들어가서, 여기서는 세로 스크롤을 만들지 않아요 (옆으로 넘기는 줄만).
 * 담당: 챌린지. props 는 바꾸지 않아요(늘리기만).
 */
export function ChallengeTab({ branch, header }: { branch: string; header?: ReactNode }) {
  const s = useChallengeState();
  const [sub, setSub] = useState<Sub>('all');
  const [seg, setSeg] = useState<'run' | 'on' | null>(null);
  const [q, setQ] = useState('');
  const [checkFor, setCheckFor] = useState<Challenge | null>(null);
  // 표현 챌린지 창 (lgDetail → chxSheet): 라운지 위에 시트로
  const [chx, setChx] = useState<{ p: Challenge; write: boolean; open: boolean } | null>(null);
  const openExpr = (p: Challenge, write = false) => {
    sfx('tap');
    setChx({ p, write, open: true });
  };
  const { width: winW } = useWindowDimensions();
  const [feedW, setFeedW] = useState(winW - 32);

  const base = useMemo(
    () => allChallenges(s).filter((p) => inBranch(p, branch) && (sub === 'all' || sub === 'on' || (p.cat ?? 'study') === sub)),
    [s, branch, sub],
  );

  // 카드의 [오늘 인증]: 아직이면 인증 시트, 했으면 취소 (프로토타입 data-lg="chal")
  const onCheck = (p: Challenge) =>
    guardMember(() => {
      if (!s.checked[p.id] && (p.day || p.live)) {
        setCheckFor(p);
        return;
      }
      const on = toggleChecked(p);
      showToast(on ? (p.day ? `오늘 체크했어요 · ${p.day + 1}${unitOf(p)}째` : `${p.name} 신청했어요 · ${p.start}`) : '취소했어요');
    }, '챌린지에 인증하려면');

  const pickSub = (v: Sub) => {
    sfx('tap');
    haptic('select');
    setSub(v);
  };

  return (
    <View>
      {/* .lg-subs: 지점 버튼 · 구분선 · 서브 칩 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subs}>
        {header ? (
          <>
            {header}
            <View style={styles.sep} />
          </>
        ) : null}
        {SUBS.map(([v, l]) => (
          <Pressable
            key={v}
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
          <ExprSearch list={base.filter(isExpr)} s={s} q={q} setQ={setQ} onOpen={openExpr} />
        ) : (
          <Body base={base} s={s} sub={sub} seg={seg} setSeg={setSeg} feedW={feedW} onCheck={onCheck} onOpen={openExpr} onAll={() => pickSub('study')} />
        )}
      </View>

      <CheckSheet challenge={checkFor} onClose={() => setCheckFor(null)} />
      {chx ? <ChxSheet p={chx.p} open={chx.open} write={chx.write} onClose={() => setChx({ ...chx, open: false })} onClosed={() => setChx(null)} /> : null}
    </View>
  );
}

/** 오늘 인증 남은 수 문구 */
const leftHint = (mine: Challenge[], s: ChView) => {
  if (!mine.length) return '';
  const left = mine.filter((p) => !isPre(p) && !s.checked[p.id]).length;
  return left ? `오늘 인증 ${left}개 남았어요` : '오늘 인증 다 했어요!';
};

function Body({
  base,
  s,
  sub,
  seg,
  setSeg,
  feedW,
  onCheck,
  onOpen,
  onAll,
}: {
  base: Challenge[];
  s: ChView;
  sub: Sub;
  seg: 'run' | 'on' | null;
  setSeg: (v: 'run' | 'on') => void;
  feedW: number;
  onCheck: (p: Challenge) => void;
  onOpen: (p: Challenge, write?: boolean) => void;
  onAll: () => void;
}) {
  const X = base.filter(isExpr);
  const cas = base.filter((p) => !isExpr(p));
  const mine = cas.filter((p) => isJoined(p, s));
  const run = cas.filter((p) => !isJoined(p, s) && !isPre(p));
  const nw = cas.filter((p) => !isJoined(p, s) && isPre(p));
  const cards = (L: Challenge[], start = 0) => L.map((p, i) => <LgIn key={p.id} index={start + i}><DailyCard p={p} s={s} onCheck={onCheck} /></LgIn>);

  if (sub === 'on') {
    return (
      <>
        <LgIn>
          <Sec title="참여 중" sub={leftHint(mine, s)} />
        </LgIn>
        {mine.length ? cards(mine, 1) : <Empty>{'참여 중인 챌린지가 없어요.\n마음에 드는 챌린지에 참여해 보세요.'}</Empty>}
      </>
    );
  }

  // 진행 중 | 참여 중 을 한 자리에서 탭으로 (처음엔 참여 중인 게 있으면 참여 중)
  const cur = seg ?? (mine.length ? 'on' : 'run');
  const segList = cur === 'on' ? mine : run;
  const cardW = Math.round(feedW * 0.892);
  return (
    <>
      <LgIn index={0} style={styles.hotWrap}>
        <HotBox list={cas} s={s} />
      </LgIn>
      {X.length ? (
        <>
          <LgIn index={1}>
            <Sec title="표현 챌린지" sub={`나만의 문장 완성하기 · ${X.length}개`} right={X.length > 1 ? <LgLink label="모두 보기 ›" onPress={onAll} /> : null} />
          </LgIn>
          <LgIn index={2}>
            {/* .lg-hs.chxs: 옆으로 넘기는 한 줄 (카드 폭 88%) */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={cardW + 12}
              decelerationRate="fast"
              style={styles.hs}
              contentContainerStyle={styles.hsIn}
              accessibilityRole="list">
              {X.map((p) => (
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
              ['run', '진행 중', run.length],
              ['on', '참여 중', mine.length],
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
          <PText style={styles.segHint}>{cur === 'on' ? leftHint(mine, s) : '지금 참여해도 함께해요'}</PText>
        </View>
      </LgIn>
      {segList.length ? cards(segList, 4) : <Empty>{cur === 'on' ? '참여 중인 챌린지가 없어요.\n진행 중 탭에서 골라 참여해 보세요.' : '지금 진행 중인 챌린지가 없어요.'}</Empty>}
      {nw.length ? (
        <>
          <LgIn index={4}>
            <Sec title="곧 시작해요" />
          </LgIn>
          {cards(nw, 4)}
        </>
      ) : null}
    </>
  );
}

/** 표현 필터: 찾기 (표현 · 뜻 · 예문 · 연 사람 · 출처) + 표현 챌린지 전체 (chxFind) */
function ExprSearch({ list, s, q, setQ, onOpen }: { list: Challenge[]; s: ChView; q: string; setQ: (t: string) => void; onOpen: (p: Challenge, write?: boolean) => void }) {
  const k = q.trim().toLowerCase();
  const hits = list.filter((p) => !k || [p.hl, p.ko, p.q, p.who, challengeSrc(p)].join(' ').toLowerCase().includes(k));
  return (
    <>
      <LgIn>
        <Sec title="표현 챌린지" sub="표현으로 나만의 문장 완성하기" />
      </LgIn>
      <LgIn index={1} style={styles.findWrap}>
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
    </>
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
  findWrap: { marginTop: 4 },
  xList: { gap: 14 },
});
