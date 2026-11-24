import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { SheetButton, SheetDesc, SheetPills } from '@/components/common/sheet-parts';
import { CountStepper, MultiPills, PosterPicker, TimeChips } from '@/components/event/form-parts';
import { PosterPreview } from '@/components/meet/poster';
import { CardMaker } from '@/components/ui/card-maker';
import { usedCard, type MadeCard } from '@/data/poster-colors';
import { SheetPage } from '@/components/event/sheet-page';
import { addMyClub } from '@/components/meet/meet-store';
import { TextField } from '@/components/ui/field';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { CLUB_CATS, REGIONS, type Region } from '@/data/meet';
import { sfx } from '@/lib/feedback';
import { useMe } from '@/state/me';

const LANGS = ['영어', '일본어', '중국어', '스페인어'];
const DAYS = ['월', '화', '수', '목', '금', '토', '일'];
const CONDS = ['누구나', 'Lv.2 이상', '수강생만'];
/** 모이는 시간: 아침 7시 ~ 밤 10시 반, 30분 간격 */
const TIMES = Array.from({ length: 32 }, (_, i) => `${String(7 + Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`);
const MAX_MIN = 3;
const MAX_MAX = 40;

/**
 * 동아리 만들기 (docs/pages/04-lounge.md '동아리 만들기' — 프로토타입 lgMkClub).
 * 이름 · 카테고리 · 언어 · 지역 · 요일(여러 개) · 시간 · 최대 인원 · 가입 조건 · 채팅방 공지 · 포스터 → [승인 요청하기].
 * 올리면 매니저 승인 대기 (목록에 NEW · 가입 버튼은 '승인 대기'). 맞는 API: 63 POST `/clubs` (+ `/uploads/images`)
 */
export default function NewClub() {
  const me = useMe();
  const [name, setName] = useState('');
  const [cat, setCat] = useState<string>(CLUB_CATS[0][1]);
  const [lang, setLang] = useState('영어');
  const [reg, setReg] = useState<Region>('서울');
  const [time, setTime] = useState('20:00');
  const [max, setMax] = useState(12);
  const [days, setDays] = useState<string[]>(['수']);
  const [cond, setCond] = useState('누구나');
  const [memo, setMemo] = useState('');
  const [pics, setPics] = useState<string[]>([]);
  // 카드: 포스터 사진이 없으면 꼭 (안 만지면 기본 색 · 기본 글자) · 사진이 있으면 선택. 카드가 있으면 대표, 사진은 그 뒤에
  const [card, setCard] = useState<MadeCard | null>(null);

  const ask = () => {
    if (!name.trim()) return showToast('동아리 이름을 적어 주세요');
    addMyClub({
      id: 'u' + Date.now(),
      cc: (CLUB_CATS.find((c) => c[1] === cat) || CLUB_CATS[0])[0],
      reg,
      name: name.trim(),
      lang,
      br: me.branch,
      // 예) 매주 수 · 금 20:00 (요일을 안 고르면 시간만)
      when: days.length ? `매주 ${[...days].sort((a, b) => DAYS.indexOf(a) - DAYS.indexOf(b)).join(' · ')} ${time}` : time,
      n: 1,
      max,
      cond,
      host: me.name,
      days: days.map((d) => '일월화수목금토'.indexOf(d)),
      wait: true,
      mine: true,
      memo: memo.trim() || undefined,
      posters: pics.length ? pics : undefined,
      card: usedCard(card, pics.length > 0),
    });
    sfx('save');
    router.back();
    showToast('승인을 요청했어요 · 매니저가 확인하면 알려 드려요');
  };

  return (
    <SheetPage title="동아리 만들기" label="동아리 만들기" footer={<SheetButton label="승인 요청하기" size="foot" onPress={ask} />}>
      <SheetDesc>지점 매니저가 승인하면 지도에 보이고 가입을 받을 수 있어요.</SheetDesc>
      <TextField label="동아리 이름" value={name} onChangeText={setName} placeholder="예) 미드 쉐도잉 모임" />
      <Field label="어떤 동아리인가요?">
        <SheetPills options={CLUB_CATS.map((c) => c[1])} value={cat} onChange={setCat} />
      </Field>
      <Field label="언어">
        <SheetPills options={LANGS} value={lang} onChange={setLang} />
      </Field>
      <Field label="지역">
        <SheetPills options={REGIONS.map(([r]) => r)} value={reg} onChange={setReg} />
      </Field>
      <Field label="모이는 요일 · 여러 개 골라요">
        <MultiPills options={DAYS} value={days} onChange={setDays} />
      </Field>
      <Field label="몇 시에 모여요?">
        <TimeChips times={TIMES} value={time} onChange={setTime} />
      </Field>
      <Field label="최대 인원 · 나 포함">
        <CountStepper value={max} min={MAX_MIN} max={MAX_MAX} format={(v) => `${v}명`} onChange={setMax} less="한 명 줄이기" more="한 명 늘리기" />
      </Field>
      <Field label="가입 조건">
        <SheetPills options={CONDS} value={cond} onChange={setCond} />
      </Field>
      <TextField label="채팅방 공지 (가입하면 보여요)" value={memo} onChangeText={setMemo} placeholder="예) 첫 모임은 자기소개만 해도 충분해요." />
      <Field label="대표 이미지 · 사진 여러 장 또는 카드">
        <PosterPicker uris={pics} onChange={setPics} coverTaken={!!usedCard(card, pics.length > 0)} />
        <CardMaker
          value={card}
          onChange={setCard}
          hasPhoto={pics.length > 0}
          fallback={['NEW', 'CLUB']}
          renderPreview={(c, words, w) => <PosterPreview card={c} words={words} width={w} />}
        />
      </Field>
    </SheetPage>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <PText style={{ fontFamily: Font.body900, fontSize: 12.5, lineHeight: 19 }}>{label}</PText>
      {children}
    </View>
  );
}
