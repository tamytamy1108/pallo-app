import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Pressable } from '@/components/ui/pressable';
import { useBlockedNames } from '@/components/common/report-sheet';
import { guardMember } from '@/components/common/trial-guide';
import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import {
  cardOfSaved,
  CH_CATS,
  CH_GD,
  CH_PH,
  CH_PW,
  CH_SRC,
  chPbgOf,
  createDaily,
  createExpression,
  DUR_OPTS,
  entriesOf,
  findSameExpr,
  isDarkBg,
  leftText,
  normExpr,
  PICK_DAYS,
  planOf,
  posterFontSize,
  START_OPTS,
  useChallengeState,
  XDUR_OPTS,
  type ChCatKey,
  type Challenge,
  type ChSrcKind,
  type DailyCatKey,
  type ExprCard,
  type StartOpt,
} from '@/data/challenge';
import { haptic, sfx } from '@/lib/feedback';
import { useSavedExpressions } from '@/state/expressions';
import { ChipScroll } from '@/components/ui/chip-scroll';
import { PosterPicker } from '@/components/event/form-parts';

import { ChIcon } from './icons';
import { Field, FieldLabel, LgBtn, Pills, SearchBox, SUB } from './parts';

/** 표현 목록: 이보다 많으면 찾기 · 나온 곳 칩 · 'N개 더 보기' (CH_PAGE) */
const PAGE = 6;
const SRC_KEYS = Object.keys(CH_SRC) as ChSrcKind[];
/** 카드 문구 칸: 영어 대문자 · 숫자 · 몇 가지 기호만 */
const cleanPw = (t: string) => t.toUpperCase().replace(/[^A-Z0-9 &:!'’.-]/g, '');

/**
 * 챌린지 열기 시트 (프로토타입 lgMkChal · chCatUp · chSumUp · lgChalList · chDupHTML · do-chal).
 * - 일상: 이름 · 시작 · 기간 · 인증 주기(매일 / 주 몇 회 + 요일) → '인증 N번이면 완주해요' · 인증 방법 · 안내 · 카드 문구
 * - 표현: 내 표현함에서 표현 하나 고르기(찾기 · 나온 곳 칩 · 더 보기, 고친 문장은 '내 문장') · 기간 · 내가 먼저 만든 문장.
 *   기간이 남은 같은 표현 챌린지가 있으면 그 챌린지로 안내하고 [표현 챌린지 열기]는 흐려져요.
 * preset: 내 표현함에서 고른 표현 id (?expr=)
 */
export function NewChallengeSheet({ open, onClose, onClosed, preset = [], onGoChallenge }: { open: boolean; onClose: () => void; onClosed?: () => void; preset?: string[]; onGoChallenge: (p: Challenge) => void }) {
  const s = useChallengeState();
  const saved = useSavedExpressions();
  const hide = useBlockedNames();
  const cards = useMemo(() => {
    const seen = new Set<string>();
    return saved.map(cardOfSaved).filter((c) => {
      const k = c.p.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [saved]);

  const [cat, setCat] = useState<ChCatKey>('study');
  const [name, setName] = useState('');
  const [start, setStart] = useState<StartOpt>('오늘');
  const [dur, setDur] = useState(7);
  const [weekly, setWeekly] = useState(false);
  const [n, setN] = useState(3);
  const [days, setDays] = useState<string[]>(['월', '수', '금']);
  const [photo, setPhoto] = useState(false);
  // 대표 사진 (선택): 순위 · 카드 · 상세의 네모 칸에 보여요. 없으면 카드 문구로
  const [covers, setCovers] = useState<string[]>([]);
  const [guide, setGuide] = useState('');
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  // 표현 챌린지는 한 번에 표현 하나 (프로토타입 LG.chs = [i])
  const [sel, setSel] = useState<string | null>(() => preset.find((id) => cards.some((c) => c.id === id)) ?? null);
  const [q, setQ] = useState('');
  const [chip, setChip] = useState<'all' | ChSrcKind>('all');
  const [more, setMore] = useState(false);
  const [xdur, setXdur] = useState(7);
  const [first, setFirst] = useState('');

  const study = cat === 'study';
  const plan = planOf(start, dur, weekly, n, days);
  const picked = cards.find((c) => c.id === sel) ?? null;
  const dup = picked ? findSameExpr(s, picked.p) : null;

  const changeN = (d: number) => {
    const next = Math.min(6, Math.max(1, n + d));
    sfx('tap');
    setN(next);
    setDays(PICK_DAYS.filter((w) => days.includes(w)).slice(0, next));
  };
  const toggleDay = (w: string) => setDays((cur) => (cur.includes(w) ? cur.filter((x) => x !== w) : cur.length >= n ? cur : [...cur, w]));
  const pick = (c: ExprCard) => {
    const on = sel !== c.id;
    sfx(on ? 'pick' : 'tap');
    haptic('select');
    setSel(on ? c.id : null);
  };

  const submit = () =>
    guardMember(() => {
      if (!study) {
        if (!plan.total) {
          showToast('인증할 요일을 하나 이상 골라 주세요');
          return;
        }
        if (!name.trim()) {
          showToast('챌린지 이름을 적어 주세요');
          return;
        }
        createDaily({ cat: cat as DailyCatKey, name: name.trim(), way: photo ? 'photo' : 'cmt', guide: guide.trim(), pw: [pw1.trim(), pw2.trim()].filter(Boolean), plan, cover: covers[0] });
        sfx('save');
        haptic('success');
        onClose();
        showToast(plan.off ? `챌린지를 열었어요 · ${plan.md}에 시작해요` : `챌린지를 열었어요 · 오늘부터 ${plan.freqT} 인증`);
        return;
      }
      if (dup) {
        showToast('이미 있는 표현이에요 · 그 챌린지에 참여해 주세요');
        return;
      }
      if (!picked) {
        showToast('불러올 표현을 1개 이상 골라 주세요');
        return;
      }
      createExpression({ card: picked, D: xdur, first: first.trim() });
      sfx('save');
      haptic('success');
      onClose();
      showToast(`나만의 문장 완성하기를 열었어요 · ${xdur}일 동안 함께해요`);
    }, '챌린지를 열려면');

  const pwDef = (CH_PW[cat as DailyCatKey] || CH_PW.free).split('\n');
  const pwLines = [pw1.trim(), pw2.trim()].filter(Boolean);
  const pwShown = (pwLines.length ? pwLines : pwDef).join('\n');
  const pbg = chPbgOf(cat);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      onClosed={onClosed}
      gap={22}
      title="챌린지 열기"
      footer={<LgBtn label={study ? '표현 챌린지 열기' : '챌린지 열기'} onPress={submit} off={study && !!dup} height={52} fontSize={15.5} wide />}>
      <View style={styles.fl}>
        <FieldLabel>카테고리</FieldLabel>
        <Pills options={CH_CATS.map((c) => c.key)} value={cat} onChange={setCat} label={(k) => CH_CATS.find((c) => c.key === k)?.label ?? ''} />
      </View>

      {study ? (
        <>
          <PText style={styles.xd}>
            {'표현 하나로 '}
            <PText style={styles.xdB}>나만의 문장 완성하기</PText>를 열어요.
          </PText>
          <View style={styles.fl}>
            <FieldLabel>아래 표현에서 불러오세요</FieldLabel>
          </View>
          <ExprPicker cards={cards} sel={sel} onPick={pick} q={q} setQ={setQ} chip={chip} setChip={setChip} more={more} setMore={setMore} />
          {dup ? <DupBox p={dup} count={entriesOf(dup, s, hide).length} onGo={() => onGoChallenge(dup)} /> : null}
          <View style={styles.fl}>
            <FieldLabel>기간</FieldLabel>
            <Pills options={XDUR_OPTS} value={xdur} onChange={setXdur} label={(d) => `${d}일`} />
          </View>
          <View style={styles.fl}>
            <FieldLabel>내가 먼저 만든 문장</FieldLabel>
            <Field multiline value={first} onChangeText={setFirst} placeholder={picked ? `예) ${picked.ex}` : '고른 표현으로 내 이야기를 한 문장 써 보세요'} accessibilityLabel="내가 먼저 만든 문장" />
          </View>
        </>
      ) : (
        <>
          <View style={styles.fl}>
            <FieldLabel>챌린지 이름</FieldLabel>
            <Field value={name} onChangeText={setName} placeholder={CH_PH[cat]} accessibilityLabel="챌린지 이름" />
          </View>
          <View style={styles.fl}>
            <FieldLabel>시작</FieldLabel>
            <Pills options={START_OPTS} value={start} onChange={setStart} />
          </View>
          <View style={styles.fl}>
            <FieldLabel>기간</FieldLabel>
            <Pills options={DUR_OPTS} value={dur} onChange={setDur} label={(d) => `${d}일`} />
          </View>
          <View style={styles.fl}>
            <FieldLabel>인증 주기</FieldLabel>
            <Pills options={['매일', '주 몇 회'] as const} value={weekly ? '주 몇 회' : '매일'} onChange={(v) => setWeekly(v === '주 몇 회')} />
            {weekly ? (
              <View style={styles.fx}>
                {/* .ch-step: − 주 n회 + */}
                <View style={styles.step}>
                  <Pressable onPress={() => changeN(-1)} accessibilityRole="button" accessibilityLabel="한 번 줄이기" style={styles.stepBtn}>
                    <PText style={styles.stepBtnT}>−</PText>
                  </Pressable>
                  <PText style={styles.stepN}>{`주 ${n}회`}</PText>
                  <Pressable onPress={() => changeN(1)} accessibilityRole="button" accessibilityLabel="한 번 늘리기" style={styles.stepBtn}>
                    <PText style={styles.stepBtnT}>+</PText>
                  </Pressable>
                </View>
                <PText style={styles.fxl}>
                  {'인증 요일 '}
                  <PText style={styles.fxlB}>{`${days.length} / ${n}`}</PText>
                  개 골랐어요
                </PText>
                <Pills options={PICK_DAYS} value={days} onChange={toggleDay} multi />
              </View>
            ) : null}
          </View>
          <PText style={styles.sum}>
            {plan.total ? (
              <>
                <PText style={styles.sumB}>{plan.off ? plan.md : '오늘'}</PText>
                {` 시작 · ${plan.D}일 동안 `}
                <PText style={styles.sumB}>{plan.freqT}</PText>
                {' · 인증 '}
                <PText style={styles.sumB}>{`${plan.total}번`}</PText>
                이면 완주해요
              </>
            ) : (
              `인증 요일을 ${n}개 골라 주세요`
            )}
          </PText>
          <View style={styles.fl}>
            <FieldLabel>인증 방법</FieldLabel>
            <Pills options={['댓글로 인증', '사진 + 댓글'] as const} value={photo ? '사진 + 댓글' : '댓글로 인증'} onChange={(v) => setPhoto(v === '사진 + 댓글')} />
            <PText style={styles.wayd}>{photo ? '사진을 1장 이상 올려야 체크돼요. 댓글은 함께 남겨요.' : '그날 댓글 한 줄만 남기면 체크돼요.'}</PText>
          </View>
          <View style={styles.fl}>
            <FieldLabel>어떻게 인증하나요?</FieldLabel>
            <Field value={guide} onChangeText={setGuide} placeholder={CH_GD[cat as DailyCatKey]} accessibilityLabel="어떻게 인증하나요?" />
          </View>
          <View style={styles.fl}>
            <FieldLabel>대표 사진 · 선택</FieldLabel>
            <PosterPicker uris={covers} onChange={setCovers} emptyLabel="사진 넣기" max={1} />
            <PText style={styles.wayd}>순위 · 카드의 네모 칸에 보여요. 없으면 아래 카드 문구로 보여요.</PText>
          </View>
          <View style={styles.fl}>
            <FieldLabel>카드 문구</FieldLabel>
            <View style={styles.pwRow}>
              <View style={[styles.pv, { backgroundColor: pbg }]}>
                <PText style={[styles.pvT, { fontSize: posterFontSize(pwShown), color: isDarkBg(pbg) ? Colors.yellow : Colors.ink }]}>{pwShown}</PText>
              </View>
              <View style={styles.ins}>
                {[
                  [pw1, setPw1, pwDef[0] ?? '', '카드 문구 첫 줄'] as const,
                  [pw2, setPw2, pwDef.slice(1).join(' '), '카드 문구 둘째 줄'] as const,
                ].map(([v, set, ph, a11y]) => (
                  <TextInput
                    key={a11y}
                    value={v}
                    onChangeText={(t) => set(cleanPw(t))}
                    maxLength={9}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    placeholder={ph}
                    placeholderTextColor="#9B94A6"
                    accessibilityLabel={a11y}
                    style={styles.pwIn}
                  />
                ))}
              </View>
            </View>
            <PText style={styles.wayd}>비워 두면 자동으로 들어가요.</PText>
          </View>
        </>
      )}
    </Sheet>
  );
}

/** 내 표현함 표현 고르기 (lgChalTools + lgChalList): 6개가 넘으면 찾기 · 나온 곳 칩 · 고른 건 맨 위 · 'N개 더 보기' */
function ExprPicker({
  cards,
  sel,
  onPick,
  q,
  setQ,
  chip,
  setChip,
  more,
  setMore,
}: {
  cards: ExprCard[];
  sel: string | null;
  onPick: (c: ExprCard) => void;
  q: string;
  setQ: (t: string) => void;
  chip: 'all' | ChSrcKind;
  setChip: (k: 'all' | ChSrcKind) => void;
  more: boolean;
  setMore: (v: boolean) => void;
}) {
  if (!cards.length) return <PText style={styles.empty}>{'아직 저장한 표현이 없어요.\n학습 중에 저장 버튼을 누르면\n여기서 불러올 수 있어요.'}</PText>;
  if (cards.length <= PAGE) {
    return (
      <View style={styles.list}>
        {cards.map((c) => (
          <PickCard key={c.id} c={c} on={sel === c.id} onPress={() => onPick(c)} from={false} />
        ))}
      </View>
    );
  }
  const k = normExpr(q);
  const kinds = SRC_KEYS.filter((x) => cards.some((c) => c.src.k === x));
  const hits = cards.filter((c) => c.id === sel || ((chip === 'all' || c.src.k === chip) && (!k || normExpr(`${c.p} ${c.ex}`).includes(k) || (!!q.trim() && c.m.includes(q.trim())))));
  const ord = [...hits.filter((c) => c.id === sel), ...hits.filter((c) => c.id !== sel)];
  const lim = more ? ord.length : PAGE;
  return (
    <>
      <SearchBox
        value={q}
        onChangeText={(t) => {
          setQ(t);
          setMore(false);
        }}
        placeholder="표현 · 뜻으로 찾기"
        label="내 표현함에서 찾기"
      />
      <ChipScroll horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {(['all', ...kinds] as const).map((x) => {
          const on = chip === x;
          const label = x === 'all' ? `전체 ${cards.length}` : `${CH_SRC[x].label} ${cards.filter((c) => c.src.k === x).length}`;
          return (
            <Pressable
              key={x}
              onPress={() => {
                sfx('tap');
                setChip(x);
                setMore(false);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              style={[styles.chip, on && styles.chipOn]}>
              <PText style={[styles.chipT, on && styles.chipTOn]}>{label}</PText>
            </Pressable>
          );
        })}
      </ChipScroll>
      {ord.length ? (
        <View>
          {/* .ch-list: 최대 300 높이 · 안쪽 스크롤 */}
          <ScrollView nestedScrollEnabled style={styles.listBox} contentContainerStyle={styles.list}>
            {ord.slice(0, lim).map((c) => (
              <PickCard key={c.id} c={c} on={sel === c.id} onPress={() => onPick(c)} />
            ))}
          </ScrollView>
          {ord.length > lim ? (
            <Pressable onPress={() => setMore(true)} accessibilityRole="button" style={styles.more}>
              <PText style={styles.moreT}>{`${ord.length - lim}개 더 보기`}</PText>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <PText style={styles.empty}>{`‘${q}’에 맞는 표현이 없어요.`}</PText>
      )}
    </>
  );
}

/** 표현 카드 한 장 (.ch-card): 체크 · 표현 · 뜻 · 나온 곳 · 예문(고친 문장이면 '내 문장') */
function PickCard({ c, on, onPress, from = true }: { c: ExprCard; on: boolean; onPress: () => void; from?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={`${c.p} ${c.m}`} style={[styles.card, on && styles.cardOn]}>
      <View style={[styles.ck, on && styles.ckOn]}>{on ? <ChIcon name="tick" size={14} width={3.4} /> : null}</View>
      <View style={styles.tx}>
        <PText style={styles.cardB}>{c.p}</PText>
        <PText style={styles.cardS}>{c.m}</PText>
        {from ? (
          <View style={styles.from}>
            <ChIcon name={CH_SRC[c.src.k].icon} size={12} color={SUB} />
            <PText numberOfLines={1} style={styles.fromT}>
              {c.srcLabel}
            </PText>
          </View>
        ) : null}
        <PText style={styles.cardEm}>{c.ex}</PText>
      </View>
      {c.mine ? <PText style={styles.mine}>내 문장</PText> : null}
    </Pressable>
  );
}

/** 같은 표현 챌린지 안내 (.ch-dup) */
function DupBox({ p, count, onGo }: { p: Challenge; count: number; onGo: () => void }) {
  return (
    <View>
      <View>
        <View style={styles.dupShadow} />
        <View style={styles.dup} accessibilityRole="alert">
          <View style={styles.dupIc}>
            <ChIcon name="cmt" size={16} />
          </View>
          <View style={styles.dupTx}>
            <PText style={styles.dupK}>이미 있는 챌린지예요</PText>
            <PText style={styles.dupB}>{`${p.host}의 ${p.hl}`}</PText>
            <PText style={styles.dupS}>{`${leftText(p)} · 댓글 ${count}개`}</PText>
          </View>
          <LgBtn label="댓글 달기" tone="purple" onPress={onGo} style={styles.dupBtn} />
        </View>
      </View>
      <PText style={styles.dupN}>같은 표현은 새로 열 수 없어요.</PText>
    </View>
  );
}

const styles = StyleSheet.create({
  fl: { gap: 8 },
  xd: { fontFamily: Font.body700, fontSize: 13, lineHeight: 20.15, color: Colors.purple },
  xdB: { fontFamily: Font.body900, fontSize: 13, color: Colors.purple },
  fx: { gap: 8, marginTop: 4 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', padding: 3, borderRadius: 22, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white },
  stepBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.purple, alignItems: 'center', justifyContent: 'center' },
  stepBtnT: { fontFamily: Font.body900, fontSize: 20, lineHeight: 22, color: Colors.white },
  stepN: { width: 72, textAlign: 'center', fontFamily: Font.body900, fontSize: 15, lineHeight: 21 },
  fxl: { marginTop: 4, fontFamily: Font.body800, fontSize: 12, lineHeight: 17, color: SUB },
  fxlB: { fontFamily: Font.body900, fontSize: 12, color: SUB },
  sum: { fontFamily: Font.body700, fontSize: 13, lineHeight: 19.5, color: SUB },
  sumB: { fontFamily: Font.body900, fontSize: 13, color: Colors.purple },
  wayd: { fontFamily: Font.body700, fontSize: 12, lineHeight: 17, color: SUB },
  pwRow: { flexDirection: 'row', gap: 12 },
  pv: { width: 100, height: 108, borderWidth: 2, borderColor: Colors.ink, borderTopLeftRadius: 16, borderBottomLeftRadius: 16 },
  pvT: { position: 'absolute', top: 12, left: 10, right: 6, fontFamily: Font.display, lineHeight: 14, letterSpacing: -0.3 },
  ins: { flex: 1, gap: 8, justifyContent: 'center' },
  pwIn: { height: 44, paddingVertical: 0, includeFontPadding: false, textAlignVertical: 'center', paddingHorizontal: 14, borderRadius: 14, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, fontFamily: Font.display, fontSize: 15, color: Colors.ink },
  chips: { flexDirection: 'row', gap: 6 },
  chip: { height: 32, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1.5, borderColor: Colors.line, backgroundColor: Colors.white, justifyContent: 'center' },
  chipOn: { backgroundColor: Colors.ink, borderColor: Colors.ink },
  chipT: { fontFamily: Font.body800, fontSize: 12.5, lineHeight: 17 },
  chipTOn: { color: Colors.white },
  listBox: { maxHeight: 300 },
  list: { gap: 8, paddingBottom: 3 },
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 11, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1.5, borderColor: '#E1D9C8', backgroundColor: Colors.white },
  cardOn: { backgroundColor: '#FFF9D6', borderWidth: 2, borderColor: Colors.ink, boxShadow: [{ offsetX: 0, offsetY: 3, blurRadius: 0, color: Colors.ink }] },
  ck: { width: 26, height: 26, borderRadius: 7, borderWidth: 2, borderColor: '#CFC7B6', alignItems: 'center', justifyContent: 'center' },
  ckOn: { backgroundColor: Colors.yellow, borderColor: Colors.ink },
  tx: { flex: 1, minWidth: 0, gap: 2, paddingRight: 58 },
  cardB: { fontFamily: Font.body900, fontSize: 15, lineHeight: 21 },
  cardS: { fontFamily: Font.body700, fontSize: 12, lineHeight: 17, color: SUB },
  from: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  fromT: { flexShrink: 1, fontFamily: Font.body800, fontSize: 11.5, lineHeight: 16, color: SUB },
  cardEm: { fontFamily: Font.body600, fontSize: 12.5, lineHeight: 19, color: '#8478B5' },
  mine: { position: 'absolute', right: 10, top: 10, paddingVertical: 2, paddingHorizontal: 7, borderRadius: 8, overflow: 'hidden', backgroundColor: '#E3F5EA', fontFamily: Font.body900, fontSize: 10.5, lineHeight: 15, color: '#2E8B57' },
  more: { height: 44, marginTop: 8, borderRadius: 16, borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.line, alignItems: 'center', justifyContent: 'center' },
  moreT: { fontFamily: Font.body800, fontSize: 13.5, lineHeight: 19, color: SUB },
  empty: { textAlign: 'center', paddingVertical: 30, paddingHorizontal: 10, fontFamily: Font.body700, fontSize: 14, lineHeight: 22, color: SUB },
  dupShadow: { position: 'absolute', top: 3, left: 3, right: -3, bottom: -3, borderRadius: 16, backgroundColor: Colors.ink },
  dup: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 16, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white },
  dupIc: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.yellow, alignItems: 'center', justifyContent: 'center' },
  dupTx: { flex: 1, minWidth: 0 },
  dupBtn: { alignSelf: 'center' },
  dupK: { fontFamily: Font.body800, fontSize: 11.5, lineHeight: 16.1, color: Colors.purple },
  dupB: { fontFamily: Font.body900, fontSize: 13.5, lineHeight: 18.2 },
  dupS: { marginTop: 2, fontFamily: Font.body700, fontSize: 11.5, lineHeight: 16.1, color: SUB },
  dupN: { marginTop: 10, marginHorizontal: 2, fontFamily: Font.body700, fontSize: 12.5, lineHeight: 18.75, color: SUB },
});
