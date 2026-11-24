import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Pressable } from '@/components/ui/pressable';
import { ClubAlbum } from '@/components/meet/club/club-album';
import { ClubBoard } from '@/components/meet/club/club-board';
import { ClubChat } from '@/components/meet/club/club-chat';
import { ClubHome } from '@/components/meet/club/club-home';
import { ClubJoin } from '@/components/meet/club/club-join';
import { SessionSheet } from '@/components/meet/club/session-sheet';
import { DetailFrame } from '@/components/meet/detail/detail-frame';
import { MainBtn, SaveBtn } from '@/components/meet/detail/detail-parts';
import { AskSheet } from '@/components/meet/detail/sheets';
import { guardMember } from '@/components/common/trial-guide';
import { Icon } from '@/components/meet/icons';
import { setClubState, toggleIn, useMeetStore } from '@/components/meet/meet-store';
import { clubCat, clubSessions, clubStaff, clubX, findClub, membersOf, useAllClubs } from '@/components/meet/model';
import { EmptyState } from '@/components/ui/state-view';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { C } from '@/data/meet';
import { sfx } from '@/lib/feedback';
import { useMe } from '@/state/me';

type Tab = 'home' | 'board' | 'photo' | 'chat';
const TABS: [Tab, string][] = [
  ['home', '홈'],
  ['board', '게시판'],
  ['photo', '사진첩'],
  ['chat', '채팅'],
];

/**
 * 동아리 상세 (docs/pages/04-lounge.md '동아리 상세 탭' · '정기 모임' — 프로토타입 lgClubDetail).
 * 탭: 홈(누구나) · 게시판 · 사진첩 · 채팅(멤버 — 가입 전엔 흐린 미리보기). 탭은 위에 닿으면 위 막대 아래에 붙어요.
 * 아래 고정: '최근 30일 동안 N명이 가입했어요' + 찜 + 가입하기.
 * 맞는 API: 63 `/clubs/:id` · 65 `/clubs/:id/members` · 67 `/board` · `/photos` · 68 `/chat`(실시간 — Q-T6) · 69 `/sessions`
 */
export default function ClubDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const key = String(id);
  const myClubs = useMeetStore((s) => s.myClubs);
  const c = findClub(key, myClubs);
  const me = useMe();
  const st = useMeetStore((s) => s.club[key]);
  const saved = useMeetStore((s) => !!s.saved[key]);
  const greet = useMeetStore((s) => s.greet[key] ?? '');
  const att = useMeetStore((s) => s.att);
  const clubs = useAllClubs();
  const [tab, setTab] = useState<Tab>('home');
  const [join, setJoin] = useState(false);
  const [leave, setLeave] = useState(false);
  const [sid, setSid] = useState<string | null>(null);

  if (!c) return <EmptyState title="동아리를 찾을 수 없어요" />;
  const inC = st === 'in';
  const cur = c.n + (inC ? 1 : 0);
  const meArg = { name: me.name, branch: me.branch };
  const staff = clubStaff(c, cur, meArg);
  const members = membersOf(c, cur, inC || !!c.mine, greet, meArg, staff, true);
  const x = clubX(c);
  const cat = clubCat(c);
  const recs = clubs.filter((q) => q.id !== c.id && q.cc === c.cc).slice(0, 3);
  const q = sid ? clubSessions(c, att, 12, 85).find((s) => s.id === sid) ?? null : null;

  const btn = c.wait ? (
    <MainBtn label="승인 대기" variant="off" />
  ) : inC ? (
    <MainBtn label="가입 완료" variant="done" onPress={() => setLeave(true)} />
  ) : st === 'ask' ? (
    <MainBtn label="신청 중 · 취소" variant="wh" grow={false} onPress={() => setLeave(true)} />
  ) : (
    <MainBtn label={c.cond === '누구나' ? '가입하기' : '가입 신청'} variant="pu" onPress={() => guardMember(() => setJoin(true), '동아리에 가입하려면')} />
  );

  const tabs = (
    <View style={styles.tabs} accessibilityRole="tablist">
      {TABS.map(([k, l]) => (
        <Pressable key={k} onPress={() => setTab(k)} accessibilityRole="tab" accessibilityState={{ selected: tab === k }} style={[styles.tab, tab === k && styles.tabOn]}>
          <PText style={[styles.tabT, tab === k && styles.tabTOn]}>{l}</PText>
        </Pressable>
      ))}
    </View>
  );

  const body =
    tab === 'home' ? (
      <ClubHome c={c} inC={inC} members={members} staff={staff} recs={recs} myBranch={me.branch} onSession={(s) => setSid(s.id)} />
    ) : tab === 'board' ? (
      <ClubBoard c={c} inC={inC} myName={me.name} staff={staff} />
    ) : tab === 'photo' ? (
      <ClubAlbum c={c} inC={inC} />
    ) : (
      <ClubChat c={c} inC={inC} myName={me.name} staff={staff} />
    );

  return (
    <>
      <DetailFrame
        id={c.id}
        club
        posters={c.posters}
        card={c.card}
        title={c.name}
        heading={c.name}
        kicker={
          <>
            <Icon name="flag" size={13} color={C.pu} strokeWidth={2.6} />
            <PText style={styles.kick}>동아리{cat ? ' · ' + cat[1] : ''}</PText>
          </>
        }
        sub={
          <PText style={styles.meta}>
            {c.br}
            {c.reg ? ' · ' + c.reg : ''} · 멤버 {cur}명 · <PText style={styles.metaEm}>{x.act}</PText>
          </PText>
        }
        tabs={tabs}
        tabKey={tab}
        tabBody={body}
        ctaNote={
          x.j30 ? (
            <PText style={styles.j30}>
              최근 30일 동안 <PText style={styles.j30B}>{x.j30}명</PText>이 가입했어요
            </PText>
          ) : null
        }
        cta={
          <>
            <SaveBtn
              on={saved}
              onPress={() => {
                sfx('toggle');
                toggleIn('saved', c.id);
                showToast(saved ? '저장을 취소했어요' : '저장했어요');
              }}
            />
            {btn}
          </>
        }>
        {null}
      </DetailFrame>

      <ClubJoin c={c} open={join} onClose={() => setJoin(false)} />
      <AskSheet
        open={leave}
        onClose={() => setLeave(false)}
        title={inC ? '동아리에서 나갈까요?' : '가입 신청을 취소할까요?'}
        desc={inC ? '나가면 게시판 · 사진첩 · 채팅을 볼 수 없고, 참석하기로 한 정기 모임도 함께 취소돼요.' : '다시 신청할 수 있어요.'}
        button={inC ? '나가기' : '신청 취소'}
        onConfirm={() => {
          setLeave(false);
          setClubState(c.id, null);
          showToast(inC ? '동아리에서 나왔어요' : '가입 신청을 취소했어요');
        }}
      />
      <SessionSheet
        c={c}
        q={q}
        inC={inC}
        all={members}
        me={meArg}
        onClose={() => setSid(null)}
        onJoinClub={() => {
          setSid(null);
          guardMember(() => setJoin(true), '동아리에 가입하려면');
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  kick: { fontFamily: Font.body900, fontSize: 12.5, lineHeight: 19, color: Colors.purple },
  meta: { marginTop: 6, fontFamily: Font.body700, fontSize: 13, lineHeight: 19, color: Colors.inkSub },
  metaEm: { fontFamily: Font.body900, fontSize: 13, color: C.pk },
  tabs: { flexDirection: 'row', marginTop: 16, borderBottomWidth: 1, borderColor: Colors.line, backgroundColor: Colors.cream },
  tab: { flex: 1, height: 44, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 3, borderColor: 'transparent', marginBottom: -1.5 },
  tabOn: { borderColor: Colors.ink },
  tabT: { fontFamily: Font.body800, fontSize: 14.5, lineHeight: 20, color: Colors.inkSub },
  tabTOn: { fontFamily: Font.body900, color: Colors.ink },
  j30: { textAlign: 'center', marginBottom: 8, fontFamily: Font.body700, fontSize: 12.5, lineHeight: 19, color: Colors.inkSub },
  j30B: { fontFamily: Font.body900, fontSize: 12.5, color: Colors.ink },
});
