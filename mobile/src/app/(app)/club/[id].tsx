import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Pressable } from '@/components/ui/pressable';
import { ClubAlbum } from '@/components/meet/club/club-album';
import { ClubBoard } from '@/components/meet/club/club-board';
import { ClubChat } from '@/components/meet/club/club-chat';
import { ClubHome } from '@/components/meet/club/club-home';
import { ClubJoin } from '@/components/meet/club/club-join';
import { ClubManage, type ManageRole } from '@/components/meet/club/club-manage';
import { SessionSheet } from '@/components/meet/club/session-sheet';
import { DetailFrame } from '@/components/meet/detail/detail-frame';
import { MainBtn, SaveBtn } from '@/components/meet/detail/detail-parts';
import { AskSheet } from '@/components/meet/detail/sheets';
import { guardMember } from '@/components/common/trial-guide';
import { Icon } from '@/components/meet/icons';
import { setClubState, toggleIn, useMeetStore } from '@/components/meet/meet-store';
import { clubCat, clubHost, clubOpen, clubSessions, clubStaff, clubX, findClub, membersOf, useAllClubs } from '@/components/meet/model';
import { EmptyState } from '@/components/ui/state-view';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors, TAB_ROW_H } from '@/constants/theme';
import { C } from '@/data/meet';
import { devClubRole } from '@/lib/dev-profile';
import { sfx } from '@/lib/feedback';
import { seeAt, SEE } from '@/lib/see';
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
 * 탭: 홈(누구나) · 게시판 · 사진첩 · 채팅(멤버 — 가입 전엔 흐린 미리보기). 탭은 위에 닿으면 위 막대 바로 아래에 붙고, 탭을 누르면 그 자리로 올라가요.
 * 아래 고정: '최근 30일 동안 N명이 가입했어요' + 찜 + 가입하기.
 * 맞는 API: 63 `/clubs/:id` · 65 `/clubs/:id/members` · 67 `/board` · `/photos` · 68 `/chat`(실시간 — Q-T6) · 69 `/sessions`
 */
export default function ClubDetail() {
  // 개발용 ?as=host · ?as=co, 또는 마이 '개발 · 사람'의 동아리 역할(lib/dev-profile devClubRole): 호스트 · 코호스트 · 멤버로 보기
  const { id, as } = useLocalSearchParams<{ id: string; as?: string }>();
  const key = String(id);
  const myClubs = useMeetStore((s) => s.myClubs);
  const c = findClub(key, myClubs);
  const me = useMe();
  const st = useMeetStore((s) => s.club[key]);
  const picked = useMeetStore((s) => s.cohost[key]);
  const saved = useMeetStore((s) => !!s.saved[key]);
  const greet = useMeetStore((s) => s.greet[key] ?? '');
  const att = useMeetStore((s) => s.att);
  const clubs = useAllClubs();
  const [tab, setTab] = useState<Tab>('home');
  const [join, setJoin] = useState(false);
  const [leave, setLeave] = useState(false);
  const [sid, setSid] = useState<string | null>(null);
  const [manage, setManage] = useState(false);

  if (!c) return <EmptyState title="동아리를 찾을 수 없어요" />;
  // 가입한 멤버인지 (신청하면 바로 가입 · 개발용 동아리 역할을 골랐으면 가입한 사람으로 봐요)
  const joined = st === 'in' || (__DEV__ && devClubRole !== 'auto');
  const cur = c.n + (joined ? 1 : 0);
  const meArg = { name: me.name, branch: me.branch };
  // 코호스트: 호스트가 관리에서 정한 사람들 (안 정했으면 예시)
  const staff = picked ?? clubStaff(c, cur, meArg);
  const members = membersOf(c, cur, joined || !!c.mine, greet, meArg, staff, true);
  const x = clubX(c);
  const cat = clubCat(c);
  const recs = clubs.filter((q) => q.id !== c.id && q.cc === c.cc).slice(0, 3);
  const q = sid ? clubSessions(c, att, 12, 85).find((s) => s.id === sid) ?? null : null;
  const devAs = __DEV__ ? (as === 'host' || as === 'co' ? as : devClubRole) : 'auto';
  const devRole: ManageRole | null = devAs === 'host' || devAs === 'co' ? devAs : null;
  const role: ManageRole | null = devRole ?? (devAs === 'member' ? null : c.mine || clubHost(c) === me.name ? 'host' : staff.includes(me.name) ? 'co' : null);
  // 잠금 없이 보기: 멤버 · 호스트 · 코호스트 · 스텝(지점 관리자). 가입 안 한 사람만 게시판 · 사진첩 · 채팅이 잠겨요
  const inC = clubOpen(joined, role, me.role);

  const btn = role ? (
    <MainBtn label="관리" variant="pu" onPress={() => setManage(true)} />
  ) : c.wait ? (
    <MainBtn label="승인 대기" variant="off" />
  ) : joined ? (
    <MainBtn label="가입 완료" variant="done" onPress={() => setLeave(true)} />
  ) : (
    <MainBtn label="가입하기" variant="pu" onPress={() => guardMember(() => setJoin(true), '동아리에 가입하려면')} />
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
      <ClubChat c={c} inC={inC} joined={joined} myName={me.name} staff={staff} />
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
                if (saved) showToast('저장을 취소했어요');
                else showToast('저장했어요', seeAt(SEE.savedMeets));
              }}
            />
            {btn}
          </>
        }>
        {null}
      </DetailFrame>

      <ClubJoin c={c} open={join} onClose={() => setJoin(false)} />
      {role ? <ClubManage c={c} role={role} open={manage} onClose={() => setManage(false)} members={members} staff={staff} /> : null}
      <AskSheet
        open={leave}
        onClose={() => setLeave(false)}
        title="동아리에서 나갈까요?"
        desc="나가면 게시판 · 사진첩 · 채팅을 볼 수 없고, 참석하기로 한 정기 모임도 함께 취소돼요."
        button="나가기"
        onConfirm={() => {
          setLeave(false);
          setClubState(c.id, null);
          showToast('동아리에서 나왔어요');
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
  // 챌린지 상세 탭 줄과 같아요 (좌우 끝까지 · 아래 선 1.5). 위 여백은 상세 틀이 줘요 — 탭에 margin 을 주면 위에 붙을 때 띠가 생겨요
  tabs: { flexDirection: 'row', paddingHorizontal: 18, borderBottomWidth: 1.5, borderColor: Colors.line, backgroundColor: Colors.cream },
  tab: { flex: 1, height: TAB_ROW_H, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 3, borderColor: 'transparent', marginBottom: -1.5 },
  tabOn: { borderColor: Colors.ink },
  tabT: { fontFamily: Font.body800, fontSize: 14.5, lineHeight: 20, color: Colors.inkSub },
  tabTOn: { fontFamily: Font.body900, color: Colors.ink },
  j30: { textAlign: 'center', marginBottom: 8, fontFamily: Font.body700, fontSize: 12.5, lineHeight: 19, color: Colors.inkSub },
  j30B: { fontFamily: Font.body900, fontSize: 12.5, color: Colors.ink },
});
