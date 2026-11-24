import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useState, type ReactNode } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Pressable } from '@/components/ui/pressable';
import { keepAll } from '@/components/common/sheet-parts';
import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { sfx } from '@/lib/feedback';
import { HeartPop } from '@/components/ui/heart-pop';

import { Icon, type IconName } from '../icons';
import { CrownFace } from '../member-face';
import type { Member } from '../model';
import { LgButton } from '../parts';

/*
 * 상세 화면 조각들 (프로토타입 .lg-drows · .lg-drow · .dsec · .ddesc · .lg-mlist · .lg-mrow · .lg-hiform · .dnote · .lg-dcta).
 */

/** 복사: 클립보드에 넣고 알려 줘요 (폰 · 웹 모두) */
export function copyText(text: string, msg: string) {
  Clipboard.setStringAsync(text)
    .then(() => showToast(msg))
    .catch(() => showToast('복사하지 못했어요'));
}

/** 정보 줄 묶음 (흰 칸 · 잉크 2px · 둥글기 18) */
export function InfoRows({ children }: { children: ReactNode }) {
  return <View style={styles.rows}>{children}</View>;
}

/** 정보 한 줄: 연보라 아이콘 칸 · 글 · 작은 글 · 오른쪽 버튼 */
export function InfoRow({ icon, main, sub, end, first }: { icon: IconName; main: ReactNode; sub?: ReactNode; end?: ReactNode; first?: boolean }) {
  return (
    <View style={[styles.row, !first && styles.rowLine]}>
      <View style={styles.ic}>
        <Icon name={icon} size={17} />
      </View>
      <View style={styles.rowTx}>
        {typeof main === 'string' ? <PText style={styles.main}>{main}</PText> : main}
        {typeof sub === 'string' ? <PText style={[styles.sub, keepAll]}>{sub}</PText> : sub}
      </View>
      {end}
    </View>
  );
}
export const infoStyles = StyleSheet.create({
  main: { fontFamily: Font.body800, fontSize: 14, lineHeight: 20.3 },
  sub: { fontFamily: Font.body700, fontSize: 12, lineHeight: 17.4, color: Colors.inkSub },
  fee0: { fontFamily: Font.body700, fontSize: 14, color: '#A39C8E', textDecorationLine: 'line-through' },
});

/** 주소 복사 (38 × 38 · 연한 테두리 · 보라 아이콘) */
export function CopyBtn({ text, msg = '주소를 복사했어요', label = '주소 복사' }: { text: string; msg?: string; label?: string }) {
  return (
    <Pressable onPress={() => copyText(text, msg)} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => [styles.copy, pressed && { transform: [{ scale: 0.94 }] }]} hitSlop={3}>
      <Icon name="copy" size={18} color={Colors.purple} />
    </Pressable>
  );
}

/** 섹션 제목 (.dsec — 15 · 900, 위 20 아래 8) */
export function DSec({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <View style={styles.dsecRow}>
      <PText style={styles.dsec}>{children}</PText>
      {right}
    </View>
  );
}

/**
 * 소개 (길면 더보기 / 접기). 접혀 있을 땐 첫 문단까지만 보여요
 * — 줄 수로 자르면 '[이렇게 진행돼요]' 같은 제목만 덩그러니 남아서요.
 */
export function Desc({ text }: { text: string }) {
  const [more, setMore] = useState(false);
  const long = text.length > 220;
  const cut = text.indexOf('\n\n');
  const firstPara = cut > 0 && cut <= 400 ? text.slice(0, cut).trimEnd() : null;
  const shown = long && !more && firstPara ? firstPara : text;
  return (
    <View>
      <PText numberOfLines={long && !more && !firstPara ? 8 : undefined} style={[styles.desc, keepAll]}>
        {shown}
      </PText>
      {long ? (
        <Pressable onPress={() => setMore(!more)} accessibilityRole="button" style={styles.dmore} hitSlop={6}>
          <PText style={styles.dmoreT}>{more ? '접기' : '더보기'}</PText>
        </Pressable>
      ) : null}
    </View>
  );
}

/** 멤버 한 줄 (얼굴 · 이름 · 역할 · 지점 · 인사말) */
export function MemberRow({ m, first, tail }: { m: Member; first?: boolean; tail?: ReactNode }) {
  return (
    <Pressable
      disabled={m.me}
      onPress={() => router.push(`/me/profile/${encodeURIComponent(m.n)}`)}
      accessibilityRole={m.me ? undefined : 'button'}
      accessibilityLabel={m.me ? undefined : `${m.n} 프로필`}
      style={[styles.mrow, !first && styles.rowLine]}>
      <CrownFace name={m.n} me={m.me} role={m.t} />
      <View style={styles.mi}>
        <View style={styles.mh}>
          <PText style={styles.mb}>{m.n}</PText>
          {m.t ? <PText style={styles.mem}>{m.t}</PText> : null}
          <PText style={styles.ms}>{m.b}</PText>
        </View>
        {tail ?? (m.hi ? <PText style={[styles.mp, keepAll]}>{m.hi}</PText> : m.me ? <PText style={[styles.mp, styles.nohi]}>아직 인사를 안 남겼어요</PText> : null)}
      </View>
    </Pressable>
  );
}

/** 인사 남기기 칸 (.lg-hiform) */
export function HiForm({ initial = '', placeholder, button, onSave, onCancel }: { initial?: string; placeholder?: string; button: string; onSave: (t: string) => void; onCancel?: () => void }) {
  const [v, setV] = useState(initial);
  return (
    <View style={styles.hiform}>
      <TextInput value={v} onChangeText={setV} placeholder={placeholder} placeholderTextColor="#9B94A6" maxLength={60} style={styles.hiIn} accessibilityLabel={placeholder ?? '인사 고치기'} />
      <LgButton
        label={button}
        height={46}
        paddingH={16}
        onPress={() => {
          if (!v.trim()) return;
          sfx('save');
          onSave(v.trim());
        }}
      />
      {onCancel ? (
        <Pressable onPress={onCancel} accessibilityRole="button" hitSlop={8} style={styles.hia}>
          <PText style={styles.hiaT}>취소</PText>
        </Pressable>
      ) : null}
    </View>
  );
}

/** 멤버 목록 + 내 인사 (프로토타입 lgMemSec) */
export function MemberSection({ title, members, club, onHi, onHiDel }: { title: string; members: Member[]; club?: boolean; onHi: (t: string) => void; onHiDel: () => void }) {
  const [all, setAll] = useState(false);
  const [edit, setEdit] = useState(false);
  const mine = members.find((m) => m.me);
  const row = (m: Member, i: number) => {
    if (!m.me) return <MemberRow key={m.n + i} m={m} first={i === 0} />;
    const tail = edit ? (
      <HiForm
        initial={m.hi}
        button="저장"
        onSave={(t) => {
          onHi(t);
          setEdit(false);
        }}
        onCancel={() => setEdit(false)}
      />
    ) : m.hi ? (
      <>
        <PText style={[styles.mp, keepAll]}>{m.hi}</PText>
        <View style={styles.hiact}>
          <Pressable onPress={() => setEdit(true)} accessibilityRole="button" hitSlop={6}>
            <PText style={styles.hiactT}>수정</PText>
          </Pressable>
          <Pressable onPress={onHiDel} accessibilityRole="button" hitSlop={6}>
            <PText style={styles.hiactT}>삭제</PText>
          </Pressable>
        </View>
      </>
    ) : undefined;
    return <MemberRow key="me" m={m} first={i === 0} tail={tail} />;
  };
  return (
    <>
      <DSec>
        {title} {members.length}명
      </DSec>
      <View>{members.slice(0, 5).map(row)}</View>
      {members.length > 5 ? (
        <Pressable onPress={() => setAll(true)} accessibilityRole="button" style={styles.mall}>
          <PText style={styles.mallT}>멤버 {members.length}명 모두 보기 ›</PText>
        </Pressable>
      ) : null}
      {mine ? (
        mine.hi ? null : (
          <View style={{ marginTop: 8 }}>
            <HiForm placeholder={club ? '동아리 멤버들에게 인사 남기기' : '함께할 멤버들에게 인사 남기기'} button="남기기" onSave={onHi} />
          </View>
        )
      ) : (
        <PText style={styles.hi0}>{club ? '가입하면' : '참여하면'} 멤버들에게 인사를 남길 수 있어요.</PText>
      )}
      <Sheet open={all} onClose={() => setAll(false)} title={`${title} ${members.length}명`} tall>
        <View>{members.map((m, i) => <MemberRow key={m.n + i} m={m} first={i === 0} />)}</View>
      </Sheet>
    </>
  );
}

/** 안전 안내 (번개만) */
export function SafetyNote() {
  return (
    <View style={styles.dnote}>
      <Icon name="shield" size={15} color={Colors.inkSub} />
      <PText style={[styles.dnoteT, keepAll]}>처음 만나는 곳은 사람 많은 공개 장소예요. 불편한 일이 있으면 언제든 신고할 수 있어요.</PText>
    </View>
  );
}

/** 찜 (하트 · 54 × 54) */
export function SaveBtn({ on, onPress }: { on: boolean; onPress: () => void }) {
  return <LgButton variant={on ? 'on' : 'wh'} height={54} width={57} paddingH={0} shadow={3} icon={<HeartPop on={on}><Icon name="heart" size={22} fill={on ? Colors.rosePink : 'none'} /></HeartPop>} accessibilityLabel="찜하기" pressedState={on} onPress={onPress} radius={20} />;
}

/** 참가비 (아래 고정 바: 작은 '참가비 ~~원래가~~' + 큰 금액) */
export function FeeBlock({ fee, fee0 }: { fee?: number; fee0?: string }) {
  return (
    <View style={styles.fee}>
      <PText style={styles.feeS}>
        참가비{fee0 ? ' ' : ''}
        {fee0 ? <PText style={styles.feeS0}>{fee0}</PText> : null}
      </PText>
      <PText style={styles.feeB}>{fee ? `${String(fee).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}원` : '무료'}</PText>
    </View>
  );
}

export type MainVariant = 'y' | 'pu' | 'done' | 'wh' | 'off' | 'on';
/** 큰 행동 버튼 (참여하기 · 가입하기 · 후기 보기 — 54 · 둥글기 20) */
export function MainBtn({ label, variant = 'y', onPress, grow = true }: { label: string; variant?: MainVariant; onPress?: () => void; grow?: boolean }) {
  return <LgButton label={label} variant={variant} height={54} fontSize={15.5} radius={20} paddingH={6} grow={grow} onPress={onPress} />;
}

const styles = StyleSheet.create({
  rows: { marginTop: 14, paddingVertical: 2, paddingHorizontal: 14, borderWidth: 2, borderColor: Colors.ink, borderRadius: 18, backgroundColor: Colors.white },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 11 },
  rowLine: { borderTopWidth: 1, borderColor: Colors.line },
  ic: { width: 32, height: 32, borderRadius: 10, backgroundColor: Colors.lavender, alignItems: 'center', justifyContent: 'center' },
  rowTx: { flex: 1, minWidth: 0, paddingTop: 0 },
  main: infoStyles.main,
  sub: infoStyles.sub,
  copy: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, borderColor: Colors.line, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  dsecRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 8 },
  dsec: { flex: 1, fontFamily: Font.body900, fontSize: 15, lineHeight: 21 },
  desc: { fontFamily: Font.body600, fontSize: 14.5, lineHeight: 24.65 },
  dmore: { alignSelf: 'flex-start', marginTop: 4, paddingVertical: 6, paddingHorizontal: 2 },
  dmoreT: { fontFamily: Font.body900, fontSize: 13, lineHeight: 19, color: Colors.purple },
  mrow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 10 },
  mi: { flex: 1, minWidth: 0 },
  mh: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  mb: { fontFamily: Font.body900, fontSize: 14, lineHeight: 20 },
  mem: { fontFamily: Font.body900, fontSize: 11.5, lineHeight: 16, color: Colors.purple },
  ms: { fontFamily: Font.body700, fontSize: 11.5, lineHeight: 16, color: Colors.inkSub },
  mp: { fontFamily: Font.body600, fontSize: 13, lineHeight: 19.5, marginTop: 3 },
  nohi: { color: Colors.inkSub },
  hiact: { flexDirection: 'row', gap: 12, marginTop: 4 },
  hiactT: { fontFamily: Font.body800, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  mall: { height: 44, marginTop: 2, borderTopWidth: 1, borderColor: Colors.line, alignItems: 'center', justifyContent: 'center' },
  mallT: { fontFamily: Font.body800, fontSize: 13.5, lineHeight: 19, color: Colors.inkSub },
  hi0: { marginTop: 8, fontFamily: Font.body700, fontSize: 12.5, lineHeight: 19, color: Colors.inkSub },
  hiform: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  hiIn: { flex: 1, minWidth: 0, height: 46, paddingVertical: 0, includeFontPadding: false, textAlignVertical: 'center', paddingHorizontal: 14, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.line, backgroundColor: Colors.white, fontFamily: Font.body700, fontSize: 14, color: Colors.ink },
  hia: { paddingHorizontal: 4, height: 44, justifyContent: 'center' },
  hiaT: { fontFamily: Font.body800, fontSize: 12.5, color: Colors.inkSub },
  dnote: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 14 },
  dnoteT: { flex: 1, fontFamily: Font.body700, fontSize: 12.5, lineHeight: 19, color: Colors.inkSub },
  fee: { justifyContent: 'center', paddingHorizontal: 2, flexShrink: 0 },
  feeS: { fontFamily: Font.body700, fontSize: 11.5, lineHeight: 13.8, color: Colors.inkSub },
  feeS0: { fontFamily: Font.body700, fontSize: 11.5, color: '#A39C8E', textDecorationLine: 'line-through' },
  feeB: { fontFamily: Font.display, fontSize: 18, lineHeight: 21.6 },
});
