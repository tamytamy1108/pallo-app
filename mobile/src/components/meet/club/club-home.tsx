import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { keepAll } from '@/components/common/sheet-parts';
import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { HOST_INTRO, hashId, joinFree, type Club } from '@/data/meet';
import { useMe } from '@/state/me';

import { ClubRow } from '../club-list';
import { DSec, InfoRow, InfoRows, MemberSection } from '../detail/detail-parts';
import { setText, useMeetStore } from '../meet-store';
import { CrownFace } from '../member-face';
import { clubContent, clubDesc, clubHost, clubSessions, type Member, type Session } from '../model';
import { LgLink } from '../parts';
import { SessionRow } from './schedule';

/**
 * 동아리 홈 탭 (프로토타입 lgClubDetail tab 'home'): 소개 · 모임 정보 · 다가오는 정기 모임 · 호스트 소개 · 멤버 · 같은 카테고리 추천.
 */
export function ClubHome({ c, inC, members, staff, recs, myBranch, onSession }: { c: Club; inC: boolean; members: Member[]; staff: string[]; recs: Club[]; myBranch: string; onSession: (q: Session) => void }) {
  const att = useMeetStore((s) => s.att);
  const me = useMe();
  const [all, setAll] = useState(false);
  const SS = clubSessions(c, att);
  const S12 = clubSessions(c, att, 12, 85);
  const { album } = clubContent(c);
  const h = hashId(c.id);
  const host = clubHost(c);
  const intro = c.mine ? '' : HOST_INTRO[c.cc] || HOST_INTRO.study;
  // 내 지점 멤버 수 (이 회차 참석 멤버 중 내 지점)
  const mineN = (q: Session) => members.filter((m) => !m.me && m.b.split(' · ').includes(myBranch)).slice(0, q.cur).length;
  const row = (q: Session, i: number) => <SessionRow key={q.id} c={c} q={q} i={i} album={album} mine={mineN(q)} onPress={() => onSession(q)} />;

  return (
    <View>
      <DSec>소개</DSec>
      <PText style={[styles.desc, keepAll]}>{clubDesc(c)}</PText>
      <InfoRows>
        <InfoRow first icon="cal" main={c.when} sub="매주 모여요" />
        <InfoRow icon="pin" main={`${c.br}${c.reg ? ' · ' + c.reg : ''}`} sub={`${c.lang}로 이야기해요`} />
        <InfoRow icon="crown" main={`호스트 ${host}`} sub={staff.length ? `서브 호스트 ${staff.join(' · ')}` : '서브 호스트는 아직 없어요'} />
        <InfoRow icon="check" main={`가입 조건 · ${c.cond}`} sub={joinFree(c.cond, c.br, me.branch) ? '가입 인사만 쓰면 바로 가입돼요' : `${c.br} 멤버가 아니면 호스트가 확인하면 가입돼요`} />
      </InfoRows>

      <View style={styles.schhd}>
        <PText style={styles.schT}>일정</PText>
        <PText style={styles.schN}>{S12.length}</PText>
        <View style={{ flex: 1 }} />
        <LgLink label="더보기 ›" color={Colors.inkSub} onPress={() => setAll(true)} />
      </View>
      {SS.length ? (
        <>
          <View style={styles.sch}>{SS.map(row)}</View>
          {inC ? null : <PText style={styles.hi0}>가입하면 회차마다 참석할 수 있어요.</PText>}
        </>
      ) : (
        <PText style={styles.empty}>4주 안에 잡힌 모임이 없어요.</PText>
      )}

      <DSec>호스트 소개</DSec>
      <View style={styles.host}>
        <View style={styles.hd}>
          <CrownFace name={host} size={44} role="호스트" />
          <View>
            <PText style={styles.hdB}>{host}</PText>
            <PText style={styles.hdS}>{3 + (h % 10)}개월째 모임 운영 중</PText>
          </View>
        </View>
        <PText style={[styles.intro, keepAll]}>{intro || '아직 소개글이 없어요.'}</PText>
        <View style={styles.st}>
          {(
            [
              ['정기 모임', `${12 + (h % 40)}회`],
              ['이번 달 참석', `${4 + (h % 9)}명`],
              ['또 만나고 싶어요', `${2 + (h % 7)}`],
            ] as const
          ).map(([l, v]) => (
            <View key={l} style={styles.stI}>
              <PText style={styles.stS}>{l}</PText>
              <PText style={styles.stB}>{v}</PText>
            </View>
          ))}
        </View>
      </View>

      <MemberSection
        title="멤버"
        club
        members={members}
        onHi={(t) => {
          setText('greet', c.id, t);
          showToast('인사를 남겼어요');
        }}
        onHiDel={() => {
          const keep = members.find((m) => m.me)?.hi ?? '';
          setText('greet', c.id, null);
          showToast('인사를 지웠어요', { label: '되돌리기', onPress: () => setText('greet', c.id, keep) });
        }}
      />

      {recs.length ? (
        <>
          <DSec>이런 동아리도 추천해요</DSec>
          <View>
            {recs.map((r, i) => (
              <ClubRow key={r.id} c={r} first={i === 0} />
            ))}
          </View>
        </>
      ) : null}

      <Sheet open={all} onClose={() => setAll(false)} title={`일정 ${S12.length}`} label="전체 일정" tall>
        <PText style={styles.ds}>{c.name} · 앞으로 12주</PText>
        <View style={styles.sch}>
          {S12.map((q, i) => (
            <SessionRow
              key={q.id}
              c={c}
              q={q}
              i={i}
              album={album}
              mine={mineN(q)}
              onPress={() => {
                setAll(false);
                onSession(q);
              }}
            />
          ))}
        </View>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  desc: { fontFamily: Font.body600, fontSize: 14.5, lineHeight: 24.65 },
  schhd: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 20, marginBottom: 8, minHeight: 31 },
  schT: { fontFamily: Font.body900, fontSize: 15, lineHeight: 21 },
  schN: { fontFamily: Font.display, fontSize: 15, lineHeight: 19 },
  sch: { gap: 16 },
  hi0: { marginTop: 8, fontFamily: Font.body700, fontSize: 12.5, lineHeight: 19, color: Colors.inkSub },
  empty: { paddingVertical: 12, textAlign: 'center', fontFamily: Font.body700, fontSize: 14, color: Colors.inkSub },
  host: { padding: 14, borderWidth: 2, borderColor: Colors.ink, borderRadius: 18, backgroundColor: Colors.white },
  hd: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hdB: { fontFamily: Font.body900, fontSize: 15, lineHeight: 21 },
  hdS: { fontFamily: Font.body700, fontSize: 12, lineHeight: 17, color: Colors.inkSub, marginTop: 4 },
  intro: { marginTop: 10, fontFamily: Font.body600, fontSize: 13.5, lineHeight: 21.6 },
  st: { flexDirection: 'row', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderColor: Colors.line },
  stI: { flex: 1, alignItems: 'center', gap: 2 },
  stS: { fontFamily: Font.body700, fontSize: 11, lineHeight: 16, color: Colors.inkSub },
  stB: { fontFamily: Font.display, fontSize: 15, lineHeight: 19 },
  ds: { fontFamily: Font.body600, fontSize: 14, lineHeight: 21, color: Colors.inkSub },
});
