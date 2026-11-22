import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { LgIcon } from '@/components/common/icons';
import { FieldLabel, keepAll, SheetButton, SheetButtons, SheetDesc, SheetLink, SheetOptions, SheetPills } from '@/components/common/sheet-parts';
import { Checkbox, TextField } from '@/components/ui/field';
import { Raised } from '@/components/ui/raised';
import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import {
  formatPhone,
  isPhone,
  submitTrial,
  TRIAL_BRANCHES,
  TRIAL_LANGS,
  TRIAL_LEVELS,
  TRIAL_TIMES,
  trialDays,
  trialFull,
  type TrialLang,
  type TrialLevel,
} from '@/data/trial';
import { sfx } from '@/lib/feedback';

/** 어디서 열었는지: 체험 안내(why 가 있으면 안내부터) · 교재 소개 · 다른 언어 배우기(언어 미리 고르기) */
export type TrialStart = { why?: string; lang?: TrialLang; level?: TrialLevel };

type Step = 0 | 1 | 2 | 3 | 4;
type Form = { branch: string | null; lang: TrialLang; day: string | null; time: string | null; level: TrialLevel; name: string; phone: string; agree: boolean };

/** 개인정보 처리방침 (마이 B 약관 본문 — 프로토타입 myPush('termD', { ti: 1 })) */
const PRIVACY_HREF: Href = { pathname: '/me/settings/term', params: { i: '1' } };

const fresh = (s: TrialStart): Form => ({
  branch: null,
  lang: s.lang ?? '영어',
  day: null,
  time: null,
  // 체험 안내에서 오면 '기초', 교재 소개 · 다른 언어에서 오면 '처음이에요' (프로토타입 TR 시작값)
  level: s.level ?? (s.why ? '기초' : '처음이에요'),
  name: '',
  phone: '',
  agree: false,
});

/**
 * 체험 안내 시트 + 체험 신청 3단계 + 완료 — 한 시트 안에서 내용만 바꿔요 (프로토타입 lgTrial · trialStep).
 * 1 지점 → 2 언어 · 날짜(일요일 휴무) · 시간(마감은 못 고름) → 3 이름 · 휴대폰 · 실력 · 개인정보 동의 → 완료(예약 요약 · 오시는 길)
 */
export function TrialSheet({ open, start, onClose, onClosed }: { open: boolean; start: TrialStart; onClose: () => void; onClosed?: () => void }) {
  const [step, setStep] = useState<Step>(start.why ? 0 : 1);
  const [f, setF] = useState<Form>(() => fresh(start));
  const [wasOpen, setWasOpen] = useState(open);
  // 새로 열 때마다 처음부터 (언어 미리 고르기 포함)
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setStep(start.why ? 0 : 1);
      setF(fresh(start));
    }
  }
  const set = (patch: Partial<Form>) => setF((p) => ({ ...p, ...patch }));
  const days = trialDays();
  const day = f.day ?? days.find((d) => !d.off)?.key ?? null;
  const week = days.find((d) => d.key === day)?.week ?? '';
  const addr = TRIAL_BRANCHES.find((b) => b.name === f.branch)?.addr ?? '';

  const done = async () => {
    if (!f.name.trim()) return showToast('이름을 적어 주세요');
    if (!isPhone(f.phone)) return showToast('휴대폰 번호를 확인해 주세요');
    if (!f.agree) return showToast('개인정보 수집 · 이용에 동의해 주세요');
    if (!f.branch || !day || !f.time) return;
    const phone = formatPhone(f.phone);
    await submitTrial({ branch: f.branch, day, week, time: f.time, lang: f.lang, level: f.level, name: f.name.trim(), phone });
    set({ phone });
    sfx('save');
    setStep(4);
  };

  const back = <SheetButton label="이전" tone="white" sound="back" onPress={() => setStep((s) => (s - 1) as Step)} />;
  const footer =
    step === 1 ? (
      <SheetButton label="다음" size="foot" disabled={!f.branch} onPress={() => setStep(2)} />
    ) : step === 2 ? (
      <>
        {back}
        <SheetButton label="다음" disabled={!f.time} onPress={() => setStep(3)} />
      </>
    ) : step === 3 ? (
      <>
        {back}
        <SheetButton label="체험 신청하기" onPress={done} />
      </>
    ) : undefined;

  const title = step === 0 ? '함께하려면 체험부터 해요' : step === 1 ? '어느 지점에서 체험할까요?' : step === 2 ? '언제 올까요?' : step === 3 ? '예약할 분 정보' : undefined;

  return (
    <Sheet open={open} onClose={onClose} onClosed={onClosed} label={step === 0 ? '체험 신청 안내' : '체험 신청'} footer={footer} scrollKey={step}>
      {step >= 1 && step <= 3 ? <Steps at={step} /> : null}
      {title ? (
        <PText variant="title" accessibilityRole="header">
          {title}
        </PText>
      ) : null}

      {step === 0 ? (
        <>
          {/* .lg-trial — 노란 카드 · 오른쪽 아래 노랑 팔로 */}
          <View style={styles.trial}>
            <PText style={styles.trialHead}>{`${start.why}\nPALLO 체험 세션에서 시작해요`}</PText>
            <View style={styles.ul}>
              {['가까운 지점 체험 세션 1회', '번개 · 동아리 · 파티 참여', '좋아요 · 댓글 · 글쓰기'].map((t) => (
                <View key={t} style={styles.li}>
                  <PText style={styles.liDot}>•</PText>
                  <PText style={styles.liText}>{t}</PText>
                </View>
              ))}
            </View>
            <Image source={require('@/assets/characters/c-upright-yellow.png')} style={styles.trialImg} contentFit="contain" accessible={false} />
          </View>
          <SheetDesc>지금은 구경만 할 수 있어요. 체험 신청은 1분이면 끝나요.</SheetDesc>
          <SheetButtons>
            <SheetButton label="구경 계속하기" tone="white" sound="back" style={styles.flex} onPress={onClose} />
            <SheetButton label="체험 신청하기" style={styles.flex} onPress={() => setStep(1)} />
          </SheetButtons>
        </>
      ) : null}

      {step === 1 ? (
        <SheetOptions
          radio
          subStrong
          items={TRIAL_BRANCHES.map((b) => ({ key: b.name, label: b.name, sub: b.addr }))}
          selected={f.branch}
          onPick={(k) => set({ branch: k, time: null })}
        />
      ) : null}

      {step === 2 ? (
        <>
          <SheetDesc>{f.branch} · 체험 세션 50분</SheetDesc>
          <View style={styles.fl}>
            <FieldLabel>언어</FieldLabel>
            <SheetPills options={TRIAL_LANGS} value={f.lang} onChange={(v) => set({ lang: v })} label="언어" />
          </View>
          <View style={styles.days}>
            {days.map((d) => {
              const on = d.key === day;
              return (
                <Pressable
                  key={d.key}
                  disabled={d.off}
                  onPress={() => {
                    sfx('pick');
                    set({ day: d.key, time: null });
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`${d.key} ${d.week}요일${d.off ? ' 휴무' : ''}`}
                  accessibilityState={{ selected: on, disabled: d.off }}
                  style={[styles.day, on && styles.dayOn, d.off && styles.dayOff]}>
                  <PText color={on ? Colors.white : Colors.inkSub} style={styles.dayW}>
                    {d.week}
                  </PText>
                  <PText color={on ? Colors.white : Colors.ink} style={styles.dayN}>
                    {d.key.split('.')[1]}
                  </PText>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.times}>
            {TRIAL_TIMES.map((t) => {
              const full = !!f.branch && !!day && trialFull(f.branch, day, t);
              const on = f.time === t;
              return (
                <Pressable
                  key={t}
                  disabled={full}
                  onPress={() => {
                    sfx('pick');
                    set({ time: t });
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`${t} ${full ? '마감' : '자리 있음'}`}
                  accessibilityState={{ selected: on, disabled: full }}
                  style={[styles.time, on && styles.timeOn, full && styles.timeFull]}>
                  <PText style={styles.timeT}>{t}</PText>
                  <PText style={styles.timeS}>{full ? '마감' : '자리 있음'}</PText>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}

      {step === 3 ? (
        <>
          <SheetDesc>
            {f.branch} · {day} {f.time} · {f.lang}
          </SheetDesc>
          <TextField label="이름" placeholder="홍길동" value={f.name} onChangeText={(v) => set({ name: v })} autoComplete="name" textContentType="name" />
          <TextField label="휴대폰 번호" placeholder="010-0000-0000" value={f.phone} onChangeText={(v) => set({ phone: v })} keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber" />
          <View style={styles.fl}>
            <FieldLabel>지금 실력</FieldLabel>
            <SheetPills options={TRIAL_LEVELS} value={f.level} onChange={(v) => set({ level: v })} label="지금 실력" />
          </View>
          <Checkbox
            size={20}
            checked={f.agree}
            onChange={(v) => set({ agree: v })}
            label="개인정보 수집 · 이용에 동의해요"
            right={
              <SheetLink
                label="보기"
                onPress={() => {
                  onClose();
                  router.push(PRIVACY_HREF);
                }}
              />
            }
          />
        </>
      ) : null}

      {step === 4 ? (
        <>
          {/* .tr-ok — 노란 동그라미 체크 · 예약 요약 카드 */}
          <View style={styles.ok}>
            <View style={styles.okIc}>
              <LgIcon name="check" size={30} strokeWidth={3} />
            </View>
            <PText variant="title" accessibilityRole="header" style={styles.center}>
              체험 예약이 끝났어요
            </PText>
          </View>
          <Raised radius={22} style={styles.sumWrap}>
            <View style={styles.sum}>
              <SumRow k="지점" v={f.branch ?? ''} />
              <SumRow k="일시" v={`${day} (${week}) ${f.time}`} />
              <SumRow k="언어" v={`${f.lang} · ${f.level}`} />
            </View>
          </Raised>
          <SheetDesc center>{f.phone}로 카카오톡 안내를 보냈어요. 10분 전에 도착하면 좋아요.</SheetDesc>
          <SheetButtons>
            <SheetButton label="오시는 길" tone="white" style={styles.flex} onPress={() => showToast(`${f.branch} · ${addr}`)} />
            <SheetButton label="확인" style={styles.flex} onPress={onClose} />
          </SheetButtons>
        </>
      ) : null}
    </Sheet>
  );
}

/** .tr-steps — 3칸 진행 막대 */
function Steps({ at }: { at: number }) {
  return (
    <View style={styles.steps} accessibilityLabel={`${at}/3단계`}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={[styles.stepBar, i <= at && styles.stepOn]} />
      ))}
    </View>
  );
}

function SumRow({ k, v }: { k: string; v: string }) {
  return (
    <View style={styles.sumRow}>
      <PText style={styles.sumK}>{k}</PText>
      <PText style={styles.sumV}>{v}</PText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  steps: { flexDirection: 'row', gap: 6, marginBottom: 2 },
  stepBar: { flex: 1, height: 5, borderRadius: 3, backgroundColor: '#EEE8DA' },
  stepOn: { backgroundColor: Colors.purple },
  // .lg-trial { padding: 16px 120px 16px 16px; min-height: 120px; border-radius: 20px }
  trial: { minHeight: 120, paddingTop: 16, paddingBottom: 16, paddingLeft: 16, paddingRight: 120, borderWidth: 2, borderColor: Colors.ink, borderRadius: 20, backgroundColor: Colors.yellow, overflow: 'hidden' },
  trialHead: { fontFamily: Font.display, fontSize: 19, lineHeight: 19 * 1.25, letterSpacing: -0.5, ...keepAll },
  ul: { marginTop: 8 },
  li: { flexDirection: 'row' },
  liDot: { width: 17, fontFamily: Font.body700, fontSize: 13, lineHeight: 13 * 1.7 },
  liText: { flex: 1, fontFamily: Font.body700, fontSize: 13, lineHeight: 13 * 1.7 },
  // .lg-trial img { right: -4px; bottom: -18px; width: 120px }
  trialImg: { position: 'absolute', right: -4, bottom: -18, width: 120, height: 120 * (306 / 480) },
  fl: { gap: 6 },
  // .tr-days — 7칸 · 일요일은 점선 · 흐리게
  days: { flexDirection: 'row', gap: 6 },
  day: { flex: 1, height: 58, borderRadius: 14, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', gap: 1 },
  dayOn: { backgroundColor: Colors.purple },
  dayOff: { opacity: 0.35, borderStyle: 'dashed' },
  dayW: { fontFamily: Font.body800, fontSize: 11, lineHeight: 14 },
  dayN: { fontFamily: Font.display, fontSize: 16, lineHeight: 20 },
  // .tr-times — 두 줄 · 마감은 점선 · 흐리게
  times: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  time: { width: '48.5%', flexGrow: 1, height: 56, borderRadius: 14, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  timeOn: { backgroundColor: Colors.yellow },
  timeFull: { opacity: 0.4, borderStyle: 'dashed' },
  timeT: { fontFamily: Font.display, fontSize: 16, lineHeight: 20 },
  timeS: { fontFamily: Font.body800, fontSize: 11, lineHeight: 15, color: Colors.inkSub },
  ok: { alignItems: 'center' },
  okIc: { width: 64, height: 64, marginTop: 4, marginBottom: 6, borderRadius: 32, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.yellow, alignItems: 'center', justifyContent: 'center' },
  // .tr-sum { margin: 14px 0 10px; padding: 14px 16px; gap: 10px } (시트 간격 12 를 빼고)
  sumWrap: { marginTop: 2, marginBottom: -2 },
  sum: { gap: 10, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 22, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  sumK: { fontFamily: Font.body800, fontSize: 13, lineHeight: 19, color: Colors.inkSub },
  sumV: { flexShrink: 1, textAlign: 'right', fontFamily: Font.body900, fontSize: 14, lineHeight: 20 },
});
