import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { Pressable } from '@/components/ui/pressable';
import { ProfileTap } from '@/components/common/profile-tap';
import { ReportSheet } from '@/components/common/report-sheet';
import { AvatarChar, AvatarStage, MemberFace } from '@/components/character/avatar';
import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { findMember, followLists, MEMBERS, memberAvatar, memberHandle, memberLangs, MY_BADGES, nameHash, type Member } from '@/data/my';
import { sfx } from '@/lib/feedback';
import { useMyAvatar } from '@/state/avatar';
import { toggleFollow, useMe } from '@/state/me';

import { PfIcon } from './icons';
import { Lift } from './lift';
import { BadgeGrid } from './my-blocks';
import { FollowSheet, MemberRow } from './my-sheets';

const SUB_LV = ['EVERYDAY ENGLISH', 'REAL ENGLISH', 'TOPIC TALK'];

/** 이번 주 포인트 달리기 (프로토타입 .pf-race.t1: 육상 트랙 · 레인 1 상대 · 레인 2 나) */
function Race({ name, theirs, mine, width }: { name: string; theirs: number; mine: number; width: number }) {
  const myAv = useMyAvatar();
  const mx = Math.max(theirs, mine, 1) * 1.15;
  const rr = (v: number) => Math.max(0, Math.min(1, v / mx));
  const inner = width - 4;
  // 출발선(32) · 결승선(24) · 캐릭터 폭(64) 안쪽에서만
  const at = (r: number) => 32 + (inner - 32 - 24 - 64) * r;
  const tag = (r: number, top: number, txt: string) => (
    <View style={[styles.rTag, { top }, r > 0.55 ? { right: inner - at(r) + 4 } : { left: at(r) + 68 }]}>
      <PText style={styles.rTagT}>{txt}</PText>
    </View>
  );
  const a = rr(theirs);
  const b = rr(mine);
  return (
    <View style={[styles.race, { width }]}>
      <View style={styles.lane} />
      <PText style={[styles.laneNo, { top: 32 }]}>1</PText>
      <PText style={[styles.laneNo, { top: 112 }]}>2</PText>
      <View style={styles.start} />
      <View style={styles.fin}>
        <Svg width={18} height={158}>
          {Array.from({ length: 27 * 3 }, (_, i) => {
            const r = Math.floor(i / 3);
            const c = i % 3;
            return (r + c) % 2 ? null : <Rect key={i} x={c * 6} y={r * 6} width={6} height={6} fill={Colors.ink} />;
          })}
        </Svg>
      </View>
      <View style={[styles.rn, { left: at(a), top: 28 }]}>
        <AvatarChar av={memberAvatar(name)} width={64} flip={false} style={styles.rnChar} />
      </View>
      {tag(a, 40, `${name} ${theirs}P`)}
      <View style={[styles.rn, { left: at(b), top: 108 }]}>
        <AvatarChar av={myAv} width={64} flip={false} style={styles.rnChar} />
      </View>
      {tag(b, 120, `나 ${mine}P`)}
    </View>
  );
}

function H2({ title, right, big }: { title: string; right?: ReactNode; big?: boolean }) {
  return (
    <View style={styles.h2}>
      <PText style={[styles.h2T, big && styles.h2Big]}>{title}</PText>
      {right}
    </View>
  );
}

/**
 * 멤버 프로필 시트 (프로토타입 openProfile · #lgSheet.tall.pfs): 캐릭터 룸 · 이름 · @아이디 · 지점 · 학습 언어 · 팔로잉/팔로워
 * · 함께 아는 멤버 · [팔로우] → 팔로우하면 추천 멤버 · 이번 주 포인트 달리기 · 학습 현황 · 배지 · 신고 / 차단.
 * 라운지 · 랭킹에서 얼굴을 누르면 열려요 (/me/profile/[이름]).
 */
export function ProfileSheet({ name, open, onClose, onOpen }: { name: string; open: boolean; onClose: () => void; /** 시트 안에서 다른 멤버를 누르면 (같은 시트에 그 사람으로 바꿔요) */ onOpen: (name: string) => void }) {
  const { width: winW } = useWindowDimensions();
  const me = useMe();
  const [justFollowed, setJustFollowed] = useState(false);
  const [recHide, setRecHide] = useState<Record<string, boolean>>({});
  const [list, setList] = useState<'fing' | 'fer' | null>(null);
  const [recAll, setRecAll] = useState(false);
  const [report, setReport] = useState<'report' | 'block' | null>(null);

  const W = Math.min(winW, 520) - 36;
  const h = nameHash(name);
  const br = findMember(name)?.branch ?? me.branch;
  const langs = memberLangs(name);
  const lv = 1 + (h % 3);
  const fol = !!me.following[name];
  const L = followLists(name, me, me.following);
  const mut = MEMBERS.filter((m) => m.name !== name && m.name !== me.name).slice(h % 3, (h % 3) + 3);
  const badges = MY_BADGES.filter((_, i) => (h + i) % 3 !== 0)
    .slice(0, 4)
    .map((b) => ({ ...b, on: true }));
  const theirWk = 90 + ((h * 7) % 140);
  const myWk = 30 + me.weekPoints;
  const diff = Math.abs(theirWk - myWk);
  const recs: (Member & { why: string })[] = MEMBERS.filter((m) => m.name !== name && m.name !== me.name && !me.following[m.name] && !recHide[m.name])
    .slice(0, 6)
    .map((m, k) => ({ ...m, why: [`${name}님이\n팔로우 중`, `같은 ${String(m.branch || '').split(' · ')[0]}\n토요일 세션`, '같은 동아리\n멤버예요'][k % 3] }));

  const follow = () => {
    const on = toggleFollow(name);
    setJustFollowed(on);
    sfx(on ? 'pick' : 'tap');
    showToast(on ? `${name}님을 팔로우했어요 · 출석 · 학습 소식을 알려 드려요` : `${name}님 팔로우를 끊었어요`);
  };
  // 시트 안에서 다른 멤버를 누르면 같은 시트에 그 사람으로 (프로토타입 openProfile 도 내용만 바꿔요)
  const openOther = (n: string) => {
    setList(null);
    setRecAll(false);
    setJustFollowed(false);
    onOpen(n);
  };

  return (
    <>
      <Sheet open={open} onClose={onClose} tall label={`${name} 프로필`} gap={10}>
        <AvatarStage av={memberAvatar(name)} width={W} border big />
        <View style={styles.id}>
          <PText style={styles.name}>{name}</PText>
          <PText style={styles.idS}>
            {memberHandle(name)} · {br} · 2026년 가입
          </PText>
        </View>
        <View style={styles.cnt}>
          <View style={styles.cntC}>
            <PText style={[styles.cntLang, langs.length > 1 && styles.cntLang2]}>{langs.join(' · ')}</PText>
            <PText style={styles.cntS}>학습 언어</PText>
          </View>
          <Pressable onPress={() => setList('fing')} accessibilityRole="button" accessibilityLabel={`팔로잉 ${L.fing.length}`} style={styles.cntC}>
            <PText style={styles.cntN}>{L.fing.length}</PText>
            <PText style={styles.cntS}>팔로잉</PText>
          </Pressable>
          <Pressable onPress={() => setList('fer')} accessibilityRole="button" accessibilityLabel={`팔로워 ${L.fer.length}`} style={styles.cntC}>
            <PText style={styles.cntN}>{L.fer.length}</PText>
            <PText style={styles.cntS}>팔로워</PText>
          </Pressable>
        </View>
        <View style={styles.mut}>
          <View style={styles.avs}>
            {mut.map((m, i) => (
              <ProfileTap key={m.name} name={m.name} onPress={() => openOther(m.name)} style={i > 0 ? styles.avOver : undefined}>
                <MemberFace name={m.name} size={26} bg={m.color} />
              </ProfileTap>
            ))}
          </View>
          <PText style={styles.mutT}>{mut.map((m) => m.name).join(' · ')}님도 팔로우해요</PText>
        </View>
        <Pressable onPress={follow} accessibilityRole="button" accessibilityLabel={fol ? `${name} 팔로잉 · 끊기` : `${name} 팔로우`}>
          {({ pressed }) => (
            <Lift radius={25} x={3} y={3} pressed={pressed}>
              <View style={[styles.fbtn, fol && styles.fbtnOn]}>
                {fol && <PfIcon.chk color={Colors.purple} />}
                <PText style={[styles.fbtnT, fol && styles.fbtnTOn]}>{fol ? '팔로잉' : '팔로우'}</PText>
              </View>
            </Lift>
          )}
        </Pressable>

        {fol && justFollowed && recs.length > 0 && (
          <>
            <H2
              big
              title="이런 멤버도 있어요"
              right={
                <Pressable onPress={() => setRecAll(true)} accessibilityRole="button" hitSlop={8}>
                  <PText style={styles.link}>모두 보기</PText>
                </Pressable>
              }
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recWrap} contentContainerStyle={styles.rec}>
              {recs.map((r) => (
                <View key={r.name} style={styles.rc}>
                  <Pressable onPress={() => setRecHide((x) => ({ ...x, [r.name]: true }))} accessibilityRole="button" accessibilityLabel={`${r.name} 추천 숨기기`} style={styles.rcX} hitSlop={8}>
                    <PText style={styles.rcXT}>×</PText>
                  </Pressable>
                  <Pressable onPress={() => openOther(r.name)} accessibilityRole="button" accessibilityLabel={`${r.name} 프로필`}>
                    <MemberFace name={r.name} size={64} bg={r.color} style={styles.rcAv} />
                  </Pressable>
                  <PText style={styles.rcB}>{r.name}</PText>
                  <PText style={styles.rcS}>{r.why}</PText>
                  <Pressable
                    onPress={() => {
                      toggleFollow(r.name);
                      sfx('pick');
                      showToast(`${r.name}님을 팔로우했어요`);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`${r.name} 팔로우하기`}>
                    {({ pressed }) => (
                      <Lift radius={19} x={0} y={3} pressed={pressed}>
                        <View style={styles.rcFb}>
                          <PText style={styles.rcFbT}>팔로우하기</PText>
                        </View>
                      </Lift>
                    )}
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          </>
        )}

        {fol && (
          <>
            <H2 title="이번 주 포인트 달리기" right={<PText style={styles.h2B}>{diff === 0 ? `동점 · ${myWk}P` : `${diff}P 차이`}</PText>} />
            <Race name={name} theirs={theirWk} mine={myWk} width={W} />
            <PText style={styles.tip}>
              {diff === 0 ? (
                <>
                  나란히 달리는 중! 오늘 출석하면 <PText style={styles.tipB}>+50P</PText> 앞서요
                </>
              ) : theirWk > myWk ? (
                <>
                  오늘 출석 + 복습하면 <PText style={styles.tipB}>+50P</PText> 앞으로 달려요
                </>
              ) : (
                `내가 ${diff}P 앞서 있어요 · 오늘도 이어 가요`
              )}
            </PText>
            <H2 title="학습 현황" />
            <View style={styles.st}>
              <View style={styles.stC}>
                <PfIcon.fire />
                <View>
                  <PText style={styles.stB}>{3 + (h % 40)}일</PText>
                  <PText style={styles.stS}>연속 출석</PText>
                </View>
              </View>
              <View style={styles.stC}>
                <PfIcon.book />
                <View style={styles.stTx}>
                  <PText style={styles.stB}>{langs.map((l, i) => `${l} Lv.${i ? 1 + ((h + 1) % 2) : lv}`).join('\n')}</PText>
                  <PText style={styles.stS}>{langs.length > 1 ? '학습 레벨' : SUB_LV[lv - 1]}</PText>
                </View>
              </View>
              <View style={styles.stC}>
                <PfIcon.cup />
                <View>
                  <PText style={styles.stB}>주간 {2 + (h % 9)}위</PText>
                  <PText style={styles.stS}>{String(br).split(' · ')[0]} 랭킹</PText>
                </View>
              </View>
              <View style={styles.stC}>
                <PfIcon.star />
                <View>
                  <PText style={styles.stB}>{(1200 + ((h * 37) % 3000)).toLocaleString()}P</PText>
                  <PText style={styles.stS}>누적 포인트</PText>
                </View>
              </View>
            </View>
          </>
        )}

        {badges.length > 0 && (
          <>
            <H2 title="배지" />
            <BadgeGrid list={badges} iconSize={20} />
          </>
        )}
        <View style={styles.bad}>
          <Pressable onPress={() => setReport('report')} accessibilityRole="button" style={styles.badBtn}>
            <PfIcon.flag color="#9A93A6" />
            <PText style={styles.badT}>신고하기</PText>
          </Pressable>
          <Pressable onPress={() => setReport('block')} accessibilityRole="button" style={styles.badBtn}>
            <PfIcon.ban color="#9A93A6" />
            <PText style={styles.badT}>차단하기</PText>
          </Pressable>
        </View>
      </Sheet>

      <FollowSheet name={list ? name : null} tab={list ?? 'fer'} onTab={setList} onClose={() => setList(null)} onOpen={openOther} />
      <Sheet open={recAll} onClose={() => setRecAll(false)} title={`추천 멤버 ${recs.length}명`} label="추천 멤버">
        <PText style={styles.ds}>함께 아는 멤버 · 같은 세션 · 같은 동아리</PText>
        {recs.length ? (
          recs.map((r, i) => (
            <View key={r.name} style={i > 0 && styles.line}>
              <MemberRow m={{ ...r, branch: r.why.replace('\n', ' ') }} onOpen={openOther} />
            </View>
          ))
        ) : (
          <PText style={styles.empty}>추천할 멤버가 없어요.</PText>
        )}
      </Sheet>
      {report && (
        <ReportSheet
          open
          start={report}
          onClose={() => setReport(null)}
          target={{ kind: 'member', name }}
          onBlocked={() => {
            setReport(null);
            onClose();
          }}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  id: { gap: 8, marginTop: 6, marginBottom: 8 },
  name: { fontFamily: Font.display, fontSize: 22, lineHeight: 26 },
  idS: { fontFamily: Font.body800, fontSize: 13, lineHeight: 19, color: Colors.inkSub },
  cnt: { flexDirection: 'row', paddingVertical: 6 },
  cntC: { flex: 1, alignItems: 'center' },
  cntLang: { fontFamily: Font.body900, fontSize: 17, lineHeight: 23 },
  cntLang2: { fontSize: 15, lineHeight: 23 },
  cntN: { fontFamily: Font.display, fontSize: 19, lineHeight: 23 },
  cntS: { marginTop: 3, fontFamily: Font.body800, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  mut: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avs: { flexDirection: 'row' },
  avOver: { marginLeft: -8 },
  mutT: { flex: 1, fontFamily: Font.body800, fontSize: 12.5, lineHeight: 18, color: Colors.inkSub },
  fbtn: { height: 50, borderRadius: 25, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.yellow, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  fbtnOn: { backgroundColor: Colors.white },
  fbtnT: { fontFamily: Font.body900, fontSize: 13, lineHeight: 18 },
  fbtnTOn: { color: Colors.purple },
  h2: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  h2T: { fontFamily: Font.body900, fontSize: 13.5, lineHeight: 19, color: Colors.inkSub },
  h2Big: { color: Colors.ink, fontSize: 15.5, lineHeight: 21 },
  h2B: { fontFamily: Font.body900, fontSize: 13, lineHeight: 18 },
  link: { fontFamily: Font.body900, fontSize: 13, lineHeight: 18, color: Colors.purple, paddingVertical: 6 },
  recWrap: { marginHorizontal: -18 },
  rec: { gap: 10, paddingHorizontal: 18, paddingTop: 2, paddingBottom: 8 },
  rc: { width: 146, paddingTop: 16, paddingHorizontal: 10, paddingBottom: 12, borderWidth: 2, borderColor: Colors.ink, borderRadius: 20, backgroundColor: Colors.white, alignItems: 'center' },
  rcX: { position: 'absolute', right: 8, top: 4, zIndex: 2 },
  rcXT: { fontFamily: Font.body900, fontSize: 18, lineHeight: 24, color: '#9A93A6' },
  rcAv: { alignSelf: 'center' },
  rcB: { marginTop: 8, fontFamily: Font.body900, fontSize: 15.5, lineHeight: 21 },
  rcS: { minHeight: 32, marginTop: 2, fontFamily: Font.body700, fontSize: 11.5, lineHeight: 15.5, color: Colors.inkSub, textAlign: 'center' },
  rcFb: { width: 122, height: 38, marginTop: 8, borderRadius: 19, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.yellow, alignItems: 'center', justifyContent: 'center' },
  rcFbT: { fontFamily: Font.body900, fontSize: 13.5, lineHeight: 18 },
  race: { height: 162, borderWidth: 2, borderColor: Colors.ink, borderRadius: 18, backgroundColor: '#D9614C', overflow: 'hidden' },
  lane: { position: 'absolute', left: 0, right: 0, top: 79, height: 2, backgroundColor: 'rgba(255,255,255,0.85)' },
  laneNo: { position: 'absolute', left: 9, fontFamily: Font.display, fontSize: 13, lineHeight: 17, color: Colors.white },
  start: { position: 'absolute', left: 28, top: 0, bottom: 0, width: 3, backgroundColor: Colors.white },
  fin: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 20, borderLeftWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, overflow: 'hidden' },
  rn: { position: 'absolute', width: 64, height: 46 },
  rnChar: { position: 'absolute', left: 0, bottom: 0 },
  rTag: { position: 'absolute', backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.ink, borderRadius: 9, paddingVertical: 2, paddingHorizontal: 7 },
  rTagT: { fontFamily: Font.body900, fontSize: 11.5, lineHeight: 15 },
  tip: { marginTop: -4, fontFamily: Font.body800, fontSize: 12.5, lineHeight: 18, color: Colors.inkSub },
  tipB: { fontFamily: Font.body800, fontSize: 12.5, color: Colors.purple },
  st: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stC: { width: '48%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderWidth: 2, borderColor: Colors.ink, borderRadius: 16, backgroundColor: Colors.white },
  stTx: { flex: 1 },
  stB: { fontFamily: Font.display, fontSize: 16, lineHeight: 18 },
  stS: { marginTop: 3, fontFamily: Font.body800, fontSize: 11, lineHeight: 15, color: Colors.inkSub },
  bad: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginTop: 10 },
  badBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
  badT: { fontFamily: Font.body800, fontSize: 13.5, lineHeight: 19, color: '#9A93A6' },
  ds: { fontFamily: Font.body700, fontSize: 14, lineHeight: 21, color: Colors.inkSub },
  empty: { textAlign: 'center', paddingVertical: 30, fontFamily: Font.body700, fontSize: 14, color: Colors.inkSub },
  line: { borderTopWidth: 1.5, borderColor: Colors.line },
});
