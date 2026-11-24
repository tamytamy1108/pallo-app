import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Pressable } from '@/components/ui/pressable';
import { guardMember } from '@/components/common/trial-guide';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { C, isPast, REGIONS, type Meet, type Region } from '@/data/meet';

import { ClubList } from './club-list';
import { DateStrip } from './date-strip';
import { Bolt, Icon } from './icons';
import { KoreaMap } from './korea-map';
import { MeetCard } from './meet-card';
import { branchOk, isOpenMeet, meetN, regionCounts, useAllClubs, useAllMeets } from './model';
import { LgButton, LgLink, SecHead } from './parts';

type Mode = 'all' | 'meet' | 'club';

/**
 * 라운지 '번개 · 동아리' 탭 본문 (docs/pages/04-lounge.md '번개 · 동아리'). 라운지 화면이 이 컴포넌트를 그대로 넣어요.
 * - branch: 라운지 위에서 고른 지점 ('전체' 또는 지점 이름)
 * - header: 라운지의 지점 선택 버튼 — 서브 칩 줄(전체 n · 번개 n · 동아리 n) 맨 앞에 넣어요
 * - region: 추천 탭 작은 지도에서 지역을 눌러 들어왔을 때 (없으면 전체)
 * 좌우 여백(16)은 이 컴포넌트가 가져요 — 라운지는 여백 없이 넣어 주세요.
 * 담당: 번개 · 동아리 · 이벤트. props 는 바꾸지 않아요(늘리기만).
 * 프로토타입 lgBody case 'meet' · renderLounge 의 #lgSub 를 옮겼어요.
 */
export function MeetTab({ branch, header, region }: { branch: string; header?: ReactNode; region?: string }) {
  const [mode, setMode] = useState<Mode>('all');
  const [reg, setReg] = useState<Region | null>(toRegion(region));
  const [day, setDay] = useState<number | null>(null);
  const [showPast, setShowPast] = useState(false);
  const [w, setW] = useState(0);
  // 라운지 추천 탭 작은 지도에서 지역을 바꿔 들어오면 따라가요
  const [lastRegion, setLastRegion] = useState(region);
  if (region !== lastRegion) {
    setLastRegion(region);
    setReg(toRegion(region));
  }

  const meets = useAllMeets().filter((m) => branchOk(m.br, branch));
  const clubs = useAllClubs().filter((c) => branchOk(c.br, branch));
  const nMeet = meets.filter(isOpenMeet).length;
  const nClub = clubs.filter((c) => !c.wait).length;

  const inReg = (x: { reg: Region }) => !reg || x.reg === reg;
  const allM = mode === 'club' ? [] : meets.filter(inReg);
  const ms = allM.filter((m) => !isPast(m)).sort((a, b) => Number(!!a.closed) - Number(!!b.closed) || meetN(a) - meetN(b));
  const past = allM.filter(isPast).sort((a, b) => meetN(b) - meetN(a));
  const cs = mode === 'meet' ? [] : clubs.filter(inReg);
  const msD = day == null ? ms : ms.filter((m) => meetN(m) === day);
  const openN = ms.filter((m) => !m.closed).length;
  const pre = reg ? reg + ' ' : '';
  const cardW = Math.max(0, (w - 32) * 0.8);

  const mkMeet = () => guardMember(() => router.push('/meet/new'), '번개를 만들려면');
  const mkClub = () => guardMember(() => router.push('/club/new'), '동아리를 만들려면');

  const chips: [Mode, string, number][] = [
    ['all', '전체', nMeet + nClub],
    ['meet', '번개', nMeet],
    ['club', '동아리', nClub],
  ];

  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subs} contentContainerStyle={styles.subsIn} accessibilityLabel="세부 카테고리">
        {header}
        {header ? <View style={styles.sep} /> : null}
        {chips.map(([k, l, n]) => {
          const on = mode === k;
          return (
            <Pressable
              key={k}
              onPress={() => {
                setMode(k);
                setDay(null);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              style={[styles.chip, on && styles.chipOn]}>
              {k === 'meet' ? <Bolt /> : null}
              <PText style={[styles.chipT, on && { color: C.pu }]}>{l}</PText>
              <PText style={[styles.chipN, on && { color: C.pu }]}>{n}</PText>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.feed}>
        <KoreaMap counts={regionCounts(meets, clubs, '전체')} mode={mode} region={reg} onRegion={setReg} />

        {mode === 'club' ? null : (
          <View>
            <SecHead
              style={styles.sec}
              title={
                <>
                  <Bolt />
                  <PText style={styles.secT}>{pre}번개</PText>
                </>
              }
              sub={`${openN}개${ms.length > 1 ? ' · 옆으로 넘겨 보세요' : ''}`}
              right={<LgButton label="번개 열기" icon={<Icon name="plus" size={15} strokeWidth={2.8} />} height={34} fontSize={12.5} paddingH={12} shadow={2} onPress={mkMeet} />}
            />
            {ms.length ? <DateStrip meets={ms} day={day} onDay={setDay} region={reg} /> : <View style={{ height: 4 }} />}
            {msD.length ? (
              <CardRow meets={msD} width={cardW} end={past.length && !showPast ? <PastMore n={past.length} onPress={() => setShowPast(true)} /> : null} />
            ) : ms.length ? (
              <View style={styles.empty}>
                <PText style={styles.emptyT}>이날은 번개가 없어요.</PText>
                <LgLink label="이날 번개 열기 ›" onPress={mkMeet} />
              </View>
            ) : (
              <View style={styles.empty}>
                <PText style={styles.emptyT}>{`${pre}다가오는 번개가 없어요.\n첫 번개를 열어 보세요!`}</PText>
                {past.length && !showPast ? <LgLink label={`지난 번개 ${past.length}개 보기 ›`} onPress={() => setShowPast(true)} /> : null}
              </View>
            )}
            {past.length && showPast ? (
              <>
                <SecHead
                  style={[styles.sec, { marginTop: 22 }]}
                  title={
                    <>
                      <Icon name="clock" size={16} />
                      <PText style={styles.secT}>지난 번개</PText>
                    </>
                  }
                  sub={`${past.length}개`}
                  right={<LgLink label="접기" onPress={() => setShowPast(false)} />}
                />
                <CardRow meets={past} width={cardW} dim />
              </>
            ) : null}
          </View>
        )}

        {mode === 'meet' ? null : (
          <View style={styles.clubs}>
            <SecHead
              style={[styles.sec, { marginBottom: -8 }]}
              title={
                <>
                  <Icon name="flag" size={17} color={C.pu} strokeWidth={2.6} />
                  <PText style={styles.secT}>{pre}동아리</PText>
                </>
              }
              sub={`${cs.length}개`}
              right={<LgButton label="동아리 만들기" variant={mode === 'club' ? 'y' : 'wh'} icon={<Icon name="plus" size={15} strokeWidth={2.8} />} height={34} fontSize={12.5} paddingH={12} shadow={2} onPress={mkClub} />}
            />
            {cs.length ? <ClubList clubs={cs} /> : <PText style={[styles.emptyT, styles.empty]}>{`${pre}동아리가 아직 없어요.\n첫 동아리를 만들어 보세요!`}</PText>}
          </View>
        )}
      </View>
    </View>
  );
}

const toRegion = (r?: string) => (REGIONS.some(([n]) => n === r) ? (r as Region) : null);

/** 옆으로 넘기는 카드 줄 (한 장씩 딱딱 멈춤) */
function CardRow({ meets, width, end, dim }: { meets: Meet[]; width: number; end?: ReactNode; dim?: boolean }) {
  if (!width) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={width + 12} snapToAlignment="start" decelerationRate="fast" style={styles.hs} contentContainerStyle={styles.hsIn} accessibilityRole="list">
      {meets.map((m) => (
        <View key={m.id} style={dim ? styles.dim : undefined} accessibilityRole="none">
          <MeetCard m={m} width={width} />
        </View>
      ))}
      {end}
    </ScrollView>
  );
}

/** 카드 줄 맨 끝 점선 카드 → 지난 번개 */
function PastMore({ n, onPress }: { n: number; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ expanded: false }} style={({ pressed }) => [styles.more, pressed && { transform: [{ scale: 0.97 }] }]}>
      <Icon name="clock" size={22} />
      <PText style={styles.moreB}>지난 번개</PText>
      <PText style={styles.moreS}>{n}개 보기 ›</PText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  subs: { flexGrow: 0 },
  subsIn: { gap: 6, paddingTop: 12, paddingBottom: 4, paddingHorizontal: 16, alignItems: 'center' },
  sep: { width: 1.5, height: 22, marginVertical: 4, marginHorizontal: 2, backgroundColor: '#DCD4C4' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 30, borderRadius: 15, borderWidth: 1.5, borderColor: '#CFC6B4', paddingHorizontal: 12 },
  chipOn: { backgroundColor: Colors.lavender, borderColor: C.pu },
  chipT: { fontFamily: Font.body800, fontSize: 12.5, lineHeight: 17, color: Colors.inkSub },
  chipN: { fontFamily: Font.display, fontSize: 11, lineHeight: 14, color: Colors.inkSub },
  feed: { paddingTop: 12, paddingHorizontal: 16, gap: 22 },
  sec: { marginTop: 4 },
  secT: { fontFamily: Font.body900, fontSize: 16, lineHeight: 22 },
  clubs: { gap: 22 },
  hs: { marginHorizontal: -16, marginTop: 8, flexGrow: 0 },
  hsIn: { gap: 12, paddingTop: 6, paddingBottom: 14, paddingHorizontal: 16 },
  dim: { opacity: 0.78, filter: 'grayscale(0.9)' },
  more: { width: 104, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.ink, borderRadius: 20, paddingHorizontal: 8 },
  moreB: { fontFamily: Font.body900, fontSize: 14, lineHeight: 20 },
  moreS: { fontFamily: Font.body800, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  empty: { alignItems: 'center', paddingVertical: 30, paddingHorizontal: 10, gap: 4 },
  emptyT: { textAlign: 'center', fontFamily: Font.body700, fontSize: 14, lineHeight: 22, color: Colors.inkSub },
});
