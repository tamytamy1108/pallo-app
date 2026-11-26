import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Pressable } from '@/components/ui/pressable';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { DIARY_EXAMPLES, DIARY_STICKERS, PRO_NOTES, teamNameByNo } from '@/data/account';
import { sfx } from '@/lib/feedback';

import { AccountPage, Box, Lift } from './parts';
import { useNoteState } from './store';

const Y = 2026;
const M = 11;
const stName = (k: string) => (DIARY_STICKERS.find((x) => x[0] === k) ?? [k, k])[1];

/**
 * 나의 스터디 일기 모아 보기 (프로토타입 내 활동 › 일기 diaryHTML): 이달 요약 · 작은 달력(쓴 날 노랑) · 날짜별 카드 → 그날 노트.
 * 프로토타입은 '내 활동' 탭 안에 있어요 — 앱은 PRO'S NOTE 의 '나의 스터디 일기' 칸에서 바로 열어요.
 */
export function DiaryList() {
  const { diary } = useNoteState();
  const of = (id: string) => diary[id] ?? DIARY_EXAMPLES[id] ?? null;
  const DY = PRO_NOTES.filter((n) => of(n.id)?.at);
  const byDay: Record<number, string> = {};
  DY.forEach((n) => {
    if (n.m === M) byDay[n.d] = n.id;
  });
  const cnt: Record<string, number> = {};
  DY.forEach((n) => (of(n.id)?.st ?? []).forEach((k) => (cnt[k] = (cnt[k] ?? 0) + 1)));
  const top = Object.entries(cnt)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k, v]) => `${stName(k)} ${v}`)
    .join(' · ');
  const firstDow = new Date(Y, M - 1, 1).getDay();
  const last = new Date(Y, M, 0).getDate();
  const now = new Date();
  const today = now.getFullYear() === Y && now.getMonth() + 1 === M ? now.getDate() : 0;
  const open = (id: string) => {
    sfx('tap');
    router.push({ pathname: '/me/notes/[id]', params: { id, from: 'diary' } });
  };

  return (
    <AccountPage title="나의 스터디 일기" bodyStyle={styles.body}>
      <Lift radius={20}>
        <View style={styles.hero}>
          <View style={styles.heroTx}>
            <PText style={styles.heroS}>{`${Y}년 ${M}월 스터디 일기`}</PText>
            <PText style={styles.heroB}>{`${DY.length}편`}</PText>
            {top ? <PText style={styles.heroTop}>{top}</PText> : null}
          </View>
          <Image source={require('@/assets/characters/c-upright-yellow.png')} style={styles.heroImg} contentFit="contain" />
        </View>
      </Lift>
      <View style={styles.cal} accessibilityLabel={`${M}월 일기 달력`}>
        <View style={styles.grid}>
          {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
            <View key={d} style={styles.cell}>
              <PText style={styles.wk}>{d}</PText>
            </View>
          ))}
          {Array.from({ length: firstDow }, (_, i) => (
            <View key={`e${i}`} style={styles.cell} />
          ))}
          {Array.from({ length: last }, (_, i) => {
            const d = i + 1;
            const id = byDay[d];
            return (
              <View key={d} style={styles.cell}>
                {id ? (
                  <Pressable onPress={() => open(id)} accessibilityRole="button" accessibilityLabel={`${M}월 ${d}일 일기`} style={styles.dayOn}>
                    <PText style={styles.dayOnText}>{d}</PText>
                  </Pressable>
                ) : (
                  <PText style={[styles.day, d === today && styles.today]}>{d}</PText>
                )}
              </View>
            );
          })}
        </View>
      </View>
      {DY.length ? (
        <>
          <PText style={styles.ym}>{`${Y}년 ${M}월`}</PText>
          {DY.map((n) => {
            const d = of(n.id);
            return (
              <Box key={n.id} onPress={() => open(n.id)} label={`${n.m}월 ${n.d}일 일기`} style={styles.en}>
                <View style={styles.enD}>
                  <PText style={styles.enDs}>{`${n.m}월`}</PText>
                  <PText style={styles.enDb}>{n.d}</PText>
                  <PText style={styles.enDs}>{n.wd}</PText>
                </View>
                <View style={styles.enTx}>
                  <PText style={styles.enK}>{`${teamNameByNo(n.team)} · ${n.pro} 프로`}</PText>
                  <PText style={styles.enP}>{d?.t ?? ''}</PText>
                  {d?.st.length ? <PText style={styles.enTg}>{d.st.map(stName).join(' · ')}</PText> : null}
                </View>
              </Box>
            );
          })}
        </>
      ) : (
        <PText style={styles.empty}>PRO&apos;S NOTE 맨 아래에서 오늘의 스터디 일기를 써 봐요.</PText>
      )}
    </AccountPage>
  );
}

const styles = StyleSheet.create({
  body: { paddingTop: 12, paddingBottom: 40, gap: 10 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 20, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.purple },
  heroTx: { flex: 1, minWidth: 0 },
  heroS: { fontFamily: Font.body800, fontSize: 12, lineHeight: 17, color: '#E3DBF7' },
  // '3편' 이 위 날짜 줄에 붙어 보여서 띄워요 (2026-11-26)
  heroB: { marginTop: 8, fontFamily: Font.display, fontSize: 26, lineHeight: 30, color: Colors.white },
  heroTop: { marginTop: 8, fontFamily: Font.body900, fontSize: 11.5, lineHeight: 16, color: Colors.yellow },
  heroImg: { width: 62, height: 40, marginTop: -10, marginBottom: -14 },
  cal: { paddingTop: 10, paddingHorizontal: 12, paddingBottom: 12, borderRadius: 18, borderWidth: 2, borderColor: Colors.line, backgroundColor: Colors.white },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, height: 31, alignItems: 'center', justifyContent: 'center' },
  wk: { fontFamily: Font.body900, fontSize: 10.5, lineHeight: 15, color: Colors.inkSub },
  day: { fontFamily: Font.body800, fontSize: 11.5, lineHeight: 16, color: '#A39C8E' },
  today: { color: Colors.ink, textDecorationLine: 'underline' },
  dayOn: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: Colors.ink, backgroundColor: Colors.yellow, alignItems: 'center', justifyContent: 'center' },
  dayOnText: { fontFamily: Font.body900, fontSize: 11.5, lineHeight: 16 },
  ym: { marginTop: 4, marginHorizontal: 2, marginBottom: -2, fontFamily: Font.body900, fontSize: 12.5, lineHeight: 18, color: Colors.inkSub },
  en: { flexDirection: 'row', gap: 12, paddingVertical: 12, paddingHorizontal: 14 },
  enD: { width: 36, alignItems: 'center' },
  enDs: { marginTop: 3, fontFamily: Font.body800, fontSize: 11, lineHeight: 14, color: Colors.inkSub },
  enDb: { fontFamily: Font.display, fontSize: 18, lineHeight: 20 },
  enTx: { flex: 1, minWidth: 0, gap: 3 },
  enK: { fontFamily: Font.body900, fontSize: 11, lineHeight: 15, color: Colors.purple },
  enP: { fontFamily: Font.body700, fontSize: 13.5, lineHeight: 20 },
  enTg: { fontFamily: Font.body900, fontSize: 11, lineHeight: 15, color: Colors.inkSub },
  empty: { paddingVertical: 30, textAlign: 'center', fontFamily: Font.body700, fontSize: 14, lineHeight: 21, color: Colors.inkSub },
});
