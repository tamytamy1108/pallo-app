import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Pressable } from '@/components/ui/pressable';
import { FieldLabel, keepAll, SheetButton, SheetDesc, SheetLink } from '@/components/common/sheet-parts';
import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { dday, MONTHS, won } from '@/data/meet';
import type { SurveyQuestion } from '@/data/events';

import { AccountCard } from '@/components/event/account-card';
import { SurveyForm, surveyDone } from '@/components/event/survey';
import type { SurveyAnswers } from '../meet-store';
import { Icon, type IconName } from '../icons';

/*
 * 참여 · 가입 시트들 (프로토타입 lgJoinSheet · lgClubJoinSheet · lgGreetAsk · 취소 확인 lgSheet).
 * 카드에서 바로 참여하지 않아요 — 상세 아래 버튼 → 이 시트 → 확인 체크 뒤에만 버튼이 켜져요.
 */

/** 확인 체크 (.lg-jok — 줄 전체가 체크 칸) */
export function ConfirmCheck({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <Pressable onPress={() => onChange(!checked)} accessibilityRole="checkbox" accessibilityState={{ checked }} accessibilityLabel={label} style={({ pressed }) => [styles.jok, checked && styles.jokOn, pressed && { transform: [{ scale: 0.99 }] }]}>
      <View style={[styles.bx, checked && styles.bxOn]}>
        {checked ? (
          <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M5 12.5l4.5 4.5L19 7.5" />
          </Svg>
        ) : null}
      </View>
      <PText style={[styles.jokT, keepAll]}>{label}</PText>
    </Pressable>
  );
}

/** 모임 내용 요약 칸 (.lg-jsum) */
export function SumCard({ title, rows }: { title?: string; rows: [IconName, ReactNode][] }) {
  return (
    <View style={styles.jsum}>
      {title ? <PText style={styles.jsumB}>{title}</PText> : null}
      {rows.map(([ic, t], i) => (
        <View key={i} style={styles.jr}>
          <View style={{ marginTop: 2 }}>
            <Icon name={ic} size={15} />
          </View>
          {typeof t === 'string' ? <PText style={[styles.jrT, keepAll]}>{t}</PText> : t}
        </View>
      ))}
    </View>
  );
}
export const sumText = StyleSheet.create({ t: { flex: 1, fontFamily: Font.body700, fontSize: 13.5, lineHeight: 19.6 } });

export type JoinTarget = { id: string; title: string; mon: string; day: string; wd: string; place: string; cur: number; max: number; host: string; fee?: number; fee0?: number; party: boolean };

/** 참여 확인 시트 (번개 · 이벤트). ask: 번개처럼 호스트가 수락해야 확정되는 '참여 신청' */
export function JoinSheet({ open, onClose, it, questions = [], acct, onJoin, ask }: { open: boolean; onClose: () => void; it: JoinTarget; questions?: SurveyQuestion[]; acct?: [string, string, string]; onJoin: (a: SurveyAnswers | null) => void; ask?: boolean }) {
  const [ok, setOk] = useState(false);
  const [ans, setAns] = useState<SurveyAnswers>({});
  const ready = ok && surveyDone(questions, ans);
  const label = `${questions.length ? '설문 보내고 ' : ''}${it.fee ? `${won(it.fee)} 입금하고 참여하기` : ask ? '참여 신청하기' : '참여하기'}`;
  const feeRow: ReactNode = it.fee ? (
    <PText style={sumText.t}>
      참가비 <PText style={{ fontFamily: Font.body900 }}>{won(it.fee)}</PText>
      {it.fee0 ? ' ' : ''}
      {it.fee0 ? <PText style={styles.fee0}>{won(it.fee0)}</PText> : null}
    </PText>
  ) : it.party ? (
    '참가비 무료'
  ) : (
    '참가비 없음 · 각자 계산'
  );
  return (
    <Sheet
      open={open}
      onClose={onClose}
      onClosed={() => {
        setOk(false);
        setAns({});
      }}
      title={ask ? '참여 신청 전에 확인해 주세요' : '참여 전에 확인해 주세요'}
      label={ask ? '참여 신청 확인' : '참여 확인'}
      footer={<SheetButton label={label} size="foot" disabled={!ready} onPress={() => onJoin(questions.length ? ans : null)} />}>
      <SumCard
        title={it.title}
        rows={[
          ['cal', `${MONTHS.indexOf(it.mon) + 1}월 ${Number(it.day)}일 ${it.wd} · ${dday(it)}`],
          ['pin', it.place],
          ['users', ask ? `${it.cur} / ${it.max}명 · 남은 자리 ${Math.max(0, it.max - it.cur)}` : `${it.cur + 1} / ${it.max}명 · 내가 들어가면 남은 자리 ${Math.max(0, it.max - it.cur - 1)}`],
          ['crown', `${it.party ? '주최' : '호스트'} ${it.host}`],
          ['heart', feeRow],
        ]}
      />
      {it.fee && acct ? (
        <View style={{ gap: 6 }}>
          <FieldLabel>입금 계좌</FieldLabel>
          <AccountCard acct={acct} />
        </View>
      ) : null}
      {ask ? <SheetDesc>호스트가 수락하면 참여가 확정되고, 그때부터 장소 이름과 주소가 보여요. 결과는 알림으로 알려 드려요.</SheetDesc> : null}
      {questions.length ? <SurveyForm questions={questions} answers={ans} onChange={setAns} /> : null}
      <ConfirmCheck checked={ok} onChange={setOk} label={it.fee ? '모임 내용 · 안내 · 입금 계좌를 확인했어요' : '모임 내용과 안내를 확인했어요'} />
    </Sheet>
  );
}

/** 확인 시트 하나 (참여를 취소할까요? · 동아리에서 나갈까요?) */
export function AskSheet({ open, onClose, title, desc, button, onConfirm, label = '확인' }: { open: boolean; onClose: () => void; title: string; desc?: string; button: string; onConfirm: () => void; label?: string }) {
  return (
    <Sheet open={open} onClose={onClose} title={title} label={label} footer={<SheetButton label={button} tone="white" size="foot" onPress={onConfirm} />}>
      {desc ? <SheetDesc>{desc}</SheetDesc> : null}
    </Sheet>
  );
}

/** 체크 동그라미 (.lg-done — 64 · 노랑 · 잉크 2.5px · 그림자 3px) */
export function DoneMark() {
  return (
    <View style={styles.doneW}>
      <View style={styles.doneS} />
      <View style={styles.done}>
        <Icon name="check" size={30} strokeWidth={3} />
      </View>
    </View>
  );
}

/** 다 한 뒤 안내 (가입했어요! · 참석 완료!) + [주 버튼] + 다음에 할게요 */
export function DoneSheet({ open, onClose, title, desc, children, button, onMain, onSkip, label }: { open: boolean; onClose: () => void; title: string; desc: string; children?: ReactNode; button: string; onMain: () => void; onSkip: () => void; label: string }) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      label={label}
      footer={
        <View style={styles.foot2}>
          <SheetButton label={button} size="foot" onPress={onMain} style={{ alignSelf: 'stretch' }} />
          <SheetLink label="다음에 할게요" color={Colors.inkSub} onPress={onSkip} />
        </View>
      }>
      <DoneMark />
      <PText variant="title" style={styles.center}>
        {title}
      </PText>
      <SheetDesc center>{desc}</SheetDesc>
      {children}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  jok: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.55)', borderWidth: 1.5, borderColor: 'rgba(30,26,43,0.16)', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16 },
  jokOn: { backgroundColor: '#fff', borderWidth: 2, borderColor: Colors.purple, paddingVertical: 13.5, paddingHorizontal: 15.5 },
  bx: { width: 22, height: 22, borderRadius: 7, borderWidth: 2, borderColor: Colors.ink, alignItems: 'center', justifyContent: 'center' },
  bxOn: { backgroundColor: Colors.purple },
  jokT: { flex: 1, fontFamily: Font.body800, fontSize: 14, lineHeight: 20 },
  jsum: { borderWidth: 2, borderColor: Colors.ink, borderRadius: 18, backgroundColor: Colors.white, padding: 14, gap: 7 },
  jsumB: { fontFamily: Font.body900, fontSize: 16, lineHeight: 24, marginBottom: 2 },
  jr: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  jrT: { flex: 1, fontFamily: Font.body700, fontSize: 13.5, lineHeight: 19.6 },
  fee0: { fontFamily: Font.body700, fontSize: 13.5, color: '#A39C8E', textDecorationLine: 'line-through' },
  doneW: { alignSelf: 'center', width: 64, height: 64, marginTop: 6 },
  doneS: { position: 'absolute', top: 3, left: 3, width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.ink },
  done: { width: 64, height: 64, borderRadius: 32, borderWidth: 2.5, borderColor: Colors.ink, backgroundColor: Colors.yellow, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
  foot2: { alignItems: 'center', gap: 4 },
});
