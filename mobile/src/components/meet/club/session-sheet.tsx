import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Pressable } from '@/components/ui/pressable';
import { FieldLabel, keepAll, SheetButton } from '@/components/common/sheet-parts';
import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { BRING, type Club } from '@/data/meet';

import { CopyBtn, HiForm, MemberRow } from '../detail/detail-parts';
import { DoneSheet, SumCard, sumText } from '../detail/sheets';
import { Icon } from '../icons';
import { setText, toggleIn, useMeetStore } from '../meet-store';
import { clubSpot, sessionMembers, type Member, type Session } from '../model';

type Me = { name: string; branch: string };

/**
 * 정기 모임 회차 상세 (프로토타입 lgSessSheet): D-day · 동아리 이름 · 회차 주제 · 일시 · 장소(복사) · 인원 · 준비물 · 참석 멤버.
 * 아래 버튼: 가입하고 참석하기 / 참석하기 · 남은 자리 / 참석 완료(취소) / 빈자리 알림.
 * 참석하면 '참석 완료!' 창 → [인사말 남기기](내 줄 입력칸 열림) / [다음에 할게요].
 */
export function SessionSheet({ c, q, inC, all, me, onClose, onJoinClub }: { c: Club; q: Session | null; inC: boolean; all: Member[]; me: Me; onClose: () => void; onJoinClub: () => void }) {
  const vac = useMeetStore((s) => (q ? !!s.vac[q.id] : false));
  const myHi = useMeetStore((s) => (q ? (s.shi[q.id] ?? '') : ''));
  const [edit, setEdit] = useState(false);
  const [done, setDone] = useState(false);
  const open = !!q && !done;
  if (!q) return null;
  const full = q.cur >= q.cap && !q.me;
  const at = sessionMembers(all, q, me, myHi);
  const spot = clubSpot(c);

  const attend = () => {
    toggleIn('att', q.id);
    if (!q.me) setDone(true);
    else showToast('참석을 취소했어요');
  };

  const footer = !inC ? (
    <SheetButton label="가입하고 참석하기" size="foot" onPress={onJoinClub} />
  ) : q.me ? (
    <View style={styles.attW}>
      <View style={styles.attS} />
      <View style={styles.att}>
        <View style={styles.attL}>
          <Icon name="check" size={18} color="#fff" strokeWidth={3} />
          <PText style={styles.attT}>참석 완료 · 전날 알림을 보내 드려요</PText>
        </View>
        <Pressable onPress={attend} accessibilityRole="button" hitSlop={10}>
          <PText style={styles.attX}>취소</PText>
        </Pressable>
      </View>
    </View>
  ) : full ? (
    <SheetButton
      label={vac ? '빈자리 알림 받는 중' : '빈자리 알림 받기'}
      tone="white"
      size="foot"
      onPress={() => {
        toggleIn('vac', q.id);
        showToast(vac ? '빈자리 알림을 껐어요' : '자리가 나면 바로 알려 드릴게요');
      }}
    />
  ) : (
    <SheetButton label={`참석하기 · 남은 자리 ${q.cap - q.cur}`} size="foot" onPress={attend} />
  );

  return (
    <>
      <Sheet open={open} onClose={onClose} label="정기 모임 상세" footer={footer} onClosed={() => setEdit(false)}>
        <PText style={styles.dk}>
          {q.k ? 'D-' + q.k : '오늘'} · {c.name}
          {q.me ? ' · 참석 완료' : ''}
        </PText>
        <PText variant="title">{q.th}</PText>
        <SumCard
          rows={[
            ['cal', q.label],
            [
              'pin',
              <View key="a" style={styles.addr}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <PText style={styles.addrB}>{spot[0]}</PText>
                  <PText style={[styles.addrS, keepAll]}>{spot[1]}</PText>
                </View>
                <CopyBtn text={spot[1]} />
              </View>,
            ],
            ['users', `${q.cur} / ${q.cap}명${q.cur >= q.cap ? ' · 마감' : ` · 남은 자리 ${q.cap - q.cur}`}`],
            ['save', <PText key="b" style={sumText.t}>{`준비물 · ${BRING[c.cc] || BRING.study}`}</PText>],
          ]}
        />
        <View style={{ gap: 6 }}>
          <FieldLabel>참석 멤버 {q.cur}명</FieldLabel>
          <View>
            {at.map((m, i) =>
              m.me ? (
                <MemberRow
                  key="me"
                  m={m}
                  first={i === 0}
                  tail={
                    edit ? (
                      <HiForm
                        initial={m.hi}
                        placeholder="예) 퇴근하고 바로 갈게요!"
                        button={m.hi ? '저장' : '남기기'}
                        onSave={(t) => {
                          setText('shi', q.id, t);
                          setEdit(false);
                        }}
                        onCancel={() => setEdit(false)}
                      />
                    ) : (
                      <>
                        <PText style={[styles.mp, !m.hi && { color: Colors.inkSub }]}>{m.hi || '아직 인사말을 안 남겼어요'}</PText>
                        <View style={styles.hiact}>
                          <Pressable onPress={() => setEdit(true)} accessibilityRole="button" hitSlop={6}>
                            <PText style={styles.hiactT}>{m.hi ? '수정' : '인사말 남기기'}</PText>
                          </Pressable>
                          {m.hi ? (
                            <Pressable onPress={() => setText('shi', q.id, null)} accessibilityRole="button" hitSlop={6}>
                              <PText style={styles.hiactT}>삭제</PText>
                            </Pressable>
                          ) : null}
                        </View>
                      </>
                    )
                  }
                />
              ) : (
                <MemberRow key={m.n + i} m={m} first={i === 0} />
              ),
            )}
          </View>
          {q.me ? null : <PText style={styles.hi0}>참석하면 이 모임 멤버들에게 한마디 남길 수 있어요.</PText>}
        </View>
      </Sheet>
      <DoneSheet
        open={done}
        onClose={() => setDone(false)}
        label="참석 완료"
        title="참석 완료!"
        desc={`${q.label} · ${q.th}\n함께할 멤버들에게 인사말 남겨 보세요!\n전날 알림도 보내 드려요.`}
        button="인사말 남기기"
        onMain={() => {
          setDone(false);
          setEdit(true);
        }}
        onSkip={() => setDone(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  dk: { fontFamily: Font.body900, fontSize: 12.5, lineHeight: 18, color: Colors.purple, marginBottom: -8 },
  addr: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  addrB: { fontFamily: Font.body800, fontSize: 13.5, lineHeight: 19.6 },
  addrS: { fontFamily: Font.body700, fontSize: 12, lineHeight: 17, color: Colors.inkSub, marginTop: 2 },
  mp: { fontFamily: Font.body600, fontSize: 13, lineHeight: 19.5, marginTop: 3 },
  hiact: { flexDirection: 'row', gap: 10, marginTop: 4 },
  hiactT: { fontFamily: Font.body800, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  hi0: { marginTop: 4, fontFamily: Font.body700, fontSize: 12.5, lineHeight: 19, color: Colors.inkSub },
  attW: { flex: 1, height: 55 },
  attS: { position: 'absolute', top: 3, left: 3, right: -3, height: 52, borderRadius: 16, backgroundColor: Colors.ink },
  att: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingLeft: 18, paddingRight: 16, borderRadius: 16, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.purple },
  attL: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  attT: { fontFamily: Font.body900, fontSize: 14.5, lineHeight: 20, color: '#fff' },
  attX: { fontFamily: Font.body900, fontSize: 13, color: '#fff', opacity: 0.85 },
});
