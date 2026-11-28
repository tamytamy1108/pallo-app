import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import type { ChallengeSummary, ChallengeVerifyCycle } from '@/api/challenges';
import { apiErrorMessage } from '@/api/errors';
import { useJoinChallenge, useSetChallengeSaved } from '@/api/use-challenge-lounge';
import { guardMember } from '@/components/common/trial-guide';
import { HeartPop } from '@/components/ui/heart-pop';
import { Pressable } from '@/components/ui/pressable';
import { PText } from '@/components/ui/text';
import { showToast } from '@/components/ui/toast';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { sfx } from '@/lib/feedback';
import { seeAt, SEE } from '@/lib/see';

import { ChIcon } from './icons';
import { CapBar, IconLine, LgBtn, SUB } from './parts';

/*
 * 라운지 챌린지 탭 — 서버 카드 (api/challenges ChallengeSummary). 모양은 목업 카드(cards.tsx DailyCard · HotBox)와 같고,
 * 숫자 · 상태(D-day · 오늘 인증 수 · 참여 여부 · 오늘 인증했는지)는 서버 값을 그대로 그려요.
 * 참여하기 · 도전 신청 · 찜(하트)은 서버로 보내요 (api/use-challenge-lounge). 인증 · 자세히 보기 · 신청 취소는 아직 v2 화면이 없어서
 * 눌러도 '준비 중' 알림만 띄워요.
 */

const notYet = () => {
  sfx('tap');
  showToast('챌린지 인증 · 자세히 보기는 곧 열려요');
};

/** 찜 하트 — 누르자마자 바뀌고 서버로 보내요. 비회원은 체험 안내로 */
function ServerSaveHeart({ c }: { c: ChallengeSummary }) {
  const save = useSetChallengeSaved();
  const onPress = () =>
    guardMember(() => {
      const on = !c.saved;
      sfx('tap');
      save.mutate(
        { id: c.id, on },
        {
          onSuccess: () => (on ? showToast('찜했어요 · 마이 › 찜한 챌린지', seeAt(SEE.savedChallenges)) : showToast('찜을 취소했어요')),
          onError: (e) => showToast(apiErrorMessage(e)),
        },
      );
    }, '챌린지를 찜하려면');
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={c.saved ? '찜 취소' : '찜하기'}
      accessibilityState={{ selected: c.saved }}
      hitSlop={6}
      style={({ pressed }) => [styles.heart, pressed && styles.heartOn]}>
      <HeartPop on={c.saved}>
        <ChIcon name="heart" size={15} fill={c.saved ? Colors.rosePink : 'none'} />
      </HeartPop>
    </Pressable>
  );
}

const CYCLE: Record<ChallengeVerifyCycle, string> = { DAILY: '매일', THREE_PER_WEEK: '주 3회', WEEKLY: '주 1회' };
/** '2026-12-01' → '12.1' */
const md = (ymd: string) => ymd.slice(5).split('-').map(Number).join('.');

export const isJoinedRole = (c: ChallengeSummary) => c.viewerRole === 'HOST' || c.viewerRole === 'MEMBER';

/** 카드 맨 위 상태 줄: '12.1 시작 · D-3' · '5일 남음' */
const statusText = (c: ChallengeSummary) =>
  c.progress === 'UPCOMING' ? `${md(c.startDate)} 시작 · D-${c.dDay ?? 0}` : c.dDay ? `${c.dDay}일 남음` : '오늘 마감';

/** 카드 · 순위 줄 왼쪽 칸: 대표 그림, 없으면 분류 이름 */
function Thumb({ c, size, style }: { c: ChallengeSummary; size: number; style?: object }) {
  const src = c.thumbnailPath ?? c.imagePath;
  return (
    <View style={[styles.thumb, { width: size }, style]}>
      {src ? (
        <Image source={{ uri: src }} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel={`${c.title} 대표 사진`} />
      ) : (
        <PText numberOfLines={2} style={[styles.thumbT, size < 60 && styles.thumbTSm]}>
          {c.categoryLabel}
        </PText>
      )}
    </View>
  );
}

// ---- 챌린지 가로 카드 ----
export function LoungeChallengeCard({ c }: { c: ChallengeSummary }) {
  const joined = isJoinedRole(c);
  const pre = c.progress === 'UPCOMING';
  const join = useJoinChallenge();
  const onJoin = () =>
    guardMember(() => {
      sfx('tap');
      join.mutate(c.id, {
        onSuccess: (r) => showToast(r.viewerRole === 'PENDING' ? '참여를 신청했어요 · 호스트가 승인하면 알려 드려요' : `${c.title}에 참여했어요`),
        onError: (e) => showToast(apiErrorMessage(e)),
      });
    }, '챌린지에 참여하려면');

  // 버튼 하나: 참여하기 / 도전 신청 · 승인 대기 · 신청 완료 · 오늘 인증 / 인증 완료
  let btn: ReactNode;
  if (c.viewerRole === 'PENDING') btn = <LgBtn label="승인 대기" tone="done" onPress={notYet} />;
  else if (!joined) btn = <LgBtn label={pre ? '도전 신청' : '참여하기'} tone="purple" off={join.isPending} onPress={onJoin} />;
  else if (pre) btn = <LgBtn label="신청 완료" tone="done" onPress={notYet} />;
  else btn = <LgBtn label={c.verifiedToday ? '인증 완료' : '오늘 인증'} tone={c.verifiedToday ? 'done' : 'yellow'} onPress={notYet} />;

  return (
    <View>
      <View pointerEvents="none" style={[styles.shadow, { borderRadius: 18 }]} />
      <View style={[styles.shell, { borderRadius: 18 }]}>
        <View style={styles.row}>
          <Pressable onPress={notYet} accessibilityRole="button" accessibilityLabel={`${c.title} 자세히 보기`} style={styles.pst}>
            <Thumb c={c} size={96} style={StyleSheet.absoluteFill} />
          </Pressable>
          <View style={styles.pcb}>
            <View style={styles.dHeart}>
              <ServerSaveHeart c={c} />
            </View>
            <PText numberOfLines={1} style={styles.ck}>
              {joined && c.viewerRole !== 'HOST' ? <PText style={styles.ckOn}>참여 중 · </PText> : null}
              {c.tag ? <PText style={styles.ckOn}>{`${c.tag} · `}</PText> : null}
              {statusText(c)}
            </PText>
            <PText numberOfLines={1} style={[styles.t, styles.beside]}>
              {c.title}
            </PText>
            <View style={styles.m}>
              <IconLine icon="cal" text={CYCLE[c.verifyCycle]} />
              <IconLine icon="flag" text={c.categoryLabel} />
            </View>
            <View style={styles.foot}>
              <View style={styles.footL}>
                <PText numberOfLines={1} style={styles.n}>
                  {pre ? `${c.participantCount}명 신청` : `${c.participantCount}명 · 오늘 ${c.todayVerifiedCount}명 인증`}
                </PText>
                <CapBar cur={c.elapsedPercent} max={100} />
              </View>
              {btn}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

// ---- 지금 핫한 챌린지 TOP 3 (순서는 서버: 참여 → 오늘 인증 많은 순) ----
const NO_STYLE = [
  { color: Colors.rosePink, fontSize: 22 },
  { color: Colors.purple, fontSize: 18 },
  { color: SUB, fontSize: 18 },
];

export function LoungeHotBox({ list }: { list: ChallengeSummary[] }) {
  if (!list.length) return null;
  return (
    <View>
      <View pointerEvents="none" style={[styles.shadow, { borderRadius: 20 }]} />
      <View style={styles.hot}>
        <View style={styles.hh}>
          <ChIcon name="flame" size={17} fill={Colors.rosePink} width={1.8} />
          <PText style={styles.hhB}>지금 핫한 챌린지</PText>
          <PText style={styles.hhS}>참여 · 인증이 많은 순</PText>
        </View>
        {list.slice(0, 3).map((c, i) => (
          <Pressable
            key={c.id}
            onPress={notYet}
            accessibilityRole="button"
            accessibilityLabel={`${i + 1}위 ${c.title}`}
            style={({ pressed }) => [styles.hr, i > 0 && styles.hrLine, pressed && styles.pressed]}>
            <PText style={[styles.no, NO_STYLE[i], { lineHeight: NO_STYLE[i].fontSize * 1.25 }]}>{i + 1}</PText>
            <Thumb c={c} size={42} style={styles.hic} />
            <View style={styles.htx}>
              <PText numberOfLines={1} style={styles.hb}>
                {c.title}
              </PText>
              <PText numberOfLines={1} style={styles.hs}>
                {`${c.participantCount}명 참여 · ${c.progress === 'UPCOMING' ? `${md(c.startDate)} 시작` : `오늘 ${c.todayVerifiedCount}명 인증`}`}
              </PText>
            </View>
            {isJoinedRole(c) ? <PText style={styles.hem}>참여 중</PText> : null}
            <PText style={styles.go}>›</PText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: { position: 'absolute', top: 4, left: 4, right: -4, bottom: -4, backgroundColor: Colors.ink },
  shell: { borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, overflow: 'hidden' },
  row: { flexDirection: 'row' },
  pst: { width: 96, minHeight: 112, borderRightWidth: 2, borderColor: Colors.ink },
  thumb: { overflow: 'hidden', backgroundColor: Colors.lavender, padding: 8 },
  thumbT: { fontFamily: Font.body900, fontSize: 13, lineHeight: 17, color: Colors.purple },
  thumbTSm: { fontSize: 9, lineHeight: 11 },
  pcb: { flex: 1, minWidth: 0, paddingTop: 11, paddingHorizontal: 12, paddingBottom: 12 },
  // 하트(오른쪽 위 30)와 겹치지 않게
  beside: { marginRight: 30 },
  dHeart: { position: 'absolute', top: 8, right: 8, zIndex: 1 },
  heart: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', boxShadow: [{ offsetX: 2, offsetY: 2, blurRadius: 0, color: Colors.ink }] },
  heartOn: { transform: [{ translateX: 2 }, { translateY: 2 }], boxShadow: [] },
  ck: { marginRight: 30, fontFamily: Font.body800, fontSize: 11.5, lineHeight: 16, color: SUB },
  ckOn: { fontFamily: Font.body900, fontSize: 11.5, color: Colors.purple },
  t: { marginTop: 2, fontFamily: Font.body900, fontSize: 15.5, lineHeight: 20.15 },
  m: { marginTop: 3, flexDirection: 'row', flexWrap: 'wrap', columnGap: 12, rowGap: 3 },
  foot: { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 10 },
  footL: { flex: 1, minWidth: 0 },
  n: { fontFamily: Font.body900, fontSize: 11.5, lineHeight: 18 },
  hot: { borderWidth: 2, borderColor: Colors.ink, borderRadius: 20, backgroundColor: Colors.white, paddingTop: 12, paddingHorizontal: 14, paddingBottom: 6 },
  hh: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  hhB: { fontFamily: Font.body900, fontSize: 15, lineHeight: 21 },
  hhS: { marginLeft: 'auto', fontFamily: Font.body700, fontSize: 11.5, lineHeight: 16, color: SUB },
  hr: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  hrLine: { borderTopWidth: 1.5, borderColor: Colors.line },
  pressed: { opacity: 0.7 },
  no: { width: 20, textAlign: 'center', fontFamily: Font.display },
  hic: { height: 42, borderRadius: 12, borderWidth: 2, borderColor: Colors.ink, padding: 4, alignItems: 'center', justifyContent: 'center' },
  htx: { flex: 1, minWidth: 0, gap: 2 },
  hb: { fontFamily: Font.body900, fontSize: 14, lineHeight: 20 },
  hs: { fontFamily: Font.body700, fontSize: 11.5, lineHeight: 16, color: SUB },
  hem: { fontFamily: Font.body900, fontSize: 11, lineHeight: 16, color: Colors.purple },
  go: { fontFamily: Font.body500, fontSize: 18, lineHeight: 26, color: SUB },
});
