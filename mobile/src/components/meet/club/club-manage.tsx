import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { openProfileFromSheet } from '@/components/common/profile-tap';
import { SheetButton, SheetButtons, SheetDesc, SheetNote, SheetOptions, type SheetOption } from '@/components/common/sheet-parts';
import { GrowInput } from '@/components/ui/grow-input';
import { Sheet } from '@/components/ui/sheet';
import { showToast } from '@/components/ui/toast';
import { Colors } from '@/constants/theme';
import { Font } from '@/constants/fonts';
import type { Club } from '@/data/meet';

import { closeMyClub, setCohosts } from '../meet-store';
import type { Member } from '../model';

/**
 * 동아리 '관리' 시트 (docs/pages/10-roles.md 5장 · 관리 항목 자세히).
 * 지금 앱의 메뉴 시트 부품(SheetOptions · SheetButton · 토스트)만 써요. 단계별로 같은 시트 안에서 넘어가요.
 * 호스트 = 6가지, 코호스트 = 멤버 목록(보기만) · 공지 · 정기 모임 · 참석 확인 (2026-11-26). 가입은 신청하면 바로 돼요 (승인 · 대기자 없음).
 * 관리 시트는 운영 중인 동아리에서만 열려요 (관리자 승인 뒤 · 닫히기 전). 호스트는 내가 만든 동아리만.
 * 맞는 API: `/clubs/:id/members/:id` DELETE · `/clubs/:id/staff`.
 */
export type ManageRole = 'host' | 'co';

type Stage = { k: 'menu' } | { k: 'members' } | { k: 'cohost' } | { k: 'meet' } | { k: 'notice' } | { k: 'handover' } | { k: 'close' };

const opt = (key: string, label: string, sub?: string, bad?: boolean): SheetOption => ({ key, label, sub, bad });

export function ClubManage({ c, role, open, onClose, members, staff, onNewSession }: { c: Club; role: ManageRole; open: boolean; onClose: () => void; members: Member[]; staff: string[]; /** 정기 모임 일정 → 일정 만들기 시트 */ onNewSession: () => void }) {
  const [stage, setStage] = useState<Stage>({ k: 'menu' });
  const [wasOpen, setWasOpen] = useState(open);
  const [pick, setPick] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [pin, setPin] = useState(true);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setStage({ k: 'menu' });
  }
  const go = (s: Stage) => {
    setPick(null);
    setStage(s);
  };
  const back = (to: Stage = { k: 'menu' }) => <SheetButton label="뒤로" tone="white" size="inline" sound="back" onPress={() => go(to)} />;

  const host = role === 'host';
  const co = staff;
  // 호스트 줄: 예시 호스트('호스트') · 내가 연 동아리의 나('호스트 · 나') · 관리 시트를 호스트로 연 나
  const isHost = (m: Member) => !!m.t?.startsWith('호스트') || (host && !!m.me);
  // 코호스트로 정하거나 호스트를 넘길 수 있는 멤버: 호스트(나)는 빼요
  const others = members.filter((m) => !isHost(m));
  const noOthers = <SheetNote>아직 다른 멤버가 없어요. 멤버가 가입하면 여기서 고를 수 있어요.</SheetNote>;

  if (stage.k === 'members') {
    // 호스트 → 코호스트 → 멤버 순서 (나도 넣어요)
    const rank = (m: Member) => (isHost(m) ? 0 : co.includes(m.n) ? 1 : 2);
    const list = [...members].sort((a, b) => rank(a) - rank(b));
    const tag = (m: Member) => (isHost(m) ? ' · 호스트' : co.includes(m.n) ? ' · 코호스트' : '');
    return (
      <Sheet open={open} onClose={onClose} title={`멤버 ${members.length}명`} label="멤버 목록" scrollKey="members">
        <SheetDesc>멤버를 누르면 프로필이 열려요.</SheetDesc>
        <SheetOptions items={list.map((m) => opt(m.n, m.me ? `${m.n} (나)` : m.n, `${m.b}${tag(m)}`))} onPick={(k) => openProfileFromSheet(k, onClose)} />
        {back()}
      </Sheet>
    );
  }

  if (stage.k === 'cohost') {
    return (
      <Sheet open={open} onClose={onClose} title={`코호스트 ${co.length}명`} label="코호스트 정하기" scrollKey="cohost">
        <SheetDesc>코호스트는 공지 · 정기 모임 · 참석 확인을 함께 맡아요. 누르면 정하거나 빼요.</SheetDesc>
        <SheetNote>정하거나 빼면 그 멤버와 지점 관리자에게 알림이 가요.</SheetNote>
        {others.length ? (
          <SheetOptions
            items={others.map((m) => opt(m.n, m.n, co.includes(m.n) ? '코호스트 · 누르면 빼요' : m.b))}
            onPick={(k) => {
              if (co.includes(k)) {
                setCohosts(c.id, co.filter((x) => x !== k));
                showToast(`${k}님을 코호스트에서 뺐어요 · 본인과 지점 관리자에게 알렸어요`);
              } else {
                setCohosts(c.id, [...co, k]);
                showToast(`${k}님이 코호스트가 됐어요 · 본인과 지점 관리자에게 알림을 보냈어요`);
              }
            }}
          />
        ) : (
          noOthers
        )}
        {back()}
      </Sheet>
    );
  }

  if (stage.k === 'meet') {
    return (
      <Sheet open={open} onClose={onClose} title="공지 · 정기 모임 · 참석 확인" label="모임 운영" scrollKey="meet">
        <SheetOptions
          items={[opt('notice', '공지 쓰기', '게시판 공지 + 채팅방 위 고정 · 멤버 모두에게 알림'), opt('when', '정기 모임 일정 만들기', '날짜 · 시간 · 주제 · 인원 · 장소 · 멤버 모두에게 알림'), opt('check', '참석 확인', '지난 회차에 누가 왔는지 · 호스트 점수 ★에 쓰여요')]}
          onPick={(k) => (k === 'notice' ? go({ k: 'notice' }) : k === 'when' ? onNewSession() : showToast('참석 확인 화면은 다음에 붙여요'))}
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
        {others.length ? <SheetOptions radio items={others.map((m) => opt(m.n, m.n, m.b))} selected={pick} onPick={setPick} /> : noOthers}
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
        <SheetDesc>멤버 {members.length}명에게 알림이 가고, 다가오는 정기 모임이 모두 취소돼요. 게시판 · 사진은 30일 동안 볼 수 있어요. 이 동아리의 호스트 · 코호스트 권한도 같이 없어져요.</SheetDesc>
        <SheetButtons>
          <SheetButton label="취소" tone="white" size="pair" style={styles.flex} sound="back" onPress={() => go({ k: 'menu' })} />
          <SheetButton
            label="닫기"
            tone="bad"
            size="pair" style={styles.flex}
            onPress={() => {
              onClose();
              // 내가 만든 동아리면 정말 닫혀요 → 호스트 · 코호스트 권한이 같이 없어지고 기록만 남아요
              if (c.mine) closeMyClub(c.id, 'host');
              showToast('동아리를 닫았어요 · 멤버 모두에게 알림을 보냈어요');
            }}
          />
        </SheetButtons>
      </Sheet>
    );
  }

  const menu: (SheetOption & { to: Stage })[] = host
    ? [
        { ...opt('members', '멤버 목록', `멤버 ${members.length}명 · 누르면 프로필`), to: { k: 'members' } },
        { ...opt('cohost', '코호스트 정하기', `${co.length}명${co.length ? ' · ' + co.join(' · ') : ''} · 지점 관리자에게도 알림`), to: { k: 'cohost' } },
        { ...opt('edit', '소개 · 사진 · 장소 · 시간 수정하기', '시간 · 장소가 바뀌면 멤버에게 알림이 가요'), to: { k: 'menu' } },
        { ...opt('meet', '공지 · 정기 모임 · 참석 확인', '참석 확인은 호스트 점수 ★에 쓰여요'), to: { k: 'meet' } },
        { ...opt('handover', '호스트 넘기기', '멤버 중 한 명에게 넘겨요', true), to: { k: 'handover' } },
        { ...opt('close', '동아리 닫기', '모든 멤버에게 알림이 가요', true), to: { k: 'close' } },
      ]
    : [
        // 코호스트도 멤버 목록은 봐요 — 코호스트 정하기 · 빼기는 호스트만 (2026-11-26)
        { ...opt('members', '멤버 목록', `멤버 ${members.length}명 · 누르면 프로필`), to: { k: 'members' } },
        { ...opt('meet', '공지 · 정기 모임 · 참석 확인', '공지는 멤버 모두에게 알림이 가요'), to: { k: 'meet' } },
      ];
  return (
    <Sheet open={open} onClose={onClose} title={`관리 · ${c.name}`} label="동아리 관리" scrollKey="menu">
      <SheetOptions
        items={menu}
        onPick={(k) => {
          const row = menu.find((r) => r.key === k);
          if (k === 'edit') showToast('수정은 동아리 만들기 화면을 채운 채로 열어요 · 다음에 붙여요');
          else if (row) go(row.to);
        }}
      />
      {host ? null : <SheetNote>호스트만 할 수 있어요: 코호스트 정하기 · 빼기 · 소개 · 사진 · 장소 · 시간 수정하기 · 호스트 넘기기 · 동아리 닫기</SheetNote>}
      <SheetButton label="닫기" tone="white" size="inline" sound="back" onPress={onClose} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  input: { minHeight: 96, borderWidth: 2, borderColor: Colors.ink, borderRadius: 14, backgroundColor: Colors.white, paddingHorizontal: 14, paddingVertical: 12, fontFamily: Font.body700, fontSize: 14, lineHeight: 21, color: Colors.ink },
});
