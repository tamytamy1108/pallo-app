import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Pressable } from '@/components/ui/pressable';
import { SheetButton, SheetDesc, SheetPills } from '@/components/common/sheet-parts';
import { defaultEnd, PlacePicker, PosterPicker, timeLabel, TimeRange, type Place } from '@/components/event/form-parts';
import { PosterPreview } from '@/components/meet/poster';
import { CardMaker } from '@/components/ui/card-maker';
import { fillWords, usedCard, type MadeCard } from '@/data/poster-colors';
import { SheetPage } from '@/components/event/sheet-page';
import { addMyMeet } from '@/components/meet/meet-store';
import { MeetCard } from '@/components/meet/meet-card';
import { TextField } from '@/components/ui/field';
import { CountPicker } from '@/components/ui/count-picker';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { JumpField, useFieldJump } from '@/components/ui/field-jump';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { C, MONTHS, NO_LIMIT, REGIONS, WEEK, type Meet, type Region } from '@/data/meet';
import { sfx } from '@/lib/feedback';
import { useMe } from '@/state/me';
import { seeAt } from '@/lib/see';

/** 카드 예시 글자 — 안 적으면 이대로 올라가요 */
const CARD_EX = ['NEW', 'MEET'];

const MEET_MAX = 7; // 오늘부터 1주 뒤까지 (프로토타입 MEET_MAX)
/** 정원 (나 포함) — 직접 정해요 */
const CAP_MIN = 2;
const CAP_MAX = 20;
const t0 = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
const addDays = (n: number) => {
  const d = t0();
  d.setDate(d.getDate() + n);
  return d;
};

/**
 * 번개 열기 (docs/pages/04-lounge.md '번개 열기 폼' — 프로토타입 lgMkMeet).
 * 지역 · 제목 · 날짜(오늘부터 1주 안 달력) · 시간 칩 · 확인 문장 · 장소(지도에서) · 상세 주소 · 정원 · 포스터 → [번개 열기 · 지도에 표시].
 * 올리면 지도 숫자 · 번개 줄에 바로 보여요. 맞는 API: 59 POST `/meetups` (+ `/uploads/images` · `/places?region=`)
 */
export default function NewMeet() {
  const me = useMe();
  const [reg, setReg] = useState<Region>('서울');
  const [title, setTitle] = useState('');
  const [day, setDay] = useState(3);
  // 만나는 시간: 시작 ~ 끝
  const [time, setTime] = useState('20:00');
  const [endTime, setEndTime] = useState(() => defaultEnd('20:00'));
  const [place, setPlace] = useState<Place | null>(null);
  const [addr2, setAddr2] = useState('');
  // 정원: 숫자 또는 null(무관 — 0 으로 저장)
  const [cap, setCap] = useState<number | null>(6);
  const [pics, setPics] = useState<string[]>([]);
  // 카드: 포스터 사진이 없으면 꼭 (안 만지면 기본 색 · 기본 글자) · 사진이 있으면 선택. 카드가 있으면 대표, 사진은 그 뒤에
  const [card, setCard] = useState<MadeCard | null>(null);
  const d = addDays(day);
  const when = `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEK[d.getDay()]}) ${timeLabel(time)} ~ ${timeLabel(endTime)}에 만나요 · ${day === 0 ? '오늘' : day === 1 ? '내일' : day + '일 뒤'}`;

  // 올릴 모양 (목록 미리보기도 같이 써요)
  const draft = (): Meet => ({
    id: 'u' + Date.now(),
    br: me.branch,
    reg,
    day: String(d.getDate()).padStart(2, '0'),
    mon: MONTHS[d.getMonth()],
    wd: `${WEEK[d.getDay()]} ${time}~${endTime}`,
    title: title.trim(),
    place: place?.name ?? '',
    addr: place?.addr,
    addr2: addr2.trim() || undefined,
    host: me.name,
    cur: 1,
    max: cap ?? NO_LIMIT,
    mine: true,
    posters: pics.length ? pics : undefined,
    card: fillWords(usedCard(card, pics.length > 0), CARD_EX),
  });

  // 빠진 칸이 있으면 그 칸으로 데려가요
  const jump = useFieldJump();
  const open = () => {
    if (!title.trim()) return jump.to('title', '제목을 적어 주세요');
    if (!place) return jump.to('place', '지도에서 장소를 골라 주세요');
    const made = draft();
    addMyMeet(made);
    sfx('save');
    router.back();
    showToast(`번개를 열었어요 · ${reg} 지도에 표시돼요`, seeAt({ pathname: '/meet/[id]', params: { id: made.id } }));
  };

  // 이번 주 일요일부터 마지막 날이 있는 주 토요일까지
  const start = t0();
  start.setDate(start.getDate() - start.getDay());
  const last = addDays(MEET_MAX);
  const end = new Date(last);
  end.setDate(end.getDate() + (6 - last.getDay()));
  const cells: Date[] = [];
  for (const x = new Date(start); x <= end; x.setDate(x.getDate() + 1)) cells.push(new Date(x));

  return (
    <SheetPage title="번개 열기" label="번개 열기" footer={<SheetButton label="번개 열기 · 지도에 표시" size="foot" onPress={open} />}>
      <SheetDesc>지도와 번개 목록에 바로 보여요. 오늘 배운 표현을 쓰는 자리면 더 좋아요.</SheetDesc>
      <Field label="지역" req>
        <SheetPills
          options={REGIONS.map(([r]) => r)}
          value={reg}
          onChange={(r) => {
            setReg(r);
            setPlace(null);
          }}
        />
      </Field>
      <JumpField name="title" jump={jump}>
        <TextField label="제목 *" value={title} onChangeText={setTitle} placeholder="예) 퇴근 후 영어 맥주 번개" />
      </JumpField>
      <Field label="날짜 · 오늘부터 1주 안에서 골라요" req>
        <View style={styles.cal}>
          <View style={styles.calH}>
            <PText style={styles.calB}>
              {t0().getMonth() + 1}월 {t0().getDate()}일 ~ {last.getMonth() + 1}월 {last.getDate()}일
            </PText>
            <PText style={styles.calS}>번개는 1주 뒤까지 열 수 있어요</PText>
          </View>
          <View style={styles.wk}>
            {[...WEEK].map((w, i) => (
              <PText key={w} style={[styles.wkT, i === 0 && styles.sun, i === 6 && styles.sat]}>
                {w}
              </PText>
            ))}
          </View>
          <View style={styles.gd}>
            {cells.map((x) => {
              const k = Math.round((x.getTime() - t0().getTime()) / 864e5);
              const ok = k >= 0 && k <= MEET_MAX;
              const on = k === day;
              const wd = x.getDay();
              const sub = k === 0 ? '오늘' : k === 1 ? '내일' : x.getDate() === 1 ? `${x.getMonth() + 1}월` : '';
              return (
                <View key={x.getTime()} style={styles.cell}>
                  <Pressable disabled={!ok} onPress={() => setDay(k)} accessibilityRole="button" accessibilityState={{ selected: on, disabled: !ok }} accessibilityLabel={`${x.getMonth() + 1}월 ${x.getDate()}일`} style={[styles.cd, !ok && styles.cdOff, on && styles.cdOn]}>
                    <PText style={[styles.cdB, ok && wd === 0 && styles.sun, ok && wd === 6 && styles.sat, !ok && { color: '#CFC8BA' }, on && { color: '#fff' }]}>{x.getDate()}</PText>
                    {ok && sub ? <PText style={[styles.cdS, on && { color: '#fff' }]}>{sub}</PText> : null}
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>
      </Field>
      <Field label="시간 · 시작 ~ 끝" req>
        <TimeRange start={time} end={endTime} onChange={(s, e) => { setTime(s); setEndTime(e); }} />
      </Field>
      <PText style={styles.when}>{when}</PText>
      <JumpField name="place" jump={jump}>
        <Field label="장소 · 지도에서 골라요" req>
          <PlacePicker region={reg} value={place} onChange={setPlace} />
        </Field>
      </JumpField>
      <TextField label="상세 주소 · 직접 적어요 (선택)" value={addr2} onChangeText={setAddr2} placeholder="예) 3층 창가 긴 테이블 · 입구에서 오른쪽" />
      <Field label="정원 · 나 포함" req>
        <CountPicker value={cap} presets={[4, 6, 8, 10]} min={CAP_MIN} max={CAP_MAX} typable anyLabel="무관" onChange={setCap} />
      </Field>
      <Field label="대표 이미지 · 사진 여러 장 또는 카드" req>
        <PosterPicker uris={pics} onChange={setPics} coverTaken={!!usedCard(card, pics.length > 0)} />
        <CardMaker
          value={card}
          onChange={setCard}
          hasPhoto={pics.length > 0}
          example={CARD_EX}
          renderPreview={(c, words, w) => <PosterPreview card={c} words={words} width={w} />}
          listPreview={{
            label: '라운지 번개 목록에서는 이렇게 보여요 · 누르기 전 모습',
            // 실제 번개 카드 그대로 (meet-card) · 폭 ≈ 274 (meet-tab cardW)
            render: (_c, _words, w) => (
              <View pointerEvents="none" style={{ paddingRight: 4, paddingBottom: 4 }}>
                <MeetCard m={{ ...draft(), id: 'preview', mine: false, title: title.trim() || '번개 제목', place: place?.name ?? '장소 고르기 전' }} width={Math.min(w - 4, 274)} />
              </View>
            ),
          }}
        />
      </Field>
    </SheetPage>
  );
}

/** 칸 이름 · req 면 빨간 * (꼭 정해요) */
function Field({ label, req, children }: { label: string; req?: boolean; children: ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <PText style={styles.lb}>
        {label}
        {req ? <PText style={styles.req}> *</PText> : null}
      </PText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  lb: { fontFamily: Font.body900, fontSize: 12.5, lineHeight: 19 },
  req: { fontFamily: Font.body900, fontSize: 12.5, color: '#E5484D' },
  cal: { borderWidth: 2, borderColor: Colors.ink, borderRadius: 18, backgroundColor: '#fff', paddingTop: 12, paddingHorizontal: 10, paddingBottom: 10 },
  calH: { gap: 1, paddingHorizontal: 4, paddingBottom: 8 },
  calB: { fontFamily: Font.body900, fontSize: 15, lineHeight: 21 },
  calS: { fontFamily: Font.body700, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  wk: { flexDirection: 'row' },
  wkT: { flex: 1, textAlign: 'center', fontFamily: Font.body800, fontSize: 11.5, lineHeight: 16, color: Colors.inkSub, paddingBottom: 4 },
  sun: { color: '#D2477A' },
  sat: { color: '#2F6FD0' },
  gd: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 4 },
  cell: { width: `${100 / 7}%`, paddingHorizontal: 2 },
  cd: { height: 46, borderRadius: 14, backgroundColor: '#F6F1E6', alignItems: 'center', justifyContent: 'center' },
  cdOff: { backgroundColor: 'transparent' },
  cdOn: { backgroundColor: C.pu, transform: [{ translateY: -1 }], boxShadow: '2px 2px 0px #1E1A2B' },
  cdB: { fontFamily: Font.display, fontSize: 15, lineHeight: 17 },
  cdS: { fontFamily: Font.body900, fontSize: 10, lineHeight: 11, color: C.pu },
  when: { marginTop: -2, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14, backgroundColor: '#F3EEFB', fontFamily: Font.body900, fontSize: 13.5, lineHeight: 19, color: C.pu },
});
