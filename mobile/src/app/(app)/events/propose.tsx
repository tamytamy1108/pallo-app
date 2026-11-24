import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { GrowInput } from '@/components/ui/grow-input';
import { Pressable } from '@/components/ui/pressable';
import { SheetButton, SheetOptions, SheetPills } from '@/components/common/sheet-parts';
import { MonthCalendar, PlacePicker, PosterPicker, type Place } from '@/components/event/form-parts';
import { CardMaker } from '@/components/ui/card-maker';
import { missingWords, usedCard, type MadeCard } from '@/data/poster-colors';
import { SheetPage } from '@/components/event/sheet-page';
import { Icon } from '@/components/meet/icons';
import { addProposal } from '@/components/meet/meet-store';
import { ProposalCard } from '@/components/event/proposal-cards';
import { TextField } from '@/components/ui/field';
import { CountPicker } from '@/components/ui/count-picker';
import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { BRANCH_REGIONS, BRANCHES, PROPOSAL_CATS } from '@/data/events';
import { NO_LIMIT, WEEK } from '@/data/meet';
import { sfx } from '@/lib/feedback';
import { useMe } from '@/state/me';

const CAP_MIN = 2;
const CAP_MAX = 300;
const FEES = ['무료', '유료 (금액은 매니저와 정해요)'];

/**
 * 이벤트 제안 (docs/pages/06-event.md '이벤트 제안 (회원)' — 프로토타입 lgPropEvent).
 * 사진(1장 이상) · 진행 지점 · 장소(지도) · 상세 주소 · 희망 날짜(1주 뒤 ~ 3달 안) · 카테고리 · 제목 · 소개 · 예상 인원 · 참가비 → [제안 보내기].
 * 보내면 이벤트 탭 맨 위 '내가 제안한 이벤트' 카드. 비회원은 이벤트 탭의 [오픈하기]에서 체험 안내로 막혀요.
 * 맞는 API: 92 `/event-proposals` (+ 사진 `/uploads/images`)
 */
export default function ProposeEvent() {
  const me = useMe();
  const [pics, setPics] = useState<string[]>([]);
  // 카드: 사진이 없으면 꼭 (안 만지면 기본 색 · 기본 글자) · 사진이 있으면 선택
  const [card, setCard] = useState<MadeCard | null>(null);
  const [br, setBr] = useState(BRANCHES.some((b) => b[0] === me.branch) ? me.branch : BRANCHES[0][0]);
  const [brOpen, setBrOpen] = useState(false);
  const [place, setPlace] = useState<Place | null>(null);
  const [addr, setAddr] = useState('');
  const [date, setDate] = useState('');
  const [cat, setCat] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  // 예상 인원: 숫자 (알약 · −/+ · 직접 적기) 또는 null(무관 — 0 으로 보내요)
  const [cap, setCap] = useState<number | null>(20);
  const [fee, setFee] = useState('무료');
  const region = (BRANCHES.find((b) => b[0] === br) || BRANCHES[0])[2];

  const send = () => {
    if (!date) return showToast('희망 날짜를 골라 주세요');
    if (!cat) return showToast('카테고리를 골라 주세요');
    if (!title.trim()) return showToast('제목을 적어 주세요');
    if (!body.trim()) return showToast('어떤 이벤트인지 적어 주세요');
    if (missingWords(usedCard(card, pics.length > 0))) return showToast('카드 문구를 적어 주세요');
    addProposal({ id: 'pr' + Date.now(), title: title.trim(), br, date, cat, cover: pics[0], card: usedCard(card, pics.length > 0), cap: cap ?? NO_LIMIT, body: body.trim() });
    sfx('save');
    router.back();
    showToast('제안을 보냈어요 · 매니저가 2~3일 안에 연락드려요');
  };

  return (
    <SheetPage title="이벤트 제안하기" label="이벤트 제안하기" footer={<SheetButton label="제안 보내기" size="foot" onPress={send} />}>
      <View style={styles.note}>
        <View style={{ marginTop: 2 }}>
          <Icon name="flag" size={18} color={Colors.purple} strokeWidth={2.6} />
        </View>
        <PText style={styles.noteT}>
          열고 싶은 이벤트가 있다면 알려 주세요. 지점 매니저가 확인하고 <PText style={styles.noteB}>2~3일 안에 문자로</PText> 연락드려요. 확정되면 이벤트 탭에 올라가요.
        </PText>
      </View>
      <Field label="대표 이미지 · 사진 여러 장 또는 카드" hint={pics.length ? (card ? '카드가 대표예요. 사진은 그 뒤에 보여요.' : '첫 장이 대표 사진이 돼요. 사진을 누르면 대표로 바꿔요.') : '사진이 없으면 아래 카드가 대표예요.'}>
        <PosterPicker uris={pics} onChange={setPics} coverTaken={!!usedCard(card, pics.length > 0)} />
        <CardMaker
          value={card}
          onChange={setCard}
          hasPhoto={pics.length > 0}
          example={['NEW', 'EVENT']}
          square
          listPreview={{
            label: "이벤트 탭 '내가 제안한 이벤트'에 이렇게 보여요 · 누르기 전 모습",
            render: (c) => (
              <View pointerEvents="none">
                <ProposalCard q={{ id: 'preview', title: title.trim() || '이벤트 제목', br, date, cat: cat ?? '분류 고르기 전', cover: pics[0], card: card || !pics.length ? c : undefined }} />
              </View>
            ),
          }}
        />
      </Field>
      <Field label="진행 지점" req>
        <Pressable onPress={() => setBrOpen(true)} accessibilityRole="button" accessibilityLabel={`진행 지점 ${br}`} style={styles.sel}>
          <PText style={styles.selT}>{br}</PText>
          <View style={{ transform: [{ rotate: '-90deg' }] }}>
            <Icon name="back" size={16} />
          </View>
        </Pressable>
      </Field>
      <Field label="장소 · 지도에서 골라요">
        <PlacePicker region={region} value={place} onChange={setPlace} />
      </Field>
      <TextField label="상세 주소 · 직접 적어요 (선택)" value={addr} onChangeText={setAddr} placeholder="예) 3층 세미나실 · 입구에서 오른쪽" />
      <Field label="희망 날짜" req hint="희망 날짜는 매니저와 이야기하며 바뀔 수 있어요.">
        <MonthCalendar value={date} onChange={setDate} minDays={7} maxDays={90} hint="1주 뒤부터 3달 안에서 골라요" pick={(d) => `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEK[d.getDay()]}) 희망`} />
      </Field>
      <Field label="카테고리" req>
        <SheetPills options={PROPOSAL_CATS} value={cat} onChange={setCat} label="카테고리" />
      </Field>
      <TextField label="이벤트 제목 *" value={title} onChangeText={setTitle} placeholder="예) 한강 영어 피크닉" />
      <Field label="어떤 이벤트인가요?" req>
        <GrowInput value={body} onChangeText={setBody} multiline maxLength={500} placeholder="예) 돗자리 펴고 영어로 수다 떠는 피크닉이에요. 도시락은 각자, 게임은 제가 준비할게요." placeholderTextColor="#8C8597" style={styles.ta} accessibilityLabel="어떤 이벤트인가요?" />
      </Field>
      <Field label="예상 인원 · 나 포함" req>
        <CountPicker value={cap} presets={[10, 20, 30, 40]} min={CAP_MIN} max={CAP_MAX} typable anyLabel="무관" onChange={setCap} />
      </Field>
      <Field label="참가비">
        <SheetPills options={FEES} value={fee} onChange={setFee} label="참가비" />
      </Field>

      <Sheet open={brOpen} onClose={() => setBrOpen(false)} title="진행 지점" tall>
        {BRANCH_REGIONS.map((r) => (
          <View key={r} style={{ gap: 6 }}>
            <PText style={styles.lb}>{r}</PText>
            <SheetOptions
              radio
              selected={br}
              items={BRANCHES.filter((b) => b[2] === r).map((b) => ({ key: b[0], label: b[0] }))}
              onPick={(k) => {
                setBr(k);
                setPlace(null);
                setBrOpen(false);
              }}
            />
          </View>
        ))}
      </Sheet>
    </SheetPage>
  );
}

/** 칸 이름표 (.lg-fl .lb + 빨간 * · 아래 작은 안내 .sv-hint) */
function Field({ label, req, hint, children }: { label: string; req?: boolean; hint?: string; children: ReactNode }) {
  return (
    <View style={styles.fl}>
      <PText style={styles.lb}>
        {label}
        {req ? <PText style={styles.req}> *</PText> : null}
      </PText>
      {children}
      {hint ? <PText style={styles.hint}>{hint}</PText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16, backgroundColor: '#F3EEFB' },
  noteT: { flex: 1, fontFamily: Font.body700, fontSize: 13.5, lineHeight: 20.9 },
  noteB: { fontFamily: Font.body900, fontSize: 13.5, color: Colors.purple },
  fl: { gap: 6 },
  lb: { fontFamily: Font.body900, fontSize: 12.5, lineHeight: 19 },
  req: { fontFamily: Font.body900, fontSize: 12.5, color: '#E5484D' },
  hint: { fontFamily: Font.body700, fontSize: 12, lineHeight: 18, color: Colors.inkSub },
  sel: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 48, paddingHorizontal: 16, borderWidth: 2, borderColor: Colors.ink, borderRadius: 14, backgroundColor: Colors.white },
  selT: { fontFamily: Font.body800, fontSize: 15, lineHeight: 20 },
  ta: { minHeight: 110, borderRadius: 18, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12, fontFamily: Font.body600, fontSize: 14, lineHeight: 22.4, color: Colors.ink, textAlignVertical: 'top' },
});
