import { router } from 'expo-router';
import { useRef, useState, type ReactNode } from 'react';
import { View, type ViewInstance } from 'react-native';

import { SheetButton, SheetDesc, SheetPills } from '@/components/common/sheet-parts';
import { defaultEnd, MultiPills, PosterPicker, TimeRange } from '@/components/event/form-parts';
import { ClubRow } from '@/components/meet/club-list';
import { PosterPreview } from '@/components/meet/poster';
import { CardMaker } from '@/components/ui/card-maker';
import { missingWords, usedCard, type MadeCard } from '@/data/poster-colors';
import { SheetPage } from '@/components/event/sheet-page';
import { addMyClub } from '@/components/meet/meet-store';
import { TextField } from '@/components/ui/field';
import { CountPicker } from '@/components/ui/count-picker';
import { useRevealOnFocus } from '@/components/ui/reveal-on-focus';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { ALL_REGIONS, branchOnly, CLUB_CATS, CLUB_MEMBERS, NO_LIMIT, REGIONS, type Club, type Region } from '@/data/meet';
import { sfx } from '@/lib/feedback';
import { useMe } from '@/state/me';

/** '언어 무관' 은 혼자만 골라져요 (고르면 다른 언어가 풀리고, 다른 언어를 고르면 '언어 무관' 이 풀려요) */
const ANY_LANG = '언어 무관';
const LANGS = ['영어', '일본어', '중국어', '스페인어', '한국어', ANY_LANG];
const DAYS = ['월', '화', '수', '목', '금', '토', '일'];
const MAX_MIN = 3;
const MAX_MAX = 40;

/** 새로 고른 언어 목록 → '무관' 은 혼자만 */
const pickLangs = (prev: string[], next: string[]) => {
  const added = next.find((l) => !prev.includes(l));
  if (added === ANY_LANG) return [ANY_LANG];
  if (added) return next.filter((l) => l !== ANY_LANG);
  return next;
};

/**
 * 동아리 만들기 (docs/pages/04-lounge.md '동아리 만들기' — 프로토타입 lgMkClub).
 * 이름 · 소개 · 카테고리 · 언어(여러 개 · 무관) · 지역 · 요일(여러 개) · 시간(몇 시부터 몇 시까지) · 최대 인원(무관 가능) · 가입 조건 · 채팅방 공지 · 포스터 → [승인 요청하기].
 * 올리면 매니저 승인 대기 (목록에 NEW · 가입 버튼은 '승인 대기'). 맞는 API: 63 POST `/clubs` (+ `/uploads/images`)
 */
export default function NewClub() {
  const me = useMe();
  const [name, setName] = useState('');
  const [intro, setIntro] = useState('');
  const [cat, setCat] = useState<string>(CLUB_CATS[0][1]);
  const [langs, setLangs] = useState<string[]>(['영어']);
  const [reg, setReg] = useState<Region | typeof ALL_REGIONS>('서울');
  // 모이는 시간: 시작 ~ 끝
  const [time, setTime] = useState('20:00');
  const [end, setEnd] = useState(() => defaultEnd('20:00'));
  const [max, setMax] = useState<number | null>(12);
  const [days, setDays] = useState<string[]>(['수']);
  // 가입 조건: 멤버만 · (내 지점) 멤버만
  const conds = [CLUB_MEMBERS, branchOnly(me.branch)];
  const [cond, setCond] = useState<string>(CLUB_MEMBERS);
  const [memo, setMemo] = useState('');
  const [pics, setPics] = useState<string[]>([]);
  // 카드: 포스터 사진이 없으면 꼭 (안 만지면 기본 색 · 기본 글자) · 사진이 있으면 선택. 카드가 있으면 대표, 사진은 그 뒤에
  const [card, setCard] = useState<MadeCard | null>(null);
  // 글 칸을 누르면 키보드 위로 보이게 (ui/reveal-on-focus)
  const reveal = useRevealOnFocus();
  const nameBox = useRef<ViewInstance>(null);
  const introBox = useRef<ViewInstance>(null);
  const memoBox = useRef<ViewInstance>(null);


  // 올릴 모양 (목록 미리보기도 같이 써요)
  const draft = (): Club => ({
    id: 'u' + Date.now(),
    cc: (CLUB_CATS.find((c) => c[1] === cat) || CLUB_CATS[0])[0],
    reg,
    name: name.trim(),
    lang: langs.includes(ANY_LANG) ? ANY_LANG : [...langs].sort((a, b) => LANGS.indexOf(a) - LANGS.indexOf(b)).join(' · '),
    langs,
    br: me.branch,
    // 예) 매주 수 · 금 20:00 (요일을 안 고르면 시간만)
    when: days.length ? `매주 ${[...days].sort((a, b) => DAYS.indexOf(a) - DAYS.indexOf(b)).join(' · ')} ${time}~${end}` : `${time}~${end}`,
    time: [time, end],
    n: 1,
    max: max ?? NO_LIMIT,
    cond,
    host: me.name,
    days: days.map((d) => '일월화수목금토'.indexOf(d)),
    wait: true,
    mine: true,
    intro: intro.trim() || undefined,
    memo: memo.trim() || undefined,
    posters: pics.length ? pics : undefined,
    card: usedCard(card, pics.length > 0),
  });

  const ask = () => {
    if (!name.trim()) return showToast('동아리 이름을 적어 주세요');
    if (!langs.length) return showToast('언어를 골라 주세요');
    if (!days.length) return showToast('모이는 요일을 골라 주세요');
    if (missingWords(usedCard(card, pics.length > 0))) return showToast('카드 문구를 적어 주세요');
    addMyClub(draft());
    sfx('save');
    router.back();
    showToast('승인을 요청했어요 · 매니저가 확인하면 알려 드려요');
  };

  return (
    <SheetPage title="동아리 만들기" label="동아리 만들기" footer={<SheetButton label="승인 요청하기" size="foot" onPress={ask} />}>
      <SheetDesc>지점 매니저가 승인하면 지도에 보이고 가입을 받을 수 있어요.</SheetDesc>
      <View ref={nameBox} collapsable={false}>
        <TextField label="동아리 이름 *" value={name} onChangeText={setName} onFocus={() => reveal(nameBox.current)} placeholder="예) 미드 쉐도잉 모임" />
      </View>
      <View ref={introBox} collapsable={false}>
        <TextField
          label="동아리 소개 · 선택"
          multiline
          value={intro}
          onChangeText={setIntro}
          onFocus={() => reveal(introBox.current)}
          maxLength={500}
          placeholder="예) 매주 미드 한 장면을 같이 따라 말해요. 처음이어도 괜찮아요."
        />
      </View>
      <Field label="어떤 동아리인가요?" req>
        <SheetPills options={CLUB_CATS.map((c) => c[1])} value={cat} onChange={setCat} />
      </Field>
      <Field label="언어 · 여러 개 골라요" req>
        <MultiPills label="언어" options={LANGS} value={langs} onChange={(next) => setLangs(pickLangs(langs, next))} />
      </Field>
      <Field label="지역" req>
        <SheetPills options={[ALL_REGIONS, ...REGIONS.map(([r]) => r)]} value={reg} onChange={setReg} />
      </Field>
      <Field label="모이는 요일 · 여러 개 골라요" req>
        <MultiPills options={DAYS} value={days} onChange={setDays} />
      </Field>
      <Field label="몇 시부터 몇 시까지 모여요?" req>
        <TimeRange start={time} end={end} onChange={(s, e) => { setTime(s); setEnd(e); }} />
      </Field>
      <Field label="최대 인원 · 나 포함" req>
        <CountPicker value={max} presets={[6, 8, 10, 12]} min={MAX_MIN} max={MAX_MAX} typable anyLabel="무관" onChange={setMax} />
      </Field>
      <Field label="가입 조건" req>
        <SheetPills options={conds} value={cond} onChange={setCond} />
      </Field>
      <View ref={memoBox} collapsable={false}>
        {/* 여러 줄: Enter 는 줄 바꿈 (보내기 · 닫기 아님). 길어지면 칸이 늘고, 쓰는 줄은 키보드 위로 따라 내려가요 (GrowInput) */}
        <TextField
          label="채팅방 공지 (가입하면 보여요) · 선택"
          multiline
          submitBehavior="newline"
          value={memo}
          onChangeText={setMemo}
          onFocus={() => reveal(memoBox.current)}
          placeholder="예) 첫 모임은 자기소개만 해도 충분해요."
        />
      </View>
      <Field label="대표 이미지 · 사진 여러 장 또는 카드" req>
        <PosterPicker uris={pics} onChange={setPics} coverTaken={!!usedCard(card, pics.length > 0)} />
        <CardMaker
          value={card}
          onChange={setCard}
          hasPhoto={pics.length > 0}
          example={['NEW', 'CLUB']}
          renderPreview={(c, words, w) => <PosterPreview card={c} words={words} width={w} />}
          listPreview={{
            label: '라운지 동아리 목록에서는 이렇게 보여요 · 누르기 전 모습 (카드는 첫 줄만)',
            render: () => (
              <View pointerEvents="none">
                <ClubRow c={{ ...draft(), id: 'preview', mine: false, wait: false, name: name.trim() || '동아리 이름' }} first />
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
      <PText style={{ fontFamily: Font.body900, fontSize: 12.5, lineHeight: 19 }}>
        {label}
        {req ? <PText style={{ fontFamily: Font.body900, fontSize: 12.5, color: '#E5484D' }}> *</PText> : null}
      </PText>
      {children}
    </View>
  );
}

