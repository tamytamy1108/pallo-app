import { StyleSheet, View } from 'react-native';

import { Pressable } from '@/components/ui/pressable';
import { PText } from '@/components/ui/text';
import { isSameDay, todayMark } from '@/components/ui/today-mark';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { DOW } from '@/data/account';
import { sfx } from '@/lib/feedback';

type Props = {
  /** 2026년 기준 달 번호 (12 = 2027년 1월 · data/account monIdx) */
  mon: number;
  minMon: number;
  maxMon: number;
  min: Date;
  max: Date;
  start: number | null;
  /** 쉬어가기면 끝나는 날까지 칠해요 */
  end: Date | null;
  onMonth: (delta: number) => void;
  onPick: (t: number) => void;
  /** 이 날만 고를 수 있어요 (요일 제한 — 연기는 내 스터디 요일 · 금요일 휴무). 없으면 min ~ max 모두 */
  allow?: (d: Date) => boolean;
  /** 끝 날 화면 읽기 이름 (기본 '끝' · 연기 복귀일은 '복귀') */
  endLabel?: string;
  /** 달력 아래 보라 안내 한 줄 (이벤트 달력 .lg-mcal 의 '1주 뒤부터 3달 안에서 골라요' 자리) */
  hint?: string;
  /** 몇 달을 위아래로 이어 보여 줄지 (기본 1) — 끝나는 날이 다음 달이면 2로, 넘겨 보지 않아도 끝이 보여요 */
  months?: number;
};

/**
 * 새 일정 · 연기 날짜 고르기 달력: min ~ max 만 고를 수 있어요 (그 밖 · 지난 날은 흐리게).
 * 모양은 이벤트 달력(event/form-parts MonthCalendar · .lg-mcal)과 같아요 — 고를 수 있는 날은 베이지 칸 · 일 빨강 · 토 파랑 · 숫자는 display 글꼴 · 고른 날은 보라 + 잉크 그림자.
 */
export function ChangeCalendar({ mon, minMon, maxMon, min, max, start, end, onMonth, onPick, months = 1, allow, endLabel = '끝', hint }: Props) {
  const st = start ? new Date(start) : null;
  const now = new Date();
  const shown = Array.from({ length: Math.max(1, months) }, (_, i) => mon + i);
  const last = shown[shown.length - 1];

  return (
    <View style={styles.cal}>
      {shown.map((mi, k) => {
        const first = new Date(2026, mi, 1);
        const y = first.getFullYear();
        const m = first.getMonth();
        const days = new Date(y, m + 1, 0).getDate();
        const cells: (Date | null)[] = [...Array.from({ length: first.getDay() }, () => null), ...Array.from({ length: days }, (_, i) => new Date(y, m, i + 1))];
        return (
          <View key={mi} style={k > 0 ? styles.next : undefined}>
            {/* 이어 보이는 달은 위 달 머리줄의 ‹ › 로 같이 넘어가요 (앞은 첫 달에 · 뒤는 마지막 달에) */}
            <View style={styles.mh}>
              {k === 0 ? <MonBtn label="‹" a11y="이전 달" disabled={mon <= minMon} onPress={() => onMonth(-1)} /> : <View style={styles.mbGap} />}
              <PText style={styles.mt} accessibilityRole="header">{`${y}년 ${m + 1}월`}</PText>
              {mi === last ? <MonBtn label="›" a11y="다음 달" disabled={last >= maxMon} onPress={() => onMonth(1)} /> : <View style={styles.mbGap} />}
            </View>
            {k === 0 ? (
              <View style={styles.wk}>
                {DOW.map((w, i) => (
                  <PText key={w} style={[styles.w, i === 0 && styles.sun, i === 6 && styles.sat]}>
                    {w}
                  </PText>
                ))}
              </View>
            ) : null}
            <View style={styles.gd}>
              {cells.map((d, i) => {
                if (!d) return <View key={`e${i}`} style={styles.cell} />;
                const off = d < min || d > max || (!!allow && !allow(d));
                const on = !!st && d.getTime() === st.getTime();
                const isEnd = !!end && d.getTime() === end.getTime();
                const inR = !!end && !!st && d > st && d <= end;
                const today = isSameDay(d, now);
                const wd = d.getDay();
                const picked = on || isEnd;
                return (
                  <View key={d.getTime()} style={styles.cell}>
                    <Pressable
                      disabled={off}
                      onPress={() => {
                        sfx('tap');
                        onPick(d.getTime());
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`${m + 1}월 ${d.getDate()}일${today ? ' · 오늘' : ''}${on ? ' · 시작' : isEnd ? ` · ${endLabel}` : ''}`}
                      accessibilityState={{ disabled: off, selected: on || isEnd }}
                      style={[styles.dd, off && styles.ddOff, today && todayMark.cell, inR && styles.in, picked && styles.on]}>
                      <PText
                        style={[styles.ddText, !off && wd === 0 && styles.sun, !off && wd === 6 && styles.sat, off && styles.ddTextOff, today && todayMark.text, picked && styles.onText]}>
                        {d.getDate()}
                      </PText>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}
      {hint ? <PText style={styles.hint}>{hint}</PText> : null}
    </View>
  );
}

function MonBtn({ label, a11y, disabled, onPress }: { label: string; a11y: string; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        sfx('tap');
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      accessibilityState={{ disabled }}
      hitSlop={4}
      style={[styles.mb, disabled && styles.mbOff]}>
      <PText style={styles.mbText}>{label}</PText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cal: { borderWidth: 2, borderColor: Colors.ink, borderRadius: 18, backgroundColor: Colors.white, paddingTop: 12, paddingHorizontal: 10, paddingBottom: 10 },
  mh: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, paddingBottom: 8 },
  mt: { fontFamily: Font.body900, fontSize: 15, lineHeight: 21 },
  mb: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: Colors.line, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  mbOff: { opacity: 0.3 },
  mbGap: { width: 36, height: 36 },
  next: { marginTop: 10, paddingTop: 10, borderTopWidth: 1.5, borderColor: Colors.line },
  mbText: { fontFamily: Font.body900, fontSize: 18, lineHeight: 22 },
  wk: { flexDirection: 'row' },
  w: { flex: 1, textAlign: 'center', fontFamily: Font.body800, fontSize: 11.5, lineHeight: 16, color: Colors.inkSub, paddingBottom: 4 },
  sun: { color: '#D2477A' },
  sat: { color: '#2F6FD0' },
  gd: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 4 },
  // 7칸이 꼭 한 줄에 들어가게 조금 덜 (시트 안처럼 폭이 소수점이면 반올림으로 7번째 칸이 다음 줄로 밀려요)
  cell: { width: '14.28%', paddingHorizontal: 2 },
  dd: { height: 46, borderRadius: 14, backgroundColor: '#F6F1E6', alignItems: 'center', justifyContent: 'center' },
  ddOff: { backgroundColor: 'transparent' },
  // 쉬는 기간 (시작 ~ 복귀 사이)
  in: { backgroundColor: '#E7E0F6' },
  on: { backgroundColor: Colors.purple, transform: [{ translateY: -1 }], boxShadow: '2px 2px 0px #1E1A2B' },
  ddText: { fontFamily: Font.display, fontSize: 15, lineHeight: 17, color: Colors.ink },
  ddTextOff: { color: '#CFC8BA' },
  onText: { color: Colors.white },
  hint: { marginTop: 8, paddingHorizontal: 4, fontFamily: Font.body900, fontSize: 13, lineHeight: 19, color: Colors.purple },
});
