import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { BackHandler, StyleSheet, TextInput, View, type ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Pressable } from '@/components/ui/pressable';
import { ChangeCalendar } from '@/components/account/change-calendar';
import { AccountPage, Box, ChoiceChip, Icon, Lift, type IconName } from '@/components/account/parts';
import { submitChangeRequest } from '@/components/account/store';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import {
  addDays,
  BRANCH_REGIONS,
  BRANCHES,
  CHANGE_KIND,
  CHANGE_MIN,
  changesLeftText,
  fmtDay,
  getMembership,
  MY_BRANCH,
  MY_TEAMS,
  REST_LENGTHS,
  TEAM_LANGS,
  teamLabel,
  teamsOf,
  teamWeekdays,
  TODAY,
  type ChangeKind,
  type RestLength,
  type Team,
} from '@/data/account';
import { haptic, sfx } from '@/lib/feedback';
import { useKeyboardShown } from '@/lib/keyboard';

/**
 * 연기 · 팀 · 지점 변경 신청서 (프로토타입 chgHTML · cgSum · CF).
 * 무엇을 바꿀까요(종류) → 종류별 질문 → 신청 확인(남길 말) → 신청하기. 신청 중 상태는 내 스터디 카드와 같이 봐요.
 * 쉬어가기는 한 번에 최대 1달 · 새 일정은 오늘 + 2주 ~ 이용권 끝나는 날 · 자리 수 · 프로 이름은 보여 주지 않아요.
 * 맞는 API: 38 `/branches/:id/teams` · 39 `POST /me/change-requests`
 */

type Step = 'pick' | 'form' | 'confirm';
type Form = { step: Step; kind: ChangeKind; cls: 'all' | number; dur: RestLength; start: number | null; mon: number; br: string; to: Team | null; calOpen: boolean; msg: string };
type Summary = { ok: false; txt: string } | { ok: true; label: string; st: Date; en?: Date; txt: string };

const fresh = (): Form => ({ step: 'pick', kind: 'rest', cls: 'all', dur: '2주', start: null, mon: CHANGE_MIN.getMonth(), br: MY_BRANCH, to: null, calOpen: false, msg: '' });

const restEnd = (st: Date, dur: RestLength) => (dur === '1달' ? new Date(st.getFullYear(), st.getMonth() + 1, st.getDate() - 1) : addDays(st, { '1주': 7, '2주': 14, '3주': 21 }[dur] - 1));
/** 쉬는 동안 빠지는 수업 수 (프로토타입 cgRestN) */
function restCount(T: Team[], st: Date, en: Date) {
  let n = 0;
  for (let d = new Date(st); d <= en; d = addDays(d, 1)) {
    const wd = d.getDay();
    n += T.filter((t) => teamWeekdays(t).includes(wd)).length;
  }
  return n;
}

const KIND_CARD: [ChangeKind, IconName, string, string][] = [
  ['rest', 'clock', Colors.yellow, '출장 · 여행 · 바쁜 기간 · 한 번에 최대 1달'],
  ['team', 'cal', '#C9B8F0', '언어 · 요일 · 시간을 바꿔요'],
  ['branch', 'pin', Colors.sky, '이사 · 회사 이동'],
];

export default function ChangeScreen() {
  const ms = getMembership();
  const T = MY_TEAMS;
  const [f, setF] = useState<Form>(fresh);
  const [sent, setSent] = useState<{ label: string; txt: string } | null>(null);
  const scroll = useRef<ScrollViewInstance>(null);
  const set = (patch: Partial<Form>) => setF((p) => ({ ...p, ...patch }));
  const toTop = () => requestAnimationFrame(() => scroll.current?.scrollTo({ y: 0, animated: false }));

  // 고른 종류의 대상 수업 (프로토타입 cgCls)
  const cls: Team[] = f.kind === 'rest' ? (f.cls === 'all' ? T : [T[f.cls]]) : f.kind === 'add' ? [] : [T[f.cls === 'all' ? 0 : f.cls]];
  const pickBranch = f.kind === 'branch' ? f.br : MY_BRANCH;
  // 들어갈 수 있는 팀: 자리 있고 · 이미 듣는 팀 빼고 · 언어 순 (프로토타입 cgMatch)
  const mine = T.map((x) => x.branch + x.no);
  const match = teamsOf(pickBranch)
    .filter((x) => (x.seats ?? 0) > 0 && !mine.includes(x.branch + x.no))
    .sort((p, q) => TEAM_LANGS.indexOf(p.lang) - TEAM_LANGS.indexOf(q.lang));
  const sum = summarize();

  function summarize(): Summary {
    const st = f.start ? new Date(f.start) : null;
    if (!ms.pp && f.kind !== 'add') return { ok: false, txt: '연기 · 변경 횟수를 다 썼어요 · 운영진에게 문의해 주세요' };
    if (f.kind === 'rest') {
      if (!st) return { ok: false, txt: '언제부터 쉴지 골라 주세요' };
      const en = restEnd(st, f.dur);
      return { ok: true, label: '연기', st, en, txt: `${cls.map(teamLabel).join(' · ')} 수업을 ${fmtDay(st)}부터 ${fmtDay(en)}까지 쉬고 ${fmtDay(addDays(en, 1))}부터 다시 들어요` };
    }
    if (!f.to) return { ok: false, txt: '옮길 팀을 골라 주세요' };
    if (!st) return { ok: false, txt: '언제부터 들을지 골라 주세요' };
    const label = CHANGE_KIND[f.kind][1];
    if (f.kind === 'add') return { ok: true, label, st, txt: `${fmtDay(st)}부터 ${teamLabel(f.to)} 수업을 더해요 · 주 ${ms.wk}회 → ${ms.wk + ms.plan.perWeek}회` };
    const t = cls[0];
    return { ok: true, label, st, txt: `${fmtDay(addDays(st, -1))}까지 ${teamLabel(t)}, ${fmtDay(st)}부터 ${f.to.branch === t.branch ? '' : f.to.branch + ' '}${teamLabel(f.to)}에서 들어요` };
  }

  const back = () => {
    if (f.step === 'confirm') set({ step: 'form' });
    else if (f.step === 'form') setF(fresh());
    else {
      router.back();
      return;
    }
    toTop();
  };

  // 안드로이드 뒤로 버튼도 단계부터 되돌려요
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (f.step === 'pick') return false;
      back();
      return true;
    });
    return () => sub.remove();
  });

  const send = () => {
    if (!sum.ok) return;
    submitChangeRequest({ label: sum.label, txt: sum.txt, msg: f.msg });
    sfx('save');
    haptic('success');
    setSent({ label: sum.label, txt: sum.txt });
  };

  const calendar =
    <ChangeCalendar
      mon={f.mon}
      minMon={CHANGE_MIN.getMonth()}
      maxMon={TODAY.getMonth() + 6}
      min={CHANGE_MIN}
      max={ms.exp}
      start={f.start}
      end={f.kind === 'rest' && f.start ? restEnd(new Date(f.start), f.dur) : null}
      onMonth={(d) => set({ mon: f.mon + d })}
      onPick={(t) => set({ start: t })}
    />;

  // ---------- 1. 무엇을 바꿀까요? ----------
  if (f.step === 'pick') {
    const cards = [...KIND_CARD];
    if (!ms.plan.fixed && T.length < ms.plan.teams) cards.push(['add', 'plus', '#CDEBD0', `주 ${ms.plan.perWeek}회 더 · 횟수를 더 빨리 써요 · ${ms.plan.teams}팀까지`]);
    return (
      <AccountPage title="연기 · 팀 · 지점 변경" scrollRef={scroll} bodyStyle={styles.body}>
        <View style={styles.cgTop}>
          <PText style={styles.cgTopText}>{`${ms.name} · 남은 ${ms.left}회`}</PText>
          <PText style={styles.cgTopText}>{`연기 · 변경 ${changesLeftText(ms.pp)}`}</PText>
        </View>
        <PText style={styles.q}>무엇을 바꿀까요?</PText>
        {cards.map(([k, ic, bg, sub]) => {
          const off = !ms.pp && k !== 'add';
          return (
            <Pressable
              key={k}
              disabled={off}
              onPress={() => {
                sfx('tap');
                setF({ ...fresh(), step: 'form', kind: k, cls: k === 'rest' ? 'all' : 0 });
                toTop();
              }}
              accessibilityRole="button"
              accessibilityState={{ disabled: off }}
              style={off ? styles.dim : undefined}>
              {({ pressed }) => (
                <Lift radius={22} pressed={pressed}>
                  <View style={styles.kind}>
                    <View style={[styles.kindIc, { backgroundColor: bg }]}>
                      <Icon name={ic} size={20} />
                    </View>
                    <View style={styles.kindTx}>
                      <PText style={styles.kindB}>{CHANGE_KIND[k][0]}</PText>
                      <PText style={styles.kindS}>{sub}</PText>
                    </View>
                    <PText style={styles.kindGo}>›</PText>
                  </View>
                </Lift>
              )}
            </Pressable>
          );
        })}
        <PText style={styles.rule}>
          {`새 일정은 2주 뒤(${fmtDay(CHANGE_MIN)})부터 시작해요 · 연기 · 팀 변경 · 지점 이동은 신청 1번에 1번 써요${ms.plan.fixed ? ` · ${ms.name}은 늘 ${ms.plan.teams}팀이라 팀은 바꾸기만 돼요` : ` · 팀은 ${ms.plan.teams}팀까지 더할 수 있어요 · 지금 ${T.length}팀`}`}
        </PText>
      </AccountPage>
    );
  }

  // ---------- 3. 신청 확인 ----------
  if (f.step === 'confirm' && sum.ok) {
    const cn = cls.map((x) => x.no);
    const others = T.filter((x) => !cn.includes(x.no));
    const rows: [string, string][] = [
      ...others.map((x): [string, string] => [teamLabel(x), '그대로']),
      f.kind === 'add' ? ['주 참여', `주 ${ms.wk}회 → ${ms.wk + ms.plan.perWeek}회`] : ['연기 · 변경', `1번 써요 · ${changesLeftText(ms.pp)}${ms.pp === Infinity ? '' : ' 남음'}`],
    ];
    return (
      <AccountPage title="신청 확인" onBack={back} scrollRef={scroll} bodyStyle={styles.body} bottom={<Foot note="운영진이 확인하면 알림으로 알려 드려요" label={`${sum.label} 신청하기`} ok onPress={send} />}>
        <PText style={styles.q}>이렇게 바뀌어요</PText>
        <Box style={styles.baw}>
          {f.kind === 'rest' && sum.en ? (
            <>
              <PText style={styles.baS}>{`${fmtDay(sum.st)} ~ ${fmtDay(sum.en)}`}</PText>
              <PText style={styles.baB}>{cls.map(teamLabel).join('\n')}</PText>
              <Tag icon="clock" label={`쉬어요 · 수업 ${restCount(cls, sum.st, sum.en)}회`} />
              <PText style={styles.baS}>{`${fmtDay(addDays(sum.en, 1))}부터 다시 들어요`}</PText>
            </>
          ) : f.kind === 'add' && f.to ? (
            <>
              <PText style={styles.baS}>{`${fmtDay(sum.st)}부터 더해요`}</PText>
              <PText style={styles.baB}>{teamLabel(f.to)}</PText>
              <PText style={styles.baS}>{f.to.branch}</PText>
            </>
          ) : f.to ? (
            <>
              <PText style={styles.baS}>{`${fmtDay(addDays(sum.st, -1))}까지`}</PText>
              <PText style={styles.baB}>{teamLabel(cls[0])}</PText>
              <PText style={styles.baS}>{cls[0].branch}</PText>
              <Tag icon="back" label={CHANGE_KIND[f.kind][1]} />
              <PText style={styles.baS}>{`${fmtDay(sum.st)}부터`}</PText>
              <PText style={styles.baB}>{teamLabel(f.to)}</PText>
              <PText style={styles.baS}>{f.to.branch}</PText>
            </>
          ) : null}
        </Box>
        <Box style={styles.rows}>
          {rows.map(([a, b], i) => (
            <View key={a} style={[styles.row, i > 0 && styles.rowLine]}>
              <PText style={styles.rowK}>{a}</PText>
              <PText style={styles.rowV}>{b}</PText>
            </View>
          ))}
        </Box>
        <PText style={styles.q2}>
          운영진에게 남길 말 <PText style={styles.q2s}>선택</PText>
        </PText>
        <TextInput
          value={f.msg}
          onChangeText={(t) => set({ msg: t })}
          maxLength={200}
          multiline
          placeholder="예) 회사 일정이 바뀌었어요"
          placeholderTextColor="#9B94A6"
          accessibilityLabel="운영진에게 남길 말"
          style={styles.msg}
        />
        <Sheet
          open={!!sent}
          onClose={() => {
            setSent(null);
            router.back();
          }}
          title={`${sent?.label ?? ''} 신청했어요`}
          footer={
            <View style={styles.flex}>
              <Button
                label="확인"
                wide
                onPress={() => {
                  setSent(null);
                  router.back();
                }}
              />
            </View>
          }>
          <PText style={styles.ds}>{sent?.txt}</PText>
          <PText style={[styles.ds, styles.ds2]}>운영진이 확인하면 알림으로 알려 드려요. 확정 전에는 마이에서 취소할 수 있어요.</PText>
        </Sheet>
      </AccountPage>
    );
  }

  // ---------- 2. 종류별 질문 ----------
  const k = f.kind;
  return (
    <AccountPage
      title={CHANGE_KIND[k][0]}
      onBack={back}
      scrollRef={scroll}
      bodyStyle={styles.body}
      bottom={
        <Foot
          note={sum.ok ? '' : sum.txt}
          label="다음"
          ok={sum.ok}
          onPress={() => {
            if (!sum.ok) return;
            set({ step: 'confirm' });
            toTop();
          }}
        />
      }>
      {k === 'rest' ? (
        <>
          <PText style={styles.q}>어떤 수업을 쉴까요?</PText>
          <View style={styles.chips}>
            {T.length > 1 ? <ChoiceChip label="모든 수업" on={f.cls === 'all'} onPress={() => set({ cls: 'all', to: null })} /> : null}
            {T.map((x, i) => (
              <ChoiceChip key={x.no} label={teamLabel(x)} on={f.cls === i || T.length === 1} onPress={() => set({ cls: i, to: null })} />
            ))}
          </View>
          <PText style={styles.q}>얼마나 쉴까요?</PText>
          <View style={styles.chips}>
            {REST_LENGTHS.map((d) => (
              <ChoiceChip key={d} label={d} on={f.dur === d} onPress={() => set({ dur: d })} />
            ))}
          </View>
          <PText style={styles.note}>한 번에 최대 1달 · 더 쉬려면 다시 신청해요</PText>
          <PText style={styles.q}>언제부터 쉴까요?</PText>
          {calendar}
          {sum.ok && sum.en ? (
            <Box color="#F6F1FF" style={styles.res}>
              <PText style={styles.resB}>{`${fmtDay(sum.st)} ~ ${fmtDay(sum.en)} 쉬어요`}</PText>
              <PText style={styles.resS}>{`수업 ${restCount(cls, sum.st, sum.en)}회를 쉬고 ${fmtDay(addDays(sum.en, 1))}부터 다시 들어요`}</PText>
            </Box>
          ) : null}
        </>
      ) : (
        <>
          {k !== 'add' ? (
            <>
              <PText style={styles.q}>{`어떤 수업을 ${k === 'branch' ? '옮길까요' : '바꿀까요'}?`}</PText>
              <View style={styles.chips}>
                {T.map((x, i) => (
                  <ChoiceChip key={x.no} label={teamLabel(x)} on={(f.cls === 'all' ? 0 : f.cls) === i} onPress={() => set({ cls: i, to: null })} />
                ))}
              </View>
            </>
          ) : null}
          {k === 'branch' ? (
            <>
              <PText style={styles.q}>어느 지점으로요?</PText>
              <Box style={styles.brall}>
                {BRANCH_REGIONS.map((r) => (
                  <View key={r}>
                    <PText style={styles.rgl}>{r}</PText>
                    <View style={styles.brs}>
                      {BRANCHES.filter((b) => b[1] === r).map(([b]) => {
                        const on = f.br === b;
                        return (
                          <Pressable
                            key={b}
                            onPress={() => {
                              sfx('tap');
                              set({ br: b, to: null });
                            }}
                            accessibilityRole="button"
                            accessibilityState={{ selected: on }}
                            style={[styles.br, on && styles.brOn]}>
                            <PText style={[styles.brText, on && styles.brTextOn]}>{b}</PText>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                ))}
              </Box>
            </>
          ) : null}
          <PText style={styles.q}>{k === 'add' ? '어느 팀을 더할까요?' : '어느 팀으로 갈까요?'}</PText>
          <PText style={styles.q2}>{`${pickBranch} · 들어갈 수 있는 팀`}</PText>
          <View style={styles.teams} accessibilityRole="radiogroup">
            {match.length ? (
              match.map((x) => {
                const on = !!f.to && f.to.branch === x.branch && f.to.no === x.no;
                return (
                  <Pressable
                    key={x.no}
                    onPress={() => {
                      sfx('tap');
                      haptic('select');
                      set({ to: x });
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: on }}>
                    <Lift radius={16} dx={on ? 2 : 0} dy={on ? 2 : 0} color={Colors.purple}>
                      <View style={[styles.team, on && styles.teamOn]}>
                        <View style={[styles.rd, on && styles.rdOn]} />
                        <PText style={styles.teamB}>{teamLabel(x)}</PText>
                      </View>
                    </Lift>
                  </Pressable>
                );
              })
            ) : (
              <PText style={styles.empty}>지금 들어갈 수 있는 팀이 없어요 · 운영진에게 남길 말로 요청해 주세요</PText>
            )}
          </View>
          <PText style={styles.q}>언제부터요?</PText>
          <View style={styles.chips}>
            <ChoiceChip label={`${fmtDay(CHANGE_MIN)} · 가장 빠른 날`} on={f.start === CHANGE_MIN.getTime()} onPress={() => set({ start: CHANGE_MIN.getTime(), calOpen: false })} />
            <ChoiceChip label="날짜 고르기" on={f.calOpen} onPress={() => set({ calOpen: !f.calOpen })} />
          </View>
          {f.calOpen ? calendar : null}
        </>
      )}
    </AccountPage>
  );
}

/** 쉬어요 · 팀 변경 표시 (프로토타입 .cg-ba .tag — 아이콘을 -90° 돌려 아래 화살표처럼) */
function Tag({ icon, label }: { icon: IconName; label: string }) {
  return (
    <View style={styles.tag}>
      <View style={styles.tagIc}>
        <Icon name={icon} size={16} color={Colors.purple} />
      </View>
      <PText style={styles.tagText}>{label}</PText>
    </View>
  );
}

/** 아래 고정 바 + 막힘 · 안내 한 줄 (프로토타입 .lg-dcta.cg-foot) */
function Foot({ note, label, ok, onPress }: { note: string; label: string; ok: boolean; onPress: () => void }) {
  const insets = useSafeAreaInsets();
  const kb = useKeyboardShown();
  return (
    <View style={[styles.foot, { paddingBottom: 18 + (kb ? 0 : insets.bottom) }]}>
      {note ? <PText style={styles.footNote}>{note}</PText> : null}
      <Button label={label} wide disabled={!ok} onPress={onPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { paddingTop: 8, paddingBottom: 40, gap: 10 },
  dim: { opacity: 0.45 },
  cgTop: { flexDirection: 'row', justifyContent: 'space-between' },
  cgTopText: { fontFamily: Font.body800, fontSize: 12.5, lineHeight: 18, color: Colors.inkSub },
  q: { marginTop: 14, fontFamily: Font.body900, fontSize: 17, lineHeight: 24 },
  q2: { marginTop: 8, fontFamily: Font.body900, fontSize: 13, lineHeight: 19, color: Colors.inkSub },
  q2s: { fontFamily: Font.body800, fontSize: 11, color: Colors.inkSub },
  kind: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 14, borderRadius: 22, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white },
  kindIc: { width: 42, height: 42, borderRadius: 13, borderWidth: 2, borderColor: Colors.ink, alignItems: 'center', justifyContent: 'center' },
  kindTx: { flex: 1, gap: 1 },
  kindB: { fontFamily: Font.body900, fontSize: 15.5, lineHeight: 22 },
  kindS: { fontFamily: Font.body700, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  kindGo: { fontFamily: Font.body900, fontSize: 16, color: Colors.inkSub },
  rule: { paddingHorizontal: 2, fontFamily: Font.body700, fontSize: 12.5, lineHeight: 20.6, color: Colors.inkSub },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, alignItems: 'center' },
  note: { fontFamily: Font.body700, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  res: { paddingVertical: 12, paddingHorizontal: 14, gap: 3 },
  resB: { fontFamily: Font.body900, fontSize: 14.5, lineHeight: 21 },
  resS: { fontFamily: Font.body700, fontSize: 12.5, lineHeight: 18, color: Colors.inkSub },
  brall: { paddingTop: 4, paddingHorizontal: 12, paddingBottom: 12 },
  rgl: { paddingTop: 10, paddingBottom: 6, paddingHorizontal: 2, fontFamily: Font.body900, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  brs: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  br: { height: 34, paddingHorizontal: 12, borderRadius: 17, borderWidth: 1.5, borderColor: Colors.line, backgroundColor: Colors.white, justifyContent: 'center' },
  brOn: { borderWidth: 2, borderColor: Colors.purple },
  brText: { fontFamily: Font.body800, fontSize: 13, lineHeight: 18 },
  brTextOn: { fontFamily: Font.body900, color: Colors.purple },
  teams: { gap: 8 },
  team: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 60, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 16, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white },
  teamOn: { backgroundColor: '#F3EEFB', borderColor: Colors.purple },
  rd: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white },
  rdOn: { borderWidth: 7, borderColor: Colors.purple },
  teamB: { flex: 1, fontFamily: Font.body900, fontSize: 14.5, lineHeight: 21 },
  empty: { paddingVertical: 14, textAlign: 'center', fontFamily: Font.body700, fontSize: 14, lineHeight: 21, color: Colors.inkSub },
  baw: { padding: 16, gap: 2 },
  baS: { fontFamily: Font.body700, fontSize: 12.5, lineHeight: 18, color: Colors.inkSub },
  baB: { fontFamily: Font.body900, fontSize: 17, lineHeight: 24 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 10 },
  tagIc: { transform: [{ rotate: '-90deg' }] },
  tagText: { fontFamily: Font.body900, fontSize: 13, lineHeight: 19, color: Colors.purple },
  rows: { paddingVertical: 2, paddingHorizontal: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, paddingVertical: 11 },
  rowLine: { borderTopWidth: 1.5, borderColor: Colors.line },
  rowK: { flexShrink: 1, fontFamily: Font.body700, fontSize: 13.5, lineHeight: 20, color: Colors.inkSub },
  rowV: { fontFamily: Font.body900, fontSize: 13.5, lineHeight: 20 },
  msg: { minHeight: 88, borderRadius: 16, borderWidth: 2, borderColor: Colors.ink, paddingVertical: 12, paddingHorizontal: 14, backgroundColor: Colors.white, fontFamily: Font.body600, fontSize: 14, color: Colors.ink, textAlignVertical: 'top' },
  foot: { gap: 8, paddingTop: 12, paddingHorizontal: 16, backgroundColor: Colors.cream, borderTopWidth: 2, borderColor: Colors.ink },
  footNote: { paddingHorizontal: 2, fontFamily: Font.body700, fontSize: 13, lineHeight: 19 },
  ds: { fontFamily: Font.body700, fontSize: 15, lineHeight: 23, color: Colors.inkSub },
  ds2: { marginTop: 10 },
});
