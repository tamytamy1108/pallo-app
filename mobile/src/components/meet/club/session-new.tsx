import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { FieldLabel, SheetButton, SheetDesc } from '@/components/common/sheet-parts';
import { defaultEnd, MonthCalendar, TimeRange } from '@/components/event/form-parts';
import { CountPicker } from '@/components/ui/count-picker';
import { TextField } from '@/components/ui/field';
import { Sheet } from '@/components/ui/sheet';
import { showToast } from '@/components/ui/toast';
import { JumpField, useFieldJump } from '@/components/ui/field-jump';
import { SESSION_THEME, WEEK, type Club } from '@/data/meet';
import { haptic, sfx } from '@/lib/feedback';

import { addSched } from '../meet-store';
import { clubSpot } from '../model';

/** 달력으로 고를 수 있는 범위 (오늘부터 며칠 뒤까지) */
const MAX_DAYS = 90;
const CAP_MIN = 2;
const CAP_MAX = 50;

/** 모이는 요일 중 오늘 이후 첫 날 'YYYY-MM-DD' (요일이 없으면 오늘) */
function nextMeetDay(c: Club) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  for (let k = 0; k < 7 && c.days.length && !c.days.includes(d.getDay()); k++) d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * 정기 모임 일정 만들기 (호스트 · 코호스트): 날짜(달력) · 시간 · 주제 · 인원 · 장소 · 한마디.
 * 올리면 동아리 홈 '일정'에 날짜순으로 보이고, 멤버는 회차마다 참석할 수 있어요. 멤버 모두에게 알림 (A34).
 * 시간 · 인원 · 장소는 동아리에 적은 값으로 미리 채워 둬요.
 */
export function SessionNewSheet({ c, open, onClose }: { c: Club; open: boolean; onClose: () => void }) {
  const t0 = c.time?.[0] ?? (c.when.match(/\d{1,2}:\d{2}/) || ['20:00'])[0];
  const [date, setDate] = useState(() => nextMeetDay(c));
  const [time, setTime] = useState(t0);
  const [end, setEnd] = useState(c.time?.[1] ?? defaultEnd(t0));
  const [title, setTitle] = useState('');
  const [cap, setCap] = useState(Math.min(c.max || 8, CAP_MAX));
  const [place, setPlace] = useState(() => clubSpot(c)[0]);
  const [memo, setMemo] = useState('');
  const ex = (SESSION_THEME[c.cc] || SESSION_THEME.study)[0];

  const reset = () => {
    setDate(nextMeetDay(c));
    setTime(t0);
    setEnd(c.time?.[1] ?? defaultEnd(t0));
    setTitle('');
    setMemo('');
  };
  // 빠진 칸이 있으면 그 칸으로 데려가요
  const jump = useFieldJump();
  const save = () => {
    if (!date) return jump.to('date', '날짜를 골라 주세요');
    if (!title.trim()) return jump.to('title', '이번 모임 주제를 적어 주세요');
    addSched(c.id, { id: `${c.id}@s${Date.now()}`, date, time, end, title: title.trim(), cap, place: place.trim() || undefined, memo: memo.trim() || undefined, at: Date.now() });
    sfx('save');
    haptic('success');
    onClose();
    const d = new Date(date + 'T00:00');
    showToast(`${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEK[d.getDay()]}) 일정을 올렸어요 · 멤버 모두에게 알렸어요`);
  };

  return (
    <Sheet open={open} onClose={onClose} onClosed={reset} title="일정 만들기" label="정기 모임 일정 만들기" tall footer={<SheetButton label="일정 올리기" size="foot" onPress={save} />}>
      <SheetDesc>올리면 동아리 홈 일정에 보이고, 멤버 모두에게 알림이 가요. 멤버는 회차마다 참석을 눌러요.</SheetDesc>
      <JumpField name="date" jump={jump} style={styles.f}>
        <FieldLabel>날짜 *</FieldLabel>
        <MonthCalendar value={date} onChange={setDate} minDays={0} maxDays={MAX_DAYS} hint="오늘부터 3달 안에서 골라요" pick={(d) => `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEK[d.getDay()]})`} />
      </JumpField>
      <View style={styles.f}>
        <FieldLabel>시간 *</FieldLabel>
        <TimeRange
          start={time}
          end={end}
          onChange={(s, e) => {
            setTime(s);
            setEnd(e);
          }}
        />
      </View>
      <JumpField name="title" jump={jump}>
        <TextField label="이번 모임 주제 *" value={title} onChangeText={setTitle} placeholder={`예) ${ex}`} maxLength={30} />
      </JumpField>
      <View style={styles.f}>
        <FieldLabel>최대 인원 · 나 포함 *</FieldLabel>
        <CountPicker value={cap} presets={[6, 8, 10, 12]} min={CAP_MIN} max={CAP_MAX} typable onChange={setCap} />
      </View>
      <TextField label="장소" value={place} onChangeText={setPlace} placeholder="예) 하남점 라운지 · 온라인" maxLength={40} />
      <TextField label="한마디 · 선택" multiline value={memo} onChangeText={setMemo} placeholder="예) 이번엔 2장까지 읽어 와요." maxLength={200} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  f: { gap: 6 },
});
