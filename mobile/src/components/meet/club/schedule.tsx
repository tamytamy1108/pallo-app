import { Pressable, StyleSheet, View } from 'react-native';

import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';
import { C, type Club, type ClubContent } from '@/data/meet';

import { AlbumThumb } from '../album-art';
import { Icon } from '../icons';
import type { Session } from '../model';

const LANG_TAG: Record<string, string> = { 영어: '영어', 일본어: '일본어', 중국어: '중국어', 스페인어: '스페인어' };

/** 정기 모임 일정 한 줄 (프로토타입 lgSchRow): 날짜 블록 · [언어] 주제 · 시간 · 인원 · 상태 글씨 · 왕관 N회차 · 썸네일 */
export function SessionRow({ c, q, i, album, mine, onPress }: { c: Club; q: Session; i: number; album: ClubContent['album']; mine: number; onPress: () => void }) {
  const full = q.cur >= q.cap;
  const art = (album[i % 6] || ['cafe'])[0];
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${q.label} ${q.th} 자세히 보기`} style={({ pressed }) => [styles.row, pressed && { opacity: 0.75 }]}>
      <View style={styles.dt}>
        <PText style={styles.dtS}>{q.mon}월</PText>
        <PText style={styles.dtB}>{q.day}</PText>
        <View style={styles.dtI} />
        <PText style={styles.dtS}>{q.k ? q.wd : '오늘'}</PText>
      </View>
      <View style={styles.tx}>
        <PText numberOfLines={1} style={styles.t}>
          [{LANG_TAG[c.lang] || c.lang}] {q.th}
        </PText>
        <View style={styles.m}>
          <Icon name="clock" size={15} color={Colors.inkSub} />
          <PText style={styles.mT}>{q.tm}</PText>
          <View style={{ width: 8 }} />
          <Icon name="users" size={15} color={Colors.inkSub} />
          <PText style={styles.mT}>
            {q.cur}/{q.cap}명
          </PText>
        </View>
        <View style={styles.st}>
          <PText style={[styles.em, q.me ? { color: C.pu } : full ? { color: '#A39C8E' } : null]}>{q.me ? '참석 완료' : full ? '마감' : '모집 중'}</PText>
          <View style={styles.no}>
            <Icon name="crown" size={13} color={Colors.inkSub} />
            <PText style={styles.noT}>{q.no}회차</PText>
          </View>
          {mine ? (
            <View style={styles.no}>
              <Icon name="pin" size={13} color={Colors.inkSub} />
              <PText style={styles.noT}>내 지점 {mine}명</PText>
            </View>
          ) : null}
        </View>
      </View>
      <AlbumThumb k={art} size={72} style={styles.th} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dt: { width: 52, paddingVertical: 6, borderWidth: 1, borderColor: Colors.line, borderRadius: 14, backgroundColor: Colors.white, alignItems: 'center', gap: 1 },
  dtS: { fontFamily: Font.body700, fontSize: 11, lineHeight: 16, color: Colors.inkSub },
  dtB: { fontFamily: Font.display, fontSize: 20, lineHeight: 22 },
  dtI: { width: 30, height: 1.5, marginTop: 3, marginBottom: 2, backgroundColor: Colors.line },
  tx: { flex: 1, minWidth: 0, gap: 4 },
  t: { fontFamily: Font.body900, fontSize: 15, lineHeight: 21 },
  m: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  mT: { fontFamily: Font.body700, fontSize: 13, lineHeight: 19, color: Colors.inkSub },
  st: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  em: { fontFamily: Font.body900, fontSize: 12, lineHeight: 17, color: C.pk },
  no: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  noT: { fontFamily: Font.body800, fontSize: 12, lineHeight: 17, color: Colors.inkSub },
  th: { borderWidth: 1, borderColor: Colors.ink, borderRadius: 14 },
});
