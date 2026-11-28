import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { BackHandler, Keyboard, Platform, StyleSheet, View, type ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChipScroll } from '@/components/ui/chip-scroll';
import { GrowInput } from '@/components/ui/grow-input';
import { Pressable } from '@/components/ui/pressable';
import { ChangeCalendar } from '@/components/account/change-calendar';
import { AccountPage, Box, ChoiceChip, Icon, Lift, type IconName } from '@/components/account/parts';
import { BranchListSheet, withJeom } from '@/components/onboarding/branch-list';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/dialog';
import { Sheet } from '@/components/ui/sheet';
import { showWarnToast } from '@/components/ui/toast';
import { apiErrorMessage } from '@/api/errors';
import { useRequestChange } from '@/api/change-requests';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { LAUNCH } from '@/constants/launch';
import { Colors } from '@/constants/theme';
import {
  addDays,
  addMonths,
  CHANGE_KIND,
  CHANGE_MIN,
  changesLeftText,
  CLOSED_WEEKDAY,
  DOW,
  fmtDay,
  getMembership,
  monIdx,
  MY_BRANCH,
  MY_BRANCHES,
  MY_TEAMS,
  MULTI_BRANCH_WEEK_MAX,
  REST_LONG_MAX_MONTHS,
  LANG_COLOR,
  levelFits,
  levelShort,
  REST_LONG_REASONS,
  REST_MIN,
  REST_REASONS,
  REST_MIN_DAYS,
  REST_REASON_MIN,
  sameLevelTeams,
  TEAM_LANGS,
  teamLabel,
  teamsOf,
  teamWeekdays,
  TODAY,
  ymd,
  type ChangeKind,
  type Team,
} from '@/data/account';
import { haptic, sfx } from '@/lib/feedback';
import { MemberOnly } from '@/components/common/member-lock';
import { useKeyboardShown } from '@/lib/keyboard';

/**
 * 연기 · 팀 · 지점 변경 신청서 (프로토타입 chgHTML · cgSum · CF).
 * 무엇을 바꿀까요(종류) → 종류별 질문 → 신청 확인 → 신청하기 (운영진에게 남길 말 칸은 뺐어요). 신청 중 상태는 내 스터디 카드와 같이 봐요.
 * 연기 (시안 2026-11-27): 내 스터디를 모두 쉬어요. ① 시작일(내 스터디 요일만) → ② 돌아올 때 스터디(팀마다 그대로 · 같은 레벨의 다른 팀)
 *   → ③ 복귀일(돌아갈 스터디 요일만). 최소 2주 · 금요일 휴무 · 복귀는 최대 2년 · 이용권 끝나는 날까지.
 *   1달 넘게는 출산 · 군 입대 같은 특별한 경우만 — 확인 창을 띄우고 사유를 꼭 적어요. 날짜는 아래에서 올라오는 달력 시트로 골라요.
 * 변경 횟수는 연기 · 팀 변경 · 지점 이동이 같이 써요: 연기 1번 + 옮기는 팀마다 팀 변경 1번.
 * 팀 변경 · 지점 이동은 2주 전에 신청해요: 옮기기 전까지 지금 팀에서 듣다가 옮길지, 쉬다가(홀딩) 옮길지 꼭 골라요.
 * 지점 이동: 보통은 아예 옮겨요(지금 수업은 모두 끝나고 새 지점 팀을 골라요). 두 지점 같이 다니기(plan.twoBranch)는
 *   프리미엄(지점마다 3팀까지 · 출석은 합쳐 주 4회) · CVVIP+(지점마다 1팀씩)만 '아예 옮기기 · 두 지점 같이' 중에서 골라요.
 *   등록된 지점(MY_BRANCH)은 '내 지점'으로 보여요.
 * 새 일정(팀 · 지점 변경 · 팀 추가)은 오늘 + 2주 ~ 이용권 끝나는 날 · 자리 수 · 프로 이름은 보여 주지 않아요.
 * 신청은 바로 바뀌지 않아요: 운영진 전산으로 넘어가 대기로 남고, 운영진이 확인하면 알려 줘요.
 * 맞는 API: 38 `/branches/:id/teams` · 39 `POST /me/change-requests` (api/change-requests)
 */

/** 팀 · 지점: 옮기기 전까지 지금 팀에서 듣다가(keep) · 쉬다가(hold) */
type Gap = 'keep' | 'hold';
type Step = 'pick' | 'form' | 'confirm';
/** 연기 뒤 이 팀으로 돌아갈지 (change = 같은 레벨의 다른 팀으로 옮겨요 · to 는 고른 팀) */
type Back = { change: boolean; to: Team | null };
type Form = {
  step: Step;
  kind: ChangeKind;
  cls: 'all' | number;
  /** 연기: 쉬기 시작하는 날 · 팀 · 지점: 새 일정이 시작하는 날 */
  start: number | null;
  /** 연기: 복귀하는 날 (쉬는 날은 그 전날까지) */
  ret: number | null;
  /** 연기: 내 팀마다 돌아올 곳 (키 = 지점 + 팀 번호 · 없으면 그대로) */
  back: Record<string, Back>;
  /** 연기: 열린 달력 시트 (시작 · 복귀) */
  sheet: 'start' | 'ret' | null;
  /** 1달 넘게를 확인 창에서 '그래도 신청하기'로 골랐어요 */
  longOk: boolean;
  /** 1달 넘게 확인 창이 묻는 복귀일 */
  longAsk: number | null;
  /** 1달 넘게 쉬는 사유 · 자세한 내용 (꼭 적어요) */
  reason: string | null;
  why: string;
  mon: number;
  br: string;
  to: Team | null;
  gap: Gap | null;
  /** 지점 이동: 아예 옮기기(move) · 두 지점 같이(both) */
  mode: 'move' | 'both' | null;
  /** 지점 이동 · 두 지점을 다니는 회원: 두 지점 같이에서 바꿀 지점 */
  from: string;
  /** 지점 이동: 새 지점에서 고른 팀 */
  picks: Team[];
  calOpen: boolean;
};
type Summary = { ok: false; txt: string } | { ok: true; label: string; st: Date; en?: Date; txt: string };

const fresh = (): Form => ({
  step: 'pick',
  kind: 'rest',
  cls: 'all',
  start: null,
  ret: null,
  back: {},
  sheet: null,
  longOk: false,
  longAsk: null,
  reason: null,
  why: '',
  mon: monIdx(CHANGE_MIN),
  br: MY_BRANCH,
  to: null,
  gap: null,
  mode: null,
  from: '',
  picks: [],
  calOpen: false,
});

const keyOf = (t: Team) => t.branch + t.no;
/** 팀들의 수업 요일 (금요일 휴무는 빼요) */
const daysOf = (teams: Team[]) => new Set(teams.flatMap(teamWeekdays).filter((d) => d !== CLOSED_WEEKDAY));
/** from 부터 days 요일인 첫날 */
function firstOn(from: Date, days: Set<number>) {
  for (let i = 0; i < 7; i++) {
    const d = addDays(from, i);
    if (days.has(d.getDay())) return d;
  }
  return from;
}
/** 복귀일을 '시작 + 2주 이후 · 돌아갈 스터디 요일'로 맞춰요 */
function fitReturn(st: Date, ret: Date | null, days: Set<number>) {
  const min = addDays(st, REST_MIN_DAYS);
  return firstOn(ret && ret >= min ? ret : min, days);
}
/** 시작일로 고를 수 있는 마지막 날 (6달 안 · 이용권이 끝나기 2주 전) */
function startMax(exp: Date) {
  const a = addMonths(TODAY, 6);
  const b = addDays(exp, -REST_MIN_DAYS);
  return a < b ? a : b;
}
/** 복귀일로 고를 수 있는 마지막 날 (최대 2년 · 이용권 끝나는 날 중 이른 날) */
function retMax(st: Date, exp: Date) {
  const a = addMonths(st, REST_LONG_MAX_MONTHS);
  return a < exp ? a : exp;
}
/**
 * 지금 팀에서 듣다가 옮길 때 마지막 날 = 새 팀이 시작하는 주(월~일)의 전 주 일요일.
 * 새 팀이 화요일에 시작해도 그 주 월요일 옛 팀 수업은 안 들어요 — 한 주에 옛 팀 · 새 팀을 겹쳐 들어 주 횟수를 넘지 않게.
 */
const keepLast = (st: Date) => addDays(st, -((st.getDay() + 6) % 7) - 1);
/**
 * 팀 · 지점 변경 신청 글 (내 스터디 카드가 줄을 나눠 보여요 · 운영진도 그대로 읽어요)
 * 첫 줄 = '지금 팀 → 새 팀' (여러 팀은 · 로) · 둘째 줄 = '12/13(일)까지 지금 팀 · 12/16(수)부터 새 팀'
 */
const moveHead = (from: Team[], to: Team[]) => `${from.map(teamLabel).join(' · ')} → ${to.map(teamLabel).join(' · ')}`;
const moveTail = (gap: Gap | null, st: Date) => (gap === 'hold' ? `${fmtDay(REST_MIN)}~${fmtDay(addDays(st, -1))} 쉬어요` : `${fmtDay(keepLast(st))}까지 지금 팀`);
/** 쉬는 날 수 (시작일 ~ 복귀 전날) */
const restDays = (st: Date, rt: Date) => Math.round((rt.getTime() - st.getTime()) / 864e5);
const isLong = (st: Date, rt: Date) => rt > addMonths(st, 1);
/** 쉬는 동안 빠지는 수업 수 (시작일 ~ 복귀 전날 · 프로토타입 cgRestN) */
function restCount(T: Team[], st: Date, rt: Date) {
  let n = 0;
  for (let d = new Date(st); d < rt; d = addDays(d, 1)) {
    const wd = d.getDay();
    n += T.filter((t) => teamWeekdays(t).includes(wd)).length;
  }
  return n;
}
/** 요일 이름 (월요일부터) · 예) 월 · 수 · 토 */
const dayNames = (days: Set<number>) =>
  [1, 2, 3, 4, 5, 6, 0]
    .filter((d) => days.has(d))
    .map((d) => DOW[d])
    .join(' · ');

/** 신청을 마치면 마이 · 내 스터디 칸으로 (홈으로 돌아가지 않게 — 마이 탭으로 바꾸고 내 스터디까지 내려가요) */
const goMyStudy = () => router.replace({ pathname: '/my', params: { open: 'study' } });

const KIND_CARD: [ChangeKind, IconName, string, string][] = [
  ['rest', 'clock', Colors.yellow, '출장 · 여행 · 바쁜 기간 · 최소 2주부터'],
  ['team', 'cal', '#C9B8F0', '언어 · 요일 · 시간을 바꿔요 · 2주 전 신청'],
  ['branch', 'pin', Colors.sky, '이사 · 회사 이동 · 2주 전 신청'],
];

function ChangeScreen() {
  const ms = getMembership();
  const T = MY_TEAMS;
  const [f, setF] = useState<Form>(fresh);
  const [sent, setSent] = useState<{ label: string; txt: string } | null>(null);
  const request = useRequestChange();
  const [brOpen, setBrOpen] = useState(false);
  const scroll = useRef<ScrollViewInstance>(null);
  const reasonY = useRef(0);
  const calJump = useRef(false);
  const set = (patch: Partial<Form>) => setF((p) => ({ ...p, ...patch }));
  const toTop = () => requestAnimationFrame(() => scroll.current?.scrollTo({ y: 0, animated: false }));

  // 고른 종류의 대상 수업 (프로토타입 cgCls) — 연기는 늘 모든 수업
  const pickedCls = T[f.cls === 'all' ? 0 : f.cls];
  // ----- 지점 이동 -----
  // 두 지점 같이 다니기는 출시 때 숨겨요 (LAUNCH.twoBranch) — 숨기면 '어떻게 다닐까요?' 없이 늘 아예 옮기기
  const two = LAUNCH.twoBranch ? ms.plan.twoBranch : undefined;
  const mode = two ? f.mode : 'move';
  /** 지금 다니는 지점 (두 곳이면 '두 지점 같이'가 한 곳 바꾸기가 돼요 · 한 곳을 빼려면 그 지점에 문의) */
  const nowBranches = [...new Set(T.map((x) => x.branch))];
  const many = nowBranches.length > 1;
  // 끝나는 수업
  //  아예 옮기기 = 모두 · 한 지점 바꾸기 = 바꿀 지점 수업
  //  두 지점 같이(지금 1곳) = 프리미엄은 없음 · CVVIP+ 는 고른 1팀
  const endTeams =
    mode === 'move'
      ? T
      : mode === 'both' && many
          ? T.filter((x) => x.branch === f.from)
          : mode === 'both' && two === 'oneEach'
            ? [pickedCls]
            : [];
  const keptTeams = T.filter((x) => !endTeams.includes(x));
  /** 팀을 고르는 지점 = 새 지점 */
  const target = f.br;
  const brs = target ? [target] : [];
  // 그 지점에서 고를 수 있는 팀 수 (남는 수업은 빼고)
  const perMax = (b: string) =>
    !two ? T.length : mode === 'move' ? ms.plan.teams : two === 'oneEach' && mode === 'both' ? 1 : ms.plan.teams - keptTeams.filter((x) => x.branch === b).length;
  const pickMax = perMax(target);
  const picksIn = (b: string) => f.picks.filter((p) => p.branch === b);
  const cls: Team[] = f.kind === 'rest' ? T : f.kind === 'add' ? [] : f.kind === 'branch' ? endTeams : [pickedCls];
  const pickBranch = f.kind === 'branch' ? f.br : MY_BRANCH;
  // 들어갈 수 있는 팀: 자리 있고 · 이미 듣는 팀 빼고 · 언어 순 (프로토타입 cgMatch)
  const mine = T.map((x) => x.branch + x.no);
  // 레벨: 내 레벨 팀만 (지점 이동은 맨 끝 레벨만 한 칸 넓혀요 — levelFits)
  const myLevel = (f.kind === 'team' ? pickedCls : T[0]).level;
  const matchOf = (b: string) =>
    teamsOf(b)
      .filter((x) => (x.seats ?? 0) > 0 && !mine.includes(x.branch + x.no) && levelFits(myLevel, x.level, f.kind === 'branch'))
      .sort((p, q) => TEAM_LANGS.indexOf(p.lang) - TEAM_LANGS.indexOf(q.lang));
  const match = matchOf(pickBranch);

  // ----- 연기: 돌아올 스터디 · 날짜 -----
  const myDays = daysOf(T);
  const targetsOf = (back: Record<string, Back>) =>
    T.map((t) => {
      const b = back[keyOf(t)];
      return b?.change ? b.to : t;
    });
  const targets = targetsOf(f.back);
  const ready = targets.every((x) => !!x);
  const retTeams = targets.filter((x): x is Team => !!x);
  const retDays = daysOf(retTeams);
  const moves = T.flatMap((t): [Team, Team][] => {
    const b = f.back[keyOf(t)];
    return b?.change && b.to ? [[t, b.to]] : [];
  });
  // 다른 팀으로 옮기겠다고 고른 팀 수 (아직 팀을 안 골랐어도 세요)
  const changing = T.filter((t) => f.back[keyOf(t)]?.change).length;
  // 이번 신청이 쓰는 횟수: 연기 1번 + 옮기는 팀마다 1번 (팀 · 지점 변경은 1번 · 팀 추가는 안 써요)
  const uses = f.kind === 'rest' ? 1 + moves.length : f.kind === 'add' ? 0 : 1;
  const restSt = f.kind === 'rest' && f.start ? new Date(f.start) : null;
  const restRt = f.kind === 'rest' && f.ret ? new Date(f.ret) : null;
  const longRest = !!restSt && !!restRt && isLong(restSt, restRt);
  // 연기 사유는 늘 적어요 — 고를 수 있는 사유는 1달 넘게면 특별한 경우만 (기간을 바꿔 목록에 없는 사유는 안 고른 걸로)
  const reasonList: readonly string[] = longRest ? REST_LONG_REASONS : REST_REASONS;
  const reasonPick = f.reason && reasonList.includes(f.reason) ? f.reason : null;
  const reasonText = f.kind === 'rest' && reasonPick ? `${reasonPick} · ${f.why.trim()}` : undefined;
  // 새 팀 · 지점: 가장 빠른 날 = 2주 뒤부터 새 팀 수업이 있는 첫날 (금요일은 휴무 · 팀을 안 골랐으면 금요일만 빼요)
  const newTeams = f.kind === 'branch' ? f.picks : f.to ? [f.to] : [];
  const newDays = newTeams.length ? daysOf(newTeams) : new Set([0, 1, 2, 3, 4, 6].filter((d) => d !== CLOSED_WEEKDAY));
  const earliest = firstOn(CHANGE_MIN, newDays);
  const startOk = (d: Date) => d >= earliest && newDays.has(d.getDay());
  const sum = summarize();
  // 언제부터: '가장 빠른 날' · '날짜 고르기' 중 하나만 (다른 쪽을 누르면 앞에 고른 건 풀려요)
  const pickEarliest = () => set({ start: earliest.getTime(), calOpen: false, mon: monIdx(earliest) });
  const openCalendar = () => {
    if (f.calOpen) {
      set({ calOpen: false, start: null });
      return;
    }
    calJump.current = true;
    set({ calOpen: true, start: null, mon: monIdx(earliest) });
  };

  function summarize(): Summary {
    const st = f.start ? new Date(f.start) : null;
    if (!ms.pp && f.kind !== 'add') return { ok: false, txt: '연기 · 변경 횟수를 다 썼어요 · 운영진에게 문의해 주세요' };
    if (f.kind === 'rest') {
      if (!st) return { ok: false, txt: '언제부터 쉴지 골라 주세요' };
      if (!ready) return { ok: false, txt: '돌아갈 팀을 골라 주세요' };
      if (!restRt) return { ok: false, txt: '언제 돌아올지 골라 주세요' };
      // 첫 줄 = 쉬는 수업 · 둘째 줄 = 며칠 · 기간 · 복귀 (+ 옮기는 팀) — 내 스터디 카드가 줄을 나눠 따로 보여요
      const moveTxt = moves.map(([a, b]) => `${teamLabel(a)} → ${teamLabel(b)}`).join(' · ');
      const txt = `${T.map(teamLabel).join(' · ')}\n${restDays(st, restRt)}일 연기 · ${fmtDay(st)}~${fmtDay(addDays(restRt, -1))} · ${fmtDay(restRt)} 복귀${moves.length ? ` · 복귀 후 ${moveTxt}` : ''}`;
      // 사유를 고르고 자세히 적어야 다음으로 가요 (1달 넘게는 특별한 경우만)
      if (!reasonPick) return { ok: false, txt: longRest ? '1달 넘게 쉬는 사유를 골라 주세요' : '연기 사유를 골라 주세요' };
      if (f.why.trim().length < REST_REASON_MIN) return { ok: false, txt: `사유를 ${REST_REASON_MIN}자 이상 적어 주세요` };
      return { ok: true, label: moves.length ? '연기 · 팀 변경' : '연기', st, en: restRt, txt };
    }
    if (st && !startOk(st)) return { ok: false, txt: '새 팀 수업이 있는 날로 다시 골라 주세요' };
    if (f.kind === 'branch') {
      if (!mode) return { ok: false, txt: '어떻게 다닐지 골라 주세요' };
      if (mode === 'both' && many && !f.from) return { ok: false, txt: '바꿀 지점을 골라 주세요' };
      if (!f.br) return { ok: false, txt: '옮길 지점을 골라 주세요' };
      if (!f.picks.length) return { ok: false, txt: '새 지점에서 들을 팀을 골라 주세요' };
      if (!two && f.picks.length < pickMax) return { ok: false, txt: `팀을 ${pickMax}개 골라 주세요 · 지금 ${f.picks.length}개` };
      if (!st) return { ok: false, txt: '언제부터 바뀔지 골라 주세요' };
      if (endTeams.length && !f.gap) return { ok: false, txt: '그 전까지 들을지 쉴지 골라 주세요' };
      const label = CHANGE_KIND.branch[1];
      const labels = f.picks.map(teamLabel).join(' · ');
      const keptTxt = keptTeams.length ? ` · ${keptTeams.map(teamLabel).join(' · ')}은 그대로` : '';
      if (!endTeams.length) return { ok: true, label, st, txt: `${fmtDay(st)}부터 ${withJeom(f.br)} ${labels}도 같이 들어요 · 출석은 두 지점 합쳐 주 ${MULTI_BRANCH_WEEK_MAX}회까지` };
      return { ok: true, label, st, txt: `${moveHead(endTeams, f.picks)}\n${moveTail(f.gap, st)} · ${fmtDay(st)}부터 ${withJeom(f.br)}${keptTxt}` };
    }
    if (!f.to) return { ok: false, txt: '옮길 팀을 골라 주세요' };
    if (!st) return { ok: false, txt: '언제부터 들을지 골라 주세요' };
    const label = CHANGE_KIND[f.kind][1];
    if (f.kind !== 'add' && !f.gap) return { ok: false, txt: '옮기기 전까지 들을지 쉴지 골라 주세요' };
    if (f.kind === 'add') return { ok: true, label, st, txt: `${fmtDay(st)}부터 ${teamLabel(f.to)} 수업을 더해요 · 주 ${ms.wk}회 → ${ms.wk + ms.plan.perWeek}회` };
    const t = cls[0];
    return { ok: true, label, st, txt: `${moveHead([t], [f.to])}\n${moveTail(f.gap, st)} · ${fmtDay(st)}부터 새 팀${f.to.branch === t.branch ? '' : ` · ${withJeom(f.to.branch)}`}` };
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
    if (Platform.OS === 'web') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (f.step === 'pick') return false;
      back();
      return true;
    });
    return () => sub.remove();
  });

  // 신청 = 운영진 전산으로 넘기기 (바로 바뀌지 않고 대기로 남아요)
  const send = () => {
    if (!sum.ok || request.isPending) return;
    // 사유를 쓰던 키보드를 내리고 결과 창을 띄워요 (키보드가 결과 창 확인 버튼을 덮지 않게)
    Keyboard.dismiss();
    const done = { label: sum.label, txt: sum.txt };
    // 운영진에게 남길 말 칸은 뺐어요 (연기는 사유를 꼭 적어요) — API 는 빈 글로 보내요
    request.mutate(
      { label: sum.label, txt: sum.txt, msg: '', reason: reasonText },
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

  // 돌아올 곳을 바꾸면 복귀일을 그 스터디 요일 중 가장 가까운 날로 맞춰요
  const setBack = (t: Team, b: Back) =>
    setF((p) => {
      const nb = { ...p.back, [keyOf(t)]: b };
      const st = p.start ? new Date(p.start) : REST_MIN;
      const rt = fitReturn(st, p.ret ? new Date(p.ret) : null, daysOf(targetsOf(nb).filter((x): x is Team => !!x)));
      return { ...p, back: nb, ret: rt.getTime(), longOk: p.longOk && isLong(st, rt) };
    });

  const openSheet = (which: 'start' | 'ret') => {
    const d = which === 'start' ? restSt : restRt;
    sfx('tap');
    set({ sheet: which, mon: monIdx(d ?? REST_MIN) });
  };

  // 날을 눌러도 시트는 그대로 — 아래 버튼으로 정해요
  const pickRestDay = (t: number) => {
    const d = new Date(t);
    if (f.sheet === 'start') {
      // 시작을 옮겨도 쉬는 날 수는 그대로 (안 되는 요일이면 가장 가까운 복귀일로)
      const gap = restSt && restRt ? restDays(restSt, restRt) : REST_MIN_DAYS;
      const rt = fitReturn(d, addDays(d, Math.max(gap, REST_MIN_DAYS)), retDays);
      set({ start: t, ret: rt.getTime(), longOk: f.longOk && isLong(d, rt) });
      return;
    }
    const st = restSt ?? REST_MIN;
    // 1달을 넘는 날을 처음 고르면 확인 창부터
    if (isLong(st, d) && !f.longOk) {
      set({ longAsk: t });
      return;
    }
    set({ ret: t, longOk: f.longOk && isLong(st, d) });
  };

  // 팀 · 지점 변경 · 팀 추가: 새 일정은 2주 뒤부터
  const calendar = (
    <ChangeCalendar
      mon={f.mon}
      minMon={monIdx(earliest)}
      maxMon={monIdx(TODAY) + 6}
      min={earliest}
      max={ms.exp}
      start={f.start}
      end={null}
      allow={(d) => newDays.has(d.getDay())}
      onMonth={(d) => set({ mon: f.mon + d })}
      onPick={(t) => set({ start: t })}
      hint={`새 팀 수업 요일(${dayNames(newDays)})에서 골라요 · ${fmtDay(earliest)}부터`}
    />
  );

  // ---------- 1. 무엇을 바꿀까요? ----------
  if (f.step === 'pick') {
    const cards = [...KIND_CARD];
    if (!ms.plan.fixed && T.length < ms.plan.teams) cards.push(['add', 'plus', '#CDEBD0', `주 ${ms.plan.perWeek}회 더 · 횟수를 더 빨리 써요 · ${ms.plan.teams}팀까지`]);
    return (
      <AccountPage title="연기 · 팀 · 지점 변경" scrollRef={scroll} bodyStyle={styles.body}>
        {/* 남은 변경 횟수 티켓 (연기 · 팀 변경 · 지점 이동이 같이 써요) */}
        <View style={styles.tk} accessibilityLabel={`남은 변경 횟수 ${ms.pp === Infinity ? '무제한' : `${ms.pp}회`}`}>
          <View style={styles.tkStub}>
            <Icon name="ticket" size={22} />
          </View>
          <View style={styles.tkCut}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <View key={i} style={styles.tkDash} />
            ))}
          </View>
          <View style={styles.tkMain}>
            <PText style={styles.tkK}>남은 변경 횟수</PText>
            <PText style={styles.tkV}>{ms.pp === Infinity ? '무제한' : `${ms.pp}회`}</PText>
          </View>
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
                if (k === 'rest') {
                  // 연기는 가장 빠른 수업 날부터 2주가 처음부터 골라져 있어요
                  const st = firstOn(REST_MIN, myDays);
                  const rt = fitReturn(st, null, myDays);
                  setF({ ...fresh(), step: 'form', kind: k, start: st.getTime(), ret: rt.getTime(), mon: monIdx(st) });
                } else setF({ ...fresh(), step: 'form', kind: k, cls: 0, br: k === 'branch' ? '' : MY_BRANCH });
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
        <View style={styles.rules}>
          {['연기는 최소 2주 · 금요일은 휴무', '팀 · 지점 변경은 2주 전 신청', '운영진이 확인하면 바뀌어요'].map((line) => (
            <PText key={line} style={styles.rule}>{`· ${line}`}</PText>
          ))}
        </View>
      </AccountPage>
    );
  }

  // ---------- 3. 신청 확인 ----------
  if (f.step === 'confirm' && sum.ok) {
    const cn = cls.map((x) => x.no);
    const others = T.filter((x) => !cn.includes(x.no));
    const rows: [string, string][] = [
      // 팀 · 지점 변경은 그대로인 스터디를 카드 안에서 보여요
      ...(f.kind === 'add' ? others.map((x): [string, string] => [teamLabel(x), '그대로']) : []),
      ...(f.kind === 'add' ? [['주 참여', `주 ${ms.wk}회 → ${ms.wk + ms.plan.perWeek}회`] as [string, string]] : []),
      ...(uses > 0
        ? [
            ['쓰는 횟수', moves.length ? `총 ${uses}번 (연기 1번 + 팀 변경 ${moves.length}번)` : `1번 (${sum.label})`] as [string, string],
            ['남은 변경 횟수', ms.pp === Infinity ? '무제한' : `${ms.pp}번 → ${ms.pp - uses}번`] as [string, string],
          ]
        : []),
      ...(reasonText ? [['사유', reasonText] as [string, string]] : []),
    ];
    return (
      <AccountPage title="신청 확인" onBack={back} scrollRef={scroll} bodyStyle={styles.body} bottom={<Foot note="신청하면 관리자가 확인한 뒤 알림으로 알려 드려요" label={request.isPending ? '신청하는 중…' : `${sum.label} 신청하기`} ok={!request.isPending} onPress={send} />}>
        <PText style={styles.q}>이렇게 바뀌어요</PText>
        {f.kind === 'rest' && sum.en ? (
          <RestCard st={sum.st} rt={sum.en} teams={T} back={targets} />
        ) : (
        f.kind === 'add' && f.to ? (
          <Box style={styles.baw}>
            <PText style={styles.baS}>{`${fmtDay(sum.st)}부터 더해요`}</PText>
            <PText style={styles.baB}>{teamLabel(f.to)}</PText>
            <PText style={styles.baS}>{f.to.branch}</PText>
          </Box>
        ) : (
          <ChangeCard
            kind={f.kind === 'branch' ? (mode === 'both' ? (many ? '지점 이동 · 한 지점 바꾸기' : '지점 이동 · 두 지점 같이') : '지점 이동') : CHANGE_KIND[f.kind][1]}
            st={sum.st}
            ending={cls}
            kept={f.kind === 'branch' ? keptTeams : T.filter((x) => !cls.includes(x))}
            next={f.kind === 'branch' ? f.picks : f.to ? [f.to] : []}
            all={cls.length === T.length}
            hold={f.gap === 'hold'}
            weekMax={f.kind === 'branch' && mode === 'both' && two === 'teams' ? MULTI_BRANCH_WEEK_MAX : null}
          />
        )
        )}
        {rows.length > 0 && (
          <Box style={styles.rows}>
            {rows.map(([a, b], i) => (
              <View key={`${i}-${a}`} style={[styles.row, i > 0 && styles.rowLine]}>
                <PText style={styles.rowK}>{a}</PText>
                <PText style={styles.rowV}>{b}</PText>
              </View>
            ))}
          </Box>
        )}
        <Sheet
          open={!!sent}
          onClose={() => {
            setSent(null);
            goMyStudy();
          }}
          title={`${sent?.label ?? ''} 신청했어요`}
          footer={
            <View>
              <Button
                label="확인"
                wide
                onPress={() => {
                  setSent(null);
                  goMyStudy();
                }}
              />
            </View>
          }>
          {/* 연기는 기간 · 스터디를 카드로 크게 (글 두 줄 대신) */}
          {f.kind === 'rest' && sum.en ? <RestCard st={sum.st} rt={sum.en} teams={T} back={targets} /> : <PText style={styles.ds}>{sent?.txt}</PText>}
          <PText style={[styles.ds, styles.ds2]}>아직 확정은 아니에요 · 지금은 관리자 확인 대기 중이에요. 관리자가 확인한 뒤 알림으로 알려 드려요. 확정 전에는 마이 페이지에서 취소할 수 있어요.</PText>
        </Sheet>
      </AccountPage>
    );
  }

  // ---------- 2. 종류별 질문 ----------
  const k = f.kind;
  const sheetStart = f.sheet === 'start';
  const sMin = sheetStart ? REST_MIN : addDays(restSt ?? REST_MIN, REST_MIN_DAYS);
  const sMax = sheetStart ? startMax(ms.exp) : retMax(restSt ?? REST_MIN, ms.exp);
  const sDays = sheetStart ? myDays : retDays;
  const askRt = f.longAsk != null ? new Date(f.longAsk) : null;
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
          {/* 내 스터디 — 언어 색 이름표 · 요일 시간 · 레벨 (아래 줄에 남은 변경 횟수) */}
          <Box style={styles.mine}>
            <View style={styles.mineHead}>
              <PText style={styles.mineK} accessibilityRole="header">
                내 스터디
              </PText>
              <PText style={styles.mineN}>{`${T.length}개 · 모두 함께 쉬어요`}</PText>
            </View>
            <View style={styles.mineList}>
              {T.map((t) => (
                <StudyLine key={keyOf(t)} t={t} />
              ))}
            </View>
          </Box>
          <PText style={styles.note}>신청은 최소 2주부터 · 금요일은 휴무예요</PText>

          <Q n={1} text="언제부터 쉴까요?" />
          <DateRow label="시작" day={restSt ? fmtDay(restSt) : '골라 주세요'} onPress={() => openSheet('start')} />

          <Q n={2} text="돌아올 때 스터디는요?" />
          {T.map((t) => {
            const key = keyOf(t);
            const b = f.back[key];
            // 이미 듣는 팀은 빼요 (sameLevelTeams) · 다른 스터디가 옮겨 가기로 고른 팀도 빼요 (같은 팀으로 둘이 갈 수 없어요)
            const taken = moves.filter(([a]) => keyOf(a) !== key).map(([, x]) => keyOf(x));
            const list = sameLevelTeams(t, T).filter((x) => !taken.includes(keyOf(x)));
            // 옮기려면 연기 1번 + 지금까지 옮기는 팀 + 이 팀 1번이 남아 있어야 해요
            const enough = ms.pp === Infinity || ms.pp >= 2 + changing;
            const offWhy = !list.length ? `${levelShort(t.level)} 스터디가 있는 다른 팀이 없어요` : !b?.change && !enough ? `남은 변경 횟수가 ${changesLeftText(ms.pp)}이라 고를 수 없어요` : null;
            return (
              <View key={key} style={styles.backBlock} accessibilityRole="radiogroup">
                {/* 어느 스터디의 돌아올 곳인지 — 언어 색 이름표로 크게 */}
                <View style={styles.backHead}>
                  <StudyLine t={t} big />
                </View>
                <Opt title="지금 그대로" sub={`${teamLabel(t)} · ${levelShort(t.level)}`} on={!b?.change} onPress={() => setBack(t, { change: false, to: null })} />
                <Opt
                  title="다른 스터디로"
                  sub={offWhy ?? `팀 변경으로 횟수를 1번 더 써요 (총 ${1 + changing + (b?.change ? 0 : 1)}번)`}
                  on={!!b?.change}
                  disabled={!!offWhy}
                  onPress={() => setBack(t, { change: true, to: b?.to ?? null })}
                />
                {b?.change ? (
                  <View style={styles.subList}>
                    <PText style={styles.note}>{`내 레벨 ${levelShort(t.level)} 스터디가 있는 팀이에요`}</PText>
                    {list.map((x) => (
                      <Opt key={keyOf(x)} small title={teamLabel(x)} sub={`${x.lang} · ${levelShort(x.level)}`} on={!!b.to && keyOf(b.to) === keyOf(x)} onPress={() => setBack(t, { change: true, to: x })} />
                    ))}
                  </View>
                ) : null}
              </View>
            );
          })}

          <Q n={3} text="언제 돌아올까요?" />
          <DateRow label="복귀" day={ready && restRt ? fmtDay(restRt) : '돌아갈 팀을 먼저 골라 주세요'} disabled={!ready} onPress={() => openSheet('ret')} />
          {ready && restSt && restRt ? (
            <Box color="#F6F1FF" style={styles.res}>
              <View style={styles.resTop}>
                <PText style={styles.resB}>{`${restDays(restSt, restRt)}일 연기`}</PText>
                {longRest ? (
                  <View style={styles.longTag}>
                    <PText style={styles.longTagT}>1달 넘게</PText>
                  </View>
                ) : null}
              </View>
              <PText style={styles.resS}>{`${fmtDay(restSt)} ~ ${fmtDay(addDays(restRt, -1))} · 빠지는 수업 ${restCount(T, restSt, restRt)}회`}</PText>
              <PText style={styles.resS}>{`${fmtDay(restRt)}부터 다시 들어요`}</PText>
              {moves.map(([a, b]) => (
                <PText key={keyOf(a)} style={styles.resS}>{`${teamLabel(a)} → ${teamLabel(b)}`}</PText>
              ))}
            </Box>
          ) : null}

          {/* ④ 연기 사유 — 늘 적어요 (1달 넘게는 특별한 경우만 고를 수 있어요) */}
          <View
            onLayout={(e) => {
              reasonY.current = e.nativeEvent.layout.y;
            }}>
            <Q n={4} text={longRest ? '1달 넘게 쉬는 사유는요?' : '왜 쉬나요?'} req />
          </View>
          {longRest ? <PText style={styles.note}>출산, 군 입대 같은 특별한 경우만 신청할 수 있어요 · 운영진이 확인한 뒤 승인해요</PText> : null}
          {/* 한 줄로 — 화면이 좁으면 옆으로 밀어서 봐요 (화면 끝까지 이어지게) */}
          <ChipScroll horizontal showsHorizontalScrollIndicator={false} style={styles.reasonRow} contentContainerStyle={styles.reasonIn} accessibilityLabel="연기 사유">
            {reasonList.map((r) => (
              <ChoiceChip key={r} label={r} on={reasonPick === r} onPress={() => set({ reason: r })} />
            ))}
          </ChipScroll>
          <GrowInput
            value={f.why}
            onChangeText={(t) => set({ why: t })}
            maxLength={200}
            multiline
            placeholder={`자세한 사유를 적어 주세요 (${REST_REASON_MIN}자 이상)\n${longRest ? '예) 2027년 3월 입대 예정이에요' : '예) 12월에 2주 해외 출장이 잡혔어요'}`}
            placeholderTextColor="#9B94A6"
            accessibilityLabel="자세한 연기 사유 (필수)"
            style={styles.msg}
          />

          {/* 날짜는 아래에서 올라오는 달력 시트로 — 날을 눌러도 닫히지 않고, 아래 버튼으로 정해요 */}
          <Sheet
            open={!!f.sheet}
            onClose={() => set({ sheet: null })}
            title={sheetStart ? '언제부터 쉴까요?' : '언제 돌아올까요?'}
            footer={
              <Button
                label={sheetStart ? `${restSt ? fmtDay(restSt) : ''}부터 쉬기` : restSt && restRt ? `${fmtDay(restRt)}에 복귀 · ${restDays(restSt, restRt)}일 연기` : '정하기'}
                wide
                onPress={() => set({ sheet: null })}
              />
            }>
            <ChangeCalendar
              mon={f.mon}
              minMon={monIdx(sMin)}
              maxMon={monIdx(sMax)}
              min={sMin}
              max={sMax}
              start={f.start}
              end={restRt}
              endLabel="복귀"
              allow={(d) => sDays.has(d.getDay())}
              onMonth={(d) => set({ mon: f.mon + d })}
              onPick={pickRestDay}
              hint={
                sheetStart
                  ? `내 스터디 요일(${dayNames(myDays)})에서 골라요`
                  : `${dayNames(retDays)} 중에서 (${fmtDay(sMin)} ~ ${ymd(sMax)})`
              }
            />
          </Sheet>
          <ConfirmDialog
            open={!!askRt}
            title="1달 넘게 쉬려면 사유가 필요해요"
            message={`${restSt && askRt ? `${fmtDay(restSt)} ~ ${fmtDay(addDays(askRt, -1))} · ${restDays(restSt, askRt)}일 연기 · ${fmtDay(askRt)} 복귀\n\n` : ''}1달 넘게는 출산, 군 입대 같은 특별한 경우만 신청할 수 있어요. 사유를 적으면 운영진이 확인한 뒤 승인해요.`}
            confirmLabel="그래도 신청하기"
            cancelLabel="날짜 다시 고르기"
            onConfirm={() => {
              // 창 · 달력을 닫고 사유 칸으로 내려가요
              set({ ret: f.longAsk, longOk: true, longAsk: null, sheet: null });
              setTimeout(() => scroll.current?.scrollTo({ y: Math.max(0, reasonY.current - 12), animated: true }), 450);
            }}
            onCancel={() => set({ longAsk: null })}
          />
        </>
      ) : (
        k === 'branch' ? (
        <>
          {/* 지금 듣는 팀 — 연기의 '내 스터디' 칸과 같은 모양 (언어 이름표 · 요일 시간 · 레벨), 지점마다 묶어요 */}
          <Box style={styles.mine}>
            <View style={styles.mineHead}>
              <PText style={styles.mineK} accessibilityRole="header">
                지금 듣는 팀
              </PText>
              <PText style={styles.mineN}>{`${T.length}개`}</PText>
            </View>
            {nowBranches.map((b, i) => (
              <View key={b} style={[styles.mineList, i > 0 && styles.nowSplit]}>
                {/* 등록된 내 지점은 노란 '내 지점' 이름표로 눈에 띄게 */}
                <View style={styles.nowBrRow}>
                  <PText style={[styles.nowBr, b === MY_BRANCH && styles.nowBrMine]}>{withJeom(b)}</PText>
                  {b === MY_BRANCH ? (
                    <View style={styles.slTag}>
                      <PText style={styles.slTagT}>내 지점</PText>
                    </View>
                  ) : null}
                </View>
                {T.filter((x) => x.branch === b).map((t) => (
                  <StudyLine key={keyOf(t)} t={t} />
                ))}
              </View>
            ))}
          </Box>
          {two ? (
            <>
              <PText style={styles.q}>어떻게 다닐까요?</PText>
              <View style={styles.teams} accessibilityRole="radiogroup">
                <Opt title="아예 옮겨요" sub="앞으로 새 지점에서만 들어요" on={f.mode === 'move'} onPress={() => set({ mode: 'move', from: '', br: '', picks: [] })} />
                <Opt
                  title="두 지점 같이 다녀요"
                  sub={
                    many
                      ? `${nowBranches.map(withJeom).join(' · ')} 중 한 곳을 바꿔요`
                      : two === 'teams'
                        ? '지금 수업은 그대로 · 2개 지점 병행해요'
                        : '2개 지점 병행해요 · 지점마다 1팀씩'
                  }
                  on={f.mode === 'both'}
                  onPress={() => set({ mode: 'both', from: '', br: '', picks: [] })}
                />
              </View>
            </>
          ) : (
            <PText style={styles.note}>{`지금 수업은 모두 새 지점으로 옮겨요 · 내 지점(${withJeom(MY_BRANCH)})도 새 지점으로 바뀌어요`}</PText>
          )}
          {/* 두 지점을 다니는 회원: 바꿀 지점 고르기 */}
          {mode === 'both' && many ? (
            <>
              <PText style={styles.q}>어느 지점을 바꿀까요?</PText>
              <View style={styles.chips}>
                {nowBranches.map((b) => (
                  <ChoiceChip key={b} label={withJeom(b)} on={f.from === b} onPress={() => set({ from: b, picks: [] })} />
                ))}
              </View>
              {f.from && endTeams.length ? (
                <PText style={styles.note}>{`${endTeams.map(teamLabel).join(' · ')} 수업은 끝나요`}</PText>
              ) : null}
            </>
          ) : null}
          {/* 새 지점 고르기 (지금 다니는 지점은 목록에서 빼요) */}
          {mode && (!many || mode !== 'both' || f.from) ? (
            <>
              <PText style={styles.q}>{mode === 'both' ? (many ? '어느 지점으로 바꿀까요?' : '어느 지점을 더 다닐까요?') : two ? '어느 지점으로 옮길까요?' : '어느 지점으로요?'}</PText>
              {/* 지점 고르기는 가입 단계와 같은 시트로 (검색 · 권역 탭 · 권역별 카드) */}
              <Pressable
                onPress={() => {
                  sfx('tap');
                  setBrOpen(true);
                }}
                accessibilityRole="button"
                accessibilityLabel={f.br ? `옮길 지점 ${withJeom(f.br)} · 바꾸기` : '옮길 지점 고르기'}
                style={({ pressed }) => [styles.sel, pressed && styles.selPressed]}>
                <PText style={[styles.selT, !f.br && styles.selPh]}>{f.br ? withJeom(f.br) : '지점을 골라 주세요'}</PText>
                <PText style={styles.selGo}>{f.br ? '바꾸기 ›' : '고르기 ›'}</PText>
              </Pressable>
              <BranchListSheet open={brOpen} onClose={() => setBrOpen(false)} title="어느 지점으로 옮길까요?" value={f.br} hide={nowBranches} raw onPick={(b) => set({ br: b, picks: [] })} />
            </>
          ) : null}
          {mode === 'both' && !many && two === 'oneEach' ? (
            <>
              <PText style={styles.q}>어떤 수업을 옮길까요?</PText>
              <View style={styles.chips}>
                {T.map((x, i) => (
                  <ChoiceChip key={keyOf(x)} label={teamLabel(x)} on={(f.cls === 'all' ? 0 : f.cls) === i} onPress={() => set({ cls: i, picks: [] })} />
                ))}
              </View>
              <PText style={styles.note}>{`지금 · ${branchName(pickedCls.branch)} · ${levelShort(pickedCls.level)} · 나머지 수업은 그대로`}</PText>
            </>
          ) : null}
          {target && mode ? (
            <>
              {pickMax > 0 ? (
                <>
                  <PText style={styles.q}>어느 팀으로 갈까요?</PText>
                  {brs.map((b) => {
                    const max = perMax(b);
                    const got = picksIn(b);
                    const has = keptTeams.filter((x) => x.branch === b);
                    const list = matchOf(b);
                    return (
                      <View key={b} style={styles.teams}>
                        <PText style={styles.q2}>{`${branchName(b)} · ${!two ? `${T.length}팀 골라 주세요` : max === 1 ? '1팀 골라 주세요' : '들어갈 수 있는 팀'}`}</PText>
                        {/* 그 지점에서 지금 듣는 팀이 있으면 이름으로 보여 줘요 (몇 팀인지 대신) */}
                        {has.length ? <PText style={styles.note}>{`지금 듣는 팀 · ${has.map(teamLabel).join(' · ')}`}</PText> : null}
                        {list.length ? (
                          list.map((x) => {
                            const on = f.picks.some((q) => keyOf(q) === keyOf(x));
                            return (
                              <Opt
                                key={keyOf(x)}
                                title={teamLabel(x)}
                                sub={levelShort(x.level)}
                                on={on}
                                // 다 골랐으면 나머지 팀은 눌리지 않아요 (1팀만 고를 때는 바꿔 골라요)
                                disabled={!on && max > 1 && got.length >= max}
                                onPress={() =>
                                  set({
                                    picks: on ? f.picks.filter((q) => keyOf(q) !== keyOf(x)) : max === 1 ? [...f.picks.filter((q) => q.branch !== b), x] : [...f.picks, x],
                                  })
                                }
                              />
                            );
                          })
                        ) : (
                          <PText style={styles.empty}>지금 들어갈 수 있는 팀이 없어요 · 운영진에게 문의해 주세요</PText>
                        )}
                      </View>
                    );
                  })}
                </>
              ) : null}
              <PText style={styles.q}>언제부터 새 지점에서 들을까요?</PText>
              <PText style={styles.note}>{`2주 전에 신청해야 해요 · 가장 빨리 ${fmtDay(earliest)}부터`}</PText>
              <View style={styles.chips}>
                <ChoiceChip label={`${fmtDay(earliest)} · 가장 빠른 날`} on={!f.calOpen && f.start === earliest.getTime()} onPress={pickEarliest} />
                <ChoiceChip label="날짜 고르기" on={f.calOpen} onPress={openCalendar} />
              </View>
              {f.calOpen ? (
                <View
                  onLayout={(e) => {
                    // 날짜 고르기를 눌렀을 때만 달력으로 내려가요 (달을 넘길 때는 그대로)
                    if (!calJump.current) return;
                    calJump.current = false;
                    const y = e.nativeEvent.layout.y;
                    setTimeout(() => scroll.current?.scrollTo({ y: Math.max(0, y - 60), animated: true }), 50);
                  }}>
                  {calendar}
                </View>
              ) : null}
              {endTeams.length ? <GapPick gap={f.gap} start={f.start} onPick={(g) => set({ gap: g })} /> : null}
            </>
          ) : null}
        </>
        ) : (
        <>
          {k !== 'add' ? (
            <>
              <PText style={styles.q}>어떤 수업을 바꿀까요?</PText>
              <View style={styles.chips}>
                {T.map((x, i) => (
                  <ChoiceChip key={x.no} label={teamLabel(x)} on={(f.cls === 'all' ? 0 : f.cls) === i} onPress={() => set({ cls: i, to: null })} />
                ))}
              </View>
              <PText style={styles.note}>{`지금 · ${branchName(cls[0].branch)} · ${levelShort(cls[0].level)}`}</PText>
            </>
          ) : null}
          <PText style={styles.q}>{k === 'add' ? '어느 팀을 더할까요?' : '어느 팀으로 갈까요?'}</PText>
          <PText style={styles.q2}>{`${branchName(pickBranch)} · 들어갈 수 있는 팀`}</PText>
          <View style={styles.teams} accessibilityRole="radiogroup">
            {match.length ? (
              match.map((x) => {
                const on = !!f.to && f.to.branch === x.branch && f.to.no === x.no;
                return <Opt key={x.no} title={teamLabel(x)} sub={levelShort(x.level)} on={on} onPress={() => set({ to: x })} />;
              })
            ) : (
              <PText style={styles.empty}>지금 들어갈 수 있는 팀이 없어요 · 운영진에게 문의해 주세요</PText>
            )}
          </View>
          <PText style={styles.q}>{k === 'add' ? '언제부터요?' : '언제부터 새 팀에서 들을까요?'}</PText>
          {k !== 'add' ? <PText style={styles.note}>{`2주 전에 신청해야 해요 · 가장 빨리 ${fmtDay(earliest)}부터`}</PText> : null}
          <View style={styles.chips}>
            <ChoiceChip label={`${fmtDay(earliest)} · 가장 빠른 날`} on={!f.calOpen && f.start === earliest.getTime()} onPress={pickEarliest} />
            <ChoiceChip label="날짜 고르기" on={f.calOpen} onPress={openCalendar} />
          </View>
          {f.calOpen ? (
            <View
              onLayout={(e) => {
                // 날짜 고르기를 눌렀을 때만 달력으로 내려가요 (달을 넘길 때는 그대로)
                if (!calJump.current) return;
                calJump.current = false;
                const y = e.nativeEvent.layout.y;
                setTimeout(() => scroll.current?.scrollTo({ y: Math.max(0, y - 60), animated: true }), 50);
              }}>
              {calendar}
            </View>
          ) : null}
          {k !== 'add' ? <GapPick gap={f.gap} start={f.start} onPick={(g) => set({ gap: g })} /> : null}
        </>
        )
      )}
    </AccountPage>
  );
}

/** 옮기기 전까지: 지금 팀에서 듣다가 · 쉬다가(홀딩) */
function GapPick({ gap, start, onPick }: { gap: Gap | null; start: number | null; onPick: (g: Gap) => void }) {
  const st = start ? new Date(start) : null;
  return (
    <>
      <PText style={styles.q}>옮기기 전까지는요?</PText>
      <View style={styles.teams} accessibilityRole="radiogroup">
        <Opt title="지금 팀에서 듣다가 옮겨요" sub={st ? `${fmtDay(keepLast(st))}까지 지금 팀에서 들어요` : '새 팀이 시작하는 주의 전 주까지 들어요'} on={gap === 'keep'} onPress={() => onPick('keep')} />
        <Opt title="쉬다가 옮겨요 (홀딩)" sub={st ? `${fmtDay(REST_MIN)}~${fmtDay(addDays(st, -1))} 쉬어요` : '내일부터 옮기는 날 전날까지 쉬어요'} on={gap === 'hold'} onPress={() => onPick('hold')} />
      </View>
    </>
  );
}

/** 지점 이름 · 내 지점(수업 듣는 지점)이면 '(내 지점)' */
const branchName = (b: string) => `${withJeom(b)}${MY_BRANCHES.includes(b) ? '(내 지점)' : ''}`;

/** 스터디 한 줄 — 언어 색 이름표 · 요일 시간 · 오른쪽 레벨 (또는 이름표 글) */
function StudyLine({ t, big, tag }: { t: Team; big?: boolean; tag?: string }) {
  return (
    <View style={styles.sl}>
      <View style={[styles.lang, { backgroundColor: LANG_COLOR[t.lang] }]}>
        <PText style={styles.langT}>{t.lang}</PText>
      </View>
      <PText style={[styles.slT, big && styles.slTBig]} numberOfLines={1}>
        {teamLabel(t).slice(t.lang.length + 1)}
      </PText>
      {tag ? (
        <View style={styles.slTag}>
          <PText style={styles.slTagT}>{tag}</PText>
        </View>
      ) : (
        <View style={styles.lv}>
          <PText style={styles.lvT} numberOfLines={1}>
            {levelShort(t.level)}
          </PText>
        </View>
      )}
    </View>
  );
}

/** 연기 요약 카드 (신청 확인 · 신청했어요): 위 보라 띠 = 기간 · 며칠 · 빠지는 수업, 아래 = 쉬는 스터디 → 복귀일 → 돌아오는 스터디 */
function RestCard({ st, rt, teams, back }: { st: Date; rt: Date; teams: Team[]; back: (Team | null)[] }) {
  const long = isLong(st, rt);
  return (
    <Box style={styles.rc}>
      <View style={styles.rcTop}>
        <PText style={styles.rcK}>쉬는 기간</PText>
        <PText style={styles.rcBig}>{`${fmtDay(st)} ~ ${fmtDay(addDays(rt, -1))}`}</PText>
        <View style={styles.rcChips}>
          <View style={styles.rcChip}>
            <PText style={styles.rcChipT}>{`${restDays(st, rt)}일 연기`}</PText>
          </View>
          <View style={[styles.rcChip, styles.rcChipSoft]}>
            <PText style={[styles.rcChipT, styles.rcChipSoftT]}>{`수업 ${restCount(teams, st, rt)}회 쉬어요`}</PText>
          </View>
          {long ? (
            <View style={styles.longTag}>
              <PText style={styles.longTagT}>1달 넘게</PText>
            </View>
          ) : null}
        </View>
      </View>
      <View style={styles.rcSec}>
        <PText style={styles.rcK2}>쉬는 스터디</PText>
        {teams.map((t) => (
          <StudyLine key={keyOf(t)} t={t} />
        ))}
      </View>
      <View style={styles.rcRet}>
        <PText style={styles.rcRetT}>{`${fmtDay(rt)} 복귀`}</PText>
      </View>
      <View style={styles.rcSec}>
        <PText style={styles.rcK2}>돌아오는 스터디</PText>
        {teams.map((t, i) => {
          const to = back[i] ?? t;
          const moved = keyOf(to) !== keyOf(t);
          return (
            <View key={keyOf(t)} style={styles.rcItem}>
              <StudyLine t={to} tag={moved ? '팀 변경' : undefined} />
              {moved ? <PText style={styles.rcFrom}>{`지금 ${teamLabel(t)}에서 옮겨요`}</PText> : null}
            </View>
          );
        })}
      </View>
    </Box>
  );
}

/**
 * 팀 변경 · 지점 이동 요약 카드 (신청 확인) — 꼭 필요한 것만:
 * 위 보라 띠 = 언제부터 · 어느 지점, 가운데 = 새 스터디, 아래 회색 줄 = 지금 스터디는 어떻게 되는지 한두 줄.
 */
function ChangeCard({ kind, sub, st, ending, kept, next, all, hold, weekMax }: { kind: string; sub?: string; st: Date; ending: Team[]; kept: Team[]; next: Team[]; all: boolean; hold: boolean; weekMax: number | null }) {
  const last = addDays(st, -1);
  // 지점이 바뀔 때만 '○○점에서 들어요' (같은 지점 팀 변경이면 지점 줄은 빼요)
  const moved = next.some((t) => !ending.some((e) => e.branch === t.branch));
  const where = sub ?? (moved && next[0] ? `${withJeom(next[0].branch)}에서 들어요` : '');
  const until = hold ? `${fmtDay(REST_MIN)}~${fmtDay(last)} 쉬고 끝나요` : `${fmtDay(keepLast(st))}까지 듣고 끝나요`;
  const notes = [
    kept.length ? `${kept.map(teamLabel).join(' · ')}는 그대로예요` : null,
    weekMax ? `출석은 두 지점 합쳐 주 ${weekMax}회까지예요` : null,
  ].filter((x): x is string => !!x);
  return (
    <Box style={styles.rc}>
      <View style={styles.rcTop}>
        <PText style={styles.rcK}>{kind}</PText>
        <PText style={styles.rcBig}>{`${fmtDay(st)}부터`}</PText>
        {where ? <PText style={styles.cgSub}>{where}</PText> : null}
      </View>
      {ending.length ? (
        <View style={styles.rcSec}>
          <PText style={styles.rcK2}>{`${all ? '지금 스터디' : '바뀌는 스터디'} · ${until}`}</PText>
          {ending.map((t) => (
            <StudyLine key={keyOf(t)} t={t} />
          ))}
        </View>
      ) : null}
      {next.length ? (
        <View style={styles.rcSec}>
          <PText style={styles.rcK2}>새 스터디</PText>
          {next.map((t) => (
            <StudyLine key={keyOf(t)} t={t} />
          ))}
        </View>
      ) : null}
      {notes.length ? (
        <View style={styles.cgNotes}>
          {notes.map((n) => (
            <PText key={n} style={styles.cgNote}>{`· ${n}`}</PText>
          ))}
        </View>
      ) : null}
    </Box>
  );
}

/** 번호 붙은 질문 (연기 ① ② ③) */
function Q({ n, text, req }: { n: number; text: string; req?: boolean }) {
  return (
    <View style={styles.qRow}>
      <View style={styles.qNo}>
        <PText style={styles.qNoT}>{n}</PText>
      </View>
      <PText style={styles.qText} accessibilityRole="header">
        {text}
        {req ? <PText style={styles.req}> *</PText> : null}
      </PText>
    </View>
  );
}

/** 날짜 한 줄 (시작 · 복귀) — 누르면 달력 시트가 올라와요 */
function DateRow({ label, day, onPress, disabled }: { label: string; day: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={`${label} ${day} · 달력에서 바꾸기`} accessibilityState={{ disabled }}>
      {({ pressed }) => (
        <Lift radius={18} dx={disabled ? 0 : 3} dy={disabled ? 0 : 3} pressed={pressed}>
          <View style={[styles.dRow, disabled && styles.dRowOff]}>
            <PText style={styles.dK}>{label}</PText>
            <PText style={[styles.dV, disabled && styles.dOffT]}>{day}</PText>
            {disabled ? null : <PText style={styles.dGo}>바꾸기 ›</PText>}
          </View>
        </Lift>
      )}
    </Pressable>
  );
}

/** 고르기 한 칸 (돌아올 스터디 · 옮겨 갈 팀) */
function Opt({ title, sub, on, disabled, small, onPress }: { title: string; sub: string; on: boolean; disabled?: boolean; small?: boolean; onPress: () => void }) {
  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        sfx('tap');
        haptic('select');
        onPress();
      }}
      accessibilityRole="radio"
      accessibilityLabel={`${title} · ${sub}`}
      accessibilityState={{ checked: on, disabled }}>
      <Lift radius={16} dx={on ? 2 : 0} dy={on ? 2 : 0} color={Colors.purple}>
        <View style={[styles.team, small && styles.teamSmall, on && styles.teamOn, disabled && styles.teamOff]}>
          <View style={[styles.rd, on && styles.rdOn, disabled && styles.rdOff]} />
          <View style={styles.optTx}>
            <PText style={[styles.teamB, disabled && styles.dOffT]}>{title}</PText>
            <PText style={[styles.optS, disabled && styles.dOffT]}>{sub}</PText>
          </View>
        </View>
      </Lift>
    </Pressable>
  );
}

/** 아래 고정 바 + 막힘 · 안내 한 줄 (프로토타입 .lg-dcta.cg-foot) */
function Foot({ note, label, ok, onPress }: { note: string; label: string; ok: boolean; onPress: () => void }) {
  const insets = useSafeAreaInsets();
  const kb = useKeyboardShown();
  return (
    <View>
      {/* 안내 한 줄은 아래 바 선 위에 (바 안에는 버튼만) */}
      {note ? <PText style={styles.footNote}>{note}</PText> : null}
      <View style={[styles.foot, { paddingBottom: 18 + (kb ? 0 : insets.bottom) }]}>
        <Button label={label} wide disabled={!ok} onPress={onPress} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingTop: 8, gap: 10 },
  dim: { opacity: 0.45 },
  q: { marginTop: 14, fontFamily: Font.body900, fontSize: 17, lineHeight: 24 },
  q2: { marginTop: 8, fontFamily: Font.body900, fontSize: 13, lineHeight: 19, color: Colors.inkSub },
  qRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 },
  qNo: { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.ink, alignItems: 'center', justifyContent: 'center' },
  qNoT: { fontFamily: Font.body900, fontSize: 12, lineHeight: 16, color: Colors.white },
  qText: { flex: 1, fontFamily: Font.body900, fontSize: 17, lineHeight: 24 },
  kind: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 14, borderRadius: 22, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white },
  kindIc: { width: 42, height: 42, borderRadius: 13, borderWidth: 2, borderColor: Colors.ink, alignItems: 'center', justifyContent: 'center' },
  kindTx: { flex: 1, gap: 1 },
  kindB: { fontFamily: Font.body900, fontSize: 15.5, lineHeight: 22 },
  kindS: { fontFamily: Font.body700, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  kindGo: { fontFamily: Font.body900, fontSize: 16, color: Colors.inkSub },
  rules: { gap: 2 },
  warn: { color: Colors.rosePink },
  nowBrRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nowBr: { fontFamily: Font.body800, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  nowBrMine: { fontFamily: Font.body900, fontSize: 13.5, lineHeight: 19, color: Colors.ink },
  nowSplit: { borderTopWidth: 1.5, borderColor: Colors.line, paddingTop: 10 },
  selPh: { color: Colors.inkSub },
  mineT: { fontFamily: Font.body800, fontSize: 12, color: Colors.inkSub },
  rule: { paddingHorizontal: 2, fontFamily: Font.body700, fontSize: 12.5, lineHeight: 20.6, color: Colors.inkSub },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, alignItems: 'center' },
  reasonRow: { marginHorizontal: -16, flexGrow: 0 },
  reasonIn: { gap: 7, paddingHorizontal: 16, alignItems: 'center' },
  note: { fontFamily: Font.body700, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  mine: { padding: 0 },
  mineHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, paddingTop: 14, paddingBottom: 4, paddingHorizontal: 16 },
  mineK: { fontFamily: Font.body900, fontSize: 16, lineHeight: 22 },
  mineN: { fontFamily: Font.body700, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  mineList: { gap: 2, paddingTop: 4, paddingBottom: 12, paddingHorizontal: 16 },
  tk: { marginTop: 14, flexDirection: 'row', alignItems: 'stretch', borderWidth: 2, borderColor: Colors.ink, borderRadius: 16, overflow: 'hidden', backgroundColor: Colors.white },
  tkStub: { width: 50, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.yellow },
  tkCut: { width: 2, justifyContent: 'space-evenly', backgroundColor: Colors.yellow },
  tkDash: { width: 2, height: 5, backgroundColor: Colors.ink },
  tkMain: { flex: 1, paddingVertical: 9, paddingHorizontal: 14 },
  tkK: { fontFamily: Font.body700, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  tkV: { fontFamily: Font.body900, fontSize: 18, lineHeight: 25, color: Colors.ink },
  pill: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: 10, backgroundColor: Colors.lavender },
  pillT: { fontFamily: Font.body900, fontSize: 12.5, lineHeight: 18, color: Colors.purple },
  sl: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  slT: { flex: 1, fontFamily: Font.body900, fontSize: 15.5, lineHeight: 22, color: Colors.ink },
  slTBig: { fontSize: 17, lineHeight: 24 },
  slTag: { flexShrink: 0, paddingVertical: 2, paddingHorizontal: 8, borderRadius: 9, borderWidth: 1.5, borderColor: Colors.ink, backgroundColor: Colors.yellow },
  slTagT: { fontFamily: Font.body900, fontSize: 11.5, lineHeight: 16, color: Colors.ink },
  backHead: { marginTop: 8, paddingTop: 10, borderTopWidth: 1.5, borderColor: Colors.line },
  cgSub: { fontFamily: Font.body800, fontSize: 13.5, lineHeight: 19, color: Colors.purple },
  cgNotes: { gap: 2, marginHorizontal: 16, marginBottom: 14, paddingTop: 10, borderTopWidth: 1.5, borderColor: Colors.line },
  cgNote: { fontFamily: Font.body700, fontSize: 12.5, lineHeight: 18, color: Colors.inkSub },
  rc: { padding: 0, overflow: 'hidden' },
  rcTop: { gap: 4, paddingVertical: 14, paddingHorizontal: 16, backgroundColor: Colors.lavender, borderBottomWidth: 2, borderColor: Colors.ink },
  rcK: { fontFamily: Font.body800, fontSize: 12, lineHeight: 17, color: Colors.purple },
  rcBig: { fontFamily: Font.body900, fontSize: 21, lineHeight: 29, color: Colors.ink },
  rcChips: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 4 },
  rcChip: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: 10, backgroundColor: Colors.purple },
  rcChipT: { fontFamily: Font.body900, fontSize: 12.5, lineHeight: 18, color: Colors.white },
  rcChipSoft: { backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.purple },
  rcChipSoftT: { color: Colors.purple },
  rcSec: { paddingTop: 12, paddingBottom: 8, paddingHorizontal: 16 },
  rcK2: { fontFamily: Font.body800, fontSize: 12, lineHeight: 17, color: Colors.inkSub, marginBottom: 2 },
  rcRet: { flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: 16, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#F3EEFB' },
  rcRetT: { fontFamily: Font.body900, fontSize: 14, lineHeight: 20, color: Colors.purple },
  rcItem: { gap: 0 },
  rcFrom: { marginTop: -4, marginBottom: 4, marginLeft: 62, fontFamily: Font.body700, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  lang: { minWidth: 52, alignItems: 'center', paddingVertical: 3, paddingHorizontal: 8, borderRadius: 9, borderWidth: 1.5, borderColor: Colors.ink },
  langT: { fontFamily: Font.body900, fontSize: 12, lineHeight: 17, color: Colors.white },
  lv: { flexShrink: 0, paddingVertical: 2, paddingHorizontal: 8, borderRadius: 9, backgroundColor: Colors.cream, borderWidth: 1.5, borderColor: Colors.line },
  lvT: { fontFamily: Font.body800, fontSize: 11.5, lineHeight: 16, color: Colors.inkSub },
  dRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 54, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 18, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white },
  dRowOff: { borderColor: Colors.line },
  dK: { width: 34, fontFamily: Font.body800, fontSize: 13, lineHeight: 19, color: Colors.inkSub },
  dV: { flex: 1, fontFamily: Font.body900, fontSize: 17, lineHeight: 24 },
  dGo: { fontFamily: Font.body800, fontSize: 13, lineHeight: 19, color: Colors.purple },
  dOffT: { color: '#B9B2A4' },
  backBlock: { gap: 8 },
  subList: { gap: 8, marginLeft: 14, paddingLeft: 12, borderLeftWidth: 2, borderColor: Colors.line },
  optTx: { flex: 1, gap: 1 },
  optS: { fontFamily: Font.body700, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  res: { paddingVertical: 12, paddingHorizontal: 14, gap: 2 },
  resTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resB: { fontFamily: Font.body900, fontSize: 15, lineHeight: 21 },
  resS: { fontFamily: Font.body700, fontSize: 12.5, lineHeight: 18, color: Colors.inkSub },
  longTag: { paddingVertical: 1, paddingHorizontal: 7, borderRadius: 8, borderWidth: 1.5, borderColor: Colors.ink, backgroundColor: Colors.yellow },
  longTagT: { fontFamily: Font.body900, fontSize: 11.5, lineHeight: 16, color: Colors.ink },
  req: { fontFamily: Font.body900, color: '#E5484D' },
  sel: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 52, paddingHorizontal: 16, borderWidth: 2, borderColor: Colors.ink, borderRadius: 14, backgroundColor: Colors.white },
  selPressed: { backgroundColor: '#F6F1E4' },
  selT: { fontFamily: Font.body900, fontSize: 15.5, lineHeight: 21, color: Colors.purple },
  selGo: { fontFamily: Font.body800, fontSize: 13, lineHeight: 18, color: Colors.inkSub },
  teams: { gap: 8 },
  team: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 60, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 16, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white },
  teamSmall: { minHeight: 52, paddingVertical: 8 },
  teamOn: { backgroundColor: '#F3EEFB', borderColor: Colors.purple },
  teamOff: { borderColor: Colors.line },
  rd: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white },
  rdOn: { borderWidth: 7, borderColor: Colors.purple },
  rdOff: { borderColor: Colors.line },
  teamB: { fontFamily: Font.body900, fontSize: 14.5, lineHeight: 21 },
  empty: { paddingVertical: 14, textAlign: 'center', fontFamily: Font.body700, fontSize: 14, lineHeight: 21, color: Colors.inkSub },
  baw: { padding: 16, gap: 2 },
  baS: { fontFamily: Font.body700, fontSize: 12.5, lineHeight: 18, color: Colors.inkSub },
  baB: { fontFamily: Font.body900, fontSize: 17, lineHeight: 24 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 10 },
  tagText: { fontFamily: Font.body900, fontSize: 13, lineHeight: 19, color: Colors.purple },
  rows: { paddingVertical: 2, paddingHorizontal: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, paddingVertical: 11 },
  rowLine: { borderTopWidth: 1.5, borderColor: Colors.line },
  rowK: { flexShrink: 1, fontFamily: Font.body700, fontSize: 13.5, lineHeight: 20, color: Colors.inkSub },
  rowV: { flexShrink: 1, textAlign: 'right', fontFamily: Font.body900, fontSize: 13.5, lineHeight: 20 },
  msg: { minHeight: 88, borderRadius: 16, borderWidth: 2, borderColor: Colors.ink, paddingVertical: 12, paddingHorizontal: 14, backgroundColor: Colors.white, fontFamily: Font.body600, fontSize: 14, color: Colors.ink, textAlignVertical: 'top' },
  foot: { gap: 8, paddingTop: 12, paddingHorizontal: 16, backgroundColor: Colors.cream, borderTopWidth: 2, borderColor: Colors.ink },
  footNote: { paddingHorizontal: 18, paddingVertical: 8, backgroundColor: Colors.cream, fontFamily: Font.body700, fontSize: 13, lineHeight: 19, color: Colors.inkSub },
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
