import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { MemberFace } from '@/components/common/member-face';
import { Pressable } from '@/components/ui/pressable';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { changesLeftText, getMembership, LANG_COLOR, MY_TEAMS, teamLabel, type Team } from '@/data/account';
import { sfx } from '@/lib/feedback';
import { useMe } from '@/state/me';

import { Box, Lift } from './parts';
import { cancelChangeRequest, useChangeRequest } from './store';

const WD = '월화수목금토일';

/** 팀 목록 = 시간 순 타임라인: 월요일부터 가는 순서 (프로토타입 myStudyHTML 의 first()) */
const firstDay = (t: Team) => Math.min(...[...t.when.split(' ')[0]].map((d) => WD.indexOf(d)).filter((i) => i >= 0));

/**
 * 마이 화면의 '내 스터디' 카드 (내 프로필 · 이용권 · 팀 시간표 · [연기 · 팀 · 지점 변경]) — 남은 횟수 고리 · 무료 줄은 뺐어요 (D안) — 마이 화면이 그대로 넣어요.
 * 프로토타입 myStudyHTML (.my-study.ms-a). 신청 중이면 '○○ 신청 · 운영진 확인 중' + [신청 취소].
 * 담당: 마이 B. props 는 바꾸지 않아요(늘리기만). title={false} 면 위 '내 스터디' 제목 없이.
 */
export function MyStudyCard({ title = true }: { title?: boolean }) {
  const ms = getMembership();
  const me = useMe();
  const req = useChangeRequest();
  const [askCancel, setAskCancel] = useState(false);
  const teams = MY_TEAMS.slice().sort((p, q) => firstDay(p) - firstDay(q));
  const end = String(ms.period).split('~').pop()?.trim();

  return (
    <View style={styles.wrap}>
      {title ? (
        <PText style={styles.secTitle} accessibilityRole="header">
          내 스터디
        </PText>
      ) : null}
      <Box style={styles.card}>
        <View style={styles.top}>
          {/* 왼쪽: 내 프로필 (D안, 2026-11-25) — 남은 횟수 고리 대신 내 캐릭터 · 이름 */}
          <View style={styles.prof}>
            <MemberFace name={me.name} me size={96} />
            <PText style={styles.profName} numberOfLines={1}>
              {me.name}
            </PText>
          </View>
          <View style={styles.info}>
            <View style={styles.pl}>
              <PText style={styles.plan}>{ms.name}</PText>
              <PText style={styles.period} accessibilityLabel={`기간 ${ms.period}, ${end}까지`}>
                {ms.period}
              </PText>
            </View>
            <KV k="연기 · 변경" v={changesLeftText(ms.pp)} />
            <KV k="팀" v={`${MY_TEAMS.length}팀 · 주 ${ms.wk}회`} />
          </View>
        </View>

        <View style={styles.tl}>
          <View style={styles.tlLine} />
          {teams.map((t) => {
            const [ds, hm = ''] = t.when.split(' ');
            const [h, m] = hm.split(':').map(Number);
            const ap = h < 12 ? '오전' : h < 18 ? '오후' : '저녁';
            return (
              <View key={t.branch + t.no} style={styles.r}>
                <View style={[styles.dot, { backgroundColor: LANG_COLOR[t.lang] }]} />
                <View style={styles.tm}>
                  <PText style={styles.tmB}>{`${h % 12 || 12}:${String(m || 0).padStart(2, '0')}`}</PText>
                  <PText style={styles.tmS}>{`${[...ds].join(' · ')} ${ap}`}</PText>
                </View>
                <View style={styles.tx}>
                  <PText style={styles.txB}>{teamLabel(t)}</PText>
                  <PText style={styles.txS}>{t.branch}</PText>
                </View>
              </View>
            );
          })}
        </View>

        {req ? (
          <View style={styles.rq}>
            <PText style={styles.rqB}>{`${req.label} 신청 · 운영진 확인 중`}</PText>
            <PText style={styles.rqT}>{req.txt}</PText>
            <Pressable
              onPress={() => {
                sfx('tap');
                setAskCancel(true);
              }}
              accessibilityRole="button"
              hitSlop={10}
              style={styles.rqCancel}>
              <PText style={styles.rqCancelText}>신청 취소</PText>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={() => {
              sfx('tap');
              router.push('/me/change');
            }}
            accessibilityRole="button"
            accessibilityLabel="연기 · 팀 · 지점 변경"
            style={styles.goWrap}>
            {({ pressed }) => (
              <Lift radius={23} dx={3} dy={3} pressed={pressed}>
                <View style={styles.go}>
                  <PText style={styles.goText}>연기 · 팀 · 지점 변경</PText>
                </View>
              </Lift>
            )}
          </Pressable>
        )}
      </Box>

      {/* 신청 취소 확인 (프로토타입 lgSheet '신청을 취소할까요?') */}
      <Sheet
        open={askCancel}
        onClose={() => setAskCancel(false)}
        title="신청을 취소할까요?"
        footer={
          <View>
            <Button
              label="신청 취소"
              variant="secondary"
              wide
              onPress={() => {
                cancelChangeRequest();
                setAskCancel(false);
                showToast('신청을 취소했어요');
              }}
            />
          </View>
        }>
        <PText style={styles.ds}>{`${req?.label ?? ''} 신청을 취소해요. 지금 일정은 그대로예요.`}</PText>
      </Sheet>
    </View>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <View style={styles.kv}>
      <PText style={styles.kvK}>{k}</PText>
      <PText style={styles.kvV} numberOfLines={1}>
        {v}
      </PText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  flex: { flex: 1 },
  secTitle: { marginTop: 6, marginHorizontal: 2, fontFamily: Font.display, fontSize: 17, lineHeight: 24 },
  card: { padding: 18 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  prof: { width: 104, alignItems: 'center', gap: 8 },
  profName: { maxWidth: 104, fontFamily: Font.body900, fontSize: 14, lineHeight: 18 },
  info: { flex: 1, minWidth: 0 },
  pl: { gap: 2, marginBottom: 8 },
  plan: { fontFamily: Font.body900, fontSize: 18, lineHeight: 26 },
  period: { fontFamily: Font.body700, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  kv: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingVertical: 6, borderTopWidth: 1.5, borderColor: Colors.line },
  kvK: { fontFamily: Font.body800, fontSize: 12.5, lineHeight: 19, color: Colors.inkSub },
  kvV: { flexShrink: 1, fontFamily: Font.body900, fontSize: 14, lineHeight: 20 },
  tl: { marginTop: 16, paddingTop: 8, paddingBottom: 2, paddingLeft: 22, borderTopWidth: 1.5, borderColor: Colors.line },
  tlLine: { position: 'absolute', left: 6, top: 26, bottom: 26, width: 2, borderRadius: 1, backgroundColor: Colors.line },
  r: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 12 },
  dot: { position: 'absolute', left: -22, top: '50%', marginTop: -7, width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: Colors.ink },
  tm: { width: 66, gap: 2 },
  tmB: { fontFamily: Font.display, fontSize: 14, lineHeight: 16 },
  tmS: { fontFamily: Font.body700, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  tx: { flex: 1, minWidth: 0, gap: 2 },
  txB: { fontFamily: Font.body900, fontSize: 15, lineHeight: 21 },
  txS: { fontFamily: Font.body800, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  goWrap: { marginTop: 4 },
  go: { height: 46, borderRadius: 23, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.yellow, alignItems: 'center', justifyContent: 'center' },
  goText: { fontFamily: Font.body900, fontSize: 14, lineHeight: 20 },
  rq: { marginTop: 12, paddingTop: 10, gap: 2, borderTopWidth: 1.5, borderColor: Colors.line },
  rqB: { fontFamily: Font.body900, fontSize: 14, lineHeight: 20, color: Colors.purple },
  rqT: { fontFamily: Font.body700, fontSize: 13, lineHeight: 19.5 },
  rqCancel: { alignSelf: 'flex-start', marginTop: 4, minHeight: 24, justifyContent: 'center' },
  rqCancelText: { fontFamily: Font.body900, fontSize: 13, lineHeight: 19, color: Colors.inkSub },
  ds: { fontFamily: Font.body700, fontSize: 15, lineHeight: 23, color: Colors.inkSub },
});
