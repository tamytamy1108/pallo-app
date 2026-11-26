import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { BackHandler, Keyboard, StyleSheet, View, type ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GrowInput } from '@/components/ui/grow-input';
import { Pressable } from '@/components/ui/pressable';
import { ChangeCalendar } from '@/components/account/change-calendar';
import { AccountPage, Box, ChoiceChip, Icon, Lift, type IconName } from '@/components/account/parts';
import { BranchListSheet, withJeom } from '@/components/onboarding/branch-list';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { showWarnToast } from '@/components/ui/toast';
import { apiErrorMessage } from '@/api/errors';
import { useRequestChange } from '@/api/change-requests';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import {
  addDays,
  addMonths,
  CHANGE_KIND,
  CHANGE_MIN,
  fmtDay,
  getMembership,
  monIdx,
  MY_BRANCH,
  MY_TEAMS,
  REST_LENGTHS,
  REST_LONG,
  REST_LONG_MAX_MONTHS,
  REST_LONG_REASONS,
  REST_MIN,
  REST_REASON_MIN,
  TEAM_LANGS,
  teamLabel,
  teamsOf,
  teamWeekdays,
  TODAY,
  type ChangeKind,
  type RestLength,
  type RestLongReason,
  type Team,
} from '@/data/account';
import { haptic, sfx } from '@/lib/feedback';
import { MemberOnly } from '@/components/common/member-lock';
import { useKeyboardShown } from '@/lib/keyboard';

/**
 * 연기 · 팀 · 지점 변경 신청서 (프로토타입 chgHTML · cgSum · CF).
 * 무엇을 바꿀까요(종류) → 종류별 질문 → 신청 확인(남길 말) → 신청하기. 신청 중 상태는 내 스터디 카드와 같이 봐요.
 * 쉬어가기는 내일부터 · 한 번에 최대 1달 (임신 · 군 입대 같은 특별한 경우만 '1달 넘게' — 사유를 꼭 적어요).
 * 새 일정(팀 · 지점 변경 · 팀 추가)은 오늘 + 2주 ~ 이용권 끝나는 날 · 남은 횟수 · 자리 수 · 프로 이름은 보여 주지 않아요.
 * 신청은 바로 바뀌지 않아요: 운영진 전산으로 넘어가 대기로 남고, 운영진이 확인하면 알려 줘요.
 * 맞는 API: 38 `/branches/:id/teams` · 39 `POST /me/change-requests` (api/change-requests)
 */

type Step = 'pick' | 'form' | 'confirm';
type Form = {
  step: Step;
  kind: ChangeKind;
  cls: 'all' | number;
  dur: RestLength;
  start: number | null;
  /** 1달 넘게 쉴 때 고른 끝나는 날 (안 고르면 2달) */
  endT: number | null;
  /** 1달 넘게: 달력이 지금 고르는 날 (시작 · 끝) */
  edit: 'start' | 'end';
  /** 1달 넘게 쉬는 사유 · 자세한 내용 (꼭 적어요) */
  reason: RestLongReason | null;
  why: string;
  mon: number;
  br: string;
  to: Team | null;
  calOpen: boolean;
  msg: string;
};
type Summary = { ok: false; txt: string } | { ok: true; label: string; st: Date; en?: Date; txt: string };

const fresh = (): Form => ({
  step: 'pick',
  kind: 'rest',
  cls: 'all',
  dur: '2주',
  start: null,
  endT: null,
  edit: 'start',
  reason: null,
  why: '',
  mon: monIdx(CHANGE_MIN),
  br: MY_BRANCH,
  to: null,
  calOpen: false,
  msg: '',
});

/** 1달 넘게 쉴 때 끝나는 날로 고를 수 있는 범위: 1달 다음 날 ~ 2년 */
const longMin = (st: Date) => addMonths(st, 1);
const longMax = (st: Date) => addDays(addMonths(st, REST_LONG_MAX_MONTHS), -1);
/** 쉬는 마지막 날. 1달 넘게는 고른 끝나는 날 (안 골랐거나 범위 밖이면 2달) */
function restEnd(st: Date, dur: RestLength, endT: number | null = null) {
  if (dur === REST_LONG) {
    const en = endT != null ? new Date(endT) : null;
    return en && en >= longMin(st) && en <= longMax(st) ? en : addDays(addMonths(st, 2), -1);
  }
  if (dur === '1달') return addDays(addMonths(st, 1), -1);
  const weeks: Partial<Record<RestLength, number>> = { '1주': 7, '2주': 14, '3주': 21 };
  return addDays(st, (weeks[dur] ?? 7) - 1);
}
/** 쉬는 날 수 (시작 · 끝 날 포함) */
const restDays = (st: Date, en: Date) => Math.round((en.getTime() - st.getTime()) / 864e5) + 1;
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
  ['rest', 'clock', Colors.yellow, '출장 · 여행 · 바쁜 기간 · 내일부터 · 한 번에 최대 1달'],
  ['team', 'cal', '#C9B8F0', '언어 · 요일 · 시간을 바꿔요'],
  ['branch', 'pin', Colors.sky, '이사 · 회사 이동'],
];

function ChangeScreen() {
  const ms = getMembership();
  const T = MY_TEAMS;
  const [f, setF] = useState<Form>(fresh);
  const [sent, setSent] = useState<{ label: string; txt: string } | null>(null);
  const request = useRequestChange();
  const [brOpen, setBrOpen] = useState(false);
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
      const en = restEnd(st, f.dur, f.endT);
      // 첫 줄 = 고른 수업 · 둘째 줄 = 며칠 · 기간 · 복귀 (내 스터디 카드가 줄을 나눠 따로 보여요)
      const txt = `${cls.map(teamLabel).join(' · ')}\n${restDays(st, en)}일 연기 · ${fmtDay(st)}~${fmtDay(en)} · ${fmtDay(addDays(en, 1))} 복귀`;
      if (f.dur === REST_LONG) {
        // 1달 넘게는 특별한 경우만: 사유를 고르고 자세히 적어야 다음으로 가요
        if (!f.reason) return { ok: false, txt: '1달 넘게 쉬는 사유를 골라 주세요' };
        if (f.why.trim().length < REST_REASON_MIN) return { ok: false, txt: `사유를 ${REST_REASON_MIN}자 이상 적어 주세요` };
      }
      return { ok: true, label: '연기', st, en, txt };
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

  const longRest = f.kind === 'rest' && f.dur === REST_LONG;
  const reasonText = longRest && f.reason ? `${f.reason} · ${f.why.trim()}` : undefined;

  // 신청 = 운영진 전산으로 넘기기 (바로 바뀌지 않고 대기로 남아요)
  const send = () => {
    if (!sum.ok || request.isPending) return;
    // 남길 말을 쓰던 키보드를 내리고 결과 창을 띄워요 (키보드가 결과 창 확인 버튼을 덮지 않게)
    Keyboard.dismiss();
    const done = { label: sum.label, txt: sum.txt };
    request.mutate(
      { label: sum.label, txt: sum.txt, msg: f.msg.trim(), reason: reasonText },
      {
        onSuccess: () => {
          sfx('save');
          haptic('success');
          setSent(done);
        },
        onError: (e) => showWarnToast(apiErrorMessage(e)),
      },
    );
  };

  // 쉬어가기는 내일부터 (오늘은 흐리게) · 새 일정은 2주 뒤부터
  const restSt = f.kind === 'rest' && f.start ? new Date(f.start) : null;
  const restEn = restSt ? restEnd(restSt, f.dur, f.endT) : null;
  const pickingEnd = longRest && f.edit === 'end' && !!restSt;
  const calMin = pickingEnd && restSt ? longMin(restSt) : f.kind === 'rest' ? REST_MIN : CHANGE_MIN;
  const calMax = pickingEnd && restSt ? longMax(restSt) : ms.exp;
  // 끝나는 날이 바로 다음 달이면 두 달을 이어 보여 줘요 (넘겨 보지 않아도 끝이 보여요)
  const calMonths = restEn && monIdx(restEn) === f.mon + 1 ? 2 : 1;
  const calendar = (
    <ChangeCalendar
      mon={f.mon}
      minMon={monIdx(calMin)}
      maxMon={pickingEnd ? monIdx(calMax) : monIdx(TODAY) + 6}
      min={calMin}
      max={calMax}
      start={f.start}
      end={restEn}
      months={calMonths}
      onMonth={(d) => set({ mon: f.mon + d })}
      onPick={(t) => {
        if (pickingEnd) set({ endT: t });
        // 1달 넘게: 시작을 고르면 이어서 끝나는 날을 골라요 (끝 달로 넘어가요)
        else if (longRest) {
          const en = restEnd(new Date(t), f.dur, f.endT);
          set({ start: t, edit: 'end', endT: en.getTime(), mon: Math.max(monIdx(new Date(t)), monIdx(en) - 1) });
        } else set({ start: t });
      }}
    />
  );

  // ---------- 1. 무엇을 바꿀까요? ----------
  if (f.step === 'pick') {
    const cards = [...KIND_CARD];
    if (!ms.plan.fixed && T.length < ms.plan.teams) cards.push(['add', 'plus', '#CDEBD0', `주 ${ms.plan.perWeek}회 더 · 횟수를 더 빨리 써요 · ${ms.plan.teams}팀까지`]);
    return (
      <AccountPage title="연기 · 팀 · 지점 변경" scrollRef={scroll} bodyStyle={styles.body}>
        <PText style={styles.q}>무엇을 바꿀까요?</PText>
        {cards.map(([k, ic, bg, sub]) => {
          const off = !ms.pp && k !== 'add';
          return (
            <Pressable
              key={k}
              disabled={off}
              onPress={() => {
                sfx('tap');
                // 쉬어가기는 처음부터 내일이 골라져 있어요
                setF({ ...fresh(), step: 'form', kind: k, cls: k === 'rest' ? 'all' : 0, ...(k === 'rest' && { start: REST_MIN.getTime(), mon: monIdx(REST_MIN) }) });
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
          {`쉬어가기는 내일(${fmtDay(REST_MIN)})부터 · 팀 · 지점의 새 일정은 2주 뒤(${fmtDay(CHANGE_MIN)})부터 시작해요 · 연기 · 팀 변경 · 지점 이동은 신청 1번에 1번 써요 · 신청하면 운영진이 확인한 뒤 바뀌어요${ms.plan.fixed ? ` · ${ms.name}은 늘 ${ms.plan.teams}팀이라 팀은 바꾸기만 돼요` : ` · 팀은 ${ms.plan.teams}팀까지 더할 수 있어요 · 지금 ${T.length}팀`}`}
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
      // 남은 횟수는 보여 주지 않아요 (연기 · 변경 남은 수 줄은 뺐어요)
      ...(f.kind === 'add' ? [['주 참여', `주 ${ms.wk}회 → ${ms.wk + ms.plan.perWeek}회`] as [string, string]] : []),
      ...(reasonText ? [['사유', reasonText] as [string, string]] : []),
    ];
    return (
      <AccountPage title="신청 확인" onBack={back} scrollRef={scroll} bodyStyle={styles.body} bottom={<Foot note="신청하면 운영진 전산으로 넘어가요 · 확인 후 알림으로 알려 드려요" label={request.isPending ? '신청하는 중…' : `${sum.label} 신청하기`} ok={!request.isPending} onPress={send} />}>
        <PText style={styles.q}>이렇게 바뀌어요</PText>
        <Box style={styles.baw}>
          {f.kind === 'rest' && sum.en ? (
            <>
              <PText style={styles.baS}>{`${fmtDay(sum.st)} ~ ${fmtDay(sum.en)}`}</PText>
              <PText style={styles.baB}>{cls.map(teamLabel).join('\n')}</PText>
              <Tag icon="clock" label={`${restDays(sum.st, sum.en)}일 연기 · 수업 ${restCount(cls, sum.st, sum.en)}회`} />
              <PText style={styles.baS}>{`${fmtDay(addDays(sum.en, 1))} 복귀`}</PText>
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
        {rows.length > 0 && (
          <Box style={styles.rows}>
            {rows.map(([a, b], i) => (
              <View key={a} style={[styles.row, i > 0 && styles.rowLine]}>
                <PText style={styles.rowK}>{a}</PText>
                <PText style={styles.rowV}>{b}</PText>
              </View>
            ))}
          </Box>
        )}
        <PText style={styles.q2}>
          운영진에게 남길 말 <PText style={styles.q2s}>선택</PText>
        </PText>
        <GrowInput
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
            <View>
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
          <PText style={[styles.ds, styles.ds2]}>아직 확정은 아니에요 · 지금은 운영진 확인 대기 중이에요. 운영진 확인 후 알림으로 알려 드려요. 확정 전에는 마이에서 취소할 수 있어요.</PText>
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
              <ChoiceChip
                key={d}
                label={d}
                on={f.dur === d}
                onPress={() => {
                  if (d === f.dur) return;
                  // 1달 넘게: 시작일부터 다시 (끝나는 날은 시작을 고르면 이어서) · 그 밖은 고른 시작일 그대로
                  set({ dur: d, endT: null, edit: 'start' });
                }}
              />
            ))}
          </View>
          <PText style={styles.note}>
            {longRest ? '1달 넘게는 임신 · 출산, 군 입대 같은 특별한 경우만 신청할 수 있어요 · 사유를 꼭 적어 주세요' : '한 번에 최대 1달 · 임신 · 군 입대 같은 특별한 경우만 1달 넘게 신청할 수 있어요'}
          </PText>
          {longRest ? (
            <>
              <PText style={styles.q}>
                어떤 사유인가요? <PText style={styles.req}>필수</PText>
              </PText>
              <View style={styles.chips}>
                {REST_LONG_REASONS.map((r) => (
                  <ChoiceChip key={r} label={r} on={f.reason === r} onPress={() => set({ reason: r })} />
                ))}
              </View>
              <GrowInput
                value={f.why}
                onChangeText={(t) => set({ why: t })}
                maxLength={200}
                multiline
                placeholder={`자세한 사유를 적어 주세요 (${REST_REASON_MIN}자 이상)\n예) 2027년 3월 입대 예정이에요`}
                placeholderTextColor="#9B94A6"
                accessibilityLabel="1달 넘게 쉬는 자세한 사유 (필수)"
                style={styles.msg}
              />
              <PText style={styles.note}>운영진이 사유를 확인한 뒤 승인해요 · 증빙을 따로 부탁드릴 수 있어요</PText>
            </>
          ) : null}
          <PText style={styles.q}>{longRest ? '언제부터 언제까지 쉴까요?' : '언제부터 쉴까요?'}</PText>
          {/* 고른 기간을 달력 위에 한 줄로 — 끝나는 날을 찾으려고 달력을 넘기지 않아도 돼요 */}
          {restSt && restEn ? (
            <Box color="#F6F1FF" style={styles.res}>
              <View style={[styles.range, longRest && styles.rangeLong]}>
                <RangeEnd
                  title="시작"
                  day={fmtDay(restSt)}
                  on={longRest && f.edit === 'start'}
                  onPress={longRest ? () => set({ edit: 'start', mon: monIdx(restSt) }) : undefined}
                />
                <PText style={styles.rangeArrow}>→</PText>
                <RangeEnd
                  title="끝"
                  day={fmtDay(restEn)}
                  on={longRest && f.edit === 'end'}
                  onPress={longRest ? () => set({ edit: 'end', mon: Math.max(monIdx(restSt), monIdx(restEn) - 1) }) : undefined}
                />
              </View>
              <PText style={styles.resS}>{`${restDays(restSt, restEn)}일 연기 · 수업 ${restCount(cls, restSt, restEn)}회 · ${fmtDay(addDays(restEn, 1))} 복귀`}</PText>
              {longRest ? <PText style={styles.resS}>{f.edit === 'end' ? '달력에서 끝나는 날을 골라 주세요 · 1달 넘게 ~ 최대 2년' : '달력에서 시작일을 골라 주세요 · 내일부터'}</PText> : null}
            </Box>
          ) : null}
          {calendar}
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
              {/* 지점 고르기는 가입 단계와 같은 시트로 (검색 · 권역 탭 · 권역별 카드) */}
              <Pressable
                onPress={() => {
                  sfx('tap');
                  setBrOpen(true);
                }}
                accessibilityRole="button"
                accessibilityLabel={`옮길 지점 ${withJeom(f.br)} · 바꾸기`}
                style={({ pressed }) => [styles.sel, pressed && styles.selPressed]}>
                <PText style={styles.selT}>{withJeom(f.br)}</PText>
                <PText style={styles.selGo}>바꾸기 ›</PText>
              </Pressable>
              <BranchListSheet
                open={brOpen}
                onClose={() => setBrOpen(false)}
                title="어느 지점으로 옮길까요?"
                value={f.br}
                raw
                onPick={(b) => set({ br: b, to: null })}
              />
            </>
          ) : null}
          <PText style={styles.q}>{k === 'add' ? '어느 팀을 더할까요?' : '어느 팀으로 갈까요?'}</PText>
          <PText style={styles.q2}>{`${withJeom(pickBranch)} · 들어갈 수 있는 팀`}</PText>
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

/** 쉬는 기간 한쪽 끝 (시작 · 끝). 1달 넘게면 눌러서 달력이 고를 날을 바꿔요 */
function RangeEnd({ title, day, on, onPress }: { title: string; day: string; on: boolean; onPress?: () => void }) {
  // 짧게 쉬면 날짜만 — '시작 · 끝' 이름표는 직접 골라야 하는 1달 넘게 쉬기에서만 보여요
  if (!onPress) return <PText style={styles.rangeD} accessibilityLabel={`${title} ${day}`}>{day}</PText>;
  const body = (
    <View style={[styles.rangeEnd, on && styles.rangeEndOn]}>
      <PText style={styles.rangeT}>{title}</PText>
      <PText style={styles.rangeD}>{day}</PText>
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable
      onPress={() => {
        sfx('tap');
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={`${title} ${day} · 달력에서 ${title === '시작' ? '시작일' : '끝나는 날'} 고르기`}
      accessibilityState={{ selected: on }}
      style={styles.rangeBtn}>
      {body}
    </Pressable>
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
  res: { paddingVertical: 10, paddingHorizontal: 14, gap: 2 },
  req: { fontFamily: Font.body800, fontSize: 12, color: Colors.rosePink },
  range: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rangeLong: { marginHorizontal: -8 },
  rangeArrow: { fontFamily: Font.body900, fontSize: 14, lineHeight: 21, color: Colors.purple },
  rangeBtn: { flex: 1 },
  rangeEnd: { flex: 1, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 12, borderWidth: 2, borderColor: 'transparent' },
  rangeEndOn: { borderColor: Colors.purple, backgroundColor: Colors.white },
  rangeT: { fontFamily: Font.body800, fontSize: 11.5, lineHeight: 16, color: Colors.inkSub },
  rangeD: { fontFamily: Font.body900, fontSize: 15, lineHeight: 21 },
  resS: { fontFamily: Font.body700, fontSize: 12.5, lineHeight: 18, color: Colors.inkSub },
  sel: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 52, paddingHorizontal: 16, borderWidth: 2, borderColor: Colors.ink, borderRadius: 14, backgroundColor: Colors.white },
  selPressed: { backgroundColor: '#F6F1E4' },
  selT: { fontFamily: Font.body900, fontSize: 15.5, lineHeight: 21, color: Colors.purple },
  selGo: { fontFamily: Font.body800, fontSize: 13, lineHeight: 18, color: Colors.inkSub },
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
  rowV: { flexShrink: 1, textAlign: 'right', fontFamily: Font.body900, fontSize: 13.5, lineHeight: 20 },
  msg: { minHeight: 88, borderRadius: 16, borderWidth: 2, borderColor: Colors.ink, paddingVertical: 12, paddingHorizontal: 14, backgroundColor: Colors.white, fontFamily: Font.body600, fontSize: 14, color: Colors.ink, textAlignVertical: 'top' },
  foot: { gap: 8, paddingTop: 12, paddingHorizontal: 16, backgroundColor: Colors.cream, borderTopWidth: 2, borderColor: Colors.ink },
  footNote: { paddingHorizontal: 2, fontFamily: Font.body700, fontSize: 13, lineHeight: 19 },
  ds: { fontFamily: Font.body700, fontSize: 15, lineHeight: 23, color: Colors.inkSub },
  ds2: { marginTop: 10 },
});

/** 회원 전용 화면 (state/access 'myStudy'): 비회원이 알림 · 주소로 바로 들어와도 '지점 회원이 되면 열려요' 칸만 보여요 */
export default function ChangeScreenGate() {
  return (
    <MemberOnly feature="myStudy" title="연기 · 변경 신청">
      <ChangeScreen />
    </MemberOnly>
  );
}
