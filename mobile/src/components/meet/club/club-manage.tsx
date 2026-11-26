import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { openProfileFromSheet } from '@/components/common/profile-tap';
import { SheetButton, SheetButtons, SheetDesc, SheetNote, SheetOptions, type SheetOption } from '@/components/common/sheet-parts';
import { Checkbox } from '@/components/ui/field';
import { GrowInput } from '@/components/ui/grow-input';
import { runAfterSheetClose, Sheet } from '@/components/ui/sheet';
import { showToast } from '@/components/ui/toast';
import { Colors } from '@/constants/theme';
import { apiConfig } from '@/api/config';
import { useMe } from '@/state/me';
import { Font } from '@/constants/fonts';
import type { Club } from '@/data/meet';

import { acceptHandover, askHandover, cancelHandover, closeMyClub, finishHandover, setCame, setChatNote, setCohosts, useMeetStore } from '../meet-store';
import { postToBoard } from './club-board';
import type { Member, Session } from '../model';

/**
 * 동아리 '관리' 시트 (docs/pages/10-roles.md 5장 · 관리 항목 자세히).
 * 지금 앱의 메뉴 시트 부품(SheetOptions · SheetButton · 토스트)만 써요. 단계별로 같은 시트 안에서 넘어가요.
 * 호스트 = 6가지, 코호스트 = 공지 · 정기 모임 · 참석 확인. 가입은 신청하면 바로 돼요 (승인 · 대기자 없음).
 * 관리 시트는 운영 중인 동아리에서만 열려요 (관리자 승인 뒤 · 닫히기 전). 호스트는 내가 만든 동아리만.
 * 맞는 API: `/clubs/:id/members/:id` DELETE · `/clubs/:id/staff`.
 */
export type ManageRole = 'host' | 'co';

type Stage = { k: 'menu' } | { k: 'members' } | { k: 'cohost' } | { k: 'meet' } | { k: 'notice' } | { k: 'handover' } | { k: 'close' } | { k: 'check' } | { k: 'checkOne'; q: Session };

const opt = (key: string, label: string, sub?: string, bad?: boolean): SheetOption => ({ key, label, sub, bad });

export function ClubManage({ c, role, open, onClose, members, staff, onNewSession, past }: { c: Club; role: ManageRole; open: boolean; onClose: () => void; members: Member[]; staff: string[]; /** 정기 모임 일정 → 일정 만들기 시트 */ onNewSession: () => void; /** 지난 모임 (참석 확인) */ past: Session[] }) {
  const came = useMeetStore((s) => s.came);
  const ho = useMeetStore((s) => s.handover[c.id]);
  const myName = useMe().name;
  const [picked, setPicked] = useState<string[]>([]);
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
          items={[opt('notice', '공지 쓰기', '게시판 공지 + 채팅방 위 고정 · 멤버 모두에게 알림'), opt('when', '정기 모임 일정 만들기', '날짜 · 시간 · 주제 · 인원 · 장소 · 멤버 모두에게 알림'), opt('check', '참석 확인', '지난 모임에 누가 왔는지 체크해요 · 호스트 소개의 이번 달 참석에 쓰여요')]}
          onPick={(k) => (k === 'notice' ? go({ k: 'notice' }) : k === 'when' ? onNewSession() : go({ k: 'check' }))}
        />
        {back()}
      </Sheet>
    );
  }

  if (stage.k === 'check') {
    return (
      <Sheet open={open} onClose={onClose} title="참석 확인" label="참석 확인 · 모임 고르기" scrollKey="check">
        <SheetDesc>지난 모임을 고르고 온 사람을 체크해요. 호스트 소개의 &apos;이번 달 참석&apos;에 쓰여요.</SheetDesc>
        {past.length ? (
          <SheetOptions
            items={past.map((q) => opt(q.id, `${q.label} · ${q.th}`, came[q.id] ? `확인함 · ${came[q.id].length}명 왔어요` : '아직 확인 안 했어요'))}
            onPick={(id) => {
              const q = past.find((x) => x.id === id);
              if (!q) return;
              setPicked(came[q.id] ?? []);
              setStage({ k: 'checkOne', q });
            }}
          />
        ) : (
          <SheetNote>아직 지난 모임이 없어요. 모임이 끝나면 여기서 체크해요.</SheetNote>
        )}
        {back({ k: 'meet' })}
      </Sheet>
    );
  }

  if (stage.k === 'checkOne') {
    const q = stage.q;
    return (
      <Sheet open={open} onClose={onClose} title={`${q.label} · 누가 왔나요?`} label="참석 확인 · 온 사람 체크" scrollKey="checkOne">
        <SheetDesc>{q.th} · 온 사람을 눌러 체크해요. 체크한 사람은 프로필의 &apos;함께한 모임&apos;에도 남아요.</SheetDesc>
        <View style={styles.checks}>
          {members.map((m) => (
            <Checkbox
              key={m.n}
              checked={picked.includes(m.n)}
              onChange={(on) => setPicked((L) => (on ? [...L, m.n] : L.filter((x) => x !== m.n)))}
              label={m.me ? `${m.n} (나)` : m.n}
              sub={isHost(m) ? '호스트' : co.includes(m.n) ? '코호스트' : m.b}
            />
          ))}
        </View>
        <SheetButton
          label={`저장 · ${picked.length}명 왔어요`}
          tone="purple"
          size="inline"
          onPress={() => {
            setCame(q.id, picked);
            setStage({ k: 'check' });
            showToast(`참석 확인을 저장했어요 · ${picked.length}명`);
          }}
        />
        {back({ k: 'check' })}
      </Sheet>
    );
  }

  if (stage.k === 'notice') {
    return (
      <Sheet open={open} onClose={onClose} title="공지 쓰기" label="공지 쓰기" scrollKey="notice">
        <GrowInput value={note} onChangeText={setNote} placeholder="멤버들에게 알릴 내용을 적어요" placeholderTextColor="#9B94A6" maxLength={300} style={styles.input} accessibilityLabel="공지 내용" />
        <SheetOptions radio items={[opt('pin', '필독 · 채팅방 위에 고정', pin ? '켜짐 · 게시판 맨 위 필독 + 채팅방 위 공지' : '꺼짐 · 게시판 공지로만')]} selected={pin ? 'pin' : null} onPick={() => setPin((p) => !p)} />
        <SheetButton
          label="올리기"
          tone="purple"
          size="inline"
          disabled={!note.trim()}
          onPress={() => {
            const t = note.trim();
            // 게시판에 공지로 올려요 (고정이면 필독 + 채팅방 위 공지도 바꿔요)
            postToBoard(c, { id: c.id + 'n' + Date.now(), k: 'note', w: myName, mine: true, pin: pin || undefined, ti: t.split('\n')[0].slice(0, 40), bd: t, t: pin ? '고정' : '방금', lk: 0, cm: [] });
            if (pin) setChatNote(c.id, t);
            setNote('');
            go({ k: 'menu' });
            showToast(pin ? '필독 공지를 올렸어요 · 채팅방 위에도 고정 · 멤버 모두에게 알렸어요' : '공지를 올렸어요 · 멤버 모두에게 알림을 보냈어요');
          }}
        />
        {back({ k: 'meet' })}
      </Sheet>
    );
  }

  if (stage.k === 'handover') {
    // 진행 중이면: 지금 단계 + (가짜 서버일 때) 다음 단계 미리 해 보기 · 요청 취소
    if (ho) {
      return (
        <Sheet open={open} onClose={onClose} title="호스트 넘기기" label="호스트 넘기기 · 진행 중" scrollKey="handover">
          <SheetDesc>
            {ho.to}님에게 호스트를 넘기는 중이에요. {ho.stage === 'ask' ? `${ho.to}님이 수락하면 관리자 승인으로 넘어가요.` : '관리자가 승인하면 호스트가 넘어가고, 나는 코호스트가 돼요.'}
          </SheetDesc>
          <SheetOptions
            items={[
              opt('s1', '1. 넘기기 요청', '보냈어요'),
              opt('s2', `2. ${ho.to}님 수락`, ho.stage === 'ask' ? '기다리는 중' : '수락했어요'),
              opt('s3', '3. 관리자 승인', ho.stage === 'admin' ? '기다리는 중' : '수락 뒤에'),
            ]}
            onPick={() => {}}
          />
          {apiConfig.useMock ? (
            <>
              <SheetNote>가짜 서버 시험용 · 다음 단계 미리 보기</SheetNote>
              <SheetButton
                label={ho.stage === 'ask' ? `${ho.to}님이 수락해 보기` : '관리자 승인해 보기'}
                tone="purple"
                size="inline"
                onPress={() => {
                  if (ho.stage === 'ask') {
                    acceptHandover(c.id);
                    showToast(`${ho.to}님이 수락했어요 · 관리자 승인을 기다려요`);
                  } else {
                    finishHandover(c.id, myName, c.name);
                    onClose();
                    showToast(`${ho.to}님이 새 호스트예요 · 나는 코호스트가 됐어요`);
                  }
                }}
              />
            </>
          ) : null}
          <SheetButton
            label="요청 취소"
            tone="white"
            size="inline"
            onPress={() => {
              cancelHandover(c.id);
              showToast('호스트 넘기기를 취소했어요');
              go({ k: 'menu' });
            }}
          />
          {back()}
        </Sheet>
      );
    }
    return (
      <Sheet open={open} onClose={onClose} title="누구에게 넘길까요?" label="호스트 넘기기" scrollKey="handover">
        <SheetDesc>받는 사람이 수락하고 관리자가 승인하면 넘어가요. 넘기면 나는 코호스트가 돼요.</SheetDesc>
        {others.length ? <SheetOptions radio items={others.map((m) => opt(m.n, m.n, m.b))} selected={pick} onPick={setPick} /> : noOthers}
        <SheetButton
          label="넘기기 요청 보내기"
          tone="bad"
          size="inline"
          disabled={!pick}
          onPress={() => {
            if (!pick) return;
            askHandover(c.id, pick);
            showToast(`${pick}님에게 호스트 요청을 보냈어요 · 수락하고 관리자가 승인하면 넘어가요`);
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
        { ...opt('edit', '고치기 · 소개 · 호스트 소개 · 사진 · 시간 · 장소', '시간 · 요일 · 지역이 바뀌면 멤버에게 알림이 가요'), to: { k: 'menu' } },
        { ...opt('meet', '공지 · 정기 모임 · 참석 확인', '일정 만들기 · 지난 모임에 누가 왔는지 체크'), to: { k: 'meet' } },
        { ...opt('handover', '호스트 넘기기', ho ? `${ho.to}님에게 넘기는 중 · ${ho.stage === 'ask' ? '수락 기다리는 중' : '관리자 승인 기다리는 중'}` : '멤버가 수락하고 관리자가 승인하면 넘어가요', true), to: { k: 'handover' } },
        { ...opt('close', '동아리 닫기', '모든 멤버에게 알림이 가요', true), to: { k: 'close' } },
      ]
    : [
        { ...opt('meet', '공지 · 정기 모임 · 참석 확인', '공지는 멤버 모두에게 알림이 가요'), to: { k: 'meet' } },
      ];
  return (
    <Sheet open={open} onClose={onClose} title={`관리 · ${c.name}`} label="동아리 관리" scrollKey="menu">
      <SheetOptions
        items={menu}
        onPick={(k) => {
          const row = menu.find((r) => r.key === k);
          if (k === 'edit') {
            // 내가 만든 동아리: 만들기 화면을 내 값으로 채워 열어요. 예시 동아리(개발용 호스트로 보기)는 고칠 데이터가 없어요
            if (!c.mine) return showToast('예시 동아리는 고칠 수 없어요 · 내가 만든 동아리에서 해 보세요');
            onClose();
            runAfterSheetClose(() => router.push({ pathname: '/club/new', params: { edit: c.id } }));
          }
          else if (row) go(row.to);
        }}
      />
      {host ? null : <SheetNote>호스트만 할 수 있어요: 멤버 목록 · 코호스트 정하기 · 소개 · 사진 · 장소 · 시간 고치기 · 호스트 넘기기 · 동아리 닫기</SheetNote>}
      <SheetButton label="닫기" tone="white" size="inline" sound="back" onPress={onClose} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  checks: { gap: 12, paddingVertical: 4 },
  flex: { flex: 1 },
  input: { minHeight: 96, borderWidth: 2, borderColor: Colors.ink, borderRadius: 14, backgroundColor: Colors.white, paddingHorizontal: 14, paddingVertical: 12, fontFamily: Font.body700, fontSize: 14, lineHeight: 21, color: Colors.ink },
});
