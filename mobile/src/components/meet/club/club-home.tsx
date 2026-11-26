import { useState } from 'react';
import { ProfileTap } from '@/components/common/profile-tap';
import { RoleTag } from '@/components/common/role-tag';
import { StyleSheet, View } from 'react-native';

import { keepAll } from '@/components/common/sheet-parts';
import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { HOST_INTRO, hashId, type Club } from '@/data/meet';
import { useMe } from '@/state/me';

import { ClubRow } from '../club-list';
import { DSec, HostRow, InfoRow, InfoRows, infoStyles, MemberSection } from '../detail/detail-parts';
import { setText, useMeetStore } from '../meet-store';
import { CrownFace } from '../member-face';
import { clubCapLine, clubContent, clubDesc, clubHost, clubLangLine, clubPastSessions, clubSessions, type Member, type Session } from '../model';
import { LgLink } from '../parts';
import { SessionRow } from './schedule';

/** 내 동아리 운영 기간 (승인된 때부터) */
function runSince(okAt?: number) {
  if (!okAt) return '승인 전이에요';
  const m = Math.floor((Date.now() - okAt) / (30 * 864e5));
  return m < 1 ? '이번 달부터 모임 운영 중' : `${m + 1}개월째 모임 운영 중`;
}

/**
 * 동아리 홈 탭 (프로토타입 lgClubDetail tab 'home'): 소개 · 모임 정보 · 다가오는 정기 모임 · 호스트 소개 · 멤버 · 같은 카테고리 추천.
 */
export function ClubHome({ c, inC, block, members, staff, recs, myBranch, onSession, onNewSession }: { c: Club; inC: boolean; block?: string | null; members: Member[]; staff: string[]; recs: Club[]; myBranch: string; onSession: (q: Session) => void; /** 호스트 · 코호스트만: 일정 만들기 */ onNewSession?: () => void }) {
  const att = useMeetStore((s) => s.att);
  const made = useMeetStore((s) => s.sched[c.id]);
  const came = useMeetStore((s) => s.came);
  const again = useMeetStore((s) => s.again);
  const me = useMe();
  const [all, setAll] = useState(false);
  const SS = clubSessions(c, att, 4, 29, made);
  const S12 = clubSessions(c, att, 12, 91, made);
  // 지난 모임 (최근 12회): 더보기의 '지난 모임' · 호스트 소개 숫자
  const PAST = clubPastSessions(c, att, 12, made);
  const { album } = clubContent(c);
  const h = hashId(c.id);
  // 지금 호스트 (넘기기가 끝났으면 새 호스트)
  const hostTo = useMeetStore((s) => s.hostTo[c.id]);
  const host = hostTo ?? clubHost(c);
  // 호스트 소개: 호스트가 적은 글 (예시 동아리는 예시 글)
  const intro = c.hostIntro || (c.mine ? '' : HOST_INTRO[c.cc] || HOST_INTRO.study);
  // 내 지점 멤버 수 (이 회차 참석 멤버 중 내 지점)
  const mineN = (q: Session) => members.filter((m) => !m.me && m.b.split(' · ').includes(myBranch)).slice(0, q.cur).length;
  const row = (q: Session, i: number) => <SessionRow key={q.id} c={c} q={q} i={i} album={album} mine={mineN(q)} onPress={() => onSession(q)} />;

  return (
    <View>
      <DSec>소개</DSec>
      <PText style={[styles.desc, keepAll]}>{clubDesc(c)}</PText>
      <InfoRows>
        <InfoRow first icon="cal" main={c.when} sub="매주 모여요" />
        <InfoRow icon="pin" main={c.place ? `${c.place} · ${c.br}` : `${c.br}${c.reg ? ' · ' + c.reg : ''}`} sub={c.addr || clubLangLine(c)} />
        <InfoRow icon="users" main={`멤버 ${members.length}명`} sub={clubCapLine(c)} />
        <HostRow name={host} branch={c.br} me={host === me.name} sub={c.br} />
        <InfoRow
          icon="crown"
          main={
            staff.length ? (
              <View style={styles.coRow}>
                {staff.map((n) => (
                  <ProfileTap key={n} name={n} style={styles.who}>
                    <CrownFace name={n} size={22} role="코호스트" />
                    <PText style={infoStyles.main}>{n}</PText>
                    <RoleTag kind="co" />
                  </ProfileTap>
                ))}
              </View>
            ) : (
              '코호스트는 아직 없어요'
            )
          }
          sub="공지 · 정기 모임을 함께 맡아요"
        />
        <InfoRow icon="check" main={`가입 조건 · ${c.cond}`} sub={block ?? '신청하면 바로 가입돼요'} />
      </InfoRows>

      <View style={styles.schhd}>
        <PText style={styles.schT}>일정</PText>
        <PText style={styles.schN}>{S12.length}</PText>
        <View style={{ flex: 1 }} />
        {onNewSession ? <LgLink label="+ 일정 만들기" onPress={onNewSession} /> : null}
        {S12.length || PAST.length ? <LgLink label="더보기 ›" color={Colors.inkSub} onPress={() => setAll(true)} /> : null}
      </View>
      {SS.length ? (
        <>
          <View style={styles.sch}>{SS.map(row)}</View>
          {inC ? null : <PText style={styles.hi0}>가입하면 모임마다 참석할 수 있어요.</PText>}
        </>
      ) : (
        <PText style={styles.empty}>{onNewSession ? '아직 잡힌 모임이 없어요. 위 + 일정 만들기로 첫 모임을 올려 주세요.' : '4주 안에 잡힌 모임이 없어요.'}</PText>
      )}

      <DSec>호스트 소개</DSec>
      <View style={styles.host}>
        <View style={styles.hd}>
          <ProfileTap name={host}>
            <CrownFace name={host} size={44} role="호스트" />
          </ProfileTap>
          <View>
            <PText style={styles.hdB}>{host}</PText>
            <PText style={styles.hdS}>{c.mine ? runSince(c.okAt) : `${3 + (h % 10)}개월째 모임 운영 중`}</PText>
          </View>
        </View>
        <PText style={[styles.intro, keepAll]}>{intro || (onNewSession && c.mine ? '아직 호스트 소개가 없어요. 관리 › 고치기에서 써 주세요.' : '아직 소개글이 없어요.')}</PText>
        <View style={styles.st}>
          {(c.mine
            ? // 내가 만든 동아리: 실제 기록 (지난 모임 수 · 이번 달 참석 확인한 사람 수 · 최근 3달 '또 만나고 싶어요')
              ([
                ['정기 모임', `${PAST.length}회`],
                ['이번 달 참석', `${PAST.filter((q) => q.mon === new Date().getMonth() + 1 && q.k > -31).reduce((n, q) => n + (came[q.id]?.length ?? 0), 0)}명`],
                ['또 만나고 싶어요', `${PAST.filter((q) => q.k > -92 && again[q.id]).length}명`],
              ] as const)
            : ([
                ['정기 모임', `${12 + (h % 40)}회`],
                ['이번 달 참석', `${4 + (h % 9)}명`],
                ['또 만나고 싶어요', `${2 + (h % 7)}명`],
              ] as const)
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
        {S12.length ? null : <PText style={styles.empty}>앞으로 잡힌 모임이 없어요.</PText>}
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
        {PAST.length ? (
          <>
            <PText style={styles.pastH}>지난 모임 {PAST.length}</PText>
            <PText style={styles.ds}>참석한 모임은 눌러서 &apos;또 만나고 싶어요&apos;를 보낼 수 있어요.</PText>
            <View style={styles.sch}>
              {PAST.map((q, i) => (
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
          </>
        ) : null}
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  pastH: { marginTop: 18, fontFamily: Font.body900, fontSize: 14, lineHeight: 19 },
  who: { flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start' },
  coRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 6 },
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
