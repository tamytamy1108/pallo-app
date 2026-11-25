import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { openProfileFromSheet } from '@/components/common/profile-tap';
import { SheetButton, SheetButtons, SheetDesc, SheetNote, SheetOptions, type SheetOption } from '@/components/common/sheet-parts';
import { GrowInput } from '@/components/ui/grow-input';
import { Sheet } from '@/components/ui/sheet';
import { showToast } from '@/components/ui/toast';
import { Colors } from '@/constants/theme';
import { Font } from '@/constants/fonts';
import type { Club } from '@/data/meet';

import type { Member } from '../model';

/**
 * 동아리 '관리' 시트 (docs/pages/10-roles.md 5장 · 관리 항목 자세히).
 * 지금 앱의 메뉴 시트 부품(SheetOptions · SheetButton · 토스트)만 써요. 단계별로 같은 시트 안에서 넘어가요.
 * 호스트 = 7가지, 코호스트 = 가입 승인 · 공지 · 정기 모임 · 참석 확인.
 * 가입 신청 · 대기자는 아직 서버가 없어서 예시 데이터예요 (맞는 API: 66 `/clubs/:id/requests` · `/clubs/:id/members/:id` DELETE · `/clubs/:id/staff`).
 */
export type ManageRole = 'host' | 'co';

type Applicant = { n: string; b: string; hi: string; wait?: boolean };
const APPLICANTS: Applicant[] = [
  { n: '지우', b: '하남점 · 영어 Lv.2', hi: '주말에 영어로 수다 떨고 싶어요!' },
  { n: '서윤', b: '잠실점 · 영어 Lv.3', hi: '성수 근처 살아요. 책 좋아해요 🙌' },
  { n: '도윤', b: '분당점 · 영어 Lv.1', hi: '처음인데 같이 읽어도 괜찮을까요?' },
  { n: '하린', b: '하남점 · 영어 Lv.2', hi: '자리 나면 꼭 들어가고 싶어요', wait: true },
  { n: '태오', b: '영등포 · 영어 Lv.3', hi: '대기 걸어 둘게요!', wait: true },
];
/** 아래 고정 바 위 한 줄 '가입 신청 n명 · 대기자 n명' (예시 데이터 기준) */
export const manageCounts = () => ({ ask: APPLICANTS.filter((a) => !a.wait).length, wait: APPLICANTS.filter((a) => a.wait).length });
const REJECT_REASONS = ['정원이 찼어요', '가입 조건이 안 맞아요', '모임 분위기와 맞지 않아요'];
const CO_MAX = 3;

type Stage =
  | { k: 'menu' }
  | { k: 'apply' }
  | { k: 'applicant'; a: Applicant }
  | { k: 'reject'; a: Applicant }
  | { k: 'members' }
  | { k: 'cohost' }
  | { k: 'meet' }
  | { k: 'notice' }
  | { k: 'handover' }
  | { k: 'close' };

const opt = (key: string, label: string, sub?: string, bad?: boolean): SheetOption => ({ key, label, sub, bad });

export function ClubManage({ c, role, open, onClose, members, staff }: { c: Club; role: ManageRole; open: boolean; onClose: () => void; members: Member[]; staff: string[] }) {
  const [stage, setStage] = useState<Stage>({ k: 'menu' });
  const [wasOpen, setWasOpen] = useState(open);
  const [pending, setPending] = useState<Applicant[]>(APPLICANTS);
  const [co, setCo] = useState<string[]>(staff);
  const [reason, setReason] = useState<string | null>(null);
  const [pick, setPick] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [pin, setPin] = useState(true);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setStage({ k: 'menu' });
  }
  const go = (s: Stage) => {
    setReason(null);
    setPick(null);
    setStage(s);
  };
  const back = (to: Stage = { k: 'menu' }) => <SheetButton label="뒤로" tone="white" size="inline" sound="back" onPress={() => go(to)} />;

  const asks = pending.filter((a) => !a.wait);
  const waits = pending.filter((a) => a.wait);
  // 코호스트로 정할 수 있는 멤버: 나 · 호스트는 빼요
  const others = members.filter((m) => !m.me && !m.t?.startsWith('호스트'));
  const host = role === 'host';

  if (stage.k === 'apply') {
    const items = [...asks.map((a) => opt(a.n, a.n, `${a.b} · 신청`)), ...waits.map((a) => opt(a.n, a.n, `${a.b} · 대기자`))];
    return (
      <Sheet open={open} onClose={onClose} title={`가입 신청 ${asks.length} · 대기자 ${waits.length}`} label="가입 신청" scrollKey="apply">
        <SheetDesc>누르면 가입 인사를 보고 승인하거나 거절해요. 정원이 차면 승인 대신 대기자로 둬요.</SheetDesc>
        {items.length ? <SheetOptions items={items} onPick={(k) => go({ k: 'applicant', a: pending.find((a) => a.n === k) ?? APPLICANTS[0] })} /> : <SheetNote>새 신청이 없어요.</SheetNote>}
        {back()}
      </Sheet>
    );
  }

  if (stage.k === 'applicant') {
    const a = stage.a;
    return (
      <Sheet open={open} onClose={onClose} title={`${a.n}님의 가입 신청`} label={`${a.n} 가입 신청`} scrollKey={`ap-${a.n}`}>
        <SheetDesc>{a.b}</SheetDesc>
        <View style={styles.quote}>
          <SheetDesc>“{a.hi}”</SheetDesc>
        </View>
        <SheetOptions items={[opt('profile', `${a.n} 프로필 보기`)]} onPick={() => openProfileFromSheet(a.n, onClose)} />
        <SheetButtons>
          <SheetButton label="거절" tone="white" size="pair" style={styles.flex} onPress={() => go({ k: 'reject', a })} />
          <SheetButton
            label="승인"
            tone="purple"
            size="pair" style={styles.flex}
            onPress={() => {
              setPending((L) => L.filter((x) => x.n !== a.n));
              go({ k: 'apply' });
              showToast(`${a.n}님이 ${c.name}에 가입했어요 · 알림을 보냈어요`);
            }}
          />
        </SheetButtons>
        {back({ k: 'apply' })}
      </Sheet>
    );
  }

  if (stage.k === 'reject') {
    const a = stage.a;
    return (
      <Sheet open={open} onClose={onClose} title="왜 거절하나요?" label="가입 거절" scrollKey={`rj-${a.n}`}>
        <SheetDesc>고른 이유가 {a.n}님에게 알림으로 가요.</SheetDesc>
        <SheetOptions radio items={REJECT_REASONS.map((r) => opt(r, r))} selected={reason} onPick={setReason} />
        <SheetButton
          label="거절하기"
          tone="bad"
          size="inline"
          disabled={!reason}
          onPress={() => {
            setPending((L) => L.filter((x) => x.n !== a.n));
            go({ k: 'apply' });
            showToast(`${a.n}님의 신청을 거절했어요`);
          }}
        />
        {back({ k: 'applicant', a })}
      </Sheet>
    );
  }

  if (stage.k === 'members') {
    const list = members.filter((m) => !m.me);
    return (
      <Sheet open={open} onClose={onClose} title={`멤버 ${members.length}명`} label="멤버 목록" scrollKey="members">
        <SheetDesc>멤버를 누르면 프로필이 열려요.</SheetDesc>
        <SheetOptions items={list.map((m) => opt(m.n, m.n, `${m.b}${m.t?.startsWith('호스트') ? ' · HOST' : co.includes(m.n) ? ' · CO-HOST' : ''}`))} onPick={(k) => openProfileFromSheet(k, onClose)} />
        {back()}
      </Sheet>
    );
  }

  if (stage.k === 'cohost') {
    return (
      <Sheet open={open} onClose={onClose} title={`코호스트 ${co.length} / ${CO_MAX}명`} label="코호스트 정하기" scrollKey="cohost">
        <SheetDesc>코호스트는 가입 승인 · 공지 · 정기 모임 · 참석 확인을 함께 맡아요. 누르면 정하거나 빼요.</SheetDesc>
        <SheetNote>정하거나 빼면 그 멤버와 지점 관리자에게 알림이 가요.</SheetNote>
        <SheetOptions
          items={others.map((m) => opt(m.n, m.n, co.includes(m.n) ? 'CO-HOST · 누르면 빼요' : m.b))}
          onPick={(k) => {
            if (co.includes(k)) {
              setCo((L) => L.filter((x) => x !== k));
              showToast(`${k}님을 코호스트에서 뺐어요 · 본인과 지점 관리자에게 알렸어요`);
            } else if (co.length >= CO_MAX) showToast(`코호스트는 ${CO_MAX}명까지예요`);
            else {
              setCo((L) => [...L, k]);
              showToast(`${k}님이 코호스트가 됐어요 · 본인과 지점 관리자에게 알림을 보냈어요`);
            }
          }}
        />
        {back()}
      </Sheet>
    );
  }

  if (stage.k === 'meet') {
    return (
      <Sheet open={open} onClose={onClose} title="공지 · 정기 모임 · 참석 확인" label="모임 운영" scrollKey="meet">
        <SheetOptions
          items={[opt('notice', '공지 쓰기', '게시판 공지 + 채팅방 위 고정 · 멤버 모두에게 알림'), opt('when', '정기 모임 일정', `${c.when} · 이번 회차 쉬기`), opt('check', '참석 확인', '지난 회차에 누가 왔는지 · 호스트 점수 ★에 쓰여요')]}
          onPick={(k) => (k === 'notice' ? go({ k: 'notice' }) : showToast(k === 'when' ? '정기 모임 일정 바꾸기는 다음에 붙여요' : '참석 확인 화면은 다음에 붙여요'))}
        />
        {back()}
      </Sheet>
    );
  }

  if (stage.k === 'notice') {
    return (
      <Sheet open={open} onClose={onClose} title="공지 쓰기" label="공지 쓰기" scrollKey="notice">
        <GrowInput value={note} onChangeText={setNote} placeholder="멤버들에게 알릴 내용을 적어요" placeholderTextColor="#9B94A6" maxLength={300} style={styles.input} accessibilityLabel="공지 내용" />
        <SheetOptions radio items={[opt('pin', '채팅방 위에 고정', pin ? '켜짐' : '꺼짐')]} selected={pin ? 'pin' : null} onPick={() => setPin((p) => !p)} />
        <SheetButton
          label="올리기"
          tone="purple"
          size="inline"
          disabled={!note.trim()}
          onPress={() => {
            setNote('');
            go({ k: 'menu' });
            showToast('공지를 올렸어요 · 멤버 모두에게 알림을 보냈어요');
          }}
        />
        {back({ k: 'meet' })}
      </Sheet>
    );
  }

  if (stage.k === 'handover') {
    return (
      <Sheet open={open} onClose={onClose} title="누구에게 넘길까요?" label="호스트 넘기기" scrollKey="handover">
        <SheetDesc>받는 사람이 수락해야 넘어가요. 넘기면 나는 코호스트가 돼요.</SheetDesc>
        <SheetOptions radio items={others.map((m) => opt(m.n, m.n, m.b))} selected={pick} onPick={setPick} />
        <SheetButton
          label="넘기기 요청 보내기"
          tone="bad"
          size="inline"
          disabled={!pick}
          onPress={() => {
            onClose();
            showToast(`${pick}님에게 호스트 요청을 보냈어요 · 수락하면 넘어가요`);
          }}
        />
        {back()}
      </Sheet>
    );
  }

  if (stage.k === 'close') {
    return (
      <Sheet open={open} onClose={onClose} title={`${c.name}을 닫을까요?`} label="동아리 닫기" scrollKey="close">
        <SheetDesc>멤버 {members.length}명에게 알림이 가고, 다가오는 정기 모임이 모두 취소돼요. 게시판 · 사진은 30일 동안 볼 수 있어요.</SheetDesc>
        <SheetButtons>
          <SheetButton label="취소" tone="white" size="pair" style={styles.flex} sound="back" onPress={() => go({ k: 'menu' })} />
          <SheetButton
            label="닫기"
            tone="bad"
            size="pair" style={styles.flex}
            onPress={() => {
              onClose();
              showToast('동아리를 닫았어요 · 멤버 모두에게 알림을 보냈어요');
            }}
          />
        </SheetButtons>
      </Sheet>
    );
  }

  const menu: (SheetOption & { to: Stage })[] = host
    ? [
        { ...opt('apply', '가입 신청 · 대기자', `신청 ${asks.length}명 · 대기자 ${waits.length}명`), to: { k: 'apply' } },
        { ...opt('members', '멤버 목록', `멤버 ${members.length}명 · 누르면 프로필`), to: { k: 'members' } },
        { ...opt('cohost', '코호스트 정하기', `${co.length} / ${CO_MAX}명${co.length ? ' · ' + co.join(' · ') : ''} · 지점 관리자에게도 알림`), to: { k: 'cohost' } },
        { ...opt('edit', '소개 · 사진 · 장소 · 시간 고치기', '시간 · 장소가 바뀌면 멤버에게 알림이 가요'), to: { k: 'menu' } },
        { ...opt('meet', '공지 · 정기 모임 · 참석 확인', '참석 확인은 호스트 점수 ★에 쓰여요'), to: { k: 'meet' } },
        { ...opt('handover', '호스트 넘기기', '멤버 중 한 명에게 넘겨요', true), to: { k: 'handover' } },
        { ...opt('close', '동아리 닫기', '모든 멤버에게 알림이 가요', true), to: { k: 'close' } },
      ]
    : [
        { ...opt('apply', '가입 신청 · 대기자', `신청 ${asks.length}명 · 대기자 ${waits.length}명`), to: { k: 'apply' } },
        { ...opt('meet', '공지 · 정기 모임 · 참석 확인', '공지는 멤버 모두에게 알림이 가요'), to: { k: 'meet' } },
      ];
  return (
    <Sheet open={open} onClose={onClose} title={`관리 · ${c.name}`} label="동아리 관리" scrollKey="menu">
      <SheetOptions
        items={menu}
        onPick={(k) => {
          const row = menu.find((r) => r.key === k);
          if (k === 'edit') showToast('고치기는 동아리 만들기 화면을 채운 채로 열어요 · 다음에 붙여요');
          else if (row) go(row.to);
        }}
      />
      {host ? null : <SheetNote>호스트만 할 수 있어요: 멤버 목록 · 코호스트 정하기 · 소개 · 사진 · 장소 · 시간 고치기 · 호스트 넘기기 · 동아리 닫기</SheetNote>}
      <SheetButton label="닫기" tone="white" size="inline" sound="back" onPress={onClose} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  quote: { backgroundColor: Colors.cream, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 4 },
  input: { minHeight: 96, borderWidth: 2, borderColor: Colors.ink, borderRadius: 14, backgroundColor: Colors.white, paddingHorizontal: 14, paddingVertical: 12, fontFamily: Font.body700, fontSize: 14, lineHeight: 21, color: Colors.ink },
});
