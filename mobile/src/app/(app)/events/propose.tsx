import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { GrowInput } from '@/components/ui/grow-input';
import { Pressable } from '@/components/ui/pressable';
import { SheetButton, SheetPills } from '@/components/common/sheet-parts';
import { defaultEnd, MonthCalendar, PlacePicker, PosterPicker, TimeRange, type Place } from '@/components/event/form-parts';
import { CardMaker } from '@/components/ui/card-maker';
import { fillWords, usedCard, type MadeCard } from '@/data/poster-colors';
import { SheetPage } from '@/components/event/sheet-page';
import { withJeom } from '@/components/onboarding/branch-list';
import { BranchSheet } from '@/components/onboarding/branch-sheet';
import { Icon } from '@/components/meet/icons';
import { ProposalCard } from '@/components/event/proposal-cards';
import { TextField } from '@/components/ui/field';
import { CountPicker } from '@/components/ui/count-picker';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { BRANCHES } from '@/data/events';
import { WEEK } from '@/data/meet';
import { apiErrorMessage } from '@/api/errors';
import type { BranchOption } from '@/api/onboarding';
import { useBranchOptions } from '@/api/use-onboarding';
import { useEventCategories, useSubmitEventProposal } from '@/api/use-event-proposals';
import { sfx } from '@/lib/feedback';
import { useMe } from '@/state/me';

/** 카드 예시 글자 — 안 적으면 이대로 올라가요 */
const CARD_EX = ['NEW', 'EVENT'];

const CAP_MIN = 2;
const CAP_MAX = 300;
const FEES = ['무료', '유료'];
/** 1인 참가비 상한 (원) */
const FEE_MAX = 1000000;

/**
 * 이벤트 제안 (docs/pages/06-event.md '이벤트 제안 (회원)' — 프로토타입 lgPropEvent).
 * 사진(1장 이상) · 진행 지점 · 장소(지도) · 상세 주소 · 희망 날짜(1주 뒤 ~ 3달 안) · 카테고리 · 제목 · 소개 · 예상 인원 · 참가비 → [제안 보내기].
 * 보내면 이벤트 탭 맨 위 '내가 제안한 이벤트' 카드. 비회원은 이벤트 탭의 [오픈하기]에서 체험 안내로 막혀요.
 * 서버: 사진을 `/uploads/images/event-photo` 로 한 장씩 올린 뒤 `POST /event-proposals` (api/use-event-proposals).
 * 진행 지점은 서버 지점 목록(GET /branches — 쉬는 지점은 막혀요), 카테고리는 서버 '이벤트 분류' 선택지예요.
 */
export default function ProposeEvent() {
  const me = useMe();
  const [pics, setPics] = useState<string[]>([]);
  // 카드: 사진이 없으면 꼭 (안 만지면 기본 색 · 기본 글자) · 사진이 있으면 선택
  const [card, setCard] = useState<MadeCard | null>(null);
  // 진행 지점: 고르기 전에는 내 지점(서버 지점 목록에서 이름이 같은 곳)
  const branches = useBranchOptions();
  const [picked, setPicked] = useState<BranchOption | null>(null);
  const branch = picked ?? branches.data?.rows.find((b) => withJeom(b.name) === withJeom(me.branch) && b.status === 'ACTIVE') ?? null;
  const br = branch?.name ?? '';
  const [brOpen, setBrOpen] = useState(false);
  const categories = useEventCategories();
  const catLabels = (categories.data ?? []).map((c) => c.label);
  const submit = useSubmitEventProposal();
  const [place, setPlace] = useState<Place | null>(null);
  const [addr, setAddr] = useState('');
  const [date, setDate] = useState('');
  // 희망 시간: 시작 ~ 끝 (끝은 시작 30분 뒤부터 · 밤 12:00 까지)
  const [time, setTime] = useState('19:00');
  const [endTime, setEndTime] = useState(() => defaultEnd('19:00'));
  const [cat, setCat] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  // 예상 인원: 숫자 (알약 · −/+ · 직접 적기) 또는 null(무관 — 0 으로 보내요)
  const [cap, setCap] = useState<number | null>(20);
  // 참가비는 꼭 골라요 (처음엔 비어 있어요)
  const [fee, setFee] = useState<string | null>(null);
  // 유료면 1인 금액을 직접 적어요 (숫자만 · 쉼표는 보여 줄 때만)
  const [price, setPrice] = useState('');
  const priceN = Number(price) || 0;
  // 지도 권역 — 서버 지점의 지역, 없으면 앱 지점 목록에서 이름으로
  const region = branch?.region ?? (BRANCHES.find((b) => withJeom(b[0]) === withJeom(br)) || BRANCHES[0])[2];

  const send = () => {
    if (submit.isPending) return;
    // 화면 위에서부터 (진행 지점 → 날짜 → 카테고리 → 제목 → 소개) 첫 빈칸을 알려요
    if (!branch) return showToast('진행 지점을 골라 주세요');
    if (!date) return showToast('희망 날짜를 골라 주세요');
    if (!cat) return showToast('카테고리를 골라 주세요');
    if (!title.trim()) return showToast('제목을 적어 주세요');
    if (!body.trim()) return showToast('어떤 이벤트인지 적어 주세요');
    if (!fee) return showToast('참가비를 골라 주세요');
    if (fee === '유료' && !priceN) return showToast('참가비 금액을 적어 주세요');
    const categoryCode = categories.data?.find((c) => c.label === cat)?.code;
    if (!categoryCode) return showToast('카테고리를 다시 골라 주세요');
    const made = fillWords(usedCard(card, pics.length > 0), CARD_EX);
    submit.mutate(
      {
        body: {
          branchCode: branch.code,
          categoryCode,
          title: title.trim(),
          description: body.trim(),
          date,
          startTime: time,
          endTime,
          placeName: place?.name ?? null,
          placeAddress: place?.addr ?? null,
          addressDetail: addr.trim() || null,
          expectedAttendees: cap,
          fee: fee === '유료' ? priceN : 0,
          card: made ? { color: made.color, words: made.words, design: made.design ?? null } : null,
        },
        photoUris: pics,
        branchName: branch.name,
      },
      {
        onSuccess: () => {
          sfx('save');
          router.back();
          showToast('제안을 보냈어요 · 매니저가 2~3일 안에 연락드려요');
        },
        onError: (e) => showToast(apiErrorMessage(e)),
      },
    );
  };

  return (
    <SheetPage title="이벤트 제안하기" label="이벤트 제안하기" footer={<SheetButton label={submit.isPending ? '보내는 중…' : '제안 보내기'} size="foot" disabled={submit.isPending} onPress={send} />}>
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
          example={CARD_EX}
          square
          listPreview={{
            label: "이벤트 탭 '내가 제안한 이벤트'에 이렇게 보여요 · 누르기 전 모습",
            render: (c) => (
              <View pointerEvents="none">
                <ProposalCard q={{ id: 'preview', title: title.trim() || '이벤트 제목', br, date, time: [time, endTime], cat: cat ?? '분류 고르기 전', cover: pics[0], card: card || !pics.length ? c : undefined }} />
              </View>
            ),
          }}
        />
      </Field>
      <Field label="진행 지점" req>
        <Pressable onPress={() => setBrOpen(true)} accessibilityRole="button" accessibilityLabel={`진행 지점 ${br || '고르기 전'}`} style={styles.sel}>
          <PText style={[styles.selT, !br && styles.selEmpty]}>{br ? withJeom(br) : '지점을 골라 주세요'}</PText>
          <View style={{ transform: [{ rotate: '-90deg' }] }}>
            <Icon name="back" size={16} />
          </View>
        </Pressable>
      </Field>
      <Field label="장소 · 지도에서 골라요">
        <PlacePicker region={region} value={place} onChange={setPlace} />
      </Field>
      <TextField label="상세 주소 · 직접 적어요 (선택)" value={addr} onChangeText={setAddr} placeholder="예) 3층 세미나실 · 입구에서 오른쪽" />
      <Field label="희망 날짜" req>
        <MonthCalendar value={date} onChange={setDate} minDays={7} maxDays={90} hint="1주 뒤부터 3달 안에서 골라요" pick={(d) => `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEK[d.getDay()]}) 희망`} />
      </Field>
      <Field label="희망 시간 · 시작 ~ 끝" req hint="희망 날짜 · 시간은 매니저와 이야기하며 바뀔 수 있어요.">
        <TimeRange
          start={time}
          end={endTime}
          onChange={(s, e) => {
            setTime(s);
            setEndTime(e);
          }}
        />
      </Field>
      <Field label="카테고리" req>
        {categories.isError ? (
          <Pressable onPress={() => categories.refetch()} accessibilityRole="button" style={styles.sel}>
            <PText style={styles.selEmpty}>카테고리를 불러오지 못했어요 · 다시 불러오기</PText>
          </Pressable>
        ) : (
          <SheetPills options={catLabels} value={cat} onChange={setCat} label="카테고리" />
        )}
      </Field>
      <TextField label="이벤트 제목 *" value={title} onChangeText={setTitle} placeholder="예) 한강 영어 피크닉" />
      <Field label="어떤 이벤트인가요?" req>
        <GrowInput value={body} onChangeText={setBody} multiline maxLength={500} placeholder="예) 돗자리 펴고 영어로 수다 떠는 피크닉이에요. 도시락은 각자, 게임은 제가 준비할게요." placeholderTextColor="#8C8597" style={styles.ta} accessibilityLabel="어떤 이벤트인가요?" />
      </Field>
      <Field label="예상 인원 · 나 포함" req>
        <CountPicker value={cap} presets={[10, 20, 30, 40]} min={CAP_MIN} max={CAP_MAX} typable anyLabel="무관" onChange={setCap} />
      </Field>
      <Field label="참가비" req hint={fee === '유료' ? '1인 금액이에요. 매니저와 이야기하며 바뀔 수 있어요.' : undefined}>
        <SheetPills options={FEES} value={fee} onChange={setFee} label="참가비" />
        {fee === '유료' ? (
          <View style={styles.price}>
            <View style={styles.priceIn}>
              <TextField
                value={priceN ? priceN.toLocaleString('ko-KR') : ''}
                onChangeText={(t) => setPrice(String(Math.min(FEE_MAX, Number(t.replace(/\D/g, '')) || 0) || ''))}
                keyboardType="number-pad"
                placeholder="예) 15,000"
                accessibilityLabel="1인 참가비 (원)"
                maxLength={9}
              />
            </View>
            <PText style={styles.won}>원</PText>
          </View>
        ) : null}
      </Field>

      <BranchSheet
        open={brOpen}
        onClose={() => setBrOpen(false)}
        title="진행 지점을 골라요"
        value={branch?.code ?? ''}
        purpose="trial"
        onPick={(b) => {
          if (b.code !== branch?.code) setPlace(null);
          setPicked(b);
        }}
      />
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
  selEmpty: { fontFamily: Font.body700, fontSize: 14, lineHeight: 20, color: Colors.inkSub },
  price: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  priceIn: { flex: 1 },
  won: { fontFamily: Font.body900, fontSize: 15, lineHeight: 20 },
  ta: { minHeight: 110, borderRadius: 18, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12, fontFamily: Font.body600, fontSize: 14, lineHeight: 22.4, color: Colors.ink, textAlignVertical: 'top' },
});
