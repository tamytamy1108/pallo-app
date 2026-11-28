import { StyleSheet, View } from 'react-native';

import { langColor } from '@/api/my-page';
import { PText } from '@/components/ui/text';
import { Font } from '@/constants/fonts';
import { Colors } from '@/constants/theme';

/**
 * 연기 · 팀 · 지점 변경 신청 글을 읽기 쉽게 (내 스터디 카드 '운영진 확인 중' · 신청 화면 '신청했어요' 시트).
 * 신청 글 모양 (me/change 가 만들어요 · 운영진도 그대로 읽어요):
 *  - 팀 · 지점 변경: '지금 팀 · 지금 팀 → 뉴 팀\n12/13(일)까지 지금 팀 · 12/15(화)부터 뉴 팀'
 *    → '지금' · '바뀌면' 두 묶음 + 날짜는 한 줄에 하나씩
 *  - 연기: '쉬는 수업 · 쉬는 수업\n14일 연기 · 기간 · 복귀' → 수업 목록 + 첫 마디 굵게
 *  - 그 밖(예전 신청 · 팀 추가): 글 그대로
 */
export function RequestSummary({ txt }: { txt: string }) {
  const [head, tail] = txt.includes('\n') ? txt.split('\n') : [null, txt];
  const info = tail ?? '';
  if (head?.includes(' → ')) {
    const [from, to] = head.split(' → ').map((x) => x.split(' · '));
    return (
      <View style={styles.wrap}>
        <Group k="지금" teams={from ?? []} off />
        <Group k="바뀌면" teams={to ?? []} />
        <View style={styles.dates}>
          {info.split(' · ').map((p) => (
            <PText key={p} style={styles.date}>
              {p}
            </PText>
          ))}
        </View>
      </View>
    );
  }
  if (head) {
    const parts = info.split(' · ');
    return (
      <View style={styles.wrap}>
        <View style={styles.list}>
          {head.split(' · ').map((c) => (
            <Line key={c} c={c} />
          ))}
        </View>
        <PText style={styles.info}>
          <PText style={styles.infoB}>{parts[0]}</PText>
          {parts
            .slice(1)
            .map((p) => ` · ${p}`)
            .join('')}
        </PText>
      </View>
    );
  }
  return <PText style={styles.plain}>{info}</PText>;
}

/** 이름(지금 · 바뀌면) + 수업 줄 */
function Group({ k, teams, off }: { k: string; teams: string[]; off?: boolean }) {
  return (
    <View style={styles.group}>
      <PText style={[styles.k, !off && styles.kOn]}>{k}</PText>
      <View style={styles.list}>
        {teams.map((c) => (
          <Line key={c} c={c} off={off} />
        ))}
      </View>
    </View>
  );
}

/** 언어 색 점 + 수업 이름 (지금 수업은 회색 글씨 · 바뀌면 수업은 진하게) */
function Line({ c, off }: { c: string; off?: boolean }) {
  return (
    <View style={styles.line}>
      <View style={[styles.dot, { backgroundColor: langColor(c.split(' ')[0] ?? '') }]} />
      <PText style={[styles.lineT, off && styles.lineOff]} numberOfLines={1}>
        {c}
      </PText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  group: { flexDirection: 'row', gap: 10 },
  k: { width: 44, fontFamily: Font.body800, fontSize: 12, lineHeight: 19, color: Colors.inkSub },
  kOn: { fontFamily: Font.body900, color: Colors.purple },
  list: { flex: 1, minWidth: 0, gap: 4 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: Colors.ink },
  lineT: { flexShrink: 1, fontFamily: Font.body900, fontSize: 13.5, lineHeight: 19, color: Colors.ink },
  lineOff: { fontFamily: Font.body700, color: Colors.inkSub },
  dates: { gap: 1, paddingTop: 2 },
  date: { fontFamily: Font.body800, fontSize: 12.5, lineHeight: 18, color: Colors.ink },
  info: { fontFamily: Font.body700, fontSize: 12.5, lineHeight: 18, color: Colors.inkSub },
  infoB: { fontFamily: Font.body900, color: Colors.ink },
  plain: { fontFamily: Font.body700, fontSize: 13, lineHeight: 19.5 },
});
